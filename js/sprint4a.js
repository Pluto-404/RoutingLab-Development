/* Mobile navigation for RoutingLab pages. Progressive enhancement only. */
(() => {
  const button = document.querySelector('.mobile-menu-button');
  const sidebar = document.querySelector('.sidebar');
  const scrim = document.querySelector('.sidebar-scrim');
  if (!button || !sidebar || !scrim) return;
  const setOpen = (open) => {
    sidebar.classList.toggle('is-open', open);
    scrim.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
    if (open) sidebar.querySelector('a')?.focus();
    else button.focus();
  };
  button.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
  scrim.addEventListener('click', () => setOpen(false));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setOpen(false);
  });
  const mq = window.matchMedia('(min-width: 1101px)');
  mq.addEventListener?.('change', e => { if (e.matches && sidebar.classList.contains('is-open')) setOpen(false); });
})();
