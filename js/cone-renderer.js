/**
 * LANDFALL - Flight-Path Cone Renderer (js/cone-renderer.js)
 * Draws physiological projections as widening trajectory cones:
 * - Upper edge = High estimate
 * - Center line = Mid landing projection
 * - Lower edge = Low estimate
 * Reshapes live in response to the What-If adherence slider.
 */

export function renderTrajectoryCone(canvas, low, mid, high, status) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 80;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Status color
  let accentColor = '#3FB59A';
  if (status === 'caution') accentColor = '#E8A93A';
  if (status === 'alarm') accentColor = '#E5594F';

  const startX = 30;
  const startY = h / 2; // Departure baseline
  const endX = w - 40;

  // Map 60% - 100% to Y height (100% is near top, 60% is near bottom)
  const mapY = (val) => {
    const clamped = Math.max(60, Math.min(100, val));
    return h - 15 - ((clamped - 60) / 40) * (h - 30);
  };

  const endHighY = mapY(high);
  const endMidY = mapY(mid);
  const endLowY = mapY(low);

  // 1. Draw Cone Area (Widening Confidence Interval)
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endHighY);
  ctx.lineTo(endX, endLowY);
  ctx.closePath();

  ctx.fillStyle = status === 'nominal' ? 'rgba(63, 181, 154, 0.15)' : (status === 'caution' ? 'rgba(232, 169, 58, 0.15)' : 'rgba(229, 89, 79, 0.18)');
  ctx.fill();

  // Cone edges
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endHighY);
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endLowY);
  ctx.strokeStyle = '#243044';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Draw Midpoint Trajectory Centerline
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endMidY);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. Waypoint Points
  // Departure start
  ctx.beginPath();
  ctx.arc(startX, startY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#5FA8D3';
  ctx.fill();

  // Landing day arrival
  ctx.beginPath();
  ctx.arc(endX, endMidY, 5, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  // 4. Endpoint Readout Annotation
  ctx.font = '13px "Saira Semi Condensed", sans-serif';
  ctx.fillStyle = '#E8E4D8';
  ctx.textAlign = 'left';
  ctx.fillText(`${mid}%`, endX + 8, endMidY + 4);
}
