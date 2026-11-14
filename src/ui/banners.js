/**
 * LANDFALL - Banners and modals: emergency ground-link modal (src/ui/banners.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

export function initEmergencyModal() {
  const btnOpen = document.getElementById('btn-emergency-link');
  const btnClose = document.getElementById('btn-close-emergency');
  const modal = document.getElementById('emergency-link-modal');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}
