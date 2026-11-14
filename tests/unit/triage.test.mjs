// Triage rules as built (src/core/triage.js). Replaces the old root test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { triage } from '../../src/core/triage.js';
import { CONFIG } from '../../src/core/config.js';
import { sampleAlert } from '../../src/data/sample-alert.js';

const env = (over = {}) => ({ onboardSupport: true, link: { available: true, delay_s: 600 }, ...over });

test('sample alert (severity 2, 9 days, worsening) scores 4 and goes to the flight surgeon by packet', () => {
  const d = triage(sampleAlert, env());
  assert.equal(d.score, 4);
  assert.equal(d.path, 'FLIGHT_SURGEON');
  assert.equal(d.delivery, 'SEND_PACKET');
  assert.match(d.why, /Score 4/);
});

test('link down queues the report offline', () => {
  const d = triage(sampleAlert, env({ link: { available: false, delay_s: 0 } }));
  assert.equal(d.delivery, 'QUEUE_OFFLINE');
});

test('mild, short, not worsening is self-care with no delivery', () => {
  const d = triage({ ...sampleAlert, severity: 1, persisted_days: 1, worsening: false }, env());
  assert.equal(d.path, 'SELF_CARE');
  assert.equal(d.delivery, 'NONE');
});

test('score 2-3 goes to the crew medical officer only when onboard support is present', () => {
  const alert = { ...sampleAlert, severity: 2, persisted_days: 1, worsening: false };
  assert.equal(triage(alert, env()).path, 'CREW_MEDICAL_OFFICER');
  assert.equal(triage(alert, env({ onboardSupport: false })).path, 'FLIGHT_SURGEON');
});

test('a delay below the live-call limit gives a live call', () => {
  const below = triage(sampleAlert, env({ link: { available: true, delay_s: CONFIG.liveCallMaxOneWayS - 1 } }));
  assert.equal(below.delivery, 'LIVE_CALL');
  const at = triage(sampleAlert, env({ link: { available: true, delay_s: CONFIG.liveCallMaxOneWayS } }));
  assert.equal(at.delivery, 'SEND_PACKET');
});

test('the persistence threshold comes from config', () => {
  const base = { ...sampleAlert, severity: 1, worsening: false };
  assert.equal(triage({ ...base, persisted_days: CONFIG.persistEscalateDays - 1 }, env()).score, 1);
  assert.equal(triage({ ...base, persisted_days: CONFIG.persistEscalateDays }, env()).score, 2);
});

test('severity 3 is flagged as an emergency', () => {
  assert.equal(triage({ ...sampleAlert, severity: 3 }, env()).emergency, true);
  assert.equal(triage(sampleAlert, env()).emergency, false);
});
