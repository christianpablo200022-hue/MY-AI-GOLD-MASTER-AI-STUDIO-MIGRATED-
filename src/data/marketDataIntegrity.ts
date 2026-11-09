import type { Candle, Timeframe } from '../types/goldTrading';

export type FeedMode = 'LIVE' | 'DEMO' | 'UNAVAILABLE';
export type FeedHealth = 'READY' | 'WAIT';

export interface MarketQuote {
  symbol: 'XAUUSD';
  bid: number;
  ask: number;
  timestampMs: number;
  source: string;
  mode: FeedMode;
}

export interface FeedHealthResult {
  health: FeedHealth;
  reason: string;
  spread: number | null;
}

export interface BrokerSpecification {
  broker: string;
  symbol: 'XAUUSD';
  contractSizeOz: number;
  tickSize: number;
  tickValuePerLot: number;
  minLot: number;
  lotStep: number;
  maxLot: number;
  commissionPerLotRoundTurn: number;
  verified: boolean;
  evidence?: string;
  checkedAt?: number;
}

export interface CandleValidationOptions {
  timeframe: Timeframe;
  nowMs: number;
  maxAgeMs: number;
  requireClosedCandle?: boolean;
}

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '15M': 15 * 60 * 1000,
  '1H': 60 * 60 * 1000,
};

/** Fail-closed validation. Candles use Unix seconds, matching the app's Candle type. */
export function validateCandleSeries(
  candles: Candle[],
  options: CandleValidationOptions,
): FeedHealthResult {
  const { timeframe, nowMs, maxAgeMs } = options;
  const intervalMs = TIMEFRAME_MS[timeframe];
  if (!Array.isArray(candles) || candles.length < 2) {
    return { health: 'WAIT', reason: 'Insufficient market candles', spread: null };
  }
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const values = [c.time, c.open, c.high, c.low, c.close, c.volume];
    if (!values.every(Number.isFinite) || c.time <= 0 || c.open <= 0 || c.close <= 0 || c.low <= 0 || c.volume < 0) {
      return { health: 'WAIT', reason: `Invalid candle values at index ${i}`, spread: null };
    }
    if (c.high < Math.max(c.open, c.close, c.low) || c.low > Math.min(c.open, c.close, c.high)) {
      return { health: 'WAIT', reason: `Invalid OHLC range at index ${i}`, spread: null };
    }
    if (i > 0) {
      const delta = (c.time - candles[i - 1].time) * 1000;
      if (delta !== intervalMs) {
        return { health: 'WAIT', reason: delta <= 0 ? 'Duplicate or out-of-order candles' : 'Missing candle interval or unexpected market gap', spread: null };
      }
    }
  }
  const latest = candles[candles.length - 1];
  const latestStartMs = latest.time * 1000;
  const ageMs = nowMs - latestStartMs;
  if (ageMs < 0 || ageMs > maxAgeMs) {
    return { health: 'WAIT', reason: 'Market candle is stale or timestamp is in the future', spread: null };
  }
  if (options.requireClosedCandle && nowMs < latestStartMs + intervalMs) {
    return { health: 'WAIT', reason: 'Latest candle has not closed yet', spread: null };
  }
  return { health: 'READY', reason: 'Candle sequence and freshness checks passed', spread: null };
}

/** Build larger UTC candles from smaller, contiguous candles. Partial buckets are omitted. */
export function buildTimeframeCandles(
  source: Candle[],
  sourceTimeframeMs: number,
  targetTimeframe: Timeframe,
): Candle[] {
  const targetMs = TIMEFRAME_MS[targetTimeframe];
  if (!Number.isFinite(sourceTimeframeMs) || sourceTimeframeMs <= 0 || sourceTimeframeMs >= targetMs || targetMs % sourceTimeframeMs !== 0) return [];
  const required = targetMs / sourceTimeframeMs;
  const sorted = [...source].sort((a, b) => a.time - b.time);
  const buckets = new Map<number, Candle[]>();
  for (const candle of sorted) {
    if (!Number.isFinite(candle.time)) continue;
    const startMs = Math.floor((candle.time * 1000) / targetMs) * targetMs;
    const bucket = buckets.get(startMs) ?? [];
    bucket.push(candle);
    buckets.set(startMs, bucket);
  }
  const output: Candle[] = [];
  for (const [startMs, bucket] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    if (bucket.length !== required) continue;
    let contiguous = true;
    for (let i = 1; i < bucket.length; i++) {
      if ((bucket[i].time - bucket[i - 1].time) * 1000 !== sourceTimeframeMs) contiguous = false;
    }
    if (!contiguous || bucket[0].time * 1000 !== startMs) continue;
    const last = bucket[bucket.length - 1];
    output.push({
      time: startMs / 1000,
      timeStr: new Date(startMs).toISOString(),
      open: bucket[0].open,
      high: Math.max(...bucket.map(c => c.high)),
      low: Math.min(...bucket.map(c => c.low)),
      close: last.close,
      volume: bucket.reduce((sum, c) => sum + c.volume, 0),
    });
  }
  return output;
}

export function validateMarketQuote(quote: MarketQuote | null, nowMs: number, maxAgeMs: number): FeedHealthResult {
  if (!quote || quote.mode !== 'LIVE') return { health: 'WAIT', reason: 'No verified live XAUUSD quote is connected', spread: null };
  if (quote.source.trim().length === 0 || !Number.isFinite(quote.bid) || !Number.isFinite(quote.ask) || quote.bid <= 0 || quote.ask <= quote.bid) {
    return { health: 'WAIT', reason: 'Invalid bid/ask quote or missing source', spread: null };
  }
  const age = nowMs - quote.timestampMs;
  if (age < 0 || age > maxAgeMs) return { health: 'WAIT', reason: 'Live quote is stale or timestamp is invalid', spread: null };
  return { health: 'READY', reason: 'Live quote is fresh and bid/ask are valid', spread: quote.ask - quote.bid };
}

export function validateBrokerSpecification(spec: BrokerSpecification | null): { valid: boolean; reason: string } {
  if (!spec) return { valid: false, reason: 'Broker contract specification is missing' };
  const positive = [spec.contractSizeOz, spec.tickSize, spec.tickValuePerLot, spec.minLot, spec.lotStep, spec.maxLot];
  if (!positive.every(v => Number.isFinite(v) && v > 0) || !Number.isFinite(spec.commissionPerLotRoundTurn) || spec.commissionPerLotRoundTurn < 0) {
    return { valid: false, reason: 'Broker specification contains invalid contract or cost values' };
  }
  const minSteps = spec.minLot / spec.lotStep;
  if (spec.minLot > spec.maxLot || Math.abs(minSteps - Math.round(minSteps)) > 1e-8) {
    return { valid: false, reason: 'Broker lot limits are inconsistent' };
  }
  if (!spec.verified || !spec.evidence?.trim() || !spec.checkedAt || spec.checkedAt <= 0) {
    return { valid: false, reason: 'Broker specification is not evidence-verified' };
  }
  return { valid: true, reason: 'Broker specification has evidence and valid limits' };
}

/** Adapter contract only: a provider must implement this before any live feed can be claimed. */
export interface XauusdMarketDataAdapter {
  readonly providerName: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getLatestQuote(): Promise<MarketQuote | null>;
  getCandles(timeframe: Timeframe, limit: number): Promise<Candle[]>;
}
