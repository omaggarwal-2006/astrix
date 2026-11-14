# 16 · Radiation and Isolation Modules (v2)

The challenge names radiation, isolation and confinement. v1 covered them thinly. v2 adds two **small** modules that close the gap without becoming a second product. Both feed the same decision loop.

| Module | Owner | Target files | Requirements |
|---|---|---|---|
| Radiation dose tracker | Tanishk (data, rules) · Om (UI) | `src/core/radiation.js` | R1–R3 |
| Wellbeing check-in | Om (UI) · Tanishk (metrics) | `src/core/wellbeing.js` | W1–W4 |

As-built: Monitor shows a cumulative dose (1.48 mSv/day, unsourced, no limit) and a check-in form with vitals and mood only. See [00-STATUS.md](00-STATUS.md#r--radiation).

---

## 1. Radiation dose tracker

### 1.1 Data

| Field | Unit | Meaning |
|---|---|---|
| `dose_mSv` | mSv/day | Daily dose |
| `dose_cum_mSv` | mSv | Mission total so far |
| `dose_rate_peak_uSv_h` | µSv/h | Highest hourly rate that day |
| `spe` | object or `null` | Solar particle event details (§1.3) |

The generator draws the daily background dose around a value **calibrated to published Mars-transit measurements** (target about 1.8 mSv/day during cruise, S-12, to be verified), with small seeded day-to-day variation. The as-built 1.48 mSv/day and the engine's 1.45 mSv/day must be replaced by the one configured value, `doseBackgroundMSvDay`.

### 1.2 Dose against a limit (R1)

- Show the cumulative dose as a bar against the configured limit `doseLimitMSv` (career effective-dose limit, 600 mSv in NASA's current standard, S-13, to be verified).
- The limit is a **career** limit. The demo assumes no prior career dose, and the screen says so.
- Also show the projected dose at landing day at the current background rate.

| State | Condition (team assumption) | Effect |
|---|---|---|
| Normal | Cumulative < 50 % of limit | Bar only |
| Caution | Cumulative ≥ 50 % of limit | Alert severity 2: "Radiation dose has reached half of the career limit." |
| Alarm | Projected landing-day dose ≥ 80 % of limit | Alert severity 3, triage `E_ALARM` |

### 1.3 Solar particle event (SPE) alert (R2)

A sudden jump in dose rate means an SPE. The safe response doesn't depend on Earth.

| Item | Rule (team assumption) |
|---|---|
| Background rate | `doseBackgroundMSvDay × 1000 / 24` µSv/h (about 75 µSv/h at 1.8 mSv/day) |
| SPE starts | Hourly rate ≥ `speRateFactor` (10) × background |
| SPE ends | Rate < 2 × background for 1 hour |
| Banner | **"Solar particle event: shelter in the protected area now."** Red, persistent, top of every screen |
| Delivery | EXPEDITED bundle with start time, peak rate and added dose; queued even with the link down |
| Triage | Rule `SPE_SHELTER` fires; other signals still route normally |
| After the event | Added dose shown on the bar; banner replaced by "SPE ended at …; added dose … mSv" |

The SPE dose added in the demo is drawn from a stated range (to be sourced, S-14). The demo injector ("Trigger SPE") uses that range with a fixed seed.

### 1.4 In the bundle (R3)

Every bundle carries `radiation = { dose_mSv, dose_cum_mSv, limit_mSv, fraction_of_limit, spe }`.

### 1.5 Tests

| Test | Expect |
|---|---|
| 180 days at background | Cumulative ≈ 180 × configured rate; no SPE |
| Injected SPE | Banner exact text; EXPEDITED bundle; `SPE_SHELTER` fired |
| SPE with link down | Banner still shows; bundle QUEUED |
| Half of limit | Caution alert |
| One configured background rate | No other dose constants in the code (grep test) |

---

## 2. Isolation and wellbeing check-in

### 2.1 Daily check-in (W1)

Three questions, 1–5 scale, under 20 seconds:

| Key | Question | 1 | 5 |
|---|---|---|---|
| `mood` | How is your mood today? | Very low | Very good |
| `stress` | How stressed do you feel? | Not at all | Extremely |
| `social` | How connected do you feel to the crew and to home? | Not at all | Very |

- Optional private note. It is **not** sent to Earth unless the astronaut ticks "include in report".
- The vitals part of the as-built form (HR, BP, temperature, sleep, exercise) stays as a separate "manual vitals" entry.
- A missed check-in counts as missing data ([14 §4.8](14-DETECT_SPEC.md#48-missing-data-d5)).

### 2.2 Sleep regularity (W2)

- Inputs: bed time and wake time (entered, or from a sensor in a real system).
- `mid_sleep` = midpoint of the sleep period.
- `sleep_regularity_min` = standard deviation of `mid_sleep` over the last 7 days, in minutes. Higher means less regular.
- Shown next to total sleep: "Sleep 6.8 h · timing varied by 74 min this week."

### 2.3 Feeding Detect (W3)

`mood`, `stress`, `social` and `sleep_regularity_min` are ordinary Detect metrics with personal baselines, EWMA, persistence and fusion ([14 §3](14-DETECT_SPEC.md#3-signals)). There's no separate wellbeing score.

### 2.4 Wording rules (W4)

| Do | Don't |
|---|---|
| "Your mood score has been lower than usual for 4 days." | "You may be depressed." |
| "Would it help to talk it through? The crew medical officer is available." | "Seek psychiatric help." |
| Describe change against the person's own baseline | Compare crew members with each other |
| Amber for a persistent change | Red for wellbeing alone, unless it fuses with other signals |
| "Possible cold sore: tell the crew medical officer." | "HSV-1 viral reactivation" (as-built text) |

### 2.5 Privacy

| Data | Astronaut | Crew medical officer | Flight surgeon (bundle) |
|---|---|---|---|
| Check-in scores | Yes | Yes | 7-day trend and flags only |
| Private note | Yes | Only if shared | Only if "include in report" |
| Sleep timing | Yes | Yes | Regularity value only |

### 2.6 Tests

| Test | Expect |
|---|---|
| Four low mood days in a row | Drift alert, supportive wording, no condition names |
| Missed check-ins for 2 days | `MISSING` alert |
| Irregular sleep timing | `sleep_regularity_min` rises; drift flag after persistence |
| Private note | Absent from the bundle unless opted in |
