/**
 * LANDFALL - Core Architecture & Shell Controller
 * Handles global mission day state, tab navigation, and the Mission Ribbon
 */

// Shared Mission State
const LandfallState = {
  currentDay: 40,
  maxDays: 180,
  activeTab: 'today',
  subscribers: [],

  // Calculate speed-of-light comm delay based on Hohmann orbital transit distance
  getCommDelaySeconds(day) {
    // Day 1 (LEO/Moon): ~1.5s
    // Day 40: ~128s (02m 08s)
    // Day 180 (Mars Arrival): ~750s (12m 30s)
    return Math.round(1.5 + (day / 180) * 750);
  },

  formatDelay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  },

  getDistanceKm(day) {
    // 0.38M km at Earth to ~225M km at Mars
    return (0.38 + (day / 180) * 224.62).toFixed(1);
  },

  setDay(newDay, triggerUpdate = true) {
    this.currentDay = Math.max(1, Math.min(this.maxDays, parseInt(newDay, 10)));
    this.updateRibbonUI();
    if (triggerUpdate) {
      this.notifySubscribers();
    }
  },

  subscribe(callback) {
    this.subscribers.push(callback);
  },

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.currentDay);
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    });
  },

  updateRibbonUI() {
    const day = this.currentDay;
    const percent = ((day - 1) / (this.maxDays - 1)) * 100;
    const delaySec = this.getCommDelaySeconds(day);
    const delayStr = this.formatDelay(delaySec);
    const distStr = `${this.getDistanceKm(day)} M km`;
    const daysRemaining = this.maxDays - day;

    // Update Telemetry Header
    const telDay = document.getElementById('telemetry-day');
    const telDist = document.getElementById('telemetry-distance');
    const telDelay = document.getElementById('telemetry-delay');
    if (telDay) telDay.textContent = `Day ${day} / ${this.maxDays}`;
    if (telDist) telDist.textContent = distStr;
    if (telDelay) telDelay.textContent = delayStr;

    // Update Ribbon Readouts
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
  }
};

// Initialize Application Shell
document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initMissionRibbon();
  initHeaderButtons();
  LandfallState.setDay(40); // Initial mission state: Day 40 (Fatigue inflection point)
});

// Tab Switching
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      activateTab(targetTab);
    });

    // Keyboard navigation between tabs (Arrow Left / Right)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const tabList = Array.from(tabButtons);
        const index = tabList.indexOf(btn);
        const nextIndex = e.key === 'ArrowRight' 
          ? (index + 1) % tabList.length 
          : (index - 1 + tabList.length) % tabList.length;
        tabList[nextIndex].focus();
        tabList[nextIndex].click();
      }
    });
  });
}

function activateTab(tabName) {
  LandfallState.activeTab = tabName;

  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    const isSelected = btn.getAttribute('data-tab') === tabName;
    btn.classList.toggle('active', isSelected);
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });

  panels.forEach(panel => {
    const matches = panel.id === `panel-${tabName}`;
    panel.classList.toggle('active', matches);
    panel.hidden = !matches;
  });
}

// Mission Ribbon Interaction
function initMissionRibbon() {
  const slider = document.getElementById('mission-day-slider');
  if (!slider) return;

  // Real-time scrubbing as the user drags
  slider.addEventListener('input', (e) => {
    LandfallState.setDay(e.target.value);
  });

  // Change event on commit
  slider.addEventListener('change', (e) => {
    LandfallState.setDay(e.target.value);
  });
}

// Header Actions: Demo Runner and Reset
function initHeaderButtons() {
  const btnPlayDemo = document.getElementById('btn-play-demo');
  const btnReset = document.getElementById('btn-reset-demo');
  const captionToast = document.getElementById('demo-caption');
  const captionText = document.getElementById('demo-caption-text');

  if (btnPlayDemo) {
    btnPlayDemo.addEventListener('click', () => {
      if (window.LANDFALL_DEMO && typeof window.LANDFALL_DEMO.play === 'function') {
        window.LANDFALL_DEMO.play();
      } else {
        // Quick visual stub until demo.js is loaded in step (g)
        showDemoToast("Demo mode initiated: Scrubbing Day 35 to Day 60 (Sleep collapse sequence)...");
        let day = 35;
        const interval = setInterval(() => {
          day += 1;
          LandfallState.setDay(day);
          if (day === 40) {
            showDemoToast("Day 40: Sleep collapse detected (4.2h vs 7.4h baseline). Alert triggered.");
          } else if (day === 48) {
            showDemoToast("Day 48: Cognitive & mood index drops. Flight surgeon advisory queued.");
          }
          if (day >= 60) {
            clearInterval(interval);
            showDemoToast("Demo sequence complete. Review Trends and Act tabs.");
            setTimeout(hideDemoToast, 4000);
          }
        }, 300);
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Reset mission simulation back to Day 40 baseline?')) {
        localStorage.clear();
        LandfallState.setDay(40);
        activateTab('today');
        showDemoToast("Mission simulation reset to Day 40.");
        setTimeout(hideDemoToast, 2500);
      }
    });
  }
}

function showDemoToast(msg) {
  const toast = document.getElementById('demo-caption');
  const text = document.getElementById('demo-caption-text');
  if (toast && text) {
    text.textContent = msg;
    toast.classList.add('visible');
  }
}

function hideDemoToast() {
  const toast = document.getElementById('demo-caption');
  if (toast) {
    toast.classList.remove('visible');
  }
}

// Expose state globally for placeholder engines and tab modules
window.LandfallState = LandfallState;
window.activateTab = activateTab;
