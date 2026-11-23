'use strict';
/* OBRA-GIS · Pendientes, perfil y tramificación.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Pendiente media y perfil longitudinal ---------------- */
const DEM_IGN = 'https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_25830_5_PB/coverage';
function vertexTable(f) { // vértices de la traza con su PK acumulado (misma regla que las marcas de PK)
  if (f._v) return f._v;
  const v = []; let acc = 0;
  lineParts(f).forEach(p => p.c.forEach((c, i) => {
    if (i > 0) acc += L.latLng(p.c[i - 1]).distanceTo(c);
    v.push({ lat: c[0], lng: c[1], z: c.length > 2 ? c[2] : null, d: acc });
  }));
  return (f._v = v);
}
function kmlHasZ(f) { const v = vertexTable(f); return v.every(p => p.z != null) && v.some(p => p.z !== 0) && new Set(v.map(p => p.z)).size > 1; }
function pointAtPK(f, d) {
  const v = vertexTable(f);
  if (d <= 0) return { ...v[0] };
  for (let i = 1; i < v.length; i++) {
    if (v[i].d >= d) {
      const a = v[i - 1], b = v[i], t = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, z: a.z != null && b.z != null ? a.z + (b.z - a.z) * t : null, d };
    }
  }
  return { ...v[v.length - 1] };
}
// Lee un PK escrito de cualquier forma habitual: «1+250», «1+250,5», «1250», «1.250» (miles), «1250 m», «PK 1+250».
function parsePK(txt) {
  let t = String(txt || '').trim().toLowerCase().replace(/^p\.?\s*k\.?\s*/, '').replace(/\s*(m|metros?)$/, '').replace(/\s/g, '');
  if (!t) return NaN;
  let m = /^(\d+)\+(\d+(?:[.,]\d+)?)$/.exec(t);
  if (m) return +m[1] * 1000 + parseFloat(m[2].replace(',', '.'));
  if (/^\d{1,3}([.,]\d{3})+$/.test(t) && !/^0[.,]/.test(t)) return +t.replace(/[.,]/g, ''); // 1.250 / 1,250 → 1250 m
  if (/^\d+(?:[.,]\d+)?$/.test(t)) return parseFloat(t.replace(',', '.'));
  return NaN;
}
// Texto de ayuda para comprobar cómo se ha entendido un PK
function pkReadBack(txt) {
  const v = parsePK(txt); if (!String(txt || '').trim()) return '';
  if (!isFinite(v)) return '⚠ No se entiende. Escribe por ejemplo 1+250 o 1250.';
  return `= PK ${fmtPK(v)}${v > 0 && v < 10 && /[.,]/.test(txt) ? ' (¿querías decir ' + fmtPK(v * 1000) + '? escribe ' + Math.floor(v) + '+' + String(Math.round(v % 1 * 1000)).padStart(3, '0') + ')' : ''}`;
}
// Cotas del MDT05 del IGN (OGC API Coverages, CoverageJSON). Agrupa los puntos en ventanas de ~500 m.
function covGrid(j) {
  const ax = j.domain.axes, rk = Object.keys(j.ranges)[0], rg = j.ranges[rk];
  const axis = a => a.values ? { v0: a.values[0], dv: a.values.length > 1 ? a.values[1] - a.values[0] : 1, n: a.values.length } : { v0: a.start, dv: a.num > 1 ? (a.stop - a.start) / (a.num - 1) : 1, n: a.num };
  const x = axis(ax.x || ax.lon || ax.E), y = axis(ax.y || ax.lat || ax.N);
  const names = rg.axisNames || ['y', 'x'];
  const yFirst = /^(y|lat|N)$/i.test(names[0]);
  return { x, y, yFirst, vals: rg.values, geo: Math.abs(x.v0) <= 180 && Math.abs(y.v0) <= 90 };
}
function sampleGrid(g, p) {
  let X, Y;
  if (g.geo) { X = p.lng; Y = p.lat; } else { const u = toUTM(p.lat, p.lng, 30); X = u.x; Y = u.y; }
  const fi = (X - g.x.v0) / g.x.dv, fj = (Y - g.y.v0) / g.y.dv;
  const i0 = Math.floor(fi), j0 = Math.floor(fj), ti = fi - i0, tj = fj - j0;
  const at = (i, j) => {
    if (i < 0 || j < 0 || i >= g.x.n || j >= g.y.n) return null;
    const v = g.vals[g.yFirst ? j * g.x.n + i : i * g.y.n + j];
    return v == null || !isFinite(v) || v < -500 || v > 9000 ? null : v;
  };
  const q = [at(i0, j0), at(i0 + 1, j0), at(i0, j0 + 1), at(i0 + 1, j0 + 1)];
  if (q.some(v => v == null)) { const ok = q.filter(v => v != null); return ok.length ? ok.reduce((a, b) => a + b) / ok.length : null; }
  return q[0] * (1 - ti) * (1 - tj) + q[1] * ti * (1 - tj) + q[2] * (1 - ti) * tj + q[3] * ti * tj;
}
async function demIGN(pts) {
  const out = new Array(pts.length).fill(null), SPAN = 0.0045;
  let i = 0;
  while (i < pts.length) {
    let j = i, b = [pts[i].lng, pts[i].lat, pts[i].lng, pts[i].lat];
    while (j + 1 < pts.length) {
      const p = pts[j + 1], nb = [Math.min(b[0], p.lng), Math.min(b[1], p.lat), Math.max(b[2], p.lng), Math.max(b[3], p.lat)];
      if (nb[2] - nb[0] > SPAN || nb[3] - nb[1] > SPAN) break;
      b = nb; j++;
    }
    const m = 0.0002, bbox = [b[0] - m, b[1] - m, b[2] + m, b[3] + m].map(v => v.toFixed(6)).join(',');
    const g = covGrid(JSON.parse(await httpGetText(`${DEM_IGN}?f=json&bbox=${bbox}`)));
    for (let k = i; k <= j; k++) out[k] = sampleGrid(g, pts[k]);
    i = j + 1;
  }
  if (out.filter(v => v != null).length < pts.length * 0.8) throw new Error('El MDT del IGN no devolvió cotas para este tramo');
  return out;
}
async function demGlobal(pts) { // Copernicus GLO-90 a través de Open-Meteo (reserva)
  const out = [];
  for (let i = 0; i < pts.length; i += 100) {
    const ch = pts.slice(i, i + 100);
    const j = JSON.parse(await httpGetText(`https://api.open-meteo.com/v1/elevation?latitude=${ch.map(p => p.lat.toFixed(6)).join(',')}&longitude=${ch.map(p => p.lng.toFixed(6)).join(',')}`));
    out.push(...j.elevation);
  }
  return out;
}
async function profileElevations(f, pts, source) {
  if (source === 'kml') return { z: pts.map(p => p.z), label: 'cotas del KML' };
  try { return { z: await demIGN(pts), label: 'MDT05 del IGN (LiDAR, paso de malla 5 m)' }; }
  catch (e) { console.warn('IGN', e); return { z: await demGlobal(pts), label: 'modelo global Copernicus de 90 m (el IGN no respondió; resultado orientativo)' }; }
}

let slopePick = null;
const slopeHL = L.layerGroup().addTo(map);
function showSlopeSegment(f, d0, d1) {
  slopeHL.clearLayers();
  const v = vertexTable(f).filter(p => p.d > d0 && p.d < d1);
  const a = pointAtPK(f, d0), b = pointAtPK(f, d1);
  L.polyline([[a.lat, a.lng], ...v.map(p => [p.lat, p.lng]), [b.lat, b.lng]], { renderer: hlRenderer, color: '#ff6b00', weight: 7, opacity: 0.85, interactive: false }).addTo(slopeHL);
  [[a, fmtPK(d0)], [b, fmtPK(d1)]].forEach(([p, t]) => L.circleMarker([p.lat, p.lng], { renderer: hlRenderer, radius: 7, color: '#fff', weight: 3, fillColor: '#ff6b00', fillOpacity: 1, interactive: false })
    .bindTooltip(t, { permanent: true, direction: 'top', offset: [0, -8], className: 'pk-tip' }).addTo(slopeHL));
}
function slopeSheet(f, rec, d0, d1, opts = {}) {
  const hasZ = kmlHasZ(f);
  const source = opts.source || (hasZ ? 'kml' : 'dem');
  const b = openSheet(`<h2>Pendiente y perfil</h2><p class="sub">${esc(f.name)} · ${esc(rec.name)} · longitud total ${fmtLen(f.length)} (PK ${fmtPK(f.length)})</p>
    <div class="pkrow">
      <div class="field"><label for="pk0">Desde PK</label><input type="text" id="pk0" inputmode="decimal" value="${fmtPK(d0)}"></div>
      <div class="field"><label for="pk1">Hasta PK</label><input type="text" id="pk1" inputmode="decimal" value="${fmtPK(d1)}"></div>
    </div>
    ${hasZ ? `<div class="field"><label for="zsrc">Cotas</label><select id="zsrc"><option value="kml" ${source === 'kml' ? 'selected' : ''}>Las del KML</option><option value="dem" ${source === 'dem' ? 'selected' : ''}>Modelo del terreno (MDT05 del IGN)</option></select></div>` : ''}
    <div class="acts">
      <button class="btn pri full" data-a="calc">${ICON.slope}Calcular pendiente</button>
      <button class="btn" data-a="pick">Elegir tramo en el mapa</button>
      <button class="btn" data-a="all">Toda la traza</button>
    </div>
    <p class="hint">Escribe los PK como 0+350 o en metros (350).</p>
    <div id="slopeRes"></div>`);
  showSlopeSegment(f, d0, d1);
  onSheetClose(() => { if (!slopePick) slopeHL.clearLayers(); });
  const read = () => {
    let a = parsePK($('#pk0').value), c = parsePK($('#pk1').value);
    if (!isFinite(a) || !isFinite(c)) { toast('Revisa los PK: escríbelos como 0+350 o en metros.'); return null; }
    if (a > c) [a, c] = [c, a];
    a = Math.max(0, a); c = Math.min(f.length, c);
    $('#pk0').value = fmtPK(a); $('#pk1').value = fmtPK(c);
    if (c - a < 5) { toast('El tramo es demasiado corto. Elige al menos 5 m.'); return null; }
    return [a, c];
  };
  const src = () => ($('#zsrc') ? $('#zsrc').value : 'dem');
  b.querySelector('[data-a=calc]').onclick = () => { const r = read(); if (r) { showSlopeSegment(f, r[0], r[1]); computeSlope(f, rec, r[0], r[1], src()); } };
  b.querySelector('[data-a=all]').onclick = () => { $('#pk0').value = fmtPK(0); $('#pk1').value = fmtPK(f.length); showSlopeSegment(f, 0, f.length); computeSlope(f, rec, 0, f.length, src()); };
  b.querySelector('[data-a=pick]').onclick = () => {
    slopePick = { f, rec, pts: [], source: src() };
    closeSheet(); slopeHL.clearLayers();
    $('#pickText').textContent = 'Toca en el mapa el inicio del tramo';
    $('#pickBar').hidden = false;
  };
  if (opts.autorun) computeSlope(f, rec, d0, d1, source);
}
var slopePickPoint = function (ll) {
  const sp = slopePick; if (!sp) return;
  const r = pkAt(sp.f, L.latLng(ll));
  sp.pts.push(r.d);
  const p = pointAtPK(sp.f, r.d);
  L.circleMarker([p.lat, p.lng], { renderer: hlRenderer, radius: 7, color: '#fff', weight: 3, fillColor: '#ff6b00', fillOpacity: 1, interactive: false })
    .bindTooltip(fmtPK(r.d), { permanent: true, direction: 'top', offset: [0, -8], className: 'pk-tip' }).addTo(slopeHL);
  if (r.off > 60) toast(`Has tocado a ${Math.round(r.off)} m de la traza: se usa el punto más cercano (PK ${fmtPK(r.d)}).`, 4000);
  if (sp.pts.length === 1) { $('#pickText').textContent = `Inicio en PK ${fmtPK(r.d)}. Toca ahora el final del tramo`; return; }
  const [a, c] = sp.pts[0] <= sp.pts[1] ? sp.pts : [sp.pts[1], sp.pts[0]];
  slopePick = null; $('#pickBar').hidden = true;
  slopeSheet(sp.f, sp.rec, a, c, { source: sp.source, autorun: true });
};
$('#pickCancel').onclick = () => { offPick = false; calcPick = null; slopePick = null; $('#pickBar').hidden = true; slopeHL.clearLayers(); if (actPick) { actPick = null; renderActEditor(); } if (widthPick) { widthPick = null; renderWidthSheet(); } };

const fmtPct = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2).replace('.', ',') + ' %';
const fmtZ = z => z.toFixed(2).replace('.', ',') + ' m';
async function computeSlope(f, rec, d0, d1, source) {
  const box = $('#slopeRes'); if (!box) return;
  const L0 = d1 - d0, step = Math.min(25, Math.max(5, L0 / 200));
  let ds = []; for (let d = d0; d < d1; d += step) ds.push(d); ds.push(d1);
  // con cotas del KML se añaden los vértices: los cambios de pendiente caen exactamente donde están
  if (source === 'kml') { const vs = vertexTable(f).map(v => v.d).filter(d => d > d0 && d < d1); if (vs.length < 20000) ds = [...new Set([...ds, ...vs].map(d => Math.round(d * 1000) / 1000))].sort((a, b) => a - b); }
  const pts = ds.map(d => pointAtPK(f, d));
  box.innerHTML = `<p class="hint">Obteniendo ${pts.length} cotas…</p>`;
  let res;
  try { res = await profileElevations(f, pts, source); }
  catch (e) { box.innerHTML = '<p class="hint">No se pudieron obtener las cotas del terreno. Comprueba la conexión y vuelve a intentarlo.</p>'; return; }
  const prof = ds.map((d, i) => ({ d, z: res.z[i] })).filter(p => p.z != null && isFinite(p.z));
  prof.src = source === 'kml' ? 'kml' : 'dem';
  if (prof.length < 2) { box.innerHTML = '<p class="hint">No hay cotas suficientes para este tramo.</p>'; return; }
  const zi = prof[0].z, zf = prof[prof.length - 1].z, dz = zf - zi, len = prof[prof.length - 1].d - prof[0].d;
  const media = dz / len * 100;
  let up = 0, down = 0; for (let i = 1; i < prof.length; i++) { const v = prof[i].z - prof[i - 1].z; v > 0 ? up += v : down -= v; }
  const zmax = prof.reduce((a, b) => (b.z > a.z ? b : a)), zmin = prof.reduce((a, b) => (b.z < a.z ? b : a));
  // pendientes por subtramos de 100 m (o la décima parte si el tramo es corto)
  const win = Math.min(100, Math.max(20, len / 10)); let smax = null, smin = null;
  for (let k = 0; k < prof.length; k++) {
    const target = prof[k].d + win; let j = k; while (j < prof.length - 1 && prof[j].d < target) j++;
    if (prof[j].d - prof[k].d < win * 0.8) break;
    const s = (prof[j].z - prof[k].z) / (prof[j].d - prof[k].d) * 100;
    if (!smax || s > smax.s) smax = { s, a: prof[k].d, b: prof[j].d };
    if (!smin || s < smin.s) smin = { s, a: prof[k].d, b: prof[j].d };
  }
  const word = Math.abs(media) < 0.05 ? 'prácticamente horizontal' : media > 0 ? 'sube en el sentido del PK' : 'baja en el sentido del PK';
  const text = `${f.name} · PK ${fmtPK(d0)} a ${fmtPK(d1)}\nLongitud: ${fmtLen(len)}\nCota inicial: ${fmtZ(zi)} · Cota final: ${fmtZ(zf)}\nDesnivel: ${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))}\nPendiente media: ${fmtPct(media)} (${word})\nFuente: ${res.label}`;
  box.innerHTML = `<div class="slope-main"><span>${fmtPct(media)}</span><small>pendiente media · ${word}</small></div>
    <table class="attrs">
      <tr><td>Tramo</td><td>PK ${fmtPK(d0)} a ${fmtPK(d1)} · ${fmtLen(len)}</td></tr>
      <tr><td>Cota inicial / final</td><td>${fmtZ(zi)} / ${fmtZ(zf)}</td></tr>
      <tr><td>Desnivel</td><td>${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))} (${(Math.abs(dz) / len * 1000).toFixed(1).replace('.', ',')} m/km)</td></tr>
      <tr><td>Cota máxima</td><td>${fmtZ(zmax.z)} en PK ${fmtPK(zmax.d)}</td></tr>
      <tr><td>Cota mínima</td><td>${fmtZ(zmin.z)} en PK ${fmtPK(zmin.d)}</td></tr>
      <tr><td>Subida / bajada acumulada</td><td>+${up.toFixed(1).replace('.', ',')} m / −${down.toFixed(1).replace('.', ',')} m</td></tr>
      ${smax && smax.s > 0 ? `<tr><td>Mayor subida (tramos de ${Math.round(win)} m)</td><td>${fmtPct(smax.s)} entre PK ${fmtPK(smax.a)} y ${fmtPK(smax.b)}</td></tr>` : ''}
      ${smin && smin.s < 0 ? `<tr><td>Mayor bajada (tramos de ${Math.round(win)} m)</td><td>${fmtPct(smin.s)} entre PK ${fmtPK(smin.a)} y ${fmtPK(smin.b)}</td></tr>` : ''}
    </table>
    ${profileSVG(prof)}
    <p class="hint">Cotas: ${esc(res.label)}. Pendiente media = desnivel entre extremos ÷ longitud en planta.</p>
    <div class="acts"><button class="btn full" data-a="copyres">${ICON.copy}Copiar resultados</button></div>
    <h3 class="sh" id="slClassH">Tramificación por rangos de pendiente</h3>
    <div class="pkrow"><div class="field"><label for="slBr">Límites de los rangos (%)</label><input type="text" id="slBr" inputmode="decimal" value="${esc((settings.slopeBreaks || [5, 10, 20]).join('; '))}"></div>
      <div class="field"><label for="slCMin">Tramo mínimo (m)</label><input type="text" id="slCMin" inputmode="decimal" value="${settings.slopeMin ?? 20}"></div></div>
    <div class="acts"><button class="btn full" data-a="classify">${ICON.slope}Recalcular rangos</button></div>
    <div id="slClass"></div>
    <h3 class="sh">Buscar tramos por pendiente</h3>
    <div class="pkrow"><div class="field"><label for="slLe">Pendiente ≤ (%)</label><input type="text" id="slLe" inputmode="decimal" placeholder="p. ej. 2"></div>
      <div class="field"><label for="slGe">Pendiente ≥ (%)</label><input type="text" id="slGe" inputmode="decimal" placeholder="p. ej. 8"></div></div>
    <div class="field row"><label class="opt grow" style="padding:0"><input type="checkbox" id="slAbs" checked>En valor absoluto (subidas y bajadas)</label><label for="slMin" class="grow" style="text-align:right">Tramo mínimo (m)</label><input type="text" id="slMin" inputmode="decimal" value="20" style="max-width:70px"></div>
    <div class="acts"><button class="btn full" data-a="ranges">${ICON.slope}Buscar tramos</button></div>
    <div id="slRanges"></div>`;
  box.querySelector('[data-a=copyres]').onclick = () => copyText(text);
  box.querySelector('[data-a=ranges]').onclick = () => slopeRanges(f, prof);
  box.querySelector('[data-a=classify]').onclick = () => slopeClasses(f, prof, true);
  slopeClasses(f, prof, false);
  if (slopeScrollToClass) { slopeScrollToClass = false; setTimeout(() => { const h = $('#slClassH'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }
}
let slopeScrollToClass = false;
/* Tramificación de la traza por rangos de pendiente (por defecto < 5 %, 5–10 %, 10–20 % y ≥ 20 %, en valor absoluto)
   Pendiente suavizada en ventanas de 20 m; los tramos más cortos que el mínimo se unen al tramo vecino. */
const SLOPE_COLORS = ['#2f9e44', '#f2c94c', '#f08c00', '#e03131', '#862e9c', '#343a40'];
function slopeCells(prof) {
  const zAt = d => { for (let i = 1; i < prof.length; i++) if (prof[i].d >= d) { const a = prof[i - 1], b = prof[i]; return a.z + (b.z - a.z) * (d - a.d) / ((b.d - a.d) || 1); } return prof[prof.length - 1].z; };
  const d0 = prof[0].d, d1 = prof[prof.length - 1].d;
  if (prof.src === 'kml') { // cotas del KML: el perfil es exacto, cada tramo entre puntos tiene su pendiente (sin suavizar)
    const cells = []; for (let i = 1; i < prof.length; i++) { const a = prof[i - 1], b = prof[i]; if (b.d > a.d) cells.push({ a: a.d, b: b.d, s: (b.z - a.z) / (b.d - a.d) * 100 }); }
    return { cells, zAt, d0, d1 };
  }
  const W = 20, st = Math.max(1, Math.min(5, (d1 - d0) / 500)), cells = []; // modelo del terreno: se suaviza en ventanas de 20 m
  for (let d = d0; d < d1 - 1e-6; d += st) {
    const e = Math.min(d1, d + st), m = (d + e) / 2, a = Math.max(d0, m - W / 2), b = Math.min(d1, m + W / 2);
    cells.push({ a: d, b: e, s: b > a ? (zAt(b) - zAt(a)) / (b - a) * 100 : 0 });
  }
  return { cells, zAt, d0, d1 };
}
function slopeClasses(f, prof, fromUser) {
  const box = $('#slClass'); if (!box) return;
  const br = String($('#slBr').value || '').split(/[;\s]+/).map(parseNum).filter(v => isFinite(v) && v > 0).sort((a, b) => a - b).filter((v, i, a) => i === 0 || v !== a[i - 1]).slice(0, 5);
  if (!br.length) { box.innerHTML = '<p class="hint">Escribe los límites separados por punto y coma, por ejemplo 5; 10; 20.</p>'; return; }
  const minL = Math.max(0, parseNum($('#slCMin').value) || 0);
  if (fromUser) { settings.slopeBreaks = br; settings.slopeMin = minL; saveSettings(); }
  const n = v => String(v).replace('.', ',');
  const labels = br.map((v, i) => i === 0 ? `Menor del ${n(v)} %` : `Entre el ${n(br[i - 1])} y el ${n(v)} %`).concat([`${n(br[br.length - 1])} % o más`]);
  const cls = v => { const a = Math.abs(v); let k = 0; while (k < br.length && a >= br[k]) k++; return k; };
  const { cells, zAt, d0, d1 } = slopeCells(prof), L0 = d1 - d0;
  // tramos continuos de la misma clase
  let runs = [];
  cells.forEach(c => { const k = cls(c.s), last = runs[runs.length - 1]; if (last && last.k === k) last.b = c.b; else runs.push({ a: c.a, b: c.b, k }); });
  // los tramos cortos se unen al vecino de clase más parecida (y, si empata, al más largo)
  while (runs.length > 1) {
    let i = -1, mn = Infinity; runs.forEach((r, j) => { const l = r.b - r.a; if (l < minL && l < mn) { mn = l; i = j; } });
    if (i < 0) break;
    const r = runs[i], L = runs[i - 1], R = runs[i + 1];
    const t = !L ? R : !R ? L : (Math.abs(L.k - r.k) < Math.abs(R.k - r.k) || (Math.abs(L.k - r.k) === Math.abs(R.k - r.k) && L.b - L.a >= R.b - R.a)) ? L : R;
    t.a = Math.min(t.a, r.a); t.b = Math.max(t.b, r.b); runs.splice(i, 1);
    for (let j = runs.length - 1; j > 0; j--) if (runs[j].k === runs[j - 1].k) { runs[j - 1].b = runs[j].b; runs.splice(j, 1); }
  }
  runs = runs.map(r => {
    const cs = cells.filter(c => c.a >= r.a - 1e-6 && c.b <= r.b + 1e-6), len = r.b - r.a;
    return { ...r, len, s: (zAt(r.b) - zAt(r.a)) / (len || 1) * 100, sAbs: cs.reduce((t, c) => t + Math.abs(c.s) * (c.b - c.a), 0) / (len || 1) };
  });
  const tot = labels.map((lb, k) => { const rr = runs.filter(r => r.k === k); return { lb, k, len: rr.reduce((t, r) => t + r.len, 0), n: rr.length }; });
  // indicadores medios de la traza
  const meanAbs = cells.reduce((t, c) => t + Math.abs(c.s) * (c.b - c.a), 0) / (L0 || 1);
  let up = 0, down = 0; for (let i = 1; i < prof.length; i++) { const v = prof[i].z - prof[i - 1].z; v > 0 ? up += v : down -= v; }
  const dz = prof[prof.length - 1].z - prof[0].z, mean = dz / (L0 || 1) * 100, perKm = (up + down) / (L0 || 1) * 1000;
  // mapa
  slopeHL.clearLayers(); showSlopeSegment(f, d0, d1);
  runs.forEach(r => L.polyline(segmentCoords(f, r.a, r.b), { renderer: hlRenderer, color: SLOPE_COLORS[r.k], weight: 9, opacity: 0.9, interactive: false }).addTo(slopeHL));
  const pc = v => (v / (L0 || 1) * 100).toFixed(1).replace('.', ',') + ' %';
  box.innerHTML = `<table class="attrs ranges"><tr><th>Rango</th><th>Longitud</th><th>% traza</th><th>Tramos</th></tr>
      ${tot.map(t => `<tr><td><span class="dot" style="background:${SLOPE_COLORS[t.k]}"></span>${t.lb}</td><td>${fmtLen(t.len)}</td><td>${pc(t.len)}</td><td>${t.n}</td></tr>`).join('')}
      <tr class="tot"><td>Total</td><td>${fmtLen(L0)}</td><td>100 %</td><td>${runs.length}</td></tr></table>
    <table class="attrs">
      <tr><td>Pendiente media de la traza</td><td><b>${fmtPct(mean)}</b> (desnivel entre extremos ${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))} en ${fmtLen(L0)})</td></tr>
      <tr><td>Pendiente media absoluta</td><td><b>${meanAbs.toFixed(2).replace('.', ',')} %</b> (media de subidas y bajadas, ponderada por longitud)</td></tr>
      <tr><td>Desnivel medio</td><td><b>${perKm.toFixed(1).replace('.', ',')} m/km</b> (subida + bajada acumulada: +${up.toFixed(1).replace('.', ',')} / −${down.toFixed(1).replace('.', ',')} m)</td></tr>
    </table>
    <details class="tramos"><summary>Ver los ${runs.length} tramos con sus PK</summary><table class="attrs"><tr><th>PK</th><th>Long.</th><th>Pend.</th><th>Rango</th></tr>
      ${runs.map(r => `<tr><td>${fmtPK(r.a)} – ${fmtPK(r.b)}</td><td>${fmtLen(r.len)}</td><td>${fmtPct(r.s)}</td><td><span class="dot" style="background:${SLOPE_COLORS[r.k]}"></span>${labels[r.k]}</td></tr>`).join('')}</table></details>
    <p class="hint">Rangos en valor absoluto (subidas y bajadas por igual), con la pendiente ${prof.src === 'kml' ? 'exacta de cada tramo entre vértices (cotas del KML)' : 'del terreno medida en ventanas de 20 m'}. Los tramos de menos de ${n(minL)} m se unen al vecino. Colores en el mapa: ${tot.map(t => `<span class="dot" style="background:${SLOPE_COLORS[t.k]}"></span>${t.lb.toLowerCase()}`).join(' · ')}.</p>
    <div class="acts"><button class="btn" data-a="clcopy">${ICON.copy}Copiar</button><button class="btn" data-a="clcsv">CSV para Excel</button><button class="btn" data-a="clkmz">KMZ coloreado</button></div>`;
  const summary = `${f.name} · PK ${fmtPK(d0)} a ${fmtPK(d1)} · ${fmtLen(L0)}\n` + tot.map(t => `${t.lb}: ${fmtLen(t.len)} (${pc(t.len)}) · ${t.n} tramos`).join('\n')
    + `\nPendiente media: ${fmtPct(mean)}\nPendiente media absoluta: ${meanAbs.toFixed(2).replace('.', ',')} %\nDesnivel medio: ${perKm.toFixed(1).replace('.', ',')} m/km (+${up.toFixed(1).replace('.', ',')} / −${down.toFixed(1).replace('.', ',')} m)`;
  box.querySelector('[data-a=clcopy]').onclick = () => copyText(summary);
  const base = `pendientes_${safeName(f.name)}`;
  box.querySelector('[data-a=clcsv]').onclick = () => {
    const q = csvQ, d = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
    const rows = [['resumen'], ['rango', 'longitud_m', 'porcentaje', 'n_tramos']].concat(tot.map(t => [t.lb, d(t.len), d(t.len / L0 * 100), t.n]))
      .concat([[], ['pendiente_media_%', d(mean)], ['pendiente_media_absoluta_%', d(meanAbs)], ['desnivel_medio_m_km', d(perKm)], ['subida_acumulada_m', d(up)], ['bajada_acumulada_m', d(down)], [],
        ['tramos'], ['pk_inicio', 'pk_fin', 'longitud_m', 'pendiente_%', 'pendiente_abs_media_%', 'rango']])
      .concat(runs.map(r => [fmtPK(r.a), fmtPK(r.b), d(r.len), d(r.s), d(r.sAbs), labels[r.k]]));
    saveBlob(new Blob(['\ufeff' + rows.map(r => r.map(q).join(';')).join('\r\n')], { type: 'text/csv' }), base + '.csv').catch(() => {});
  };
  box.querySelector('[data-a=clkmz]').onclick = async () => {
    const kc = h => 'ff' + h.slice(5, 7) + h.slice(3, 5) + h.slice(1, 3);
    const k = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="${KML_NS}"><Document><name>${xml('Pendientes · ' + f.name)}</name>
${tot.map(t => `<Style id="r${t.k}"><LineStyle><color>${kc(SLOPE_COLORS[t.k])}</color><width>6</width></LineStyle></Style>`).join('')}
${tot.map(t => `<Folder><name>${xml(t.lb)} · ${fmtLen(t.len)}</name>${runs.filter(r => r.k === t.k).map(r => `<Placemark><name>PK ${fmtPK(r.a)} – ${fmtPK(r.b)}</name><styleUrl>#r${t.k}</styleUrl><description>${xml(`${t.lb} · ${fmtLen(r.len)} · pendiente ${fmtPct(r.s)}`)}</description>
<ExtendedData><Data name="pk_inicio"><value>${fmtPK(r.a)}</value></Data><Data name="pk_fin"><value>${fmtPK(r.b)}</value></Data><Data name="longitud_m"><value>${r.len.toFixed(1)}</value></Data><Data name="pendiente_pct"><value>${r.s.toFixed(2)}</value></Data><Data name="rango"><value>${xml(t.lb)}</value></Data></ExtendedData>
<LineString><tessellate>1</tessellate><coordinates>${segmentCoords(f, r.a, r.b).map(c => `${c[1]},${c[0]},0`).join(' ')}</coordinates></LineString></Placemark>`).join('')}</Folder>`).join('\n')}
</Document></kml>`;
    const z = new JSZip(); z.file('doc.kml', k); saveBlob(await z.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' }), base + '.kmz').catch(() => {});
  };
}
// Clasifica la traza en tramos que cumplen pendiente ≤ X o ≥ Y (pendiente suavizada en ventanas de 20 m)
function slopeRanges(f, prof) {
  const le = parseNum($('#slLe').value), ge = parseNum($('#slGe').value), abs = $('#slAbs').checked, minL = Math.max(0, parseNum($('#slMin').value) || 0);
  if (!isFinite(le) && !isFinite(ge)) { toast('Escribe al menos uno de los dos límites.'); return; }
  const zAt = d => { for (let i = 1; i < prof.length; i++) if (prof[i].d >= d) { const a = prof[i - 1], b = prof[i]; return a.z + (b.z - a.z) * (d - a.d) / ((b.d - a.d) || 1); } return prof[prof.length - 1].z; };
  const d0 = prof[0].d, d1 = prof[prof.length - 1].d, W = 20, st = Math.max(2, Math.min(5, (d1 - d0) / 500));
  const cells = [];
  for (let d = d0; d < d1; d += st) {
    const e = Math.min(d1, d + st), m = (d + e) / 2, a = Math.max(d0, m - W / 2), b = Math.min(d1, m + W / 2);
    let sl = b > a ? (zAt(b) - zAt(a)) / (b - a) * 100 : 0; const v = abs ? Math.abs(sl) : sl;
    cells.push({ a: d, b: e, v });
  }
  const runs = test => {
    const out = []; let cur = null;
    cells.forEach(c => { if (test(c.v)) { if (cur && Math.abs(cur.b - c.a) < 0.01) cur.b = c.b; else { cur = { a: c.a, b: c.b }; out.push(cur); } } else cur = null; });
    return out.filter(r => r.b - r.a >= minL).map(r => ({ ...r, s: (zAt(r.b) - zAt(r.a)) / (r.b - r.a) * 100 }));
  };
  const lo = isFinite(le) ? runs(v => v <= le) : [], hi = isFinite(ge) ? runs(v => v >= ge) : [];
  slopeHL.clearLayers(); showSlopeSegment(f, d0, d1);
  const draw = (list, color) => list.forEach(r => L.polyline(segmentCoords(f, r.a, r.b), { renderer: hlRenderer, color, weight: 9, opacity: 0.9, interactive: false }).addTo(slopeHL));
  draw(lo, '#2f9e44'); draw(hi, '#e03131');
  const tot = l => l.reduce((s2, r) => s2 + r.b - r.a, 0), L0 = d1 - d0;
  const table = (list, label, color) => list.length ? `<p class="rhead"><span class="dot" style="background:${color}"></span><b>${label}</b> · ${list.length} tramo${list.length === 1 ? '' : 's'} · ${fmtLen(tot(list))} (${(tot(list) / L0 * 100).toFixed(1).replace('.', ',')} % del tramo)</p>
    <table class="attrs">${list.map(r => `<tr><td>PK ${fmtPK(r.a)} – ${fmtPK(r.b)}</td><td>${fmtLen(r.b - r.a)} · ${fmtPct(r.s)}</td></tr>`).join('')}</table>` : `<p class="hint">${label}: ningún tramo de al menos ${minL} m.</p>`;
  const sym = abs ? '|pendiente|' : 'pendiente';
  $('#slRanges').innerHTML = (isFinite(le) ? table(lo, `${sym} ≤ ${String(le).replace('.', ',')} %`, '#2f9e44') : '') + (isFinite(ge) ? table(hi, `${sym} ≥ ${String(ge).replace('.', ',')} %`, '#e03131') : '')
    + '<p class="hint">Los tramos se marcan en el mapa: verde para ≤ y rojo para ≥.</p>';
}
function profileSVG(prof) {
  const W = 360, H = 170, pl = 46, pr = 10, pt = 10, pb = 26;
  const d0 = prof[0].d, d1 = prof[prof.length - 1].d;
  let z0 = Math.min(...prof.map(p => p.z)), z1 = Math.max(...prof.map(p => p.z));
  if (z1 - z0 < 2) { const m = (z0 + z1) / 2; z0 = m - 1; z1 = m + 1; }
  const pad = (z1 - z0) * 0.08; z0 -= pad; z1 += pad;
  const X = d => pl + (d - d0) / (d1 - d0 || 1) * (W - pl - pr), Y = z => pt + (1 - (z - z0) / (z1 - z0)) * (H - pt - pb);
  const line = prof.map((p, i) => `${i ? 'L' : 'M'}${X(p.d).toFixed(1)},${Y(p.z).toFixed(1)}`).join('');
  const area = `${line}L${X(d1).toFixed(1)},${H - pb}L${X(d0).toFixed(1)},${H - pb}Z`;
  const ticksZ = [0, 0.5, 1].map(t => z0 + pad + t * (z1 - z0 - 2 * pad));
  const ticksD = [d0, (d0 + d1) / 2, d1];
  return `<div class="profile"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Perfil longitudinal">
    ${ticksZ.map(z => `<line x1="${pl}" x2="${W - pr}" y1="${Y(z).toFixed(1)}" y2="${Y(z).toFixed(1)}" class="pg"/><text x="${pl - 4}" y="${(Y(z) + 4).toFixed(1)}" text-anchor="end" class="pt">${Math.round(z)}</text>`).join('')}
    <path d="${area}" class="pa"/><path d="${line}" class="pl"/>
    ${ticksD.map((d, i) => `<text x="${X(d).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}" class="pt">${fmtPK(d)}</text>`).join('')}
    <circle cx="${X(d0).toFixed(1)}" cy="${Y(prof[0].z).toFixed(1)}" r="3.5" class="pe"/><circle cx="${X(d1).toFixed(1)}" cy="${Y(prof[prof.length - 1].z).toFixed(1)}" r="3.5" class="pe"/>
  </svg></div>`;
}
