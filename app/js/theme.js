// Tema: segue il telefono finché non si tocca l'interruttore, poi resta quello scelto.
const ROOT = document.documentElement, HOST_THEME = ROOT.getAttribute('data-theme');
let pref = 'auto';
function apply(v) {
  pref = v;
  if (v === 'light' || v === 'dark') ROOT.setAttribute('data-theme', v);
  else if (HOST_THEME) ROOT.setAttribute('data-theme', HOST_THEME);
  else ROOT.removeAttribute('data-theme');
  const dark = v === 'dark' || (v !== 'light' && (HOST_THEME === 'dark' || (!HOST_THEME && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)));
  document.getElementById('theme-switch').setAttribute('aria-checked', dark ? 'true' : 'false');
  document.getElementById('theme-label').textContent = dark ? 'Tema scuro' : 'Tema chiaro';
}
export function initTheme() {
  try { pref = localStorage.getItem('tema') || 'auto'; } catch (e) { /* niente memoria */ }
  apply(pref);
  document.getElementById('theme-switch').addEventListener('click', (e) => {
    const next = e.currentTarget.getAttribute('aria-checked') === 'true' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('tema', next); } catch (x) { /* niente memoria */ }
  });
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', () => { if (pref === 'auto') apply('auto'); });
  }
}
