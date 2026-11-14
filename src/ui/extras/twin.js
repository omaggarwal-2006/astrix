/**
 * LANDFALL - Digital twin: levels 1-3, breadcrumbs, regions, tissue cards (src/ui/extras/twin.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { activateTab } from "../../app/router.js";
import { AppState } from "../../app/state.js";
import { getAlerts, getReadings } from "../../core/adapter.js";
import { MICRO_DEFAULTS, showMicroReward, drawMicroLabCanvas } from "./micro-lab.js";
import { BODY_REGIONS, TISSUE_LAYERS, getRegionIntegrity, getTissueIntegrity } from "./twin-model.js";

// -------------------------------------------------------------
// 4-LEVEL KINEMATIC DIGITAL TWIN ENGINE (Levels 1-3 + controls)
// -------------------------------------------------------------
export function initTwinControls() {
  // Breadcrumb navigation clicks
  const c0 = document.getElementById('crumb-level-0');
  const c1 = document.getElementById('crumb-level-1');
  const c2 = document.getElementById('crumb-level-2');
  const c3 = document.getElementById('crumb-level-3');
  const btnZoomOut = document.getElementById('btn-twin-zoom-out');

  if (c0) c0.addEventListener('click', () => {
    window.location.hash = 'overview';
    activateTab('today');
  });
  if (c1) c1.addEventListener('click', () => {
    AppState.twinLevel = 1;
    renderTwin();
  });
  if (c2) c2.addEventListener('click', () => {
    AppState.twinLevel = 2;
    renderTwin();
  });
  if (c3) c3.addEventListener('click', () => {
    AppState.twinLevel = 3;
    renderTwin();
  });
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (AppState.twinLevel > 1) {
        AppState.twinLevel--;
        renderTwin();
      }
    });
  }

  // Front/Back orientation toggle
  const btnOrient = document.getElementById('btn-toggle-orientation');
  if (btnOrient) {
    btnOrient.addEventListener('click', () => {
      AppState.twinOrientation = AppState.twinOrientation === 'front' ? 'back' : 'front';
      btnOrient.textContent = AppState.twinOrientation === 'front' ? 'Rotate: Front' : 'Rotate: Back';
      renderTwin();
    });
  }

  // Zoom to Level 2 button in region detail card
  const btnL2 = document.getElementById('btn-zoom-level2');
  if (btnL2) {
    btnL2.addEventListener('click', () => {
      AppState.twinLevel = 2;
      renderTwin();
    });
  }

  // Bind 11 SVG region clicks and keyboard focus
  BODY_REGIONS.forEach(reg => {
    const el = document.getElementById('reg-' + reg.id);
    if (el && !el.dataset.bound) {
      el.dataset.bound = "true";
      const select = () => {
        AppState.selectedRegion = reg.id;
        renderTwin();
      };
      el.addEventListener('click', select);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
    }
  });

  // Level 3 Micro-Lab interactive sliders
  const ctrl1 = document.getElementById('micro-ctrl-1-input');
  const val1 = document.getElementById('micro-ctrl-1-val');
  const ctrl2 = document.getElementById('micro-ctrl-2-input');
  const val2 = document.getElementById('micro-ctrl-2-val');

  // Slider values feed whatIf.targetedRegionBoost for the selected region,
  // which getRegionIntegrity() uses as extra countermeasure mitigation.
  const onMicroInput = () => {
    if (!ctrl1 || !ctrl2) return;
    const ared = parseFloat(ctrl1.value);
    const intensity = parseFloat(ctrl2.value);
    if (val1) val1.textContent = `${ared} kg`;
    if (val2) val2.textContent = `${intensity}%`;

    AppState.microLabSettings[AppState.selectedRegion] = { ared, intensity };
    // 0 at the default 180 kg / 100%; roughly -2 to +2 across the slider ranges
    const boost = (ared - MICRO_DEFAULTS.ared) / 70 + (intensity - MICRO_DEFAULTS.intensity) / 50;
    AppState.whatIf.targetedRegionBoost[AppState.selectedRegion] = +boost.toFixed(2);

    renderTwin();
    AppState.updateTelemetryText();
  };

  [ctrl1, ctrl2].forEach(ctrl => {
    if (!ctrl) return;
    ctrl.addEventListener('input', onMicroInput);
    // Award the scan reward once per region + layer, when the user releases the slider
    ctrl.addEventListener('change', showMicroReward);
  });
}

export function renderTwin(readings, alerts) {
  readings = readings || getReadings(AppState.currentDay);
  alerts = alerts || getAlerts(AppState.currentDay);

  const regInfo = BODY_REGIONS.find(r => r.id === AppState.selectedRegion) || BODY_REGIONS[0];
  const integ = getRegionIntegrity(regInfo.id, AppState.currentDay, AppState.whatIf);

  const l1Cont = document.getElementById('twin-level1-container');
  const l2Cont = document.getElementById('twin-level2-container');
  const l3Cont = document.getElementById('twin-level3-container');

  const c1 = document.getElementById('crumb-level-1');
  const c2 = document.getElementById('crumb-level-2');
  const c3 = document.getElementById('crumb-level-3');
  const sep2 = document.getElementById('crumb-sep-2');
  const sep3 = document.getElementById('crumb-sep-3');

  if (AppState.twinLevel === 1) {
    if (l1Cont) l1Cont.style.display = 'block';
    if (l2Cont) l2Cont.style.display = 'none';
    if (l3Cont) l3Cont.style.display = 'none';

    if (c1) c1.className = 'twin-crumb-btn active';
    if (c2) { c2.style.display = 'none'; c2.className = 'twin-crumb-btn'; }
    if (c3) { c3.style.display = 'none'; c3.className = 'twin-crumb-btn'; }
    if (sep2) sep2.style.display = 'none';
    if (sep3) sep3.style.display = 'none';

    // Heartbeat pulse rate keyed to live resting HR
    const hr = readings.vitals.hr_bpm || 64;
    const pulseDuration = (60 / hr).toFixed(2);
    const heartElem = document.getElementById('twin-heart-group');
    if (heartElem) {
      heartElem.style.animationDuration = `${pulseDuration}s`;
    }

    // Update 11 regions visual status
    BODY_REGIONS.forEach(reg => {
      const el = document.getElementById('reg-' + reg.id);
      if (!el) return;
      const rInteg = getRegionIntegrity(reg.id, AppState.currentDay, AppState.whatIf);
      if (rInteg.status === 'alarm') {
        el.style.fill = 'rgba(229, 89, 79, 0.28)';
        el.style.stroke = '#E5594F';
      } else if (rInteg.status === 'caution') {
        el.style.fill = 'rgba(232, 169, 58, 0.25)';
        el.style.stroke = '#E8A93A';
      } else {
        el.style.fill = 'rgba(63, 181, 154, 0.18)';
        el.style.stroke = '#3FB59A';
      }

      if (reg.id === AppState.selectedRegion) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    // Region detail card
    const dTitle = document.getElementById('twin-detail-title');
    const dSys = document.getElementById('twin-detail-systems');
    const dBadge = document.getElementById('twin-detail-badge');
    const dText = document.getElementById('twin-detail-integ-text');
    const dBar = document.getElementById('twin-detail-bar');
    const dNote = document.getElementById('twin-detail-status-note');

    if (dTitle) dTitle.textContent = regInfo.name;
    if (dSys) dSys.textContent = regInfo.systems;
    if (dBadge) {
      const shapeClass = integ.shape === 'diamond' ? 'shape-diamond' : integ.shape === 'triangle' ? 'shape-triangle' : 'shape-circle';
      dBadge.className = `status-badge status-${integ.status}`;
      dBadge.innerHTML = `<span class="${shapeClass}"></span> ${integ.word}`;
    }
    if (dText) {
      dText.innerHTML = `<strong>${integ.currentPct}%</strong> vs ${integ.baselinePct}% baseline (\u2212${integ.lossPct}%)`;
    }
    if (dBar) {
      dBar.style.width = `${integ.currentPct}%`;
      dBar.className = `twin-dual-bar-fill ${integ.status}`;
    }
    if (dNote) {
      dNote.textContent = integ.status === 'alarm'
        ? 'Critical physiological drift detected relative to personal baseline.'
        : integ.status === 'caution'
        ? 'Moderate spaceflight adaptation drift observed.'
        : 'Nominal physiological retention relative to calibrated baseline.';
    }
  } else if (AppState.twinLevel === 2) {
    if (l1Cont) l1Cont.style.display = 'none';
    if (l2Cont) l2Cont.style.display = 'block';
    if (l3Cont) l3Cont.style.display = 'none';

    if (c1) c1.className = 'twin-crumb-btn';
    if (c2) {
      c2.style.display = 'inline';
      c2.textContent = regInfo.name;
      c2.className = 'twin-crumb-btn active';
    }
    if (sep2) sep2.style.display = 'inline';
    if (c3) { c3.style.display = 'none'; c3.className = 'twin-crumb-btn'; }
    if (sep3) sep3.style.display = 'none';

    const l2Title = document.getElementById('twin-level2-title');
    if (l2Title) l2Title.textContent = `Tissue Micro-Architecture \u2022 ${regInfo.name}`;

    const grid = document.getElementById('twin-tissue-grid');
    if (grid) {
      let html = '';
      TISSUE_LAYERS.forEach(layer => {
        const t = getTissueIntegrity(regInfo.id, layer, AppState.currentDay, AppState.whatIf);
        const shapeClass = t.shape === 'diamond' ? 'shape-diamond' : t.shape === 'triangle' ? 'shape-triangle' : 'shape-circle';
        html += `
          <div class="twin-tissue-card">
            <div>
              <div class="twin-tissue-header">
                <span class="twin-tissue-name">${layer}</span>
                <span class="status-badge status-${t.status}">
                  <span class="${shapeClass}"></span> ${t.word}
                </span>
              </div>
              <div class="twin-tissue-metric" style="color: ${t.status === 'alarm' ? 'var(--alarm-coral)' : t.status === 'caution' ? 'var(--signal-amber)' : 'var(--nominal-teal)'};">
                ${t.currentPct}% <span style="font-size: 13px; color: var(--starlight-dim); font-weight: normal;">(vs 100.0% baseline)</span>
              </div>
              <p class="twin-tissue-mech">${t.mechanism}</p>
            </div>
            <button class="chassis-btn primary btn-deep-scan" data-layer="${layer}" style="font-size: 13px; width: 100%;">
              Deep scan micro-lab \u2192
            </button>
          </div>
        `;
      });
      grid.innerHTML = html;

      grid.querySelectorAll('.btn-deep-scan').forEach(btn => {
        btn.addEventListener('click', () => {
          AppState.selectedLayer = btn.getAttribute('data-layer') || 'BONE';
          AppState.twinLevel = 3;
          renderTwin();
        });
      });
    }
  } else if (AppState.twinLevel === 3) {
    if (l1Cont) l1Cont.style.display = 'none';
    if (l2Cont) l2Cont.style.display = 'none';
    if (l3Cont) l3Cont.style.display = 'block';

    if (c1) c1.className = 'twin-crumb-btn';
    if (c2) {
      c2.style.display = 'inline';
      c2.textContent = regInfo.name;
      c2.className = 'twin-crumb-btn';
    }
    if (sep2) sep2.style.display = 'inline';
    if (c3) {
      c3.style.display = 'inline';
      c3.textContent = `${AppState.selectedLayer} Micro-Lab`;
      c3.className = 'twin-crumb-btn active';
    }
    if (sep3) sep3.style.display = 'inline';

    const t = getTissueIntegrity(regInfo.id, AppState.selectedLayer, AppState.currentDay, AppState.whatIf);
    const mTitle = document.getElementById('micro-lab-title');
    const mSub = document.getElementById('micro-lab-subtitle');
    const mProc = document.getElementById('micro-procedure-text');
    const mEsc = document.getElementById('micro-escalation-text');

    if (mTitle) mTitle.textContent = `${AppState.selectedLayer} Micro-Architecture \u2022 ${regInfo.name}`;
    if (mSub) mSub.textContent = `High-resolution cellular simulation vs Day 1 calibrated baseline`;
    if (mProc) mProc.textContent = t.procedure;
    if (mEsc) mEsc.textContent = t.escalation;

    // Show this region's saved micro-lab settings
    const settings = AppState.microLabSettings[regInfo.id] || MICRO_DEFAULTS;
    const ctrl1 = document.getElementById('micro-ctrl-1-input');
    const ctrl2 = document.getElementById('micro-ctrl-2-input');
    const val1 = document.getElementById('micro-ctrl-1-val');
    const val2 = document.getElementById('micro-ctrl-2-val');
    if (ctrl1) ctrl1.value = settings.ared;
    if (ctrl2) ctrl2.value = settings.intensity;
    if (val1) val1.textContent = `${settings.ared} kg`;
    if (val2) val2.textContent = `${settings.intensity}%`;

    drawMicroLabCanvas(AppState.selectedLayer, t.currentPct);
  }
}
