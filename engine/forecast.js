/**
 * LANDFALL Production Forecast Engine (engine/forecast.js)
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 * 
 * Bridges Om's UI with the machine learning engine (LandfallML / predict.js).
 * Translates ML outputs (green/amber/red) to CONTRACT.md shape (nominal/caution/alarm),
 * exposes calculateLandingReadiness(currentDay, exerciseHours), and includes dynamic
 * adaptive countermeasure recommendations.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ForecastEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function mapStatus(status) {
    if (status === 'green') return 'nominal';
    if (status === 'amber') return 'caution';
    if (status === 'red') return 'alarm';
    return status || 'nominal';
  }

  const ForecastEngine = {
    /**
     * Compute landing-day projections.
     * @param {number} currentDay - active transit day (1 to 180)
     * @param {number} exerciseHours - daily adherence slider (0.0 to 1.5 hrs/day)
     */
    calculateLandingReadiness(currentDay = 40, exerciseHours = 1.2) {
      const day = Math.max(1, Math.min(180, parseInt(currentDay, 10) || 40));
      const exHours = Math.max(0.0, Math.min(1.5, parseFloat(exerciseHours) !== undefined ? parseFloat(exerciseHours) : 1.2));
      const adherenceRatio = exHours / 1.5;
      const remainingDays = Math.max(0, 180 - day);

      // 1. Gather historical telemetry up to day
      let history = [];
      if (typeof window !== 'undefined' && window.DataEngine && typeof window.DataEngine.getAllDays === 'function') {
        history = window.DataEngine.getAllDays().filter(d => d.day <= day);
      } else if (typeof require === 'function') {
        try {
          const DataEngine = require('./data.js');
          history = DataEngine.getAllDays().filter(d => d.day <= day);
        } catch (e) {
          // Fallback to synthetic stub if data module missing
        }
      }

      // 2. Obtain predictions from ML Engine (LandfallML)
      let mlPreds = null;
      let mlEngine = null;
      if (typeof window !== 'undefined' && window.LandfallML) {
        mlEngine = window.LandfallML;
      } else if (typeof require === 'function') {
        try {
          mlEngine = require('./predict.js');
        } catch (e) {}
      }

      if (mlEngine && history.length > 0) {
        try {
          mlPreds = mlEngine.whatIf(history, exHours);
        } catch (err) {
          console.warn("LANDFALL ForecastEngine: ML prediction fallback due to:", err);
        }
      }

      // 3. Fallback formula calculations if ML is unavailable
      const totalMonths = 6.0;
      const baselineMonthlyLoss = 1.25;
      const protectedBoneLoss = totalMonths * (baselineMonthlyLoss * (1 - adherenceRatio * 0.72));
      const fallbackBone = +(100 - protectedBoneLoss).toFixed(1);

      const maxAerobicLoss = 11.5;
      const fallbackAerobic = +(100 - maxAerobicLoss * (1 - adherenceRatio * 0.85)).toFixed(1);
      const fallbackMuscle = fallbackAerobic;
      const fallbackCardio = +(96.0 - (1 - adherenceRatio) * 8.5).toFixed(1);
      const fallbackNeuro = +(88.0 - (180 - remainingDays) * 0.04).toFixed(1);

      let fallbackSleep = 92.0;
      if (day >= 40) fallbackSleep = +(74.0 + adherenceRatio * 10).toFixed(1);
      let fallbackMood = +(88.0 - (day >= 40 ? 12 : 3) + adherenceRatio * 7).toFixed(1);

      // 4. Construct Metric Cards matching CONTRACT.md
      const boneRetention = mlPreds ? mlPreds.bone.mid : fallbackBone;
      const boneLow = mlPreds ? mlPreds.bone.low : +(boneRetention - 1.8).toFixed(1);
      const boneHigh = mlPreds ? mlPreds.bone.high : +(boneRetention + 1.4).toFixed(1);
      const boneStatus = mlPreds ? mapStatus(mlPreds.bone.status) : (boneRetention >= 93 ? 'nominal' : (boneRetention >= 88 ? 'caution' : 'alarm'));

      const muscleRetention = mlPreds ? mlPreds.muscle.mid : fallbackMuscle;
      const aerobicRetention = mlPreds ? mlPreds.aerobic.mid : fallbackAerobic;
      const aerobicAndMuscleRetention = +(((muscleRetention + aerobicRetention) / 2.0).toFixed(1));
      const fitLow = mlPreds ? mlPreds.aerobic.low : +(aerobicAndMuscleRetention - 2.2).toFixed(1);
      const fitHigh = mlPreds ? mlPreds.aerobic.high : +(aerobicAndMuscleRetention + 1.8).toFixed(1);
      const fitStatus = mlPreds ? mapStatus(mlPreds.aerobic.status) : (aerobicAndMuscleRetention >= 92 ? 'nominal' : (aerobicAndMuscleRetention >= 85 ? 'caution' : 'alarm'));

      const cardioRetention = mlPreds ? mlPreds.aerobic.mid : fallbackCardio;
      const cardioLow = mlPreds ? +(cardioRetention - 1.5).toFixed(1) : +(cardioRetention - 2.0).toFixed(1);
      const cardioHigh = mlPreds ? +(cardioRetention + 1.2).toFixed(1) : +(cardioRetention + 1.5).toFixed(1);
      const cardioStatus = mlPreds ? mapStatus(mlPreds.aerobic.status) : (cardioRetention >= 91 ? 'nominal' : 'caution');

      const balanceRetention = mlPreds ? mlPreds.balance.mid : fallbackNeuro;
      const balanceLow = mlPreds ? mlPreds.balance.low : +(balanceRetention - 3.0).toFixed(1);
      const balanceHigh = mlPreds ? mlPreds.balance.high : +(balanceRetention + 2.5).toFixed(1);
      const balanceStatus = mlPreds ? mapStatus(mlPreds.balance.status) : (balanceRetention >= 84 ? 'caution' : 'alarm');

      const sleepRetention = mlPreds ? mlPreds.sleep.mid : fallbackSleep;
      const sleepLow = mlPreds ? mlPreds.sleep.low : +(sleepRetention - 4.0).toFixed(1);
      const sleepHigh = mlPreds ? mlPreds.sleep.high : +(sleepRetention + 3.0).toFixed(1);
      const sleepStatus = mlPreds ? mapStatus(mlPreds.sleep.status) : (sleepRetention >= 85 ? 'nominal' : (sleepRetention >= 70 ? 'caution' : 'alarm'));

      const moodRetention = mlPreds ? mlPreds.mood.mid : fallbackMood;
      const moodLow = mlPreds ? mlPreds.mood.low : +(moodRetention - 3.5).toFixed(1);
      const moodHigh = mlPreds ? mlPreds.mood.high : +(moodRetention + 3.0).toFixed(1);
      const moodStatus = mlPreds ? mapStatus(mlPreds.mood.status) : (moodRetention >= 82 ? 'nominal' : (moodRetention >= 72 ? 'caution' : 'alarm'));

      // 5. Composite Score & Overall Status
      const compositeScore = Math.round(
        boneRetention * 0.25 +
        aerobicAndMuscleRetention * 0.25 +
        cardioRetention * 0.15 +
        balanceRetention * 0.15 +
        sleepRetention * 0.10 +
        moodRetention * 0.10
      );

      let overallStatus = 'nominal';
      if (compositeScore < 75 || sleepStatus === 'alarm' || fitStatus === 'alarm') {
        overallStatus = 'alarm';
      } else if (compositeScore < 88 || boneStatus === 'caution' || fitStatus === 'caution') {
        overallStatus = 'caution';
      }

      // 6. Dynamic Recommended Countermeasures
      const countermeasures = [
        {
          id: 'ARED_RESISTANCE',
          name: 'Advanced Resistive Exercise Device (ARED) Deadlift & Squat protocol',
          detail: 'Maintains bone mineral density in lumbar spine and femoral neck against microgravity loss.',
          active: adherenceRatio < 0.8 || boneStatus !== 'nominal' || fitStatus !== 'nominal',
          citation: 'NASA HRP Risk of Bone Changes & Fitness'
        },
        {
          id: 'CIRCADIAN_LIGHTING',
          name: 'Dynamic 480nm blue-enriched cabin lighting adjustment',
          detail: 'Phase-shifts circadian melatonin suppression to restore sleep continuity (Day-40 intervention).',
          active: (day >= 40 && day <= 65) || sleepStatus !== 'nominal',
          citation: 'NASA TM-2020-5008167'
        },
        {
          id: 'FLUID_LOADING',
          name: 'Landing-day 1.0L isotonic saline loading & anti-g suit preparation',
          detail: 'Mitigates post-landing orthostatic intolerance during Mars 0.38g transition.',
          active: true,
          citation: 'NASA HRP Cardiovascular'
        },
        {
          id: 'CO2_MONITORING',
          name: 'Cabin Amine Bed CO2 scrubber regeneration cycle',
          detail: 'Reduces crew hypercapnia risk (headaches, visual disturbances).',
          active: (day >= 40 && day <= 55),
          citation: 'NASA JSC-66632'
        }
      ];

      return {
        overallReadinessScore: compositeScore,
        overallStatus,
        daysToLanding: remainingDays,
        adherenceHours: exHours,
        metrics: {
          boneDensity: {
            title: 'Bone Mineral Density (Femoral Neck & Spine)',
            projectedRetention: boneRetention,
            low: boneLow,
            high: boneHigh,
            status: boneStatus,
            rateDescription: 'Loss of 1.0 - 1.5% per month (verify on source page)',
            citation: 'NASA Risk of Bone Changes',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/'
          },
          aerobicAndMuscle: {
            title: 'Aerobic Power & Skeletal Strength (VO2 Max)',
            projectedRetention: aerobicAndMuscleRetention,
            low: fitLow,
            high: fitHigh,
            status: fitStatus,
            rateDescription: '10 - 12% average strength & aerobic loss (verify on source page)',
            citation: 'NASA Risk of Reduced Fitness',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/'
          },
          cardiovascular: {
            title: 'Cardiovascular & Orthostatic Regulation',
            projectedRetention: cardioRetention,
            low: cardioLow,
            high: cardioHigh,
            status: cardioStatus,
            rateDescription: 'Left ventricular mass & baroreflex response',
            citation: 'NASA Risk of Cardiovascular Adaptations',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/'
          },
          neurovestibularBalance: {
            title: 'Neurovestibular Adaptation & G-Transition Balance',
            projectedRetention: balanceRetention,
            low: balanceLow,
            high: balanceHigh,
            status: balanceStatus,
            rateDescription: 'Otolith-spinal reinterpretation in 0.38g gravity',
            citation: 'NASA Risk of Altered Sensorimotor Function',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/'
          },
          sleepDebt: {
            title: 'Circadian Sleep Stability & Cumulative Deficit',
            projectedRetention: sleepRetention,
            low: sleepLow,
            high: sleepHigh,
            status: sleepStatus,
            rateDescription: 'Chronobiological disruption & microgravity sleep debt',
            citation: 'NASA Risk of Inadequate Sleep',
            citationUrl: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/'
          },
          cognitiveMood: {
            title: 'Cognitive Vigilance & Stress Resilience',
            projectedRetention: moodRetention,
            low: moodLow,
            high: moodHigh,
            status: moodStatus,
            rateDescription: 'Long-duration isolation & self-sufficiency load',
            citation: 'NASA Risk of Behavioral Conditions',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/'
          }
        },
        recommendedCountermeasures: countermeasures
      };
    }
  };

  return ForecastEngine;
}));
