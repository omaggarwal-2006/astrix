/**
 * LANDFALL - App bar status chips, scrubber readout, tab badges, scene collapse (src/ui/header.js)
 */

import { AppState } from "../app/state.js";
import { formatDelay } from "../core/delay.js";
import { getQueue } from "../core/queue.js";
import { CONFIG } from "../core/config.js";
import { GameState, toggleAudio, isAudioEnabled, playSound } from "./extras/gamification.js";
import { $ } from "./dom.js";

/** 168 -> "02m 48s" */
export function latencyClock(seconds) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
}

/** Point on the header's quadratic arc M28 70 Q200 -6 372 70 at t in 0..1. */
function arcPoint(t) {
  const x = (1 - t) * (1 - t) * 28 + 2 * (1 - t) * t * 200 + t * t * 372;
  const y = (1 - t) * (1 - t) * 70 + 2 * (1 - t) * t * -6 + t * t * 70;
  return { x, y };
}

function updateTrajectory(day, maxDays, distMkm, delayS) {
  const wrap = document.getElementById('deck-traj');
  if (!wrap) return;
  const t = (day - 1) / (maxDays - 1);
  const p = arcPoint(t);
  const ship = document.getElementById('traj-ship');
  if (ship) { ship.setAttribute('cx', p.x.toFixed(1)); ship.setAttribute('cy', p.y.toFixed(1)); }
  const cur = document.getElementById('traj-cursor');
  if (cur) { cur.setAttribute('x1', p.x.toFixed(1)); cur.setAttribute('x2', p.x.toFixed(1)); }
  const done = document.getElementById('traj-done');
  if (done && done.getTotalLength) {
    const L = done.getTotalLength();
    done.style.strokeDasharray = `${L}`;
    done.style.strokeDashoffset = `${L * (1 - t)}`;
  }
  const lbl = document.getElementById('traj-ship-lbl');
  if (lbl) {
    lbl.style.left = `${(p.x / 400) * 100}%`;
    lbl.style.top = `${Math.max(0, (p.y / 96) * 100 - 6)}%`;
    lbl.innerHTML = `DAY<b>${String(day).padStart(3, '0')}</b>`;
  }
  const dEl = document.getElementById('traj-day');
  if (dEl) dEl.textContent = String(day).padStart(3, '0');
  const stats = document.getElementById('traj-stats');
  if (stats) {
    const toMars = Math.max(0, 225 - parseFloat(distMkm)).toFixed(1);
    stats.innerHTML = `<span>STATUS: <b>Day ${day}/${maxDays}</b></span><span>DIST TO MARS: <b>${toMars} M km</b></span><span>ONE-WAY DELAY: <b>${latencyClock(delayS)}</b></span>`;
  }
}

/** Runs after every state change. */
export function updateHeader(state) {
  const v = state.view;
  const day = state.currentDay;
  const remaining = state.maxDays - day;
  const distMkm = (0.38 + (day / state.maxDays) * 224.62).toFixed(1);   // illustrative transit distance

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('chip-day', `<span class="muted">Day</span> <b>${day}</b> <span class="muted">/ ${state.maxDays}</span>`);
  set('chip-delay', `<span class="muted">Earth latency</span> <b>${latencyClock(v.delayS)}</b>`);
  set('chip-link', `<span class="dot"></span> <span class="muted">Sub-space link</span> <b>${state.env.linkUp ? 'Connected' : 'Lost'}</b>`);
  set('chip-support', state.env.onboardSupport ? `<b>CMO</b> <span class="muted">onboard</span>` : `<b>No CMO</b> <span class="muted">onboard</span>`);

  // Update Gamification quick status chip in header
  if (GameState) {
    const r = GameState.getRank();
    set('chip-rank', `<span class="deck-rank-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m8 11 4-3 4 3M8 15l4-3 4 3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span><span><b>LVL ${r.level} · ${r.title}</b><span class="muted">${r.xp} / ${r.maxXP} XP</span></span>`);
  }

  // Mini trajectory in the command-deck header (design_mockups/01)
  updateTrajectory(day, state.maxDays, distMkm, v.delayS);

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
    btn.classList.toggle('is-muted', !on);
    btn.innerHTML = `<span id="audio-icon">${on ? '🔊' : '🔇'}</span> <span class="btn-label">${on ? 'Audio FX' : 'Muted'}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>`;
  });
}

