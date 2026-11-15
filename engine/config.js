/**
 * LANDFALL v3.0 - Physiological Engine Configuration & Feature Constants (engine/config.js)
 * Authored for Tanishq's Physiological & Anomaly Engine.
 * Grounded in NASA Life Sciences Data System (LSDS-7 CBC & LSDS-8 CMP).
 */

export const ML_CONFIG = Object.freeze({
  version: '3.0.0-prod',
  modelName: 'AstroPhysio-MultiHorizon-v3',
  author: 'Tanishq (Physiological Engine Lead)',
  lastCalibrated: '2026-11-15',

  // Biological data feature definitions from NASA LSDS-7/8
  biomarkers: {
    wbc_k_uL: { baseline: 6.8, sd: 1.2, min: 3.8, max: 10.8, unit: '10^3/uL' },
    rbc_m_uL: { baseline: 4.75, sd: 0.35, min: 4.2, max: 5.8, unit: '10^6/uL' },
    hematocrit_pct: { baseline: 44.0, sd: 2.5, min: 38.5, max: 50.0, unit: '%' },
    platelets_k_uL: { baseline: 245.0, sd: 42.0, min: 140.0, max: 400.0, unit: '10^3/uL' },
    calcium_mg_dL: { baseline: 9.6, sd: 0.4, min: 8.6, max: 10.3, unit: 'mg/dL' },
    creatinine_mg_dL: { baseline: 1.15, sd: 0.18, min: 0.6, max: 1.35, unit: 'mg/dL' },
    bun_mg_dL: { baseline: 19.5, sd: 3.8, min: 7.0, max: 25.0, unit: 'mg/dL' },
    sodium_mmol_L: { baseline: 141.0, sd: 2.2, min: 135.0, max: 146.0, unit: 'mmol/L' },
    potassium_mmol_L: { baseline: 4.2, sd: 0.38, min: 3.5, max: 5.3, unit: 'mmol/L' },
  },

  // Anomaly vector thresholds
  thresholds: {
    mahalanobisCritical: 3.2,
    mahalanobisCaution: 2.1,
    circadianZAlarm: -2.5,
    co2CabinAlarmPpm: 4800,
    hrvDepressionAlarmMs: 25,
  },

  // Spaceflight loss coefficients (%/month in microgravity without countermeasures)
  lossRates: {
    boneDemineralizationMonthlyPct: 1.2,   // NASA HRP 1.0 - 1.5 %/mo
    muscleAtrophyMonthlyPct: 5.0,           // soleus/gastrocnemius
    aerobicCapacityMonthlyPct: 4.2,         // VO2 max degradation
    radiationDoseDailyMSv: 1.5,             // GCR + SPE galactic cosmic baseline
  },
});
