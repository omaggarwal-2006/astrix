/**
 * LANDFALL - Evidence: how it works, what's real and what's simulated, NASA sources,
 * our assumptions (src/ui/tabs/evidence.js). Built once; content doesn't depend on the day.
 */

import { SOURCES, ASSUMPTIONS, DISCLAIMER } from "../../core/sources.js";
import { CONFIG } from "../../core/config.js";
import { esc, pill } from "../dom.js";

const STEPS = [
  ['Read', 'Sleep, mood, heart rate, blood pressure, cabin CO₂, symptoms, exercise and radiation for the day.', 'src/core/adapter.js'],
  ['Detect', 'Compare each reading with this astronaut\'s own baseline; flag persistence and worsening.', 'src/data/sample-data.js'],
  ['Forecast', 'Project six landing dimensions to day 180 from NASA loss rates, with ranges.', 'src/core/adapter.js'],
  ['Decide', 'Score the case and route it for the current delay, link and crew on board.', 'src/core/triage.js'],
  ['Deliver', 'Build a checksummed packet and hold it in a queue that survives link loss.', 'src/core/queue.js'],
];

const PRINCIPLES = [
  'Delay is an input to the decision, not a footnote.',
  'Rules and statistics decide, so every output can be explained and tested.',
  'An emergency never waits for the queue or the link.',
  'Compare each astronaut with their own baseline, not a population average.',
  'Everything runs offline in the browser; nothing is sent anywhere.',
  'Every number is labelled: NASA source or team assumption.',
];

export function renderEvidence() {
  const panel = document.getElementById('panel-evidence');
  if (panel.dataset.built) return;
  panel.dataset.built = '1';
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  panel.innerHTML = `
    <div class="view-head">
      <div>
        <span class="eyebrow">Evidence</span>
        <h1>How it works, and what to trust</h1>
        <p>${esc(DISCLAIMER)}</p>
      </div>
    </div>

    <article class="card reveal" style="--i:0">
      <div class="card-head"><div><h3 class="card-title">The decision loop</h3><p class="card-sub">Runs for every mission day in <code>src/core/run-day.js</code></p></div></div>
      <div class="how">
        ${STEPS.map(([name, text, file], i) => `<div class="how-step"><span class="eyebrow"><span class="step-no">${i + 1}</span>${name}</span><b>${name}</b><p>${esc(text)}</p><p style="margin-top:8px"><code>${file}</code></p></div>`).join('')}
      </div>
    </article>

    <div class="grid g-12 mt">
      <article class="card span-6 reveal" style="--i:1">
        <div class="card-head"><div><h3 class="card-title">Design principles</h3></div></div>
        <ul class="principles">${PRINCIPLES.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      </article>
      <article class="card span-6 reveal" style="--i:2">
        <div class="card-head"><div><h3 class="card-title">What's real and what's simulated</h3></div></div>
        <table class="table" id="sample-vs-real">
          <thead><tr><th>Part</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Triage, packets, checksums, store-and-forward queue, the decision loop</td><td>${pill('ok', 'shape-circle', 'Working code')}</td></tr>
            <tr><td>180-day astronaut data, alerts and forecast</td><td>${pill('warn', 'shape-triangle', 'Synthetic sample')}</td></tr>
            <tr><td>Forecast model (ridge regression, separate branch)</td><td>${pill('info', 'shape-circle', 'Built, not merged')}</td></tr>
            <tr><td>Link to Earth and ground replies</td><td>${pill('neutral', 'shape-circle', `Simulated, ${CONFIG.queue.speedup}× faster`)}</td></tr>
            <tr><td>Thresholds and the exercise response curve</td><td>${pill('neutral', 'shape-circle', 'Team assumptions')}</td></tr>
          </tbody>
        </table>
      </article>
    </div>

    <article class="card mt reveal" style="--i:3">
      <div class="card-head"><div><h3 class="card-title">NASA and agency sources</h3><p class="card-sub">Opened in a new tab · status tracked in <code>docs/13-SOURCES.md</code></p></div></div>
      <div class="source-list">
        ${SOURCES.map(s => `<a class="source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(s.title)}</b><span>${esc(s.supports)}</span><span class="host">${esc(host(s.url))} ↗</span></a>`).join('')}
      </div>
    </article>

    <div class="grid g-12 mt">
      <article class="card span-7 reveal" style="--i:4">
        <div class="card-head"><div><h3 class="card-title">Our assumptions</h3><p class="card-sub">Not NASA values; labelled wherever they appear</p></div></div>
        <ol class="assumption-list">${ASSUMPTIONS.map(a => `<li>${esc(a)}</li>`).join('')}</ol>
      </article>
      <article class="card span-5 reveal" style="--i:5">
        <div class="card-head"><div><h3 class="card-title">Settings in use</h3><p class="card-sub">From <code>src/core/config.js</code></p></div></div>
        <table class="table">
          <tbody>
            <tr><td>Live-call limit (one way)</td><td class="num">${CONFIG.liveCallMaxOneWayS} s</td></tr>
            <tr><td>Persistence that escalates</td><td class="num">${CONFIG.persistEscalateDays} days</td></tr>
            <tr><td>CO₂ scrubber hint</td><td class="num">${CONFIG.co2HintPpm.toLocaleString()} ppm</td></tr>
            <tr><td>Delay model</td><td class="num">${CONFIG.delayModel.startOneWayS} s → ${CONFIG.delayModel.startOneWayS + CONFIG.delayModel.spanOneWayS} s</td></tr>
            <tr><td>Radiation limit (to verify)</td><td class="num">${CONFIG.doseLimitMSv} mSv</td></tr>
            <tr><td>Demo clock</td><td class="num">${CONFIG.queue.speedup}×</td></tr>
          </tbody>
        </table>
      </article>
    </div>`;
}
