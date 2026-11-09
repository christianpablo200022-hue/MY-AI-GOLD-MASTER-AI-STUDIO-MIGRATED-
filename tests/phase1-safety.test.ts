import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePositionSize, generateInitialCandles, validateDataQuality, evaluateSignalExpiration } from '../src/utils/goldMarketSimulator';

test('position sizing rounds down and stays within 0.5% risk budget', () => {
  const result = calculatePositionSize(10_000, 0.5, 'BUY', 2700, 2692.5, 2, 100);
  assert.equal(result.isValid, true);
  assert.equal(result.lotSize, 0.06);
  assert.ok(result.riskUsd <= 50);
  assert.equal(result.rewardUsd, result.riskUsd * 2);
});

test('position sizing blocks a minimum lot that would breach risk cap', () => {
  const result = calculatePositionSize(1_000, 0.5, 'BUY', 2700, 2692.5, 2, 100);
  assert.equal(result.isValid, false);
  assert.equal(result.lotSize, 0);
  assert.match(result.warning || '', /below the 0.01 minimum lot/i);
});

test('position sizing blocks risk above 0.5% and unconfigured contract size', () => {
  assert.equal(calculatePositionSize(10_000, 0.75, 'BUY', 2700, 2692.5, 2, 100).isValid, false);
  assert.equal(calculatePositionSize(10_000, 0.5, 'BUY', 2700, 2692.5, 2, 0).isValid, false);
});

test('data quality guardian rejects a missing 15M candle interval', () => {
  const h1 = generateInitialCandles(50, 60, 2684.5);
  const m15 = generateInitialCandles(70, 15, 2684.5).map(c => ({ ...c }));
  const valid = validateDataQuality(h1, m15, 2684.5);
  assert.equal(valid.isValid, true);
  m15[m15.length - 1].time += 1800;
  const invalid = validateDataQuality(h1, m15, 2684.5);
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.checks.some(c => c.id === 'chk_15m_interval' && !c.passed));
});

test('signal invalidation uses the supplied fixed level', () => {
  const signalTime = Date.now();
  const valid = evaluateSignalExpiration('BUY', signalTime, 2701, 2692.5, 15);
  const invalid = evaluateSignalExpiration('BUY', signalTime, 2692.5, 2692.5, 15);
  assert.equal(valid.isPriceInvalidated, false);
  assert.equal(invalid.isPriceInvalidated, true);
});
