# 14 · Detect Specification (v2)

Owner: Tanishk · Target file: `core/detect.js` · Tests: `tests/detect.test.mjs` · Requirements: D1–D8, W3
As-built: alerts are scripted in `sample/sample_data.js` (`generateAlertsForDay`). Nothing below is computed yet. See [00-STATUS.md](00-STATUS.md#d--detect).

## 1. Job in the loop

Tell the decision **what changed for this person**: which signals moved away from their own baseline, for how long, in which direction, and how sure we are.

## 2. Interface

```js
detect(history, day, config) → DetectResult
```

- `history`: array of `DayReading` objects for days 1…day ([18-DATA_MODEL.md §2](18-DATA_MODEL.md#2-dayreading)). Missing days or fields are allowed.
- Pure function: no DOM, no storage, no randomness. Same input, same output.
- Returns `{ baseline, alerts, fused, missing, confidence }` ([18 §3](18-DATA_MODEL.md#3-alert)).

## 3. Signals

| Metric | Unit | Adverse direction | Compared against | Hard limits (team assumption) |
|---|---|---|---|---|
| `sleep_h` | h | Low | Personal baseline | Caution < 6.2 · Alarm ≤ 5.0 |
| `sleep_regularity_min` | min (SD of mid-sleep time, 7 days) | High | Personal baseline | — |
| `mood` | 1–5 | Low | Personal baseline | Caution < 3.4 |
| `stress` | 1–5 | High | Personal baseline | — |
| `social` | 1–5 | Low | Personal baseline | — |
| `hr_bpm` | bpm (resting) | High | Personal baseline | Emergency > 120 (handled by triage) |
| `bp_sys` | mmHg | High | Personal baseline | Emergency > 160 (handled by triage) |
| `exercise_min` | min/day | Low | Personal baseline | — |
| `co2_ppm` | ppm | High | **Absolute limits** (cabin, not personal) | Hint ≥ 4,500 · High ≥ 5,000 |
| `symptoms` | list | Present | Presence | Vision symptoms → triage rule T3 |
| `dose_mSv` | mSv/day | High | **Absolute limits** | See [16 §1](16-RADIATION_AND_ISOLATION.md#1-radiation-dose-tracker) |

Cabin CO2 and radiation are environmental, so they use absolute limits, not a personal baseline.

## 4. Detectors

### 4.1 Baseline (D1)

- Window: days `baselineStartDay`–`baselineEndDay` (1–14).
- Per metric: mean and standard deviation over the valid days in the window.
- Needs at least `baselineMinDays` (10) valid days. With fewer, the baseline is marked `provisional` and every alert on that metric gets `confidence: "low"`.
- SD floor, so a very steady baseline doesn't turn tiny changes into huge z-scores:

| Metric | SD floor (team assumption) |
|---|---|
| `sleep_h` | 0.3 h |
| `sleep_regularity_min` | 10 min |
| `mood`, `stress`, `social` | 0.3 |
| `hr_bpm` | 2 bpm |
| `bp_sys` | 3 mmHg |
| `exercise_min` | 10 min |

### 4.2 z-score (D2)

```
z      = (x − mean) / max(sd, sdFloor)
z_adv  = z × direction        // direction = +1 if high is adverse, −1 if low is adverse
```

`z_adv > 0` always means "worse". The UI shows the signed z and the plain direction ("lower than usual").

### 4.3 EWMA drift (D3)

Catches slow drifts that never cross a single-day z limit.

```
e_0  = baseline mean
e_t  = λ·x_t + (1 − λ)·e_{t−1}
limit = mean ± L · sd · sqrt(λ / (2 − λ))
```

| Parameter | Value | Note |
|---|---|---|
| λ (`ewmaLambda`) | 0.3 | Weights recent days; team assumption |
| L (`ewmaL`) | 3 | Textbook control-limit multiplier |

An EWMA crossing on the adverse side raises a `drift` flag at level 1 (mild), even when today's z is small.

### 4.4 CUSUM (optional, nice-to-have)

```
S_t = max(0, S_{t−1} + z_adv,t − k)     k = 0.5, h = 4
```

Signal when `S_t > h`. Shown beside EWMA for comparison in the evaluation only.

### 4.5 Flag level per metric

| Level | Severity | Condition (any) |
|---|---|---|
| Mild | 1 | `z_adv ≥ 1.5`, or EWMA crossing |
| Caution | 2 | `z_adv ≥ 2.0`, or a hard caution limit |
| Alarm | 3 | `z_adv ≥ 3.0`, or a hard alarm limit |

### 4.6 Persistence and worsening (D6)

- `persisted_days`: consecutive days, ending today, on which the metric had any flag.
- `worsening`: `mean(z_adv, last 3 days) − mean(z_adv, previous 3 days) > 0.25`.
- `improving`: the same difference `< −0.25`.

A one-night dip has `persisted_days = 1`. A week-long slide has `persisted_days ≥ 5` and usually `worsening = true`.

### 4.7 Signal fusion (D4)

Several mild changes together matter more than one.

- **Contributors**: metrics flagged today (any level), plus "symptoms present" as one contributor.
- **Fused alert** when there are at least `fusionMinSignals` (2) contributors.
- **Fused severity** = the highest contributor level, plus 1 if there are 3 or more contributors, capped at 3.
- **Fused score** (shown, not used for routing) = `Σ min(z_adv, 4)` over contributors. It's a readable "how much is moving" number.

The fused alert lists its contributors, so it stays explainable: "Sleep, mood and CO2 changed together today."

### 4.8 Missing data (D5)

- A metric with no reading for `missingDaysCaution` (2) consecutive days raises a `MISSING` alert at severity 2.
- A missing daily check-in counts the same way for `mood`, `stress` and `social`.
- Missing data lowers confidence (§5) and triggers triage rule T7 (escalate one level).
- Text: "No sleep data for 2 days. LANDFALL can't tell if sleep is normal."

## 5. Confidence (D8)

| Level | When |
|---|---|
| `high` | No missing core metric in the last 7 days, baseline not provisional, and z and EWMA agree |
| `medium` | One missing day in the last 7, or only one detector fired |
| `low` | Two or more missing days in the last 7, or a provisional baseline |

Core metrics: `sleep_h`, `mood`, `hr_bpm`, `bp_sys`, `exercise_min`.

## 6. Alert text (D7)

Template:

```
{Metric} {value}{unit} vs your {baseline}{unit} baseline, {ordinal} {day word}, {trend}.
```

| Part | Rule |
|---|---|
| `{ordinal} {day word}` | "4th short night" for sleep; "3rd day" otherwise |
| `{trend}` | "still falling" / "still rising" if worsening; "recovering" if improving; "steady" otherwise |

Examples:

- "Sleep 5.4 h vs your 7.4 h baseline, 4th short night, still falling."
- "Resting heart rate 74 bpm vs your 64 bpm baseline, 2nd day, steady."
- "Cabin CO2 5,200 ppm, above the 4,500 ppm hint level, 3rd day."
- "Sleep, mood and CO2 changed together today (fused score 6.1)."

Rules: no diagnosis words, no "you have…". Values come from data; text is never written by hand.

## 7. Output shape (summary)

Full schema in [18-DATA_MODEL.md §3](18-DATA_MODEL.md#3-alert). Each alert keeps the v1 fields for compatibility and adds:

| Field | Type | Meaning |
|---|---|---|
| `detector` | `"z" \| "ewma" \| "limit" \| "fusion" \| "missing"` | What fired |
| `level` | `"mild" \| "caution" \| "alarm"` | Word form of `severity` |
| `confidence` | `"high" \| "medium" \| "low"` | §5 |
| `contributors` | `string[]` | Fused alerts only |
| `text` | `string` | §6 |

## 8. Tests

| Test | Expect |
|---|---|
| Baseline from a known 14-day series | Mean and SD match a hand calculation |
| SD floor | A flat baseline doesn't give z = ∞ |
| One bad night (day 40 only) | `persisted_days = 1`, `worsening = false`, severity from z only |
| Five-day slide | `persisted_days = 5`, `worsening = true` |
| Slow drift of 0.2 SD per day | EWMA fires before z reaches 1.5 |
| Two mild flags on one day | One fused alert, severity 1, both contributors listed |
| Three flags, one caution | Fused severity 3 |
| No sleep data for 2 days | `MISSING` alert, confidence `low` |
| CO2 5,200 ppm | Absolute-limit alert, not a z-score alert |
| Determinism | Two runs, identical output |

## 9. Relationship to the ML engine

The engine branch computes CUSUM sleep debt as a **feature for the forecast model**. That's not the same as alerting. Detect stays rule-based (decision D-02). If the model offers an anomaly score later, it's shown beside the rule result and never changes `severity`.
