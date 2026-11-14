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

  // Deep void background
  ctx.fillStyle = '#030509';
  ctx.fillRect(0, 0, w, h);

  const mid = w / 2;

  // Left half: Calibrated Healthy Baseline (Day 1)
  ctx.strokeStyle = 'rgba(63, 181, 154, 0.45)';
  ctx.lineWidth = 1.4;
  for (let x = 20; x < mid - 20; x += 22) {
    for (let y = 20; y < h - 20; y += 22) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18, y + 8);
      ctx.stroke();
    }
  }

  // Right half: Current Transit Deconditioning State
  const lossRatio = Math.max(0, (100 - integPct) / 25);
  ctx.strokeStyle = integPct < 92 ? 'rgba(229, 89, 79, 0.5)' : 'rgba(232, 169, 58, 0.5)';
  ctx.lineWidth = Math.max(0.6, 1.4 - lossRatio * 0.7);
  for (let x = mid + 20; x < w - 20; x += 26) {
    for (let y = 20; y < h - 20; y += 26) {
      if (Math.random() > lossRatio * 0.35) {
        ctx.beginPath();
        ctx.arc(x + (Math.random() * 4 - 2), y + (Math.random() * 4 - 2), Math.max(2, 5 - lossRatio * 2.5), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Center comparison beam
  ctx.strokeStyle = '#5FA8D3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mid, 0);
  ctx.lineTo(mid, h);
  ctx.stroke();

  // Beam label
  ctx.fillStyle = '#E8E4D8';
  ctx.font = '11px sans-serif';
  ctx.fillText('COMPARISON BEAM', mid - 52, 16);
}
