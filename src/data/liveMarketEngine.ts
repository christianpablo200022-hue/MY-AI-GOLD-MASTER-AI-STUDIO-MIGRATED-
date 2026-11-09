import type { Candle, Timeframe } from '../types/goldTrading';
import {
  validateCandleSeries,
  validateMarketQuote,
  type FeedHealthResult,
  type MarketQuote,
  type XauusdMarketDataAdapter,
} from './marketDataIntegrity';

export interface LiveMarketSnapshot {
  symbol: 'XAUUSD';
  provider: string;
  mode: 'LIVE' | 'UNAVAILABLE';
  health: 'READY' | 'WAIT';
  reason: string;
  checkedAt: number;
  quote: MarketQuote | null;
}

/** No provider is enabled by default. This prevents simulated values being mislabeled as live. */
export class UnconfiguredMarketDataAdapter implements XauusdMarketDataAdapter {
  readonly providerName = 'NOT_CONFIGURED';
  async connect(): Promise<void> { /* intentionally no-op */ }
  async disconnect(): Promise<void> { /* intentionally no-op */ }
  async getLatestQuote(): Promise<MarketQuote | null> { return null; }
  async getCandles(_timeframe: Timeframe, _limit: number): Promise<Candle[]> { return []; }
}

export class LiveMarketEngine {
  constructor(
    private readonly adapter: XauusdMarketDataAdapter = new UnconfiguredMarketDataAdapter(),
    private readonly maxQuoteAgeMs = 15_000,
    private readonly maxCandleAgeMs: Record<Timeframe, number> = {
      '15M': 20 * 60_000,
      '1H': 70 * 60_000,
    },
  ) {}

  async getStatus(nowMs = Date.now()): Promise<LiveMarketSnapshot> {
    try {
      const quote = await this.adapter.getLatestQuote();
      const validation: FeedHealthResult = validateMarketQuote(quote, nowMs, this.maxQuoteAgeMs);
      return {
        symbol: 'XAUUSD',
        provider: this.adapter.providerName,
        mode: quote?.mode === 'LIVE' ? 'LIVE' : 'UNAVAILABLE',
        health: validation.health,
        reason: validation.reason,
        checkedAt: nowMs,
        quote: validation.health === 'READY' ? quote : null,
      };
    } catch {
      return {
        symbol: 'XAUUSD', provider: this.adapter.providerName, mode: 'UNAVAILABLE',
        health: 'WAIT', reason: 'Market data provider request failed', checkedAt: nowMs, quote: null,
      };
    }
  }

  async getCandles(timeframe: Timeframe, limit = 200, nowMs = Date.now()): Promise<{ health: 'READY' | 'WAIT'; reason: string; candles: Candle[] }> {
    if (!Number.isInteger(limit) || limit < 2 || limit > 500) {
      return { health: 'WAIT', reason: 'Candle request limit must be between 2 and 500', candles: [] };
    }
    try {
      const candles = await this.adapter.getCandles(timeframe, limit);
      const validation = validateCandleSeries(candles, {
        timeframe, nowMs, maxAgeMs: this.maxCandleAgeMs[timeframe], requireClosedCandle: true,
      });
      return validation.health === 'READY'
        ? { health: 'READY', reason: validation.reason, candles }
        : { health: 'WAIT', reason: validation.reason, candles: [] };
    } catch {
      return { health: 'WAIT', reason: 'Market candle provider request failed', candles: [] };
    }
  }
}
