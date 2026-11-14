# 09 · Test Plan (v2)

## Principles

- **Behaviour, not strings.** A test calls a function and checks its output. The current `tests/ui-check.mjs` only checks that text exists in files; keep it as a smoke check, but it doesn't count as testing.
- **Built-in tools only.** Node's test runner (`node --test`) and `node:assert`. No packages to install.
- **Pure logic is tested in Node.** The queue gets a fake clock and fake storage.
- **One test per triage-table row**, so every row of the demo has proof behind it.

## How to run

```bash
node --test tests/
```

## Automated tests

| File | Covers | Key cases |
|---|---|---|
| `tests/detect.test.mjs` | [14 §8](14-DETECT_SPEC.md#8-tests) | Baseline, SD floor, one-night dip vs slide, EWMA before z, fusion, missing data, CO2 absolute limit, determinism |
| `tests/forecast.test.mjs` | [15 §10](15-FORECAST_SPEC.md#10-tests) | Monotonic slider (rules and model), NASA range at full adherence, `low ≤ mid ≤ high`, labels, NO-GO → triage reason, model fallback |
| `tests/triage.test.mjs` | [07 §9](07-TRIAGE_SPEC.md#9-tests-one-per-table-row-plus-queue) | Every rule row; combining rules; escalate-one-level; exact safety strings; one live-call limit |
| `tests/bundle.test.mjs` | [07 §5](07-TRIAGE_SPEC.md#5-the-bundle) | Schema, stable checksum (key order doesn't matter), tamper detection, ID format, duplicate guard, private note excluded |
| `tests/queue.test.mjs` | [07 §6](07-TRIAGE_SPEC.md#6-the-queue) | Link down/up, priority order, expiry, retry limit, manual retry without double send, checksum mismatch never retried, reload behaviour |
| `tests/radiation.test.mjs` | [16 §1.5](16-RADIATION_AND_ISOLATION.md#15-tests) | Cumulative dose, SPE banner and bundle, limit fractions |
| `tests/wellbeing.test.mjs` | [16 §2.6](16-RADIATION_AND_ISOLATION.md#26-tests) | Mood drift wording, missed check-ins, sleep regularity |
| `tests/run-day.test.mjs` | Loop | Day 40 story end to end; readiness headline rule; only one delay value used |
| `tests/eval.test.mjs` | [17](17-EVALUATION.md) | Same seed, same results; N0 has no emergency alerts; A6–A8 never missed |
| `tests/config.test.mjs` | Ground rule 7 | No threshold literals outside `core/config.js` (scan `core/` for known numbers) |

## Manual scenario checklist (browser)

Run with a cleared `localStorage`, via `launch.bat`.

| # | Step | Expected | Req |
|---|---|---|---|
| 1 | Load, then disable the network and reload | App works, no console errors | N1 |
| 2 | Day 1–30 on the scrubber | Calm; "On track for landing" | D1, U2 |
| 3 | Day 40 | Fused alert with reasons; scrubber hint | D4, T4 |
| 4 | Today screen at Day 40 | CMO, fired rows highlighted, delay 2 min 48 s, five explanation lines | T1, L3, AC3 |
| 5 | Onboard support off | Flight surgeon by bundle | T6 |
| 6 | Delay → Moon 1.3 s | Flight surgeon, live call | T6 |
| 7 | Exercise slider to 0 h/day (with the §5.1 rules, muscle and aerobic cross NO-GO at day 40 only below about 0.2 h/day) | Muscle and aerobic NO-GO; "landing readiness at risk" in reasons; priority EXPEDITED | F5 |
| 8 | Link down, Send | Bundle QUEUED; still QUEUED after reload | Q8 |
| 9 | Link up | TRANSMITTING → ACKNOWLEDGED with receipt | Q6 |
| 10 | Failure: Fail next | FAILED → auto-retry → ACKNOWLEDGED | Q5 |
| 11 | Failure: Fail all | Three attempts, then FAILED; manual Retry works | Q5 |
| 12 | Edit a bundle field in DevTools storage, reload | FAILED, "checksum mismatch", no retry | Q7 |
| 13 | Inject emergency, link down | Exact emergency banner; no waiting | T2 |
| 14 | Inject vision symptom | "Report to the flight surgeon." | T3 |
| 15 | Trigger SPE | Shelter banner; EXPEDITED bundle sent before NORMAL ones | R2, Q3 |
| 16 | Skip check-in for 2 days | Missing-data alert; decision escalates one level | D5, T7 |
| 17 | Override with a note | Audit entry; appears in the next bundle | T10 |
| 18 | Evaluation tab | Numbers match `eval/results.md` | E5 |
| 19 | Sources tab | Every number labelled; no unexplained "source pending" | N7 |
| 20 | Keyboard only | Every control reachable; modals trap focus; Escape closes | U8 |
| 21 | Reset | Everything cleared; Day 40 | U1 |
| 22 | Demo runner | Captions match on-screen results | U3 |

## Environments

Chrome and one other browser (Firefox or Edge). A fresh clone on a second teammate's machine. Wi-Fi off for step 1.

## Acceptance

All automated tests green and all 22 manual steps pass before recording the video. Record failures in the bug log.

## Bug log

Keep it as a table in a GitHub issue or here:

| ID | Step | Expected | Actual | Owner | Status |
|---|---|---|---|---|---|
