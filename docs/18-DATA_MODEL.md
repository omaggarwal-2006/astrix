# 18 · Data Model and Contract (v2)

This file is the **v2 contract**: every shape shared between modules and every configured value. `CONTRACT.md` in the repo root (v4.0) lists the shapes the code uses today in Part A and summarises this file in Part B. As each module migrates, it moves from Part A to Part B.

Change a shape here first, add a decision to [20-DECISIONS.md](20-DECISIONS.md), then change the code.

## 1. Conventions

- Field names are `snake_case` in data and bundles, `camelCase` in function options and config.
- Mission time is the **mission day** (integer, 1–180) plus, where needed, `mission_s` (seconds since launch).
- Every number carries its unit in the field name (`_h`, `_ppm`, `_mSv`, `_s`).
- Missing values are `null`, never `0` or omitted.
- Enums are upper-case strings.

## 2. DayReading

One day of input for one astronaut.

```ts
interface DayReading {
  day: number;                       // 1–180
  vitals: {
    sleep_h: number | null;
    bed_time: string | null;         // "23:10" local ship time
    wake_time: string | null;
    hr_bpm: number | null;           // resting
    bp_sys: number | null;
    bp_dia: number | null;
    temp_c: number | null;
    exercise_min: number | null;
  };
  checkin: {                         // 1–5, see 16 §2.1
    mood: number | null;
    stress: number | null;
    social: number | null;
    note: string | null;             // private unless share_note
    share_note: boolean;
  };
  symptoms: string[];                // e.g. "headache", "blurred_vision"
  cabin: { co2_ppm: number | null; temp_c: number | null; noise_dba: number | null };
  radiation: {
    dose_mSv: number | null;
    dose_cum_mSv: number | null;
    dose_rate_peak_uSv_h: number | null;
    spe: null | { start_mission_s: number; peak_uSv_h: number; added_mSv: number; active: boolean };
  };
  source: "SYNTHETIC" | "LOGGED";   // LOGGED = entered by the crew in the app
}
```

As-built difference: v1 readings have no `checkin`, `bed_time`, `wake_time` or radiation peak rate, and mood sits in `vitals`.

## 3. Alert

```ts
interface Alert {
  // v1 fields, kept for compatibility
  id: string;                        // "A-D040-SLEEP"
  metric: string;                    // "sleep_h", "mood", "co2_ppm", "FUSED", …
  baseline: number | null;
  current: number | null;
  z: number | null;
  persisted_days: number;
  worsening: boolean;
  severity: 1 | 2 | 3;
  reason: string;                    // same as text, for v1 consumers
  // v2 fields
  detector: "z" | "ewma" | "limit" | "fusion" | "missing";
  level: "mild" | "caution" | "alarm";
  confidence: "high" | "medium" | "low";
  improving: boolean;
  contributors: string[];            // fusion only
  text: string;                      // 14 §6 template
}

interface DetectResult {
  baseline: Record<string, { mean: number; sd: number; n: number; provisional: boolean }>;
  alerts: Alert[];
  fused: Alert | null;
  missing: string[];                 // metrics missing ≥ 2 days
  confidence: "high" | "medium" | "low";
}
```

Severity: **1 mild, 2 caution, 3 alarm**. One scale everywhere. The as-built packet priority and `mapSeverity` disagree (CONTRACT.md A5); this replaces both.

## 4. Bundle

```ts
interface Bundle {
  // identity and DTN-style fields
  bundle_id: string;                 // "LF-D040-0007"
  created_day: number;
  created_mission_s: number;
  lifetime_s: number;
  expires_mission_s: number;
  priority_class: "EXPEDITED" | "NORMAL" | "BULK";
  source: "ARES6/CREW-A";
  destination: "EARTH/FLIGHT-SURGEON";
  // content
  decision: { path: Path; delivery: Delivery; rules_fired: string[]; reasons: string[]; confidence: string };
  anomaly: string;                   // the top reason, one line
  alerts: Pick<Alert, "id" | "metric" | "severity" | "text">[];
  readings: DayReading["vitals"];
  baseline: Record<string, { mean: number; sd: number }>;
  trend_7d: Record<string, (number | null)[]>;   // computed from history
  trend_30d: Record<string, (number | null)[]>;
  cabin: DayReading["cabin"];
  radiation: { dose_mSv: number; dose_cum_mSv: number; limit_mSv: number; fraction_of_limit: number; spe: object | null };
  wellbeing: { mood_7d: number[]; stress_7d: number[]; social_7d: number[]; sleep_regularity_min: number | null; note: string | null };
  forecast: { dimension: string; mid: number; label: Label }[];
  audit: AuditEntry[];               // overrides since the last acknowledgement
  checksum: string;                  // FNV-1a over stable JSON of the fields above
  // volatile (not in the checksum)
  status: "QUEUED" | "TRANSMITTING" | "ACKNOWLEDGED" | "FAILED";
  attempts: number;
  retryable: boolean;
  last_error: null | "TRANSMIT_FAILED" | "CHECKSUM_MISMATCH" | "EXPIRED";
  next_attempt_at: number | null;
  receipt: null | { received_mission_s: number; by: string; checksum_verified: true; reply: string };
}
```

Privacy: the bundle never carries the private note unless `share_note` is true, and never carries raw check-in answers older than 7 days.

## 5. ForecastDimension

```ts
type Label = "GO" | "CAUTION" | "NO-GO";

interface ForecastDimension {
  key: "bone" | "muscle" | "aerobic" | "balance" | "sleep" | "mood";
  dimension: string;                 // display label
  unit: "%" | "score";
  landing: { low: number; mid: number; high: number };
  label: Label;
  thresholds: { go: number; noGo: number };
  confidence: "high" | "medium" | "low";
  source: "RULES" | "MODEL";
  citationUrl: string | null;
  assumptions: string[];
  exercise_hours_used: number;
}
```

As-built difference: v1 uses `status: "nominal" | "caution" | "alarm"`, a different dimension set and no `key`, `label`, `thresholds` or `source`.

## 6. DayResult

The output of `runDay(day, env)`, and the only thing the Today screen reads.

```ts
type Path = "SELF_CARE" | "CREW_MEDICAL_OFFICER" | "FLIGHT_SURGEON";
type Delivery = "NONE" | "LIVE_CALL" | "SEND_BUNDLE" | "QUEUE_OFFLINE" | "EMERGENCY_DIRECT";

interface Decision {
  path: Path;
  delivery: Delivery;
  priority_class: Bundle["priority_class"] | null;
  rules_fired: string[];             // 07 §3, in table order
  reasons: string[];
  banners: { id: string; text: string; level: "emergency" | "shelter" | "hint" }[];
  what_would_change: string[];
  confidence: "high" | "medium" | "low";
  override: null | { to: Path; note: string; at_mission_s: number };
}

interface DayResult {
  day: number;
  env: { one_way_delay_s: number; delay_source: "MODEL" | "SELECTOR"; link_up: boolean; onboard_support: boolean };
  reading: DayReading;
  detect: DetectResult;
  forecast: ForecastDimension[];
  decision: Decision;
  bundle: Bundle | null;             // built but not yet queued, for preview
  explanation: { what_changed: string; why_it_matters: string; if_nothing_changes: string; who_acts: string; what_would_change: string };
  readiness: { label: Label; text: string };   // reflects alarms (U2)
}

interface AuditEntry { at_mission_s: number; day: number; from: Path; to: Path; note: string; rules_fired: string[] }
```

### Readiness headline rule (U2)

| Condition | Headline |
|---|---|
| Any emergency or SPE banner | "Act now" (red) |
| Any severity-3 alert, or any NO-GO dimension | "At risk on landing day" (red) |
| Any CAUTION dimension or severity-2 alert | "Watch" (amber) |
| Otherwise | "On track for landing" (green) |

The average of forecast values is shown as a supporting number, never as the headline.

## 7. Configuration

One object, `src/core/config.js`, frozen at load. Every threshold in the docs refers to a key here. All values are **team assumptions** unless a source is given.

| Key | Value | Used by | Source |
|---|---|---|---|
| `missionLengthDays` | 180 | All | Demo scenario |
| `baselineStartDay` / `baselineEndDay` | 1 / 14 | Detect | Assumption |
| `baselineMinDays` | 10 | Detect | Assumption |
| `zMild` / `zCaution` / `zAlarm` | 1.5 / 2.0 / 3.0 | Detect | Assumption |
| `ewmaLambda` / `ewmaL` | 0.3 / 3 | Detect | Assumption (textbook L) |
| `cusumK` / `cusumH` | 0.5 / 4 | Detect (optional) | Assumption |
| `worseningDelta` | 0.25 | Detect | Assumption |
| `fusionMinSignals` | 2 | Detect | Assumption |
| `missingDaysCaution` | 2 | Detect | Assumption |
| `sleepCautionH` / `sleepAlarmH` | 6.2 / 5.0 | Detect | Assumption |
| `moodCaution` | 3.4 | Detect | Assumption |
| `co2HintPpm` / `co2HighPpm` | 4500 / 5000 | Detect, triage | Assumption (S-23 to check) |
| `emergencyHrBpm` / `emergencySysMmHg` | 120 / 160 | Triage | Assumption |
| `persistEscalateDays` | 5 | Triage | Assumption |
| `liveCallMaxOneWayS` | 10 | Triage | Decision D-01 |
| `forecastThresholds` | `{ default: { go: 90, noGo: 80 } }` | Forecast | Assumption |
| `exerciseReferenceH` | 1.5 | Forecast | S-04 |
| `boneRatePctMonth` | 1.0–1.5 (mid 1.25) | Forecast | S-03 |
| `fitnessLossPct6mo` | 10–12 (mid 11) | Forecast | S-04 |
| `zeroExerciseMultiplier` | bone 1.8, muscle/aerobic 2.2 | Forecast | Illustrative (engine model card) |
| `tailFactor` | 1.5 | Forecast | Assumption from S-04 spread |
| `doseBackgroundMSvDay` | 1.8 | Radiation | S-12 (verify) |
| `doseLimitMSv` | 600 | Radiation | S-13 (verify) |
| `doseCautionFraction` / `doseAlarmFraction` | 0.5 / 0.8 | Radiation | Assumption |
| `speRateFactor` | 10 | Radiation | Assumption |
| `lifetimeS` | EXPEDITED 86,400 · NORMAL 259,200 · BULK 604,800 | Queue | Assumption |
| `maxAttempts` / `retryMs` | 3 / 2,000 | Queue | Assumption |
| `speedup` | 100 | Queue, scene | Demo clock |
| `delayModel` | Linear 1.3 s (day 0) → 750 s (day 180) | Delay | Decision D-05 |

## 8. Storage keys

| Key | Holds | Cleared by Reset |
|---|---|---|
| `landfall_queue_v2` | `Bundle[]` | Yes |
| `landfall_bundle_seq` | Last bundle counter | Yes |
| `landfall_audit_log` | `AuditEntry[]` | Yes |
| `landfall_logged_days` | `Record<day, Partial<DayReading>>` (check-ins and manual vitals) | Yes |
| `landfall_countermeasures` | Checklist state | Yes |
| `landfall_demo_env` | Link, onboard support, delay override, failure mode | Yes |
| `landfall_scene_collapsed` | UI preference | No |
| `landfall_queue`, `landfall_custom_checkins` | v1 keys | Yes (migrated once, then removed) |

## 9. Mapping from v1 (`CONTRACT.md` Part A)

| v1 | v2 |
|---|---|
| `getAlerts(day)` | `runDay(day, env).detect.alerts` |
| `getForecast(day, exerciseHours)` | `runDay(day, env).forecast` |
| `getReadings(day)` | `runDay(day, env).reading` |
| `handleAlert(alert, ctx, env)` | `runDay(...).decision` + `enqueue(bundle)` on Send |
| `Alert.severity` 1–3 | Unchanged, now with `level` |
| `Forecast.status` | `ForecastDimension.label` |
| `decision.path` | Unchanged values |
| `decision.delivery: SEND_PACKET` | `SEND_BUNDLE` |
| `packet.packet_id`, `priority` | `bundle.bundle_id`, `priority_class` |
| `packet.status: TRANSMITTED` | `TRANSMITTING` |
