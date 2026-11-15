/**
 * LANDFALL - App bar status chips, scrubber readout, tab badges, scene collapse (src/ui/header.js)
 */

import { AppState } from "../app/state.js";
import { formatDelay } from "../core/delay.js";
import { getQueue } from "../core/queue.js";
import { CONFIG } from "../core/config.js";
import { GameState, toggleAudio, isAudioEnabled, playSound } from "./extras/gamification.js";
import { $ } from "./dom.js";

/** Runs after every state change. */
export function updateHeader(state) {
  const v = state.view;
  const day = state.currentDay;
  const remaining = state.maxDays - day;
  const distMkm = (0.38 + (day / state.maxDays) * 224.62).toFixed(1);   // illustrative transit distance

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('chip-day', `<span class="muted">Day</span> <b>${day}</b> <span class="muted">/ ${state.maxDays}</span>`);
  set('chip-delay', `<span class="muted">Earth</span> <b>${formatDelay(v.delayS)}</b> <span class="muted">one way</span>`);
  set('chip-link', `<span class="dot"></span> <b>${state.env.linkUp ? 'Link up' : 'Link down'}</b>`);
  set('chip-support', `<span class="muted">Onboard</span> <b>${state.env.onboardSupport ? 'CMO' : 'No CMO'}</b>`);
  
  // Update Gamification quick status chip in header
  if (GameState) {
    const r = GameState.getRank();
    set('chip-rank', `<span class="muted">Rank</span> <b>LVL ${r.level}</b> <span class="muted">${r.xp} XP</span>`);
  }

  $('#chip-link')?.classList.toggle('is-bad', !state.env.linkUp);
  $('#chip-delay')?.classList.toggle('is-warn', v.delayS >= CONFIG.liveCallMaxOneWayS);

  set('telemetry-day', `Day ${day} / ${state.maxDays}`);
  set('telemetry-distance', `${distMkm} M km`);
  set('telemetry-remaining', `${remaining} days to landing`);

  const slider = document.getElementById('mission-scrubber-slider');
  if (slider && parseInt(slider.value, 10) !== day) slider.value = day;

  // Tab badges: alerts today, packets still in flight
  const alerts = v.alerts.length;
  set('badge-signals', alerts ? String(alerts) : '');
  const inFlight = getQueue().filter(e => e.packet.status !== 'ACKNOWLEDGED').length;
  set('badge-comms', inFlight ? String(inFlight) : '');
}

export function initSceneCollapse() {
  const btn = document.getElementById('btn-toggle-scene');
  const content = document.getElementById('mission-scene-content');
  if (!btn || !content) return;
  const apply = (collapsed) => {
    content.classList.toggle('collapsed', collapsed);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.textContent = collapsed ? 'Show scene' : 'Hide scene';
  };
  apply(localStorage.getItem('landfall_scene_collapsed') === 'true');
  btn.addEventListener('click', () => {
    const collapsed = !content.classList.contains('collapsed');
    apply(collapsed);
    localStorage.setItem('landfall_scene_collapsed', collapsed ? 'true' : 'false');
    if (!collapsed && AppState.missionScene) AppState.missionScene.resize();
  });
}

/** Milestone labels under the scrubber jump to that day. */
export function initMilestones() {
  document.getElementById('scrubber-milestones')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-day]');
    if (b) {
      playSound('click');
      AppState.setDay(parseInt(b.dataset.day, 10));
    }
  });
}

/** Toggles synthesized sound effects. */
export function initAudioToggle() {
  const btn = document.getElementById('btn-toggle-audio');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const on = toggleAudio();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.innerHTML = `<span id="audio-icon">${on ? '🔊' : '🔇'}</span> <span class="btn-label">${on ? 'Audio ON' : 'Muted'}</span>`;
  });
}

