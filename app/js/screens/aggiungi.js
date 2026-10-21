// Aggiungi: modulo per segnalare un corteo, un presidio o uno sciopero. Prepara un'email, non salva niente.
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
    '<p class="note" id="r-err" role="alert" hidden></p>' +
    '<button class="mainbtn" type="submit">Prepara l’email</button>' +
    '<p class="note">Ogni segnalazione viene controllata prima di comparire sulla mappa. Nell’email ci sono solo i dati che scrivi qui e il tuo indirizzo di posta; li usiamo solo per verificare l’evento. <a href="https://scioperioggi.com/privacy.html">Privacy</a></p></form><div id="r-out"></div>';
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
    err.hidden = true;
    const day = fDay.format(noon(v('r-day')));
    const kindText = v('r-kind') === 'Altro' && v('r-other') ? v('r-other') : v('r-kind');
    const text = 'Buongiorno,\nvi segnalo un evento da aggiungere alla mappa.\n\n' +
      'Tipo: ' + kindText + '\nCosa: ' + v('r-what') +
      '\nQuando: ' + day + (v('r-time') ? ', alle ' + v('r-time') : '') +
      '\nDove: ' + (v('r-place') ? v('r-place') + ', ' : '') + v('r-city') +
      (v('r-src') ? '\nFonte: ' + v('r-src') : '') + (v('r-note') ? '\nNote: ' + v('r-note') : '') + '\n\nGrazie.';
    const to = D.DATA.reportEmail || 'scioperioggi@gmail.com';
    const subject = 'Nuova segnalazione: ' + v('r-what') + ' (' + v('r-city') + ')';
    $('#r-out').innerHTML = '<div class="preview"><pre id="r-text">' + esc(text) + '</pre>' +
      '<a class="mainbtn" href="mailto:' + esc(to) + '?subject=' + encodeURIComponent(subject) + '&amp;body=' + encodeURIComponent(text) + '">Invia per email</a>' +
      '<p class="note" style="margin:0">Se non si apre la posta, copia il testo e mandalo a <b style="user-select:all;color:var(--ink)">' + esc(to) + '</b></p>' +
      '<button class="softbtn" type="button" id="r-copy" style="align-self:flex-start">Copia il testo</button></div>';
    $('#r-copy').addEventListener('click', (ev) => {
      const b = ev.currentTarget;
      const selectText = () => { const r = document.createRange(); r.selectNodeContents($('#r-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Testo selezionato'; };
      try { navigator.clipboard.writeText(text).then(() => { b.textContent = 'Testo copiato'; }, selectText); } catch (x) { selectText(); }
    });
    $('#r-out').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
}
