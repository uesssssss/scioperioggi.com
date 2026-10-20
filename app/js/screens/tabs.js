// Schede: Oggi, Mappa, Calendario, Aggiungi. Sul computer la mappa è sempre visibile e la scheda Mappa sparisce.
import { S, D } from '../state.js';
import { $, mqDesk } from '../util.js';
import { syncStripH } from '../map/strip.js';
import { recluster } from '../map/pins.js';
import { refit } from '../map/view.js';
import { isOpen, closeSheet, openDetail, openInfo } from '../sheet.js';
import { renderOggi, bringFront } from './oggi.js';
import { renderCal } from './calendario.js';
import { renderSegnala } from './aggiungi.js';
import { openPicker } from './city.js';

const VIEWS = { oggi: $('#view-oggi'), cal: $('#view-cal'), segnala: $('#view-segnala') };

export function setTab(name) {
  if (name === 'mappa' && mqDesk.matches) { if (isOpen()) closeSheet(); refit(true); return; }
  if (isOpen()) closeSheet();
  S.tab = name;
  Object.keys(VIEWS).forEach((k) => { VIEWS[k].hidden = k !== name; });
  $('.tabbar').querySelectorAll('.tab').forEach((b) => {
    if (b.dataset.tab === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (name === 'oggi') renderOggi();
  if (name === 'cal') renderCal();
  if (name === 'segnala') renderSegnala();
  if (name === 'mappa') { syncStripH(); refit(); recluster(); }
  if (VIEWS[name]) VIEWS[name].scrollTop = 0;
}

function onViewClick(e) {
  const wd = e.target.closest('[data-day]');
  if (wd) { S.selDay = wd.dataset.day; S.frontId = null; return renderOggi(); }
  const fr = e.target.closest('[data-front]');
  if (fr) return bringFront(fr.dataset.front);
  const o = e.target.closest('[data-open]');
  if (o && D.byId[o.dataset.open]) return openDetail(D.byId[o.dataset.open], null, o);
  const s = e.target.closest('[data-scope]');
  if (s) { S.calScope = s.dataset.scope; return renderCal(); }
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const act = a.dataset.act;
  if (act === 'city') openPicker();
  else if (act === 'info') openInfo(a);
  else if (act === 'cal' || act === 'mappa' || act === 'segnala') setTab(act);
}

export function initTabs() {
  $('.tabbar').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
  Object.keys(VIEWS).forEach((k) => VIEWS[k].addEventListener('click', onViewClick));
  // Passando da telefono a computer (o girando il tablet) la scheda Mappa non esiste più: si torna a Oggi.
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', () => { if (mqDesk.matches && S.tab === 'mappa') setTab('oggi'); });
}
