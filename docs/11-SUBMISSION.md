# 11 · Submission Kit (v2)

> Check the official Space Apps 2026 site for exact fields, length limits, judging criteria and the deadline, then update this file (open question OQ1).

## Project title

**LANDFALL: Delay-Aware Astronaut Health Decisions**

## Tagline

Delay is the product.

## Short summary (about 50 words)

LANDFALL is an offline health app for deep-space crews. It compares each astronaut with their own baseline, forecasts landing-day readiness, and decides who should act (the astronaut, the crew medical officer or the flight surgeon) for the current communication delay, sending a verified report that survives link loss.

## Long description (draft)

On a Mars transit, Earth is minutes away, so the same symptom needs a different response at 3 seconds of delay than at 20 minutes. LANDFALL is built around that decision.

Every day it runs one loop. **Detect** compares sleep, mood, heart rate, blood pressure, cabin CO2, symptoms, exercise, radiation dose and a short wellbeing check-in against the astronaut's own baseline, fusing several signals and treating missing data as a reason for caution. **Forecast** projects bone, muscle, aerobic, balance, sleep and mood to landing day as ranges, using NASA-published loss rates and the astronaut's exercise adherence; a projected no-go becomes a reason to escalate. **Decide** applies a visible, delay-aware triage table: self-care, the crew medical officer, or the flight surgeon, with emergency and solar-particle-event overrides that never wait on a queue. **Deliver** builds a checksum-verified bundle with priority and lifetime, and queues it until contact returns.

The app shows which rule fired and what would change the decision, and the crew can override it with a note. It runs fully offline in a browser. We measured its alerting against fixed thresholds on synthetic crews: {results from `eval/results.md`}. All data is synthetic, calibrated to published ranges. LANDFALL is decision support, not a medical device or clinical predictor.

## How we used NASA data

| NASA resource | Use |
|---|---|
| HRP: bone change risk | Bone loss rate in the forecast |
| HRP: reduced cardiorespiratory and musculoskeletal fitness risk | Strength and aerobic loss, crew spread, exercise reference |
| HRP: sensorimotor, sleep, behavioural, cardiovascular risk pages | Dimension definitions and citations |
| HRP: hazards and risks overview | Problem framing; hazards that feed each other |
| NTRS communication-delay reports | Delay presets and the mission delay model |
| Mars-transit radiation measurements and NASA's dose standard | Dose calibration and limit (to verify) |
| CSA radiation monitoring article | Radiation context |

Every figure is listed with its status in [13-SOURCES.md](13-SOURCES.md).

## Technology

HTML, CSS and JavaScript ES modules (no framework, no build); canvas visuals; Chart.js (vendored); `localStorage`; a service worker for offline use; Node's built-in test runner; an evaluation harness in Node; an advisory ridge-regression forecast model trained in Python (scikit-learn) and run in the browser from a 7.5 KB JSON file.

## Team and credits

Raghav Dua, Tanishk, Om. Acknowledge NASA open resources, the Canadian Space Agency article, and Space Apps.

## Links

| Link | Status |
|---|---|
| GitHub repo (public, README with run steps and disclaimer) | `omaggarwal-2006/astrix`; README rewritten for v2 |
| Live demo (GitHub Pages) | <https://omaggarwal-2006.github.io/astrix/> |
| Demo video | To record |
| Slide deck or one-pager (with Related Work and Evaluation slides) | To make |

## Judging alignment (verify against the official criteria)

| Typical criterion | Our evidence |
|---|---|
| Impact and relevance | Directly answers "evaluate and act on their own health" under delay; covers radiation and isolation |
| Creativity | Delay as the input that changes the responder; forecast feeding triage; DTN-style bundles |
| Validity | NASA-sourced rates, labelled assumptions, an evaluation against a fixed-threshold baseline |
| Technical execution | Offline, deterministic, tested per triage rule, model with fallback |
| Presentation | One story in 3 minutes; on-screen controls for every rule |

## Final checklist

- [ ] `npm test` and `npm run check` green; fresh-clone run verified on two machines.
- [ ] `eval/results.md` generated from the tagged commit; numbers in the summary and video match it.
- [ ] Every source in [13-SOURCES.md](13-SOURCES.md) opened and marked verified, or the claim removed.
- [ ] No "source pending" left without explanation.
- [ ] Disclaimer on every screen and in the README.
- [x] Dead code deleted; repo follows the `src/` layout in [06-ARCHITECTURE.md](06-ARCHITECTURE.md#repo-tree-as-built).
- [ ] Video uploaded; links work while logged out.
- [ ] Submission form saved and submitted with a day of buffer.
