# Glossary

| Term | Meaning |
|---|---|
| **ACK / acknowledgement** | Confirmation that Earth received a bundle. In LANDFALL it's stored as a custody-style receipt |
| **Adherence** | How much of the 1.5 h/day exercise reference the astronaut does (0–1) |
| **ARED** | Advanced Resistive Exercise Device, the ISS weight-training machine |
| **Baseline** | The astronaut's own mean and spread for a metric, from days 1–14 |
| **BPSec** | Bundle Protocol Security; how real DTN bundles are signed and encrypted |
| **Bundle** | A self-contained report with ID, lifetime, priority class and checksum (from DTN). v1 called it a packet |
| **CMO** | Crew medical officer: the crew member trained to handle medical cases on board |
| **Confidence** | How sure an alert or decision is: high, medium or low, from data completeness and detector agreement |
| **Contact window** | A period when the link to Earth is available |
| **CUSUM** | Cumulative sum: a change-detection method that adds up small deviations until they pass a limit |
| **Custody transfer** | A DTN idea: a node takes responsibility for a bundle and confirms it |
| **DayReading** | One day of input data for one astronaut ([18 §2](18-DATA_MODEL.md#2-dayreading)) |
| **DayResult** | The output of one run of the decision loop for a day ([18 §6](18-DATA_MODEL.md#6-dayresult)) |
| **Delay (one-way)** | Time for a radio signal to travel between the ship and Earth once. A reply takes twice as long |
| **DTN** | Delay- or disruption-tolerant networking: store-and-forward networking for links that are slow or often down |
| **EIMO** | Earth-independent medical operations: medical care that doesn't rely on real-time help from Earth |
| **EVA** | Extravehicular activity (a spacewalk) |
| **EWMA** | Exponentially weighted moving average: a smoothed trend that reacts to slow drifts |
| **ExMC** | NASA's Exploration Medical Capability element |
| **Expedited / Normal / Bulk** | Bundle priority classes, highest to lowest |
| **FNV-1a** | A fast, simple hash used here as a checksum. Not cryptographic |
| **Fused alert** | One alert raised when several signals change on the same day |
| **GCR** | Galactic cosmic rays: the steady background radiation in deep space |
| **Go / Caution / No-go** | Landing-readiness labels per forecast dimension, against stated thresholds |
| **HRP** | NASA's Human Research Program |
| **Landing day** | Day 180 in the demo mission |
| **Lifetime** | How long a bundle stays valid before it expires |
| **Live-call limit** | The largest one-way delay at which a live conversation still counts (10 s, team assumption) |
| **mSv** | Millisievert, a unit of radiation dose |
| **NTRS** | NASA Technical Reports Server |
| **OSDR** | NASA Open Science Data Repository |
| **Persistence** | How many consecutive days a metric has been flagged |
| **SANS** | Spaceflight-associated neuro-ocular syndrome: eye and vision changes in long spaceflight |
| **SBP** | Systolic blood pressure |
| **SD** | Standard deviation |
| **SPE** | Solar particle event: a burst of high-energy particles from the Sun; crews shelter in shielded areas |
| **Synodic cycle** | The roughly 26-month Earth–Mars cycle that sets how far apart they are |
| **Team assumption** | A value we chose, not taken from NASA or a study; always labelled |
| **Triage** | Deciding who should act and how urgently |
| **Worsening** | The metric is moving further from baseline over the last few days |
| **z-score** | How many standard deviations a value is from the baseline mean |
