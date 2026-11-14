# 01 · The Idea — LANDFALL

## Name
**LANDFALL** — the moment an astronaut returns to gravity. The product is built around the question: *"Will this crew member be ready on landing day, and who should act on today's signals?"*

## The problem in plain words
On long missions (Moon, Mars transit) the crew cannot rely on instant help from Earth. Radio delay, isolation and confinement mean small health drifts (sleep, mood, heart rate, cabin CO2, immune signs) can build up unnoticed, and the crew has to decide *what to do and who to tell* without a live doctor. Existing dashboards show numbers; they do not answer "what's normal **for this person**", "what will landing look like", or "who should handle this, given the delay".

## The solution — three connected capabilities
1. **Baseline-drift detection (Detect).** Learn each astronaut's own baseline early in the mission. Flag deviation with persistence and worsening logic, and always show *why* an alert fired (explainable, not a black box).
2. **Landing-day forecast with what-if sliders (Forecast).** Project bone, strength and aerobic condition toward landing using NASA-published loss rates, and let the user move an exercise-adherence slider to see the predicted effect. The adherence response curve is **our labeled assumption**.
3. **Delay-aware triage + store-and-forward packet (Act).** Decide `SELF_TREAT` / `CREW_MEDICAL_OFFICER` / `FLIGHT_SURGEON` using the current communication delay and onboard support. Emergencies bypass the queue (direct ground link). Non-emergencies become an integrity-checked packet (checksum) that is queued offline, retried on failure and acknowledged by a simulated ground reply (DTN-style).

## Why it is different (honest version)
Each ingredient exists somewhere in research (NASA ExMC clinical decision support, EIMO concept of operations, digital-twin frameworks, a Mars-fitness model from ANU, DTN-based medical messaging, earlier Space Apps health dashboards). **We do not claim any piece is new.** The gap we fill is the *integrated, working, offline prototype*:

| Typical entry | LANDFALL |
|---|---|
| Live vitals dashboard | Personal-baseline drift with explainable alerts |
| Shows "now" | Forecasts landing readiness with what-if exercise slider |
| Ignores comms delay | Triage output depends on delay and available support |
| "Send to Earth" button | Checksum'd packet queue with QUEUED / TRANSMITTING / ACKNOWLEDGED / FAILED + retry |
| Needs internet | Fully offline, no build step |

## Target users
- **Astronaut / crew member** — wants a clear status and what to do next.
- **Crew Medical Officer (CMO)** — needs a prioritized, explained case summary.
- **Flight surgeon on Earth** — needs a compact, verifiable packet, not raw telemetry.

## Scope statement
Hackathon prototype using **synthetic data** and a simulated ground link. It is a demonstration of decision-support design, **not a medical device and not a clinical predictor**.

## Success definition
A judge can, in under 3 minutes, see: Day-40 drift alert with reasons → forecast change when sliding exercise → triage choosing CMO vs flight surgeon as delay changes → packet queued offline, failing, retrying, acknowledged.
