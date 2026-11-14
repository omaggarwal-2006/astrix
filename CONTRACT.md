# LANDFALL Team Interface Contract (v3.0)
**NASA Space Apps Challenge 2026** &bull; *Challenge: Health Monitoring Software*  
*Team: Om (UI) &bull; Tanishk (Physiological Engine) &bull; Teammate 3 (Pipeline, Queue & Sources)*

This document specifies the exact shared shapes and modules wired in the LANDFALL repository.

---

## 1. Module Locations & Responsibilities

- **Teammate 3 (Active in Root):**
  - `./pipeline.js`: Orchestrates triage and packet dispatch.
  - `./triage.js`: Core scoring rule engine.
  - `./packet.js`: FNV-1a checksum telemetry packet builder.
  - `./queue.js`: DTN store-and-forward queue with simulated propagation latency.
  - `./sources.js`: Official `SOURCES`, `NUMBERS`, `LINK_PRESETS`, `ASSUMPTIONS`, and `DISCLAIMER`.
  - `./sample_alert.js`: Reference alert fixture (`A-001`).

- **Om (UI & Adapter Layer):**
  - `index.html`: 5 restructured tabs (Overview, Monitor, Forecast, Triage & Comms, Sources).
  - `css/style.css`: Bolted putty panel chassis, projector-ready font sizing, responsive layout.
  - `adapter.js`: Single integration layer feeding sample data and engine calculations to the UI.
  - `sample/sample_data.js`: Interim sample dataset adhering strictly to agreed team shapes.
  - `sw.js`: Service worker for 100% offline flight operation after first load.
  - `main.js`: Main ES module controller.

- **Tanishk (Physiological Engine - In Development):**
  - Will deliver production `getAlerts(day)`, `getForecast(day, exerciseHours)`, and `getReadings(day)` to replace `sample/sample_data.js` via `adapter.js`.

---

## 2. Agreed Data Shapes

### A. Health Alert Shape (`Alert`)
```typescript
interface Alert {
  id: string;               // e.g. "A-001"
  metric: string;           // "sleep_h" | "cabin_co2" | "mood" | "exercise_min" | "hr_bpm"
  baseline: number;         // Astronaut's pre-flight personal baseline (e.g. 7.4)
  current: number;          // Active measured value (e.g. 4.2)
  z: number;                // Standard deviations from personal baseline (e.g. -2.8)
  persisted_days: number;   // Days condition has persisted (e.g. 9)
  worsening: boolean;       // Trend trajectory
  severity: number;         // 1 = Low/Mild, 2 = Medium/Caution, 3 = High/Critical
  reason: string;           // Human-readable clinical rationale
}
```

### B. Landing-Day Forecast Shape (`Forecast`)
```typescript
interface ForecastDimension {
  dimension: string;        // "Bone mineral density" | "Aerobic & muscle power" | etc.
  landing: {
    low: number;            // Lower estimate (illustrative)
    mid: number;            // Projected landing-day retention %
    high: number;           // Upper estimate (illustrative)
  };
  status: "nominal" | "caution" | "alarm";
  confidence: string;       // e.g. "High (NASA HRP published rate 1.0-1.5%/mo)"
  citationUrl: string;      // Direct link to official NASA reference page
  assumptions: string[];    // Explicit modelling assumptions
}
```

> [!IMPORTANT]
> **Source Verification Status for Tanishk:**
> - **Bone Loss Rate:** $1.0\text{--}1.5\%$ per month on 4–6 month missions &rarr; **verify on source page** ([NASA Bone Changes](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/)).
> - **Aerobic & Muscle Strength Loss:** $10\text{--}12\%$ average loss &rarr; **verify on source page** ([NASA Reduced Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/)).

### C. Pipeline & Triage Interfaces
- `handleAlert(alert, ctx, env)` returns `{ decision, packet }`:
  - `decision`: `{ path: "SELF_CARE" | "CREW_MEDICAL_OFFICER" | "FLIGHT_SURGEON", delivery: "NONE" | "LIVE_CALL" | "SEND_PACKET" | "QUEUE_OFFLINE", score: number, emergency: boolean, why: string }`
  - `packet`: Built when `delivery` is `"SEND_PACKET"` or `"QUEUE_OFFLINE"`.
- `queue.getQueue()` returns array of `{ packet, attempts, ground_reply }`:
  - `packet.status`: `"QUEUED"` | `"TRANSMITTED"` | `"ACKNOWLEDGED"` | `"FAILED"`

---

## 3. UI Features & Control Contract (Om)
The frontend implements the "View From The Ship" mission architecture with verified interactive controls:
1. **Tabs & Hash Routing:** `#overview`, `#monitor`, `#forecast`, `#triage`, `#sources` (browser back/forward functional, with default fallback to `#overview`).
2. **Day Scrubber:** Day 1 to 180 transit slider (drag, click, keyboard arrow navigation) with milestones.
3. **Mission Scene & 4-Level Kinematic Visual Engine:**
   - **Level 0 (Environment approach):** Canvas 3D starfield with 4 environments (`MARS`, `ISS`, `MOON`, `EVA_SUIT`), replay entry zoom, and mechanical EVA suit shell split reveal.
   - **Level 1 (Full-body digital twin):** 11 anatomical regions in precision SVG (`viewBox="0 0 420 760"`), beating heart x-ray underlay timed to live resting HR, Front/Back rotation toggle, and dual-track baseline comparison bars.
   - **Level 2 (Region focus & exploded tissue cards):** Exploded 4-layer cards (`BONE`, `MUSCLE`, `SKIN`, `VASCULAR_NERVE`) with spaceflight mechanisms and deep-scan triggers.
   - **Level 3 (Tissue micro-lab):** Split-view before/after comparison canvas with divider beam, tissue-specific live recalibration controls (ARED load, cycle intensity), +15 XP rewards, discovery badge, and astronaut self-assessment procedure with escalation guidance.
   - **Hierarchical Breadcrumbs:** Navigational breadcrumb trail (`Ares-VI Transit` > `Full-Body Twin` > `[Region]` > `[Layer]`) and keyboard `Escape` zoom out.
4. **Sober Gamification XP Engine (`js/twin-model.js`):**
   - 0–1000 XP point score (60% 6 landing dimensions, 25% countermeasure adherence, 15% completed scans).
   - Tiers I / II / III with geometric status indicators.
   - Fictional profile: `Cmdr. A. Vance (fictional synthetic profile)`.
5. **Automated 30-Second Demo:** Play, Pause, and Stop (restores day to pre-demo state).
6. **Daily Biomarker Logging:** Validated ranges with inline error reporting, saved to `localStorage`.
7. **Cross-Tab Routing:** Go/No-Go rows jump directly to Forecast cones; active alerts route directly to Triage.
8. **What-If Forecast Engine:** 3 scenario buttons (`Adherent 1.5 h/d`, `Nominal 1.2 h/d`, `Zero exercise 0.0 h/d`) and adherence slider reshaping flight cones live.
9. **Countermeasure Checklist:** Dynamic checklist state saved to `localStorage`.
10. **Comms & Telemetry Dispatch:** `setLink({ available: true, delay_s, label })` latency selector, `handleAlert()` packet generation, `enqueue()` DTN queue, Copy packet button, Retry failed packet button, and Emergency link bypass modal.
11. **Scientific Citations & Honesty:** Official NASA human research links with `target="_blank" rel="noopener noreferrer"`. Honesty statement: *"Illustrative model, not a clinical predictor. Synthetic data."* on every tab.
12. **Demo State Reset:** Confirmation dialog clearing local cache and restoring Day 40 baseline.
13. **Offline Operation:** Service worker (`sw.js`) caching all local assets and bundled fonts without remote CDN dependencies.

---

## 4. What Parts Are Currently Sample vs Real
- **Teammate Modules (Real & Wired):** `pipeline.js`, `queue.js`, `packet.js`, `triage.js`, and `sources.js` are live in root and executed by the UI.
- **Engine Data (Interim Sample):** 180-day longitudinal readings, alert generation, and forecast dimension calculations are served via `adapter.js` from `sample/sample_data.js`.
- **Handoff:** When Tanishk delivers the final engine, only `adapter.js` will be updated to point to his module. Zero UI changes required.
