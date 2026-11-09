import React from 'react';
import { 
  ConfidenceEngineResult, 
  TradingBot, 
  LiquidityZone, 
  RiskGuardianStatus,
  NavTab 
} from '../types/goldTrading';
import { 
  TrendingUp, 
  TrendingDown, 
  PauseCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Target, 
  Zap, 
  Compass, 
  ArrowRight,
  Info,
  Clock,
  Layers
} from 'lucide-react';

interface LiveOverviewProps {
  currentPrice: number;
  priceChange: number;
  high24h: number;
  low24h: number;
  confidenceResult: ConfidenceEngineResult;
  bots: TradingBot[];
  liquidityZones: LiquidityZone[];
  riskGuardian: RiskGuardianStatus;
  accountBalance: number;
  onNavigate: (tab: NavTab) => void;
  onQuickTrade: (direction: 'BUY' | 'SELL') => void;
}

export const LiveOverview: React.FC<LiveOverviewProps> = ({
  currentPrice,
  priceChange,
  high24h,
  low24h,
  confidenceResult,
  bots,
  liquidityZones,
  riskGuardian,
  accountBalance,
  onNavigate,
  onQuickTrade,
}) => {
  const isPositive = priceChange >= 0;
  const isBuy = confidenceResult.decision === 'BUY';
  const isSell = confidenceResult.decision === 'SELL';
  const isWait = confidenceResult.decision === 'WAIT';

  // Find nearest BSL and SSL zones
  const nearestBSL = liquidityZones.find(z => z.type === 'BSL');
  const nearestSSL = liquidityZones.find(z => z.type === 'SSL');
  const nearestFVG = liquidityZones.find(z => z.type.startsWith('FVG'));

  // Calculate 0.5% risk amount in dollars for preview
  const risk05Amount = (accountBalance * 0.005).toFixed(2);
  const target12Reward = (accountBalance * 0.01).toFixed(2);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-8">
      {/* Simulation Transparency Banner */}
      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">SIMULATED PAPER ENVIRONMENT · </span>
          <span>
            The displayed XAUUSD ticker is simulated. Built-in Live Market Engine is not connected to a real provider yet; do not treat displayed prices or signals as live. Strict 0.5% paper-risk and 1:2 R:R checks remain active.
          </span>
        </div>
      </div>

      {/* Main Gold Hero Card & Master Confidence Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: XAUUSD Live Spot Ticker (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0c1322] to-[#080d17] border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>XAUUSD · Gold Spot / US Dollar</span>
              </div>
              <span className="font-mono text-slate-400">Spread: ~1.8 pips ($0.18)</span>
            </div>

            {/* Price Display */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`text-sm font-mono font-semibold flex items-center gap-0.5 tabular-nums ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{((priceChange / currentPrice) * 100).toFixed(2)}%)
              </span>
            </div>

            {/* 24H Range Strip */}
            <div className="mt-4 pt-3 border-t border-slate-800/70 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">24H High</span>
                <span className="font-mono tabular-nums font-semibold text-slate-200">${high24h.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">24H Low</span>
                <span className="font-mono tabular-nums font-semibold text-slate-200">${low24h.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Terminal Launcher with 0.5% Risk preset */}
          <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-slate-400 block text-[11px]">Enforced 0.5% Risk</span>
              <span className="font-mono font-semibold text-amber-400">${risk05Amount} (1:2 R:R Target: ${target12Reward})</span>
            </div>
            <button
              onClick={() => onNavigate('trading')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Set Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Master Decision & Confidence Engine (7 cols) */}
        <div className="lg:col-span-7 bg-[#0c1322] border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Confidence Engine Consensus
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Updated {confidenceResult.timestamp}
              </span>
            </div>

            {/* Decision Banner (BUY, SELL, WAIT) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              
              <div className="sm:col-span-6 flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
                  isBuy 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                    : isSell 
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                }`}>
                  {isBuy && <TrendingUp className="w-8 h-8" />}
                  {isSell && <TrendingDown className="w-8 h-8" />}
                  {isWait && <PauseCircle className="w-8 h-8" />}
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Master Decision</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {confidenceResult.decision}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {confidenceResult.confidenceLevel.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consensus Percentage Gauge */}
              <div className="sm:col-span-6 bg-slate-900/80 rounded-lg p-3 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Bot Consensus Score</span>
                  <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">
                    {confidenceResult.consensusScore}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isBuy ? 'bg-emerald-500' : isSell ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${confidenceResult.consensusScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                  <span>Min Threshold: 65%</span>
                  <span>{confidenceResult.buyCount} Buy · {confidenceResult.sellCount} Sell · {confidenceResult.waitCount} Wait</span>
                </div>
              </div>
            </div>

            {/* Rationale Prose */}
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-semibold">Consensus Directive: </span>
              {confidenceResult.recommendedAction}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center gap-2">
            <button
              onClick={() => onQuickTrade('BUY')}
              disabled={riskGuardian.isLocked}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                riskGuardian.isLocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Paper BUY (0.5% Risk)</span>
            </button>

            <button
              onClick={() => onQuickTrade('SELL')}
              disabled={riskGuardian.isLocked}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                riskGuardian.isLocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Paper SELL (0.5% Risk)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1H Market Trend & 15M Entry Confirmation Split Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1H Market Trend Analysis */}
        <div className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              1H Market Trend Analysis
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
              confidenceResult.trend1H === 'BULLISH'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : confidenceResult.trend1H === 'BEARISH'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800'
            }`}>
              {confidenceResult.trend1H}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            {confidenceResult.trend1HReason}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Macro Structure: 20 & 50 EMA Alignment</span>
            <span className="text-slate-300 font-mono">Higher Timeframe Anchor</span>
          </div>
        </div>

        {/* 15M Tactical Entry Confirmation */}
        <div className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              15M Tactical Entry Trigger
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
              confidenceResult.entry15M === 'CONFIRMED_BUY'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : confidenceResult.entry15M === 'CONFIRMED_SELL'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {confidenceResult.entry15M.replace('_', ' ')}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            {confidenceResult.entry15MReason}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tactical Trigger: Liquidity Sweep + Displacement</span>
            <span className={`font-semibold ${confidenceResult.confluenceValid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {confidenceResult.confluenceValid ? 'Confluence Synchronized' : 'Awaiting Full Confluence'}
            </span>
          </div>
        </div>
      </div>

      {/* 10 Independent Trading Bots - Voting Breakdown */}
      <div className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              10 Independent Trading Bots Status
            </h3>
            <span className="text-xs text-slate-400">Autonomous multi-algorithmic signal distribution</span>
          </div>
          <button
            onClick={() => onNavigate('ai')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Algorithm Deep-Dive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bots Grid (responsive: 2 cols on mobile, 5 cols on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {bots.map((bot) => {
            const isBotBuy = bot.signal === 'BUY';
            const isBotSell = bot.signal === 'SELL';

            return (
              <div 
                key={bot.id}
                className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-slate-400">{bot.code}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{bot.timeframe}</span>
                </div>
                <div className="font-semibold text-xs text-slate-200 truncate" title={bot.name}>
                  {bot.name}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60">
                  <span className={`text-[11px] font-bold font-mono ${
                    isBotBuy ? 'text-emerald-400' : isBotSell ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {bot.signal}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {bot.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: AI Liquidity Radar & AI Risk Guardian */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* AI Liquidity Radar Widget */}
        <div className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              AI Liquidity Radar (XAUUSD SMC)
            </span>
            <button 
              onClick={() => onNavigate('chart')}
              className="text-amber-400 text-xs font-semibold hover:underline cursor-pointer"
            >
              Open in Chart
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {nearestBSL && (
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-semibold block">{nearestBSL.label}</span>
                  <span className="text-[11px] text-slate-400">Buy-side resting stops above swing high</span>
                </div>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  ${nearestBSL.priceHigh.toFixed(2)}
                </span>
              </div>
            )}

            {nearestFVG && (
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-semibold block">{nearestFVG.label}</span>
                  <span className="text-[11px] text-slate-400">Imbalance zone pending mitigation</span>
                </div>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  ${nearestFVG.priceLow.toFixed(2)} - ${nearestFVG.priceHigh.toFixed(2)}
                </span>
              </div>
            )}

            {nearestSSL && (
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-semibold block">{nearestSSL.label}</span>
                  <span className="text-[11px] text-slate-400">Sell-side resting stops below liquidity pool</span>
                </div>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  ${nearestSSL.priceLow.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Risk Guardian Status */}
        <div className="bg-[#0c1322] border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AI Risk Guardian Circuit Breaker
              </span>
              <span className="text-slate-400 font-mono text-[11px]">Strict 0.5% Mode</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Daily Max Loss Cap</span>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  2.0% ($200.00)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Circuit breaker lock</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Consecutive Loss Guard</span>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  {riskGuardian.consecutiveLosses} / 3 Max
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Risk status healthy</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Target Risk-to-Reward: <strong className="text-white">1:2 R:R</strong></span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-amber-400 hover:text-amber-300 font-semibold text-xs cursor-pointer"
            >
              Configure Risk Limits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
