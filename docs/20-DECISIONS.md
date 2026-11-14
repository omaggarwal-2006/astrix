# 20 · Decision Log

Each decision has a status: **Proposed** (in v2 docs, team to confirm in Phase 0), **Accepted**, or **Replaced** (with a link to the new one). To change a decision, add a new entry; don't edit an accepted one.

## D-01 · One live-call limit: 10 s one-way

- **Status:** Proposed
- **Context:** The as-built code uses 300 s; the v1 specs used 10 s. The v2 demo routes a case at about 3 minutes of delay to the CMO because "a live call isn't possible", which is only true if the limit is below that.
- **Decision:** `liveCallMaxOneWayS = 10`, defined once in `core/config.js`.
- **Consequences:** Moon (1.3 s) and ISS are live; operational lunar latency at the top of its 3–14 s range and all Mars cases go by bundle. The demo story holds. `sources.js` assumption text changes from 300 s to 10 s.

## D-02 · Rules decide; the model advises

- **Status:** Proposed
- **Context:** The engine branch has a ridge-regression forecast; v1 said "no ML". Safety needs explainable, testable outputs.
- **Decision:** Detect and triage are rule-based. The ML model may power the **forecast**, shown with a source badge, with rules as fallback and comparison. Any future ML anomaly score is shown beside rule alerts and never changes severity.
- **Consequences:** Model failure never breaks the decision. Claims about ML stay narrow ([15 §6.3](15-FORECAST_SPEC.md#63-what-we-may-claim)).

## D-03 · The emergency path is checked first and never waits

- **Status:** Proposed
- **Decision:** `EMERGENCY_CARDIAC` and `SPE_SHELTER` are evaluated before routing. Their banners show regardless of link or queue state. A record bundle is queued, but the instruction doesn't depend on it.

## D-04 · One severity scale and DTN priority classes

- **Status:** Proposed
- **Context:** Packet priority and `mapSeverity` map severity to different labels (`CONTRACT.md` A5).
- **Decision:** Severity 1 mild, 2 caution, 3 alarm, everywhere. Bundles use priority classes `EXPEDITED`, `NORMAL`, `BULK` ([07 §5.3](07-TRIAGE_SPEC.md#53-priority-class-q3)). `LOW … CRITICAL` labels are retired.

## D-05 · One delay function

- **Status:** Proposed
- **Context:** The scene uses `1.3 + day/180 × 750`, the presets use 1.3–1,320 s, and the v1 docs said "≈ 128 s at Day 40".
- **Decision:** `core/delay.js` keeps the linear model (1.3 s → 750 s, so Day 40 = 168 s), labelled a demo assumption. The delay selector can override it. Every module, caption and doc uses this function.
- **Consequences:** Day 40 is "2 min 48 s one way" everywhere. Real geometry (3–22 min over the synodic cycle) is described in Sources, not modelled.

## D-06 · Forecast dimensions follow the engine

- **Status:** Proposed
- **Decision:** `bone`, `muscle`, `aerobic`, `balance`, `sleep`, `mood`. The as-built "Cardiovascular regulation" is dropped; "Aerobic & muscle power" splits in two.
- **Consequences:** Go/No-Go poll, cones and twin colours update. Cardiovascular context stays in Detect (HR, BP).

## D-07 · Pure core, rendering UI

- **Status:** Proposed
- **Decision:** All logic lives in `core/` as pure ES modules (except the queue's timers and storage, which are injected). The UI renders a `DayResult` from `runDay()` and never computes decisions.
- **Consequences:** Logic is testable in Node; tabs can't disagree; only the visible tab re-renders.

## D-08 · XP becomes "mission readiness score", or is cut

- **Status:** Proposed
- **Context:** "Tier III: Flight surgeon escalation" conflicts with triage; points for slider drags gamify health.
- **Decision:** Rename, remove tier names that sound like triage, remove interaction points, and make it the same number as the readiness supporting average. If time is short, cut it.

## D-09 · The digital twin must share the alerts' data, or move to Extras

- **Status:** Proposed
- **Decision:** Region colours come from `DayResult` (alerts and forecast). The separate loss model in `js/twin-model.js` is removed. If that isn't done by Phase 4, the twin moves to Extras.

## D-10 · Missing data escalates

- **Status:** Proposed
- **Decision:** Two days without a metric raise a `MISSING` alert; the decision escalates one level and says why.

## D-11 · Bundles, not packets

- **Status:** Proposed
- **Decision:** Rename to "bundle" in code, UI and docs, add lifetime, priority class, retry limit and receipt; `TRANSMITTED` becomes `TRANSMITTING`; storage key `landfall_queue_v2`.

## D-12 · Delete dead code and the orphan React app

- **Status:** Proposed
- **Context:** About 40 % of the files are never loaded; `src/LandfallApp.jsx` has no build setup.
- **Decision:** Delete the files listed in [06 §Target file tree](06-ARCHITECTURE.md#target-file-tree). Git history keeps them.

## D-13 · Docs describe the target; STATUS describes the code

- **Status:** Proposed
- **Decision:** `docs/` is the v2 target. [00-STATUS.md](00-STATUS.md) records what's built and is updated in every PR. `CONTRACT.md` v4.0 splits into Part A (as-built, binding for current code) and Part B (v2 summary); [18-DATA_MODEL.md](18-DATA_MODEL.md) is the full v2 definition.

## D-14 · Deterministic failure injection for the demo

- **Status:** Proposed
- **Decision:** The demo uses "fail next" and "fail all" instead of a random failure rate, so every run shows the same thing. Seeded random failures are for the evaluation only.
