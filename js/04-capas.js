'use strict';
/* OBRA-GIS · Invertir traza, importación de ficheros, OCR de marcas de agua, pulsación larga y consultas WMS.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Invertir el sentido de una traza ----------------
   Invierte el orden de los vértices en el KML; los PK pasan a contarse desde el otro extremo.
   Las actuaciones y los anchos de esa traza se recalculan (y el margen izquierdo pasa a ser el derecho). */
function reverseKmlPlacemark(text, pmIndex) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const pm = byTag(doc, 'Placemark')[pmIndex]; if (!pm) throw new Error('No se encuentra el elemento en el KML');
  const lines = [...byTag(pm, 'LineString'), ...byTag(pm, 'Track')];
  byTag(pm, 'LineString').forEach(ls => { const c = byTag(ls, 'coordinates')[0]; if (c) c.textContent = c.textContent.trim().split(/\s+/).reverse().join(' '); });
  byTag(pm, 'Track').forEach(tr => { const cs = byTag(tr, 'coord'), ws = byTag(tr, 'when'); const cv = cs.map(n => n.textContent).reverse(); cs.forEach((n, i) => { n.textContent = cv[i]; }); const wv = ws.map(n => n.textContent).reverse(); ws.forEach((n, i) => { n.textContent = wv[i]; }); });
  if (lines.length > 1) { const parent = lines[0].parentNode; if (lines.every(l => l.parentNode === parent)) { const anchor = lines[lines.length - 1].nextSibling; lines.slice().reverse().forEach(l => parent.insertBefore(l, anchor)); } }
  return new XMLSerializer().serializeToString(doc);
}
async function reverseTrace(rec, f) {
  const e = layers.get(rec.id), fi = e.feats.indexOf(f), L0 = f.length;
  const relActs = [...acts.values()].filter(a => a.layerId === rec.id && a.featIdx === fi);
  const wd = rec.widths && rec.widths[fi];
  if (!confirm(`¿Invertir el sentido de «${f.name}»? El inicio pasa a ser el final y los PK se cuentan desde el otro extremo.${relActs.length ? ` Se recalcularán ${relActs.length} actuaciones (el margen izquierdo pasa a ser el derecho).` : ''}${wd ? ' También se recalcularán sus anchos.' : ''}`)) return;
  // Se prepara todo en copias y se guarda en una sola transacción; solo si se guarda bien se aplica en pantalla
  let newText;
  try { newText = reverseKmlPlacemark(rec.text, f.pm); } catch (err) { toast('No se pudo invertir: ' + err.message, 6000); return; }
  const newWidths = rec.widths ? JSON.parse(JSON.stringify(rec.widths)) : rec.widths;
  if (wd) {
    const segs = widthSegments(wd, f);
    const pts = wd.mode === 'changes'
      ? segs.map(sg => ({ d: +(L0 - sg.b).toFixed(2), w: sg.wa })).sort((a, b) => a.d - b.d)
      : (wd.points || []).map(p => ({ d: +(L0 - p.d).toFixed(2), w: p.w })).sort((a, b) => a.d - b.d);
    newWidths[fi] = { ...wd, points: pts, updated: Date.now() };
  }
  const nf = parseKML(newText).feats[fi]; // mismos índices de elementos que la capa cargada
  const newActs = relActs.map(a => { const d0 = Math.max(0, L0 - a.d1), d1 = Math.min(nf.length, L0 - a.d0);
    return { ...a, d0, d1, side: a.side === 'izq' ? 'der' : a.side === 'der' ? 'izq' : a.side, coords: segmentCoords(nf, d0, d1), updated: Date.now() }; });
  try { await DB.putMany([['layers', { ...rec, text: newText, widths: newWidths }], ...newActs.map(a => ['acts', a])]); }
  catch (err) { toast('No se pudo guardar el cambio de sentido (' + (err && err.message || 'almacenamiento lleno') + '). No se ha cambiado nada.', 8000); return; }
  rec.text = newText; rec.widths = newWidths; newActs.forEach(a => acts.set(a.id, a));
  if (walkAct && walkAct.draft.layerId === rec.id && walkAct.draft.featIdx === fi) { const w = walkAct.draft; w.d0 = w.d1 = Math.max(0, L0 - w.d0); w.side = w.side === 'izq' ? 'der' : w.side === 'der' ? 'izq' : w.side; DB.put('kv', walkAct, 'walk').catch(() => {}); showWalkBar(); }
  rebuildLayer(rec.id);
  const nf2 = layers.get(rec.id).feats[fi];
  drawActs(); drawWidths(); drawPK(); closeSheet();
  toast(`Sentido invertido: «${nf2.name}» empieza ahora en el antiguo final.`, 5000);
  featureSheet(nf2, L.latLng(nf2.start[0], nf2.start[1]), rec);
}

/* ---------------- Importación de ficheros ---------------- */
async function readKmlFile(file) {
  if (/\.kmz$/i.test(file.name) || file.type === 'application/vnd.google-earth.kmz') {
    const zip = await JSZip.loadAsync(file);
    const entry = zip.file('doc.kml') || zip.file(/\.kml$/i)[0];
    if (!entry) throw new Error(file.name + ': el KMZ no contiene ningún .kml.');
    return entry.async('string');
  }
  return file.text();
}
async function importFiles(files) {
  let last = null;
  for (const file of files) {
    try {
      const text = await readKmlFile(file);
      const { docName, feats } = parseKML(text);
      if (!feats.length) throw new Error(file.name + ': no contiene puntos, líneas ni polígonos.');
      const nk = [...layers.values()].filter(e => typeOf(e.rec) === 'kml').length;
      const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name: file.name.replace(/\.km[lz]$/i, '') || docName || 'Capa', text, color: PALETTE[nk % PALETTE.length], visible: true, opacity: 1, order: nextOrder(), created: Date.now() };
      await DB.put('layers', rec);
      last = registerLayer(rec);
      toast(`${rec.name}: ${plural(feats.length, 'elemento cargado', 'elementos cargados')}`);
      await relinkOrphanActs(last);
    } catch (e) { const msg = String(e.message || 'no se pudo leer'); toast(msg.startsWith(file.name) ? msg : `${file.name}: ${/zip|central directory|end of data|corrupt/i.test(msg) ? 'el fichero está dañado o no es un KMZ/ZIP válido' : msg}`, 6000); }
  }
  if (last) map.fitBounds(last.group.getBounds().pad(0.1), { maxZoom: 18 });
  drawPK();
  if (!$('#drawer').hidden) renderDrawer();
}

// Fotos con coordenadas en el EXIF → nueva capa de fotos
async function importPhotos(files) {
  const imgs = files.filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!imgs.length) return;
  toast(`Leyendo ${imgs.length} foto${imgs.length > 1 ? 's' : ''}…`, 10000);
  const rec = { id: uid(), obraId: settings.activeObra, type: 'photos', name: 'Fotos ' + new Date().toLocaleDateString('es-ES'), visible: true, order: 0, created: Date.now() };
  const added = [], noExif = [], report = [];
  for (const f of imgs) {
    let ex = null;
    try { ex = await readExif(f); } catch (e) { ex = null; }
    if (!ex || ex.lat == null) { noExif.push(f); continue; }
    let blob = await processImage(f, null, false);
    blob = await writeExif(blob, { lat: ex.lat, lng: ex.lng, alt: ex.alt, date: ex.date });
    added.push(photoNote(rec, f, blob, { lat: ex.lat, lng: ex.lng, alt: ex.alt ?? null, dir: ex.dir ?? null, src: 'exif', created: ex.date || f.lastModified || Date.now() }));
  }
  // Fotos sin GPS en los metadatos (p. ej. recibidas por WhatsApp): se intenta leer la marca de agua
  for (let i = 0; i < noExif.length; i++) {
    const f = noExif[i];
    toast(`Leyendo la marca de agua ${i + 1} de ${noExif.length}…`, 60000);
    let r = null;
    try { r = await ocrWatermark(f); } catch (e) { console.warn(e); r = { error: e.message || String(e) }; }
    if (r && r.lat != null) {
      let blob = await processImage(f, null, false);
      blob = await writeExif(blob, { lat: r.lat, lng: r.lng, alt: r.alt, date: r.date, desc: r.text });
      const n = photoNote(rec, f, blob, { lat: r.lat, lng: r.lng, alt: r.alt ?? null, acc: r.acc ?? null, src: 'marca', created: r.date || f.lastModified || Date.now(),
        text: 'Datos recuperados de la marca de agua (' + r.method + '):\n' + r.text });
      added.push(n); report.push({ name: f.name, ok: true, n, r });
    } else report.push({ name: f.name, ok: false, r });
  }
  ocrDone();
  if (added.length) {
    try {
      await DB.put('layers', rec);
      registerLayer(rec);
      for (const n of added) { await DB.put('notes', n); notes.set(n.id, n); drawNote(n); }
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      zoomToLayer(rec.id);
    } catch (e) { toast('No se pudieron guardar las fotos: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
  }
  const fromExif = added.length - report.filter(x => x.ok).length;
  if (report.length) watermarkReport(report, fromExif, rec);
  else toast(`${added.length} fotos situadas en el mapa (capa «${rec.name}»).`, 5000);
  if (!$('#drawer').hidden) renderDrawer();
}
function photoNote(rec, f, blob, o) {
  return { id: uid(), obraId: settings.activeObra, layerId: rec.id, lat: o.lat, lng: o.lng, acc: o.acc ?? null, alt: o.alt ?? null, dir: o.dir ?? null, src: o.src,
    title: f.name.replace(/\.[^.]+$/, ''), text: o.text || '', created: o.created, media: [{ id: uid(), kind: 'photo', blob, mime: blob.type || 'image/jpeg', t: Date.now() }] };
}
function watermarkReport(report, fromExif, rec) {
  $('#toast').hidden = true;
  const ok = report.filter(x => x.ok);
  const b = openSheet(`<h2>Fotos sin GPS en los metadatos</h2>
    <p class="sub">${ok.length} de ${report.length} recuperadas leyendo la marca de agua${fromExif ? ` · ${fromExif} más con GPS propio` : ''}</p>
    <div class="wmlist">${report.map((x, i) => `<div class="wm ${x.ok ? 'ok' : 'ko'}">
      <b>${esc(x.name)}</b>
      ${x.ok ? `<small>${fmtLL(x.r.lat, x.r.lng)}${x.r.date ? ' · ' + fmtDate(x.r.date) : ''}${x.r.alt != null ? ' · ' + Math.round(x.r.alt) + ' m' : ''} · ${esc(x.r.method)}</small>
        <div class="row"><button class="mini" data-see="${i}">Ver en el mapa</button><button class="mini" data-fix="${i}">Corregir posición</button></div>`
      : `<small>${x.r && x.r.error ? 'Error: ' + esc(x.r.error) : x.r && x.r.text ? 'No se han encontrado coordenadas en la marca de agua.' : 'No se ha encontrado texto.'}</small>`}
      ${x.r && x.r.text ? `<details><summary>Texto leído</summary><pre>${esc(x.r.text)}</pre></details>` : ''}
    </div>`).join('')}</div>
    ${ok.length ? `<div class="acts"><button class="btn pri full" data-a="share">${ICON.photo}Compartir las fotos con su GPS</button></div>
    <p class="hint">Cada foto se guarda ya con las coordenadas, la fecha y la altitud escritas en sus metadatos (EXIF). Compartidas como archivo (no como foto de WhatsApp) las conservan.</p>` : ''}
    ${report.length > ok.length ? '<p class="hint">Si una foto no se ha podido leer, ábrela desde «Mantén pulsado en el mapa → Foto en este punto» para situarla a mano.</p>' : ''}`);
  b.querySelectorAll('[data-see]').forEach(bt => bt.onclick = () => { const n = report[+bt.dataset.see].n; map.setView([n.lat, n.lng], 18); viewNote(n.id); });
  b.querySelectorAll('[data-fix]').forEach(bt => bt.onclick = () => { const n = report[+bt.dataset.fix].n; map.setView([n.lat, n.lng], 18); openEditor({ note: n }); });
  const sh = b.querySelector('[data-a=share]'); if (sh) sh.onclick = () => sharePhotos(ok.map(x => x.n), rec.name);
}
async function sharePhotos(list, label) {
  const items = list.flatMap(n => (n.media || []).filter(m => m.kind === 'photo').map((m, i) => ({ blob: m.blob, name: `${safeName(n.title)}${i ? '_' + (i + 1) : ''}.jpg` })));
  if (!items.length) { toast('No hay fotos que compartir.'); return; }
  try {
    if (items.length === 1) { await saveBlob(new Blob([items[0].blob], { type: 'image/jpeg' }), items[0].name); return; }
    const zip = new JSZip(); const used = new Set();
    items.forEach(it => { let nm = it.name, k = 2; while (used.has(nm)) nm = it.name.replace(/\.jpg$/, `_${k++}.jpg`); used.add(nm); zip.file(nm, it.blob); });
    await saveBlob(await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' }), `fotos_GPS_${safeName(label)}.zip`);
  } catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudieron compartir: ' + (e.message || e), 6000); }
}

/* ---------------- Lectura de la marca de agua (OCR) ---------------- */
let ocrWorker = null, ocrIdle = null;
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el lector de texto')); document.head.appendChild(s); });
}
async function getOcr() {
  clearTimeout(ocrIdle);
  if (ocrWorker) return ocrWorker;
  if (!window.Tesseract) await loadScript('vendor/tesseract/tesseract.min.js');
  const abs = p => new URL(p, location.href).href;
  ocrWorker = await Tesseract.createWorker('eng', 1, { workerPath: abs('vendor/tesseract/worker.min.js'), corePath: abs('vendor/tesseract/core'), langPath: abs('vendor/tesseract/lang'), gzip: true, cacheMethod: 'none' });
  await ocrWorker.setParameters({ preserve_interword_spaces: '1' });
  return ocrWorker;
}
function ocrDone() { clearTimeout(ocrIdle); ocrIdle = setTimeout(() => { if (ocrWorker) { ocrWorker.terminate(); ocrWorker = null; } }, 60000); }
function ocrCanvas(bmp, rx, ry, rw, rh, invert, mask) {
  const sx = Math.round(bmp.width * rx), sy = Math.round(bmp.height * ry), sw = Math.round(bmp.width * rw), sh = Math.round(bmp.height * rh);
  const scale = Math.min(2.5, Math.max(1, 1800 / sw));
  const c = document.createElement('canvas'); c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
  const g = c.getContext('2d'); g.drawImage(bmp, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (mask) { // solo el texto claro (marca blanca o amarilla con borde oscuro): texto negro sobre fondo blanco
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      v = (mx > 205 && (mx - mn < 60 || (d[i] > 200 && d[i + 1] > 200))) ? 0 : 255;
    } else { v = Math.max(0, Math.min(255, (v - 128) * 1.5 + 128)); if (invert) v = 255 - v; }
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  g.putImageData(im, 0, 0);
  return c;
}
async function ocrWatermark(file) {
  const w = await getOcr();
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const passes = [[0, 0.55, 1, 0.45, false], [0, 0.55, 1, 0.45, false, true], [0, 0.55, 1, 0.45, true], [0, 0, 1, 0.3, false], [0, 0, 1, 0.3, false, true], [0, 0, 1, 1, false]];
  let all = '';
  for (const [x, y, ww, hh, inv, mask] of passes) {
    const { data } = await w.recognize(ocrCanvas(bmp, x, y, ww, hh, inv, mask));
    const t = (data.text || '').trim(); if (t) all += t + '\n';
    const p = parseWatermark(t);
    if (p.lat != null) { const full = parseWatermark(all); return { ...p, date: p.date || full.date, alt: p.alt ?? full.alt, text: t }; }
  }
  const p = parseWatermark(all);
  return p.lat != null ? { ...p, text: all.trim() } : { text: all.trim() };
}

// Interpreta coordenadas, fecha y altitud en el texto de una marca de agua (tolerante a errores de lectura)
const MONTHS = { ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12 };
function parseWatermark(raw) {
  const out = { lat: null, lng: null, alt: null, date: null, acc: null, method: '' };
  if (!raw) return out;
  const t = raw.replace(/[º˚°*]/g, '°').replace(/[’´′`‘]/g, "'").replace(/[”″“]/g, '"').replace(/''/g, '"').replace(/\u2212/g, '-')
    .replace(/(?<=\d)[lI|](?=\d)/g, '1').replace(/(?<=\d)[oO](?=\d)/g, '0').replace(/(?<=\d)[,.] (?=\d{4,})/g, m => m[0]); // confusiones típicas del OCR
  const num = s => parseFloat(String(s).replace(',', '.'));
  const inSpain = (la, lo) => la >= 27 && la <= 44.5 && lo >= -19 && lo <= 5;
  const okLL = (la, lo) => isFinite(la) && isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 && !(la === 0 && lo === 0);
  const set = (la, lo, m) => { if (out.lat == null && okLL(la, lo)) { out.lat = la; out.lng = lo; out.method = m; } };
  // 1) grados, minutos y segundos: 37°36'44.4"N 2°54'55.6"W
  const dms = [...t.matchAll(/(\d{1,3})\s*[°:]\s*(\d{1,2})\s*['":]\s*(\d{1,2}(?:[.,]\d+)?)\s*["':]{0,2}\s*([NSEWO])/gi)];
  if (dms.length >= 2) {
    const v = m => (num(m[1]) + num(m[2]) / 60 + num(m[3]) / 3600) * (/[SWO]/i.test(m[4]) ? -1 : 1);
    const la = dms.find(m => /[NS]/i.test(m[4])), lo = dms.find(m => /[EWO]/i.test(m[4]));
    if (la && lo) set(v(la), v(lo), 'grados, minutos y segundos');
  }
  // 2) grados y minutos decimales: 37°36.740'N
  if (out.lat == null) {
    const dm = [...t.matchAll(/(\d{1,3})\s*°\s*(\d{1,2}[.,]\d+)\s*'?\s*([NSEWO])/gi)];
    const la = dm.find(m => /[NS]/i.test(m[3])), lo = dm.find(m => /[EWO]/i.test(m[3]));
    if (la && lo) set((num(la[1]) + num(la[2]) / 60) * (/S/i.test(la[3]) ? -1 : 1), (num(lo[1]) + num(lo[2]) / 60) * (/[WO]/i.test(lo[3]) ? -1 : 1), 'grados y minutos');
  }
  // 3) grados decimales con etiqueta: Lat 37.612345 Long -2.915432
  if (out.lat == null) {
    const la = /lat(?:itud|itude)?\.?\s*[:=]?\s*([+-]?\d{1,2}[.,]\d{3,})\s*°?\s*([NS])?/i.exec(t);
    const lo = /(?:lon(?:g(?:itud|itude)?)?|lng)\.?\s*[:=]?\s*([+-]?\d{1,3}[.,]\d{3,})\s*°?\s*([EWO])?/i.exec(t);
    if (la && lo) set(num(la[1]) * (la[2] && /S/i.test(la[2]) ? -1 : 1), num(lo[1]) * (lo[2] && /[WO]/i.test(lo[2]) && num(lo[1]) > 0 ? -1 : 1), 'grados decimales');
  }
  // 4) par de grados decimales sin etiqueta: 37,613764, -2,917264  ·  37.6137N 2.9172W
  if (out.lat == null) {
    const re = /([+-]?\d{1,2}[.,]\d{4,})\s*°?\s*([NS])?[\s,;/|]+([+-]?\d{1,3}[.,]\d{4,})\s*°?\s*([EWO])?/gi;
    for (const m of t.matchAll(re)) {
      let la = num(m[1]), lo = num(m[3]);
      if (m[2] && /S/i.test(m[2])) la = -Math.abs(la);
      if (m[4] && /[WO]/i.test(m[4])) lo = -Math.abs(lo);
      if (okLL(la, lo) && (inSpain(la, lo) || m[2] || m[4])) { set(la, lo, 'grados decimales'); break; }
    }
  }
  // 5) UTM: «UTM ETRS89 H30 X 507.302 Y 4.162.826» · «X: 446862 Y: 4114708» · «30S 446862 4114708»
  if (out.lat == null) {
    const zm = /\bH\s?(2[7-9]|3[01])\b|\b(2[7-9]|3[01])\s?[STN]\b|huso\s*(2[7-9]|3[01])|zona?\s*(2[7-9]|3[01])/i.exec(t);
    const zone = zm ? +(zm[1] || zm[2] || zm[3] || zm[4]) : 30;
    const clean = s => +String(s).replace(/[.\s]/g, '').replace(',', '.');
    let xy = /X\s*[:=]?\s*(\d{3}[.\s]?\d{3}(?:[.,]\d+)?)\s*[,;]?\s*(?:m\s*)?Y\s*[:=]?\s*(\d{1}[.\s]?\d{3}[.\s]?\d{3}(?:[.,]\d+)?)/i.exec(t);
    if (!xy) xy = /\b(?:2[7-9]|3[01])\s?[STN]\s+(\d{6}(?:[.,]\d+)?)\s*(?:m\s*E)?[\s,]+(\d{7}(?:[.,]\d+)?)/i.exec(t);
    if (xy) {
      const x = clean(xy[1]), y = clean(xy[2]);
      if (x > 100000 && x < 900000 && y > 3000000 && y < 5000000) { const ll = fromUTM(zone, x, y); set(ll.lat, ll.lng, `UTM huso ${zone}`); }
    }
  }
  // fecha y hora
  let m = /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})[\s,T]+(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?\s*(AM|PM)?/i.exec(t);
  if (m) { let Y = +m[3]; if (Y < 100) Y += 2000; let H = +m[4]; if (m[7]) { if (/PM/i.test(m[7]) && H < 12) H += 12; if (/AM/i.test(m[7]) && H === 12) H = 0; } out.date = new Date(Y, +m[2] - 1, +m[1], H, +m[5], +(m[6] || 0)).getTime(); }
  else if ((m = /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[\s,T]+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/.exec(t))) out.date = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime();
  else if ((m = /(\d{1,2})\s+(?:de\s+)?([a-zA-Zé]{3})[a-zA-Zé]*\.?\s+(?:de\s+)?(\d{4})[\s,]+(\d{1,2}):(\d{2})/i.exec(t)) && MONTHS[m[2].toLowerCase()]) out.date = new Date(+m[3], MONTHS[m[2].toLowerCase()] - 1, +m[1], +m[4], +m[5]).getTime();
  else if ((m = /\b([a-zA-Z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})[\s,]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t)) && MONTHS[m[1].toLowerCase()]) { let H = +m[4]; if (m[6] && /PM/i.test(m[6]) && H < 12) H += 12; out.date = new Date(+m[3], MONTHS[m[1].toLowerCase()] - 1, +m[2], H, +m[5]).getTime(); }
  if (out.date && (out.date > Date.now() + 864e5 || out.date < Date.UTC(2000, 0, 1))) out.date = null;
  // altitud y precisión
  if ((m = /(?:alt(?:itud|itude|\.)?|elev(?:aci[oó]n|ation)?|cota|asl)\s*[:=]?\s*(-?\d{1,4}(?:[.,]\d+)?)\s*m/i.exec(t))) out.alt = num(m[1]);
  if ((m = /(?:±|\+\/-|precisi[oó]n|accuracy)\s*[:=]?\s*(\d{1,4}(?:[.,]\d+)?)\s*m/i.exec(t))) out.acc = num(m[1]);
  return out;
}
function fromUTM(zone, x, y, north = true) { // UTM (ETRS89 ≈ WGS84) → latitud/longitud
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const X = x - 500000, Y = north ? y : y - 10000000, M = Y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), T1 = Math.tan(p1) ** 2, C1 = ep2 * Math.cos(p1) ** 2;
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(p1) ** 2, 1.5), D = X / (N1 * k0);
  const lat = p1 - (N1 * Math.tan(p1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / Math.cos(p1);
  return { lat: lat * 180 / Math.PI, lng: ((zone - 1) * 6 - 180 + 3) + lon * 180 / Math.PI };
}

// Escribe GPS, fecha y descripción en los metadatos EXIF de una foto JPEG
async function writeExif(blob, m) {
  if (!window.piexif || !m || m.lat == null) return blob;
  try {
    let jpg = blob;
    if (!/jpe?g/i.test(blob.type || '')) { const bmp = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0); jpg = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); }
    const u8 = new Uint8Array(await jpg.arrayBuffer()); let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    let ex; try { ex = piexif.load(bin); } catch (e) { ex = null; }
    ex = ex || {}; ['0th', 'Exif', 'GPS', '1st'].forEach(k => { ex[k] = ex[k] || {}; }); ex.thumbnail = null; ex['1st'] = {};
    const G = piexif.GPSIFD, dms = v => piexif.GPSHelper.degToDmsRational(Math.abs(v));
    Object.assign(ex.GPS, { [G.GPSVersionID]: [2, 3, 0, 0], [G.GPSLatitudeRef]: m.lat >= 0 ? 'N' : 'S', [G.GPSLatitude]: dms(m.lat), [G.GPSLongitudeRef]: m.lng >= 0 ? 'E' : 'W', [G.GPSLongitude]: dms(m.lng), [G.GPSMapDatum]: 'WGS-84' });
    if (m.alt != null && isFinite(m.alt)) Object.assign(ex.GPS, { [G.GPSAltitudeRef]: m.alt < 0 ? 1 : 0, [G.GPSAltitude]: [Math.round(Math.abs(m.alt) * 100), 100] });
    if (m.date) { const d = new Date(m.date), p = n => String(n).padStart(2, '0'); const s2 = `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; ex.Exif[piexif.ExifIFD.DateTimeOriginal] = s2; ex['0th'][piexif.ImageIFD.DateTime] = s2; }
    if (m.desc) ex['0th'][piexif.ImageIFD.ImageDescription] = String(m.desc).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
    ex['0th'][piexif.ImageIFD.Software] = 'OBRA-GIS ' + APP_VERSION;
    const out = piexif.insert(piexif.dump(ex), bin);
    const o8 = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) o8[i] = out.charCodeAt(i);
    return new Blob([o8], { type: 'image/jpeg' });
  } catch (e) { console.warn('EXIF', e); return blob; }
}
async function handleIncoming(files) { return importAll(files); } // compartir, «Abrir con» y arrastrar: lo mismo que importar varios
// Lo que no es un paquete de obra: .zip con planos y fotos o BC3 → previo de la ficha; KML/KMZ y fotos sueltos → capas
function rutaOtros(files) {
  const previo = files.some(f => /\.(zip|bc3)$/i.test(f.name) || /zip/.test(f.type));
  if (previo) return fichaImportFiles(files);
  return handleIncomingFiles(files);
}
function handleIncomingFiles(files) {
  const k = files.filter(f => /\.km[lz]$/i.test(f.name) || /google-earth/.test(f.type));
  const p = files.filter(f => !k.includes(f) && (f.type.startsWith('image/') || /\.jpe?g$/i.test(f.name)));
  if (k.length) importFiles(k);
  if (p.length) importPhotos(p);
  if (!k.length && !p.length) toast('No hay nada que importar: se pueden abrir KML, KMZ, fotos, BC3 y .zip (obras, previos o carpetas comprimidas).', 7000);
}
function importMenu() {
  const b = openSheet(`<h2>Importar</h2><p class="sub">Elige qué quieres añadir al mapa</p>
    <div class="acts">
      <div class="row2"><button class="btn pri" data-a="many">${ICON.gallery}Varios ficheros</button><button class="btn pri" data-a="dir" ${folderPickOk() ? '' : 'hidden'}>${ICON.folder}Una carpeta</button></div>
      <p class="hint" style="margin:0">Planos, fotos, .zip y BC3 a la vez: cada cosa va a su sitio.</p>
      <button class="btn full" data-a="kml">${ICON.kml}KML o KMZ</button>
      <button class="btn full" data-a="photos">${ICON.gallery}Fotos (con GPS o con marca de agua)</button>
      <button class="btn full tech" data-a="service">${ICON.wms}Capa de un servicio (WMS)</button>
      <button class="btn full" data-a="obra">${ICON.folder}Obra completa (paquete .zip)</button>
      <button class="btn go full tech" data-a="previo">${ICON.note}Previo de camino: BC3, KMZ y fotos (ficha de inspección)</button>
      <button class="btn" data-a="drawtap">${ICON.pen}Dibujar traza</button>
      <button class="btn" data-a="drawgps">${ICON.locate}Grabar traza con GPS</button>
      <button class="btn full tech" data-a="drawpts">${ICON.pin}Crear KML de puntos (tocando el mapa o con GPS)</button>
    </div>
    <p class="hint">Las fotos se sitúan solas si la cámara guardó la ubicación. ${NATIVE ? '' : 'En Android, si llegan sin posición, elígelas desde «Archivos» y no desde la galería.'}</p>`);
  b.querySelector('[data-a=many]').onclick = () => { closeSheet(); $('#inAny').click(); };
  b.querySelector('[data-a=dir]').onclick = () => { closeSheet(); pickFolder(); };
  b.querySelector('[data-a=kml]').onclick = () => { closeSheet(); $('#inKml').click(); };
  b.querySelector('[data-a=photos]').onclick = () => { closeSheet(); $('#inPhotosImport').click(); };
  b.querySelector('[data-a=service]').onclick = serviceMenu;
  b.querySelector('[data-a=obra]').onclick = () => { closeSheet(); $('#inObra').click(); };
  b.querySelector('[data-a=previo]').onclick = fichaImportPick;
  b.querySelector('[data-a=drawtap]').onclick = () => { closeSheet(); startDrawing(false); };
  b.querySelector('[data-a=drawgps]').onclick = () => { closeSheet(); startDrawing(true); };
  b.querySelector('[data-a=drawpts]').onclick = () => { closeSheet(); startDrawing('points'); };
}
let catalogQuery = '', catalogOpen = 'energia';
function serviceMenu() {
  const q = catalogQuery.trim().toLowerCase();
  const groups = CATALOG_GROUPS.map(g => {
    const items = g.items.filter(i => !q || i.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
    if (!items.length) return '';
    const open = q || catalogOpen === g.id;
    const rows = items.map(i => {
      const k = CATALOG.findIndex(c => c.url === i.url && c.layers === i.layers);
      const added = !!serviceExists(i);
      return `<button class="crow ${added ? 'added' : ''}" data-cat="${k}" type="button"><span>${esc(i.name)}</span><small>${esc(i.cover || '')}${added ? ' · añadida' : ''}</small></button>`;
    }).join('');
    return `<div class="cgroup ${open ? 'open' : ''}">
      <button class="chead" data-grp="${g.id}" type="button">${esc(g.name)}<small>${items.length}</small></button>
      ${open ? `<div class="citems">${rows}<button class="mini" data-grpall="${g.id}" type="button">Añadir todas las de este grupo</button></div>` : ''}
    </div>`;
  }).join('');
  const b = openSheet(`<h2>Capas de servicios públicos</h2>
    <p class="sub">Servicios afectados y condicionantes a revisar antes de la obra</p>
    <div class="acts"><button class="btn go full" data-a="kit">${ICON.layers}Añadir kit de afecciones de obra</button></div>
    <div class="field"><input type="text" id="catQ" placeholder="Buscar capa (p. ej. gas, carretera, inundable)" value="${esc(catalogQuery)}"></div>
    <div class="catalog">${groups || '<p class="empty">Ninguna capa coincide con la búsqueda.</p>'}</div>
    <h3 class="sh">Otro servicio WMS</h3>
    <div class="field"><input type="text" id="wName" placeholder="Nombre (p. ej. Planeamiento urbanístico)"></div>
    <div class="field"><input type="text" id="wUrl" placeholder="URL del servicio (https://…)" inputmode="url"></div>
    <div class="field"><input type="text" id="wLayers" placeholder="Nombre de la capa o capas, separadas por comas"></div>
    <div class="acts"><button class="btn pri full" data-a="add">Añadir servicio</button></div>
    <p class="hint">Las redes de distribución (baja y media tensión, gas canalizado, telecomunicaciones, abastecimiento y saneamiento municipal) no son públicas: hay que pedírselas a cada compañía antes de excavar.</p>`);
  const qi = $('#catQ');
  qi.oninput = () => { catalogQuery = qi.value; const pos = qi.selectionStart; serviceMenu(); const n = $('#catQ'); n.focus(); n.setSelectionRange(pos, pos); };
  b.querySelector('[data-a=kit]').onclick = () => addServices(CATALOG.filter(c => AFECCIONES_KIT.includes(c.name)), 'kit de afecciones').then(serviceMenu);
  b.querySelectorAll('[data-grp]').forEach(bt => bt.onclick = () => { catalogOpen = catalogOpen === bt.dataset.grp ? '' : bt.dataset.grp; serviceMenu(); });
  b.querySelectorAll('[data-grpall]').forEach(bt => bt.onclick = () => { const g = CATALOG_GROUPS.find(x => x.id === bt.dataset.grpall); addServices(g.items, g.name).then(serviceMenu); });
  b.querySelectorAll('[data-cat]').forEach(bt => bt.onclick = async () => { await addService(CATALOG[+bt.dataset.cat]); serviceMenu(); });
  b.querySelector('[data-a=add]').onclick = () => {
    const url = $('#wUrl').value.trim().split('?')[0], lay = $('#wLayers').value.trim();
    if (!/^https:\/\//i.test(url) || !lay) { toast('Escribe la URL (https://…) y el nombre de la capa.'); return; }
    addService({ name: $('#wName').value.trim() || lay, kind: 'wms', url, layers: lay, info: 'html' }).then(() => closeSheet());
  };
}
const serviceExists = def => [...layers.values()].find(e => e.rec.url === def.url && (e.rec.layers || '') === (def.layers || ''));
async function addService(def, quiet = false) {
  const dup = serviceExists(def);
  if (dup) { if (!quiet) toast(`«${dup.rec.name}» ya está en tus capas.`); return false; }
  const rec = { id: uid(), obraId: settings.activeObra, type: 'wms', kind: def.kind, name: def.name, url: def.url, layers: def.layers || '', maxNative: def.maxNative, info: def.info || '', cover: def.cover || '',
    attribution: def.attribution || '', visible: true, opacity: def.opacity ?? 1, order: nextOrder(), created: Date.now() };
  await DB.put('layers', rec);
  registerLayer(rec);
  if (!quiet) toast(`Capa «${rec.name}» añadida. Mantén pulsado un punto del mapa para ver sus datos.`, 5000);
  return true;
}
async function addServices(defs, label) {
  let n = 0;
  for (const d of defs) if (await addService(d, true)) n++;
  toast(n ? `${plural(n, 'capa añadida', 'capas añadidas')}${label ? ' (' + label + ')' : ''}. Mantén pulsado un punto para consultar las afecciones.` : 'Esas capas ya estaban añadidas.', 6000);
  if (!$('#drawer').hidden) renderDrawer();
}

/* ---------------- Pulsación larga en el mapa ---------------- */
let longFired = 0;
(function longPress() {
  const el = map.getContainer(); let t = null, start = null;
  const clear = () => { if (t) { clearTimeout(t); t = null; } };
  el.addEventListener('touchstart', e => {
    clear();
    if (e.touches.length !== 1 || e.target.closest('.leaflet-control')) return;
    const p = e.touches[0]; start = { x: p.clientX, y: p.clientY };
    t = setTimeout(() => {
      t = null; longFired = Date.now();
      if (navigator.vibrate) navigator.vibrate(30);
      pointMenu(map.mouseEventToLatLng({ clientX: start.x, clientY: start.y }));
    }, 550);
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (!t) return; const p = e.touches[0];
    if (e.touches.length > 1 || Math.hypot(p.clientX - start.x, p.clientY - start.y) > 10) clear();
  }, { passive: true });
  ['touchend', 'touchcancel'].forEach(ev => el.addEventListener(ev, clear, { passive: true }));
  map.on('contextmenu', e => { if (Date.now() - longFired < 1200) return; pointMenu(e.latlng); });
})();

function pointMenu(ll) {
  if (geomEdit) return geomEditTap(ll);
  if (drawing && !drawing.gps) return addDrawPt(L.latLng(ll)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(ll);
  if (measure) return addMeasurePt(ll);
  const queryable = orderedLayers().filter(e => e.rec.visible && e.tile && e.rec.kind === 'wms' && e.rec.info);
  const b = openSheet(`<h2>Punto seleccionado</h2><p class="sub">${matchMedia('(pointer:fine)').matches ? 'Clic derecho' : 'Pulsación larga'}${distFromMe(ll.lat, ll.lng)}</p>
    ${coordsBlock(ll.lat, ll.lng)}
    <div class="acts">
      ${goBtn(ll.lat, ll.lng, 'Llévame aquí', 'full')}
      <button class="btn" data-a="note">${ICON.note}Añadir anotación</button>
      <button class="btn" data-a="photo">${ICON.photo}Foto en este punto</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button>
      <button class="btn" data-a="measure">${ICON.ruler}Medir desde aquí</button>
      <button class="btn full" data-a="actnear">${ICON.road}Actuación en la traza más cercana</button>
      <button class="btn" data-a="resadd">${ICON.pin}Añadir recurso aquí</button>
      <button class="btn" data-a="route">${ICON.road}Distancia por carretera</button>
      <a class="btn full" href="${viewUrl(ll.lat, ll.lng)}" target="_blank" rel="noopener">Ver en Google Maps</a>
    </div>
    ${queryable.length ? `<div class="afec"><h3 class="sh">Afecciones en este punto</h3><div id="afecList"><p class="hint">Consultando ${queryable.length} capas…</p></div></div>` : ''}`);
  const cross = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="cross"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }), interactive: false }).addTo(map);
  onSheetClose(() => map.removeLayer(cross));
  b.querySelector('[data-a=note]').onclick = () => openEditor({ lat: ll.lat, lng: ll.lng, src: 'mapa' });
  b.querySelector('[data-a=photo]').onclick = () => { const at = { lat: ll.lat, lng: ll.lng, src: 'mapa' }; capture('inPhoto', files => { openEditor(at); addMedia(files); }, { kind: 'at', at }); };
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${fmtLL(ll.lat, ll.lng)}\n${fmtUTM(ll.lat, ll.lng)}`);
  b.querySelector('[data-a=measure]').onclick = () => { closeSheet(); startMeasure(ll); };
  b.querySelector('[data-a=resadd]').onclick = () => resourceEditor({ lat: ll.lat, lng: ll.lng });
  b.querySelector('[data-a=route]').onclick = () => { calcState.b = { lat: ll.lat, lng: ll.lng, label: 'punto elegido' }; calcSheet('route'); };
  b.querySelector('[data-a=actnear]').onclick = () => {
    const n = nearestTrace(ll); if (!n) { toast('No hay ninguna traza KML visible. Importa o muestra el KML del camino.'); return; }
    if (n.off > 100) toast(`La traza más cercana («${n.f.name}») está a ${Math.round(n.off)} m.`, 5000);
    openActEditor({ rec: n.rec, f: n.f, d0: n.d, d1: n.d });
  };
  if (queryable.length) queryAfecciones(ll, queryable);
}

/* ---------------- Consulta de datos de las capas WMS (GetFeatureInfo) ---------------- */
function featureInfoUrl(rec, ll, fmt) {
  const z = map.getZoom(), size = 101, res = 40075016.686 / (256 * 2 ** z) * 1.5; // tolerancia de unos 75 px de pantalla
  const p = L.CRS.EPSG3857.project(L.latLng(ll)), half = size / 2 * res;
  const bbox = [p.x - half, p.y - half, p.x + half, p.y + half].map(v => v.toFixed(2)).join(',');
  const lay = encodeURIComponent(rec.layers);
  return `${rec.url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${lay}&QUERY_LAYERS=${lay}&STYLES=&SRS=EPSG:3857&BBOX=${bbox}`
    + `&WIDTH=${size}&HEIGHT=${size}&X=${Math.floor(size / 2)}&Y=${Math.floor(size / 2)}&FEATURE_COUNT=5&FORMAT=image/png&INFO_FORMAT=${encodeURIComponent(fmt)}`;
}
async function httpGetText(url, headers) {
  const H = Plug('CapacitorHttp');
  if (NATIVE && H) { const r = await H.get({ url, headers: headers || {}, responseType: 'text', connectTimeout: 12000, readTimeout: 12000 }); if (r.status >= 400) throw new Error('HTTP ' + r.status); return typeof r.data === 'string' ? r.data : JSON.stringify(r.data); }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.text(); }
  finally { clearTimeout(t); }
}
const HIDE_KEYS = /^(fid|gid|objectid|shape|geom|the_geom|bbox|id_?$)/i;
function parseInfo(text, fmt) {
  if (fmt === 'json') {
    const j = JSON.parse(text);
    return (j.features || []).map(f => Object.entries(f.properties || {}).filter(([k, v]) => v !== null && v !== '' && !HIDE_KEYS.test(k) && typeof v !== 'object'));
  }
  const d = new DOMParser().parseFromString(text, 'text/html');
  d.querySelectorAll('script,style').forEach(n => n.remove());
  const trs = [...d.querySelectorAll('tr')].filter(tr => tr.children.length >= 2 && [...tr.children].some(td => td.textContent.trim()));
  const rows = trs.map(tr => [...tr.children].map(td => td.textContent.trim()));
  if (rows.length) {
    // tablas con cabecera en la primera fila (más de 2 columnas o celdas <th>) → un elemento por fila
    const thHead = [...trs[0].children].every(c => c.tagName === 'TH');
    if ((rows[0].length > 2 || thHead) && rows.length >= 2) return rows.slice(1).map(r => rows[0].map((h, i) => [h, r[i] || '']).filter(([k, v]) => v && !HIDE_KEYS.test(k)));
    return [rows.map(r => [r[0], r.slice(1).join(' ')]).filter(([k, v]) => v)];
  }
  const txt = (d.body.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  if (!txt || /no (features|results|se ha encontrado)|search returned no results/i.test(txt)) return [];
  return [[['', txt.slice(0, 600)]]];
}
async function queryAfecciones(ll, list, opts = {}) {
  const out = list.map(e => ({ e, html: '', withLegend: !!opts.legend }));
  const render = () => {
    const box = $('#afecList'); if (!box) return;
    const hits = out.filter(o => o.html && o.html !== 'none' && !o.fail);
    const fails = out.filter(o => o.fail);
    const pending = out.filter(o => !o.html).length;
    let h = hits.map(o => o.html).join('');
    if (pending) h += `<p class="hint">Consultando ${pending} capas…</p>`;
    else if (!hits.length) h += '<p class="hint">Ninguna de las capas consultadas tiene elementos en este punto. Si buscas algo fino, como una línea, acerca el mapa y vuelve a pulsar.</p>';
    if (fails.length) h += `<p class="hint">Sin respuesta: ${fails.map(o => `<a href="${esc(o.link)}" target="_blank" rel="noopener">${esc(o.e.rec.name)}</a>`).join(', ')}. Pulsa una para ver sus datos en el navegador.</p>`;
    box.innerHTML = h;
  };
  await Promise.all(out.map(async o => {
    const r = o.e.rec, fmt = r.info === 'json' ? 'application/json' : 'text/html';
    const link = featureInfoUrl(r, ll, 'text/html');
    try {
      const feats = parseInfo(await httpGetText(featureInfoUrl(r, ll, fmt)), r.info);
      o.html = feats.length ? `<div class="afec-item"><b>${esc(r.name)}</b>${r.kind !== 'wmts' && o.withLegend ? `<div class="legend sm"><img src="${esc(legendUrl(r))}" alt="Leyenda de ${esc(r.name)}" onerror="this.parentNode.remove()"></div>` : ''}${feats.slice(0, 3).map(f => `<table class="attrs">${f.slice(0, 12).map(([k, v]) => `<tr>${k ? `<td>${esc(k)}</td>` : ''}<td${k ? '' : ' colspan="2"'}>${esc(String(v))}</td></tr>`).join('')}</table>`).join('')}</div>` : 'none';
    } catch (err) {
      o.html = 'fail'; o.fail = true; o.link = link;
    }
    render();
  }));
  render();
}

/* ---- Tocar el mapa con servicios (WMS) visibles: qué hay en ese punto y su leyenda ----
   Un toque corto en el mapa (no en una traza ni en un punto) consulta las capas de servicios visibles.
   Se espera un instante: si es un doble toque, solo se acerca el mapa. */
let wmsTapT = null;
const wmsQueryable = () => orderedLayers().filter(e => e.rec.visible && e.tile && e.rec.kind === 'wms' && e.rec.info);
function wmsTap(ll) {
  if (!$('#sheet').hidden || !wmsQueryable().length) return;
  clearTimeout(wmsTapT); wmsTapT = setTimeout(() => wmsInfoSheet(ll), 330);
}
map.on('dblclick zoomstart dragstart', () => clearTimeout(wmsTapT));
function wmsInfoSheet(ll) {
  const q = wmsQueryable(); if (!q.length) return;
  const b = openSheet(`<h2>Servicios en este punto</h2><p class="sub">${q.length === 1 ? esc(q[0].rec.name) : plural(q.length, 'capa consultada', 'capas consultadas')}${distFromMe(ll.lat, ll.lng)}</p>
    <div class="afec"><div id="afecList"><p class="hint">Consultando ${plural(q.length, 'capa', 'capas')}…</p></div></div>
    <div class="acts"><button class="btn" data-a="legend">${ICON.layers}Leyenda de las capas</button><button class="btn" data-a="more">Más opciones en este punto</button></div>`);
  const cross = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="cross"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }), interactive: false }).addTo(map);
  onSheetClose(() => map.removeLayer(cross));
  b.querySelector('[data-a=legend]').onclick = legendSheet;
  b.querySelector('[data-a=more]').onclick = () => pointMenu(ll);
  queryAfecciones(ll, q, { legend: true });
}
// Leyenda de todas las capas de servicios visibles (botón «Leyenda» sobre el mapa)
function legendSheet() {
  const v = orderedLayers().filter(e => e.rec.visible && e.tile && typeOf(e.rec) === 'wms');
  openSheet(`<h2>Leyenda</h2><p class="sub">Capas de servicios visibles en el mapa. Toca el mapa sobre un elemento para ver qué es.</p>
    ${v.length ? v.map(e => `<div class="legrow"><b>${esc(e.rec.name)}</b>${e.rec.kind !== 'wmts' ? `<div class="legend"><img src="${esc(legendUrl(e.rec))}" alt="Leyenda de ${esc(e.rec.name)}" onerror="this.parentNode.outerHTML='<p class=hint>Este servicio no publica leyenda.</p>'"></div>` : '<p class="hint">Mapa de fondo, sin leyenda.</p>'}<small class="hint">${esc(e.rec.attribution || '')}</small></div>`).join('') : '<p class="empty">No hay capas de servicios visibles.</p>'}`);
}
let legBtnT = null;
function updateLegendBtn() {
  clearTimeout(legBtnT); legBtnT = setTimeout(() => {
    let bt = $('#legendBtn'); const n = orderedLayers().filter(e => e.rec.visible && e.tile && typeOf(e.rec) === 'wms' && e.rec.kind !== 'wmts').length;
    if (!bt) { if (!n) return; bt = document.createElement('button'); bt.id = 'legendBtn'; bt.type = 'button'; bt.className = 'legbtn'; bt.onclick = legendSheet; document.body.appendChild(bt); }
    bt.hidden = !n; bt.innerHTML = `${ICON.layers}Leyenda${n > 1 ? ` (${n})` : ''}`; }, 200);
}
map.on('layeradd layerremove', updateLegendBtn);
