// Piccoli aiuti per il DOM e il testo.
export const $ = (s) => document.querySelector(s);
export const $$ = (s) => Array.prototype.slice.call(document.querySelectorAll(s));
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function icon(name) { return '<svg aria-hidden="true"><use href="#' + esc(name) + '"/></svg>'; }
const mm = (q) => (window.matchMedia ? matchMedia(q) : { matches: false, addEventListener() {} });
export const reduceMotion = !!mm('(prefers-reduced-motion: reduce)').matches;
export const mqWide = mm('(min-width: 860px)');
// Computer: colonna a sinistra con Oggi, Calendario e Aggiungi, mappa sempre visibile a destra.
export const mqDesk = mm('(min-width: 1024px)');
export const PIN = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
export const DOWN = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
export const PLUS = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
