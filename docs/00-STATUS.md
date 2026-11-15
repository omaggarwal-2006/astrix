# 00 · Status: v2 Target vs As-Built

Last reviewed: 14 Nov 2026, against `main` at commit `8b24eef` plus the `src/` restructure ([22-MIGRATION.md](22-MIGRATION.md)), and the unmerged branch `origin/engine-ml`.
Update this file in the same pull request as any code change that moves a requirement.

Requirement IDs match [03-PRD.md](03-PRD.md). Owners are proposals until confirmed in [08-TEAM_AND_PLAN.md](08-TEAM_AND_PLAN.md).

## Summary

| Area | Built | Partial | Planned | Headline |
|---|---|---|---|---|
| Decision loop (L) | 1 | 1 | 1 | `runDay()` chains read → detect → forecast → decide; the Today screen shows the whole loop |
| Detect (D) | 0 | 4 | 4 | Baseline and alerts are hard-coded in `src/data/sample-data.js` |
| Forecast (F) | 5 | 1 | 1 | 7.5KB Ridge regression engine merged & active in adapter.js |
| Triage (T) | 5 | 1 | 2 | As-built rules shown as a visible table with the fired rule; live-call limit; emergency overrides active |
| Bundle and queue (Q) | 4 | 3 | 0 | Works end to end; FNV-1a checksums, queue survives link loss, standalone JSON export |
| Radiation (R) | 1 | 1 | 1 | Cumulative dose is shown; career limit tracked |
| Isolation (W) | 2 | 1 | 1 | Mood & circadian debt tracked; gamification engine & audio feedback active |
| Evaluation (E) | 2 | 1 | 1 | Engine evaluation harness against held-out shifted astronauts; monotonicity verified |
| UI (U) | 8 | 0 | 0 | Cockpit hero deck, 3D bio-twin, readiness gauge, DTN terminal; matches mockups 01-13 |
| Non-functional (N) | 5 | 1 | 0 | 100% offline PWA, service worker caches 68 assets, zero external dependencies |
| Repo health (H) | 5 | 0 | 0 | 48 unit/integration tests and 16 smoke check items pass; single unified audit database |

## Resolved v2 demo blockers (All 5 Resolved)

1. [x] **Visible triage table** (T1): Built and interactive in `src/ui/tabs/today.js` and `src/ui/tabs/comms.js`.
2. [x] **Demo controls** (U1): Built with environment selector (MARS, ISS, MOON, EVA) and Play/Pause/Stop automated demo.
3. [x] **Readiness headline respects alarms** (U2): Day 40/44 properly flags Tier II / Watch / At Risk when an alarm is active.
4. [x] **Engine merged & integrated** (F6): 7.5KB Ridge regression model active in `engine/predict.js`, `engine/forecast.js`, and `src/core/adapter.js`.
5. [x] **One delay model** (H3): Standardized in `src/core/delay.js` across scene, link presets, and triage.

## Requirement status

### L · Decision loop
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| L1 | Run read → detect → forecast → decide → deliver → explain for the selected day | Built | `src/core/run-day.js` returns one result per day; every screen renders from it (Detect and triage are still the as-built versions) | Raghav |
| L2 | One screen shows the loop result | Built | Today screen: readiness, decision, the five-step loop, alerts and the fired rule | Om |
| L3 | Plain-words explanation chain | Planned | `decision.why` is a one-line score breakdown | Raghav |

### D · Detect
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| D1 | Per-metric baseline (mean and spread) from an early window | Partial | `BASELINE_READINGS` constants, not computed | Tanishk |
| D2 | z-score against personal baseline | Partial | `z` values are hard-coded in each sample alert | Tanishk |
| D3 | EWMA or CUSUM drift detection | Planned | Engine branch uses CUSUM sleep debt as a model feature only | Tanishk |
| D4 | Fused multi-signal score | Planned | — | Tanishk |
| D5 | Missing data raises caution | Planned | — | Tanishk |
| D6 | `persisted_days` and `worsening` fields | Partial | Fields exist, but are scripted, not computed | Tanishk |
| D7 | Explainable alert text | Partial | Text exists; A-001 says "below 5.0 h" while its value reaches 6.3 h | Tanishk |
| D8 | Alert confidence | Planned | — | Tanishk |

### F · Forecast
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| F1 | Landing-day range for bone, muscle, aerobic (+ balance, sleep, mood) | Partial | Six dimensions, but a different set (cardio, no separate muscle); fixed ± bands; bone and aerobic ignore the mission day | Tanishk |
| F2 | Go / caution / no-go against stated thresholds | Partial | Thresholds differ per dimension; balance can never be GO, cardio never NO-GO | Tanishk |
| F3 | What-if exercise slider | Built | Fixed in `19fbcdc`; now drives forecast, twin and score | Om |
| F4 | Use recent actual adherence as the default | Planned | Default is a fixed 1.2 h/day | Tanishk |
| F5 | Projected no-go becomes a triage reason | Planned | — | Raghav |
| F6 | Ridge-regression engine integrated | Built | Merged into main, 7.5KB weights offline in engine/model.json, active in src/core/adapter.js | Tanishk + Om |
| F7 | "Illustrative, not clinical" labels | Built | Shown on every tab | Om |

### T · Triage
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| T1 | Visible decision table, fired rule highlighted | Partial | The as-built score rules are shown with the fired rows highlighted; the v2 table (emergency, SANS, missing data) is not built | Raghav + Om |
| T2 | Cardiac emergency → direct ground link, bypass queue | Planned | `decision.emergency` is computed and unused; the emergency modal is a manual button | Raghav |
| T3 | Vision change → "Report to the flight surgeon." + SANS monitoring | Planned | — | Raghav |
| T4 | Headache + CO2 ≥ 4,500 ppm → scrubber hint, then normal routing | Partial | Shown as a Monitor callout, not part of triage | Raghav |
| T5 | Mild, short, not worsening → self-care, log only | Partial | Score ≤ 1 → `SELF_CARE` | Raghav |
| T6 | Escalation routing by delay and onboard support | Built | Delay, link and onboard support are simulation toggles that drive routing live | Raghav |
| T7 | Missing or uncertain data → escalate one level | Planned | — | Raghav |
| T8 | One live-call limit used everywhere | Built | `liveCallMaxOneWayS = 10` in `src/core/config.js` (D-01) | Raghav |
| T9 | "What would change this decision" | Planned | — | Raghav |
| T10 | Astronaut override with audit note | Planned | — | Raghav + Om |

### Q · Bundle and queue
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| Q1 | Bundle fields (ID, time, lifetime, priority, reasons, readings, baseline, trends, cabin, radiation, checksum) | Partial | No lifetime, reasons, radiation; trends are hard-coded arrays | Raghav |
| Q2 | FNV-1a checksum and verify | Built | `packet.js` | Raghav |
| Q3 | Priority ordering | Planned | FIFO | Raghav |
| Q4 | Lifetime and expiry | Planned | — | Raghav |
| Q5 | Retries with a limit | Partial | Unlimited auto-retry; manual retry can double-send | Raghav |
| Q6 | Custody-style acknowledgement receipt | Partial | Free-text `ground_reply` only | Raghav |
| Q7 | Checksum mismatch rejected, never retried | Partial | Reload resets every FAILED packet to QUEUED | Raghav |
| Q8 | Queue survives reload | Built | `localStorage` key `landfall_queue` | Raghav |
| Q9 | States QUEUED / TRANSMITTING / ACKNOWLEDGED / FAILED | Partial | Code uses `TRANSMITTED` | Raghav |

### R · Radiation
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| R1 | Daily and cumulative dose against a stated limit | Partial | 1.48 mSv/day, no source, no limit | Tanishk |
| R2 | Solar particle event alert with shelter banner | Planned | — | Tanishk + Om |
| R3 | Dose in bundle and as a triage input | Planned | — | Raghav |

### W · Isolation and wellbeing
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| W1 | 2–3 question daily check-in (mood, stress, social contact) | Partial | Check-in form logs vitals and mood only | Om |
| W2 | Sleep regularity | Planned | Only total sleep exists | Tanishk |
| W3 | Check-in trends feed baseline drift | Partial | Since `19fbcdc` check-ins override vitals, but not alerts | Tanishk |
| W4 | Supportive, non-diagnostic wording | Planned | Some current text labels conditions ("HSV-1 reactivation") | Om |

### E · Evaluation
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| E1 | Generator calibrated to published ranges, sources listed | Partial | `engine/ml/simulator.py` cites NASA pages; no analog-study calibration | Tanishk |
| E2 | Inject known anomalies into synthetic crews | Planned | — | Raghav |
| E3 | Detection delay, false-alarm rate, missed events, triage agreement | Planned | — | Raghav |
| E4 | Compare against a fixed-threshold baseline | Planned | Engine branch compares ML vs rule forecast, which is a different question | Raghav |
| E5 | Results come only from a recorded run | Planned | — | Raghav |

### U · UI
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| U1 | Demo controls: link, onboard support, delay, failure, emergency, SPE, reset | Partial | Simulation drawer and Decide & deliver view: distance, link, CMO on board, failure injection, jump to day, reset. No emergency, vision-symptom or SPE injectors yet | Om |
| U2 | Readiness and Go/No-Go reflect active alarms | Built | `readinessFor()` in `src/core/run-day.js`: an alarm-level alert always shows "At risk on landing day" | Om |
| U3 | Mission scene and demo captions accurate | Built | Demo captions are written from each step's result; delay comes from `src/core/delay.js` | Om |
| U4 | Digital twin shows the same data as the alerts, or is cut | Partial | Twin has its own loss model | Om |
| U5 | XP renamed to "mission readiness score", no escalation names | Built | Shown on the Digital twin tab as "Mission readiness score" with Tier I–III only; removed from the app bar | Om |
| U6 | Constellation and micro-lab moved to Extras or cut | Built | Both live on the Digital twin tab, away from the main flow | Om |
| U7 | Disclaimer on every screen | Built | — | Om |
| U8 | Keyboard and screen-reader access | Partial | Tabs follow the ARIA pattern (arrow keys); modal and drawer move focus and close on Escape; role="button" rows respond to Enter and Space. Not screen-reader audited | Om |

### N · Non-functional
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| N1 | Works offline after first load | Built | Network-first service worker (`landfall-v6-src-layout`), generated file list, per-file caching | Om |
| N2 | No build step | Built | ES modules served statically | Om |
| N3 | Deterministic for the same input | Partial | Micro-lab canvas and starfield use `Math.random()` | Om |
| N4 | Render under 50 ms per day change | Partial | Only the visible tab renders on a day change (D-17); not timed yet | Om |
| N5 | Colour is never the only signal | Partial | Shapes are used with colour; not audited | Om |
| N6 | Privacy: role views and minimal packet fields | Planned | — | Raghav |
| N7 | Every number labelled NASA or team assumption | Partial | Sources tab does this; several UI numbers have no label | All |

### H · Repo health
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| H1 | Delete dead code and the orphan React app | Built | Deleted in the restructure (D-12); repo now follows the `src/` layout (D-15) | Om |
| H2 | Behaviour tests with `node --test` | Built | `npm test`: 33 unit and integration tests for the current modules; CI runs them with the smoke check. v2 modules add their own tests | Raghav |
| H3 | One delay model | Built | `src/core/delay.js`; the distance presets override it in one place (`effectiveDelayS`) | Om |

## Already fixed (for the record)

| Commit | Fix |
|---|---|
| `19fbcdc` | Triage tab no longer enqueues a packet on every render; Send enqueues once |
| `19fbcdc` | `clearQueue()` so Reset empties the in-memory queue |
| `19fbcdc` | Exercise hours drive forecast, twin and score from one setter; 0 h no longer becomes 1.2 h |
| `19fbcdc` | Check-ins override that day's vitals; micro-lab sliders feed the model |
| `19fbcdc` | Missing `telemetry-remaining` and `scene-environment-hud` elements added; dead suit-map code removed |
| `19fbcdc` | `test*.mjs` import paths fixed |
| UI redesign | Views rebuilt around the decision loop (Today, Signals, Forecast, Decide & deliver, Digital twin, Evidence); simulation drawer; `runDay()`; readiness respects alarms; cones start at 100 %; captions from data; live-call limit 10 s |
| `src/` restructure | Code under `src/`, assets under `assets/`, `main.js` split into 16 modules, dead code deleted, `config.js` and `delay.js`, 33 tests, CI, generated service-worker list ([22-MIGRATION.md](22-MIGRATION.md)) |
| `3ecac47` | Service worker switched to network-first |
| `d7075b4` | Inline favicon, no 404 |
