/**
 * LANDFALL - Hash routing and tab activation (src/app/router.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "./state.js";

// Slim Top Navigation with Hash Routing (#overview, #monitor, #forecast, #triage, #sources)
export function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) {
        // Changing the hash fires 'hashchange', which activates the tab.
        // Only call activateTab directly when the hash is already this tab.
        if (window.location.hash === `#${tabId}`) {
          activateTab(tabId);
        } else {
          window.location.hash = tabId;
        }
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const raw = window.location.hash.replace('#', '').trim();
    if (raw && ['overview', 'monitor', 'forecast', 'triage', 'sources'].includes(raw)) {
      activateTab(raw);
    } else {
      activateTab('overview');
    }
  });

  // Initial tab from hash or default to overview
  const initialHash = window.location.hash.replace('#', '').trim();
  if (initialHash && ['overview', 'monitor', 'forecast', 'triage', 'sources'].includes(initialHash)) {
    activateTab(initialHash);
  } else {
    activateTab('overview');
  }
}

export function activateTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isTarget = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', isTarget);
    panel.hidden = !isTarget;
  });

  AppState.renderCurrentTab();
}
