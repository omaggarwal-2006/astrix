# 05 · Dependencies

## 1. Runtime dependencies (app)
| Dependency | Use | Notes |
|---|---|---|
| Modern browser (Chrome/Edge/Firefox/Safari) | Runs the app | Needs localStorage |
| Chart.js (vendored in `lib/`) | Charts | Local file, no CDN |
| Fonts (vendored) | Typography | Local files, no CDN |
| Plain HTML/CSS/JS | App code | Global IIFE modules on `window`; no bundler, no framework |

No backend, database, API keys or network calls at runtime.

## 2. Development dependencies
| Tool | Use |
|---|---|
| Node.js | Run `triage/test_triage.js` and engine tests |
| Git + GitHub | Collaboration (repo: omaggarwal-2006/astrix) |
| VS Code | Editing; use integrated terminal |
| Any static server (optional) | e.g. `npx serve` or VS Code Live Server; opening `index.html` directly also works |

## 3. Module dependency graph
```
data.js  ─────────────►  forecast.js / engine (Tanishk)
   │                           │
   ├──────────────►  triage/triage.js ──► triage/packet.js ──► triage/queue.js
   │                           │                  │                   │
   │                           └──────────────────┴───────────────────┘
   ▼                                      ▼
js/state.js (LandfallState: day, delay)   js/act-ui.js, js/app.js (Om)
                                               ▲
                                       js/sources.js, js/storage.js
```
- `triage.js` reads telemetry from `data.js` (via argument) and comm delay from `LandfallState.getCommDelaySeconds(day)`.
- `packet.js` needs the triage result; `queue.js` needs packets.
- `act-ui.js` calls `TriageEngine.evaluate`, `PacketEngine.buildPacket`, and either `simulateTransmission` (current) or `QueueEngine.enqueue` (target).

## 4. Script-tag order in `index.html`
```
js/sources.js → data.js (engine) → forecast.js → triage/triage.js → triage/queue.js → triage/packet.js → js/storage.js → ... UI scripts
```
Remove `placeholders/triage.js` and `placeholders/packet.js` once the real modules are wired. (Keep exact order consistent with CONTRACT.md.)

## 5. Team dependencies (who waits for whom)
| Blocked person | Needs | From |
|---|---|---|
| Raghav | Telemetry shape and baseline summary fields | Tanishk (`data.js`) |
| Om | Triage/packet/queue APIs | Raghav (done, in `triage/`) |
| Om | Alert and forecast objects | Tanishk |
| Tanishk | Day-40 story requirements | Contract / Raghav |
| Everyone | Final delay figures and Moon value fix | Raghav (verify NTRS) |

## 6. External data and facts
NASA HRP/NTRS figures (see 13-SOURCES.md). All telemetry is synthetic and generated in-repo.

## 7. Browser feature requirements
localStorage (queue persistence key `landfall_packet_queue_v1`), `JSON`, `Date`, ES2015+ syntax. No service workers required.

## 8. Known integration gaps
- Act tab currently uses `simulateTransmission`; a queue panel (QueueEngine.getAll/onChange, setLink) still needs to be added by Om.
- `js/sources.js` has "source pending" delay labels and a Moon round-trip/one-way mix-up.
