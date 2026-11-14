# LANDFALL Team Interface Contract (v4.0)

**NASA Space Apps Challenge 2026** · Team: Raghav Dua (triage, bundles, queue) · Tanishk (engine) · Om (UI)
v4.0 · 14 Nov 2026 · Replaces v3.0

This file has two parts:

- **Part A, as-built:** the shapes and functions the code uses **today**. Code that calls a shared module must follow Part A until that module is migrated.
- **Part B, v2 target:** the shapes the team is moving to. They are defined in full in [`docs/18-DATA_MODEL.md`](docs/18-DATA_MODEL.md); this file only summarises them.

When a module moves from Part A to Part B, update both parts and [`docs/00-STATUS.md`](docs/00-STATUS.md) in the same pull request.

---

## Part A · As-built (current code)

### A1. Modules and owners

| File | Owner | Exports |
|---|---|---|
| `src/core/adapter.js` | Om (Tanishk's engine plugs in here) | `getAlerts(day)`, `getForecast(day, exerciseHours = 1.2)`, `getReadings(day)`, `getBaseline()`, `mapSeverity(severity)` |
| `src/data/sample-data.js` | Interim (Om) | `generateAlertsForDay`, `generateForecastForDay`, `generateDayReadings`, `BASELINE_READINGS` |
| `src/core/run-day.js` | Raghav | `runDay(day, env, { exerciseHours })`, `effectiveDelayS`, `readinessFor`, `primaryAlert`, `DEFAULT_ENV` |
| `src/core/pipeline.js` | Raghav | `handleAlert(alert, ctx, env)`, `peekNextSeq()` |
| `src/core/triage.js` | Raghav | `triage(alert, ctx)` |
| `src/core/packet.js` | Raghav | `buildPacket(alert, decision, ctx, seq)`, `verifyPacket(packet)` |
| `src/core/queue.js` | Raghav | `enqueue`, `getQueue`, `onChange`, `setLink`, `clearQueue`, `config` |
| `src/core/sources.js` | Raghav | `SOURCES`, `NUMBERS`, `LINK_PRESETS`, `ASSUMPTIONS`, `DISCLAIMER` |
| `src/data/sample-alert.js` | Raghav | `sampleAlert` (fixture `A-001`) |
| `src/ui/extras/twin-model.js` | Om | `BODY_REGIONS`, `TISSUE_LAYERS`, `getRegionIntegrity`, `getTissueIntegrity`, `calculateCrewReadinessXP`, `ASTRONAUT_PROFILE` |

The UI reads data **only** through `src/core/adapter.js`. `src/ui/extras/twin-model.js` has no data imports. Thresholds live in `src/core/config.js`; the Earth delay in `src/core/delay.js`.

### A2. Readings (`getReadings(day)`)

```ts
interface Readings {
  day: number;
  vitals: { sleep_h: number; hr_bpm: number; bp_sys: number; bp_dia: number; temp_c: number; mood: number; exercise_min: number };
  symptoms: string[];                         // e.g. "headache", "eye_strain"
  cabin: { co2: number; temp: number; noise: number };   // ppm, °C, dBA
  immune: { rash: boolean; coldSore: boolean; fever: boolean; fatigue: boolean; stressScore: number };
  radiation: { dailyDose: number; cumulativeDose: number };  // mSv
  logged?: true;                              // set when a crew check-in overrides that day's vitals
}
```

Crew check-ins saved under `landfall_custom_checkins` replace that day's `vitals`. They don't change alerts yet.

### A3. Alert (`getAlerts(day)`)

```ts
interface Alert {
  id: string;               // "A-001"
  metric: string;           // "sleep_h" | "cabin_co2" | "mood" | "immune_cold_sore" | "exercise_min"
  baseline: number;
  current: number;
  z: number;                // currently fixed per sample alert, not computed
  persisted_days: number;
  worsening: boolean;
  severity: 1 | 2 | 3;      // 1 mild, 2 caution, 3 alarm
  reason: string;
}
```

### A4. Forecast (`getForecast(day, exerciseHours)`)

```ts
interface ForecastDimension {
  dimension: string;        // "Bone mineral density" | "Aerobic & muscle power" | "Cardiovascular regulation"
                            // | "Neurovestibular balance" | "Circadian sleep debt" | "Cognitive vigilance"
  landing: { low: number; mid: number; high: number };   // % (illustrative)
  status: "nominal" | "caution" | "alarm";
  confidence: string;
  citationUrl: string;
  assumptions: string[];
}
```

### A5. Severity mapping (`mapSeverity`)

| Input | `status` | `label` | `shapeClass` | `priority` |
|---|---|---|---|---|
| 3, `"alarm"`, `"critical"` | alarm | Alarm | `shape-octagon` | CRITICAL |
| 2, `"caution"`, `"moderate"` | caution | Caution | `shape-triangle` | HIGH |
| 1, `"low"` | nominal | Mild drift | `shape-circle` | LOW |
| anything else | nominal | Nominal | `shape-circle` | NOMINAL |

**Known mismatch:** `buildPacket` sets `priority = ["LOW","MEDIUM","HIGH","CRITICAL"][severity]`, so severity 1 is `MEDIUM` in a packet but `LOW` here. v2 replaces both with priority classes (decision D-04).

### A6. Triage and pipeline

```ts
triage(alert, ctx) → Decision
// ctx = { onboardSupport: boolean, link: { available: boolean, delay_s: number } }

interface Decision {
  path: "SELF_CARE" | "CREW_MEDICAL_OFFICER" | "FLIGHT_SURGEON";
  delivery: "NONE" | "LIVE_CALL" | "SEND_PACKET" | "QUEUE_OFFLINE";
  score: number;            // severity + (persisted_days >= 5 ? 1 : 0) + (worsening ? 1 : 0)
  emergency: boolean;       // severity === 3; not used by the UI yet
  why: string;
}
```

| Rule (as-built) | Result |
|---|---|
| `score ≤ 1` | `SELF_CARE`, delivery `NONE` |
| `score 2–3` | `CREW_MEDICAL_OFFICER` if onboard support, else `FLIGHT_SURGEON` |
| `score ≥ 4` | `FLIGHT_SURGEON` |
| Link unavailable | `QUEUE_OFFLINE` |
| One-way delay < `liveCallMaxOneWayS` (10 s) | `LIVE_CALL` |
| Otherwise | `SEND_PACKET` |

```ts
handleAlert(alert, ctx, env) → { decision, packet | null }
// env = { onboardSupport, link }; ctx = packet context (A7)
// Builds AND enqueues a packet when delivery is SEND_PACKET or QUEUE_OFFLINE.
// Call it only on a user action (Send). For previews, call triage() and buildPacket() with peekNextSeq().
```

### A7. Packet (`buildPacket(alert, decision, ctx, seq)`)

```ts
// ctx = { missionDay, current, baseline, trend7, trend30, cabin, countermeasure }
interface Packet {
  packet_id: string;        // "PKT-0001"
  mission_ts: number;       // mission day
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  anomaly: string;          // alert.reason
  readings: object;         // ctx.current
  baseline: object;
  trend_7d: number[];
  trend_30d: number[];
  cabin: object;
  countermeasure: string;
  checksum: string;         // FNV-1a over JSON.stringify of the fields above
  status: "QUEUED" | "TRANSMITTED" | "ACKNOWLEDGED" | "FAILED";
}
```

`verifyPacket(packet)` recomputes the checksum without `checksum` and `status`.

### A8. Queue

| Function | Behaviour |
|---|---|
| `enqueue(packet)` | Adds `{ packet, attempts: 0, ground_reply: null }`, saves, tries to send |
| `getQueue()` | The live array |
| `onChange(cb)` | Called with the queue after every change |
| `setLink({ available, delay_s })` | Sets the link; sends QUEUED packets if available |
| `clearQueue()` | Empties the in-memory queue and storage |
| `config` | `{ speedup: 100, failRate: 0, retryMs: 2000 }` (the Simulation panel sets `failRate` to 0, 0.3 or 1) |

Acknowledgement arrives after `2 × delay_s × 1000 / speedup` ms. A checksum failure sets FAILED with no auto-retry; a random failure (`failRate`) sets FAILED and re-queues after `retryMs`. On reload, TRANSMITTED and FAILED packets return to QUEUED.

### A9. Storage keys

| Key | Holds |
|---|---|
| `landfall_queue` | Queue entries |
| `landfall_custom_checkins` | Crew check-ins by day |
| `landfall_countermeasures` | Countermeasure checklist |
| `landfall_scene_collapsed` | UI preference |

### A10. Sources (`sources.js`)

`SOURCES` (7 cited pages), `NUMBERS` (bone, fitness, exercise, neutron share), `LINK_PRESETS` (one-way `delay_s`: Moon 1.3, Mars closest 180, average 750, farthest 1,320), `ASSUMPTIONS`, `DISCLAIMER`. Status of each source: [`docs/13-SOURCES.md`](docs/13-SOURCES.md).

### A11. One day of the loop (`runDay`)

Every view renders from this result (`AppState.view`), never from its own calls.

```ts
runDay(day, env = { delayMode: "MODEL", linkUp: true, onboardSupport: true }, { exerciseHours = 1.2 }) → {
  day: number;
  delayS: number;                 // effectiveDelayS(day, env): mission model or a LINK_PRESETS override
  env: object;
  reading: Readings;              // A2
  baseline: object;
  alerts: Alert[];                // A3, worst first (severity, then persistence)
  alert: Alert | null;            // the alert that drives the decision
  forecast: ForecastDimension[];  // A4
  decision: Decision & { noAlert?: true };   // A6; no alert means routine self-monitoring, nothing sent
  breakdown: { severity, persistence, worsening } | null;
  counterfactuals: { label, path, delivery }[];   // "what would change it": one input changed at a time
  readiness: { level: "ON_TRACK" | "WATCH" | "AT_RISK", text, score, worstSeverity };   // never ON_TRACK during an alarm
}
```

---

## Part B · v2 target (summary)

Full definitions: [`docs/18-DATA_MODEL.md`](docs/18-DATA_MODEL.md). Decisions behind them: [`docs/20-DECISIONS.md`](docs/20-DECISIONS.md).

### B1. One entry point

```ts
runDay(day, env) → DayResult
// env = { oneWayDelayS, linkUp, onboardSupport }
// DayResult = { reading, detect, forecast, decision, bundle, explanation, readiness }
```

The UI renders a `DayResult` and never builds its own decision.

### B2. What changes from Part A

| Part A | Part B |
|---|---|
| `getAlerts`, `getForecast`, `getReadings` | Fields of `DayResult` |
| `Alert` | Same fields plus `detector`, `level`, `confidence`, `improving`, `contributors`, `text`; computed, not scripted |
| `Forecast.status: nominal/caution/alarm` | `label: GO / CAUTION / NO-GO`, plus `key`, `thresholds`, `source` |
| Dimensions incl. cardiovascular | `bone`, `muscle`, `aerobic`, `balance`, `sleep`, `mood` (D-06) |
| `triage(alert, ctx)` score | Decision table with `rules_fired`, `banners`, `what_would_change` ([`docs/07-TRIAGE_SPEC.md`](docs/07-TRIAGE_SPEC.md)) |
| (done) Live call below 300 s | `liveCallMaxOneWayS = 10` (D-01) |
| `SEND_PACKET` | `SEND_BUNDLE`; new `EMERGENCY_DIRECT` |
| `Packet`, `PKT-0001`, `priority` | `Bundle`, `LF-D040-0001`, `priority_class` EXPEDITED / NORMAL / BULK, lifetime, receipt |
| `TRANSMITTED` | `TRANSMITTING` |
| Unlimited retries | `maxAttempts` 3, `retryable` flag |
| Thresholds spread across files | One `core/config.js` |
| `landfall_queue`, `landfall_custom_checkins` | `landfall_queue_v2`, `landfall_logged_days`, `landfall_audit_log`, `landfall_demo_env` |

### B3. Engine handoff (Tanishk)

The engine on `origin/engine-ml` sets browser globals `DataEngine`, `ForecastEngine`, `LANDFALL_MODEL` and `LandfallML` (`predictLanding`, `whatIf`, `explain`, `modelInfo`). It is loaded as classic scripts before `main.js`. Only `adapter.js` reads these globals, maps them to Part B shapes, and falls back to the rules forecast if they're missing ([`docs/15-FORECAST_SPEC.md`](docs/15-FORECAST_SPEC.md#6-model-forecast-engine-advisory)).

---

## Change rules

1. A shape or threshold changes in [`docs/18-DATA_MODEL.md`](docs/18-DATA_MODEL.md) first, with a decision in [`docs/20-DECISIONS.md`](docs/20-DECISIONS.md).
2. The code changes in a pull request that also updates Part A here and [`docs/00-STATUS.md`](docs/00-STATUS.md).
3. Safety wording is fixed ([`docs/07-TRIAGE_SPEC.md §8`](docs/07-TRIAGE_SPEC.md#8-safety-wording-do-not-change)).
4. Every number is labelled NASA (with source) or team assumption.

UI features and controls are described in [`docs/19-UI_GUIDE.md`](docs/19-UI_GUIDE.md); they're not part of this contract.
