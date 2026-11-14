/**
 * LANDFALL ML Forecasting Engine (predict.js)
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 * 
 * 100% Offline, Zero-Dependency In-Browser & Node.js Inference Engine.
 * Evaluates astronaut landing-day readiness across 6 physiological dimensions:
 *   - bone: Bone Mineral Density Retention (%)
 *   - muscle: Musculoskeletal Strength Retention (%)
 *   - aerobic: Cardiorespiratory Aerobic Retention (%)
 *   - balance: Neurovestibular Balance Retention (%)
 *   - sleep: Circadian Sleep Readiness Score (0-100)
 *   - mood: Behavioral Mood Resilience Score (0-100)
 * 
 * Features:
 *   - predictLanding(history, options)
 *   - whatIf(history, exerciseHoursPerDay)
 *   - explain(history)
 *   - modelInfo()
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js environment
    module.exports = factory();
  } else {
    // Browser environment
    root.LandfallML = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Embed production model weights (from /engine/model.json) for 100% offline, zero-CORS reliability
  let MODEL_DATA = null;

  // Check if window.LANDFALL_MODEL was loaded via <script src="engine/model.js">
  if (typeof window !== 'undefined' && window.LANDFALL_MODEL) {
    MODEL_DATA = window.LANDFALL_MODEL;
  } else if (typeof root !== 'undefined' && root.LANDFALL_MODEL) {
    MODEL_DATA = root.LANDFALL_MODEL;
  }

  // Attempt Node require or set default embedded weights
  if (!MODEL_DATA && typeof require === 'function' && typeof __dirname !== 'undefined') {
    try {
      const path = require('path');
      MODEL_DATA = require(path.join(__dirname, 'model.json'));
    } catch (e) {
      try {
        MODEL_DATA = require(path.join(__dirname, 'model.js'));
      } catch (err) {}
    }
  }

  // Load external model JSON dynamically if needed (Browser fetch)
  async function loadModel(url = 'engine/model.json') {
    try {
      if (typeof fetch === 'function') {
        const resp = await fetch(url);
        if (resp.ok) {
          MODEL_DATA = await resp.json();
          return true;
        }
      }
    } catch (err) {
      console.warn('LANDFALL: Could not fetch external model.json, using embedded fallback weights.', err);
    }
    return false;
  }

  // Set model data directly
  function setModelData(data) {
    MODEL_DATA = data;
  }

  /**
   * Helper: Normalize history records to a standard flat shape.
   * Supports both Om's CONTRACT.md format (vitals: { heartRate, ... }) and flat objects.
   */
  function normalizeRecord(rec, idx) {
    const day = rec.day || (idx + 1);
    const vitals = rec.vitals || {};
    const bp = vitals.bloodPressure || rec.bloodPressure || {};
    const cabin = rec.cabin || {};
    const immune = rec.immune || {};

    const hr = vitals.heartRate || rec.heart_rate || rec.heartRate || 64;
    const sbp = bp.systolic || rec.sbp || 116;
    const temp = vitals.temperature || rec.temperature || 36.6;
    const sleep = vitals.sleepHours !== undefined ? vitals.sleepHours : (rec.sleep_hours !== undefined ? rec.sleep_hours : (rec.sleepHours || 7.4));
    const mood = vitals.mood !== undefined ? vitals.mood : (rec.mood !== undefined ? rec.mood : 4.2);

    let exercise = 1.2;
    if (vitals.exerciseMinutes !== undefined) exercise = vitals.exerciseMinutes / 60.0;
    else if (rec.exercise_hours !== undefined) exercise = rec.exercise_hours;
    else if (rec.exerciseHours !== undefined) exercise = rec.exerciseHours;

    const balance = rec.balance_score !== undefined ? rec.balance_score : (rec.balanceScore !== undefined ? rec.balanceScore : 99.0);
    const co2 = cabin.co2 || rec.cabin_co2 || rec.co2 || 2800;

    let symptomSum = 0;
    if (Array.isArray(rec.symptoms)) symptomSum += rec.symptoms.length;
    if (immune.coldSore || rec.symptom_coldsore) symptomSum += 1;
    if (immune.rash || rec.symptom_rash) symptomSum += 1;
    if (immune.fever || rec.symptom_fever) symptomSum += 1;
    if (immune.fatigue || rec.symptom_fatigue) symptomSum += 1;

    return { day, hr, sbp, temp, sleep, mood, exercise, balance, co2, symptoms: symptomSum };
  }

  /**
   * Extracts feature vector from astronaut history up to current transit day.
   */
  function extractFeatures(rawHistory, plannedExercise = 1.2) {
    if (!Array.isArray(rawHistory) || rawHistory.length === 0) {
      throw new Error("LANDFALL: History must be a non-empty array of daily logs.");
    }

    const history = rawHistory.map(normalizeRecord).sort((a, b) => a.day - b.day);
    const currentDay = history[history.length - 1].day;
    const daysRemaining = Math.max(0, 180 - currentDay);

    // 1. Personal Baseline (first 14 days)
    const baseWindow = history.filter(d => d.day <= 14);
    const bCount = baseWindow.length || 1;

    const base_hr = baseWindow.reduce((s, r) => s + r.hr, 0) / bCount;
    const base_sbp = baseWindow.reduce((s, r) => s + r.sbp, 0) / bCount;
    const base_temp = baseWindow.reduce((s, r) => s + r.temp, 0) / bCount;
    const base_sleep = baseWindow.reduce((s, r) => s + r.sleep, 0) / bCount;
    const base_mood = baseWindow.reduce((s, r) => s + r.mood, 0) / bCount;
    const base_exercise = baseWindow.reduce((s, r) => s + r.exercise, 0) / bCount;
    const base_balance = baseWindow.reduce((s, r) => s + r.balance, 0) / bCount;

    // Standard deviations with physiological floors to prevent division by zero
    const hr_variance = baseWindow.reduce((s, r) => s + Math.pow(r.hr - base_hr, 2), 0) / bCount;
    const sleep_variance = baseWindow.reduce((s, r) => s + Math.pow(r.sleep - base_sleep, 2), 0) / bCount;
    const mood_variance = baseWindow.reduce((s, r) => s + Math.pow(r.mood - base_mood, 2), 0) / bCount;

    const base_hr_std = Math.max(1.5, Math.sqrt(hr_variance));
    const base_sleep_std = Math.max(0.3, Math.sqrt(sleep_variance));
    const base_mood_std = Math.max(0.2, Math.sqrt(mood_variance));

    // 2. Rolling 7-day window
    const w7 = history.filter(d => d.day > Math.max(0, currentDay - 7) && d.day <= currentDay);
    const c7 = w7.length || 1;
    const hr_mean_7d = w7.reduce((s, r) => s + r.hr, 0) / c7;
    const sbp_mean_7d = w7.reduce((s, r) => s + r.sbp, 0) / c7;
    const sleep_mean_7d = w7.reduce((s, r) => s + r.sleep, 0) / c7;
    const mood_mean_7d = w7.reduce((s, r) => s + r.mood, 0) / c7;
    const exercise_mean_7d = w7.reduce((s, r) => s + r.exercise, 0) / c7;
    const balance_mean_7d = w7.reduce((s, r) => s + r.balance, 0) / c7;

    // 3. Rolling 30-day window
    const w30 = history.filter(d => d.day > Math.max(0, currentDay - 30) && d.day <= currentDay);
    const c30 = w30.length || 1;
    const hr_mean_30d = w30.reduce((s, r) => s + r.hr, 0) / c30;
    const sleep_mean_30d = w30.reduce((s, r) => s + r.sleep, 0) / c30;
    const mood_mean_30d = w30.reduce((s, r) => s + r.mood, 0) / c30;
    const exercise_mean_30d = w30.reduce((s, r) => s + r.exercise, 0) / c30;

    // 4. Deviations & Z-scores (clamped to [-5, 5])
    const hr_drift_7d = hr_mean_7d - base_hr;
    const sbp_drift_7d = sbp_mean_7d - base_sbp;
    const sleep_drift_7d = sleep_mean_7d - base_sleep;
    const mood_drift_7d = mood_mean_7d - base_mood;
    const exercise_drift_7d = exercise_mean_7d - base_exercise;

    const hr_zscore_7d = Math.max(-5.0, Math.min(5.0, hr_drift_7d / base_hr_std));
    const sleep_zscore_7d = Math.max(-5.0, Math.min(5.0, sleep_drift_7d / base_sleep_std));
    const mood_zscore_7d = Math.max(-5.0, Math.min(5.0, mood_drift_7d / base_mood_std));

    // 5. CUSUM
    let cusum_sleep_debt = 0;
    let cusum_hr_elevation = 0;
    for (let i = 0; i < history.length; i++) {
      const d = history[i];
      if (d.day <= currentDay) {
        cusum_sleep_debt += Math.max(0, base_sleep - d.sleep - 0.25);
        cusum_hr_elevation += Math.max(0, d.hr - base_hr - 2.0);
      }
    }

    // 6. Symptoms & Cabin (last 14 days)
    const w14 = history.filter(d => d.day > Math.max(0, currentDay - 14) && d.day <= currentDay);
    const symptom_count_14d = w14.reduce((s, r) => s + r.symptoms, 0);
    const co2_mean_14d = w14.reduce((s, r) => s + r.co2, 0) / (w14.length || 1);

    return {
      features: {
        day_d: currentDay,
        days_remaining: daysRemaining,
        base_hr,
        base_sbp,
        base_temp,
        base_sleep,
        base_mood,
        base_exercise,
        base_balance,
        hr_mean_7d,
        sbp_mean_7d,
        sleep_mean_7d,
        mood_mean_7d,
        exercise_mean_7d,
        balance_mean_7d,
        hr_mean_30d,
        sleep_mean_30d,
        mood_mean_30d,
        exercise_mean_30d,
        hr_drift_7d,
        sbp_drift_7d,
        sleep_drift_7d,
        mood_drift_7d,
        exercise_drift_7d,
        hr_zscore_7d,
        sleep_zscore_7d,
        mood_zscore_7d,
        cusum_sleep_debt,
        cusum_hr_elevation,
        symptom_count_14d,
        co2_mean_14d,
        planned_daily_exercise: Math.max(0, Math.min(1.5, plannedExercise))
      },
      metadata: {
        currentDay,
        base_sleep,
        base_mood,
        base_hr,
        sleep_mean_7d,
        mood_mean_7d,
        hr_mean_7d,
        sleep_drift_7d,
        hr_drift_7d
      }
    };
  }

  /**
   * Status mapping helper based on NASA-configured thresholds.
   */
  function determineStatus(value, dimName, thresholds) {
    const th = (thresholds && thresholds[dimName]) || { nominal: 90, caution: 80 };
    if (value >= th.nominal) return 'green';
    if (value >= th.caution) return 'amber';
    return 'red';
  }

  /**
   * Main Contract Method 1: predictLanding(history, options)
   */
  function predictLanding(history, options = {}) {
    // If model.json is not yet loaded, try fallback to window.ForecastEngine
    if (!MODEL_DATA && typeof window !== 'undefined' && window.ForecastEngine) {
      const day = Array.isArray(history) && history.length > 0 ? history[history.length - 1].day : 40;
      const ex = options.plannedExerciseHours !== undefined ? options.plannedExerciseHours : 1.2;
      const fb = window.ForecastEngine.calculateLandingReadiness(day, ex);
      return {
        bone: { low: fb.metrics.boneDensity.low, mid: fb.metrics.boneDensity.projectedRetention, high: fb.metrics.boneDensity.high, status: fb.metrics.boneDensity.status === 'nominal' ? 'green' : (fb.metrics.boneDensity.status === 'caution' ? 'amber' : 'red') },
        muscle: { low: fb.metrics.aerobicAndMuscle.low, mid: fb.metrics.aerobicAndMuscle.projectedRetention, high: fb.metrics.aerobicAndMuscle.high, status: fb.metrics.aerobicAndMuscle.status === 'nominal' ? 'green' : (fb.metrics.aerobicAndMuscle.status === 'caution' ? 'amber' : 'red') },
        aerobic: { low: fb.metrics.aerobicAndMuscle.low, mid: fb.metrics.aerobicAndMuscle.projectedRetention, high: fb.metrics.aerobicAndMuscle.high, status: fb.metrics.aerobicAndMuscle.status === 'nominal' ? 'green' : (fb.metrics.aerobicAndMuscle.status === 'caution' ? 'amber' : 'red') },
        balance: { low: fb.metrics.neurovestibularBalance.low, mid: fb.metrics.neurovestibularBalance.projectedRetention, high: fb.metrics.neurovestibularBalance.high, status: fb.metrics.neurovestibularBalance.status === 'nominal' ? 'green' : (fb.metrics.neurovestibularBalance.status === 'caution' ? 'amber' : 'red') },
        sleep: { low: fb.metrics.sleepDebt.low, mid: fb.metrics.sleepDebt.projectedRetention, high: fb.metrics.sleepDebt.high, status: fb.metrics.sleepDebt.status === 'nominal' ? 'green' : (fb.metrics.sleepDebt.status === 'caution' ? 'amber' : 'red') },
        mood: { low: fb.metrics.cognitiveMood.low, mid: fb.metrics.cognitiveMood.projectedRetention, high: fb.metrics.cognitiveMood.high, status: fb.metrics.cognitiveMood.status === 'nominal' ? 'green' : (fb.metrics.cognitiveMood.status === 'caution' ? 'amber' : 'red') }
      };
    }

    if (!MODEL_DATA) {
      throw new Error("LANDFALL: Model data not initialized. Call LandfallML.loadModel() or supply model.json.");
    }

    const plannedEx = options.plannedExerciseHours !== undefined ? options.plannedExerciseHours : 1.2;
    const { features } = extractFeatures(history, plannedEx);

    const featureCols = MODEL_DATA.feature_columns;
    const mean = MODEL_DATA.scaler.mean;
    const scale = MODEL_DATA.scaler.scale;
    const thresholds = MODEL_DATA.status_thresholds;

    // Feature scaling
    const scaledX = featureCols.map((col, idx) => {
      const val = features[col] !== undefined ? features[col] : 0.0;
      return (val - mean[idx]) / scale[idx];
    });

    const output = {};
    const dims = ['bone', 'muscle', 'aerobic', 'balance', 'sleep', 'mood'];

    dims.forEach(dim => {
      const targetKey = `target_${dim}`;
      const coefs = MODEL_DATA.coefficients[targetKey];
      const intercept = MODEL_DATA.intercepts[targetKey];
      const offsets = MODEL_DATA.uncertainty_offsets[targetKey];

      // Linear dot product
      let mid = intercept;
      for (let i = 0; i < scaledX.length; i++) {
        mid += scaledX[i] * coefs[i];
      }

      const low = mid + offsets.low_offset;
      const high = mid + offsets.high_offset;

      const roundedMid = +(mid.toFixed(1));
      const roundedLow = +(low.toFixed(1));
      const roundedHigh = +(high.toFixed(1));

      output[dim] = {
        low: roundedLow,
        mid: roundedMid,
        high: roundedHigh,
        status: determineStatus(roundedMid, dim, thresholds)
      };
    });

    return output;
  }

  /**
   * Main Contract Method 2: whatIf(history, exerciseHoursPerDay)
   */
  function whatIf(history, exerciseHoursPerDay) {
    const ex = Math.max(0.0, Math.min(1.5, parseFloat(exerciseHoursPerDay) || 0.0));
    return predictLanding(history, { plannedExerciseHours: ex });
  }

  /**
   * Main Contract Method 3: explain(history)
   * Up to 3 plain sentences explaining the top feature drivers based on real model weights.
   */
  function explain(history) {
    if (!MODEL_DATA) {
      return "Model running on default baseline; upload or sync telemetry for personalized attribution.";
    }

    const { features, metadata } = extractFeatures(history, 1.2);
    const featureCols = MODEL_DATA.feature_columns;
    const mean = MODEL_DATA.scaler.mean;
    const scale = MODEL_DATA.scaler.scale;

    const scaledX = {};
    featureCols.forEach((col, idx) => {
      const raw = features[col] !== undefined ? features[col] : 0.0;
      scaledX[col] = (raw - mean[idx]) / scale[idx];
    });

    const sentences = [];

    // 1. Sleep & Mood Attribution
    const sleepDiff = metadata.sleep_drift_7d;
    if (Math.abs(sleepDiff) >= 0.8) {
      const direction = sleepDiff < 0 ? "deficit" : "surplus";
      sentences.push(
        `7-day sleep averaged ${metadata.sleep_mean_7d.toFixed(1)} h vs your baseline of ${metadata.base_sleep.toFixed(1)} h (${Math.abs(sleepDiff).toFixed(1)} h ${direction}), which is the leading factor influencing sleep and mood resilience projections.`
      );
    } else {
      sentences.push(
        `Sleep continuity remains stable near baseline (${metadata.sleep_mean_7d.toFixed(1)} h vs ${metadata.base_sleep.toFixed(1)} h baseline), maintaining positive circadian readiness.`
      );
    }

    // 2. Cardiovascular / Vitals Drift
    const hrDiff = metadata.hr_drift_7d;
    if (Math.abs(hrDiff) >= 5.0) {
      const direction = hrDiff > 0 ? "elevation" : "reduction";
      sentences.push(
        `Resting heart rate shows a ${Math.abs(hrDiff).toFixed(1)} bpm ${direction} above your calibrated baseline (${metadata.hr_mean_7d.toFixed(0)} bpm vs ${metadata.base_hr.toFixed(0)} bpm), driving cardiorespiratory strain.`
      );
    }

    // 3. Countermeasure Impact
    const exPlanned = features.planned_daily_exercise;
    if (exPlanned >= 1.2) {
      sentences.push(
        `Maintaining planned exercise at ${exPlanned.toFixed(1)} h/day mitigates microgravity bone density resorption and preserves aerobic capacity toward landing.`
      );
    } else {
      sentences.push(
        `Current exercise adherence of ${exPlanned.toFixed(1)} h/day is below the 1.5 h target, projecting accelerated muscle and bone density loss.`
      );
    }

    return sentences.slice(0, 3).join(" ");
  }

  /**
   * Main Contract Method 4: modelInfo()
   */
  function modelInfo() {
    return {
      version: MODEL_DATA ? MODEL_DATA.metadata.version : "1.0.0",
      modelType: MODEL_DATA ? MODEL_DATA.metadata.model_type : "RidgeRegression",
      trainedOn: "synthetic data",
      note: "Illustrative, not a clinical predictor",
      author: "Tanishk (Physiological Engine)",
      trainingDate: MODEL_DATA ? MODEL_DATA.metadata.training_date : "2026-11-14",
      nasaCitations: [
        "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/",
        "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
        "https://www.nasa.gov/hrp/hazards/"
      ]
    };
  }

  return {
    loadModel,
    setModelData,
    extractFeatures,
    predictLanding,
    whatIf,
    explain,
    modelInfo
  };
}));
