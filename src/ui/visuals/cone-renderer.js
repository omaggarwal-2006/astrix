/**
 * LANDFALL - Flight-path cone renderer (src/ui/visuals/cone-renderer.js)
 * A projection from departure (100 % of baseline) to landing day:
 * upper edge = high estimate, centre line = middle estimate, lower edge = low estimate.
 * Dashed guides mark the GO (90 %) and NO-GO (80 %) levels.
 */

const COLORS = { nominal: '#45C2A2', caution: '#EDB14A', alarm: '#EE6458' };
const FILLS = { nominal: 'rgba(69,194,162,0.16)', caution: 'rgba(237,177,74,0.16)', alarm: 'rgba(238,100,88,0.2)' };
const FLOOR = 72;   // bottom of the vertical scale, in % (NO-GO at 80 stays visible)

export function renderTrajectoryCone(canvas, low, mid, high, status) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 90;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const accent = COLORS[status] || COLORS.nominal;
  const pad = 8;
  const startX = 6, endX = w - 64;
  const mapY = (val) => {
    const v = Math.max(FLOOR, Math.min(100, val));
    return pad + ((100 - v) / (100 - FLOOR)) * (h - pad * 2);
  };
  const startY = mapY(100);            // departure = 100 % of personal baseline

  // Guides: GO and NO-GO levels
  ctx.font = '10px "Hanken Grotesk", sans-serif';
  ctx.textAlign = 'left';
  [[90, 'GO 90'], [80, 'NO-GO 80']].forEach(([v, label]) => {
    const y = mapY(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(180,189,201,0.55)';
    ctx.fillText(label, endX + 6, y + 3);
  });

  // Cone
  const yHigh = mapY(high), yMid = mapY(mid), yLow = mapY(low);
  const grad = ctx.createLinearGradient(startX, 0, endX, 0);
  grad.addColorStop(0, 'rgba(108,180,228,0.05)');
  grad.addColorStop(1, FILLS[status] || FILLS.nominal);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, yHigh);
  ctx.lineTo(endX, yLow);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, yHigh); ctx.moveTo(startX, startY); ctx.lineTo(endX, yLow); ctx.stroke();

  // Middle estimate
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, yMid); ctx.stroke();

  // Departure and landing points
  ctx.fillStyle = '#6CB4E4';
  ctx.beginPath(); ctx.arc(startX + 2, startY, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(endX, yMid, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(6,9,17,0.9)'; ctx.lineWidth = 2; ctx.stroke();
}
