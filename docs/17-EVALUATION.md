# 17 · Evaluation: Calibrated Data and the Harness

Owner: Raghav (harness) · Tanishk (generator calibration) · Target files: `engine/ml/simulator.py` (crew export, decision D-16), `eval/scenarios.js`, `eval/run-eval.mjs` · Output: `eval/results.json`, `eval/results.md` · Requirements: E1–E5
As-built: nothing yet. The engine branch's `engine/ml/evaluate.py` compares **forecast** models (ML vs rules). That's useful, but it doesn't measure **alerting** or **triage**, which this harness does.

## 1. Why this matters

The biggest weakness of a synthetic-data prototype is trust. Two answers:

1. **Calibrated synthetic data**, so the numbers look like real crews, with sources.
2. **A measured evaluation** against a simple baseline, so "personal baseline is better" is a result, not a claim.

> **Rule:** numbers in the docs, deck and video come only from a recorded run. They are never written in advance. Every slide says they come from synthetic data.

## 2. Calibrated synthetic data (E1)

### 2.1 Generator

`generateCrew(seed, params) → DayReading[]` for 180 days. Seeded, deterministic, pure JavaScript (runs in the browser and in Node).

### 2.2 Calibration targets

Each parameter needs a source before it's used. Fill in the value only after reading the source.

| Parameter | Target | Candidate source | Status |
|---|---|---|---|
| Sleep duration in flight (mean, SD) | — | NASA sleep risk page (S-10); ISS sleep studies via NASA OSDR (S-16) | To find |
| Sleep timing variability | — | Mars-500 (S-17) | To find |
| Mood and stress under isolation | — | Mars-500, HI-SEAS (S-17, S-18) | To find |
| Resting HR and BP drift | — | Bed-rest studies (S-19), NASA cardiovascular risk page (S-08) | To find |
| Exercise adherence | Around 1.5 h/day target | S-04 | Partly sourced |
| Cabin CO2 range | — | NASA ISS environment documentation (S-23) | To find |
| Background dose rate | About 1.8 mSv/day | S-12 | To verify |
| Day-to-day noise per metric | — | Same sources as each metric | To find |

If the team gets permission to use real analog-mission data, use it to cross-check the generator, and say so. Don't mix real and synthetic data in the same chart without labels.

### 2.3 UI label

"Synthetic data, calibrated to published ranges (see Sources)." Until a parameter is sourced, its row on the Sources tab says "team assumption".

## 3. The harness (E2–E5)

### 3.1 Design

```
for seed in seeds (e.g. 200 crews):
    crew     = generateCrew(seed)
    events   = pick 0–3 anomalies from the scenario list, with random onset days (seeded)
    data     = inject(crew, events)
    for day in 1..180:
        lfOut   = runDay(data, day, env)            // LANDFALL: detect + forecast + triage
        fixOut  = fixedThreshold(data, day)         // comparator
        record(day, events, lfOut, fixOut)
compute metrics → eval/results.json, eval/results.md
```

### 3.2 Anomaly scenarios

| ID | Scenario | Shape | Ground-truth triage |
|---|---|---|---|
| A1 | Slow sleep slide | −0.15 h/day for 10 days | CMO after persistence |
| A2 | Acute sleep collapse | Drop to 4.5 h for 5 days | CMO |
| A3 | Mood and stress drift | Mood −0.1/day, stress +0.1/day for 14 days | CMO (fused) |
| A4 | HR creep | +1 bpm/day for 12 days | CMO |
| A5 | CO2 plus headache | 4,800 ppm and headache for 3 days | Scrubber hint, then CMO |
| A6 | Cardiac emergency | One day HR 130 | Emergency direct link |
| A7 | Vision change | `blurred_vision` reported | Flight surgeon |
| A8 | Solar particle event | Dose-rate jump for 6 hours | Shelter + EXPEDITED |
| A9 | Missing data | No sleep data for 3 days | Escalate one level |
| A10 | Exercise drop | 30 min/day for 21 days | Landing at risk → CMO |
| N0 | No anomaly | Normal noise only | Self-care |

Ground truth for routing assumes a delay > 10 s with onboard support, unless a scenario says otherwise. A second run with onboard support off checks the flight-surgeon path.

### 3.3 The comparator: fixed thresholds

A plain dashboard with population limits, no personal baseline, no persistence or fusion:

| Metric | Fixed alert (team assumption, stated in the report) |
|---|---|
| Sleep | < 6.0 h |
| Mood | < 3.0 |
| Resting HR | > 90 bpm |
| Systolic BP | > 140 mmHg |
| CO2 | > 5,000 ppm |
| Exercise | < 45 min/day |

The emergency, SANS and SPE rules are the same for both, because they're absolute safety rules.

### 3.4 Metrics (E3)

| Measure | Definition | Target to report |
|---|---|---|
| Detection delay | Days from injected onset to the first alert on the affected metric | Fewer days than the fixed threshold |
| False-alarm rate | Alerts per 100 crew-days outside any injected event window | Low, and stated |
| Missed events | Injected anomalies never flagged before the event ends | Zero for A6, A7, A8 |
| Triage agreement | Share of event-days routed as the ground-truth table says | Stated, with disagreements listed |

Also report, for honesty: detection delay and false alarms **per scenario**, the median and 90th percentile, and the number of crews.

### 3.5 Output (E5)

`eval/results.json`:

```json
{
  "run": { "date": "…", "commit": "…", "seeds": 200, "generator_version": "…", "config_hash": "…" },
  "summary": {
    "landfall":  { "detection_delay_days_median": null, "false_alarms_per_100_days": null, "missed": null, "triage_agreement": null },
    "fixed":     { "detection_delay_days_median": null, "false_alarms_per_100_days": null, "missed": null }
  },
  "by_scenario": [],
  "disagreements": []
}
```

`eval/results.md` is generated from the JSON and is the only place slide numbers come from. The Evaluation tab in the app reads the same JSON.

### 3.6 Running it

```bash
node eval/run-eval.mjs --seeds 200 --seed-start 1
```

Takes under a minute. CI isn't required, but run it before every demo recording and commit the result files.

## 4. The slide

One sentence, filled from `eval/results.md`:

> "On {N} synthetic crews, LANDFALL's personal baseline flagged drift a median of {X} days earlier than fixed limits, at {Y} false alarms per 100 crew-days, and missed no emergency events. Synthetic data, calibrated to published ranges."

If the result is worse than the fixed threshold on some metric, the slide says so. An honest mixed result is still the strongest evidence we can show.

## 5. Threats to validity (say these out loud)

| Threat | What we do |
|---|---|
| The harness tests our own generator | Calibrate to sources; vary parameters across seeds; report per scenario |
| Scenario shapes favour our detectors | Include N0 (no anomaly) and noisy versions of each scenario |
| Thresholds tuned on the same data | Freeze `config` before the final run; record its hash |
| Ground-truth routing is our own table | Report it as "agreement with our reference table", not "correctness" |
| ML forecast evaluated on its simulator | Already stated in the engine model card; keep that wording |
