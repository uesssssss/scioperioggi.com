// Builds projected SVG geometry for the Italy map from an openpolis regions TopoJSON.
// Usage: node prep_geo.mjs <regions.topo.json> <out.json>
import { readFileSync, writeFileSync } from "node:fs";
import { geoConicConformal, geoPath, geoGraticule } from "/opt/npm-tools/node_modules/d3-geo/src/index.js";

const [, , inPath, outPath] = process.argv;
const topo = JSON.parse(readFileSync(inPath, "utf8"));
const obj = topo.objects.regions;
const { scale: [sx, sy], translate: [tx0, ty0] } = topo.transform;

// 1. Decode quantized, delta-encoded arcs to lon/lat.
const arcsLL = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx0, y * sy + ty0]; });
});

// 2. Projection: conic conformal centred on Italy, fitted to a fixed width.
const W = 1000, PAD = 24;
const ROT = -12.5, PAR = [38, 46];
const ringLL = (ring) => ring.flatMap((i, n) => {
  const a = i >= 0 ? arcsLL[i] : arcsLL[~i].slice().reverse();
  return n === 0 ? a : a.slice(1);
});
const featureOf = (g) => ({
  type: "Feature",
  properties: g.properties,
  geometry: g.type === "Polygon"
    ? { type: "Polygon", coordinates: g.arcs.map(ringLL) }
    : { type: "MultiPolygon", coordinates: g.arcs.map((p) => p.map(ringLL)) },
});
const fc = { type: "FeatureCollection", features: obj.geometries.map(featureOf) };
const proj = geoConicConformal().rotate([ROT, 0]).parallels(PAR).fitWidth(W - 2 * PAD, fc);
const [[bx0, by0], [bx1, by1]] = geoPath(proj).bounds(fc);
const [tx, ty] = proj.translate();
proj.translate([tx + PAD - bx0, ty + PAD - by0]);
const H = Math.ceil(by1 - by0 + 2 * PAD);
const k = proj.scale();
const [TX, TY] = proj.translate();

// Own implementation (shipped in the page) must match d3 exactly.
const rad = Math.PI / 180;
const tany = (y) => Math.tan((Math.PI / 2 + y) / 2);
const y0 = PAR[0] * rad, y1 = PAR[1] * rad, cy0 = Math.cos(y0);
const n = Math.log(cy0 / Math.cos(y1)) / Math.log(tany(y1) / tany(y0));
const f = (cy0 * Math.pow(tany(y0), n)) / n;
const mine = (lon, lat) => {
  const x = (lon + ROT) * rad, r = f / Math.pow(tany(lat * rad), n);
  return [TX + k * r * Math.sin(n * x), TY - k * (f - r * Math.cos(n * x))];
};
let maxErr = 0;
for (const p of [[12.4964, 41.9028], [9.19, 45.4642], [15.083, 37.5079], [7.53, 43.79], [18.5, 40.1], [8.4772, 44.3091]]) {
  const a = proj(p), b = mine(...p);
  maxErr = Math.max(maxErr, Math.hypot(a[0] - b[0], a[1] - b[1]));
}
console.log("projection check, max error px:", maxErr.toExponential(2));
if (maxErr > 1e-6) throw new Error("projection mismatch");

// 3. Project + simplify each arc once (Douglas-Peucker), so shared borders stay identical.
const TOL = 0.32;
const dp = (pts) => {
  if (pts.length < 3) return pts;
  const last = pts.length - 1;
  const keep = new Uint8Array(pts.length); keep[0] = keep[last] = 1;
  const stack = [];
  if (pts[0][0] === pts[last][0] && pts[0][1] === pts[last][1]) {
    // Closed arc (an island): split at the point farthest from the start, or it collapses.
    let far = 1, fd = -1;
    for (let i = 1; i < last; i++) {
      const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
      if (d > fd) { fd = d; far = i; }
    }
    keep[far] = 1; stack.push([0, far], [far, last]);
  } else stack.push([0, last]);
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = len > 1e-9
        ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len
        : Math.hypot(pts[i][0] - ax, pts[i][1] - ay);
      if (d > best) { best = d; bi = i; }
    }
    if (best > TOL) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
};
const arcsXY = arcsLL.map((arc) => dp(arc.map((p) => mine(...p))));
const r1 = (v) => Math.round(v * 10) / 10;
const fmt = (pts) => pts.map(([x, y], i) => (i ? "L" : "M") + r1(x) + " " + r1(y)).join("");
const ringXY = (ring) => ring.flatMap((i, m) => {
  const a = i >= 0 ? arcsXY[i] : arcsXY[~i].slice().reverse();
  return m === 0 ? a : a.slice(1);
});

// 4. Regions, land underlay (outer rings only, fills enclave holes), outline vs inner borders.
const uses = new Map();
const countArc = (i) => { const j = i >= 0 ? i : ~i; uses.set(j, (uses.get(j) || 0) + 1); };
const regions = obj.geometries.map((g) => {
  const polys = g.type === "Polygon" ? [g.arcs] : g.arcs;
  polys.forEach((p) => p.forEach((ring) => ring.forEach(countArc)));
  let x0 = Infinity, ya = Infinity, x1 = -Infinity, yb = -Infinity;
  const d = polys.map((p) => p.map((ring) => {
    const pts = ringXY(ring);
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); ya = Math.min(ya, y); yb = Math.max(yb, y); }
    return fmt(pts) + "Z";
  }).join("")).join("");
  const outer = polys.map((p) => fmt(ringXY(p[0])) + "Z").join("");
  const name = g.properties.reg_name.split("/")[0];
  return { name, d, outer, box: [r1(x0), r1(ya), r1(x1), r1(yb)] };
});
const outlineIdx = [], inner = [];
uses.forEach((c, i) => (c === 1 ? outlineIdx.push(i) : inner.push(fmt(arcsXY[i]))));

// Chain the arcs used once (coast + national border + enclave edges) into closed rings.
// Filled with one winding direction they form the land underlay; stroked they are the coastline.
const key = ([x, y]) => x.toFixed(4) + "," + y.toFixed(4);
const ends = new Map();
for (const i of outlineIdx) for (const p of [arcsXY[i][0], arcsXY[i].at(-1)]) {
  const kk = key(p); if (!ends.has(kk)) ends.set(kk, []); ends.get(kk).push(i);
}
const used = new Set(), rings = [];
for (const start of outlineIdx) {
  if (used.has(start)) continue;
  used.add(start);
  let ring = arcsXY[start].slice();
  for (let guard = 0; guard < 5000; guard++) {
    const tail = key(ring.at(-1));
    if (tail === key(ring[0]) && ring.length > 3) break;
    const next = (ends.get(tail) || []).find((i) => !used.has(i));
    if (next === undefined) break;
    used.add(next);
    const a = arcsXY[next];
    ring = ring.concat((key(a[0]) === tail ? a : a.slice().reverse()).slice(1));
  }
  const area = ring.reduce((s, [x, y], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return s + x * y2 - x2 * y; }, 0);
  if (area < 0) ring.reverse();
  rings.push(ring);
}
console.log("land rings:", rings.length, "open:", rings.filter((r) => key(r[0]) !== key(r.at(-1))).length);
const outline = rings.map((r) => fmt(r) + "Z");

// 5. Graticule every 2 degrees, resampled by d3 for smooth curves.
const grat = geoPath(proj)(geoGraticule().extent([[-2, 28], [28, 54]]).step([2, 2])());
const graticule = grat.replace(/(\d+\.\d+)/g, (m) => String(r1(+m)));

const out = {
  w: W, h: H,
  proj: { k, tx: TX, ty: TY, rot: ROT, par: PAR },
  regions: regions.map(({ name, d, box }) => ({ name, d, box })),
  land: outline.join(""),
  inner: inner.join(""),
  graticule,
};
writeFileSync(outPath, JSON.stringify(out));
const pts = arcsXY.reduce((s, a) => s + a.length, 0);
console.log({ W, H, k: Math.round(k), points: pts, bytes: JSON.stringify(out).length });
