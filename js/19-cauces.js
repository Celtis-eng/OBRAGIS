'use strict';
/* OBRA-GIS · Cauces: cruces con las trazas, zona de servidumbre y de policía, y vaguadas del terreno.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global).
   · Con las capas KML de cauces (las del IGN o la Junta pasadas a KML, o cualquier KML de líneas) se calcula,
     para cada traza, dónde la cruza un cauce y qué tramos van a menos de 5 m (servidumbre) y de 100 m (policía).
   · Vaguadas: en el perfil del terreno (MDT05 del IGN) de cada traza se buscan los puntos bajos, que son cruces de
     vaguada aunque el cauce no esté en ningún mapa; si el MITECO responde, se añade la superficie de cuenca que drena ahí.
   Todo es orientativo: la delimitación del dominio público hidráulico la hace el organismo de cuenca. */
const cauceLayer = L.layerGroup().addTo(map);
const CAUCE_RE = /cauce|hidro|r[ií]o|arroyo|barranco|rambla|dph|watercourse|cursos? de agua/i;
const SUPCUENCA_URL = 'https://wms.mapama.gob.es/sig/Agua/SupCuenca25x25/wms.aspx';
let cauceRes = null; // último análisis (para guardar como KML o exportar)
// proyección local en metros (suficiente para distancias de cientos de metros)
function cProj(lat0) { const kx = Math.cos(lat0 * Math.PI / 180) * 111320, ky = 110540; return { p: (lat, lng) => [lng * kx, lat * ky], u: (x, y) => [y / ky, x / kx] }; }
function segDist(px, py, ax, ay, bx, by) { const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy; const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)) : 0; return Math.hypot(px - ax - t * vx, py - ay - t * vy); }
function segCross(a, b, c, d) { // punto de corte de dos segmentos (o null)
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + t * r[0], a[1] + t * r[1]] : null;
}
const isCauceLayer = e => typeOf(e.rec) === 'kml' && (CAUCE_RE.test(e.rec.name) || CAUCE_RE.test(e.rec.folder || '') && /En KML/.test(e.rec.folder || ''));
const lineLayers = () => [...layers.values()].filter(e => typeOf(e.rec) === 'kml' && e.feats && e.feats.some(f => f.type === 'ln'));
// Índice en rejilla de los segmentos de los cauces (para no medir contra todos)
function cauceIndex(cauceEnts, P, cell) {
  const grid = new Map(), segs = [];
  cauceEnts.forEach(e => e.feats.forEach(f => f.parts.filter(p => p.t === 'ln' || p.t === 'pg').forEach(p => {
    const pts = p.c.map(c => P.p(c[0], c[1]));
    for (let i = 1; i < pts.length; i++) {
      const s = { a: pts[i - 1], b: pts[i], name: f.name, layer: e.rec.name }; segs.push(s);
      const x0 = Math.floor(Math.min(s.a[0], s.b[0]) / cell), x1 = Math.floor(Math.max(s.a[0], s.b[0]) / cell), y0 = Math.floor(Math.min(s.a[1], s.b[1]) / cell), y1 = Math.floor(Math.max(s.a[1], s.b[1]) / cell);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const k = x + ':' + y; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(s); }
    }
  })));
  return { segs, near(x, y) { const cx = Math.floor(x / cell), cy = Math.floor(y / cell), out = new Set(); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) (grid.get((cx + i) + ':' + (cy + j)) || []).forEach(s => out.add(s)); return out; } };
}
// Cruces y tramos a menos de «servidumbre» y «policía» metros de un cauce, para una traza
function analyseTrace(f, idx, P, dServ, dPol) {
  const cruces = [], step = 2, samples = [];
  lineParts(f).forEach(part => { const pts = part.c.map(c => P.p(c[0], c[1]));
    for (let i = 1; i < pts.length; i++) { const cand = new Set([...idx.near(pts[i - 1][0], pts[i - 1][1]), ...idx.near(pts[i][0], pts[i][1])]);
      cand.forEach(s => { const x = segCross(pts[i - 1], pts[i], s.a, s.b); if (x) { const ll = P.u(x[0], x[1]); cruces.push({ d: pkAt(f, L.latLng(ll[0], ll[1])).d, ll, name: s.name, layer: s.layer }); } }); } });
  for (let d = 0; d <= f.length; d += step) { const q = pointAtPK(f, d), [x, y] = P.p(q.lat, q.lng); let m = Infinity; idx.near(x, y).forEach(s => { m = Math.min(m, segDist(x, y, s.a[0], s.a[1], s.b[0], s.b[1])); }); samples.push({ d, m }); }
  const runs = lim => { const out = []; let cur = null; samples.forEach(s => { if (s.m <= lim) { if (!cur) cur = { a: s.d, b: s.d }; cur.b = s.d; } else if (cur) { out.push(cur); cur = null; } }); if (cur) out.push(cur); return out.map(r => ({ a: r.a, b: Math.min(f.length, r.b + (r.b < f.length ? step / 2 : 0)) })); };
  const uniq = []; cruces.sort((a, b) => a.d - b.d).forEach(c => { if (!uniq.some(u => Math.abs(u.d - c.d) < 3 && u.name === c.name)) uniq.push(c); });
  return { cruces: uniq, serv: runs(dServ), pol: runs(dPol) };
}
const runLen = rs => rs.reduce((t, r) => t + r.b - r.a, 0);
function cauceSheet() {
  const all = lineLayers(), cau = all.filter(isCauceLayer), trz = all.filter(e => !isCauceLayer(e));
  const ob = typeof obraBounds === 'function' ? obraBounds(600) : null;
  const b = openSheet(`<h2>Cauces y zona de policía</h2><p class="sub">Cruces de cauces con las trazas, zona de servidumbre y de policía, y vaguadas del terreno</p>
    <h3 class="sh">1 · Capas de cauces</h3>
    ${all.length ? `<div class="chks">${all.map(e => `<label class="opt"><input type="checkbox" data-cau="${e.rec.id}" ${cau.includes(e) ? 'checked' : ''}>${esc(e.rec.name)}</label>`).join('')}</div>` : ''}
    <div class="acts"><button class="btn full" data-a="ign" ${ob ? '' : 'disabled'}>${ICON.download || ''}Traer los cauces del IGN (1:25.000) del entorno de las trazas</button></div>
    <p class="hint">También puedes usar la red 1:10.000 de la Junta o el DPH: añádelos desde Servicios y pásalos a KML. Las capas marcadas se toman como cauces; las demás, como trazas.</p>
    <h3 class="sh">2 · Distancias</h3>
    <div class="pkrow"><div class="field"><label for="cServ">Servidumbre (m)</label><input type="text" id="cServ" inputmode="decimal" value="5"></div><div class="field"><label for="cPol">Policía (m)</label><input type="text" id="cPol" inputmode="decimal" value="100"></div></div>
    <div class="acts"><button class="btn pri full" data-a="run">Analizar cruces y zona de policía</button>
      <button class="btn full" data-a="vag">Buscar vaguadas en el terreno (barrancos sin cartografiar)</button></div>
    <div id="cauRes"></div>
    <p class="hint">Resultado orientativo: el dominio público hidráulico y sus zonas los delimita el organismo de cuenca. Las vaguadas se detectan en el perfil del terreno (MDT05 del IGN).</p>`);
  const chosen = () => { const ids = [...b.querySelectorAll('[data-cau]')].filter(x => x.checked).map(x => x.dataset.cau); return { cau: all.filter(e => ids.includes(e.rec.id)), trz: all.filter(e => !ids.includes(e.rec.id)) }; };
  b.querySelector('[data-a=ign]').onclick = async () => {
    const res = $('#cauRes'); res.innerHTML = '<p class="hint">Descargando los cauces del IGN…</p>';
    const def = CATALOG.find(c => /Cauces 1:25\.000/.test(c.name));
    try { const feats = await wfsFeatures({ ...def, type: 'wms', id: 'ign-cauces' }, ob);
      if (!feats.length) { res.innerHTML = '<p class="hint">El IGN no tiene cauces en el entorno de las trazas.</p>'; return; }
      const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name: 'Cauces IGN 1:25.000 (datos)', text: featsToKML('Cauces IGN 1:25.000', feats, '#1c7ed6'), color: '#1c7ed6', visible: true, opacity: 1, order: nextOrder(), created: Date.now(), folder: 'Servicios y afecciones/En KML' };
      await DB.put('layers', rec); registerLayer(rec); drawPK(); toast(`${plural(feats.length, 'cauce traído', 'cauces traídos')} del IGN.`, 5000); cauceSheet();
    } catch (e) { res.innerHTML = `<p class="hint">No se pudieron traer los cauces del IGN (${esc(e.message || String(e))}). Prueba con la capa de la Junta o el DPH desde Servicios → KML.</p>`; }
  };
  b.querySelector('[data-a=run]').onclick = () => {
    const { cau, trz } = chosen(), res = $('#cauRes');
    if (!cau.length) { res.innerHTML = '<p class="fwarn">Marca al menos una capa de cauces (o tráelos del IGN).</p>'; return; }
    if (!trz.length) { res.innerHTML = '<p class="fwarn">No queda ninguna traza sin marcar como cauce.</p>'; return; }
    const dServ = parseNum($('#cServ').value) || 5, dPol = parseNum($('#cPol').value) || 100;
    const lat0 = trz[0].feats.find(f => f.type === 'ln').start[0], P = cProj(lat0), idx = cauceIndex(cau, P, Math.max(dPol, 50));
    const out = []; trz.forEach(e => e.feats.forEach((f, fi) => { if (f.type !== 'ln') return; out.push({ e, f, fi, ...analyseTrace(f, idx, P, dServ, dPol) }); }));
    cauceRes = { out, dServ, dPol, vag: cauceRes && cauceRes.vag }; cauceDraw(); res.innerHTML = cauceHtml(); cauceButtons(res);
  };
  b.querySelector('[data-a=vag]').onclick = () => vaguadas(chosen());
  if (cauceRes) { $('#cauRes').innerHTML = cauceHtml(); cauceButtons($('#cauRes')); }
}
function cauceHtml() {
  if (!cauceRes) return '';
  const { out, dServ, dPol, vag } = cauceRes; let h = '';
  if (out) {
    const nC = out.reduce((t, r) => t + r.cruces.length, 0), lP = out.reduce((t, r) => t + runLen(r.pol), 0);
    h += `<div class="slope-main"><span>${plural(nC, 'cruce', 'cruces')}</span><small>${fmtLen(lP)} de traza en zona de policía (${dPol} m)</small></div>`;
    h += out.filter(r => r.cruces.length || r.pol.length).map(r => `<div class="legrow"><b>${esc(r.f.name)}</b> <small class="hint">${esc(r.e.rec.name)}</small>
      ${r.cruces.length ? `<table class="attrs"><tr><th>Cruce en PK</th><th>Cauce</th></tr>${r.cruces.map(c => `<tr><td>${fmtPK(c.d)}</td><td>${esc(c.name)}</td></tr>`).join('')}</table>` : ''}
      ${r.pol.length ? `<p>Zona de policía: ${r.pol.map(x => `${fmtPK(x.a)}–${fmtPK(x.b)}`).join(', ')} · <b>${fmtLen(runLen(r.pol))}</b></p>` : ''}
      ${r.serv.length ? `<p>Servidumbre (${dServ} m): ${r.serv.map(x => `${fmtPK(x.a)}–${fmtPK(x.b)}`).join(', ')} · <b>${fmtLen(runLen(r.serv))}</b></p>` : ''}</div>`).join('') || '<p class="hint">Ninguna traza cruza ni se acerca a los cauces marcados.</p>';
  }
  if (vag) {
    h += `<h3 class="sh">Vaguadas en el terreno</h3>` + (vag.length ? `<table class="attrs"><tr><th>PK</th><th>Traza</th><th>Hondo</th><th>Cuenca</th><th>¿En mapa?</th></tr>${vag.map(v => `<tr><td>${fmtPK(v.d)}</td><td>${esc(v.f.name)}</td><td>${nf(v.depth, 1)} m</td><td>${v.cuenca != null ? (v.cuenca >= 0.01 ? nf(v.cuenca, 2) + ' km²' : '< 0,01 km²') : '—'}</td><td>${v.mapped ? 'sí' : '<b>no</b>'}</td></tr>`).join('')}</table>
      <p class="hint">«No» = no hay ningún cauce de las capas marcadas a menos de 30 m: revísalo en campo. «Hondo» es lo que baja el terreno respecto a los lados (±60 m).${vag.some(v => v.cuenca != null) ? ' Cuenca: superficie que drena a ese punto según el MITECO (malla de 25 m).' : ''}</p>` : '<p class="hint">No se han encontrado vaguadas marcadas en el perfil de las trazas.</p>');
  }
  if (h) h += `<div class="acts"><button class="btn" data-a="kml">Guardar como capa KML</button><button class="btn" data-a="csv">Tabla (CSV)</button><button class="btn" data-a="clr">Quitar del mapa</button></div>`;
  return h;
}
function cauceButtons(box) {
  const k = box.querySelector('[data-a=kml]'); if (k) k.onclick = cauceToKml;
  const c = box.querySelector('[data-a=csv]'); if (c) c.onclick = cauceCsv;
  const x = box.querySelector('[data-a=clr]'); if (x) x.onclick = () => { cauceLayer.clearLayers(); toast('Quitado del mapa.'); };
}
function cauceDraw() {
  cauceLayer.clearLayers(); if (!cauceRes) return;
  (cauceRes.out || []).forEach(r => {
    r.pol.forEach(x => { const c = segmentCoords(r.f, x.a, x.b); if (c.length > 1) L.polyline(c, { color: '#f08c00', weight: 9, opacity: .55, interactive: false }).addTo(cauceLayer); });
    r.serv.forEach(x => { const c = segmentCoords(r.f, x.a, x.b); if (c.length > 1) L.polyline(c, { color: '#e03131', weight: 9, opacity: .7, interactive: false }).addTo(cauceLayer); });
    r.cruces.forEach(c => L.circleMarker(c.ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#1c7ed6', fillOpacity: 1 }).bindTooltip(`Cruce: ${c.name} · PK ${fmtPK(c.d)}`).addTo(cauceLayer));
  });
  (cauceRes.vag || []).forEach(v => L.marker([v.q.lat, v.q.lng], { icon: L.divIcon({ className: '', html: `<div class="vagmk ${v.mapped ? '' : 'nomap'}">▼</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }) })
    .bindTooltip(`Vaguada · PK ${fmtPK(v.d)} · ${v.f.name}${v.cuenca != null ? ` · cuenca ${nf(v.cuenca, 2)} km²` : ''}${v.mapped ? '' : ' · no está en los mapas de cauces'}`).addTo(cauceLayer));
}
// Vaguadas: puntos bajos del perfil (más bajos que todo lo que hay a ±25 m y con subida de al menos 0,5 m a ambos lados en ±60 m)
async function vaguadas({ cau, trz }) {
  const res = $('#cauRes'); if (!trz.length) { res.innerHTML = '<p class="fwarn">No hay trazas.</p>'; return; }
  const list = [], feats = []; trz.forEach(e => e.feats.forEach(f => { if (f.type === 'ln') feats.push({ e, f }); }));
  const lat0 = feats[0].f.start[0], P = cProj(lat0), idx = cau.length ? cauceIndex(cau, P, 50) : null;
  for (let k = 0; k < feats.length; k++) {
    const { f } = feats[k]; res.innerHTML = `<p class="hint">Leyendo el terreno de «${esc(f.name)}» (${k + 1} de ${feats.length})…</p>`;
    const step = Math.max(5, f.length / 2500), ds = []; for (let d = 0; d < f.length; d += step) ds.push(d); ds.push(f.length);
    let z; try { z = (await profileElevations(f, ds.map(d => pointAtPK(f, d)), 'dem')).z; } catch (e) { continue; }
    const prof = ds.map((d, i) => ({ d, z: z[i] })).filter(p => p.z != null && isFinite(p.z)); if (prof.length < 5) continue;
    const sm = prof.map((p, i) => ({ d: p.d, z: (prof[Math.max(0, i - 1)].z + p.z + prof[Math.min(prof.length - 1, i + 1)].z) / 3 }));
    const win = (i, r) => sm.filter(p => Math.abs(p.d - sm[i].d) <= r);
    for (let i = 1; i < sm.length - 1; i++) {
      const p = sm[i]; if (win(i, 25).some(q => q.z < p.z)) continue;
      const left = sm.filter(q => q.d < p.d && p.d - q.d <= 60), right = sm.filter(q => q.d > p.d && q.d - p.d <= 60);
      if (!left.length || !right.length) continue;
      const depth = Math.min(Math.max(...left.map(q => q.z)), Math.max(...right.map(q => q.z))) - p.z; if (depth < 0.5) continue;
      if (list.some(v => v.f === f && Math.abs(v.d - p.d) < 40)) continue;
      const q = pointAtPK(f, p.d), [x, y] = P.p(q.lat, q.lng); let m = Infinity; if (idx) idx.near(x, y).forEach(s => { m = Math.min(m, segDist(x, y, s.a[0], s.a[1], s.b[0], s.b[1])); });
      list.push({ f, d: p.d, q, depth, mapped: m <= 30, cuenca: null });
    }
  }
  res.innerHTML = `<p class="hint">${plural(list.length, 'vaguada encontrada', 'vaguadas encontradas')}. Consultando la superficie de cuenca (MITECO)…</p>`;
  await cuencaVertiente(list.slice(0, 60));
  cauceRes = { ...(cauceRes || {}), vag: list }; cauceDraw(); res.innerHTML = cauceHtml(); cauceButtons(res);
}
// Superficie de cuenca vertiente a un punto (servicio del MITECO, malla de 25 m). Si no responde, se deja sin dato.
let supLayer = null;
async function cuencaVertiente(list) {
  if (!list.length) return;
  try {
    if (!supLayer) { const caps = new DOMParser().parseFromString(await httpGetText(`${SUPCUENCA_URL}?SERVICE=WMS&REQUEST=GetCapabilities`), 'application/xml');
      const names = byTag(caps, 'Layer').filter(l => l.getAttribute('queryable') === '1').map(l => { const n = [...l.children].find(c => c.localName === 'Name'); return n ? n.textContent.trim() : ''; }).filter(Boolean);
      supLayer = names[names.length - 1] || null; }
    if (!supLayer) return;
    const rec = { url: SUPCUENCA_URL, layers: supLayer };
    await Promise.all(list.map(async v => { try {
      const rows = parseInfo(await httpGetText(featureInfoUrl(rec, L.latLng(v.q.lat, v.q.lng), 'text/html')), 'html').flat();
      const num = rows.map(([k, val]) => ({ k: String(k), n: parseNum(String(val).replace(/[^\d.,-]/g, '')) })).find(x => isFinite(x.n) && x.n >= 0);
      if (num) v.cuenca = /m2|m²|metros/i.test(num.k) ? num.n / 1e6 : /ha\b|hect/i.test(num.k) ? num.n / 100 : num.n; // km² salvo que diga otra unidad
    } catch (e) { /* sin dato */ } }));
  } catch (e) { /* el servicio no responde: sin superficie de cuenca */ }
}
async function cauceToKml() {
  if (!cauceRes) return;
  const pm = [], kc = s => s.map(c => `${(+c[1]).toFixed(7)},${(+c[0]).toFixed(7)}`).join(' ');
  (cauceRes.out || []).forEach(r => {
    r.cruces.forEach(c => pm.push(`<Placemark><name>Cruce ${kmlEsc(c.name)} PK ${fmtPK(c.d)}</name><styleUrl>#cr</styleUrl><ExtendedData><Data name="traza"><value>${kmlEsc(r.f.name)}</value></Data><Data name="pk"><value>${fmtPK(c.d)}</value></Data><Data name="cauce"><value>${kmlEsc(c.name)}</value></Data></ExtendedData><Point><coordinates>${kc([c.ll])}</coordinates></Point></Placemark>`));
    [['pol', 'Zona de policía', '#po'], ['serv', 'Zona de servidumbre', '#se']].forEach(([k, t, st]) => r[k].forEach(x => { const c = segmentCoords(r.f, x.a, x.b); if (c.length > 1) pm.push(`<Placemark><name>${t} ${fmtPK(x.a)}–${fmtPK(x.b)}</name><styleUrl>${st}</styleUrl><ExtendedData><Data name="traza"><value>${kmlEsc(r.f.name)}</value></Data><Data name="longitud_m"><value>${Math.round(x.b - x.a)}</value></Data></ExtendedData><LineString><coordinates>${kc(c)}</coordinates></LineString></Placemark>`); }));
  });
  (cauceRes.vag || []).forEach(v => pm.push(`<Placemark><name>Vaguada PK ${fmtPK(v.d)}${v.mapped ? '' : ' (sin cartografiar)'}</name><styleUrl>#va</styleUrl><ExtendedData><Data name="traza"><value>${kmlEsc(v.f.name)}</value></Data><Data name="hondo_m"><value>${v.depth.toFixed(1)}</value></Data>${v.cuenca != null ? `<Data name="cuenca_km2"><value>${v.cuenca.toFixed(3)}</value></Data>` : ''}<Data name="en_mapa"><value>${v.mapped ? 'sí' : 'no'}</value></Data></ExtendedData><Point><coordinates>${kc([[v.q.lat, v.q.lng]])}</coordinates></Point></Placemark>`));
  if (!pm.length) { toast('No hay resultados que guardar.'); return; }
  const text = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Cauces y zona de policía</name><Style id="cr"><IconStyle><color>ffd67e1c</color></IconStyle></Style><Style id="po"><LineStyle><color>c8008cf0</color><width>6</width></LineStyle></Style><Style id="se"><LineStyle><color>ff3131e0</color><width>6</width></LineStyle></Style><Style id="va"><IconStyle><color>ffd67e1c</color></IconStyle></Style>\n${pm.join('\n')}\n</Document></kml>`;
  const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name: 'Cauces y zona de policía (resultado)', text, color: '#f08c00', visible: true, opacity: 1, order: nextOrder(), created: Date.now(), folder: 'Servicios y afecciones' };
  await DB.put('layers', rec); registerLayer(rec); cauceLayer.clearLayers(); toast('Guardado como capa KML en «Servicios y afecciones».', 5000);
}
function cauceCsv() {
  if (!cauceRes) return; const rows = [['tipo', 'traza', 'pk_desde', 'pk_hasta', 'longitud_m', 'cauce', 'hondo_m', 'cuenca_km2', 'en_mapa']];
  (cauceRes.out || []).forEach(r => { r.cruces.forEach(c => rows.push(['cruce', r.f.name, fmtPK(c.d), '', '', c.name, '', '', ''])); r.pol.forEach(x => rows.push(['zona de policía', r.f.name, fmtPK(x.a), fmtPK(x.b), Math.round(x.b - x.a), '', '', '', ''])); r.serv.forEach(x => rows.push(['zona de servidumbre', r.f.name, fmtPK(x.a), fmtPK(x.b), Math.round(x.b - x.a), '', '', '', ''])); });
  (cauceRes.vag || []).forEach(v => rows.push(['vaguada', v.f.name, fmtPK(v.d), '', '', '', String(v.depth.toFixed(1)).replace('.', ','), v.cuenca != null ? String(v.cuenca.toFixed(3)).replace('.', ',') : '', v.mapped ? 'sí' : 'no']));
  const csv = '﻿' + rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  saveBlob(new Blob([csv], { type: 'text/csv' }), `cauces_${safeName((obras.get(settings.activeObra) || {}).name || 'obra')}.csv`);
}
