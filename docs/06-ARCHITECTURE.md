# 06 · Architecture

## Style
Client-only static app. Plain HTML/JS. Each module is an IIFE exposing one global (`window.X`) and also `module.exports` where testable in Node. No build step.

## Layers
```
┌───────────────────────── UI (Om) ─────────────────────────┐
│ index.html · css · js/app.js · js/act-ui.js · …           │
└───────────────┬───────────────────────────┬───────────────┘
                │ reads                     │ calls
        ┌───────▼────────┐          ┌───────▼─────────────────────────┐
        │ LandfallState  │          │ Engine (Tanishk)  Triage (Raghav)│
        │ day, delay     │          │ baseline, alerts  evaluate()     │
        └────────────────┘          │ forecast, whatif  buildPacket()  │
                                    │                   QueueEngine    │
                                    └───────┬─────────────────────────┘
                                            │
                                  ┌─────────▼─────────┐
                                  │ data.js (synthetic)│
                                  │ localStorage (queue)│
                                  └────────────────────┘
```

## Data flow (per render on the Act tab)
1. UI picks `day` → `LandfallState.getCommDelaySeconds(day)`.
2. `telemetry = LandfallData…(day)` (plus 14-day lookback).
3. `result = TriageEngine.evaluate(day, telemetry, delay, {onboardSupport, linkAvailable})`.
4. `packet = PacketEngine.buildPacket(day, telemetry, result)`.
5. On "Send": `QueueEngine.enqueue(packet)` → status changes emit `onChange` → UI re-renders queue.

## Triage result (contract keys + additive)
```
{ triageLevel, urgency, directGroundLinkRequired, rationale[], flags[],
  proposedAction, commDelaySeconds,
  // additive:
  severityScore (0–3), persistedDays, worsening, deliveryMode, reportToFlightSurgeon }
```
`deliveryMode`: `EMERGENCY_DIRECT | NONE | QUEUE_OFFLINE | LIVE_CALL | SEND_PACKET`.

## Packet (≈1.8 KB at Day 40)
```
{ packetId: "ARES6-MED-D040-<n>", timestamp, transitDay, oneWayDelaySeconds,
  dataSummary, trendAnalysis, triageDecision, urgency, proposedAction,
  status: QUEUED|TRANSMITTING|ACKNOWLEDGED|FAILED,
  priority: LOW|MEDIUM|HIGH|CRITICAL, deliveryMode, baselineSummary, flagIds,
  cabin, trend7d, trend30d, checksum, attempts, groundReply }
```
Checksum = FNV-1a over stable-stringified non-volatile fields. Volatile (excluded): `checksum, status, attempts, groundReply, acknowledgedAt`.

## Queue state machine
```
 QUEUED ──(link up)──► TRANSMITTING ──(ok)──► ACKNOWLEDGED
   ▲                         │
   │ (link drops)            ├─(random failure)─► FAILED ──(auto retry ≤3 / manual)─► QUEUED
   └─────────────────────────┘
 FAILED (permanent) ◄── checksum mismatch ("Rejected: checksum mismatch.")
```
Config: `persist`, `failRate` (default 0), `maxAttempts` 3, `retryMs` 2500, `tickMs` 250, `transitMs(delay)=clamp(delay*40, 1500, 12000)`.
Storage key: `landfall_packet_queue_v1`.

## Design decisions
- **Rules + statistics, no ML** → every alert is explainable and testable.
- **Personal baseline** instead of population thresholds → fits "what's normal for this person".
- **Emergency path outside the queue** → safety path never depends on link state.
- **Additive result fields** → we never break contract consumers.
- **Deterministic synthetic data** → reproducible demo and tests.

## Security / integrity notes
Checksum is an integrity check against corruption/tampering in the simulation, **not** cryptographic authentication. Real systems would sign and encrypt. State this honestly in the deck.

## Files in repo
```
CONTRACT.md  README.md  index.html
placeholders/ (data.js, forecast.js — Tanishk's replace these)
triage/      triage.js packet.js queue.js test_triage.js
js/          app.js act-ui.js sources.js storage.js state …
lib/         Chart.js, fonts
docs/        this folder
```
