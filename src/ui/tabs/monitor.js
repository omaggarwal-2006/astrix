/**
 * LANDFALL - Monitor tab: twin, check-in form, quiet cabin and immune panels (src/ui/tabs/monitor.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../../app/state.js";
import { getAlerts, getReadings } from "../../core/adapter.js";
import { renderTrendLines } from "../components/trend-chart.js";
import { renderTwin } from "../extras/twin.js";

// -------------------------------------------------------------
// STEP 3: MONITOR TAB (4-LEVEL KINEMATIC DIGITAL TWIN & TRENDS)
// -------------------------------------------------------------
export function renderMonitorTab() {
  const day = AppState.currentDay;
  const readings = getReadings(day);
  const alerts = getAlerts(day);

  renderTwin(readings, alerts);
  renderQuietPanels(readings, alerts);
  renderTrendLines(day);
}

export function initCheckinForm() {
  const form = document.getElementById('monitor-checkin-form');
  const errBox = document.getElementById('checkin-error-msg');
  const succBox = document.getElementById('checkin-success-msg');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errBox) errBox.style.display = 'none';
    if (succBox) succBox.style.display = 'none';

    const hr = parseFloat(document.getElementById('monitor-hr').value);
    const sys = parseFloat(document.getElementById('monitor-sys').value);
    const dia = parseFloat(document.getElementById('monitor-dia').value);
    const temp = parseFloat(document.getElementById('monitor-temp').value);
    const sleep = parseFloat(document.getElementById('monitor-sleep').value);
    const mood = parseFloat(document.getElementById('monitor-mood').value);
    const exercise = parseFloat(document.getElementById('monitor-exercise').value);

    // Validation rules with plain error messages
    if (isNaN(hr) || hr < 35 || hr > 220) {
      showError('Heart rate must be between 35 and 220 bpm.');
      return;
    }
    if (isNaN(sys) || sys < 70 || sys > 220) {
      showError('Systolic BP must be between 70 and 220 mmHg.');
      return;
    }
    if (isNaN(dia) || dia < 40 || dia > 140) {
      showError('Diastolic BP must be between 40 and 140 mmHg.');
      return;
    }
    if (isNaN(temp) || temp < 34.0 || temp > 42.0) {
      showError('Core temperature must be between 34.0 and 42.0 °C.');
      return;
    }
    if (isNaN(sleep) || sleep < 0.0 || sleep > 16.0) {
      showError('Sleep hours must be between 0.0 and 16.0 hours.');
      return;
    }
    if (isNaN(mood) || mood < 1.0 || mood > 5.0) {
      showError('Mood score must be between 1.0 and 5.0.');
      return;
    }
    if (isNaN(exercise) || exercise < 0 || exercise > 240) {
      showError('Daily exercise must be between 0 and 240 minutes.');
      return;
    }

    // Save to localStorage
    const key = 'landfall_custom_checkins';
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[AppState.currentDay] = { hr, sys, dia, temp, sleep, mood, exercise, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(existing));

    if (succBox) {
      succBox.style.display = 'block';
      succBox.textContent = `Check-in for Day ${AppState.currentDay} logged and saved to telemetry memory.`;
      setTimeout(() => {
        if (succBox) succBox.style.display = 'none';
      }, 5000);
    }

    AppState.renderCurrentTab();
  });

  function showError(msg) {
    if (errBox) {
      errBox.style.display = 'block';
      errBox.textContent = msg;
    }
  }
}

export function renderQuietPanels(readings, alerts) {
  const c = readings.cabin;
  const im = readings.immune;
  const rad = readings.radiation;

  const co2El = document.getElementById('quiet-co2');
  const tempEl = document.getElementById('quiet-temp');
  const noiseEl = document.getElementById('quiet-noise');
  const radEl = document.getElementById('quiet-rad');
  const alertBox = document.getElementById('scrubber-alert-callout');

  if (co2El) co2El.textContent = `${c.co2} ppm`;
  if (tempEl) tempEl.textContent = `${c.temp} °C`;
  if (noiseEl) noiseEl.textContent = `${c.noise} dBA`;
  if (radEl) radEl.textContent = `${rad.cumulativeDose} mSv`;

  // Headache plus high CO2 (4500 ppm ceiling) rule
  const hasHeadache = readings.symptoms.includes('headache') || alerts.some(a => a.metric === 'cabin_co2');
  const highCO2 = c.co2 >= 4500;

  if (alertBox) {
    if (hasHeadache && highCO2) {
      alertBox.style.display = 'block';
      alertBox.innerHTML = `
        <span class="shape-diamond"></span>
        <strong>Headache plus high CO2: check the scrubber first</strong>
        <div style="font-size: 14px; color: #FFCCC7; margin-top: 3px; font-weight: 400;">
          Cabin CO2 is ${c.co2} ppm (operating limit: 4500 ppm). Check the Amine Bed scrubber canister before treating headache symptoms.
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  }

  // Immune indicators
  const setIm = (id, active) => {
    const el = document.getElementById(id);
    if (el) {
      el.className = `status-badge ${active ? 'status-caution' : 'status-nominal'}`;
      el.innerHTML = `<span class="${active ? 'shape-triangle' : 'shape-circle'}"></span> ${active ? 'Active' : 'Nominal'}`;
    }
  };

  setIm('immune-status-cold-sore', im.coldSore);
  setIm('immune-status-rash', im.rash);
  setIm('immune-status-fatigue', im.fatigue);
}
