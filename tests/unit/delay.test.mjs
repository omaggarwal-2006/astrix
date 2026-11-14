// The one delay function (src/core/delay.js, decision D-05).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oneWayDelayS, formatDelay } from '../../src/core/delay.js';

test('Day 40 is 168 s one way (2 min 48 s)', () => {
  assert.equal(oneWayDelayS(40), 168);
  assert.equal(formatDelay(168), '2 min 48 s');
});

test('delay never falls as the mission goes on', () => {
  for (let d = 1; d < 180; d++) assert.ok(oneWayDelayS(d + 1) >= oneWayDelayS(d), `day ${d}`);
  assert.equal(oneWayDelayS(180), 751);
});

test('formatDelay handles milliseconds and seconds', () => {
  assert.equal(formatDelay(0.01), '10 ms');
  assert.equal(formatDelay(1.3), '1.3 s');
});
