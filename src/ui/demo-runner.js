/**
 * LANDFALL - Guided demo (src/ui/demo-runner.js)
 * Ten steps, about 4 s each. Every step changes something real (day, tab, slider, environment,
 * link) and its caption is written from the resulting day result, so captions can't contradict
 * the screen. Stop restores everything as it was.
 */

import { AppState } from "../app/state.js";
import { goTo } from "../app/router.js";
import { formatDelay } from "../core/delay.js";
import { PATH, DELIVERY, METRIC } from "./dom.js";
import { sendReport, packetForToday } from "./report.js";

const STEP_MS = 4200;
const v = () => AppState.view;
const path = () => (v().decision.noAlert ? 'routine self-monitoring' : PATH[v().decision.path].short.toLowerCase());
const delivery = () => DELIVERY[v().decision.delivery].short.toLowerCase();

const STEPS = [
  { run: () => { AppState.setDay(20); goTo('today'); },
    say: () => `Day ${v().day}. Calm transit: every signal sits inside this astronaut's own baseline, so the loop ends in ${path()}.` },
  { run: () => AppState.setDay(40),
    say: () => `Day 40. Sleep falls to ${v().reading.vitals.sleep_h} h and cabin CO₂ reaches ${v().reading.cabin.co2.toLocaleString()} ppm: ${v().alerts.length} alerts fire against the personal baseline.` },
  { run: () => goTo('signals'),
    say: () => `Detect. Each alert says how far from baseline, for how long and which way it's heading. ${METRIC[v().alert?.metric] || 'Sleep'} drives today's decision.` },
  { run: () => { goTo('forecast'); AppState.setExerciseHours(0); },
    say: () => {
      const n = v().forecast.filter(f => f.status === 'alarm').length;
      return `Forecast. If exercise stops, landing readiness drops to ${v().readiness.score}% and ${n} dimension${n === 1 ? ' goes' : 's go'} NO-GO.`;
    } },
  { run: () => AppState.setExerciseHours(1.5),
    say: () => `With NASA's 1.5 h/day of exercise it recovers to ${v().readiness.score}%. Effort changes the landing outlook.` },
  { run: () => goTo('today'),
    say: () => `Decide. Earth is ${formatDelay(v().delayS)} away, beyond a live call. Score ${v().decision.score} routes the case to the ${path()}, reported by ${delivery()}.` },
  { run: () => AppState.setEnv({ delayMode: 'MOON' }),
    say: () => `Same case at Moon distance (${formatDelay(v().delayS)}): it becomes a ${delivery()} with the ${path()}. Delay changes the answer.` },
  { run: () => { AppState.setEnv({ delayMode: 'MODEL', linkUp: false }); goTo('comms'); sendReport(); },
    say: () => `Deliver. The link to Earth is down, so the report is checksummed and held: ${packetForToday(v().day)?.packet.packet_id || 'the packet'} waits in the queue.` },
  { run: () => AppState.setEnv({ linkUp: true }),
    say: () => `Link restored. The packet transmits across ${formatDelay(v().delayS)} and Earth acknowledges it with a reply.` },
  { run: () => { AppState.setDay(44); goTo('today'); },
    say: () => `Day 44. The sleep alarm escalates: "${v().readiness.text}". Now routed to the ${path()}. That's LANDFALL: distance decides who acts.` },
];

let timer = null, stepIndex = 0, saved = null;

const $ = (id) => document.getElementById(id);

function setProgress() {
  const bar = $('demo-progress');
  if (bar) bar.innerHTML = STEPS.map((_, i) => `<i class="${i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''}"></i>`).join('');
}

function showCaption(text) {
  const el = $('demo-caption-text');
  if (el) el.textContent = text;
  $('demo-caption-toast')?.classList.add('visible');
}
export function hideCaption() { $('demo-caption-toast')?.classList.remove('visible'); }

function runStep() {
  if (stepIndex >= STEPS.length) { stopDemo(); return; }
  const s = STEPS[stepIndex];
  s.run();
  setProgress();
  showCaption(s.say());
  stepIndex++;
}

export function startDemo() {
  if (AppState.isDemoRunning) return;
  saved = { day: AppState.currentDay, env: { ...AppState.env }, hours: AppState.exerciseHours, tab: AppState.activeTab };
  AppState.isDemoRunning = true; AppState.isDemoPaused = false;
  stepIndex = 0;
  $('btn-play-demo').querySelector('.btn-label').textContent = 'Demo running';
  $('btn-pause-demo').textContent = 'Pause';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  runStep();
  timer = setInterval(() => { if (!AppState.isDemoPaused) runStep(); }, STEP_MS);
}

export function stopDemo() {
  if (!AppState.isDemoRunning) return;
  clearInterval(timer); timer = null;
  AppState.isDemoRunning = false; AppState.isDemoPaused = false;
  $('btn-play-demo').querySelector('.btn-label').textContent = 'Play demo';
  hideCaption();
  if (saved) {
    AppState.setExerciseHours(saved.hours, false);
    Object.assign(AppState.env, saved.env);
    AppState.setEnv({});
    AppState.setDay(saved.day);
    goTo(saved.tab);
  }
}

export function initDemoRunner() {
  $('btn-play-demo').addEventListener('click', () => (AppState.isDemoRunning ? stopDemo() : startDemo()));
  $('btn-stop-demo').addEventListener('click', stopDemo);
  $('btn-pause-demo').addEventListener('click', () => {
    AppState.isDemoPaused = !AppState.isDemoPaused;
    $('btn-pause-demo').textContent = AppState.isDemoPaused ? 'Resume' : 'Pause';
  });
  $('btn-start-demo')?.addEventListener('click', () => setTimeout(startDemo, 300));
}
