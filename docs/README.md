# LANDFALL — Project Documentation

NASA Space Apps Challenge 2026 · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*
Team: Raghav Dua, Tanishk, Om · Repo: omaggarwal-2006/astrix

> One line: **An offline astronaut health app that notices drift from the astronaut's own baseline, forecasts landing-day readiness, and decides who should act (self / crew medical officer / flight surgeon) given the communication delay — then queues the report as an integrity-checked store-and-forward packet.**

## Reading order

| # | File | What it answers |
|---|------|-----------------|
| 01 | [IDEA.md](01-IDEA.md) | What is LANDFALL and why is it different |
| 02 | [PROBLEM_AND_RESEARCH.md](02-PROBLEM_AND_RESEARCH.md) | Challenge mapping, NASA facts used, related work, the gap |
| 03 | [PRD.md](03-PRD.md) | Product requirements: users, stories, functional + non-functional requirements |
| 04 | [MVP.md](04-MVP.md) | Exact scope for the hackathon build, what is cut, definition of done |
| 05 | [DEPENDENCIES.md](05-DEPENDENCIES.md) | Libraries, tools, data, module and team dependencies |
| 06 | [ARCHITECTURE.md](06-ARCHITECTURE.md) | Modules, data flow, API contract summary, packet format |
| 07 | [TRIAGE_SPEC.md](07-TRIAGE_SPEC.md) | Triage rules, thresholds, packet + queue behaviour (Raghav's part) |
| 08 | [TEAM_AND_PLAN.md](08-TEAM_AND_PLAN.md) | Roles, work breakdown, timeline, git workflow |
| 09 | [TEST_PLAN.md](09-TEST_PLAN.md) | What is tested, how, acceptance checks |
| 10 | [DEMO_SCRIPT.md](10-DEMO_SCRIPT.md) | 30-second and 3-minute demo, video storyboard |
| 11 | [SUBMISSION.md](11-SUBMISSION.md) | Submission text drafts, checklist, judging alignment |
| 12 | [RISKS_AND_ASSUMPTIONS.md](12-RISKS_AND_ASSUMPTIONS.md) | Honest limits, assumptions, risks, mitigations |
| 13 | [SOURCES.md](13-SOURCES.md) | Source list and verification status |

## Ground rules for everyone
1. **All data is synthetic.** Nothing here is a clinical tool or a clinical predictor.
2. Anything that is *our assumption* (not a NASA number) must be labeled "assumption" in code and UI.
3. `CONTRACT.md` (v2.0, in repo root) is the source of truth for module APIs. Docs here summarize it; if they disagree, CONTRACT.md wins.
4. Works offline: no CDN, no network calls at runtime.
