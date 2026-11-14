# 13 · Sources and Verification Status (v2)

**How to use this file.** Each source has an ID used across the docs and the UI. Before submission, a team member opens every link, checks the exact claim, and sets the status. A claim with no verified source is removed or relabelled "team assumption".

| Status | Meaning |
|---|---|
| **Cited** | The URL is in the code or docs; nobody has re-read it for this claim yet |
| **Verified** | Opened, the claim matches, date and reader recorded |
| **To find** | We need a source and don't have the exact one yet |
| **Remove** | Couldn't verify; drop the claim |

## NASA and agency sources

| ID | Source | URL | Supports | Status |
|---|---|---|---|---|
| S-01 | NASA HRP: 5 Hazards of Human Spaceflight | <https://www.nasa.gov/hrp/hazards/> | Five hazards; hazards interact; self-sufficiency far from Earth | Cited (`sources.js`) |
| S-02 | NASA HRP: Risks of Human Spaceflight | <https://www.nasa.gov/hrp/risks/> | Risk list incl. bone, fitness, sleep, behavioural, immune, SANS | Cited (`sources.js`) |
| S-03 | NASA: Risk of Spaceflight-Induced Bone Changes | <https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/> | 1–1.5 % bone density loss per month on 4–6 month missions | Cited (`sources.js`, forecast) |
| S-04 | NASA: Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness | <https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/> | 10–12 % average loss; 12–38 % of crew lose > 20 %; about 1.5 h/day exercise | Cited (`sources.js`, forecast) |
| S-05 | CSA: Monitoring Radiation for Astronaut Health | <https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp> | Neutrons about 30 % of ISS radiation | Cited (`sources.js`) |
| S-06 | NASA NTRS 20250000703: Assessment of the State of Communication Delay Research (Beyond LEO) | <https://ntrs.nasa.gov/citations/20250000703> | Lunar one-way latency 3–14 s; Mars up to 44 min round trip | Cited (`sources.js`); v1 noted "seen as snippet only" |
| S-07 | NASA NTRS: Communication Delays, Disruptions and Blackouts for Crewed Mars Missions (ASCEND) | [PDF](https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf) | Delay = distance / c over the synodic cycle; blackouts | Cited (`sources.js`) |
| S-08 | NASA: Risk of Cardiovascular Adaptations | <https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/> | Cardiovascular context | Cited (forecast data) |
| S-09 | NASA: Risk of Altered Sensorimotor and Vestibular Function | <https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/> | Balance dimension | Cited (forecast data) |
| S-10 | NASA: Risk from Inadequate Sleep and Irregular Schedules | <https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/> | Sleep dimension; sleep regularity | Cited (forecast data) |
| S-11 | NASA: Risk of Behavioral Conditions and Psychiatric Disorders | <https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/> | Mood dimension; isolation | Cited (forecast data) |
| S-12 | Mars Science Laboratory RAD cruise measurements (Zeitlin et al., *Science*, 2013) | To find | About 1.8 mSv/day during Mars cruise | To find |
| S-13 | NASA-STD-3001 Volume 1 (crew health standard), radiation exposure limit | To find | 600 mSv career effective-dose limit | To find |
| S-14 | Solar particle event dose ranges in deep space | To find | SPE dose added in the demo | To find |
| S-21 | NASA Space Apps 2026 challenge page and Resources tab | To add | Challenge text | Cited (v1 docs) |
| S-22 | NASA: Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS) | To find | Vision-change rule T3 | To find |
| S-23 | NASA ISS cabin CO2 limits and symptoms | To find | CO2 4,500 / 5,000 ppm thresholds | To find |

## Calibration sources (for the generator)

| ID | Source | Use | Status |
|---|---|---|---|
| S-16 | NASA Open Science Data Repository (OSDR) | Sleep, HR and other in-flight distributions | To find |
| S-17 | Mars-500 isolation study (520 days, 2010–2011) | Sleep timing, mood, stress under isolation | To find |
| S-18 | HI-SEAS analog missions | Mood, social contact, stress | To find |
| S-19 | Head-down bed-rest studies | HR, BP, deconditioning rates | To find |

## DTN sources (bundle design)

| ID | Source | Use | Status |
|---|---|---|---|
| S-24 | RFC 5050: Bundle Protocol (v6) | Custody transfer and class-of-service ideas (bulk, normal, expedited) | To verify |
| S-25 | RFC 9171: Bundle Protocol Version 7 | Bundle lifetime, status reports | To verify |
| S-26 | The team's own DTN research | Queue design | Add citation |

## Related work

| ID | Work | Status |
|---|---|---|
| R-01 | NASA Exploration Medical Capability (ExMC) clinical decision support | To find |
| R-02 | Earth-Independent Medical Operations (EIMO) concept of operations | To find |
| R-03 | Digital-twin health frameworks for spaceflight | To find |
| R-04 | ANU Mars-fitness model | To find |
| R-05 | MediSat or DTN medical messaging | To find |
| R-06 | Earlier Space Apps health-monitoring entries | To find |

## Other facts

| ID | Fact | Status |
|---|---|---|
| S-20 | Space Apps winner and team counts (2024, 2025) | Re-check before quoting |
| — | Moon one-way light time about 1.3 s | Physics (384,400 km / c), no source needed |

## Our own items (labelled "team assumption" in the UI)

Every key in [18-DATA_MODEL.md §7](18-DATA_MODEL.md#7-configuration) marked "Assumption" or "Illustrative"; the synthetic dataset; the evaluation scenarios and fixed-threshold comparator.

## In-code source lists to keep in sync

| File | Holds |
|---|---|
| `src/core/sources.js` | `SOURCES`, `NUMBERS`, `LINK_PRESETS`, `ASSUMPTIONS`, `DISCLAIMER` |
| `src/data/sample-data.js` forecast `citationUrl` | S-03, S-04, S-08–S-11 |
| `engine/MODEL_CARD.md` (engine branch) | Its own citation table |

When a status here changes, update `src/core/sources.js` in the same PR, and remove the "(source pending)" note in `index.html` once S-06 is verified.

## Verification log

| Date | ID | Reader | Result |
|---|---|---|---|
