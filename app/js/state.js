// Stato condiviso tra i moduli: filtri, città scelta, trasformazione della mappa, scheda aperta.
export const S = {
  time: 'all', groups: {}, sel: null,
  city: null, calScope: 'city', tab: 'oggi',
  selDay: null, frontId: null,
  T: { k: 1, x: 0, y: 0 }, kFit: 1, zoom: null, touched: false, movedByUser: false,
  clusters: [], lastSig: '', focusPt: null, hl: null,
  ctx: null, lastTrigger: null, kbd: false,
};
// Dati caricati all'avvio: DATA (events.json), GEO (geometria), events, byId.
export const D = { DATA: null, GEO: null, events: [], byId: {} };
