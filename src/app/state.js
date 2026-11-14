/**
 * LANDFALL - Application state (src/app/state.js)
 *
 * Holds the selected day, what-if settings, demo state and the live canvas objects.
 * It never imports UI code: renderers register themselves through registerTab() and
 * setHeaderRenderer(), so state stays testable and free of import cycles.
 */

const hooks = {
  header: null,          // (state) => void, renders the header readouts
  tabs: new Map(),       // tabId -> () => void, renders that tab's content
};

/** Register the function that renders a tab. Only the visible tab is rendered on change. */
export function registerTab(tabId, render) {
  hooks.tabs.set(tabId, render);
}

/** Register the function that renders the header readouts. */
export function setHeaderRenderer(render) {
  hooks.header = render;
}

export const AppState = {
  currentDay: 40,
  preDemoDay: 40,
  maxDays: 180,
  activeTab: 'overview',
  activeTrendChart: 'sleep',
  exerciseHours: 1.2,
  activePresetKey: 'MARS_MID',
  twinLevel: 1,
  selectedRegion: 'head_neuro',
  selectedLayer: 'BONE',
  twinOrientation: 'front',
  completedScansCount: 3,
  rewardedScans: new Set(),
  microLabSettings: {},
  whatIf: {
    exerciseHours: 1.2,
    nutritionVitD: false,
    noiseAndSleepProtocol: false,
    targetedRegionBoost: {}
  },
  missionScene: null,
  constellation: null,
  trendCharts: {},
  demoInterval: null,
  isDemoRunning: false,
  isDemoPaused: false,

  // Single source of truth for exercise adherence: forecast, twin and score all read it
  setExerciseHours(hrs) {
    this.exerciseHours = hrs;
    this.whatIf.exerciseHours = hrs;
  },

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

  // Header readouts (day, delay, downlink status, readiness score)
  updateTelemetryText() {
    if (hooks.header) hooks.header(this);
  },

  // Renders only the visible tab (N4). Other tabs render when they are opened.
  renderCurrentTab() {
    const render = hooks.tabs.get(this.activeTab);
    if (render) render();
  }
};
