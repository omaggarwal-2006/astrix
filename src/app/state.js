/**
 * LANDFALL - Application state (src/app/state.js)
 *
 * Holds the selected day, the simulation environment, what-if settings and the current
 * day's result (`view`, from runDay). Every screen renders from `view`, so they agree.
 * It never imports UI code: screens register renderers through registerTab() and onUpdate().
 */

import { runDay, DEFAULT_ENV } from "../core/run-day.js";
import { setLink as setQueueLink, config as queueConfig } from "../core/queue.js";

const hooks = {
  tabs: new Map(),       // tabId -> () => void
  updates: [],           // (state) => void, run on every refresh (header, badges, side panels)
};

/** Register the function that renders a tab. Only the visible tab renders on change. */
export function registerTab(tabId, render) { hooks.tabs.set(tabId, render); }

/** Register a function that runs after every state change (header readouts, badges). */
export function onUpdate(fn) { hooks.updates.push(fn); }

/** Kept for compatibility with earlier modules. */
export const setHeaderRenderer = onUpdate;

export const FAIL_RATES = { off: 0, some: 0.3, all: 1 };

export const AppState = {
  currentDay: 40,
  preDemoDay: 40,
  maxDays: 180,
  activeTab: 'today',
  activeTrendChart: 'sleep',
  exerciseHours: 1.2,
  env: { ...DEFAULT_ENV, failMode: 'off' },
  view: null,
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

  /** Recompute today's result and re-render the header and the visible tab. */
  refresh() {
    this.view = runDay(this.currentDay, this.env, { exerciseHours: this.exerciseHours });
    setQueueLink({ available: this.env.linkUp, delay_s: this.view.delayS });
    this.updateTelemetryText();
    this.renderCurrentTab();
  },

  setDay(day, notify = true) {
    this.currentDay = Math.max(1, Math.min(this.maxDays, parseInt(day, 10) || 1));
    if (this.missionScene) this.missionScene.setDay(this.currentDay, false);
    if (notify) this.refresh();
    else this.view = runDay(this.currentDay, this.env, { exerciseHours: this.exerciseHours });
  },

  /** Change the simulated situation: { delayMode, linkUp, onboardSupport, failMode }. */
  setEnv(patch) {
    Object.assign(this.env, patch);
    queueConfig.failRate = FAIL_RATES[this.env.failMode] ?? 0;
    this.refresh();
  },

  // Single source of truth for exercise adherence: forecast, twin and score all read it
  setExerciseHours(hrs, notify = true) {
    this.exerciseHours = hrs;
    this.whatIf.exerciseHours = hrs;
    if (notify) this.refresh();
  },

  /** Header readouts, badges and side panels. */
  updateTelemetryText() {
    if (!this.view) this.view = runDay(this.currentDay, this.env, { exerciseHours: this.exerciseHours });
    hooks.updates.forEach(fn => fn(this));
  },

  /** Renders only the visible tab (D-17). Other tabs render when they are opened. */
  renderCurrentTab() {
    if (!this.view) this.view = runDay(this.currentDay, this.env, { exerciseHours: this.exerciseHours });
    const render = hooks.tabs.get(this.activeTab);
    if (render) render();
  }
};
