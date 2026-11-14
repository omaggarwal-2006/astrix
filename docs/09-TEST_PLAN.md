# 09 · Test Plan

## Automated
Run from repo root:
```
node triage/test_triage.js     # expect: 40 passed, 0 failed
```
Covers: Day-40 story (persistence 1 at day 40, 6 at day 45, not worsening by day 52), levels/urgency, SANS wording, scrubber rule, emergency path, delivery modes, packet checksum, tamper rejection, queue transitions.

Engine tests (Tanishk) should cover: baseline calculation, z-score threshold, persistence counting, forecast monotonicity w.r.t. adherence, determinism.

## Manual scenario checklist (browser)
| # | Step | Expected |
|---|------|----------|
| 1 | Open `index.html`, no network | App loads, no console errors |
| 2 | Select Day 40 | Drift alert with reasons visible |
| 3 | Act tab | Triage = CMO, delay ≈ 128 s, rationale shown |
| 4 | Turn onboard support off | Triage = FLIGHT_SURGEON by packet |
| 5 | Link off, Send | Packet QUEUED, persists on reload |
| 6 | Link on | TRANSMITTING → ACKNOWLEDGED with ground reply |
| 7 | Set failRate > 0 | FAILED → auto retry; Retry button works |
| 8 | Edit packet field in storage | Rejected: checksum mismatch |
| 9 | Emergency vitals (HR > 120) | Direct ground link message; queue not required |
| 10 | Vision symptom | "Report to the flight surgeon." |
| 11 | Headache + CO2 ≥ 4500 | Scrubber hint text exact |
| 12 | Forecast slider | Projection changes monotonically |
| 13 | Sources tab | NASA vs assumption labels, disclaimer present |

## Cross-browser / environment
Chrome and one other browser; fresh clone on a teammate's machine; Wi-Fi off.

## Acceptance
All 13 manual steps pass and automated tests are green before recording the video.

## Bug log template
`ID · step · expected · actual · owner · status`
