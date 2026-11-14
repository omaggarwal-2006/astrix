# 06 · Architecture and Repo Structure

How the code is organised today, how it runs, and where the v2 pieces go. How we got here and what is left: [22-MIGRATION.md](22-MIGRATION.md).

## Style

A client-only static web app.

- **ES modules, no bundler, no framework.** Served as plain files by any static server (`launch.bat` uses Python's `http.server`). GitHub Pages serves the same files.
- **Pure logic** in `src/core/`: no DOM; storage only in the queue. Everything there runs in Node tests.
- **State and routing** in `src/app/`. State never imports UI code; screens register their renderers into it.
- **Screens** in `src/ui/`, one module per tab or component.
- **Static assets** in `assets/` (CSS, fonts, vendored Chart.js).
- **Engine** (Tanishk's model, branch `origin/engine-ml`) will live in `engine/` as classic scripts that set globals, read only by `src/core/adapter.js`.
- **Service worker** at the root for offline use, caching a generated file list.

## Repo tree (as-built)

```
astrix/
├── index.html                 App shell: header, mission scene, nav, tab markup, modals
├── sw.js                      Service worker (must sit at the root to control the whole site)
├── launch.bat                 One-click local launch (Windows)
├── package.json               Scripts only, no dependencies: test, check, build:sw, serve
├── README.md  CONTRACT.md
├── .gitignore  .gitattributes  .editorconfig  .nojekyll
├── .github/
│   ├── workflows/ci.yml       npm test + smoke check + manifest and link checks on every push and PR
│   ├── pull_request_template.md
│   └── CODEOWNERS             Reviewers per folder
│
├── src/
│   ├── main.js                Bootstrap: builds the views, registers renderers, starts canvases and controls
│   ├── sw-manifest.js         GENERATED list of files the service worker caches
│   ├── core/                  Logic, no DOM
│   │   ├── config.js          Every threshold and tunable number (frozen)
│   │   ├── delay.js           The one Earth–ship delay function (D-05)
│   │   ├── adapter.js         The only data entry point for the UI (engine plugs in here)
│   │   ├── triage.js          Triage decision (as-built score; v2 decision table goes here)
│   │   ├── packet.js          Packet build and FNV-1a checksum (v2: bundle.js)
│   │   ├── queue.js           Store-and-forward queue with link state, retries, persistence
│   │   ├── run-day.js         runDay(day, env): read → detect → forecast → decide, readiness, counterfactuals
│   │   ├── pipeline.js        handleAlert(): triage → packet → queue (used by Send)
│   │   └── sources.js         Sources, NASA numbers, link presets, assumptions, disclaimer
│   ├── data/
│   │   ├── sample-data.js     Interim synthetic 180-day dataset, alerts and forecast
│   │   └── sample-alert.js    Fixture alert A-001
│   ├── app/
│   │   ├── state.js           AppState: day, simulation env, what-if, today's runDay() result; registerTab() / onUpdate()
│   │   └── router.js          Hash routing (old v1 hashes still work); renders only the visible tab
│   └── ui/
│       ├── dom.js             Shared labels, status pills, icons, count-up animation
│       ├── header.js          Status chips, scrubber readout, tab badges, scene collapse
│       ├── report.js          Builds and sends today's report packet (trends computed from data)
│       ├── simulation.js      Simulation drawer and shared controls: distance, link, CMO, failures, reset
│       ├── banners.js         Emergency ground-link modal (focus trap, Escape)
│       ├── demo-runner.js     Guided demo: 10 steps, captions written from each step's result
│       ├── tabs/              today.js · signals.js · forecast.js · comms.js · twin-tab.js · evidence.js
│       ├── components/        trend-chart.js (Chart.js wrapper)
│       ├── visuals/           mission-scene.js · scene-controls.js · cone-renderer.js
│       └── extras/            twin.js · twin-model.js · micro-lab.js · constellation.js
│
├── assets/
│   ├── css/                   tokens · base · layout · components · title-screen · tabs/today · tabs/signals
│   │                          · tabs/forecast · tabs/comms · tabs/evidence · extras · responsive
│   ├── fonts/                 saira-condensed.woff2 · hanken-grotesk.woff2 · README.md (licenses)
│   └── vendor/                chart.umd.min.js (Chart.js 4.4.4) · README.md (license)
│
├── tests/
│   ├── unit/                  triage · packet · adapter · sources · delay · config
│   ├── integration/           pipeline.test.mjs (alert → packet → queue → acknowledgement)
│   └── smoke/ui-check.mjs     Checks the 16 UI features exist in markup and source
│
├── scripts/
│   ├── build-sw-manifest.mjs  Writes src/sw-manifest.js; --check mode for CI
│   └── check-links.mjs        Checks every relative link and anchor in the docs
│
└── docs/                      Product and engineering docs
```

Coming next: `engine/` (merge of `origin/engine-ml`), `eval/` (evaluation harness), and the v2 modules listed in [§ v2 modules](#v2-modules-where-they-go).

## Layers and rules

```
┌──────────────────────────── src/ui/ ─────────────────────────────┐
│ header · tabs/* · components/* · visuals/* · extras/* · demo      │
└──────────────▲────────────────────────────────────┬──────────────┘
               │ registerTab / setHeaderRenderer     │ AppState.setDay(), activateTab()
┌──────────────┴──────────── src/app/ ───────────────▼──────────────┐
│ state.js (no UI imports) · router.js                              │
└──────────────────────────────────────────────────────────────────┘
               ▲ (today: tabs also call src/core directly)
┌──────────────┴──────────── src/core/ ─────────────────────────────┐
│ config · delay · adapter · triage · packet · queue · pipeline     │
│ sources            ──► src/data/sample-data.js (until the engine) │
└──────────────────────────────────────────────────────────────────┘
```

| Rule | Status |
|---|---|
| `src/core/` never imports from `src/app/` or `src/ui/` | Holds today |
| `src/app/state.js` imports no UI module | Holds today (renderers register themselves) |
| Every threshold lives in `src/core/config.js` | Triage, queue and delay done; Detect, forecast and radiation values move in with v2 |
| Delay is computed only in `src/core/delay.js` | Holds today (header and mission scene use it) |
| The UI renders a `DayResult` and never computes a decision | v2 target (`runDay()`); today the Comms tab calls `triage()` itself |

## Runtime flow (today)

1. `index.html` loads the 11 stylesheets in cascade order, Chart.js, then `src/main.js`.
2. `src/main.js` registers the five tab renderers and the header renderer, starts the mission scene and constellation canvases, binds all controls, subscribes to queue changes, sets the link preset and calls `AppState.setDay(40)`.
3. A day change (scrubber, demo runner, Reset) calls `AppState.setDay()`. That updates the mission scene, the header, and **only the visible tab**. Other tabs render when opened.
4. Clicking a tab changes the URL hash; `router.js` hears `hashchange`, shows the panel and renders it.
5. **Send packet** on the Comms tab calls `handleAlert()`, which enqueues once. Queue changes re-render the queue table, the packet flight and the downlink readout.

## The delay function (D-05)

```js
// src/core/delay.js
oneWayDelayS(day)    // round(1.3 + day / 180 × 750) → Day 40 = 168 s
formatDelay(seconds) // "2 min 48 s"
```

Used by the header, the mission scene and its HUD. The Comms tab's link selector still sets its own preset delay; in v2 the selector becomes an override of this function ([07-TRIAGE_SPEC.md §2](07-TRIAGE_SPEC.md#2-interface)).

## Offline (service worker)

| Item | How |
|---|---|
| File list | `src/sw-manifest.js`, generated by `npm run build:sw` from `src/`, `assets/` and `engine/` (excluding `engine/ml/`) |
| Install | Caches each file separately; a missing file is logged, not fatal |
| Fetch | Network-first for same-origin GET; cache fallback when offline; cross-origin requests untouched |
| Updates | Bump `CACHE_NAME` in `sw.js` for a release; old caches are deleted on activate |
| Guard | CI fails if the manifest is stale (`npm run check`) |

## CSS

Twelve files loaded in a fixed order from `index.html`; `responsive.css` must stay last. Every colour, size and duration comes from `tokens.css`.

| File | Holds |
|---|---|
| `tokens.css` | Design tokens: surfaces, text, status colours, type scale, radii, shadows, motion (plus legacy names used by the twin) |
| `base.css` | `@font-face`, reset, page background, typography, focus ring, skip link |
| `layout.css` | App bar, mission strip, scrubber, tabs, views, grids, footer |
| `components.css` | Cards, buttons, chips, status pills and shapes, segmented control, switch, table, meter, modal, drawer, demo caption, keyframes |
| `title-screen.css` | First-load title screen |
| `tabs/today.css` · `signals.css` · `forecast.css` · `comms.css` · `evidence.css` | One file per view |
| `extras.css` | Digital twin, tissue cards, micro-lab, constellation, readiness score |
| `responsive.css` | Breakpoints (1180, 1100, 960, 640 px) and reduced motion |

## Engine integration (next)

See [15-FORECAST_SPEC.md §6](15-FORECAST_SPEC.md#6-model-forecast-engine-advisory). In short, after merging `origin/engine-ml`:

```html
<script src="./assets/vendor/chart.umd.min.js"></script>
<script src="./engine/data.js"></script>
<script src="./engine/model.js"></script>
<script src="./engine/forecast.js"></script>
<script src="./engine/predict.js"></script>
<script type="module" src="./src/main.js"></script>
```

`src/core/adapter.js` is the only module that reads `window.DataEngine` / `window.LandfallML`, and it falls back to `src/data/sample-data.js` if they're missing. Run `npm run build:sw` after the merge so the engine files are cached.

**One simulator (D-16).** The Python simulator in `engine/ml/simulator.py` is the single source of synthetic data: it produces `engine/data.js` for the UI and exports seeded crews to `eval/crews/` for the evaluation harness. There is no separate JavaScript generator.

## v2 modules: where they go

| v2 module | File | Spec |
|---|---|---|
| Detect | `src/core/detect.js` | [14](14-DETECT_SPEC.md) |
| Forecast rules | `src/core/forecast.js` | [15](15-FORECAST_SPEC.md) |
| Decision table | `src/core/triage.js` (replaces the score) | [07](07-TRIAGE_SPEC.md) |
| Bundle | `src/core/bundle.js` (renamed from `packet.js`) | [07 §5](07-TRIAGE_SPEC.md#5-the-bundle) |
| Queue v2 | `src/core/queue.js` | [07 §6](07-TRIAGE_SPEC.md#6-the-queue) |
| Radiation, wellbeing | `src/core/radiation.js`, `src/core/wellbeing.js` | [16](16-RADIATION_AND_ISOLATION.md) |
| Explanation | `src/core/explain.js` | [07 §4](07-TRIAGE_SPEC.md#4-explanation-t9-l3) |
| Loop | `src/core/run-day.js` (built; v2 adds detect, explain and bundles to it) | [03 L1](03-PRD.md#l--decision-loop) |
| Storage keys and migration | `src/app/storage.js` | [18 §8](18-DATA_MODEL.md#8-storage-keys) |
| Today screen | `src/ui/tabs/today.js` (built; v2 swaps in the decision table) | [19](19-UI_GUIDE.md#today-screen) |
| Evaluation tab | `src/ui/tabs/evaluation.js` | [19](19-UI_GUIDE.md#other-tabs) |
| Emergency, vision and SPE injectors | `src/ui/simulation.js` (the drawer exists) | [19](19-UI_GUIDE.md#demo-controls-u1) |
| Triage table component | `src/ui/components/triage-table.js` | [07 §3](07-TRIAGE_SPEC.md#3-the-decision-table-t1) |
| Evaluation harness | `eval/run-eval.mjs`, `eval/scenarios.js`, `eval/results/` | [17](17-EVALUATION.md) |
| Tests | `tests/unit/*.test.mjs`, `tests/integration/*.test.mjs` | [09](09-TEST_PLAN.md) |

## Design decisions

Recorded in [20-DECISIONS.md](20-DECISIONS.md). The ones that shape the structure: D-05 (one delay function), D-07 (pure core), D-12 (dead code deleted), D-15 (`src/` layout), D-16 (one simulator), D-17 (render only the visible tab).

## Integrity, not security

The FNV-1a checksum detects accidental corruption and tampering in the simulation. It doesn't authenticate the sender or hide content. Real systems would sign and encrypt bundles (for example, BPSec for the Bundle Protocol). Say this in the deck.
