// Costruisce il sito da app/: JavaScript e CSS uniti e compressi con esbuild.
//   node tools/build.mjs            → sito: index.html + assets/ + data/geo.json (i dati restano in data/events.json)
//   node tools/build.mjs --single out.html  → una pagina sola con dati e caratteri dentro (copia per il link di Claude)
import { readFileSync, writeFileSync, rmSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// esbuild e d3 vengono da node_modules del progetto se c'è, altrimenti dagli strumenti della macchina.
const NODE_PATHS = [join(ROOT, "node_modules"), "/opt/npm-tools/node_modules"].filter(existsSync);
const require = createRequire(join(NODE_PATHS[0], "x.js"));
const esbuild = require("esbuild");

const single = process.argv.includes("--single");
const outSingle = single ? process.argv[process.argv.indexOf("--single") + 1] : null;
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// Controlli sui dati prima di pubblicarli.
const geo = JSON.parse(read("tools/geo-source.json"));
const data = JSON.parse(read("data/events.json"));
const names = new Set(geo.regions.map((r) => r.name));

// Valori ammessi e lunghezze massime: i dati arrivano anche da un aggiornamento automatico, quindi si controllano qui.
const MODES = new Set(["generale", "bus", "treno", "aereo", "nave", "strada", "camion", "scuola", "fuoco", "corteo"]);
const GROUPS = new Set(["generale", "trasporti", "servizi", "merci", "cortei"]);
const SCOPES = new Set(["Nazionale", "Regionale", "Territoriale", "Provinciale", "Interregionale", "Locale", "Aeroporto", "Cittadino"]);
const MAXLEN = { id: 80, title: 120, kicker: 40, modeLabel: 60, place: 120, hours: 400, who: 300, note: 500, summary: 700, day: 10, proclaimed: 10, checked: 40 };
const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };
const checkText = (where, k, v, max) => {
  if (typeof v !== "string") fail(where, `${k} non è un testo`);
  if (/[<>]/.test(v)) fail(where, `${k} contiene < o >`);
  if (v.length > max) fail(where, `${k} troppo lungo (${v.length} > ${max})`);
};
const checkUrl = (where, v) => {
  let u;
  try { u = new URL(v); } catch (x) { fail(where, `URL non valido ${v}`); }
  if (u.protocol !== "https:") fail(where, `l'URL deve essere https: ${v}`);
  if (!u.hostname || u.username || u.password) fail(where, `URL non ammesso ${v}`);
  if (v.length > 500) fail(where, "URL troppo lungo");
};

if (typeof data.shareUrl === "string") checkUrl("shareUrl", data.shareUrl);
if (typeof data.reportEmail !== "string" || !/^[^\s@<>"',;?&]+@[^\s@<>"',;?&]+\.[a-z]{2,}$/i.test(data.reportEmail)) fail("reportEmail", "indirizzo non valido");
if (/@esempio\.it$/i.test(data.reportEmail)) console.warn("ATTENZIONE: reportEmail è ancora un indirizzo di prova (" + data.reportEmail + "): le segnalazioni degli utenti andrebbero a un dominio che non è nostro.");
for (const [key, s] of Object.entries(data.sources)) {
  const w = `fonte ${key}`;
  for (const k of ["pub", "kind", "label", "url"]) if (!s[k]) fail(w, `manca ${k}`);
  for (const k of ["pub", "kind"]) checkText(w, k, s[k], 80);
  checkText(w, "label", s.label, 200);
  checkUrl(w, s.url);
}

const seen = new Set();
for (const e of data.events) {
  for (const k of ["id", "title", "kicker", "group", "mode", "modeLabel", "scope", "place", "start", "end", "hours", "who", "summary"]) if (!e[k]) throw new Error(`${e.id}: manca ${k}`);
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(e.id)) fail(e.id, "id non valido (solo minuscole, numeri e trattini)");
  if (seen.has(e.id)) fail(e.id, "id duplicato");
  seen.add(e.id);
  if (!MODES.has(e.mode)) fail(e.id, `mode sconosciuto ${e.mode}`);
  if (!GROUPS.has(e.group)) fail(e.id, `group sconosciuto ${e.group}`);
  if (!SCOPES.has(e.scope)) fail(e.id, `scope sconosciuto ${e.scope}`);
  for (const [k, max] of Object.entries(MAXLEN)) if (e[k] != null) checkText(e.id, k, e[k], max);
  if (Number.isNaN(Date.parse(e.start)) || Number.isNaN(Date.parse(e.end))) throw new Error(`${e.id}: data non valida`);
  if (Date.parse(e.end) < Date.parse(e.start)) throw new Error(`${e.id}: finisce prima di iniziare`);
  if (e.regions !== "all" && (!Array.isArray(e.regions) || e.regions.some((r) => !names.has(r)))) throw new Error(`${e.id}: regione sconosciuta ${e.regions}`);
  if (e.regions !== "all" && (typeof e.lat !== "number" || typeof e.lon !== "number")) throw new Error(`${e.id}: evento locale senza coordinate`);
  for (const s of e.src || []) if (!data.sources[s]) throw new Error(`${e.id}: fonte sconosciuta ${s}`);
}
const geoMeta = { w: geo.w, h: geo.h, proj: geo.proj, boxes: Object.fromEntries(geo.regions.map((r) => [r.name, r.box])), land: geo.land, inner: geo.inner, grat: geo.graticule, regions: geo.regions.map((r) => ({ name: r.name, d: r.d })) };

const body = read("app/body.html");
const head = read("app/head.html");
const result = await esbuild.build({
  entryPoints: [join(ROOT, "app/js/main.js")],
  bundle: true, minify: true, format: "iife",
  nodePaths: NODE_PATHS, write: false, outdir: join(ROOT, "assets"),
  entryNames: single ? "app" : "app-[hash]", assetNames: "[name]-[hash]",
  loader: { ".woff": single ? "dataurl" : "file" },
  legalComments: "none", metafile: true,
});
const files = Object.fromEntries(result.outputFiles.map((f) => [f.path.slice(join(ROOT, "assets").length + 1), f]));
const jsName = Object.keys(files).find((n) => n.endsWith(".js"));
const cssName = Object.keys(files).find((n) => n.endsWith(".css"));
const safeJSON = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

if (single) {
  const page = head.replace("<!--STYLES-->", "<style>" + files[cssName].text + "</style>").replace("<!--HEADEXTRA-->", "") +
    body + `\n<script type="application/json" id="geo-meta">${safeJSON(geoMeta)}</script>\n<script type="application/json" id="events-data">${safeJSON(data)}</script>\n<script>${files[jsName].text}</script>\n`;
  writeFileSync(resolve(outSingle), page.replace(/^<!doctype html>[\s\S]*?<head>\s*/i, "").replace(/<\/head>\s*<body>/i, "").replace(/<\/body>\s*<\/html>\s*$/i, ""));
  console.log("pagina unica:", outSingle, (page.length / 1024).toFixed(0) + " KB");
} else {
  if (existsSync(join(ROOT, "assets"))) for (const f of readdirSync(join(ROOT, "assets"))) rmSync(join(ROOT, "assets", f));
  mkdirSync(join(ROOT, "assets"), { recursive: true });
  for (const [n, f] of Object.entries(files)) writeFileSync(join(ROOT, "assets", n), f.contents);
  writeFileSync(join(ROOT, "data/geo.json"), JSON.stringify(geoMeta));
  const page = head.replace("<!--STYLES-->", `<link rel="stylesheet" href="assets/${cssName}">`)
    .replace("<!--HEADEXTRA-->", `<link rel="preload" href="data/events.json" as="fetch" crossorigin>\n<link rel="preload" href="data/geo.json" as="fetch" crossorigin>`) +
    body + `\n<script src="assets/${jsName}" defer></script>\n</body>\n</html>\n`;
  writeFileSync(join(ROOT, "index.html"), page);
  console.log("sito:", Object.keys(files).map((n) => n + " " + (files[n].contents.length / 1024).toFixed(0) + " KB").join(", "), "·", data.events.length, "eventi");
}
