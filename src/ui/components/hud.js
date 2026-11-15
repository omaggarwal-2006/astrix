/**
 * LANDFALL - Small HUD drawing helpers (src/ui/components/hud.js)
 * Pure functions that return SVG/HTML strings: trend sparklines, an ECG trace, status rings,
 * the readiness gauge and hexagonal career badges. No state, no data access.
 */

const TONE_HEX = { ok: '#46e3ff', go: '#3ee6a8', warn: '#ffb84d', bad: '#ff5b4f' };
export const toneHex = (tone) => TONE_HEX[tone] || TONE_HEX.ok;

/** Trend line over `values` (oldest first) with an optional dashed baseline. */
export function sparkSVG(values, { base = null, tone = 'ok', w = 150, h = 40, min = null, max = null } = {}) {
  const vals = values.filter(v => Number.isFinite(v));
  if (vals.length < 2) return '';
  const lo = min ?? Math.min(...vals, base ?? Infinity);
  const hi = max ?? Math.max(...vals, base ?? -Infinity);
  const span = hi - lo || 1;
  const pad = 4;
  const X = (i) => pad + (i / (vals.length - 1)) * (w - pad * 2);
  const Y = (v) => h - pad - ((v - lo) / span) * (h - pad * 2);
  // Jittered sub-samples between days make the trace read as live telemetry
  let d = '';
  vals.forEach((v, i) => {
    if (i === 0) { d += `M${X(0).toFixed(1)},${Y(v).toFixed(1)}`; return; }
    const prev = vals[i - 1];
    const steps = 4;
    for (let k = 1; k <= steps; k++) {
      const f = k / steps;
      const jitter = k < steps ? Math.sin((i * 7 + k) * 2.3) * span * 0.08 : 0;
      d += ` L${(X(i - 1) + (X(i) - X(i - 1)) * f).toFixed(1)},${Y(prev + (v - prev) * f + jitter).toFixed(1)}`;
    }
  });
  const c = toneHex(tone);
  const baseLine = base != null ? `<line x1="${pad}" x2="${w - pad}" y1="${Y(base).toFixed(1)}" y2="${Y(base).toFixed(1)}" stroke="${c}" stroke-opacity=".35" stroke-dasharray="3 4"/>` : '';
  const last = vals[vals.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${baseLine}
    <path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px ${c})"/>
    <circle cx="${X(vals.length - 1).toFixed(1)}" cy="${Y(last).toFixed(1)}" r="2.4" fill="${c}"/>
  </svg>`;
}

/** Stylised ECG trace; beat spacing follows the heart rate (decorative, labelled as such in the UI). */
export function ecgSVG(bpm = 64, { tone = 'go', w = 150, h = 40 } = {}) {
  const beats = Math.max(3, Math.round(bpm / 18));
  const seg = w / beats;
  const mid = h * 0.6;
  let d = `M0,${mid}`;
  for (let b = 0; b < beats; b++) {
    const x0 = b * seg;
    const p = (f, y) => ` L${(x0 + seg * f).toFixed(1)},${y.toFixed(1)}`;
    d += p(0.18, mid) + p(0.24, mid - 3) + p(0.3, mid) + p(0.4, mid) + p(0.44, mid + 4) + p(0.5, h * 0.06) + p(0.56, h - 3) + p(0.62, mid) + p(0.76, mid - 5) + p(0.86, mid) + p(1, mid);
  }
  const c = toneHex(tone);
  return `<svg class="spark ecg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px ${c})"/>
  </svg>`;
}

/** Small circular status dial with a word in the middle (STABLE / AMBER / ALERT). */
export function statusRing(pct, word, tone) {
  const r = 20, C = 2 * Math.PI * r;
  const c = toneHex(tone);
  const p = Math.max(0.04, Math.min(1, pct / 100));
  return `<svg class="kpi-ring" viewBox="0 0 52 52" aria-hidden="true">
    <circle cx="26" cy="26" r="${r}" fill="none" stroke="${c}" stroke-opacity=".16" stroke-width="3.5"/>
    <circle cx="26" cy="26" r="${r}" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"
      stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 26 26)" style="filter:drop-shadow(0 0 3px ${c})"/>
    <text x="26" y="29" text-anchor="middle" fill="${c}">${word}</text>
  </svg>`;
}

/** Geometry for the readiness gauge's 270° arcs (r in a 300x300 viewBox). */
export function arcDash(r, frac) {
  const C = 2 * Math.PI * r;
  const span = C * 0.75;
  return { C, span, on: span * Math.max(0, Math.min(1, frac)) };
}

/** The readiness gauge skeleton (design_mockups/04). Values are set by the caller. */
export function gaugeSVG() {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<line x1="150" y1="150" x2="${(150 + Math.cos(a) * 104).toFixed(1)}" y2="${(150 + Math.sin(a) * 104).toFixed(1)}"/>`;
  }).join('');
  const o = arcDash(134, 0), i = arcDash(120, 0);
  return `<svg class="gauge-svg" viewBox="0 0 300 300" aria-hidden="true">
    <defs>
      <radialGradient id="gaugeCore" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#0c2a3a" stop-opacity=".9"/><stop offset="1" stop-color="#05121c" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gaugeSweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#3ee6a8" stop-opacity="0"/><stop offset="1" stop-color="#3ee6a8" stop-opacity=".45"/>
      </linearGradient>
    </defs>
    <circle cx="150" cy="150" r="106" fill="url(#gaugeCore)"/>
    <g class="gauge-radar">${spokes}<circle cx="150" cy="150" r="104"/><circle cx="150" cy="150" r="72"/><circle cx="150" cy="150" r="40"/></g>
    <g class="gauge-sweep"><path d="M150 150 L254 150 A104 104 0 0 0 223.5 76.5 Z" fill="url(#gaugeSweep)" opacity=".55"/><line x1="150" y1="150" x2="254" y2="150"/></g>
    <circle class="gauge-track" cx="150" cy="150" r="134" stroke-dasharray="${o.span.toFixed(1)} ${o.C.toFixed(1)}" transform="rotate(135 150 150)"/>
    <circle class="gauge-outer" id="readiness-ring" cx="150" cy="150" r="134" stroke-dasharray="0 ${o.C.toFixed(1)}" transform="rotate(135 150 150)"/>
    <circle class="gauge-track inner" cx="150" cy="150" r="120" stroke-dasharray="${i.span.toFixed(1)} ${i.C.toFixed(1)}" transform="rotate(135 150 150)"/>
    <circle class="gauge-inner" id="readiness-ring-go" cx="150" cy="150" r="120" stroke-dasharray="0 ${i.C.toFixed(1)}" transform="rotate(135 150 150)"/>
    <g class="gauge-ticks">${Array.from({ length: 28 }, (_, k) => {
      const a = (135 + (k / 27) * 270) * Math.PI / 180;
      const r1 = 143, r2 = k % 3 === 0 ? 150 : 147;
      return `<line x1="${(150 + Math.cos(a) * r1).toFixed(1)}" y1="${(150 + Math.sin(a) * r1).toFixed(1)}" x2="${(150 + Math.cos(a) * r2).toFixed(1)}" y2="${(150 + Math.sin(a) * r2).toFixed(1)}"/>`;
    }).join('')}</g>
  </svg>`;
}

/* ---------------- Hexagonal career badges (design_mockups/08) ---------------- */

const GLYPH = {
  cardiac_guardian: '<path d="M32 46s-13-8-15.5-16A8 8 0 0 1 32 22a8 8 0 0 1 15.5 8C45 38 32 46 32 46z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 33h8l3-6 4 11 3-5h10" fill="none" stroke="currentColor" stroke-width="2"/>',
  neuro_sharp: '<circle cx="32" cy="32" r="15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 32s6-9 15-9 15 9 15 9-6 9-15 9-15-9-15-9z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="32" cy="32" r="4.5" fill="currentColor"/><path d="M32 14v4M32 46v4M14 32h3M47 32h3" stroke="currentColor" stroke-width="2"/>',
  dtn_specialist: '<rect x="27" y="27" width="10" height="10" rx="1.5" transform="rotate(45 32 32)" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M22 22l-6-6m32 32-6-6M16 22l6-6M42 48l6-6" stroke="currentColor" stroke-width="3"/><path d="M40 18a10 10 0 0 1 6 6M41 13a16 16 0 0 1 10 10M24 46a10 10 0 0 1-6-6M23 51a16 16 0 0 1-10-10" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  iron_astronaut: '<path d="M20 32h24" stroke="currentColor" stroke-width="3"/><rect x="14" y="24" width="6" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="44" y="24" width="6" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="10" y="27" width="4" height="10" rx="1" fill="currentColor"/><rect x="50" y="27" width="4" height="10" rx="1" fill="currentColor"/>',
  bone_defender: '<path d="M22 42 42 22M19 39a4 4 0 1 1 4 4 4 4 0 1 1-4-4zM45 25a4 4 0 1 1-4-4 4 4 0 1 1 4 4z" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  lab_master: '<path d="M27 16h10M29 16v12l-9 16a3 3 0 0 0 2.6 4.5h18.8A3 3 0 0 0 44 44l-9-16V16" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M24 40h16" stroke="currentColor" stroke-width="2"/>',
};

export function hexBadge(id, metal, unlocked) {
  const glyph = GLYPH[id] || GLYPH.cardiac_guardian;
  return `<svg class="hex-badge metal-${metal} ${unlocked ? '' : 'locked'}" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="hx-${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" class="hx-a"/><stop offset=".5" class="hx-b"/><stop offset="1" class="hx-c"/>
      </linearGradient>
    </defs>
    <polygon points="32,2 58,17 58,47 32,62 6,47 6,17" fill="url(#hx-${id})" class="hx-plate"/>
    <polygon points="32,8 53,20 53,44 32,56 11,44 11,20" fill="none" class="hx-rim"/>
    <g class="hx-glyph">${glyph}</g>
  </svg>`;
}
