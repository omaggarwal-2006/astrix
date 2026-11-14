# 02 · Problem, NASA Facts and Related Work

## The challenge

*Create Health Monitoring Software for Astronauts on Space Missions* (NASA Space Apps 2026). Long-duration missions expose crews to radiation, isolation and confinement. The challenge asks for software that lets astronauts **evaluate and act on the status of their own health**.

## The need

A Mars-transit crew cannot get a live answer from a doctor. One-way radio delay is roughly 3 to 22 minutes, and up to about 44 minutes for a round trip ([S-06](13-SOURCES.md)). Meanwhile:

- Bone, muscle and heart fitness decline slowly in microgravity.
- Sleep and mood drift under isolation, confinement and workload.
- Cabin CO2 and radiation add environmental stress.
- Several of these hazards make each other worse ([S-01](13-SOURCES.md)).

Small changes can build up unnoticed, and the crew must decide **what to do and who to tell** without a live doctor.

## How LANDFALL maps to the challenge

| Challenge need | LANDFALL feature | Spec |
|---|---|---|
| Monitor health status | Daily read of vitals, symptoms, cabin, exercise, dose, check-in | [14](14-DETECT_SPEC.md) |
| Evaluate status | Personal-baseline drift with fused score and reasons | [14](14-DETECT_SPEC.md) |
| Evaluate trajectory | Landing-day readiness ranges with go/no-go | [15](15-FORECAST_SPEC.md) |
| Act on status | Delay-aware triage table, emergency override, verified bundle | [07](07-TRIAGE_SPEC.md) |
| Radiation | Dose tracker and solar particle event alert | [16](16-RADIATION_AND_ISOLATION.md) |
| Isolation and confinement | Wellbeing check-in, sleep regularity, mood drift | [16](16-RADIATION_AND_ISOLATION.md) |
| Autonomy under delay | Offline app, CMO path, store-and-forward queue | [07](07-TRIAGE_SPEC.md) |
| Physical deconditioning | Forecast with exercise what-if | [15](15-FORECAST_SPEC.md) |

## NASA and published facts we rely on

Every fact below must be opened and confirmed by a team member before submission. Status lives in [13-SOURCES.md](13-SOURCES.md).

| Fact | Value | Used in | Source |
|---|---|---|---|
| Bone mineral density loss on 4–6 month missions | About 1–1.5 % per month | Forecast | S-03 |
| Strength and aerobic capacity loss | About 10–12 % on average | Forecast | S-04 |
| Crew losing more than 20 % | 12–38 % | Forecast uncertainty | S-04 |
| Exercise reference | About 1.5 h per day | Forecast, what-if | S-04 |
| Mars one-way delay | About 3–22 min; up to about 44 min round trip | Delay model, triage | S-06, S-07 |
| Moon one-way light time | About 1.3 s (384,400 km / c) | Delay presets | Physics |
| Operational lunar one-way latency | 3–14 s | Delay presets | S-06 |
| Neutron share of ISS radiation | About 30 % | Radiation context | S-05 |
| Mars-transit daily dose | About 1.8 mSv/day during cruise | Radiation calibration | S-12 (to find and verify) |
| Career effective dose limit | 600 mSv | Radiation limit | S-13 (to find and verify) |

## Our assumptions

These are design choices, not NASA values. They are labelled "team assumption" wherever they appear. The single source of each value is [18-DATA_MODEL.md §7](18-DATA_MODEL.md#7-configuration).

| Assumption | Value | Why we chose it |
|---|---|---|
| Live-call limit (one-way delay) | 10 s | A conversation at minutes of delay is not "live" (decision D-01) |
| Baseline window | Days 1–14 | Early-mission calibration; real use needs pre-flight data |
| Sleep alarm / caution | ≤ 5.0 h / < 6.2 h | Round numbers near common sleep-deficit definitions |
| CO2 scrubber hint | ≥ 4,500 ppm with headache | Matches the as-built rule |
| Cardiac emergency | HR > 120 bpm or systolic BP > 160 mmHg | Simple, conservative trigger for a demo |
| Persistence to escalate | 5 days | Separates a bad night from a slide |
| Missing data | 2 days without a reading | Short enough to notice, long enough to ignore one gap |
| Exercise response curve | Assumed curve | NASA pages give no factor ([15](15-FORECAST_SPEC.md#7-what-if-response-curve)) |
| Mission-day delay model | Linear from 1.3 s to 750 s over 180 days | Simple and monotonic; real delay follows orbital geometry (D-05) |

## Related work and the gap

| Work | What it covers | What LANDFALL adds |
|---|---|---|
| NASA ExMC Clinical Decision Support System | Onboard medical decision support | Delay as the input that changes the responder |
| EIMO concept of operations | Earth-independent medical operations | A working, interactive prototype |
| Digital-twin health frameworks | Personalised physiological modelling | Offline, explainable, and tied to triage |
| ANU Mars-fitness model | Fitness decline modelling | Alerting, triage and delivery around the forecast |
| MediSat and DTN medical messaging | Store-and-forward transport | A health front end that decides what to send and to whom |
| Earlier Space Apps health dashboards | Visualisation of vitals | Personal baseline, forecast, delay logic, verified queue, measured evaluation |

**The gap.** An integrated, offline, explainable prototype in which delay drives the decision, measured against a fixed-threshold baseline.

Each row above needs a citation before it goes on a slide. See [13-SOURCES.md](13-SOURCES.md#related-work).

## Why this is hard (and what we do about it)

| Difficulty | Our answer |
|---|---|
| No real astronaut data is public at the detail we need | Synthetic data calibrated to published ranges, labelled synthetic ([17](17-EVALUATION.md#2-calibrated-synthetic-data-e1)) |
| Medical thresholds need clinicians | Every threshold is a labelled team assumption in one config object |
| "Is the alerting any good?" | An evaluation harness with stated metrics ([17](17-EVALUATION.md)) |
| ML on simulated data learns the simulator | ML is advisory for the forecast only; rules decide |
| Delay changes over the mission | One delay function, overridable by a selector |

## Realistic expectations

Space Apps global winners are a tiny fraction of teams (roughly 10 winners from many thousands; re-check the exact counts before quoting, [S-20](13-SOURCES.md)). The realistic goal is a **local win and global nomination**. Polish, a clear story and a flawless demo matter more than extra features.
