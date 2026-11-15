/**
 * LANDFALL - Forecast (step 2): landing-day readiness per dimension, the exercise what-if,
 * and the countermeasure checklist (src/ui/tabs/forecast.js)
 */

import { AppState } from "../../app/state.js";
import { $, esc, forecastPill, pill, countUp } from "../dom.js";
import { renderTrajectoryCone } from "../visuals/cone-renderer.js";
import { GameState, playSound, showUnlockToast } from "../extras/gamification.js";

export const COUNTERMEASURES_LIST = [
  { id: 'cm_ared', label: 'Resistive exercise on ARED, 1.5 h/day' },
  { id: 'cm_light', label: 'Blue-enriched (460 nm) lighting to shift the circadian rhythm' },
  { id: 'cm_amine', label: 'Swap the CO2 scrubber canister and purge the cabin' },
  { id: 'cm_antiviral', label: 'Antiviral for cold-sore reactivation, only as directed by the CMO' },
  { id: 'cm_sleep_hygiene', label: 'Dark, quiet cabin and a protected sleep window' }
];

const SCENARIOS = [
  { h: 1.5, label: 'Adherent · 1.5 h' },
  { h: 1.2, label: 'Nominal · 1.2 h' },
  { h: 0.0, label: 'No exercise · 0 h' },
];

export function mountForecast() {
  const panel = document.getElementById('panel-forecast');
  panel.innerHTML = `
    <div class="view-head">
      <div>
        <span class="eyebrow"><span class="step-no">2</span>Forecast</span>
        <h1>Will this astronaut be ready on landing day?</h1>
        <p>Projections to day 180 built on NASA-published loss rates, shown as ranges. Move the exercise slider to see what effort changes. The response curve is our assumption.</p>
      </div>
    </div>

    <article class="card reveal" style="--i:0">
      <div class="whatif">
        <div>
          <label class="field-label" for="adherence-slider-input">What if: daily exercise</label>
          <div class="row" style="justify-content: space-between; align-items: flex-end;">
            <div class="whatif-value"><span id="adherence-slider-val">1.2</span><small>h / day</small></div>
            <div class="segmented" role="group" aria-label="Exercise scenarios" id="scenario-buttons">
              ${SCENARIOS.map(s => `<button data-h="${s.h}" id="btn-scenario-${String(s.h).replace('.', '')}${s.h === 0 ? '0' : ''}" aria-pressed="false">${s.label}</button>`).join('')}
            </div>
          </div>
          <input type="range" id="adherence-slider-input" min="0" max="1.5" step="0.1" value="1.2" style="margin-top:14px" aria-describedby="whatif-scale">
          <div class="whatif-scale" id="whatif-scale"><span>0 h</span><span>NASA reference 1.5 h/day</span></div>
        </div>
        <div style="text-align:right">
          <span class="eyebrow">Landing readiness</span>
          <div class="whatif-value" style="margin:6px 0 10px"><span id="forecast-score">0%</span></div>
          <div class="poll-summary" id="poll-summary" style="justify-content:flex-end"></div>
        </div>
      </div>
    </article>

    <div class="dims mt" id="cones-grid-container"></div>

    <div class="grid g-12 mt">
      <article class="card span-7 reveal" style="--i:7">
        <div class="card-head"><div><h3 class="card-title">Countermeasure checklist</h3><p class="card-sub">Saved on this device</p></div></div>
        <div class="countermeasure-list" id="countermeasures-checklist"></div>
      </article>
      <article class="card span-5 reveal" style="--i:8">
        <div class="card-head"><div><h3 class="card-title">How to read this</h3></div></div>
        <ul class="why-list">
          <li><span>Each cone starts at <b>100 %</b> of this astronaut's baseline on departure and opens toward landing day.</span></li>
          <li><span><b>GO</b> clears 90 %, <b>NO-GO</b> falls below 80 %. Both levels are team assumptions.</span></li>
          <li><span>Bone and fitness rates come from NASA's Human Research Program pages; balance, sleep and mood are lower confidence.</span></li>
          <li><span>Illustrative model on synthetic data, not a clinical predictor.</span></li>
        </ul>
      </article>
    </div>`;

  const slider = $('#adherence-slider-input');
  slider.addEventListener('input', () => AppState.setExerciseHours(parseFloat(slider.value)));
  $('#scenario-buttons').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-h]');
    if (b) AppState.setExerciseHours(parseFloat(b.dataset.h));
  });
  $('#countermeasures-checklist').addEventListener('change', (e) => {
    const id = e.target.getAttribute('data-cm');
    if (!id) return;
    const cur = JSON.parse(localStorage.getItem('landfall_countermeasures') || '{}');
    cur[id] = e.target.checked;
    localStorage.setItem('landfall_countermeasures', JSON.stringify(cur));
    if (e.target.checked) {
      playSound('click');
      const xpRes = GameState.awardXP(25, 'Countermeasure Checklist Completed');
      if (xpRes && xpRes.leveledUp) {
        showUnlockToast('Promoted!', `Rank advanced to ${xpRes.rank.title} (Level ${xpRes.rank.level})`, '⭐');
      }
    }
  });
}

export function renderForecastTab() {
  const v = AppState.view;
  if (!v) return;
  const h = AppState.exerciseHours;
  $('#adherence-slider-val').textContent = h.toFixed(1);
  const slider = $('#adherence-slider-input');
  if (document.activeElement !== slider) slider.value = h;
  document.querySelectorAll('#scenario-buttons button').forEach(b => b.setAttribute('aria-pressed', parseFloat(b.dataset.h) === h ? 'true' : 'false'));

  countUp($('#forecast-score'), v.readiness.score, { suffix: '%' });
  const counts = { nominal: 0, caution: 0, alarm: 0 };
  v.forecast.forEach(f => counts[f.status]++);
  $('#poll-summary').innerHTML = [
    pill('ok', 'shape-circle', `${counts.nominal} GO`),
    pill('warn', 'shape-triangle', `${counts.caution} WATCH`),
    pill('bad', 'shape-diamond', `${counts.alarm} NO-GO`),
  ].join('');

  const grid = $('#cones-grid-container');
  // Build the cards once, then update in place so the canvases don't flicker
  if (grid.children.length !== v.forecast.length) {
    grid.innerHTML = v.forecast.map((f, i) => `
      <article class="card dim reveal" style="--i:${i + 1}" data-dim="${i}">
        <div class="dim-head"><span class="dim-name">${esc(f.dimension)}</span><span class="dim-pill"></span></div>
        <div class="dim-value"><span class="dim-mid">0</span><small>% at landing</small></div>
        <div class="cone-canvas-box"><canvas id="cone-canvas-${i}" class="cone-canvas" aria-label="Projection cone for ${esc(f.dimension)}"></canvas></div>
        <div class="dim-foot"><span class="dim-range"></span><a href="${esc(f.citationUrl)}" target="_blank" rel="noopener noreferrer">NASA source ↗</a></div>
      </article>`).join('');
  }
  v.forecast.forEach((f, i) => {
    const card = grid.querySelector(`[data-dim="${i}"]`);
    card.className = `card dim status-${f.status}${card.classList.contains('reveal') ? ' reveal' : ''}`;
    card.style.setProperty('--i', i + 1);
    card.querySelector('.dim-pill').innerHTML = forecastPill(f.status);
    countUp(card.querySelector('.dim-mid'), f.landing.mid, { decimals: 1 });
    card.querySelector('.dim-range').textContent = `Range ${f.landing.low}–${f.landing.high} % · ${f.confidence.split(' (')[0]} confidence`;
    renderTrajectoryCone(document.getElementById(`cone-canvas-${i}`), f.landing.low, f.landing.mid, f.landing.high, f.status);
  });

  const saved = JSON.parse(localStorage.getItem('landfall_countermeasures') || '{}');
  const list = $('#countermeasures-checklist');
  if (!list.children.length) {
    list.innerHTML = COUNTERMEASURES_LIST.map(cm => `
      <label class="countermeasure-item" for="${cm.id}">
        <input type="checkbox" id="${cm.id}" data-cm="${cm.id}">
        <span>${esc(cm.label)}</span>
      </label>`).join('');
  }
  COUNTERMEASURES_LIST.forEach(cm => { const el = document.getElementById(cm.id); if (el) el.checked = saved[cm.id] !== undefined ? saved[cm.id] : true; });
}
