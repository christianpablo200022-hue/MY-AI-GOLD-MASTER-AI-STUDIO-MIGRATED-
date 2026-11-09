import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  NavTab, 
  Candle, 
  TradingBot, 
  ConfidenceEngineResult, 
  LiquidityZone, 
  Position, 
  TradeJournalEntry, 
  AIMarketMemoryRegime, 
  RiskSettings, 
  RiskGuardianStatus 
} from './types/goldTrading';
import { 
  INITIAL_GOLD_PRICE, 
  generateInitialCandles, 
  analyze1HTrend, 
  analyze15MEntry, 
  initialize10Bots, 
  evaluate10Bots,
  calculateConfidenceEngine, 
  calculatePositionSize, 
  getInitialLiquidityZones, 
  getInitialMarketMemory, 
  getInitialTradeJournal,
  EconomicEvent,
  NewsFilterSettings,
  getEconomicCalendarEvents,
  evaluateNewsFilter,
  TradingSessionInfo,
  getCurrentTradingSessions,
  evaluateSessionFilter,
  BotPerformanceStat,
  calculateBotPerformanceRankings,
  AITradeReview,
  generateAITradeReview,
  getInitialTradeReviews,
  SmartAlert,
  generateSmartAlerts,
  AIStrategyMemoryEntry,
  StrategyVersion,
  getInitialStrategyMemoryEntries,
  getInitialStrategyVersions,
  DataQualityReport,
  validateDataQuality,
  StrategyDegradationStatus,
  evaluateStrategyDegradation,
  SpreadVolatilityStatus,
  evaluateSpreadAndVolatility,
  SignalExpirationState,
  evaluateSignalExpiration,
  AntiOvertradingStatus,
  evaluateAntiOvertrading,
  DecisionExplanationDetails,
  generateAIDecisionExplanation,
} from './utils/goldMarketSimulator';
import { Navigation } from './components/Navigation';
import { LiveOverview } from './components/LiveOverview';
import { AIIntelligenceView } from './components/AIIntelligenceView';
import { InteractiveChart } from './components/InteractiveChart';
import { TradingTerminal } from './components/TradingTerminal';
import { PaperLabView } from './components/PaperLabView';
import { TradingJournalView } from './components/TradingJournalView';
import { SettingsView } from './components/SettingsView';

const RISK_GUARDIAN_STORAGE_KEY = 'my-ai-gold-master-risk-guardian-v1';
const LAST_TRADE_CLOSE_STORAGE_KEY = 'my-ai-gold-master-last-close-v1';
const getUtcDateKey = () => new Date().toISOString().slice(0, 10);
function loadRiskGuardianState(): RiskGuardianStatus {
  const fallback: RiskGuardianStatus = { isLocked: false, lockReason: undefined, todayLossUsd: 0, todayLossPercent: 0, consecutiveLosses: 0, tradesToday: 0, enforce05Risk: true, spreadSimulated: 0.18 };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(RISK_GUARDIAN_STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as { date?: string; state?: RiskGuardianStatus };
    if (saved.date !== getUtcDateKey() || !saved.state) return fallback;
    if (!Number.isFinite(saved.state.tradesToday) || !Number.isFinite(saved.state.todayLossUsd) || !Number.isFinite(saved.state.consecutiveLosses)) return fallback;
    const tradesToday = Math.min(3, Math.max(0, Math.floor(saved.state.tradesToday)));
    return { ...fallback, ...saved.state, tradesToday, isLocked: saved.state.isLocked || tradesToday >= 3, lockReason: tradesToday >= 3 ? (saved.state.lockReason || 'Daily Trade Limit (3) Reached. Risk Guardian lock engaged until 00:00 UTC reset.') : saved.state.lockReason };
  } catch { return fallback; }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('live');

  // Account & Risk Settings
  const [settings, setSettings] = useState<RiskSettings>({
    accountBalance: 10000.0,
    riskPercentPerTrade: 0.5,
    targetRiskReward: 2.0,
    maxDailyDrawdownPercent: 2.0,
    consecutiveLossLimit: 3,
    leverage: 100,
    tickSpeedMs: 1500,
    geminiInsightsEnabled: true,
  });

  // Candlestick historical states
  const [candles1H, setCandles1H] = useState<Candle[]>(() => generateInitialCandles(50, 60, INITIAL_GOLD_PRICE));
  const [candles15M, setCandles15M] = useState<Candle[]>(() => generateInitialCandles(70, 15, INITIAL_GOLD_PRICE));

  // Current Price & 24h stats
  const [currentPrice, setCurrentPrice] = useState<number>(INITIAL_GOLD_PRICE);
  const [high24h, setHigh24h] = useState<number>(INITIAL_GOLD_PRICE + 14.80);
  const [low24h, setLow24h] = useState<number>(INITIAL_GOLD_PRICE - 12.20);
  const [priceChange, setPriceChange] = useState<number>(3.40);

  // 10 Independent Trading Bots - Evaluated dynamically with pure indicator math
  const [bots, setBots] = useState<TradingBot[]>(() => {
    const init1H = generateInitialCandles(50, 60, INITIAL_GOLD_PRICE);
    const init15M = generateInitialCandles(70, 15, INITIAL_GOLD_PRICE);
    return evaluate10Bots(init1H, init15M, INITIAL_GOLD_PRICE, initialize10Bots());
  });

  // SMC Liquidity Zones
  const [liquidityZones, setLiquidityZones] = useState<LiquidityZone[]>(() => getInitialLiquidityZones(INITIAL_GOLD_PRICE));

  // AI Market Memory
  const [marketMemory, setMarketMemory] = useState<AIMarketMemoryRegime[]>(() => getInitialMarketMemory());

  // Trade Journal
  const [tradeJournal, setTradeJournal] = useState<TradeJournalEntry[]>(() => getInitialTradeJournal());

  // Active Open Positions
  const [openPositions, setOpenPositions] = useState<Position[]>([]);

  // Simulation play / pause
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);

  // Risk Guardian live status
  const [riskGuardian, setRiskGuardian] = useState<RiskGuardianStatus>(() => loadRiskGuardianState());
  const riskDayRef = useRef(getUtcDateKey());
  const tradesTodayRef = useRef(riskGuardian.tradesToday);

  // --------------------------------------------------------------------------
  // 7 NEW FEATURES STATE (Features 1 - 7)
  // --------------------------------------------------------------------------
  // Feature 1: AI News & Event Filter
  const [newsEvents, setNewsEvents] = useState<EconomicEvent[]>(() => getEconomicCalendarEvents());
  const [newsSettings, setNewsSettings] = useState<NewsFilterSettings>({
    enabled: true,
    bufferMinutesBefore: 30,
    bufferMinutesAfter: 30,
    blockMediumImpact: false,
  });

  // Feature 4: Smart Trading Session Filter
  const [sessionFilterEnabled, setSessionFilterEnabled] = useState<boolean>(true);

  // Feature 5: AI Trade Review & Learning
  const [tradeReviews, setTradeReviews] = useState<AITradeReview[]>(() => getInitialTradeReviews());

  // Feature 6: Smart Alert System
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);

  // Feature 7: AI Strategy Memory & Versioning
  const [strategyMemoryEntries, setStrategyMemoryEntries] = useState<AIStrategyMemoryEntry[]>(() => getInitialStrategyMemoryEntries());
  const [strategyVersions, setStrategyVersions] = useState<StrategyVersion[]>(() => getInitialStrategyVersions());

  // Feature 3: Verified Broker Contract Multiplier (Default 100 oz/lot)
  const [brokerContractOz, setBrokerContractOz] = useState<number>(100);

  // Additional 6 Features State
  const [lastTradeCloseTime, setLastTradeCloseTime] = useState<number | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const value = Number(window.localStorage.getItem(LAST_TRADE_CLOSE_STORAGE_KEY));
      return Number.isFinite(value) && value > 0 ? value : undefined;
    } catch { return undefined; }
  });
  const [lastSignalTime, setLastSignalTime] = useState<number>(Date.now());
  const [signalReferencePrice, setSignalReferencePrice] = useState<number>(currentPrice);

  // Persist risk state and reset daily counters at 00:00 UTC, including after reload.
  useEffect(() => {
    try {
      window.localStorage.setItem(RISK_GUARDIAN_STORAGE_KEY, JSON.stringify({ date: riskDayRef.current, state: riskGuardian }));
      if (lastTradeCloseTime) window.localStorage.setItem(LAST_TRADE_CLOSE_STORAGE_KEY, String(lastTradeCloseTime));
      else window.localStorage.removeItem(LAST_TRADE_CLOSE_STORAGE_KEY);
    } catch { /* Keep in-memory protections if browser storage is unavailable. */ }
  }, [riskGuardian, lastTradeCloseTime]);

  useEffect(() => {
    const checkUtcRollover = () => {
      const todayUtc = getUtcDateKey();
      if (todayUtc === riskDayRef.current) return;
      riskDayRef.current = todayUtc;
      tradesTodayRef.current = 0;
      setLastTradeCloseTime(undefined);
      setRiskGuardian(prev => ({ ...prev, isLocked: false, lockReason: undefined, todayLossUsd: 0, todayLossPercent: 0, consecutiveLosses: 0, tradesToday: 0 }));
    };
    const timer = window.setInterval(checkUtcRollover, 10000);
    return () => window.clearInterval(timer);
  }, []);

  // --------------------------------------------------------------------------
  // PART 4 — SYSTEM INTEGRATION PIPELINE
  // --------------------------------------------------------------------------
  // 1. Obtain market data (candles1H, candles15M, currentPrice)
  // 2. 1H Macro Trend
  const trendAnalysis = useMemo(() => analyze1HTrend(candles1H), [candles1H]);
  // 3. 15M Entry Confirmation
  const entryAnalysis = useMemo(() => analyze15MEntry(candles15M, trendAnalysis.trend), [candles15M, trendAnalysis.trend]);

  // 4. Evaluate 10 Bots (managed in bots state via evaluate10Bots)
  // 5. Raw Confidence Engine Consensus
  const rawConfidenceResult = useMemo(() => {
    return calculateConfidenceEngine(
      bots,
      trendAnalysis.trend,
      trendAnalysis.reason,
      entryAnalysis.status,
      entryAnalysis.reason
    );
  }, [bots, trendAnalysis, entryAnalysis]);

  // Update signal creation time whenever directional signal triggers
  useEffect(() => {
    if (rawConfidenceResult.decision !== 'WAIT') {
      setLastSignalTime(Date.now());
      setSignalReferencePrice(currentPrice);
    }
  }, [rawConfidenceResult.decision]);

  // Feature 7: AI Data Quality Guardian
  const dataQualityReport = useMemo(() => {
    return validateDataQuality(candles1H, candles15M, currentPrice);
  }, [candles1H, candles15M, currentPrice]);

  // Feature 1: Apply AI News & Event Filter
  const newsStatus = useMemo(() => {
    return evaluateNewsFilter(newsEvents, newsSettings);
  }, [newsEvents, newsSettings]);

  // Feature 12 & 4: Apply Smart Trading Session Filter
  const sessionInfo = useMemo(() => getCurrentTradingSessions(), [currentPrice]);
  const sessionStatus = useMemo(() => {
    return evaluateSessionFilter(sessionInfo.sessions, sessionFilterEnabled);
  }, [sessionInfo, sessionFilterEnabled]);

  // Feature 8: Spread & Volatility Protection
  const spreadVolatilityStatus = useMemo(() => {
    return evaluateSpreadAndVolatility(candles15M, currentPrice, 2.5, false);
  }, [candles15M, currentPrice]);

  // Feature 10: Anti-Overtrading Protection (Target 1-2, Hard Limit 3, 30m cooldown)
  const antiOvertradingStatus = useMemo(() => {
    return evaluateAntiOvertrading(
      riskGuardian.tradesToday,
      lastTradeCloseTime,
      currentPrice,
      tradeJournal,
      rawConfidenceResult.decision !== 'WAIT' ? rawConfidenceResult.decision : undefined
    );
  }, [riskGuardian.tradesToday, lastTradeCloseTime, currentPrice, tradeJournal, rawConfidenceResult.decision]);

  // Feature 9: Smart Signal Expiration (15m TTL)
  const signalExpiration = useMemo(() => {
    const sl = rawConfidenceResult.decision === 'BUY' ? signalReferencePrice - 7.5 : signalReferencePrice + 7.5;
    return evaluateSignalExpiration(rawConfidenceResult.decision, lastSignalTime, currentPrice, sl, 15);
  }, [rawConfidenceResult.decision, lastSignalTime, currentPrice, signalReferencePrice]);

  // Feature 5: Strategy Degradation Detector
  const strategyDegradation = useMemo(() => {
    return evaluateStrategyDegradation(tradeJournal);
  }, [tradeJournal]);

  // 8. Produce Final Decision through Protective Gates
  // Rule: Safety filters can override a proposed entry and force WAIT, but never turn WAIT into BUY or SELL
  const confidenceResult = useMemo<ConfidenceEngineResult>(() => {
    let finalDecision = rawConfidenceResult.decision;
    let actionReason = rawConfidenceResult.recommendedAction;

    if (finalDecision !== 'WAIT') {
      if (!dataQualityReport.isValid) {
        finalDecision = 'WAIT';
        actionReason = dataQualityReport.recommendation;
      } else if (newsStatus.isRestricted && newsStatus.reason) {
        finalDecision = 'WAIT';
        actionReason = newsStatus.reason;
      } else if (!sessionStatus.isAllowed && sessionStatus.reason) {
        finalDecision = 'WAIT';
        actionReason = sessionStatus.reason;
      } else if (!spreadVolatilityStatus.isAllowedToTrade && spreadVolatilityStatus.warningReason) {
        finalDecision = 'WAIT';
        actionReason = spreadVolatilityStatus.warningReason;
      } else if (!antiOvertradingStatus.isAllowedToTrade && antiOvertradingStatus.restrictionReason) {
        finalDecision = 'WAIT';
        actionReason = antiOvertradingStatus.restrictionReason;
      } else if (signalExpiration.isExpired && signalExpiration.invalidationReason) {
        finalDecision = 'WAIT';
        actionReason = signalExpiration.invalidationReason;
      } else if (riskGuardian.isLocked) {
        finalDecision = 'WAIT';
        actionReason = `Risk Guardian Plus Lock Active: ${riskGuardian.lockReason || 'Capital preservation active'}.`;
      }
    }

    return {
      ...rawConfidenceResult,
      decision: finalDecision,
      recommendedAction: actionReason,
    };
  }, [
    rawConfidenceResult, 
    dataQualityReport, 
    newsStatus, 
    sessionStatus, 
    spreadVolatilityStatus, 
    antiOvertradingStatus, 
    signalExpiration, 
    riskGuardian.isLocked, 
    riskGuardian.lockReason
  ]);

  // Feature 2: AI Decision Explanation
  const decisionExplanation = useMemo(() => {
    return generateAIDecisionExplanation(confidenceResult, bots, currentPrice);
  }, [confidenceResult, bots, currentPrice]);

  const executionBlockReason = riskGuardian.isLocked ? (riskGuardian.lockReason || 'Risk Guardian lock is active.')
    : tradesTodayRef.current >= 3 ? 'Daily limit of 3 entries has been reached.'
    : !dataQualityReport.isValid ? dataQualityReport.recommendation
    : newsStatus.isRestricted ? (newsStatus.reason || 'News protection is active.')
    : !sessionStatus.isAllowed ? (sessionStatus.reason || 'Outside approved trading sessions.')
    : !spreadVolatilityStatus.isAllowedToTrade ? (spreadVolatilityStatus.warningReason || 'Spread/volatility protection is active.')
    : !antiOvertradingStatus.isAllowedToTrade ? (antiOvertradingStatus.restrictionReason || 'Anti-overtrading protection is active.')
    : signalExpiration.isExpired ? (signalExpiration.invalidationReason || 'Signal expired or invalidated.')
    : confidenceResult.decision === 'WAIT' ? 'Confidence Engine decision is WAIT.'
    : undefined;
  const canExecuteTrade = !executionBlockReason;

  // Feature 11 & 2: Bot Performance Ranking
  const botRankings = useMemo(() => {
    return calculateBotPerformanceRankings(tradeJournal, bots);
  }, [tradeJournal, bots]);

  // All paper orders pass through one final fail-closed execution gate.
  const handleOpenPosition = useCallback((posData: Omit<Position, 'id' | 'openTime' | 'openTimestamp' | 'status' | 'pnlUsd' | 'pnlPercent'>) => {
    const maxRiskPercent = Math.min(settings.riskPercentPerTrade, 0.5);
    const sizing = calculatePositionSize(settings.accountBalance, maxRiskPercent, posData.direction, posData.entryPrice, posData.stopLoss, settings.targetRiskReward, brokerContractOz);
    const directionMatches = confidenceResult.decision === posData.direction;
    const sideIsValid = posData.direction === 'BUY'
      ? posData.stopLoss < posData.entryPrice && posData.takeProfit > posData.entryPrice
      : posData.stopLoss > posData.entryPrice && posData.takeProfit < posData.entryPrice;
    const targetMatches = Math.abs(posData.takeProfit - sizing.takeProfitPrice) <= 0.02;
    const lotWithinLimit = sizing.isValid && posData.lotSize > 0 && posData.lotSize <= sizing.lotSize + 0.000001;
    const riskWithinLimit = sizing.isValid && sizing.riskUsd <= settings.accountBalance * 0.005 + 0.01;

    if (riskGuardian.isLocked || tradesTodayRef.current >= 3 || !antiOvertradingStatus.isAllowedToTrade ||
      !dataQualityReport.isValid || newsStatus.isRestricted || !sessionStatus.isAllowed ||
      !spreadVolatilityStatus.isAllowedToTrade || signalExpiration.isExpired || !directionMatches ||
      !sideIsValid || !targetMatches || !lotWithinLimit || !riskWithinLimit) return false;

    const newPosition: Position = {
      ...posData, lotSize: sizing.lotSize, riskAmountUsd: sizing.riskUsd, potentialRewardUsd: sizing.rewardUsd,
      id: `pos_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      openTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      openTimestamp: Date.now(), status: 'OPEN', pnlUsd: 0, pnlPercent: 0,
    };
    const nextTradeCount = tradesTodayRef.current + 1;
    tradesTodayRef.current = nextTradeCount;
    setRiskGuardian(prev => ({
      ...prev, tradesToday: nextTradeCount, isLocked: nextTradeCount >= 3 || prev.isLocked,
      lockReason: nextTradeCount >= 3 ? 'Daily Trade Limit (3) Reached. Risk Guardian lock engaged until 00:00 UTC reset.' : prev.lockReason,
    }));
    setOpenPositions(prev => [newPosition, ...prev]);
    return true;
  }, [settings, brokerContractOz, confidenceResult.decision, riskGuardian.isLocked, antiOvertradingStatus.isAllowedToTrade, dataQualityReport.isValid, newsStatus.isRestricted, sessionStatus.isAllowed, spreadVolatilityStatus.isAllowedToTrade, signalExpiration.isExpired]);

  // Handle position closing with the exact simulator trigger price when available.
  const handleClosePosition = useCallback((positionId: string, reason: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'RISK_LOCK', fillPrice?: number) => {
    const targetPos = openPositions.find(p => p.id === positionId);
    if (!targetPos) return;
    const closePrice = Number.isFinite(fillPrice) ? (fillPrice as number) : currentPrice;
    const priceDiff = targetPos.direction === 'BUY' ? closePrice - targetPos.entryPrice : targetPos.entryPrice - closePrice;
    const pnlUsd = Math.round(targetPos.lotSize * brokerContractOz * priceDiff * 100) / 100;
    const pnlPercent = settings.accountBalance > 0 ? Math.round((pnlUsd / settings.accountBalance) * 10000) / 100 : 0;
    const isWin = pnlUsd > 0;
    const isLoss = pnlUsd < 0;

    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
    setLastTradeCloseTime(Date.now());
    setSettings(prev => ({ ...prev, accountBalance: Math.max(0, Math.round((prev.accountBalance + pnlUsd) * 100) / 100) }));
    setRiskGuardian(prev => {
      const newLossUsd = isLoss ? prev.todayLossUsd + Math.abs(pnlUsd) : prev.todayLossUsd;
      const newLossPercent = settings.accountBalance > 0 ? (newLossUsd / settings.accountBalance) * 100 : 0;
      const newConsecutiveLosses = isLoss ? prev.consecutiveLosses + 1 : 0;
      const dailyLossHit = newLossPercent >= settings.maxDailyDrawdownPercent;
      const consecutiveHit = newConsecutiveLosses >= settings.consecutiveLossLimit;
      const shouldLock = prev.isLocked || dailyLossHit || consecutiveHit || prev.tradesToday >= 3;
      return {
        ...prev, todayLossUsd: newLossUsd, todayLossPercent: newLossPercent,
        consecutiveLosses: newConsecutiveLosses, isLocked: shouldLock,
        lockReason: dailyLossHit ? `Daily Max Loss Limit (${settings.maxDailyDrawdownPercent}%) Tripped`
          : consecutiveHit ? `Consecutive Loss Limit (${settings.consecutiveLossLimit}) Tripped`
          : prev.tradesToday >= 3 ? 'Daily Trade Limit (3) Reached. Risk Guardian lock engaged until 00:00 UTC reset.' : prev.lockReason,
      };
    });

    const journalEntry: TradeJournalEntry = {
      id: `tj_${Date.now()}_${positionId}`, date: new Date().toISOString().replace('T', ' ').slice(0, 19), timestamp: Date.now(),
      symbol: 'XAUUSD', direction: targetPos.direction, entryPrice: targetPos.entryPrice, exitPrice: closePrice,
      stopLoss: targetPos.stopLoss, takeProfit: targetPos.takeProfit, lotSize: targetPos.lotSize,
      pnlUsd, pnlPercent, riskRewardAchieved: targetPos.riskAmountUsd > 0 ? Math.round((pnlUsd / targetPos.riskAmountUsd) * 100) / 100 : 0,
      triggeringBot: targetPos.botId || 'Confidence Engine Master',
      moodTag: reason === 'TP_HIT' ? 'Optimal Confluence' : reason === 'SL_HIT' ? 'Disciplined' : 'Early Exit',
      executionNotes: reason === 'TP_HIT' ? 'Paper TP trigger recorded at the simulator trigger price.'
        : reason === 'SL_HIT' ? 'Paper SL trigger recorded at the simulator trigger price.' : 'Paper position closed manually or by risk protection.',
      timeframe: '15M', status: isWin ? 'WIN' : isLoss ? 'LOSS' : 'BE',
    };
    setTradeJournal(prev => [journalEntry, ...prev]);
    const review = generateAITradeReview(journalEntry, bots, confidenceResult,
      newsStatus.isRestricted ? (newsStatus.reason || 'Restricted News Window') : 'Clear of High-Impact Events',
      sessionStatus.activeSessionName);
    setTradeReviews(prev => [review, ...prev]);
  }, [openPositions, currentPrice, brokerContractOz, settings.accountBalance, settings.maxDailyDrawdownPercent, settings.consecutiveLossLimit, bots, confidenceResult, newsStatus, sessionStatus]);

  // Move SL to Breakeven
  const handleMoveToBreakeven = useCallback((positionId: string) => {
    setOpenPositions(prev => prev.map(pos => {
      if (pos.id === positionId) {
        return {
          ...pos,
          stopLoss: pos.entryPrice,
        };
      }
      return pos;
    }));
  }, []);

  // Emergency Close All Positions
  const handleCloseAllPositions = useCallback(() => {
    openPositions.forEach(p => handleClosePosition(p.id, 'RISK_LOCK'));
  }, [openPositions, handleClosePosition]);

  // Quick trade from live dashboard
  const handleQuickTrade = useCallback((direction: 'BUY' | 'SELL') => {
    const slDist = 7.5;
    const entry = currentPrice;
    const sl = direction === 'BUY' ? entry - slDist : entry + slDist;
    const tp = direction === 'BUY' ? entry + (slDist * settings.targetRiskReward) : entry - (slDist * settings.targetRiskReward);
    const sizing = calculatePositionSize(settings.accountBalance, Math.min(settings.riskPercentPerTrade, 0.5), direction, entry, sl, settings.targetRiskReward, brokerContractOz);
    if (!sizing.isValid || confidenceResult.decision !== direction) return;

    handleOpenPosition({
      symbol: 'XAUUSD',
      direction,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      lotSize: sizing.lotSize,
      riskAmountUsd: sizing.riskUsd,
      potentialRewardUsd: sizing.rewardUsd,
      botId: 'Quick Paper Confluence Execution',
    });
  }, [currentPrice, settings, brokerContractOz, confidenceResult.decision, handleOpenPosition]);

  // Bot Weight & Active toggle
  const handleToggleBot = useCallback((botId: string) => {
    setBots(prev => prev.map(b => b.id === botId ? { ...b, active: !b.active } : b));
  }, []);

  const handleUpdateBotWeight = useCallback((botId: string, weight: number) => {
    setBots(prev => prev.map(b => b.id === botId ? { ...b, weight } : b));
  }, []);

  // Simulated Market Tick Step
  const simulateTick = useCallback(() => {
    // Generate small gold delta between -0.45 and +0.48 points
    const delta = Math.round(((Math.random() - 0.48) * 0.70) * 100) / 100;
    const newPrice = Math.round((currentPrice + delta) * 100) / 100;

    setCurrentPrice(newPrice);
    setPriceChange(prev => Math.round((prev + delta) * 100) / 100);
    setHigh24h(h => Math.max(h, newPrice));
    setLow24h(l => Math.min(l, newPrice));

    // Update the last candle in 15M history
    setCandles15M(prev => {
      if (prev.length === 0) return prev;
      const last = { ...prev[prev.length - 1] };
      last.close = newPrice;
      last.high = Math.max(last.high, newPrice);
      last.low = Math.min(last.low, newPrice);
      const updated = [...prev.slice(0, -1), last];

      // Dynamically evaluate all 10 independent bots with genuine mathematical indicator calculations
      setBots(prevBots => evaluate10Bots(candles1H, updated, newPrice, prevBots));

      return updated;
    });

    // Update positions without side effects inside a React state updater.
    const closing: Array<{ id: string; reason: 'TP_HIT' | 'SL_HIT' }> = [];
    const survivors = openPositions.flatMap(pos => {
      const priceDiff = pos.direction === 'BUY' ? newPrice - pos.entryPrice : pos.entryPrice - newPrice;
      const pnlUsd = Math.round(pos.lotSize * brokerContractOz * priceDiff * 100) / 100;
      const pnlPercent = settings.accountBalance > 0 ? Math.round((pnlUsd / settings.accountBalance) * 10000) / 100 : 0;
      const isTpHit = pos.direction === 'BUY' ? newPrice >= pos.takeProfit : newPrice <= pos.takeProfit;
      const isSlHit = pos.direction === 'BUY' ? newPrice <= pos.stopLoss : newPrice >= pos.stopLoss;
      if (isTpHit) { closing.push({ id: pos.id, reason: 'TP_HIT' }); return []; }
      if (isSlHit) { closing.push({ id: pos.id, reason: 'SL_HIT' }); return []; }
      return [{ ...pos, pnlUsd, pnlPercent }];
    });
    setOpenPositions(survivors);
    closing.forEach(item => handleClosePosition(item.id, item.reason, newPrice));
  }, [currentPrice, candles1H, openPositions, brokerContractOz, settings.accountBalance, handleClosePosition]);

  // Periodic Tick simulation interval
  useEffect(() => {
    if (!isSimulationRunning) return;
    const interval = setInterval(() => {
      simulateTick();
    }, settings.tickSpeedMs);

    return () => clearInterval(interval);
  }, [isSimulationRunning, settings.tickSpeedMs, simulateTick]);

  // Stress Scenario Simulation
  const handleSimulateScenario = useCallback((scenario: 'nfp_spike' | 'asian_sweep' | 'loss_streak') => {
    if (scenario === 'nfp_spike') {
      const spike = 22.50;
      const newPrice = Math.round((currentPrice + spike) * 100) / 100;
      setCurrentPrice(newPrice);
      setHigh24h(h => Math.max(h, newPrice));
      setPriceChange(pc => pc + spike);
      setCandles15M(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        last.close = newPrice;
        last.high = Math.max(last.high, newPrice);
        last.volume = Math.round(last.volume * 2.5); // High volume displacement surge
        const updated = [...prev.slice(0, -1), last];
        setBots(prevBots => evaluate10Bots(candles1H, updated, newPrice, prevBots));
        return updated;
      });
    } else if (scenario === 'asian_sweep') {
      const drop = 8.40;
      const newPrice = Math.round((currentPrice - drop) * 100) / 100;
      setCurrentPrice(newPrice);
      setLow24h(l => Math.min(l, newPrice));
      setCandles15M(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        last.low = Math.min(last.low, newPrice - 2.5); // Low sweep wick
        last.close = newPrice; // Reclaim
        const updated = [...prev.slice(0, -1), last];
        setBots(prevBots => evaluate10Bots(candles1H, updated, newPrice, prevBots));
        return updated;
      });
    } else if (scenario === 'loss_streak') {
      // Simulate consecutive loss trigger
      setRiskGuardian(rg => ({
        ...rg,
        consecutiveLosses: 3,
        todayLossUsd: 150.00,
        todayLossPercent: 1.5,
        isLocked: true,
        lockReason: 'Consecutive Loss Circuit Breaker: 3 consecutive losses hit. Capital preservation lock engaged.',
      }));
    }
  }, [currentPrice, candles1H]);

  // Reset Account handler
  const handleResetAccount = useCallback(() => {
    tradesTodayRef.current = 0;
    riskDayRef.current = getUtcDateKey();
    setLastTradeCloseTime(undefined);
    setSettings(s => ({ ...s, accountBalance: 10000 }));
    setOpenPositions([]);
    setRiskGuardian({
      isLocked: false,
      lockReason: undefined,
      todayLossUsd: 0,
      todayLossPercent: 0,
      consecutiveLosses: 0,
      tradesToday: 0,
      enforce05Risk: true,
      spreadSimulated: 0.18,
    });
  }, []);

  // Handlers for Smart Alerts & Strategy Memory
  const handleMarkAlertRead = useCallback((alertId: string) => {
    setSmartAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
  }, []);

  const handleApproveStrategyVersion = useCallback((versionId: string) => {
    setStrategyVersions(prev => prev.map(v => v.versionId === versionId ? { ...v, userApproved: true, status: 'PRODUCTION_ACTIVE' } : v));
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Mobile Bottom App Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        accountBalance={settings.accountBalance}
        isRiskLocked={riskGuardian.isLocked}
        openPositionsCount={openPositions.length}
      />

      {/* Institutional Telemetry & Session Bar */}
      <div className="bg-[#0b111e] border-b border-slate-800/80 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-sans font-semibold text-slate-200">XAUUSD</span>
              <span className="text-amber-400 font-bold">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="h-3 w-px bg-slate-800 hidden sm:block"></div>
            <div className="text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-500">PHT (Manila):</span>
              <span className="text-slate-200 font-semibold">{sessionInfo.manilaTimeStr}</span>
            </div>
            <div className="h-3 w-px bg-slate-800 hidden sm:block"></div>
            <div className="text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-500">Session:</span>
              <span className={sessionInfo.isPeakLiquidity ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                {sessionInfo.currentSessionSummary}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Daily Trade Frequency Limit Indicator */}
            <div className={`px-2 py-0.5 border text-[11px] font-sans font-medium flex items-center gap-1.5 ${
              riskGuardian.tradesToday >= 3 
                ? "bg-rose-950/60 border-rose-800/80 text-rose-300"
                : riskGuardian.tradesToday >= 2
                ? "bg-amber-950/60 border-amber-800/80 text-amber-300"
                : "bg-slate-900 border-slate-700 text-slate-300"
            }`}>
              <span>Daily Trades:</span>
              <span className="font-mono font-bold">{riskGuardian.tradesToday}/3 Max</span>
              <span className="text-slate-500 text-[10px]">({antiOvertradingStatus.tradesRemainingToday} remaining)</span>
            </div>

            {/* Data Quality Guardian Chip */}
            <div className={`px-2 py-0.5 border text-[11px] font-sans font-medium flex items-center gap-1 ${
              dataQualityReport.isValid 
                ? "bg-emerald-950/50 border-emerald-800/80 text-emerald-300" 
                : "bg-rose-950/60 border-rose-800/80 text-rose-300"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dataQualityReport.isValid ? "bg-emerald-400" : "bg-rose-500"}`}></span>
              <span>Data: {dataQualityReport.status}</span>
            </div>

            {/* Signal Expiration Timer if active BUY/SELL */}
            {confidenceResult.decision !== 'WAIT' && (
              <div className="px-2 py-0.5 bg-cyan-950/50 border border-cyan-800/80 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                <span>TTL: {Math.floor(signalExpiration.secondsRemaining / 60)}m {signalExpiration.secondsRemaining % 60}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {currentTab === 'live' && (
          <LiveOverview
            currentPrice={currentPrice}
            priceChange={priceChange}
            high24h={high24h}
            low24h={low24h}
            confidenceResult={confidenceResult}
            bots={bots}
            liquidityZones={liquidityZones}
            riskGuardian={riskGuardian}
            accountBalance={settings.accountBalance}
            onNavigate={setCurrentTab}
            onQuickTrade={handleQuickTrade}
          />
        )}

        {currentTab === 'ai' && (
          <AIIntelligenceView
            bots={bots}
            onToggleBot={handleToggleBot}
            onUpdateBotWeight={handleUpdateBotWeight}
            confidenceResult={confidenceResult}
            marketMemory={marketMemory}
            liquidityZones={liquidityZones}
            currentPrice={currentPrice}
            recentCandles={candles15M}
            newsEvents={newsEvents}
            newsSettings={newsSettings}
            onUpdateNewsSettings={(newS) => setNewsSettings(s => ({ ...s, ...newS }))}
            newsStatus={newsStatus}
            sessionInfo={sessionInfo}
            sessionFilterEnabled={sessionFilterEnabled}
            onToggleSessionFilter={() => setSessionFilterEnabled(!sessionFilterEnabled)}
            botRankings={botRankings}
            tradeReviews={tradeReviews}
            smartAlerts={smartAlerts}
            onMarkAlertRead={handleMarkAlertRead}
            strategyMemoryEntries={strategyMemoryEntries}
            strategyVersions={strategyVersions}
            onApproveStrategyVersion={handleApproveStrategyVersion}
            riskGuardian={riskGuardian}
            brokerContractOz={brokerContractOz}
            onUpdateBrokerContractOz={setBrokerContractOz}
            dataQualityReport={dataQualityReport}
            spreadVolatilityStatus={spreadVolatilityStatus}
            antiOvertradingStatus={antiOvertradingStatus}
            signalExpiration={signalExpiration}
            strategyDegradation={strategyDegradation}
            decisionExplanation={decisionExplanation}
          />
        )}

        {currentTab === 'chart' && (
          <InteractiveChart
            candles1H={candles1H}
            candles15M={candles15M}
            currentPrice={currentPrice}
            liquidityZones={liquidityZones}
            openPositions={openPositions}
            isSimulationRunning={isSimulationRunning}
            onToggleSimulation={() => setIsSimulationRunning(!isSimulationRunning)}
            onSimulateTick={simulateTick}
          />
        )}

        {currentTab === 'trading' && (
          <TradingTerminal
            currentPrice={currentPrice}
            accountBalance={settings.accountBalance}
            riskPercent={settings.riskPercentPerTrade}
            targetRR={settings.targetRiskReward}
            brokerContractOz={brokerContractOz}
            canExecuteTrade={canExecuteTrade}
            executionBlockReason={executionBlockReason}
            confidenceResult={confidenceResult}
            riskGuardian={riskGuardian}
            openPositions={openPositions}
            onOpenPosition={handleOpenPosition}
            onClosePosition={handleClosePosition}
            onMoveToBreakeven={handleMoveToBreakeven}
            onCloseAllPositions={handleCloseAllPositions}
          />
        )}

        {currentTab === 'lab' && (
          <PaperLabView
            bots={bots}
            onUpdateBotWeight={handleUpdateBotWeight}
            onSimulateScenario={handleSimulateScenario}
            accountBalance={settings.accountBalance}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newS) => setSettings(s => ({ ...s, ...newS }))}
            onResetAccount={handleResetAccount}
          />
        )}
      </main>
    </div>
  );
}
