# 12 · Safety, Ethics, Privacy, Limits and Risks (v2)

## Safety principles

| Principle | How the design enforces it |
|---|---|
| Not a medical device | "Illustrative, not a clinical tool" on every screen and in the README; no diagnosis words ([16 §2.4](16-RADIATION_AND_ISOLATION.md#24-wording-rules-w4)) |
| Fail-safe | Missing or low-confidence data escalates one level (rule `DATA_MISSING`); model–rules disagreement takes the worse label |
| Emergencies never wait | `EMERGENCY_CARDIAC` and `SPE_SHELTER` are checked before routing and don't depend on the link or the queue |
| Human in charge | Any decision can be overridden with a note; the note goes to the audit log and to Earth |
| Exact safety wording | Four strings are fixed and tested ([07 §8](07-TRIAGE_SPEC.md#8-safety-wording-do-not-change)) |
| Honest numbers | NASA figures carry sources; every threshold and the exercise curve are labelled team assumptions |
| Honest evidence | Evaluation numbers come only from a recorded run, labelled synthetic |

## Privacy: who sees what

Crew medical data is private. The design sends only what the flight surgeon needs.

| Data | Astronaut | Crew medical officer | Flight surgeon (bundle) |
|---|---|---|---|
| Today's vitals and alerts | Yes | Yes | The alerts and readings of the reported case |
| Full daily history | Yes | Yes | 7- and 30-day trends of the flagged metrics only |
| Wellbeing check-in scores | Yes | Yes | 7-day trend and flags |
| Private check-in note | Yes | If shared | Only if "include in report" |
| Override notes | Yes | Yes | Yes (audit) |
| Radiation dose | Yes | Yes | Yes |
| Forecast | Yes | Yes | Labels and middle values |

In the prototype all roles share one browser. The table defines what each **view** and the **bundle** contain, and is tested on the bundle.

## Ethics

- **Gamified health.** Points and tiers can trivialise health or reward clicking. v2 renames XP to a "mission readiness score" with no escalation names and no interaction points (D-08), or cuts it.
- **Alarm fatigue.** Too many alerts teach people to ignore them. The evaluation reports the false-alarm rate, and fusion reduces single-signal noise.
- **Over-trust.** A polished UI can look more certain than it is. Ranges, confidence levels and source badges keep uncertainty visible.
- **Mental-health wording.** Supportive, non-labelling text; the app suggests talking to the CMO and never names a condition.

## Assumptions

All values are in [18-DATA_MODEL.md §7](18-DATA_MODEL.md#7-configuration).

1. Telemetry is synthetic. Real physiological data is noisier and has gaps.
2. Triage thresholds, the 10 s live-call limit and the 5-day persistence rule are team choices, not clinical guidelines.
3. The exercise response curve and zero-exercise multipliers are assumptions.
4. The mission delay is linear in mission day; real delay follows orbital geometry.
5. The ground link, flight-surgeon replies and receipts are simulated, and time is sped up 100×.
6. The radiation limit is a career limit; the demo assumes no prior dose.
7. The FNV-1a checksum is integrity-only, not security.
8. The ML forecast is trained and evaluated on its own simulator.

## Known limits (state them in the deck)

- Synthetic data; assumed thresholds; simulated link.
- Delay figures unverified until the NTRS pages are opened.
- ML engine not merged yet (say "model built, integration in progress" until it is).
- Known current bugs until fixed: readiness headline ignores alarms, wrong demo captions, three delay models ([00-STATUS.md](00-STATUS.md)).
- One astronaut in the UI.

## Risks and mitigations

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| v2 scope too big for the time left | High | High | Cut line in [04-MVP.md](04-MVP.md#cut-line-if-time-runs-short-in-this-order); triage table and demo controls first | Raghav |
| Docs and code drift apart again | High | Medium | [00-STATUS.md](00-STATUS.md) updated in every PR; one config file | All |
| Engine merge breaks the UI | Medium | Medium | Merge on a branch; adapter fallback to rules | Tanishk |
| Evaluation shows no advantage | Medium | Medium | Report it honestly; a mixed result with a clear method still beats a claim | Raghav |
| Judges see "just a dashboard" | High | Medium | Lead with delay changing the responder, live, from the controls | Raghav |
| Overclaiming novelty or accuracy | Medium | Medium | Related Work slide; wording rules in [15 §6.3](15-FORECAST_SPEC.md#63-what-we-may-claim) | Raghav |
| Medical misinterpretation | Medium | Low | Disclaimers, supportive wording, no diagnosis | Om |
| Unverified NASA figures quoted | Medium | Medium | Open every source; remove unverified claims | Raghav |
| Demo fails live (storage, browser) | Medium | Low | Reset button, two browsers tested, backup video | Om |
| Dead code confuses reviewers | Low | Low | Done: deleted in the restructure (D-12) | Om |
| Merge conflicts in one big UI file | Low | Low | Done: `main.js` split into `src/app/` and `src/ui/` modules (22-MIGRATION.md); CODEOWNERS routes reviews | Om |
| Git identities don't match credits | Low | Medium | Agree one name and email each | All |

## What LANDFALL is not

- Not a medical device, not validated, not a diagnosis or treatment tool.
- Not novel in each component. The contribution is the integration, with delay driving the decision, and a measured evaluation.

## Future work (deck only)

Real contact-window schedules; signed and encrypted bundles (BPSec); real DTN transport (Bundle Protocol v7); wearable ingestion; multi-crew view; clinician-validated thresholds; real analog-mission data; an ML anomaly score shown beside the rules.
