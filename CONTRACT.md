# LANDFALL Engine Contract Specification (v2.0)
**NASA Space Apps Challenge 2026** &bull; *Challenge: Health Monitoring Software*  
*Team Agreement: UI (Om) &bull; Engine (Tanishk) &bull; Triage & Packets (Teammate 3)*

This contract establishes the exact file locations, function signatures, and return shapes expected by the LANDFALL UI. Placeholders in `/placeholders/` implement this specification. When production modules are delivered, place them in `/engine/` and `/triage/` without altering UI code.

---

## 1. Directory Structure & Team Ownership

- **Om (UI):** `index.html`, `css/style.css`, and `js/*.js`
- **Tanishk (Physiological Engine):** `/engine/data.js`, `/engine/forecast.js`, `/engine/whatif.js`
- **Teammate 3 (Triage, Telemetry & Packets):** `/triage/triage.js`, `/triage/packet.js`, `/triage/queue.js`
- **Contract Placeholders:** `/placeholders/data.js`, `/placeholders/forecast.js`, `/placeholders/triage.js`, `/placeholders/packet.js`

---

## 2. Physiological Engine Module (`/engine/data.js`)
**Author:** Tanishk

### `DataEngine.getBaseline()`
Returns the astronaut's calibrated personal baseline (measured pre-flight & LEO checkout).
```json
{
  "heartRate": 64,             // bpm resting
  "bloodPressure": {
    "systolic": 116,           // mmHg
    "diastolic": 76            // mmHg
  },
  "temperature": 36.6,         // Celsius
  "sleepHours": 7.4,           // hours
  "mood": 4.2,                 // scale 1-5 (1=critical low, 5=peak resilience)
  "exerciseMinutes": 90,       // target 90 mins/day (1.5 hrs standard)
  "boneMineralDensity": 100,   // % of pre-flight standard
  "aerobicCapacityVO2": 44.5   // mL/kg/min
}
```

### `DataEngine.getDay(dayNumber)`
Returns full telemetry for transit day `dayNumber` (1 to 180). Must include the Day-40 sleep collapse sequence.
```json
{
  "day": 40,
  "vitals": {
    "heartRate": 74,
    "bloodPressure": { "systolic": 126, "diastolic": 83 },
    "temperature": 36.8,
    "sleepHours": 4.2,         // Day-40 acute collapse
    "mood": 2.8,
    "exerciseMinutes": 45
  },
  "symptoms": ["headache", "eye_strain"],
  "cabin": {
    "co2": 5200,               // ppm (nominal < 3000, ceiling 4500, spike 5200)
    "temperature": 21.8,       // Celsius
    "noise": 63                // dBA
  },
  "immune": {
    "rash": false,
    "coldSore": true,          // Spaceflight stress awakens dormant viruses (NASA HRP)
    "fever": false,
    "fatigue": true,
    "stressScore": 3.9         // scale 1-5
  },
  "radiation": {
    "dailyDose": 1.48,         // mSv/day (GCR + solar quiet)
    "cumulativeDose": 59.2     // mSv accumulated (Tracked, not forecast)
  },
  "bodyMapDrift": {
    "head": "alarm",           // "nominal" | "caution" | "alarm"
    "chest": "nominal",
    "torso": "nominal",
    "arms": "nominal",
    "legs": "caution"
  }
}
```

### `DataEngine.getHistory(metricName)`
Returns 180-day array for multi-line longitudinal charts (`"sleep"`, `"mood"`, `"heartRate"`).
```typescript
Array<{
  day: number,
  value: number,
  baseline: number,
  status: "nominal" | "caution" | "alarm"
}>
```

---

## 3. Forecast & What-If Module (`/engine/forecast.js`)
**Author:** Tanishk

### `ForecastEngine.calculateLandingReadiness(currentDay, exerciseHoursAdherence)`
Computes landing-day projections.

> [!IMPORTANT]
> **Source Verification Requirement for Tanishk:**
> - **Bone Mineral Density Loss:** $1.0\text{--}1.5\%$ loss per month on 4–6 month missions &rarr; **verify on source page** ([NASA Risk of Bone Changes](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/)).
> - **Aerobic & Muscle Strength Loss:** $10\text{--}12\%$ average loss &rarr; **verify on source page** ([NASA Risk of Reduced Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/)).
> - Full adherence setting: $1.5\text{ hours/day}$ exercise protocol.

**Return Shape:**
```json
{
  "overallReadinessScore": 76,
  "overallStatus": "caution",  // "nominal" | "caution" | "alarm"
  "daysToLanding": 140,
  "adherenceHours": 1.2,
  "metrics": {
    "boneDensity": {
      "title": "Bone Mineral Density",
      "projectedRetention": 93.2,
      "low": 91.5,
      "high": 94.8,
      "status": "caution",
      "citation": "NASA HRP (1.0-1.5% loss/month - verify on source page)"
    },
    "aerobicAndMuscle": {
      "title": "Aerobic Power & Muscle Strength",
      "projectedRetention": 88.4,
      "low": 85.0,
      "high": 91.2,
      "status": "caution",
      "citation": "NASA HRP (10-12% loss - verify on source page)"
    },
    "cardiovascular": { "projectedRetention": 94.0, "status": "nominal" },
    "neurovestibularBalance": { "projectedRetention": 84.1, "status": "caution" },
    "sleepDebt": { "projectedRetention": 68.0, "status": "alarm" },
    "cognitiveMood": { "projectedRetention": 76.5, "status": "caution" }
  },
  "recommendedCountermeasures": [
    {
      "id": "ARED_RESISTANCE",
      "name": "Advanced Resistive Exercise Device (ARED) protocol",
      "active": true
    }
  ]
}
```

---

## 4. Triage Module (`/triage/triage.js`)
**Author:** Teammate 3

### `TriageEngine.evaluate(dayNumber, telemetry, commDelaySeconds)`
Evaluates symptoms, baseline drift, and comm latency.

> [!CAUTION]
> **Clinical & Source Rules for Teammate 3:**
> 1. **SANS Vision Screening:** If optic blur or vision symptoms are present, the tool output wording MUST strictly be: *"Report to the flight surgeon."* It must NEVER state an autonomous clinical diagnosis.
> 2. **Communication Delay Figures:** NASA's public HRP pages do not cite official transit delay curves. All delay figures (ISS $\sim 2\text{s}$, Moon $\sim 3\text{s}$, Mars transit $2\text{--}14\text{m}$) MUST carry the label **"source pending"** in `js/sources.js` until Teammate 3 adds an exact citation. Never present uncited figures as clinical fact.
> 3. **Scrubber First Rule:** If headache is reported and cabin CO2 is $\ge 4500\text{ ppm}$, trigger: `"Headache plus high CO2: check the scrubber first."`

**Return Shape:**
```json
{
  "triageLevel": "CREW_MEDICAL_OFFICER", // "SELF_TREAT" | "CREW_MEDICAL_OFFICER" | "FLIGHT_SURGEON"
  "urgency": "ELEVATED",                // "ROUTINE" | "ELEVATED" | "CRITICAL_EMERGENCY"
  "directGroundLinkRequired": false,    // true on acute life-threat red flag
  "rationale": "High sleep debt (4.2h) and CO2 elevation (5200 ppm) with 02m 08s one-way delay. Self-sufficiency principle applies: Crew Medical Officer executes onboard protocol.",
  "flags": [
    { "id": "HEADACHE_CO2_SCRUBBER", "severity": "caution", "message": "Headache plus high CO2: check the scrubber first." },
    { "id": "SLEEP_COLLAPSE", "severity": "alarm", "message": "Sleep collapsed to 4.2h vs 7.4h baseline." }
  ],
  "proposedAction": "Inspect Amine Bed scrubber. Enforce circadian dark period. Transmit telemetry packet.",
  "commDelaySeconds": 128
}
```

---

## 5. Packet Module (`/triage/packet.js`)
**Author:** Teammate 3

### `PacketEngine.buildPacket(dayNumber, telemetry, triageResult)`
Generates compact store-and-forward telemetry payload for deep space transmission.
```json
{
  "packetId": "ARES6-MED-D040-0842",
  "timestamp": "2026-11-14 07:34 UTC",
  "transitDay": 40,
  "oneWayDelaySeconds": 128,
  "dataSummary": "HR: 74 bpm | BP: 126/83 | Sleep: 4.2h | Mood: 2.8/5 | CO2: 5200 ppm",
  "trendAnalysis": "Acute sleep collapse (-43% drift). CO2 hypercapnia suspected.",
  "triageDecision": "CREW_MEDICAL_OFFICER",
  "proposedAction": "Autonomous CO2 scrubber inspection and sleep hygiene protocol.",
  "status": "QUEUED" // "QUEUED" | "TRANSMITTING" | "ACKNOWLEDGED"
}
```
