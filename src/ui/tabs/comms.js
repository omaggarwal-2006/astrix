/**
 * LANDFALL - Triage & Comms tab: triage preview, link selector, send/copy, queue table (src/ui/tabs/comms.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../../app/state.js";
import { getAlerts, getReadings, getBaseline } from "../../core/adapter.js";
import { buildPacket } from "../../core/packet.js";
import { handleAlert, peekNextSeq } from "../../core/pipeline.js";
import { getQueue, setLink as setQueueLink, config as queueConfig } from "../../core/queue.js";
import { LINK_PRESETS } from "../../core/sources.js";
import { triage } from "../../core/triage.js";
import { sampleAlert } from "../../data/sample-alert.js";
import { showCaption, hideCaption } from "../demo-runner.js";

// -------------------------------------------------------------
// STEP 5: TRIAGE & COMMS
// -------------------------------------------------------------
// Shared inputs for the triage preview and the Send button
export function buildTriageInputs() {
  const day = AppState.currentDay;
  const readings = getReadings(day);
  const alerts = getAlerts(day);
  const alert = alerts.length > 0 ? alerts[0] : sampleAlert;

  const preset = LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID;
  const env = {
    onboardSupport: true,
    link: { available: true, delay_s: preset.delay_s }
  };

  const ctx = {
    missionDay: day,
    current: readings.vitals,
    baseline: getBaseline(),
    trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1],
    trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
    cabin: readings.cabin,
    countermeasure: "Enforce circadian sleep hygiene protocol."
  };

  return { alert, ctx, env };
}

export function renderTriageTab() {
  const { alert, ctx, env } = buildTriageInputs();

  // Preview only: evaluate triage and build the packet WITHOUT enqueueing it.
  // Packets are enqueued only when the user presses "Send packet".
  const decision = triage(alert, env);
  const needsPacket = decision.delivery === "SEND_PACKET" || decision.delivery === "QUEUE_OFFLINE";
  const result = {
    decision,
    packet: needsPacket ? buildPacket(alert, decision, ctx, peekNextSeq()) : null
  };

  const pathEl = document.getElementById('triage-path-display');
  const whyEl = document.getElementById('triage-why-display');
  const deliveryEl = document.getElementById('triage-delivery-display');
  const previewEl = document.getElementById('triage-packet-preview');

  if (pathEl) {
    const titles = {
      SELF_CARE: 'Self-Treat',
      CREW_MEDICAL_OFFICER: 'Crew Medical Officer',
      FLIGHT_SURGEON: 'Flight Surgeon'
    };
    pathEl.textContent = titles[decision.path] || decision.path;
  }
  if (whyEl) whyEl.textContent = decision.why;
  if (deliveryEl) deliveryEl.textContent = `Delivery: ${decision.delivery}`;

  if (previewEl && result.packet) {
    previewEl.textContent = JSON.stringify(result.packet, null, 2);
  } else if (previewEl) {
    previewEl.textContent = "// No packet required for current clinical path (handled on-board).";
  }

  // Link selector
  initLinkSelector();
  renderQueueTable(getQueue());
}

export function initLinkSelector() {
  const select = document.getElementById('link-preset-select');
  if (!select) return;

  if (select.children.length === 0) {
    Object.keys(LINK_PRESETS).forEach(k => {
      const p = LINK_PRESETS[k];
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${p.label} (${p.delay_s}s 1-way) - ${p.note}`;
      if (k === AppState.activePresetKey) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      AppState.activePresetKey = e.target.value;
      const chosen = LINK_PRESETS[e.target.value];
      setQueueLink({ available: true, delay_s: chosen.delay_s });
      renderTriageTab();
    });
  }

  const speedupNote = document.getElementById('queue-clock-speedup');
  if (speedupNote) {
    const minsSim = (queueConfig.speedup / 60).toFixed(1);
    speedupNote.textContent = `demo clock: 1 s = ${minsSim} min`;
  }
}

export function initTriageControls() {
  const btnSend = document.getElementById('btn-send-packet');
  const btnCopy = document.getElementById('btn-copy-packet');

  if (btnSend) {
    btnSend.addEventListener('click', () => {
      const { alert, ctx, env } = buildTriageInputs();

      // handleAlert() already enqueues the packet; do not enqueue it a second time.
      const res = handleAlert(alert, ctx, env);
      if (res.packet) {
        renderQueueTable(getQueue());
        showCaption(`Telemetry packet ${res.packet.packet_id} queued and dispatched to Earth DSN downlink.`);
      } else {
        showCaption(`No packet needed: ${res.decision.path} via ${res.decision.delivery}.`);
      }
      setTimeout(hideCaption, 4000);
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const preview = document.getElementById('triage-packet-preview');
      if (preview && preview.textContent) {
        navigator.clipboard.writeText(preview.textContent).then(() => {
          btnCopy.textContent = 'Copied!';
          setTimeout(() => { btnCopy.textContent = 'Copy packet'; }, 2000);
        }).catch(() => {});
      }
    });
  }
}

export function renderQueueTable(queue) {
  const container = document.getElementById('queue-items-container');
  if (!container) return;

  if (queue.length === 0) {
    container.innerHTML = `<div style="padding: 16px; color: var(--starlight-dim); font-size: 15px;">No packets currently queued.</div>`;
    return;
  }

  let html = '';
  queue.forEach((entry, idx) => {
    const p = entry.packet;
    const statusMap = {
      QUEUED: { label: 'Queued', shape: 'shape-circle', status: 'caution' },
      TRANSMITTED: { label: 'Transmitted', shape: 'shape-triangle', status: 'caution' },
      ACKNOWLEDGED: { label: 'Acknowledged', shape: 'shape-circle', status: 'nominal' },
      FAILED: { label: 'Failed (retrying)', shape: 'shape-diamond', status: 'alarm' }
    };
    const s = statusMap[p.status] || statusMap.QUEUED;

    const retryBtnHtml = p.status === 'FAILED' ? `
      <button class="chassis-btn retry-packet-btn" data-index="${idx}" style="font-size: 13px; padding: 3px 8px; margin-top: 6px;">
        Retry transmission
      </button>
    ` : '';

    html += `
      <div style="background: #080D16; border: 1px solid var(--hull-line); border-radius: 4px; padding: 14px 18px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <strong style="font-family: var(--font-heading); font-size: 16px; color: var(--starlight);">${p.packet_id} (${p.priority})</strong>
          <span class="status-badge status-${s.status}">
            <span class="${s.shape}"></span> ${s.label}
          </span>
        </div>
        <div style="font-size: 14.5px; color: #CAD5D4; margin-bottom: 4px; word-break: normal; overflow-wrap: break-word;">
          ${p.anomaly}
        </div>
        <div style="font-size: 13.5px; color: var(--starlight-dim);">
          Attempts: <strong>${entry.attempts}</strong> &bull; Ground Reply: <span style="font-family: var(--font-mono); color: #B5C5C4;">${entry.ground_reply || 'Awaiting transmission acknowledgement...'}</span>
        </div>
        ${retryBtnHtml}
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind working retry buttons
  container.querySelectorAll('.retry-packet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const q = getQueue();
      if (q[idx]) {
        q[idx].packet.status = 'QUEUED';
        const pr = LINK_PRESETS[AppState.activePresetKey] || LINK_PRESETS.MARS_MID;
        setQueueLink({ available: true, delay_s: pr.delay_s, label: pr.label });
        renderQueueTable(q);
      }
    });
  });
}
