/**
 * LANDFALL - Tissue micro-lab canvas and scan reward (src/ui/extras/micro-lab.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../../app/state.js";

export const MICRO_DEFAULTS = { ared: 180, intensity: 100 };

export function showMicroReward() {
  const key = `${AppState.selectedRegion}:${AppState.selectedLayer}`;
  if (AppState.rewardedScans.has(key)) return;
  AppState.rewardedScans.add(key);

  const badge = document.getElementById('micro-xp-badge');
  if (badge) badge.style.display = 'inline-flex';
  AppState.completedScansCount = Math.min(5, AppState.completedScansCount + 1);
  AppState.updateTelemetryText();
}

export function drawMicroLabCanvas(layer, integPct) {
  const canvas = document.getElementById('micro-lab-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Deep cyber-physical space background
  ctx.fillStyle = '#03070d';
  ctx.fillRect(0, 0, w, h);

  const mid = w / 2;

  // Background radar/ultrasonic concentric arcs
  ctx.strokeStyle = 'rgba(70, 227, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let r = 30; r < w; r += 45) {
    ctx.beginPath();
    ctx.arc(mid, h / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Left half: Calibrated Healthy Baseline (Day 1 - Dense, ordered lattice)
  ctx.strokeStyle = 'rgba(62, 230, 168, 0.4)';
  ctx.lineWidth = 1.2;
  const leftNodes = [];
  for (let x = 24; x < mid - 24; x += 24) {
    for (let y = 24; y < h - 20; y += 22) {
      leftNodes.push({ x, y });
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Connect adjacent nodes with healthy structural struts
  ctx.strokeStyle = 'rgba(62, 230, 168, 0.2)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < leftNodes.length - 1; i++) {
    const p1 = leftNodes[i];
    const p2 = leftNodes[i + 1];
    if (Math.abs(p1.x - p2.x) <= 24 && Math.abs(p1.y - p2.y) <= 24) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // Right half: Current Transit Deconditioning State (Micro-fractures, thinned trabeculae)
  const lossRatio = Math.max(0, (100 - integPct) / 25);
  const toneColor = integPct < 90 ? 'rgba(255, 91, 79, ' : integPct < 95 ? 'rgba(255, 184, 77, ' : 'rgba(70, 227, 255, ';
  ctx.strokeStyle = toneColor + '0.5)';
  ctx.lineWidth = Math.max(0.6, 1.4 - lossRatio * 0.7);

  const rightNodes = [];
  // Use deterministic seed based on layer and integPct to prevent jitter
  let seed = Math.round(integPct * 10);
  const pseudoRandom = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  for (let x = mid + 24; x < w - 20; x += 26) {
    for (let y = 24; y < h - 20; y += 24) {
      if (pseudoRandom() > lossRatio * 0.38) {
        const dx = (pseudoRandom() * 6 - 3) * (lossRatio + 0.2);
        const dy = (pseudoRandom() * 6 - 3) * (lossRatio + 0.2);
        const nx = x + dx;
        const ny = y + dy;
        rightNodes.push({ x: nx, y: ny });
        ctx.beginPath();
        ctx.arc(nx, ny, Math.max(1.8, 4.5 - lossRatio * 2.2), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Struts on right half with micro-voids
  ctx.strokeStyle = toneColor + '0.22)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < rightNodes.length - 1; i++) {
    const p1 = rightNodes[i];
    const p2 = rightNodes[i + 1];
    if (Math.abs(p1.x - p2.x) <= 28 && Math.abs(p1.y - p2.y) <= 28) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // Center comparison beam with glow
  ctx.strokeStyle = 'rgba(70, 227, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mid, 0);
  ctx.lineTo(mid, h);
  ctx.stroke();

  // Reticle indicators on center beam
  ctx.fillStyle = '#46e3ff';
  ctx.fillRect(mid - 3, h / 2 - 1, 6, 2);
  ctx.fillRect(mid - 3, 28, 6, 2);
  ctx.fillRect(mid - 3, h - 30, 6, 2);

  // Tactical HUD Headers
  ctx.fillStyle = '#3ee6a8';
  ctx.font = '10px monospace';
  ctx.fillText('DAY 001 · 100% NOMINAL', 20, 18);

  ctx.fillStyle = integPct < 90 ? '#ff5b4f' : integPct < 95 ? '#ffb84d' : '#46e3ff';
  ctx.fillText(`TRANSIT · ${integPct.toFixed(1)}% INTEGRITY`, mid + 16, 18);

  // Sub-beam label
  ctx.fillStyle = 'rgba(163, 188, 203, 0.7)';
  ctx.font = '9px monospace';
  ctx.fillText('SHEAR ELASTOGRAPHY PROBE', mid - 68, h - 10);
}
