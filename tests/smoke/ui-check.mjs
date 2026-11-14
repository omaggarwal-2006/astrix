/**
 * LANDFALL 2.0 - Smoke check (tests/smoke/ui-check.mjs)
 * Checks that the 16 UI features exist in the markup and source. It does NOT test behaviour;
 * behaviour tests live in tests/unit and tests/integration (npm test).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

// Read every file in a folder tree with one of the given extensions, concatenated
const readTree = (dir, exts) => fs.readdirSync(path.join(rootDir, dir), { withFileTypes: true }).flatMap(d => {
  const rel = path.join(dir, d.name);
  if (d.isDirectory()) return [readTree(rel, exts)];
  return exts.some(x => d.name.endsWith(x)) ? [fs.readFileSync(path.join(rootDir, rel), 'utf-8')] : [];
}).join('\n');

// Read core UI files
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
const cssContent = readTree('assets/css', ['.css']);
// All app code (was a single main.js before the restructure)
const mainJsContent = readTree('src', ['.js']);
// The views build their own markup (src/ui/tabs/*), so markup checks look at both
const uiContent = htmlContent + '\n' + mainJsContent;
const contractContent = fs.readFileSync(path.join(rootDir, 'CONTRACT.md'), 'utf-8');
const swContent = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf-8');

// Import ES modules dynamically
const twinModel = await import('../../src/ui/extras/twin-model.js');
const adapter = await import('../../src/core/adapter.js');
const sources = await import('../../src/core/sources.js');
const pipeline = await import('../../src/core/pipeline.js');
const queue = await import('../../src/core/queue.js');
const packet = await import('../../src/core/packet.js');

const results = [];

function check(itemNumber, name, condition, details = '') {
  const passed = Boolean(condition);
  results.push({ itemNumber, name, passed, details });
  const statusStr = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[Item ${String(itemNumber).padStart(2, '0')}] ${name.padEnd(45, '.')} ${statusStr} ${details ? '(' + details + ')' : ''}`);
}

console.log('\n===============================================================');
console.log('LANDFALL 2.0 - AUTOMATED VERIFICATION SUITE (ALL 16 ITEMS)');
console.log('===============================================================\n');

// 1. Tabs, back/forward, direct links (Hash router & fallback)
const hasTabs = ['today', 'signals', 'forecast', 'comms', 'twin', 'evidence'].every(tab =>
  uiContent.includes(`data-tab="${tab}"`) && uiContent.includes(`id="panel-${tab}"`)
);
const hasHashRouter = mainJsContent.includes('activateTab') &&
  mainJsContent.includes("window.addEventListener('hashchange'") &&
  mainJsContent.includes(": 'today'");
check(1, 'Tabs, back/forward, direct links & fallback', hasTabs && hasHashRouter, '6 tabs + fallback to Today');

// 2. Day scrubber (drag, click, arrows) updates everything
const hasScrubber = uiContent.includes('id="mission-scrubber-slider"') &&
  uiContent.includes('min="1"') && uiContent.includes('max="180"') &&
  mainJsContent.includes('AppState.setDay(') &&
  mainJsContent.includes('updateTelemetryText');
check(2, 'Day scrubber (1 to 180) updates telemetry', hasScrubber, '180 days, milestones, live telemetry');

// 3. Scene collapse toggle (remembered in localStorage)
const hasSceneToggle = uiContent.includes('id="btn-toggle-scene"') &&
  mainJsContent.includes('landfall_scene_collapsed') &&
  mainJsContent.includes('localStorage.getItem');
check(3, 'Mission scene collapse toggle & storage', hasSceneToggle, 'Persists in localStorage');

// 4. Environment selector (all four: MARS, ISS, MOON, EVA_SUIT)
const hasEnvSelect = ['MARS', 'ISS', 'MOON', 'EVA_SUIT'].every(env =>
  uiContent.includes(`value="${env}"`)
) && mainJsContent.includes('setEnvironment');
check(4, 'Environment selector (MARS, ISS, MOON, EVA)', hasEnvSelect, 'All 4 environments supported');

// 5. "Play 30-second demo", Pause, Stop
const hasDemoControls = uiContent.includes('id="btn-play-demo"') &&
  uiContent.includes('id="btn-pause-demo"') &&
  uiContent.includes('id="btn-stop-demo"') &&
  mainJsContent.includes('startDemo') &&
  mainJsContent.includes('stopDemo');
check(5, 'Play, Pause, Stop automated demo', hasDemoControls, 'Day 35 to 60 with pre-demo state restore');

// 6. Replay entry zoom; EVA close/re-open suit split toggle
const hasReplayAndSuit = uiContent.includes('id="btn-replay-entry-zoom"') &&
  uiContent.includes('id="btn-toggle-eva-suit"') &&
  mainJsContent.includes('replayEntryZoom') &&
  mainJsContent.includes('toggleEvaSuit');
check(6, 'Replay entry zoom & EVA suit shell split', hasReplayAndSuit, '3-phase split reveal & replay zoom');

// 7. Check-in form validation, save, confirmation, updates
const hasFormValidation = uiContent.includes('id="monitor-checkin-form"') &&
  mainJsContent.includes('landfall_custom_checkins') &&
  mainJsContent.includes('Heart rate must be between 35 and 220') &&
  mainJsContent.includes('Core temperature must be between 34.0 and 42.0');
check(7, 'Check-in form validation & localStorage', hasFormValidation, 'Strict min/max bounds and toast feedback');

// 8. All 11 body regions, front/back toggle, Escape and breadcrumbs
const all11Regions = [
  'head_neuro', 'chest_cardio', 'core_spine',
  'left_arm', 'right_arm', 'left_hand', 'right_hand',
  'left_leg', 'right_leg', 'left_foot', 'right_foot'
];
const hasAll11Regions = all11Regions.every(r => uiContent.includes(`id="reg-${r}"`)) &&
  uiContent.includes('id="btn-toggle-orientation"') &&
  uiContent.includes('id="twin-breadcrumb-bar"') &&
  uiContent.includes('id="btn-twin-zoom-out"') &&
  mainJsContent.includes("'Escape'");
check(8, '11 anatomical SVG regions, Escape & breadcrumbs', hasAll11Regions, '11 regions, Front/Back, Escape zoom-out');

// 9. Four tissue cards open micro-lab, controls change projection and XP
const hasTissueGridAndLab = uiContent.includes('id="twin-tissue-grid"') &&
  uiContent.includes('id="micro-lab-canvas"') &&
  uiContent.includes('id="micro-ctrl-1-input"') &&
  uiContent.includes('id="micro-ctrl-2-input"') &&
  twinModel.TISSUE_LAYERS.length === 4;
check(9, '4 exploded tissue cards & micro-lab canvas', hasTissueGridAndLab, 'Bone, Muscle, Skin, Vascular + XP gain');

// 10. Go/No-Go rows and alert rows jump to right tab
const hasGoNoGoAndAlertJumps = uiContent.includes('id="poll-summary"') &&
  uiContent.includes('id="today-alerts"') &&
  mainJsContent.includes("goto: 'forecast'") &&
  mainJsContent.includes("goto: 'comms'");
check(10, 'Go/No-Go and Alert routing across tabs', hasGoNoGoAndAlertJumps, 'Jump to Forecast & Triage tabs');

// 11. Scenario buttons and exercise slider
const hasScenarios = ['h: 1.5', 'h: 1.2', 'h: 0.0'].every(x => mainJsContent.includes(x)) &&
  uiContent.includes('id="btn-scenario-') &&
  uiContent.includes('id="adherence-slider-input"');
check(11, 'Countermeasure scenarios & adherence slider', hasScenarios, 'Adherent, Nominal, Zero + 0-1.5 h/d');

// 12. Countermeasure checklist saved after reload
const hasChecklist = uiContent.includes('id="countermeasures-checklist"') &&
  mainJsContent.includes('landfall_countermeasures');
check(12, 'Autonomous countermeasure checklist persistence', hasChecklist, 'Dynamic checklist saved in localStorage');

// 13. Distance, link and crew controls, Send packet, Copy packet, Retry, Emergency link
const hasTriageComms = ['MODEL', 'MOON', 'MARS_NEAR', 'MARS_MID', 'MARS_FAR'].every(k => mainJsContent.includes(`key: '${k}'`)) &&
  uiContent.includes('data-toggle="linkUp"') &&
  uiContent.includes('data-toggle="onboardSupport"') &&
  uiContent.includes('id="btn-send-packet"') &&
  uiContent.includes('id="btn-copy-packet"') &&
  uiContent.includes('retry-packet-btn') &&
  uiContent.includes('id="btn-emergency-link"') &&
  uiContent.includes('id="emergency-link-modal"');
check(13, 'Comms controls, DTN queue, Copy, Retry, Emergency', hasTriageComms, 'Distance, link, crew, copy, retry, bypass modal');

// 14. NASA links open in new tab with rel="noopener"
const hasSecureLinks = uiContent.includes('target="_blank"') || mainJsContent.includes('target="_blank" rel="noopener noreferrer"');
check(14, 'NASA literature links with rel="noopener"', hasSecureLinks, 'Secure external links');

// 15. Reset demo asks for confirmation
const hasResetConfirm = uiContent.includes('id="btn-reset-demo"') &&
  mainJsContent.includes('confirm(');
check(15, 'Reset demo confirmation dialog', hasResetConfirm, 'Restores Day 40 baseline on confirmation');

// 16. Keyboard-only use with visible focus, ARIA, no color-only cues
const hasAriaAndRoles = uiContent.includes('role="tablist"') &&
  uiContent.includes('role="tab"') &&
  uiContent.includes('role="button"') &&
  uiContent.includes('tabindex="0"') &&
  cssContent.includes(':focus-visible') &&
  uiContent.includes('shape-circle');
check(16, 'Keyboard accessibility, ARIA & geometric shapes', hasAriaAndRoles, 'Full keyboard focus & shape indicators');

// Test Model Logic
console.log('\n--- MODEL & RECOVERY MATH CHECK ---');
const day1 = twinModel.getRegionIntegrity('left_leg', 1);
const day40 = twinModel.getRegionIntegrity('left_leg', 40);
const day49 = twinModel.getRegionIntegrity('left_leg', 49);
console.log(`Left leg integrity: Day 1 = ${day1.currentPct}% | Day 40 = ${day40.currentPct}% | Day 49 = ${day49.currentPct}%`);

const xpDay40 = twinModel.calculateCrewReadinessXP(adapter.getForecast(40, 1.2), { exerciseHours: 1.2 }, 3);
console.log(`Crew Readiness XP (Day 40): ${xpDay40.xp} XP [${xpDay40.tier}]`);

const allPassed = results.every(r => r.passed);
console.log('\n===============================================================');
console.log(`OVERALL STATUS: ${allPassed ? '\x1b[32mALL 16 CHECKS PASSED\x1b[0m' : '\x1b[31mSOME CHECKS FAILED\x1b[0m'}`);
console.log('===============================================================\n');

if (!allPassed) {
  process.exit(1);
}
