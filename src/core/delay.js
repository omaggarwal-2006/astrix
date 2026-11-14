/**
 * LANDFALL - Communication delay (src/core/delay.js)
 *
 * Decision D-05: this is the only place the app computes Earth-ship delay.
 * The model is a linear demo assumption, not orbital geometry: real Mars delay
 * varies from about 3 to 22 minutes one way over the synodic cycle (see docs/13-SOURCES.md).
 */

import { CONFIG } from "./config.js";

/** One-way light time in whole seconds for a mission day (linear demo model). */
export function oneWayDelayS(day, config = CONFIG) {
  const { startOneWayS, spanOneWayS } = config.delayModel;
  return Math.round(startOneWayS + (day / config.missionLengthDays) * spanOneWayS);
}

/** "2 min 48 s" style text for a delay in seconds. */
export function formatDelay(seconds) {
  if (seconds < 1.0) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m} min ${s} s`;
}
