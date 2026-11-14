/**
 * LANDFALL - One day of the decision loop (src/core/run-day.js)
 *
 * Read → Detect → Forecast → Decide, for one mission day and one simulated environment.
 * Pure: no DOM. Every screen renders from this result, so the tabs can never disagree.
 * (v2 step towards docs/03-PRD.md L1; Detect and the decision table are still the as-built versions.)
 */

import { getAlerts, getForecast, getReadings, getBaseline } from "./adapter.js";
import { triage } from "./triage.js";
import { oneWayDelayS } from "./delay.js";
import { LINK_PRESETS } from "./sources.js";
import { CONFIG } from "./config.js";

/** Simulation environment defaults. delayMode: 'MODEL' (mission-day delay) or a LINK_PRESETS key. */
export const DEFAULT_ENV = Object.freeze({ delayMode: 'MODEL', linkUp: true, onboardSupport: true });

/** One-way delay in seconds for this day and environment. */
export function effectiveDelayS(day, env = DEFAULT_ENV) {
  if (env.delayMode && env.delayMode !== 'MODEL' && LINK_PRESETS[env.delayMode]) return LINK_PRESETS[env.delayMode].delay_s;
  return oneWayDelayS(day);
}

const PATH_RANK = { SELF_CARE: 0, CREW_MEDICAL_OFFICER: 1, FLIGHT_SURGEON: 2 };

/** The alert that drives the decision: highest severity, then longest persistence. */
export function primaryAlert(alerts) {
  return [...alerts].sort((a, b) => (b.severity - a.severity) || (b.persisted_days - a.persisted_days))[0] || null;
}

/** Readiness headline that can never contradict an active alarm (docs/18 §6, U2). */
export function readinessFor(alerts, forecast) {
  const avg = forecast.length ? forecast.reduce((s, f) => s + f.landing.mid, 0) / forecast.length : 100;
  const worst = alerts.reduce((m, a) => Math.max(m, a.severity), 0);
  const anyAlarm = forecast.some(f => f.status === 'alarm');
  const anyCaution = forecast.some(f => f.status === 'caution');
  let level = 'ON_TRACK', text = 'On track for landing';
  if (worst >= 3 || anyAlarm) { level = 'AT_RISK'; text = 'At risk on landing day'; }
  else if (worst === 2 || anyCaution) { level = 'WATCH'; text = 'Watch: countermeasures needed'; }
  return { level, text, score: Math.round(avg), worstSeverity: worst };
}

/** Decision for an environment; no alert means routine monitoring, not a made-up case. */
function decide(alert, env, delayS) {
  if (!alert) {
    return { path: 'SELF_CARE', delivery: 'NONE', score: 0, emergency: false, why: 'No active alerts. Routine self-monitoring.', noAlert: true };
  }
  return triage(alert, { onboardSupport: env.onboardSupport, link: { available: env.linkUp, delay_s: delayS } });
}

/** "What would change this decision": re-run triage with one input changed at a time. */
function counterfactuals(alert, env, delayS, decision) {
  if (!alert) return [];
  const live = CONFIG.liveCallMaxOneWayS;
  const tries = [
    { label: env.linkUp ? 'If the link to Earth dropped' : 'When the link to Earth returns', env: { ...env, linkUp: !env.linkUp }, delay: delayS },
    { label: env.onboardSupport ? 'With no crew medical officer on board' : 'With a crew medical officer on board', env: { ...env, onboardSupport: !env.onboardSupport }, delay: delayS },
    delayS > live
      ? { label: `If Earth were within ${live} s (Moon distance)`, env, delay: 1.3 }
      : { label: 'At the farthest Mars distance (22 min)', env, delay: LINK_PRESETS.MARS_FAR.delay_s },
  ];
  const out = [];
  for (const t of tries) {
    const d = decide(alert, t.env, t.delay);
    if (d.path !== decision.path || d.delivery !== decision.delivery) out.push({ label: t.label, path: d.path, delivery: d.delivery });
  }
  return out;
}

/**
 * Run the loop for one day.
 * @returns {{day, delayS, env, reading, baseline, alerts, alert, forecast, decision, breakdown, counterfactuals, readiness}}
 */
export function runDay(day, env = DEFAULT_ENV, { exerciseHours = 1.2 } = {}) {
  const delayS = effectiveDelayS(day, env);
  const reading = getReadings(day);
  const alerts = [...getAlerts(day)].sort((a, b) => (b.severity - a.severity) || (b.persisted_days - a.persisted_days));
  const alert = alerts[0] || null;
  const forecast = getForecast(day, exerciseHours);
  const decision = decide(alert, env, delayS);
  const breakdown = alert ? {
    severity: alert.severity,
    persistence: alert.persisted_days >= CONFIG.persistEscalateDays ? 1 : 0,
    worsening: alert.worsening ? 1 : 0,
  } : null;
  return {
    day, delayS, env: { ...env },
    reading, baseline: getBaseline(),
    alerts, alert, forecast, decision, breakdown,
    counterfactuals: counterfactuals(alert, env, delayS, decision),
    readiness: readinessFor(alerts, forecast),
  };
}

export { PATH_RANK };
