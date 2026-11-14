/**
 * LANDFALL - Signals (step 1, Detect): today's vitals against the personal baseline,
 * drift alerts, 180-day trends, cabin and radiation, the daily check-in (src/ui/tabs/signals.js)
 */

import { AppState } from "../../app/state.js";
import { CONFIG } from "../../core/config.js";
import { $, esc, METRIC, severityPill, pill, flash } from "../dom.js";
import { renderTrendLines, initTrendChartButtons } from "../components/trend-chart.js";

const KPIS = [
  { key: 'sleep_h', label: 'Sleep', unit: 'h', base: 'sleep_h', dec: 1, alert: 'sleep_h', lowBad: true },
  { key: 'hr_bpm', label: 'Resting heart rate', unit: 'bpm', base: 'hr_bpm', dec: 0, alert: 'hr_bpm', lowBad: false },
  { key: 'bp', label: 'Blood pressure', unit: 'mmHg', dec: 0 },
  { key: 'mood', label: 'Mood', unit: '/ 5', base: 'mood', dec: 1, alert: 'mood', lowBad: true },
  { key: 'exercise_min', label: 'Exercise', unit: 'min', base: 'exercise_min', dec: 0, alert: 'exercise_min', lowBad: true },
  { key: 'temp_c', label: 'Core temperature', unit: '°C', base: 'temp_c', dec: 1 },
];

export function mountSignals() {
  const panel = document.getElementById('panel-signals');
  panel.innerHTML = `
    <div class="view-head">
      <div>
        <span class="eyebrow"><span class="step-no">1</span>Detect</span>
        <h1>What changed for this astronaut?</h1>
        <p>Each reading is compared with this astronaut's own baseline from days 1–14, not a population average. Alerts say how far, for how long, and which way it's heading.</p>
      </div>
    </div>

    <div class="kpis" id="kpis"></div>

    <div class="grid g-12 mt">
      <article class="card span-8 reveal" style="--i:1">
        <div class="card-head">
          <div><h3 class="card-title">180-day trend against baseline</h3><p class="card-sub">Dashed line: personal baseline · Dot: selected day</p></div>
          <div class="segmented chart-tabs" role="group" aria-label="Choose a signal">
            <button id="btn-chart-sleep" class="active" aria-pressed="true">Sleep</button>
            <button id="btn-chart-mood" aria-pressed="false">Mood</button>
            <button id="btn-chart-hr" aria-pressed="false">Heart rate</button>
          </div>
        </div>
        <div class="chart-box">
          <div id="chart-wrap-sleep" class="chart-wrap"><canvas id="trend-sleep-chart" aria-label="Sleep hours over 180 days"></canvas></div>
          <div id="chart-wrap-mood" class="chart-wrap" style="display:none"><canvas id="trend-mood-chart" aria-label="Mood score over 180 days"></canvas></div>
          <div id="chart-wrap-hr" class="chart-wrap" style="display:none"><canvas id="trend-hr-chart" aria-label="Resting heart rate over 180 days"></canvas></div>
        </div>
        <p class="chart-summary" id="plain-chart-summary"></p>
      </article>

      <article class="card span-4 reveal" style="--i:2">
        <div class="card-head"><div><h3 class="card-title">Drift alerts</h3><p class="card-sub">What fired today, and why</p></div></div>
        <div class="alert-list" id="signals-alerts"></div>
      </article>

      <article class="card span-6 reveal" style="--i:3">
        <div class="card-head"><div><h3 class="card-title">Cabin, radiation and immune</h3><p class="card-sub">Environmental limits are absolute, not personal</p></div></div>
        <div id="scrubber-alert-callout"></div>
        <div class="env-rows" id="env-rows"></div>
      </article>

      <article class="card span-6 reveal" style="--i:4">
        <details class="checkin" id="checkin-details">
          <summary>
            <div><h3 class="card-title">Log today's check-in</h3><p class="card-sub">Crew-entered values replace that day's synthetic vitals</p></div>
            <span class="chev">▾</span>
          </summary>
          <form id="monitor-checkin-form" novalidate>
            <div class="form-grid">
              <label><span class="hull-label">Resting heart rate (bpm)</span><input class="input" id="monitor-hr" type="number" inputmode="decimal" min="35" max="220" required></label>
              <label><span class="hull-label">Systolic BP (mmHg)</span><input class="input" id="monitor-sys" type="number" min="70" max="220" required></label>
              <label><span class="hull-label">Diastolic BP (mmHg)</span><input class="input" id="monitor-dia" type="number" min="40" max="140" required></label>
              <label><span class="hull-label">Core temperature (°C)</span><input class="input" id="monitor-temp" type="number" step="0.1" min="34" max="42" required></label>
              <label><span class="hull-label">Sleep (hours)</span><input class="input" id="monitor-sleep" type="number" step="0.1" min="0" max="16" required></label>
              <label><span class="hull-label">Mood (1–5)</span><input class="input" id="monitor-mood" type="number" step="0.1" min="1" max="5" required></label>
              <label><span class="hull-label">Exercise (minutes)</span><input class="input" id="monitor-exercise" type="number" min="0" max="240" required></label>
            </div>
            <div class="row" style="margin-top:14px"><button type="submit" class="btn btn-primary">Save check-in</button><span class="muted small" id="checkin-day-note"></span></div>
            <div class="form-msg" id="checkin-error-msg" role="alert"></div>
            <div class="form-msg" id="checkin-success-msg" role="status"></div>
          </form>
        </details>
      </article>
    </div>`;

  initTrendChartButtons();
  // keep the segmented buttons' pressed state in step with the chart component
  panel.querySelectorAll('.chart-tabs button').forEach(b => b.addEventListener('click', () => {
    panel.querySelectorAll('.chart-tabs button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  }));
  initCheckinForm();
}

export function renderSignals() {
  const v = AppState.view;
  if (!v) return;
  const r = v.reading.vitals;
  const base = v.baseline;
  const alertBy = Object.fromEntries(v.alerts.map(a => [a.metric, a]));

  $('#kpis').innerHTML = KPIS.map((k, i) => {
    let value, baseText = '', cls = '';
    if (k.key === 'bp') {
      value = `${r.bp_sys}/${r.bp_dia}`;
      baseText = `Baseline ${base.bp_sys}/${base.bp_dia}`;
      if (r.bp_sys - base.bp_sys >= 8) cls = 'is-watch';
    } else {
      value = Number(r[k.key]).toFixed(k.dec);
      const b = base[k.base];
      const dlt = +(r[k.key] - b).toFixed(k.dec);
      baseText = `Baseline ${Number(b).toFixed(k.dec)} · ${dlt > 0 ? '+' : ''}${dlt}`;
      const a = k.alert && alertBy[k.alert];
      if (a) cls = a.severity >= 3 ? 'is-alert' : 'is-watch';
      else if (Math.abs(dlt) / (b || 1) > 0.12) cls = 'is-watch';
    }
    const tag = cls === 'is-alert' ? pill('bad', 'shape-octagon', 'Alert') : cls === 'is-watch' ? pill('warn', 'shape-triangle', 'Watch') : '';
    return `<div class="kpi ${cls} reveal" style="--i:${i}"><div class="label"><span>${k.label}</span>${tag}</div>
      <div class="value">${value}<small>${k.unit}</small></div><div class="base">${baseText}${r.logged ? ' · logged by crew' : ''}</div></div>`;
  }).join('');

  $('#signals-alerts').innerHTML = v.alerts.length
    ? v.alerts.map(a => `
      <div class="alert-item sev-${a.severity}">
        ${severityPill(a.severity)}
        <div><div class="t">${esc(METRIC[a.metric] || a.metric)}</div><div class="d">${esc(a.reason)}</div>
        <div class="d">z ${a.z > 0 ? '+' : ''}${a.z} · ${a.persisted_days} day${a.persisted_days > 1 ? 's' : ''} · ${a.worsening ? 'worsening' : 'not worsening'}</div></div>
        <span></span>
      </div>`).join('')
    : `<div class="empty"><span class="shape-circle"></span> No drift from baseline on day ${v.day}.</div>`;

  // Cabin, radiation, immune
  const c = v.reading.cabin, rad = v.reading.radiation, im = v.reading.immune;
  const co2Tone = c.co2 >= CONFIG.co2HintPpm ? 'bad' : c.co2 >= CONFIG.co2HintPpm * 0.8 ? 'warn' : 'ok';
  const doseFrac = Math.min(1, rad.cumulativeDose / CONFIG.doseLimitMSv);
  const headache = v.reading.symptoms.includes('headache');
  $('#scrubber-alert-callout').innerHTML = headache && c.co2 >= CONFIG.co2HintPpm
    ? `<div class="callout" style="margin-bottom:14px"><span class="shape-octagon" style="margin-top:5px"></span><div><strong>Headache plus high CO2: check the scrubber first.</strong> Cabin CO2 is ${c.co2} ppm, above the ${CONFIG.co2HintPpm} ppm hint level.</div></div>` : '';
  $('#env-rows').innerHTML = `
    <div class="env-row"><div class="top"><span>Cabin CO₂</span><b class="num">${c.co2.toLocaleString()} <span class="muted small">ppm</span></b></div>
      <div class="meter ${co2Tone}"><span style="width:${Math.min(100, c.co2 / 60)}%"></span></div>
      <div class="env-note">Hint level ${CONFIG.co2HintPpm.toLocaleString()} ppm (team assumption) · cabin ${c.temp} °C · noise ${c.noise} dBA</div></div>
    <div class="env-row"><div class="top"><span>Radiation, mission total</span><b class="num">${rad.cumulativeDose} <span class="muted small">mSv</span></b></div>
      <div class="meter ${doseFrac >= 0.8 ? 'bad' : doseFrac >= 0.5 ? 'warn' : ''}"><span style="width:${(doseFrac * 100).toFixed(1)}%"></span></div>
      <div class="env-note">${rad.dailyDose} mSv/day · ${(doseFrac * 100).toFixed(0)} % of the ${CONFIG.doseLimitMSv} mSv career limit (assumes no prior dose; limit to be verified)</div></div>
    <div class="env-row"><div class="top"><span>Immune and symptoms</span></div>
      <div class="immune">
        ${im.coldSore ? pill('warn', 'shape-triangle', 'Possible cold sore') : pill('ok', 'shape-circle', 'No cold sore')}
        ${im.fatigue ? pill('warn', 'shape-triangle', 'Fatigue') : pill('ok', 'shape-circle', 'No fatigue')}
        ${im.rash ? pill('warn', 'shape-triangle', 'Rash') : pill('ok', 'shape-circle', 'No rash')}
        ${v.reading.symptoms.length ? pill('info', 'shape-circle', 'Reported: ' + v.reading.symptoms.join(', ').replace(/_/g, ' ')) : ''}
      </div></div>`;

  // Prefill the check-in with today's values
  const f = (id, val) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = val; };
  f('monitor-hr', r.hr_bpm); f('monitor-sys', r.bp_sys); f('monitor-dia', r.bp_dia); f('monitor-temp', r.temp_c);
  f('monitor-sleep', r.sleep_h); f('monitor-mood', r.mood); f('monitor-exercise', r.exercise_min);
  $('#checkin-day-note').textContent = `Saves to day ${v.day}`;

  renderTrendLines(v.day);
}

function initCheckinForm() {
  const form = document.getElementById('monitor-checkin-form');
  const errBox = document.getElementById('checkin-error-msg');
  const okBox = document.getElementById('checkin-success-msg');
  const RULES = [
    ['monitor-hr', 35, 220, 'Heart rate must be between 35 and 220 bpm.'],
    ['monitor-sys', 70, 220, 'Systolic BP must be between 70 and 220 mmHg.'],
    ['monitor-dia', 40, 140, 'Diastolic BP must be between 40 and 140 mmHg.'],
    ['monitor-temp', 34.0, 42.0, 'Core temperature must be between 34.0 and 42.0 °C.'],
    ['monitor-sleep', 0.0, 16.0, 'Sleep hours must be between 0.0 and 16.0 hours.'],
    ['monitor-mood', 1.0, 5.0, 'Mood score must be between 1.0 and 5.0.'],
    ['monitor-exercise', 0, 240, 'Daily exercise must be between 0 and 240 minutes.'],
  ];
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errBox.className = 'form-msg'; okBox.className = 'form-msg';
    const val = {};
    for (const [id, min, max, msg] of RULES) {
      const n = parseFloat(document.getElementById(id).value);
      if (isNaN(n) || n < min || n > max) {
        errBox.textContent = msg; errBox.className = 'form-msg error';
        document.getElementById(id).focus();
        return;
      }
      val[id] = n;
    }
    const key = 'landfall_custom_checkins';
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[AppState.currentDay] = {
      hr: val['monitor-hr'], sys: val['monitor-sys'], dia: val['monitor-dia'], temp: val['monitor-temp'],
      sleep: val['monitor-sleep'], mood: val['monitor-mood'], exercise: val['monitor-exercise'], timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(existing));
    okBox.textContent = `Check-in for day ${AppState.currentDay} saved. Today's vitals now use your values.`;
    okBox.className = 'form-msg success';
    setTimeout(() => { okBox.className = 'form-msg'; }, 5000);
    AppState.refresh();
    flash(document.getElementById('kpis'));
  });
}
