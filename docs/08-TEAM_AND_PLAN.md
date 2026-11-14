# 08 · Team, Work Breakdown and Plan

## Roles
| Person | Role | Owns |
|---|---|---|
| **Tanishk** | Engine | `data.js` (synthetic 180-day data, Day-40 story), baseline, drift alerts, `forecast.js`, `whatif` |
| **Om** | Frontend / UI | `index.html`, css, `js/*.js`, tabs, charts, Act-tab wiring, queue panel |
| **Raghav** | Triage + integration + delivery | `triage/*` (triage, packet, queue, tests), sources, integration, demo script, video, submission |

(Team of 3 doing the work. Others on the registration list are not part of the build plan.)

## Work breakdown

### Raghav
- [x] Triage engine, packet builder, queue (contract v2.0), 40 tests passing.
- [ ] Commit/push `triage/` on branch `raghav`, open PR.
- [ ] Tell Om the script-tag swap + queue wiring.
- [ ] Verify NTRS delay sources; fix `js/sources.js` (Moon one-way 1.3 s vs round trip 2.6 s; remove "source pending").
- [ ] Browser-test Act tab at Day 40; fix console errors.
- [ ] Demo script (30 s + 3 min), video storyboard, record and edit.
- [ ] Submission text, Related Work slide, final checklist.
- [ ] Verify judging criteria, format and deadline on the official Space Apps site.

### Tanishk
- [ ] `data.js` with documented telemetry shape (share with Raghav).
- [ ] Baseline + drift alerts (z-score, persistence, worsening, reason text).
- [ ] Forecast from NASA rates; adherence what-if (assumption labeled).
- [ ] Unit tests for engine; handoff doc of return shapes to Om.

### Om
- [ ] Replace placeholder script tags with real module paths.
- [ ] Act tab: use `QueueEngine.enqueue`, queue panel, link toggle, FAILED + Retry.
- [ ] Forecast tab slider; alerts panel with reasons.
- [ ] Sources tab; disclaimer; offline check; visual polish.

## Timeline (adjust to the official deadline — TBD)
| Phase | Target | Outcome |
|---|---|---|
| 1. Merge | Day 1–2 | All three parts in one repo, app loads |
| 2. Integrate | Day 3–4 | Scenario steps 1–7 work |
| 3. Polish | Day 5 | UI polish, sources fixed, tests green |
| 4. Record | Day 6 | Video + deck |
| 5. Submit | Day 7 (buffer before deadline) | Submission done, repo public-ready |

## Git workflow
- `main` protected by convention: no direct commits.
- Branches: `raghav`, `tanishk`, `om`. PR into `main`, one reviewer from the team.
- Commit small and often; message format `area: what` (e.g. `triage: add queue retry`).
- Before PR: `node triage/test_triage.js` must pass.
- If push gives 403: accept Om's collaborator invite.

## Communication
One WhatsApp group. Daily 10-minute sync: "done / next / blocked". Contract changes only through `CONTRACT.md` PR.

## Handoff messages
- **To Om:** swap script tags to `triage/triage.js`, `triage/queue.js`, `triage/packet.js`; wire `QueueEngine`; add queue panel; use `setLink` for the toggle.
- **To Tanishk:** return shapes for alerts and forecast per CONTRACT; telemetry fields triage reads (sleep, mood, HR, SBP, CO2, symptoms, immune flags).
