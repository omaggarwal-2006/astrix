/**
 * LANDFALL - Today: the whole decision loop on one screen (src/ui/tabs/today.js)
 * Readiness · today's decision (why, and what would change it) · the five-step loop ·
 * the alerts · the triage rule that fired.
 */

import { AppState } from "../../app/state.js";
import { goTo } from "../../app/router.js";
import { CONFIG } from "../../core/config.js";
import { formatDelay } from "../../core/delay.js";
import { $, esc, PATH, DELIVERY, METRIC, ICON, READINESS, severityPill, pill, countUp, flash } from "../dom.js";
import { needsPacket, packetForToday, sendReport } from "../report.js";
import { playSound } from "../extras/gamification.js";

const RING_C = 2 * Math.PI * 58;

export function mountToday() {
  const panel = document.getElementById('panel-today');
  panel.innerHTML = `
    <div class="view-head">
      <div>
        <span class="eyebrow" id="today-eyebrow">Day 40 · Today's decision loop</span>
        <h1>Who should act, given how far Earth is?</h1>
        <p>LANDFALL compares today's readings with this astronaut's own baseline, projects landing-day readiness, and routes the case for the current communication delay.</p>
      </div>
    </div>

    <div class="today-hero">
      <article class="card readiness-card hud-chassis reveal" id="readiness-card" style="--i:0">
        <div class="ring" aria-hidden="true">
          <svg viewBox="0 0 132 132"><circle class="track" cx="66" cy="66" r="58" fill="none" stroke-width="10"/>
            <circle class="bar" id="readiness-ring" cx="66" cy="66" r="58" fill="none" stroke-width="10" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/></svg>
          <div class="ring-value"><div><b id="readiness-number">0</b><span>readiness</span></div></div>
        </div>
        <div class="readiness-text">
          <span class="eyebrow">Landing-day outlook</span>
          <h2 id="readiness-headline">On track for landing</h2>
          <p id="readiness-detail"></p>
        </div>
      </article>

      <article class="card decision-card hud-chassis reveal" id="decision-card" style="--i:1">
        <span class="eyebrow">Today's decision</span>
        <div class="decision-main">
          <div class="path-icon" id="decision-icon"></div>
          <div class="decision-path" id="decision-path">Self-care</div>
        </div>
        <div class="decision-facts" id="decision-facts"></div>
        <div class="why-grid">
          <div><h4>Why</h4><ul class="why-list" id="decision-why"></ul></div>
          <div><h4>What would change it</h4><ul class="why-list alt" id="decision-cf"></ul></div>
        </div>
        <div class="row" id="decision-actions"></div>
      </article>
    </div>

    <article class="card loop-card reveal" style="--i:2">
      <div class="card-head">
        <div><h3 class="card-title">The decision loop, for this day</h3><p class="card-sub">Each step feeds the next. Select a step to see the detail.</p></div>
      </div>
      <div class="loop" id="loop"></div>
    </article>

    <div class="grid g-12 mt">
      <article class="card span-5 reveal" style="--i:3">
        <div class="card-head"><div><h3 class="card-title">Active alerts</h3><p class="card-sub">Drift from this astronaut's baseline, worst first</p></div></div>
        <div class="alert-list" id="today-alerts"></div>
      </article>
      <article class="card span-7 reveal" id="rules-card" style="--i:4">
        <div class="card-head"><div><h3 class="card-title">How triage decided</h3><p class="card-sub">The rules as built today (<code>src/core/triage.js</code>). Thresholds are team assumptions.</p></div></div>
        <div id="today-rules"></div>
      </article>
    </div>`;

  panel.addEventListener('click', (e) => {
    const step = e.target.closest('[data-goto]');
    if (step) {
      playSound('click');
      if (step.dataset.goto === 'rules') document.getElementById('rules-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      else goTo(step.dataset.goto);
      return;
    }
    if (e.target.closest('#btn-today-send')) {
      sendReport();
      return;
    }
    if (e.target.closest('#btn-today-queue')) goTo('comms');
  });
}

export function renderToday() {
  const v = AppState.view;
  if (!v) return;
  const d = v.decision;
  $('#today-eyebrow').textContent = `Day ${v.day} · Today's decision loop`;

  // ---- Readiness
  const card = $('#readiness-card');
  card.dataset.level = v.readiness.level;
  countUp($('#readiness-number'), v.readiness.score, { suffix: '%' });
  $('#readiness-ring').style.strokeDashoffset = RING_C * (1 - v.readiness.score / 100);
  $('#readiness-headline').textContent = v.readiness.text;
  const counts = { nominal: 0, caution: 0, alarm: 0 };
  v.forecast.forEach(f => counts[f.status]++);
  const why = v.readiness.worstSeverity >= 3 ? 'An alarm-level alert is active, so the outlook cannot be "on track" whatever the average says.' : '';
  $('#readiness-detail').innerHTML = `${counts.nominal} GO · ${counts.caution} WATCH · ${counts.alarm} NO-GO across six landing dimensions${v.alerts.length ? ` · ${v.alerts.length} active alert${v.alerts.length > 1 ? 's' : ''}` : ''}. ${why}`;

  // ---- Decision
  const dc = $('#decision-card');
  const changed = dc.dataset.path !== d.path || dc.dataset.delivery !== d.delivery;
  dc.dataset.path = d.path; dc.dataset.delivery = d.delivery;
  $('#decision-icon').innerHTML = ICON[d.path];
  $('#decision-path').innerHTML = `${esc(d.noAlert ? 'Routine self-monitoring' : PATH[d.path].short)}<small>${esc(d.noAlert ? 'No drift from baseline today; nothing to send' : `${PATH[d.path].long} · ${DELIVERY[d.delivery].short}`)}</small>`;
  if (changed) flash(dc);

  const live = CONFIG.liveCallMaxOneWayS;
  const delayTone = v.delayS < live ? 'ok' : 'warn';
  $('#decision-facts').innerHTML = [
    pill(delayTone, delayTone === 'ok' ? 'shape-circle' : 'shape-triangle', `Earth ${formatDelay(v.delayS)} away`),
    pill('neutral', 'shape-circle', `Live-call limit ${live} s`),
    pill(v.env.onboardSupport ? 'ok' : 'warn', v.env.onboardSupport ? 'shape-circle' : 'shape-triangle', v.env.onboardSupport ? 'CMO on board' : 'No CMO on board'),
    pill(v.env.linkUp ? 'ok' : 'bad', v.env.linkUp ? 'shape-circle' : 'shape-diamond', v.env.linkUp ? 'Link up' : 'Link down'),
  ].join('');

  const reasons = [];
  if (d.noAlert) {
    reasons.push('Every signal is within this astronaut\'s own baseline.');
  } else {
    const b = v.breakdown;
    reasons.push(`<b>${esc(METRIC[v.alert.metric] || v.alert.metric)}</b>: ${esc(v.alert.reason)}`);
    reasons.push(`Score <b>${b.severity + b.persistence + b.worsening}</b> = severity ${b.severity} + persistence ${b.persistence} + worsening ${b.worsening}`);
    if (d.path !== 'SELF_CARE') {
      reasons.push(d.delivery === 'QUEUE_OFFLINE' ? 'The link is down, so the report waits in the queue.'
        : v.delayS < live ? `Earth is within ${live} s, close enough for a live call.`
        : `Earth is ${formatDelay(v.delayS)} away, above the ${live} s live-call limit: no live call.`);
    }
  }
  $('#decision-why').innerHTML = reasons.map(r => `<li><span>${r}</span></li>`).join('');
  $('#decision-cf').innerHTML = v.counterfactuals.length
    ? v.counterfactuals.map(c => `<li><span>${esc(c.label)}: <b>${esc(PATH[c.path].short)}</b>, ${esc(DELIVERY[c.delivery].short.toLowerCase())}</span></li>`).join('')
    : `<li><span>${d.noAlert ? 'A new alert would start the loop.' : 'Nothing in the current situation would change this.'}</span></li>`;

  const sent = packetForToday(v.day);
  $('#decision-actions').innerHTML = needsPacket(d)
    ? (sent
      ? `${pill(sent.packet.status === 'ACKNOWLEDGED' ? 'ok' : 'info', 'shape-circle', `${sent.packet.packet_id} ${sent.packet.status.toLowerCase()}`)}<button class="btn btn-sm" id="btn-today-queue">Open the queue</button>`
      : `<button class="btn btn-primary" id="btn-today-send">${ICON.send} Send report to Earth</button><span class="muted small">Builds a checksummed packet${d.delivery === 'QUEUE_OFFLINE' ? ' and holds it until the link returns' : ''}.</span>`)
    : (d.delivery === 'LIVE_CALL' ? `<span class="muted small">Live call: no packet needed. The flight surgeon joins in real time.</span>` : '');

  // ---- Loop
  renderLoop(v, sent);

  // ---- Alerts
  $('#today-alerts').innerHTML = v.alerts.length
    ? v.alerts.map((a, i) => `
      <div class="alert-item sev-${a.severity}" data-goto="signals" role="button" tabindex="0">
        ${severityPill(a.severity)}
        <div><div class="t">${esc(METRIC[a.metric] || a.metric)} ${i === 0 ? '<span class="lead">· drives the decision</span>' : ''}</div><div class="d">${esc(a.reason)}</div></div>
        <span class="muted small">${a.persisted_days} d</span>
      </div>`).join('')
    : `<div class="empty"><span class="shape-circle"></span> No drift from baseline today.</div>`;

  // ---- Rules
  renderRules(v);
}

function renderLoop(v, sent) {
  const r = v.reading.vitals;
  const b = v.baseline;
  const delta = (x, base, dec = 1, invert = false) => {
    const dlt = +(x - base).toFixed(dec);
    const bad = invert ? dlt > 0 : dlt < 0;
    return `<b class="${Math.abs(dlt) < 0.05 ? '' : bad ? 'delta-bad' : 'delta-ok'}">${x}${dlt ? ` (${dlt > 0 ? '+' : ''}${dlt})` : ''}</b>`;
  };
  const worst = v.alerts[0];
  const counts = { nominal: 0, caution: 0, alarm: 0 };
  v.forecast.forEach(f => counts[f.status]++);
  const d = v.decision;
  const deliverTone = d.delivery === 'QUEUE_OFFLINE' ? 'warn' : sent?.packet.status === 'ACKNOWLEDGED' ? 'ok' : '';

  const steps = [
    { n: 1, name: 'Read', goto: 'signals', tone: '', value: `Day ${v.day} telemetry`,
      body: `<div class="loop-mini"><span>Sleep (h) ${delta(r.sleep_h, b.sleep_h)}</span><span>Resting HR ${delta(r.hr_bpm, b.hr_bpm, 0, true)}</span><span>Cabin CO₂ (ppm) <b>${v.reading.cabin.co2.toLocaleString()}</b></span></div>` },
    { n: 2, name: 'Detect', goto: 'signals', tone: worst ? (worst.severity >= 3 ? 'bad' : worst.severity === 2 ? 'warn' : 'ok') : 'ok',
      value: worst ? `${v.alerts.length} alert${v.alerts.length > 1 ? 's' : ''}` : 'No drift',
      body: `<div class="loop-note">${worst ? `${esc(METRIC[worst.metric] || worst.metric)}, ${worst.persisted_days} day${worst.persisted_days > 1 ? 's' : ''}${worst.worsening ? ', worsening' : ''}` : 'All signals within the personal baseline'}</div>` },
    { n: 3, name: 'Forecast', goto: 'forecast', tone: counts.alarm ? 'bad' : counts.caution ? 'warn' : 'ok',
      value: `Landing ${v.readiness.score}%`, body: `<div class="loop-note">${counts.nominal} GO · ${counts.caution} WATCH · ${counts.alarm} NO-GO</div>` },
    { n: 4, name: 'Decide', goto: 'rules', tone: PATH[d.path].tone,
      value: d.noAlert ? 'Self-monitor' : PATH[d.path].short,
      body: `<div class="loop-note">${d.noAlert ? 'No case to route' : `Score ${d.score} · Earth ${formatDelay(v.delayS)} · ${v.env.onboardSupport ? 'CMO on board' : 'no CMO'}`}</div>` },
    { n: 5, name: 'Deliver', goto: 'comms', tone: deliverTone,
      value: DELIVERY[d.delivery].short,
      body: `<div class="loop-note">${needsPacket(d) ? (sent ? `${sent.packet.packet_id}: ${sent.packet.status.toLowerCase()}` : 'Ready to send') : d.delivery === 'LIVE_CALL' ? 'Real-time consult' : 'Nothing leaves the ship'}</div>` },
  ];
  $('#loop').innerHTML = steps.map(s => `
    <button class="loop-step" data-goto="${s.goto}" data-tone="${s.tone}">
      <span class="eyebrow"><span class="step-no">${s.n}</span>${s.name}</span>
      <div class="loop-value">${esc(s.value)}</div>${s.body}
    </button>`).join('');
}

function renderRules(v) {
  const d = v.decision;
  const live = CONFIG.liveCallMaxOneWayS;
  const s = d.score;
  const fired = {
    r1: !d.noAlert && s <= 1, r2: s >= 2 && s <= 3 && v.env.onboardSupport, r3: s >= 2 && s <= 3 && !v.env.onboardSupport, r4: s >= 4,
    d1: d.delivery === 'NONE' && !d.noAlert, d2: d.delivery === 'QUEUE_OFFLINE', d3: d.delivery === 'LIVE_CALL', d4: d.delivery === 'SEND_PACKET',
  };
  const b = v.breakdown;
  const scoreLine = b
    ? `<div class="score-line"><span class="term">Severity ${b.severity}</span>+<span class="term">Persisted ≥ ${CONFIG.persistEscalateDays} d: ${b.persistence}</span>+<span class="term">Worsening: ${b.worsening}</span>=<span class="term total">Score ${s}</span></div>`
    : `<div class="empty"><span class="shape-circle"></span> No alert today, so no rule fires.</div>`;
  const rule = (k, cond, out) => `<div class="rule ${fired[k] ? 'fired' : ''}"><span>${cond} → <b>${out}</b></span></div>`;
  $('#today-rules').innerHTML = `
    ${scoreLine}
    <div class="rules-group">Who acts</div>
    <div class="rules">
      ${rule('r1', 'Score ≤ 1', 'Self-care')}
      ${rule('r2', 'Score 2–3 and a CMO on board', 'Crew medical officer')}
      ${rule('r3', 'Score 2–3 and no CMO on board', 'Flight surgeon')}
      ${rule('r4', 'Score ≥ 4', 'Flight surgeon')}
    </div>
    <div class="rules-group">How the report travels</div>
    <div class="rules">
      ${rule('d1', 'Self-care', 'Logged on board')}
      ${rule('d2', 'Link to Earth is down', 'Queue until contact')}
      ${rule('d3', `One-way delay under ${live} s`, 'Live call')}
      ${rule('d4', `Delay ${live} s or more`, 'Store-and-forward packet')}
    </div>`;
}
