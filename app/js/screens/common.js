// Riga evento usata in Oggi, Calendario e "In piazza vicino a te".
import { esc } from '../util.js';
import { MON3, parts } from '../dates.js';
import { status, tkey, startDay } from '../events.js';

export function erow(ev) {
  const st = status(ev), d = parts(startDay(ev));
  return '<button class="erow' + (st.k === 'done' ? ' done' : '') + '" type="button" data-open="' + esc(ev.id) + '" style="--c:var(--c-' + tkey(ev) + ')">' +
    '<span class="dt"><b>' + d.d + '</b><i>' + MON3[d.m - 1] + '</i></span>' +
    '<span class="tx"><b>' + esc(ev.title) + '</b><span><i></i>' + esc(ev.national ? 'Tutta Italia' : ev.place) + ' · ' + esc(st.t) + '</span></span>' +
    '<svg class="chev" aria-hidden="true"><use href="#u-right"/></svg></button>';
}
