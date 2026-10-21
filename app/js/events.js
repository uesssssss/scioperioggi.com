// Gli eventi: lettura dei dati, colore per tipo, date, stato (in corso, oggi, domani...).
import { S, D } from './state.js';
import { NOW, TODAY, ymd, noon, fDay, fWd, fMon, fTime, cap, parts, dayDiff } from './dates.js';
import { project, KM_PER_UNIT } from './geo.js';

export const GROUPS = { generale: 'Sciopero generale', trasporti: 'Trasporti', servizi: 'Scuola e servizi', merci: 'Merci', cortei: 'Cortei e presidi' };
export const TINT = { Nazionale: 1, Regionale: 1, Territoriale: 1, Provinciale: 1, Interregionale: 1 };
export const PRIO = { generale: 0, treno: 1, bus: 2, aereo: 3, nave: 4, servizi: 5, merci: 6, corteo: 7 };

export function initEvents(DATA) {
  D.events = DATA.events.map((e) => {
    const ev = Object.assign({}, e);
    ev.t0 = new Date(e.start); ev.t1 = new Date(e.end);
    ev.national = e.regions === 'all';
    ev.pt = (e.lat != null && e.lon != null) ? project(e.lon, e.lat) : null;
    return ev;
  });
  // Senza prototipo: un link come #constructor non trova niente invece di dare errore.
  D.byId = Object.create(null); D.events.forEach((e) => { D.byId[e.id] = e; });
}

// Un colore per tipo: treni, bus, aerei, porti, scuola e servizi, merci, sciopero generale, cortei.
export function tkey(ev) {
  if (ev.group === 'generale') return 'generale';
  if (ev.group === 'cortei') return 'corteo';
  const m = ev.mode;
  if (m === 'treno' || m === 'bus' || m === 'aereo' || m === 'nave') return m;
  if (m === 'camion' || m === 'strada') return 'merci';
  return 'servizi';
}
export function shareUrl(ev) { return (D.DATA.shareUrl || location.href.split('#')[0]) + '#' + ev.id; }
export function startDay(ev) { return ev.day || ymd(ev.t0); }
export function endDay(ev) { const e = ymd(ev.t1), s = startDay(ev); return e < s ? s : e; }
export function whenText(ev) {
  const a = startDay(ev), b = endDay(ev);
  if (a === b) return cap(fDay.format(noon(a)));
  const A = parts(a), B = parts(b);
  if (A.m === B.m) return 'Da ' + fWd.format(noon(a)) + ' ' + A.d + ' a ' + fWd.format(noon(b)) + ' ' + B.d + ' ' + fMon.format(noon(b));
  return 'Da ' + fDay.format(noon(a)) + ' a ' + fDay.format(noon(b));
}
export function status(ev) {
  if (NOW > ev.t1) return { k: 'done', t: 'Concluso', r: 4 };
  if (NOW >= ev.t0) return { k: 'live', t: 'In corso', r: 0 };
  const n = dayDiff(TODAY, startDay(ev));
  if (n <= 0) return { k: 'today', t: 'Oggi', r: 1 };
  if (n === 1) return { k: 'soon', t: 'Domani', r: 2 };
  if (n < 14) return { k: 'soon', t: 'Tra ' + n + ' giorni', r: 2 };
  if (n < 56) return { k: 'later', t: 'Tra ' + Math.round(n / 7) + ' settimane', r: 3 };
  return { k: 'later', t: 'Tra ' + Math.round(n / 30) + ' mesi', r: 3 };
}
export function byStart(a, b) { return a.t0 - b.t0 || a.title.localeCompare(b.title); }
export function byPriority(a, b) { return status(a).r - status(b).r || a.t0 - b.t0; }
export function untilText(ev) {
  if (ymd(ev.t1) === TODAY) return 'Fino alle ' + fTime.format(ev.t1);
  return 'Fino a ' + fWd.format(ev.t1) + ' alle ' + fTime.format(ev.t1);
}
export function shareHref(ev) { return 'https://wa.me/?text=' + encodeURIComponent(ev.title + ' · ' + whenText(ev) + ' · ' + (ev.national ? 'Tutta Italia' : ev.place) + '\n' + shareUrl(ev)); }

// Filtri della mappa.
function groupOn(g) { return !Object.keys(S.groups).length || S.groups[g]; }
function inTime(ev) {
  if (S.time === 'today') return startDay(ev) <= TODAY && endDay(ev) >= TODAY;
  if (S.time === 'week') return ev.t1 >= NOW && ev.t0 <= new Date(+NOW + 7 * 864e5);
  return +ev.t1 >= +NOW - 10 * 864e5;
}
export function visible() { return D.events.filter((e) => inTime(e) && groupOn(e.group)); }

// Cosa riguarda la città scelta: nazionale, regionale solo nella sua regione, il resto entro 35 km.
export function near(ev, km) { const c = S.city; return ev.pt && c && Math.hypot(ev.pt[0] - c.pt[0], ev.pt[1] - c.pt[1]) * KM_PER_UNIT < km; }
function sameRegion(ev) { return Array.isArray(ev.regions) && ev.regions.indexOf(S.city.region) >= 0; }
export function relevant(ev) {
  const c = S.city;
  if (!c || ev.national) return true;
  if (ev.scope === 'Regionale') return sameRegion(ev);
  return near(ev, 35);
}
// Cortei: entro 60 km nella stessa regione, entro 35 km oltre il confine.
export function nearCorteo(ev) { return !S.city || near(ev, sameRegion(ev) ? 60 : 35); }
