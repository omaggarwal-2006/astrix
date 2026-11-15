"""
Script to generate engine/data.js using the LANDFALL AstronautSimulator.
Embeds the calibrated baseline and 180-day telemetry with the Day-40 anomaly.
"""

import json
from pathlib import Path
import numpy as np
from simulator import AstronautSimulator

DATA_JS_PATH = Path(__file__).parent.parent / "data.js"


def build_data_js():
    sim = AstronautSimulator(seed=101)
    df, targets = sim.generate_astronaut("ASTRO_CANONICAL", fixed_event_day=40)

    # Prepare ASTRONAUT_BASELINE
    baseline = {
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
    }

    # Prepare 180-day records
    records = []
    for idx, row in df.iterrows():
        d = int(row["day"])
        is_day_40_event = (40 <= d <= 55)

        hr = int(round(row["heart_rate"]))
        sys = int(round(row["sbp"]))
        dia = int(round(row["dbp"]))
        temp = float(round(row["temperature"], 1))
        sleep = float(round(row["sleep_hours"], 1))
        mood = float(round(row["mood"], 1))
        exercise_mins = int(round(row["exercise_hours"] * 60))
        co2 = int(round(row["cabin_co2"]))
        noise = int(round(row["cabin_noise"]))
        c_temp = float(round(row["cabin_temp"], 1))

        symptoms = []
        cold_sore = bool(row["symptom_coldsore"])
        fatigue = bool(row["symptom_fatigue"])
        stress = float(round(2.2, 1))
        head_status = "nominal"
        legs_status = "nominal"

        # Explicit Day 40-55 Acute Sequence (Matches CONTRACT.md and Om demo script)
        if is_day_40_event:
            severity = max(0.0, 1.0 - (d - 40) / 15.0)
            sleep = float(round(4.2 + (1.0 - severity) * 2.8, 1))
            mood = float(round(2.8 + (1.0 - severity) * 1.2, 1))
            hr = int(round(74 - (1.0 - severity) * 9))
            sys = int(round(126 - (1.0 - severity) * 8))
            dia = int(round(83 - (1.0 - severity) * 6))
            exercise_mins = int(round(45 + (1.0 - severity) * 40))
            co2 = int(round(5200 - (1.0 - severity) * 2200))
            symptoms = ["headache", "eye_strain"]
            cold_sore = (d <= 48)
            fatigue = True
            stress = float(round(3.9 - (1.0 - severity) * 1.5, 1))
            head_status = "alarm" if d <= 48 else "caution"
            legs_status = "caution" if severity > 0.4 else "nominal"

        rec = {
            "day": d,
            "vitals": {
                "heartRate": hr,
                "bloodPressure": {
                    "systolic": sys,
                    "diastolic": dia
                },
                "temperature": temp,
                "sleepHours": sleep,
                "mood": mood,
                "exerciseMinutes": exercise_mins
            },
            "symptoms": symptoms,
            "cabin": {
                "co2": co2,
                "temperature": c_temp,
                "noise": noise
            },
            "immune": {
                "rash": bool(row["symptom_rash"]),
                "coldSore": cold_sore,
                "fever": bool(row["symptom_fever"]),
                "fatigue": fatigue,
                "stressScore": stress
            },
            "radiation": {
                "dailyDose": float(round(row["daily_radiation"], 2)),
                "cumulativeDose": float(round(row["cumulative_radiation"], 1))
            },
            "bodyMapDrift": {
                "head": head_status,
                "chest": "nominal",
                "torso": "nominal",
                "arms": "nominal",
                "legs": legs_status
            }
        }
        records.append(rec)

    records_json = json.dumps(records, indent=2)
    baseline_json = json.dumps(baseline, indent=2)

    content = f"""/**
 * LANDFALL Production Data Engine (engine/data.js)
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 * 
 * Generated from simulator.py with calibrated astronaut baseline and
 * the canonical 180-day transit telemetry, including Day-40 sleep collapse sequence.
 */

(function(root, factory) {{
  if (typeof module === 'object' && module.exports) {{
    module.exports = factory();
  }} else {{
    root.DataEngine = factory();
  }}
}}(typeof self !== 'undefined' ? self : this, function() {{
  'use strict';

  const ASTRONAUT_BASELINE = {baseline_json};

  const transitDataset = {records_json};

  const DataEngine = {{
    getBaseline() {{
      return JSON.parse(JSON.stringify(ASTRONAUT_BASELINE));
    }},

    getDay(dayNumber) {{
      const day = Math.max(1, Math.min(180, parseInt(dayNumber, 10) || 1));
      return JSON.parse(JSON.stringify(transitDataset[day - 1]));
    }},

    getAllDays() {{
      return JSON.parse(JSON.stringify(transitDataset));
    }},

    getHistory(metricName) {{
      const baseline = ASTRONAUT_BASELINE;
      return transitDataset.map(item => {{
        let val = 0;
        let baseVal = 0;
        let status = 'nominal';

        if (metricName === 'sleep' || metricName === 'sleepHours') {{
          val = item.vitals.sleepHours;
          baseVal = baseline.sleepHours;
          if (val < 5.0) status = 'alarm';
          else if (val < 6.5) status = 'caution';
        }} else if (metricName === 'mood') {{
          val = item.vitals.mood;
          baseVal = baseline.mood;
          if (val < 3.0) status = 'alarm';
          else if (val < 3.8) status = 'caution';
        }} else if (metricName === 'heartRate') {{
          val = item.vitals.heartRate;
          baseVal = baseline.heartRate;
          if (val > 85) status = 'alarm';
          else if (val > 75) status = 'caution';
        }} else if (metricName === 'exerciseMinutes') {{
          val = item.vitals.exerciseMinutes;
          baseVal = baseline.exerciseMinutes;
          if (val < 45) status = 'alarm';
          else if (val < 70) status = 'caution';
        }} else if (metricName === 'co2') {{
          val = item.cabin.co2;
          baseVal = 2800;
          if (val > 4500) status = 'alarm';
          else if (val > 3500) status = 'caution';
        }}

        return {{
          day: item.day,
          value: val,
          baseline: baseVal,
          status: status
        }};
      }});
    }},

    saveCheckIn(arg1, arg2) {{
      let dayNumber, checkInData;
      if (typeof arg1 === 'object' && arg1 !== null) {{
        dayNumber = arg1.day;
        checkInData = arg1;
      }} else {{
        dayNumber = arg1;
        checkInData = arg2 || {{}};
      }}

      const day = Math.max(1, Math.min(180, parseInt(dayNumber, 10) || 1));
      const existing = transitDataset[day - 1];
      if (existing) {{
        if (checkInData.vitals) {{
          Object.assign(existing.vitals, checkInData.vitals);
        }} else {{
          if (checkInData.heartRate !== undefined) existing.vitals.heartRate = checkInData.heartRate;
          if (checkInData.bloodPressure !== undefined) existing.vitals.bloodPressure = checkInData.bloodPressure;
          if (checkInData.temperature !== undefined) existing.vitals.temperature = checkInData.temperature;
          if (checkInData.sleepHours !== undefined) existing.vitals.sleepHours = checkInData.sleepHours;
          if (checkInData.mood !== undefined) existing.vitals.mood = checkInData.mood;
          if (checkInData.exerciseMinutes !== undefined) existing.vitals.exerciseMinutes = checkInData.exerciseMinutes;
        }}
        if (checkInData.symptoms) existing.symptoms = checkInData.symptoms;
        if (checkInData.cabin) Object.assign(existing.cabin, checkInData.cabin);
        if (checkInData.immune) Object.assign(existing.immune, checkInData.immune);
      }}
      return JSON.parse(JSON.stringify(existing));
    }}
  }};

  return DataEngine;
}}));
"""

    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Successfully generated {DATA_JS_PATH}")
    print(f"File size: {DATA_JS_PATH.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    build_data_js()
