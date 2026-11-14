# 04 · MVP Definition (v2)

## MVP statement

A static, offline web app that tells **one story end to end**: Day 40 of a Mars transit, where sleep, mood and CO2 drift, the forecast says landing readiness is at risk, and the delay decides that the crew medical officer acts while a verified bundle waits for Earth. Every row of the triage table can be shown live with demo controls.

## Keep, change, cut

| Item | Decision | Reason | Requirement |
|---|---|---|---|
| Baseline drift, explainable alerts | **Keep and upgrade** | Core of Detect | D1–D8 |
| Forecast with what-if | **Keep**, add uncertainty and the triage link | Core of Forecast | F1–F7 |
| Triage, packet, queue | **Keep**, rebuild around the decision table and DTN concepts | Core differentiator | T1–T10, Q1–Q9 |
| Readiness hero and Go/No-Go poll | **Keep**, but must reflect active alarms | Currently contradicts the alerts | U2 |
| Mission scene, demo runner | **Keep**, fix captions and delay numbers | Helps the video if accurate | U3, H3 |
| Digital twin | **Keep only if** it shows the same data as the alerts | Avoid a second, inconsistent story | U4 |
| XP score and tiers | **Rename** to "mission readiness score", or cut; never use escalation names | Conflicts with triage; gamified health is a risk | U5 |
| Constellation, micro-lab, extra visuals | **Move to Extras** or cut | Not tied to the story; source of bugs | U6 |
| Radiation dose tracker | **Add** | Named in the challenge | R1–R3 |
| Wellbeing check-in | **Add** | Named in the challenge | W1–W4 |
| Evaluation harness | **Add** | Strongest evidence we can show | E1–E5 |
| Dead code, orphan React app | **Delete** | Judges read the repo | H1 |

## In scope (must ship)

| # | Deliverable | Owner | Depends on |
|---|---|---|---|
| M1 | `runDay()` pipeline and the Today screen | Om + Raghav | M2, M4, M5 |
| M2 | Detect v2: computed baseline, z, EWMA, fusion, missing data | Tanishk | — |
| M3 | Engine merged behind the adapter, rules fallback | Tanishk + Om | — |
| M4 | Forecast v2: ranges, go/no-go, readiness-at-risk reason | Tanishk | M3 |
| M5 | Triage table engine with all rows, what-would-change, override | Raghav | M2, M4 |
| M6 | Bundle and queue v2: priority, lifetime, retry limit, receipt | Raghav | M5 |
| M7 | Demo controls panel | Om | M5, M6 |
| M8 | Radiation tracker and SPE alert | Tanishk (data) + Om (UI) | M5 |
| M9 | Wellbeing check-in and sleep regularity | Om (UI) + Tanishk (metric) | M2 |
| M10 | Evaluation harness and report | Raghav | M2, M5 |
| M11 | One delay function; captions generated from data | Om | M5 |
| M12 | Readiness headline reflects alarms; XP renamed; extras moved | Om | M1 |
| M13 | Delete dead code; `node --test` suite | Om + Raghav | — |
| M14 | Docs, sources verified, demo video, submission | Raghav | all |

## Out of scope

- Real sensors, accounts, a cloud backend, real networking.
- ML for alerts or triage (the forecast model is advisory only).
- Multi-astronaut comparison views (the harness uses many synthetic crews internally, but the UI shows one).
- Native mobile packaging.

## Nice-to-have (only when the MVP is green)

1. Crew selector across several synthetic astronauts.
2. Contact-window schedule instead of a manual link toggle.
3. Export a bundle as a JSON file.
4. Print-friendly CMO case summary.
5. CUSUM alongside EWMA, with a toggle to compare.

## The demo story the MVP must tell

| Step | Days | What happens | Requirements shown |
|---|---|---|---|
| 1 | 1–30 | Calm; the baseline forms | D1 |
| 2 | 40 | Sleep, mood and CO2 drift; alert with reasons and fused score | D3, D4, D7 |
| 3 | 40 | Landing range drops; slider shows exercise effect; "landing readiness at risk" joins the triage reasons | F1–F5 |
| 4 | 40 | Delay about 168 s (2.8 min), so no live call; routed to CMO; scrubber hint; bundle built | T1, T4, T6, Q1 |
| 5 | 40 | Link off: QUEUED with priority and lifetime. Link on: ACKNOWLEDGED with receipt. Failure injected: FAILED, then retry | Q3–Q6, U1 |
| 6 | any | Emergency vitals: direct-ground-link banner, queue bypassed. SPE: shelter alert | T2, R2 |
| 7 | — | Evaluation slide: detection delay and false-alarm rate vs a fixed threshold | E3, E4 |
| 8 | — | Sources, assumptions and disclaimer | N7 |

## Definition of done

- [ ] `node --test` passes, with one test per triage-table row.
- [ ] `eval/results.json` generated from a recorded run (seed, commit and date inside).
- [ ] App opens via `launch.bat` with no console errors on days 1, 40, 44, 90 and 180.
- [ ] Demo story steps 1–8 work using only on-screen controls.
- [ ] Works with the network disabled after one load.
- [ ] No "source pending" label left in the UI without an explanation.
- [ ] Every number in the UI is labelled NASA (with source) or team assumption.
- [ ] Dead code deleted; repo tree matches [06-ARCHITECTURE.md](06-ARCHITECTURE.md#target-file-tree).
- [ ] `CONTRACT.md` Part A matches the code, and every migrated module has moved to Part B.
- [ ] 3-minute video recorded; submission form filled.
- [ ] Each teammate has run the demo from a fresh clone.

## Cut line (if time runs short, in this order)

1. **Must:** M5 triage table, M6 queue, M7 demo controls, M12 readiness fix. Without these the thesis can't be shown.
2. **Must:** M2 Detect v2 and M4 forecast link.
3. **Should:** M10 evaluation harness (even a small run beats none).
4. **Should:** M8 radiation and M9 wellbeing.
5. **Could:** M3 engine merge. If it slips, keep the rule-based forecast and say "model built, integration in progress".
6. **Could:** Nice-to-have list.
