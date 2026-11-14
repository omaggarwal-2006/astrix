/**
 * LANDFALL - Hash routing and tab activation (src/app/router.js)
 * Tabs come from the nav buttons in index.html (data-tab). Old v1 hashes still work.
 */

import { AppState } from "./state.js";

const LEGACY = { overview: 'today', monitor: 'signals', triage: 'comms', sources: 'evidence' };
const tabIds = () => [...document.querySelectorAll('.nav-tab-btn')].map(b => b.dataset.tab);

function fromHash() {
  const raw = window.location.hash.replace('#', '').trim();
  const id = LEGACY[raw] || raw;
  return tabIds().includes(id) ? id : 'today';
}

/** Navigate to a tab (updates the URL, which triggers activation). */
export function goTo(tabId) {
  if (window.location.hash === `#${tabId}`) activateTab(tabId);
  else window.location.hash = tabId;
}

export function initNavigation() {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.tab));
  });
  // Arrow keys move between tabs (WAI-ARIA tabs pattern)
  document.querySelector('.tabs')?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const ids = tabIds();
    const i = ids.indexOf(AppState.activeTab);
    const next = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
    goTo(next);
    document.getElementById(`tab-${next}`)?.focus();
  });
  window.addEventListener('hashchange', () => activateTab(fromHash()));
  activateTab(fromHash());
}

export function activateTab(tabId) {
  tabId = LEGACY[tabId] || tabId;
  const changed = AppState.activeTab !== tabId;
  AppState.activeTab = tabId;
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const on = btn.dataset.tab === tabId;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const on = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', on);
    panel.hidden = !on;
  });
  AppState.renderCurrentTab();
  if (changed) {
    const bar = document.querySelector('.tabs-bar');
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}
