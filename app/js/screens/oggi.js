// Schermata Oggi: striscia della settimana, carte impilate del giorno scelto, più avanti, cortei vicini.
import { S, D } from '../state.js';
import { $, esc, icon, PIN, DOWN, PLUS, reduceMotion } from '../util.js';
import { NOW, TODAY, noon, fDay, fWd3, fTime, cap, parts, addDays } from '../dates.js';
import { PRIO, tkey, status, startDay, endDay, byStart, untilText, shareHref, near, relevant } from '../events.js';
import { erow } from './common.js';

const LIGHT = { generale: 1 };
const LINE = '<svg aria-hidden="true" viewBox="0 0 360 70" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M-6 52C22 50 40 38 58 30c22-10 36 2 26 18-9 14-30 8-22-8 9-18 44-22 66-6 18 13 30 22 52 16 20-6 22-30 6-32-15-2-18 18-2 26 22 11 52-10 74-18 26-9 44 6 40 20-3 11-19 9-18-2 2-16 30-22 52-14 14 5 22 12 40 10"/></svg>';

function dayItems(d) {
  return D.events.filter((e) => {
    if (status(e).k === 'done') return false;
    if (startDay(e) > d || endDay(e) < d) return false;
    return e.group === 'cortei' ? (!S.city || near(e, 60)) : relevant(e);
  }).sort((a, b) => (status(a).r - status(b).r) || (PRIO[tkey(a)] - PRIO[tkey(b)]) || (a.t0 - b.t0));
}
function cardTime(ev, d) {
  if (status(ev).k === 'live') return 'In corso · ' + untilText(ev).toLowerCase();
  if (startDay(ev) === d) return 'Dalle ' + fTime.format(ev.t0);
  if (endDay(ev) === d) return 'Fino alle ' + fTime.format(ev.t1);
  return 'Tutto il giorno';
}
function dayName(d) { return d === TODAY ? 'Oggi' : d === addDays(TODAY, 1) ? 'Domani' : cap(fDay.format(noon(d))); }

export function renderOggi() {
  const city = S.city, name = city ? city.name : 'casa tua';
  if (!S.selDay || S.selDay < TODAY || S.selDay > addDays(TODAY, 6)) S.selDay = TODAY;
  const selDay = S.selDay;
  let html = '<div class="o-top"><button class="citybtn" type="button" data-act="city" aria-label="Cambia città, ora ' + esc(name) + '">' + PIN + esc(city ? city.name : 'Scegli la tua città') + DOWN + '</button>' +
    '<button class="roundbtn" type="button" data-act="info" aria-label="Da dove arrivano i dati">' + icon('u-info') + '</button></div>' +
    '<div><div class="o-date">' + esc(cap(fDay.format(NOW))) + '</div><h1 class="o-title">Oggi a ' + esc(name) + '</h1></div>';
  html += '<div class="wk" role="group" aria-label="Prossimi sette giorni">';
  for (let i = 0; i < 7; i++) {
    const d = addDays(TODAY, i), its = dayItems(d), keys = [];
    its.forEach((e) => { const k = tkey(e); if (keys.indexOf(k) < 0) keys.push(k); });
    keys.sort((a, b) => PRIO[a] - PRIO[b]);
    html += '<button class="wd" type="button" data-day="' + d + '" aria-pressed="' + (d === selDay) + '" aria-label="' + esc(dayName(d) + (its.length ? ', ' + its.length + (its.length === 1 ? ' evento' : ' eventi') : ', niente')) + '">' +
      '<small>' + (i === 0 ? 'oggi' : esc(fWd3.format(noon(d)).replace('.', ''))) + '</small><b>' + parts(d).d + '</b>' +
      '<span class="dots">' + keys.slice(0, 3).map((k) => '<i style="--c:var(--c-' + k + ')"></i>').join('') + '</span></button>';
  }
  html += '</div>';
  const items = dayItems(selDay);
  if (items.length) {
    const front = items.find((e) => e.id === S.frontId) || items[0];
    const rest = items.filter((e) => e !== front);
    html += '<section class="stack" aria-label="' + esc(dayName(selDay)) + '">' + rest.map((e) => {
      const k = tkey(e);
      return '<button class="sc band' + (LIGHT[k] ? ' light' : '') + '" type="button" data-id="' + esc(e.id) + '" data-front="' + esc(e.id) + '" style="--s:var(--s-' + k + ')">' +
        '<span class="bk"><span>' + esc(e.modeLabel || '') + ' · ' + esc(e.national ? 'Tutta Italia' : e.place) + '</span><span>' + esc(cardTime(e, selDay)) + '</span></span><b>' + esc(e.title) + '</b></button>';
    }).join('');
    const fk = tkey(front), corteo = front.group === 'cortei';
    html += '<div class="sc full' + (LIGHT[fk] ? ' light' : '') + '" data-id="' + esc(front.id) + '" style="--s:var(--s-' + fk + ')">' +
      '<div class="k"><span>' + esc(front.modeLabel || '') + '</span><em>' + esc(cardTime(front, selDay)) + '</em></div>' +
      '<h2>' + esc(front.title) + '</h2><p class="pl">' + esc(front.national ? 'In tutta Italia' : front.place) + '</p>' +
      (front.hours ? '<div class="bx"><b>Orari</b>' + esc(front.hours) + '</div>' : '') +
      (front.note ? '<div class="bx"><b>Da sapere</b>' + esc(front.note) + '</div>' : '') +
      '<div class="act"><button class="primary" type="button" data-open="' + esc(front.id) + '">' + (corteo ? 'Dove e quando' : 'Cosa si ferma') + '</button>' +
      '<a href="' + shareHref(front) + '" target="_blank" rel="noopener noreferrer" aria-label="Condividi su WhatsApp">' + icon('u-share') + '</a></div></div></section>';
    if (rest.length) html += '<p class="stack-n">Tocca una carta per vederla.</p>';
  } else {
    const later = D.events.filter((e) => e.group !== 'cortei' && !e.national && relevant(e) && startDay(e) > selDay).sort(byStart)[0];
    html += '<section class="quiet"><h2>' + esc(selDay === TODAY ? 'Oggi a ' + name + ' non risultano scioperi.' : dayName(selDay) + ' a ' + name + ' non risultano scioperi.') + '</h2>' +
      (later ? '<p>Il prossimo in zona: ' + esc(later.title) + ', ' + esc(fDay.format(noon(startDay(later)))) + '.</p>' : '') + LINE + '</section>';
  }
  const horizon = addDays(TODAY, 6);
  const upcoming = D.events.filter((e) => e.group !== 'cortei' && relevant(e) && startDay(e) > horizon).sort(byStart).slice(0, 4);
  html += '<section><div class="sec-h"><h3>Più avanti</h3><button class="linkbtn" type="button" data-act="cal">Calendario</button></div>' +
    (upcoming.length ? upcoming.map(erow).join('') : '<p class="note">Niente in calendario oltre questa settimana.</p>') + '</section>';
  const piazza = D.events.filter((e) => e.group === 'cortei' && status(e).k !== 'done' && (!S.city || near(e, 60))).sort(byStart).slice(0, 3);
  html += '<section class="piazza"><div class="piazza-k"><svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-corteo"/></svg>In piazza vicino a te</div>' +
    (piazza.length ? '<div>' + piazza.map(erow).join('') + '</div>' : '<p class="note" style="margin:0">Nessun corteo segnalato vicino a ' + esc(name) + ' nei prossimi giorni.</p>') +
    '<div class="pill-btns"><button class="softbtn mobile-only" type="button" data-act="mappa">Vedi sulla mappa</button><button class="softbtn" type="button" data-act="segnala">' + PLUS + 'Aggiungi corteo</button></div></section>';
  html += '<p class="o-foot"><a href="https://scioperioggi.com/privacy.html">Privacy</a> · Niente account, niente pubblicità.</p>';
  $('#oggi').innerHTML = html;
}

// Carte: quella toccata scivola fuori dalla pila e si apre davanti.
export function bringFront(id) {
  const before = {};
  document.querySelectorAll('.stack [data-id]').forEach((el) => { before[el.dataset.id] = el.getBoundingClientRect(); });
  S.frontId = id; renderOggi();
  if (reduceMotion || !Element.prototype.animate) return;
  const ease = 'cubic-bezier(.22,.8,.24,1)';
  document.querySelectorAll('.stack [data-id]').forEach((el) => {
    const b = before[el.dataset.id]; if (!b) return;
    const a = el.getBoundingClientRect(), dy = b.top - a.top;
    if (el.dataset.id === id) {
      const cut = Math.max(0, a.height - b.height);
      el.animate([
        { transform: 'translateY(' + dy + 'px)', clipPath: 'inset(0 0 ' + cut + 'px 0 round 24px)' },
        { transform: 'translateY(-10px) scale(1.015)', clipPath: 'inset(0 0 0 0 round 24px)', offset: 0.6 },
        { transform: 'none', clipPath: 'inset(0 0 0 0 round 24px)' },
      ], { duration: 520, easing: ease });
      el.querySelectorAll('.pl,.bx,.act').forEach((c, i) => {
        c.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 160 + i * 40, easing: ease, fill: 'backwards' });
      });
    } else if (dy) {
      el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 460, easing: ease });
    }
  });
}
