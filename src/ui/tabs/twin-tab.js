/**
 * LANDFALL - Digital twin tab: the 11-region twin, the health constellation and the
 * mission readiness score (src/ui/tabs/twin-tab.js)
 */

import { AppState } from "../../app/state.js";
import { renderTwin } from "../extras/twin.js";
import { calculateCrewReadinessXP } from "../extras/twin-model.js";
import { $, countUp } from "../dom.js";

export function renderTwinTab() {
  const v = AppState.view;
  if (!v) return;
  renderTwin(v.reading, v.alerts);
  const day = document.getElementById('twin-profile-day');
  if (day) day.textContent = String(v.day);
  if (AppState.constellation) {
    AppState.constellation.resize();      // the canvas had no size while the tab was hidden
    AppState.constellation.setData(v.forecast);
  }
  renderScore();
}

/** Mission readiness score (renamed from "crew XP", decision D-08). */
export function renderScore() {
  const v = AppState.view;
  if (!v || !$('#score-num')) return;
  const s = calculateCrewReadinessXP(v.forecast, AppState.whatIf, AppState.completedScansCount);
  countUp($('#score-num'), s.xp);
  const tier = $('#score-tier');
  tier.textContent = s.tier.split(' — ')[0].replace('TIER', 'Tier');
  tier.className = `pill ${s.status === 'alarm' ? 'bad' : s.status === 'caution' ? 'warn' : 'ok'}`;
  const parts = [['Landing dimensions', s.breakdown.dimensions, 600], ['Exercise adherence', s.breakdown.adherence, 250], ['Completed scans', s.breakdown.scans, 150]];
  $('#score-parts').innerHTML = parts.map(([label, val, max]) => `
    <div><div class="top"><span>${label}</span><span class="num">${val} / ${max}</span></div>
    <div class="meter"><span style="width:${(val / max * 100).toFixed(1)}%"></span></div></div>`).join('');
}
