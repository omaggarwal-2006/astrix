/**
 * LANDFALL Production Data Engine (engine/data.js)
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 * 
 * Generated from simulator.py with calibrated astronaut baseline and
 * the canonical 180-day transit telemetry, including Day-40 sleep collapse sequence.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DataEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const ASTRONAUT_BASELINE = {
  "heartRate": 64,
  "bloodPressure": {
    "systolic": 116,
    "diastolic": 76
  },
  "temperature": 36.6,
  "sleepHours": 7.4,
  "mood": 4.2,
  "exerciseMinutes": 90,
  "boneMineralDensity": 100,
  "aerobicCapacityVO2": 44.5
};

  const transitDataset = [
  {
    "day": 1,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 6.7,
      "mood": 4.1,
      "exerciseMinutes": 89
    },
    "symptoms": [],
    "cabin": {
      "co2": 3046,
      "temperature": 21.0,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.55,
      "cumulativeDose": 1.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 2,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 82
      },
      "temperature": 36.8,
      "sleepHours": 6.5,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2844,
      "temperature": 22.0,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.17,
      "cumulativeDose": 2.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 3,
    "vitals": {
      "heartRate": 57,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 6.5,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2935,
      "temperature": 22.4,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.52,
      "cumulativeDose": 4.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 4,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 82
      },
      "temperature": 36.8,
      "sleepHours": 6.9,
      "mood": 3.8,
      "exerciseMinutes": 87
    },
    "symptoms": [],
    "cabin": {
      "co2": 2718,
      "temperature": 21.4,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.09,
      "cumulativeDose": 5.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 5,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 98,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 6.7,
      "mood": 3.9,
      "exerciseMinutes": 89
    },
    "symptoms": [],
    "cabin": {
      "co2": 2808,
      "temperature": 22.0,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.18,
      "cumulativeDose": 6.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 6,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 3.8,
      "exerciseMinutes": 77
    },
    "symptoms": [],
    "cabin": {
      "co2": 2761,
      "temperature": 21.0,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.38,
      "cumulativeDose": 7.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 7,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 100,
        "diastolic": 77
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 3058,
      "temperature": 21.3,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.52,
      "cumulativeDose": 9.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 8,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 82
      },
      "temperature": 36.6,
      "sleepHours": 7.5,
      "mood": 4.2,
      "exerciseMinutes": 86
    },
    "symptoms": [],
    "cabin": {
      "co2": 2819,
      "temperature": 21.3,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 10.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 9,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2791,
      "temperature": 22.1,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.67,
      "cumulativeDose": 12.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 10,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 79
      },
      "temperature": 36.6,
      "sleepHours": 6.5,
      "mood": 4.0,
      "exerciseMinutes": 77
    },
    "symptoms": [],
    "cabin": {
      "co2": 2903,
      "temperature": 21.8,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.78,
      "cumulativeDose": 14.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 11,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 80
      },
      "temperature": 36.8,
      "sleepHours": 7.1,
      "mood": 4.2,
      "exerciseMinutes": 76
    },
    "symptoms": [],
    "cabin": {
      "co2": 2619,
      "temperature": 21.4,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.25,
      "cumulativeDose": 15.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 12,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 77
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 3.8,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2871,
      "temperature": 21.3,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.22,
      "cumulativeDose": 16.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 13,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 7.1,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2808,
      "temperature": 22.2,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.5,
      "cumulativeDose": 18.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 14,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 7.5,
      "mood": 3.8,
      "exerciseMinutes": 75
    },
    "symptoms": [],
    "cabin": {
      "co2": 2838,
      "temperature": 20.9,
      "noise": 55
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.42,
      "cumulativeDose": 19.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 15,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 80
      },
      "temperature": 36.8,
      "sleepHours": 7.5,
      "mood": 4.0,
      "exerciseMinutes": 69
    },
    "symptoms": [],
    "cabin": {
      "co2": 2759,
      "temperature": 21.3,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.27,
      "cumulativeDose": 20.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 16,
    "vitals": {
      "heartRate": 59,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 7.3,
      "mood": 3.7,
      "exerciseMinutes": 81
    },
    "symptoms": [],
    "cabin": {
      "co2": 2735,
      "temperature": 21.5,
      "noise": 56
    },
    "immune": {
      "rash": true,
      "coldSore": true,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.67,
      "cumulativeDose": 22.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 17,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 4.0,
      "exerciseMinutes": 71
    },
    "symptoms": [],
    "cabin": {
      "co2": 2773,
      "temperature": 21.4,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.6,
      "cumulativeDose": 24.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 18,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 4.0,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2856,
      "temperature": 21.8,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.81,
      "cumulativeDose": 25.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 19,
    "vitals": {
      "heartRate": 59,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 83
      },
      "temperature": 36.6,
      "sleepHours": 6.4,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2655,
      "temperature": 20.9,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.62,
      "cumulativeDose": 27.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 20,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 6.5,
      "mood": 3.9,
      "exerciseMinutes": 83
    },
    "symptoms": [],
    "cabin": {
      "co2": 2548,
      "temperature": 21.9,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.61,
      "cumulativeDose": 29.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 21,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 6.8,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2917,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.63,
      "cumulativeDose": 30.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 22,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 79
      },
      "temperature": 36.5,
      "sleepHours": 7.5,
      "mood": 4.2,
      "exerciseMinutes": 87
    },
    "symptoms": [],
    "cabin": {
      "co2": 2695,
      "temperature": 21.7,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.59,
      "cumulativeDose": 32.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 23,
    "vitals": {
      "heartRate": 57,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 75
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2914,
      "temperature": 21.6,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 33.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 24,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 81
      },
      "temperature": 36.9,
      "sleepHours": 6.8,
      "mood": 4.0,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2670,
      "temperature": 22.1,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.57,
      "cumulativeDose": 35.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 25,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 77
      },
      "temperature": 36.8,
      "sleepHours": 6.8,
      "mood": 3.6,
      "exerciseMinutes": 87
    },
    "symptoms": [],
    "cabin": {
      "co2": 2949,
      "temperature": 21.1,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": true,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.41,
      "cumulativeDose": 36.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 26,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 3.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2800,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.66,
      "cumulativeDose": 38.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 27,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 83
      },
      "temperature": 36.7,
      "sleepHours": 7.4,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2689,
      "temperature": 20.9,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.61,
      "cumulativeDose": 40.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 28,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 7.9,
      "mood": 3.7,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2889,
      "temperature": 21.4,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.49,
      "cumulativeDose": 41.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 29,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 7.6,
      "mood": 4.1,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2840,
      "temperature": 21.8,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.43,
      "cumulativeDose": 43.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 30,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 78
      },
      "temperature": 36.9,
      "sleepHours": 7.3,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2689,
      "temperature": 21.3,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.6,
      "cumulativeDose": 44.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 31,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 82
      },
      "temperature": 36.9,
      "sleepHours": 7.2,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2947,
      "temperature": 21.4,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.42,
      "cumulativeDose": 46.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 32,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 99,
        "diastolic": 77
      },
      "temperature": 36.7,
      "sleepHours": 7.5,
      "mood": 4.0,
      "exerciseMinutes": 83
    },
    "symptoms": [],
    "cabin": {
      "co2": 2694,
      "temperature": 21.4,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.46,
      "cumulativeDose": 47.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 33,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 80
      },
      "temperature": 36.9,
      "sleepHours": 7.1,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2746,
      "temperature": 21.5,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.45,
      "cumulativeDose": 49.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 34,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 82
      },
      "temperature": 36.8,
      "sleepHours": 7.1,
      "mood": 3.9,
      "exerciseMinutes": 77
    },
    "symptoms": [],
    "cabin": {
      "co2": 2975,
      "temperature": 21.8,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.19,
      "cumulativeDose": 50.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 35,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 6.8,
      "mood": 4.0,
      "exerciseMinutes": 67
    },
    "symptoms": [],
    "cabin": {
      "co2": 2888,
      "temperature": 21.9,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 51.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 36,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 3.9,
      "exerciseMinutes": 79
    },
    "symptoms": [],
    "cabin": {
      "co2": 2820,
      "temperature": 21.7,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.54,
      "cumulativeDose": 53.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 37,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.1,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2761,
      "temperature": 21.8,
      "noise": 64
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.53,
      "cumulativeDose": 54.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 38,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 3.9,
      "exerciseMinutes": 86
    },
    "symptoms": [],
    "cabin": {
      "co2": 2769,
      "temperature": 21.5,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.44,
      "cumulativeDose": 56.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 39,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.0,
      "mood": 3.9,
      "exerciseMinutes": 87
    },
    "symptoms": [],
    "cabin": {
      "co2": 2769,
      "temperature": 21.7,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.63,
      "cumulativeDose": 57.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 40,
    "vitals": {
      "heartRate": 74,
      "bloodPressure": {
        "systolic": 126,
        "diastolic": 83
      },
      "temperature": 36.8,
      "sleepHours": 4.2,
      "mood": 2.8,
      "exerciseMinutes": 45
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 5200,
      "temperature": 21.8,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.9
    },
    "radiation": {
      "dailyDose": 1.68,
      "cumulativeDose": 59.5
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 41,
    "vitals": {
      "heartRate": 73,
      "bloodPressure": {
        "systolic": 125,
        "diastolic": 83
      },
      "temperature": 36.7,
      "sleepHours": 4.4,
      "mood": 2.9,
      "exerciseMinutes": 48
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 5053,
      "temperature": 20.9,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.8
    },
    "radiation": {
      "dailyDose": 1.31,
      "cumulativeDose": 60.8
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 42,
    "vitals": {
      "heartRate": 73,
      "bloodPressure": {
        "systolic": 125,
        "diastolic": 82
      },
      "temperature": 36.8,
      "sleepHours": 4.6,
      "mood": 3.0,
      "exerciseMinutes": 50
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4907,
      "temperature": 21.8,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.7
    },
    "radiation": {
      "dailyDose": 1.35,
      "cumulativeDose": 62.1
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 43,
    "vitals": {
      "heartRate": 72,
      "bloodPressure": {
        "systolic": 124,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 4.8,
      "mood": 3.0,
      "exerciseMinutes": 53
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4760,
      "temperature": 21.1,
      "noise": 57
    },
    "immune": {
      "rash": true,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.6
    },
    "radiation": {
      "dailyDose": 1.55,
      "cumulativeDose": 63.7
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 44,
    "vitals": {
      "heartRate": 72,
      "bloodPressure": {
        "systolic": 124,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 4.9,
      "mood": 3.1,
      "exerciseMinutes": 56
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4613,
      "temperature": 21.1,
      "noise": 65
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.5
    },
    "radiation": {
      "dailyDose": 1.35,
      "cumulativeDose": 65.0
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 45,
    "vitals": {
      "heartRate": 71,
      "bloodPressure": {
        "systolic": 123,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 5.1,
      "mood": 3.2,
      "exerciseMinutes": 58
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4467,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.4
    },
    "radiation": {
      "dailyDose": 1.46,
      "cumulativeDose": 66.5
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 46,
    "vitals": {
      "heartRate": 70,
      "bloodPressure": {
        "systolic": 123,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 5.3,
      "mood": 3.3,
      "exerciseMinutes": 61
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4320,
      "temperature": 21.5,
      "noise": 66
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.3
    },
    "radiation": {
      "dailyDose": 1.35,
      "cumulativeDose": 67.8
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 47,
    "vitals": {
      "heartRate": 70,
      "bloodPressure": {
        "systolic": 122,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 5.5,
      "mood": 3.4,
      "exerciseMinutes": 64
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4173,
      "temperature": 22.6,
      "noise": 64
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.2
    },
    "radiation": {
      "dailyDose": 1.21,
      "cumulativeDose": 69.1
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 48,
    "vitals": {
      "heartRate": 69,
      "bloodPressure": {
        "systolic": 122,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 5.7,
      "mood": 3.4,
      "exerciseMinutes": 66
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 4027,
      "temperature": 21.7,
      "noise": 59
    },
    "immune": {
      "rash": true,
      "coldSore": true,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.1
    },
    "radiation": {
      "dailyDose": 1.5,
      "cumulativeDose": 70.6
    },
    "bodyMapDrift": {
      "head": "alarm",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "caution"
    }
  },
  {
    "day": 49,
    "vitals": {
      "heartRate": 69,
      "bloodPressure": {
        "systolic": 121,
        "diastolic": 79
      },
      "temperature": 36.5,
      "sleepHours": 5.9,
      "mood": 3.5,
      "exerciseMinutes": 69
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3880,
      "temperature": 21.6,
      "noise": 66
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 3.0
    },
    "radiation": {
      "dailyDose": 1.45,
      "cumulativeDose": 72.0
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 50,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 121,
        "diastolic": 79
      },
      "temperature": 36.6,
      "sleepHours": 6.1,
      "mood": 3.6,
      "exerciseMinutes": 72
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3733,
      "temperature": 21.5,
      "noise": 59
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.9
    },
    "radiation": {
      "dailyDose": 1.05,
      "cumulativeDose": 73.1
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 51,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 120,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 6.3,
      "mood": 3.7,
      "exerciseMinutes": 74
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3587,
      "temperature": 21.8,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.8
    },
    "radiation": {
      "dailyDose": 1.49,
      "cumulativeDose": 74.5
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 52,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 120,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 6.4,
      "mood": 3.8,
      "exerciseMinutes": 77
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3440,
      "temperature": 21.7,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.7
    },
    "radiation": {
      "dailyDose": 1.35,
      "cumulativeDose": 75.9
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 53,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 119,
        "diastolic": 78
      },
      "temperature": 36.5,
      "sleepHours": 6.6,
      "mood": 3.8,
      "exerciseMinutes": 80
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3293,
      "temperature": 21.1,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.6
    },
    "radiation": {
      "dailyDose": 1.38,
      "cumulativeDose": 77.3
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 54,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 119,
        "diastolic": 77
      },
      "temperature": 36.8,
      "sleepHours": 6.8,
      "mood": 3.9,
      "exerciseMinutes": 82
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3147,
      "temperature": 20.8,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.5
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 78.6
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 55,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 118,
        "diastolic": 77
      },
      "temperature": 36.6,
      "sleepHours": 7.0,
      "mood": 4.0,
      "exerciseMinutes": 85
    },
    "symptoms": [
      "headache",
      "eye_strain"
    ],
    "cabin": {
      "co2": 3000,
      "temperature": 21.6,
      "noise": 64
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.4
    },
    "radiation": {
      "dailyDose": 1.27,
      "cumulativeDose": 79.8
    },
    "bodyMapDrift": {
      "head": "caution",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 56,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 112,
        "diastolic": 84
      },
      "temperature": 36.8,
      "sleepHours": 7.9,
      "mood": 3.0,
      "exerciseMinutes": 79
    },
    "symptoms": [],
    "cabin": {
      "co2": 2819,
      "temperature": 21.2,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.7,
      "cumulativeDose": 81.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 57,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 83
      },
      "temperature": 36.7,
      "sleepHours": 7.6,
      "mood": 3.5,
      "exerciseMinutes": 70
    },
    "symptoms": [],
    "cabin": {
      "co2": 3167,
      "temperature": 21.3,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.54,
      "cumulativeDose": 83.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 58,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 112,
        "diastolic": 83
      },
      "temperature": 36.9,
      "sleepHours": 7.2,
      "mood": 3.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2505,
      "temperature": 20.9,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.24,
      "cumulativeDose": 84.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 59,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 3.7,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2747,
      "temperature": 21.3,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.49,
      "cumulativeDose": 85.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 60,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 112,
        "diastolic": 79
      },
      "temperature": 36.6,
      "sleepHours": 6.9,
      "mood": 3.6,
      "exerciseMinutes": 79
    },
    "symptoms": [],
    "cabin": {
      "co2": 2863,
      "temperature": 21.1,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.26,
      "cumulativeDose": 87.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 61,
    "vitals": {
      "heartRate": 70,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 87
      },
      "temperature": 36.7,
      "sleepHours": 7.2,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2916,
      "temperature": 21.0,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.5,
      "cumulativeDose": 88.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 62,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 7.8,
      "mood": 3.5,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2749,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.6,
      "cumulativeDose": 90.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 63,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 7.1,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2729,
      "temperature": 21.2,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.52,
      "cumulativeDose": 91.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 64,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 7.7,
      "mood": 3.5,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2803,
      "temperature": 21.9,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.32,
      "cumulativeDose": 93.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 65,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 7.1,
      "mood": 3.4,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2618,
      "temperature": 20.7,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.26,
      "cumulativeDose": 94.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 66,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 80
      },
      "temperature": 36.9,
      "sleepHours": 6.7,
      "mood": 3.8,
      "exerciseMinutes": 78
    },
    "symptoms": [],
    "cabin": {
      "co2": 2685,
      "temperature": 20.8,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.68,
      "cumulativeDose": 96.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 67,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 7.0,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2532,
      "temperature": 21.3,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.36,
      "cumulativeDose": 97.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 68,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 78
      },
      "temperature": 36.5,
      "sleepHours": 6.8,
      "mood": 3.4,
      "exerciseMinutes": 76
    },
    "symptoms": [],
    "cabin": {
      "co2": 2965,
      "temperature": 21.0,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.28,
      "cumulativeDose": 98.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 69,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 83
      },
      "temperature": 36.8,
      "sleepHours": 7.0,
      "mood": 3.5,
      "exerciseMinutes": 83
    },
    "symptoms": [],
    "cabin": {
      "co2": 2946,
      "temperature": 21.1,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 99.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 70,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 6.9,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2669,
      "temperature": 21.7,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.61,
      "cumulativeDose": 101.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 71,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 7.5,
      "mood": 4.0,
      "exerciseMinutes": 85
    },
    "symptoms": [],
    "cabin": {
      "co2": 2724,
      "temperature": 21.5,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.33,
      "cumulativeDose": 102.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 72,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 100,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 7.4,
      "mood": 3.8,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 3020,
      "temperature": 21.7,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.45,
      "cumulativeDose": 104.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 73,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 76
      },
      "temperature": 36.7,
      "sleepHours": 7.5,
      "mood": 4.0,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2936,
      "temperature": 21.8,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.62,
      "cumulativeDose": 105.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 74,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 79
      },
      "temperature": 36.9,
      "sleepHours": 7.4,
      "mood": 4.0,
      "exerciseMinutes": 77
    },
    "symptoms": [],
    "cabin": {
      "co2": 2812,
      "temperature": 22.0,
      "noise": 62
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.65,
      "cumulativeDose": 107.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 75,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 100,
        "diastolic": 80
      },
      "temperature": 36.9,
      "sleepHours": 7.8,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2906,
      "temperature": 21.7,
      "noise": 59
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.61,
      "cumulativeDose": 109.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 76,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.3,
      "mood": 4.1,
      "exerciseMinutes": 74
    },
    "symptoms": [],
    "cabin": {
      "co2": 2906,
      "temperature": 21.8,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.55,
      "cumulativeDose": 110.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 77,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 7.4,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 3008,
      "temperature": 21.1,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.42,
      "cumulativeDose": 112.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 78,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2679,
      "temperature": 21.1,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.58,
      "cumulativeDose": 113.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 79,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 6.9,
      "mood": 4.0,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2776,
      "temperature": 22.1,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.61,
      "cumulativeDose": 115.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 80,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 3.9,
      "exerciseMinutes": 71
    },
    "symptoms": [],
    "cabin": {
      "co2": 3038,
      "temperature": 21.9,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.54,
      "cumulativeDose": 116.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 81,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 79
      },
      "temperature": 36.6,
      "sleepHours": 6.5,
      "mood": 3.5,
      "exerciseMinutes": 81
    },
    "symptoms": [],
    "cabin": {
      "co2": 2714,
      "temperature": 21.8,
      "noise": 52
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.32,
      "cumulativeDose": 118.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 82,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 7.1,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2797,
      "temperature": 21.0,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.37,
      "cumulativeDose": 119.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 83,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 80
      },
      "temperature": 36.8,
      "sleepHours": 7.2,
      "mood": 3.6,
      "exerciseMinutes": 81
    },
    "symptoms": [],
    "cabin": {
      "co2": 2868,
      "temperature": 21.3,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.4,
      "cumulativeDose": 121.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 84,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 100,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 7.2,
      "mood": 3.7,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2740,
      "temperature": 20.9,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.66,
      "cumulativeDose": 122.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 85,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 83
      },
      "temperature": 36.7,
      "sleepHours": 7.9,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2912,
      "temperature": 22.0,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.55,
      "cumulativeDose": 124.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 86,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 75
      },
      "temperature": 36.6,
      "sleepHours": 7.7,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2946,
      "temperature": 22.2,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 125.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 87,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 8.0,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2981,
      "temperature": 22.0,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 127.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 88,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 4.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2787,
      "temperature": 20.5,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.27,
      "cumulativeDose": 128.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 89,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.8,
      "mood": 4.1,
      "exerciseMinutes": 87
    },
    "symptoms": [],
    "cabin": {
      "co2": 2788,
      "temperature": 21.9,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.5,
      "cumulativeDose": 129.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 90,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 83
      },
      "temperature": 36.8,
      "sleepHours": 6.8,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 3090,
      "temperature": 21.7,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.43,
      "cumulativeDose": 131.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 91,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.8,
      "mood": 4.4,
      "exerciseMinutes": 89
    },
    "symptoms": [],
    "cabin": {
      "co2": 2946,
      "temperature": 21.6,
      "noise": 64
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.69,
      "cumulativeDose": 132.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 92,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 79
      },
      "temperature": 36.9,
      "sleepHours": 7.9,
      "mood": 4.4,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2925,
      "temperature": 20.8,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 134.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 93,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 81
      },
      "temperature": 36.5,
      "sleepHours": 7.3,
      "mood": 4.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2863,
      "temperature": 21.8,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.36,
      "cumulativeDose": 135.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 94,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 76
      },
      "temperature": 36.9,
      "sleepHours": 8.1,
      "mood": 4.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2644,
      "temperature": 21.6,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.4,
      "cumulativeDose": 136.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 95,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 99,
        "diastolic": 83
      },
      "temperature": 36.6,
      "sleepHours": 7.5,
      "mood": 4.5,
      "exerciseMinutes": 86
    },
    "symptoms": [],
    "cabin": {
      "co2": 2615,
      "temperature": 21.1,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.59,
      "cumulativeDose": 138.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 96,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 7.0,
      "mood": 4.3,
      "exerciseMinutes": 88
    },
    "symptoms": [],
    "cabin": {
      "co2": 2703,
      "temperature": 21.6,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.25,
      "cumulativeDose": 139.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 97,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 7.1,
      "mood": 4.2,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2748,
      "temperature": 21.6,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.37,
      "cumulativeDose": 141.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 98,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 100,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.5,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2787,
      "temperature": 21.2,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.77,
      "cumulativeDose": 142.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 99,
    "vitals": {
      "heartRate": 57,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 84
      },
      "temperature": 36.8,
      "sleepHours": 7.1,
      "mood": 4.3,
      "exerciseMinutes": 88
    },
    "symptoms": [],
    "cabin": {
      "co2": 2811,
      "temperature": 20.8,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.31,
      "cumulativeDose": 144.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 100,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.5,
      "mood": 4.1,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2684,
      "temperature": 21.4,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.67,
      "cumulativeDose": 145.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 101,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 7.5,
      "mood": 4.1,
      "exerciseMinutes": 88
    },
    "symptoms": [],
    "cabin": {
      "co2": 2815,
      "temperature": 21.8,
      "noise": 59
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.27,
      "cumulativeDose": 147.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 102,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 6.9,
      "mood": 3.9,
      "exerciseMinutes": 86
    },
    "symptoms": [],
    "cabin": {
      "co2": 2678,
      "temperature": 21.7,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.43,
      "cumulativeDose": 148.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 103,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 99,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 4.2,
      "exerciseMinutes": 78
    },
    "symptoms": [],
    "cabin": {
      "co2": 2959,
      "temperature": 22.0,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.41,
      "cumulativeDose": 150.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 104,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 4.2,
      "exerciseMinutes": 79
    },
    "symptoms": [],
    "cabin": {
      "co2": 2768,
      "temperature": 22.2,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.45,
      "cumulativeDose": 151.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 105,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 81
      },
      "temperature": 36.5,
      "sleepHours": 8.0,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2790,
      "temperature": 22.0,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.39,
      "cumulativeDose": 152.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 106,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 6.8,
      "mood": 4.0,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2830,
      "temperature": 21.4,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.43,
      "cumulativeDose": 154.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 107,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 82
      },
      "temperature": 36.9,
      "sleepHours": 6.8,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2914,
      "temperature": 20.9,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.44,
      "cumulativeDose": 155.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 108,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 6.3,
      "mood": 3.6,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2562,
      "temperature": 20.5,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.52,
      "cumulativeDose": 157.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 109,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 7.2,
      "mood": 3.9,
      "exerciseMinutes": 58
    },
    "symptoms": [],
    "cabin": {
      "co2": 2977,
      "temperature": 21.4,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.25,
      "cumulativeDose": 158.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 110,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 76
      },
      "temperature": 36.6,
      "sleepHours": 7.7,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2831,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 159.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 111,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 8.2,
      "mood": 3.9,
      "exerciseMinutes": 74
    },
    "symptoms": [],
    "cabin": {
      "co2": 2807,
      "temperature": 20.9,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.29,
      "cumulativeDose": 161.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 112,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 4.0,
      "exerciseMinutes": 83
    },
    "symptoms": [],
    "cabin": {
      "co2": 2828,
      "temperature": 20.6,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.47,
      "cumulativeDose": 162.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 113,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.5,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2732,
      "temperature": 21.4,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.24,
      "cumulativeDose": 163.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 114,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 4.3,
      "exerciseMinutes": 79
    },
    "symptoms": [],
    "cabin": {
      "co2": 3066,
      "temperature": 21.9,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.34,
      "cumulativeDose": 165.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 115,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 82
      },
      "temperature": 36.8,
      "sleepHours": 7.4,
      "mood": 4.3,
      "exerciseMinutes": 68
    },
    "symptoms": [],
    "cabin": {
      "co2": 2852,
      "temperature": 21.9,
      "noise": 57
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 166.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 116,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 80
      },
      "temperature": 36.5,
      "sleepHours": 7.2,
      "mood": 4.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2492,
      "temperature": 21.1,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.33,
      "cumulativeDose": 168.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 117,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 4.5,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2549,
      "temperature": 22.0,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.42,
      "cumulativeDose": 169.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 118,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 99,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.7,
      "mood": 4.2,
      "exerciseMinutes": 81
    },
    "symptoms": [],
    "cabin": {
      "co2": 2646,
      "temperature": 21.7,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.37,
      "cumulativeDose": 170.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 119,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 4.5,
      "exerciseMinutes": 77
    },
    "symptoms": [],
    "cabin": {
      "co2": 2697,
      "temperature": 21.3,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.58,
      "cumulativeDose": 172.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 120,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.6,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2804,
      "temperature": 21.3,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.37,
      "cumulativeDose": 173.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 121,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.1,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2555,
      "temperature": 21.7,
      "noise": 59
    },
    "immune": {
      "rash": true,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 19.51,
      "cumulativeDose": 193.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 122,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 7.6,
      "mood": 4.3,
      "exerciseMinutes": 88
    },
    "symptoms": [],
    "cabin": {
      "co2": 2742,
      "temperature": 21.7,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.6,
      "cumulativeDose": 194.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 123,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 79
      },
      "temperature": 36.9,
      "sleepHours": 7.2,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2785,
      "temperature": 22.0,
      "noise": 63
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.56,
      "cumulativeDose": 196.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 124,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 81
      },
      "temperature": 36.9,
      "sleepHours": 6.9,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2719,
      "temperature": 22.0,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.58,
      "cumulativeDose": 197.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 125,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 6.9,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2499,
      "temperature": 21.5,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.28,
      "cumulativeDose": 199.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 126,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 82
      },
      "temperature": 36.5,
      "sleepHours": 6.7,
      "mood": 4.0,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2681,
      "temperature": 21.2,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.32,
      "cumulativeDose": 200.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 127,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 77
      },
      "temperature": 36.6,
      "sleepHours": 7.0,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2974,
      "temperature": 21.2,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.27,
      "cumulativeDose": 201.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 128,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 80
      },
      "temperature": 36.8,
      "sleepHours": 7.3,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2767,
      "temperature": 21.2,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.64,
      "cumulativeDose": 203.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 129,
    "vitals": {
      "heartRate": 59,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 80
      },
      "temperature": 36.8,
      "sleepHours": 7.7,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2936,
      "temperature": 21.7,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.46,
      "cumulativeDose": 204.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 130,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 97,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.9,
      "mood": 4.3,
      "exerciseMinutes": 84
    },
    "symptoms": [],
    "cabin": {
      "co2": 2935,
      "temperature": 22.1,
      "noise": 51
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.31,
      "cumulativeDose": 206.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 131,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 76
      },
      "temperature": 36.9,
      "sleepHours": 7.3,
      "mood": 4.4,
      "exerciseMinutes": 73
    },
    "symptoms": [],
    "cabin": {
      "co2": 3101,
      "temperature": 21.2,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.28,
      "cumulativeDose": 207.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 132,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 78
      },
      "temperature": 36.9,
      "sleepHours": 6.9,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2929,
      "temperature": 21.5,
      "noise": 53
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.47,
      "cumulativeDose": 209.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 133,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 81
      },
      "temperature": 36.5,
      "sleepHours": 7.3,
      "mood": 4.0,
      "exerciseMinutes": 78
    },
    "symptoms": [],
    "cabin": {
      "co2": 2712,
      "temperature": 21.4,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.44,
      "cumulativeDose": 210.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 134,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 79
      },
      "temperature": 36.9,
      "sleepHours": 7.6,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2905,
      "temperature": 21.4,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.49,
      "cumulativeDose": 211.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 135,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 4.3,
      "exerciseMinutes": 73
    },
    "symptoms": [],
    "cabin": {
      "co2": 2815,
      "temperature": 21.5,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 213.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 136,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 80
      },
      "temperature": 36.9,
      "sleepHours": 7.8,
      "mood": 4.2,
      "exerciseMinutes": 79
    },
    "symptoms": [],
    "cabin": {
      "co2": 2920,
      "temperature": 21.2,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.18,
      "cumulativeDose": 214.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 137,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 78
      },
      "temperature": 36.7,
      "sleepHours": 7.4,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2959,
      "temperature": 21.9,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.46,
      "cumulativeDose": 216.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 138,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 7.8,
      "mood": 4.5,
      "exerciseMinutes": 88
    },
    "symptoms": [],
    "cabin": {
      "co2": 2985,
      "temperature": 21.2,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.38,
      "cumulativeDose": 217.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 139,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 7.6,
      "mood": 4.4,
      "exerciseMinutes": 77
    },
    "symptoms": [],
    "cabin": {
      "co2": 2671,
      "temperature": 21.6,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.63,
      "cumulativeDose": 219.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 140,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 78
      },
      "temperature": 36.5,
      "sleepHours": 7.5,
      "mood": 4.5,
      "exerciseMinutes": 86
    },
    "symptoms": [],
    "cabin": {
      "co2": 2731,
      "temperature": 21.4,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.18,
      "cumulativeDose": 220.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 141,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 76
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 4.3,
      "exerciseMinutes": 82
    },
    "symptoms": [],
    "cabin": {
      "co2": 2690,
      "temperature": 21.0,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.47,
      "cumulativeDose": 221.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 142,
    "vitals": {
      "heartRate": 60,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 76
      },
      "temperature": 36.7,
      "sleepHours": 6.9,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2524,
      "temperature": 21.5,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.5,
      "cumulativeDose": 223.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 143,
    "vitals": {
      "heartRate": 59,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 7.0,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 3015,
      "temperature": 21.1,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.32,
      "cumulativeDose": 224.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 144,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 76
      },
      "temperature": 36.7,
      "sleepHours": 6.5,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2704,
      "temperature": 21.9,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": true,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.43,
      "cumulativeDose": 226.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 145,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 114,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 6.6,
      "mood": 3.6,
      "exerciseMinutes": 66
    },
    "symptoms": [],
    "cabin": {
      "co2": 2652,
      "temperature": 21.7,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.39,
      "cumulativeDose": 227.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 146,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 79
      },
      "temperature": 36.7,
      "sleepHours": 6.7,
      "mood": 4.0,
      "exerciseMinutes": 78
    },
    "symptoms": [],
    "cabin": {
      "co2": 2699,
      "temperature": 21.9,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 228.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 147,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 83
      },
      "temperature": 36.9,
      "sleepHours": 7.6,
      "mood": 3.9,
      "exerciseMinutes": 84
    },
    "symptoms": [],
    "cabin": {
      "co2": 2917,
      "temperature": 21.6,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.55,
      "cumulativeDose": 230.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 148,
    "vitals": {
      "heartRate": 58,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 83
      },
      "temperature": 36.7,
      "sleepHours": 7.5,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2726,
      "temperature": 21.8,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.61,
      "cumulativeDose": 232.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 149,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 112,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 4.0,
      "exerciseMinutes": 71
    },
    "symptoms": [],
    "cabin": {
      "co2": 2923,
      "temperature": 21.2,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.62,
      "cumulativeDose": 233.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 150,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 77
      },
      "temperature": 36.7,
      "sleepHours": 7.3,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2848,
      "temperature": 21.9,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.2,
      "cumulativeDose": 234.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 151,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 77
      },
      "temperature": 36.6,
      "sleepHours": 7.2,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 3111,
      "temperature": 20.9,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 236.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 152,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 79
      },
      "temperature": 36.6,
      "sleepHours": 7.4,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2776,
      "temperature": 21.9,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.55,
      "cumulativeDose": 237.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 153,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 79
      },
      "temperature": 36.6,
      "sleepHours": 7.6,
      "mood": 4.0,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2880,
      "temperature": 21.8,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.68,
      "cumulativeDose": 239.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 154,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 78
      },
      "temperature": 36.9,
      "sleepHours": 7.6,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2707,
      "temperature": 21.5,
      "noise": 62
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.62,
      "cumulativeDose": 241.2
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 155,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 77
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 4.1,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2802,
      "temperature": 21.3,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.37,
      "cumulativeDose": 242.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 156,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 80
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 4.2,
      "exerciseMinutes": 84
    },
    "symptoms": [],
    "cabin": {
      "co2": 2990,
      "temperature": 21.2,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.46,
      "cumulativeDose": 244.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 157,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 7.3,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2578,
      "temperature": 21.2,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.56,
      "cumulativeDose": 245.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 158,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 107,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 4.3,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2833,
      "temperature": 21.6,
      "noise": 64
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.53,
      "cumulativeDose": 247.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 159,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2796,
      "temperature": 21.8,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.49,
      "cumulativeDose": 248.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 160,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 99,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 6.9,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2737,
      "temperature": 22.0,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.41,
      "cumulativeDose": 250.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 161,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 80
      },
      "temperature": 36.6,
      "sleepHours": 7.4,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 3004,
      "temperature": 21.6,
      "noise": 58
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.44,
      "cumulativeDose": 251.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 162,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 98,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 7.4,
      "mood": 4.0,
      "exerciseMinutes": 68
    },
    "symptoms": [],
    "cabin": {
      "co2": 2795,
      "temperature": 21.4,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.63,
      "cumulativeDose": 253.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 163,
    "vitals": {
      "heartRate": 68,
      "bloodPressure": {
        "systolic": 103,
        "diastolic": 82
      },
      "temperature": 36.9,
      "sleepHours": 7.9,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2860,
      "temperature": 21.4,
      "noise": 61
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.44,
      "cumulativeDose": 254.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 164,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 81
      },
      "temperature": 36.6,
      "sleepHours": 8.3,
      "mood": 4.2,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2974,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.48,
      "cumulativeDose": 256.0
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 165,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.7,
      "mood": 4.4,
      "exerciseMinutes": 83
    },
    "symptoms": [],
    "cabin": {
      "co2": 2834,
      "temperature": 21.7,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.31,
      "cumulativeDose": 257.3
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 166,
    "vitals": {
      "heartRate": 69,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 6.9,
      "mood": 4.5,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2929,
      "temperature": 21.2,
      "noise": 53
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.41,
      "cumulativeDose": 258.7
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 167,
    "vitals": {
      "heartRate": 71,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 81
      },
      "temperature": 36.9,
      "sleepHours": 6.7,
      "mood": 3.9,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2861,
      "temperature": 21.4,
      "noise": 52
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.35,
      "cumulativeDose": 260.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 168,
    "vitals": {
      "heartRate": 69,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 81
      },
      "temperature": 36.7,
      "sleepHours": 7.0,
      "mood": 4.2,
      "exerciseMinutes": 62
    },
    "symptoms": [],
    "cabin": {
      "co2": 2812,
      "temperature": 21.4,
      "noise": 57
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.49,
      "cumulativeDose": 261.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 169,
    "vitals": {
      "heartRate": 66,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 82
      },
      "temperature": 36.9,
      "sleepHours": 6.7,
      "mood": 3.8,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2837,
      "temperature": 21.7,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.32,
      "cumulativeDose": 262.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 170,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 104,
        "diastolic": 80
      },
      "temperature": 36.7,
      "sleepHours": 6.9,
      "mood": 3.7,
      "exerciseMinutes": 68
    },
    "symptoms": [],
    "cabin": {
      "co2": 2665,
      "temperature": 21.5,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.25,
      "cumulativeDose": 264.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 171,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 101,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 6.7,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2841,
      "temperature": 21.1,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.41,
      "cumulativeDose": 265.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 172,
    "vitals": {
      "heartRate": 61,
      "bloodPressure": {
        "systolic": 111,
        "diastolic": 82
      },
      "temperature": 36.7,
      "sleepHours": 6.6,
      "mood": 3.8,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2713,
      "temperature": 21.8,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.51,
      "cumulativeDose": 267.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 173,
    "vitals": {
      "heartRate": 63,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 79
      },
      "temperature": 36.8,
      "sleepHours": 7.3,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2721,
      "temperature": 22.4,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.5,
      "cumulativeDose": 268.6
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 174,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 108,
        "diastolic": 81
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2725,
      "temperature": 21.4,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.19,
      "cumulativeDose": 269.8
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 175,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 82
      },
      "temperature": 36.8,
      "sleepHours": 7.6,
      "mood": 4.0,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2649,
      "temperature": 21.5,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": true,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.7,
      "cumulativeDose": 271.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 176,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 109,
        "diastolic": 77
      },
      "temperature": 36.5,
      "sleepHours": 7.3,
      "mood": 3.9,
      "exerciseMinutes": 69
    },
    "symptoms": [],
    "cabin": {
      "co2": 2621,
      "temperature": 21.6,
      "noise": 55
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.6,
      "cumulativeDose": 273.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 177,
    "vitals": {
      "heartRate": 65,
      "bloodPressure": {
        "systolic": 110,
        "diastolic": 83
      },
      "temperature": 36.7,
      "sleepHours": 7.2,
      "mood": 4.1,
      "exerciseMinutes": 90
    },
    "symptoms": [],
    "cabin": {
      "co2": 2852,
      "temperature": 21.7,
      "noise": 59
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.48,
      "cumulativeDose": 274.5
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 178,
    "vitals": {
      "heartRate": 67,
      "bloodPressure": {
        "systolic": 105,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 7.3,
      "mood": 4.1,
      "exerciseMinutes": 86
    },
    "symptoms": [],
    "cabin": {
      "co2": 2704,
      "temperature": 21.9,
      "noise": 54
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.52,
      "cumulativeDose": 276.1
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 179,
    "vitals": {
      "heartRate": 62,
      "bloodPressure": {
        "systolic": 106,
        "diastolic": 78
      },
      "temperature": 36.8,
      "sleepHours": 7.0,
      "mood": 4.0,
      "exerciseMinutes": 80
    },
    "symptoms": [],
    "cabin": {
      "co2": 2963,
      "temperature": 21.3,
      "noise": 60
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.3,
      "cumulativeDose": 277.4
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  },
  {
    "day": 180,
    "vitals": {
      "heartRate": 64,
      "bloodPressure": {
        "systolic": 102,
        "diastolic": 78
      },
      "temperature": 36.6,
      "sleepHours": 7.8,
      "mood": 4.3,
      "exerciseMinutes": 83
    },
    "symptoms": [],
    "cabin": {
      "co2": 2870,
      "temperature": 21.7,
      "noise": 56
    },
    "immune": {
      "rash": false,
      "coldSore": false,
      "fever": false,
      "fatigue": false,
      "stressScore": 2.2
    },
    "radiation": {
      "dailyDose": 1.53,
      "cumulativeDose": 278.9
    },
    "bodyMapDrift": {
      "head": "nominal",
      "chest": "nominal",
      "torso": "nominal",
      "arms": "nominal",
      "legs": "nominal"
    }
  }
];

  const DataEngine = {
    getBaseline() {
      return JSON.parse(JSON.stringify(ASTRONAUT_BASELINE));
    },

    getDay(dayNumber) {
      const day = Math.max(1, Math.min(180, parseInt(dayNumber, 10) || 1));
      return JSON.parse(JSON.stringify(transitDataset[day - 1]));
    },

    getAllDays() {
      return JSON.parse(JSON.stringify(transitDataset));
    },

    getHistory(metricName) {
      const baseline = ASTRONAUT_BASELINE;
      return transitDataset.map(item => {
        let val = 0;
        let baseVal = 0;
        let status = 'nominal';

        if (metricName === 'sleep' || metricName === 'sleepHours') {
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
          if (val > 85) status = 'alarm';
          else if (val > 75) status = 'caution';
        } else if (metricName === 'exerciseMinutes') {
          val = item.vitals.exerciseMinutes;
          baseVal = baseline.exerciseMinutes;
          if (val < 45) status = 'alarm';
          else if (val < 70) status = 'caution';
        } else if (metricName === 'co2') {
          val = item.cabin.co2;
          baseVal = 2800;
          if (val > 4500) status = 'alarm';
          else if (val > 3500) status = 'caution';
        }

        return {
          day: item.day,
          value: val,
          baseline: baseVal,
          status: status
        };
      });
    },

    saveCheckIn(arg1, arg2) {
      let dayNumber, checkInData;
      if (typeof arg1 === 'object' && arg1 !== null) {
        dayNumber = arg1.day;
        checkInData = arg1;
      } else {
        dayNumber = arg1;
        checkInData = arg2 || {};
      }

      const day = Math.max(1, Math.min(180, parseInt(dayNumber, 10) || 1));
      const existing = transitDataset[day - 1];
      if (existing) {
        if (checkInData.vitals) {
          Object.assign(existing.vitals, checkInData.vitals);
        } else {
          if (checkInData.heartRate !== undefined) existing.vitals.heartRate = checkInData.heartRate;
          if (checkInData.bloodPressure !== undefined) existing.vitals.bloodPressure = checkInData.bloodPressure;
          if (checkInData.temperature !== undefined) existing.vitals.temperature = checkInData.temperature;
          if (checkInData.sleepHours !== undefined) existing.vitals.sleepHours = checkInData.sleepHours;
          if (checkInData.mood !== undefined) existing.vitals.mood = checkInData.mood;
          if (checkInData.exerciseMinutes !== undefined) existing.vitals.exerciseMinutes = checkInData.exerciseMinutes;
        }
        if (checkInData.symptoms) existing.symptoms = checkInData.symptoms;
        if (checkInData.cabin) Object.assign(existing.cabin, checkInData.cabin);
        if (checkInData.immune) Object.assign(existing.immune, checkInData.immune);
      }
      return JSON.parse(JSON.stringify(existing));
    }
  };

  return DataEngine;
}));
