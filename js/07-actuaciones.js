'use strict';
/* OBRA-GIS · Actuaciones: catálogo, mediciones, editor, ficha y listado.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Actuaciones sobre las trazas (caminos) ----------------
   Catálogo por familias: cada tipo indica qué datos se piden (ancho, espesor, altura…) y con ellos se calculan
   las mediciones (longitud, superficie, volumen, peso, unidades). Densidades orientativas para pasar m³ a t. */
const ACT_FIELDS = {
  w: { l: 'Ancho', u: 'm', ph: 'p. ej. 4,0' },
  e: { l: 'Espesor de capa', u: 'cm', ph: 'p. ej. 20' },
  h: { l: 'Altura media', u: 'm', ph: 'p. ej. 2,0' },
  b: { l: 'Anchura media de la sección', u: 'm', ph: 'p. ej. 1,5' },
  S: { l: 'Sobreancho máximo', u: 'm', ph: 'p. ej. 3,0' },
  n: { l: 'Unidades', u: 'ud', ph: 'p. ej. 1' },
  dia: { l: 'Diámetro', u: 'mm', ph: 'p. ej. 600' },
  lt: { l: 'Longitud de cada tubo', u: 'm', ph: 'p. ej. 6' },
  dot: { l: 'Dotación', u: 'kg/m²', ph: 'p. ej. 1,2' },
  pct: { l: 'Dotación de conglomerante', u: '%', ph: 'p. ej. 3' },
  area: { l: 'Superficie', u: 'm²', ph: 'medida a mano' },
  vol: { l: 'Volumen', u: 'm³', ph: 'medido a mano' },
};
// Valores admitidos (para avisar de errores de tecleo: «-3», «99999999»…)
const ACT_RANGE = { w: [0.1, 60], e: [0.5, 150], h: [0.1, 40], b: [0.05, 40], S: [0.1, 60], n: [1, 100000], dia: [50, 5000], lt: [0.5, 200], dot: [0.05, 20], pct: [0.5, 30], area: [0.1, 1e6], vol: [0.01, 1e6] };
// [nombre, color, campos, opciones] · opciones: road (el ancho por defecto es el del camino), dens (t/m³), mat (lista de materiales/tipos), hint
const ACT_CATS = [
  { id: 'veg', name: 'Desbroce y limpieza', items: [
    ['Desbroce de márgenes', '#7cb342', ['w'], { hint: 'Ancho de la franja desbrozada en cada margen', mat: ['Manual', 'Mecanizado'] }],
    ['Desbroce de la traza', '#9ccc65', ['w'], { road: true, mat: ['Manual', 'Mecanizado'] }],
    ['Tala y poda de arbolado', '#558b2f', ['n'], { hint: 'Número de árboles' }],
    ['Limpieza de cunetas', '#8bc34a', [], { hint: 'Se mide en metros de cuneta. Ambos márgenes cuenta doble.' }],
    ['Limpieza de obra de drenaje', '#43a047', ['n'], {}],
  ] },
  { id: 'dem', name: 'Demoliciones y firme existente', items: [
    ['Demolición de firme existente', '#6d4c41', ['w', 'e'], { road: true, mat: ['Hormigón', 'Aglomerado asfáltico', 'Tratamiento superficial', 'Zahorra'] }],
    ['Fresado de firme asfáltico', '#5d4037', ['w', 'e'], { road: true }],
    ['Machacado y escarificado de firme', '#8d6e63', ['w', 'e'], { road: true, hint: 'Escarificado y machacado del firme existente para reutilizarlo' }],
    ['Demolición de obra de fábrica', '#4e342e', ['n', 'vol'], { mat: ['Caño / tubo', 'Muro', 'Badén', 'Cuneta', 'Arqueta', 'Otra'] }],
  ] },
  { id: 'exp', name: 'Explanada y subbase', items: [
    ['Refino y planeo sin aporte', '#a1887f', ['w'], { road: true, hint: 'Perfilado, refino y compactación de la explanada sin aportar material' }],
    ['Escarificado y compactación', '#bcaaa4', ['w'], { road: true }],
    ['Excavación / desmonte', '#795548', ['w', 'h'], { mat: ['Terreno compacto', 'Tránsito', 'Roca'] }],
    ['Terraplén / relleno', '#a67c52', ['w', 'h'], { mat: ['Material de la excavación', 'Material de préstamo'] }],
    ['Estabilización de suelos', '#c0a16b', ['w', 'e', 'pct'], { road: true, mat: ['Con cal', 'Con cemento', 'Mecánica'] }],
    ['Subbase de zahorra natural', '#d4b483', ['w', 'e'], { road: true, dens: 2.1 }],
    ['Otra actuación en la explanada', '#9e9d24', ['w'], { road: true }],
  ] },
  { id: 'firme', name: 'Firmes y pavimentos', items: [
    ['Zahorra artificial', '#b08d3c', ['w', 'e'], { road: true, dens: 2.25, mat: ['ZA 0/32', 'ZA 0/20', 'Otra'] }],
    ['Pavimento de hormigón', '#90a4ae', ['w', 'e'], { road: true, dens: 2.4, mat: ['HM-20', 'HM-25', 'HF (con fibras)', 'HA con mallazo'] }],
    ['Aglomerado asfáltico en caliente', '#263238', ['w', 'e'], { road: true, dens: 2.4, mat: ['AC16 surf', 'AC22 bin', 'AC16 surf D/S', 'Otra mezcla'] }],
    ['Aglomerado asfáltico en frío', '#455a64', ['w', 'e'], { road: true, dens: 2.3 }],
    ['Tratamiento superficial', '#546e7a', ['w', 'dot'], { road: true, mat: ['Monocapa', 'Bicapa', 'Tricapa', 'Lechada bituminosa'], hint: 'Dotación de ligante (emulsión)' }],
    ['Riego de imprimación / adherencia', '#78909c', ['w', 'dot'], { road: true, mat: ['Imprimación', 'Adherencia', 'Curado'] }],
    ['Bacheo', '#37474f', ['area', 'e'], { mat: ['Con aglomerado', 'Con hormigón', 'Con zahorra'] }],
  ] },
  { id: 'dren', name: 'Drenaje', items: [
    ['Cuneta en tierra', '#a1887f', [], { mat: ['Triangular', 'Trapecial'] }],
    ['Cuneta revestida', '#1e88e5', ['b', 'e'], { dens: 2.4, mat: ['Hormigón triangular', 'Hormigón trapecial', 'Prefabricada'], hint: 'Anchura desarrollada y espesor del revestimiento' }],
    ['Badén', '#00acc1', ['w', 'e'], { road: true, dens: 2.4, mat: ['Hormigón', 'Hormigón con escollera', 'Prefabricado'] }],
    ['Caño / obra de drenaje', '#3949ab', ['n', 'dia', 'lt'], { mat: ['Tubo de hormigón', 'Tubo de PEAD / PVC', 'Marco', 'Bóveda'] }],
    ['Paso salvacunetas', '#00897b', ['n', 'dia', 'lt'], {}],
    ['Arqueta / pozo', '#8e24aa', ['n'], { mat: ['Arqueta de entrada', 'Arqueta de salida', 'Pozo'] }],
    ['Boquilla / aletas', '#5e35b1', ['n'], {}],
  ] },
  { id: 'cont', name: 'Muros, escolleras y contención', items: [
    ['Escollera', '#8d6e63', ['h', 'b'], { hint: 'Altura y anchura media: volumen = altura × anchura × longitud', mat: ['Piedra 300–500 kg', 'Piedra 500–1000 kg', 'Hormigonada'] }],
    ['Muro', '#757575', ['h', 'b'], { mat: ['Hormigón armado', 'Mampostería', 'Gaviones', 'Bloque'] }],
    ['Gaviones', '#9e9e9e', ['h', 'b'], {}],
    ['Barrera / bionda', '#e53935', [], { mat: ['Bionda metálica', 'Barrera mixta madera-metal', 'Pretil'] }],
  ] },
  { id: 'punt', name: 'Sobreanchos y puntuales', items: [
    ['Sobreancho / abanico', '#f9a825', ['S', 'e'], { forma: true, hint: 'Longitud = tramo de PK. Superficie según la forma: triangular ½·L·S, trapecial ¾·L·S, rectangular L·S' }],
    ['Apartadero / zona de cruce', '#fbc02d', ['S', 'e'], { hint: 'Superficie = longitud × sobreancho' }],
    ['Entronque / intersección', '#ff8f00', ['n', 'area'], {}],
    ['Acceso a finca', '#ffb300', ['n'], {}],
  ] },
  { id: 'otros', name: 'Señalización y otros', items: [
    ['Señalización vertical', '#d81b60', ['n'], { mat: ['Señal de peligro', 'Señal de prescripción', 'Cartel de obra', 'Hito'] }],
    ['Otro', '#f4511e', ['w', 'e', 'n'], {}],
  ] },
];
const ACT_FORMS = { tri: ['Triangular', 0.5], trap: ['Trapecial', 0.75], rect: ['Rectangular', 1] };
const ACT_PRIO = { alta: ['Alta', '#e03131'], media: ['Media', '#f08c00'], baja: ['Baja', '#2f9e44'] };
const ACT_ITEMS = ACT_CATS.flatMap(c => c.items.map(([name, color, fields, o]) => ({ name, color, fields, ...o, cat: c.id, catName: c.name })));
const ACT_LEGACY = { 'Firme / pavimento': '#455a64', 'Reperfilado / desbroce': '#7cb342' };  // tipos de versiones anteriores
const ACT_TYPES = ACT_ITEMS.map(i => [i.name, i.color]).concat(Object.entries(ACT_LEGACY)); // (lo usan la exportación KMZ y otros módulos)
// tipos antiguos: sin campos; tipos con nombre propio («Otro» → «Hito kilométrico»): los mismos campos que «Otro» (ancho, espesor, unidades)
const actItem = t => ACT_ITEMS.find(i => i.name === t) || (ACT_LEGACY[t] ? { name: t, color: ACT_LEGACY[t], fields: [], cat: 'otros', catName: 'Señalización y otros', legacy: true }
  : { name: t, color: '#f4511e', fields: ['w', 'e', 'n'], cat: 'otros', catName: 'Señalización y otros', legacy: true, custom: true });
const SIDES = { izq: 'Margen izquierdo', der: 'Margen derecho', ambos: 'Ambos márgenes', eje: 'Eje / calzada' };
const SIDE_ABBR = { izq: 'MI', der: 'MD', ambos: 'AM', eje: 'Eje' };
const acts = new Map();
const actColor = t => actItem(t).color;
const actTitle = a => `${a.type} ${SIDE_ABBR[a.side] || ''} · PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? '–' + fmtPK(a.d1) : ''}`;
const actsSorted = () => [...acts.values()].sort((a, b) => (a.traceName || '').localeCompare(b.traceName || '') || a.d0 - b.d0);
const MEAS_DEC = { L: 1, area: 1, vol: 2, t: 1 }; // mismos decimales en pantalla, CSV, KMZ e informes
const nf = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('es-ES', { maximumFractionDigits: d });
// Mediciones de una actuación a partir de su tramo y sus datos
function actMeasure(a) {
  const it = actItem(a.type), p = a.params || {}, L = Math.max(0, a.d1 - a.d0), sidesK = a.side === 'ambos' ? 2 : 1;
  const v = k => (isFinite(p[k]) && p[k] > 0 ? +p[k] : null);
  const m = { L, sides: sidesK };
  if (it.fields.includes('S') && v('S')) m.area = L * v('S') * (it.forma ? (ACT_FORMS[p.forma || 'tri'] || ACT_FORMS.tri)[1] : 1) * sidesK; // un sobreancho en cada margen
  else if (v('area')) m.area = v('area');
  else if (it.fields.includes('w') && !it.fields.includes('h') && v('w')) m.area = L * v('w') * (it.road ? 1 : sidesK);
  else if (it.fields.includes('b') && it.fields.includes('e') && v('b')) m.area = L * v('b') * sidesK;
  if (v('vol')) m.vol = v('vol');
  else if (it.fields.includes('h') && it.fields.includes('b') && v('h') && v('b')) m.vol = L * v('h') * v('b') * sidesK;
  else if (it.fields.includes('h') && v('w') && v('h')) m.vol = L * v('w') * v('h');
  else if (m.area && v('e')) m.vol = m.area * v('e') / 100;
  if (m.vol && it.dens) m.t = m.vol * it.dens;
  if (m.area && v('dot')) m.kg = m.area * v('dot');
  if (v('n')) m.n = v('n'); else if (ACT_POINT.has(a.type) && (it.fields.includes('n') || !it.fields.some(k => ['area', 'vol'].includes(k)))) m.n = 1; // el bacheo (por superficie) no cuenta unidades // badén, entronque…: cada uno cuenta como 1 ud (pantalla, CSV, informe y BC3)
  if (v('n') && v('lt')) m.tubo = v('n') * v('lt');
  if (!it.fields.length || it.custom || ['Limpieza de cunetas', 'Cuneta en tierra', 'Cuneta revestida', 'Barrera / bionda'].includes(a.type)) m.Lm = L * sidesK;
  return m;
}
function actFieldError(k, raw) {
  if (raw === undefined || String(raw).trim() === '') return '';
  const v = parseNum(raw), f = ACT_FIELDS[k], r = ACT_RANGE[k];
  if (!isFinite(v)) return `${f.l}: «${raw}» no es un número.`;
  if (r && (v < r[0] || v > r[1])) return `${f.l}: ${String(v).replace('.', ',')} ${f.u} no parece correcto (entre ${String(r[0]).replace('.', ',')} y ${r[1].toLocaleString('es-ES')} ${f.u}).`;
  return '';
}
function actMeasRows(a) {
  const m = actMeasure(a), r = [];
  if (m.L > 0) r.push(['Longitud', fmtLen(m.L) + (m.Lm && m.sides > 1 ? ` (×2 márgenes = ${fmtLen(m.Lm)})` : '')]);
  if (m.area) r.push(['Superficie', nf(m.area, MEAS_DEC.area) + ' m²']);
  if (m.vol) r.push(['Volumen', nf(m.vol, MEAS_DEC.vol) + ' m³']);
  if (m.t) r.push(['Peso estimado', nf(m.t, MEAS_DEC.t) + ` t (densidad ${nf(actItem(a.type).dens, 2)} t/m³)`]);
  if (m.kg) r.push(['Ligante', nf(m.kg, 0) + ' kg']);
  if (m.n) r.push(['Unidades', nf(m.n, 0) + ' ud']);
  if (m.tubo) r.push(['Tubo', nf(m.tubo, 1) + ' m' + (a.params && a.params.dia ? ` Ø ${a.params.dia} mm` : '')]);
  return r;
}
function actParamRows(a) {
  const it = actItem(a.type), p = a.params || {}, r = [];
  if (p.mat) r.push([it.name.includes('Demolición de obra') ? 'Elemento' : 'Tipo / material', p.mat]);
  if (it.forma && ACT_FORMS[p.forma]) r.push(['Forma', ACT_FORMS[p.forma][0]]);
  it.fields.forEach(k => { if (isFinite(p[k]) && p[k] > 0) r.push([ACT_FIELDS[k].l, nf(p[k], 2) + ' ' + ACT_FIELDS[k].u]); });
  if (a.prio) r.push(['Prioridad', (ACT_PRIO[a.prio] || [a.prio])[0]]);
  return r;
}
function featOf(a) { const e = layers.get(a.layerId); return e && e.feats ? { rec: e.rec, f: e.feats[a.featIdx] } : null; }
// Ancho medio del camino en un tramo (o en un punto) según los anchos tomados
function roadWidthAt(rec, fi, d0, d1) {
  const data = rec && rec.widths && rec.widths[fi]; if (!data) return null;
  const e = layers.get(rec.id), f = e && e.feats[fi]; if (!f) return null;
  const segs = widthSegments(data, f); if (!segs.length) return null;
  if (d1 > d0 + 0.5) { const st = widthStats(segs, d0, d1); return st ? st.mean : null; }
  return widthAt(segs, d0);
}
function segmentCoords(f, d0, d1) {
  const a = pointAtPK(f, d0); if (d1 <= d0) return [[a.lat, a.lng]];
  const b = pointAtPK(f, d1);
  return [[a.lat, a.lng], ...vertexTable(f).filter(p => p.d > d0 && p.d < d1).map(p => [p.lat, p.lng]), [b.lat, b.lng]];
}
function nearestTrace(ll) {
  let best = null;
  for (const e of layers.values()) {
    if (typeOf(e.rec) !== 'kml' || !e.rec.visible) continue;
    e.feats.forEach((f, i) => { if (f.type !== 'ln' || isFeatHidden(e.rec, i)) return; const r = pkAt(f, ll); if (!best || r.off < best.off) best = { rec: e.rec, f, d: r.d, off: r.off }; });
  }
  return best;
}
// Desplaza una polilínea unos píxeles a la izquierda (+) o derecha (−) del sentido del PK
function offsetLatLngs(coords, px) {
  if (!px || coords.length < 2) return coords.map(c => L.latLng(c));
  const pts = coords.map(c => map.latLngToLayerPoint(c));
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    return map.layerPointToLatLng([p.x + dy * px, p.y - dx * px]);
  });
}
const actsLayer = L.layerGroup().addTo(map);
function actClick(a) {
  return e => { L.DomEvent.stop(e); if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng); if (measure) return addMeasurePt(e.latlng); viewAct(a.id, e && e.latlng); };
}
function drawActs() {
  setTimeout(() => { try { updateSeguir(); } catch (e) { /* nada */ } }, 0);
  actsLayer.clearLayers();
  if (settings.actsVisible === false) return;
  const z = map.getZoom(), off = z >= 15 ? 9 : 0, bounds = map.getBounds().pad(0.3), hiddenCats = new Set(settings.actHideCats || []);
  const placed = []; // etiquetas ya puestas (en píxeles): las que se montarían encima se omiten hasta acercar más
  for (const a of acts.values()) {
    if (!a.coords || !a.coords.length || !bounds.intersects(L.latLngBounds(a.coords))) continue;
    if (hiddenCats.has(actItem(a.type).cat)) continue;
    const col = actColor(a.type), sides = a.side === 'ambos' ? [off, -off] : a.side === 'izq' ? [off] : a.side === 'der' ? [-off] : [0];
    sides.forEach(px => {
      let lyr;
      if (a.coords.length > 1 && a.d1 > a.d0) {
        const ll = offsetLatLngs(a.coords, px);
        L.polyline(ll, { color: '#102018', weight: 9, opacity: 0.45, interactive: false }).addTo(actsLayer);
        lyr = L.polyline(ll, { color: col, weight: 6, opacity: 0.95, lineCap: 'butt' });
      } else {
        const ctx = featOf(a), c = ctx && ctx.f ? segmentCoords(ctx.f, Math.max(0, a.d0 - 5), a.d0 + 5) : a.coords;
        const ll = offsetLatLngs(c.length > 1 ? c : a.coords, px);
        lyr = L.circleMarker(ll[Math.floor(ll.length / 2)] || L.latLng(a.coords[0]), { radius: 7, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1 });
      }
      lyr.on('click', actClick(a));
      lyr.addTo(actsLayer);
    });
    if (z >= 16) { // etiqueta: también se puede tocar para abrir la actuación
      const mid = a.coords[Math.floor(a.coords.length / 2)];
      const lab = offsetLatLngs(a.coords.length > 1 ? a.coords : [mid, mid], (sides[0] || 0) + (sides[0] < 0 ? -22 : 22));
      const at = lab[Math.floor(lab.length / 2)], pt = map.latLngToLayerPoint(at), wpx = Math.min(220, 7 * (a.type.length + 4));
      if (placed.some(q => Math.abs(q.x - pt.x) < (q.w + wpx) / 2 && Math.abs(q.y - pt.y) < 22)) continue;
      placed.push({ x: pt.x, y: pt.y, w: wpx });
      const mk = L.marker(at, { keyboard: false, zIndexOffset: -500, riseOnHover: true,
        icon: L.divIcon({ className: 'act-label clk', html: `<span style="border-color:${col}">${esc(a.type)} ${SIDE_ABBR[a.side] || ''}${a.prio === 'alta' ? ' ⚠' : ''}</span>`, iconSize: [0, 0] }) });
      mk.on('click', actClick(a)); mk.addTo(actsLayer);
    }
  }
}

let actDraft = null;
// margen más probable según el tipo: firmes y badenes ocupan la calzada; limpiezas de cunetas, los dos márgenes
const defaultSideFor = (t, cur) => { const it = actItem(t); return it.road || ['Bacheo', 'Badén'].includes(t) ? 'eje' : ['Limpieza de cunetas', 'Desbroce de márgenes'].includes(t) ? 'ambos' : cur; };
function openActEditor(o) {
  if (o.act) actDraft = { ...o.act, params: { ...(o.act.params || {}) }, media: [...(o.act.media || [])] };
  else actDraft = { id: uid(), obraId: settings.activeObra, layerId: o.rec.id, featIdx: layers.get(o.rec.id).feats.indexOf(o.f), traceName: o.f.name, layerName: o.rec.name,
    d0: o.d0, d1: o.d1, type: o.type || '', side: o.type ? defaultSideFor(o.type, 'izq') : 'izq', text: '', media: [], created: Date.now(), coords: [], params: {}, prio: '' };
  renderActEditor();
}
function syncAct() {
  if (!actDraft) return;
  const g = id => $('#' + id);
  if (g('aText')) actDraft.text = g('aText').value;
  if (g('aOther') && actDraft.type === 'Otro') actDraft.custom = g('aOther').value;
  // los PK solo se releen si se han cambiado a mano (así no se pierden los decimales del GPS)
  // (se compara con el PK actual del borrador, no con el valor con que se abrió: volver a escribir el original también cuenta)
  if (g('aPk0') && g('aPk0').value.trim() !== fmtPK(actDraft.d0)) { const v = parsePK(g('aPk0').value); if (isFinite(v)) actDraft.d0 = v; }
  if (g('aPk1') && g('aPk1').value.trim() !== fmtPK(actDraft.d1)) { const v = parsePK(g('aPk1').value); if (isFinite(v)) actDraft.d1 = v; }
  actDraft.params = actDraft.params || {};
  document.querySelectorAll('[data-pf]').forEach(inp => { const v = parseNum(inp.value); actDraft.params[inp.dataset.pf] = isFinite(v) ? v : null; });
  const mt = g('aMat'); if (mt) actDraft.params.mat = mt.value;
}
function actTypeSelect(cur, onlyLinear) {
  const okT = t => ACT_ITEMS.some(i => i.name === t) && !(onlyLinear && (ACT_POINT.has(t) || t === 'Otro'));
  const fav = (settings.actFav || []).filter(okT), rec = (settings.actRecent || []).filter(t => !fav.includes(t) && okT(t)).slice(0, 5);
  const opt = t => `<option value="${esc(t)}" ${t === cur ? 'selected' : ''}>${esc(t)}</option>`;
  return `<select id="aType"><option value="" ${cur ? '' : 'selected'}>— Elige el tipo de actuación —</option>
    ${cur && !ACT_ITEMS.some(i => i.name === cur) && cur !== 'Otro' ? `<optgroup label="Actual">${opt(cur)}</optgroup>` : ''}
    ${fav.length ? `<optgroup label="★ Favoritas">${fav.map(opt).join('')}</optgroup>` : ''}
    ${rec.length ? `<optgroup label="Recientes">${rec.map(opt).join('')}</optgroup>` : ''}
    ${ACT_CATS.map(c => { const its = c.items.map(([t]) => t).filter(t => !onlyLinear || okT(t)); return its.length ? `<optgroup label="${esc(c.name)}">${its.map(opt).join('')}</optgroup>` : ''; }).join('')}</select>`;
}
function renderActEditor() {
  const a = actDraft; if (!a) return;
  const ctx = featOf(a); const f = ctx && ctx.f;
  const isNew = !acts.has(a.id), keep = actDraft;
  const len = Math.max(0, Math.min(a.d1, f ? f.length : a.d1) - a.d0), it = a.type ? actItem(a.type) : null, p = a.params || (a.params = {}); // longitud recortada al final de la traza
  // ancho del camino por defecto (de los anchos tomados en la traza)
  const rw = ctx ? roadWidthAt(ctx.rec, a.featIdx, Math.min(a.d0, a.d1), Math.max(a.d0, a.d1)) : null;
  if (it && it.road && it.fields.includes('w') && !(p.w > 0) && rw) { p.w = Math.round(rw * 100) / 100; p._wAuto = true; }
  const isFav = it && (settings.actFav || []).includes(it.name);
  const fieldHtml = it ? it.fields.map(k => { const fd = ACT_FIELDS[k];
    return `<div class="field"><label for="pf_${k}">${fd.l} (${fd.u})${k === 'w' && it.road && rw ? ` <button type="button" class="linkb" data-a="wroad">usar ancho del camino: ${nf(rw, 2)} m</button>` : ''}</label>
      <input type="text" id="pf_${k}" data-pf="${k}" inputmode="decimal" placeholder="${fd.ph}" value="${isFinite(p[k]) && p[k] !== null ? String(p[k]).replace('.', ',') : ''}"></div>`; }).join('') : '';
  editorRerender = true;
  const b = openSheet(`<h2>${isNew ? 'Nueva actuación' : 'Editar actuación'}</h2>
    <p class="sub">${esc(a.traceName)} · ${esc(a.layerName || '')}${f ? ' · longitud ' + fmtLen(f.length) : ''}</p>
    ${a._walk ? `<div class="walksum" id="aSum"><b>${esc(a.type || 'Tramo')}</b> · ${fmtPK(Math.min(a.d0, a.d1))} → ${fmtPK(Math.max(a.d0, a.d1))} · ${fmtLen(Math.abs(a.d1 - a.d0))}</div>` : ''}
    <h3 class="sh">1 · Qué</h3>
    <div class="field"><label for="aType">Tipo de actuación</label><div class="row">${actTypeSelect(a.type)}${it && !it.legacy ? `<button type="button" class="mini ic fav ${isFav ? 'on' : ''}" data-a="fav" title="Favorita" aria-label="Marcar como favorita">${isFav ? '★' : '☆'}</button>` : ''}</div>
      ${it ? `<p class="hint"><span class="dot" style="background:${it.color}"></span>${esc(it.catName)}${it.hint ? ' · ' + esc(it.hint) : ''}</p>` : ''}</div>
    ${a.type === 'Otro' ? `<div class="field"><input type="text" id="aOther" placeholder="¿Qué actuación es?" value="${esc(a.custom || '')}"></div>` : ''}
    ${it && it.mat ? `<div class="field"><label for="aMat">Tipo / material</label><select id="aMat"><option value="">—</option>${it.mat.map(m => `<option ${p.mat === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></div>` : ''}
    ${it && it.forma ? `<div class="field"><label>Forma del sobreancho</label><div class="seg three">${Object.entries(ACT_FORMS).map(([k, [t]]) => `<button type="button" class="${(p.forma || 'tri') === k ? 'on' : ''}" data-forma="${k}">${t}</button>`).join('')}</div></div>` : ''}
    <h3 class="sh">2 · Dónde</h3>
    <div class="field"><label>Margen<span class="tech"> (según el sentido del PK)</span></label><div class="seg">${Object.entries(SIDES).map(([k, v]) => `<button type="button" class="${a.side === k ? 'on' : ''}" data-side="${k}">${esc(v.replace('Margen ', '').replace(' / calzada', ''))}</button>`).join('')}</div></div>
    <div class="pkrow">
      <div class="field"><label for="aPk0">Desde PK</label><input type="text" id="aPk0" inputmode="decimal" value="${fmtPK(a.d0)}" data-v="${fmtPK(a.d0)}"><small class="rb" id="aPk0rb"></small>
        <div class="pkbtns"><button class="mini" data-a="gps0" aria-label="Inicio en mi posición">${ICON.locate}Aquí</button><button class="mini" data-a="map0" aria-label="Inicio tocando el mapa">${ICON.pin}Mapa</button></div></div>
      <div class="field"><label for="aPk1">Hasta PK</label><input type="text" id="aPk1" inputmode="decimal" value="${fmtPK(a.d1)}" data-v="${fmtPK(a.d1)}"><small class="rb" id="aPk1rb"></small>
        <div class="pkbtns"><button class="mini" data-a="gps1" aria-label="Fin en mi posición">${ICON.locate}Aquí</button><button class="mini" data-a="map1" aria-label="Fin tocando el mapa">${ICON.pin}Mapa</button></div></div>
    </div>
    <p class="hint" id="aLenHint">${len > 0 ? `Tramo de ${fmtLen(len)}.` : 'Ahora es una actuación puntual. Para un tramo, camina hasta el final y pulsa «Aquí» junto a «Hasta PK», o escribe el PK final.'}</p>
    ${fieldHtml ? `<h3 class="sh">3 · Medidas</h3><div class="pgrid">${fieldHtml}</div>` : ''}
    ${it ? '<div class="meas" id="aMeas"></div>' : ''}
    <h3 class="sh">${fieldHtml ? 4 : 3} · Observaciones y fotos</h3>
    <div class="field"><label for="aText">Observaciones</label><textarea id="aText" rows="2" placeholder="p. ej. estado actual, causa, solución propuesta">${esc(a.text)}</textarea></div>
    <div class="media">${mediaHtml(a.media, true)}</div>
    <div class="acts">
      <button class="btn" data-a="photo">${ICON.photo}Foto</button>
      <button class="btn" data-a="video">${ICON.video}Vídeo</button>
    </div>
    <details class="more" id="aMore" ${a._moreOpen || a.prio ? 'open' : ''}><summary>Más opciones${a.prio ? ` · prioridad ${esc((ACT_PRIO[a.prio] || [a.prio])[0]).toLowerCase()}` : ''}</summary>
      <div class="field"><span class="flabel">Prioridad</span><div class="seg">${[['', 'Sin indicar'], ...Object.entries(ACT_PRIO).map(([k, [t]]) => [k, t])].map(([k, t]) => `<button type="button" class="${(a.prio || '') === k ? 'on' : ''}" data-prio="${k}">${t}</button>`).join('')}</div></div>
      <div class="field row"><label for="aLen" class="grow">Longitud desde el inicio (m)</label><input type="text" id="aLen" inputmode="decimal" placeholder="m" value="${len ? Math.round(len) : ''}"><button class="mini" data-a="len">Aplicar</button></div>
      ${isNew ? '' : '<div class="acts"><button class="btn" data-a="dup">Duplicar en otro tramo</button><button class="btn del" data-a="delete">Eliminar actuación</button></div>'}
    </details>
    <div class="savebar">${a._walk && isNew ? '<div class="row2"><button class="btn pri" data-a="save">Guardar</button><button class="btn go" data-a="savecont">Guardar y seguir andando</button></div>' : '<button class="btn pri full" data-a="save">Guardar actuación</button>'}</div>`);
  { const sc = $('#sheetBody [data-a=savecont]'); if (sc) sc.onclick = () => { if (!actDraft) return; actDraft._cont = actDraft._dir || 1; saveAct().then(ok => { if (!ok && actDraft && !$('#measWarn') && !$('#zeroWarn') && !$('#invWarn')) delete actDraft._cont; }); }; } // con un aviso pendiente se recuerda que hay que seguir
  { const mo = $('#aMore'); if (mo) mo.ontoggle = () => { if (actDraft) actDraft._moreOpen = mo.open; }; }
  editorRerender = false;
  actDraft = keep;
  const snapOf = actKey, actSnap = acts.has(a.id) ? actKey(acts.get(a.id)) : null;
  if (actSnap === null && !actDraft._init) actDraft._init = snapOf(actDraft); // cómo se abrió: si se cierra sin cambiar nada no es un borrador (salvo un tramo andando)
  const actChanged = d => actSnap === null ? !!(d._walk || snapOf(d) !== d._init)
    : actSnap !== actKey(d);
  onSheetClose(() => { if (editorRerender || actPick || !actDraft) return; syncAct(); if (actChanged(actDraft)) storeDraft('act', { ...actDraft, params: { ...actDraft.params } }); else clearDraft(actDraft.id); });
  storeDraft('act', { ...actDraft, params: { ...actDraft.params } }, true); // copia de trabajo por si la app se cierra de golpe
  { let liveT; const live = () => { clearTimeout(liveT); liveT = setTimeout(() => { if (!actDraft || !$('#aText')) return; syncAct(); storeDraft('act', { ...actDraft, params: { ...actDraft.params } }, true); }, 250); }; b.addEventListener('input', live); b.addEventListener('change', live); }
  const meas = () => { const box = $('#aMeas'); if (!box) return; syncAct(); const r = actMeasRows(actDraft);
    box.innerHTML = (r.length ? `<table class="attrs">${r.map(([k, v]) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join('')}</table>` : '')
      + (actDraft.d1 <= actDraft.d0 && actItem(actDraft.type).fields.some(k => ['w', 'b', 'S', 'h'].includes(k)) ? '<p class="hint">Actuación puntual: indica el PK final o la longitud para calcular superficie y volumen.</p>' : r.length ? '' : '<p class="hint">Rellena los datos para ver las mediciones.</p>'); };
  meas();
  addDictation($('#aText'));
  b.querySelectorAll('[data-pf]').forEach(inp => inp.oninput = () => { if (inp.dataset.pf === 'w') delete actDraft.params._wAuto; inp.classList.remove('need'); { const nd = $('#need_' + inp.id); if (nd) nd.remove(); } fieldErr(inp, actFieldError(inp.dataset.pf, inp.value)); meas(); });
  if (f) showSlopeSegment(f, Math.min(a.d0, a.d1), Math.max(a.d0, a.d1));
  onSheetClose(() => setTimeout(() => { if (!actPick && ($('#sheet').hidden || !$('#aText'))) { slopeHL.clearLayers(); if (!$('#aText')) actDraft = actPick ? actDraft : null; } }, 0));
  const setPK = (which, d) => { syncAct(); pkRule(which, Math.max(0, Math.min(f ? f.length : d, d))); if (actDraft.params._wAuto) delete actDraft.params.w; renderActEditor(); };
  $('#aType').onchange = () => { syncAct(); const nt = $('#aType').value, old = actItem(actDraft.type); actDraft.type = nt;
    if (!actDraft._sideSet && !acts.has(actDraft.id)) actDraft.side = defaultSideFor(nt, actDraft.side);
    const ni = actItem(nt); if (old && old.mat && !(ni.mat || []).includes(actDraft.params.mat)) delete actDraft.params.mat; if (actDraft.params._wAuto) delete actDraft.params.w; renderActEditor(); };
  const fv = b.querySelector('[data-a=fav]');
  if (fv) fv.onclick = () => { syncAct(); const l = settings.actFav || []; settings.actFav = l.includes(actDraft.type) ? l.filter(x => x !== actDraft.type) : [...l, actDraft.type]; saveSettings(); renderActEditor(); };
  const wr = b.querySelector('[data-a=wroad]'); if (wr) wr.onclick = () => { $('#pf_w').value = String(Math.round(rw * 100) / 100).replace('.', ','); meas(); };
  b.querySelectorAll('[data-forma]').forEach(bt => bt.onclick = () => { syncAct(); actDraft.params.forma = bt.dataset.forma; renderActEditor(); });
  b.querySelectorAll('[data-prio]').forEach(bt => bt.onclick = () => { syncAct(); actDraft.prio = bt.dataset.prio; renderActEditor(); });
  b.querySelectorAll('[data-side]').forEach(bt => bt.onclick = () => { syncAct(); actDraft.side = bt.dataset.side; actDraft._sideSet = true; renderActEditor(); });
  ['aPk0', 'aPk1'].forEach(id => { const el = $('#' + id);
    el.oninput = () => { const v = parsePK(el.value); if (isFinite(v) || !el.value.trim()) fieldErr(el, ''); let t = el.value !== el.dataset.v ? pkReadBack(el.value) : '';
      if (f && isFinite(v) && v > f.length + 0.5) t = `⚠ Pasa del final de la traza (${fmtPK(f.length)})`; // aviso al escribir, no solo al guardar
      $('#' + id + 'rb').textContent = t; el.classList.toggle('bad', t.startsWith('⚠')); };
    // sin volver a dibujar la ficha: así no se pierde el toque en «Guardar» justo después de escribir el PK
    el.onchange = () => { if (!isFinite(parsePK(el.value))) { $('#' + id + 'rb').textContent = pkReadBack(el.value); return; }
      const pv = x => { const v = parsePK(x.dataset.v); return isFinite(v) ? v : NaN; }, e0 = $('#aPk0'), e1 = $('#aPk1');
      const p0 = isFinite(pv(e0)) ? pv(e0) : actDraft.d0, p1 = isFinite(pv(e1)) ? pv(e1) : actDraft.d1; syncAct(); el.value = fmtPK(actDraft[id === 'aPk0' ? 'd0' : 'd1']); { const w = $('#invWarn'); if (w) w.remove(); } // el aviso viejo ya no vale
      if (actDraft.d1 < actDraft.d0 - 0.01 && p1 > p0) actDraft._ext = [Math.min(p0, actDraft.d0, actDraft.d1), Math.max(p1, actDraft.d0, actDraft.d1)]; else delete actDraft._ext; // por si quería alargar // escrito a mano: se respeta tal cual (para mover un tramo se escriben los dos PK en cualquier orden)
      const inv = actDraft.d1 < actDraft.d0 - 0.01, other = id === 'aPk0' ? 'aPk1' : 'aPk0';
      $('#' + other + 'rb').textContent = inv ? `⚠ «Desde» queda después de «Hasta»: escribe también este PK` : ''; $('#' + other).classList.toggle('bad', inv);
      if (!inv) $('#' + id + 'rb').textContent = '';
      if (f && actDraft[id === 'aPk0' ? 'd0' : 'd1'] > f.length + 0.5) { $('#' + id + 'rb').textContent = `⚠ Pasa del final de la traza (${fmtPK(f.length)})`; el.classList.add('bad'); } // el aviso no se borra al salir del campo
      el.dataset.v = el.value;
      refreshActInline(); }; });
  const refreshActInline = () => {
    const d = actDraft; if (!d) return;
    const lo = Math.min(d.d0, d.d1), hi = Math.max(d.d0, d.d1), ln = Math.max(0, Math.min(hi, f ? f.length : hi) - lo);
    if (f) showSlopeSegment(f, lo, Math.min(hi, f.length));
    const al = $('#aLen'); if (al) al.value = ln ? Math.round(ln) : '';
    { const sm = $('#aSum'); if (sm) sm.innerHTML = `<b>${esc(d.type || 'Tramo')}</b> · ${fmtPK(lo)} → ${fmtPK(hi)} · ${fmtLen(ln)}`; // el resumen y la pista siguen a los PK escritos
      const lh = $('#aLenHint'); if (lh && ln > 0) lh.textContent = `Tramo de ${fmtLen(ln)}${d.d1 < d.d0 - 0.01 ? ' (PK al revés)' : ''}.`; }
    if (d.params._wAuto && ctx) { const nw = roadWidthAt(ctx.rec, d.featIdx, lo, hi); if (nw) { d.params.w = Math.round(nw * 100) / 100; const wi = $('#pf_w'); if (wi) wi.value = String(d.params.w).replace('.', ','); } }
    meas();
  };
  const gps = which => async () => {
    if (!f) { toast('La traza de esta actuación ya no está cargada.'); return; }
    toast('Obteniendo posición GPS…', 2000);
    try { const p2 = await getPos(); const r = pkAt(f, L.latLng(p2.lat, p2.lng)); if (r.off > 40) toast(`Estás a ${Math.round(r.off)} m de la traza: se usa el punto más cercano.`, 5000); setPK(which, r.d); }
    catch (e) { toast(geoErr(e), 6000); }
  };
  b.querySelector('[data-a=gps0]').onclick = gps('d0');
  b.querySelector('[data-a=gps1]').onclick = gps('d1');
  const pick = which => () => {
    if (!f) { toast('La traza de esta actuación ya no está cargada.'); return; }
    syncAct(); actPick = which; closeSheet();
    $('#pickText').textContent = which === 'd0' ? 'Toca en el mapa el inicio de la actuación' : 'Toca en el mapa el final de la actuación';
    $('#pickBar').hidden = false;
  };
  b.querySelector('[data-a=map0]').onclick = pick('d0');
  b.querySelector('[data-a=map1]').onclick = pick('d1');
  b.querySelector('[data-a=len]').onclick = () => { syncAct(); const v = parseFloat(($('#aLen').value || '').replace(',', '.')); if (!(v >= 0)) { toast('Escribe la longitud en metros.'); return; } setPK('d1', actDraft.d0 + v); };
  const stampAt = () => { const pp = f ? pointAtPK(f, actDraft.d0) : { lat: actDraft.coords[0][0], lng: actDraft.coords[0][1] };
    const base = lastPos && Date.now() - lastPos.t < 60000 ? { lat: lastPos.lat, lng: lastPos.lng, acc: lastPos.acc } : { lat: pp.lat, lng: pp.lng };
    return { ...base, label: `${actDraft.type || 'Actuación'} ${SIDE_ABBR[actDraft.side] || ''} · PK ${fmtPK(actDraft.d0)}${actDraft.d1 > actDraft.d0 ? '–' + fmtPK(actDraft.d1) : ''} · ${actDraft.traceName}` }; };
  const addMediaAct = async files => {
    syncAct();
    for (const fl of files) {
      const kind = fl.type.startsWith('image/') ? 'photo' : fl.type.startsWith('video/') ? 'video' : null; if (!kind) continue;
      const sa = stampAt(); let blob = kind === 'photo' ? await processImage(fl, sa) : fl;
      if (kind === 'photo') blob = await writeExif(blob, { lat: sa.lat, lng: sa.lng, date: Date.now(), desc: sa.label });
      actDraft.media.push({ id: uid(), kind, blob, mime: blob.type || fl.type, t: Date.now() });
    }
    renderActEditor();
  };
  b.querySelector('[data-a=photo]').onclick = () => { syncAct(); capture('inPhoto', addMediaAct); };
  b.querySelector('[data-a=video]').onclick = () => { syncAct(); capture('inVideo', addMediaAct); };
  b.querySelectorAll('[data-rm]').forEach(el => el.onclick = () => { syncAct(); actDraft.media.splice(+el.dataset.rm, 1); renderActEditor(); });
  b.querySelector('[data-a=save]').onclick = () => { if (actDraft) delete actDraft._cont; saveAct(); };
  const dup = b.querySelector('[data-a=dup]');
  if (dup) dup.onclick = () => { syncAct(); const src = actDraft; actDraft = { ...src, id: uid(), media: [], created: Date.now(), updated: undefined, params: { ...src.params } }; toast('Copia lista: cambia los PK y guarda.', 4000); renderActEditor(); };
  const del = b.querySelector('[data-a=delete]'); if (del) del.onclick = () => deleteAct(a.id);
}
let actPick = null;
// Dato mal escrito: el mensaje va junto al campo (y lo lee el lector de pantalla), no en un aviso pasajero lejos
function fieldErr(inp, er) {
  const id = 'ferr_' + inp.id; let m = document.getElementById(id);
  inp.classList.toggle('bad', !!er); inp.setAttribute('aria-invalid', er ? 'true' : 'false');
  if (!er) { if (m) m.remove(); inp.removeAttribute('aria-describedby'); return; }
  if (!m) { inp.insertAdjacentHTML('afterend', `<small class="ferr" id="${id}" role="alert"></small>`); m = document.getElementById(id); }
  m.textContent = '⚠ ' + er; inp.setAttribute('aria-describedby', id);
}
// Cambiar «Desde» o «Hasta» (con «Aquí», «Mapa» o escrito). Si en un tramo el PK nuevo queda al otro lado,
// el tramo se alarga por ese lado (antes se recortaba y se perdían metros sin avisar) y se dice cómo queda.
function pkRule(which, d) {
  const a = actDraft, l0 = a.d1 - a.d0; let moved = false;
  if (which === 'd1' && d < a.d0 && a.d1 > a.d0) { which = 'd0'; moved = true; }
  else if (which === 'd0' && d > a.d1 && a.d1 > a.d0) { which = 'd1'; moved = true; }
  a[which] = d;
  if (a.d1 < a.d0) { if (which === 'd0') a.d1 = a.d0; else [a.d0, a.d1] = [a.d1, a.d0]; }
  if (moved) toast(`El PK queda al otro lado del tramo: se alarga hasta ${fmtPK(a.d0)}–${fmtPK(a.d1)} (${fmtLen(a.d1 - a.d0)}, antes ${fmtLen(l0)}). Si querías acortarlo, escribe los dos PK.`, 7000);
}
const _slopePickPoint = slopePickPoint;
slopePickPoint = function (ll) { // también atiende la selección de inicio/fin de actuaciones
  if (!actPick) return _slopePickPoint(ll);
  const ctx = featOf(actDraft); const r = pkAt(ctx.f, L.latLng(ll));
  const which = actPick; actPick = null; $('#pickBar').hidden = true;
  pkRule(which, Math.max(0, Math.min(ctx.f.length, r.d))); // la misma regla que «Aquí»: el tramo se alarga, no se recorta
  if (actDraft.params && actDraft.params._wAuto) delete actDraft.params.w;
  renderActEditor();
};
async function saveAct() {
  syncAct();
  const a = actDraft; if (!a) return false;
  const wasPoint = ACT_POINT.has(a.type); // «Otro» puntual con nombre propio sigue siendo puntual (no pide «Guardar con 0 m»)
  if (a.type === 'Otro') a.type = (a.custom || '').trim() || 'Otro';
  if (!a.type) { toast('Elige el tipo de actuación.'); return; }
  for (const inp of document.querySelectorAll('[data-pf]')) { const er = actFieldError(inp.dataset.pf, inp.value); if (er) { fieldErr(inp, er); inp.focus(); inp.scrollIntoView({ block: 'center' }); return; } }
  for (const [id, k] of [['aPk0', 'd0'], ['aPk1', 'd1']]) { const el = $('#' + id); // PK mal escrito: no se guarda el anterior en silencio
    if (el && el.value.trim() !== fmtPK(a[k]) && !isFinite(parsePK(el.value))) { fieldErr(el, 'PK no válido: escribe por ejemplo 1+250'); el.focus(); el.scrollIntoView({ block: 'center' }); return; } }
  { const c0 = featOf(a), Lf = c0 && c0.f && c0.f.length;
    if (Lf && $('#aText')) for (const [id, k] of [['aPk0', 'd0'], ['aPk1', 'd1']]) if (a[k] > Lf + 0.5) { const el = $('#' + id); if (el) { fieldErr(el, `Pasa del final de la traza (${fmtPK(Lf)})`); el.focus(); el.scrollIntoView({ block: 'center' }); } return; } }
  if (!isFinite(a.d0) || !isFinite(a.d1)) { toast('Revisa los PK: escribe por ejemplo 1+250.'); return; }
  if (a.d1 < a.d0 - 0.01 && $('#aText') && a._swapOk !== a.d0 + '|' + a.d1) { // PK escritos al revés: se pregunta (antes se daban la vuelta en silencio)
    let w = $('#invWarn'); if (!w) { $('#sheetBody .pkrow').insertAdjacentHTML('afterend', '<div class="fwarn" id="invWarn" role="alert"></div>'); w = $('#invWarn'); } // junto a los PK: no tapa los campos ni cae bajo el dedo
    const ex = a._ext && a._ext[1] - a._ext[0] > a.d0 - a.d1 + 0.5 ? a._ext : null;
    w.innerHTML = `<b>«Desde PK» (${fmtPK(a.d0)}) va después de «Hasta PK» (${fmtPK(a.d1)})</b>. Corrige uno de los dos o ${ex ? 'elige' : 'guárdalo así'}:<div class="row">${ex ? `<button type="button" class="mini" data-a="saveext">Guardar alargado: ${fmtPK(ex[0])}–${fmtPK(ex[1])} (${fmtLen(ex[1] - ex[0])})</button>` : ''}<button type="button" class="mini" data-a="saveinv">Guardar ${fmtPK(a.d1)}–${fmtPK(a.d0)} (${fmtLen(a.d0 - a.d1)})</button></div>`;
    w.scrollIntoView({ block: 'nearest' });
    const t0 = Date.now(), go = fn => () => { if (Date.now() - t0 < 600 || !actDraft) return; fn(); ['aPk0', 'aPk1'].forEach((k, i) => { const e2 = $('#' + k); if (e2) { e2.value = fmtPK(i ? actDraft.d1 : actDraft.d0); e2.classList.remove('bad'); } }); saveAct(); };
    w.querySelector('[data-a=saveinv]').onclick = go(() => { actDraft._swapOk = actDraft.d0 + '|' + actDraft.d1; });
    { const be = w.querySelector('[data-a=saveext]'); if (be) be.onclick = go(() => { [actDraft.d0, actDraft.d1] = ex; delete actDraft._ext; }); }
    return; }
  if (a.d1 < a.d0) [a.d0, a.d1] = [a.d1, a.d0];
  const ctx = featOf(a);
  if (ctx && ctx.f) {
    const Lf = ctx.f.length;
    if (a.d0 > Lf + 0.5) { toast(`El PK inicial ${fmtPK(a.d0)} está fuera de la traza, que acaba en ${fmtPK(Lf)}.`, 6000); return; }
    if (a.d1 > Lf + 0.5 && !confirm(`El PK final ${fmtPK(a.d1)} pasa del final de la traza (${fmtPK(Lf)}). ¿Guardar la actuación hasta el final de la traza?`)) return;
    a.d0 = Math.max(0, Math.min(Lf, a.d0)); a.d1 = Math.max(a.d0, Math.min(Lf, a.d1)); a.coords = segmentCoords(ctx.f, a.d0, a.d1);
  }
  { const pp = a.params || {}, puntual = wasPoint || ACT_POINT.has(a.type) || pp.area > 0 || pp.vol > 0 || pp.n > 0; // un tramo de milímetros no cuenta como puntual
    if (a.d1 - a.d0 < 0.5 && !puntual && a._zeroOk !== a.d0 + '|' + a.d1) { // aviso dentro de la ficha, con su propio botón (no se guarda con toques repetidos en «Guardar»)
      const f1 = $('#aPk1'); if (f1) { f1.classList.add('bad'); setTimeout(() => f1.scrollIntoView({ block: 'start' }), 50); }
      let w = $('#zeroWarn'); if (!w) { const sb = $('#sheetBody .savebar'); sb.insertAdjacentHTML('afterbegin', '<div class="fwarn" id="zeroWarn" role="alert"></div>'); w = $('#zeroWarn'); } // dentro de la barra fija: siempre a la vista
      w.innerHTML = `<b>«${esc(a.type)}» tiene 0 m</b>: el PK final es igual al inicial (${fmtPK(a.d0)}). Escribe el PK final arriba o, si de verdad es puntual:<div class="row"><button type="button" class="mini" data-a="save0">Guardar con 0 m</button></div>`;
      const t0 = Date.now(); w.querySelector('[data-a=save0]').onclick = () => { if (Date.now() - t0 < 600 || !actDraft) return; actDraft._zeroOk = actDraft.d0 + '|' + actDraft.d1; saveAct(); };
      w.scrollIntoView({ block: 'nearest' }); return; } }
  { const it = actItem(a.type), mf = it.fields.filter(k => ['w', 'e', 'h', 'b', 'S', 'n'].includes(k));
    if (mf.length && !mf.some(k => a.params && a.params[k] > 0) && !ACT_POINT.has(a.type) && !wasPoint && a._noMeasOk !== true && !a._noMeasChain && $('#aText')) {
      const f0 = $('#pf_' + mf[0]); if (f0) { f0.classList.add('bad'); f0.scrollIntoView({ block: 'center' }); }
      let w = $('#measWarn'); if (!w) { $('#sheetBody .savebar').insertAdjacentHTML('afterbegin', '<div class="fwarn" id="measWarn" role="alert"></div>'); w = $('#measWarn'); }
      w.innerHTML = `<b>Sin medidas</b>: no saldrá superficie ni volumen. Escribe ${mf.map(k => ACT_FIELDS[k].l.toLowerCase()).join(' / ')} o:<div class="row"><button type="button" class="mini" data-a="savenm">Guardar sin medidas</button></div>`;
      const t0 = Date.now(); w.querySelector('[data-a=savenm]').onclick = () => { if (Date.now() - t0 < 600 || !actDraft) return; actDraft._noMeasOk = true; saveAct(); };
      return; } }
  const cont = a._cont, fromSplit = a._split, noMeasUsed = a._noMeasOk === true || !!a._noMeasChain; delete a._cont; delete a._split; delete a._noMeasChain; delete a._dir; delete a._noMeasOk; delete a._zeroWarn; delete a._zeroOk; delete a._swapOk; delete a._ext; delete a._moreOpen; delete a._init; delete a._walk; if (a.params) { delete a.params._wAuto; Object.keys(a.params).forEach(k => { if (a.params[k] === null || a.params[k] === '') delete a.params[k]; }); }
  a.updated = Date.now();
  hideUndo(); // solo cuando de verdad se guarda (un toque fallido no borra el «Deshacer»)
  try { await DB.put('acts', a); } catch (e) { toast('No se pudo guardar: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (ACT_ITEMS.some(i => i.name === a.type)) { settings.actRecent = [a.type, ...(settings.actRecent || []).filter(t => t !== a.type)].slice(0, 8); saveSettings(); }
  acts.set(a.id, a); actDraft = null; slopeHL.clearLayers(); clearDraft(a.id);
  closeSheet(); drawActs(); toast(`Guardada: ${actTitle(a)}`);
  if (!$('#drawer').hidden) renderDrawer();
  if (cont) { // «Guardar y seguir andando»: el siguiente tramo empieza en el PK guardado (corregido o no)
    buzz(40); const go = await continueWalk(a, cont === -1 ? a.d0 : a.d1, { noMeas: noMeasUsed });
    if (!fromSplit) showUndo(`Guardado: ${a.type} ${fmtPK(a.d0)}–${fmtPK(a.d1)}${go ? '. Sigue el siguiente tramo.' : '. Fin del camino: no hay más tramo que seguir.'}`, async () => { // mismo «Deshacer» que desde la barra
      if (a.obraId !== settings.activeObra) { toast('Ese tramo es de otra obra.'); return; }
      await DB.del('acts', a.id); acts.delete(a.id); drawActs(); const st = cont === -1 ? a.d1 : a.d0;
      walkAct = { draft: { ...a, id: uid(), d0: st, d1: st, media: [], text: '', created: Date.now(), coords: [], params: { ...(a.params || {}) }, _noMeasChain: noMeasUsed }, t: Date.now(), shown: Date.now() };
      await DB.put('kv', walkAct, 'walk').catch(() => {}); showWalkBar(); keepAwake(true); }); }
  return true;
}
let delStack = [];
async function deleteAct(id) { // sin pregunta: se puede deshacer unos segundos
  const old = acts.get(id); if (!old) return;
  await DB.del('acts', id); acts.delete(id); actDraft = null; slopeHL.clearLayers(); clearDraft(id);
  // varios borrados seguidos: un solo «Deshacer» los recupera todos (antes solo el último)
  const ub = $('#undoBar'), list = ub && !ub.hidden && undoKind === 'del' && delStack.length && delStack[0].obraId === old.obraId ? [...delStack, old] : [old]; delStack = list;
  closeSheet(); drawActs(); showUndo(list.length > 1 ? `${list.length} actuaciones eliminadas` : `Actuación eliminada: ${old.type}`, async () => { delStack = [];
    if (old.obraId !== settings.activeObra) { toast(list.length > 1 ? 'Esas actuaciones son de otra obra.' : 'Esa actuación es de otra obra.'); return; }
    for (const x of list) { await DB.put('acts', x); acts.set(x.id, x); } drawActs(); if (!$('#drawer').hidden) renderDrawer(); toast(list.length > 1 ? `${list.length} actuaciones recuperadas` : 'Actuación recuperada'); });
  undoKind = 'del';
  if (!$('#drawer').hidden) renderDrawer();
}
function viewAct(id, at) {
  const a = acts.get(id); if (!a) return;
  const ctx0 = featOf(a), dHere = ctx0 && ctx0.f && at ? Math.max(0, Math.min(ctx0.f.length, pkAt(ctx0.f, L.latLng(at)).d)) : a.d0; // PK del punto tocado
  const p0 = a.coords[0], p1 = a.coords[a.coords.length - 1], col = actColor(a.type), it = actItem(a.type);
  const mr = actMeasRows(a), pr = actParamRows(a);
  const b = openSheet(`<h2><span class="dot" style="background:${col}"></span>${esc(a.type)}</h2>
    <p class="sub">${esc(it.catName)} · ${esc(SIDES[a.side] || '')} · ${esc(a.traceName)} · ${fmtDate(a.created)}</p>
    <div class="slope-main"><span style="color:${col}">PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? ' – ' + fmtPK(a.d1) : ''}</span><small>${a.d1 > a.d0 ? 'longitud ' + fmtLen(a.d1 - a.d0) : 'actuación puntual'}${a.prio ? ` · prioridad <b style="color:${(ACT_PRIO[a.prio] || ['', '#888'])[1]}">${(ACT_PRIO[a.prio] || [a.prio])[0].toLowerCase()}</b>` : ''}</small></div>
    ${mr.length ? `<h3 class="sh">Mediciones</h3><table class="attrs meas">${mr.map(([k, v]) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join('')}</table>` : ''}
    ${pr.length ? `<h3 class="sh">Datos</h3><table class="attrs">${pr.map(([k, v]) => `<tr><td>${k}</td><td>${esc(String(v))}</td></tr>`).join('')}</table>` : ''}
    ${it.fields.length && !actMeasRows(a).some(([k]) => k !== 'Longitud') ? `<p class="hint">${a.d1 <= a.d0 && Object.keys(a.params || {}).length ? 'Es una actuación puntual: para calcular superficie o volumen indica su longitud (PK final).' : 'Sin datos para calcular mediciones. Pulsa «Editar» y rellena ancho, espesor…'}</p>` : ''}
    ${a.text ? `<div class="desc">${esc(a.text)}</div>` : ''}
    <div class="media">${mediaHtml(a.media || [], false)}</div>
    <div class="acts">
      ${goBtn(p0[0], p0[1], 'Ir al inicio', a.d1 > a.d0 ? '' : 'full')}${a.d1 > a.d0 ? goBtn(p1[0], p1[1], 'Ir al final') : ''}
      <button class="btn pri" data-a="edit">Editar / añadir fotos</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar</button>
      ${featOf(a) && featOf(a).f ? `<button class="btn go full" data-a="newhere">${ICON.road}Otra actuación en el PK ${fmtPK(dHere)}</button><button class="btn" data-a="trace">Ficha de la traza (anchos, pendiente…)</button>` : '<p class="hint">La traza de esta actuación no está cargada. Al volver a cargar su KML se enlaza sola.</p>'}
    </div>`, 'view');
  const ctx = featOf(a); if (ctx && ctx.f) showSlopeSegment(ctx.f, a.d0, Math.max(a.d1, a.d0 + 0.1));
  onSheetClose(() => setTimeout(() => { if (!$('#aText')) slopeHL.clearLayers(); }, 0));
  b.querySelectorAll('img[data-full]').forEach(img => img.onclick = () => showPhoto(img.src));
  b.querySelector('[data-a=edit]').onclick = () => openActEditor({ act: a });
  const nh = b.querySelector('[data-a=newhere]'); if (nh) nh.onclick = () => { const c = featOf(a); openActEditor({ rec: c.rec, f: c.f, d0: dHere, d1: dHere }); };
  const tr = b.querySelector('[data-a=trace]'); if (tr) tr.onclick = () => { const c = featOf(a), q = pointAtPK(c.f, dHere); featureSheet(c.f, L.latLng(q.lat, q.lng), c.rec); };
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${a.type} (${SIDES[a.side]}) · ${a.traceName} · PK ${fmtPK(a.d0)} a ${fmtPK(a.d1)} · ${fmtLen(a.d1 - a.d0)}${pr.length ? ' · ' + pr.map(([k, v]) => `${k}: ${v}`).join(', ') : ''}${mr.length ? ' · ' + mr.map(([k, v]) => `${k}: ${v}`).join(', ') : ''}${a.text ? ' · ' + a.text : ''}`);
}
// Resumen de mediciones por tipo de actuación
function actsSummary(list) {
  const m = new Map();
  list.forEach(a => { const k = a.type, r = m.get(k) || { type: k, n: 0, L: 0, area: 0, vol: 0, t: 0, kg: 0, ud: 0, tubo: 0 }, x = actMeasure(a);
    r.n++; r.L += x.Lm || x.L; r.area += x.area || 0; r.vol += x.vol || 0; r.t += x.t || 0; r.kg += x.kg || 0; r.ud += x.n || 0; r.tubo += x.tubo || 0; m.set(k, r); });
  const ord = t => { const i = ACT_ITEMS.findIndex(x => x.name === t); return i < 0 ? 1e6 : i; }; // los tipos con nombre propio, al final
  return [...m.values()].sort((a, b) => ord(a.type) - ord(b.type));
}
function summaryTableHtml(sum, escf = esc) {
  const c = (v, d) => (v ? nf(v, d) : '');
  return `<table class="attrs sumt"><tr><th>Actuación</th><th>Nº</th><th>m</th><th>m²</th><th>m³</th><th>t</th><th>ud</th></tr>${sum.map(r => `<tr><td><span class="dot" style="background:${actColor(r.type)}"></span>${escf(r.type)}</td><td>${r.n}</td><td>${c(r.L, MEAS_DEC.L)}</td><td>${c(r.area, MEAS_DEC.area)}</td><td>${c(r.vol, MEAS_DEC.vol)}</td><td>${c(r.t, MEAS_DEC.t)}</td><td>${c(r.ud, 0)}</td></tr>`).join('')}</table>`;
}
function actList() {
  const list = actsSorted();
  const byTrace = new Map(); list.forEach(a => { const k = a.traceName || 'Traza'; byTrace.set(k, [...(byTrace.get(k) || []), a]); });
  const hid = new Set(settings.actHideCats || []);
  const cats = ACT_CATS.map(c => ({ ...c, n: list.filter(a => actItem(a.type).cat === c.id).length })).filter(c => c.n);
  const b = openSheet(`<h2>Actuaciones</h2><p class="sub">${plural(list.length, 'actuación', 'actuaciones')} en ${plural(byTrace.size, 'traza', 'trazas')}</p>
    ${list.length ? `<h3 class="sh">Resumen de mediciones</h3>${summaryTableHtml(actsSummary(list))}
      <h3 class="sh">Ver en el mapa</h3><div class="chips">${cats.map(c => `<button type="button" class="chip ${hid.has(c.id) ? '' : 'on'}" data-hc="${c.id}" style="--c:${c.items[0][1]}">${esc(c.name)} (${c.n})</button>`).join('')}</div>`
      : '<p class="empty">Todavía no hay actuaciones. Toca una traza y pulsa «Nueva actuación en esta traza».</p>'}
    ${[...byTrace].map(([t, arr]) => `<details class="tgroup" open><summary>${esc(t)} <small>${arr.length}</small></summary>${ACT_CATS.map(c => { const xs = arr.filter(a => actItem(a.type).cat === c.id); return xs.length ? `<div class="cgroup"><div class="cname">${esc(c.name)}</div>${xs.map(a => { const mr = actMeasRows(a).filter(([k]) => k !== 'Longitud').map(([, v]) => v.split(' (')[0]).slice(0, 2).join(' · ');
      return `<div class="nrow" data-act="${a.id}"><span class="dot" style="background:${actColor(a.type)}"></span>
      <span class="t"><b>${esc(a.type)} · ${SIDE_ABBR[a.side] || ''}${a.prio === 'alta' ? ' <span class="prio">alta</span>' : ''}</b><small>PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? '–' + fmtPK(a.d1) + ' · ' + fmtLen(a.d1 - a.d0) : ' · puntual'}${mr ? ' · ' + mr : ''} · ${(a.media || []).length} fotos</small></span></div>`; }).join('')}</div>` : ''; }).join('')}</details>`).join('')}
    ${list.length ? `<div class="acts"><button class="btn pri full" data-a="rep">${ICON.note}Informe de la visita</button><button class="btn" data-a="csv">Exportar a Excel (CSV)</button><button class="btn" data-a="bc3">Exportar a BC3</button></div>` : ''}`);
  b.querySelectorAll('[data-act]').forEach(r => r.onclick = () => { const a = acts.get(r.dataset.act); map.fitBounds(L.latLngBounds(a.coords).pad(0.4), { maxZoom: 18 }); viewAct(a.id); });
  b.querySelectorAll('[data-hc]').forEach(c => c.onclick = () => { const s = new Set(settings.actHideCats || []); s.has(c.dataset.hc) ? s.delete(c.dataset.hc) : s.add(c.dataset.hc); settings.actHideCats = [...s]; saveSettings(); drawActs(); actList(); });
  const c = b.querySelector('[data-a=csv]'); if (c) c.onclick = exportActsCSV;
  const rp = b.querySelector('[data-a=rep]'); if (rp) rp.onclick = () => visitReportSheet();
  const bb = b.querySelector('[data-a=bc3]'); if (bb) bb.onclick = () => bc3Sheet();
}
async function exportActsCSV() {
  const list = actsSorted();
  if (!list.length) { toast('Todavía no hay actuaciones que exportar.'); return; }
  const csv = actsCSV(list);
  const name = `actuaciones_${new Date().toISOString().slice(0, 10)}.csv`;
  try { await saveBlob(new Blob([csv], { type: 'text/csv' }), name); toast(`Exportadas ${list.length} actuaciones en ${name}`); }
  catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 6000); }
}
function actsCSV(list) {
  const n = (v, d = 2) => (v === null || v === undefined || v === '' ? '' : String(Math.round(v * 10 ** d) / 10 ** d).replace('.', ','));
  const c6 = v => v.toFixed(6).replace('.', ',');
  const q = csvQ;
  const rows = [['Traza', 'Capa', 'Familia', 'Tipo', 'Material / tipo', 'Margen', 'PK inicio', 'PK fin', 'Longitud (m)', 'Ancho (m)', 'Espesor (cm)', 'Altura (m)', 'Anchura sección (m)', 'Sobreancho (m)', 'Unidades', 'Diámetro (mm)',
    'Superficie (m²)', 'Volumen (m³)', 'Peso (t)', 'Ligante (kg)', 'Prioridad', 'Descripción', 'Fotos', 'Fecha', 'Lat inicio', 'Lon inicio', 'Lat fin', 'Lon fin']];
  list.forEach(a => { const p0 = a.coords[0], p1 = a.coords[a.coords.length - 1], p = a.params || {}, m = actMeasure(a);
    rows.push([a.traceName, a.layerName, actItem(a.type).catName, a.type, p.mat || '', SIDES[a.side], fmtPK(a.d0), fmtPK(a.d1), n(m.Lm || m.L, MEAS_DEC.L), n(p.w), n(p.e), n(p.h), n(p.b), n(p.S), n(m.n, 0), n(p.dia),
      n(m.area, MEAS_DEC.area), n(m.vol, MEAS_DEC.vol), n(m.t, MEAS_DEC.t), n(m.kg, 0), a.prio ? (ACT_PRIO[a.prio] || [a.prio])[0] : '', a.text, (a.media || []).length, fmtDate(a.created), c6(p0[0]), c6(p0[1]), c6(p1[0]), c6(p1[1])]); });
  return '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n');
}
