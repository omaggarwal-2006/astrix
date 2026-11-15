# ASTRIX / LANDFALL · Physiological & Machine Learning Engine

> **Owner**: Tanishq (Physiological & Anomaly Detection Engine Lead)  
> **Directory**: `/engine/`  
> **Version**: 3.0.0-prod  
> **Runtime**: 100% Client-Side Native Browser ESM (Zero server dependency, PWA compliant)

---

## 1. Overview & Vision
In long-duration deep-space transit (180-day Earth→Mars), communication latency reaches up to 22+ minutes one way (44+ minutes round trip), rendering synchronous Earth-based telemedicine physically impossible. 

The `/engine/` subsystem provides an **autonomous onboard physiological forecasting and multivariate anomaly detection engine**. It continuously ingests real-time astronaut vitals, ambient cabin telemetry, and hematological biomarkers to:
1. Detect physiological anomalies before irreversible clinical deconditioning occurs.
2. Forecast landing-day functional readiness across 6 critical operational dimensions.
3. Power the 3D Anatomical Digital Twin with tissue integrity assessments.

---

## 2. Scientific Data Sources & NASA Calibration
The model parameters and baseline thresholds are calibrated against published NASA spaceflight life science datasets located in `/datasets/`:
* **NASA LSDS-7**: Complete Blood Count (CBC) longitudinal hematology across spaceflight mission phases (Pre-flight $L-92$, $L-44$, $L-3$; Post-flight $R+1$).
* **NASA LSDS-8**: Comprehensive Metabolic Panel (CMP) tracking serum electrolytes (calcium, potassium, sodium), kidney function (BUN, creatinine), and liver enzymes.
* **NASA LSDS-8 Multiplex Serum Panels**: Cardiovascular and immune EvePanel and AlamarPanel cytokine assays tracking latent viral reactivation and pro-inflammatory signaling.
* **NASA Human Research Program (HRP)**: Cancellous bone mineral density demineralization rate ($1.0\% - 1.5\%$/month) and postural muscle fiber atrophy ($10\% - 12\%$ unmitigated).

---

## 3. Public API Specification (`engine/api.js`)

### `predictReadings(day: number): Object`
Generates the multivariate daily reading snapshot for any mission day ($1 \le \text{day} \le 180$).
- Output conforms strictly to `CONTRACT.md` Part A data schemas.
- Models the Day 40–55 circadian collapse and cabin $CO_2$ elevation inflection sequence.

### `detectAnomalies(day: number, readings: Object): Array<Alert>`
Executes multi-stream anomaly detection across physiological and environmental vectors.
- Calculates dynamic z-scores ($z = \frac{x - \mu}{\sigma}$).
- Flags severity (1 = Mild drift, 2 = Moderate caution, 3 = Critical alarm).
- Identifies affected anatomical regions (e.g., `head_neuro`, `chest_cardio`).

### `predictLandingForecast(day: number, exerciseHours: number): Object`
Generates high, mid, and low probability bounds for the 6 landing dimensions at Day 180 as a function of daily countermeasure exercise adherence ($0 \le \text{exerciseHours} \le 1.5\text{ h/day}$).
- Enforces strict mathematical monotonicity: increasing exercise adherence never decreases forecasted retention.

---

## 4. Anti-Corruption Adapter Integration
To guarantee that core domain triage logic and UI rendering remain fully decoupled from ML implementation details, the engine connects exclusively through `src/core/adapter.js`. If the engine is disabled or throws an unexpected error, `adapter.js` automatically degrades gracefully to the synthetic parametric models.
