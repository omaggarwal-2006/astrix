/**
 * LANDFALL - Header: day and delay readouts, downlink status, readiness score pill, scene collapse (src/ui/header.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../app/state.js";
import { getForecast } from "../core/adapter.js";
import { oneWayDelayS } from "../core/delay.js";
import { getQueue, config as queueConfig } from "../core/queue.js";
import { calculateCrewReadinessXP } from "./extras/twin-model.js";

// Collapsible Scene Toggle (persisted in localStorage)
export function initSceneCollapse() {
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

// Updates every header readout for the current state (was AppState.updateTelemetryText)
export function updateHeader(state) {
  const day = state.currentDay;
  const remaining = state.maxDays - day;
  const dist = (0.38 + (day / 180) * 224.62).toFixed(1);
  const delaySec = oneWayDelayS(day);
  const delayMin = Math.floor(delaySec / 60);
  const delayRemSec = delaySec % 60;
  const delayStr = `${delayMin} min ${delayRemSec} s`;

  const elDay = document.getElementById('telemetry-day');
  const elDist = document.getElementById('telemetry-distance');
  const elRemaining = document.getElementById('telemetry-remaining');

  if (elDay) elDay.textContent = `Day ${day} / ${state.maxDays}`;
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

  // Crew Readiness XP Pill (Gamification Engine)
  const forecastList = getForecast(day, state.exerciseHours);
  const xpData = calculateCrewReadinessXP(forecastList, state.whatIf, state.completedScansCount);
  const elXpNum = document.getElementById('crew-xp-num');
  const elXpTier = document.getElementById('crew-xp-tier');
  const elXpShape = document.getElementById('crew-xp-shape');
  if (elXpNum) elXpNum.textContent = `${xpData.xp} XP`;
  if (elXpTier) {
    elXpTier.textContent = xpData.tier.split(' — ')[0];
    elXpTier.className = `crew-tier-badge ${xpData.status === 'alarm' ? 'tier-3' : xpData.status === 'caution' ? 'tier-2' : 'tier-1'}`;
  }
  if (elXpShape) {
    elXpShape.className = xpData.shape === 'diamond' ? 'shape-diamond' : xpData.shape === 'triangle' ? 'shape-triangle' : 'shape-circle';
  }

  const profileDay = document.getElementById('twin-profile-day');
  if (profileDay) profileDay.textContent = `${day}`;
}
