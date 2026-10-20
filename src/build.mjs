// Assembles the single-file page: template + projected geometry + events data.
// Usage: node build.mjs <template.html> <geo.json> <events.json> <out.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , tplPath, geoPath, evPath, outPath] = process.argv;
const tpl = readFileSync(tplPath, "utf8");
const geo = JSON.parse(readFileSync(geoPath, "utf8"));
const data = JSON.parse(readFileSync(evPath, "utf8"));

// Sanity checks on the data before it ships.
const names = new Set(geo.regions.map((r) => r.name));
for (const e of data.events) {
  for (const k of ["id", "title", "kicker", "group", "mode", "modeLabel", "scope", "place", "start", "end", "hours", "who", "summary"]) {
    if (!e[k]) throw new Error(`${e.id}: missing ${k}`);
  }
  if (Number.isNaN(Date.parse(e.start)) || Number.isNaN(Date.parse(e.end))) throw new Error(`${e.id}: bad date`);
  if (Date.parse(e.end) < Date.parse(e.start)) throw new Error(`${e.id}: end before start`);
  if (e.regions !== "all" && (!Array.isArray(e.regions) || e.regions.some((r) => !names.has(r)))) throw new Error(`${e.id}: unknown region ${e.regions}`);
  if (e.regions !== "all" && (typeof e.lat !== "number" || typeof e.lon !== "number")) throw new Error(`${e.id}: local event without coordinates`);
  for (const s of e.src || []) if (!data.sources[s]) throw new Error(`${e.id}: unknown source ${s}`);
}

const safeJSON = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const meta = { w: geo.w, h: geo.h, proj: geo.proj, boxes: Object.fromEntries(geo.regions.map((r) => [r.name, r.box])), land: geo.land, inner: geo.inner, grat: geo.graticule, regions: geo.regions.map((r) => ({ name: r.name, d: r.d })) };
const regions = geo.regions.map((r) => `      <path class="rg" data-r="${r.name.replace(/"/g, "&quot;")}" d="${r.d}"/>`).join("\n");

const out = tpl
  .replaceAll("__W__", String(geo.w))
  .replaceAll("__H__", String(geo.h))
  .replace("__GRAT__", geo.graticule)
  .replaceAll("__LAND__", geo.land)
  .replace("__REGIONS__", regions)
  .replace("__INNER__", geo.inner)
  .replace("__GEO_META__", safeJSON(meta))
  .replace("__EVENTS__", safeJSON(data));

if (/__[A-Z_]+__/.test(out)) throw new Error("unreplaced placeholder");
writeFileSync(outPath, out);
console.log("wrote", outPath, (out.length / 1024).toFixed(0) + " KB,", data.events.length, "events");
