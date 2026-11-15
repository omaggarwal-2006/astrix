/**
 * LANDFALL - Building and sending today's report packet (src/ui/report.js)
 * Shared by the Today and Decide & deliver views.
 */

import { AppState } from "../app/state.js";
import { getReadings } from "../core/adapter.js";
import { buildPacket } from "../core/packet.js";
import { handleAlert, peekNextSeq } from "../core/pipeline.js";
import { getQueue } from "../core/queue.js";
import { GameState, playSound, showUnlockToast } from "./extras/gamification.js";

const COUNTERMEASURE = {
  sleep_h: 'Protect an 8 h sleep window; dim cabin lighting; reduce evening workload.',
  cabin_co2: 'Check the CO2 scrubber first, then reassess the headache.',
  mood: 'Schedule a private check-in with the crew medical officer; protect sleep.',
  immune_cold_sore: 'Monitor the lesion; antiviral only as directed by the crew medical officer.',
  exercise_min: 'Restore 1.5 h/day of resistive and aerobic exercise.',
};

// Where each alert metric lives in a day's readings
const SERIES = {
  sleep_h: r => r.vitals.sleep_h,
  mood: r => r.vitals.mood,
  exercise_min: r => r.vitals.exercise_min,
  hr_bpm: r => r.vitals.hr_bpm,
  cabin_co2: r => r.cabin.co2,
};

/** Values of a metric for the `n` days up to `day` (computed, not hard-coded). */
function series(metric, day, n) {
  const pick = SERIES[metric] || SERIES.sleep_h;
  const out = [];
  for (let d = Math.max(1, day - n + 1); d <= day; d++) out.push(pick(getReadings(d)));
  return out;
}

/** Packet context for today's primary alert. */
export function reportContext(view) {
  const a = view.alert;
  const every5 = series(a.metric, view.day, 30).filter((_, i, arr) => (arr.length - 1 - i) % 5 === 0);
  return {
    missionDay: view.day,
    current: view.reading.vitals,
    baseline: view.baseline,
    trend7: series(a.metric, view.day, 7),
    trend30: every5,
    cabin: view.reading.cabin,
    countermeasure: COUNTERMEASURE[a.metric] || 'Review with the crew medical officer.',
  };
}

export const needsPacket = (decision) => decision.delivery === 'SEND_PACKET' || decision.delivery === 'QUEUE_OFFLINE';

/** Preview of the packet that Send would create (not queued). */
export function previewPacket(view) {
  if (!view.alert || !needsPacket(view.decision)) return null;
  return buildPacket(view.alert, view.decision, reportContext(view), peekNextSeq());
}

/** Today's latest queued packet, if any. */
export function packetForToday(day) {
  const q = getQueue();
  for (let i = q.length - 1; i >= 0; i--) if (q[i].packet.mission_ts === day) return q[i];
  return null;
}

/** Send today's report (enqueues exactly once). Returns the packet or null. */
export function sendReport() {
  const v = AppState.view;
  if (!v.alert) return null;
  const res = handleAlert(v.alert, reportContext(v), {
    onboardSupport: AppState.env.onboardSupport,
    link: { available: AppState.env.linkUp, delay_s: v.delayS },
  });
  if (res && res.packet) {
    playSound('telemetry');
    const xpRes = GameState.awardXP(100, 'Deep Space Telemetry Packet Transmission');
    if (xpRes && xpRes.leveledUp) {
      showUnlockToast('Promoted!', `Rank advanced to ${xpRes.rank.title} (Level ${xpRes.rank.level})`, '⭐');
    }
  }
  AppState.updateTelemetryText();
  AppState.renderCurrentTab();
  return res.packet;
}

/** Downloads the packet as a standalone RFC/DTN JSON bundle file. */
export function exportPacketJSON(packet) {
  if (!packet) return;
  try {
    const jsonStr = JSON.stringify(packet, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DTN_BUNDLE_${packet.packet_id || 'EXPORT'}_DAY${packet.mission_ts || 0}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('click');
  } catch (err) {
    console.warn("Failed to export packet JSON:", err);
  }
}
