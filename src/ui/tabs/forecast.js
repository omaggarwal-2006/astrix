/**
 * LANDFALL - Forecast tab: flight-path cones, scenarios, adherence slider, countermeasures (src/ui/tabs/forecast.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../../app/state.js";
import { getForecast, mapSeverity } from "../../core/adapter.js";
import { renderTwin } from "../extras/twin.js";
import { renderOverviewTab } from "./overview.js";
import { renderTrajectoryCone } from "../visuals/cone-renderer.js";

// -------------------------------------------------------------
// STEP 4: FORECAST TAB (FLIGHT-PATH CONES & COUNTERMEASURES)
// -------------------------------------------------------------
export function renderForecastTab() {
  const day = AppState.currentDay;
  const forecast = getForecast(day, AppState.exerciseHours);
  const container = document.getElementById('cones-grid-container');
  if (!container) return;

  const sliderVal = document.getElementById('adherence-slider-val');
  if (sliderVal) sliderVal.textContent = `${AppState.exerciseHours.toFixed(1)} hrs/day`;

  let html = '';
  forecast.forEach((f, idx) => {
    const map = mapSeverity(f.status);
    const verifyNote = (f.dimension.includes('Bone') || f.dimension.includes('Aerobic')) ? ' (verify on source page)' : '';

    html += `
      <div class="cone-card">
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px;">
          <strong style="font-family: var(--font-heading); font-size: 18px; color: var(--starlight);">${f.dimension}</strong>
          <span class="status-badge status-${map.status}">
            <span class="${map.shapeClass}"></span> ${map.label}
          </span>
        </div>

        <div style="display: flex; align-items: baseline; justify-content: space-between;">
          <span style="font-size: 14px; color: var(--starlight-dim);">Departure Baseline (100%) &rarr;</span>
          <span style="font-size: 14px; color: var(--starlight-dim);">Landing Day Arrival (${f.landing.low}% &ndash; ${f.landing.high}%)</span>
        </div>

        <div class="cone-canvas-box">
          <canvas id="cone-canvas-${idx}" class="cone-canvas"></canvas>
        </div>

        <div style="display: flex; align-items: baseline; justify-content: space-between; font-size: 14px; margin-top: 4px;">
          <span style="color: var(--starlight-dim);">Estimated range (illustrative): <strong>${f.landing.low}% &ndash; ${f.landing.high}%</strong></span>
          <a href="${f.citationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--earthlight); text-decoration: none;">
            NASA Reference &nearr;${verifyNote}
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Render canvas cones
  forecast.forEach((f, idx) => {
    const canvas = document.getElementById(`cone-canvas-${idx}`);
    renderTrajectoryCone(canvas, f.landing.low, f.landing.mid, f.landing.high, f.status);
  });

  renderCountermeasuresChecklist();
}

export const COUNTERMEASURES_LIST = [
  { id: 'cm_ared', label: 'Resistive vibration exercise load protocol (ARED-II) \u2022 1.5 hrs/day' },
  { id: 'cm_light', label: 'Dynamic blue-enriched (460 nm) circadian phase-shifting entrainment' },
  { id: 'cm_amine', label: 'Cabin LiOH / Solid Amine scrubber canister exchange & hypercapnia purge' },
  { id: 'cm_antiviral', label: 'Low-dose Valacyclovir antiviral prophylaxis for dormant HSV-1 suppression' },
  { id: 'cm_sleep_hygiene', label: 'Dark-cabin acoustic attenuation and scheduled sleep hygiene window' }
];

export function renderCountermeasuresChecklist() {
  const container = document.getElementById('countermeasures-checklist');
  if (!container) return;

  const saved = JSON.parse(localStorage.getItem('landfall_countermeasures') || '{}');
  let html = '';

  COUNTERMEASURES_LIST.forEach(cm => {
    const checked = saved[cm.id] !== undefined ? saved[cm.id] : true;
    html += `
      <div class="countermeasure-item">
        <input type="checkbox" id="${cm.id}" ${checked ? 'checked' : ''} data-cm="${cm.id}">
        <label for="${cm.id}">${cm.label}</label>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-cm');
      const cur = JSON.parse(localStorage.getItem('landfall_countermeasures') || '{}');
      cur[id] = e.target.checked;
      localStorage.setItem('landfall_countermeasures', JSON.stringify(cur));
    });
  });
}

export function initScenarioButtons() {
  const btn15 = document.getElementById('btn-scenario-15');
  const btn12 = document.getElementById('btn-scenario-12');
  const btn00 = document.getElementById('btn-scenario-00');
  const slider = document.getElementById('adherence-slider-input');

  const update = (hrs) => {
    AppState.setExerciseHours(hrs);
    if (slider) slider.value = hrs;

    [btn15, btn12, btn00].forEach(b => {
      if (b) b.classList.remove('active');
    });

    if (hrs === 1.5 && btn15) btn15.classList.add('active');
    if (hrs === 1.2 && btn12) btn12.classList.add('active');
    if (hrs === 0.0 && btn00) btn00.classList.add('active');

    renderForecastTab();
    renderOverviewTab();
    renderTwin();
    AppState.updateTelemetryText();
  };

  if (btn15) btn15.addEventListener('click', () => update(1.5));
  if (btn12) btn12.addEventListener('click', () => update(1.2));
  if (btn00) btn00.addEventListener('click', () => update(0.0));

  if (slider) {
    slider.addEventListener('input', (e) => update(parseFloat(e.target.value)));
  }
}
