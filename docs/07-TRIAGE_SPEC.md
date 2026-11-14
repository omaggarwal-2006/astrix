# 07 · Act Specification: Triage Table, Bundle and Queue (v2)

Owner: Raghav · Target files: `src/core/triage.js`, `src/core/bundle.js`, `src/core/queue.js` · Tests: `tests/unit/triage.test.mjs`, `tests/unit/bundle.test.mjs`, `tests/unit/queue.test.mjs`
Requirements: T1–T10, Q1–Q9, R3 · As-built: `src/core/triage.js` (score formula), `src/core/packet.js`, `src/core/queue.js`, `src/core/pipeline.js`. See [00-STATUS.md](00-STATUS.md#t--triage).

## 1. Job in the loop

Turn **what changed** (Detect) and **where it's heading** (Forecast) into **who acts, how urgently, and how the report gets to Earth**, given the current delay, link state and onboard support. Show which rule decided and what would change it.

## 2. Interface

```js
triage({ alerts, forecast, reading, env, config }) → Decision
// env = { oneWayDelayS, linkUp, onboardSupport }
```

- `oneWayDelayS` comes from `src/core/delay.js` (one function for the whole app, decision D-05), unless the delay selector overrides it.
- Pure function. The UI never builds its own decision.
- Returns a `Decision` ([18-DATA_MODEL.md §6](18-DATA_MODEL.md#6-dayresult)): `path`, `delivery`, `priorityClass`, `rulesFired[]`, `reasons[]`, `banners[]`, `whatWouldChange[]`, `confidence`.

## 3. The decision table (T1)

The screen shows this table and highlights every row that fired. Thresholds are team assumptions from [18 §7](18-DATA_MODEL.md#7-configuration).

### 3.1 Override rules (checked first, all that apply fire)

| Rule ID | Condition | Delay / support | Outcome |
|---|---|---|---|
| `EMERGENCY_CARDIAC` | Today's HR > 120 bpm **or** systolic BP > 160 mmHg | Any | Banner **"Medical emergency: use the direct ground link now."** Path `FLIGHT_SURGEON`, delivery `EMERGENCY_DIRECT`. Bypasses the queue. An EXPEDITED record bundle is also queued, but the instruction never waits for it |
| `SPE_SHELTER` | Solar particle event detected ([16 §1.3](16-RADIATION_AND_ISOLATION.md#13-solar-particle-event-spe-alert-r2)) | Any | Banner **"Solar particle event: shelter in the protected area now."** EXPEDITED bundle. Normal routing continues for other signals |
| `SANS_VISION` | Vision-change symptom (`eye_strain`, `blurred_vision`, `vision_change`) | Any | Text **"Report to the flight surgeon."** plus SANS monitoring. Path at least `FLIGHT_SURGEON` (CMO path not used) |
| `CO2_SCRUBBER` | Headache **and** cabin CO2 ≥ 4,500 ppm | Any | Hint **"Headache plus high CO2: check the scrubber first."** Then normal routing |
| `DATA_MISSING` | Any `MISSING` alert, or decision confidence `low` | Any | Escalate one level (§3.4) and say why |

### 3.2 Escalation test

A case **escalates** when any of these is true:

| Code | Condition |
|---|---|
| `E_ALARM` | Any alert at severity 3 |
| `E_MULTI` | A fused alert (two or more signals flagged together) |
| `E_PERSIST` | One flag with `persisted_days ≥ 5` and `worsening` |
| `E_LANDING` | Forecast reason `LANDING_AT_RISK` (any dimension NO-GO) |

### 3.3 Routing rules

| Rule ID | Escalates? | Delay / support | Outcome |
|---|---|---|---|
| `SELF_CARE` | No | Any | Path `SELF_CARE`, delivery `NONE`. Logged only, no bundle |
| `LIVE_FLIGHT_SURGEON` | Yes | Link up **and** one-way delay ≤ 10 s | Path `FLIGHT_SURGEON`, delivery `LIVE_CALL` |
| `CMO_PLUS_BUNDLE` | Yes | Delay > 10 s or link down, **and** onboard support present | Path `CREW_MEDICAL_OFFICER`; bundle to Earth: `SEND_BUNDLE` if link up, `QUEUE_OFFLINE` if down |
| `FLIGHT_SURGEON_BUNDLE` | Yes | Delay > 10 s or link down, **and** no onboard support | Path `FLIGHT_SURGEON`; delivery `SEND_BUNDLE` or `QUEUE_OFFLINE` |

### 3.4 "Escalate one level"

| From | To |
|---|---|
| `SELF_CARE` | `CMO_PLUS_BUNDLE` if onboard support, else `FLIGHT_SURGEON_BUNDLE` |
| `CMO_PLUS_BUNDLE` | `FLIGHT_SURGEON_BUNDLE` (CMO still informed) |
| `FLIGHT_SURGEON_*` | Same path, priority raised one class (§5.3) |

### 3.5 Combining rules

Several rules can fire. The final decision takes the **most severe** path (`EMERGENCY_DIRECT` > `FLIGHT_SURGEON` > `CREW_MEDICAL_OFFICER` > `SELF_CARE`), the **highest** priority class, and **all** banners, hints and reasons. `rulesFired` lists every rule, in table order, so the screen can highlight them.

## 4. Explanation (T9, L3)

### 4.1 Why

`reasons[]` holds one line per fired rule, built from data: "Sleep 5.4 h vs your 7.4 h baseline, 4th short night, still falling." "Delay 2 min 48 s is above the 10 s live-call limit." "Onboard support is available."

### 4.2 What would change this decision

One line per fired rule, from a template:

| Rule | Template |
|---|---|
| `E_ALARM` (sleep) | "If sleep recovers above 6.2 h for 2 days, this drops to {lower path}." |
| `E_MULTI` | "If only one signal stays flagged, this drops to {lower path}." |
| `E_PERSIST` | "If {metric} stops worsening, this drops to {lower path}." |
| `E_LANDING` | "Raising exercise to {h} h/day moves {dimension} out of no-go." (the smallest slider value that clears it) |
| `CMO_PLUS_BUNDLE` | "If the one-way delay fell to 10 s or less, the flight surgeon would take this live." |
| `FLIGHT_SURGEON_BUNDLE` | "With onboard support available, the crew medical officer would take this." |
| `DATA_MISSING` | "Logging today's {metric} removes the extra escalation." |
| `EMERGENCY_CARDIAC` | "This instruction stays until heart rate ≤ 120 bpm and systolic BP ≤ 160 mmHg." |

### 4.3 Confidence

The decision's confidence is the lowest confidence of the alerts that fired, and `medium` at most when the model and rules forecasts disagree.

## 5. The bundle

A report is a **bundle**, borrowing DTN ideas: lifetime, priority class and a custody-style receipt. Full schema: [18-DATA_MODEL.md §4](18-DATA_MODEL.md#4-bundle).

### 5.1 Contents (Q1)

ID, creation time, lifetime and expiry, priority class, source and destination, the decision (path, rules fired, reasons), the anomaly, recent readings, baseline, 7- and 30-day trends (computed, not hard-coded), cabin data, radiation data, today's check-in, override and audit entries since the last acknowledgement, and a checksum.

### 5.2 ID

`LF-D040-0007`: `LF`, the mission day (3 digits), then a counter that never resets and survives reload.

### 5.3 Priority class (Q3)

| Class | When |
|---|---|
| `EXPEDITED` | Emergency, SPE, any severity-3 alert, or `LANDING_AT_RISK` |
| `NORMAL` | Any other escalated case |
| `BULK` | Optional daily log (nice-to-have) |

"Escalate one level" on a flight-surgeon path raises `BULK → NORMAL → EXPEDITED`.

### 5.4 Lifetime (Q4)

| Class | Lifetime in mission time (team assumption) |
|---|---|
| `EXPEDITED` | 24 h |
| `NORMAL` | 72 h |
| `BULK` | 7 days |

A bundle not acknowledged before `expires_at` becomes `FAILED` with reason `EXPIRED`. The UI offers "Rebuild and resend", which makes a new bundle with fresh data.

### 5.5 Checksum (Q2)

- FNV-1a, 32-bit, hex.
- Computed over the **stable** JSON of the non-volatile fields (keys sorted). The as-built code uses plain `JSON.stringify`, which depends on key order.
- Volatile fields, excluded: `status`, `attempts`, `receipt`, `last_error`, `retryable`, `next_attempt_at`.
- It's an integrity check for the simulation, **not** security. Real systems would sign and encrypt.

### 5.6 Duplicate guard

Pressing Send twice for the same day and the same fired rules doesn't create a second bundle while the first is unacknowledged. The UI says "Already queued as LF-D040-0007". This prevents the class of bug fixed in `19fbcdc`.

## 6. The queue

### 6.1 State machine (Q9)

```
            link up, head of priority order
 QUEUED ─────────────────────────────────► TRANSMITTING
   ▲  ▲                                      │      │
   │  │ link drops / reload                  │      │ receipt arrives
   │  └──────────────────────────────────────┘      ▼
   │                                           ACKNOWLEDGED  (custody receipt stored)
   │ auto-retry after retryMs
   │ (attempts < maxAttempts)                  
   │                                     transmission fails
 FAILED ◄─────────────────────────────── TRANSMITTING
   │
   ├─ retryable: true  → manual "Retry" → QUEUED (attempts reset to 0)
   └─ retryable: false → never retried (CHECKSUM_MISMATCH, EXPIRED)
```

### 6.2 Rules

| ID | Rule |
|---|---|
| Q3 | Send order: `EXPEDITED` before `NORMAL` before `BULK`; oldest first within a class |
| Q3 | One bundle in flight at a time (simple, and it makes priority visible) |
| Q4 | Before each attempt, check `expires_at`; if past, `FAILED` / `EXPIRED` / not retryable |
| Q5 | Auto-retry after `retryMs` while `attempts < maxAttempts` (3). Then the bundle stays `FAILED`, retryable, until a manual retry |
| Q5 | A retry timer is cancelled if the bundle is manually retried or the queue is cleared (fixes the as-built double send) |
| Q6 | On success, store `receipt = { received_at, by, checksum_verified: true, reply }` |
| Q7 | Verify the checksum before sending and again on "receipt". Mismatch → `FAILED` / `CHECKSUM_MISMATCH` / not retryable. Stays so after reload |
| Q8 | Persist to `localStorage` key `landfall_queue_v2` on every change. On load, `TRANSMITTING → QUEUED`; `FAILED` keeps its `retryable` flag |
| — | Transit time in the demo = `2 × oneWayDelayS × 1000 / speedup` ms (`speedup` 100: 168 s one-way shows as about 3.4 s) |

### 6.3 Failure injection

Deterministic, for the demo and tests:

| Control | Effect |
|---|---|
| "Fail next transmission" | The next attempt fails once |
| "Fail all" | Every attempt fails (shows the retry limit) |
| "Off" (default) | No failures |

Random failure (`failRate`) remains for the evaluation only, with a seed.

### 6.4 Public API

```js
enqueue(bundle) · getQueue() · onChange(cb) · setLink({ up, oneWayDelayS })
retry(bundleId) · clearQueue() · setFailureMode("off" | "next" | "all")
verifyBundle(bundle) · buildBundle(decision, dayResult, seq)
```

## 7. Override and audit log (T10)

- On the Today screen, the astronaut can choose a different path and must type a short note.
- The decision keeps the original result and adds `override = { to, note, at }`.
- An audit entry `{ at, day, from, to, note, rulesFired }` goes to `landfall_audit_log` and into the next bundle.
- An emergency banner can't be dismissed without a note, and the note is sent EXPEDITED.

## 8. Safety wording (do not change)

These strings are tested for exact match:

- "Medical emergency: use the direct ground link now."
- "Report to the flight surgeon."
- "Headache plus high CO2: check the scrubber first."
- "Solar particle event: shelter in the protected area now."

## 9. Tests (one per table row, plus queue)

| Test | Setup | Expect |
|---|---|---|
| Emergency HR | HR 130, link down | `EMERGENCY_DIRECT`, banner exact, no wait on queue |
| Emergency BP | SBP 165 | Same |
| SPE | Dose-rate jump | Shelter banner; EXPEDITED bundle |
| SANS | `blurred_vision` | Exact text; path `FLIGHT_SURGEON` even with onboard support |
| CO2 hint | Headache + 4,600 ppm | Hint exact; routing unchanged |
| Self-care | One mild flag, 1 day | `SELF_CARE`, no bundle |
| Live | Escalated, 1.3 s, link up | `LIVE_CALL` |
| CMO | Escalated, 168 s, onboard | `CREW_MEDICAL_OFFICER`, `SEND_BUNDLE` |
| CMO offline | Same, link down | `QUEUE_OFFLINE` |
| Flight surgeon bundle | Escalated, 168 s, no onboard | `FLIGHT_SURGEON`, `SEND_BUNDLE` |
| Missing data | Self-care case + `MISSING` | Escalates to CMO |
| Landing at risk | One NO-GO dimension | `E_LANDING` fires |
| One live-call limit | — | `liveCallMaxOneWayS` defined once (grep test) |
| Priority order | NORMAL queued, then EXPEDITED | EXPEDITED sent first |
| Expiry | Lifetime 1 s, link down 2 s | `FAILED` / `EXPIRED`, not retryable |
| Retry limit | "Fail all" | 3 attempts, then FAILED retryable; manual retry works once per press |
| Tamper | Edit a field after building | `CHECKSUM_MISMATCH`, not retried after reload |
| Duplicate guard | Send twice | One bundle |
| Reload | Mid-transmission reload | Back to QUEUED, then ACKNOWLEDGED |

## 10. Migration from the as-built code

| As-built | v2 |
|---|---|
| `score = severity + (persisted ≥ 5) + worsening` | Decision table §3 |
| `LIVE_CALL` if delay < 300 s | `liveCallMaxOneWayS = 10` (D-01) |
| `onboardSupport: true` hard-coded | Demo toggle |
| `link.available: true` hard-coded | Demo toggle |
| `packet_id: PKT-0001`, `priority` LOW…CRITICAL | `bundle_id: LF-D040-0001`, `priority_class` |
| `TRANSMITTED` | `TRANSMITTING` |
| Unlimited retries; reload re-queues FAILED | `maxAttempts` 3; `retryable` flag persisted |
| Trends hard-coded in `src/ui/tabs/comms.js` (`buildTriageInputs`) | Computed from history |
| `landfall_queue` | `landfall_queue_v2` (old key ignored, cleared by Reset) |
