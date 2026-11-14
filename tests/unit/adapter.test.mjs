// Adapter shapes (CONTRACT.md Part A) over the interim sample data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAlerts, getForecast, getReadings, getBaseline, mapSeverity } from '../../src/core/adapter.js';

test('readings have the contract shape', () => {
  const r = getReadings(40);
  assert.equal(r.day, 40);
  for (const k of ['sleep_h', 'hr_bpm', 'bp_sys', 'bp_dia', 'temp_c', 'mood', 'exercise_min']) {
    assert.equal(typeof r.vitals[k], 'number', k);
  }
  assert.ok(Array.isArray(r.symptoms));
  assert.equal(typeof r.cabin.co2, 'number');
  assert.equal(typeof r.radiation.cumulativeDose, 'number');
});

test('Day 40 has the sleep-collapse and CO2 alerts; Day 20 has none', () => {
  const ids = getAlerts(40).map(a => a.id);
  assert.ok(ids.includes('A-001'));
  assert.ok(ids.includes('A-002'));
  assert.equal(getAlerts(20).length, 0);
});

test('every alert has severity 1-3 and the contract fields', () => {
  for (let d = 1; d <= 180; d++) {
    for (const a of getAlerts(d)) {
      assert.ok([1, 2, 3].includes(a.severity), `${a.id} day ${d}`);
      for (const k of ['id', 'metric', 'baseline', 'current', 'z', 'persisted_days', 'worsening', 'reason']) assert.ok(k in a, k);
    }
  }
});

test('forecast ranges are ordered and never fall when exercise rises', () => {
  for (const day of [20, 40, 44, 90, 180]) {
    let prev = null;
    for (const h of [0, 0.3, 0.6, 0.9, 1.2, 1.5]) {
      const f = getForecast(day, h);
      assert.equal(f.length, 6);
      for (const dim of f) assert.ok(dim.landing.low <= dim.landing.mid && dim.landing.mid <= dim.landing.high, dim.dimension);
      if (prev) f.forEach((dim, i) => assert.ok(dim.landing.mid >= prev[i].landing.mid, `${dim.dimension}, day ${day}, ${h} h`));
      prev = f;
    }
  }
});

test('the baseline is a copy, and severity maps to status words', () => {
  const b = getBaseline();
  b.sleep_h = 0;
  assert.notEqual(getBaseline().sleep_h, 0);
  assert.equal(mapSeverity(3).status, 'alarm');
  assert.equal(mapSeverity(2).status, 'caution');
  assert.equal(mapSeverity(1).label, 'Mild drift');
});
