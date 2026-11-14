# 04 · MVP Definition

## MVP statement
A static, offline web app that walks through one dramatic scenario — **Day 40 of a Mars-transit mission** — and shows detect → forecast → act end to end with synthetic data.

## In scope (must ship)
| Area | MVP deliverable | Owner |
|---|---|---|
| Data | Synthetic 180-day dataset, Day-40 story baked in (`data.js`) | Tanishk |
| Detect | Baseline + drift alerts with reasons, persistence, worsening | Tanishk |
| Forecast | Landing-day projection + adherence what-if slider | Tanishk |
| Triage | Rule-based engine, 3 levels, emergency path, SANS + scrubber rules | Raghav |
| Packet | Build + checksum + verify | Raghav |
| Queue | Offline persistence, link toggle, retry, FAILED state, simulated ACK | Raghav |
| UI | Monitor / Forecast / Act / Sources tabs, comm-delay display | Om |
| Sources | Source list, NASA vs assumption labels, disclaimer | Raghav + Om |
| Demo | 30 s + 3 min script, recorded video | Raghav |
| Submission | Text, repo link, deck/slides, video | Raghav |

## Out of scope (explicitly cut)
- Real device/sensor input, accounts, cloud backend.
- Machine-learning models (rules + statistics only, which keeps alerts explainable).
- Radiation dose modelling, multi-astronaut comparison beyond the demo crew.
- Mobile-native packaging.

## Nice-to-have (only if MVP is green)
1. Crew selector (multiple synthetic astronauts).
2. Delay slider on the Act tab to show CMO↔flight surgeon switching live.
3. Export packet as JSON file.
4. Print-friendly CMO summary.
5. Dark/light toggle.

## Demo scenario (the story the MVP must tell)
1. **Day 1–30:** baseline forms; everything calm.
2. **Day 40:** sleep falls, mood dips, CO2 creeps up, headache reported → alert with reasons.
3. Triage reads delay ≈ 128 s → CMO; scrubber-first hint appears when CO2 ≥ 4500 ppm.
4. User lowers adherence slider → landing-day forecast worsens; raises it → improves.
5. Link toggled **off** → packet QUEUED. Link **on** → TRANSMITTING → ACKNOWLEDGED with ground reply.
6. Failure injection → FAILED → Retry → ACKNOWLEDGED.
7. Emergency vitals case → "use direct ground link now", bypasses queue.

## Definition of done
- [ ] `node triage/test_triage.js` passes (40/40).
- [ ] App opens from `index.html` with browser console free of errors on Day 40.
- [ ] Scenario steps 1–7 above work without code edits.
- [ ] Works with network disabled.
- [ ] Sources tab has no "source pending" left (or it is explained).
- [ ] README has run instructions and disclaimer.
- [ ] 3-minute video recorded; submission form filled.
- [ ] All teammates can run the demo from a fresh clone.

## Cut line / priority order if time runs short
1. Detect + Act (triage + queue) working end to end.
2. Forecast with slider.
3. Sources + disclaimers.
4. Video and submission.
5. Everything under "Nice-to-have".
