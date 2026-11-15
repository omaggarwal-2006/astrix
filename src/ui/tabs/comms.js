/**
 * LANDFALL - Decide & deliver (step 3): the situation, the routing, the report packet
 * and the store-and-forward queue (src/ui/tabs/comms.js)
 */

import { AppState } from "../../app/state.js";
import { getQueue, setLink as setQueueLink } from "../../core/queue.js";
import { CONFIG } from "../../core/config.js";
import { formatDelay } from "../../core/delay.js";
import { $, esc, PATH, DELIVERY, METRIC, ICON, pill, flash } from "../dom.js";
import { envControlsHTML, bindEnvControls } from "../simulation.js";
import { previewPacket, needsPacket, sendReport } from "../report.js";

export function mountComms() {
  const panel = document.getElementById('panel-comms');
  panel.innerHTML = `
    <div class="view-head">
      <div>
        <span class="eyebrow"><span class="step-no">3</span>Decide &amp; deliver</span>
        <h1>The same case, routed by distance</h1>
        <p>Change the distance to Earth, the link or the crew on board, and watch the routing change. Reports that can't go live become checksummed packets that wait safely until contact.</p>
      </div>
    </div>

    <div class="dtn-linkbar reveal" id="comms-linkbar" style="--i:0"></div>

    <div class="grid g-12">
      <article class="card span-4 reveal" style="--i:0">
        <div class="card-head"><div><h3 class="card-title">Situation</h3><p class="card-sub">Simulation inputs (shared with the Simulation panel)</p></div></div>
        <div id="comms-env"></div>
      </article>

      <div class="span-8 stack">
        <article class="card reveal" style="--i:1" id="comms-decision"></article>
        <article class="card reveal" style="--i:2">
          <div class="card-head">
            <div><h3 class="card-title">Report packet</h3><p class="card-sub">What would leave the ship (<code>src/core/packet.js</code>, FNV-1a checksum)</p></div>
          </div>
          <div id="comms-packet"></div>
        </article>
      </div>

      <article class="card span-8 reveal" style="--i:3">
        <div class="card-head">
          <div><h3 class="card-title">Store-and-forward queue</h3><p class="card-sub">Survives reloads · demo clock: 1 s on screen ≈ <span class="num" id="queue-clock-speedup">1.7 min</span></p></div>
        </div>
        <div class="custody-pipe" id="custody-pipe"></div>
        <div class="queue-list" id="queue-items-container"></div>
      </article>

      <article class="card span-4 emergency-box reveal" style="--i:4">
        <div>
          <h3 class="card-title">Emergency override</h3>
          <p class="small" style="margin-top:6px">A medical emergency never waits for the queue: the crew uses the direct ground link at once.</p>
        </div>
        <button class="btn btn-danger" id="btn-emergency-link">${ICON.alert} Open direct ground link</button>
      </article>
    </div>`;

  $('#comms-env').innerHTML = envControlsHTML();
  bindEnvControls($('#comms-env'));

  panel.addEventListener('click', (e) => {
    if (e.target.closest('#btn-send-packet')) {
      const p = sendReport();
      if (p) flash($('#queue-items-container'));
    } else if (e.target.closest('#btn-copy-packet')) {
      const text = $('#triage-packet-preview')?.textContent || '';
      navigator.clipboard?.writeText(text).then(() => {
        const b = $('#btn-copy-packet'); b.innerHTML = 'Copied'; setTimeout(() => { b.innerHTML = `${ICON.copy} Copy JSON`; }, 1600);
      }).catch(() => {});
    } else if (e.target.closest('.retry-packet-btn')) {
      const idx = parseInt(e.target.closest('.retry-packet-btn').dataset.index, 10);
      const q = getQueue();
      if (q[idx] && q[idx].packet.status === 'FAILED') {
        q[idx].packet.status = 'QUEUED';
        setQueueLink({ available: AppState.env.linkUp, delay_s: AppState.view.delayS });
        renderQueueTable(getQueue());
      }
    }
  });
}

export function renderTriageTab() {
  const v = AppState.view;
  if (!v) return;
  const d = v.decision;
  const live = CONFIG.liveCallMaxOneWayS;
  const au = (0.38 + (v.day / 180) * 1.12).toFixed(2);   // illustrative Earth distance, matches the header model
  const m = Math.floor(v.delayS / 60), sec = Math.round(v.delayS % 60);
  $('#comms-linkbar').innerHTML = `
    <span>Earth distance: <b>${au} AU</b></span><i>·</i>
    <span>One-way radio latency: <b>${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s</b></span><i>·</i>
    <span>Link: <b class="${v.env.linkUp ? 't-ok' : 't-bad'}">${v.env.linkUp ? 'Active' : 'Down'}</b></span>
    <svg viewBox="0 0 24 24" class="dtn-linkbar-ico ${v.env.linkUp ? '' : 'is-down'}" aria-hidden="true"><path d="M12 13v8M9 21h6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="11" r="2" fill="currentColor"/><path d="M8 7a5.6 5.6 0 0 0 0 8M16 7a5.6 5.6 0 0 1 0 8M5 4a10 10 0 0 0 0 14M19 4a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
  const dec = $('#comms-decision');
  const changed = dec.dataset.key !== d.path + d.delivery;
  dec.dataset.key = d.path + d.delivery;
  dec.innerHTML = `
    <div class="card-head" style="margin-bottom:10px">
      <div><span class="eyebrow">Triage decision · day ${v.day}</span>
        <h3 class="card-title" id="triage-path-display" style="font-size: var(--fs-xl); margin-top: 6px;">${esc(d.noAlert ? 'Routine self-monitoring' : PATH[d.path].short)}</h3>
        <p class="card-sub" id="triage-delivery-display">${esc(d.noAlert ? 'No active alert, nothing to send' : `Delivery: ${DELIVERY[d.delivery].long}`)}</p></div>
      ${d.noAlert ? pill('ok', 'shape-circle', 'Nominal') : pill(PATH[d.path].tone, PATH[d.path].tone === 'bad' ? 'shape-diamond' : PATH[d.path].tone === 'warn' ? 'shape-triangle' : 'shape-circle', `Score ${d.score}`)}
    </div>
    <p class="small" id="triage-why-display">${d.noAlert ? 'Every signal is within this astronaut\'s own baseline.' : `${esc(METRIC[v.alert.metric] || v.alert.metric)}: ${esc(v.alert.reason)}. Earth is ${formatDelay(v.delayS)} away (live-call limit ${live} s); ${v.env.onboardSupport ? 'a crew medical officer is on board' : 'no crew medical officer on board'}; the link is ${v.env.linkUp ? 'up' : 'down'}.`}</p>`;
  if (changed) flash(dec);

  // Packet preview
  const pkt = previewPacket(v);
  const box = $('#comms-packet');
  if (!pkt) {
    box.innerHTML = `<div class="empty"><span class="shape-circle"></span>${d.delivery === 'LIVE_CALL' ? 'Live call: Earth is close enough to talk in real time, so no packet is needed.' : d.noAlert ? 'No alert today, so there is nothing to report.' : 'Self-care: the case is logged on board and nothing leaves the ship.'}</div>
      <pre id="triage-packet-preview" class="sr-only"></pre>`;
  } else {
    const json = JSON.stringify(pkt, null, 2);
    box.innerHTML = `
      <dl class="packet-fields">
        <dt>Packet</dt><dd><b>${pkt.packet_id}</b> · priority ${pkt.priority}</dd>
        <dt>Anomaly</dt><dd>${esc(pkt.anomaly)}</dd>
        <dt>Trend, 7 days</dt><dd>${pkt.trend_7d.join(' → ')}</dd>
        <dt>Countermeasure</dt><dd>${esc(pkt.countermeasure)}</dd>
        <dt>Checksum</dt><dd><code>${pkt.checksum}</code> · ${json.length} bytes</dd>
      </dl>
      <details style="margin-top:10px"><summary class="small muted" style="cursor:pointer">Show the full JSON</summary><pre class="packet-json" id="triage-packet-preview">${esc(json)}</pre></details>
      <div class="packet-actions">
        <button class="btn btn-primary" id="btn-send-packet">${ICON.send} ${d.delivery === 'QUEUE_OFFLINE' ? 'Queue packet for next contact' : 'Send packet to Earth'}</button>
        <button class="btn" id="btn-copy-packet">${ICON.copy} Copy JSON</button>
      </div>`;
  }
  renderQueueTable(getQueue());
}

const seen = new Set();   // packets already shown, so only new ones animate in
const STEPS = [['QUEUED', 'Queued'], ['TRANSMITTED', 'In flight'], ['ACKNOWLEDGED', 'Acknowledged']];

export function renderQueueTable(queue) {
  const box = document.getElementById('queue-items-container');
  if (!box) return;
  const speed = document.getElementById('queue-clock-speedup');
  if (speed) speed.textContent = `${(100 / 60).toFixed(1)} min`;
  renderCustodyPipe(queue);
  if (!queue.length) {
    box.innerHTML = `<div class="empty"><span class="shape-circle"></span> No packets yet. Send today's report to see it travel.</div>`;
    return;
  }
  box.innerHTML = queue.map((entry, idx) => ({ entry, idx })).reverse().map(({ entry, idx }) => {
    const p = entry.packet;
    const at = STEPS.findIndex(s => s[0] === p.status);
    const failed = p.status === 'FAILED';
    const steps = STEPS.map(([key, label], i) => {
      let cls = '';
      if (failed) cls = i === 0 ? 'done' : i === 1 ? 'fail' : '';
      else if (i < at || (i === at && key === 'ACKNOWLEDGED')) cls = 'done';
      else if (i === at) cls = 'now';
      return `<span class="${cls}">${failed && i === 1 ? 'Failed · retrying' : label}</span>`;
    }).join('');
    const statusPill = p.status === 'ACKNOWLEDGED' ? pill('ok', 'shape-circle', 'Acknowledged')
      : failed ? pill('bad', 'shape-diamond', 'Failed') : p.status === 'TRANSMITTED' ? pill('info', 'shape-circle', 'In flight') : pill('warn', 'shape-triangle', 'Queued');
    return `
      <div class="q-item${seen.has(p.packet_id) ? '' : ' q-new'}">
        <div class="q-top"><span class="q-id">${p.packet_id} <span class="muted small">· day ${p.mission_ts} · ${p.priority}</span></span>${statusPill}</div>
        <div class="q-anomaly">${esc(p.anomaly)} · attempts ${entry.attempts}</div>
        <div class="q-steps">${steps}</div>
        ${entry.ground_reply ? `<div class="q-reply">${esc(entry.ground_reply)}</div>` : ''}
        ${failed ? `<button class="btn btn-sm retry-packet-btn" data-index="${idx}" style="margin-top:10px">Retry now</button>` : ''}
      </div>`;
  }).join('');
  queue.forEach(e => seen.add(e.packet.packet_id));
}

/** Three custody stages from design_mockups/09: local cache -> Ka-band uplink -> Earth DSN. */
function renderCustodyPipe(queue) {
  const el = document.getElementById('custody-pipe');
  if (!el) return;
  const by = (st) => queue.filter(e => e.packet.status === st);
  const cache = [...by('QUEUED'), ...by('FAILED')];
  const flight = by('TRANSMITTED');
  const acked = by('ACKNOWLEDGED');
  const box = (e, cls) => `<span class="cp-pkt ${cls}" title="${esc(e.packet.packet_id)} · ${esc(e.packet.status)}">${esc(e.packet.packet_id.replace('PKT-', ''))}</span>`;
  const empty = `<span class="cp-pkt is-empty">DATA</span>`;
  el.innerHTML = `
    <div class="cp-stage"><span class="cp-cap">1. Local cache <em class="t-ok">(queued)</em></span>
      <div class="cp-row">${cache.length ? cache.map(e => box(e, e.packet.status === 'FAILED' ? 'is-fail' : '')).join('') : empty}</div></div>
    <div class="cp-stage"><span class="cp-cap">2. Ka-band uplink <em class="t-warn">(transmitting)</em></span>
      <div class="cp-row cp-beam ${flight.length ? 'is-live' : ''}"><i></i>${flight.map(e => box(e, 'is-flight')).join('')}</div></div>
    <div class="cp-stage"><span class="cp-cap">3. Earth DSN acknowledged <em class="t-ok">(Canberra / Goldstone)</em></span>
      <div class="cp-row">${acked.length ? acked.slice(-8).map(e => box(e, 'is-ack')).join('') : empty}</div></div>`;
}

export { needsPacket };
