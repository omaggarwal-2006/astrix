/**
 * LANDFALL - Demo controls: reset (src/ui/controls.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { activateTab } from "../app/router.js";
import { AppState } from "../app/state.js";
import { clearQueue } from "../core/queue.js";

export function initResetDemoButton() {
  const btn = document.getElementById('btn-reset-demo');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const ok = confirm("Reset all logged check-in entries, countermeasures, and return to Day 40 baseline?");
    if (ok) {
      localStorage.removeItem('landfall_custom_checkins');
      localStorage.removeItem('landfall_countermeasures');
      clearQueue(); // clears the in-memory queue too, not just the stored copy
      AppState.setExerciseHours(1.2);
      AppState.whatIf.targetedRegionBoost = {};
      AppState.microLabSettings = {};
      AppState.rewardedScans.clear();
      AppState.completedScansCount = 3;
      const slider = document.getElementById('adherence-slider-input');
      if (slider) slider.value = 1.2;
      AppState.setDay(40);
      activateTab('overview');
      alert("Demo state successfully reset to Day 40 baseline.");
    }
  });
}
