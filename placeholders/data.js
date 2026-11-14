/**
 * LANDFALL Placeholders - data.js
 * Seeded 180-day Mars transit physiological dataset
 * Features calibrated astronaut baseline and Day-40 sleep collapse event
 */

(function(window) {
  'use strict';

  // Calibrated Astronaut Personal Baseline (Pre-flight & LEO checkout)
  const ASTRONAUT_BASELINE = {
    heartRate: 64,             // bpm resting
    bloodPressure: {
      systolic: 116,
      diastolic: 76
    },
    temperature: 36.6,         // Celsius
    sleepHours: 7.4,           // hours
    mood: 4.2,                 // scale 1-5
    exerciseMinutes: 90,       // 1.5 hours target
    boneMineralDensity: 100,   // % baseline
    aerobicCapacityVO2: 44.5   // mL/kg/min
  };

  // Seeded dataset generator (180 days of transit)
  const transitDataset = [];

  function generate180Days() {
    let cumulativeRadiation = 0;

    for (let day = 1; day <= 180; day++) {
      // Natural subtle drift and microgravity variation
      const dailyRad = +(1.42 + Math.sin(day * 0.15) * 0.12).toFixed(2);
      cumulativeRadiation += dailyRad;

      let sleep = +(7.3 + Math.sin(day * 0.2) * 0.4).toFixed(1);
      let mood = +(4.1 + Math.cos(day * 0.1) * 0.3).toFixed(1);
      let hr = Math.round(63 + Math.sin(day * 0.25) * 3);
      let sys = Math.round(116 + Math.sin(day * 0.1) * 4);
      let dia = Math.round(76 + Math.cos(day * 0.1) * 3);
      let temp = +(36.6 + Math.sin(day * 0.3) * 0.1).toFixed(1);
      let exercise = Math.round(85 + Math.sin(day * 0.4) * 8);
      let co2 = Math.round(2800 + Math.sin(day * 0.05) * 300);
      let cabinTemp = +(21.5 + Math.sin(day * 0.2) * 0.5).toFixed(1);
      let noise = Math.round(58 + Math.cos(day * 0.3) * 3);

      let symptoms = [];
      let immune = {
        rash: false,
        coldSore: false,
        fever: false,
        fatigue: false,
        stressScore: +(2.2 + Math.sin(day * 0.1) * 0.4).toFixed(1)
      };

      let bodyMap = {
        head: 'nominal',
        chest: 'nominal',
        torso: 'nominal',
        arms: 'nominal',
        legs: 'nominal'
      };

      // Day 40 Event: Sleep Collapse & Cabin Environmental Spike
      if (day >= 40 && day <= 55) {
        // Dramatic sleep drop at day 40, recovering slowly by day 55
        const severity = Math.max(0, 1 - (day - 40) / 15);
        sleep = +(4.2 + (1 - severity) * 2.8).toFixed(1);
        mood = +(2.8 + (1 - severity) * 1.2).toFixed(1);
        hr = Math.round(74 - (1 - severity) * 9);
        sys = Math.round(126 - (1 - severity) * 8);
        dia = Math.round(83 - (1 - severity) * 6);
        exercise = Math.round(45 + (1 - severity) * 40);
        co2 = Math.round(5200 - (1 - severity) * 2200); // CO2 elevated
        symptoms = ['headache', 'eye_strain'];
        immune.coldSore = day <= 48;
        immune.fatigue = true;
        immune.stressScore = +(3.9 - (1 - severity) * 1.5).toFixed(1);

        bodyMap.head = 'alarm';
        bodyMap.legs = severity > 0.4 ? 'caution' : 'nominal';
      }

      transitDataset.push({
        day,
        vitals: {
          heartRate: hr,
          bloodPressure: { systolic: sys, diastolic: dia },
          temperature: temp,
          sleepHours: sleep,
          mood: mood,
          exerciseMinutes: exercise
        },
        symptoms,
        cabin: {
          co2,
          temperature: cabinTemp,
          noise
        },
        immune,
        radiation: {
          dailyDose: dailyRad,
          cumulativeDose: +cumulativeRadiation.toFixed(1)
        },
        bodyMapDrift: bodyMap
      });
    }
  }

  generate180Days();

  // Public DataEngine Interface
  const DataEngine = {
    getBaseline() {
      return JSON.parse(JSON.stringify(ASTRONAUT_BASELINE));
    },

    getDay(dayNumber) {
      const day = Math.max(1, Math.min(180, parseInt(dayNumber, 10)));
      return JSON.parse(JSON.stringify(transitDataset[day - 1]));
    },

    getHistory(metricName) {
      const baseline = ASTRONAUT_BASELINE;
      return transitDataset.map(item => {
        let val = 0;
        let baseVal = 0;
        let status = 'nominal';

        if (metricName === 'sleep') {
          val = item.vitals.sleepHours;
          baseVal = baseline.sleepHours;
          if (val < 5.0) status = 'alarm';
          else if (val < 6.5) status = 'caution';
        } else if (metricName === 'mood') {
          val = item.vitals.mood;
          baseVal = baseline.mood;
          if (val < 3.0) status = 'alarm';
          else if (val < 3.8) status = 'caution';
        } else if (metricName === 'heartRate') {
          val = item.vitals.heartRate;
          baseVal = baseline.heartRate;
          if (val > 75) status = 'caution';
          if (val > 85) status = 'alarm';
        }

        return {
          day: item.day,
          value: val,
          baseline: baseVal,
          status
        };
      });
    },

    saveCheckIn(dayNumber, checkInData) {
      const day = Math.max(1, Math.min(180, parseInt(dayNumber, 10)));
      const existing = transitDataset[day - 1];
      if (existing) {
        existing.vitals.heartRate = checkInData.heartRate || existing.vitals.heartRate;
        existing.vitals.bloodPressure = checkInData.bloodPressure || existing.vitals.bloodPressure;
        existing.vitals.temperature = checkInData.temperature || existing.vitals.temperature;
        existing.vitals.sleepHours = checkInData.sleepHours || existing.vitals.sleepHours;
        existing.vitals.mood = checkInData.mood || existing.vitals.mood;
        existing.vitals.exerciseMinutes = checkInData.exerciseMinutes || existing.vitals.exerciseMinutes;
        existing.symptoms = checkInData.symptoms || existing.symptoms;
      }
      return existing;
    }
  };

  window.DataEngine = DataEngine;
})(window);
