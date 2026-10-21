// Scelta della città: salvata solo nel browser.
import { S } from '../state.js';
import { $, esc } from '../util.js';
import { CITIES, findCity, regionOf } from '../geo.js';
import { renderOggi } from './oggi.js';
import { renderCal } from './calendario.js';

let SORTED = [];
function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
export function loadCity() {
  try { const n = localStorage.getItem('citta'); if (n) { const c = findCity(n); if (c) { c.region = c.region || regionOf(c.pt); return c; } } } catch (e) { /* niente memoria */ }
  return null;
}
export function setCity(c) {
  S.city = c; if (!c.region) c.region = regionOf(c.pt);
  try { localStorage.setItem('citta', c.name); } catch (e) { /* niente memoria */ }
  $('#picker').hidden = true;
  renderOggi(); if (S.tab === 'cal') renderCal();
  const r = $('#r-city'); if (r && !r.value) r.value = c.name;
}
function fillCities(q) {
  q = norm(q.trim());
  const list = q ? SORTED.filter((c) => { const n = norm(c.name); return n.indexOf(q) === 0 || n.indexOf(' ' + q) >= 0; }) : SORTED;
  $('#citylist').innerHTML = list.map((c) => '<button type="button" data-city="' + esc(c.name) + '"' + (c.tier === 1 ? ' class="big"' : '') + '>' + esc(c.name) + (S.city && S.city.name === c.name ? '<span>La tua città</span>' : '') + '</button>').join('')
    || '<p class="note" style="padding:16px 0">Nessun capoluogo con questo nome. Scegli quello più vicino a te.</p>';
}
export function openPicker() {
  if ($('#welcome').hidden) $('#pk-dots').hidden = true;
  $('#picker-close').hidden = !S.city;
  $('#picker').hidden = false; $('#city-search').value = ''; fillCities('');
  $('#citylist').scrollTop = 0;
}
export function initCity() {
  SORTED = CITIES.slice().sort((a, b) => a.name.localeCompare(b.name, 'it'));
  $('#picker-close').addEventListener('click', () => { $('#picker').hidden = true; });
  // Sul computer, un clic fuori dalla finestra la chiude (solo se una città è già scelta).
  const veil = $('.veil'); if (veil) veil.addEventListener('click', () => { if (S.city && $('#welcome').hidden) $('#picker').hidden = true; });
  $('#city-search').addEventListener('input', (e) => fillCities(e.target.value));
  $('#citylist').addEventListener('click', (e) => { const b = e.target.closest('[data-city]'); if (b) setCity(findCity(b.dataset.city)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.city && !$('#picker').hidden) $('#picker').hidden = true; });
}
