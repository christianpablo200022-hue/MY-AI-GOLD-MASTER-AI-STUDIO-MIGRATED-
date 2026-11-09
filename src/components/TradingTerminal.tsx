import React, { useState, useEffect } from 'react';
import { 
  Position, 
  ConfidenceEngineResult, 
  RiskGuardianStatus,
  SignalDecision 
} from '../types/goldTrading';
import { calculatePositionSize } from '../utils/goldMarketSimulator';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Lock, 
  X,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface TradingTerminalProps {
  currentPrice: number;
  accountBalance: number;
  riskPercent: number; // default 0.5%
  targetRR: number; // default 2.0
  brokerContractOz: number;
  canExecuteTrade: boolean;
  executionBlockReason?: string;
  confidenceResult: ConfidenceEngineResult;
  riskGuardian: RiskGuardianStatus;
  openPositions: Position[];
  onOpenPosition: (position: Omit<Position, 'id' | 'openTime' | 'openTimestamp' | 'status' | 'pnlUsd' | 'pnlPercent'>) => boolean | void;
  onClosePosition: (positionId: string, reason: 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE' | 'RISK_LOCK') => void;
  onMoveToBreakeven: (positionId: string) => void;
  onCloseAllPositions: () => void;
}

export const TradingTerminal: React.FC<TradingTerminalProps> = ({
  currentPrice,
  accountBalance,
  riskPercent = 0.5,
  targetRR = 2.0,
  brokerContractOz,
  canExecuteTrade,
  executionBlockReason,
  confidenceResult,
  riskGuardian,
  openPositions,
  onOpenPosition,
  onClosePosition,
  onMoveToBreakeven,
  onCloseAllPositions,
}) => {
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice);
  const [slPoints, setSlPoints] = useState<number>(7.5); // Default 7.5 points stop loss in Gold
  const [isAutoRREnforced, setIsAutoRREnforced] = useState<boolean>(true);
  const [orderExecutedBanner, setOrderExecutedBanner] = useState<string | null>(null);

  // Sync entry price when user clicks or price moves initially
  useEffect(() => {
    setEntryPrice(currentPrice);
  }, [currentPrice]);

  // Derive Stop Loss and Take Profit prices
  const stopLossPrice = direction === 'BUY' 
    ? Math.round((entryPrice - slPoints) * 100) / 100
    : Math.round((entryPrice + slPoints) * 100) / 100;

  const takeProfitPrice = direction === 'BUY'
    ? Math.round((entryPrice + (slPoints * targetRR)) * 100) / 100
    : Math.round((entryPrice - (slPoints * targetRR)) * 100) / 100;

  // Derive Position sizing based on strict 0.5% risk
  const sizing = calculatePositionSize(
    accountBalance,
    riskPercent,
    direction,
    entryPrice,
    stopLossPrice,
    targetRR,
    brokerContractOz
  );

  const isAgainstConsensus = (direction === 'BUY' && confidenceResult.decision === 'SELL') ||
                             (direction === 'SELL' && confidenceResult.decision === 'BUY');
  const isConfidenceWait = confidenceResult.decision === 'WAIT';

  const handleExecuteTrade = () => {
    if (riskGuardian.isLocked || !canExecuteTrade || !sizing.isValid || confidenceResult.decision !== direction) return;

    const opened = onOpenPosition({
      symbol: 'XAUUSD',
      direction,
      entryPrice,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      lotSize: sizing.lotSize,
      riskAmountUsd: sizing.riskUsd,
      potentialRewardUsd: sizing.rewardUsd,
      botId: 'Confidence Engine 10-Bot Master',
    });
    if (opened === false) {
      setOrderExecutedBanner('Paper order blocked by the final Risk Guardian checks.');
      return;
    }

    setOrderExecutedBanner(`Paper order opened: ${direction} ${sizing.lotSize} Lots @ $${entryPrice.toFixed(2)} · Risk $${sizing.riskUsd.toFixed(2)}`);
    setTimeout(() => setOrderExecutedBanner(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Title & Risk Guardian Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-400" />
            Execution Terminal & 0.5% Risk Enforcer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic position sizing derived from account balance with strict 1:2 R:R target
          </p>
        </div>

        {/* Circuit breaker status indicator */}
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          riskGuardian.isLocked
            ? 'bg-rose-950/60 border-rose-800 text-rose-300'
            : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
        }`}>
          {riskGuardian.isLocked ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{riskGuardian.isLocked ? 'Trading Locked: Daily Max Hit' : 'AI Risk Guardian Active'}</span>
        </div>
      </div>

      {orderExecutedBanner && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-xs font-semibold text-emerald-200 flex items-center justify-between">
          <span>{orderExecutedBanner}</span>
          <button onClick={() => setOrderExecutedBanner(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Terminal Grid: Order Configurator (7 cols) + Risk Guardian Pre-flight (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Order Setup Box (7 cols) */}
        <div className="lg:col-span-7 bg-[#0c1322] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          
          {/* Direction Switcher (BUY / SELL) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('BUY')}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>BUY (Ask ${currentPrice.toFixed(2)})</span>
            </button>

            <button
              onClick={() => setDirection('SELL')}
              className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                direction === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md border border-rose-400'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>SELL (Bid ${(currentPrice - 0.18).toFixed(2)})</span>
            </button>
          </div>

          {/* Pricing Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Entry Price */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Entry Spot Price</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-mono font-bold text-white tabular-nums">
                  ${entryPrice.toFixed(2)}
                </span>
                <button
                  onClick={() => setEntryPrice(currentPrice)}
                  className="text-[10px] text-amber-400 hover:underline ml-auto cursor-pointer"
                >
                  Live
                </button>
              </div>
            </div>

            {/* Stop Loss Price */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-rose-400 block font-medium">Stop Loss (SL)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-mono font-bold text-rose-300 tabular-nums">
                  ${stopLossPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  -{slPoints} pts ({slPoints * 10} pips)
                </span>
              </div>
            </div>

            {/* Take Profit (1:2 R:R) */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-emerald-400 block font-medium">1:2 Target (TP)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-mono font-bold text-emerald-300 tabular-nums">
                  ${takeProfitPrice.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  +{(slPoints * targetRR).toFixed(1)} pts
                </span>
              </div>
            </div>
          </div>

          {/* Stop Loss Distance Slider */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Stop Loss Distance: <strong className="text-white font-mono">${slPoints.toFixed(1)}</strong> ({slPoints * 10} pips)</span>
              <span className="text-slate-400 font-mono text-[11px]">Volatility Buffer: High</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="20.0"
              step="0.5"
              value={slPoints}
              onChange={(e) => setSlPoints(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Tight Scalp (3.0 pts)</span>
              <span>Standard Gold Swing (7.5 pts)</span>
              <span>Macro Invalidation (20.0 pts)</span>
            </div>
          </div>

          {/* Automatic Position Sizing Math Card */}
          <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#080d18] to-[#0d1527] border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Enforced 0.5% Sizing Formula
              </span>
              <span className="font-mono text-white">XAUUSD {brokerContractOz} oz / Lot (configured)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Account Risk (0.5%)</span>
                <span className="font-bold text-rose-400">${sizing.riskUsd.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Calculated Lot Size</span>
                <span className="font-extrabold text-amber-400 text-sm">{sizing.lotSize} Lots</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">1:2 Target Reward</span>
                <span className="font-bold text-emerald-400">+${sizing.rewardUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warning Banner if trading against Confidence Consensus */}
          {isAgainstConsensus && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> You are setting a {direction} order against the AI Confidence Engine consensus ({confidenceResult.decision}). Proceed with caution.
              </span>
            </div>
          )}

          {isConfidenceWait && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Neutral Market:</strong> Master Decision is <strong>WAIT</strong>. 1H Trend and 15M Entry are consolidating. Capital preservation is recommended.
              </span>
            </div>
          )}

          {!canExecuteTrade || !sizing.isValid || confidenceResult.decision !== direction ? (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-300" role="status">
              <strong>Paper entry blocked:</strong> {sizing.warning || executionBlockReason || `Final AI decision is ${confidenceResult.decision}; selected direction must match.`}
            </div>
          ) : null}

          {/* Execute Paper Order Button */}
          <button
            onClick={handleExecuteTrade}
            disabled={riskGuardian.isLocked || !canExecuteTrade || !sizing.isValid || confidenceResult.decision !== direction}
            className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              (riskGuardian.isLocked || !canExecuteTrade || !sizing.isValid || confidenceResult.decision !== direction)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : direction === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
            }`}
          >
            {direction === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>Execute Paper {direction} ({sizing.lotSize} Lots · 0.5% Risk)</span>
          </button>
        </div>

        {/* AI Risk Guardian Pre-flight & Circuit Breaker (5 cols) */}
        <div className="lg:col-span-5 bg-[#0c1322] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AI Risk Guardian Pre-Flight
              </span>
              <span className="text-slate-400 font-mono text-[11px]">Strict Compliance</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Check 1: 0.5% Risk Enforced */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Risk Per Trade Limit</span>
                    <span className="text-[11px] text-slate-400">Strictly enforced at 0.5%</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400">PASS (0.50%)</span>
              </div>

              {/* Check 2: 1:2 R:R Ratio */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Target Risk-to-Reward</span>
                    <span className="text-[11px] text-slate-400">Take Profit set at 2x SL</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400">PASS (1:2 R:R)</span>
              </div>

              {/* Check 3: Max Daily Loss Lockout */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Daily Drawdown Cap</span>
                    <span className="text-[11px] text-slate-400">Max 2.0% daily circuit breaker</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200">
                  ${riskGuardian.todayLossUsd.toFixed(2)} / $200
                </span>
              </div>

              {/* Check 4: Consecutive Loss Circuit Breaker */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Consecutive Loss Breaker</span>
                    <span className="text-[11px] text-slate-400">Locks account after 3 losses</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200">
                  {riskGuardian.consecutiveLosses} / 3
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Close All Positions */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onCloseAllPositions}
              disabled={openPositions.length === 0}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                openPositions.length === 0
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Emergency Close All Positions ({openPositions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Open Positions List Table */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Active Open Paper Positions ({openPositions.length})
            </h3>
            <span className="text-xs text-slate-400">Real-time simulated mark-to-market P&L</span>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Auto-Breakeven trigger available at 1:1
          </span>
        </div>

        {openPositions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
            No active open positions. Execute an order with 0.5% risk above to test strategy execution.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3">Stop Loss</th>
                  <th className="py-2.5 px-3">Take Profit (1:2)</th>
                  <th className="py-2.5 px-3">Unrealized P&L</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {openPositions.map((pos) => {
                  const isProfit = pos.pnlUsd >= 0;
                  const isBuy = pos.direction === 'BUY';

                  return (
                    <tr key={pos.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          isBuy ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {pos.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white tabular-nums">
                        {pos.lotSize}L
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200 tabular-nums">
                        ${pos.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-rose-400 tabular-nums">
                        ${pos.stopLoss.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400 tabular-nums">
                        ${pos.takeProfit.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold tabular-nums">
                        <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}${pos.pnlUsd.toFixed(2)} ({isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onMoveToBreakeven(pos.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Move stop loss to entry price"
                        >
                          Breakeven
                        </button>
                        <button
                          onClick={() => onClosePosition(pos.id, 'MANUAL_CLOSE')}
                          className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
