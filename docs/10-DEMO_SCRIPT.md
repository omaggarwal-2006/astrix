# 10 · Demo Script, Pitch and Video Storyboard (v2)

## 60-second pitch (voice-over)

> Astronauts heading to Mars can't call a doctor in real time, and the right response to a health signal depends on how far Earth is. LANDFALL compares each astronaut with their own baseline, forecasts landing-day readiness, and then decides who should act (themselves, the crew medical officer or the flight surgeon) for the current delay. Emergencies go straight to the ground link. Everything else becomes a checksum-verified bundle that waits safely in a queue until contact returns. It works offline, it explains every alert, and we measured it: on synthetic crews it flagged drift {X} days earlier than a fixed limit, at {Y} false alarms per 100 crew-days.

Fill `{X}` and `{Y}` from `eval/results.md` only. If the evaluation isn't run, drop the last sentence; don't estimate.

## 3-minute demo

Every number said aloud must match the screen. Delay at Day 40 is **2 min 48 s one way** (168 s) under the mission model.

| Time | Screen | Say | Do |
|---|---|---|---|
| 0:00–0:15 | Title | "On the way to Mars, Earth is up to 22 minutes away. The crew has to decide alone." | — |
| 0:15–0:30 | Today, Day 20 | "LANDFALL learns what's normal for *this* astronaut. Days 1 to 14 set the baseline. Everything's on track." | Scrub to Day 20 |
| 0:30–0:55 | Today, Day 40 | "Day 40. Sleep, mood and cabin CO2 moved together. Each alert says how far from their baseline, for how long, and which way it's going." | Scrub to 40; open the fused alert |
| 0:55–1:20 | Forecast | "Where is this heading? Landing-day ranges, built on NASA's loss rates. If the astronaut stops exercising…" — slider to 0 — "…muscle and aerobic go no-go, and that becomes a reason to escalate." | Slider 1.2 → 0 → back to 1.2 |
| 1:20–1:50 | Today, triage table | "Earth is 2 minutes 48 seconds away, so a live call isn't possible. The table shows which rule fired: escalate, onboard support present, so the crew medical officer takes it, and a report goes to Earth. Headache plus high CO2: check the scrubber first." | Point at highlighted rows; toggle onboard support off and on |
| 1:50–2:20 | Comms | "The link is down. The report is a bundle: priority, lifetime, checksum. It waits. Link back: acknowledged, with a receipt. A failed transmission retries on its own." | Link down → Send → Link up → Fail next |
| 2:20–2:35 | Any tab | "A cardiac emergency doesn't wait for any queue: direct ground link now. A solar particle event: shelter first." | Inject emergency, then Trigger SPE |
| 2:35–2:50 | Evaluation | "Does personal baseline help? On {N} synthetic crews it flagged drift {X} days earlier than fixed limits, at {Y} false alarms per 100 crew-days." | Show the summary table |
| 2:50–3:00 | Sources | "Synthetic data, NASA figures sourced, our assumptions labelled. Decision support, not diagnosis." | Sources tab; team names |

## Automated demo runner

The in-app runner must follow the same steps with the same controls, so the video and a live demo match. Captions are generated from each step's `DayResult` ([19-UI_GUIDE.md](19-UI_GUIDE.md#demo-runner)). The as-built runner's captions are wrong and must be replaced:

| As-built caption | Problem |
|---|---|
| "Day 44: cones widen and turn red" | Cone width is fixed; they reach amber only |
| "Day 54: assigns resolution to Crew Medical Officer" | Triage returns Flight Surgeon on day 54 |
| "Comm delay is 12m+ round-trip" | 750 s one-way is a 25-minute round trip |
| "Play 30-second demo" | It runs 25 seconds |

## Video storyboard

| # | Shot | Length |
|---|---|---|
| 1 | Title card: LANDFALL, tagline "Delay is the product" | 3 s |
| 2 | Problem: Earth–Mars delay animation, plain text | 12 s |
| 3–9 | The table above, one shot per row | ~2:35 |
| 10 | Closing card: repo link, live link, team names, disclaimer | 5 s |

Recording tips: 1080p, large cursor, browser zoom 125 %, clean browser profile, voice-over recorded separately, subtitles on, under the allowed length (check the rules).

## Rehearsal checklist

- [ ] `eval/results.md` generated from the tagged commit; numbers copied into the script.
- [ ] Fresh browser profile; Reset pressed.
- [ ] Network off after first load, to prove offline.
- [ ] Demo controls drawer open and ordered as in the script.
- [ ] Each section timed; total under 3:00.
- [ ] A backup recording exists in case the live demo fails.

## Likely judge questions

| Question | Answer |
|---|---|
| Is it new? | The pieces exist in research. Our contribution is an integrated, offline, explainable prototype in which delay drives the decision, measured against a fixed-threshold baseline. |
| Is the forecast accurate? | It's illustrative. NASA rates anchor it; the exercise curve is a labelled assumption. The ML model is advisory and evaluated on synthetic data only. |
| Why not use ML for alerts? | In a safety setting the crew and the doctor must see why an alert fired, and we must be able to test it. Rules do that. |
| Real data? | Synthetic by design, calibrated to published ranges, labelled on screen. |
| What about false alarms? | We measured them: {Y} per 100 crew-days on synthetic crews. |
| Is the checksum secure? | No, it's an integrity check for the simulation. Real systems would sign and encrypt bundles. |
| Why 10 seconds for a live call? | It's our assumption: beyond a few seconds a conversation stops being live. It's one setting and labelled so. |
| What if the app is wrong? | It advises; the crew decides and can override with a note. Missing data escalates instead of staying silent. |
| Privacy? | The flight surgeon gets only the bundle fields needed. Private notes stay on board unless shared. |
