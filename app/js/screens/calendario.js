// Calendario: la città scelta (solo eventi locali) oppure tutta Italia.
import { S, D } from '../state.js';
import { $, esc } from '../util.js';
import { NOW, TODAY, noon, fDay } from '../dates.js';
import { byStart, startDay, relevant } from '../events.js';
import { erow } from './common.js';

export function renderCal() {
  const list = D.events.filter((e) => +e.t1 >= +NOW - 864e5 && (S.calScope === 'all' || (!e.national && relevant(e)))).sort(byStart), days = [], map = {};
  list.forEach((ev) => { let d = startDay(ev); if (d < TODAY) d = TODAY; if (!map[d]) { map[d] = []; days.push(d); } map[d].push(ev); });
  days.sort();
  const cn = S.city ? S.city.name : 'La mia città';
  $('#cal').innerHTML = '<h1 class="p-title">Calendario</h1>' +
    '<div class="seg2" role="group" aria-label="Quali eventi"><button type="button" data-scope="city" aria-pressed="' + (S.calScope === 'city') + '">' + esc(cn) + '</button><button type="button" data-scope="all" aria-pressed="' + (S.calScope === 'all') + '">Tutta Italia</button></div>' +
    (days.length ? days.map((d) => '<section class="cal-day"><h4>' + esc(d === TODAY ? 'Oggi, ' + fDay.format(noon(d)) : fDay.format(noon(d))) + '</h4>' + map[d].map(erow).join('') + '</section>').join('')
      : '<p class="note">' + (S.calScope === 'city' ? 'Niente in calendario a ' + esc(cn) + '. Guarda "Tutta Italia" per gli scioperi nazionali.' : 'Niente in calendario.') + '</p>');
}
