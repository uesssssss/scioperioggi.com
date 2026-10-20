// Dove guarda la mappa: spazio libero tra intestazione, striscia e scheda, adattamento all'Italia, zoom con d3.
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';
import { easeCubicOut } from 'd3-ease';
import { S, D } from '../state.js';
import { $, mqWide, mqDesk, reduceMotion } from '../util.js';
import { ITALY, KM_PER_UNIT } from '../geo.js';
import { draw } from './canvas.js';
import { recluster } from './pins.js';
import { isOpen } from '../sheet.js';

const stage = $('#stage'), sheet = $('#sheet'), strip = $('#strip'), topBar = $('#top');
let reTimer = null;

function safeTop() { return Math.max(0, (parseFloat(getComputedStyle(topBar).paddingTop) || 10) - 10); }
export function freeRect() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const top = topBar.classList.contains('away') ? safeTop() + 10 : topBar.querySelector('.panel').getBoundingClientRect().bottom + 8;
  let left = 10, right = vw - 10, bottom = vh - 10;
  // Sul computer la colonna di sinistra copre la mappa: si parte dal suo bordo.
  if (mqDesk.matches) { const col = $('.view:not([hidden])'); if (col) left = col.getBoundingClientRect().right + 10; }
  if (isOpen()) {
    if (mqWide.matches) right = sheet.offsetLeft - 12; else bottom = sheet.offsetTop - 10;
  } else if (!strip.classList.contains('away') && !strip.hidden) {
    bottom = strip.offsetTop + strip.querySelector('.ncards').offsetTop - 6;
  }
  const tb = document.querySelector('.tabbar');
  if (tb && !isOpen() && !mqDesk.matches) bottom = Math.min(bottom, tb.getBoundingClientRect().top - 10);
  const below = { x: left, y: top, w: Math.max(80, right - left), h: Math.max(80, bottom - top) };
  // Su schermi larghi l'intestazione è un riquadro in un angolo: la mappa può usare tutta l'altezza accanto.
  if (mqWide.matches && !topBar.classList.contains('away')) {
    const pr = topBar.querySelector('.panel').getBoundingClientRect();
    const side = { x: pr.right + 10, y: safeTop() + 10, w: Math.max(80, right - pr.right - 10), h: Math.max(80, bottom - safeTop() - 10) };
    const score = (r) => Math.min(r.w / (ITALY[2] - ITALY[0]), r.h / (ITALY[3] - ITALY[1]));
    if (score(side) > score(below)) return side;
  }
  return below;
}
export function fitT(box, pad, kMax) {
  const r = freeRect(), bw = box[2] - box[0], bh = box[3] - box[1];
  let k = Math.min((r.w - 2 * pad) / bw, (r.h - 2 * pad) / bh);
  if (kMax) k = Math.min(k, kMax);
  return { k, x: r.x + r.w / 2 - k * (box[0] + bw / 2), y: r.y + r.h / 2 - k * (box[1] + bh / 2) };
}
export function centerT(pt, k) {
  const r = freeRect();
  return { k, x: r.x + r.w / 2 - k * pt[0], y: r.y + r.h / 2 - k * pt[1] };
}
export function setT(t, animate) {
  const zt = zoomIdentity.translate(t.x, t.y).scale(t.k), sel = select(stage);
  if (animate && !reduceMotion) sel.transition().duration(520).ease(easeCubicOut).call(S.zoom.transform, zt);
  else sel.call(S.zoom.transform, zt);
}
export function interruptZoom() { select(stage).interrupt(); }

const scaleBar = $('#scale-bar'), scaleLbl = $('#scale-lbl');
function updateScale() {
  const kmPx = KM_PER_UNIT / S.T.k;
  let km = 5;
  [5, 10, 20, 50, 100, 200, 500].forEach((s) => { if (s / kmPx <= 96) km = s; });
  scaleBar.style.width = Math.round(km / kmPx) + 'px';
  scaleLbl.textContent = km + ' km';
}
export function render() {
  draw();
  const T = S.T;
  for (const c of S.clusters) c.el.style.transform = 'translate(' + (T.x + T.k * c.pt[0]).toFixed(1) + 'px,' + (T.y + T.k * c.pt[1]).toFixed(1) + 'px)';
  updateScale();
}
export function initZoom() {
  const T0 = fitT(ITALY, 8);
  S.kFit = T0.k;
  S.zoom = d3zoom()
    .scaleExtent([S.kFit * 0.98, S.kFit * 10])
    .translateExtent([[-D.GEO.w * 4, -D.GEO.h * 3], [D.GEO.w * 5, D.GEO.h * 4]])
    .on('start', () => { clearTimeout(reTimer); document.body.classList.add('moving'); })
    .on('zoom', (e) => { S.T = e.transform; if (e.sourceEvent) { S.touched = true; S.movedByUser = true; } render(); })
    .on('end', () => {
      clearTimeout(reTimer);
      reTimer = setTimeout(() => { document.body.classList.remove('moving'); recluster(); }, 90);
    });
  select(stage).call(S.zoom);
  setT(T0, false);
}
// Riadatta all'Italia intera finché l'utente non ha toccato la mappa.
export function refit(force) {
  if (!S.zoom) return;
  if ((!S.touched || force) && !isOpen()) {
    const t = fitT(ITALY, 8);
    S.kFit = t.k; S.zoom.scaleExtent([S.kFit * 0.98, S.kFit * 10]);
    setT(t, !!force);
  }
}
