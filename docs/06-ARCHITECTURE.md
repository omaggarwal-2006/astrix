# 06 · Architecture

## Style

A client-only static web app.

- **ES modules**, no bundler, no framework, served by any static server (`launch.bat` uses Python's `http.server`).
- **Pure logic** in `core/` (no DOM, no storage), so every rule runs in Node tests.
- **UI** in `ui/`, which reads one `DayResult` and renders it.
- **Engine** (Tanishk's model) loaded as classic scripts that set globals, wrapped by `adapter.js`.
- **Service worker** for offline use after the first load.

## As-built (today)

```
index.html
 ├─ <script> lib/chart.umd.min.js            (global Chart)
 └─ <script type="module"> main.js           (1,800-line controller: state, all tabs, demo, reset)
       ├─ adapter.js ──► sample/sample_data.js     (scripted alerts and forecast)
       ├─ pipeline.js ──► triage.js, packet.js, queue.js
       ├─ triage.js, packet.js                      (Triage-tab preview)
       ├─ sources.js, sample_alert.js
       └─ js/mission-scene.js, constellation.js, cone-renderer.js, twin-model.js
sw.js                                         (network-first cache)
```

Problems this structure causes:

| Problem | Effect |
|---|---|
| `main.js` owns state, rendering and logic | Hard to test; each tab computes its own piece of the decision |
| Every day change re-renders all five tabs | Slow on scrubbing (N4) |
| Twin model has its own loss formula | A second story that can contradict the alerts (U4) |
| Delay computed in three places | Scene, presets and docs disagree (H3) |
| Engine not connected | The forecast is scripted |

## Target (v2)

### Layers

```
┌──────────────────────────────── UI (ui/) ─────────────────────────────────┐
│ Today · Signals · Forecast · Comms · Evaluation · Sources · Extras        │
│ Demo controls · Banners · Mission scene                                   │
└───────────────▲───────────────────────────────────────┬───────────────────┘
                │ DayResult                             │ user actions
┌───────────────┴───────────────────────────────────────▼───────────────────┐
│ app/state.js   selected day · demo env · what-if hours · subscriptions    │
└───────────────▲───────────────────────────────────────┬───────────────────┘
                │                                       │ runDay(day, env)
┌───────────────┴───────────────────── core/ (pure) ────▼───────────────────┐
│ run-day.js ─► detect.js ─► forecast.js ─► triage.js ─► bundle.js          │
│                 ▲             ▲             ▲              │               │
│           wellbeing.js   adapter.js     delay.js       explain.js          │
│           radiation.js       │          config.js                          │
└──────────────────────────────┼────────────────────────────┬───────────────┘
                               │                            │ enqueue on Send
              ┌────────────────▼────────┐        ┌──────────▼───────────────┐
              │ engine/ (UMD globals)   │        │ core/queue.js            │
              │ DataEngine, LandfallML  │        │ priority, lifetime,      │
              │ ForecastEngine          │        │ retries, receipts        │
              └─────────────────────────┘        └──────────┬───────────────┘
                                                            │
                                                  localStorage (§ storage)
```

### Data flow for one day

1. The user picks a day, or a demo control changes `env`.
2. `app/state.js` calls `runDay(day, env)` once.
3. `run-day.js`:
   1. Builds the history (days 1…day): `adapter.getHistory()` merges engine or sample data with crew-logged days.
   2. `detect(history, day)` → alerts, fused alert, missing data, confidence.
   3. `forecast(history, day, { exerciseHours })` → six ranges with labels (model via adapter, rules fallback).
   4. `triage({ alerts, forecast, reading, env })` → decision with fired rules.
   5. `buildBundle(decision, …)` if the decision needs one (preview only, not queued).
   6. `explain(...)` → the five plain sentences.
4. State stores the `DayResult` and notifies **only the visible tab**, plus the banners and the header.
5. On **Send**, the UI calls `enqueue(bundle)`. The queue emits `onChange`; the Comms tab and scene update.

Rendering never computes decisions. Logic never touches the DOM.

### Delay (one function, decision D-05)

```js
// core/delay.js
oneWayDelayS(day, config)          // linear model, 1.3 s → 750 s
effectiveDelayS(day, env)          // env.delayOverrideS ?? oneWayDelayS(day)
```

Used by the mission scene, the header, triage and captions. Nothing else computes delay.

### Bundle and queue

See [07-TRIAGE_SPEC.md §5–6](07-TRIAGE_SPEC.md#5-the-bundle). The queue is the only stateful part of `core/`: it holds timers and writes to storage, so tests inject a fake clock and fake storage.

### Engine integration

See [15-FORECAST_SPEC.md §6](15-FORECAST_SPEC.md#6-model-forecast-engine-advisory). In short:

```html
<script src="./lib/chart.umd.min.js"></script>
<script src="./engine/data.js"></script>
<script src="./engine/forecast.js"></script>
<script src="./engine/model.js"></script>
<script src="./engine/predict.js"></script>
<script type="module" src="./main.js"></script>
```

`adapter.js` is the only module that reads `window.DataEngine` / `window.LandfallML`. It falls back to `core/forecast.js` rules if they're missing.

### Offline (service worker)

| Item | Rule |
|---|---|
| Strategy | Network-first for same-origin GET; cache fallback when offline (as-built since `3ecac47`) |
| Cache list | Every file loaded at runtime, including `engine/*.js`, `engine/model.json`, `eval/results.json` |
| Install | Cache files one by one and log failures, so one missing file doesn't break offline mode (as-built uses all-or-nothing `cache.addAll`) |
| Scope | Same-origin requests only; never cache external links |
| Version | `CACHE_NAME` bumped on every release |

### Storage

All keys are listed in [18-DATA_MODEL.md §8](18-DATA_MODEL.md#8-storage-keys). Reset clears every key except UI preferences.

## Target file tree

```
index.html  main.js (bootstrap only)  sw.js  launch.bat  package.json (scripts only, no dependencies)
README.md  CONTRACT.md (v4.0, points to docs/18)
core/       config.js delay.js detect.js forecast.js triage.js bundle.js queue.js
            radiation.js wellbeing.js explain.js run-day.js adapter.js sources.js
app/        state.js
ui/         today.js signals.js forecast-tab.js comms.js evaluation.js sources-tab.js
            controls.js banners.js header.js
            visuals/ mission-scene.js cone-renderer.js
            extras/  twin.js twin-model.js constellation.js micro-lab.js
data/       generator.js sample-crew.js
engine/     (merged from origin/engine-ml) data.js forecast.js model.js model.json predict.js MODEL_CARD.md ml/
eval/       scenarios.js run-eval.mjs results.json results.md
tests/      detect.test.mjs forecast.test.mjs triage.test.mjs bundle.test.mjs queue.test.mjs
            radiation.test.mjs wellbeing.test.mjs run-day.test.mjs eval.test.mjs
css/ fonts/ lib/ docs/
```

Deleted: `js/app.js`, `js/today.js`, `js/act-ui.js`, `js/demo.js`, `js/trends.js`, `js/forecast-ui.js`, `js/sources-ui.js`, `js/storage.js`, `js/nasa-catalog.js`, `placeholders/`, `triage/`, `src/LandfallApp.jsx`, `sample_alert.js`, `test*.mjs` (replaced by `tests/`).

### Moving files without breaking the team

| Step | What | Safe because |
|---|---|---|
| 1 | Add `core/config.js` and `core/delay.js`; point existing code at them | Pure additions |
| 2 | Add `core/detect.js`, `core/triage.js` v2 beside the old files; switch `adapter.js` | Old files untouched until the switch |
| 3 | Add `run-day.js` and the Today screen | New tab; other tabs keep working |
| 4 | Move tabs into `ui/` one at a time | One PR per tab |
| 5 | Delete dead files | Nothing imports them (verify with a grep first) |

## Design decisions

Recorded in [20-DECISIONS.md](20-DECISIONS.md). The key ones:

- Rules and statistics decide; the model advises (D-02).
- One live-call limit, 10 s (D-01). One delay function (D-05).
- The emergency path is evaluated before routing and never waits on the queue (D-03).
- Logic is pure and testable; the UI renders a `DayResult` (D-07).

## Integrity, not security

The FNV-1a checksum detects accidental corruption and tampering in the simulation. It doesn't authenticate the sender or hide content. Real systems would sign and encrypt bundles (for example, BPSec for the Bundle Protocol). Say this in the deck.
