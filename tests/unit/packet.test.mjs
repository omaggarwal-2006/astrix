// Packet build and checksum (src/core/packet.js). Replaces the old root test2.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPacket, verifyPacket } from '../../src/core/packet.js';
import { triage } from '../../src/core/triage.js';
import { sampleAlert } from '../../src/data/sample-alert.js';

const ctx = {
  missionDay: 40,
  current: { sleep_h: 5.1, mood: 4 },
  baseline: { sleep_h: 7.4, mood: 7 },
  trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1],
  trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
  cabin: { co2: 1800, temp: 23, noise: 52 },
  countermeasure: 'Fix sleep schedule, reduce evening workload, review CO2 scrubber'
};
const decision = triage(sampleAlert, { onboardSupport: true, link: { available: true, delay_s: 600 } });

test('builds a queued packet with a padded ID and the context fields', () => {
  const p = buildPacket(sampleAlert, decision, ctx, 1);
  assert.equal(p.packet_id, 'PKT-0001');
  assert.equal(p.status, 'QUEUED');
  assert.equal(p.mission_ts, 40);
  assert.equal(p.anomaly, sampleAlert.reason);
  assert.deepEqual(p.trend_7d, ctx.trend7);
  assert.match(p.checksum, /^[0-9a-f]{1,8}$/);
});

test('a fresh packet verifies', () => {
  assert.equal(verifyPacket(buildPacket(sampleAlert, decision, ctx, 2)), true);
});

test('status changes do not affect the checksum', () => {
  const p = buildPacket(sampleAlert, decision, ctx, 3);
  p.status = 'ACKNOWLEDGED';
  assert.equal(verifyPacket(p), true);
});

test('tampering with a reading fails verification', () => {
  const p = buildPacket(sampleAlert, decision, ctx, 4);
  p.readings = { ...p.readings, sleep_h: 8 };
  assert.equal(verifyPacket(p), false);
});

test('priority comes from severity (as-built mapping, see CONTRACT.md A5)', () => {
  assert.equal(buildPacket({ ...sampleAlert, severity: 1 }, decision, ctx, 5).priority, 'MEDIUM');
  assert.equal(buildPacket({ ...sampleAlert, severity: 3 }, decision, ctx, 6).priority, 'CRITICAL');
});

test('a packet stays under 1 KB for a delayed link', () => {
  assert.ok(JSON.stringify(buildPacket(sampleAlert, decision, ctx, 7)).length < 1024);
});
