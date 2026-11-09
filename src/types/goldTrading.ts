/**
 * Core type definitions for MY AI GOLD MASTER
 * Professional XAUUSD Gold Trading Analysis Dashboard
 */

export type Timeframe = '1H' | '15M';

export type SignalDecision = 'BUY' | 'SELL' | 'WAIT';

export type MacroTrend = 'BULLISH' | 'BEARISH' | 'RANGING';

export type EntryStatus = 'CONFIRMED_BUY' | 'CONFIRMED_SELL' | 'NO_TRIGGER';

export interface Candle {
  time: number; // Unix timestamp in seconds
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingBot {
  id: string;
  name: string;
  code: string;
  timeframe: '1H' | '15M' | 'MULTI';
  description: string;
  strategyFocus: string;
  signal: SignalDecision;
  confidence: number; // 0 - 100
  weight: number; // 0.5 to 2.0
  active: boolean;
  rationale: string;
  simulatedWinRate: number; // e.g. 71.4%
  totalSimTrades: number;
}

export interface ConfidenceEngineResult {
  decision: SignalDecision;
  consensusScore: number; // 0 - 100%
  buyWeight: number;
  sellWeight: number;
  waitWeight: number;
  buyCount: number;
  sellCount: number;
  waitCount: number;
  trend1H: MacroTrend;
  trend1HReason: string;
  entry15M: EntryStatus;
  entry15MReason: string;
  confluenceValid: boolean;
  confidenceLevel: 'HIGH_CONVICTION' | 'MODERATE' | 'LOW_NO_TRADE';
  recommendedAction: string;
  timestamp: string;
}

export interface LiquidityZone {
  id: string;
  type: 'BSL' | 'SSL' | 'FVG_BULL' | 'FVG_BEAR' | 'ORDER_BLOCK' | 'ASIAN_RANGE';
  label: string;
  priceHigh: number;
  priceLow: number;
  status: 'UNTAPPED' | 'SWEPT' | 'MITIGATED';
  timeframe: Timeframe;
  significance: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
}

export interface Position {
  id: string;
  symbol: 'XAUUSD';
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskAmountUsd: number;
  potentialRewardUsd: number;
  openTime: string;
  openTimestamp: number;
  status: 'OPEN' | 'CLOSED';
  pnlUsd: number;
  pnlPercent: number;
  closePrice?: number;
  closeTime?: string;
  closeReason?: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'RISK_LOCK';
  botId?: string;
}

export interface TradeJournalEntry {
  id: string;
  date: string;
  timestamp: number;
  symbol: 'XAUUSD';
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnlUsd: number;
  pnlPercent: number;
  riskRewardAchieved: number;
  triggeringBot: string;
  moodTag: 'Disciplined' | 'Optimal Confluence' | 'Patience' | 'High Conviction' | 'Early Exit';
  executionNotes: string;
  timeframe: string;
  status: 'WIN' | 'LOSS' | 'BE';
}

export interface AIMarketMemoryRegime {
  id: string;
  regimeName: string;
  fractalMatchDate: string;
  similarityScore: number;
  historicalWinRate: number;
  targetZone: number;
  invalidationZone: number;
  keyInsight: string;
  actionRecommendation: SignalDecision;
  recommendedSL: number;
  recommendedTP: number;
}

export interface RiskSettings {
  accountBalance: number;
  riskPercentPerTrade: number; // default 0.5%
  targetRiskReward: number; // default 2.0 (1:2)
  maxDailyDrawdownPercent: number; // default 2.0%
  consecutiveLossLimit: number; // default 3
  leverage: number; // default 100
  tickSpeedMs: number; // 1500ms default
  geminiInsightsEnabled: boolean;
}

export interface RiskGuardianStatus {
  isLocked: boolean;
  lockReason?: string;
  todayLossUsd: number;
  todayLossPercent: number;
  consecutiveLosses: number;
  tradesToday: number;
  enforce05Risk: boolean;
  spreadSimulated: number; // e.g. 1.8 pips ($0.18)
}

export type NavTab = 'live' | 'ai' | 'lab' | 'chart' | 'trading' | 'settings';
