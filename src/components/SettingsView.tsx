import React, { useState } from 'react';
import { RiskSettings } from '../types/goldTrading';
import { 
  Settings as SettingsIcon, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  DollarSign, 
  Sliders, 
  Cpu, 
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface SettingsViewProps {
  settings: RiskSettings;
  onUpdateSettings: (newSettings: Partial<RiskSettings>) => void;
  onResetAccount: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAccount,
}) => {
  const [balanceInput, setBalanceInput] = useState<string>(settings.accountBalance.toString());
  const [saveBanner, setSaveBanner] = useState<boolean>(false);

  const handleSaveBalance = () => {
    const parsed = parseFloat(balanceInput);
    if (!isNaN(parsed) && parsed >= 500) {
      onUpdateSettings({ accountBalance: parsed });
      setSaveBanner(true);
      setTimeout(() => setSaveBanner(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-20 md:pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-amber-400" />
            System & Risk Guardian Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure capital allocation, 0.5% risk enforcement, and simulated engine telemetry
          </p>
        </div>

        {saveBanner && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved
          </span>
        )}
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase font-mono">
          <Info className="w-4 h-4" />
          <span>Simulated Environment & Transparent Disclosure</span>
        </div>
        <p className="leading-relaxed">
          MY AI GOLD MASTER operates entirely within a <strong>simulated market environment</strong>. All XAUUSD prices, candlestick patterns, and backtesting metrics are simulated for systematic model verification and disciplined capital risk practice. No real financial capital is at risk.
        </p>
      </div>

      {/* Section 1: Account Capital & Leverage */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-400" />
          Simulated Trading Account Balance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs block mb-1.5 font-medium">Account Balance (USD)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                onClick={handleSaveBalance}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Update
              </button>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1 font-mono">
              0.5% Risk on this balance = ${(parseFloat(balanceInput || '0') * 0.005).toFixed(2)}
            </span>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1.5 font-medium">Simulated Broker Leverage</label>
            <select
              value={settings.leverage}
              onChange={(e) => onUpdateSettings({ leverage: parseInt(e.target.value) })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="50">1:50 Institutional</option>
              <option value="100">1:100 Standard (Recommended)</option>
              <option value="200">1:200 High Leverage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: AI Risk Guardian Enforcers */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Strict Risk Guardian Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Risk per trade */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Risk Per Trade</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold font-mono text-amber-400">
                {settings.riskPercentPerTrade}% Account Equity
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">
                ENFORCED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Guarantees the trader survives prolonged 20-trade drawdowns with less than 10% total equity impact.
            </p>
          </div>

          {/* Target R:R */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Target Risk-to-Reward Ratio</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold font-mono text-emerald-400">
                1:{settings.targetRiskReward} R:R Target
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold">
                AUTOMATIC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Automatically locks Take Profit at double the Stop Loss distance for asymmetric positive expectancy.
            </p>
          </div>

          {/* Daily Drawdown Lockout */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Daily Max Loss Circuit Breaker</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold font-mono text-rose-400">
                {settings.maxDailyDrawdownPercent}% Daily Cap
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ${(settings.accountBalance * (settings.maxDailyDrawdownPercent / 100)).toFixed(2)} Max Loss
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Halts all paper trading for 24 hours if hit, protecting capital from tilt or extreme news slippage.
            </p>
          </div>

          {/* Consecutive Loss Circuit Breaker */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Consecutive Loss Lock</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold font-mono text-white">
                {settings.consecutiveLossLimit} Consecutive Losses
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Cooldown Trigger</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Forces a timeout after 3 stop losses to re-align with 1H trend rather than fighting the tape.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Tick Engine Speed & Simulation Reset */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Tick Engine Speed & Data Reset
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs block mb-1.5 font-medium">Simulation Tick Speed</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Slow (3s)', val: 3000 },
                { label: 'Normal (1.5s)', val: 1500 },
                { label: 'Fast (0.7s)', val: 750 },
              ].map((sp) => (
                <button
                  key={sp.val}
                  onClick={() => onUpdateSettings({ tickSpeedMs: sp.val })}
                  className={`py-2 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer ${
                    settings.tickSpeedMs === sp.val
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={onResetAccount}
              className="py-2.5 px-4 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Paper Account & Positions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
