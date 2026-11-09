import React from 'react';
import { NavTab } from '../types/goldTrading';
import { 
  Activity, 
  Cpu, 
  FlaskConical, 
  CandlestickChart, 
  TrendingUp, 
  Settings, 
  ShieldCheck, 
  ShieldAlert,
  Wallet
} from 'lucide-react';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  accountBalance: number;
  isRiskLocked: boolean;
  openPositionsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  accountBalance,
  isRiskLocked,
  openPositionsCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'live', label: 'Live', icon: Activity },
    { id: 'ai', label: 'AI', icon: Cpu },
    { id: 'lab', label: 'Paper Lab', icon: FlaskConical },
    { id: 'chart', label: 'Chart', icon: CandlestickChart },
    { id: 'trading', label: 'Trading', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <span className="text-slate-950 font-black text-sm tracking-tight">Au</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                MY AI GOLD MASTER
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono -mt-1 hidden sm:inline">
                XAUUSD · 0.5% RISK ENGINE
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (hidden on mobile, visible on desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.id === 'trading' && openPositionsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full">
                      {openPositionsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Account Status & Risk Guardian indicator */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Risk Guardian status pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              isRiskLocked 
                ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}>
              {isRiskLocked ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span className="whitespace-nowrap">{isRiskLocked ? 'Risk Lock Active' : '0.5% Risk Guard'}</span>
            </div>

            {/* Account Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
              <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono tabular-nums font-semibold text-white">
                ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Direct Quick Action button */}
            <button
              onClick={() => onSelectTab('trading')}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              Order Terminal
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Android Bottom Navigation Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1d]/95 backdrop-blur-lg border-t border-slate-800/90 px-1 py-1.5 pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-6 gap-0.5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors cursor-pointer min-h-[48px] relative ${
                  isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : 'text-slate-400'}`} />
                  {item.id === 'trading' && openPositionsCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full min-w-3.5 h-3.5 flex items-center justify-center">
                      {openPositionsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
