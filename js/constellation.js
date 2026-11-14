/**
 * LANDFALL - The Health Constellation (js/constellation.js)
 * Replaces generic radar chart with an astronomical constellation:
 * 1. Personal baseline reference ring (1.0)
 * 2. 6 stars (one per forecast dimension) joined by fine constellation lines
 * 3. Stars displace inward/outward with baseline drift
 * 4. Multi-modal status cues: color AND geometric shape (Circle=nominal, Triangle=caution, Diamond=alarm)
 * 5. Text word label beside every node
 */

export class HealthConstellation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.dpr = window.devicePixelRatio || 1;
    this.data = [];
    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : 500;
    this.height = 360;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this.draw();
  }

  setData(forecastList) {
    this.data = forecastList || [];
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.data || this.data.length === 0) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const baseRadius = Math.min(centerX, centerY) - 70;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Baseline Ring (1.0)
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#243044';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Baseline label
    ctx.font = '12px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#9FAAA8';
    ctx.textAlign = 'center';
    ctx.fillText('Personal baseline (1.0)', centerX, centerY + baseRadius + 18);

    // 2. Compute Star Positions
    const numPoints = this.data.length;
    const angleStep = (Math.PI * 2) / numPoints;
    const starCoords = [];

    this.data.forEach((dim, idx) => {
      const angle = idx * angleStep - Math.PI / 2;
      // Drift ratio: 100% mid = 1.0 radius. Lower moves inward.
      const ratio = dim.landing.mid / 100;
      // Map ratio 0.6 - 1.2 to radial distance
      const r = baseRadius * ratio;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      starCoords.push({ x, y, dim, angle });
    });

    // 3. Connect Constellation Lines
    ctx.beginPath();
    starCoords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(95, 168, 211, 0.45)'; // Earthlight faint line
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(95, 168, 211, 0.05)';
    ctx.fill();

    // 4. Draw Radial Spoke Guides
    starCoords.forEach((pt) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(pt.angle) * (baseRadius + 15), centerY + Math.sin(pt.angle) * (baseRadius + 15));
      ctx.strokeStyle = 'rgba(36, 48, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 5. Draw Constellation Stars & Glyphs
    starCoords.forEach(pt => {
      const status = pt.dim.status; // 'nominal', 'caution', 'alarm'
      let color = '#3FB59A';
      if (status === 'caution') color = '#E8A93A';
      if (status === 'alarm') color = '#E5594F';

      // Draw Multi-Modal Shape: Circle=Nominal, Triangle=Caution, Diamond=Alarm
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#05070D';
      ctx.lineWidth = 1.5;

      if (status === 'nominal') {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (status === 'caution') {
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(6, 6);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Diamond for alarm
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Dimension Label & Value
      const labelDist = baseRadius + 32;
      const lx = centerX + Math.cos(pt.angle) * labelDist;
      const ly = centerY + Math.sin(pt.angle) * labelDist;

      ctx.font = '14px "Saira Semi Condensed", sans-serif';
      ctx.fillStyle = '#E8E4D8';
      ctx.textAlign = Math.cos(pt.angle) > 0.3 ? 'left' : (Math.cos(pt.angle) < -0.3 ? 'right' : 'center');
      ctx.fillText(`${pt.dim.dimension}`, lx, ly - 4);

      ctx.font = '13px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(`${pt.dim.landing.mid}% (${status})`, lx, ly + 14);
    });
  }
}
