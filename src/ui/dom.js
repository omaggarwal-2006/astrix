/**
 * LANDFALL - Shared UI helpers (src/ui/dom.js)
 * Labels, status pills, icons, number animation. No state.
 */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape text for safe use inside innerHTML templates. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const PATH = {
  SELF_CARE: { short: 'Self-care', long: 'Self-care, logged on board', tone: 'ok' },
  CREW_MEDICAL_OFFICER: { short: 'Crew medical officer', long: 'Handled on board by the crew medical officer', tone: 'warn' },
  FLIGHT_SURGEON: { short: 'Flight surgeon', long: 'Escalated to the flight surgeon on Earth', tone: 'bad' },
};

export const DELIVERY = {
  NONE: { short: 'Logged on board', long: 'No report to Earth needed' },
  LIVE_CALL: { short: 'Live call', long: 'Earth is close enough for a live call' },
  SEND_PACKET: { short: 'Store-and-forward packet', long: 'A checksummed packet goes to Earth' },
  QUEUE_OFFLINE: { short: 'Queued until link returns', long: 'The link is down; the packet waits safely in the queue' },
};

export const METRIC = {
  sleep_h: 'Sleep', cabin_co2: 'Cabin CO₂', mood: 'Mood', immune_cold_sore: 'Immune (cold sore)',
  exercise_min: 'Exercise', hr_bpm: 'Resting heart rate',
};

export const SEVERITY = {
  1: { word: 'Mild drift', tone: 'ok', shape: 'shape-circle' },
  2: { word: 'Caution', tone: 'warn', shape: 'shape-triangle' },
  3: { word: 'Alarm', tone: 'bad', shape: 'shape-octagon' },
};

export const FORECAST_STATUS = {
  nominal: { word: 'GO', tone: 'ok', shape: 'shape-circle' },
  caution: { word: 'WATCH', tone: 'warn', shape: 'shape-triangle' },
  alarm: { word: 'NO-GO', tone: 'bad', shape: 'shape-diamond' },
};

export const READINESS = {
  ON_TRACK: { tone: 'ok', shape: 'shape-circle' },
  WATCH: { tone: 'warn', shape: 'shape-triangle' },
  AT_RISK: { tone: 'bad', shape: 'shape-diamond' },
};

/** Status pill: colour + shape + word (never colour alone). */
export function pill(tone, shape, word) {
  return `<span class="pill ${tone}"><span class="${shape}"></span>${esc(word)}</span>`;
}
export const severityPill = (sev) => { const s = SEVERITY[sev] || SEVERITY[1]; return pill(s.tone, s.shape, s.word); };
export const forecastPill = (status) => { const s = FORECAST_STATUS[status] || FORECAST_STATUS.nominal; return pill(s.tone, s.shape, s.word); };

const SVG = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  SELF_CARE: SVG('<path d="M12 21s-7-4.5-9.3-9A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 21.3 12C19 16.5 12 21 12 21z"/>'),
  CREW_MEDICAL_OFFICER: SVG('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>'),
  FLIGHT_SURGEON: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  send: SVG('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>'),
  copy: SVG('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  alert: SVG('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
  chevron: SVG('<path d="m6 9 6 6 6-6"/>'),
};

const prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animate a number in an element from its current value to `to`. */
export function countUp(el, to, { decimals = 0, duration = 700, suffix = '' } = {}) {
  if (!el) return;
  const from = parseFloat(el.dataset.value ?? el.textContent) || 0;
  el.dataset.value = to;
  if (prefersReducedMotion() || from === to) { el.textContent = to.toFixed(decimals) + suffix; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / duration);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = (from + (to - from) * e).toFixed(decimals) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Re-run a CSS entrance animation on an element. */
export function flash(el) {
  if (!el || prefersReducedMotion()) return;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}
