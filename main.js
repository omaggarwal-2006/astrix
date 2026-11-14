/**
 * LANDFALL - "The View From The Ship" Main Controller (main.js)
 * Implements:
 * 1. The Mission Scene (Top Starfield, Hohmann Arc, Earth & Mars scaling, Packet flight)
 * 2. Overview: Health Constellation (replacing radar) + Mars Readiness Glyph
 * 3. Monitor: Suited Astronaut Outline Map + Restyled Chart.js Lines
 * 4. Forecast: Flight-Path Cones reshaping with slider
 * 5. Triage & Comms: Triage decision + DTN queue list
 * 6. Sources: Dynamically rendered from teammate's sources.js
 */

import { getAlerts, getForecast, getReadings, getBaseline, mapSeverity } from "./adapter.js";
import { handleAlert } from "./pipeline.js";
import { getQueue, onChange as onQueueChange, setLink as setQueueLink, config as queueConfig } from "./queue.js";
import { SOURCES, LINK_PRESETS, ASSUMPTIONS, DISCLAIMER } from "./sources.js";
import { sampleAlert } from "./sample_alert.js";
import { MissionScene } from "./js/mission-scene.js";
import { HealthConstellation } from "./js/constellation.js";
import { renderTrajectoryCone } from "./js/cone-renderer.js";

export const AppState = {
  currentDay: 40,
  maxDays: 180,
  activeTab: 'overview',
  exerciseHours: 1.2,
  activePresetKey: 'MARS_MID',
  activeBodyPart: 'head',
  missionScene: null,
  constellation: null,
  trendCharts: {},
  demoInterval: null,
  isDemoRunning: false,

  setDay(day, notify = true) {
    this.currentDay = Math.max(1, Math.min(this.maxDays, parseInt(day, 10)));
    if (this.missionScene) {
      this.missionScene.setDay(this.currentDay, false);
    }
    this.updateTelemetryText();
    if (notify) {
      this.renderCurrentTab();
    }
  },

  updateTelemetryText() {
    const day = this.currentDay;
    const remaining = this.maxDays - day;
    const dist = (0.38 + (day / 180) * 224.62).toFixed(1);

    const elDay = document.getElementById('telemetry-day');
    const elDist = document.getElementById('telemetry-distance');
    const elRemaining = document.getElementById('telemetry-remaining');

    if (elDay) elDay.textContent = `Day ${day} / ${this.maxDays}`;
    if (elDist) elDist.textContent = `${dist} M km`;
    if (elRemaining) elRemaining.textContent = `${remaining} days to landing`;
  },

  renderCurrentTab() {
    renderOverviewTab();
    renderMonitorTab();
    renderForecastTab();
    renderTriageTab();
    renderSourcesTab();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Service Worker Registration for offline use
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 1. Initialize Mission Scene Canvas
  AppState.missionScene = new MissionScene('mission-scene-canvas', 'mission-scrubber-slider', (newDay) => {
    AppState.setDay(newDay, true);
  });

  // 2. Initialize Health Constellation Canvas
  AppState.constellation = new HealthConstellation('health-constellation-canvas');

  initNavigation();
  initScenarioButtons();
  initDemoRunner();
  initTitleScreen();

  // Subscribe to queue changes
  onQueueChange(() => {
    renderQueueTable(getQueue());
    if (AppState.missionScene) AppState.missionScene.draw();
  });

  // Initial link preset
  const preset = LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID;
  setQueueLink({ available: true, delay_s: preset.delay_s });

  // Initial load sweep
  orchestrateInitialLoad();
});

function orchestrateInitialLoad() {
  AppState.setDay(40);
  const ring = document.getElementById('mars-progress-ring');
  if (ring) {
    ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.2, 0.9, 0.3, 1)';
  }
}

// Slim Top Navigation
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      activateTab(tabId);
    });
  });
}

export function activateTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isTarget = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', isTarget);
    panel.hidden = !isTarget;
  });

  AppState.renderCurrentTab();
}

// -------------------------------------------------------------
// STEP 2: OVERVIEW TAB (HEALTH CONSTELLATION & MARS GLYPH)
// -------------------------------------------------------------
function renderOverviewTab() {
  const day = AppState.currentDay;
  const forecast = getForecast(day, AppState.exerciseHours);
  const alerts = getAlerts(day);

  // Update Constellation
  if (AppState.constellation) {
    AppState.constellation.setData(forecast);
  }

  // Update Landing Readiness Mars-glyph ring
  const midValues = forecast.map(f => f.landing.mid);
  const avg = Math.round(midValues.reduce((a, b) => a + b, 0) / midValues.length);
  const status = avg >= 90 ? 'nominal' : (avg >= 82 ? 'caution' : 'alarm');

  const numEl = document.getElementById('readiness-number');
  const sentenceEl = document.getElementById('readiness-sentence');
  const ring = document.getElementById('mars-progress-ring');

  if (numEl) numEl.textContent = `${avg}%`;
  if (sentenceEl) {
    sentenceEl.textContent = status === 'nominal'
      ? 'Fit for landing operations on Mars.'
      : (status === 'caution' ? 'Caution: Elevated physiological drift detected.' : 'At risk on landing day: urgent countermeasures required.');
    sentenceEl.style.color = status === 'nominal' ? '#3FB59A' : (status === 'caution' ? '#E8A93A' : '#E5594F');
  }
  if (ring) {
    const offset = 283 - (283 * (avg / 100));
    ring.style.strokeDashoffset = offset;
    ring.setAttribute('stroke', status === 'nominal' ? '#3FB59A' : (status === 'caution' ? '#E8A93A' : '#E5594F'));
  }

  // Active alerts list
  renderAlertsList(alerts);
}

function renderAlertsList(alerts) {
  const container = document.getElementById('active-alerts-container');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; background: #090F18; border: 1px solid var(--hull-line); border-radius: 4px; font-size: 15px; color: var(--starlight-dim);">
        <span class="shape-circle"></span> No active alerts. All systems nominal relative to personal baseline.
      </div>
    `;
    return;
  }

  let html = '';
  alerts.forEach(a => {
    const map = mapSeverity(a.severity);
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #090E17; border: 1px solid var(--hull-line); border-radius: 4px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="${map.shapeClass}" title="${map.label}"></span>
          <div>
            <div style="font-family: var(--font-heading); font-size: 16px; color: var(--starlight); font-weight: 600;">
              ${a.id} &bull; ${a.metric} (${a.current} vs baseline ${a.baseline})
            </div>
            <div style="font-size: 14.5px; color: #B0BCBA; margin-top: 2px;">${a.reason}</div>
          </div>
        </div>
        <span class="status-badge status-${map.status}">
          <span class="${map.shapeClass}"></span> ${map.label}
        </span>
      </div>
    `;
  });
  container.innerHTML = html;
}

// -------------------------------------------------------------
// STEP 3: MONITOR TAB (SUITED BODY MAP & TRENDS)
// -------------------------------------------------------------
function renderMonitorTab() {
  const day = AppState.currentDay;
  const readings = getReadings(day);
  const alerts = getAlerts(day);

  renderSuitedBodyMap(alerts, readings);
  renderQuietPanels(readings, alerts);
  renderTrendLines(day);
}

function renderSuitedBodyMap(alerts, readings) {
  const hasHead = alerts.some(a => a.metric === 'sleep_h' || a.metric === 'cabin_co2');
  const hasChest = alerts.some(a => a.metric === 'hr_bpm');
  const hasLegs = alerts.some(a => a.metric === 'exercise_min');

  const setPart = (id, hasAlert, severity) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (hasAlert) {
      el.style.stroke = severity >= 3 ? '#E5594F' : '#E8A93A';
      el.style.fill = severity >= 3 ? 'rgba(229, 89, 79, 0.25)' : 'rgba(232, 169, 58, 0.25)';
    } else {
      el.style.stroke = '#3FB59A';
      el.style.fill = 'rgba(63, 181, 154, 0.15)';
    }
  };

  setPart('suit-helmet', hasHead, 3);
  setPart('suit-chest', hasChest, 2);
  setPart('suit-torso', false, 1);
  setPart('suit-arms', false, 1);
  setPart('suit-legs', hasLegs, 2);

  renderBodyReadout(AppState.activeBodyPart, readings, alerts);

  // Bind clicks
  ['helmet', 'chest', 'torso', 'arms', 'legs'].forEach(part => {
    const el = document.getElementById(`suit-${part}`);
    if (el && !el.dataset.bound) {
      el.dataset.bound = "true";
      el.addEventListener('click', () => {
        AppState.activeBodyPart = part;
        renderBodyReadout(part, getReadings(AppState.currentDay), getAlerts(AppState.currentDay));
      });
    }
  });
}

function renderBodyReadout(part, readings, alerts) {
  const box = document.getElementById('suited-body-readout');
  if (!box) return;

  const v = readings.vitals;
  const names = {
    helmet: 'Helmet & Neurosensory (Circadian Sleep & Cabin CO2)',
    chest: 'Chest & Life Support (Cardiovascular Autonomic Tone)',
    torso: 'Torso Core (Visceral Microgravity Fluid Shift)',
    arms: 'Upper Limbs & Suit Dexterity (Grip Strength)',
    legs: 'Lower Limbs & Calcaneus (Bone Density & Soleus Tone)'
  };

  let desc = '';
  if (part === 'helmet') {
    const alert = alerts.find(a => a.metric === 'sleep_h');
    desc = alert ? `Alert: ${alert.reason}. Spaceflight stress & CO2 accumulation present.` : `Sleep ${v.sleep_h} h (within baseline). Pupillary reflex nominal.`;
  } else if (part === 'chest') {
    desc = `Heart rate: ${v.hr_bpm} bpm. BP: ${v.bp_sys}/${v.bp_dia} mmHg. Stable autonomic tone.`;
  } else if (part === 'torso') {
    desc = `Core temp: ${v.temp_c}°C. Visceral circulatory adaptation stable.`;
  } else if (part === 'arms') {
    desc = `Grip strength retention: 94%. Upper extremity joint mobility nominal.`;
  } else if (part === 'legs') {
    desc = `Daily exercise: ${v.exercise_min} mins. Heel calcaneus bone load monitored against microgravity resorption.`;
  }

  box.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--hull-line); padding-bottom: 8px; margin-bottom: 10px;">
      <strong style="font-family: var(--font-heading); font-size: 17px; color: var(--starlight);">${names[part] || part}</strong>
      <span class="status-badge status-nominal">Telemetry monitored</span>
    </div>
    <p style="font-size: 15px; color: #CAD5D4; line-height: 1.5;">${desc}</p>
  `;
}

function renderQuietPanels(readings, alerts) {
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
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <span class="shape-triangle"></span>
        <div>
          <strong style="color: var(--starlight); font-size: 15.5px;">Headache plus high CO2: check the scrubber first.</strong>
          <div style="font-size: 14px; color: #CAD5D4; margin-top: 2px;">
            Hypercapnia suspected (${c.co2} ppm vs 4500 ppm ceiling). Inspect Amine Bed canister before administering analgesics.
          </div>
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

function renderTrendLines(activeDay) {
  if (!window.Chart) return;
  drawRestyledTrend('trend-sleep-chart', 'sleep_h', 7.4, 3.0, 9.0, 'Hours', activeDay);
  drawRestyledTrend('trend-mood-chart', 'mood', 4.2, 1.0, 5.0, 'Score (1-5)', activeDay);
  drawRestyledTrend('trend-hr-chart', 'hr_bpm', 64, 50, 95, 'BPM', activeDay);

  const sumSleep = document.getElementById('plain-sleep-summary');
  if (sumSleep) {
    const d = getReadings(activeDay).vitals.sleep_h;
    if (activeDay >= 40 && activeDay <= 52) {
      sumSleep.textContent = `Sleep ${d} h vs baseline 7.4 h, ${activeDay - 39} days running. Acute circadian collapse window.`;
      sumSleep.style.color = '#FFAAA3';
    } else {
      sumSleep.textContent = `Sleep ${d} h vs baseline 7.4 h, steady physiological continuity.`;
      sumSleep.style.color = '#9FAAA8';
    }
  }
}

function drawRestyledTrend(canvasId, key, baseVal, yMin, yMax, yUnit, activeDay) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const days = Array.from({ length: 180 }, (_, i) => i + 1);
  const values = days.map(d => getReadings(d).vitals[key]);
  const baseline = new Array(180).fill(baseVal);
  const activePoint = new Array(180).fill(null);
  activePoint[activeDay - 1] = values[activeDay - 1];

  if (AppState.trendCharts[canvasId]) {
    AppState.trendCharts[canvasId].data.datasets[2].data = activePoint;
    AppState.trendCharts[canvasId].update('none');
    return;
  }

  const ctx = canvas.getContext('2d');
  AppState.trendCharts[canvasId] = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => `D${d}`),
      datasets: [
        {
          label: 'Recorded Value',
          data: values,
          borderColor: '#3FB59A',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.15
        },
        {
          label: 'Baseline (Ring color)',
          data: baseline,
          borderColor: '#243044',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0
        },
        {
          label: 'Active Mission Day',
          data: activePoint,
          borderColor: '#E8A93A',
          backgroundColor: '#E8A93A',
          pointRadius: 5,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          grid: { color: 'rgba(36, 48, 68, 0.4)' },
          ticks: { color: '#9FAAA8', maxTicksLimit: 12, font: { size: 12 } }
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(36, 48, 68, 0.4)' },
          ticks: { color: '#9FAAA8', font: { size: 12 } },
          title: { display: true, text: yUnit, color: '#9FAAA8', font: { size: 13 } }
        }
      },
      plugins: {
        legend: { labels: { color: '#E8E4D8', font: { size: 13 } } }
      }
    }
  });
}

// -------------------------------------------------------------
// STEP 4: FORECAST TAB (FLIGHT-PATH CONE)
// -------------------------------------------------------------
function renderForecastTab() {
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
}

function initScenarioButtons() {
  const btn15 = document.getElementById('btn-scenario-15');
  const btn12 = document.getElementById('btn-scenario-12');
  const btn00 = document.getElementById('btn-scenario-00');
  const slider = document.getElementById('adherence-slider-input');

  const update = (hrs) => {
    AppState.exerciseHours = hrs;
    if (slider) slider.value = hrs;
    renderForecastTab();
    renderOverviewTab();
  };

  if (btn15) btn15.addEventListener('click', () => update(1.5));
  if (btn12) btn12.addEventListener('click', () => update(1.2));
  if (btn00) btn00.addEventListener('click', () => update(0.0));

  if (slider) {
    slider.addEventListener('input', (e) => {
      AppState.exerciseHours = parseFloat(e.target.value);
      renderForecastTab();
      renderOverviewTab();
    });
  }
}

// -------------------------------------------------------------
// STEP 5: TRIAGE & COMMS AND SOURCES
// -------------------------------------------------------------
function renderTriageTab() {
  const day = AppState.currentDay;
  const readings = getReadings(day);
  const alerts = getAlerts(day);
  const alert = alerts.length > 0 ? alerts[0] : sampleAlert;

  const preset = LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID;
  const env = {
    onboardSupport: true,
    link: { available: true, delay_s: preset.delay_s }
  };

  const ctx = {
    missionDay: day,
    current: readings.vitals,
    baseline: getBaseline(),
    trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1],
    trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
    cabin: readings.cabin,
    countermeasure: "Enforce circadian sleep hygiene protocol."
  };

  const result = handleAlert(alert, ctx, env);
  const decision = result.decision;

  const pathEl = document.getElementById('triage-path-display');
  const whyEl = document.getElementById('triage-why-display');
  const deliveryEl = document.getElementById('triage-delivery-display');

  if (pathEl) {
    const titles = {
      SELF_CARE: 'Self-Treat',
      CREW_MEDICAL_OFFICER: 'Crew Medical Officer',
      FLIGHT_SURGEON: 'Flight Surgeon'
    };
    pathEl.textContent = titles[decision.path] || decision.path;
  }
  if (whyEl) whyEl.textContent = decision.why;
  if (deliveryEl) deliveryEl.textContent = `Delivery: ${decision.delivery}`;

  // Link selector
  initLinkSelector();
  renderQueueTable(getQueue());
}

function initLinkSelector() {
  const select = document.getElementById('link-preset-select');
  if (!select) return;

  if (select.children.length === 0) {
    Object.keys(LINK_PRESETS).forEach(k => {
      const p = LINK_PRESETS[k];
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${p.label} (${p.delay_s}s 1-way) - ${p.note}`;
      if (k === AppState.activePresetKey) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      AppState.activePresetKey = e.target.value;
      const chosen = LINK_PRESETS[e.target.value];
      setQueueLink({ available: true, delay_s: chosen.delay_s });
      renderTriageTab();
    });
  }

  const speedupNote = document.getElementById('queue-clock-speedup');
  if (speedupNote) {
    const speedRatio = queueConfig.speedup;
    const minsSim = (speedRatio / 60).toFixed(1);
    speedupNote.textContent = `demo clock: 1 s = ${minsSim} min`;
  }
}

function renderQueueTable(queue) {
  const container = document.getElementById('queue-items-container');
  if (!container) return;

  if (queue.length === 0) {
    container.innerHTML = `<div style="padding: 16px; color: var(--starlight-dim); font-size: 15px;">No packets currently queued.</div>`;
    return;
  }

  let html = '';
  queue.forEach(entry => {
    const p = entry.packet;
    const statusMap = {
      QUEUED: { label: 'Queued', shape: 'shape-circle', status: 'caution' },
      TRANSMITTED: { label: 'Transmitted', shape: 'shape-triangle', status: 'caution' },
      ACKNOWLEDGED: { label: 'Acknowledged', shape: 'shape-circle', status: 'nominal' },
      FAILED: { label: 'Failed (retrying)', shape: 'shape-diamond', status: 'alarm' }
    };
    const s = statusMap[p.status] || statusMap.QUEUED;

    html += `
      <div style="background: #080D16; border: 1px solid var(--hull-line); border-radius: 4px; padding: 14px 18px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <strong style="font-family: var(--font-heading); font-size: 16px; color: var(--starlight);">${p.packet_id} (${p.priority})</strong>
          <span class="status-badge status-${s.status}">
            <span class="${s.shape}"></span> ${s.label}
          </span>
        </div>
        <div style="font-size: 14.5px; color: #CAD5D4; margin-bottom: 4px; word-break: normal; overflow-wrap: break-word;">
          ${p.anomaly}
        </div>
        <div style="font-size: 13.5px; color: var(--starlight-dim);">
          Attempts: <strong>${entry.attempts}</strong> &bull; Ground Reply: <span style="font-family: var(--font-mono); color: #B5C5C4;">${entry.ground_reply || 'Awaiting transmission acknowledgement...'}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderSourcesTab() {
  const container = document.getElementById('sources-content-view');
  if (!container) return;

  let html = `
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--nominal-teal); margin-bottom: 6px;">Operational Disclaimer</h3>
      <p style="font-size: 16px; color: var(--starlight); line-height: 1.5;">${DISCLAIMER}</p>
    </div>

    <!-- NASA Hazard Principle: Separate sentences, no quotes -->
    <div style="background: #090E17; border-left: 3px solid var(--nominal-teal); padding: 16px 20px; margin-bottom: 24px; border-radius: 2px;">
      <p style="font-size: 15.5px; color: var(--starlight); line-height: 1.5;">
        NASA human research identifies that microgravity hazards can feed off one another.
        In LANDFALL, our design links environmental cabin sensor readings directly to crew physiological symptoms.
      </p>
    </div>

    <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">Official NASA Sources &amp; Literature</h3>
    <div style="margin-bottom: 28px;">
  `;

  SOURCES.forEach(s => {
    html += `
      <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 14px 18px; margin-bottom: 10px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;">
          <strong style="font-family: var(--font-heading); font-size: 16.5px; color: var(--starlight);">${s.title}</strong>
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="color: var(--earthlight); font-size: 14px; text-decoration: none;">
            NASA Link &nearr;
          </a>
        </div>
        <p style="font-size: 14.5px; color: var(--starlight-dim);">${s.supports}</p>
      </div>
    `;
  });

  html += `
    </div>

    <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">Modelling Assumptions (ASSUMPTIONS)</h3>
    <ul style="padding-left: 24px; font-size: 15.5px; color: #CAD5D4; line-height: 1.6;">
  `;

  ASSUMPTIONS.forEach(a => {
    html += `<li style="margin-bottom: 8px;">${a}</li>`;
  });

  html += `</ul>`;
  container.innerHTML = html;
}

// -------------------------------------------------------------
// STEP 7: DEMO RUNNER (Days 35 to 60)
// -------------------------------------------------------------
function initDemoRunner() {
  const btn = document.getElementById('btn-play-demo');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (AppState.isDemoRunning) {
      stopDemo();
    } else {
      startDemo();
    }
  });
}

function startDemo() {
  AppState.isDemoRunning = true;
  const btn = document.getElementById('btn-play-demo');
  if (btn) {
    btn.textContent = 'Stop demo';
    btn.classList.add('active');
  }

  AppState.setDay(35);
  activateTab('overview');
  showCaption("Day 35: Nominal cruise. Healthy sleep (7.4h), calm vitals, 1.5h exercise adherence.");

  let step = 35;
  AppState.demoInterval = setInterval(() => {
    step += 1;
    AppState.setDay(step);

    if (step === 40) {
      activateTab('monitor');
      showCaption("Day 40: Acute sleep collapse (4.2h)! Headache reported. Cabin CO2 spikes to 5200 ppm. 'Check scrubber first' rule triggers.");
    } else if (step === 44) {
      activateTab('forecast');
      showCaption("Day 44 (Evaluate): Trajectory cones widen and turn red as cumulative sleep debt impacts landing readiness.");
    } else if (step === 48) {
      AppState.exerciseHours = 1.5;
      const slider = document.getElementById('adherence-slider-input');
      if (slider) slider.value = 1.5;
      renderForecastTab();
      showCaption("Day 48: Raising What-If exercise adherence to 1.5 hrs/day restores landing-day bone and aerobic flight cones.");
    } else if (step === 54) {
      activateTab('triage');
      showCaption("Day 54 (Act): Comm delay is 12m+ round-trip. Autonomous triage assigns resolution to Crew Medical Officer via store-and-forward packet.");
    } else if (step >= 60) {
      stopDemo();
      showCaption("Demo complete: Gathered personal baseline drift, evaluated landing-day risk, acted autonomously across the delay.");
      setTimeout(hideCaption, 5000);
    }
  }, 1000);
}

function stopDemo() {
  AppState.isDemoRunning = false;
  if (AppState.demoInterval) clearInterval(AppState.demoInterval);
  const btn = document.getElementById('btn-play-demo');
  if (btn) {
    btn.textContent = 'Play 30-second demo';
    btn.classList.remove('active');
  }
}

function showCaption(text) {
  const toast = document.getElementById('demo-caption-toast');
  const textEl = document.getElementById('demo-caption-text');
  if (toast && textEl) {
    textEl.textContent = text;
    toast.classList.add('visible');
  }
}

function hideCaption() {
  const toast = document.getElementById('demo-caption-toast');
  if (toast) toast.classList.remove('visible');
}

function initTitleScreen() {
  const modal = document.getElementById('title-screen-modal');
  const btn = document.getElementById('btn-start-mission');
  if (btn && modal) {
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}
