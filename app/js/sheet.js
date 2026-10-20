// Scheda che sale dal basso (pannello a destra su schermi larghi): dettaglio evento, gruppo, calendario, informazioni.
import { S, D } from './state.js';
import { $, esc, icon, mqWide } from './util.js';
import { MON3, parts, noon, fDay, fWd, fDate, fTime, cap } from './dates.js';
import { unionBox } from './geo.js';
import { GROUPS, tkey, status, startDay, endDay, whenText, shareUrl, byStart, visible } from './events.js';
import { highlight, tinted } from './map/canvas.js';
import { fitT, centerT, setT, interruptZoom } from './map/view.js';
import { markSel, clusterTitle, placesOf } from './map/pins.js';
import { flap, syncStripH } from './map/strip.js';

const sheet = $('#sheet'), sheetBody = $('#sheet-body'), strip = $('#strip'), topBar = $('#top'), mapctl = $('#mapctl');

export function isOpen() { return sheet.classList.contains('open'); }
function showSheet(html, trigger, size) {
  sheetBody.innerHTML = html;
  sheetBody.scrollTop = 0;
  sheet.classList.toggle('full', size === 'full');
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  strip.classList.add('away');
  mapctl.classList.add('away');
  if (!mqWide.matches) topBar.classList.add('away');
  if (trigger) S.lastTrigger = trigger;
  const h = sheetBody.querySelector('h2');
  if (h) h.setAttribute('tabindex', '-1');
  if (h && S.kbd) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
}
export function closeSheet() {
  if (!isOpen()) return;
  interruptZoom();
  sheet.classList.remove('open', 'full');
  sheet.setAttribute('aria-hidden', 'true');
  strip.classList.remove('away');
  mapctl.classList.remove('away');
  topBar.classList.remove('away');
  S.sel = null; S.ctx = null;
  highlight(null); markSel(); syncStripH();
  // Il punto su cui avevamo zoomato torna al centro della mappa libera, lontano da intestazione e striscia.
  if (S.focusPt && !S.movedByUser) setT(centerT(S.focusPt, S.T.k), true);
  S.focusPt = null;
  if (S.kbd && S.lastTrigger && document.body.contains(S.lastTrigger)) { try { S.lastTrigger.focus({ preventScroll: true }); } catch (e) { /* niente */ } }
}
function focusOn(ev) {
  if (ev.national) return; // eventi nazionali: la mappa resta dov'è
  let t;
  if (tinted(ev) && Array.isArray(ev.regions)) {
    const box = unionBox(ev.regions);
    t = fitT(box, 26, S.kFit * 5);
    S.focusPt = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
  } else {
    t = centerT(ev.pt, Math.min(Math.max(S.T.k, S.kFit * 2.6), S.kFit * 8));
    S.focusPt = ev.pt;
  }
  S.movedByUser = false;
  setT(t, true);
}

function poster(ev) {
  const a = startDay(ev), b = endDay(ev), A = parts(a), B = parts(b), multi = a !== b;
  const g = (status(ev).k === 'done' && ev.group !== 'cortei') ? 'done' : tkey(ev);
  return '<div class="card poster" style="--pc:var(--p-' + g + ');--pi:#FFFFFF">' +
    '<span class="k">' + esc(ev.kicker) + '</span>' +
    '<span class="d"><b class="' + (multi ? 'multi' : '') + '">' + (multi ? A.d + '–' + B.d : A.d) + '</b><span>' + MON3[(multi ? B : A).m - 1] + '</span></span>' +
    '<span class="f"><span class="pl">' + esc(ev.national ? 'Tutta Italia' : ev.place) + '</span><span>' + esc(cap(fWd.format(noon(a)))) + '</span></span>' +
    '<svg class="bigicon" aria-hidden="true"><use href="#i-' + ev.mode + '"/></svg></div>';
}
function srcCard(s) {
  let host = '';
  try { host = new URL(s.url).hostname.replace(/^www\./, ''); } catch (e) { /* niente */ }
  return '<a class="card src" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
    '<span class="kind">' + esc(s.kind) + '</span><span class="pub">' + esc(s.pub) + '</span>' +
    '<span class="lbl">' + esc(s.label) + '</span>' +
    '<span class="dom"><span>' + esc(host) + '</span><span class="go">Apri ↗</span></span></a>';
}
function rowHtml(ev) {
  const st = status(ev);
  return '<button class="row' + (ev.group === 'cortei' ? ' corteo' : (st.k === 'done' ? ' done' : '')) + '" type="button" data-id="' + esc(ev.id) + '" style="--c:var(--c-' + tkey(ev) + ')">' +
    '<span class="ic">' + icon('i-' + ev.mode) + '</span>' +
    '<span class="txt"><span class="t">' + esc(ev.title) + '</span><span class="s">' + esc(ev.national ? 'Tutta Italia' : ev.place) + ' · ' + esc(st.t) + '</span></span>' +
    '<svg class="chev" aria-hidden="true"><use href="#u-right"/></svg></button>';
}
function closeBtn() { return '<button class="x" type="button" data-act="close" aria-label="Chiudi">' + icon('u-x') + '</button>'; }

export function openDetail(ev, back, trigger) {
  S.sel = ev.id; markSel(); highlight(ev);
  const st = status(ev), corteo = ev.group === 'cortei';
  const shareRow = '<a class="sharebtn" href="https://wa.me/?text=' + encodeURIComponent(ev.title + ' · ' + whenText(ev) + ' · ' + (ev.national ? 'Tutta Italia' : ev.place) + '\n' + shareUrl(ev)) + '" target="_blank" rel="noopener noreferrer">Invia su WhatsApp</a>' +
    '<button class="sharebtn" type="button" data-act="copy" data-link="' + esc(shareUrl(ev)) + '">Copia link</button>';
  const srcs = (ev.src || []).map((k) => D.DATA.sources[k]).filter(Boolean);
  const html = '<div class="sh-head">' +
    (back ? '<button class="back" type="button" data-act="back">' + icon('u-left') + esc(back.label) + '</button>' : '') +
    '<span class="tag" style="--c:var(--c-' + tkey(ev) + ')">' + icon('i-' + ev.mode) + esc(ev.modeLabel) + '</span>' +
    '<span class="status ' + st.k + '">' + (st.k === 'live' ? '<i class="ld"></i>' : '') + esc(st.t) + '</span>' +
    '<button class="x sh" type="button" data-act="share" aria-label="Condividi" aria-expanded="false">' + icon('u-share') + '</button>' + closeBtn() + '</div>' +
    '<div class="share" hidden>' + shareRow + '</div>' +
    '<div class="carousel" aria-label="Locandina e articoli">' + poster(ev) + srcs.map(srcCard).join('') + '</div>' +
    '<h2 class="ev-title" id="sheet-title">' + esc(ev.title) + '</h2>' +
    '<p class="ev-when">' + esc(whenText(ev)) + '</p>' +
    '<p class="ev-where">' + esc(ev.national ? 'Tutta Italia' : ev.place) + '</p>' +
    '<p class="ev-sum">' + esc(ev.summary) + '</p>' +
    (ev.note ? '<p class="ev-note">' + esc(ev.note) + '</p>' : '') +
    '<dl class="facts">' +
    '<div><dt>' + (corteo ? 'Percorso' : 'Orari') + '</dt><dd>' + esc(ev.hours) + '</dd></div>' +
    '<div><dt>' + (corteo ? 'In piazza' : 'Proclamato da') + '</dt><dd>' + esc(ev.who) + '</dd></div>' +
    '<div><dt>Ambito</dt><dd>' + esc(ev.scope) + ' · ' + esc(GROUPS[ev.group]) + '</dd></div>' +
    (ev.proclaimed ? '<div><dt>Proclamato il</dt><dd>' + esc(fDate.format(noon(ev.proclaimed))) + '</dd></div>' : '') +
    '<div><dt>Verificato il</dt><dd>' + esc(fDate.format(new Date(ev.checked || D.DATA.updated))) + '</dd></div>' +
    '</dl>' +
    '<p class="foot">' + (st.k === 'done'
      ? 'Foto e cronache della giornata sono negli articoli: scorri la locandina verso destra.'
      : 'Uno sciopero può essere revocato o spostato fino all’ultimo: prima di muoverti controlla gli avvisi dell’azienda o della scuola.') + '</p>';
  showSheet(html, trigger);
  S.ctx = back ? back.ctx : null;
  requestAnimationFrame(() => focusOn(ev));
}
export function openCluster(items, trigger) {
  S.sel = null; markSel(); highlight(null);
  const list = items.slice().sort(byStart), title = clusterTitle(items);
  showSheet('<div class="sh-head"><span class="tag">' + esc(placesOf(list)) + '</span>' + closeBtn() + '</div>' +
    '<h2 class="sh-title" id="sheet-title">' + esc(title) + '</h2>' +
    '<p class="sh-sub">Tocca un evento per vedere locandina, articoli e dettagli.</p>' +
    '<div class="rows">' + list.map(rowHtml).join('') + '</div>', trigger);
  S.ctx = { kind: 'cluster', items, label: title };
  const pt = list[0].pt;
  requestAnimationFrame(() => {
    S.focusPt = pt; S.movedByUser = false;
    setT(centerT(pt, Math.min(Math.max(S.T.k, S.kFit * 2.4), S.kFit * 8)), true);
  });
}
function filterLabel() {
  const t = { today: 'Oggi', week: 'Nei prossimi 7 giorni', all: 'Tutte le date in calendario' }[S.time];
  const g = Object.keys(S.groups).map((k) => GROUPS[k].toLowerCase());
  return t + (g.length ? ' · ' + g.join(', ') : '');
}
export function openCalendar(trigger) {
  S.sel = null; markSel(); highlight(null);
  const list = visible().sort(byStart), days = [], map = {};
  list.forEach((ev) => { const d = startDay(ev); if (!map[d]) { map[d] = []; days.push(d); } map[d].push(ev); });
  const html = '<div class="sh-head"><span class="tag">' + list.length + (list.length === 1 ? ' evento' : ' eventi') + '</span>' + closeBtn() + '</div>' +
    '<h2 class="sh-title" id="sheet-title">Calendario</h2><p class="sh-sub">' + esc(filterLabel()) + '</p>' +
    (list.length ? days.map((d) => '<section class="day">' + flap(d) + '<div class="rows"><h3 class="day-h">' + esc(fDay.format(noon(d))) + '</h3>' + map[d].map(rowHtml).join('') + '</div></section>').join('')
      : '<p class="sh-sub">Nessun evento con questi filtri.</p>');
  showSheet(html, trigger, 'full');
  S.ctx = { kind: 'calendar', label: 'Calendario' };
}
export function openInfo(trigger) {
  S.sel = null; markSel(); highlight(null);
  const upd = new Date(D.DATA.updated);
  const legend = [['generale', 'i-generale', 'Sciopero generale'], ['treno', 'i-treno', 'Treni'], ['bus', 'i-bus', 'Bus, tram e metro'], ['aereo', 'i-aereo', 'Aerei'], ['nave', 'i-nave', 'Porti e navi'], ['servizi', 'i-scuola', 'Scuola e servizi'], ['merci', 'i-camion', 'Merci e autostrade'], ['corteo', 'i-corteo', 'Cortei e presidi']]
    .map((r) => '<span><i style="--c:var(--c-' + r[0] + ')">' + icon(r[1]) + '</i>' + r[2] + '</span>').join('');
  showSheet('<div class="sh-head"><span class="tag">Aggiornato il ' + esc(fDate.format(upd)) + ' alle ' + esc(fTime.format(upd)) + '</span>' + closeBtn() + '</div>' +
    '<h2 class="sh-title" id="sheet-title">Da dove arrivano i dati</h2><div class="info">' +
    '<p>Gli scioperi dei trasporti vengono dal <a href="https://scioperi.mit.gov.it/mit2/public/scioperi" target="_blank" rel="noopener noreferrer">prospetto ufficiale del Ministero delle Infrastrutture e dei Trasporti</a>. Scuola e vigili del fuoco arrivano dalle testate che riprendono il calendario della Commissione di garanzia. Motivazioni, presidi e cortei vengono dai sindacati e dai giornali citati in ogni scheda.</p>' +
    '<p>Le foto restano sui siti dei giornali: in ogni scheda scorri la locandina verso destra e apri l’articolo.</p>' +
    '<p>Uno sciopero può essere revocato o spostato fino all’ultimo. Prima di partire controlla gli avvisi dell’azienda, della scuola o della compagnia aerea.</p>' +
    '<h3>Colori sulla mappa</h3><div class="legend">' + legend + '</div>' +
    '<h3>Sulla mappa</h3><p style="margin-top:0">Gli eventi vicini si raggruppano in un solo segnaposto con il numero. Quelli che riguardano tutta Italia sono nella striscia in basso; il pallino che pulsa indica uno sciopero in corso.</p>' +
    '<h3>Privacy</h3><p style="margin-top:0">Niente account, niente pubblicità, niente tracciamento. <a href="https://scioperioggi.com/privacy.html">Leggi come trattiamo i dati</a>.</p></div>', trigger, 'full');
  S.ctx = null;
}

export function initSheet() {
  sheetBody.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act],[data-id]');
    if (!a) return;
    if (a.dataset.act === 'close') return closeSheet();
    if (a.dataset.act === 'share') {
      const box = sheetBody.querySelector('.share'), open = box.hidden;
      box.hidden = !open; a.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    if (a.dataset.act === 'copy') {
      const link = a.dataset.link;
      const fallback = () => {
        const input = document.createElement('input');
        input.className = 'sharefield'; input.readOnly = true; input.value = link; input.id = 'share-field';
        input.setAttribute('aria-label', 'Link da copiare');
        a.replaceWith(input); input.focus(); input.select();
      };
      try { navigator.clipboard.writeText(link).then(() => { a.textContent = 'Link copiato'; }, fallback); } catch (err) { fallback(); }
      return;
    }
    if (a.dataset.act === 'back') {
      const c = S.ctx;
      if (c && c.kind === 'cluster') return openCluster(c.items, null);
      if (c && c.kind === 'calendar') return openCalendar(null);
      return closeSheet();
    }
    if (a.dataset.id && D.byId[a.dataset.id]) {
      const from = S.ctx;
      openDetail(D.byId[a.dataset.id], from ? { label: from.kind === 'calendar' ? 'Calendario' : 'Indietro', ctx: from } : null, null);
    }
  });

  // Maniglia: su per allargare, giù per ridurre o chiudere.
  const grab = $('#grab');
  let y0 = null, dy = 0, moved = false;
  grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; moved = false; sheet.classList.add('dragging'); grab.setPointerCapture(e.pointerId); });
  grab.addEventListener('pointermove', (e) => {
    if (y0 == null) return;
    dy = e.clientY - y0; if (Math.abs(dy) > 4) moved = true;
    if (dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)';
  });
  const end = () => {
    if (y0 == null) return;
    sheet.classList.remove('dragging'); sheet.style.transform = '';
    y0 = null;
    if (!moved) { sheet.classList.toggle('full'); return; }
    if (dy < -40) sheet.classList.add('full');
    else if (dy > 90) { if (sheet.classList.contains('full')) sheet.classList.remove('full'); else closeSheet(); }
  };
  grab.addEventListener('pointerup', end);
  grab.addEventListener('pointercancel', end);
  grab.addEventListener('click', (e) => { if (e.detail === 0) sheet.classList.toggle('full'); });
}
