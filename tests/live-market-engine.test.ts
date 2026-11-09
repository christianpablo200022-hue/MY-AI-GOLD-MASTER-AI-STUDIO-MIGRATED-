import test from 'node:test';
import assert from 'node:assert/strict';
import { LiveMarketEngine, UnconfiguredMarketDataAdapter } from '../src/data/liveMarketEngine';
import type { Candle } from '../src/types/goldTrading';
import type { MarketQuote, XauusdMarketDataAdapter } from '../src/data/marketDataIntegrity';

const makeCandle = (time: number): Candle => ({
  time, timeStr: new Date(time * 1000).toISOString(), open: 2300, high: 2302, low: 2299, close: 2301, volume: 10,
});

test('unconfigured engine fails closed and does not invent a quote', async () => {
  const result = await new LiveMarketEngine(new UnconfiguredMarketDataAdapter()).getStatus(10_000);
  assert.equal(result.health, 'WAIT');
  assert.equal(result.mode, 'UNAVAILABLE');
  assert.equal(result.quote, null);
});

test('live engine accepts only fresh LIVE quotes', async () => {
  const quote: MarketQuote = { symbol: 'XAUUSD', bid: 2300, ask: 2300.2, timestampMs: 10_000, source: 'test-provider', mode: 'LIVE' };
  const adapter: XauusdMarketDataAdapter = {
    providerName: 'test-provider', connect: async () => {}, disconnect: async () => {},
    getLatestQuote: async () => quote, getCandles: async () => [],
  };
  const ready = await new LiveMarketEngine(adapter).getStatus(11_000);
  assert.equal(ready.health, 'READY');
  assert.equal(ready.quote?.source, 'test-provider');
  const stale = await new LiveMarketEngine(adapter).getStatus(40_000);
  assert.equal(stale.health, 'WAIT');
  assert.equal(stale.quote, null);
});

test('candles are withheld unless closed, contiguous and fresh', async () => {
  const adapter: XauusdMarketDataAdapter = {
    providerName: 'test-provider', connect: async () => {}, disconnect: async () => {},
    getLatestQuote: async () => null,
    getCandles: async () => [makeCandle(900), makeCandle(2700)],
  };
  const result = await new LiveMarketEngine(adapter).getCandles('15M', 10, 3_000_000);
  assert.equal(result.health, 'WAIT');
  assert.deepEqual(result.candles, []);
});

test('rejects unsafe candle request limits', async () => {
  const result = await new LiveMarketEngine().getCandles('15M', 999);
  assert.equal(result.health, 'WAIT');
});
