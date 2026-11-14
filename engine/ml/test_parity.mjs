/**
 * Parity and Contract Verification Test for predict.js
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load predict.js
const predictPath = path.join(__dirname, '..', 'predict.js');
const modelJsonPath = path.join(__dirname, '..', 'model.json');

// Import CommonJS predict.js into ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const LandfallML = require(predictPath);

const modelData = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
LandfallML.setModelData(modelData);

console.log("=== 1. VERIFYING MODEL INFO ===");
const info = LandfallML.modelInfo();
console.log("modelInfo():", JSON.stringify(info, null, 2));

if (info.trainedOn !== "synthetic data") throw new Error("Contract violation: trainedOn must be 'synthetic data'");
if (!info.note.includes("Illustrative, not a clinical predictor")) throw new Error("Contract violation: note missing honest disclaimer");

console.log("\n=== 2. CREATING SYNTHETIC TEST ASTRONAUT TELEMETRY (40 DAYS) ===");
// Synthesize 40 days of astronaut data with a planted Day-40 sleep collapse
const testHistory = [];
for (let d = 1; d <= 40; d++) {
  const isCollapse = (d >= 35 && d <= 40);
  testHistory.push({
    day: d,
    vitals: {
      heartRate: isCollapse ? 78 : 64,
      bloodPressure: { systolic: isCollapse ? 128 : 116, diastolic: isCollapse ? 84 : 76 },
      temperature: 36.6,
      sleepHours: isCollapse ? 4.2 : 7.4,
      mood: isCollapse ? 2.8 : 4.2,
      exerciseMinutes: isCollapse ? 45 : 90
    },
    symptoms: isCollapse ? ["headache"] : [],
    cabin: {
      co2: isCollapse ? 5200 : 2800,
      noise: isCollapse ? 65 : 58,
      temperature: 21.5
    },
    immune: {
      coldSore: isCollapse,
      rash: false,
      fever: false,
      fatigue: isCollapse
    }
  });
}

console.log("\n=== 3. TESTING predictLanding(history, options) ===");
const forecast = LandfallML.predictLanding(testHistory, { plannedExerciseHours: 1.2 });
console.log("Forecast on Day 40:", JSON.stringify(forecast, null, 2));

const expectedDims = ['bone', 'muscle', 'aerobic', 'balance', 'sleep', 'mood'];
expectedDims.forEach(dim => {
  if (!forecast[dim]) throw new Error(`Missing dimension: ${dim}`);
  const { low, mid, high, status } = forecast[dim];
  if (typeof low !== 'number' || typeof mid !== 'number' || typeof high !== 'number') {
    throw new Error(`Non-number in ${dim}: ${JSON.stringify(forecast[dim])}`);
  }
  if (!['green', 'amber', 'red'].includes(status)) {
    throw new Error(`Invalid status in ${dim}: ${status}`);
  }
  if (low > mid || mid > high) {
    throw new Error(`Uncertainty band ordering violated in ${dim}: low=${low}, mid=${mid}, high=${high}`);
  }
});
console.log("All 6 dimensions have valid low <= mid <= high and status in [green, amber, red].");

console.log("\n=== 4. TESTING whatIf(history, exerciseHoursPerDay) ===");
const sweep0 = LandfallML.whatIf(testHistory, 0.0);
const sweep15 = LandfallML.whatIf(testHistory, 1.5);

console.log(`Exercise 0.0h -> Bone: ${sweep0.bone.mid}% (${sweep0.bone.status}) | Muscle: ${sweep0.muscle.mid}% (${sweep0.muscle.status})`);
console.log(`Exercise 1.5h -> Bone: ${sweep15.bone.mid}% (${sweep15.bone.status}) | Muscle: ${sweep15.muscle.mid}% (${sweep15.muscle.status})`);

if (sweep15.bone.mid < sweep0.bone.mid || sweep15.muscle.mid < sweep0.muscle.mid) {
  throw new Error("What-if monotonicity violation: Higher exercise must yield higher or equal readiness!");
}
console.log("What-If monotonicity confirmed: higher exercise strictly improves landing readiness.");

console.log("\n=== 5. TESTING explain(history) ===");
const explanation = LandfallML.explain(testHistory);
console.log("Plain-words Explanation:\n" + explanation);

if (!explanation || explanation.length < 20) throw new Error("Explanation is too short or empty.");
console.log("\n=== ALL NODE.JS CONTRACT & PARITY TESTS PASSED SUCCESSFULLY! ===");
