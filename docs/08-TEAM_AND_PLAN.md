# 08 · Team, Work Breakdown and Plan (v2)

## Roles

| Person | Role | Owns |
|---|---|---|
| **Raghav** | Act + integration + delivery | Triage table, bundle and queue (`core/triage.js`, `bundle.js`, `queue.js`), `run-day.js`, config and delay, evaluation harness, sources, tests, docs, demo video, submission |
| **Tanishk** | Detect + Forecast + data | `core/detect.js`, `core/forecast.js`, engine merge, `data/generator.js` and calibration, radiation data, wellbeing metrics |
| **Om** | UI | Today screen, tabs, demo controls, banners, mission scene, demo runner, service worker, accessibility, moving extras, deleting dead code |

Owners are proposals in v2; confirm in the next sync and update [00-STATUS.md](00-STATUS.md).

Git authors seen in the history: `Om`, `Tanishk Sharma`, `raghavdua2006`, `SafalNiveshak Dev`, `Rohan Jaiswal`. Agree who is who, and use one name and email per person from now on, so `git log` and the credits match.

## Phases

The official deadline isn't confirmed yet (open question OQ1). Fill in real dates once it is.

| Phase | Length | Goal | Exit check |
|---|---|---|---|
| **0. Align** | ½ day | Agree on this doc set; confirm owners and decisions D-01…D-12 | Decisions marked "Accepted" |
| **1. Foundations** | 1–2 days | `core/config.js`, `core/delay.js`, engine merged, Detect v2 shape, triage table skeleton | `node --test` runs; one delay everywhere |
| **2. Loop** | 2 days | `runDay()`, Today screen, demo controls, bundle and queue v2, forecast → triage link | Demo story steps 1–6 work |
| **3. Coverage and evidence** | 1–2 days | Radiation, wellbeing check-in, evaluation harness, results file | Steps 6–7 work; results committed |
| **4. Clean-up** | 1 day | Move extras, delete dead code, fix captions, readiness rule, a11y pass, sources verified | Definition of done in [04-MVP.md](04-MVP.md#definition-of-done) |
| **5. Record and submit** | 1 day + buffer | Video, deck, submission text | Submitted with a day to spare |

## Work breakdown

### Raghav
- [ ] Phase 0: walk the team through docs v2; record decisions in [20-DECISIONS.md](20-DECISIONS.md).
- [ ] Phase 1: `core/config.js` (every key in [18 §7](18-DATA_MODEL.md#7-configuration)) and `core/delay.js`.
- [ ] Phase 1: `core/triage.js` decision table with all rows and tests ([07 §9](07-TRIAGE_SPEC.md#9-tests-one-per-table-row-plus-queue)).
- [ ] Phase 2: `core/bundle.js` (stable checksum, ID, lifetime, priority) and `core/queue.js` v2 (priority order, retry limit, receipts, failure modes, duplicate guard).
- [ ] Phase 2: `core/run-day.js` and `core/explain.js`.
- [ ] Phase 3: evaluation harness and results ([17](17-EVALUATION.md)).
- [ ] Phase 4: open every source and update [13-SOURCES.md](13-SOURCES.md); remove "source pending" labels.
- [x] Bump `CONTRACT.md` to v4.0 (Part A as-built, Part B v2) and rewrite the root README.
- [ ] Every phase: move each migrated module from `CONTRACT.md` Part A to Part B.
- [ ] Phase 5: deck, video, submission.

### Tanishk
- [ ] Phase 1: merge `origin/engine-ml`; fix `engine/ml/requirements.txt` encoding; normalise engine fields into `DayReading`.
- [ ] Phase 1: `core/detect.js`: computed baseline, z, EWMA, fusion, missing data, confidence, alert text ([14](14-DETECT_SPEC.md)).
- [ ] Phase 2: `core/forecast.js` rules forecast with ranges and labels; adapter mapping for the model ([15](15-FORECAST_SPEC.md)).
- [ ] Phase 3: `data/generator.js` seeded and calibrated; radiation background, SPE generator; sleep regularity and wellbeing metrics.
- [ ] Phase 3: update the engine model card to match the six dimensions and the "advisory" framing.

### Om
- [ ] Phase 1: load engine scripts before `main.js`; add `engine/*` to the service-worker cache; per-file cache install.
- [ ] Phase 2: `app/state.js` and the Today screen ([19](19-UI_GUIDE.md#today-screen)); render only the visible tab.
- [ ] Phase 2: demo controls drawer ([19](19-UI_GUIDE.md#demo-controls-u1)); banners.
- [ ] Phase 3: check-in form v2 (mood, stress, social, bed and wake time); radiation bar; Evaluation tab.
- [ ] Phase 4: readiness headline rule; rename XP; move constellation, micro-lab (and twin, if not made consistent) to Extras; cone origin at 100 %; captions from data; mission scene uses `core/delay.js`.
- [ ] Phase 4: delete dead code ([06](06-ARCHITECTURE.md#target-file-tree)); accessibility pass ([19](19-UI_GUIDE.md#accessibility-u8-n5)).

## Git workflow

So far every commit went straight to `main`. From Phase 1:

- `main` is always demo-able. No direct commits.
- One branch per task: `feat/triage-table`, `feat/today-screen`, `fix/cone-origin`, `docs/…`.
- Pull request into `main`, one teammate reviews, `node --test` must pass.
- Commit messages: `area: what` (for example `triage: add SANS rule`).
- Shared files (`core/config.js`, `docs/18-DATA_MODEL.md`) change only in their own small PRs, so they don't conflict.
- Tag a release before recording: `git tag demo-v2.0`.

## Communication

- One group chat. A daily 10-minute sync: done / next / blocked.
- Contract or threshold changes only through a PR to [18-DATA_MODEL.md](18-DATA_MODEL.md) plus a decision entry.
- Blockers that wait more than half a day get raised in the chat, not held.

## Handoffs

| From → To | What |
|---|---|
| Raghav → everyone | `core/config.js` and `core/delay.js` first; nobody adds a threshold anywhere else |
| Tanishk → Raghav | Alert and forecast shapes with `level`, `confidence`, `label` |
| Raghav → Om | `runDay()` and the queue API, including `setFailureMode` and `clearQueue` |
| Tanishk → Om | Engine globals and the adapter mapping |
| Om → Raghav | Screen recordings of each demo step for the video |
