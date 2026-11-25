'use strict';
/* OBRA-GIS · Licencia, novedades, medir, KMZ, zona sin cobertura y mapas sin conexión.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Licencia de uso ----------------
   La app consulta licencia.json publicado junto a la web (GitHub Pages). Si el autor pone "activa": false,
   la app queda bloqueada salvo para exportar las obras. Sin conexión se permite trabajar DIAS_GRACIA días
   desde la última comprobación correcta. */
const LICENSE_URL = 'https://celtis-eng.github.io/OBRAGIS/licencia.json';
const EULA_VERSION = '1';
const EULA_TEXT = `<p><b>OBRA-GIS · Licencia de uso gratuita</b></p>
<p>El autor concede una licencia personal, gratuita, no exclusiva, intransferible y revocable para usar OBRA-GIS como herramienta de apoyo en trabajos de campo.</p>
<ul><li>La app se ofrece «tal cual», sin garantía. Las mediciones, pendientes, distancias, afecciones y coordenadas son orientativas y deben comprobarse con medios topográficos y fuentes oficiales antes de tomar decisiones de proyecto u obra.</li>
<li>Los datos que introduces (obras, capas, fotos, anotaciones) se guardan en tu dispositivo. Eres responsable de sus copias de seguridad; usa «Exportar obra» con regularidad.</li>
<li>Los mapas y servicios de terceros (IGN, Junta de Andalucía, MITECO, Catastro, OpenStreetMap…) se rigen por sus propias licencias y condiciones.</li>
<li>El autor puede modificar estas condiciones, pasar la app a un modelo de pago o retirarla. En ese caso la app avisará y <b>siempre te permitirá exportar tus obras</b> antes de bloquearse.</li>
<li>No está permitido redistribuir, vender ni modificar la app sin permiso del autor.</li></ul>`;
let licState = { status: 'ok', msg: '' };
function semverLess(a, b) { const p = v => String(v || '0').split('.').map(n => parseInt(n, 10) || 0); const x = p(a), y = p(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); } return false; }
async function checkLicense() {
  const urls = location.protocol.startsWith('http') && !NATIVE && /github\.io$/.test(location.hostname) ? ['licencia.json'] : [LICENSE_URL];
  let lic = null;
  for (const u of urls) { try { lic = JSON.parse(await httpGetText(u + (u.includes('?') ? '&' : '?') + 't=' + Date.now())); break; } catch (e) { /* sin conexión */ } }
  const now = Date.now();
  if (lic) {
    settings.license = { ...lic, checked: now }; saveSettings();
    if (lic.activa === false) licState = { status: 'off', msg: lic.mensaje || 'El autor ha desactivado esta versión de OBRA-GIS.' };
    else if (lic.version_minima && semverLess(APP_VERSION, lic.version_minima)) licState = { status: 'old', msg: lic.mensaje_version || `Esta versión (${APP_VERSION}) ya no está admitida. Actualiza a la ${lic.version_minima} o posterior.` };
    else licState = { status: 'ok', msg: lic.aviso || '' };
  } else {
    const last = settings.license && settings.license.checked, days = (settings.license && settings.license.dias_sin_conexion) || 60;
    if (!last) { settings.license = { checked: now, firstOffline: true }; saveSettings(); licState = { status: 'ok', msg: '' }; }
    else if (now - last > days * 864e5) licState = { status: 'expired', msg: `La licencia no se ha podido comprobar en ${days} días. Conéctate a internet y pulsa «Reintentar».` };
    else licState = { status: settings.license.activa === false ? 'off' : 'ok', msg: settings.license.mensaje || '' };
  }
  applyLicense();
  if (licState.status === 'ok' && licState.msg && settings.licNotice !== licState.msg) { settings.licNotice = licState.msg; saveSettings(); toast(licState.msg, 8000); }
}
function applyLicense() {
  let ov = $('#licBlock');
  if (licState.status === 'ok') { if (ov) ov.remove(); return; }
  if (!ov) { ov = document.createElement('div'); ov.id = 'licBlock'; ov.className = 'licblock'; document.body.appendChild(ov); }
  const url = settings.license && settings.license.url;
  ov.innerHTML = `<div class="licbox"><h2>OBRA-GIS no está disponible</h2><p>${esc(licState.msg)}</p>
    <p class="hint">Tus datos siguen en este dispositivo. Exporta tus obras para no perderlas.</p>
    <div class="acts"><button class="btn pri full" data-l="exp">Exportar mis obras</button><button class="btn" data-l="retry">Reintentar</button>${url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Más información</a>` : ''}</div></div>`;
  ov.querySelector('[data-l=exp]').onclick = async () => { for (const id of obras.keys()) { try { await exportObraPackage(id); } catch (e) { /* cancelado */ } } };
  ov.querySelector('[data-l=retry]').onclick = () => checkLicense();
}
function eulaSheet(first) {
  const b = openSheet(`<h2>Licencia de uso</h2><div class="eula">${EULA_TEXT}</div>
    <div class="acts">${first ? '<button class="btn pri full" data-a="ok">Acepto las condiciones</button>' : '<button class="btn full" data-a="ok">Cerrar</button>'}</div>`);
  b.querySelector('[data-a=ok]').onclick = () => { if (first) { settings.eulaAccepted = EULA_VERSION; settings.eulaDate = Date.now(); saveSettings(); } closeSheet(); if (first && !settings.welcomed && !layers.size) setTimeout(welcomeSheet, 100); };
  if (first) onSheetClose(() => { if (settings.eulaAccepted !== EULA_VERSION) setTimeout(() => eulaSheet(true), 50); });
}
function licenseSheet() {
  const l = settings.license || {}, st = { ok: 'Activa', off: 'Desactivada por el autor', old: 'Versión no admitida', expired: 'Sin comprobar (caducada)' }[licState.status];
  const b = openSheet(`<h2>Licencia</h2><p class="sub">OBRA-GIS ${APP_VERSION} · ${APP_DATE}</p>
    <table class="attrs"><tr><td>Estado</td><td>${st}</td></tr><tr><td>Tipo</td><td>${esc(l.tipo || 'Gratuita')}</td></tr>
    <tr><td>Última comprobación</td><td>${l.checked && !l.firstOffline ? new Date(l.checked).toLocaleString('es-ES') : 'pendiente (sin conexión)'}</td></tr>
    <tr><td>Uso sin conexión</td><td>hasta ${l.dias_sin_conexion || 60} días sin comprobar</td></tr>
    <tr><td>Condiciones aceptadas</td><td>${settings.eulaDate ? new Date(settings.eulaDate).toLocaleDateString('es-ES') : '—'}</td></tr></table>
    <div class="acts"><button class="btn" data-a="eula">Ver condiciones</button><button class="btn" data-a="chk">Comprobar ahora</button></div>`);
  b.querySelector('[data-a=eula]').onclick = () => eulaSheet(false);
  b.querySelector('[data-a=chk]').onclick = async () => { await checkLicense(); toast('Licencia: ' + ({ ok: 'activa', off: 'desactivada', old: 'versión no admitida', expired: 'sin comprobar' }[licState.status])); licenseSheet(); };
}

/* ---------------- Novedades por versión ---------------- */
function newsSheet() {
  openSheet(`<h2>Novedades</h2><p class="sub">Versión instalada: <b>v${APP_VERSION}</b> (${APP_DATE.split('-').reverse().join('/')})</p>
    <div class="news">${CHANGELOG.map(([v, d, t], i) => `<div class="nv ${i === 0 ? 'on' : ''}"><div><b>v${v}</b><small>${d}</small></div><p>${esc(t)}</p></div>`).join('')}</div>`);
}

/* ---------------- Medición ---------------- */
let measure = null;
const mDot = ll => L.circleMarker(ll, { renderer: hlRenderer, radius: 6, color: '#1f1a00', weight: 2, fillColor: '#ffd43b', fillOpacity: 1, interactive: false });
function startMeasure(ll, area = false) {
  if (measure) endMeasure();
  measure = { area, pts: [], line: (area ? L.polygon([], { renderer: hlRenderer, color: '#ffd43b', weight: 3, dashArray: '8 6', fillOpacity: 0.15, interactive: false }) : L.polyline([], { renderer: hlRenderer, color: '#ffd43b', weight: 4, dashArray: '8 6', interactive: false })).addTo(map), marks: L.layerGroup().addTo(map) };
  $('#measureBar').hidden = false;
  if (ll) addMeasurePt(ll); else updateMeasure();
}
function addMeasurePt(ll) {
  measure.pts.push(L.latLng(ll));
  mDot(ll).addTo(measure.marks);
  measure.line.setLatLngs(measure.pts); updateMeasure();
}
function updateMeasure() {
  const p = measure.pts; let d = 0;
  for (let i = 1; i < p.length; i++) d += p[i - 1].distanceTo(p[i]);
  if (measure.area) {
    if (p.length < 3) { $('#mText').textContent = 'Área: toca al menos 3 puntos del contorno'; return; }
    const per = d + p[p.length - 1].distanceTo(p[0]), a = polyArea(p.map(q => [q.lat, q.lng]));
    $('#mText').textContent = `Área: ${fmtArea(a)} (${(a / 10000).toFixed(4).replace('.', ',')} ha) · perímetro ${fmtLen(per)}`;
  } else $('#mText').textContent = p.length < 2 ? 'Toca el mapa para añadir puntos' : `Distancia: ${fmtLen(d)} · ${p.length} puntos`;
}
function endMeasure() { if (!measure) return; map.removeLayer(measure.line); map.removeLayer(measure.marks); measure = null; $('#measureBar').hidden = true; }
map.on('click', e => { if (geomEdit) return geomEditTap(e.latlng); if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng); if (measure) return addMeasurePt(e.latlng); if (!drawing) wmsTap(e.latlng); });
$('#mUndo').onclick = () => {
  if (!measure || !measure.pts.length) return;
  measure.pts.pop(); measure.marks.clearLayers();
  measure.pts.forEach(p => mDot(p).addTo(measure.marks));
  measure.line.setLatLngs(measure.pts); updateMeasure();
};
$('#mEnd').onclick = endMeasure;

/* ---------------- Exportar anotaciones y fotos a KMZ ---------------- */
const cdata = s => '<![CDATA[' + String(s).replace(/]]>/g, ']]]]><![CDATA[>') + ']]>';
const xml = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
async function exportKMZ() {
  const list = [...notes.values()].sort((a, b) => a.created - b.created);
  if (!list.length && !acts.size) { toast('Todavía no hay anotaciones, fotos ni actuaciones que exportar.'); return; }
  toast('Preparando KMZ…', 8000);
  const zip = new JSZip(); const folders = new Map();
  for (const n of list) {
    let html = `<p><b>${esc(fmtDate(n.created))}</b><br>${esc(fmtLL(n.lat, n.lng))}<br>${esc(fmtUTM(n.lat, n.lng))}</p>`;
    if (n.text) html += `<p>${esc(n.text).replace(/\n/g, '<br>')}</p>`;
    (n.media || []).forEach((m, i) => {
      const name = `files/${n.id}_${i + 1}.${extFor(m)}`;
      zip.file(name, m.blob);
      html += m.kind === 'photo' ? `<p><img src="${name}" width="480"></p>` : `<p><a href="${name}">${m.kind === 'video' ? 'Vídeo' : 'Nota de voz'} ${i + 1}</a></p>`;
    });
    const pm = `<Placemark><name>${xml(n.title)}</name><description>${cdata(html)}</description>
<TimeStamp><when>${new Date(n.created).toISOString()}</when></TimeStamp><styleUrl>#${noteType(n)}</styleUrl>
<Point><coordinates>${n.lng.toFixed(7)},${n.lat.toFixed(7)},0</coordinates></Point></Placemark>\n`;
    const fname = layerName(n.layerId);
    folders.set(fname, (folders.get(fname) || '') + pm);
  }
  let actPms = '', actStyles = '';
  ACT_TYPES.forEach(([t, c], i) => { actStyles += `<Style id="act${i}"><LineStyle><color>ff${c.slice(5, 7)}${c.slice(3, 5)}${c.slice(1, 3)}</color><width>5</width></LineStyle><IconStyle><color>ff${c.slice(5, 7)}${c.slice(3, 5)}${c.slice(1, 3)}</color></IconStyle></Style>`; });
  for (const a of actsSorted()) {
    let html = `<p><b>${esc(a.type)}</b> · ${esc(SIDES[a.side] || '')}<br>PK ${fmtPK(a.d0)} a ${fmtPK(a.d1)} · ${fmtLen(a.d1 - a.d0)}<br>${esc(a.traceName)}</p>`;
    const kr = [...actParamRows(a), ...actMeasRows(a).filter(([k]) => k !== 'Longitud')];
    if (kr.length) html += `<p>${kr.map(([k, v]) => `${esc(k)}: <b>${esc(String(v))}</b>`).join('<br>')}</p>`;
    if (a.text) html += `<p>${esc(a.text).replace(/\n/g, '<br>')}</p>`;
    (a.media || []).forEach((m, i) => {
      const name = `files/${a.id}_${i + 1}.${extFor(m)}`;
      zip.file(name, m.blob);
      html += m.kind === 'photo' ? `<p><img src="${name}" width="480"></p>` : `<p><a href="${name}">${m.kind === 'video' ? 'Vídeo' : 'Nota de voz'} ${i + 1}</a></p>`;
    });
    const ti = Math.max(0, ACT_TYPES.findIndex(([t]) => t === a.type));
    const geom = a.coords.length > 1 && a.d1 > a.d0
      ? `<LineString><tessellate>1</tessellate><coordinates>${a.coords.map(c => `${c[1].toFixed(7)},${c[0].toFixed(7)},0`).join(' ')}</coordinates></LineString>`
      : `<Point><coordinates>${a.coords[0][1].toFixed(7)},${a.coords[0][0].toFixed(7)},0</coordinates></Point>`;
    actPms += `<Placemark><name>${xml(actTitle(a))}</name><description>${cdata(html)}</description><styleUrl>#act${ti}</styleUrl>
<ExtendedData><Data name="Tipo"><value>${xml(a.type)}</value></Data><Data name="Margen"><value>${xml(SIDES[a.side] || '')}</value></Data><Data name="PK_inicio"><value>${fmtPK(a.d0)}</value></Data><Data name="PK_fin"><value>${fmtPK(a.d1)}</value></Data><Data name="Longitud_m"><value>${(a.d1 - a.d0).toFixed(1)}</value></Data>${(() => { const m = actMeasure(a), x = [['Longitud_total_m', m.Lm || m.L, MEAS_DEC.L], ['Superficie_m2', m.area, MEAS_DEC.area], ['Volumen_m3', m.vol, MEAS_DEC.vol], ['Peso_t', m.t, MEAS_DEC.t], ['Unidades', m.n, 0]];
  return x.filter(([, v]) => v).map(([k, v, dd]) => `<Data name="${k}"><value>${(+v).toFixed(dd)}</value></Data>`).join('') + Object.entries(a.params || {}).filter(([k, v]) => k[0] !== '_' && v !== '' && v != null).map(([k, v]) => `<Data name="${xml((ACT_FIELDS[k] || { l: k === 'mat' ? 'Material' : k }).l.replace(/ /g, '_'))}"><value>${xml(String(v))}</value></Data>`).join('') + (a.prio ? `<Data name="Prioridad"><value>${xml((ACT_PRIO[a.prio] || [a.prio])[0])}</value></Data>` : ''); })()}</ExtendedData>
${geom}</Placemark>\n`;
  }
  if (actPms) folders.set('Actuaciones', actPms);
  const st = (id, c) => `<Style id="${id}"><IconStyle><color>${c}</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>`;
  const body = [...folders].map(([name, pms]) => `<Folder><name>${xml(name)}</name>\n${pms}</Folder>`).join('\n');
  const kmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>OBRA-GIS ${new Date().toLocaleDateString('es-ES')}</name>
${st('photo', 'ffc27119')}${st('video', 'ffb5369c')}${st('audio', 'ff3e8a2b')}${st('note', 'ff0c59e8')}${actStyles}
${body}</Document></kml>`;
  zip.file('doc.kml', kmlDoc);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' });
  const name = `anotaciones_${new Date().toISOString().slice(0, 10)}.kmz`;
  try { await saveBlob(blob, name); toast(`Exportadas ${list.length} anotaciones y ${acts.size} actuaciones en ${name}`); }
  catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 6000); }
}

/* ---------------- Guardar zona para trabajar sin cobertura ---------------- */
function tileRange(b, z) {
  const n = 2 ** z;
  const x = lng => Math.floor((lng + 180) / 360 * n);
  const y = lat => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n); };
  return { x0: x(b.getWest()), x1: x(b.getEast()), y0: y(b.getNorth()), y1: y(b.getSouth()) };
}
async function cacheArea() { offlineSheet(); }

/* ---------------- Mapas sin conexión ----------------
   Descarga la ortofoto PNOA (y opcionalmente los rótulos y las capas de servicios visibles) de una zona:
   la vista actual, un municipio buscado por nombre o el municipio del punto que se toque en el mapa.
   Los límites municipales se obtienen de OpenStreetMap (Nominatim). */
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const NOMI_H = { 'User-Agent': `OBRA-GIS/${APP_VERSION} (app de campo; Android)`, 'Accept-Language': 'es' };
let offZone = null, offCancel = false, offPick = false;
function pointInRing(lat, lng, ring) { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const yi = ring[i][1], xi = ring[i][0], yj = ring[j][1], xj = ring[j][0]; if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
function inGeom(lat, lng, g) {
  if (!g) return true;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.some(p => pointInRing(lat, lng, p[0]) && !p.slice(1).some(h => pointInRing(lat, lng, h)));
}
function tile2lat(y, z) { const n = Math.PI - 2 * Math.PI * y / 2 ** z; return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }
function tile2lng(x, z) { return x / 2 ** z * 360 - 180; }
function zoneTiles(zone, zMax) {
  const out = [], b = zone.bounds;
  for (let z = 10; z <= zMax; z++) {
    const r = tileRange(b, z);
    for (let x = r.x0; x <= r.x1; x++) for (let y = r.y0; y <= r.y1; y++) {
      if (zone.geom) {
        const la0 = tile2lat(y + 1, z), la1 = tile2lat(y, z), lo0 = tile2lng(x, z), lo1 = tile2lng(x + 1, z);
        const pts = [[(la0 + la1) / 2, (lo0 + lo1) / 2], [la0, lo0], [la0, lo1], [la1, lo0], [la1, lo1]];
        if (!pts.some(([a, c]) => inGeom(a, c, zone.geom))) continue;
      }
      out.push({ x, y, z });
    }
  }
  return out;
}
function zoneUrls(zone, opts) {
  const urls = [], tl = zoneTiles(zone, opts.zMax);
  const wmsLayers = opts.wms ? [...layers.values()].filter(e => e.rec.visible && e.tile) : [];
  tl.forEach(t => {
    const sub = u => u.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y);
    if (opts.orto !== false) urls.push(sub(URL_PNOA));
    if (opts.orto !== false && opts.labels && t.z <= 18) urls.push(sub(URL_LABELS));
    if (opts.mtn) urls.push(sub(URL_MTN));
    if (t.z <= Math.min(opts.zMax, 17)) wmsLayers.forEach(e => { try { urls.push(tileUrlAt(e.tile, t.x, t.y, t.z)); } catch (_) {} });
  });
  return urls;
}
async function fetchTileBlob(u) {
  const H = Plug('CapacitorHttp');
  if (NATIVE && H) { const r = await H.get({ url: u, responseType: 'blob', connectTimeout: 15000, readTimeout: 15000 }); if (r.status >= 400) throw new Error('HTTP ' + r.status); const ct = (r.headers && (r.headers['Content-Type'] || r.headers['content-type'])) || (/png/i.test(u) ? 'image/png' : 'image/jpeg'); return b64ToBlob(r.data, ct); }
  const r = await fetch(u, { mode: 'cors' }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob();
}
async function offlineSheet() {
  const zones = (await DB.get('kv', 'zones').catch(() => null)) || [];
  const z = offZone;
  const b = openSheet(`<h2>Mapas sin conexión</h2><p class="sub">Descarga la ortofoto de una zona para trabajar sin cobertura</p>
    <div class="seg three"><button type="button" data-zmode="view" class="${!z || z.kind === 'view' ? 'on' : ''}">Vista actual</button><button type="button" data-zmode="search" class="${z && z.kind === 'search' ? 'on' : ''}">Municipio</button><button type="button" data-zmode="tap" class="${z && z.kind === 'tap' ? 'on' : ''}">Tocar mapa</button></div>
    <div id="zSel">${z ? `<p class="zsel"><b>${esc(z.name)}</b>${z.geom ? ' · límite municipal' : ''}</p>` : '<p class="hint">Se descargará la zona que ves ahora en pantalla.</p>'}</div>
    <div id="zSearch" ${z && z.kind === 'search' ? '' : 'hidden'} class="field row"><input type="text" id="zQ" placeholder="Municipio (p. ej. Cuevas del Campo, Granada)"><button class="mini" data-a="find">Buscar</button></div>
    <div id="zRes"></div>
    <div class="field row"><label for="zMax" class="grow">Detalle máximo</label><select id="zMax" style="max-width:180px">
      <option value="15">Bajo (5 m/píxel)</option><option value="16">Medio (2,4 m/píxel)</option><option value="17" selected>Alto (1,2 m/píxel)</option><option value="18">Muy alto (0,6 m/píxel)</option><option value="19">Máximo (0,3 m/píxel)</option></select></div>
    <label class="opt"><input type="checkbox" id="zOrto" ${settings.base === 'mtn' ? '' : 'checked'}>Ortofoto PNOA</label>
    <label class="opt"><input type="checkbox" id="zLab" checked>Incluir carreteras y nombres sobre la ortofoto</label>
    <label class="opt"><input type="checkbox" id="zMtn" ${settings.base === 'mtn' ? 'checked' : ''}>Mapa topográfico MTN25 ráster (IGN)</label>
    <label class="opt"><input type="checkbox" id="zWms">Incluir las capas de servicios visibles ahora (hasta detalle alto)</label>
    <p class="hint" id="zEst"></p>
    <div class="progress" id="zProg" hidden><div></div><span></span></div>
    <div class="acts"><button class="btn pri full" data-a="dl">Descargar</button><button class="btn full" data-a="stop" hidden>Detener</button></div>
    <h3 class="sh">Zonas descargadas</h3>
    ${zones.length ? zones.map(zz => `<div class="nrow"><span class="t"><b>${esc(zz.name)}</b><small>${fmtDate(zz.created)} · ${zz.count} imágenes · ${(zz.bytes / 1048576).toFixed(0)} MB · detalle ${zz.zMax}</small></span><button class="mini del" data-zdel="${zz.id}">Borrar</button></div>`).join('') : '<p class="empty">Ninguna todavía.</p>'}
    <p class="hint">Las capas KML, anotaciones, fotos y actuaciones ya están siempre en el móvil y funcionan sin conexión.</p>`);
  const est = () => {
    const zone = offZone || { kind: 'view', name: 'Vista actual', bounds: map.getBounds() };
    const opts = { zMax: +$('#zMax').value, labels: $('#zLab').checked, wms: $('#zWms').checked, orto: $('#zOrto').checked, mtn: $('#zMtn').checked };
    const n = zoneUrls(zone, opts).length, mb = Math.round(n * 0.022);
    $('#zEst').textContent = n > 40000 ? `Son ${thousands(n)} imágenes (unos ${thousands(mb)} MB): demasiadas. Baja el detalle máximo o elige una zona más pequeña.` : `${thousands(n)} imágenes · unos ${thousands(mb)} MB`;
    return { zone, opts, n };
  };
  est();
  ['zMax', 'zLab', 'zWms', 'zOrto', 'zMtn'].forEach(id => $('#' + id).onchange = est);
  b.querySelectorAll('[data-zmode]').forEach(bt => bt.onclick = () => {
    const m = bt.dataset.zmode;
    if (m === 'view') { offZone = null; offlineSheet(); }
    if (m === 'search') { offZone = { kind: 'search', name: 'Busca un municipio', bounds: map.getBounds() }; offlineSheet(); }
    if (m === 'tap') { closeSheet(); offPick = true; $('#pickText').textContent = 'Toca un punto del municipio que quieres descargar'; $('#pickBar').hidden = false; }
  });
  const fb = b.querySelector('[data-a=find]');
  if (fb) fb.onclick = async () => {
    const q = $('#zQ').value.trim(); if (!q) return;
    $('#zRes').innerHTML = '<p class="hint">Buscando…</p>';
    try {
      const res = JSON.parse(await httpGetText(`${NOMINATIM}/search?q=${encodeURIComponent(q)}&countrycodes=es&format=jsonv2&polygon_geojson=1&limit=6`, NOMI_H));
      const ok = res.filter(r => r.geojson && /Polygon/.test(r.geojson.type));
      $('#zRes').innerHTML = ok.length ? ok.map((r, i) => `<button class="crow" data-zr="${i}" type="button"><span>${esc(r.display_name)}</span><small>${esc(r.addresstype || r.type || '')}</small></button>`).join('') : '<p class="hint">No se ha encontrado ningún municipio con ese nombre.</p>';
      $('#zRes').querySelectorAll('[data-zr]').forEach(bt => bt.onclick = () => { const r = ok[+bt.dataset.zr]; setOffZone('search', r.display_name.split(',').slice(0, 2).join(','), r.geojson); offlineSheet(); });
    } catch (e) { $('#zRes').innerHTML = '<p class="hint">No se pudo buscar. Comprueba la conexión.</p>'; }
  };
  b.querySelectorAll('[data-zdel]').forEach(bt => bt.onclick = async () => {
    const list = (await DB.get('kv', 'zones')) || [], zz = list.find(x => x.id === bt.dataset.zdel);
    if (!zz || !confirm(`¿Borrar la zona «${zz.name}» del móvil?`)) return;
    const urls = (await DB.get('kv', 'zone:' + zz.id)) || [], keep = new Set();
    for (const o of list.filter(x => x.id !== zz.id)) ((await DB.get('kv', 'zone:' + o.id)) || []).forEach(u => keep.add(u));
    const cache = await caches.open('tiles-v1'); for (const u of urls) if (!keep.has(u)) await cache.delete(u);
    await DB.put('kv', list.filter(x => x.id !== zz.id), 'zones'); await DB.del('kv', 'zone:' + zz.id);
    toast('Zona borrada'); offlineSheet();
  });
  b.querySelector('[data-a=stop]').onclick = () => { offCancel = true; };
  b.querySelector('[data-a=dl]').onclick = async () => {
    if (!('caches' in window)) { toast('Este dispositivo no permite guardar mapas sin conexión.'); return; }
    const { zone, opts, n } = est();
    if (zone.kind === 'search' && !zone.geom) { toast('Busca y elige primero el municipio.'); return; }
    if (n > 40000) { toast('Demasiadas imágenes: baja el detalle máximo.'); return; }
    if (!n) { toast('Elige qué mapa quieres guardar (ortofoto o topográfico).'); return; }
    const urls = zoneUrls(zone, opts), cache = await caches.open('tiles-v1'), prog = $('#zProg');
    prog.hidden = false; b.querySelector('[data-a=dl]').hidden = true; b.querySelector('[data-a=stop]').hidden = false;
    let done = 0, ok = 0, bytes = 0, fail = 0, lastErr = ''; offCancel = false; const queue = urls.slice();
    const upd = () => { const p = prog.querySelector('div'), t = prog.querySelector('span'); if (p) p.style.width = (done / urls.length * 100).toFixed(1) + '%'; if (t) t.textContent = `${thousands(done)} / ${thousands(urls.length)} · ${(bytes / 1048576).toFixed(0)} MB`; };
    async function worker() {
      while (queue.length && !offCancel) {
        const u = queue.shift();
        try { const hit = await cache.match(u); if (hit) { ok++; } else { const bl = await fetchTileBlob(u); if (!bl.size || !/^image\//.test(bl.type || 'image/')) throw new Error('respuesta no válida'); await cache.put(u, new Response(bl, { headers: { 'Content-Type': bl.type || 'image/jpeg' } })); bytes += bl.size; ok++; } } catch (e) { fail++; lastErr = e.message || String(e); }
        done++; if (done % 20 === 0) upd();
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker)); upd();
    const list = (await DB.get('kv', 'zones').catch(() => null)) || [], id = uid();
    list.push({ id, name: zone.name, created: Date.now(), count: ok, bytes, zMax: opts.zMax });
    await DB.put('kv', urls.slice(0, done), 'zone:' + id); await DB.put('kv', list, 'zones');
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if (!ok && fail) { toast(`No se ha podido descargar ninguna imagen (${fail} fallos). Comprueba la conexión (mejor con wifi) y vuelve a intentarlo.${lastErr ? ' Error: ' + lastErr : ''}`, 10000); offlineSheet(); return; }
    toast(offCancel ? `Descarga detenida: ${ok} imágenes guardadas.` : `Zona «${zone.name}» lista sin conexión: ${ok} imágenes${fail ? ` (${fail} no se pudieron bajar: vuelve a pulsar «Descargar» y se bajarán solo las que faltan)` : ''}. Para comprobarla, activa el modo avión y mira la zona.`, 9000);
    offZone = null; offlineSheet();
  };
}
function setOffZone(kind, name, geojson) {
  const coords = []; (function walk(c) { if (typeof c[0] === 'number') coords.push([c[1], c[0]]); else c.forEach(walk); })(geojson.coordinates);
  offZone = { kind, name, geom: geojson, bounds: L.latLngBounds(coords) };
  if (geojson) { slopeHL.clearLayers(); L.geoJSON(geojson, { renderer: hlRenderer, style: { color: '#ff6b00', weight: 3, fillOpacity: 0.08 }, interactive: false }).addTo(slopeHL); map.fitBounds(offZone.bounds.pad(0.05)); setTimeout(() => slopeHL.clearLayers(), 8000); }
}
async function offlinePickAt(ll) {
  offPick = false; $('#pickBar').hidden = true;
  toast('Buscando el municipio…', 4000);
  try {
    const r = JSON.parse(await httpGetText(`${NOMINATIM}/reverse?lat=${ll.lat.toFixed(6)}&lon=${ll.lng.toFixed(6)}&zoom=10&format=jsonv2&polygon_geojson=1`, NOMI_H));
    if (!r.geojson || !/Polygon/.test(r.geojson.type)) throw new Error('sin límite');
    setOffZone('tap', r.name || (r.display_name || '').split(',')[0], r.geojson);
  } catch (e) { toast('No se ha encontrado el municipio de ese punto. Prueba con «Municipio» o «Vista actual».', 6000); }
  offlineSheet();
}
