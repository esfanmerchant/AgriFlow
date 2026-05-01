/**
 * Scroll smoothly to a panel by id, accounting for the sticky-header offset
 * we use in dashboards. If the id doesn't exist, no-op.
 */
export function scrollToPanel(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
