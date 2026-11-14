/**
 * LANDFALL - Bootstrap (src/main.js)
 *
 * Wires state, tabs and controls together and starts the app. No feature logic lives here:
 *   core logic ......... src/core/   (adapter, triage, packet, queue, pipeline, sources, config, delay)
 *   state and routing .. src/app/    (state.js, router.js)
 *   screens ............ src/ui/     (header, tabs/, components/, visuals/, extras/, demo runner, controls)
 * Structure and migration notes: docs/06-ARCHITECTURE.md and docs/22-MIGRATION.md.
 */

import { AppState, registerTab, setHeaderRenderer } from "./app/state.js";
import { initNavigation } from "./app/router.js";
import { getQueue, onChange as onQueueChange, setLink as setQueueLink } from "./core/queue.js";
import { LINK_PRESETS } from "./core/sources.js";
import { initSceneCollapse, updateHeader } from "./ui/header.js";
import { initMissionSceneControls } from "./ui/visuals/scene-controls.js";
import { MissionScene } from "./ui/visuals/mission-scene.js";
import { HealthConstellation } from "./ui/extras/constellation.js";
import { renderOverviewTab } from "./ui/tabs/overview.js";
import { renderMonitorTab, initCheckinForm } from "./ui/tabs/monitor.js";
import { initTrendChartButtons } from "./ui/components/trend-chart.js";
import { renderForecastTab, initScenarioButtons } from "./ui/tabs/forecast.js";
import { renderTriageTab, initTriageControls, renderQueueTable } from "./ui/tabs/comms.js";
import { renderSourcesTab } from "./ui/tabs/sources.js";
import { initTwinControls, renderTwin } from "./ui/extras/twin.js";
import { initEmergencyModal } from "./ui/banners.js";
import { initDemoRunner } from "./ui/demo-runner.js";
import { initResetDemoButton } from "./ui/controls.js";

// Tab id (index.html data-tab / #hash) -> renderer
registerTab('overview', renderOverviewTab);
registerTab('monitor', renderMonitorTab);
registerTab('forecast', renderForecastTab);
registerTab('triage', renderTriageTab);
registerTab('sources', renderSourcesTab);
setHeaderRenderer(updateHeader);

document.addEventListener('DOMContentLoaded', () => {
  // Service worker for offline use (only over http/https)
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Canvases
  AppState.missionScene = new MissionScene('mission-scene-canvas', 'mission-scrubber-slider', (newDay) => {
    AppState.setDay(newDay, true);
  });
  AppState.constellation = new HealthConstellation('health-constellation-canvas');

  // Controls (the title screen is dismissed by the inline script in index.html)
  initNavigation();
  initSceneCollapse();
  initMissionSceneControls();
  initCheckinForm();
  initTwinControls();
  initTrendChartButtons();
  initScenarioButtons();
  initTriageControls();
  initEmergencyModal();
  initDemoRunner();
  initResetDemoButton();

  // Escape zooms the digital twin out one level
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && AppState.twinLevel > 1) {
      AppState.twinLevel--;
      renderTwin();
    }
  });

  // Queue changes update the queue table, the packet flight and the downlink readout
  onQueueChange(() => {
    renderQueueTable(getQueue());
    if (AppState.missionScene) AppState.missionScene.draw();
    AppState.updateTelemetryText();
  });

  // Initial link preset
  const preset = LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID;
  setQueueLink({ available: true, delay_s: preset.delay_s, label: preset.label });

  // Initial day
  AppState.setDay(40);
  const ring = document.getElementById('mars-progress-ring');
  if (ring) {
    ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.2, 0.9, 0.3, 1)';
  }
});
