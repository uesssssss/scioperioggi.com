// Proiezione (stessa matematica di d3.geoConicConformal), capoluoghi e regioni.
import { D } from './state.js';

const RAD = Math.PI / 180;
let P, N, F;
function tany(y) { return Math.tan((Math.PI / 2 + y) / 2); }
export function project(lon, lat) {
  const x = (lon + P.rot) * RAD, r = F / Math.pow(tany(lat * RAD), N);
  return [P.tx + P.k * r * Math.sin(N * x), P.ty - P.k * (F - r * Math.cos(N * x))];
}
export let KM_PER_UNIT = 1;
export let ITALY = [0, 0, 1, 1];
export let CITIES = [];
export let P2 = null;

// Capoluoghi di regione (1) e di provincia (2): nome, longitudine, latitudine, livello.
const CITY_DATA = [
  ['Roma',12.4964,41.9028,1],['Milano',9.19,45.4642,1],['Napoli',14.2681,40.8518,1],['Torino',7.6869,45.0703,1],['Palermo',13.3615,38.1157,1],
  ['Genova',8.9463,44.4056,1],['Bologna',11.3426,44.4949,1],['Firenze',11.2558,43.7696,1],['Bari',16.8719,41.1171,1],['Venezia',12.3155,45.4408,1],
  ['Cagliari',9.1217,39.2238,1],['Trieste',13.7768,45.6495,1],['Trento',11.1217,46.0748,1],['Perugia',12.3888,43.1107,1],['Ancona',13.5189,43.6158,1],
  ["L'Aquila",13.3995,42.3498,1],['Potenza',15.8056,40.6404,1],['Catanzaro',16.5877,38.9098,1],['Campobasso',14.6627,41.5603,1],['Aosta',7.3201,45.7372,1],
  ['Alessandria',8.615,44.913,2],['Asti',8.207,44.9,2],['Biella',8.054,45.566,2],['Cuneo',7.551,44.384,2],['Novara',8.621,45.446,2],['Verbania',8.551,45.921,2],['Vercelli',8.423,45.32,2],
  ['Bergamo',9.677,45.698,2],['Brescia',10.211,45.541,2],['Como',9.085,45.808,2],['Cremona',10.023,45.133,2],['Lecco',9.398,45.853,2],['Lodi',9.503,45.314,2],['Mantova',10.792,45.156,2],['Monza',9.274,45.584,2],['Pavia',9.159,45.185,2],['Sondrio',9.873,46.17,2],['Varese',8.825,45.82,2],
  ['Bolzano',11.354,46.498,2],['Belluno',12.217,46.14,2],['Padova',11.877,45.406,2],['Rovigo',11.79,45.071,2],['Treviso',12.245,45.666,2],['Verona',10.992,45.438,2],['Vicenza',11.546,45.548,2],
  ['Gorizia',13.622,45.94,2],['Pordenone',12.66,45.956,2],['Udine',13.234,46.071,2],['Imperia',8.027,43.889,2],['La Spezia',9.824,44.102,2],['Savona',8.477,44.309,2],
  ['Ferrara',11.62,44.836,2],['Forlì',12.041,44.222,2],['Modena',10.925,44.647,2],['Parma',10.328,44.801,2],['Piacenza',9.693,45.052,2],['Ravenna',12.199,44.418,2],['Reggio Emilia',10.631,44.698,2],['Rimini',12.568,44.06,2],
  ['Arezzo',11.88,43.463,2],['Grosseto',11.113,42.763,2],['Livorno',10.308,43.548,2],['Lucca',10.503,43.843,2],['Massa',10.14,44.035,2],['Pisa',10.402,43.716,2],['Pistoia',10.918,43.933,2],['Prato',11.097,43.88,2],['Siena',11.331,43.318,2],
  ['Terni',12.646,42.563,2],['Ascoli Piceno',13.575,42.854,2],['Fermo',13.718,43.16,2],['Macerata',13.453,43.3,2],['Pesaro',12.913,43.91,2],
  ['Frosinone',13.35,41.64,2],['Latina',12.904,41.467,2],['Rieti',12.862,42.404,2],['Viterbo',12.105,42.417,2],
  ['Chieti',14.168,42.351,2],['Pescara',14.214,42.462,2],['Teramo',13.704,42.659,2],['Isernia',14.233,41.594,2],
  ['Avellino',14.79,40.914,2],['Benevento',14.782,41.13,2],['Caserta',14.333,41.073,2],['Salerno',14.768,40.682,2],
  ['Barletta',16.283,41.32,2],['Brindisi',17.944,40.632,2],['Foggia',15.545,41.462,2],['Lecce',18.174,40.352,2],['Taranto',17.24,40.464,2],['Matera',16.604,40.666,2],
  ['Cosenza',16.251,39.298,2],['Crotone',17.125,39.081,2],['Reggio Calabria',15.647,38.111,2],['Vibo Valentia',16.101,38.676,2],
  ['Agrigento',13.576,37.311,2],['Caltanissetta',14.062,37.49,2],['Catania',15.087,37.502,2],['Enna',14.279,37.567,2],['Messina',15.554,38.193,2],['Ragusa',14.73,36.925,2],['Siracusa',15.287,37.075,2],['Trapani',12.513,38.017,2],
  ['Sassari',8.56,40.727,2],['Nuoro',9.331,40.32,2],['Oristano',8.592,39.903,2],['Carbonia',8.523,39.167,2],['Iglesias',8.537,39.311,2],['Olbia',9.502,40.923,2],['Tempio Pausania',9.105,40.9,2],['Lanusei',9.542,39.878,2],['Tortolì',9.657,39.926,2],['Sanluri',8.9,39.561,2],['Villacidro',8.739,39.457,2],
  ['Andria',16.29,41.227,2],['Trani',16.416,41.277,2],['Carrara',10.098,44.079,2],['Cesena',12.243,44.139,2],['Urbino',12.636,43.726,2]
];

export function initGeo(GEO) {
  P = GEO.proj;
  const Y0 = P.par[0] * RAD, Y1 = P.par[1] * RAD, CY0 = Math.cos(Y0);
  N = Math.log(CY0 / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
  F = CY0 * Math.pow(tany(Y0), N) / N;
  const a = project(12, 42), b = project(13, 42);
  KM_PER_UNIT = 111.32 * Math.cos(42 * RAD) / Math.hypot(b[0] - a[0], b[1] - a[1]);
  ITALY = [24, 24, GEO.w - 24, GEO.h - 24];
  CITIES = CITY_DATA.map((c) => ({ name: c[0], tier: c[3], pt: project(c[1], c[2]), hot: false }));
  P2 = {
    grat: new Path2D(GEO.grat), land: new Path2D(GEO.land), inner: new Path2D(GEO.inner),
    regions: GEO.regions.map((r) => ({ name: r.name, p: new Path2D(r.d) })),
  };
}

// La regione di un punto: si prova il punto e qualche vicino, per le città sulla costa.
const probe = document.createElement('canvas').getContext('2d');
export function regionOf(pt) {
  const offs = [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [6, 6], [-6, 6], [6, -6], [-6, -6], [10, 0], [-10, 0], [0, 10], [0, -10], [16, 0], [-16, 0], [0, 16], [0, -16]];
  for (const o of offs) for (const r of P2.regions) if (probe.isPointInPath(r.p, pt[0] + o[0], pt[1] + o[1])) return r.name;
  return null;
}
export function findCity(name) { return CITIES.find((c) => c.name === name) || null; }
export function unionBox(names) {
  let b = [Infinity, Infinity, -Infinity, -Infinity];
  names.forEach((n) => { const r = D.GEO.boxes[n]; if (!r) return; b = [Math.min(b[0], r[0]), Math.min(b[1], r[1]), Math.max(b[2], r[2]), Math.max(b[3], r[3])]; });
  return b[0] === Infinity ? ITALY : b;
}
