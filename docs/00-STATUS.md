# 00 · Status: v2 Target vs As-Built

Last reviewed: 14 Nov 2026, against `main` at commit `8b24eef` plus the `src/` restructure ([22-MIGRATION.md](22-MIGRATION.md)), and the unmerged branch `origin/engine-ml`.
Update this file in the same pull request as any code change that moves a requirement.

Requirement IDs match [03-PRD.md](03-PRD.md). Owners are proposals until confirmed in [08-TEAM_AND_PLAN.md](08-TEAM_AND_PLAN.md).

## Summary

| Area | Built | Partial | Planned | Headline |
|---|---|---|---|---|
| Decision loop (L) | 0 | 1 | 2 | Detect, Forecast and Act are still three separate features |
| Detect (D) | 0 | 4 | 4 | Baseline and alerts are hard-coded in `src/data/sample-data.js` |
| Forecast (F) | 2 | 2 | 3 | Real engine exists on `origin/engine-ml`, not merged |
| Triage (T) | 0 | 4 | 6 | Hidden score formula; no emergency, SANS or missing-data rules |
| Bundle and queue (Q) | 2 | 5 | 2 | Works end to end; no priority, lifetime or retry limit |
| Radiation (R) | 0 | 1 | 2 | Cumulative dose is shown; no limit, no SPE |
| Isolation (W) | 0 | 2 | 2 | Mood is tracked; no stress, social contact or sleep regularity |
| Evaluation (E) | 0 | 1 | 4 | Engine branch evaluates the forecast model, not detection |
| UI (U) | 1 | 6 | 1 | Only the delay selector and Reset exist as demo controls |
| Non-functional (N) | 2 | 3 | 2 | Offline works; only the visible tab renders; some visuals still use random numbers |
| Repo health (H) | 2 | 1 | 0 | Dead code deleted; 33 behaviour tests and CI; the delay selector is not yet an override of the one delay function |

## The five things blocking the v2 demo

1. **No visible triage table** (T1). The decision is `score = severity + persistence + worsening` in `triage.js`, so the screen can't say which rule fired.
2. **No demo controls** (U1). Without link, onboard-support, failure and emergency toggles, half the triage table can't be shown live.
3. **Readiness headline ignores alarms** (U2). Day 44 shows "Fit for landing" beside a severity-3 alert.
4. **Engine not merged** (F6). Until it is, the demo must not claim ML-powered results.
5. **Three delay models** (H3). The scene, the link presets and the v1 docs give different numbers for the same day.

## Requirement status

### L · Decision loop
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| L1 | Run read → detect → forecast → decide → deliver → explain for the selected day | Partial | Each tab computes its own piece; nothing chains them | Om |
| L2 | One screen shows the loop result | Planned | Overview shows readiness and alerts, but not the decision | Om |
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
| F6 | Ridge-regression engine integrated | Planned | On `origin/engine-ml` (UMD globals `DataEngine`, `ForecastEngine`, `LandfallML`) | Tanishk + Om |
| F7 | "Illustrative, not clinical" labels | Built | Shown on every tab | Om |

### T · Triage
| ID | Requirement | Status | As-built notes | Owner |
|---|---|---|---|---|
| T1 | Visible decision table, fired rule highlighted | Planned | Hidden score | Raghav + Om |
| T2 | Cardiac emergency → direct ground link, bypass queue | Planned | `decision.emergency` is computed and unused; the emergency modal is a manual button | Raghav |
| T3 | Vision change → "Report to the flight surgeon." + SANS monitoring | Planned | — | Raghav |
| T4 | Headache + CO2 ≥ 4,500 ppm → scrubber hint, then normal routing | Partial | Shown as a Monitor callout, not part of triage | Raghav |
| T5 | Mild, short, not worsening → self-care, log only | Partial | Score ≤ 1 → `SELF_CARE` | Raghav |
| T6 | Escalation routing by delay and onboard support | Partial | `onboardSupport` is hard-coded `true` | Raghav |
| T7 | Missing or uncertain data → escalate one level | Planned | — | Raghav |
| T8 | One live-call limit used everywhere | Partial | Code uses 300 s; v1 docs used 10 s. Decision D-01 sets 10 s | Raghav |
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
| U1 | Demo controls: link, onboard support, delay, failure, emergency, SPE, reset | Partial | Delay selector and Reset only | Om |
| U2 | Readiness and Go/No-Go reflect active alarms | Partial | Headline averages forecasts and ignores alerts | Om |
| U3 | Mission scene and demo captions accurate | Partial | Day-54 caption says CMO, triage says flight surgeon; round-trip wrong; "30 s" demo runs 25 s | Om |
| U4 | Digital twin shows the same data as the alerts, or is cut | Partial | Twin has its own loss model | Om |
| U5 | XP renamed to "mission readiness score", no escalation names | Partial | Tier III is called "Flight surgeon escalation" | Om |
| U6 | Constellation and micro-lab moved to Extras or cut | Planned | Both on main tabs | Om |
| U7 | Disclaimer on every screen | Built | — | Om |
| U8 | Keyboard and screen-reader access | Partial | Rows and regions are keyboard-operable; modals do not trap focus | Om |

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
| H3 | One delay model | Partial | Header and mission scene use `src/core/delay.js`; docs agree (168 s on Day 40). The Comms link selector still sets its own preset instead of overriding the function | Om |

## Already fixed (for the record)

| Commit | Fix |
|---|---|
| `19fbcdc` | Triage tab no longer enqueues a packet on every render; Send enqueues once |
| `19fbcdc` | `clearQueue()` so Reset empties the in-memory queue |
| `19fbcdc` | Exercise hours drive forecast, twin and score from one setter; 0 h no longer becomes 1.2 h |
| `19fbcdc` | Check-ins override that day's vitals; micro-lab sliders feed the model |
| `19fbcdc` | Missing `telemetry-remaining` and `scene-environment-hud` elements added; dead suit-map code removed |
| `19fbcdc` | `test*.mjs` import paths fixed |
| `src/` restructure | Code under `src/`, assets under `assets/`, `main.js` split into 16 modules, dead code deleted, `config.js` and `delay.js`, 33 tests, CI, generated service-worker list ([22-MIGRATION.md](22-MIGRATION.md)) |
| `3ecac47` | Service worker switched to network-first |
| `d7075b4` | Inline favicon, no 404 |
