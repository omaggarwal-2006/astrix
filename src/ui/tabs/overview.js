/**
 * LANDFALL - Overview tab: readiness hero, Go/No-Go poll, active alerts (src/ui/tabs/overview.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { activateTab } from "../../app/router.js";
import { AppState } from "../../app/state.js";
import { getAlerts, getForecast, mapSeverity } from "../../core/adapter.js";

// -------------------------------------------------------------
// STEP 2: OVERVIEW TAB (HERO READINESS, GO/NO-GO POLL & CONSTELLATION)
// -------------------------------------------------------------
export function renderOverviewTab() {
  const day = AppState.currentDay;
  const forecast = getForecast(day, AppState.exerciseHours);
  const alerts = getAlerts(day);

  // Update Constellation
  if (AppState.constellation) {
    AppState.constellation.setData(forecast);
  }

  // Update Landing Readiness Hero (72px)
  const midValues = forecast.map(f => f.landing.mid);
  const avg = Math.round(midValues.reduce((a, b) => a + b, 0) / midValues.length);
  const isNominal = avg >= 90;
  const isCaution = avg >= 82 && avg < 90;

  const numEl = document.getElementById('readiness-number');
  const sentenceEl = document.getElementById('readiness-sentence');
  const badgeEl = document.getElementById('readiness-badge');
  const ring = document.getElementById('mars-progress-ring');

  if (numEl) numEl.textContent = `${avg}%`;
  if (sentenceEl) {
    if (isNominal) {
      sentenceEl.textContent = 'Fit for landing.';
      sentenceEl.style.color = 'var(--nominal-teal)';
    } else {
      sentenceEl.textContent = 'At risk on landing day.';
      sentenceEl.style.color = isCaution ? 'var(--signal-amber)' : 'var(--alarm-coral)';
    }
  }

  if (badgeEl) {
    if (isNominal) {
      badgeEl.className = 'status-badge status-nominal';
      badgeEl.innerHTML = '<span class="shape-circle"></span> Nominally cleared';
    } else if (isCaution) {
      badgeEl.className = 'status-badge status-caution';
      badgeEl.innerHTML = '<span class="shape-triangle"></span> Countermeasures required';
    } else {
      badgeEl.className = 'status-badge status-alarm';
      badgeEl.innerHTML = '<span class="shape-diamond"></span> Critical flight risk';
    }
  }

  if (ring) {
    const offset = 283 - (283 * (avg / 100));
    ring.style.strokeDashoffset = offset;
    ring.setAttribute('stroke', isNominal ? '#3FB59A' : (isCaution ? '#E8A93A' : '#E5594F'));
  }

  // Render The Go / No-Go Poll (6 rows)
  renderGoNoGoPoll(forecast);

  // Active alerts list
  renderAlertsList(alerts);
}

export function renderGoNoGoPoll(forecast) {
  const container = document.getElementById('gonogo-poll-container');
  if (!container) return;

  let html = `
    <table class="gonogo-table" role="table" aria-label="Landing Go No-Go System Poll">
      <thead>
        <tr>
          <th scope="col">System / Dimension</th>
          <th scope="col">Poll Status</th>
          <th scope="col">Landing Projection</th>
          <th scope="col" style="text-align: right;">Detail</th>
        </tr>
      </thead>
      <tbody>
  `;

  forecast.forEach(item => {
    const st = item.status;
    let badgeHtml = '';
    if (st === 'nominal') {
      badgeHtml = `<span class="gonogo-badge go"><span class="shape-circle"></span> GO</span>`;
    } else if (st === 'caution') {
      badgeHtml = `<span class="gonogo-badge watch"><span class="shape-triangle"></span> WATCH</span>`;
    } else {
      badgeHtml = `<span class="gonogo-badge nogo"><span class="shape-diamond"></span> NO-GO</span>`;
    }

    html += `
      <tr class="gonogo-row" tabindex="0" role="button" data-dimension="${item.dimension}" title="Click to inspect flight cone for ${item.dimension}">
        <td class="gonogo-cell-name">${item.dimension}</td>
        <td class="gonogo-cell-status">${badgeHtml}</td>
        <td class="gonogo-cell-value">
          <div class="gonogo-val-mid">${item.landing.mid}%</div>
          <div class="gonogo-val-range">Estimated range (illustrative): ${item.landing.low}% \u2013 ${item.landing.high}%</div>
        </td>
        <td class="gonogo-cell-jump">Inspect cone &rarr;</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // Add click handlers to rows jumping to Forecast
  container.querySelectorAll('.gonogo-row').forEach(row => {
    const jump = () => {
      const dim = row.getAttribute('data-dimension');
      window.location.hash = 'forecast';
      activateTab('forecast');
      setTimeout(() => {
        const target = Array.from(document.querySelectorAll('.cone-card strong')).find(el => el.textContent.includes(dim));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    };

    row.addEventListener('click', jump);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    });
  });
}

export function renderAlertsList(alerts) {
  const container = document.getElementById('active-alerts-container');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="alerts-empty-state">
        <span class="shape-circle"></span> No active alerts. All systems nominal relative to personal baseline.
      </div>
    `;
    return;
  }

  let html = '';
  alerts.forEach(a => {
    const map = mapSeverity(a.severity);
    html += `
      <div class="alert-row-card" tabindex="0" role="button" data-alert-id="${a.id}" title="Click to evaluate alert ${a.id} in Triage & Comms">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span class="${map.shapeClass}" title="${map.label}"></span>
          <div>
            <div style="font-family: var(--font-heading); font-size: 16.5px; color: var(--starlight); font-weight: 600;">
              ${a.id} &bull; ${a.metric} (${a.current} vs personal baseline ${a.baseline})
            </div>
            <div style="font-size: 15px; color: #B0BCBA; margin-top: 3px;">${a.reason}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="status-badge status-${map.status}">
            <span class="${map.shapeClass}"></span> ${map.label}
          </span>
          <span style="font-size: 14px; color: var(--earthlight); white-space: nowrap;">Route to triage &rarr;</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  container.querySelectorAll('.alert-row-card').forEach(card => {
    const jump = () => {
      window.location.hash = 'triage';
      activateTab('triage');
    };
    card.addEventListener('click', jump);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    });
  });
}
