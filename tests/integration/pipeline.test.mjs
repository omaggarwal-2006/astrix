// handleAlert -> triage -> packet -> queue, with link loss and recovery.
// Replaces the old root test3.mjs and test5.mjs.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handleAlert, peekNextSeq } from '../../src/core/pipeline.js';
import { getQueue, setLink, clearQueue, config } from '../../src/core/queue.js';
import { LINK_PRESETS } from '../../src/core/sources.js';
import { sampleAlert } from '../../src/data/sample-alert.js';

config.failRate = 0;     // deterministic: no random failures
config.speedup = 1e6;    // acknowledgements arrive in about a millisecond

const ctx = {
  missionDay: 40, current: { sleep_h: 5.1 }, baseline: { sleep_h: 7.4 },
  trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1], trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
  cabin: { co2: 1800 }, countermeasure: 'Fix sleep schedule, review CO2 scrubber'
};
const up = { available: true, delay_s: LINK_PRESETS.MARS_MID.delay_s };
const down = { available: false, delay_s: LINK_PRESETS.MARS_MID.delay_s };
const statusOf = id => getQueue().find(e => e.packet.packet_id === id)?.packet.status;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, ms = 2000) {
  const t0 = Date.now();
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error('timed out');
    await sleep(5);
  }
}

beforeEach(() => { setLink(up); clearQueue(); });

test('a serious alert on the Mars-average link is queued and acknowledged', async () => {
  const r = handleAlert(sampleAlert, ctx, { onboardSupport: true, link: up });
  assert.equal(r.decision.path, 'FLIGHT_SURGEON');
  assert.equal(r.decision.delivery, 'SEND_PACKET');
  assert.ok(r.packet);
  await waitFor(() => statusOf(r.packet.packet_id) === 'ACKNOWLEDGED');
  const entry = getQueue().find(e => e.packet.packet_id === r.packet.packet_id);
  assert.match(entry.ground_reply, /received/);
});

test('a mild alert creates no packet', () => {
  const mild = { ...sampleAlert, id: 'A-002', severity: 0, persisted_days: 1, worsening: false };
  const r = handleAlert(mild, ctx, { onboardSupport: true, link: up });
  assert.equal(r.decision.path, 'SELF_CARE');
  assert.equal(r.packet, null);
  assert.equal(getQueue().length, 0);
});

test('with the link down the packet waits, then is acknowledged when the link returns', async () => {
  const r = handleAlert({ ...sampleAlert, id: 'A-003' }, ctx, { onboardSupport: true, link: down });
  assert.equal(r.decision.delivery, 'QUEUE_OFFLINE');
  await sleep(30);
  assert.equal(statusOf(r.packet.packet_id), 'QUEUED');
  setLink(up);
  await waitFor(() => statusOf(r.packet.packet_id) === 'ACKNOWLEDGED');
});

test('peekNextSeq predicts the next packet number without enqueueing', () => {
  const next = peekNextSeq();
  assert.equal(getQueue().length, 0);
  const r = handleAlert(sampleAlert, ctx, { onboardSupport: true, link: down });
  assert.equal(r.packet.packet_id, `PKT-${String(next).padStart(4, '0')}`);
});

test('clearQueue empties the queue', () => {
  handleAlert(sampleAlert, ctx, { onboardSupport: true, link: down });
  assert.ok(getQueue().length > 0);
  clearQueue();
  assert.equal(getQueue().length, 0);
});
