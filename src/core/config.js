/**
 * LANDFALL - Configuration (src/core/config.js)
 *
 * The single home for every threshold and tunable number.
 * Docs: docs/18-DATA_MODEL.md §7. Every value is a TEAM ASSUMPTION unless a source is named.
 *
 * Values marked "as-built" keep the current behaviour. Where the v2 docs propose a different
 * value, the proposal is noted next to it; change the value only when the decision is accepted
 * in docs/20-DECISIONS.md.
 */

export const CONFIG = Object.freeze({
  // Mission
  missionLengthDays: 180,
  defaultDay: 40,

  // Triage (src/core/triage.js)
  liveCallMaxOneWayS: 10,      // D-01: beyond about 10 s one way a conversation is no longer live (was 300 s)
  persistEscalateDays: 5,      // persistence that adds +1 to the triage score

  // Cabin
  co2HintPpm: 4500,            // "Headache plus high CO2: check the scrubber first"

  // Radiation
  doseLimitMSv: 600,           // career effective-dose limit, NASA-STD-3001 (source S-13, to be verified)

  // Delay model (src/core/delay.js) - D-05: one function for the whole app
  delayModel: Object.freeze({
    startOneWayS: 1.3,         // Moon-like light time at departure
    spanOneWayS: 750,          // added linearly over the mission (Mars average, about 12.5 min)
  }),

  // Queue (src/core/queue.js)
  queue: Object.freeze({
    speedup: 100,              // demo clock: 1 s on screen = 100 s mission time
    failRate: 0,               // no random failures by default; the Simulation panel can inject them (D-14)
    retryMs: 2000,             // auto-retry delay after a random failure
  }),
});
