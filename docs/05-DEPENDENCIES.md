# 05 · Dependencies

## 1. Runtime (the app)

| Dependency | Use | Notes |
|---|---|---|
| Modern browser (Chrome, Edge, Firefox, Safari; last 2 versions) | Runs the app | Needs ES modules, `localStorage`, service workers, canvas |
| A static HTTP server | Serves the files | ES modules don't load from `file://`. `launch.bat` uses Python's `http.server` |
| Chart.js (vendored, `lib/chart.umd.min.js`) | Trend charts | Loaded as a classic script; global `Chart` |
| Fonts (vendored, `fonts/`) | Typography | Only `saira-condensed.woff2` and `hanken-grotesk.woff2` are used; delete the two Barlow files |
| Engine scripts (after merge, `engine/`) | Forecast model and synthetic history | UMD files that set `window.DataEngine`, `ForecastEngine`, `LANDFALL_MODEL`, `LandfallML` |

No backend, database, API key or runtime network call.

## 2. Development

| Tool | Version | Use |
|---|---|---|
| Node.js | 18 or newer (team machines run 22) | `node --test`, evaluation harness, quick checks |
| Python | 3.10 or newer | `launch.bat` server; engine training scripts |
| Python packages | `engine/ml/requirements.txt` | Only to retrain the model. **The file is saved as UTF-16 with a BOM** (git treats it as binary) and looks like a full `pip freeze` of one machine. Re-save as UTF-8 and trim it to the packages the scripts import: `numpy`, `pandas`, `scikit-learn`, `matplotlib`, with versions (`root_mean_squared_error` needs scikit-learn 1.4 or newer) |
| Git and GitHub | — | Repo `omaggarwal-2006/astrix` |
| VS Code (optional) | — | Live Server works as an alternative to `launch.bat` |

`package.json` holds **scripts only**, no dependencies:

```json
{
  "name": "landfall",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "eval": "node eval/run-eval.mjs --seeds 200",
    "serve": "python -m http.server 8080"
  }
}
```

## 3. Module dependencies (target)

```
config.js ◄──────────────────────────── every core module
delay.js ◄── triage.js, run-day.js, ui/header, ui/visuals/mission-scene
adapter.js ──► engine globals (optional) │ data/generator.js (fallback) │ localStorage logged days
detect.js ──► config            forecast.js ──► config, adapter (model)
radiation.js, wellbeing.js ──► config          (used by detect and triage)
triage.js ──► config, delay
bundle.js ──► (pure)            queue.js ──► bundle.js (verify), storage, timers
explain.js ──► (pure)
run-day.js ──► adapter, detect, forecast, triage, bundle, explain
app/state.js ──► run-day, queue
ui/* ──► app/state.js only
eval/run-eval.mjs ──► data/generator.js, run-day.js
```

Rule: `ui/` never imports from `core/` directly except through `app/state.js`. `core/` never imports from `ui/`.

## 4. Team dependencies (who waits for whom)

| Blocked | Needs | From | By |
|---|---|---|---|
| Raghav (triage v2) | Alert shape with `level`, `confidence`, `contributors` | Tanishk | Phase 1 |
| Raghav (triage v2) | Forecast `label` and `LANDING_AT_RISK` | Tanishk | Phase 1 |
| Raghav (harness) | Seeded generator `generateCrew(seed)` | Tanishk | Phase 2 |
| Om (Today screen) | `runDay()` returning `DayResult` | Raghav + Tanishk | Phase 2 |
| Om (demo controls) | `env` fields and queue API (`setFailureMode`) | Raghav | Phase 2 |
| Om (engine load order) | Merged `engine/` files | Tanishk | Phase 1 |
| Tanishk (calibration) | Verified sources list | Raghav | Phase 1 |
| Everyone | `core/config.js` and `core/delay.js` | Raghav | First, before anything else |

Phases are defined in [08-TEAM_AND_PLAN.md](08-TEAM_AND_PLAN.md).

## 5. External facts

All NASA and published figures are listed with status in [13-SOURCES.md](13-SOURCES.md). All telemetry is synthetic and generated in the repo.

## 6. Browser features required

| Feature | Use | Fallback |
|---|---|---|
| ES modules | All code | None (required) |
| `localStorage` | Queue, logs, settings | In-memory (queue already does this in Node) |
| Service worker | Offline | App works online without it |
| Canvas 2D | Scene, cones | Text values still shown |
| Clipboard API | Copy bundle | Select-and-copy text box |
