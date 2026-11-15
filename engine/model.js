/**
 * LANDFALL Model Weights (engine/model.js)
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 * 
 * Embeds model.json directly on window.LANDFALL_MODEL so the application works
 * 100% offline when opened directly via file:// in a browser without CORS fetch restrictions.
 */

(function(root) {
  'use strict';

  const modelData = {
  "metadata": {
    "model_name": "LANDFALL Landing-Day Readiness Forecaster",
    "model_type": "RidgeRegression",
    "version": "1.0.0",
    "training_date": "2026-11-14",
    "trainedOn": "synthetic data",
    "note": "Illustrative, not a clinical predictor",
    "author": "Tanishk (Physiological Engine) - NASA Space Apps 2026",
    "nasa_citations": {
      "bone": "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/",
      "fitness": "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
      "hazards": "https://www.nasa.gov/hrp/hazards/"
    }
  },
  "feature_columns": [
    "day_d",
    "days_remaining",
    "base_hr",
    "base_sbp",
    "base_temp",
    "base_sleep",
    "base_mood",
    "base_exercise",
    "base_balance",
    "hr_mean_7d",
    "sbp_mean_7d",
    "sleep_mean_7d",
    "mood_mean_7d",
    "exercise_mean_7d",
    "balance_mean_7d",
    "hr_mean_30d",
    "sleep_mean_30d",
    "mood_mean_30d",
    "exercise_mean_30d",
    "hr_drift_7d",
    "sbp_drift_7d",
    "sleep_drift_7d",
    "mood_drift_7d",
    "exercise_drift_7d",
    "hr_zscore_7d",
    "sleep_zscore_7d",
    "mood_zscore_7d",
    "cusum_sleep_debt",
    "cusum_hr_elevation",
    "symptom_count_14d",
    "co2_mean_14d",
    "planned_daily_exercise"
  ],
  "target_columns": [
    "target_bone",
    "target_muscle",
    "target_aerobic",
    "target_balance",
    "target_sleep",
    "target_mood"
  ],
  "status_thresholds": {
    "bone": {
      "nominal": 93.0,
      "caution": 88.0,
      "unit": "% retention"
    },
    "muscle": {
      "nominal": 91.0,
      "caution": 84.0,
      "unit": "% retention"
    },
    "aerobic": {
      "nominal": 92.0,
      "caution": 85.0,
      "unit": "% retention"
    },
    "balance": {
      "nominal": 86.0,
      "caution": 80.0,
      "unit": "% retention"
    },
    "sleep": {
      "nominal": 85.0,
      "caution": 72.0,
      "unit": "readiness score (0-100)"
    },
    "mood": {
      "nominal": 82.0,
      "caution": 72.0,
      "unit": "readiness score (0-100)"
    }
  },
  "scaler": {
    "mean": [
      90.0,
      90.0,
      65.108714,
      116.225357,
      36.589786,
      7.388571,
      3.960929,
      1.239786,
      99.109214,
      69.335,
      118.919223,
      7.225688,
      3.623268,
      1.20925,
      92.860071,
      69.049652,
      7.232875,
      3.632312,
      1.209982,
      4.226491,
      2.693973,
      -0.163027,
      -0.33725,
      -0.030616,
      1.650964,
      -0.39667,
      -1.110759,
      17.665679,
      237.039893,
      3.290179,
      2900.655893,
      0.988415
    ],
    "scale": [
      45.825757,
      45.825757,
      5.651428,
      5.920909,
      0.13904,
      0.519715,
      0.362345,
      0.174718,
      0.286611,
      7.822994,
      8.116854,
      0.723046,
      0.729243,
      0.193638,
      3.721468,
      6.881679,
      0.571906,
      0.567553,
      0.177836,
      5.635553,
      5.742938,
      0.579059,
      0.680074,
      0.106697,
      1.667444,
      1.388598,
      1.777184,
      15.264819,
      217.050898,
      3.001591,
      282.212552,
      0.397582
    ]
  },
  "coefficients": {
    "target_bone": [
      0.088085,
      -0.088085,
      0.000259,
      0.013025,
      -0.022937,
      0.040885,
      0.013841,
      0.057971,
      -0.026436,
      0.021495,
      -0.035675,
      0.078511,
      0.023672,
      0.154181,
      -0.046997,
      -0.024727,
      -0.107811,
      0.020211,
      0.098799,
      -0.014414,
      -0.044391,
      0.002166,
      -0.01153,
      -0.090032,
      0.020274,
      -0.083363,
      0.045555,
      -0.058106,
      0.020251,
      0.033967,
      0.034748,
      0.712403
    ],
    "target_muscle": [
      0.132189,
      -0.132189,
      0.188116,
      -0.002796,
      -0.057669,
      0.15216,
      0.111673,
      0.132731,
      0.037335,
      -0.114117,
      0.004214,
      -0.062632,
      -0.161624,
      0.468545,
      -0.147028,
      0.014464,
      -0.221084,
      0.118446,
      0.201677,
      -0.384177,
      0.070375,
      -0.002935,
      0.099345,
      -0.271385,
      0.255711,
      -0.00156,
      0.106466,
      -0.042095,
      -0.008103,
      0.028522,
      0.068482,
      1.238085
    ],
    "target_aerobic": [
      0.017893,
      -0.017893,
      0.198495,
      0.012126,
      -0.055394,
      0.19443,
      0.171255,
      0.052135,
      0.010352,
      -0.118345,
      0.046991,
      -0.207058,
      -0.177178,
      0.452955,
      -0.319876,
      -0.009599,
      -0.14288,
      0.035155,
      0.294137,
      -0.435832,
      0.101275,
      0.139331,
      0.1598,
      -0.255276,
      0.241643,
      -0.015684,
      0.066742,
      -0.032187,
      0.021541,
      0.048541,
      0.055996,
      1.07608
    ],
    "target_balance": [
      0.005057,
      -0.005057,
      0.095222,
      -0.015134,
      -0.024522,
      0.081717,
      -0.215767,
      -0.221148,
      0.017637,
      0.001306,
      0.027263,
      -0.082854,
      0.157758,
      0.347556,
      0.010942,
      -0.050498,
      -0.036574,
      0.095622,
      -0.224173,
      -0.076083,
      -0.003374,
      0.020201,
      -0.187741,
      -0.170496,
      0.062218,
      0.041462,
      0.012081,
      0.134474,
      -0.020712,
      -0.018796,
      -0.01544,
      0.241085
    ],
    "target_sleep": [
      0.53046,
      -0.53046,
      0.519836,
      0.043474,
      -0.00742,
      0.268521,
      -0.180735,
      -1.154417,
      0.198842,
      0.075717,
      -0.004976,
      1.651709,
      0.103323,
      1.376691,
      0.906993,
      -0.655315,
      -1.300043,
      0.239781,
      -0.149401,
      -0.435153,
      -0.197528,
      1.145441,
      -0.375198,
      -0.675025,
      0.254915,
      -0.47137,
      0.212387,
      0.311318,
      -0.003624,
      -0.127967,
      -0.223484,
      1.060686
    ],
    "target_mood": [
      -0.295154,
      0.295154,
      -0.263304,
      -0.262284,
      -0.020717,
      0.930749,
      -0.126233,
      -3.530906,
      -0.036409,
      -0.137075,
      0.24256,
      -1.005074,
      1.361547,
      3.166041,
      -0.806516,
      0.483876,
      0.301087,
      -0.241305,
      1.232058,
      -0.494171,
      0.100197,
      0.389244,
      0.974839,
      -1.607208,
      0.545569,
      0.638771,
      0.778792,
      0.894062,
      -0.933412,
      -0.025046,
      -0.375438,
      0.887431
    ]
  },
  "intercepts": {
    "target_bone": 96.483768,
    "target_muscle": 95.339812,
    "target_aerobic": 93.515098,
    "target_balance": 86.361996,
    "target_sleep": 95.601696,
    "target_mood": 85.929201
  },
  "uncertainty_offsets": {
    "target_bone": {
      "low_offset": -0.6921,
      "high_offset": 0.6889
    },
    "target_muscle": {
      "low_offset": -1.3381,
      "high_offset": 1.3731
    },
    "target_aerobic": {
      "low_offset": -1.2876,
      "high_offset": 1.3373
    },
    "target_balance": {
      "low_offset": -0.521,
      "high_offset": 0.6008
    },
    "target_sleep": {
      "low_offset": -1.2856,
      "high_offset": 1.5533
    },
    "target_mood": {
      "low_offset": -3.9821,
      "high_offset": 3.2207
    }
  }
};

  if (typeof window !== 'undefined') {
    window.LANDFALL_MODEL = modelData;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.LANDFALL_MODEL = modelData;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = modelData;
  }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this)));

export default (typeof globalThis !== 'undefined' ? globalThis.LANDFALL_MODEL : null);
