/**
 * LANDFALL Placeholders - forecast.js
 * NASA Human Research Program Rate Predictive Physiology Engine
 * Calculates landing-day organ/system readiness based on mission transit day
 * and real-time exercise adherence (0.0 to 1.5 hrs/day).
 */

(function(window) {
  'use strict';

  const ForecastEngine = {
    /**
     * Compute landing-day projections
     * @param {number} currentDay - active day in transit (1 to 180)
     * @param {number} exerciseHours - daily adherence slider (0.0 to 1.5)
     */
    calculateLandingReadiness(currentDay, exerciseHours = 1.2) {
      const adherenceRatio = Math.max(0, Math.min(1.0, exerciseHours / 1.5));
      const remainingDays = Math.max(0, 180 - currentDay);
      const totalMonths = 6.0; // 180 days Hohmann transfer

      // 1. Bone Density Retention (NASA HRP: 1.0 - 1.5% loss per month on 4-6 month missions)
      // Note: verify on source page
      const baselineMonthlyLoss = 1.25; // % per month
      const protectedLossRate = baselineMonthlyLoss * (1 - adherenceRatio * 0.72); // mitigated with full resistance load
      const projectedBoneLoss = (totalMonths * protectedLossRate).toFixed(1);
      const boneRetention = +(100 - projectedBoneLoss).toFixed(1);
      const boneStatus = boneRetention >= 93 ? 'nominal' : (boneRetention >= 88 ? 'caution' : 'alarm');

      // 2. Aerobic & Skeletal Muscle Power (NASA HRP: 10 - 12% average strength & aerobic loss)
      // Note: verify on source page
      const maxAerobicLoss = 11.5; // %
      const actualAerobicLoss = +(maxAerobicLoss * (1 - adherenceRatio * 0.85)).toFixed(1);
      const aerobicRetention = +(100 - actualAerobicLoss).toFixed(1);
      const aerobicStatus = aerobicRetention >= 92 ? 'nominal' : (aerobicRetention >= 85 ? 'caution' : 'alarm');

      // 3. Cardiovascular & Orthostatic Function (NASA Risk of Cardiovascular Adaptations)
      const cardioRetention = +(96.0 - (1 - adherenceRatio) * 8.5).toFixed(1);
      const cardioStatus = cardioRetention >= 91 ? 'nominal' : 'caution';

      // 4. Neurovestibular & Balance Control (NASA Risk of Altered Sensorimotor Function)
      const neuroRetention = +(88.0 - (180 - remainingDays) * 0.04).toFixed(1);
      const neuroStatus = neuroRetention >= 84 ? 'caution' : 'alarm';

      // 5. Cumulative Sleep Debt Factor (NASA Risk of Inadequate Sleep)
      let sleepDebtRetention = 92.0;
      if (currentDay >= 40) {
        sleepDebtRetention = +(74.0 + adherenceRatio * 10).toFixed(1);
      }
      const sleepStatus = sleepDebtRetention >= 85 ? 'nominal' : (sleepDebtRetention >= 70 ? 'caution' : 'alarm');

      // 6. Cognitive & Mood Resilience (NASA Risk of Behavioral Conditions)
      let moodRetention = +(88.0 - (currentDay >= 40 ? 12 : 3) + adherenceRatio * 7).toFixed(1);
      const moodStatus = moodRetention >= 82 ? 'nominal' : (moodRetention >= 72 ? 'caution' : 'alarm');

      // Composite Readiness Score (0 - 100)
      const compositeScore = Math.round(
        boneRetention * 0.25 +
        aerobicRetention * 0.25 +
        cardioRetention * 0.15 +
        neuroRetention * 0.15 +
        sleepDebtRetention * 0.10 +
        moodRetention * 0.10
      );

      let overallStatus = 'nominal';
      if (compositeScore < 75) overallStatus = 'alarm';
      else if (compositeScore < 88) overallStatus = 'caution';

      // Dynamic Countermeasure Recommendations
      const countermeasures = [
        {
          id: 'ARED_RESISTANCE',
          name: 'Advanced Resistive Exercise Device (ARED) Deadlift & Squat protocol',
          detail: 'Maintains bone mineral density in lumbar spine and femoral neck against microgravity loss.',
          active: adherenceRatio < 0.8,
          citation: 'NASA HRP (verify on source page)'
        },
        {
          id: 'CIRCADIAN_LIGHTING',
          name: 'Dynamic 480nm blue-enriched cabin lighting adjustment',
          detail: 'Phase-shifts circadian melatonin suppression to restore sleep continuity (Day-40 intervention).',
          active: currentDay >= 40 && currentDay <= 65,
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
          active: currentDay >= 40 && currentDay <= 52,
          citation: 'NASA JSC-66632'
        }
      ];

      return {
        overallReadinessScore: compositeScore,
        overallStatus,
        daysToLanding: remainingDays,
        adherenceHours: exerciseHours,
        metrics: {
          boneDensity: {
            title: 'Bone Mineral Density (Femoral Neck & Spine)',
            projectedRetention: boneRetention,
            low: +(boneRetention - 1.8).toFixed(1),
            high: +(boneRetention + 1.4).toFixed(1),
            status: boneStatus,
            rateDescription: 'Loss of 1.0 - 1.5% per month (verify on source page)',
            citation: 'NASA Risk of Bone Changes',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/'
          },
          aerobicAndMuscle: {
            title: 'Aerobic Power & Skeletal Strength (VO2 Max)',
            projectedRetention: aerobicRetention,
            low: +(aerobicRetention - 2.2).toFixed(1),
            high: +(aerobicRetention + 1.8).toFixed(1),
            status: aerobicStatus,
            rateDescription: '10 - 12% average strength & aerobic loss (verify on source page)',
            citation: 'NASA Risk of Reduced Fitness',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/'
          },
          cardiovascular: {
            title: 'Cardiovascular & Orthostatic Regulation',
            projectedRetention: cardioRetention,
            low: +(cardioRetention - 2.0).toFixed(1),
            high: +(cardioRetention + 1.5).toFixed(1),
            status: cardioStatus,
            rateDescription: 'Left ventricular mass & baroreflex response',
            citation: 'NASA Risk of Cardiovascular Adaptations',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/'
          },
          neurovestibularBalance: {
            title: 'Neurovestibular Adaptation & G-Transition Balance',
            projectedRetention: neuroRetention,
            low: +(neuroRetention - 3.0).toFixed(1),
            high: +(neuroRetention + 2.5).toFixed(1),
            status: neuroStatus,
            rateDescription: 'Otolith-spinal reinterpretation in 0.38g gravity',
            citation: 'NASA Risk of Altered Sensorimotor Function',
            citationUrl: 'https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/'
          },
          sleepDebt: {
            title: 'Circadian Sleep Stability & Cumulative Deficit',
            projectedRetention: sleepDebtRetention,
            low: +(sleepDebtRetention - 4.0).toFixed(1),
            high: +(sleepDebtRetention + 3.0).toFixed(1),
            status: sleepStatus,
            rateDescription: 'Chronobiological disruption & microgravity sleep debt',
            citation: 'NASA Risk of Inadequate Sleep',
            citationUrl: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/'
          },
          cognitiveMood: {
            title: 'Cognitive Vigilance & Stress Resilience',
            projectedRetention: moodRetention,
            low: +(moodRetention - 3.5).toFixed(1),
            high: +(moodRetention + 3.0).toFixed(1),
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

  window.ForecastEngine = ForecastEngine;
})(window);
