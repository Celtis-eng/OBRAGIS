'use strict';
/* OBRA-GIS · Editar la geometría de un elemento KML: mover vértices, añadir y quitar puntos y alargar la traza.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global).
   Al guardar se reescriben las coordenadas en el KML de la capa. Las actuaciones y los anchos de esa traza se quedan
   donde estaban sobre el terreno: se vuelven a proyectar sobre la traza nueva (sus PK cambian si se alarga por el inicio). */
let geomEdit = null; // { rec, fi, f, part, pts:[[lat,lng]], kind, undo:[], sel, extend:'' | 'start' | 'end', group }
const GE_MAX_UNDO = 50;
function geomEditable(f) { return f && f.parts && f.parts.some(p => ['ln', 'pg', 'pt'].includes(p.t)); }
// Parte del elemento que se edita: la línea (o el polígono) más cercana al punto tocado
function gePartIndex(f, ll) {
  let best = 0, bd = Infinity;
  f.parts.forEach((p, i) => { if (!['ln', 'pg', 'pt'].includes(p.t)) return; p.c.forEach(c => { const d = ll ? L.latLng(c).distanceTo(ll) : 0; if (d < bd) { bd = d; best = i; } }); });
  return best;
}
function startGeomEdit(rec, f, ll) {
  if (!geomEditable(f)) { toast('Este elemento no se puede editar aquí.'); return; }
  if (geomEdit) endGeomEdit(false);
  if (measure) endMeasure();
  const e = layers.get(rec.id), fi = e.feats.indexOf(f), part = gePartIndex(f, ll), p = f.parts[part];
  if (!geKmlTarget(rec.text, f.pm, part)) { toast('Esta traza viene de un recorrido GPS (gx:Track) y no se puede editar punto a punto.', 7000); return; }
  closeSheet(); closeDrawer && closeDrawer();
  geomEdit = { rec, fi, f, part, kind: p.t, pts: p.c.map(c => [c[0], c[1]]), undo: [], sel: -1, extend: '', group: L.layerGroup().addTo(map) };
  geDraw(); geBar();
  try { map.fitBounds(L.latLngBounds(geomEdit.pts).pad(0.15), { maxZoom: 18 }); } catch (er) { /* un solo punto */ }
  toast(p.t === 'pt' ? 'Arrastra el punto a su sitio y pulsa «Guardar».' : 'Arrastra los puntos para moverlos. Toca un «+» para añadir un punto en medio.', 6000);
}
function gePush() { const g = geomEdit; g.undo.push(g.pts.map(c => [...c])); if (g.undo.length > GE_MAX_UNDO) g.undo.shift(); }
const geIcon = (cls, html = '') => L.divIcon({ className: '', html: `<div class="gev ${cls}">${html}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
function geDraw() {
  const g = geomEdit; if (!g) return;
  g.group.clearLayers();
  const col = g.rec.color || '#ffd43b';
  if (g.kind === 'ln') L.polyline(g.pts, { color: col, weight: 5, opacity: .95, dashArray: '10 6', interactive: false }).addTo(g.group);
  if (g.kind === 'pg') L.polygon(g.pts, { color: col, weight: 4, opacity: .95, fillOpacity: .15, dashArray: '10 6', interactive: false }).addTo(g.group);
  // puntos intermedios «+»: un toque añade un vértice ahí
  if (g.kind !== 'pt') {
    const n = g.pts.length, segs = g.kind === 'pg' ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = g.pts[i], b = g.pts[(i + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const mk = L.marker(m, { icon: geIcon('mid', '+'), keyboard: false, zIndexOffset: 500 }).addTo(g.group);
      mk.on('click', ev => { L.DomEvent.stop(ev); gePush(); g.pts.splice(i + 1, 0, m); g.sel = i + 1; geDraw(); geBar(); });
    }
  }
  g.pts.forEach((c, i) => {
    const ends = g.kind === 'ln' && (i === 0 || i === g.pts.length - 1);
    const mk = L.marker(c, { icon: geIcon(`${i === g.sel ? 'sel' : ''} ${ends ? 'end' : ''}`, ends ? (i === 0 ? 'A' : 'B') : ''), draggable: true, keyboard: false, zIndexOffset: 1000, autoPan: true }).addTo(g.group);
    mk.on('dragstart', () => { gePush(); g.sel = i; });
    mk.on('drag', ev => { const ll = ev.target.getLatLng(); g.pts[i] = [ll.lat, ll.lng]; const l0 = g.group.getLayers()[0]; if (l0 && l0.setLatLngs) l0.setLatLngs(g.pts); });
    mk.on('dragend', () => { geDraw(); geBar(); });
    mk.on('click', ev => { L.DomEvent.stop(ev); g.sel = g.sel === i ? -1 : i; geDraw(); geBar(); });
  });
}
// Toque en el mapa durante la edición: con «Alargar» activo añade un punto al principio o al final
function geomEditTap(ll) {
  const g = geomEdit; if (!g) return;
  if (g.kind === 'pt') { gePush(); g.pts = [[ll.lat, ll.lng]]; geDraw(); geBar(); return; }
  if (!g.extend) { toast(g.kind === 'ln' ? 'Para alargar la traza pulsa «Alargar inicio» o «Alargar final» y toca el mapa.' : 'Arrastra los puntos o toca un «+» para añadir uno.', 4000); return; }
  gePush();
  if (g.extend === 'start') { g.pts.unshift([ll.lat, ll.lng]); g.sel = 0; } else { g.pts.push([ll.lat, ll.lng]); g.sel = g.pts.length - 1; }
  geDraw(); geBar();
}
function geLen() { let s = 0; for (let i = 1; i < geomEdit.pts.length; i++) s += L.latLng(geomEdit.pts[i - 1]).distanceTo(geomEdit.pts[i]); return s; }
function geBar() {
  const g = geomEdit; let el = $('#geBar');
  if (!g) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'geBar'; el.className = 'gebar'; el.setAttribute('role', 'toolbar'); document.body.appendChild(el); }
  const minPts = g.kind === 'pg' ? 3 : g.kind === 'ln' ? 2 : 1, canDel = g.sel >= 0 && g.pts.length > minPts;
  el.innerHTML = `<div class="getxt"><b>Editando «${esc(g.f.name)}»</b><small>${g.kind === 'pt' ? 'Arrastra el punto o toca el mapa donde va.' : `${g.pts.length} puntos${g.kind === 'ln' ? ' · ' + fmtLen(geLen()) : ''}${g.extend ? ` · <b>toca el mapa para añadir al ${g.extend === 'start' ? 'inicio (A)' : 'final (B)'}</b>` : ''}`}</small></div>
    <div class="row">${g.kind === 'ln' ? `<button class="mini ${g.extend === 'start' ? 'on' : ''}" data-g="xs" aria-pressed="${g.extend === 'start'}">Alargar inicio</button><button class="mini ${g.extend === 'end' ? 'on' : ''}" data-g="xe" aria-pressed="${g.extend === 'end'}">Alargar final</button><button class="mini" data-g="gps" title="Añade tu posición GPS al final">${ICON.locate}Mi posición</button>` : ''}
      ${g.kind !== 'pt' ? `<button class="mini" data-g="del" ${canDel ? '' : 'disabled'}>Quitar punto</button>` : ''}<button class="mini" data-g="undo" ${g.undo.length ? '' : 'disabled'}>Deshacer</button></div>
    <div class="row2"><button class="btn" data-g="x">Cancelar</button><button class="btn pri" data-g="ok">Guardar</button></div>`;
  el.hidden = false;
  const on = (k, fn) => { const b = el.querySelector(`[data-g=${k}]`); if (b) b.onclick = fn; };
  on('xs', () => { g.extend = g.extend === 'start' ? '' : 'start'; geBar(); });
  on('xe', () => { g.extend = g.extend === 'end' ? '' : 'end'; geBar(); });
  on('gps', async () => { toast('Obteniendo posición GPS…', 2500); try { const p = await getPos(); gePush(); g.pts.push([p.lat, p.lng]); g.sel = g.pts.length - 1; geDraw(); geBar(); } catch (e) { toast(geoErr(e), 6000); } });
  on('del', () => { if (!canDel) return; gePush(); g.pts.splice(g.sel, 1); g.sel = -1; geDraw(); geBar(); });
  on('undo', () => { const u = g.undo.pop(); if (!u) return; g.pts = u; g.sel = -1; geDraw(); geBar(); });
  on('x', () => { if (g.undo.length && !confirm('¿Salir sin guardar los cambios de la traza?')) return; endGeomEdit(false); });
  on('ok', saveGeomEdit);
}
function endGeomEdit(reopen) {
  const g = geomEdit; if (!g) return;
  map.removeLayer(g.group); geomEdit = null; geBar();
  if (reopen) { const e = layers.get(g.rec.id), nf = e && e.feats[g.fi]; if (nf) featureSheet(nf, L.latLng(nf.start[0], nf.start[1]), e.rec); }
}
// El nodo <coordinates> del KML que corresponde a la parte «part» (mismo orden que parseKML: puntos, líneas, polígonos)
function geKmlTarget(text, pmIndex, part) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const pm = byTag(doc, 'Placemark')[pmIndex]; if (!pm) return null;
  const list = [];
  byTag(pm, 'Point').forEach(g => { const c = byTag(g, 'coordinates')[0]; if (c && parseCoords(c.textContent).length) list.push(c); });
  byTag(pm, 'LineString').forEach(g => { const c = byTag(g, 'coordinates')[0]; if (c && parseCoords(c.textContent).length > 1) list.push(c); });
  byTag(pm, 'Polygon').forEach(g => { const r = byTag(g, 'outerBoundaryIs')[0] || g; const c = byTag(r, 'coordinates')[0]; if (c && parseCoords(c.textContent).length > 2) list.push(c); });
  return list[part] ? { doc, node: list[part] } : null;
}
async function saveGeomEdit() {
  const g = geomEdit; if (!g) return;
  if (!g.undo.length) { endGeomEdit(true); return; }
  const rec = g.rec, e = layers.get(rec.id), oldF = e.feats[g.fi];
  const t = geKmlTarget(rec.text, oldF.pm, g.part); if (!t) { toast('No se encuentra el elemento en el KML: no se ha cambiado nada.', 7000); return; }
  let pts = g.pts; if (g.kind === 'pg') { const a = pts[0], b = pts[pts.length - 1]; if (a[0] !== b[0] || a[1] !== b[1]) pts = [...pts, a]; } // anillo cerrado
  t.node.textContent = pts.map(c => `${c[1].toFixed(7)},${c[0].toFixed(7)},0`).join(' ');
  const newText = new XMLSerializer().serializeToString(t.doc);
  let nf; try { nf = parseKML(newText).feats[g.fi]; } catch (er) { nf = null; }
  if (!nf) { toast('La traza editada no es válida: no se ha cambiado nada.', 7000); return; }
  // actuaciones y anchos de esta traza: se quedan en su sitio sobre el terreno
  const relActs = oldF.type === 'ln' ? [...acts.values()].filter(a => a.layerId === rec.id && a.featIdx === g.fi) : [];
  const reproj = d => { const q = pointAtPK(oldF, d); return pkAt(nf, L.latLng(q.lat, q.lng)).d; };
  const newActs = relActs.map(a => { let d0 = reproj(a.d0), d1 = a.d1 > a.d0 ? reproj(a.d1) : d0; if (d1 < d0) [d0, d1] = [d1, d0];
    return { ...a, d0, d1, coords: segmentCoords(nf, d0, d1), updated: Date.now() }; });
  const wd = rec.widths && rec.widths[g.fi], newWidths = rec.widths ? JSON.parse(JSON.stringify(rec.widths)) : rec.widths;
  if (wd && nf.type === 'ln') newWidths[g.fi] = { ...wd, points: (wd.points || []).map(p => ({ ...p, d: +reproj(p.d).toFixed(2) })).sort((a, b) => a.d - b.d), updated: Date.now() };
  try { await DB.putMany([['layers', { ...rec, text: newText, widths: newWidths }], ...newActs.map(a => ['acts', a])]); }
  catch (er) { toast('No se pudo guardar la traza (' + (er && er.message || 'almacenamiento lleno') + '). No se ha cambiado nada.', 8000); return; }
  const prev = { text: rec.text, widths: rec.widths, acts: relActs.map(a => ({ ...a })) };
  rec.text = newText; rec.widths = newWidths; newActs.forEach(a => acts.set(a.id, a));
  if (walkAct && walkAct.draft.layerId === rec.id && walkAct.draft.featIdx === g.fi) { const w = walkAct.draft; w.d0 = w.d1 = reproj(w.d0); DB.put('kv', walkAct, 'walk').catch(() => {}); showWalkBar(); }
  map.removeLayer(g.group); geomEdit = null; geBar();
  rebuildLayer(rec.id); drawActs(); drawWidths(); drawPK();
  const dl = nf.type === 'ln' ? nf.length - oldF.length : 0;
  showUndo(`Traza guardada${nf.type === 'ln' ? `: ${fmtLen(nf.length)} (${dl >= 0 ? '+' : '−'}${fmtLen(Math.abs(dl))})` : ''}${newActs.length ? ` · ${plural(newActs.length, 'actuación recolocada', 'actuaciones recolocadas')}` : ''}`, async () => {
    await DB.putMany([['layers', { ...rec, text: prev.text, widths: prev.widths }], ...prev.acts.map(a => ['acts', a])]);
    rec.text = prev.text; rec.widths = prev.widths; prev.acts.forEach(a => acts.set(a.id, a)); rebuildLayer(rec.id); drawActs(); drawWidths(); drawPK(); toast('Cambios de la traza deshechos.');
  }, 10000);
}
