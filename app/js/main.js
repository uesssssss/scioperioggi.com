// Avvio: carica i dati, prepara mappa e schermate, apre Oggi (o il benvenuto al primo avvio).
import '../css/index.css';
import { S, D } from './state.js';
import { $, mqDesk } from './util.js';
import { initTheme } from './theme.js';
import { initGeo, ITALY } from './geo.js';
import { initEvents } from './events.js';
import { readColors, sizeCanvas, draw, onThemeChange } from './map/canvas.js';
import { initZoom, setT, fitT, refit } from './map/view.js';
import { recluster } from './map/pins.js';
import { drawStrip, syncStripH, syncChips, meta, initFilters } from './map/strip.js';
import { initSheet, closeSheet, isOpen, openDetail, openInfo } from './sheet.js';
import { initTabs, setTab } from './screens/tabs.js';
import { initCity, loadCity } from './screens/city.js';
import { initWelcome, openWelcome } from './screens/welcome.js';

// Solo la mappa si ingrandisce: la pagina no, così intestazione, striscia e scheda restano ferme.
function lockPageZoom() {
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('wheel', (e) => { if (e.ctrlKey && !(e.target.closest && e.target.closest('#stage'))) e.preventDefault(); }, { passive: false });
}

// I dati sono dentro la pagina (versione in un file solo) oppure si scaricano da data/.
async function loadData() {
  const inline = (id) => { const el = document.getElementById(id); return el ? JSON.parse(el.textContent) : null; };
  const geo = inline('geo-meta'), events = inline('events-data');
  if (geo && events) return [geo, events];
  const get = (u) => fetch(u, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  return Promise.all([get('data/geo.json'), get('data/events.json')]);
}

async function boot() {
  initTheme();
  lockPageZoom();
  const [GEO, DATA] = await loadData();
  D.GEO = GEO; D.DATA = DATA;
  initGeo(GEO);
  initEvents(DATA);

  document.addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') S.kbd = true; }, true);
  document.addEventListener('pointerdown', () => { S.kbd = false; }, true);

  readColors(); sizeCanvas();
  if (window.matchMedia) { const mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', onThemeChange); }
  new MutationObserver(onThemeChange).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  initSheet(); initFilters(); initCity(); initWelcome(); initTabs();
  $('#btn-info').addEventListener('click', (e) => openInfo(e.currentTarget));
  $('#btn-fit').addEventListener('click', () => setT(fitT(ITALY, 8), true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  $('#stage').addEventListener('click', () => closeSheet());

  drawStrip(); meta(); syncChips();
  S.city = loadCity();
  const hash = decodeURIComponent((location.hash || '').slice(1));
  const linked = hash && D.byId[hash];
  setTab(linked && !mqDesk.matches ? 'mappa' : 'oggi');
  initZoom();
  if (linked) setTimeout(() => openDetail(D.byId[hash], null, null), 60);
  else if (!S.city) openWelcome();

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { readColors(); syncStripH(); refit(); draw(); });
  let rz = null;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { sizeCanvas(); draw(); syncStripH(); refit(); recluster(); }, 150); });
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', () => setTimeout(() => { syncStripH(); refit(true); recluster(); }, 50));
}

boot().catch((err) => {
  console.error(err);
  const box = document.getElementById('oggi');
  if (box) box.innerHTML = '<p class="note">Non riesco a caricare i dati. Riprova tra poco.</p>';
});
