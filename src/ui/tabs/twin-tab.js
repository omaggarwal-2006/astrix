/**
 * LANDFALL v3.0 - Digital Twin Tab Controller (src/ui/tabs/twin-tab.js)
 * Manages the 11-region 3D twin, the health constellation, the gamified readiness score,
 * and badge evaluation.
 */

import { AppState } from "../../app/state.js";
import { renderTwin } from "../extras/twin.js";
import { resize3DTwin } from "../extras/twin-3d.js";
import { calculateCrewReadinessXP } from "../extras/twin-model.js";
import { GameState, showUnlockToast, renderGamificationHUD } from "../extras/gamification.js";
import { $, countUp } from "../dom.js";

export function renderTwinTab() {
  const v = AppState.view;
  if (!v) return;
  renderTwin(v.reading, v.alerts);
  resize3DTwin();
  const day = document.getElementById('twin-profile-day');
  if (day) day.textContent = String(v.day);
  if (AppState.constellation) {
    AppState.constellation.resize();
    AppState.constellation.setData(v.forecast);
  }
  renderScore();
  renderGamificationHUD(document.getElementById('twin-gamification-hud'));

  // Evaluate gamification achievements
  const newBadges = GameState.checkNewBadges({
    currentDay: v.day,
    exerciseHours: AppState.whatIf ? AppState.whatIf.exerciseHours : 1.5,
    readinessXP: AppState.readinessXP || 880,
  });

  newBadges.forEach(b => {
    showUnlockToast('Achievement Unlocked!', `${b.icon} ${b.name}`, b.icon);
  });
}

/** Mission readiness score (calibrated 0-1000 operational metric). */
export function renderScore() {
  const v = AppState.view;
  if (!v || !$('#score-num')) return;
  const s = calculateCrewReadinessXP(v.forecast, AppState.whatIf, AppState.completedScansCount);
  AppState.readinessXP = s.xp;
  countUp($('#score-num'), s.xp);
  const tier = $('#score-tier');
  if (tier) {
    tier.textContent = s.tier.split(' — ')[0].replace('TIER', 'Tier');
    tier.className = `pill ${s.status === 'alarm' ? 'bad' : s.status === 'caution' ? 'warn' : 'ok'}`;
  }
  const parts = [
    ['Landing dimensions', s.breakdown.dimensions, 600],
    ['Exercise adherence', s.breakdown.adherence, 250],
    ['Completed scans', s.breakdown.scans, 150]
  ];
  const partsEl = $('#score-parts');
  if (partsEl) {
    partsEl.innerHTML = parts.map(([label, val, max]) => `
      <div>
        <div class="top"><span>${label}</span><span class="num">${val} / ${max}</span></div>
        <div class="meter"><span style="width:${(val / max * 100).toFixed(1)}%"></span></div>
      </div>`).join('');
  }
}
