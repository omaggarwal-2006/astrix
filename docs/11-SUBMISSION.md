# 11 · Submission Kit

> Check the official Space Apps site for exact fields, length limits, judging criteria and deadline, and update this file.

## Project title
LANDFALL — Delay-Aware Astronaut Health Monitoring

## Short summary (≈50 words)
LANDFALL is an offline health-monitoring prototype for deep-space crews. It detects drift from each astronaut's own baseline with explainable alerts, forecasts landing-day readiness with an exercise what-if, and triages who should act given communication delay, queuing verified report packets when the link is down.

## Long description (draft)
Long-duration missions combine isolation, confinement and communication delay. Crew members may have to judge their own health for minutes or hours before Earth can respond. LANDFALL addresses this with three connected capabilities. **Detect:** per-astronaut baselines and drift alerts that always explain why they fired. **Forecast:** a landing-day projection built on NASA-published loss rates for bone, strength and aerobic capacity, with an exercise-adherence slider (response curve labeled as our assumption). **Act:** delay-aware triage between self-treatment, the crew medical officer and the flight surgeon, with an emergency path that bypasses the queue, and a store-and-forward packet queue with checksums, retries and simulated acknowledgements. The app runs entirely offline in a browser. All data is synthetic and the tool is illustrative, not a clinical predictor.

## How we used NASA data
HRP bone/strength/aerobic loss rates; exercise duration; communication-delay figures from NASA NTRS; hazards context from HRP resources. Assumptions are labeled in the Sources tab.

## Technology
HTML, CSS, JavaScript (no framework, no build), Chart.js (vendored), localStorage, Node for tests.

## Built-with / credits
Team: Raghav Dua, Tanishk, Om. Acknowledge NASA open resources and Space Apps.

## Links to prepare
- [ ] GitHub repo (public, README with run steps and disclaimer)
- [ ] Demo video (≤ allowed length)
- [ ] Slide deck / one-pager (with Related Work slide)
- [ ] Live demo link (optional; GitHub Pages works because app is static)

## Judging alignment (verify against official criteria)
| Typical criterion | Our evidence |
|---|---|
| Impact / relevance | Directly addresses astronaut self-evaluation under delay |
| Creativity | Landing-day forecast + delay-aware triage + DTN-style queue combination |
| Validity | NASA-sourced rates, explicit assumptions, tests |
| Presentation | 3-min flow, clear story, video |
| Technical execution | Offline, deterministic, 40 automated tests |

## Final checklist
- [ ] All tests green; fresh-clone run verified
- [ ] "source pending" removed or explained
- [ ] Moon delay value fixed (one-way vs round trip)
- [ ] Disclaimer on UI and README
- [ ] Video uploaded, links work while logged out
- [ ] Submission form saved and submitted before the deadline with buffer
