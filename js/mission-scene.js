/**
 * LANDFALL - The Mission Scene (js/mission-scene.js)
 * Concept: "The View From The Ship"
 * Shared Header on Every Tab (~240px canvas) featuring:
 * 1. 3-Layer Starfield with subtle parallax drift
 * 2. Earth (left) shrinking & Mars (right) growing as day advances (1 to 180)
 * 3. Curved Hohmann transit arc with Ship marker & Day-40 "Sleep collapse" marker
 * 4. Interplanetary speed-of-light comm delay calculation
 * 5. Telemetry packet flight animation driven by queue.js (QUEUED / TRANSMITTED / ACKNOWLEDGED / FAILED)
 * 6. 60 FPS cap, visibility-pause, and prefers-reduced-motion static rendering
 */

import { getQueue, config as queueConfig } from "../queue.js";

export class MissionScene {
  constructor(canvasId, sliderId, onDayChange) {
    this.canvas = document.getElementById(canvasId);
    this.slider = document.getElementById(sliderId);
    this.onDayChange = onDayChange;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.currentDay = 40;
    this.maxDays = 180;
    this.width = 0;
    this.height = 240;
    this.dpr = window.devicePixelRatio || 1;

    // 3-layer starfield
    this.stars = [];
    this.numStars = 150;
    this.lastFrameTime = 0;
    this.animFrameId = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.pulsePhase = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // Slider interaction
    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.setDay(parseInt(e.target.value, 10), true);
      });
    }

    // Canvas click along arc to scrub day
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const frac = Math.max(0, Math.min(1, (clickX - 60) / (this.width - 120)));
      const day = Math.round(1 + frac * 179);
      this.setDay(day, true);
    });

    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : 800;
    this.height = 240;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    if (this.ctx) {
      this.ctx.resetTransform();
      this.ctx.scale(this.dpr, this.dpr);
    }
    this.generateStarfield();
    this.draw();
  }

  generateStarfield() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * (this.width || 1000),
        y: Math.random() * this.height,
        radius: Math.random() * 1.3 + 0.35,
        layer: Math.floor(Math.random() * 3), // 0: distant, 1: mid, 2: near
        brightness: Math.random() * 0.7 + 0.3
      });
    }
  }

  setDay(day, triggerCallback = false) {
    this.currentDay = Math.max(1, Math.min(this.maxDays, parseInt(day, 10)));
    if (this.slider && parseInt(this.slider.value, 10) !== this.currentDay) {
      this.slider.value = this.currentDay;
    }
    if (triggerCallback && typeof this.onDayChange === 'function') {
      this.onDayChange(this.currentDay);
    }
    this.draw();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    } else {
      this.startLoop();
    }
  }

  startLoop() {
    if (this.prefersReducedMotion) {
      this.draw();
      return;
    }

    const loop = (timestamp) => {
      // 60 FPS cap
      if (timestamp - this.lastFrameTime >= 16) {
        this.pulsePhase += 0.035;
        this.draw();
        this.lastFrameTime = timestamp;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  // Hohmann transfer trajectory: Earth (left) to Mars (right)
  getArcPoint(t) {
    const p0 = { x: 75, y: 145 }; // Earth anchor
    const cp = { x: this.width * 0.5, y: 48 }; // Arc crest
    const p1 = { x: this.width - 75, y: 145 }; // Mars anchor

    const inv = 1 - t;
    const x = inv * inv * p0.x + 2 * inv * t * cp.x + t * t * p1.x;
    const y = inv * inv * p0.y + 2 * inv * t * cp.y + t * t * p1.y;
    return { x, y };
  }

  getCommDelaySeconds(day) {
    // Interplanetary one-way light time: Day 1: ~1.3 s (Moon-range) to Day 35: 147 s (2m 27s) to Day 180: ~750 s (12.5 min)
    return Math.round(1.3 + (day / 180) * 750);
  }

  formatDelay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} min ${s} s`;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const day = this.currentDay;
    const t = (day - 1) / 179;

    // Clear background: Deep Space Void #05070D
    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, w, h);

    // 1. Draw 3-Layer Starfield with Parallax Drift
    const parallaxOffset = (t - 0.5) * 50;
    this.stars.forEach(s => {
      const speed = s.layer === 0 ? 0.2 : (s.layer === 1 ? 0.5 : 1.0);
      const curX = (s.x - parallaxOffset * speed + w) % w;
      ctx.fillStyle = `rgba(232, 228, 216, ${s.brightness})`;
      ctx.beginPath();
      ctx.arc(curX, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Hohmann Transfer Orbit Arc
    ctx.beginPath();
    const startPt = this.getArcPoint(0);
    ctx.moveTo(startPt.x, startPt.y);
    for (let step = 0; step <= 60; step++) {
      const pt = this.getArcPoint(step / 60);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = '#243044';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trajectory Progress Trace (Earth to Ship)
    ctx.beginPath();
    ctx.moveTo(startPt.x, startPt.y);
    const shipSteps = Math.round(t * 60);
    for (let s = 0; s <= shipSteps; s++) {
      const pt = this.getArcPoint(Math.min(t, s / 60));
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = 'rgba(63, 181, 154, 0.5)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 3. Day 40 Event Marker ("Sleep collapse")
    const d40Pt = this.getArcPoint(39 / 179);
    ctx.fillStyle = '#E8A93A';
    ctx.beginPath();
    ctx.arc(d40Pt.x, d40Pt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '14px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8A93A';
    ctx.textAlign = 'center';
    ctx.fillText('Day 40: Sleep collapse', d40Pt.x, d40Pt.y - 14);
    ctx.strokeStyle = '#E8A93A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(d40Pt.x, d40Pt.y - 9);
    ctx.lineTo(d40Pt.x, d40Pt.y - 3);
    ctx.stroke();

    // 4. Earth (Left) - Shrinks as ship departs (30px down to 9px)
    const rEarth = Math.round(30 - t * 21);
    const earthPt = this.getArcPoint(0);

    // Earth atmosphere aura
    ctx.beginPath();
    ctx.arc(earthPt.x, earthPt.y, rEarth + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(95, 168, 211, 0.22)';
    ctx.fill();

    // Earth disc (#5FA8D3 Earthlight)
    ctx.beginPath();
    ctx.arc(earthPt.x, earthPt.y, rEarth, 0, Math.PI * 2);
    ctx.fillStyle = '#5FA8D3';
    ctx.fill();

    // Earth text
    ctx.font = '15px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8E4D8';
    ctx.textAlign = 'left';
    ctx.fillText('Earth', earthPt.x - 22, earthPt.y + rEarth + 18);

    // Live delay readout beside Earth
    const delaySec = this.getCommDelaySeconds(day);
    ctx.font = '14px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#9FAAA8';
    ctx.fillText(`Earth is ${this.formatDelay(delaySec)} away`, earthPt.x - 22, earthPt.y + rEarth + 36);
    ctx.font = '12px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#E8A93A';
    ctx.fillText('(source pending)', earthPt.x - 22, earthPt.y + rEarth + 52);

    // 5. Mars (Right) - Grows as ship arrives (9px up to 32px)
    const rMars = Math.round(9 + t * 23);
    const marsPt = this.getArcPoint(1);

    // Mars disc (#C4623A Mars Rust)
    ctx.beginPath();
    ctx.arc(marsPt.x, marsPt.y, rMars, 0, Math.PI * 2);
    ctx.fillStyle = '#C4623A';
    ctx.fill();

    // Polar ice cap hint
    ctx.beginPath();
    ctx.arc(marsPt.x, marsPt.y - rMars * 0.7, rMars * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232, 228, 216, 0.65)';
    ctx.fill();

    ctx.font = '15px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8E4D8';
    ctx.textAlign = 'right';
    ctx.fillText('Mars', marsPt.x + 12, marsPt.y + rMars + 18);

    const daysRemaining = this.maxDays - day;
    ctx.font = '14px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#9FAAA8';
    ctx.fillText(`${daysRemaining} days to landing`, marsPt.x + 12, marsPt.y + rMars + 36);

    // 6. Signal Carrier Pulse Traveling Between Ship and Earth
    const shipPt = this.getArcPoint(t);
    const pulseT = (this.pulsePhase % 2) / 2;
    const pulseArcT = Math.max(0, t * (1 - pulseT));
    const pulsePt = this.getArcPoint(pulseArcT);

    ctx.beginPath();
    ctx.arc(pulsePt.x, pulsePt.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(95, 168, 211, 0.75)';
    ctx.fill();

    // 7. Active Telemetry Packet Flight (driven by queue.js)
    this.drawPacketFlight(ctx, t, shipPt, earthPt);

    // 8. The Ship Marker (Sits on the Hohmann Arc)
    this.drawShip(ctx, shipPt.x, shipPt.y);
  }

  drawShip(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Hull surround glow
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 17, 27, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#3FB59A';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Ship shape (sleek transit vessel pointing toward Mars)
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fillStyle = '#E8E4D8';
    ctx.fill();

    ctx.restore();
  }

  drawPacketFlight(ctx, shipT, shipPt, earthPt) {
    const queue = getQueue();
    if (!queue || queue.length === 0) return;

    // Find latest active packet entry
    const activeEntry = queue[queue.length - 1];
    const status = activeEntry.packet.status;

    if (status === 'QUEUED') {
      // Beacon waiting at ship
      ctx.beginPath();
      ctx.arc(shipPt.x, shipPt.y - 18, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#5FA8D3';
      ctx.fill();
      ctx.font = '13px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#5FA8D3';
      ctx.textAlign = 'center';
      ctx.fillText('Packet queued at ship', shipPt.x, shipPt.y - 24);
    } else if (status === 'TRANSMITTED') {
      // Packet actively traveling from ship to Earth along Hohmann arc
      const travelFrac = (this.pulsePhase * 0.4) % 1.0;
      const packetArcT = shipT * (1 - travelFrac);
      const packetPt = this.getArcPoint(packetArcT);

      ctx.beginPath();
      ctx.arc(packetPt.x, packetPt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#E8A93A';
      ctx.fill();

      ctx.font = '13px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#E8A93A';
      ctx.textAlign = 'center';
      ctx.fillText('Packet downlink in flight \u2192 Earth', packetPt.x, packetPt.y - 12);
    } else if (status === 'ACKNOWLEDGED') {
      // Reply signal returning to ship
      const returnFrac = (this.pulsePhase * 0.4) % 1.0;
      const replyArcT = shipT * returnFrac;
      const replyPt = this.getArcPoint(replyArcT);

      ctx.beginPath();
      ctx.arc(replyPt.x, replyPt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3FB59A';
      ctx.fill();

      ctx.font = '13px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#3FB59A';
      ctx.textAlign = 'center';
      ctx.fillText('Ground ACK uplink returned', replyPt.x, replyPt.y - 12);
    } else if (status === 'FAILED') {
      // Red flicker at ship with retry hint
      const flicker = Math.sin(this.pulsePhase * 8) > 0 ? 1 : 0.3;
      ctx.beginPath();
      ctx.arc(shipPt.x, shipPt.y - 18, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(229, 89, 79, ${flicker})`;
      ctx.fill();
      ctx.font = '13px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#E5594F';
      ctx.textAlign = 'center';
      ctx.fillText('Downlink lost (auto-retrying)', shipPt.x, shipPt.y - 24);
    }
  }
}
