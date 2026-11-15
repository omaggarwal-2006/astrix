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
import { GameState, playSound } from "../extras/gamification.js";
import { resize3DTwin } from "../extras/twin-3d.js";
import { calculateCrewReadinessXP } from "../extras/twin-model.js";
import { getReadings } from "../../core/adapter.js";
import { getQueue } from "../../core/queue.js";
import { verifyPacket } from "../../core/packet.js";
import { latencyClock } from "../header.js";
import { sparkSVG, ecgSVG, statusRing, gaugeSVG, arcDash, hexBadge } from "../components/hud.js";

const HISTORY_DAYS = 14;

export function ensure3DInToday() {
  const holder = document.getElementById('today-3d-holder');
  const vp = document.getElementById('twin-3d-viewport');
  if (holder && vp && vp.parentElement !== holder) {
    holder.appendChild(vp);
    vp.style.display = 'block';
    resize3DTwin();
  }
}

export function mountToday() {
  const panel = document.getElementById('panel-today');
  panel.innerHTML = `
    <div class="view-head deck-view-head">
      <div>
        <span class="eyebrow" id="today-eyebrow">Day 40 · Ares Flight Command Deck</span>
        <h1>Deep-space telemetry &amp; Mars transit deck</h1>
        <p>Cockpit bio-monitors, a 3D bio-twin, mission readiness and the delay-aware decision for the 180-day transit to Mars.</p>
      </div>
      <div class="deck-sysstat" id="today-sysstat"></div>
    </div>

    <div class="deck-hero">
      <!-- Left: Cockpit bio-monitor KPIs (design_mockups/13, 03) -->
      <article class="card deck-panel kpi-panel reveal" style="--i:0">
        <div class="deck-panel-head"><h3>Cockpit bio-monitor KPI</h3><button class="deck-link" id="btn-goto-signals">All signals ↗</button></div>
        <div class="kpi-list" id="today-cockpit-monitors"></div>
        <div class="deck-panel-foot"><span>14-day trend vs personal baseline (D 1–14)</span><span>ECG trace illustrative</span></div>
      </article>

      <!-- Center: 3D holographic bio-twin (design_mockups/02) -->
      <article class="card deck-panel pod-panel reveal" style="--i:1">
        <div class="deck-panel-head"><h3>3D bio-twin scan</h3><span class="deck-meta">Crew: <b>Cmdr. A. Vance</b> · <span id="today-pod-clock">Day 040</span></span></div>
        <div class="today-hero-center" id="today-3d-holder"></div>
      </article>

      <!-- Right: Mission readiness gauge (design_mockups/04) and DTN terminal (13) -->
      <div class="deck-right reveal" style="--i:2">
        <article class="card deck-panel readiness-card gauge-card" id="readiness-card">
          <div class="gauge-tier" id="readiness-tier">Tier II · Elevated drift watch</div>
          <div class="gauge-wrap">
            ${gaugeSVG()}
            <div class="gauge-center">
              <span class="gauge-cap">Mission readiness index</span>
              <b id="readiness-number">0</b>
              <span class="gauge-sub" id="readiness-headline">On track for landing</span>
            </div>
          </div>
          <div class="gauge-sides">
            <div><span>Earth delay</span><b id="gauge-delay">--</b></div>
            <div><span>Crew readiness</span><b id="gauge-crew">NOMINAL</b></div>
          </div>
          <div class="gauge-dims">
            <span class="gauge-dims-cap">Landing dimension status</span>
            <div class="gauge-dims-row" id="gauge-dims"></div>
          </div>
          <p class="gauge-detail" id="readiness-detail"></p>
        </article>

        <article class="card deck-panel dtn-mini" id="today-dtn" data-goto="comms" role="button" tabindex="0" aria-label="Open the DTN packet queue"></article>
      </div>
    </div>

    <div class="deck-row2">
      <!-- Tactical decision chassis (design_mockups/05) -->
      <article class="card deck-chassis decision-card reveal" style="--i:3" id="decision-card">
        <i class="chassis-corner tl"></i><i class="chassis-corner tr"></i><i class="chassis-corner bl"></i><i class="chassis-corner br"></i>
        <div class="chassis-head">
          <h3>Today's triage decision <span class="chassis-day" id="decision-day">· Day 040</span></h3>
          <span class="chassis-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Telemetry lock</span>
        </div>
        <div class="chassis-top">
          <div>
            <span class="chassis-lbl">Routing badge</span>
            <div class="decision-main"><div class="path-icon" id="decision-icon"></div><div class="decision-path" id="decision-path">Self-care</div></div>
          </div>
          <div class="chassis-delivery">
            <span class="chassis-lbl">Delivery method</span>
            <div class="delivery-box" id="decision-delivery">Logged on board</div>
          </div>
        </div>
        <div class="chassis-sec"><span class="chassis-lbl">Latency facts</span><span class="delay-flag" id="decision-delay-flag">‹‹‹ Delay ›››</span></div>
        <div class="decision-facts" id="decision-facts"></div>
        <div class="why-grid">
          <div><h4 class="chassis-lbl">Rationale breakdown</h4><ul class="why-list chassis-list" id="decision-why"></ul></div>
          <div><h4 class="chassis-lbl">What would change it</h4><ul class="why-list alt chassis-list" id="decision-cf"></ul></div>
        </div>
        <div class="chassis-cta-row" id="decision-actions"></div>
      </article>

      <!-- Astronaut career standing (design_mockups/08) -->
      <article class="card deck-panel career-panel reveal" style="--i:4" id="today-career-bar"></article>
    </div>

    <!-- Energy-conduit decision loop (design_mockups/06) -->
    <article class="card deck-panel loop-card conduit-card reveal" style="--i:5">
      <div class="deck-panel-head"><h3>Astrix / Landfall decision loop</h3><span class="deck-meta">Each module feeds the next · select one for detail</span></div>
      <div class="loop conduit" id="loop"></div>
    </article>

    <div class="grid g-12 mt">
      <article class="card deck-panel span-5 reveal" style="--i:6">
        <div class="deck-panel-head"><h3>Active alerts</h3><span class="deck-meta">Drift from personal baseline, worst first</span></div>
        <div class="alert-list" id="today-alerts"></div>
      </article>
      <article class="card deck-panel span-7 reveal" id="rules-card" style="--i:7">
        <div class="deck-panel-head"><h3>How triage decided</h3><span class="deck-meta">Rules as built (<code>src/core/triage.js</code>) · thresholds are team assumptions</span></div>
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
    if (e.target.closest('#btn-goto-signals')) goTo('signals');
    if (e.target.closest('#btn-goto-career')) goTo('twin');
  });
}

/** The last HISTORY_DAYS of readings, oldest first (for sparklines). */
function history(day) {
  const out = [];
  for (let d = Math.max(1, day - HISTORY_DAYS + 1); d <= day; d++) out.push(getReadings(d));
  return out;
}

const pad3 = (n) => String(n).padStart(3, '0');
const RING_WORD = { ok: 'STABLE', warn: 'AMBER', bad: 'ALERT' };

export function renderToday() {
  const v = AppState.view;
  if (!v) return;
  const d = v.decision;
  $('#today-eyebrow').textContent = `Day ${pad3(v.day)} · Ares-VI flight command deck`;
  const podClock = $('#today-pod-clock');
  if (podClock) podClock.textContent = `Day ${pad3(v.day)}`;

  // Host 3D viewport on Today
  ensure3DInToday();

  const r = v.reading.vitals;
  const base = v.baseline;
  const c = v.reading.cabin;
  const alertBy = Object.fromEntries(v.alerts.map(a => [a.metric, a]));
  const toneOf = (metric) => { const a = alertBy[metric]; return a ? (a.severity >= 3 ? 'bad' : 'warn') : 'ok'; };
  const sent = packetForToday(v.day);

  // ---- System status strip
  const worstTone = v.alerts.length ? (v.alerts[0].severity >= 3 ? 'bad' : 'warn') : 'ok';
  $('#today-sysstat').innerHTML = `
    <span class="sys-chip tone-${worstTone}">System status: <b>${worstTone === 'ok' ? 'Nominal' : worstTone === 'warn' ? 'Nominal / alert' : 'Alarm'}</b></span>
    <span class="sys-chip">Crew: <b>Ares-VI · 4</b></span>`;

  // ---- Cockpit bio-monitor KPIs
  const hist = history(v.day);
  const series = (fn) => hist.map(fn);
  const dev = (cur, b) => Math.max(8, Math.min(100, 100 - Math.abs(cur - b) / (Math.abs(b) || 1) * 220));
  const hrTone = r.hr_bpm > base.hr_bpm + 10 ? 'warn' : 'ok';
  const bpTone = r.bp_sys >= 140 ? 'bad' : r.bp_sys >= 130 ? 'warn' : 'ok';
  const tempTone = Math.abs(r.temp_c - base.temp_c) >= 0.8 ? 'warn' : 'ok';
  const co2Tone = c.co2 >= CONFIG.co2HintPpm ? (alertBy['cabin_co2']?.severity >= 3 ? 'bad' : 'warn') : 'ok';
  const monitors = [
    { label: 'Sleep score', val: `${r.sleep_h} h`, sub: `Base ${base.sleep_h} h`, tone: toneOf('sleep_h'),
      spark: sparkSVG(series(x => x.vitals.sleep_h), { base: base.sleep_h, tone: toneOf('sleep_h') }), pct: dev(r.sleep_h, base.sleep_h) },
    { label: 'Heart rate', val: `${r.hr_bpm} bpm`, sub: `Base ${base.hr_bpm} bpm`, tone: hrTone,
      spark: ecgSVG(r.hr_bpm, { tone: hrTone === 'ok' ? 'go' : hrTone }), pct: dev(r.hr_bpm, base.hr_bpm) },
    { label: 'Blood pressure', val: `${r.bp_sys}/${r.bp_dia} mmHg`, sub: `Base ${base.bp_sys}/${base.bp_dia}`, tone: bpTone,
      spark: sparkSVG(series(x => x.vitals.bp_sys), { base: base.bp_sys, tone: bpTone }), pct: dev(r.bp_sys, base.bp_sys) },
    { label: 'Mood index', val: `${r.mood} / 5`, sub: `Base ${base.mood}`, tone: toneOf('mood'),
      spark: sparkSVG(series(x => x.vitals.mood), { base: base.mood, tone: toneOf('mood'), min: 1, max: 5 }), pct: (r.mood / 5) * 100 },
    { label: 'Cabin CO₂', val: `${c.co2.toLocaleString()} ppm`, sub: `Limit ${CONFIG.co2HintPpm.toLocaleString()} ppm`, tone: co2Tone,
      spark: sparkSVG(series(x => x.cabin.co2), { base: CONFIG.co2HintPpm, tone: co2Tone }), pct: Math.min(100, (c.co2 / 8000) * 100) },
    { label: 'Core temp', val: `${r.temp_c} °C`, sub: `Base ${base.temp_c} °C`, tone: tempTone,
      spark: sparkSVG(series(x => x.vitals.temp_c), { base: base.temp_c, tone: tempTone }), pct: dev(r.temp_c, base.temp_c) },
  ];
  $('#today-cockpit-monitors').innerHTML = monitors.map(m => `
    <div class="kpi tone-${m.tone}" data-goto="signals" role="button" tabindex="0" aria-label="${esc(m.label)} ${esc(m.val)}, ${RING_WORD[m.tone]}">
      <div class="kpi-text">
        <span class="kpi-label">${esc(m.label)}: <b>${esc(m.val)}</b></span>
        <div class="kpi-spark">${m.spark}</div>
        <span class="kpi-sub"><span class="${m.tone === 'bad' ? 'shape-diamond' : m.tone === 'warn' ? 'shape-triangle' : 'shape-circle'}"></span>${m.tone === 'ok' ? esc(m.sub) : m.tone === 'warn' ? 'Moderate alert · ' + esc(m.sub) : 'Alert · ' + esc(m.sub)}</span>
      </div>
      ${statusRing(m.pct, RING_WORD[m.tone], m.tone)}
    </div>`).join('');

  // ---- Readiness gauge
  const card = $('#readiness-card');
  card.dataset.level = v.readiness.level;
  countUp($('#readiness-number'), v.readiness.score, { suffix: '%' });
  const counts = { nominal: 0, caution: 0, alarm: 0 };
  v.forecast.forEach(f => counts[f.status]++);
  const outer = arcDash(134, v.readiness.score / 100);
  const inner = arcDash(120, counts.nominal / Math.max(1, v.forecast.length));
  $('#readiness-ring').style.strokeDasharray = `${outer.on.toFixed(1)} ${outer.C.toFixed(1)}`;
  $('#readiness-ring-go').style.strokeDasharray = `${inner.on.toFixed(1)} ${inner.C.toFixed(1)}`;
  $('#readiness-headline').textContent = v.readiness.text;
  const xp = calculateCrewReadinessXP(v.forecast, AppState.whatIf, AppState.completedScansCount);
  const tierEl = $('#readiness-tier');
  tierEl.textContent = xp.tier.replace(' — ', ' · ').toLowerCase().replace(/^tier (i+)/, (m, n) => `Tier ${n.toUpperCase()}`);
  tierEl.dataset.tone = xp.status === 'alarm' ? 'bad' : xp.status === 'caution' ? 'warn' : 'ok';
  $('#gauge-delay').textContent = latencyClock(v.delayS);
  const crew = v.readiness.level === 'ON_TRACK' ? 'NOMINAL' : v.readiness.level === 'WATCH' ? 'WATCH' : 'AT RISK';
  const crewEl = $('#gauge-crew');
  crewEl.textContent = crew;
  crewEl.dataset.tone = READINESS[v.readiness.level]?.tone || 'ok';
  const dimsBy = (st) => v.forecast.filter(f => f.status === st).map(f => f.dimension.split(' ')[0]).join(' & ') || (st === 'alarm' ? '0 active alerts' : '—');
  $('#gauge-dims').innerHTML = [
    ['ok', 'GO', counts.nominal, dimsBy('nominal')],
    ['warn', 'WATCH', counts.caution, dimsBy('caution')],
    ['bad', 'NO-GO', counts.alarm, dimsBy('alarm')],
  ].map(([t, w, n, who]) => `
    <button class="dim-chip tone-${t} ${n ? '' : 'is-zero'}" data-goto="forecast" title="${esc(who)}">
      <b>${w}<small>${n}</small></b><span>${esc(who)}</span>
    </button>`).join('');
  const why = v.readiness.worstSeverity >= 3 ? 'An alarm-level alert is active, so the outlook cannot be "on track" whatever the average says.' : '';
  $('#readiness-detail').innerHTML = `${counts.nominal} GO · ${counts.caution} WATCH · ${counts.alarm} NO-GO across six landing dimensions${v.alerts.length ? ` · ${v.alerts.length} active alert${v.alerts.length > 1 ? 's' : ''}` : ''}. ${why}`;

  // ---- DTN terminal (design_mockups/13)
  renderDTN(v);

  // ---- Decision chassis
  const dc = $('#decision-card');
  const changed = dc.dataset.path !== d.path || dc.dataset.delivery !== d.delivery;
  dc.dataset.path = d.path; dc.dataset.delivery = d.delivery;
  dc.dataset.tone = d.noAlert ? 'ok' : PATH[d.path].tone;
  $('#decision-day').textContent = `· Day ${pad3(v.day)}`;
  $('#decision-icon').innerHTML = ICON[d.path];
  const title = d.noAlert ? 'Routine self-monitoring' : { SELF_CARE: 'Self-care protocol', CREW_MEDICAL_OFFICER: 'Crew medical officer review', FLIGHT_SURGEON: 'Flight surgeon intervention required' }[d.path];
  $('#decision-path').innerHTML = `${esc(title)}<small>${esc(d.noAlert ? 'No drift from baseline today; nothing to send' : PATH[d.path].long)}</small>`;
  $('#decision-delivery').textContent = DELIVERY[d.delivery].short;
  if (changed) flash(dc);

  const live = CONFIG.liveCallMaxOneWayS;
  const delayed = v.delayS >= live;
  $('#decision-delay-flag').hidden = !delayed;
  $('#decision-facts').innerHTML = `
    <span class="fact">Earth latency: <b>${latencyClock(v.delayS)}</b></span><i>·</i>
    <span class="fact">Live-call threshold: <b>${live}s</b></span><i>·</i>
    <span class="fact">${!v.env.linkUp ? '<b class="t-bad">Link down · queue until contact</b>' : delayed ? 'Packet transmission required' : '<b class="t-ok">Live call possible</b>'}</span><i>·</i>
    <span class="fact">${v.env.onboardSupport ? 'CMO <b>on board</b>' : '<b class="t-warn">No CMO on board</b>'}</span>`;

  const reasons = [];
  if (d.noAlert) {
    reasons.push('Every signal is within this astronaut\'s own baseline.');
  } else {
    const b = v.breakdown;
    reasons.push(`<b>${esc(METRIC[v.alert.metric] || v.alert.metric)}</b>: ${esc(v.alert.reason)}`);
    reasons.push(`Severity <b>${b.severity}</b> · persistence <b>${v.alert.persisted_days} day${v.alert.persisted_days === 1 ? '' : 's'}</b> (+${b.persistence}) · worsening +${b.worsening} = score <b>${b.severity + b.persistence + b.worsening}</b>`);
    if (d.path !== 'SELF_CARE') {
      reasons.push(d.delivery === 'QUEUE_OFFLINE' ? 'The link is down, so the report waits in the queue.'
        : v.delayS < live ? `Earth is within ${live} s, close enough for a live call.`
        : `Earth is ${formatDelay(v.delayS)} away, above the ${live} s live-call limit: no live call.`);
    }
  }
  $('#decision-why').innerHTML = reasons.map(x => `<li><span>${x}</span></li>`).join('');
  $('#decision-cf').innerHTML = v.counterfactuals.length
    ? v.counterfactuals.map(cf => `<li><span>${esc(cf.label)}: <b>${esc(PATH[cf.path].short)}</b>, ${esc(DELIVERY[cf.delivery].short.toLowerCase())}</span></li>`).join('')
    : `<li><span>${d.noAlert ? 'A new alert would start the loop.' : 'Nothing in the current situation would change this.'}</span></li>`;

  const signal = `<svg class="cta-ico" viewBox="0 0 48 20" aria-hidden="true"><path d="M0 10h8l3-7 4 14 3-10 3 6h6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="40" cy="10" r="2.4" fill="currentColor"/><path d="M35 4a8 8 0 0 0 0 12M45 4a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  $('#decision-actions').innerHTML = needsPacket(d)
    ? (sent
      ? `<div class="cta-bar is-done"><span class="cta-tag">DTN</span><span class="cta-text">${esc(sent.packet.packet_id)} · ${esc(sent.packet.status.toLowerCase())}</span><button class="btn btn-sm" id="btn-today-queue">Open the queue</button></div>`
      : `<button class="cta-bar" id="btn-today-send"><span class="cta-tag">CTA</span><span class="cta-text">Build &amp; transmit checksummed report to Earth${d.delivery === 'QUEUE_OFFLINE' ? ' (held until link returns)' : ''}</span>${signal}</button>`)
    : (d.delivery === 'LIVE_CALL'
      ? `<div class="cta-bar is-done"><span class="cta-tag">LIVE</span><span class="cta-text">Live call: no packet needed. The flight surgeon joins in real time.</span></div>`
      : `<div class="cta-bar is-done"><span class="cta-tag">LOG</span><span class="cta-text">Logged on board · nothing leaves the ship</span></div>`);

  // ---- Career standing
  renderCareer();

  // ---- Loop
  renderLoop(v, sent, hist);

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

/** Store-and-forward queue summary, checksum check and a live Earth-latency countdown. */
let dtnTimer = null;
function renderDTN(v) {
  const el = $('#today-dtn');
  if (!el) return;
  const q = getQueue();
  const pending = q.filter(e => e.packet.status !== 'ACKNOWLEDGED');
  const acked = q.length - pending.length;
  const failed = q.filter(e => e.packet.status === 'FAILED').length;
  const allOk = q.every(e => verifyPacket(e.packet));
  el.innerHTML = `
    <div class="deck-panel-head"><h3>DTN packet terminal</h3><span class="deck-meta">${v.env.linkUp ? 'Link active' : '<b class="t-bad">Link down</b>'}</span></div>
    <div class="dtn-grid">
      <div class="dtn-cell"><span class="dtn-cap">Store-and-forward queue</span><b class="dtn-big">${pending.length}</b><span class="dtn-sub">${pending.length === 1 ? 'packet' : 'packets'} queued · ${acked} acked</span></div>
      <div class="dtn-cell"><span class="dtn-cap">Checksum (FNV-1a)</span>
        <div class="dtn-check ${allOk && !failed ? 'pass' : 'fail'}"><span>${q.length ? (allOk && !failed ? 'Active / pass' : `${failed} failed`) : 'Idle'}</span><b>${allOk && !failed ? 'Pass' : 'Retry'}</b></div>
        <div class="dtn-bar"><i style="width:${q.length ? Math.round((acked / q.length) * 100) : 100}%"></i></div></div>
      <div class="dtn-cell"><span class="dtn-cap">Earth latency countdown</span><b class="dtn-clock" id="dtn-clock">--:--</b><span class="dtn-sub">one-way · min : sec</span></div>
    </div>`;
  // Countdown from the one-way delay, restarting each time it reaches zero (a packet "arrives")
  clearInterval(dtnTimer);
  const total = Math.round(v.delayS);
  const t0 = Date.now();
  const tick = () => {
    const c = document.getElementById('dtn-clock');
    if (!c) { clearInterval(dtnTimer); return; }
    const left = total - (Math.floor((Date.now() - t0) / 1000) % Math.max(1, total));
    c.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  };
  tick();
  dtnTimer = setInterval(tick, 1000);
}

/** Career standing, badges and crew table (design_mockups/08). Also used by the Digital twin tab. */
export function renderCareer(el = $('#today-career-bar')) {
  if (!el || !GameState) return;
  const rk = GameState.getRank();
  const badges = GameState.getBadgeStatus();
  const pick = [['cardiac_guardian', 'bronze'], ['neuro_sharp', 'cyan'], ['dtn_specialist', 'silver'], ['iron_astronaut', 'steel']];
  const crew = GameState.getLeaderboard();
  el.innerHTML = `
    <div class="career-head">
      <h3>Astronaut career standing: <span>LVL ${rk.level} · ${esc(rk.title)}</span></h3>
      <span class="streak-chip">🔥 ${GameState.streak}-day transit adherence streak</span>
    </div>
    <div class="career-xp"><div class="career-xp-bar"><i style="width:${rk.progressPct}%"></i></div>
      <span><b>${rk.xp}</b> / ${rk.maxXP} XP to ${esc(rk.nextTitle)}</span></div>
    <div class="career-badges">
      ${pick.map(([id, metal]) => {
        const b = badges.find(x => x.id === id) || { name: id, desc: '', unlocked: false };
        return `<div class="career-badge ${b.unlocked ? '' : 'locked'}" title="${esc(b.desc)}">${hexBadge(id, metal, b.unlocked)}<span>${esc(b.name)}</span></div>`;
      }).join('')}
    </div>
    <table class="crew-table">
      <thead><tr><th>Ares-VI cooperative crew standing</th><th>Role</th><th>Readiness</th><th class="r">Score</th></tr></thead>
      <tbody>${crew.map(c => `
        <tr class="${c.active ? 'is-me' : ''}"><td>${esc(c.callsign)}</td><td><span class="role-chip">${esc(c.role)}</span></td>
        <td><span class="ready-chip ${c.tier === 'Tier I' ? 'ok' : 'warn'}">${c.tier === 'Tier I' ? 'Ready' : 'Caution'}</span></td><td class="r num">${c.score} XP</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="career-foot"><span>Badges unlocked: <b>${badges.filter(x => x.unlocked).length}/${badges.length}</b></span>${el.id === 'today-career-bar' ? '<button class="deck-link" id="btn-goto-career">View Ares-VI standing ↗</button>' : ''}</div>`;
}

function renderLoop(v, sent, hist) {
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
  const cone = `<svg class="loop-cone" viewBox="0 0 90 40" aria-hidden="true"><path d="M6 28 L80 6 M6 28 L84 34" stroke="currentColor" stroke-width="1.2" fill="none"/><ellipse cx="82" cy="20" rx="5" ry="14" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 28 L82 20" stroke="currentColor" stroke-dasharray="2 3" stroke-width="1"/><circle cx="6" cy="28" r="2.4" fill="currentColor"/></svg>`;
  const branch = (a, b2) => `<div class="loop-branch"><svg viewBox="0 0 80 22" aria-hidden="true"><path d="M40 0 V8 M40 8 Q40 12 20 14 V22 M40 8 Q40 12 60 14 V22" fill="none" stroke="currentColor" stroke-width="1.4"/></svg><span>${a}</span><span>${b2}</span></div>`;

  const steps = [
    { n: 1, name: 'Read', goto: 'signals', tone: '', value: `Day ${v.day}`, kicker: 'Telemetry stream',
      body: `<div class="loop-spark">${sparkSVG(hist.map(x => x.vitals.sleep_h), { base: b.sleep_h, w: 140, h: 34 })}</div><div class="loop-mini"><span>Sleep ${delta(r.sleep_h, b.sleep_h)}</span><span>HR ${delta(r.hr_bpm, b.hr_bpm, 0, true)}</span></div>` },
    { n: 2, name: 'Detect', goto: 'signals', tone: worst ? (worst.severity >= 3 ? 'bad' : worst.severity === 2 ? 'warn' : 'ok') : 'ok',
      value: worst ? 'Drift' : 'No drift', kicker: 'From a personalised baseline',
      body: `<div class="loop-alarm ${worst ? '' : 'is-clear'}">${worst ? `${ICON.alert}${esc(v.alerts.slice(0, 2).map(a => METRIC[a.metric] || a.metric).join(' & '))} ${v.alerts.length > 1 ? 'alarms' : 'alarm'}` : 'All signals in baseline'}</div>` },
    { n: 3, name: 'Forecast', goto: 'forecast', tone: counts.alarm ? 'bad' : counts.caution ? 'warn' : 'ok',
      value: `Day 180`, kicker: `Readiness ${v.readiness.score}% · 6 dimensions`,
      body: `${cone}<div class="loop-note">${counts.nominal} GO · ${counts.caution} WATCH · ${counts.alarm} NO-GO</div>` },
    { n: 4, name: 'Decide', goto: 'rules', tone: PATH[d.path].tone,
      value: d.noAlert ? 'Self-monitor' : PATH[d.path].short, kicker: 'Deterministic clinical triage',
      body: d.noAlert ? `<div class="loop-note">No case to route</div>` : branch(v.env.onboardSupport ? 'CMO' : 'Flight surgeon', `Score ${d.score}`) },
    { n: 5, name: 'Deliver', goto: 'comms', tone: deliverTone,
      value: d.delivery === 'LIVE_CALL' ? 'Live' : needsPacket(d) ? 'DTN' : 'Log', kicker: DELIVERY[d.delivery].short,
      body: `<div class="loop-uplink">${needsPacket(d) ? (sent ? `${esc(sent.packet.packet_id)} · ${esc(sent.packet.status.toLowerCase())}` : '🌍 Earth uplink ready') : d.delivery === 'LIVE_CALL' ? 'Real-time consult' : 'Nothing leaves the ship'}</div>` },
  ];
  // Hash routes used by the steps (smoke check): goto: 'forecast', goto: 'comms'
  $('#loop').innerHTML = steps.map((s, i) => `
    <div class="conduit-node ${i % 2 ? 'pipe-down' : 'pipe-up'}">
      <span class="conduit-label"><b>${String(s.n).padStart(2, '0')}</b> ${s.name}</span>
      <button class="loop-step" data-goto="${s.goto}" data-tone="${s.tone}">
        <span class="sr-only">Step ${s.n}: ${s.name}.</span>
        <div class="loop-value ${s.value.length > 12 ? 'is-long' : ''}">${esc(s.value)}</div>
        <div class="loop-kicker">${esc(s.kicker)}</div>
        ${s.body}
      </button>
    </div>${i < steps.length - 1 ? '<span class="conduit-link" aria-hidden="true"><i></i></span>' : ''}`).join('');
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
