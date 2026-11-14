/**
 * LANDFALL - Mission scene controls: environment select, replay entry zoom, EVA suit (src/ui/visuals/scene-controls.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../../app/state.js";

// -------------------------------------------------------------
// MISSION SCENE CONTROLS (Env selector, Replay, EVA suit)
// -------------------------------------------------------------
export function initMissionSceneControls() {
  const envSelect = document.getElementById('scene-env-select');
  if (envSelect) {
    envSelect.addEventListener('change', (e) => {
      if (AppState.missionScene) {
        AppState.missionScene.setEnvironment(e.target.value);
      }
    });
  }

  const btnReplay = document.getElementById('btn-replay-entry-zoom');
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      if (AppState.missionScene) {
        AppState.missionScene.replayEntryZoom();
      }
    });
  }

  const btnEva = document.getElementById('btn-toggle-eva-suit');
  if (btnEva) {
    btnEva.addEventListener('click', () => {
      if (AppState.missionScene) {
        AppState.missionScene.toggleEvaSuit();
      }
    });
  }
}
