// Sources, numbers, link presets and assumptions (src/core/sources.js). Replaces the old root test4.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES, NUMBERS, LINK_PRESETS, ASSUMPTIONS, DISCLAIMER } from '../../src/core/sources.js';

test('every source has an id, a title, an https URL and a claim', () => {
  assert.ok(SOURCES.length >= 7);
  for (const s of SOURCES) {
    assert.ok(s.id && s.title && s.supports, s.id);
    assert.match(s.url, /^https:\/\//, s.id);
  }
});

test('every NASA number points at a known source', () => {
  const ids = new Set(SOURCES.map(s => s.id));
  for (const [key, n] of Object.entries(NUMBERS)) assert.ok(ids.has(n.source), key);
});

test('link presets are one-way delays in increasing order', () => {
  const delays = ['MOON', 'MARS_NEAR', 'MARS_MID', 'MARS_FAR'].map(k => LINK_PRESETS[k].delay_s);
  assert.deepEqual(delays, [...delays].sort((a, b) => a - b));
  assert.equal(LINK_PRESETS.MOON.delay_s, 1.3);
  assert.equal(LINK_PRESETS.MARS_FAR.delay_s, 1320);
});

test('assumptions and the disclaimer are present', () => {
  assert.ok(ASSUMPTIONS.length >= 7);
  assert.match(DISCLAIMER, /not a clinical predictor/);
});
