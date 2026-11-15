// Gamification Engine Unit Tests (tests/unit/gamification.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GamificationEngine, RANKS, BADGES } from '../../src/core/gamification-engine.js';

test('gamification starts at calibrated rank and calculates level progression', () => {
  const engine = new GamificationEngine({ xp: 750 });
  const rank = engine.getRank();
  assert.equal(rank.level, 2);
  assert.equal(rank.title, 'Flight Specialist');
  assert.equal(rank.nextTitle, 'CMO Certified');
  assert.ok(rank.progressPct >= 0 && rank.progressPct <= 100);
});

test('awarding XP increments total and advances level across thresholds', () => {
  const engine = new GamificationEngine({ xp: 480 });
  assert.equal(engine.getRank().level, 1);

  engine.awardXP('EXERCISE_LOG'); // +100
  assert.equal(engine.xp, 580);
  assert.equal(engine.getRank().level, 2);
});

test('badges unlock dynamically when mission conditions are met', () => {
  const engine = new GamificationEngine({ xp: 1000, unlockedBadges: [] });

  // Test Day 40 anomaly hunter badge
  const newBadges = engine.checkNewBadges({ currentDay: 40, exerciseHours: 1.5, readinessXP: 880 });
  const ids = newBadges.map(b => b.id);
  assert.ok(ids.includes('anomaly_hunter'));
  assert.ok(ids.includes('iron_astronaut'));
});

test('cooperative crew leaderboard returns four crew members', () => {
  const engine = new GamificationEngine();
  const lb = engine.getLeaderboard();
  assert.equal(lb.length, 4);
  assert.equal(lb[0].callsign, 'CDR A. Vance');
  assert.equal(lb[0].active, true);
});
