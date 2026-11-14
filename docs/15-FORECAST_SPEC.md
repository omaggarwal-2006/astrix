# 15 · Forecast Specification (v2)

Owner: Tanishk · Target files: `core/forecast.js` (rules) and `engine/` (model) behind `adapter.js` · Tests: `tests/forecast.test.mjs` · Requirements: F1–F7
As-built: `sample/sample_data.js → generateForecastForDay()`, with a different dimension set and fixed ± bands. The model engine is on the unmerged branch `origin/engine-ml`. See [00-STATUS.md](00-STATUS.md#f--forecast).

## 1. Job in the loop

Tell the decision **where this is heading by landing day**, how sure we are, and whether landing readiness is at risk. A projected NO-GO is a triage reason, not just a chart (F5).

## 2. Interface

```js
forecast(history, day, { exerciseHours, config }) → ForecastDimension[]
```

- `exerciseHours` defaults to the astronaut's **last-7-day average** (F4). The what-if slider overrides it.
- Returns six `ForecastDimension` objects ([18-DATA_MODEL.md §5](18-DATA_MODEL.md#5-forecastdimension)).
- Landing day = day 180 (`missionLengthDays`).

## 3. Dimensions

| Key | Label | Unit | Confidence | Main source |
|---|---|---|---|---|
| `bone` | Bone mineral density | % of baseline | High | S-03 (1–1.5 %/month) |
| `muscle` | Muscle strength | % of baseline | Medium | S-04 (10–12 % average loss) |
| `aerobic` | Aerobic capacity | % of baseline | Medium | S-04 |
| `balance` | Balance (sensorimotor) | score 0–100 | Low | S-09 (no published rate we use directly) |
| `sleep` | Sleep readiness | score 0–100 | Medium | S-10 + personal data |
| `mood` | Mood and cognitive resilience | score 0–100 | Low | S-11 + personal data |

This set matches the engine. The as-built "Cardiovascular regulation" dimension is dropped and "Aerobic & muscle power" splits into two (decision D-06).

## 4. Go / caution / no-go (F2)

Thresholds are team assumptions in `config.forecastThresholds` (one default, per-dimension overrides allowed):

| Label | Rule | Default |
|---|---|---|
| **GO** | The whole range is at or above the GO level: `low ≥ go` | `go = 90` |
| **NO-GO** | The middle estimate is below the NO-GO level: `mid < noGo` | `noGo = 80` |
| **CAUTION** | Anything else | — |

Using `low` for GO is deliberately conservative: a dimension is only GO when even the pessimistic end clears the bar. The thresholds are shown on screen next to every range.

## 5. Rules forecast (always available)

The rules forecast is the fallback when the model is unavailable, and the comparison line in the evaluation.

### 5.1 Bone, muscle, aerobic

NASA's published rates describe crews **who exercise** on the ISS. So full adherence uses the NASA rate, and lower adherence multiplies it.

```
a              = clamp(exerciseHours / 1.5, 0, 1)                      // adherence
m(a)           = 1 + (M − 1) · (1 − a)                                 // loss multiplier
lost_so_far    = rate · m(a_history) · months_elapsed
lost_to_come   = rate · m(a) · months_remaining
mid            = 100 − lost_so_far − lost_to_come
```

| Dimension | `rate` (per month) | `M` at zero exercise | Notes |
|---|---|---|---|
| `bone` | 1.25 % (range 1.0–1.5) | 1.8 | NASA rate (S-03); M is illustrative |
| `muscle` | 1.83 % (11 % over 6 months) | 2.2 | NASA average (S-04); M is illustrative |
| `aerobic` | 1.83 % | 2.2 | NASA average (S-04); M is illustrative |

`a_history` is the mean adherence so far; `a` is the slider value.

### 5.2 Range (uncertainty)

- `high` uses the low end of the NASA rate (1.0 %/month for bone, 10 % over 6 months for muscle and aerobic).
- `low` uses the high end (1.5 %/month; 12 % over 6 months), then widens further for muscle and aerobic by `tailFactor` (1.5, team assumption), because 12–38 % of crew lose more than 20 % (S-04).
- Ranges widen with months remaining, so the cone opens toward landing day.

### 5.3 Balance, sleep, mood

These have no published per-month rate we can apply directly, so the rules version is simple and labelled low confidence.

| Dimension | Rules formula (team assumption) |
|---|---|
| `sleep` | `100 × clamp(avg7(sleep_h) / baseline_sleep, 0, 1)`, ± 5 |
| `mood` | `100 × clamp(avg7(mood) / baseline_mood, 0, 1)`, ± 8 |
| `balance` | `86 − 0.4 × max(0, baseline_sleep − avg7(sleep_h))`, ± 4 (the engine's revised rule, see its model card) |

## 6. Model forecast (engine, advisory)

The engine on `origin/engine-ml` is a multi-target ridge regression with 10th/50th/90th-percentile bands, 7.5 KB, offline. Its model card already documents data, evaluation and limits.

### 6.1 How it plugs in (F6)

| Step | What | Owner |
|---|---|---|
| 1 | Merge `origin/engine-ml` into a feature branch; files land in `engine/` | Tanishk |
| 2 | Load `engine/data.js`, `forecast.js`, `model.js`, `predict.js` as classic `<script>` tags **before** `main.js`. They set `window.DataEngine`, `ForecastEngine`, `LANDFALL_MODEL`, `LandfallML` | Om |
| 3 | `adapter.getForecast()` calls `LandfallML.predictLanding(history, { plannedExerciseHours })` and maps the result to `ForecastDimension` | Om |
| 4 | Map status `green / amber / red` → apply §4 thresholds to the engine's `low / mid / high` instead, so one rule labels both forecasts | Om |
| 5 | Normalise engine field names (`heartRate`, `sleepHours`, …) into `DayReading` in one function in the adapter | Tanishk |
| 6 | Use `DataEngine` history for Detect too, so alerts and forecast read the same data | Tanishk |
| 7 | Add `engine/*.js` and `engine/model.json` to the service-worker cache | Om |
| 8 | In Node tests, load the UMD files with `createRequire` | Raghav |

### 6.2 Fallback

If `LandfallML` is missing, `model.json` fails to load, or a call throws, the adapter returns the rules forecast. The UI badge then says **"Forecast: rules (model unavailable)"**. With the model it says **"Forecast: model v1.0.0, advisory; rules shown for comparison"**.

### 6.3 What we may claim

| Situation | Allowed wording |
|---|---|
| Before merge | "A forecast model is built; integration is in progress." No ML claims about the demo. |
| After merge | "An illustrative ridge-regression model trained on synthetic data, compared with a rule-based forecast." |
| Never | "Accurate", "validated", "predicts astronaut health". Held-out synthetic accuracy is not clinical validation. |

## 7. What-if response curve

- Slider range 0–1.5 h/day, step 0.1.
- The response is `m(a)` in §5.1: **a team assumption**, labelled on screen.
- Where a countermeasure study supports a number, show its source next to the slider ([13-SOURCES.md](13-SOURCES.md)).
- Required property: **monotonic**. More exercise never lowers any dimension. Tested for both forecasts (the engine's model card reports 6/6 monotonic).

## 8. Feeding triage (F5)

| Forecast state | Triage effect |
|---|---|
| Any dimension NO-GO | Adds reason `LANDING_AT_RISK` ("Landing readiness at risk: {dimension} {mid}% vs {noGo}% no-go level"). Counts as one flag in the escalation rule |
| Any dimension CAUTION only | Shown on the Today screen; no triage effect |
| Model and rules disagree on GO vs NO-GO | Use the worse label (fail-safe) and lower confidence to `medium` |

## 9. Display rules

- Always a range with the middle marked, never a single line.
- The cone starts at 100 % at departure (the as-built cone starts at 80 %, a known bug).
- Thresholds drawn as horizontal guides.
- Source badge (§6.2) and "illustrative model, not a clinical predictor" under every forecast.

## 10. Tests

| Test | Expect |
|---|---|
| Monotonic slider, rules | 0 → 1.5 h never lowers any dimension |
| Monotonic slider, model | Same, via the adapter |
| Full adherence, day 180, bone | `mid` within the NASA 6–9 % loss range (91–94 %) |
| Range order | `low ≤ mid ≤ high` for every dimension and day |
| Threshold labels | Hand-built ranges give GO, CAUTION and NO-GO as §4 says |
| NO-GO → triage | `LANDING_AT_RISK` reason appears |
| Model missing | Rules returned, badge says rules |
| Determinism | Same inputs, same output |
