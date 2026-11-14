# 10 · Demo Script and Video Storyboard

## 30-second pitch (voice-over)
"Astronauts heading to Mars can't call a doctor in real time. LANDFALL watches each astronaut against their **own** baseline, forecasts how ready they'll be at landing, and — based on today's communication delay — tells them who should act: themselves, the crew medical officer, or the flight surgeon. If the link is down, the report waits in a checksum-verified queue and goes out when contact returns. All offline, all explainable."

## 3-minute demo

| Time | Screen | Say | Do |
|---|---|---|---|
| 0:00–0:20 | Title / problem | Delay, isolation, confinement → crews must decide alone. | — |
| 0:20–0:50 | Monitor tab, Day 40 | "Day 40: sleep dropped, mood slipping, CO2 rising. LANDFALL compares to this astronaut's own baseline, not a generic limit." | Open alert, show reasons + persistence |
| 0:50–1:25 | Forecast tab | "What happens at landing? Using NASA's loss rates, here's the projection. Skip exercise and it worsens." | Drag adherence slider both ways; mention assumption label |
| 1:25–2:00 | Act tab | "Delay is about 128 seconds, so a live call isn't possible. Triage routes to the crew medical officer and explains why. Headache plus high CO2? Check the scrubber first." | Show triage card + rationale |
| 2:00–2:30 | Queue | "Link goes down — packet is queued, checksum-verified. Link returns — transmitting, acknowledged. Failure? Retry." | Toggle link off/on; show FAILED → Retry |
| 2:30–2:45 | Emergency | "A cardiac emergency skips the queue — direct ground link now." | Trigger emergency case |
| 2:45–3:00 | Sources + close | "Synthetic data, NASA figures labeled, assumptions labeled. Illustrative, not clinical. Related work: NASA ExMC CDSS, EIMO, digital-twin frameworks — our gap is the integrated, offline, explainable prototype." | Sources tab, team names |

## Video storyboard
1. Title card (3 s) · 2. Problem (15 s, simple text/animation) · 3–7 as table above · 8. Closing card with repo link and names.
Tips: 1080p, large cursor, zoom browser to 125 %, record Day 40 flow in one take, voice-over recorded separately, subtitles on, under the allowed length (check rules).

## Rehearsal checklist
- [ ] Fresh browser profile, local storage cleared before recording.
- [ ] Reset queue with `QueueEngine.clear()`.
- [ ] Network off to prove offline.
- [ ] Have a failRate toggle ready for the FAILED → Retry moment.
- [ ] Time each section; trim to 3:00.

## Likely judge questions and answers
- *Is it new?* "Pieces exist in research; we integrated them into a working offline prototype with explainable alerts, what-if forecast and a verified queue."
- *Is the forecast accurate?* "Illustrative. NASA rates anchor it; the adherence curve is a labeled assumption."
- *Real data?* "Synthetic by design; shape follows plausible telemetry."
- *Why no ML?* "Explainability and testability in a safety context."
- *Checksum security?* "Integrity check for simulation; real systems need signing/encryption."
