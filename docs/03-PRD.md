# 03 · Product Requirements Document (PRD)

Version 2.0 · 14 Nov 2026 · Status: target for the hackathon build · Idea owner: Raghav (with Tanishk, Om)
Supersedes PRD v1.0. Current build status per requirement: [00-STATUS.md](00-STATUS.md).

## 1. Purpose

Define what LANDFALL must do so a deep-space crew member can evaluate and act on their own health when Earth is minutes away or out of contact.

## 2. Goals

| ID | Goal | Measured by |
|---|---|---|
| G1 | Decide who should act on a health signal, given the current delay | Triage table covers every row; tests per row |
| G2 | Detect drift from each astronaut's **own** baseline, and explain it | Evaluation harness: detection delay and false alarms vs a fixed threshold |
| G3 | Forecast landing-day readiness with uncertainty, and feed it into the decision | "Landing readiness at risk" appears as a triage reason |
| G4 | Deliver a verifiable report that survives link loss | Queue tests: link down, failure, expiry, tamper |
| G5 | Cover radiation and isolation, as the challenge text does | Dose tracker, SPE alert, wellbeing check-in |
| G6 | Run fully offline in a browser with zero setup beyond a static server | Offline test with network disabled |
| G7 | Be honest: label every number, never overclaim | Sources tab, disclaimers, review checklist |

## 3. Non-goals

- Diagnosis, treatment advice or regulatory-grade medical software.
- Real telemetry, real networking, multiple user accounts or a backend.
- Replacing the crew's judgement: the app advises, the crew decides.
- ML-driven alerting or triage.

## 4. Personas

| Persona | Need | Success |
|---|---|---|
| Astronaut on Mars transit | Know what changed and what to do | Reads the Today screen and next step in under 10 s |
| Crew medical officer | A prioritised, explained case | Sees fired rules, reasons, trends and the bundle |
| Flight surgeon (Earth) | A compact report that can be trusted | Receives a bundle with checksum, trends and baseline, delivered after link loss |
| Judge or reviewer | Understand the idea and trust it | Sees the loop in 3 minutes, plus sources and an evaluation |

## 5. User stories

| ID | As a… | I want… | So that… |
|---|---|---|---|
| US-1 | Astronaut | Today's result on one screen | I don't have to read five tabs |
| US-2 | Astronaut | To see why an alert fired (metric, size, days, trend, confidence) | I can trust it or challenge it |
| US-3 | Astronaut | To know when data is missing | Silence isn't mistaken for "all fine" |
| US-4 | Astronaut | To move an exercise slider and see the landing range move | I see what my effort changes |
| US-5 | Astronaut | To see who should act at the current delay, and which rule decided | I act without waiting for Earth |
| US-6 | Astronaut | To know what would change the decision | I know what to fix |
| US-7 | Astronaut | To override with a note | The app advises and I decide |
| US-8 | Astronaut in an emergency | A direct-ground-link instruction regardless of queue state | Safety never waits on a queue |
| US-9 | Astronaut during a solar particle event | A shelter instruction | I protect myself first |
| US-10 | Astronaut | A short daily wellbeing check-in | Isolation effects are tracked like any other signal |
| US-11 | CMO | The case summary with fired rules and the bundle | I can take over the case |
| US-12 | Flight surgeon | A bundle with checksum, priority and lifetime | I know it's intact and how urgent it is |
| US-13 | Reviewer | All sources, assumptions and an evaluation | I can judge the claims |

## 6. Functional requirements

Each requirement has an owner and an acceptance check. Status is tracked in [00-STATUS.md](00-STATUS.md). Thresholds come from [18-DATA_MODEL.md §7](18-DATA_MODEL.md#7-configuration).

### L · Decision loop
| ID | Requirement | Acceptance |
|---|---|---|
| L1 | For the selected day, run read → detect → forecast → decide → deliver → explain as one pipeline (`runDay(day, env)`) | One function call returns a `DayResult` ([18](18-DATA_MODEL.md#6-dayresult)) |
| L2 | The Today screen shows the `DayResult`: status, alerts, readiness range, decision, bundle state | All five visible without scrolling at 1366×768 |
| L3 | Plain-words chain: what changed, why it matters, if nothing changes, who acts, what would change it | Five labelled sentences, generated from data, no free text |

### D · Detect ([14-DETECT_SPEC.md](14-DETECT_SPEC.md))
| ID | Requirement | Acceptance |
|---|---|---|
| D1 | Baseline mean and SD per metric from days 1–14 | Computed, not hard-coded; unit test |
| D2 | z-score against the personal baseline | Unit test on known data |
| D3 | EWMA (and optionally CUSUM) drift detection | Catches an injected slow drift earlier than z alone (harness) |
| D4 | Fused score across sleep, mood, HR, CO2, symptoms, check-in | Two mild flags on the same day raise one fused alert |
| D5 | Missing data for ≥ 2 days raises a caution alert | Unit test; shown on Today screen |
| D6 | `persisted_days` and `worsening` computed from history | Unit tests: 1-night dip vs 5-day slide |
| D7 | Alert text states metric, value vs baseline, days, trend | Matches the template in [14 §6](14-DETECT_SPEC.md#6-alert-text-d7) |
| D8 | Alert carries a confidence level | `high` / `medium` / `low` from data completeness and signal agreement |

### F · Forecast ([15-FORECAST_SPEC.md](15-FORECAST_SPEC.md))
| ID | Requirement | Acceptance |
|---|---|---|
| F1 | Landing-day range (low, mid, high) for bone, muscle, aerobic, plus balance, sleep, mood | Six `ForecastDimension` objects |
| F2 | GO / CAUTION / NO-GO per dimension against stated thresholds | Thresholds shown in the UI |
| F3 | What-if exercise slider (0–1.5 h/day) | Range moves monotonically (test) |
| F4 | Default adherence = astronaut's last-7-day average | Not a fixed 1.2 h |
| F5 | Any NO-GO dimension adds "landing readiness at risk" to the triage reasons | Triage test |
| F6 | Engine from `origin/engine-ml` behind `adapter.js` | Adapter swap only; UI unchanged; fallback to rules if the model fails |
| F7 | "Illustrative model, not a clinical predictor" on every forecast | Visible text |

### T · Triage ([07-TRIAGE_SPEC.md](07-TRIAGE_SPEC.md))
| ID | Requirement | Acceptance |
|---|---|---|
| T1 | Decision table visible, fired rule(s) highlighted | Each table row has a test and a demo control path |
| T2 | Cardiac emergency → direct ground link now, bypass the queue | Works with the link down; no bundle wait |
| T3 | Vision change → exact text "Report to the flight surgeon." plus SANS monitoring | Exact-string test |
| T4 | Headache + CO2 ≥ 4,500 ppm → "Headache plus high CO2: check the scrubber first." then normal routing | Exact-string test |
| T5 | Mild, short, not worsening → self-care, log only | No bundle created |
| T6 | Escalation routing by live-call limit, link state and onboard support | Three routing tests |
| T7 | Missing or low-confidence data → escalate one level and say why | Test |
| T8 | One live-call limit (`liveCallMaxOneWayS`, 10 s) used by every module | Grep shows one definition |
| T9 | "What would change this decision" per fired rule | Template per rule |
| T10 | Override with a note; stored in an audit log and sent in the next bundle | Audit entry survives reload |

### Q · Bundle and queue ([07-TRIAGE_SPEC.md §5–6](07-TRIAGE_SPEC.md#5-the-bundle))
| ID | Requirement | Acceptance |
|---|---|---|
| Q1 | Bundle has every field in [18 §4](18-DATA_MODEL.md#4-bundle) | Schema test |
| Q2 | FNV-1a checksum over non-volatile fields; `verifyBundle` | Tamper test fails verification |
| Q3 | Priority ordering: EXPEDITED, then NORMAL, then BULK; FIFO within a class | Order test |
| Q4 | Lifetime; an expired bundle becomes FAILED "expired before contact" | Test with a short lifetime |
| Q5 | Auto-retry up to `maxAttempts` (3); manual retry after that | Test; no double transmission |
| Q6 | Acknowledgement recorded as a custody-style receipt | Receipt fields present |
| Q7 | Checksum mismatch → FAILED, `retryable: false`, never retried, even after reload | Test |
| Q8 | Queue survives reload; TRANSMITTING returns to QUEUED | Test |
| Q9 | States: QUEUED, TRANSMITTING, ACKNOWLEDGED, FAILED | Enum test |

### R · Radiation ([16 §1](16-RADIATION_AND_ISOLATION.md#1-radiation-dose-tracker))
| ID | Requirement | Acceptance |
|---|---|---|
| R1 | Daily and cumulative dose shown against a stated limit | Limit and source visible |
| R2 | SPE (sudden dose-rate jump) → "Shelter in the protected area now." banner | Banner shows with link down; bundle queued EXPEDITED |
| R3 | Dose in every bundle; SPE and limit approach are triage inputs | Schema and triage tests |

### W · Isolation and wellbeing ([16 §2](16-RADIATION_AND_ISOLATION.md#2-isolation-and-wellbeing-check-in))
| ID | Requirement | Acceptance |
|---|---|---|
| W1 | 3-question daily check-in (mood, stress, social contact), 1–5 scale | Saved per day |
| W2 | Sleep regularity from bed and wake times | SD of mid-sleep time over 7 days |
| W3 | Check-in metrics feed the same baseline-drift logic | Drift test |
| W4 | Supportive, non-diagnostic wording | Review checklist in [16 §2.4](16-RADIATION_AND_ISOLATION.md#24-wording-rules-w4) |

### E · Evaluation ([17-EVALUATION.md](17-EVALUATION.md))
| ID | Requirement | Acceptance |
|---|---|---|
| E1 | Synthetic generator calibrated to published ranges; sources listed | Calibration table with sources |
| E2 | Inject known anomalies into synthetic crews (seeded) | Same seed gives the same results |
| E3 | Report detection delay, false-alarm rate, missed events, triage agreement | `eval/results.json` and a Markdown table |
| E4 | Compare against a fixed-threshold baseline | Both columns in the report |
| E5 | Numbers come only from a recorded run | Results file carries seed, commit and date |

### U · UI ([19-UI_GUIDE.md](19-UI_GUIDE.md))
| ID | Requirement | Acceptance |
|---|---|---|
| U1 | Demo controls: link up/down, onboard support, delay selector, failure injection, emergency injector, SPE injector, reset | Every triage row reachable live |
| U2 | Readiness headline and Go/No-Go reflect active alarms | An active severity-3 alert can never show "Fit for landing" |
| U3 | Scene and demo captions use the real delay function and real triage output | Captions generated from data, not hard-coded |
| U4 | Digital twin shows the same data as the alerts, or moves to Extras | No second loss model |
| U5 | XP becomes "mission readiness score" with no escalation names, or is cut | — |
| U6 | Constellation and micro-lab move to an Extras tab | Main flow has no unrelated visuals |
| U7 | Disclaimer on every screen | — |
| U8 | Keyboard operable; modals trap focus and close on Escape | Manual a11y check |

## 7. Non-functional requirements

| ID | Requirement |
|---|---|
| N1 | Offline after first load: no CDN, no runtime network calls; service worker caches every asset including `engine/model.json` |
| N2 | No build step; ES modules served by any static server |
| N3 | Deterministic: same day, same inputs, same outputs (seeded randomness only) |
| N4 | A day change renders in under 50 ms; only the visible tab re-renders |
| N5 | Colour is never the only signal; shapes and words accompany it; contrast ≥ 4.5:1 for text |
| N6 | Privacy: role-based views; the bundle carries only the fields the flight surgeon needs |
| N7 | Honesty: every number labelled NASA (with source) or team assumption |
| N8 | Safety wording is exact and tested (see [07 §8](07-TRIAGE_SPEC.md#8-safety-wording-do-not-change)) |

## 8. Acceptance criteria for the demo build

| ID | Criterion |
|---|---|
| AC1 | Day 40 shows a drift alert with reasons and a fused score |
| AC2 | Forecast range moves monotonically with the slider; a NO-GO adds "landing readiness at risk" to triage |
| AC3 | Day 40 at the default delay (about 168 s) routes to the CMO with the fired rule highlighted; with onboard support off it routes to the flight surgeon by bundle |
| AC4 | Link off: bundle QUEUED and survives reload. Link on: TRANSMITTING → ACKNOWLEDGED with a receipt |
| AC5 | Failure injection: FAILED → auto-retry → ACKNOWLEDGED; after 3 failures, manual retry |
| AC6 | Tampered bundle: FAILED, not retryable, even after reload |
| AC7 | Emergency vitals: direct-ground-link banner with the link down |
| AC8 | SPE: shelter banner; EXPEDITED bundle ahead of NORMAL ones |
| AC9 | `npm test` passes; evaluation report generated from a recorded run |
| AC10 | Works with the network disabled after one load |

## 9. Open questions

| ID | Question | Owner |
|---|---|---|
| OQ1 | Official Space Apps 2026 judging criteria, submission format and deadline | Raghav |
| OQ2 | Exact NTRS delay figures, confirmed by opening the pages | Raghav |
| OQ3 | Radiation limit and transit dose-rate source to cite | Tanishk |
| OQ4 | Is the twin kept on the main flow (U4)? | Om |
| OQ5 | Can we use any real analog-mission data to cross-check the generator? | Tanishk |
