# 19 · UI Guide (v2)

Owner: Om · Requirements: L2, U1–U8, N4, N5
Every screen exists to show or feed the one decision. If a visual doesn't, it goes to **Extras**.

## Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Disclaimer strip: "Synthetic data · Illustrative, not a clinical tool"    │
├───────────────────────────────────────────────────────────────────────────┤
│ BANNERS (emergency / SPE shelter / hints), shown on every tab when active │
├───────────────────────────────────────────────────────────────────────────┤
│ Header: Day 40 / 180 · Earth 2 min 48 s away (one way) · Link ● UP        │
│         Day scrubber 1 ─────●────────────── 180    [Mission scene ▾]      │
├───────────────────────────────────────────────────────────────────────────┤
│ Tabs: Today · Signals · Forecast · Comms · Evaluation · Sources · Extras  │
├───────────────────────────────────────────────────────────────────────────┤
│ Tab content                                     │ Demo controls (drawer)  │
└───────────────────────────────────────────────────────────────────────────┘
```

## Today screen

The one screen that shows the whole loop (L2). It reads only `DayResult`.

| Block | Content | From |
|---|---|---|
| Readiness headline | "At risk on landing day" etc., by the rule in [18 §6](18-DATA_MODEL.md#readiness-headline-rule-u2); supporting average below | `readiness` |
| What changed | Top alerts with text, persistence, trend and confidence; fused alert first | `detect` |
| Landing readiness | Six compact ranges with GO / CAUTION / NO-GO and the source badge | `forecast` |
| Decision | Path in large type, delivery, priority class, and the **triage table with fired rows highlighted** | `decision` |
| Why / what would change | The five explanation sentences | `explanation` |
| Report | Bundle preview (ID, priority, lifetime, checksum), Send button, live queue state | `bundle`, queue |
| Override | "Choose a different path" with a required note | T10 |

Must fit without scrolling at 1366×768, with the triage table collapsible.

## Other tabs

| Tab | Purpose | Contents | Notes |
|---|---|---|---|
| **Signals** | Detect in depth | Trend charts per metric with baseline band and EWMA line; missing-data markers; check-in form; manual vitals; radiation bar and SPE history | Replaces the as-built Monitor tab |
| **Forecast** | Forecast in depth | Six cones starting at 100 %, threshold guides, what-if slider with "assumption" label, countermeasure checklist | Fix the 80 % cone origin |
| **Comms** | Act in depth | Full triage table, delay selector, bundle JSON with Copy, queue table with state, attempts, expiry, receipt, Retry | Replaces Triage & Comms |
| **Evaluation** | Evidence | Reads `eval/results.json`: summary table, per-scenario table, run metadata | Shows "No run recorded" if missing |
| **Sources** | Honesty | Sources with status, assumptions list from `config`, disclaimer, sample-vs-real table | Generated from `src/core/sources.js` and `config` |
| **Extras** | Visuals not in the story | Digital twin (if not made consistent), constellation, micro-lab | Clearly labelled "illustrative visuals" |

## Demo controls (U1)

A drawer on the right, labelled **"Simulation controls (demo only)"**. Every row of the triage table must be reachable from here.

| Control | Values | Shows |
|---|---|---|
| Link | Up / Down | `QUEUE_OFFLINE`, retries on link return |
| Onboard support | On / Off | CMO vs flight surgeon by bundle |
| Delay | Mission model (default) · ISS 0.01 s · Moon 1.3 s · Mars closest 180 s · Mars average 750 s · Mars farthest 1,320 s | Live call vs bundle |
| Failure injection | Off · Fail next · Fail all | FAILED, auto-retry, retry limit |
| Inject emergency | One click: HR 130 today | `EMERGENCY_CARDIAC` |
| Inject vision symptom | One click | `SANS_VISION` |
| Trigger SPE | One click | `SPE_SHELTER` |
| Skip check-in | Removes today's check-in | `DATA_MISSING` |
| Reset | Confirm dialog | Clears every key in [18 §8](18-DATA_MODEL.md#8-storage-keys) and returns to Day 40 |

Injected values are marked "simulated" in the bundle and on screen.

## Mission scene

Keep, with these rules (U3):

- Delay text comes from `src/core/delay.js`, never its own formula.
- Packet flight animation follows real queue state.
- Environment selector (Mars / ISS / Moon / EVA) changes the **delay preset** too, or is removed. A scene that says "ISS" while triage uses Mars delay is a second story.

## Demo runner

Keep, with these rules (U3):

- Captions are templates filled from the `DayResult` of that step ("Day 54: routed to {path} because {top reason}"). No hard-coded outcomes.
- The duration in the button label matches the real run time.
- The runner uses the same demo controls a presenter would, so the video and a live demo match.

## Readiness score (was XP)

Decision D-08: rename to **"Mission readiness score"** or cut.

- No tier names that sound like triage ("Flight surgeon escalation" must go).
- No points for interacting with the UI (slider drags, scans).
- If kept, it's the same number as the readiness supporting average, so it can't disagree with the headline.

## Digital twin

Decision D-09: keep on a main tab **only if** each region's colour comes from the same alerts and forecast as the Today screen (for example, legs from `bone` and `muscle`, head from `sleep`, `mood` and SANS). Otherwise move it to Extras.

## Accessibility (U8, N5)

| Rule | Check |
|---|---|
| Colour is never the only signal | Every status has a shape and a word (circle GO, triangle CAUTION, diamond NO-GO) |
| Contrast | Text ≥ 4.5:1 against its background |
| Keyboard | Every control reachable with Tab; rows activate with Enter or Space |
| Modals | Focus moves into the modal, is trapped there, and returns on close; Escape closes |
| Live updates | Banners use `role="alert"`; queue changes use `aria-live="polite"` |
| Motion | Respect `prefers-reduced-motion` (the scene already does) |

## Performance (N4)

- Only the visible tab renders on a day change. Others render when opened.
- Charts update data in place, never rebuild.
- No `Math.random()` in rendering; seeded noise only (N3).

## Copy rules

- Plain words. "Earth is 2 min 48 s away (one way)", not "OWLT 168 s".
- Every number shows its unit and, on hover or in Sources, whether it's NASA or a team assumption.
- No diagnosis words ([16 §2.4](16-RADIATION_AND_ISOLATION.md#24-wording-rules-w4)).
- The four safety strings in [07 §8](07-TRIAGE_SPEC.md#8-safety-wording-do-not-change) are never reworded.
