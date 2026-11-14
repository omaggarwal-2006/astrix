/**
 * LANDFALL - Simulation controls: Earth distance, link, onboard support, failure injection,
 * jump to day, reset (src/ui/simulation.js)
 * The same controls appear in the Simulation drawer and on the Decide & deliver view;
 * both read and write AppState.env, so the whole app follows.
 */

import { AppState } from "../app/state.js";
import { activateTab } from "../app/router.js";
import { LINK_PRESETS } from "../core/sources.js";
import { formatDelay } from "../core/delay.js";
import { clearQueue } from "../core/queue.js";
import { CONFIG } from "../core/config.js";
import { $, esc } from "./dom.js";

const DELAYS = [
  { key: 'MODEL', label: 'Mission day' },
  { key: 'MOON', label: 'Moon' },
  { key: 'MARS_NEAR', label: 'Mars near' },
  { key: 'MARS_MID', label: 'Mars avg' },
  { key: 'MARS_FAR', label: 'Mars far' },
];
const FAILS = [{ key: 'off', label: 'None' }, { key: 'some', label: '30 %' }, { key: 'all', label: 'Every time' }];

/** Markup for the environment controls. */
export function envControlsHTML({ withDays = false } = {}) {
  return `
    <div class="env-controls" data-env-controls>
      <div>
        <span class="field-label">Distance to Earth</span>
        <div class="segmented" role="group" aria-label="Distance to Earth">
          ${DELAYS.map(d => `<button data-delay="${d.key}" aria-pressed="false">${d.label}</button>`).join('')}
        </div>
        <div class="env-delay-readout"><span data-delay-readout>—</span><small data-delay-note></small></div>
      </div>
      <label class="switch"><span><b>Link to Earth</b><br><span class="muted small">Off: reports wait in the queue</span></span>
        <input type="checkbox" data-toggle="linkUp"><span class="track"></span></label>
      <label class="switch"><span><b>Crew medical officer on board</b><br><span class="muted small">Off: the flight surgeon takes the case</span></span>
        <input type="checkbox" data-toggle="onboardSupport"><span class="track"></span></label>
      <div>
        <span class="field-label">Transmission failures</span>
        <div class="segmented" role="group" aria-label="Inject transmission failures">
          ${FAILS.map(f => `<button data-fail="${f.key}" aria-pressed="false">${f.label}</button>`).join('')}
        </div>
      </div>
      ${withDays ? `
      <div>
        <span class="field-label">Jump to a mission day</span>
        <div class="segmented" role="group" aria-label="Jump to a day">
          ${[1, 20, 40, 44, 54, 90, 180].map(d => `<button data-day="${d}" aria-pressed="false">${d}</button>`).join('')}
        </div>
      </div>
      <div class="row">
        <button class="btn btn-danger btn-sm" id="btn-reset-demo">Reset demo</button>
        <span class="muted small">Clears check-ins, checklist and the queue</span>
      </div>` : ''}
    </div>`;
}

/** Wire a container built from envControlsHTML. */
export function bindEnvControls(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.delay) AppState.setEnv({ delayMode: b.dataset.delay });
    else if (b.dataset.fail) AppState.setEnv({ failMode: b.dataset.fail });
    else if (b.dataset.day) AppState.setDay(parseInt(b.dataset.day, 10));
    else if (b.id === 'btn-reset-demo') resetDemo();
  });
  root.addEventListener('change', (e) => {
    const t = e.target.dataset.toggle;
    if (t) AppState.setEnv({ [t]: e.target.checked });
  });
}

/** Reflect state in every set of controls on the page. */
export function syncEnvControls(state) {
  const live = CONFIG.liveCallMaxOneWayS;
  document.querySelectorAll('[data-env-controls]').forEach(root => {
    root.querySelectorAll('[data-delay]').forEach(b => b.setAttribute('aria-pressed', b.dataset.delay === state.env.delayMode ? 'true' : 'false'));
    root.querySelectorAll('[data-fail]').forEach(b => b.setAttribute('aria-pressed', b.dataset.fail === state.env.failMode ? 'true' : 'false'));
    root.querySelectorAll('[data-day]').forEach(b => b.setAttribute('aria-pressed', parseInt(b.dataset.day, 10) === state.currentDay ? 'true' : 'false'));
    root.querySelectorAll('[data-toggle]').forEach(i => { i.checked = !!state.env[i.dataset.toggle]; });
    const r = root.querySelector('[data-delay-readout]');
    const n = root.querySelector('[data-delay-note]');
    if (r && state.view) {
      r.textContent = formatDelay(state.view.delayS);
      const src = state.env.delayMode === 'MODEL' ? `day ${state.currentDay} model` : esc(LINK_PRESETS[state.env.delayMode]?.label || '');
      n.textContent = ` one way · ${src} · ${state.view.delayS < live ? 'live call possible' : 'too far for a live call'}`;
    }
  });
}

export function resetDemo() {
  if (!confirm('Reset the demo? This clears logged check-ins, the countermeasure checklist and the packet queue, and returns to day 40.')) return;
  localStorage.removeItem('landfall_custom_checkins');
  localStorage.removeItem('landfall_countermeasures');
  clearQueue();
  AppState.setExerciseHours(1.2, false);
  AppState.whatIf.targetedRegionBoost = {};
  AppState.microLabSettings = {};
  AppState.rewardedScans.clear();
  AppState.completedScansCount = 3;
  AppState.env.delayMode = 'MODEL'; AppState.env.linkUp = true; AppState.env.onboardSupport = true;
  AppState.setEnv({ failMode: 'off' });
  AppState.setDay(40);
  closeDrawer();
  activateTab('today');
  window.location.hash = 'today';
}

/* ---------- Drawer ---------- */
let lastFocus = null;
export function openDrawer() {
  const d = $('#sim-drawer');
  lastFocus = document.activeElement;
  d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
  $('#sim-scrim').classList.add('open');
  setTimeout(() => d.querySelector('button')?.focus(), 50);
}
export function closeDrawer() {
  const d = $('#sim-drawer');
  if (!d.classList.contains('open')) return false;
  d.classList.remove('open'); d.setAttribute('aria-hidden', 'true');
  $('#sim-scrim').classList.remove('open');
  lastFocus?.focus?.();
  return true;
}
export const drawerOpen = () => $('#sim-drawer').classList.contains('open');

export function initSimulation() {
  const body = $('#sim-drawer-body');
  body.innerHTML = `
    <p class="small">Change where the ship is and what's on board, and watch the decision change everywhere in the app. This is the core idea: <b>the same symptom needs a different response at a different distance.</b></p>
    ${envControlsHTML({ withDays: true })}`;
  bindEnvControls(body);
  $('#btn-open-sim').addEventListener('click', openDrawer);
  $('#btn-close-sim').addEventListener('click', closeDrawer);
  $('#sim-scrim').addEventListener('click', closeDrawer);
}
