// Aggiungi: modulo per segnalare un corteo, un presidio o uno sciopero. Lo invia alla casella del progetto, non salva niente sul sito.
import { S, D } from '../state.js';
import { $, esc, reduceMotion } from '../util.js';
import { noon, fDay } from '../dates.js';

function field(id, label, control, extra) { return '<div class="field' + (extra ? ' ' + extra : '') + '"><label for="' + id + '">' + label + '</label>' + control + '</div>'; }
const SELECT = (id, opts) => '<div class="selectwrap"><select id="' + id + '">' + opts.map((o) => '<option>' + o + '</option>').join('') + '</select><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>';

export function renderSegnala() {
  const box = $('#segnala');
  if (box.dataset.ready) return;
  box.dataset.ready = '1';
  box.innerHTML = '<h1 class="p-title">Aggiungi</h1><p class="p-sub">Un corteo, un presidio o uno sciopero che non trovi sulla mappa.</p>' +
    '<form class="form" id="report-form" novalidate>' +
    field('r-what', 'Cosa succede', '<input id="r-what" required placeholder="Es. Corteo per il diritto allo studio">') +
    field('r-kind', 'Tipo', SELECT('r-kind', ['Corteo o presidio', 'Sciopero', 'Altro'])) +
    field('r-other', 'Che tipo di iniziativa?', '<input id="r-other" placeholder="Es. Assemblea pubblica, volantinaggio">', 'is-hidden') +
    '<div class="row2">' + field('r-day', 'Giorno', '<input id="r-day" type="date" required>') + field('r-time', 'Ora', '<input id="r-time" type="time">') + '</div>' +
    field('r-city', 'Città', '<input id="r-city" autocomplete="address-level2" value="' + esc(S.city ? S.city.name : '') + '">') +
    field('r-place', 'Luogo di ritrovo', '<input id="r-place" placeholder="Es. Piazza Verdi">') +
    field('r-src', 'Link a una fonte', '<input id="r-src" type="url" inputmode="url" placeholder="Volantino, post o articolo">') +
    field('r-note', 'Altro da sapere', '<textarea id="r-note"></textarea>') +
    field('r-mail', 'La tua email <span class="opt">facoltativa, solo se vuoi una risposta</span>', '<input id="r-mail" type="email" inputmode="email" autocomplete="email" placeholder="nome@esempio.it">') +
    '<label class="hp" aria-hidden="true">Non compilare <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label>' +
    '<p class="note" id="r-err" role="alert" hidden></p>' +
    '<button class="mainbtn" type="submit">Invia la segnalazione</button>' +
    '<p class="note">Ogni segnalazione viene controllata prima di comparire sulla mappa. Usiamo i dati solo per verificare l’evento. <a href="https://scioperioggi.com/privacy.html">Privacy</a></p></form><div id="r-out"></div>';
  const kind = $('#r-kind'), other = $('#r-other').closest('.field');
  kind.addEventListener('change', () => { other.classList.toggle('is-hidden', kind.value !== 'Altro'); if (kind.value === 'Altro') $('#r-other').focus(); });
  $('#report-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (id) => ($('#' + id).value || '').trim();
    const err = $('#r-err');
    if (!v('r-what') || !v('r-day') || !v('r-city')) {
      err.hidden = false; err.textContent = 'Scrivi almeno cosa succede, il giorno e la città.';
      $('#' + (!v('r-what') ? 'r-what' : !v('r-day') ? 'r-day' : 'r-city')).focus();
      return;
    }
    if (v('r-mail') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('r-mail'))) {
      err.hidden = false; err.textContent = 'L’indirizzo email non sembra giusto. Puoi anche lasciarlo vuoto.';
      $('#r-mail').focus();
      return;
    }
    err.hidden = true;
    const day = fDay.format(noon(v('r-day')));
    const kindText = v('r-kind') === 'Altro' && v('r-other') ? v('r-other') : v('r-kind');
    const text = 'Tipo: ' + kindText + '\nCosa: ' + v('r-what') +
      '\nQuando: ' + day + (v('r-time') ? ', alle ' + v('r-time') : '') +
      '\nDove: ' + (v('r-place') ? v('r-place') + ', ' : '') + v('r-city') +
      (v('r-src') ? '\nFonte: ' + v('r-src') : '') + (v('r-note') ? '\nNote: ' + v('r-note') : '') +
      (v('r-mail') ? '\nEmail per rispondere: ' + v('r-mail') : '');
    const subject = 'Nuova segnalazione: ' + v('r-what') + ' (' + v('r-city') + ')';
    send(text, subject, v('r-mail'), $('#report-form').elements.botcheck.checked);
  });
}

// Invio con Web3Forms: riceve il modulo e lo inoltra alla casella del progetto. La chiave è pubblica per costruzione.
const WEB3FORMS_KEY = '438ecd2c-5b70-406e-a17c-e581751cd706';

function send(text, subject, mail, bot) {
  const form = $('#report-form'), btn = form.querySelector('.mainbtn'), out = $('#r-out');
  btn.disabled = true; btn.textContent = 'Invio in corso…';
  out.innerHTML = '';
  const body = { access_key: WEB3FORMS_KEY, subject, from_name: 'scioperioggi', message: text, botcheck: bot };
  if (mail) { body.email = mail; body.replyto = mail; }
  fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
    .then((r) => r.json().then((j) => ({ ok: r.ok && j.success })))
    .catch(() => ({ ok: false }))
    .then(({ ok }) => {
      btn.disabled = false; btn.textContent = 'Invia la segnalazione';
      if (ok) {
        form.hidden = true;
        out.innerHTML = '<div class="sent"><h2>Segnalazione inviata.</h2><p>Grazie. La controlliamo e, se è confermata, compare sulla mappa' + (mail ? '. Se serve, ti scriviamo all’indirizzo che hai lasciato.' : '.') + '</p>' +
          '<button class="softbtn" type="button" id="r-again">Segnala un altro evento</button></div>';
        $('#r-again').addEventListener('click', () => { form.reset(); form.hidden = false; out.innerHTML = ''; $('#r-other').closest('.field').classList.add('is-hidden'); $('#r-what').focus(); });
      } else {
        fallback(text, subject);
      }
      out.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
}

// Se l'invio non riesce (niente connessione, servizio fermo), si può sempre mandare a mano.
function fallback(text, subject) {
  const to = D.DATA.reportEmail || 'assistenza@scioperioggi.com';
  const gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  $('#r-out').innerHTML = '<div class="preview"><p class="note" style="margin:0;color:var(--ink)"><b>Non siamo riusciti a inviarla.</b> Riprova tra poco, oppure mandala tu a <b style="user-select:all">' + esc(to) + '</b>:</p>' +
    '<pre id="r-text">' + esc(text) + '</pre>' +
    '<div class="pill-btns"><a class="softbtn" href="mailto:' + esc(to) + '?subject=' + encodeURIComponent(subject) + '&amp;body=' + encodeURIComponent(text) + '">Apri la posta</a>' +
    '<a class="softbtn" href="' + esc(gmail) + '" target="_blank" rel="noopener noreferrer">Scrivi da Gmail</a>' +
    '<button class="softbtn" type="button" id="r-copy">Copia il testo</button></div></div>';
  $('#r-copy').addEventListener('click', (ev) => {
    const b = ev.currentTarget;
    const selectText = () => { const r = document.createRange(); r.selectNodeContents($('#r-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Testo selezionato'; };
    try { navigator.clipboard.writeText(text).then(() => { b.textContent = 'Testo copiato'; }, selectText); } catch (x) { selectText(); }
  });
}
