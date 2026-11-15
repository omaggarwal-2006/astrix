/**
 * LANDFALL - Evaluation Scenarios & Synthetic Crew Generator (eval/scenarios.js)
 * Implements requirements E1 & E2 from docs/17-EVALUATION.md
 * Seeded, deterministic, pure JavaScript for Node and Browser.
 */

// Mulberry32 deterministic PRNG
export function createRNG(seed) {
  let s = Math.floor(seed) >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rng, mean = 0, stdev = 1) {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdev + mean;
}

/**
 * 11 Standard Evaluation Scenarios (A1–A10, N0) as defined in docs/17-EVALUATION.md
 */
export const SCENARIO_DEFS = [
  {
    id: 'A1',
    name: 'Slow sleep slide',
    duration: 10,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 10 && onset + i < days.length; i++) {
        days[onset + i].sleep_hours -= (i + 1) * 0.15;
      }
    }
  },
  {
    id: 'A2',
    name: 'Acute sleep collapse',
    duration: 5,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 5 && onset + i < days.length; i++) {
        days[onset + i].sleep_hours = 4.5;
      }
    }
  },
  {
    id: 'A3',
    name: 'Mood and stress drift',
    duration: 14,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 14 && onset + i < days.length; i++) {
        days[onset + i].mood = Math.max(1.0, days[onset + i].mood - (i + 1) * 0.1);
        days[onset + i].stress = Math.min(5.0, days[onset + i].stress + (i + 1) * 0.1);
      }
    }
  },
  {
    id: 'A4',
    name: 'HR creep',
    duration: 12,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 12 && onset + i < days.length; i++) {
        days[onset + i].heart_rate += (i + 1) * 1.0;
      }
    }
  },
  {
    id: 'A5',
    name: 'CO2 plus headache',
    duration: 3,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 3 && onset + i < days.length; i++) {
        days[onset + i].co2 = 4800;
        days[onset + i].symptoms.push('headache');
      }
    }
  },
  {
    id: 'A6',
    name: 'Cardiac emergency',
    duration: 1,
    groundTruthPath: 'FLIGHT_SURGEON',
    emergency: true,
    apply: (days, onset) => {
      days[onset].heart_rate = 132;
      days[onset].symptoms.push('arrhythmia_palpitations');
    }
  },
  {
    id: 'A7',
    name: 'Vision change (SANS)',
    duration: 5,
    groundTruthPath: 'FLIGHT_SURGEON',
    emergency: true,
    apply: (days, onset) => {
      for (let i = 0; i < 5 && onset + i < days.length; i++) {
        days[onset + i].symptoms.push('blurred_vision');
      }
    }
  },
  {
    id: 'A8',
    name: 'Solar particle event',
    duration: 1,
    groundTruthPath: 'FLIGHT_SURGEON',
    emergency: true,
    apply: (days, onset) => {
      days[onset].dose_rate_msv = 18.5; // Massive radiation spike
      days[onset].symptoms.push('radiation_alarm');
    }
  },
  {
    id: 'A9',
    name: 'Missing telemetry data',
    duration: 3,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 3 && onset + i < days.length; i++) {
        days[onset + i].sleep_hours = null;
      }
    }
  },
  {
    id: 'A10',
    name: 'Exercise drop',
    duration: 21,
    groundTruthPath: 'CREW_MEDICAL_OFFICER',
    emergency: false,
    apply: (days, onset) => {
      for (let i = 0; i < 21 && onset + i < days.length; i++) {
        days[onset + i].exercise_hours = 0.5; // 30 min/day instead of nominal 1.5h
      }
    }
  },
  {
    id: 'N0',
    name: 'Nominal mission noise',
    duration: 180,
    groundTruthPath: 'SELF_CARE',
    emergency: false,
    apply: () => {} // no-op
  }
];

/**
 * Generates calibrated 180-day baseline data for an astronaut
 */
export function generateCrew(seed) {
  const rng = createRNG(seed);
  
  // Astronaut individual personal baseline (calibrated to NASA ranges)
  const baseline = {
    sleep: gaussian(rng, 6.8, 0.4),
    mood: gaussian(rng, 4.3, 0.3),
    stress: gaussian(rng, 1.8, 0.3),
    heart_rate: gaussian(rng, 66, 4.0),
    bp_systolic: gaussian(rng, 116, 5.0),
    bp_diastolic: gaussian(rng, 76, 4.0),
    co2: gaussian(rng, 3200, 250),
    exercise_hours: 1.5,
    dose_rate_msv: 1.8
  };

  const days = [];
  for (let d = 1; d <= 180; d++) {
    days.push({
      day: d,
      sleep_hours: Math.max(3.0, gaussian(rng, baseline.sleep, 0.5)),
      mood: Math.max(1.0, Math.min(5.0, gaussian(rng, baseline.mood, 0.4))),
      stress: Math.max(1.0, Math.min(5.0, gaussian(rng, baseline.stress, 0.4))),
      heart_rate: Math.max(45, Math.round(gaussian(rng, baseline.heart_rate, 3.5))),
      bp_systolic: Math.round(gaussian(rng, baseline.bp_systolic, 4.0)),
      bp_diastolic: Math.round(gaussian(rng, baseline.bp_diastolic, 3.0)),
      co2: Math.round(gaussian(rng, baseline.co2, 200)),
      exercise_hours: Math.max(0, gaussian(rng, baseline.exercise_hours, 0.15)),
      dose_rate_msv: Math.max(0.1, gaussian(rng, baseline.dose_rate_msv, 0.1)),
      symptoms: [],
      injected_event: null
    });
  }

  return { seed, baseline, days };
}

/**
 * Injects 0 to 3 anomalies into a crew's 180-day trajectory
 */
export function injectAnomalies(crew, rng) {
  const numEvents = Math.floor(rng() * 4); // 0, 1, 2, or 3
  const activeScenarios = SCENARIO_DEFS.filter(s => s.id !== 'N0');
  const injected = [];

  for (let e = 0; e < numEvents; e++) {
    const scIdx = Math.floor(rng() * activeScenarios.length);
    const scenario = activeScenarios[scIdx];
    // Pick onset day between 15 and 150 to avoid edge artifacts
    const onset = 15 + Math.floor(rng() * (150 - scenario.duration));
    
    scenario.apply(crew.days, onset);
    for (let i = 0; i < scenario.duration && onset + i < crew.days.length; i++) {
      crew.days[onset + i].injected_event = scenario.id;
    }
    injected.push({ id: scenario.id, name: scenario.name, onset: onset + 1, duration: scenario.duration });
  }

  return injected;
}
