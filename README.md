# LANDFALL: Delay-Aware Astronaut Health Decisions

**NASA Space Apps Challenge 2026** · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*
**Live build:** <https://omaggarwal-2006.github.io/astrix/> · **Team:** Raghav Dua, Tanishk, Om

> *"The ground can't be in the loop in real time on the way to Mars, so the astronaut has to be. LANDFALL makes every astronaut their own first responder."*

**Disclaimer:** LANDFALL is decision support, not a medical device or a clinical predictor. All data is synthetic.

---

## What it is

LANDFALL is an offline astronaut health app that decides who should act on a health signal (the astronaut, the crew medical officer or the flight surgeon) based on how far Earth is, and makes sure the report reaches Earth intact even when the link is down.

**Delay is the product.** On a Mars transit, Earth is roughly 3 to 22 minutes away one way. The same symptom needs a different response at 3 seconds of delay than at 20 minutes. Every day LANDFALL runs one loop:

| Step | What it does |
|---|---|
| **Detect** | Compares sleep, mood, heart rate, blood pressure, cabin CO2, symptoms, exercise, radiation and a wellbeing check-in with the astronaut's **own** baseline |
| **Forecast** | Projects landing-day readiness (bone, muscle, aerobic, balance, sleep, mood) as ranges, using NASA-published loss rates and exercise adherence |
| **Decide** | Applies a visible, delay-aware triage table: self-care, crew medical officer or flight surgeon, with emergency overrides that never wait on a queue |
| **Deliver** | Builds a checksum-verified report and queues it until contact returns |
| **Explain** | Says what changed, why it matters, who should act, and what would change the decision |

## Project status

The repo is moving from the v1 build to the **v2 design** in [`docs/`](docs/README.md).

| | Today (v1 build) | v2 target |
|---|---|---|
| Alerts | Scripted sample alerts | Computed personal baseline, EWMA drift, signal fusion, missing-data alerts |
| Forecast | Sample formulas | Ranges with go/no-go; feeds triage; ML engine (on `origin/engine-ml`) advisory |
| Triage | Hidden score | Visible decision table with emergency, SANS and CO2 rules |
| Queue | FIFO with retries | Priority, lifetime, retry limit, receipts |
| Radiation and isolation | Cumulative dose; mood | Dose limit, solar-particle-event alert, 3-question check-in |
| Evidence | — | Evaluation harness against fixed thresholds |

Requirement-by-requirement status: [`docs/00-STATUS.md`](docs/00-STATUS.md).

## Run it

**Windows, one click:** double-click **`launch.bat`**. It finds a free port (8080–8090), starts a local server with Python (or `npx http-server` if Python is missing) and opens your browser.

**Any OS:**

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

You need a server because LANDFALL uses ES modules, and browsers block those from `file://`. VS Code's Live Server extension also works.

**Offline:** after the first visit, the service worker (`sw.js`) keeps a copy of every file. Turn off Wi-Fi and the app still works. If you see old code after an edit, hard-refresh (Ctrl+Shift+R).

**Reset:** use the Reset button in the app, or run `localStorage.clear()` in the browser console.

More: [`docs/21-DEV_SETUP.md`](docs/21-DEV_SETUP.md).

## Test it

```bash
node tests/ui-check.mjs
```

```bash
node test5.mjs
```

`tests/ui-check.mjs` checks that features exist in the source, not that they behave correctly. Behaviour tests with Node's built-in runner (`node --test tests/`) are planned: [`docs/09-TEST_PLAN.md`](docs/09-TEST_PLAN.md).

## Repo layout (today)

| Path | What |
|---|---|
| `index.html`, `main.js`, `css/`, `js/` | UI: tabs, mission scene, digital twin, charts, demo runner |
| `adapter.js` | The single place the UI gets data from; the real engine plugs in here |
| `sample/sample_data.js` | Interim synthetic dataset, alerts and forecast |
| `triage.js`, `packet.js`, `queue.js`, `pipeline.js` | Triage, checksum packets and the store-and-forward queue |
| `sources.js` | NASA sources, numbers, link presets, assumptions, disclaimer |
| `sw.js` | Service worker for offline use |
| `launch.bat` | One-click local launch on Windows |
| `docs/` | v2 product and engineering docs |
| `lib/`, `fonts/` | Vendored Chart.js and fonts (no CDN) |

Not used by the app (to be deleted, decision D-12): `js/app.js`, `js/today.js`, `js/act-ui.js`, `js/demo.js`, `js/trends.js`, `js/forecast-ui.js`, `js/sources-ui.js`, `js/storage.js`, `js/nasa-catalog.js`, `placeholders/`, `src/LandfallApp.jsx`, `engine/` and `triage/` (empty).

The target layout is in [`docs/06-ARCHITECTURE.md`](docs/06-ARCHITECTURE.md#target-file-tree).

## Team

| Person | Owns |
|---|---|
| **Raghav Dua** | Triage, bundles and queue, integration, evaluation, sources, docs, demo and submission |
| **Tanishk** | Detection, forecast, the ML engine (`origin/engine-ml`), synthetic data |
| **Om** | UI: mission scene, tabs, digital twin, demo runner, service worker |

Work plan and git workflow: [`docs/08-TEAM_AND_PLAN.md`](docs/08-TEAM_AND_PLAN.md).

## Contract and docs

- **Module contract:** [`CONTRACT.md`](CONTRACT.md) (v4.0). It lists the shapes the code uses today and points to the v2 shapes in [`docs/18-DATA_MODEL.md`](docs/18-DATA_MODEL.md).
- **Full documentation:** [`docs/README.md`](docs/README.md). Start with the idea ([`01-IDEA.md`](docs/01-IDEA.md)) and the status page ([`00-STATUS.md`](docs/00-STATUS.md)).

## Honesty

- Synthetic data, labelled as such on every screen.
- NASA figures carry sources ([`docs/13-SOURCES.md`](docs/13-SOURCES.md)); every threshold we chose is labelled a team assumption.
- The checksum is an integrity check for the simulation, not security.
- Forecasts are illustrative, not clinical predictions.
