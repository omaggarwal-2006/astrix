# 02 · Problem, NASA Facts and Related Work

## Challenge
*Create Health Monitoring Software for Astronauts on Space Missions* (NASA Space Apps 2026). Theme: long-duration missions expose astronauts to radiation, isolation and confinement; software should let astronauts **evaluate and act on the status of their own health**.

## How LANDFALL maps to the challenge
| Challenge need | LANDFALL feature |
|---|---|
| Monitor health status | Baseline + daily telemetry view |
| Evaluate status | Explainable drift alerts, severity score |
| Act on status | Delay-aware triage + proposed action + packet |
| Isolation / confinement | Mood and sleep drift flags |
| Autonomy under delay | Offline operation, CMO path, store-and-forward |
| Physical deconditioning | Landing-day forecast with exercise what-if |

## NASA-sourced facts used (verify before final submission)
- Bone loss on long missions: about 1–1.5 % per month (4–6 month missions).
- Strength / aerobic capacity loss: about 10–12 % on average; 12–38 % of crew lose more than 20 %.
- Exercise on ISS: about 1.5 hours per day.
- Communication delay: Moon one-way light-time about 1.3 s (NASA NTRS reports operational lunar latency of 3–14 s one-way); Mars one-way about 3–22 min, up to about 44 min round trip (NASA NTRS 20250000703).
- **Status:** delay figures were seen only as search snippets. Open the NTRS pages and confirm before removing the "source pending" label in `js/sources.js`. Also fix: Om's current Moon value "~2.6–3 s" is a **round trip**, not one-way.

## Our assumptions (must be labeled as such everywhere)
- Non-linear exercise-adherence response in the forecast.
- Triage thresholds: live-call limit 10 s delay, sleep alarm 5.0 h, sleep caution 6.2 h, mood caution 3.4, CO2 ceiling 4500 ppm / high 5000 ppm, persistence escalation 5 days, lookback 14 days.
- Linear comm-delay model in the demo: `round(1.5 + (day/180) * 750)` seconds.

## Related work and the gap
| Work | What it covers | What it lacks vs LANDFALL |
|---|---|---|
| NASA ExMC Clinical Decision Support System | Onboard medical decision support | Not a baseline-drift + forecast + packet-queue demo |
| EIMO concept of operations | Autonomous medical operations concept | Concept, not an interactive prototype |
| Digital-twin health frameworks (papers) | Personalized modelling | Rarely offline, rarely delay-aware triage |
| ANU Mars-fitness model | Fitness decline modelling | No alerting / triage / comms |
| MediSat / DTN medical messaging | Store-and-forward transport | No health analytics front-end |
| Prior Space Apps health dashboards | Visualization | Usually no forecast, no delay logic, no queue |

**Gap:** an integrated, offline, working prototype with explainable alerts, a what-if forecast, and checksum-verified queued reporting. Put a "Related Work" slide in the deck listing the first four rows.

## Realistic expectations
2025 Space Apps: 10 global winners from about 18,860 teams (~0.05 %). 2024: top 10 of 9,900+, 40 global finalists. Realistic goal: **local win / global nominee**; polish, a clear story and a flawless demo matter more than extra features.
