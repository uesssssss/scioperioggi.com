// Striscia in basso con gli scioperi in tutta Italia, filtri dell'intestazione e riga di stato.
import { S, D } from '../state.js';
import { $, esc } from '../util.js';
import { MON3, parts, fDate } from '../dates.js';
import { visible, byStart, status, tkey, startDay, endDay } from '../events.js';
import { recluster } from './pins.js';
import { isOpen, openDetail, openCalendar } from '../sheet.js';

const strip = $('#strip');

export function flap(day1, day2) {
  const A = parts(day1), B = parts(day2 || day1), multi = day2 && day2 !== day1;
  return '<span class="flap' + (multi ? ' wide' : '') + '" aria-hidden="true"><b>' + (multi ? A.d + '–' + B.d : A.d) + '</b><i>' + MON3[(multi ? B : A).m - 1] + '</i></span>';
}
export function drawStrip() {
  const nats = visible().filter((e) => e.national).sort(byStart), box = $('#ncards');
  $('#nat-count').textContent = nats.length;
  $('#nat-label').textContent = nats.length === 1 ? 'sciopero in tutta Italia' : 'scioperi in tutta Italia';
  box.textContent = '';
  strip.hidden = nats.length === 0;
  nats.forEach((ev) => {
    const st = status(ev), b = document.createElement('button');
    b.type = 'button';
    b.className = 'ncard' + (st.k === 'done' ? ' done' : '');
    b.dataset.id = ev.id;
    b.style.setProperty('--c', 'var(--c-' + tkey(ev) + ')');
    b.setAttribute('aria-pressed', ev.id === S.sel ? 'true' : 'false');
    b.innerHTML = flap(startDay(ev), endDay(ev)) + '<span class="txt"><span class="t">' + esc(ev.title) + '</span><span class="s"><span class="dot"></span>' + esc(ev.modeLabel) + ' · ' + esc(st.t) + '</span></span>';
    b.addEventListener('click', () => { openDetail(ev, null, b); });
    box.appendChild(b);
  });
  syncStripH();
}
export function syncStripH() {
  const gone = strip.hidden || strip.classList.contains('away');
  document.documentElement.style.setProperty('--strip-h', gone ? 'calc(env(safe-area-inset-bottom, 0px) + 4px)' : strip.offsetHeight + 'px');
}

export function syncChips() {
  document.querySelectorAll('[data-time]').forEach((b) => { b.setAttribute('aria-checked', b.dataset.time === S.time ? 'true' : 'false'); });
  document.querySelectorAll('[data-group]').forEach((b) => { b.setAttribute('aria-pressed', S.groups[b.dataset.group] ? 'true' : 'false'); });
}
export function meta() {
  const list = visible(), open = list.filter((e) => status(e).k !== 'done').length;
  const lead = S.time === 'today' ? (open + (open === 1 ? ' evento oggi' : ' eventi oggi'))
    : S.time === 'week' ? (open + ' nei prossimi 7 giorni')
    : (open + ' in calendario');
  $('#meta').textContent = lead + ' · aggiornato il ' + fDate.format(new Date(D.DATA.updated));
  $('#empty').hidden = list.length > 0;
}
function refresh() {
  drawStrip(); recluster(); meta();
  if (isOpen() && S.ctx && S.ctx.kind === 'calendar' && !S.sel) openCalendar(null);
}
export function initFilters() {
  document.querySelectorAll('[data-time]').forEach((b) => {
    b.addEventListener('click', () => { S.time = b.dataset.time; syncChips(); refresh(); });
  });
  document.querySelectorAll('[data-group]').forEach((b) => {
    b.addEventListener('click', () => { const g = b.dataset.group; if (S.groups[g]) delete S.groups[g]; else S.groups[g] = true; syncChips(); refresh(); });
  });
  $('#btn-reset').addEventListener('click', () => { S.time = 'all'; S.groups = {}; syncChips(); refresh(); });
}
