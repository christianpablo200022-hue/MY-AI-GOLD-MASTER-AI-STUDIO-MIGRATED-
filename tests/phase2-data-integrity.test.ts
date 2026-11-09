import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTimeframeCandles,
  validateBrokerSpecification,
  validateCandleSeries,
  validateMarketQuote,
  type BrokerSpecification,
} from '../src/data/marketDataIntegrity';
import type { Candle } from '../src/types/goldTrading';

const candle = (time: number, open = 2300, high = 2302, low = 2299, close = 2301): Candle => ({
  time, timeStr: new Date(time * 1000).toISOString(), open, high, low, close, volume: 10,
});

test('rejects stale candle data', () => {
  const result = validateCandleSeries([candle(3600), candle(4500)], { timeframe: '15M', nowMs: 5400_000, maxAgeMs: 60_000 });
  assert.equal(result.health, 'WAIT');
});

test('rejects missing intervals and duplicate candles', () => {
  const gap = validateCandleSeries([candle(0), candle(1800)], { timeframe: '15M', nowMs: 2_000_000, maxAgeMs: 2_000_000 });
  assert.equal(gap.health, 'WAIT');
  const duplicate = validateCandleSeries([candle(0), candle(0)], { timeframe: '15M', nowMs: 100_000, maxAgeMs: 200_000 });
  assert.equal(duplicate.health, 'WAIT');
});

test('builds only complete contiguous 15M candles from 1M candles', () => {
  const input = Array.from({ length: 15 }, (_, i) => candle(i * 60, 2300 + i, 2310 + i, 2290 + i, 2305 + i));
  const result = buildTimeframeCandles(input, 60_000, '15M');
  assert.equal(result.length, 1);
  assert.equal(result[0].open, 2300);
  assert.equal(result[0].close, 2319);
  assert.equal(result[0].high, 2324);
  assert.equal(result[0].low, 2290);
});

test('does not claim a demo quote is live', () => {
  const result = validateMarketQuote({ symbol: 'XAUUSD', bid: 2300, ask: 2301, timestampMs: 1000, source: 'demo', mode: 'DEMO' }, 1000, 5000);
  assert.equal(result.health, 'WAIT');
});

test('rejects broker specs without evidence verification', () => {
  const spec: BrokerSpecification = { broker: 'Unselected', symbol: 'XAUUSD', contractSizeOz: 100, tickSize: 0.01, tickValuePerLot: 1, minLot: 0.01, lotStep: 0.01, maxLot: 100, commissionPerLotRoundTurn: 0, verified: false };
  assert.equal(validateBrokerSpecification(spec).valid, false);
  assert.equal(validateBrokerSpecification({ ...spec, verified: true, evidence: 'Official contract specs', checkedAt: 1 }).valid, true);
});
