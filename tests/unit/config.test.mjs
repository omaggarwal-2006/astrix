// Config is the single home for thresholds (docs/README.md, ground rule 7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CONFIG } from '../../src/core/config.js';

const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');

test('config is frozen', () => {
  assert.ok(Object.isFrozen(CONFIG));
  assert.ok(Object.isFrozen(CONFIG.queue));
  assert.ok(Object.isFrozen(CONFIG.delayModel));
});

test('triage reads its thresholds from config, not literals', () => {
  const src = read('../../src/core/triage.js');
  assert.doesNotMatch(src, /\b300\b/);
  assert.doesNotMatch(src, />= 5\b/);
});

test('the header and the mission scene use the one delay function', () => {
  for (const rel of ['../../src/ui/header.js', '../../src/ui/visuals/mission-scene.js']) {
    const src = read(rel);
    assert.doesNotMatch(src, /1\.3 \+ \(day \/ 180\) \* 750/, rel);
    assert.match(src, /oneWayDelayS/, rel);
  }
});
