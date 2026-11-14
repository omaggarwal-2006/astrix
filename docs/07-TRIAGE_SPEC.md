# 07 · Triage, Packet and Queue Specification

Owner: Raghav · Code: `triage/triage.js`, `triage/packet.js`, `triage/queue.js` · Tests: `triage/test_triage.js`

## Signature
`TriageEngine.evaluate(dayNumber, telemetry, commDelaySeconds, options)`
`options = { onboardSupport: true, linkAvailable: true }`

## Config (our assumptions, tunable)
| Key | Value | Meaning |
|---|---|---|
| liveMaxDelaySeconds | 10 | Max one-way delay for a live conversation |
| sleepAlarmHours | 5.0 | Sleep ≤ this is an alarm |
| sleepCautionHours | 6.2 | Sleep below this is a deficit flag |
| moodCaution | 3.4 | Mood below this is a decline flag |
| co2Ceiling | 4500 ppm | Triggers scrubber-first hint with headache |
| co2High | 5000 ppm | High cabin CO2 flag |
| persistEscalateDays | 5 | Persistence needed to escalate a single flag |
| lookbackDays | 14 | Window for persistence/trend |

## Flags
| Flag | Trigger |
|---|---|
| HEADACHE_CO2_SCRUBBER | Headache AND CO2 ≥ 4500 → message "Headache plus high CO2: check the scrubber first." |
| SANS_MONITORING | Vision symptoms (eye_strain, blurred_vision, vision_change, optic_blur) → "Report to the flight surgeon." |
| SLEEP_COLLAPSE / SLEEP_DEFICIT | Sleep ≤ 5.0 h / < 6.2 h |
| CABIN_CO2_HIGH | CO2 high |
| IMMUNE_HSV_REACTIVATION | Immune-reactivation indicator |
| MOOD_DECLINE | Mood < 3.4 |
| ACUTE_CARDIO_EVENT | HR > 120 or SBP > 160 → direct ground link required |

## Escalation logic
1. **Emergency:** ACUTE_CARDIO_EVENT → `urgency = CRITICAL_EMERGENCY`, `directGroundLinkRequired = true`, `deliveryMode = EMERGENCY_DIRECT`, independent of queue/link state.
2. **Escalate** if any alarm-level flag, or ≥ 2 flags, or (1 flag, persisted ≥ 5 days, worsening).
3. **Route** when escalating:
   - `linkAvailable` and delay ≤ 10 s → `FLIGHT_SURGEON` (live call).
   - else `onboardSupport` → `CREW_MEDICAL_OFFICER`.
   - else → `FLIGHT_SURGEON` via packet (`SEND_PACKET`, or `QUEUE_OFFLINE` when link is down).
4. **Otherwise** `SELF_TREAT`, `deliveryMode = NONE`.

Severity score 0–3 feeds packet priority: LOW / MEDIUM / HIGH / CRITICAL.

## Packet and checksum
- ID: `ARES6-MED-D<3-digit day>-<counter>`; counter starts at 840 and continues after existing queue entries.
- Checksum: FNV-1a (32-bit hex) over stable-stringified packet minus volatile fields. `verifyPacket(packet)` recomputes and compares.

## Queue behaviour
- `enqueue(packet)` verifies checksum; mismatch → FAILED permanent "Rejected: checksum mismatch."
- With link down: stays QUEUED (progress paused); when link returns: TRANSMITTING → ACKNOWLEDGED after `transitMs(delay)`.
- Random failure (`failRate`) → FAILED → auto retry after `retryMs`, up to `maxAttempts` (3), then stays FAILED; `retry(id)` manually re-queues.
- ACK attaches simulated `groundReply`.
- State persisted to localStorage; reload restores queue; in-flight → QUEUED on reload/link drop.

## Public API summary
```
QueueEngine.enqueue(packet) · setLink({available}) · getLink() · getAll()
QueueEngine.onChange(cb) · retry(packetId) · clear()
PacketEngine.buildPacket · verifyPacket · checksumOf · simulateTransmission
```

## Known deliberate deviations
- Day-40 triage returns **CMO** (matching the CONTRACT example) where Om's placeholder returned FLIGHT_SURGEON at 128 s; the difference is driven by the 10 s live-link threshold (assumption).
- Rationale text still says "source pending" for delay figures because CONTRACT requires it until sources are verified.

## Safety wording (do not change)
- "Report to the flight surgeon."
- "Headache plus high CO2: check the scrubber first."
