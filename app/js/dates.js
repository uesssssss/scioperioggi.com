// Date e orari, sempre nel fuso italiano.
export const TZ = 'Europe/Rome';
export const NOW = new Date();
const ymdFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
export function ymd(d) {
  const p = {}; ymdFmt.formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day;
}
export function noon(s) { return new Date(s + 'T12:00:00Z'); }
export const fDay = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
export const fWd = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'long' });
export const fWd3 = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'short' });
export const fMon = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, month: 'long' });
export const fDate = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, day: 'numeric', month: 'long' });
export const fTime = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
export const MON3 = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
export function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function parts(s) { const a = s.split('-'); return { y: +a[0], m: +a[1], d: +a[2] }; }
export function dayDiff(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
export function addDays(d, n) { return ymd(new Date(noon(d).getTime() + n * 864e5)); }
export const TODAY = ymd(NOW);
