/**
 * LANDFALL - Bootstrap (src/main.js)
 *
 * Builds the views, wires state, tabs and controls together, and starts on day 40.
 *   core logic ......... src/core/   (run-day, adapter, triage, packet, queue, pipeline, sources, config, delay)
 *   state and routing .. src/app/    (state.js, router.js)
 *   screens ............ src/ui/     (tabs/, components/, visuals/, extras/, simulation, demo runner)
 * Structure: docs/06-ARCHITECTURE.md
 */

import { AppState, registerTab, onUpdate } from "./app/state.js";
import { initNavigation } from "./app/router.js";
import { getQueue, onChange as onQueueChange } from "./core/queue.js";
import { updateHeader, initSceneCollapse, initMilestones, initAudioToggle } from "./ui/header.js";
import { initMissionSceneControls } from "./ui/visuals/scene-controls.js";
import { MissionScene } from "./ui/visuals/mission-scene.js";
import { HealthConstellation } from "./ui/extras/constellation.js";
import { mountToday, renderToday } from "./ui/tabs/today.js";
import { mountSignals, renderSignals } from "./ui/tabs/signals.js";
import { mountForecast, renderForecastTab } from "./ui/tabs/forecast.js";
import { mountComms, renderTriageTab, renderQueueTable } from "./ui/tabs/comms.js";
import { renderEvidence } from "./ui/tabs/evidence.js";
import { renderTwinTab, renderScore } from "./ui/tabs/twin-tab.js";
import { initTwinControls, renderTwin } from "./ui/extras/twin.js";
import { initSimulation, syncEnvControls, closeDrawer, drawerOpen } from "./ui/simulation.js";
import { initEmergencyModal, closeEmergency } from "./ui/banners.js";
import { initDemoRunner } from "./ui/demo-runner.js";

// Tab id (index.html data-tab / #hash) -> renderer. Only the visible tab renders (D-17).
registerTab('today', renderToday);
registerTab('signals', renderSignals);
registerTab('forecast', renderForecastTab);
registerTab('comms', renderTriageTab);
registerTab('twin', renderTwinTab);
registerTab('evidence', renderEvidence);

// After every change: header chips and badges, simulation controls, readiness score
onUpdate(updateHeader);
onUpdate(syncEnvControls);
onUpdate(renderScore);

document.addEventListener('DOMContentLoaded', () => {
  // Service worker for offline use (only over http/https)
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Build the views once
  mountToday();
  mountSignals();
  mountForecast();
  mountComms();

  // Canvases
  AppState.missionScene = new MissionScene('mission-scene-canvas', 'mission-scrubber-slider', (day) => AppState.setDay(day));
  AppState.constellation = new HealthConstellation('health-constellation-canvas');

  // Controls
  initSceneCollapse();
  initMilestones();
  initAudioToggle();
  initMissionSceneControls();
  initTwinControls();
  initSimulation();
  initEmergencyModal();
  initDemoRunner();

  // Elements with role="button" respond to Enter and Space like buttons
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"]')) { e.preventDefault(); e.target.click(); }
  });

  // Escape: close the emergency modal, then the drawer, then zoom the twin out one level
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (closeEmergency() || (drawerOpen() && closeDrawer())) return;
    if (AppState.activeTab === 'twin' && AppState.twinLevel > 1) { AppState.twinLevel--; renderTwin(); }
  });

  // Queue changes update the queue list, the packet flight, badges and today's delivery state
  onQueueChange(() => {
    renderQueueTable(getQueue());
    if (AppState.missionScene) AppState.missionScene.draw();
    AppState.updateTelemetryText();
    if (AppState.activeTab === 'today') AppState.renderCurrentTab();
  });

  // Start: compute day 40, then show the tab from the URL
  AppState.setDay(40, false);
  initNavigation();
  AppState.updateTelemetryText();
});
