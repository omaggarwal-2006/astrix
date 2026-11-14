/**
 * LANDFALL - Automated demo runner and caption toast (src/ui/demo-runner.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { activateTab } from "../app/router.js";
import { AppState } from "../app/state.js";
import { renderTwin } from "./extras/twin.js";
import { renderForecastTab } from "./tabs/forecast.js";

// -------------------------------------------------------------
// STEP 7: DEMO RUNNER (Play, Pause, Stop) & RESET DEMO
// -------------------------------------------------------------
export function initDemoRunner() {
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

export function startDemo() {
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
      AppState.setExerciseHours(1.5);
      const slider = document.getElementById('adherence-slider-input');
      if (slider) slider.value = 1.5;
      renderForecastTab();
      renderTwin();
      AppState.updateTelemetryText();
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

export function pauseDemo() {
  AppState.isDemoPaused = true;
  const btnPause = document.getElementById('btn-pause-demo');
  if (btnPause) btnPause.textContent = 'Resume';
}

export function resumeDemo() {
  AppState.isDemoPaused = false;
  const btnPause = document.getElementById('btn-pause-demo');
  if (btnPause) btnPause.textContent = 'Pause';
}

export function stopDemo() {
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

export function showCaption(text) {
  const toast = document.getElementById('demo-caption-toast');
  const textEl = document.getElementById('demo-caption-text');
  if (toast && textEl) {
    textEl.textContent = text;
    toast.classList.add('visible');
  }
}

export function hideCaption() {
  const toast = document.getElementById('demo-caption-toast');
  if (toast) toast.classList.remove('visible');
}
