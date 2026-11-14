/**
 * LANDFALL - Act UI (act-ui.js)
 * Implements the "Act" verb:
 * 1. Current clinical physiological flags
 * 2. Delay-aware triage recommendation (Self-treat / CMO / Flight Surgeon)
 * 3. Comm delay selector (ISS, Moon, Mars transit) with "source pending" labels
 * 4. Store-and-forward packet transmission flow (Queued -> Transmitted -> Acknowledged)
 * 5. Emergency near-instant link for critical alarms
 */

(function(window) {
  'use strict';

  let currentPacket = null;
  let transmissionTimer = null;
  let activeLocationOverride = 'transit'; // 'iss' | 'moon' | 'transit'

  const ActUI = {
    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      // Comm delay location preset selector
      const commRadios = document.querySelectorAll('input[name="comm-location-preset"]');
      commRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          activeLocationOverride = e.target.value;
          this.handleLocationPresetChange(e.target.value);
        });
      });

      // Send Packet Button
      const btnSend = document.getElementById('btn-send-packet');
      if (btnSend) {
        btnSend.addEventListener('click', () => {
          this.handleSendPacket();
        });
      }

      // Emergency Direct Link Button
      const btnEmergency = document.getElementById('btn-emergency-link');
      if (btnEmergency) {
        btnEmergency.addEventListener('click', () => {
          this.handleEmergencyTrigger();
        });
      }

      // Sync with master state
      if (window.LandfallState) {
        window.LandfallState.subscribe(() => {
          if (activeLocationOverride === 'transit') {
            this.render();
          }
        });
      }
    },

    getEffectiveDelaySeconds(day) {
      if (activeLocationOverride === 'iss') return 2; // LEO light travel ~ 2s (source pending)
      if (activeLocationOverride === 'moon') return 3; // Lunar distance ~ 3s (source pending)
      return window.LandfallState ? window.LandfallState.getCommDelaySeconds(day) : 128;
    },

    handleLocationPresetChange(preset) {
      this.render();
    },

    render() {
      const day = window.LandfallState ? window.LandfallState.currentDay : 40;
      const data = window.StorageManager ? window.StorageManager.getDay(day) : null;
      if (!data || !window.TriageEngine) return;

      const delaySec = this.getEffectiveDelaySeconds(day);
      const triage = window.TriageEngine.evaluate(day, data, delaySec);

      this.renderFlags(triage.flags);
      this.renderTriageResult(triage);
      this.renderPacketPreview(day, data, triage);
      this.renderEmergencySection(triage);
    },

    renderFlags(flags) {
      const container = document.getElementById('act-flags-list');
      if (!container) return;

      if (flags.length === 0) {
        container.innerHTML = `
          <div class="empty-flags-box" style="padding: 10px; background: #07121B; border-radius: 2px;">
            <span class="shape-circle" title="Nominal"></span>
            <span style="font-size: 13px; color: #B5C5C4; margin-left: 6px;">No active alerts. All vital parameters within calibrated ±1σ bounds.</span>
          </div>
        `;
        return;
      }

      let html = '';
      flags.forEach(f => {
        const isAlarm = f.severity === 'alarm';
        const shapeClass = isAlarm ? 'shape-octagon' : 'shape-triangle';
        html += `
          <div class="flag-item flag-${f.severity}">
            <span class="${shapeClass}" title="${f.severity.toUpperCase()}"></span>
            <div class="flag-content">
              <strong>${f.id.replace(/_/g, ' ')}</strong>
              <p>${f.message}</p>
            </div>
            <span class="status-badge status-${f.severity}">${f.severity.toUpperCase()}</span>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderTriageResult(triage) {
      const levelEl = document.getElementById('triage-level-badge');
      const roleTitle = document.getElementById('triage-role-title');
      const rationaleEl = document.getElementById('triage-rationale-text');
      const actionEl = document.getElementById('triage-proposed-action');
      const roundTripEl = document.getElementById('triage-roundtrip-val');

      const roundTripMins = ((triage.commDelaySeconds * 2) / 60).toFixed(1);
      if (roundTripEl) roundTripEl.textContent = `${roundTripMins} min round-trip (source pending)`;

      const levelNames = {
        SELF_TREAT: 'Self-Treat (Crew Autonomous Protocol)',
        CREW_MEDICAL_OFFICER: 'Crew Medical Officer (CMO In-Flight Intervention)',
        FLIGHT_SURGEON: 'Flight Surgeon (Mission Control Ground Guidance)'
      };

      if (roleTitle) roleTitle.textContent = levelNames[triage.triageLevel] || triage.triageLevel;
      if (rationaleEl) rationaleEl.textContent = triage.rationale;
      if (actionEl) actionEl.textContent = triage.proposedAction;

      if (levelEl) {
        levelEl.textContent = triage.triageLevel.replace(/_/g, ' ');
        levelEl.className = `status-badge ${triage.triageLevel === 'SELF_TREAT' ? 'status-nominal' : (triage.triageLevel === 'CREW_MEDICAL_OFFICER' ? 'status-caution' : 'status-alarm')}`;
      }
    },

    renderPacketPreview(day, data, triage) {
      if (!window.PacketEngine) return;
      currentPacket = window.PacketEngine.buildPacket(day, data, triage);

      const idEl = document.getElementById('packet-id');
      const timeEl = document.getElementById('packet-timestamp');
      const dataEl = document.getElementById('packet-data-summary');
      const trendEl = document.getElementById('packet-trend');
      const actionEl = document.getElementById('packet-action');
      const statusBadge = document.getElementById('packet-status-badge');

      if (idEl) idEl.textContent = currentPacket.packetId;
      if (timeEl) timeEl.textContent = currentPacket.timestamp;
      if (dataEl) dataEl.textContent = currentPacket.dataSummary;
      if (trendEl) trendEl.textContent = currentPacket.trendAnalysis;
      if (actionEl) actionEl.textContent = currentPacket.proposedAction;

      if (statusBadge) {
        statusBadge.textContent = currentPacket.status;
        statusBadge.className = 'status-badge status-nominal';
      }
    },

    handleSendPacket() {
      if (!currentPacket || !window.PacketEngine) return;

      const btn = document.getElementById('btn-send-packet');
      const statusBadge = document.getElementById('packet-status-badge');
      const transmissionProgressBox = document.getElementById('packet-transmission-progress');
      const countdownEl = document.getElementById('packet-countdown-num');
      const transitTrackMarker = document.getElementById('packet-ship-tracer');

      if (transmissionTimer) clearInterval(transmissionTimer);

      btn.disabled = true;
      btn.textContent = 'Transmitting packet...';
      if (statusBadge) {
        statusBadge.textContent = 'TRANSMITTING';
        statusBadge.className = 'status-badge status-caution';
      }
      if (transmissionProgressBox) transmissionProgressBox.style.display = 'block';

      transmissionTimer = window.PacketEngine.simulateTransmission(
        currentPacket,
        (pkt, remSec) => {
          if (countdownEl) {
            const m = Math.floor(remSec / 60);
            const s = remSec % 60;
            countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} remaining to Earth ground station`;
          }
          if (transitTrackMarker) {
            const frac = 1 - (remSec / pkt.oneWayDelaySeconds);
            transitTrackMarker.style.width = `${Math.min(100, Math.round(frac * 100))}%`;
          }
        },
        (pkt) => {
          btn.disabled = false;
          btn.textContent = 'Send packet';
          if (statusBadge) {
            statusBadge.textContent = 'ACKNOWLEDGED';
            statusBadge.className = 'status-badge status-nominal';
          }
          if (countdownEl) {
            countdownEl.textContent = 'Signal received & acknowledged by Flight Surgeon terminal (MCC-Houston).';
          }
          setTimeout(() => {
            if (transmissionProgressBox) transmissionProgressBox.style.display = 'none';
          }, 6000);
        }
      );
    },

    renderEmergencySection(triage) {
      const emergencyBox = document.getElementById('emergency-direct-card');
      if (!emergencyBox) return;

      const hasAlarm = triage.flags.some(f => f.severity === 'alarm');
      if (hasAlarm || triage.directGroundLinkRequired) {
        emergencyBox.classList.add('active-emergency');
      } else {
        emergencyBox.classList.remove('active-emergency');
      }
    },

    handleEmergencyTrigger() {
      alert("EMERGENCY DIRECT LINK TRIGGERED:\n\nStore-and-forward queue bypassed.\nDirect deep-space telemetry burst broadcast on Deep Space Network (DSN) Emergency Channel 4.\nFlight Surgeon console notified.");
    }
  };

  window.ActUI = ActUI;
})(window);
