/**
 * LANDFALL - Main Architecture Controller (main.js)
 * ES Module wiring Teammates' logic (pipeline.js, queue.js, sources.js)
 * with the UI tabs and the adapter layer (adapter.js).
 */

import { getAlerts, getForecast, getReadings, getBaseline, mapSeverity } from "./adapter.js";
import { handleAlert } from "./pipeline.js";
import { getQueue, onChange as onQueueChange, setLink as setQueueLink, config as queueConfig } from "./queue.js";
import { SOURCES, NUMBERS, LINK_PRESETS, ASSUMPTIONS, DISCLAIMER } from "./sources.js";
import { sampleAlert } from "./sample_alert.js";

// Global Shared Mission State
export const AppState = {
  currentDay: 40,
  maxDays: 180,
  activeTab: 'overview',
  exerciseHours: 1.2,
  activePresetKey: 'MARS_MID',
  activeBodyPart: 'head',
  radarChartInstance: null,
  trendCharts: {},
  demoInterval: null,
  isDemoRunning: false,

  setDay(day, notify = true) {
    this.currentDay = Math.max(1, Math.min(this.maxDays, parseInt(day, 10)));
    this.updateMissionRibbon();
    if (notify) {
      this.renderActiveTab();
    }
  },

  updateMissionRibbon() {
    const day = this.currentDay;
    const percent = ((day - 1) / (this.maxDays - 1)) * 100;
    const daysRemaining = this.maxDays - day;

    // Comm delay calculation based on Hohmann orbital distance
    const delaySec = Math.round(1.5 + (day / 180) * 750);
    const mins = Math.floor(delaySec / 60);
    const secs = delaySec % 60;
    const delayStr = `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    const distStr = `${(0.38 + (day / 180) * 224.62).toFixed(1)} M km`;

    const elDay = document.getElementById('telemetry-day');
    const elDist = document.getElementById('telemetry-distance');
    const elDelay = document.getElementById('telemetry-delay');
    if (elDay) elDay.textContent = `Day ${day} / ${this.maxDays}`;
    if (elDist) elDist.textContent = distStr;
    if (elDelay) elDelay.textContent = delayStr;

    const ribDay = document.getElementById('ribbon-day-number');
    const ribRemaining = document.getElementById('ribbon-days-remaining');
    const ribDelay = document.getElementById('ribbon-comm-delay-val');
    const ribProgress = document.getElementById('transit-progress');
    const shipMarker = document.getElementById('ship-marker');
    const slider = document.getElementById('mission-day-slider');

    if (ribDay) ribDay.textContent = day;
    if (ribRemaining) ribRemaining.textContent = daysRemaining;
    if (ribDelay) ribDelay.textContent = delayStr;
    if (ribProgress) ribProgress.style.width = `${percent}%`;
    if (shipMarker) shipMarker.style.left = `${percent}%`;
    if (slider && parseInt(slider.value, 10) !== day) slider.value = day;
  },

  renderActiveTab() {
    renderOverviewTab();
    renderMonitorTab();
    renderForecastTab();
    renderTriageTab();
    renderSourcesTab();
  }
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for 100% offline support
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Service Worker registration note:', err);
    });
  }

  initTabNavigation();
  initMissionRibbon();
  initDemoRunner();
  initTitleScreen();
  initScenarioButtons();

  // Subscribe to queue changes
  onQueueChange((queue) => {
    renderQueueTable(queue);
  });

  // Set initial link preset from teammate's sources.js
  const initialPreset = LINK_PRESETS.MARS_MID;
  setQueueLink({ available: true, delay_s: initialPreset.delay_s });

  AppState.setDay(40);
});

// Tab Navigation
function initTabNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      activateTab(target);
    });
  });
}

export function activateTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(b => {
    const isTarget = b.getAttribute('data-tab') === tabId;
    b.classList.toggle('active', isTarget);
    b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-panel').forEach(p => {
    const isTarget = p.id === `panel-${tabId}`;
    p.classList.toggle('active', isTarget);
    p.hidden = !isTarget;
  });

  AppState.renderActiveTab();
}

// Mission Ribbon Controller
function initMissionRibbon() {
  const slider = document.getElementById('mission-day-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      AppState.setDay(e.target.value);
    });
  }
}

// -------------------------------------------------------------
// TAB 1: OVERVIEW (GATHER)
// 6-Dimension Radar Chart (landing.mid vs 1.0 flat ring) + Alerts
// -------------------------------------------------------------
function renderOverviewTab() {
  const day = AppState.currentDay;
  const forecast = getForecast(day, AppState.exerciseHours);
  const alerts = getAlerts(day);

  renderOverviewRadar(forecast);
  renderActiveAlertsList(alerts);
  updateReadinessDial(forecast);
}

function updateReadinessDial(forecast) {
  const midValues = forecast.map(f => f.landing.mid);
  const avg = Math.round(midValues.reduce((a, b) => a + b, 0) / midValues.length);
  const status = avg >= 90 ? 'nominal' : (avg >= 82 ? 'caution' : 'alarm');

  const dialScore = document.getElementById('overview-dial-score');
  const dialStatusWord = document.getElementById('overview-status-word');
  const dialMeterBar = document.getElementById('overview-meter-bar');

  if (dialScore) dialScore.textContent = `${avg}%`;
  if (dialStatusWord) {
    const map = mapSeverity(status);
    dialStatusWord.textContent = map.label;
    dialStatusWord.className = `status-badge status-${map.status}`;
  }
  if (dialMeterBar) {
    const offset = 283 - (283 * (avg / 100));
    dialMeterBar.style.strokeDashoffset = offset;
    dialMeterBar.setAttribute('stroke', status === 'nominal' ? 'var(--scrubber-teal)' : (status === 'caution' ? 'var(--caution-amber)' : 'var(--alarm-red)'));
  }
}

function renderOverviewRadar(forecast) {
  const canvas = document.getElementById('radar-overview-chart');
  if (!canvas || !window.Chart) return;

  const labels = forecast.map(f => f.dimension);
  // Each axis uses landing.mid as ratio relative to 100% nominal baseline (1.0)
  const ratios = forecast.map(f => +(f.landing.mid / 100).toFixed(2));
  const referenceRing = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

  if (AppState.radarChartInstance) {
    AppState.radarChartInstance.data.datasets[0].data = ratios;
    AppState.radarChartInstance.update('none');
    return;
  }

  const ctx = canvas.getContext('2d');
  AppState.radarChartInstance = new window.Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Landing Day Forecast Ratio (landing.mid)',
          data: ratios,
          backgroundColor: 'rgba(47, 143, 131, 0.28)',
          borderColor: '#2F8F83',
          borderWidth: 2,
          pointBackgroundColor: '#2F8F83',
          pointRadius: 4
        },
        {
          label: 'Nominal Baseline Ring (1.0)',
          data: referenceRing,
          borderColor: 'rgba(230, 235, 234, 0.65)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0.5,
          max: 1.3,
          ticks: {
            stepSize: 0.2,
            color: '#98A8A6',
            backdropColor: 'transparent',
            font: { size: 10, family: 'Barlow' }
          },
          grid: { color: 'rgba(255, 255, 255, 0.12)' },
          angleLines: { color: 'rgba(255, 255, 255, 0.12)' },
          pointLabels: {
            color: '#E6EBEA',
            font: { size: 11.5, family: 'Barlow Semi Condensed', weight: 600 }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#E6EBEA', font: { size: 11, family: 'Barlow' } }
        }
      }
    }
  });
}

function renderActiveAlertsList(alerts) {
  const container = document.getElementById('overview-alerts-list');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="padding: 12px; background: #07121B; border: 1px solid #162B3D; border-radius: 2px; font-size: 13px; color: #98A8A6;">
        <span class="shape-circle"></span> No active alerts. All biomarkers align with personal baseline.
      </div>
    `;
    return;
  }

  let html = '';
  alerts.forEach(a => {
    const map = mapSeverity(a.severity);
    html += `
      <div class="flag-item flag-${map.status}" style="margin-bottom: 8px;">
        <span class="${map.shapeClass}" title="${map.label}"></span>
        <div class="flag-content">
          <strong>${a.id} &bull; ${a.metric.toUpperCase()} (${a.current} vs baseline ${a.baseline})</strong>
          <p>${a.reason}</p>
        </div>
        <span class="status-badge status-${map.status}">
          <span class="${map.shapeClass}"></span> ${map.label.toUpperCase()}
        </span>
      </div>
    `;
  });
  container.innerHTML = html;
}

// -------------------------------------------------------------
// TAB 2: MONITOR (GATHER)
// Check-In Form, Chart.js Lines, Clickable Body Map, Cabin & Immune
// -------------------------------------------------------------
function renderMonitorTab() {
  const day = AppState.currentDay;
  const readings = getReadings(day);
  const alerts = getAlerts(day);

  populateCheckInForm(readings);
  renderBodyMap(alerts, readings);
  renderCabinPanel(readings, alerts);
  renderImmunePanel(readings);
  renderRadiationPanel(readings);
  renderTrendsCharts(day);
}

function populateCheckInForm(readings) {
  const v = readings.vitals;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('monitor-checkin-hr', v.hr_bpm);
  setVal('monitor-checkin-sys', v.bp_sys);
  setVal('monitor-checkin-dia', v.bp_dia);
  setVal('monitor-checkin-temp', v.temp_c);
  setVal('monitor-checkin-sleep', v.sleep_h);
  setVal('monitor-checkin-mood', v.mood);
  setVal('monitor-checkin-exercise', v.exercise_min);
}

function renderBodyMap(alerts, readings) {
  // Map alerts to body zones
  const hasHead = alerts.some(a => a.metric === 'sleep_h' || a.metric === 'cabin_co2');
  const hasChest = alerts.some(a => a.metric === 'hr_bpm' || a.metric === 'bp_sys');
  const hasLegs = alerts.some(a => a.metric === 'exercise_min');

  const setPartStatus = (partId, isAlert, severityNum) => {
    const el = document.getElementById(`body-${partId}`);
    if (el) {
      if (isAlert) {
        el.style.fill = severityNum >= 3 ? '#C8322B' : '#E3A21A';
      } else {
        el.style.fill = '#2F8F83';
      }
    }
  };

  const maxSeverity = alerts.length > 0 ? Math.max(...alerts.map(a => a.severity)) : 1;
  setPartStatus('head', hasHead, maxSeverity);
  setPartStatus('chest', hasChest, 2);
  setPartStatus('torso', false, 1);
  setPartStatus('arms', false, 1);
  setPartStatus('legs', hasLegs, 2);

  renderBodyPartDetail(AppState.activeBodyPart, readings, alerts);
}

function renderBodyPartDetail(partId, readings, alerts) {
  const pane = document.getElementById('body-part-readout');
  if (!pane) return;

  const v = readings.vitals;
  const titles = {
    head: 'Head & Neurosensory (Sleep & CO2)',
    chest: 'Chest, Pulmonary & Autonomic Tone',
    torso: 'Torso & Visceral Microgravity Shift',
    arms: 'Upper Limbs & Grip Retention',
    legs: 'Lower Limbs & Calcaneus Bone Load'
  };

  let detail = '';
  if (partId === 'head') {
    const sleepAlert = alerts.find(a => a.metric === 'sleep_h');
    detail = sleepAlert 
      ? `Alert active: ${sleepAlert.reason}. Headache reported secondary to hypercapnia.` 
      : `Sleep: ${v.sleep_h} h (nominal). Pupillary reflex normal.`;
  } else if (partId === 'chest') {
    detail = `Heart rate: ${v.hr_bpm} bpm. Blood pressure: ${v.bp_sys}/${v.bp_dia} mmHg. Stable autonomic tone.`;
  } else if (partId === 'torso') {
    detail = `Core temperature: ${v.temp_c}°C. Visceral circulation nominal.`;
  } else if (partId === 'arms') {
    detail = `Grip strength retention: 94%. Skin integrity intact.`;
  } else if (partId === 'legs') {
    detail = `Daily exercise: ${v.exercise_min} mins. Soleus tone retention: 88%.`;
  }

  pane.innerHTML = `
    <div class="body-detail-header">
      <strong>${titles[partId]}</strong>
      <span class="status-badge status-nominal">MONITORED</span>
    </div>
    <p class="body-detail-text">${detail}</p>
  `;
}

function renderCabinPanel(readings, alerts) {
  const c = readings.cabin;
  const co2El = document.getElementById('cabin-co2-val');
  const tempEl = document.getElementById('cabin-temp-val');
  const noiseEl = document.getElementById('cabin-noise-val');
  const alertBox = document.getElementById('scrubber-alert-box');

  // Single-line CO2 value
  if (co2El) co2El.innerHTML = `<span class="cabin-co2-row"><strong>${c.co2}</strong>&nbsp;ppm</span>`;
  if (tempEl) tempEl.textContent = `${c.temp} °C`;
  if (noiseEl) noiseEl.textContent = `${c.noise} dBA`;

  // Headache plus high CO2 (4500 ppm ceiling) rule
  const hasHeadache = readings.symptoms.includes('headache') || alerts.some(a => a.metric === 'cabin_co2');
  const highCO2 = c.co2 >= 4500;

  if (alertBox) {
    if (hasHeadache && highCO2) {
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <span class="shape-triangle" aria-hidden="true"></span>
        <div>
          <strong>Headache plus high CO2: check the scrubber first.</strong>
          <div style="font-size: 12.5px; margin-top: 2px;">
            Hypercapnia suspected (${c.co2} ppm vs 4500 ppm limit). Inspect Amine Bed canister before administering analgesics.
          </div>
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  }
}

function renderImmunePanel(readings) {
  const im = readings.immune;
  const setIndicator = (id, active) => {
    const el = document.getElementById(id);
    if (el) {
      el.className = `immune-item ${active ? 'active-warning' : 'nominal'}`;
    }
  };

  setIndicator('immune-rash', im.rash);
  setIndicator('immune-cold-sore', im.coldSore);
  setIndicator('immune-fever', im.fever);
  setIndicator('immune-fatigue', im.fatigue);
}

function renderRadiationPanel(readings) {
  const rad = readings.radiation;
  const cumEl = document.getElementById('rad-cum-val');
  const dailyEl = document.getElementById('rad-daily-val');

  if (cumEl) cumEl.textContent = `${rad.cumulativeDose} mSv`;
  if (dailyEl) dailyEl.textContent = `${rad.dailyDose} mSv/d`;
}

function renderTrendsCharts(day) {
  if (!window.Chart) return;
  // Chart.js 180-day lines are rendered smoothly
  renderTrendLineChart('chart-monitor-sleep', 'sleep_h', 7.4, 3.0, 9.0, 'Hours', day);
  renderTrendLineChart('chart-monitor-mood', 'mood', 4.2, 1.0, 5.0, 'Score 1-5', day);
  renderTrendLineChart('chart-monitor-hr', 'hr_bpm', 64, 50, 95, 'BPM', day);

  const sleepSummary = document.getElementById('trend-summary-sleep');
  if (sleepSummary) {
    if (day >= 40 && day <= 50) {
      sleepSummary.textContent = `Sleep 4.2 h vs baseline 7.4 h, ${day - 39} days running. Acute circadian collapse.`;
      sleepSummary.className = 'plain-summary alarm';
    } else {
      sleepSummary.textContent = `Sleep 7.4 h vs baseline 7.4 h, nominal physiological continuity.`;
      sleepSummary.className = 'plain-summary nominal';
    }
  }
}

function renderTrendLineChart(canvasId, metricKey, baseVal, yMin, yMax, yUnit, activeDay) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const days = Array.from({ length: 180 }, (_, i) => i + 1);
  const values = days.map(d => getReadings(d).vitals[metricKey]);
  const baselineValues = new Array(180).fill(baseVal);
  const activeCursor = new Array(180).fill(null);
  activeCursor[activeDay - 1] = values[activeDay - 1];

  if (AppState.trendCharts[canvasId]) {
    AppState.trendCharts[canvasId].data.datasets[2].data = activeCursor;
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
          borderColor: '#2F8F83',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Personal Baseline',
          data: baselineValues,
          borderColor: 'rgba(230, 235, 234, 0.55)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: 'Active Mission Day',
          data: activeCursor,
          borderColor: '#E3A21A',
          backgroundColor: '#E3A21A',
          pointRadius: 6,
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
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: { color: '#98A8A6', maxTicksLimit: 12, font: { size: 10 } }
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          ticks: { color: '#98A8A6', font: { size: 10 } },
          title: { display: true, text: yUnit, color: '#98A8A6' }
        }
      },
      plugins: {
        legend: { labels: { color: '#E6EBEA', font: { size: 11 } } }
      }
    }
  });
}

// -------------------------------------------------------------
// TAB 3: FORECAST (EVALUATE)
// Low/Mid/High Ranges, 3 Scenario Buttons, Exercise Slider
// -------------------------------------------------------------
function renderForecastTab() {
  const day = AppState.currentDay;
  const forecast = getForecast(day, AppState.exerciseHours);

  const container = document.getElementById('forecast-cards-grid');
  if (!container) return;

  const sliderDisplay = document.getElementById('forecast-adherence-val');
  if (sliderDisplay) sliderDisplay.textContent = `${AppState.exerciseHours.toFixed(1)} hrs/day`;

  let html = '';
  forecast.forEach(f => {
    const map = mapSeverity(f.status);
    const verifyNote = (f.dimension.includes('Bone') || f.dimension.includes('Aerobic')) ? ' (verify on source page)' : '';

    html += `
      <div class="forecast-plate" data-status="${map.status}">
        <div class="forecast-plate-top">
          <span class="forecast-metric-title">${f.dimension}</span>
          <span class="status-badge status-${map.status}">
            <span class="${map.shapeClass}"></span> ${map.label.toUpperCase()}
          </span>
        </div>

        <div class="forecast-value-row">
          <span class="forecast-big-num num">${f.landing.mid}%</span>
          <div class="forecast-range-box">
            <span class="range-label">Estimated range (illustrative):</span>
            <span class="range-val num">${f.landing.low}% &ndash; ${f.landing.high}%</span>
          </div>
        </div>

        <div class="forecast-rate-desc">
          ${f.assumptions[0]}
        </div>

        <div class="forecast-citation-box">
          <span class="cite-label">NASA SOURCE:</span>
          <a href="${f.citationUrl}" target="_blank" rel="noopener noreferrer" class="cite-text" style="color: #9BB0AF; text-decoration: none;">
            NASA Reference Page &nearr;${verifyNote}
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function initScenarioButtons() {
  const btnAdherent = document.getElementById('btn-scenario-adherent');
  const btnNominal = document.getElementById('btn-scenario-nominal');
  const btnZero = document.getElementById('btn-scenario-zero');
  const slider = document.getElementById('forecast-adherence-slider');

  const setScenario = (hrs) => {
    AppState.exerciseHours = hrs;
    if (slider) slider.value = hrs;
    renderForecastTab();
    renderOverviewTab();
  };

  if (btnAdherent) btnAdherent.addEventListener('click', () => setScenario(1.5));
  if (btnNominal) btnNominal.addEventListener('click', () => setScenario(1.2));
  if (btnZero) btnZero.addEventListener('click', () => setScenario(0.0));

  if (slider) {
    slider.addEventListener('input', (e) => {
      AppState.exerciseHours = parseFloat(e.target.value);
      renderForecastTab();
      renderOverviewTab();
    });
  }
}

// -------------------------------------------------------------
// TAB 4: TRIAGE & COMMS (ACT)
// Wired to pipeline.js, queue.js, and sources.js LINK_PRESETS
// -------------------------------------------------------------
function renderTriageTab() {
  const day = AppState.currentDay;
  const readings = getReadings(day);
  const alerts = getAlerts(day);

  // Select primary active alert
  const primaryAlert = alerts.length > 0 ? alerts[0] : sampleAlert;

  // Selected link preset from sources.js
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
    countermeasure: "Inspect Amine Bed scrubber canister. Enforce circadian sleep hygiene."
  };

  // Execute pipeline
  const result = handleAlert(primaryAlert, ctx, env);
  const decision = result.decision;

  // Render Decision Box
  const pathEl = document.getElementById('triage-path-val');
  const deliveryEl = document.getElementById('triage-delivery-val');
  const whyEl = document.getElementById('triage-why-val');
  const scoreEl = document.getElementById('triage-score-val');

  if (pathEl) pathEl.textContent = decision.path.replace(/_/g, ' ');
  if (deliveryEl) deliveryEl.textContent = decision.delivery.replace(/_/g, ' ');
  if (whyEl) whyEl.textContent = decision.why;
  if (scoreEl) scoreEl.textContent = `Triage Score: ${decision.score} (Severity ${primaryAlert.severity})`;

  // Render Link Selector Dropdown from LINK_PRESETS
  renderLinkDropdown();

  // Render Queue Table
  renderQueueTable(getQueue());
}

function renderLinkDropdown() {
  const select = document.getElementById('comms-preset-select');
  if (!select) return;

  if (select.children.length === 0) {
    Object.keys(LINK_PRESETS).forEach(key => {
      const p = LINK_PRESETS[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${p.label} (1-way: ${p.delay_s}s) - ${p.note}`;
      if (key === AppState.activePresetKey) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      AppState.activePresetKey = e.target.value;
      const chosen = LINK_PRESETS[e.target.value];
      setQueueLink({ available: true, delay_s: chosen.delay_s });
      renderTriageTab();
    });
  }

  const speedupNote = document.getElementById('queue-speedup-note');
  if (speedupNote) {
    speedupNote.textContent = `Demo speed-up active: 1s in real-time = ${queueConfig.speedup}s simulated flight latency.`;
  }
}

function renderQueueTable(queue) {
  const tbody = document.getElementById('queue-table-tbody');
  if (!tbody) return;

  if (queue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #98A8A6;">No telemetry packets queued.</td></tr>`;
    return;
  }

  let html = '';
  queue.forEach((entry, idx) => {
    const p = entry.packet;
    const statusClass = `status-${p.status}`;
    const replyText = entry.ground_reply || (p.status === 'TRANSMITTING' ? 'Signal traveling across interplanetary path...' : 'Pending flight surgeon review.');

    html += `
      <tr class="queue-row ${statusClass}">
        <td><strong>${p.packet_id}</strong></td>
        <td><span class="status-badge status-${p.status === 'ACKNOWLEDGED' ? 'nominal' : (p.status === 'FAILED' ? 'alarm' : 'caution')}">${p.status}</span></td>
        <td>${entry.attempts}</td>
        <td style="font-size: 12px; font-family: var(--font-mono);">${replyText}</td>
        <td><span class="num">${p.priority}</span></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// -------------------------------------------------------------
// TAB 5: SOURCES & HONESTY
// SOURCES, ASSUMPTIONS, and DISCLAIMER read from teammate's sources.js
// -------------------------------------------------------------
function renderSourcesTab() {
  const container = document.getElementById('sources-content-container');
  if (!container) return;

  let html = `
    <!-- Disclaimer -->
    <div class="gap-statement-callout" style="border-left: 3px solid var(--scrubber-teal); margin-bottom: 20px;">
      <h4 style="margin-bottom: 4px;">Operational Honesty &amp; Model Statement</h4>
      <p style="font-size: 14px; color: #E6EBEA;">${DISCLAIMER}</p>
    </div>

    <!-- NASA Hazard Principle (Fixed: separate sentences, no quotes) -->
    <div class="hazard-overview-banner" style="margin-bottom: 20px;">
      <p>
        NASA human research identifies that microgravity hazards can feed off one another.
        In LANDFALL, our design links environmental cabin sensor readings directly to crew physiological symptoms.
      </p>
    </div>

    <!-- Official Sources from teammate sources.js -->
    <h3 class="sources-heading">Peer-Reviewed Literature &amp; Official References (SOURCES)</h3>
    <table class="queue-table" style="margin-bottom: 24px;">
      <thead>
        <tr>
          <th>Source ID</th>
          <th>Title &amp; Reference</th>
          <th>Operational Mapping</th>
        </tr>
      </thead>
      <tbody>
  `;

  SOURCES.forEach(s => {
    html += `
      <tr>
        <td><span class="feature-tag">${s.id}</span></td>
        <td>
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="nasa-cite-link" style="color: #38BDF8; font-weight: 600;">
            ${s.title} &nearr;
          </a>
        </td>
        <td style="font-size: 12.5px;">${s.supports}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>

    <!-- Engineering Assumptions -->
    <h3 class="sources-heading">Operational &amp; Modelling Assumptions (ASSUMPTIONS)</h3>
    <ul style="padding-left: 20px; line-height: 1.6; font-size: 13.5px; color: #CAD5D4; margin-bottom: 24px;">
  `;

  ASSUMPTIONS.forEach(a => {
    html += `<li style="margin-bottom: 6px;">${a}</li>`;
  });

  html += `
    </ul>
  `;

  container.innerHTML = html;
}

// -------------------------------------------------------------
// JUDGE DEMO RUNNER (Days 35 to 60)
// -------------------------------------------------------------
function initDemoRunner() {
  const btnPlay = document.getElementById('btn-play-demo');
  const btnReset = document.getElementById('btn-reset-demo');

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (AppState.isDemoRunning) {
        stopDemo();
      } else {
        startDemo();
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Reset simulation to Day 40 baseline?')) {
        localStorage.removeItem('landfall_queue');
        AppState.setDay(40);
        activateTab('overview');
      }
    });
  }
}

function startDemo() {
  AppState.isDemoRunning = true;
  const btnPlay = document.getElementById('btn-play-demo');
  if (btnPlay) {
    btnPlay.textContent = 'Stop demo';
    btnPlay.classList.add('active');
  }

  AppState.setDay(35);
  activateTab('overview');
  showDemoCaption("Day 35: Nominal baseline cruise. 7.4h sleep, calm vitals, full 1.5h exercise adherence.");

  let stepDay = 35;
  AppState.demoInterval = setInterval(() => {
    stepDay += 1;
    AppState.setDay(stepDay);

    if (stepDay === 40) {
      activateTab('monitor');
      showDemoCaption("Day 40: Acute sleep collapse (4.2h)! Headache reported. Cabin CO2 spikes to 5200 ppm. 'Check scrubber first' rule triggers.");
    } else if (stepDay === 44) {
      activateTab('forecast');
      showDemoCaption("Day 44 (Evaluate): Landing-day forecast projections degrade to caution/alarm based on published NASA rates.");
    } else if (stepDay === 48) {
      // Demonstrate What-If slider recovery
      AppState.exerciseHours = 1.5;
      const slider = document.getElementById('forecast-adherence-slider');
      if (slider) slider.value = 1.5;
      renderForecastTab();
      showDemoCaption("Day 48: Countermeasures engaged. Raising What-If exercise slider to 1.5 hrs/day restores landing-day bone and aerobic capacity.");
    } else if (stepDay === 54) {
      activateTab('triage');
      showDemoCaption("Day 54 (Act): Interplanetary delay is 12m+ round-trip. Autonomous triage transfers resolution to Crew Medical Officer via store-and-forward packet.");
    } else if (stepDay >= 60) {
      stopDemo();
      showDemoCaption("Demo complete: Gathered baseline drift, evaluated landing-day risk, acted autonomously across the delay.");
      setTimeout(hideDemoCaption, 5000);
    }
  }, 1000);
}

function stopDemo() {
  AppState.isDemoRunning = false;
  if (AppState.demoInterval) clearInterval(AppState.demoInterval);
  const btnPlay = document.getElementById('btn-play-demo');
  if (btnPlay) {
    btnPlay.textContent = 'Play 30-second demo';
    btnPlay.classList.remove('active');
  }
}

function showDemoCaption(text) {
  const toast = document.getElementById('demo-caption');
  const textEl = document.getElementById('demo-caption-text');
  if (toast && textEl) {
    textEl.textContent = text;
    toast.classList.add('visible');
  }
}

function hideDemoCaption() {
  const toast = document.getElementById('demo-caption');
  if (toast) toast.classList.remove('visible');
}

function initTitleScreen() {
  const modal = document.getElementById('title-screen-modal');
  const btnStart = document.getElementById('btn-start-mission');
  if (!modal || !btnStart) return;

  btnStart.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}
