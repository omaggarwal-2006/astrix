/**
 * LANDFALL - Emergency ground-link modal (src/ui/banners.js)
 * Opens from any element with id btn-emergency-link (rendered by the Decide & deliver view).
 * Focus moves into the modal and returns on close; Escape closes it.
 */

let lastFocus = null;

export function openEmergency() {
  const modal = document.getElementById('emergency-link-modal');
  if (!modal) return;
  lastFocus = document.activeElement;
  modal.classList.add('open');
  setTimeout(() => document.getElementById('btn-close-emergency')?.focus(), 30);
}

export function closeEmergency() {
  const modal = document.getElementById('emergency-link-modal');
  if (!modal || !modal.classList.contains('open')) return false;
  modal.classList.remove('open');
  lastFocus?.focus?.();
  return true;
}

export function initEmergencyModal() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-emergency-link')) openEmergency();
    else if (e.target.closest('#btn-close-emergency') || e.target.id === 'emergency-link-modal') closeEmergency();
  });
  // Keep Tab inside the modal while it is open
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('emergency-link-modal');
    if (e.key !== 'Tab' || !modal?.classList.contains('open')) return;
    const f = [...modal.querySelectorAll('button, a[href]')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
