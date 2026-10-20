// Benvenuto al primo avvio: due schermate, poi la scelta della città.
import { $ } from '../util.js';
import { openPicker } from './city.js';

let step = 0;
function go(n) {
  step = n;
  $('#wel-track').style.transform = 'translateX(' + (-100 * n) + '%)';
  document.querySelectorAll('#welcome .dots3 i').forEach((d, i) => d.classList.toggle('on', i === n));
}
function done() {
  $('#pk-dots').hidden = false;
  openPicker();
  $('#welcome').hidden = true;
}
export function openWelcome() { $('#welcome').hidden = false; go(0); }
export function initWelcome() {
  $('#wel-next').addEventListener('click', () => { if (step < 1) go(step + 1); else done(); });
  $('#wel-skip').addEventListener('click', done);
  const w = $('#welcome');
  let x0 = null, y0 = 0;
  w.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  w.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) { if (step < 1) go(step + 1); else done(); } else if (step > 0) go(step - 1);
  });
}
