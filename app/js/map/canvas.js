// La mappa è disegnata su un canvas: un ridisegno leggero per fotogramma tiene fluidi spostamento e zoom.
import { S, D } from '../state.js';
import { $ } from '../util.js';
import { CITIES, P2 } from '../geo.js';
import { tkey, TINT } from '../events.js';

const cv = $('#cv'), g2d = cv.getContext('2d');
const COL = {};
let DPR = 1;
const WCACHE = {};
let FONTS = null;

export function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['shore', 'land', 'border', 'coast', 'grid'].forEach((n) => { COL[n] = cs.getPropertyValue('--' + n).trim(); });
  COL.ink = cs.getPropertyValue('--ink').trim(); COL.ink2 = cs.getPropertyValue('--ink-2').trim(); COL.ink3 = cs.getPropertyValue('--ink-3').trim();
  const fam = getComputedStyle(document.body).fontFamily;
  FONTS = { r: '600 12px ' + fam, rh: '700 12.5px ' + fam, p: '500 10.5px ' + fam, ph: '700 11px ' + fam };
}
export function sizeCanvas() {
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = Math.round(window.innerWidth * DPR); cv.height = Math.round(window.innerHeight * DPR);
  cv.style.width = window.innerWidth + 'px'; cv.style.height = window.innerHeight + 'px';
}
export function draw() {
  const T = S.T, hl = S.hl;
  g2d.setTransform(1, 0, 0, 1, 0, 0);
  g2d.clearRect(0, 0, cv.width, cv.height);
  g2d.setTransform(DPR * T.k, 0, 0, DPR * T.k, DPR * T.x, DPR * T.y);
  const px = 1 / T.k;
  g2d.lineJoin = 'round';
  g2d.strokeStyle = COL.grid; g2d.lineWidth = px; g2d.stroke(P2.grat);
  g2d.strokeStyle = COL.shore; g2d.lineWidth = 9 * px; g2d.stroke(P2.land);
  g2d.fillStyle = COL.land; g2d.fill(P2.land);
  if (hl) {
    g2d.globalAlpha = 0.2; g2d.fillStyle = hl.color;
    P2.regions.forEach((r) => { if (hl.all || hl.names.indexOf(r.name) >= 0) g2d.fill(r.p); });
    g2d.globalAlpha = 1;
  }
  g2d.strokeStyle = COL.border; g2d.lineWidth = 0.9 * px; g2d.stroke(P2.inner);
  g2d.strokeStyle = COL.coast; g2d.lineWidth = 1.1 * px; g2d.stroke(P2.land);
  drawLabels();
}

// Ogni nome prova a destra, a sinistra, sopra e sotto il suo punto e salta se coprirebbe un segnaposto o un altro nome.
// Una città nascosta sotto il proprio segnaposto ha il nome accanto al segnaposto. I capoluoghi di provincia compaiono zoomando.
function drawLabels() {
  const T = S.T;
  const z = T.k / S.kFit, fadeP = Math.max(0, Math.min(1, (z - 2.0) / 0.7));
  const W = window.innerWidth, H = window.innerHeight, pins = [], boxes = [];
  S.clusters.forEach((c) => {
    const x = T.x + T.k * c.pt[0], y = T.y + T.k * c.pt[1], b = [x - 18, y - 18, x + 18, y + 18];
    pins.push(b); boxes.push(b);
  });
  const hit = (b) => boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  const under = (x, y) => pins.find((o) => x > o[0] - 3 && x < o[2] + 3 && y > o[1] - 3 && y < o[3] + 3) || null;
  const order = CITIES.filter((c) => c.tier === 1 || c.hot || fadeP > 0).sort((a, b) => (b.hot - a.hot) || (a.tier - b.tier));
  g2d.setTransform(DPR, 0, 0, DPR, 0, 0);
  g2d.textBaseline = 'middle';
  g2d.lineJoin = 'round';
  order.forEach((c) => {
    const x = T.x + T.k * c.pt[0], y = T.y + T.k * c.pt[1];
    if (x < -80 || y < -20 || x > W + 80 || y > H + 20) return;
    const key = (c.tier === 1 ? 'r' : 'p') + (c.hot ? 'h' : ''), font = FONTS[key];
    g2d.font = font;
    const w = WCACHE[key + c.name] || (WCACHE[key + c.name] = g2d.measureText(c.name).width);
    const h = c.tier === 1 ? 14 : 12, pin = under(x, y);
    let cand, dot = null;
    if (pin) {
      // Un nome per segnaposto: la città dell'evento se c'è, altrimenti un capoluogo di regione.
      if (pin.named || !(c.hot || c.tier === 1)) return;
      const cx = (pin[0] + pin[2]) / 2, cy = (pin[1] + pin[3]) / 2;
      cand = [[pin[2] + 3, cy - h / 2], [pin[0] - 3 - w, cy - h / 2], [cx - w / 2, pin[3] + 2], [cx - w / 2, pin[1] - 2 - h]];
    } else {
      dot = [x - 2.5, y - 2.5, x + 2.5, y + 2.5];
      cand = [[x + 6, y - h / 2], [x - 6 - w, y - h / 2], [x - w / 2, y - 7 - h], [x - w / 2, y + 7]];
    }
    for (let i = 0; i < cand.length; i++) {
      const bx = [cand[i][0] - 2, cand[i][1] - 1, cand[i][0] + w + 2, cand[i][1] + h + 1];
      if (bx[0] < 4 || bx[2] > W - 4 || hit(bx)) continue;
      boxes.push(bx); if (dot) boxes.push(dot); if (pin) pin.named = true;
      g2d.globalAlpha = (c.tier === 2 && !c.hot) ? fadeP : 1;
      const col = c.hot ? COL.ink : (c.tier === 1 ? COL.ink2 : COL.ink3);
      if (dot) { g2d.fillStyle = col; g2d.beginPath(); g2d.arc(x, y, c.tier === 1 ? 2.6 : 1.8, 0, Math.PI * 2); g2d.fill(); }
      g2d.strokeStyle = COL.land; g2d.lineWidth = 3.5; g2d.strokeText(c.name, cand[i][0], cand[i][1] + h / 2);
      g2d.fillStyle = col; g2d.fillText(c.name, cand[i][0], cand[i][1] + h / 2);
      g2d.globalAlpha = 1;
      return;
    }
  });
}

export function tinted(ev) { return ev && (ev.national || TINT[ev.scope]); }
export function highlight(ev) {
  S.hl = tinted(ev) ? { color: getComputedStyle(document.documentElement).getPropertyValue('--c-' + tkey(ev)).trim(), all: ev.national, names: ev.national ? [] : ev.regions } : null;
  draw();
}
export function onThemeChange() {
  readColors();
  if (S.hl && S.sel && D.byId[S.sel]) highlight(D.byId[S.sel]); else draw();
}
