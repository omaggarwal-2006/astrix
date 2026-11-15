// ML & Physiological Engine Unit Tests (tests/unit/ml-engine.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictReadings, detectAnomalies, predictLandingForecast, getEngineMetadata } from '../../engine/api.js';

test('engine metadata reports active version and NASA dataset grounding', () => {
  const meta = getEngineMetadata();
  assert.equal(meta.status, 'ACTIVE_ONLINE');
  assert.equal(meta.version, '3.0.0-prod');
  assert.ok(meta.biomarkers.wbc_k_uL);
});

test('predictReadings returns vitals, cabin, and LSDS hematological biomarkers', () => {
  const r = predictReadings(40);
  assert.equal(r.day, 40);
  assert.ok(r.vitals.sleep_h < 5.0, 'Sleep should collapse around Day 40');
  assert.ok(r.cabin.co2_ppm > 4500, 'CO2 should elevate at Day 40');
  assert.ok(typeof r.biomarkers.wbc_k_uL === 'number');
  assert.ok(typeof r.biomarkers.calcium_mg_dL === 'number');
});

test('detectAnomalies catches Day 40 circadian collapse and hypercapnia', () => {
  const readings = predictReadings(40);
  const alerts = detectAnomalies(40, readings);
  const alertIds = alerts.map(a => a.id);
  assert.ok(alertIds.includes('alert_circadian_collapse'));
  assert.ok(alertIds.includes('alert_hypercapnia'));
});

test('predictLandingForecast maintains strict monotonicity with countermeasure exercise', () => {
  for (const day of [20, 40, 90, 180]) {
    let prev = null;
    for (const h of [0, 0.5, 1.0, 1.5]) {
      const f = predictLandingForecast(day, h);
      const dimensions = Object.keys(f);
      assert.equal(dimensions.length, 6);
      for (const dim of dimensions) {
        assert.ok(f[dim].low <= f[dim].mid && f[dim].mid <= f[dim].high, dim);
      }
      if (prev) {
        for (const dim of dimensions) {
          assert.ok(f[dim].mid >= prev[dim].mid, `${dim} at exercise ${h}h`);
        }
      }
      prev = f;
    }
  }
});
