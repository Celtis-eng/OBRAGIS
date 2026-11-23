'use strict';
/* OBRA-GIS · Obras: paquete de obra (exportar/importar) y gestión de obras.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Obras: cada obra agrupa sus capas, anotaciones, fotos y actuaciones ---------------- */
const obras = new Map();
const safeName = s => String(s || 'obra').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'obra';
function updateObraLabel() { const o = obras.get(settings.activeObra); $('#obraName').textContent = o ? o.name : ''; }
async function clearMapData() {
  for (const e of layers.values()) { try { map.removeLayer(mapLayerOf(e)); } catch (_) {} }
  pointGroups.forEach(g => map.removeLayer(g));
  layers.clear(); pointGroups.clear(); notes.clear(); noteMarkers.clear(); acts.clear();
  highlight.clearLayers(); slopeHL.clearLayers(); actsLayer.clearLayers(); pkLayer.clearLayers(); widthLayer.clearLayers();
}
async function loadObra(id, fit) {
  closeSheet(); await clearMapData();
  settings.activeObra = id; saveSettings(); updateObraLabel(); loadAfecLast(); showWalkBar(); if (refreshPending()) showDraftBar(); else { const db = $('#draftBar'); if (db) db.hidden = true; }
  const recs = (await DB.all('layers')).filter(r => r.obraId === id).sort((a, b) => a.created - b.created);
  recs.forEach((r, i) => { if (r.order == null) r.order = i + 1; if (!r.type) r.type = 'kml'; });
  for (const rec of recs) { try { registerLayer(rec); } catch (e) { console.error(e); } }
  for (const r of recs) { // completa datos de capas añadidas con versiones anteriores
    const c = r.type === 'wms' && !r.info && CATALOG.find(x => x.url === r.url && x.layers === r.layers);
    if (c) { r.info = c.info || ''; r.cover = c.cover || ''; DB.put('layers', r); }
  }
  if (settings.notesVisible !== false) pointGroup('notes').addTo(map);
  for (const n of (await DB.all('notes')).filter(n => n.obraId === id)) { notes.set(n.id, n); drawNote(n); }
  for (const a of (await DB.all('acts')).filter(a => a.obraId === id)) acts.set(a.id, a);
  drawActs(); drawPK(); drawWidths();
  if (fit) {
    const pts = [];
    layers.forEach(e => { if (e.group) { const b = e.group.getBounds(); if (b.isValid()) pts.push(b.getSouthWest(), b.getNorthEast()); } });
    notes.forEach(n => pts.push(L.latLng(n.lat, n.lng)));
    acts.forEach(a => a.coords.forEach(c => pts.push(L.latLng(c))));
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.1), { maxZoom: 17 });
  }
  if (!$('#drawer').hidden) renderDrawer();
}
async function createObra(name, desc = '') {
  const o = { id: uid(), name: name.trim() || 'Obra nueva', desc, created: Date.now() };
  await DB.put('obras', o); obras.set(o.id, o); return o;
}
async function obraCounts(id) {
  const [l, n, a] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
  return { layers: l.filter(x => x.obraId === id).length, notes: n.filter(x => x.obraId === id).length, acts: a.filter(x => x.obraId === id).length };
}
async function deleteObraData(id) {
  const [l, n, a] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
  for (const x of l.filter(x => x.obraId === id)) await DB.del('layers', x.id);
  for (const x of n.filter(x => x.obraId === id)) await DB.del('notes', x.id);
  for (const x of a.filter(x => x.obraId === id)) await DB.del('acts', x.id);
  await DB.del('kv', 'ficha:' + id).catch(() => {}); delete fichaCache[id];
  for (const [k, d] of Object.entries(drafts)) if (d.data && d.data.obraId === id) delete drafts[k]; await DB.put('kv', drafts, 'drafts').catch(() => {}); refreshPending();
}
async function obrasSheet() {
  const list = [...obras.values()].sort((a, b) => a.name.localeCompare(b.name));
  const counts = await Promise.all(list.map(o => obraCounts(o.id)));
  const b = openSheet(`<h2>Obras</h2><p class="sub">Cada obra guarda sus propias capas, anotaciones, fotos y actuaciones</p>
    <div class="obras">${list.map((o, i) => { const c = counts[i], act = o.id === settings.activeObra;
      return `<div class="obra ${act ? 'on' : ''}">
        <button class="otitle" data-open="${o.id}" type="button"><b>${esc(o.name)}</b><small>${plural(c.layers, 'capa', 'capas')} · ${plural(c.notes, 'anotación', 'anotaciones')} · ${c.acts} actuaciones${act ? ' · <em>activa</em>' : ''}</small></button>
        <div class="row"><button class="mini" data-share="${o.id}">Exportar / compartir</button><button class="mini" data-ren="${o.id}">Renombrar</button>${list.length > 1 ? `<button class="mini del" data-delo="${o.id}">Eliminar</button>` : ''}</div>
      </div>`; }).join('')}</div>
    <h3 class="sh">Nueva obra</h3>
    <div class="field row"><input type="text" id="newObra" placeholder="Nombre (p. ej. Modernización regadío Cuevas del Campo)"><button class="mini" data-a="create">Crear</button></div>
    <div class="acts"><button class="btn pri full" data-a="backup">Copia de seguridad de todas las obras</button><button class="btn full" data-a="import">${ICON.folder}Importar obra o recuperar copia (.zip)</button></div>
    ${abStatusHtml()}
    <p class="hint">${settings.lastBackup ? `Última copia: ${fmtDate(settings.lastBackup)}.` : '<b>Aún no has hecho ninguna copia de seguridad.</b>'} ${NATIVE ? 'Las copias se guardan en <b>Documentos › OBRA-GIS</b> y no se borran al desinstalar la app.' : 'Las copias se guardan en Descargas.'} Haz una antes de actualizar o desinstalar la app.</p>
    <p class="hint">«Exportar / compartir» crea un .zip con toda la obra: capas, KML originales, anotaciones, actuaciones, fotos, vídeos y notas de voz. Al abrir ese .zip en otro móvil con OBRA-GIS, la obra aparece completa.</p>`);
  b.querySelectorAll('[data-open]').forEach(bt => bt.onclick = () => loadObra(bt.dataset.open, true).then(() => toast(`Obra activa: ${obras.get(bt.dataset.open).name}`)));
  b.querySelectorAll('[data-share]').forEach(bt => bt.onclick = () => exportObraPackage(bt.dataset.share));
  b.querySelectorAll('[data-ren]').forEach(bt => bt.onclick = () => {
    const o = obras.get(bt.dataset.ren);
    const s2 = openSheet(`<h2>Renombrar obra</h2><div class="field"><input type="text" id="renObra" value="${esc(o.name)}"></div><div class="acts"><button class="btn pri full" data-a="ok">Guardar</button></div>`);
    s2.querySelector('[data-a=ok]').onclick = async () => { o.name = $('#renObra').value.trim() || o.name; await DB.put('obras', o); updateObraLabel(); obrasSheet(); };
  });
  b.querySelectorAll('[data-delo]').forEach(bt => bt.onclick = async () => {
    const o = obras.get(bt.dataset.delo);
    if (!confirm(`¿Eliminar la obra «${o.name}» con todas sus capas, anotaciones, fotos y actuaciones? No se puede deshacer. Si quieres conservarla, expórtala antes.`)) return;
    await deleteObraData(o.id); await DB.del('obras', o.id); obras.delete(o.id);
    if (settings.activeObra === o.id) await loadObra([...obras.keys()][0], true);
    obrasSheet(); toast('Obra eliminada');
  });
  b.querySelector('[data-a=create]').onclick = async () => {
    const name = $('#newObra').value.trim(); if (!name) { toast('Escribe el nombre de la obra.'); return; }
    const o = await createObra(name); await loadObra(o.id); toast(`Obra «${o.name}» creada. Ya puedes importar sus KML y capas.`, 5000);
  };
  b.querySelector('[data-a=import]').onclick = () => $('#inObra').click();
  b.querySelector('[data-a=backup]').onclick = async () => { await backupAllObras(); obrasSheet(); };
}

// Paquete de obra (.zip): estructura de carpetas legible desde QGIS, Excel o Google Earth
const MIME_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', webm: 'video/webm', m4a: 'audio/mp4', ogg: 'audio/ogg' };
async function exportObraPackage(id, opts = {}) {
  try { return await buildObraPackage(id, opts); }
  catch (e) { console.error(e); if (opts.silent) throw e; toast('No se pudo exportar la obra: ' + (e.message || e), 8000); return null; }
}
async function buildObraPackage(id, opts = {}) {
  const o = obras.get(id); if (!o) return;
  if (!opts.blobOnly || !opts.silent) toast('Preparando el paquete de la obra…', 15000);
  const [L0, N0, A0] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
  const lays = L0.filter(x => x.obraId === id), nts = N0.filter(x => x.obraId === id), ats = A0.filter(x => x.obraId === id);
  const zip = new JSZip(), root = `OBRA-GIS_${safeName(o.name)}`, Z = zip.folder(root);
  const layerName = lid => { const l = lays.find(x => x.id === lid); return l ? l.name : 'Mis anotaciones'; };
  const usedPaths = new Set();
  const media = (owner, list, dir) => (list || []).map((m, i) => {
    if (!m || !(m.blob instanceof Blob)) return null;
    // nombre único: el texto se acorta, pero se añade un contador si ya existe (antes se pisaban fotos de nombres largos)
    const base = `multimedia/${dir}/${safeName(owner).slice(0, 48)}`; let path, k = 0;
    do { path = `${base}${k ? '_' + k : ''}_${i + 1}.${extFor(m)}`; k++; } while (usedPaths.has(path));
    usedPaths.add(path); Z.file(path, m.blob, { compression: 'STORE' }); // las fotos ya van comprimidas
    return { archivo: path, tipo: { photo: 'foto', video: 'video', audio: 'audio' }[m.kind], mime: m.mime, fecha: m.t ? new Date(m.t).toISOString() : undefined };
  }).filter(Boolean);
  const capas = lays.map(r => {
    const c = { id: r.id, tipo: r.type || 'kml', nombre: r.name, carpeta: folderOf(r), orden: r.order || 0, visible: !!r.visible, opacidad: r.opacity ?? 1, creada: new Date(r.created || Date.now()).toISOString() };
    if (r.drawn) c.dibujada = true;
    if (c.tipo === 'kml') { c.archivo = `capas/kml/${safeName(r.name)}_${r.id}.kml`; c.color = r.color; Z.file(c.archivo, r.text); if (r.widths && Object.keys(r.widths).length) c.anchos = r.widths; if (r.pkStep) c.pk_cada_m = r.pkStep; if (r.hiddenFeats && r.hiddenFeats.length) c.elementos_ocultos = r.hiddenFeats; }
    if (c.tipo === 'wms') Object.assign(c, { servicio: r.kind, url: r.url, capas_wms: r.layers, consulta: r.info || '', cobertura: r.cover || '', atribucion: r.attribution || '', zoom_max_nativo: r.maxNative || null });
    return c;
  });
  const notePts = nts.map(n => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [n.lng, n.lat] },
    properties: { id: n.id, titulo: n.title, texto: n.text || '', fecha: new Date(n.created).toISOString(), origen_posicion: n.src || '', precision_m: n.acc ?? null,
      altitud_m: n.alt ?? null, orientacion_grados: n.dir ?? null, capa: layerName(n.layerId), capa_id: n.layerId || null, ficha: n.ficha || undefined, multimedia: media(n.title + '_' + n.id.slice(-4), n.media, n.layerId ? 'fotos_importadas' : 'anotaciones') } }));
  const actFeats = ats.filter(a => a.coords && a.coords.length).map(a => ({ type: 'Feature',
    geometry: a.coords.length > 1 && a.d1 > a.d0 ? { type: 'LineString', coordinates: a.coords.map(c => [c[1], c[0]]) } : { type: 'Point', coordinates: [a.coords[0][1], a.coords[0][0]] },
    properties: { id: a.id, tipo: a.type, margen: SIDES[a.side] || '', margen_cod: a.side, pk_inicio: fmtPK(a.d0), pk_fin: fmtPK(a.d1), pk_inicio_m: +a.d0.toFixed(2), pk_fin_m: +a.d1.toFixed(2),
      longitud_m: +(a.d1 - a.d0).toFixed(2), traza: a.traceName, capa: a.layerName, capa_id: a.layerId, elemento: a.featIdx, descripcion: a.text || '', fecha: new Date(a.created).toISOString(),
      familia: actItem(a.type).catName, parametros: a.params || {}, prioridad: a.prio ? (ACT_PRIO[a.prio] || [a.prio])[0] : '', prioridad_cod: a.prio || '', actualizada: a.updated ? new Date(a.updated).toISOString() : null,
      mediciones: Object.fromEntries(Object.entries(actMeasure(a)).filter(([k, v]) => k !== 'sides' && v).map(([k, v]) => [{ L: 'longitud_m', Lm: 'longitud_total_m', area: 'superficie_m2', vol: 'volumen_m3', t: 'peso_t', kg: 'ligante_kg', n: 'unidades', tubo: 'tubo_m' }[k] || k, +v.toFixed(2)])),
      multimedia: media(`${a.type}_PK${fmtPK(a.d0)}_${a.id.slice(-4)}`, a.media, 'actuaciones') } }));
  const fc = features => JSON.stringify({ type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }, features }, null, 1);
  Z.file('datos/anotaciones.geojson', fc(notePts.filter(f => !f.properties.capa_id)));
  Z.file('datos/fotos_importadas.geojson', fc(notePts.filter(f => f.properties.capa_id)));
  Z.file('datos/actuaciones.geojson', fc(actFeats));
  const wx = widthsExport(lays.filter(r => (r.type || 'kml') === 'kml' && r.widths));
  if (wx.rows > 1) { Z.file('datos/anchos.csv', wx.csv); Z.file('datos/anchos_superficie.geojson', fc(wx.polys)); }
  const resFC = [...resources.values()].map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.lng, r.lat] }, properties: { id: r.id, tipo: r.type, nombre: r.name, empresa: r.company, telefono: r.phone, direccion: r.address, materiales: r.materials, notas: r.notes } }));
  if (resFC.length) Z.file('datos/recursos.geojson', fc(resFC));
  const afr = id === settings.activeObra ? afecLast() : await DB.get('kv', 'afec:' + id).catch(() => null);
  if (afr) { Z.file('informes/afecciones.html', afecHtml(afr)); Z.file('informes/afecciones.csv', '\ufeff' + afecCsv(afr)); Z.file('informes/afecciones.json', JSON.stringify(afr)); }
  const nFichas = await fichaPackExport(Z, id);
  Z.file('datos/actuaciones.csv', actsCSV(ats.sort((a, b) => (a.traceName || '').localeCompare(b.traceName || '') || a.d0 - b.d0)));
  Z.file('obra.json', JSON.stringify({ formato: 'OBRA-GIS', version: 1, app_version: APP_VERSION, exportado: new Date().toISOString(),
    obra: { id: o.srcId || o.id, nombre: o.name, descripcion: o.desc || '', creada: new Date(o.created).toISOString() },
    sistema_referencia: 'WGS84 / ETRS89 geográficas (EPSG:4326)', capas, bc3: settings.bc3Map || undefined,
    resumen: { capas: capas.length, anotaciones: notePts.length, actuaciones: actFeats.length, fichas_inspeccion: nFichas } }, null, 2));
  Z.file('LEEME.txt', [`OBRA-GIS · ${o.name}`, `Exportado el ${fmtDate(Date.now())}`, '',
    'obra.json                    Datos de la obra y lista de capas (carpeta, orden, estilo, servicios WMS)',
    'capas/kml/                   KML originales de las trazas',
    'datos/anotaciones.geojson    Anotaciones de campo (puntos)',
    'datos/fotos_importadas.geojson  Fotos situadas por sus coordenadas GPS',
    'datos/actuaciones.geojson    Actuaciones sobre las trazas (líneas o puntos) con tipo, margen y PK',
    'datos/actuaciones.csv        Listado de actuaciones para Excel',
    'datos/recursos.geojson       Plantas, canteras y demás recursos (comunes a todas las obras)',
    'informes/afecciones.html     Último informe de afecciones (abrir en el navegador; imprimir a PDF)',
    'datos/anchos.csv             Anchos del camino por tramos (PK, ancho, longitud, superficie)',
    'datos/anchos_superficie.geojson  Plataforma del camino con su ancho (polígonos, con superficie en m²)',
    'datos/fichas_inspeccion.json Fichas de inspección de campo (para cargarlas en otro móvil)',
    'informes/ficha_*.html        Fichas de inspección para imprimir o guardar en PDF (y su .json para la revisión del presupuesto)',
    'presupuesto/                 BC3 del presupuesto usado para la parte de proyecto de las fichas',
    'multimedia/                  Fotos, vídeos y notas de voz, enlazados desde los GeoJSON (campo multimedia)', '',
    'Para cargar la obra completa en otro móvil: abre este .zip con OBRA-GIS (Compartir → OBRA-GIS, o Obras → Importar obra).',
    'Los GeoJSON se abren directamente en QGIS (coordenadas EPSG:4326).'].join('\r\n'));
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE', compressionOptions: { level: 5 } });
  const name = `${root}_${stamp()}_${o.id.replace(/[^a-z0-9]/gi, '').slice(-4)}.zip`; // único aunque dos obras se llamen casi igual
  if (opts.blobOnly) return { blob, name };
  try {
    const r = await saveBlob(blob, name, opts);
    if (!opts.quiet) toast(`Paquete listo: ${name} (${(blob.size / 1048576).toFixed(1).replace('.', ',')} MB)${r && r.where === 'DOCUMENTS' ? ' · en Documentos › OBRA-GIS' : ''}`, 7000);
    return { name, size: blob.size, where: r && r.where };
  } catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 8000); return null; }
}
// Copia de seguridad de todas las obras (un paquete por obra). Imprescindible antes de desinstalar o cambiar de móvil.
async function backupAllObras() {
  const ids = [...obras.keys()]; if (!ids.length) return;
  toast(`Copia de seguridad de ${ids.length} obra${ids.length > 1 ? 's' : ''}…`, 20000);
  let ok = 0, where = '';
  for (const id of ids) { const r = await exportObraPackage(id, { share: false, quiet: true }); if (r) { ok++; where = r.where; } }
  settings.lastBackup = Date.now(); saveSettings();
  toast(ok === ids.length ? `Copia hecha: ${ok} paquete${ok > 1 ? 's' : ''} ${where === 'DOCUMENTS' ? 'en Documentos › OBRA-GIS' : where === 'DOWNLOAD' ? 'en Descargas' : 'guardados'}. Para restaurar: Obras → Importar obra.` : `Solo se copiaron ${ok} de ${ids.length} obras.`, 9000);
}
async function isObraPackage(file) {
  try { const zip = await JSZip.loadAsync(file); return zip.file(/(^|\/)obra\.json$/)[0] ? zip : null; } catch (e) { return null; }
}
// La importación no toca nada de lo que ya hay hasta terminar bien: se lee y valida todo el paquete,
// se escribe como obra nueva y solo al final, si se eligió «Reemplazar», se borra la obra antigua.
async function importObraPackage(file, zipIn) {
  const fname = file && file.name ? `«${file.name}»` : 'El paquete';
  let zip, meta, pre;
  try {
    zip = zipIn || await JSZip.loadAsync(file);
    const entry = zip.file(/(^|\/)obra\.json$/)[0];
    if (!entry) { toast(`${fname} no es un paquete de obra de OBRA-GIS.`, 6000); return; }
    pre = entry.name.replace(/obra\.json$/, '');
    meta = JSON.parse(await entry.async('string'));
    if (meta.formato !== 'OBRA-GIS' || !meta.obra || !meta.obra.id) throw new Error('obra.json no tiene el formato de OBRA-GIS');
    for (const path of ['datos/anotaciones.geojson', 'datos/fotos_importadas.geojson', 'datos/actuaciones.geojson', 'datos/recursos.geojson']) { // comprobar antes de escribir nada
      const f = zip.file(pre + path); if (f) { const j = JSON.parse(await f.async('string')); if (!Array.isArray(j.features)) throw new Error(path + ' no es un GeoJSON válido'); }
    }
  } catch (e) { toast(`${fname} está dañado y no se ha importado (${e.message || e}). No se ha cambiado nada.`, 8000); return; }
  // la obra se reconoce por su identificador original (srcId), aunque ya se haya reemplazado antes
  const exists = obras.get(meta.obra.id) || [...obras.values()].find(x => x.srcId === meta.obra.id);
  const mode = exists ? await askImportMode(exists.name) : 'new';
  if (!mode) return;
  toast('Importando la obra…', 15000);
  const obraId = exists ? uid() : meta.obra.id;
  const o = { id: obraId, name: mode === 'copy' ? meta.obra.nombre + ' (copia)' : meta.obra.nombre, desc: meta.obra.descripcion || '', created: Date.parse(meta.obra.creada) || Date.now() };
  if (exists && mode === 'replace') o.srcId = meta.obra.id;
  if (meta.bc3 && typeof meta.bc3 === 'object') { const m0 = { ...(settings.bc3Map || {}) }; for (const [t, v] of Object.entries(meta.bc3)) if (!m0[t] && v && typeof v === 'object') if (t !== '__proto__' && t.length < 200) m0[t] = { code: typeof v.code === 'string' ? bc3Code(v.code) || undefined : undefined, unit: isUnit(v.unit) ? v.unit : undefined, price: typeof v.price === 'number' && isFinite(v.price) && v.price >= 0 && v.price < 1e9 ? v.price : undefined, summary: typeof v.summary === 'string' ? v.summary.slice(0, 200) : undefined }; settings.bc3Map = m0; saveSettings(); }
  let nN = 0, nA = 0;
  try {
  await DB.put('obras', o); obras.set(o.id, o);
  const idMap = {};
  for (const c of meta.capas || []) {
    const nid = uid(); idMap[c.id] = nid;
    const base = { id: nid, obraId, type: c.tipo, name: c.nombre, folder: c.carpeta, order: c.orden, visible: c.visible, opacity: c.opacidad, created: Date.parse(c.creada) || Date.now() };
    if (c.dibujada) base.drawn = true;
    if (c.tipo === 'kml') { const f = zip.file(pre + c.archivo); if (!f) continue; Object.assign(base, { text: await f.async('string'), color: c.color || PALETTE[0] }); }
    if (c.tipo === 'wms') Object.assign(base, { kind: c.servicio, url: c.url, layers: c.capas_wms, info: c.consulta, cover: c.cobertura, attribution: c.atribucion, maxNative: c.zoom_max_nativo || undefined });
    if (c.tipo === 'photos') base.order = 0;
    if (c.anchos) base.widths = c.anchos;
    if (c.pk_cada_m) base.pkStep = c.pk_cada_m;
    if (c.elementos_ocultos) base.hiddenFeats = c.elementos_ocultos;
    if (DEFAULT_FOLDER[c.tipo] === c.carpeta) delete base.folder;
    await DB.put('layers', base);
  }
  const readMedia = async list => {
    const out = [];
    for (const m of list || []) {
      const f = zip.file(pre + m.archivo); if (!f) continue;
      const ext = m.archivo.split('.').pop().toLowerCase();
      const kind = { foto: 'photo', video: 'video', audio: 'audio' }[m.tipo] || 'photo';
      out.push({ id: uid(), kind, blob: new Blob([await f.async('arraybuffer')], { type: m.mime || MIME_EXT[ext] || '' }), mime: m.mime || MIME_EXT[ext] || '', t: Date.parse(m.fecha) || Date.now() });
    }
    return out;
  };
  const readFC = async path => { const f = zip.file(pre + path); return f ? JSON.parse(await f.async('string')).features || [] : []; };
  for (const ft of [...await readFC('datos/anotaciones.geojson'), ...await readFC('datos/fotos_importadas.geojson')]) {
    const p = ft.properties, [lng, lat] = ft.geometry.coordinates;
    await DB.put('notes', { id: uid(), obraId, layerId: p.capa_id ? idMap[p.capa_id] || null : null, lat, lng, title: p.titulo, text: p.texto, created: Date.parse(p.fecha) || Date.now(),
      src: p.origen_posicion, acc: p.precision_m, alt: p.altitud_m, dir: p.orientacion_grados, ficha: p.ficha || undefined, media: await readMedia(p.multimedia) }); nN++;
  }
  for (const ft of await readFC('datos/actuaciones.geojson')) {
    const p = ft.properties, g = ft.geometry;
    const coords = g.type === 'LineString' ? g.coordinates.map(c => [c[1], c[0]]) : [[g.coordinates[1], g.coordinates[0]]];
    await DB.put('acts', { id: uid(), obraId, layerId: idMap[p.capa_id] || null, featIdx: p.elemento, traceName: p.traza, layerName: p.capa, d0: p.pk_inicio_m, d1: p.pk_fin_m,
      type: p.tipo, side: p.margen_cod || 'izq', text: p.descripcion, created: Date.parse(p.fecha) || Date.now(), updated: Date.parse(p.actualizada) || undefined, params: cleanActParams(p.parametros), prio: ACT_PRIO[p.prioridad_cod] ? p.prioridad_cod : '', coords, media: await readMedia(p.multimedia) }); nA++;
  }
  const afj = zip.file(pre + 'informes/afecciones.json');
  if (afj) { try { const r = JSON.parse(await afj.async('string')); r.rows.forEach(x => { x.layerId = idMap[x.layerId] || x.layerId; }); r.targets.forEach(x => { x.layerId = idMap[x.layerId] || x.layerId; }); await DB.put('kv', r, 'afec:' + obraId); delete afecLastCache[obraId]; } catch (e) { /* informe no válido */ } }
  for (const ft of await readFC('datos/recursos.geojson')) { // recursos comunes: se añaden los que no existan
    const p = ft.properties; if (!p.id || resources.has(p.id)) continue;
    const r = { id: p.id, type: p.tipo, name: p.nombre, company: p.empresa, phone: p.telefono, address: p.direccion, materials: p.materiales, notes: p.notas, lat: ft.geometry.coordinates[1], lng: ft.geometry.coordinates[0], created: Date.now() };
    await DB.put('resources', r); resources.set(r.id, r); drawResource(r);
  }
  await fichaPackImport(zip, pre, obraId, idMap);
  } catch (e) {
    console.error(e);
    try { await deleteObraData(obraId); await DB.del('obras', obraId); } catch (e2) { /* nada */ }
    obras.delete(obraId);
    toast(`No se pudo importar ${fname}: ${e.message || e}. ${exists ? 'La obra que tenías sigue intacta.' : 'No se ha creado ninguna obra.'}`, 9000);
    return;
  }
  if (mode === 'replace' && exists) { // ya está todo dentro: ahora sí se quita la versión antigua
    await deleteObraData(exists.id); await DB.del('obras', exists.id); obras.delete(exists.id);
    try { const afOld = await DB.get('kv', 'afec:' + exists.id); if (afOld && !(await DB.get('kv', 'afec:' + obraId))) await DB.put('kv', afOld, 'afec:' + obraId); } catch (e) { /* nada */ }
  }
  // una obra vacía con el mismo nombre (p. ej. «Mi primera obra» de una instalación nueva) sobra: se quita
  for (const x of [...obras.values()]) {
    if (x.id === obraId || x.name !== o.name) continue;
    const c = await obraCounts(x.id); if (c.layers || c.notes || c.acts) continue;
    await deleteObraData(x.id); await DB.del('obras', x.id); obras.delete(x.id);
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  await loadObra(obraId, true);
  toast(`Obra «${o.name}» importada: ${(meta.capas || []).length} capas, ${nN} anotaciones y ${nA} actuaciones.`, 7000);
}
function cleanActParams(p) {
  const out = {}; if (!p || typeof p !== 'object') return out;
  Object.entries(p).forEach(([k, v]) => { if (ACT_FIELDS[k] && isFinite(v) && v > 0) out[k] = +v; });
  if (typeof p.mat === 'string') out.mat = p.mat.slice(0, 80);
  if (ACT_FORMS[p.forma]) out.forma = p.forma;
  return out;
}
function askImportMode(name) {
  return new Promise(res => {
    const b = openSheet(`<h2>La obra ya existe</h2><p class="sub">Ya tienes «${esc(name)}» en este móvil.</p><div class="acts">
      <button class="btn pri full" data-m="replace">Reemplazarla por la del paquete</button>
      <button class="btn full" data-m="copy">Importarla como copia</button>
      <button class="btn full" data-m="">Cancelar</button></div>
      <p class="hint">Reemplazar borra lo que tienes ahora de esa obra en este móvil y lo sustituye por el contenido del paquete.</p>`);
    let done = false;
    b.querySelectorAll('[data-m]').forEach(bt => bt.onclick = () => { done = true; closeSheet(); res(bt.dataset.m || null); });
    onSheetClose(() => { if (!done) res(null); });
  });
}
