<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e6e0a382-3630-40aa-ad51-24efb78ee418

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Phase 1 Safety Update (2026-11-09)

This version contains a first-pass safety patch in a separate working copy. The original uploaded ZIP was preserved.

### Changes
- Position sizing now rounds DOWN to the configured 0.01 lot step and blocks when the minimum lot would exceed the 0.5% risk ceiling.
- Position sizing rejects invalid inputs, risk settings above 0.5%, and missing/non-positive contract multipliers.
- The configured contract multiplier is passed consistently into the Trading Terminal, paper order sizing, and paper P&L calculations. It is explicitly **not broker-verified** because no live broker connection exists.
- All paper entries pass through a final fail-closed gate: final Confidence Engine direction, data quality, news filter, session filter, spread/volatility proxy, signal validity, anti-overtrading, risk lock, R:R, and sizing.
- The daily trade counter reserves an entry slot when a position opens (maximum 3), persists the daily Risk Guardian state in browser storage, and resets on the UTC date change.
- Signal invalidation uses a fixed price reference captured when the directional signal changes, rather than a stop level that moves with every tick.
- Data quality now checks 1H and 15M timestamp sequence/interval continuity and treats abnormal candle gaps as a hard WAIT condition.
- TP/SL paper exits use the simulator's trigger price; position close side effects were moved outside the React state updater.
- Added safety regression tests under `tests/` and an `npm test` script.

### Important limitations
- This remains a synthetic paper-trading simulator. It does not have a live XAUUSD feed or broker execution connection.
- The 100 oz default is a configured assumption, not a verified broker contract specification. Confirm the actual contract size with the broker before relying on any lot-size calculation.
- Spread remains a simulated proxy. News events and market candles are not verified live external data.
- Historical backtesting, Gemini historical-statistics integrity, persistent strategy memory, and the broader Phase 2–5 roadmap have not been implemented in this patch.
- Do not use this application to place live trades. No live-trading safety or profitability is claimed.

### Validation
- TypeScript/TSX syntax parse: passed for all source and test files.
- Focused runtime checks for position sizing and data-quality fail-closed behavior: passed using the globally available TypeScript transpiler.
- Full `npm install`, project type-check, production build, and `npm test` were not completed because dependency installation timed out in this environment. Re-run them after dependencies are installed locally.

## Phase 2 Foundation (2026-11-09)

### Added in this step
- Provider-neutral `XauusdMarketDataAdapter` contract. No broker/provider has been selected or connected.
- Strict XAUUSD quote validation: DEMO/UNAVAILABLE quotes cannot be reported as live; invalid, stale, future-dated, or crossed bid/ask quotes return `WAIT`.
- OHLC candle integrity checks for invalid values, malformed ranges, duplicate/out-of-order timestamps, missing intervals, and stale candles.
- UTC candle aggregation from contiguous lower-timeframe candles into complete 15M or 1H candles; incomplete buckets are omitted.
- Broker specification validation requiring positive contract/tick/lot values and explicit evidence plus verification timestamp.
- Focused Phase 2 regression tests.

### Important scope boundary
This is a **data-integrity foundation only**. It does not connect to MT5, cTrader, TradingView, a broker, or a market-data vendor. No API key, password, account login, or secret is required or stored. Until a provider is selected and a real adapter is implemented and tested, the application must continue to identify its market data as synthetic/demo and must not claim live feed readiness. The broker contract size and trading costs remain unverified. This phase does not enable live order execution.

### Verification status
Source-level checks and focused tests for the new integrity module are pending in this environment; full dependency install, application build, and browser integration are not yet verified.


## Built-in Live Market Engine foundation

The backend exposes read-only endpoints:
- `GET /api/market/status` — quote/provider health.
- `GET /api/market/candles/15M?limit=200` — validated closed 15M candles.
- `GET /api/market/candles/1H?limit=200` — validated closed 1H candles.

No live provider is selected in this package. Until a provider adapter is implemented and configured, the engine deliberately returns `WAIT` / `UNAVAILABLE` and never substitutes the paper simulator's prices. A provider and its terms/credentials must be selected separately before live-feed testing.
