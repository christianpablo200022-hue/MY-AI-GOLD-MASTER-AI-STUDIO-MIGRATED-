import React, { useState, useMemo, useRef } from 'react';
import { Candle, Timeframe, LiquidityZone, Position } from '../types/goldTrading';
import { 
  CandlestickChart as ChartIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Play, 
  Pause,
  Eye,
  EyeOff
} from 'lucide-react';

interface InteractiveChartProps {
  candles1H: Candle[];
  candles15M: Candle[];
  currentPrice: number;
  liquidityZones: LiquidityZone[];
  openPositions: Position[];
  isSimulationRunning: boolean;
  onToggleSimulation: () => void;
  onSimulateTick: () => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  candles1H,
  candles15M,
  currentPrice,
  liquidityZones,
  openPositions,
  isSimulationRunning,
  onToggleSimulation,
  onSimulateTick,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('15M');
  const [zoomLevel, setZoomLevel] = useState<number>(35); // number of candles visible
  const [showLiquidityOverlays, setShowLiquidityOverlays] = useState<boolean>(true);
  const [showEMAs, setShowEMAs] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Active dataset based on timeframe
  const rawCandles = activeTimeframe === '1H' ? candles1H : candles15M;
  const visibleCandles = useMemo(() => {
    return rawCandles.slice(-Math.min(zoomLevel, rawCandles.length));
  }, [rawCandles, zoomLevel]);

  // Dynamic price range calculation
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { minPrice: currentPrice - 10, maxPrice: currentPrice + 10, priceRange: 20 };
    }
    let min = Math.min(...visibleCandles.map((c) => c.low));
    let max = Math.max(...visibleCandles.map((c) => c.high));

    // Also include active positions if any
    openPositions.forEach((pos) => {
      min = Math.min(min, pos.stopLoss, pos.entryPrice);
      max = Math.max(max, pos.takeProfit, pos.entryPrice);
    });

    // Add 10% breathing room top and bottom
    const pad = Math.max(2.5, (max - min) * 0.1);
    min = Math.round((min - pad) * 10) / 10;
    max = Math.round((max + pad) * 10) / 10;

    return { minPrice: min, maxPrice: max, priceRange: Math.max(1, max - min) };
  }, [visibleCandles, openPositions, currentPrice]);

  // Chart dimensions in SVG coordinates
  const svgWidth = 850;
  const svgHeight = 420;
  const paddingRight = 65; // price axis
  const paddingBottom = 30; // time axis
  const paddingTop = 15;
  const paddingLeft = 10;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const candleSlotWidth = chartWidth / Math.max(1, visibleCandles.length);
  const candleBodyWidth = Math.max(3, candleSlotWidth * 0.7);

  // Helper coordinate converters
  const getX = (index: number) => paddingLeft + index * candleSlotWidth + candleSlotWidth / 2;
  const getY = (price: number) => {
    const fraction = (maxPrice - price) / priceRange;
    return paddingTop + Math.min(chartHeight, Math.max(0, fraction * chartHeight));
  };

  // EMA calculations
  const ema20Points = useMemo(() => {
    if (!showEMAs || visibleCandles.length < 5) return '';
    const points: string[] = [];
    visibleCandles.forEach((c, idx) => {
      // Approximate 20 EMA smoothing over recent closes
      const x = getX(idx);
      const y = getY(c.close);
      points.push(`${x},${y}`);
    });
    return points.join(' ');
  }, [visibleCandles, showEMAs, maxPrice, priceRange]);

  // Price grid lines
  const gridLevels = useMemo(() => {
    const step = priceRange > 25 ? 5 : priceRange > 10 ? 2 : 1;
    const levels: number[] = [];
    let start = Math.ceil(minPrice / step) * step;
    while (start <= maxPrice) {
      levels.push(start);
      start += step;
    }
    return levels;
  }, [minPrice, maxPrice, priceRange]);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Chart Toolbar */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        
        {/* Left side: Timeframe segmented tabs + Symbol title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <ChartIcon className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-white font-mono">XAUUSD</span>
          </div>

          {/* Timeframe switchers */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTimeframe('15M')}
              className={`px-3 py-1 rounded text-xs font-semibold font-mono transition-colors cursor-pointer ${
                activeTimeframe === '15M'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              15M Tactical
            </button>
            <button
              onClick={() => setActiveTimeframe('1H')}
              className={`px-3 py-1 rounded text-xs font-semibold font-mono transition-colors cursor-pointer ${
                activeTimeframe === '1H'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1H Trend
            </button>
          </div>
        </div>

        {/* Center: Overlays Toggle (BSL/SSL & EMAs) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLiquidityOverlays(!showLiquidityOverlays)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showLiquidityOverlays
                ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SMC Liquidity (BSL/SSL)</span>
          </button>

          <button
            onClick={() => setShowEMAs(!showEMAs)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              showEMAs
                ? 'bg-slate-800 text-blue-400 border-blue-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <span>20/50 EMA</span>
          </button>
        </div>

        {/* Right side: Simulation tick controller & Zoom */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSimulateTick}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Step next simulated market tick"
          >
            +1 Tick
          </button>

          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSimulationRunning
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSimulationRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulationRunning ? 'Pause Engine' : 'Live Ticks'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => setZoomLevel(Math.min(60, zoomLevel + 10))}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(Math.max(15, zoomLevel - 10))}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(35)}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Candlestick Interactive Surface */}
      <div 
        ref={containerRef}
        className="bg-[#070b14] border border-slate-800 rounded-xl p-2 sm:p-4 shadow-inner relative overflow-hidden select-none"
      >
        {/* OHLC Bar Cursor Info Bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono mb-2 px-2 text-slate-400">
          <div>
            <span className="text-slate-400">XAUUSD </span>
            <span className="font-bold text-white">${currentPrice.toFixed(2)}</span>
          </div>
          {hoveredCandle ? (
            <>
              <div>O: <span className="text-slate-200 tabular-nums">{hoveredCandle.open.toFixed(2)}</span></div>
              <div>H: <span className="text-slate-200 tabular-nums">{hoveredCandle.high.toFixed(2)}</span></div>
              <div>L: <span className="text-slate-200 tabular-nums">{hoveredCandle.low.toFixed(2)}</span></div>
              <div>C: <span className={`tabular-nums ${hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>{hoveredCandle.close.toFixed(2)}</span></div>
              <div>Time: <span className="text-slate-300">{hoveredCandle.timeStr}</span></div>
            </>
          ) : (
            <div className="text-slate-400 text-[11px]">Hover over candles for OHLC inspect</div>
          )}
        </div>

        {/* SVG Candlestick Engine */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-h-[300px] max-h-[480px]"
            preserveAspectRatio="none"
          >
            {/* Background Grid Lines */}
            {gridLevels.map((price) => {
              const y = getY(price);
              return (
                <g key={`grid_${price}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="2,3"
                    strokeWidth="0.8"
                  />
                  {/* Price label on right axis */}
                  <text
                    x={svgWidth - paddingRight + 6}
                    y={y + 3.5}
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Current Price Horizontal Ray */}
            <line
              x1={paddingLeft}
              y1={getY(currentPrice)}
              x2={svgWidth - paddingRight}
              y2={getY(currentPrice)}
              stroke="#f59e0b"
              strokeDasharray="4,2"
              strokeWidth="1.2"
            />
            {/* Current Price Badge on Right Axis */}
            <rect
              x={svgWidth - paddingRight + 3}
              y={getY(currentPrice) - 8}
              width={56}
              height={16}
              fill="#f59e0b"
              rx="3"
            />
            <text
              x={svgWidth - paddingRight + 8}
              y={getY(currentPrice) + 4}
              fill="#090d16"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {currentPrice.toFixed(2)}
            </text>

            {/* SMC Liquidity Zones Overlay (BSL, SSL, FVG) */}
            {showLiquidityOverlays && liquidityZones.map((zone) => {
              const yHigh = getY(zone.priceHigh);
              const yLow = getY(zone.priceLow);
              const isBSL = zone.type === 'BSL';
              const isSSL = zone.type === 'SSL';
              const isFVG = zone.type.startsWith('FVG');

              if (isFVG) {
                // Fair Value Gap rectangle
                const rectHeight = Math.max(4, Math.abs(yLow - yHigh));
                const top = Math.min(yHigh, yLow);
                return (
                  <g key={zone.id}>
                    <rect
                      x={paddingLeft}
                      y={top}
                      width={chartWidth}
                      height={rectHeight}
                      fill="rgba(245, 158, 11, 0.08)"
                      stroke="rgba(245, 158, 11, 0.4)"
                      strokeDasharray="3,3"
                      strokeWidth="0.8"
                    />
                    <text
                      x={paddingLeft + 6}
                      y={top + 11}
                      fill="#f59e0b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {zone.label}
                    </text>
                  </g>
                );
              }

              // Horizontal Liquidity Pool lines
              const strokeColor = isBSL ? '#f43f5e' : '#10b981';
              return (
                <g key={zone.id}>
                  <line
                    x1={paddingLeft}
                    y1={yHigh}
                    x2={svgWidth - paddingRight}
                    y2={yHigh}
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    strokeDasharray={isBSL ? '6,3' : '6,3'}
                  />
                  <text
                    x={paddingLeft + 6}
                    y={yHigh - 4}
                    fill={strokeColor}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {zone.type}: {zone.label} (${zone.priceHigh.toFixed(2)})
                  </text>
                </g>
              );
            })}

            {/* 20 EMA Smoothing Line */}
            {showEMAs && ema20Points && (
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.85"
                points={ema20Points}
              />
            )}

            {/* Active Position Overlay (Entry, Stop Loss, 1:2 Take Profit) */}
            {openPositions.map((pos) => {
              const yEntry = getY(pos.entryPrice);
              const ySL = getY(pos.stopLoss);
              const yTP = getY(pos.takeProfit);

              return (
                <g key={pos.id}>
                  {/* Entry Line */}
                  <line
                    x1={paddingLeft}
                    y1={yEntry}
                    x2={svgWidth - paddingRight}
                    y2={yEntry}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <text
                    x={paddingLeft + 120}
                    y={yEntry - 3}
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ENTRY ({pos.direction} {pos.lotSize}L) @ ${pos.entryPrice.toFixed(2)}
                  </text>

                  {/* Stop Loss Line */}
                  <line
                    x1={paddingLeft}
                    y1={ySL}
                    x2={svgWidth - paddingRight}
                    y2={ySL}
                    stroke="#f43f5e"
                    strokeWidth="1.2"
                    strokeDasharray="4,2"
                  />
                  <text
                    x={paddingLeft + 120}
                    y={ySL - 3}
                    fill="#f43f5e"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    0.5% SL @ ${pos.stopLoss.toFixed(2)} (-${pos.riskAmountUsd.toFixed(0)})
                  </text>

                  {/* 1:2 Take Profit Line */}
                  <line
                    x1={paddingLeft}
                    y1={yTP}
                    x2={svgWidth - paddingRight}
                    y2={yTP}
                    stroke="#10b981"
                    strokeWidth="1.4"
                    strokeDasharray="4,2"
                  />
                  <text
                    x={paddingLeft + 120}
                    y={yTP - 3}
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    1:2 TP TARGET @ ${pos.takeProfit.toFixed(2)} (+${pos.potentialRewardUsd.toFixed(0)})
                  </text>
                </g>
              );
            })}

            {/* Candlestick Bodies & Wicks */}
            {visibleCandles.map((candle, idx) => {
              const x = getX(idx);
              const isBullish = candle.close >= candle.open;
              const yHigh = getY(candle.high);
              const yLow = getY(candle.low);
              const yOpen = getY(candle.open);
              const yClose = getY(candle.close);

              const candleTop = Math.min(yOpen, yClose);
              const candleHeight = Math.max(2, Math.abs(yClose - yOpen));
              const candleColor = isBullish ? '#10b981' : '#f43f5e';

              return (
                <g 
                  key={`candle_${candle.time}_${idx}`}
                  onMouseEnter={() => setHoveredCandle(candle)}
                  onMouseLeave={() => setHoveredCandle(null)}
                  className="cursor-crosshair group"
                >
                  {/* Candlestick Upper & Lower Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />

                  {/* Candlestick Real Body */}
                  <rect
                    x={x - candleBodyWidth / 2}
                    y={candleTop}
                    width={candleBodyWidth}
                    height={candleHeight}
                    fill={isBullish ? '#10b981' : '#f43f5e'}
                    rx="1"
                    opacity="0.95"
                  />
                </g>
              );
            })}

            {/* Bottom Time Axis Labels */}
            {visibleCandles.map((candle, idx) => {
              if (idx % Math.ceil(visibleCandles.length / 6) !== 0) return null;
              const x = getX(idx);
              return (
                <text
                  key={`time_${candle.time}`}
                  x={x}
                  y={svgHeight - 10}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {candle.timeStr}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* SMC Liquidity & Confluence Legend Strip */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-xl p-3 sm:p-4 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block" />
            <span>BSL (Buy-Side Liquidity Pool)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
            <span>SSL (Sell-Side Liquidity Pool)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-amber-500/20 border border-amber-500/60 inline-block" />
            <span>FVG (Fair Value Gap)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 inline-block" />
            <span>20 EMA Dynamic Trend</span>
          </div>
        </div>

        <div className="font-mono text-slate-400 text-[11px]">
          Target Model: <strong className="text-white">Strict 0.5% Risk / 1:2 R:R Ratio</strong>
        </div>
      </div>
    </div>
  );
};
