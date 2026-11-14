# 01 · The Idea: LANDFALL v2

## Name

**LANDFALL** is the moment an astronaut returns to gravity. The product asks one question every day: *given how far Earth is right now, who should act on today's health signals, and will this crew member be ready on landing day?*

## The pitch: delay is the product

**One line.** LANDFALL is an offline astronaut health app that decides who should act on a health signal (the astronaut, the crew medical officer or the flight surgeon) based on how far Earth is, and makes sure the report reaches Earth intact even when the link is down.

**Core thesis.** On a deep-space mission, the same symptom needs a different response at 3 seconds of delay than at 20 minutes. Everything else in the app exists to feed that decision:

| Part | Its job in the decision |
|---|---|
| **Detect** | What changed, for this person |
| **Forecast** | Where it is heading by landing day |
| **Act** | Turns both into a responder, an emergency path and a verified report |

## What changed from v1

| v1 | v2 |
|---|---|
| Detect, Forecast and Act were three separate features | One daily decision loop with delay at the centre |
| The forecast was a chart | A projected no-go at landing is a reason to escalate |
| Triage was a hidden score | A visible decision table that shows which rule fired and what would change it |
| "Send to Earth" with a simple queue | A DTN-style bundle with priority, lifetime, retry limits and a custody-style receipt |
| Radiation and isolation covered thinly | A dose tracker with solar-particle-event alerts, and a wellbeing check-in |
| No evidence the alerts work | An evaluation harness against a fixed-threshold baseline |
| Many visuals, some unrelated to the story | Visuals that don't serve the decision are cut or moved to Extras |

## The decision loop

Every day the app runs the same six steps and shows the result on one screen ([19-UI_GUIDE.md](19-UI_GUIDE.md#today-screen)).

```
 ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
 │ 1 Read   │──►│ 2 Detect │──►│3 Forecast│──►│ 4 Decide │──►│5 Deliver │──►│6 Explain │
 │ the day  │   │  drift   │   │ landing  │   │  triage  │   │  bundle  │   │ in plain │
 │          │   │          │   │readiness │   │  table   │   │  queue   │   │  words   │
 └──────────┘   └────┬─────┘   └────┬─────┘   └────▲─────┘   └──────────┘   └──────────┘
                     │              │  "landing    │
                     └──────────────┴──readiness───┘
                        alerts        at risk"
                                                 ▲
                                    one-way delay, onboard support, link state
```

1. **Read** the day's data: sleep, mood, heart rate, blood pressure, cabin CO2, symptoms, exercise, radiation dose and check-in answers.
2. **Detect** drift from the astronaut's own baseline, fusing several signals and noting missing data ([14-DETECT_SPEC.md](14-DETECT_SPEC.md)).
3. **Forecast** landing-day readiness and its uncertainty, using recent exercise adherence ([15-FORECAST_SPEC.md](15-FORECAST_SPEC.md)).
4. **Decide** with the delay-aware triage table: self-care, crew medical officer or flight surgeon, plus any emergency override ([07-TRIAGE_SPEC.md](07-TRIAGE_SPEC.md)).
5. **Deliver** by building a verified bundle and queuing it for the next contact window.
6. **Explain** the chain: what changed, why it matters, what happens if nothing changes, who should act, and what would change the decision.

**Forecast feeds triage.** If landing readiness is projected to fall below the go/no-go level, that becomes a triage reason, not just a chart. This link is what turns three features into one product.

## Design rules

1. Rules and statistics for alerts and triage, so every output is explainable and testable.
2. The emergency path never depends on the queue or the link.
3. When data is missing or uncertain, escalate rather than stay silent.
4. Everything runs offline in a browser. All data is synthetic and labelled so.
5. The app advises; the crew decides. Every decision can be overridden with a note.

## What a plain dashboard misses

| Gap | Plain dashboard | What the crew needs | Where LANDFALL covers it |
|---|---|---|---|
| Meaning | A number against a generic limit | "Abnormal for *this* person", with the reason | Detect |
| Time | Shows today | Where this leads by landing day | Forecast |
| Distance | Assumes Earth can reply | Who should act at this delay | Decide |
| Delivery | A send button | A report that survives link loss and proves integrity | Deliver |
| Exposure | Mostly vitals | Radiation dose and isolation effects too | Radiation and wellbeing modules |
| Trust | "Trust us" | Measured against a fixed-threshold baseline | Evaluation harness |

## Users and what each needs

| User | Needs | Sees |
|---|---|---|
| **Astronaut** | A clear status and the next step, in under 10 seconds | Today screen, own trends, check-in |
| **Crew medical officer (CMO)** | A prioritised, explained case | Alerts with reasons, the triage table, the bundle |
| **Flight surgeon (on Earth)** | A compact, verifiable report | The bundle only (minimal fields), with checksum and trends |

Who sees what is defined in [12-RISKS_AND_ASSUMPTIONS.md](12-RISKS_AND_ASSUMPTIONS.md#privacy-who-sees-what).

## Novelty, stated honestly

Each ingredient exists: NASA's ExMC clinical decision-support work, the EIMO concept of operations, digital-twin frameworks, an ANU Mars-fitness model, DTN medical messaging and earlier Space Apps dashboards. **Our contribution is an integrated, offline, explainable prototype in which delay drives the decision, measured against a fixed-threshold baseline.** The team's own DTN research is the source of the bundle-style queue design.

## Scope statement

A hackathon prototype on synthetic data with a simulated ground link. It demonstrates decision-support design. It is **not a medical device, not clinically validated, and not a clinical predictor**.

## Success definition

In under 3 minutes a judge sees:

1. A Day-40 drift alert with reasons and a fused score.
2. The landing-readiness range drop, the slider move it, and "landing readiness at risk" appear as a triage reason.
3. The same case routed to the crew medical officer at about 3 minutes of delay, with the fired rule highlighted.
4. A bundle queued with the link down, acknowledged when it returns, failing and retrying under failure injection.
5. A cardiac emergency bypass the queue, and a solar particle event raise a shelter alert.
6. An evaluation slide with detection delay and false-alarm rate from a real run.
