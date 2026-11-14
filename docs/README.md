# LANDFALL v2: Project Documentation

NASA Space Apps Challenge 2026 · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*
Team: Raghav Dua, Tanishk, Om · Repo: `omaggarwal-2006/astrix` · Live build: <https://omaggarwal-2006.github.io/astrix/>

> **One line.** LANDFALL is an offline astronaut health app that decides who should act on a health signal (the astronaut, the crew medical officer or the flight surgeon) based on how far Earth is, and makes sure the report reaches Earth intact even when the link is down.
>
> **Core thesis: delay is the product.** On a deep-space mission, the same symptom needs a different response at 3 seconds of delay than at 20 minutes. Detect, Forecast and Act all exist to feed that one decision.

---

## How to read these docs

These docs describe the **v2 target design**. The code in the repo is the **as-built** app, and parts of it still follow v1. [00-STATUS.md](00-STATUS.md) maps every v2 requirement to what is built today. Read it first if you are about to write code.

Status labels are used in every file:

| Label | Meaning |
|---|---|
| **Built** | Works in the current code, as described |
| **Partial** | Exists, but differs from the spec or has known bugs |
| **Planned** | Not in the code yet |
| **Cut** | Removed from scope on purpose |

## Reading order

### Start here
| File | What it answers |
|---|---|
| [00-STATUS.md](00-STATUS.md) | What is built, partial or planned, and who owns it |
| [01-IDEA.md](01-IDEA.md) | The v2 idea: one decision loop with delay at the centre |
| [02-PROBLEM_AND_RESEARCH.md](02-PROBLEM_AND_RESEARCH.md) | The need, the gap, NASA facts, related work |

### Product
| File | What it answers |
|---|---|
| [03-PRD.md](03-PRD.md) | Requirements with IDs, acceptance criteria and status |
| [04-MVP.md](04-MVP.md) | Keep / change / cut, the demo-critical scope, definition of done |
| [19-UI_GUIDE.md](19-UI_GUIDE.md) | Every screen and control, and what each one is for |

### Engineering specs (the decision loop, in order)
| File | Loop step |
|---|---|
| [14-DETECT_SPEC.md](14-DETECT_SPEC.md) | 2 · Detect: personal baseline, EWMA/CUSUM, signal fusion, missing data |
| [15-FORECAST_SPEC.md](15-FORECAST_SPEC.md) | 3 · Forecast: landing readiness ranges, go/no-go, engine integration |
| [07-TRIAGE_SPEC.md](07-TRIAGE_SPEC.md) | 4–5 · Decide and Deliver: the triage table, bundles, the queue |
| [16-RADIATION_AND_ISOLATION.md](16-RADIATION_AND_ISOLATION.md) | Inputs: dose tracker, solar particle events, wellbeing check-in |
| [18-DATA_MODEL.md](18-DATA_MODEL.md) | Every shared data shape and storage key (the v2 contract) |
| [06-ARCHITECTURE.md](06-ARCHITECTURE.md) | Modules, data flow, as-built vs target structure |
| [05-DEPENDENCIES.md](05-DEPENDENCIES.md) | Runtime, tooling, engine and team dependencies |
| [21-DEV_SETUP.md](21-DEV_SETUP.md) | Running, testing and debugging locally |

### Evidence and quality
| File | What it answers |
|---|---|
| [17-EVALUATION.md](17-EVALUATION.md) | The evaluation harness: detection delay, false alarms, misses, triage agreement |
| [09-TEST_PLAN.md](09-TEST_PLAN.md) | Unit, integration, manual and offline tests |
| [13-SOURCES.md](13-SOURCES.md) | Every external fact, its source and its verification status |

### Delivery
| File | What it answers |
|---|---|
| [08-TEAM_AND_PLAN.md](08-TEAM_AND_PLAN.md) | Owners, work breakdown, phases, git workflow |
| [10-DEMO_SCRIPT.md](10-DEMO_SCRIPT.md) | 60-second pitch, 3-minute demo, video storyboard, judge Q&A |
| [11-SUBMISSION.md](11-SUBMISSION.md) | Submission text, links, judging alignment, final checklist |

### Governance
| File | What it answers |
|---|---|
| [12-RISKS_AND_ASSUMPTIONS.md](12-RISKS_AND_ASSUMPTIONS.md) | Safety, ethics, privacy, honest limits, risks |
| [20-DECISIONS.md](20-DECISIONS.md) | Decision log: what we chose, and why |
| [GLOSSARY.md](GLOSSARY.md) | Terms and abbreviations |

---

## Ground rules for everyone

1. **All data is synthetic** and is labelled so in the UI. Nothing here is a medical device or a clinical predictor.
2. **Label every number.** A NASA figure carries its source ([13-SOURCES.md](13-SOURCES.md)). Anything we chose is labelled "team assumption" in code, UI and docs.
3. **Rules and statistics decide.** Alerts and triage are rule-based and testable. A learned model may advise beside the rule result, never instead of it.
4. **The emergency path never depends on the queue or the link.**
5. **When data is missing or uncertain, escalate.** Never stay silent.
6. **Offline always.** No CDN, no API calls, no network at runtime after the first load.
7. **One value per setting.** Thresholds live in one config object ([18-DATA_MODEL.md §7](18-DATA_MODEL.md#7-configuration)) and are referenced, never copied.

## Which document wins

| When these disagree | The winner |
|---|---|
| Docs vs code, about *what we are building* | These docs (v2 target) |
| Docs vs code, about *what works today* | The code, recorded in [00-STATUS.md](00-STATUS.md) |
| `CONTRACT.md` (repo root, v4.0) vs [18-DATA_MODEL.md](18-DATA_MODEL.md) | For code that exists today: `CONTRACT.md` Part A. For the v2 target: 18-DATA_MODEL.md (Part B of `CONTRACT.md` only summarises it). |
| Any doc vs [20-DECISIONS.md](20-DECISIONS.md) | 20-DECISIONS.md. Change a decision there first, then update the other docs. |

## Changing these docs

- Every change to a shared shape or threshold goes through [18-DATA_MODEL.md](18-DATA_MODEL.md) and a decision entry in [20-DECISIONS.md](20-DECISIONS.md).
- When code lands, update the status label in [00-STATUS.md](00-STATUS.md) in the same pull request.
- Keep wording plain. Prefer a table to a paragraph when listing things.
