# 05 · Dependencies

## 1. Runtime (the app)

| Dependency | Use | Notes |
|---|---|---|
| Modern browser (Chrome, Edge, Firefox, Safari; last 2 versions) | Runs the app | Needs ES modules, `localStorage`, service workers, canvas |
| A static HTTP server | Serves the files | ES modules don't load from `file://`. `launch.bat` uses Python's `http.server` |
| Chart.js 4.4.4 (vendored, `assets/vendor/chart.umd.min.js`) | Trend charts | Loaded as a classic script; global `Chart` |
| Fonts (vendored, `assets/fonts/`) | Typography | `saira-condensed.woff2` and `hanken-grotesk.woff2` (SIL OFL 1.1; see `assets/fonts/README.md`) |
| Engine scripts (after merge, `engine/`) | Forecast model and synthetic history | UMD files that set `window.DataEngine`, `ForecastEngine`, `LANDFALL_MODEL`, `LandfallML` |

No backend, database, API key or runtime network call.

## 2. Development

| Tool | Version | Use |
|---|---|---|
| Node.js | 22 or newer (the test script uses glob patterns) | `npm test`, `npm run check`, evaluation harness |
| Python | 3.10 or newer | `launch.bat` server; engine training scripts |
| Python packages | `engine/ml/requirements.txt` | Only to retrain the model. **The file is saved as UTF-16 with a BOM** (git treats it as binary) and looks like a full `pip freeze` of one machine. Re-save as UTF-8 and trim it to the packages the scripts import: `numpy`, `pandas`, `scikit-learn`, `matplotlib`, with versions (`root_mean_squared_error` needs scikit-learn 1.4 or newer) |
| Git and GitHub | — | Repo `omaggarwal-2006/astrix` |
| VS Code (optional) | — | Live Server works as an alternative to `launch.bat` |

`package.json` holds **scripts only**, no dependencies (nothing to `npm install`):

```json
{
  "name": "landfall",
  "version": "2.0.0",
  "private": true,
  "description": "LANDFALL: delay-aware astronaut health decisions (NASA Space Apps 2026). Static ES-module app, no build step.",
  "type": "module",
  "scripts": {
    "serve": "python -m http.server 8080",
    "test": "node --test \"tests/unit/**/*.test.mjs\" \"tests/integration/**/*.test.mjs\"",
    "test:smoke": "node tests/smoke/ui-check.mjs",
    "build:sw": "node scripts/build-sw-manifest.mjs",
    "check": "node scripts/build-sw-manifest.mjs --check && node scripts/check-links.mjs",
    "check:links": "node scripts/check-links.mjs"
  },
  "engines": {
    "node": ">=22"
  }
}
```

| Script | Does |
|---|---|
| `npm test` | Unit and integration tests with Node's built-in runner |
| `npm run test:smoke` | String check that the 16 UI features exist (not a behaviour test) |
| `npm run build:sw` | Regenerates `src/sw-manifest.js` (run after adding, moving or deleting a runtime file) |
| `npm run check` | Fails if the service-worker manifest is stale or any doc link is broken |
| `npm run serve` | Static server on port 8080 (`launch.bat` does this on Windows with a free port) |

CI (`.github/workflows/ci.yml`) runs `npm test`, `npm run test:smoke` and `npm run check` on every push and pull request.

## 3. Module dependencies (as-built)

```
src/main.js ──► src/app/state.js, src/app/router.js, every src/ui module (wires them together)
src/app/state.js ──► nothing (tabs and header register renderers into it)
src/app/router.js ──► state
src/ui/** ──► state, router, src/core/* (adapter, queue, pipeline, triage, packet, sources, delay), src/data/sample-alert.js
src/core/adapter.js ──► src/data/sample-data.js
src/core/pipeline.js ──► triage, packet, queue
src/core/triage.js, queue.js, delay.js ──► config
src/core/** ──► never imports src/app or src/ui
```

## 4. Module dependencies (v2 target)

```
config.js ◄──────────────────────────── every core module
delay.js ◄── triage.js, run-day.js, src/ui/header, src/ui/visuals/mission-scene
adapter.js ──► engine globals (optional) │ src/data/sample-data.js (fallback) │ localStorage logged days
detect.js ──► config            forecast.js ──► config, adapter (model)
radiation.js, wellbeing.js ──► config          (used by detect and triage)
triage.js ──► config, delay
bundle.js ──► (pure)            queue.js ──► bundle.js (verify), storage, timers
explain.js ──► (pure)
run-day.js ──► adapter, detect, forecast, triage, bundle, explain
src/app/state.js ──► run-day, queue
src/ui/* ──► src/app/state.js only
eval/run-eval.mjs ──► eval/crews/ (exported by engine/ml/simulator.py), run-day.js
```

Rules: `src/core/` never imports from `src/app/` or `src/ui/` (already true). In v2, `src/ui/` reads results only through `src/app/state.js` and `runDay()`; today the tabs still call `src/core/` directly.

## 5. Team dependencies (who waits for whom)

| Blocked | Needs | From | By |
|---|---|---|---|
| Raghav (triage v2) | Alert shape with `level`, `confidence`, `contributors` | Tanishk | Phase 1 |
| Raghav (triage v2) | Forecast `label` and `LANDING_AT_RISK` | Tanishk | Phase 1 |
| Raghav (harness) | Seeded generator `generateCrew(seed)` | Tanishk | Phase 2 |
| Om (Today screen) | `runDay()` returning `DayResult` | Raghav + Tanishk | Phase 2 |
| Om (demo controls) | `env` fields and queue API (`setFailureMode`) | Raghav | Phase 2 |
| Om (engine load order) | Merged `engine/` files | Tanishk | Phase 1 |
| Tanishk (calibration) | Verified sources list | Raghav | Phase 1 |
| Everyone | `src/core/config.js` and `src/core/delay.js` | Raghav | First, before anything else |

Phases are defined in [08-TEAM_AND_PLAN.md](08-TEAM_AND_PLAN.md).

## 6. External facts

All NASA and published figures are listed with status in [13-SOURCES.md](13-SOURCES.md). All telemetry is synthetic and generated in the repo.

## 7. Browser features required

| Feature | Use | Fallback |
|---|---|---|
| ES modules | All code | None (required) |
| `localStorage` | Queue, logs, settings | In-memory (queue already does this in Node) |
| Service worker | Offline | App works online without it |
| Canvas 2D | Scene, cones | Text values still shown |
| Clipboard API | Copy bundle | Select-and-copy text box |
