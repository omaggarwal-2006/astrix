// One day of the decision loop (src/core/run-day.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDay, readinessFor, effectiveDelayS, primaryAlert, DEFAULT_ENV } from '../../src/core/run-day.js';
import { LINK_PRESETS } from '../../src/core/sources.js';

test('Day 40 at the mission-model delay routes to the crew medical officer by packet', () => {
  const r = runDay(40);
  assert.equal(r.delayS, 168);
  assert.equal(r.alert.id, 'A-001');
  assert.equal(r.decision.path, 'CREW_MEDICAL_OFFICER');
  assert.equal(r.decision.delivery, 'SEND_PACKET');
  assert.deepEqual(r.breakdown, { severity: 2, persistence: 0, worsening: 1 });
});

test('delay drives the decision: Moon distance gives a live call, link down queues offline', () => {
  assert.equal(runDay(40, { ...DEFAULT_ENV, delayMode: 'MOON' }).decision.delivery, 'LIVE_CALL');
  assert.equal(runDay(40, { ...DEFAULT_ENV, linkUp: false }).decision.delivery, 'QUEUE_OFFLINE');
  assert.equal(runDay(40, { ...DEFAULT_ENV, onboardSupport: false }).decision.path, 'FLIGHT_SURGEON');
});

test('counterfactuals name only the changes that alter the outcome', () => {
  const r = runDay(40);
  assert.ok(r.counterfactuals.length >= 2);
  for (const c of r.counterfactuals) assert.ok(c.path !== r.decision.path || c.delivery !== r.decision.delivery, c.label);
});

test('a calm day has no alert and no made-up decision', () => {
  const r = runDay(20);
  assert.equal(r.alert, null);
  assert.equal(r.decision.noAlert, true);
  assert.equal(r.decision.delivery, 'NONE');
  assert.equal(r.counterfactuals.length, 0);
});

test('readiness can never say on track while an alarm is active', () => {
  const r = runDay(44);
  assert.equal(r.readiness.worstSeverity, 3);
  assert.equal(r.readiness.level, 'AT_RISK');
  assert.equal(readinessFor([], []).level, 'ON_TRACK');
});

test('presets override the mission delay model', () => {
  assert.equal(effectiveDelayS(40, { delayMode: 'MARS_FAR' }), LINK_PRESETS.MARS_FAR.delay_s);
  assert.equal(effectiveDelayS(40, { delayMode: 'MODEL' }), 168);
});

test('the primary alert is the most severe, then the most persistent', () => {
  const a = primaryAlert([{ severity: 1, persisted_days: 9 }, { severity: 3, persisted_days: 1 }, { severity: 3, persisted_days: 4 }]);
  assert.deepEqual(a, { severity: 3, persisted_days: 4 });
  assert.equal(primaryAlert([]), null);
});
