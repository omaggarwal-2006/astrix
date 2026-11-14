/**
 * LANDFALL - The Mission Scene (js/mission-scene.js)
 * Concept: "The View From The Ship"
 * Full-width top canvas (~220px) featuring:
 * 1. 3-Layer Starfield with subtle parallax drift
 * 2. Earth (left) shrinking & Mars (right) growing as day advances
 * 3. Curved Hohmann transit arc with Ship marker & Day-40 "Sleep collapse" marker
 * 4. Speed-of-light comm delay readout & telemetry packet flight animation
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
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;

    // 3-layer starfield
    this.stars = [];
    this.numStars = 140;
    this.lastFrameTime = 0;
    this.animFrameId = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.pulsePhase = 0;

    // Signal packet flight
    this.packetTravelFraction = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // Generate stars
    this.generateStarfield();

    // Slider interaction
    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.setDay(parseInt(e.target.value, 10), true);
      });
    }

    // Canvas click/drag along arc to scrub day
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
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : window.innerWidth;
    this.height = 220;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this.generateStarfield();
    this.draw();
  }

  generateStarfield() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * (this.width || 1000),
        y: Math.random() * 220,
        radius: Math.random() * 1.2 + 0.4,
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
      // 60 fps cap
      if (timestamp - this.lastFrameTime >= 16) {
        this.pulsePhase += 0.035;
        this.draw();
        this.lastFrameTime = timestamp;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  // Bezier curve coordinate for Hohmann trajectory
  getArcPoint(t) {
    const p0 = { x: 70, y: 130 }; // Earth location
    const cp = { x: this.width * 0.5, y: 45 }; // Arc crest
    const p1 = { x: this.width - 70, y: 130 }; // Mars location

    // Quadratic Bezier
    const inv = 1 - t;
    const x = inv * inv * p0.x + 2 * inv * t * cp.x + t * t * p1.x;
    const y = inv * inv * p0.y + 2 * inv * t * cp.y + t * t * p1.y;
    return { x, y };
  }

  getCommDelaySeconds(day) {
    return Math.round(1.5 + (day / 180) * 750);
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

    // 1. Draw Starfield with Parallax
    const parallaxOffset = (t - 0.5) * 40;
    this.stars.forEach(s => {
      const speed = s.layer === 0 ? 0.2 : (s.layer === 1 ? 0.5 : 1.0);
      const curX = (s.x - parallaxOffset * speed + w) % w;
      ctx.fillStyle = `rgba(232, 228, 216, ${s.brightness})`;
      ctx.beginPath();
      ctx.arc(curX, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Hohmann Orbit Arc (Earth -> Mars)
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
      const frac = (s / 60) * (shipSteps > 0 ? (t / (shipSteps / 60)) : 1);
      const pt = this.getArcPoint(Math.min(t, s / 60));
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = 'rgba(63, 181, 154, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Day 40 Event Marker ("Sleep collapse")
    const d40Pt = this.getArcPoint(39 / 179);
    ctx.fillStyle = '#E8A93A';
    ctx.beginPath();
    ctx.arc(d40Pt.x, d40Pt.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '13px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8A93A';
    ctx.textAlign = 'center';
    ctx.fillText('Day 40: Sleep collapse', d40Pt.x, d40Pt.y - 12);
    ctx.strokeStyle = '#E8A93A';
    ctx.beginPath();
    ctx.moveTo(d40Pt.x, d40Pt.y - 8);
    ctx.lineTo(d40Pt.x, d40Pt.y - 2);
    ctx.stroke();

    // 4. Earth (Left) - Shrinks as ship departs
    const rEarth = Math.round(32 - t * 22); // 32px down to 10px
    const earthPt = this.getArcPoint(0);

    // Earth atmosphere aura
    ctx.beginPath();
    ctx.arc(earthPt.x, earthPt.y, rEarth + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(95, 168, 211, 0.2)';
    ctx.fill();

    // Earth disc (#5FA8D3 Earthlight)
    ctx.beginPath();
    ctx.arc(earthPt.x, earthPt.y, rEarth, 0, Math.PI * 2);
    ctx.fillStyle = '#5FA8D3';
    ctx.fill();

    // Earth text
    ctx.font = '14.5px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8E4D8';
    ctx.textAlign = 'left';
    ctx.fillText('Earth', earthPt.x - 20, earthPt.y + rEarth + 18);

    // Live delay readout beside Earth
    const delaySec = this.getCommDelaySeconds(day);
    ctx.font = '13.5px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#98A8A6';
    ctx.fillText(`Earth is ${this.formatDelay(delaySec)} away`, earthPt.x - 20, earthPt.y + rEarth + 36);
    ctx.font = '11.5px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#E8A93A';
    ctx.fillText('(source pending)', earthPt.x - 20, earthPt.y + rEarth + 52);

    // 5. Mars (Right) - Grows as ship arrives
    const rMars = Math.round(10 + t * 24); // 10px up to 34px
    const marsPt = this.getArcPoint(1);

    // Mars disc (#C4623A Mars Rust)
    ctx.beginPath();
    ctx.arc(marsPt.x, marsPt.y, rMars, 0, Math.PI * 2);
    ctx.fillStyle = '#C4623A';
    ctx.fill();

    // Polar ice cap hint
    ctx.beginPath();
    ctx.arc(marsPt.x, marsPt.y - rMars * 0.7, rMars * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232, 228, 216, 0.6)';
    ctx.fill();

    ctx.font = '14.5px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8E4D8';
    ctx.textAlign = 'right';
    ctx.fillText('Mars', marsPt.x + 10, marsPt.y + rMars + 18);

    const daysRemaining = this.maxDays - day;
    ctx.font = '13.5px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#98A8A6';
    ctx.fillText(`${daysRemaining} days to landing`, marsPt.x + 10, marsPt.y + rMars + 36);

    // 6. Signal Pulse Traveling Between Ship and Earth
    const shipPt = this.getArcPoint(t);
    const pulseT = (this.pulsePhase % 2) / 2; // 0 to 1 loop
    const pulseArcT = Math.max(0, t * (1 - pulseT));
    const pulsePt = this.getArcPoint(pulseArcT);

    ctx.beginPath();
    ctx.arc(pulsePt.x, pulsePt.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(95, 168, 211, 0.7)';
    ctx.fill();

    // 7. Active Telemetry Packet Flight (if queue has active items)
    this.drawPacketFlight(ctx, t, shipPt, earthPt);

    // 8. The Ship Marker (Sits on the Hohmann Arc)
    this.drawShip(ctx, shipPt.x, shipPt.y);
  }

  drawShip(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Hull diamond glow
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 17, 27, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#3FB59A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ship shape (sleek transit vessel pointing right)
    ctx.beginPath();
    ctx.moveTo(8, 0);
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

    // Find latest active packet
    const activeEntry = queue[queue.length - 1];
    const status = activeEntry.packet.status;

    if (status === 'QUEUED') {
      // Small beacon sitting at the ship
      ctx.beginPath();
      ctx.arc(shipPt.x, shipPt.y - 18, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#5FA8D3';
      ctx.fill();
      ctx.font = '11.5px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Packet queued', shipPt.x, shipPt.y - 24);
    } else if (status === 'TRANSMITTING') {
      // Packet actively traveling from ship to Earth along Hohmann arc
      const travelFrac = (this.pulsePhase * 0.4) % 1.0;
      const packetArcT = shipT * (1 - travelFrac);
      const packetPt = this.getArcPoint(packetArcT);

      ctx.beginPath();
      ctx.arc(packetPt.x, packetPt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#E8A93A';
      ctx.fill();

      ctx.font = '11.5px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#E8A93A';
      ctx.textAlign = 'center';
      ctx.fillText('Packet in flight &rarr; Earth', packetPt.x, packetPt.y - 10);
    } else if (status === 'ACKNOWLEDGED') {
      // Reply signal returning to ship
      const returnFrac = (this.pulsePhase * 0.4) % 1.0;
      const replyArcT = shipT * returnFrac;
      const replyPt = this.getArcPoint(replyArcT);

      ctx.beginPath();
      ctx.arc(replyPt.x, replyPt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#3FB59A';
      ctx.fill();

      ctx.font = '11.5px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#3FB59A';
      ctx.textAlign = 'center';
      ctx.fillText('Ground ACK returned', replyPt.x, replyPt.y - 10);
    } else if (status === 'FAILED') {
      // Red flicker at the ship position with retry hint
      const flicker = Math.sin(this.pulsePhase * 8) > 0 ? 1 : 0.3;
      ctx.beginPath();
      ctx.arc(shipPt.x, shipPt.y - 18, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(229, 89, 79, ${flicker})`;
      ctx.fill();
      ctx.font = '11.5px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#E5594F';
      ctx.textAlign = 'center';
      ctx.fillText('Link failure (retrying)', shipPt.x, shipPt.y - 24);
    }
  }
}
