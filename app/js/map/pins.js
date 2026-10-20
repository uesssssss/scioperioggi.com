// Segnaposti: gli eventi vicini sullo schermo diventano un solo segnaposto con il numero.
import { S } from '../state.js';
import { $, icon } from '../util.js';
import { CITIES, KM_PER_UNIT } from '../geo.js';
import { visible, byPriority, status, tkey, whenText } from '../events.js';
import { render } from './view.js';
import { openDetail, openCluster } from '../sheet.js';

const pinsEl = $('#pins');

export function placesOf(items) {
  const seen = []; items.forEach((e) => { if (seen.indexOf(e.place) < 0) seen.push(e.place); });
  return seen.slice(0, 3).join(' · ') + (seen.length > 3 ? '…' : '');
}
export function clusterTitle(items) {
  const pt = items[0].pt;
  let best = null, dist = Infinity;
  CITIES.forEach((c) => { const d = Math.hypot(c.pt[0] - pt[0], c.pt[1] - pt[1]); if (d < dist) { dist = d; best = c.name; } });
  return items.length + ' eventi ' + (dist * KM_PER_UNIT < 25 ? 'a ' : 'vicino a ') + best;
}
export function recluster() {
  const T = S.T, list = visible().filter((e) => e.pt).sort(byPriority), out = [];
  // Ogni evento accende solo la città più vicina, così coppie come Massa e Carrara non diventano entrambe in grassetto.
  CITIES.forEach((c) => { c.hot = false; });
  list.forEach((e) => {
    let best = null, d = Infinity;
    CITIES.forEach((c) => { const dd = Math.hypot(e.pt[0] - c.pt[0], e.pt[1] - c.pt[1]); if (dd < d) { d = dd; best = c; } });
    if (best && d * KM_PER_UNIT < 15) best.hot = true;
  });
  list.forEach((ev) => {
    const sx = T.x + T.k * ev.pt[0], sy = T.y + T.k * ev.pt[1];
    const isC = ev.group === 'cortei', R = isC ? 16 : 28;
    const hit = out.find((o) => o.c === isC && Math.hypot(o.sx - sx, o.sy - sy) < R);
    if (hit) hit.items.push(ev); else out.push({ sx, sy, pt: ev.pt, c: isC, items: [ev] });
  });
  const sig = out.map((c) => c.items.map((e) => e.id).join(',')).join('|');
  if (sig === S.lastSig && S.clusters.length) { render(); return; }
  S.lastSig = sig;
  pinsEl.textContent = '';
  S.clusters = out.map((c) => {
    const lead = c.items[0], n = c.items.length, b = document.createElement('button');
    const live = c.items.some((e) => status(e).k === 'live');
    const done = c.items.every((e) => status(e).k === 'done');
    const isC = lead.group === 'cortei';
    b.type = 'button';
    b.className = 'pin' + (isC ? ' corteo' : '') + (live ? ' live' : '') + (done ? (isC ? ' faded' : ' done') : '');
    b.style.setProperty('--c', 'var(--c-' + tkey(lead) + ')');
    b.setAttribute('aria-pressed', c.items.some((e) => e.id === S.sel) ? 'true' : 'false');
    b.setAttribute('aria-label', n === 1 ? lead.title + ', ' + lead.place + ', ' + whenText(lead) : clusterTitle(c.items));
    b.innerHTML = '<span class="b">' + icon('i-' + lead.mode) + '</span>' + (n > 1 ? '<span class="n">' + n + '</span>' : '');
    b.addEventListener('click', (e) => { e.stopPropagation(); if (n === 1) openDetail(lead, null, b); else openCluster(c.items, b); });
    pinsEl.appendChild(b);
    return { el: b, pt: c.pt, items: c.items };
  });
  render();
}
export function markSel() {
  S.clusters.forEach((c) => { c.el.setAttribute('aria-pressed', c.items.some((e) => e.id === S.sel) ? 'true' : 'false'); });
  document.querySelectorAll('.ncard').forEach((b) => { b.setAttribute('aria-pressed', b.dataset.id === S.sel ? 'true' : 'false'); });
}
