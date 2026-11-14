/**
 * LANDFALL - Sample Dataset (src/data/sample-data.js)
 * Adheres strictly to the agreed team shapes:
 * Alert: { id, metric, baseline, current, z, persisted_days, worsening, severity, reason }
 * Forecast: { dimension, landing: { low, mid, high }, status, confidence, assumptions[] }
 */

import { sampleAlert } from "./sample-alert.js";

// Baseline readings for the astronaut
export const BASELINE_READINGS = {
  sleep_h: 7.4,
  hr_bpm: 64,
  bp_sys: 116,
  bp_dia: 76,
  temp_c: 36.6,
  mood: 4.2,
  exercise_min: 90,
  vo2_max: 44.5
};

// 180-Day longitudinal readings generator
export function generateDayReadings(day) {
  let sleep = +(7.4 + Math.sin(day * 0.2) * 0.3).toFixed(1);
  let hr = Math.round(64 + Math.sin(day * 0.25) * 3);
  let sys = Math.round(116 + Math.sin(day * 0.1) * 4);
  let dia = Math.round(76 + Math.cos(day * 0.1) * 3);
  let temp = +(36.6 + Math.sin(day * 0.3) * 0.1).toFixed(1);
  let mood = +(4.2 + Math.cos(day * 0.1) * 0.3).toFixed(1);
  let exercise = 90;
  let co2 = 2800; // ppm nominal
  let noise = 58;
  let cabinTemp = 21.5;

  let symptoms = [];
  let immune = {
    rash: false,
    coldSore: false,
    fever: false,
    fatigue: false,
    stressScore: 2.1
  };

  // Day 40 Sleep Collapse Sequence
  if (day >= 40 && day <= 55) {
    const progress = Math.max(0, 1 - (day - 40) / 15);
    sleep = +(4.2 + (1 - progress) * 2.8).toFixed(1);
    hr = Math.round(74 - (1 - progress) * 8);
    sys = Math.round(126 - (1 - progress) * 8);
    dia = Math.round(83 - (1 - progress) * 6);
    exercise = Math.round(45 + (1 - progress) * 45);
    co2 = 5200; // Hypercapnia risk spike
    symptoms = ["headache", "eye_strain"];
    immune.coldSore = day <= 48; // Spaceflight stress awakens dormant viruses
    immune.fatigue = true;
    immune.stressScore = +(3.9 - (1 - progress) * 1.5).toFixed(1);

    if (day >= 43) {
      mood = +(2.8 + (1 - progress) * 1.2).toFixed(1);
    }
  }

  // Cumulative radiation calculation
  const cumulativeRad = +(1.48 * day).toFixed(1);

  return {
    day,
    vitals: {
      sleep_h: sleep,
      hr_bpm: hr,
      bp_sys: sys,
      bp_dia: dia,
      temp_c: temp,
      mood: mood,
      exercise_min: exercise
    },
    symptoms,
    cabin: {
      co2,
      temp: cabinTemp,
      noise
    },
    immune,
    radiation: {
      dailyDose: 1.48,
      cumulativeDose: cumulativeRad
    }
  };
}

// Generates alerts for a specific day
export function generateAlertsForDay(day) {
  const alerts = [];

  if (day >= 40 && day <= 55) {
    const daysPersisted = day - 39;
    // Main sleep collapse alert matching sampleAlert shape
    alerts.push({
      id: "A-001",
      metric: "sleep_h",
      baseline: BASELINE_READINGS.sleep_h,
      current: +(4.2 + Math.min(2.0, (day - 40) * 0.15)).toFixed(1),
      z: -2.8,
      persisted_days: daysPersisted,
      worsening: daysPersisted <= 5,
      severity: daysPersisted >= 4 ? 3 : 2, // 2 = Caution, 3 = Alarm
      reason: `Sleep duration collapsed below 5.0h threshold (${daysPersisted} days, ${daysPersisted <= 5 ? "worsening" : "plateau"})`
    });

    // Cabin CO2 & Headache Alert
    alerts.push({
      id: "A-002",
      metric: "cabin_co2",
      baseline: 2800,
      current: 5200,
      z: 2.6,
      persisted_days: daysPersisted,
      worsening: false,
      severity: 2,
      reason: "Cabin CO2 at 5200 ppm (> 4500 ppm ceiling). Headache reported: check the scrubber first."
    });

    if (day >= 43) {
      alerts.push({
        id: "A-003",
        metric: "mood",
        baseline: BASELINE_READINGS.mood,
        current: 2.8,
        z: -2.1,
        persisted_days: day - 42,
        worsening: day <= 46,
        severity: 2,
        reason: "Behavioral health score 2.8 / 5.0 secondary to chronic circadian disruption."
      });
    }

    if (day >= 41 && day <= 48) {
      alerts.push({
        id: "A-004",
        metric: "immune_cold_sore",
        baseline: 0,
        current: 1,
        z: 1.8,
        persisted_days: day - 40,
        worsening: false,
        severity: 1,
        reason: "Subclinical immune dysregulation: dormant HSV-1 viral reactivation (cold sore)."
      });
    }
  } else if (day >= 70 && day <= 74) {
    alerts.push({
      id: "A-005",
      metric: "exercise_min",
      baseline: 90,
      current: 50,
      z: -1.5,
      persisted_days: day - 69,
      worsening: false,
      severity: 1,
      reason: "Exercise adherence dipped below 60 minutes for 3 consecutive days."
    });
  }

  return alerts;
}

// 6-Dimension Forecast generator using exact NASA loss rates
export function generateForecastForDay(day, exerciseHours = 1.2) {
  const adherence = Math.max(0, Math.min(1.0, exerciseHours / 1.5));
  const isPostDay40 = day >= 40;
  const deficitPenalty = isPostDay40 ? Math.max(0, 1 - (day - 40) / 25) : 0;

  // 1. Bone Density (NASA HRP: 1.0 - 1.5% loss per month)
  // Protected with full resistive load
  const boneBaseRetention = 100 - (7.5 * (1 - adherence * 0.70));
  const boneMid = +(boneBaseRetention).toFixed(1);
  const boneLow = +(boneMid - 1.8).toFixed(1);
  const boneHigh = +(boneMid + 1.4).toFixed(1);
  const boneStatus = boneMid >= 93 ? "nominal" : (boneMid >= 88 ? "caution" : "alarm");

  // 2. Aerobic & Muscle Power (NASA HRP: 10 - 12% average loss)
  const aerobicBase = 100 - (11.5 * (1 - adherence * 0.85));
  const aerobicMid = +(aerobicBase).toFixed(1);
  const aerobicLow = +(aerobicMid - 2.0).toFixed(1);
  const aerobicHigh = +(aerobicMid + 1.8).toFixed(1);
  const aerobicStatus = aerobicMid >= 92 ? "nominal" : (aerobicMid >= 85 ? "caution" : "alarm");

  // 3. Cardiovascular Regulation (NASA Risk of Cardiovascular Adaptations)
  const cardioBase = 96.0 - (1 - adherence) * 8.0 - (deficitPenalty * 3.0);
  const cardioMid = +(cardioBase).toFixed(1);
  const cardioLow = +(cardioMid - 1.9).toFixed(1);
  const cardioHigh = +(cardioMid + 1.5).toFixed(1);
  const cardioStatus = cardioMid >= 91 ? "nominal" : "caution";

  // 4. Neurovestibular Balance (NASA Risk of Altered Sensorimotor Function)
  const balanceBase = 88.0 - (day * 0.03) + (adherence * 2.5);
  const balanceMid = +(balanceBase).toFixed(1);
  const balanceLow = +(balanceMid - 2.8).toFixed(1);
  const balanceHigh = +(balanceMid + 2.2).toFixed(1);
  const balanceStatus = balanceMid >= 84 ? "caution" : "alarm";

  // 5. Circadian Sleep Continuity (NASA Risk of Inadequate Sleep)
  let sleepBase = 94.0;
  if (isPostDay40) {
    sleepBase = 72.0 + (adherence * 12.0) + (1 - deficitPenalty) * 8.0;
  }
  const sleepMid = +(sleepBase).toFixed(1);
  const sleepLow = +(sleepMid - 3.5).toFixed(1);
  const sleepHigh = +(sleepMid + 3.0).toFixed(1);
  const sleepStatus = sleepMid >= 86 ? "nominal" : (sleepMid >= 75 ? "caution" : "alarm");

  // 6. Cognitive & Mood Resilience (NASA Risk of Behavioral Conditions)
  let moodBase = 92.0;
  if (isPostDay40) {
    moodBase = 75.0 + (adherence * 10.0) + (1 - deficitPenalty) * 6.0;
  }
  const moodMid = +(moodBase).toFixed(1);
  const moodLow = +(moodMid - 3.0).toFixed(1);
  const moodHigh = +(moodMid + 2.5).toFixed(1);
  const moodStatus = moodMid >= 85 ? "nominal" : (moodMid >= 74 ? "caution" : "alarm");

  return [
    {
      dimension: "Bone mineral density",
      landing: { low: boneLow, mid: boneMid, high: boneHigh },
      status: boneStatus,
      confidence: "High (NASA HRP published rate 1.0-1.5%/mo)",
      citationUrl: "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/",
      assumptions: ["Assumes ARED resistive exercise load mitigates ~70% of cancellous bone resorption."]
    },
    {
      dimension: "Aerobic & muscle power",
      landing: { low: aerobicLow, mid: aerobicMid, high: aerobicHigh },
      status: aerobicStatus,
      confidence: "High (NASA HRP published rate 10-12% loss)",
      citationUrl: "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
      assumptions: ["Assumes 1.5 h/day exercise represents 100% countermeasure adherence."]
    },
    {
      dimension: "Cardiovascular regulation",
      landing: { low: cardioLow, mid: cardioMid, high: cardioHigh },
      status: cardioStatus,
      confidence: "Moderate",
      citationUrl: "https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/",
      assumptions: ["Landing-day orthostatic intolerance mitigated by fluid loading and g-suit."]
    },
    {
      dimension: "Neurovestibular balance",
      landing: { low: balanceLow, mid: balanceMid, high: balanceHigh },
      status: balanceStatus,
      confidence: "Moderate",
      citationUrl: "https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/",
      assumptions: ["Post-landing 0.38g otolith recalibration curve extrapolated from lunar returns."]
    },
    {
      dimension: "Circadian sleep debt",
      landing: { low: sleepLow, mid: sleepMid, high: sleepHigh },
      status: sleepStatus,
      confidence: "High (Day-40 circadian collapse inflection)",
      citationUrl: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
      assumptions: ["Restoration requires 480nm circadian lighting phase-shift + workload cap."]
    },
    {
      dimension: "Cognitive vigilance",
      landing: { low: moodLow, mid: moodMid, high: moodHigh },
      status: moodStatus,
      confidence: "Moderate",
      citationUrl: "https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/",
      assumptions: ["Correlated with cumulative sleep debt and autonomous workload stress."]
    }
  ];
}
