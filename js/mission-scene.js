/**
 * LANDFALL 2.0 - The Mission Scene (js/mission-scene.js)
 * Level 0 Environment View:
 * Hand-written 3D Perspective Projection Engine (Camera, Perspective Divide, Depth Sorting, Zero Libraries)
 * 4 Environments:
 * 1. MARS: Hohmann transfer orbit, 3-layer parallax starfield, scaling Earth/Mars, ship marker, day-40 marker
 * 2. ISS: Low Earth Orbit curved atmospheric limb, 8 articulated solar arrays, truss, cupola window
 * 3. MOON: Artemis lunar Shackleton rim regolith, tiered crater shadows, Earthrise, geodesic surface habitat dome
 * 4. EVA_SUIT: Full EMU suit with mechanical 3-phase split animation (latches unlock, visor retracts, shells open laterally)
 */

import { getQueue, config as queueConfig } from "../queue.js";

export class MissionScene {
  constructor(canvasId, sliderId, onDayChange, onEnvironmentChange) {
    this.canvas = document.getElementById(canvasId);
    this.slider = document.getElementById(sliderId);
    this.onDayChange = onDayChange;
    this.onEnvironmentChange = onEnvironmentChange;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.currentDay = 49;
    this.maxDays = 180;
    this.width = 0;
    this.height = 240;
    this.dpr = window.devicePixelRatio || 1;

    // Environment: "MARS" | "ISS" | "MOON" | "EVA_SUIT"
    this.environment = "MARS";
    this.evaSuitOpened = false;
    this.zoomProgress = 1.0; // 0 to 1 entry zoom
    this.isZooming = false;

    // 3-layer starfield
    this.stars = [];
    this.numStars = 160;
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

    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.setDay(parseInt(e.target.value, 10), true);
      });
    }

    // Canvas click interaction: scrub or trigger zoom/EVA open
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (this.environment === 'EVA_SUIT') {
        this.toggleEvaSuit();
        return;
      }

      // In MARS, click along arc scrubs day
      if (this.environment === 'MARS') {
        const frac = Math.max(0, Math.min(1, (clickX - 60) / (this.width - 120)));
        const day = Math.round(1 + frac * 179);
        this.setDay(day, true);
      } else {
        // Trigger entry zoom
        this.replayEntryZoom();
      }
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
        z: Math.random() * 800 + 100, // 3D depth
        radius: Math.random() * 1.3 + 0.35,
        layer: Math.floor(Math.random() * 3),
        brightness: Math.random() * 0.7 + 0.3
      });
    }
  }

  setEnvironment(env) {
    this.environment = env;
    this.evaSuitOpened = false;
    this.replayEntryZoom();
    this.updateHudTags();
    if (this.onEnvironmentChange) this.onEnvironmentChange(env);
    this.draw();
  }

  toggleEvaSuit() {
    this.evaSuitOpened = !this.evaSuitOpened;
    this.draw();
    const btn = document.getElementById('btn-toggle-eva-suit');
    if (btn) {
      btn.textContent = this.evaSuitOpened ? "Close suit shell" : "Open EVA suit shell";
    }
  }

  replayEntryZoom() {
    if (this.prefersReducedMotion) {
      this.zoomProgress = 1.0;
      this.draw();
      return;
    }
    this.isZooming = true;
    this.zoomProgress = 0.0;
    const startTime = performance.now();
    const duration = 1200;

    const anim = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      // Smooth cubic ease out
      this.zoomProgress = 1 - Math.pow(1 - t, 3);
      this.draw();
      if (t < 1.0) {
        requestAnimationFrame(anim);
      } else {
        this.isZooming = false;
      }
    };
    requestAnimationFrame(anim);
  }

  setDay(day, triggerCallback = false) {
    this.currentDay = Math.max(1, Math.min(this.maxDays, parseInt(day, 10)));
    if (this.slider && parseInt(this.slider.value, 10) !== this.currentDay) {
      this.slider.value = this.currentDay;
    }
    if (triggerCallback && typeof this.onDayChange === 'function') {
      this.onDayChange(this.currentDay);
    }
    this.updateHudTags();
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
      if (timestamp - this.lastFrameTime >= 16) {
        this.pulsePhase += 0.035;
        this.draw();
        this.lastFrameTime = timestamp;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  // Perspective 3D Projection Math (Hand-written)
  project3D(x, y, z, fov = 400) {
    const scale = fov / (fov + z);
    const projX = (this.width / 2) + x * scale;
    const projY = (this.height / 2) + y * scale;
    return { x: projX, y: projY, scale };
  }

  // Hohmann Arc for Mars Mode
  getArcPoint(t) {
    const p0 = { x: 75, y: 145 };
    const cp = { x: this.width * 0.5, y: 48 };
    const p1 = { x: this.width - 75, y: 145 };

    const inv = 1 - t;
    const x = inv * inv * p0.x + 2 * inv * t * cp.x + t * t * p1.x;
    const y = inv * inv * p0.y + 2 * inv * t * cp.y + t * t * p1.y;
    return { x, y };
  }

  getCommDelaySeconds(day) {
    if (this.environment === 'ISS') return 0.01;
    if (this.environment === 'MOON') return 1.3;
    if (this.environment === 'EVA_SUIT') return 0.05;
    return Math.round(1.3 + (day / 180) * 750);
  }

  formatDelay(seconds) {
    if (seconds < 1.0) return `${(seconds * 1000).toFixed(0)} ms`;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m} min ${s} s`;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background: Deep Space Void #05070D
    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, w, h);

    // 1. Starfield Background (common to all environments)
    this.drawStarfield(ctx, w, h);

    // 2. Render Selected Environment
    if (this.environment === 'MARS') {
      this.drawMarsEnvironment(ctx, w, h);
    } else if (this.environment === 'ISS') {
      this.drawIssEnvironment(ctx, w, h);
    } else if (this.environment === 'MOON') {
      this.drawMoonEnvironment(ctx, w, h);
    } else if (this.environment === 'EVA_SUIT') {
      this.drawEvaSuitEnvironment(ctx, w, h);
    }

    // 3. Environment Header Tags & Reticle
    this.drawEnvironmentTelemetryOverlay(ctx, w, h);
  }

  drawStarfield(ctx, w, h) {
    const t = (this.currentDay - 1) / 179;
    const parallaxOffset = (t - 0.5) * 45;

    this.stars.forEach(s => {
      const speed = s.layer === 0 ? 0.2 : (s.layer === 1 ? 0.5 : 1.0);
      const curX = (s.x - parallaxOffset * speed + w) % w;
      ctx.fillStyle = `rgba(232, 228, 216, ${s.brightness})`;
      ctx.beginPath();
      ctx.arc(curX, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ENVIRONMENT 1: MARS TRANSIT
  drawMarsEnvironment(ctx, w, h) {
    const day = this.currentDay;
    const t = (day - 1) / 179;

    // Hohmann Orbit Arc
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

    // Trajectory Progress Trace
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

    // Day 40 Event Marker
    const d40Pt = this.getArcPoint(39 / 179);
    ctx.fillStyle = '#E8A93A';
    ctx.beginPath();
    ctx.arc(d40Pt.x, d40Pt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '13.5px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8A93A';
    ctx.textAlign = 'center';
    ctx.fillText('Day 40: Sleep collapse', d40Pt.x, d40Pt.y - 14);

    // Earth (Left) - Shrinks as ship departs
    const rEarth = Math.round(30 - t * 21);
    const earthPt = this.getArcPoint(0);
    ctx.beginPath();
    ctx.arc(earthPt.x, earthPt.y, rEarth + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(95, 168, 211, 0.22)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(earthPt.x, earthPt.y, rEarth, 0, Math.PI * 2);
    ctx.fillStyle = '#5FA8D3';
    ctx.fill();
    ctx.font = '15px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = '#E8E4D8';
    ctx.textAlign = 'left';
    ctx.fillText('Earth', earthPt.x - 22, earthPt.y + rEarth + 18);

    // Mars (Right) - Grows as ship arrives
    const rMars = Math.round(9 + t * 23);
    const marsPt = this.getArcPoint(1);
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

    // Ship Marker
    const shipPt = this.getArcPoint(t);
    this.drawShip(ctx, shipPt.x, shipPt.y);

    // Telemetry Packet Flight
    this.drawPacketFlight(ctx, t, shipPt, earthPt);
  }

  // ENVIRONMENT 2: ISS (LOW EARTH ORBIT)
  drawIssEnvironment(ctx, w, h) {
    const zoom = this.zoomProgress;
    const cx = w * 0.5;
    const cy = h * 0.55;

    // Earth Curved Limb (Lower Third)
    ctx.beginPath();
    ctx.arc(cx, h + 380, 480, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = '#5FA8D3';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Atmosphere Cyan Glow
    ctx.beginPath();
    ctx.arc(cx, h + 380, 492, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = 'rgba(95, 168, 211, 0.25)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // ISS 3D Truss & Solar Panels in 3D Perspective
    ctx.save();
    ctx.translate(cx, cy);
    const scale = 1.0 + zoom * 0.8;
    ctx.scale(scale, scale);

    // Central Integrated Truss
    ctx.strokeStyle = '#E8E4D8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-140, 0);
    ctx.lineTo(140, 0);
    ctx.stroke();

    // Pressurized Destiny / Harmony Modules
    ctx.fillStyle = '#243044';
    ctx.strokeStyle = '#5FA8D3';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-22, -18, 44, 36);
    ctx.strokeRect(-22, -18, 44, 36);

    // Cupola Window glowing cyan
    ctx.fillStyle = '#5FA8D3';
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // 8 Solar Array Wings (Gold/Copper with Photovoltaic Grids)
    ctx.fillStyle = 'rgba(232, 169, 58, 0.35)';
    ctx.strokeStyle = '#E8A93A';
    ctx.lineWidth = 1.2;

    const wingOffsets = [-125, -95, 95, 125];
    wingOffsets.forEach(xPos => {
      // Top array
      ctx.fillRect(xPos - 12, -75, 24, 60);
      ctx.strokeRect(xPos - 12, -75, 24, 60);
      // Bottom array
      ctx.fillRect(xPos - 12, 15, 24, 60);
      ctx.strokeRect(xPos - 12, 15, 24, 60);
    });

    ctx.restore();
  }

  // ENVIRONMENT 3: MOON (SHACKLETON RIM OUTPOST)
  drawMoonEnvironment(ctx, w, h) {
    const cx = w * 0.5;

    // Earthrise in deep space sky
    ctx.beginPath();
    ctx.arc(w * 0.78, 48, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#5FA8D3';
    ctx.fill();
    ctx.strokeStyle = 'rgba(95, 168, 211, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Lunar Regolith Horizon & Tiered Craters
    ctx.fillStyle = '#0F1623';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 160);
    ctx.bezierCurveTo(w * 0.25, 130, w * 0.45, 175, w * 0.7, 140);
    ctx.bezierCurveTo(w * 0.85, 125, w * 0.95, 155, w, 150);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#243044';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shackleton Crater Rim Deep Shadow
    ctx.fillStyle = '#080D15';
    ctx.beginPath();
    ctx.ellipse(w * 0.32, 185, 90, 24, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#182436';
    ctx.stroke();

    // Artemis Geodesic Surface Habitat Dome
    ctx.save();
    ctx.translate(w * 0.5, 150);
    const scale = 1.0 + this.zoomProgress * 0.7;
    ctx.scale(scale, scale);

    // Geodesic Dome
    ctx.beginPath();
    ctx.arc(0, 0, 36, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#1B283E';
    ctx.fill();
    ctx.strokeStyle = '#5FA8D3';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Airlock Entry Port glowing cyan
    ctx.fillStyle = '#3FB59A';
    ctx.fillRect(-10, -14, 20, 14);
    ctx.strokeStyle = '#E8E4D8';
    ctx.strokeRect(-10, -14, 20, 14);

    // Solar Power Tower
    ctx.strokeStyle = '#E8A93A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(65, 0);
    ctx.lineTo(65, -55);
    ctx.stroke();
    ctx.fillStyle = '#E8A93A';
    ctx.fillRect(52, -55, 26, 8);

    ctx.restore();
  }

  // ENVIRONMENT 4: EVA SUIT (MECHANICAL SPLIT REVEAL)
  drawEvaSuitEnvironment(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.52;
    const opened = this.evaSuitOpened;
    const splitOffset = opened ? 55 : 0;

    ctx.save();
    ctx.translate(cx, cy);

    // PLSS Life Support Backpack
    ctx.fillStyle = '#141E2F';
    ctx.strokeStyle = '#384860';
    ctx.lineWidth = 2;
    ctx.fillRect(-45, -75, 90, 140);
    ctx.strokeRect(-45, -75, 90, 140);

    // Dual Headlamp Light Beams
    ctx.fillStyle = 'rgba(232, 228, 216, 0.08)';
    ctx.beginPath();
    ctx.moveTo(-18, -65);
    ctx.lineTo(-120, -120);
    ctx.lineTo(-40, -130);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, -65);
    ctx.lineTo(120, -120);
    ctx.lineTo(40, -130);
    ctx.closePath();
    ctx.fill();

    // Helmet & Visor Retraction
    const visorY = opened ? -85 : -60;
    const visorOpacity = opened ? 0.25 : 0.85;

    // Hard Helmet Ring
    ctx.strokeStyle = '#E8E4D8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -60, 26, 0, Math.PI * 2);
    ctx.stroke();

    // Gold-tinted Sun Visor
    ctx.fillStyle = `rgba(232, 169, 58, ${visorOpacity})`;
    ctx.beginPath();
    ctx.arc(0, visorY, 22, Math.PI * 0.1, Math.PI * 0.9);
    ctx.closePath();
    ctx.fill();

    // Mechanical Torso Shells (Splits laterally on click)
    // Left Shell
    ctx.save();
    ctx.translate(-splitOffset, 0);
    ctx.fillStyle = opened ? 'rgba(36, 48, 68, 0.4)' : '#182438';
    ctx.strokeStyle = opened ? '#3FB59A' : '#5FA8D3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(-38, -25);
    ctx.lineTo(-34, 45);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Shell
    ctx.save();
    ctx.translate(splitOffset, 0);
    ctx.fillStyle = opened ? 'rgba(36, 48, 68, 0.4)' : '#182438';
    ctx.strokeStyle = opened ? '#3FB59A' : '#5FA8D3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(38, -25);
    ctx.lineTo(34, 45);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Chest Control Module & ECG Wave (if closed)
    if (!opened) {
      ctx.fillStyle = '#080E17';
      ctx.fillRect(-18, -12, 36, 24);
      ctx.strokeStyle = '#3FB59A';
      ctx.strokeRect(-18, -12, 36, 24);

      // Mini ECG trace
      ctx.strokeStyle = '#3FB59A';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-2, -7);
      ctx.lineTo(2, 6);
      ctx.lineTo(6, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();
    } else {
      // Revealed Body Twin Silhouette hint
      ctx.fillStyle = '#3FB59A';
      ctx.font = '14px "Saira Semi Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Digital Twin Scanned & Revealed', 0, 10);
    }

    ctx.restore();
  }

  drawShip(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 17, 27, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#3FB59A';
    ctx.lineWidth = 1.6;
    ctx.stroke();

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

    const activeEntry = queue[queue.length - 1];
    const status = activeEntry.packet.status;

    if (status === 'QUEUED') {
      ctx.beginPath();
      ctx.arc(shipPt.x, shipPt.y - 18, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#5FA8D3';
      ctx.fill();
      ctx.font = '13px "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#5FA8D3';
      ctx.textAlign = 'center';
      ctx.fillText('Packet queued at ship', shipPt.x, shipPt.y - 24);
    } else if (status === 'TRANSMITTED') {
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

  drawEnvironmentTelemetryOverlay(ctx, w, h) {
    const delay = this.getCommDelaySeconds(this.currentDay);
    const delayStr = this.formatDelay(delay);

    let hudText = "";
    if (this.environment === 'MARS') {
      hudText = `DISTANCE: 148M km (illustrative) \u2022 GRAVITY: 0.38 g \u2022 EARTH LINK: ${delayStr} (DTN store-and-forward)`;
    } else if (this.environment === 'ISS') {
      hudText = `ALTITUDE: 408 km (illustrative) \u2022 GRAVITY: 0.00 g \u2022 EARTH LINK: 0.01 s (real-time) \u2022 VELOCITY: 7.66 km/s`;
    } else if (this.environment === 'MOON') {
      hudText = `LOCATION: Shackleton Rim (illustrative) \u2022 GRAVITY: 0.165 g (1/6 Earth) \u2022 EARTH LINK: 1.3 s delay (nasa_delay)`;
    } else if (this.environment === 'EVA_SUIT') {
      hudText = `SUIT PRESSURE: 4.3 psi (illustrative) \u2022 PLSS BATTERY: 86% \u2022 METABOLIC: 285 kcal/hr \u2022 SUIT SHELL: ${this.evaSuitOpened ? "OPEN" : "SEALED"}`;
    }

    ctx.font = '13px "Hanken Grotesk", sans-serif';
    ctx.fillStyle = '#9FAAA8';
    ctx.textAlign = 'left';
    ctx.fillText(hudText, 16, 24);
  }

  updateHudTags() {
    const el = document.getElementById('scene-environment-hud');
    if (!el) return;
    const delay = this.getCommDelaySeconds(this.currentDay);
    const delayStr = this.formatDelay(delay);

    if (this.environment === 'MARS') {
      el.textContent = `Ares-VI Transit \u2022 0.38 g \u2022 Delay: ${delayStr}`;
    } else if (this.environment === 'ISS') {
      el.textContent = `LEO 408 km \u2022 0.00 g \u2022 Real-time 0.01 s`;
    } else if (this.environment === 'MOON') {
      el.textContent = `Artemis Base \u2022 0.165 g \u2022 Delay: 1.3 s`;
    } else if (this.environment === 'EVA_SUIT') {
      el.textContent = `EMU Suit \u2022 4.3 psi \u2022 Relay: 0.05 s`;
    }
  }
}
