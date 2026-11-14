/**
 * LANDFALL - "The View From The Ship" Main Controller (main.js)
 * Implements:
 * 1. The Mission Scene (Top Starfield, Hohmann Arc, Earth & Mars scaling, Packet flight)
 * 2. Overview: Hero 72px Landing Readiness + Go/No-Go Poll + Health Constellation + Active Alerts
 * 3. Monitor: Suited Body Map with Escape-close + Check-In form with validation + 3 Trend Lines + Quiet Cabin
 * 4. Forecast: Flight-Path Cones + Scenario Buttons + Exercise Slider + Saved Countermeasure Checklist
 * 5. Triage & Comms: Triage Decision + setLink + Send/Copy Packet + Retry Failed DTN Queue + Emergency Link
 * 6. Sources: Dynamically rendered from sources.js + Gap Analysis + Sample vs Real contract table
 * 7. Demo runner: Play, Pause, Stop (returns to previous day) + Reset Demo
 */

import { getAlerts, getForecast, getReadings, getBaseline, mapSeverity } from "./adapter.js";
import { handleAlert } from "./pipeline.js";
import { getQueue, onChange as onQueueChange, setLink as setQueueLink, enqueue as enqueuePacket, config as queueConfig } from "./queue.js";
import { SOURCES, LINK_PRESETS, ASSUMPTIONS, DISCLAIMER } from "./sources.js";
import { sampleAlert } from "./sample_alert.js";
import { MissionScene } from "./js/mission-scene.js";
import { HealthConstellation } from "./js/constellation.js";
import { renderTrajectoryCone } from "./js/cone-renderer.js";

export const AppState = {
  currentDay: 40,
  preDemoDay: 40,
  maxDays: 180,
  activeTab: 'overview',
  activeTrendChart: 'sleep',
  exerciseHours: 1.2,
  activePresetKey: 'MARS_MID',
  activeBodyPart: 'helmet',
  missionScene: null,
  constellation: null,
  trendCharts: {},
  demoInterval: null,
  isDemoRunning: false,
  isDemoPaused: false,

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
    const delaySec = Math.round(1.3 + (day / 180) * 750);
    const delayMin = Math.floor(delaySec / 60);
    const delayRemSec = delaySec % 60;
    const delayStr = `${delayMin} min ${delayRemSec} s`;

    const elDay = document.getElementById('telemetry-day');
    const elDist = document.getElementById('telemetry-distance');
    const elRemaining = document.getElementById('telemetry-remaining');

    if (elDay) elDay.textContent = `Day ${day} / ${this.maxDays}`;
    if (elDist) elDist.textContent = `${dist} M km`;
    if (elRemaining) elRemaining.textContent = `${remaining} days to landing`;

    // Large sidebar readouts (Step 1)
    const elSceneDay = document.getElementById('scene-day-readout');
    const elSceneArrival = document.getElementById('scene-arrival-readout');
    const elSceneDelay = document.getElementById('scene-delay-readout');
    const elClockRate = document.getElementById('demo-clock-rate');
    const elPacketStatus = document.getElementById('scene-packet-status');

    if (elSceneDay) {
      elSceneDay.innerHTML = `Day ${day} <span class="readout-sub">of 180</span>`;
    }
    if (elSceneArrival) {
      elSceneArrival.innerHTML = `${remaining} <span class="readout-sub">days to landing</span>`;
    }
    if (elSceneDelay) {
      elSceneDelay.textContent = `Earth is ${delayStr} away`;
    }
    if (elClockRate) {
      const minPerSec = (queueConfig.speedup / 60).toFixed(1);
      elClockRate.textContent = `Demo clock: 1 s = ${minPerSec} min`;
    }

    // Telemetry downlink status from queue
    if (elPacketStatus) {
      const q = getQueue();
      if (!q || q.length === 0) {
        elPacketStatus.innerHTML = `<span class="shape-circle"></span> Link nominal`;
      } else {
        const last = q[q.length - 1];
        const st = last.packet.status;
        if (st === 'QUEUED') {
          elPacketStatus.innerHTML = `<span class="shape-triangle"></span> Packet queued`;
        } else if (st === 'TRANSMITTED') {
          elPacketStatus.innerHTML = `<span class="shape-triangle"></span> Downlink in flight`;
        } else if (st === 'ACKNOWLEDGED') {
          elPacketStatus.innerHTML = `<span class="shape-circle"></span> Uplink ACK verified`;
        } else if (st === 'FAILED') {
          elPacketStatus.innerHTML = `<span class="shape-diamond"></span> Link retry active`;
        }
      }
    }
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
  initSceneCollapse();
  initCheckinForm();
  initTrendChartButtons();
  initScenarioButtons();
  initTriageControls();
  initEmergencyModal();
  initDemoRunner();
  initResetDemoButton();
  initTitleScreen();

  // Escape key closes suited body map detail
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const box = document.getElementById('suited-body-readout');
      if (box) {
        box.innerHTML = `
          <div style="padding: 14px; color: var(--starlight-dim); font-size: 14.5px;">
            Body detail closed. Select any suited region on the astronaut to view localized telemetry.
          </div>
        `;
      }
    }
  });

  // Subscribe to queue changes
  onQueueChange(() => {
    renderQueueTable(getQueue());
    if (AppState.missionScene) AppState.missionScene.draw();
    AppState.updateTelemetryText();
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

// Slim Top Navigation with Hash Routing (#overview, #monitor, #forecast, #triage, #sources)
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) {
        window.location.hash = tabId;
        activateTab(tabId);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const raw = window.location.hash.replace('#', '').trim();
    if (raw && ['overview', 'monitor', 'forecast', 'triage', 'sources'].includes(raw)) {
      activateTab(raw);
    }
  });

  // Initial tab from hash or default to overview
  const initialHash = window.location.hash.replace('#', '').trim();
  if (initialHash && ['overview', 'monitor', 'forecast', 'triage', 'sources'].includes(initialHash)) {
    activateTab(initialHash);
  }
}

// Collapsible Scene Toggle (persisted in localStorage)
function initSceneCollapse() {
  const btn = document.getElementById('btn-toggle-scene');
  const content = document.getElementById('mission-scene-content');
  if (!btn || !content) return;

  const isCollapsed = localStorage.getItem('landfall_scene_collapsed') === 'true';
  if (isCollapsed) {
    content.classList.add('collapsed');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `Expand view <span id="scene-toggle-icon">+</span>`;
  }

  btn.addEventListener('click', () => {
    const currentlyCollapsed = content.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', currentlyCollapsed ? 'false' : 'true');
    btn.innerHTML = currentlyCollapsed ?
      `Expand view <span id="scene-toggle-icon">+</span>` :
      `Collapse view <span id="scene-toggle-icon">&minus;</span>`;
    localStorage.setItem('landfall_scene_collapsed', currentlyCollapsed ? 'true' : 'false');
    if (!currentlyCollapsed && AppState.missionScene) {
      AppState.missionScene.resize();
    }
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
// STEP 2: OVERVIEW TAB (HERO READINESS, GO/NO-GO POLL & CONSTELLATION)
// -------------------------------------------------------------
function renderOverviewTab() {
  const day = AppState.currentDay;
  const forecast = getForecast(day, AppState.exerciseHours);
  const alerts = getAlerts(day);

  // Update Constellation
  if (AppState.constellation) {
    AppState.constellation.setData(forecast);
  }

  // Update Landing Readiness Hero (72px)
  const midValues = forecast.map(f => f.landing.mid);
  const avg = Math.round(midValues.reduce((a, b) => a + b, 0) / midValues.length);
  const isNominal = avg >= 90;
  const isCaution = avg >= 82 && avg < 90;

  const numEl = document.getElementById('readiness-number');
  const sentenceEl = document.getElementById('readiness-sentence');
  const badgeEl = document.getElementById('readiness-badge');
  const ring = document.getElementById('mars-progress-ring');

  if (numEl) numEl.textContent = `${avg}%`;
  if (sentenceEl) {
    if (isNominal) {
      sentenceEl.textContent = 'Fit for landing.';
      sentenceEl.style.color = 'var(--nominal-teal)';
    } else {
      sentenceEl.textContent = 'At risk on landing day.';
      sentenceEl.style.color = isCaution ? 'var(--signal-amber)' : 'var(--alarm-coral)';
    }
  }

  if (badgeEl) {
    if (isNominal) {
      badgeEl.className = 'status-badge status-nominal';
      badgeEl.innerHTML = '<span class="shape-circle"></span> Nominally cleared';
    } else if (isCaution) {
      badgeEl.className = 'status-badge status-caution';
      badgeEl.innerHTML = '<span class="shape-triangle"></span> Countermeasures required';
    } else {
      badgeEl.className = 'status-badge status-alarm';
      badgeEl.innerHTML = '<span class="shape-diamond"></span> Critical flight risk';
    }
  }

  if (ring) {
    const offset = 283 - (283 * (avg / 100));
    ring.style.strokeDashoffset = offset;
    ring.setAttribute('stroke', isNominal ? '#3FB59A' : (isCaution ? '#E8A93A' : '#E5594F'));
  }

  // Render The Go / No-Go Poll (6 rows)
  renderGoNoGoPoll(forecast);

  // Active alerts list
  renderAlertsList(alerts);
}

function renderGoNoGoPoll(forecast) {
  const container = document.getElementById('gonogo-poll-container');
  if (!container) return;

  let html = `
    <table class="gonogo-table" role="table" aria-label="Landing Go No-Go System Poll">
      <thead>
        <tr>
          <th scope="col">System / Dimension</th>
          <th scope="col">Poll Status</th>
          <th scope="col">Landing Projection</th>
          <th scope="col" style="text-align: right;">Detail</th>
        </tr>
      </thead>
      <tbody>
  `;

  forecast.forEach(item => {
    const st = item.status;
    let badgeHtml = '';
    if (st === 'nominal') {
      badgeHtml = `<span class="gonogo-badge go"><span class="shape-circle"></span> GO</span>`;
    } else if (st === 'caution') {
      badgeHtml = `<span class="gonogo-badge watch"><span class="shape-triangle"></span> WATCH</span>`;
    } else {
      badgeHtml = `<span class="gonogo-badge nogo"><span class="shape-diamond"></span> NO-GO</span>`;
    }

    html += `
      <tr class="gonogo-row" tabindex="0" role="button" data-dimension="${item.dimension}" title="Click to inspect flight cone for ${item.dimension}">
        <td class="gonogo-cell-name">${item.dimension}</td>
        <td class="gonogo-cell-status">${badgeHtml}</td>
        <td class="gonogo-cell-value">
          <div class="gonogo-val-mid">${item.landing.mid}%</div>
          <div class="gonogo-val-range">Estimated range (illustrative): ${item.landing.low}% \u2013 ${item.landing.high}%</div>
        </td>
        <td class="gonogo-cell-jump">Inspect cone &rarr;</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // Add click handlers to rows jumping to Forecast
  container.querySelectorAll('.gonogo-row').forEach(row => {
    const jump = () => {
      const dim = row.getAttribute('data-dimension');
      window.location.hash = 'forecast';
      activateTab('forecast');
      setTimeout(() => {
        const target = Array.from(document.querySelectorAll('.cone-card strong')).find(el => el.textContent.includes(dim));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    };

    row.addEventListener('click', jump);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    });
  });
}

function renderAlertsList(alerts) {
  const container = document.getElementById('active-alerts-container');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="alerts-empty-state">
        <span class="shape-circle"></span> No active alerts. All systems nominal relative to personal baseline.
      </div>
    `;
    return;
  }

  let html = '';
  alerts.forEach(a => {
    const map = mapSeverity(a.severity);
    html += `
      <div class="alert-row-card" tabindex="0" role="button" data-alert-id="${a.id}" title="Click to evaluate alert ${a.id} in Triage & Comms">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span class="${map.shapeClass}" title="${map.label}"></span>
          <div>
            <div style="font-family: var(--font-heading); font-size: 16.5px; color: var(--starlight); font-weight: 600;">
              ${a.id} &bull; ${a.metric} (${a.current} vs personal baseline ${a.baseline})
            </div>
            <div style="font-size: 15px; color: #B0BCBA; margin-top: 3px;">${a.reason}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="status-badge status-${map.status}">
            <span class="${map.shapeClass}"></span> ${map.label}
          </span>
          <span style="font-size: 14px; color: var(--earthlight); white-space: nowrap;">Route to triage &rarr;</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  container.querySelectorAll('.alert-row-card').forEach(card => {
    const jump = () => {
      window.location.hash = 'triage';
      activateTab('triage');
    };
    card.addEventListener('click', jump);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    });
  });
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

function initCheckinForm() {
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

  // Bind clicks and keyboard Enter/Space
  ['helmet', 'chest', 'torso', 'arms', 'legs'].forEach(part => {
    const el = document.getElementById(`suit-${part}`);
    if (el && !el.dataset.bound) {
      el.dataset.bound = "true";
      const toggle = () => {
        if (AppState.activeBodyPart === part) {
          AppState.activeBodyPart = null;
          const box = document.getElementById('suited-body-readout');
          if (box) {
            box.innerHTML = `
              <div style="padding: 14px; color: var(--starlight-dim); font-size: 14.5px;">
                Body detail panel closed. Click any suit part to inspect readings.
              </div>
            `;
          }
        } else {
          AppState.activeBodyPart = part;
          renderBodyReadout(part, getReadings(AppState.currentDay), getAlerts(AppState.currentDay));
        }
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    }
  });
}

function renderBodyReadout(part, readings, alerts) {
  const box = document.getElementById('suited-body-readout');
  if (!box || !part) return;

  const v = readings.vitals;
  const names = {
    helmet: 'Helmet & Neuro-Circadian (Sleep & CO2)',
    chest: 'Chest & Autonomic Core (Cardiovascular Tone)',
    torso: 'Torso (Core Temperature & Visceral Fluid Shift)',
    arms: 'Upper Limbs (Muscle Endurance & Skin Check)',
    legs: 'Lower Limbs (Bone Density & Soleus Tone)'
  };

  let desc = '';
  let statusBadge = '<span class="status-badge status-nominal"><span class="shape-circle"></span> Nominal</span>';

  if (part === 'helmet') {
    const alert = alerts.find(a => a.metric === 'sleep_h');
    if (alert) {
      statusBadge = '<span class="status-badge status-alarm"><span class="shape-diamond"></span> Alarm</span>';
      desc = `Active Alert: ${alert.reason}. Spaceflight stress and elevated CO2 contribute to circadian disruption.`;
    } else {
      desc = `Sleep duration: ${v.sleep_h} h (within baseline). Pupillary reflexes and circadian alignment stable.`;
    }
  } else if (part === 'chest') {
    desc = `Heart rate: ${v.hr_bpm} bpm. BP: ${v.bp_sys}/${v.bp_dia} mmHg. Autonomic baroreflex regulation nominal.`;
  } else if (part === 'torso') {
    desc = `Core temp: ${v.temp_c} °C. Cephalad fluid shift compensated by venous compliance.`;
  } else if (part === 'arms') {
    desc = `Grip strength retention: 94%. Upper extremity joint mobility and suit glove dexterity nominal.`;
  } else if (part === 'legs') {
    const alert = alerts.find(a => a.metric === 'exercise_min');
    if (alert) {
      statusBadge = '<span class="status-badge status-caution"><span class="shape-triangle"></span> Caution</span>';
      desc = `Active Alert: ${alert.reason}. Ensure 1.5 hrs/day resistive load on ARED-II.`;
    } else {
      desc = `Daily exercise: ${v.exercise_min} mins. Heel calcaneus bone load monitored against microgravity resorption.`;
    }
  }

  box.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--hull-line); padding-bottom: 8px; margin-bottom: 10px;">
      <strong style="font-family: var(--font-heading); font-size: 17px; color: var(--starlight);">${names[part] || part}</strong>
      ${statusBadge}
    </div>
    <p style="font-size: 15px; color: #CAD5D4; line-height: 1.5; margin-bottom: 8px;">${desc}</p>
    <span style="font-size: 12.5px; color: var(--starlight-dim);">Click part again or press Escape to close.</span>
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

function initTrendChartButtons() {
  const btnSleep = document.getElementById('btn-chart-sleep');
  const btnMood = document.getElementById('btn-chart-mood');
  const btnHr = document.getElementById('btn-chart-hr');

  const showChart = (chartKey) => {
    AppState.activeTrendChart = chartKey;
    [btnSleep, btnMood, btnHr].forEach(b => {
      if (b) b.classList.remove('active');
    });

    const wrapSleep = document.getElementById('chart-wrap-sleep');
    const wrapMood = document.getElementById('chart-wrap-mood');
    const wrapHr = document.getElementById('chart-wrap-hr');

    if (wrapSleep) wrapSleep.style.display = chartKey === 'sleep' ? 'block' : 'none';
    if (wrapMood) wrapMood.style.display = chartKey === 'mood' ? 'block' : 'none';
    if (wrapHr) wrapHr.style.display = chartKey === 'hr' ? 'block' : 'none';

    if (chartKey === 'sleep' && btnSleep) btnSleep.classList.add('active');
    if (chartKey === 'mood' && btnMood) btnMood.classList.add('active');
    if (chartKey === 'hr' && btnHr) btnHr.classList.add('active');

    renderTrendLines(AppState.currentDay);
  };

  if (btnSleep) btnSleep.addEventListener('click', () => showChart('sleep'));
  if (btnMood) btnMood.addEventListener('click', () => showChart('mood'));
  if (btnHr) btnHr.addEventListener('click', () => showChart('hr'));
}

function renderTrendLines(activeDay) {
  if (!window.Chart) return;

  drawRestyledTrend('trend-sleep-chart', 'sleep_h', 7.4, 3.0, 9.0, 'Hours', activeDay);
  drawRestyledTrend('trend-mood-chart', 'mood', 4.2, 1.0, 5.0, 'Score (1-5)', activeDay);
  drawRestyledTrend('trend-hr-chart', 'hr_bpm', 64, 50, 95, 'BPM', activeDay);

  const sumEl = document.getElementById('plain-chart-summary');
  if (sumEl) {
    const readings = getReadings(activeDay).vitals;
    if (AppState.activeTrendChart === 'sleep') {
      if (activeDay >= 40 && activeDay <= 52) {
        sumEl.textContent = `Day ${activeDay}: Sleep dropped to ${readings.sleep_h} h vs baseline 7.4 h. Circadian disruption alert active.`;
        sumEl.style.color = '#FFAAA3';
      } else {
        sumEl.textContent = `Day ${activeDay}: Sleep is ${readings.sleep_h} h, steady with personal baseline.`;
        sumEl.style.color = 'var(--starlight)';
      }
    } else if (AppState.activeTrendChart === 'mood') {
      if (activeDay >= 43 && activeDay <= 55) {
        sumEl.textContent = `Day ${activeDay}: Mood score declined to ${readings.mood} / 5.0 secondary to chronic sleep debt.`;
        sumEl.style.color = '#E8A93A';
      } else {
        sumEl.textContent = `Day ${activeDay}: Behavioral health score is ${readings.mood} / 5.0, within expected nominal range.`;
        sumEl.style.color = 'var(--starlight)';
      }
    } else {
      sumEl.textContent = `Day ${activeDay}: Resting heart rate is ${readings.hr_bpm} bpm vs personal baseline 64 bpm. Stable autonomic regulation.`;
      sumEl.style.color = 'var(--starlight)';
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
          label: 'Personal Baseline',
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
// STEP 4: FORECAST TAB (FLIGHT-PATH CONES & COUNTERMEASURES)
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

  renderCountermeasuresChecklist();
}

const COUNTERMEASURES_LIST = [
  { id: 'cm_ared', label: 'Resistive vibration exercise load protocol (ARED-II) \u2022 1.5 hrs/day' },
  { id: 'cm_light', label: 'Dynamic blue-enriched (460 nm) circadian phase-shifting entrainment' },
  { id: 'cm_amine', label: 'Cabin LiOH / Solid Amine scrubber canister exchange & hypercapnia purge' },
  { id: 'cm_antiviral', label: 'Low-dose Valacyclovir antiviral prophylaxis for dormant HSV-1 suppression' },
  { id: 'cm_sleep_hygiene', label: 'Dark-cabin acoustic attenuation and scheduled sleep hygiene window' }
];

function renderCountermeasuresChecklist() {
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

function initScenarioButtons() {
  const btn15 = document.getElementById('btn-scenario-15');
  const btn12 = document.getElementById('btn-scenario-12');
  const btn00 = document.getElementById('btn-scenario-00');
  const slider = document.getElementById('adherence-slider-input');

  const update = (hrs) => {
    AppState.exerciseHours = hrs;
    if (slider) slider.value = hrs;

    [btn15, btn12, btn00].forEach(b => {
      if (b) b.classList.remove('active');
    });

    if (hrs === 1.5 && btn15) btn15.classList.add('active');
    if (hrs === 1.2 && btn12) btn12.classList.add('active');
    if (hrs === 0.0 && btn00) btn00.classList.add('active');

    renderForecastTab();
    renderOverviewTab();
  };

  if (btn15) btn15.addEventListener('click', () => update(1.5));
  if (btn12) btn12.addEventListener('click', () => update(1.2));
  if (btn00) btn00.addEventListener('click', () => update(0.0));

  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      AppState.exerciseHours = val;

      [btn15, btn12, btn00].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (val === 1.5 && btn15) btn15.classList.add('active');
      if (val === 1.2 && btn12) btn12.classList.add('active');
      if (val === 0.0 && btn00) btn00.classList.add('active');

      renderForecastTab();
      renderOverviewTab();
    });
  }
}

// -------------------------------------------------------------
// STEP 5: TRIAGE & COMMS
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
  const previewEl = document.getElementById('triage-packet-preview');

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

  if (previewEl && result.packet) {
    previewEl.textContent = JSON.stringify(result.packet, null, 2);
  } else if (previewEl) {
    previewEl.textContent = "// No packet required for current clinical path (handled on-board).";
  }

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
    const minsSim = (queueConfig.speedup / 60).toFixed(1);
    speedupNote.textContent = `demo clock: 1 s = ${minsSim} min`;
  }
}

function initTriageControls() {
  const btnSend = document.getElementById('btn-send-packet');
  const btnCopy = document.getElementById('btn-copy-packet');

  if (btnSend) {
    btnSend.addEventListener('click', () => {
      const day = AppState.currentDay;
      const alerts = getAlerts(day);
      const alert = alerts.length > 0 ? alerts[0] : sampleAlert;
      const readings = getReadings(day);

      const preset = LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID;
      const env = { onboardSupport: true, link: { available: true, delay_s: preset.delay_s } };
      const ctx = {
        missionDay: day,
        current: readings.vitals,
        baseline: getBaseline(),
        trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1],
        trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
        cabin: readings.cabin,
        countermeasure: "Enforce circadian sleep hygiene protocol."
      };

      const res = handleAlert(alert, ctx, env);
      if (res.packet) {
        enqueuePacket(res.packet);
        renderQueueTable(getQueue());
        showCaption(`Telemetry packet ${res.packet.packet_id} queued and dispatched to Earth DSN downlink.`);
        setTimeout(hideCaption, 4000);
      }
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const preview = document.getElementById('triage-packet-preview');
      if (preview && preview.textContent) {
        navigator.clipboard.writeText(preview.textContent).then(() => {
          btnCopy.textContent = 'Copied!';
          setTimeout(() => { btnCopy.textContent = 'Copy packet'; }, 2000);
        }).catch(() => {});
      }
    });
  }
}

function initEmergencyModal() {
  const btnOpen = document.getElementById('btn-emergency-link');
  const btnClose = document.getElementById('btn-close-emergency');
  const modal = document.getElementById('emergency-link-modal');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });
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
  queue.forEach((entry, idx) => {
    const p = entry.packet;
    const statusMap = {
      QUEUED: { label: 'Queued', shape: 'shape-circle', status: 'caution' },
      TRANSMITTED: { label: 'Transmitted', shape: 'shape-triangle', status: 'caution' },
      ACKNOWLEDGED: { label: 'Acknowledged', shape: 'shape-circle', status: 'nominal' },
      FAILED: { label: 'Failed (retrying)', shape: 'shape-diamond', status: 'alarm' }
    };
    const s = statusMap[p.status] || statusMap.QUEUED;

    const retryBtnHtml = p.status === 'FAILED' ? `
      <button class="chassis-btn retry-packet-btn" data-index="${idx}" style="font-size: 13px; padding: 3px 8px; margin-top: 6px;">
        Retry transmission
      </button>
    ` : '';

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
        ${retryBtnHtml}
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind working retry buttons
  container.querySelectorAll('.retry-packet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const q = getQueue();
      if (q[idx]) {
        q[idx].packet.status = 'QUEUED';
        setQueueLink(LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID);
        renderQueueTable(q);
      }
    });
  });
}

// -------------------------------------------------------------
// STEP 6: SOURCES TAB & HONESTY
// -------------------------------------------------------------
function renderSourcesTab() {
  const container = document.getElementById('sources-content-view');
  if (!container) return;

  let html = `
    <!-- Disclaimer -->
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--nominal-teal); margin-bottom: 6px;">Operational Disclaimer</h3>
      <p style="font-size: 16px; color: var(--starlight); line-height: 1.5;">${DISCLAIMER}</p>
    </div>

    <!-- NASA Hazard Principle: Two separate sentences, no quotes -->
    <div style="background: #090E17; border-left: 3px solid var(--nominal-teal); padding: 16px 20px; margin-bottom: 24px; border-radius: 2px;">
      <p style="font-size: 15.5px; color: var(--starlight); line-height: 1.5; margin-bottom: 6px;">
        NASA human research identifies that microgravity hazards can feed off one another.
      </p>
      <p style="font-size: 15.5px; color: var(--starlight-dim); line-height: 1.5;">
        In LANDFALL, our design links environmental cabin sensor readings directly to crew physiological symptoms.
      </p>
    </div>

    <!-- What Exists and What Gap LANDFALL Fills -->
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">What Exists and What Gap LANDFALL Fills</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; font-size: 14.5px;">
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">ARCHeR & NASA HRP:</strong> Focuses on algorithmic diagnosis under Earth physician supervision. LANDFALL closes the gap by assuming Earth is out-of-the-loop and enabling autonomous triage.
        </div>
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">Standard Measures:</strong> Collects post-flight biomarker baselines. LANDFALL puts baselines to active longitudinal use on transit day.
        </div>
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">Immune Biomarkers:</strong> Spaceflight studies reveal subclinical viral reactivation. LANDFALL models dormant HSV-1 reactivation under high stress and sleep collapse.
        </div>
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">Tempus Pro & Wearables:</strong> Stream vitals to ground. LANDFALL routes data across DTN store-and-forward architecture with simulated speed-of-light delay.
        </div>
      </div>
    </div>

    <!-- Official NASA Literature Sources -->
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

    <!-- Contract Data Integrity (Sample vs Real) -->
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 8px;">Data Integrity: Sample vs Production Modules</h3>
      <table class="gonogo-table" style="font-size: 14.5px;">
        <thead>
          <tr>
            <th>Module</th>
            <th>Author</th>
            <th>Status</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>pipeline.js</code>, <code>queue.js</code>, <code>packet.js</code>, <code>triage.js</code>, <code>sources.js</code></td>
            <td>Teammate 3</td>
            <td><span class="status-badge status-nominal"><span class="shape-circle"></span> Real code</span></td>
            <td>Core DTN queuing, FNV-1a checksums, triage logic</td>
          </tr>
          <tr>
            <td><code>index.html</code>, <code>css/style.css</code>, <code>main.js</code>, <code>js/*</code></td>
            <td>Om (UI Lead)</td>
            <td><span class="status-badge status-nominal"><span class="shape-circle"></span> Production</span></td>
            <td>The View From The Ship frontend, canvas, accessibilty</td>
          </tr>
          <tr>
            <td><code>sample/sample_data.js</code></td>
            <td>Interim</td>
            <td><span class="status-badge status-caution"><span class="shape-triangle"></span> Synthetic sample</span></td>
            <td>180-day baseline data simulating Day 40 sleep collapse story</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">Modelling Assumptions (ASSUMPTIONS)</h3>
    <ul style="padding-left: 24px; font-size: 15.5px; color: #CAD5D4; line-height: 1.6; margin-bottom: 24px;">
  `;

  ASSUMPTIONS.forEach(a => {
    html += `<li style="margin-bottom: 8px;">${a}</li>`;
  });

  html += `</ul>`;
  container.innerHTML = html;
}

// -------------------------------------------------------------
// STEP 7: DEMO RUNNER (Play, Pause, Stop) & RESET DEMO
// -------------------------------------------------------------
function initDemoRunner() {
  const btnPlay = document.getElementById('btn-play-demo');
  const btnPause = document.getElementById('btn-pause-demo');
  const btnStop = document.getElementById('btn-stop-demo');

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (AppState.isDemoRunning) {
        stopDemo();
      } else {
        startDemo();
      }
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (AppState.isDemoPaused) {
        resumeDemo();
      } else {
        pauseDemo();
      }
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
      stopDemo();
    });
  }
}

function startDemo() {
  AppState.isDemoRunning = true;
  AppState.isDemoPaused = false;
  AppState.preDemoDay = AppState.currentDay; // Remember previous day to restore on Stop

  const btnPlay = document.getElementById('btn-play-demo');
  const btnPause = document.getElementById('btn-pause-demo');
  const btnStop = document.getElementById('btn-stop-demo');

  if (btnPlay) {
    btnPlay.textContent = 'Running demo...';
    btnPlay.classList.add('active');
  }
  if (btnPause) {
    btnPause.style.display = 'inline-block';
    btnPause.textContent = 'Pause';
  }
  if (btnStop) {
    btnStop.style.display = 'inline-block';
  }

  AppState.setDay(35);
  activateTab('overview');
  showCaption("Day 35: Nominal transit cruise. All parameters aligned with personal baseline.");

  let step = 35;
  AppState.demoInterval = setInterval(() => {
    if (AppState.isDemoPaused) return;

    step += 1;
    AppState.setDay(step);

    if (step === 40) {
      activateTab('monitor');
      showCaption("Day 40: Acute sleep collapse (4.2h)! Headache reported. Cabin CO2 spikes to 5200 ppm. 'Check scrubber first' rule triggers.");
    } else if (step === 44) {
      activateTab('forecast');
      showCaption("Day 44 (Evaluate): Flight-path cones widen and turn red as cumulative sleep debt impacts landing readiness.");
    } else if (step === 48) {
      AppState.exerciseHours = 1.5;
      const slider = document.getElementById('adherence-slider-input');
      if (slider) slider.value = 1.5;
      renderForecastTab();
      showCaption("Day 48: Raising What-If exercise adherence to 1.5 hrs/day reshapes flight cones and stabilizes landing readiness.");
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

function pauseDemo() {
  AppState.isDemoPaused = true;
  const btnPause = document.getElementById('btn-pause-demo');
  if (btnPause) btnPause.textContent = 'Resume';
}

function resumeDemo() {
  AppState.isDemoPaused = false;
  const btnPause = document.getElementById('btn-pause-demo');
  if (btnPause) btnPause.textContent = 'Pause';
}

function stopDemo() {
  AppState.isDemoRunning = false;
  AppState.isDemoPaused = false;
  if (AppState.demoInterval) clearInterval(AppState.demoInterval);

  const btnPlay = document.getElementById('btn-play-demo');
  const btnPause = document.getElementById('btn-pause-demo');
  const btnStop = document.getElementById('btn-stop-demo');

  if (btnPlay) {
    btnPlay.textContent = 'Play 30-second demo';
    btnPlay.classList.remove('active');
  }
  if (btnPause) btnPause.style.display = 'none';
  if (btnStop) btnStop.style.display = 'none';

  // Return to previous day
  AppState.setDay(AppState.preDemoDay || 40);
  hideCaption();
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

function initResetDemoButton() {
  const btn = document.getElementById('btn-reset-demo');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const ok = confirm("Reset all logged check-in entries, countermeasures, and return to Day 40 baseline?");
    if (ok) {
      localStorage.removeItem('landfall_custom_checkins');
      localStorage.removeItem('landfall_countermeasures');
      localStorage.removeItem('landfall_queue');
      AppState.exerciseHours = 1.2;
      AppState.setDay(40);
      activateTab('overview');
      alert("Demo state successfully reset to Day 40 baseline.");
    }
  });
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
