'use strict';
/* OBRA-GIS · Mapa, catálogo de servicios, lectura de KML, gestor de capas y marcas de PK.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Mapa y capas base ---------------- */
const map = L.map('map', { zoomControl: false, renderer: L.canvas({ tolerance: 12 }), maxZoom: 21 }).setView([37.18, -3.6], 9);
// doble toque: acerca el mapa en el punto tocado (Leaflet lo hace también con el dedo). Al medir o dibujar se desactiva: ahí cada toque es un punto.
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
map.createPane('rasters').style.zIndex = 350;   // servicios WMS/WMTS, por encima del mapa base
map.createPane('hl').style.zIndex = 590;        // resaltes y mediciones, por debajo de los marcadores
map.getPane('hl').style.pointerEvents = 'none';
const hlRenderer = L.canvas({ pane: 'hl' });

const ign = (svc, layer, fmt) => `https://www.ign.es/wmts/${svc}?service=WMTS&request=GetTile&version=1.0.0&layer=${layer}&style=default&tilematrixset=GoogleMapsCompatible&tilematrix={z}&tilerow={y}&tilecol={x}&format=${fmt}`;
const URL_PNOA = ign('pnoa-ma', 'OI.OrthoimageCoverage', 'image/jpeg');
const URL_LABELS = ign('ign-base', 'IGNBaseOrto', 'image/png');
const ATTR_IGN = 'PNOA y Base IGN CC-BY 4.0 <a href="https://www.scne.es" target="_blank" rel="noopener">scne.es</a>';
// En la app nativa no hay service worker: las teselas guardadas para uso sin conexión se leen aquí.
const CachedTileLayer = L.TileLayer.extend({
  createTile(coords, done) {
    const img = document.createElement('img');
    img.alt = ''; img.setAttribute('role', 'presentation');
    L.DomEvent.on(img, 'load', L.Util.bind(this._tileOnLoad, this, done, img));
    L.DomEvent.on(img, 'error', L.Util.bind(this._tileOnError, this, done, img));
    const url = this.getTileUrl(coords);
    if (!NATIVE || !('caches' in window)) { img.src = url; return img; }
    caches.open('tiles-v1').then(c => c.match(url)).then(r => (r ? r.blob() : null)).then(b => {
      if (!b) { img.src = url; return; }
      const u = URL.createObjectURL(b); img.addEventListener('load', () => URL.revokeObjectURL(u), { once: true }); img.src = u;
    }).catch(() => { img.src = url; });
    return img;
  },
});
const tiles = (url, o) => new CachedTileLayer(url, o);
const CachedWMS = L.TileLayer.WMS.extend({ createTile: CachedTileLayer.prototype.createTile });
const pnoaTiles = () => tiles(URL_PNOA, { maxNativeZoom: 19, maxZoom: 21, attribution: ATTR_IGN });

const BASES = {
  pnoa: { name: 'Ortofoto PNOA híbrida (IGN)', make: () => L.layerGroup([pnoaTiles(), tiles(URL_LABELS, { maxNativeZoom: 18, maxZoom: 21 })]) },
  // google: { name: 'Google híbrido', make: makeGoogle },  ← reservado para una futura versión premium con usuarios
  pnoaSolo: { name: 'Ortofoto PNOA sin rótulos', make: pnoaTiles },
  osm: { name: 'Callejero OpenStreetMap', make: () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 21, maxNativeZoom: 19, attribution: '© OpenStreetMap' }) },
};

// Capa Google (API Map Tiles): retirada de la versión gratuita. Se conserva para una futura versión premium.
let googleCache = null;
async function makeGoogle() {
  const key = (settings.googleKey || '').trim();
  if (!key) throw new Error('Para ver Google híbrido añade tu clave de la API Map Tiles en el menú, apartado Ajustes.');
  if (googleCache && googleCache.key === key && googleCache.exp > Date.now()) return googleCache.layer;
  let r;
  try {
    r = await fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapType: 'satellite', language: 'es-ES', region: 'ES', layerTypes: ['layerRoadmap'] }),
    });
  } catch (e) { throw new Error('Sin conexión con Google. Se muestra la ortofoto del IGN.'); }
  if (!r.ok) {
    let m = ''; try { m = (await r.json()).error.message; } catch (_) {}
    throw new Error('Google no acepta la clave (' + (m || r.status) + '). Revisa que la API Map Tiles esté activada.');
  }
  const j = await r.json();
  const layer = L.tileLayer(`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(j.session)}&key=${encodeURIComponent(key)}`,
    { maxZoom: 22, attribution: 'Imágenes y datos del mapa © Google' });
  googleCache = { key, layer, exp: Number(j.expiry) * 1000 - 3600e3 };
  return layer;
}

let baseLayer = null;
async function setBase(id) {
  let layer;
  try { layer = await BASES[id].make(); } catch (e) {
    toast(e.message, 7000);
    if (id !== 'pnoa') return setBase('pnoa');
    return;
  }
  if (baseLayer) map.removeLayer(baseLayer);
  baseLayer = layer.addTo(map);
  settings.base = id; saveSettings(); odKey = ''; updateOrthoDate();
  if (!$('#drawer').hidden) renderDrawer();
}

/* ---------------- Catálogo de servicios de capas (afecciones de obra) ----------------
   DERA: Datos Espaciales de Referencia de Andalucía (IECA). REDIAM: Junta de Andalucía.
   MITECO: Sistema Nacional de Cartografía de Zonas Inundables y DPH. */
const DERA = (tema, capa, name, extra = {}) => ({ name, kind: 'wms', url: `https://www.ideandalucia.es/services/${tema}/wms`, layers: capa, info: 'json', cover: 'Andalucía', attribution: 'DERA © IECA, Junta de Andalucía', ...extra });
const MITECO = (svc, name, extra = {}) => ({ name, kind: 'wms', url: `https://gis.miteco.gob.es/geoserver/agua/${svc}/wms`, layers: svc, info: 'json', cover: 'España', opacity: 0.6, attribution: '© MITECO', ...extra });
const VVPP_URL = 'https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_Inventario_VVPP';
const CATALOG_GROUPS = [
  { id: 'energia', name: 'Redes eléctricas, gas y energía', items: [
    DERA('DERA_g10_infra_energetica', 'g10_14_LineaElectrica', 'Líneas eléctricas'),
    DERA('DERA_g10_infra_energetica', 'g10_13_SubestacionElectrica', 'Subestaciones eléctricas'),
    DERA('DERA_g10_infra_energetica', 'g10_18_Gasoducto', 'Gasoductos'),
    DERA('DERA_g10_infra_energetica', 'g10_19_Oleoducto', 'Oleoductos'),
    DERA('DERA_g10_infra_energetica', 'g10_15_PlantaGas', 'Plantas de gas'),
    DERA('DERA_g10_infra_energetica', 'g10_03_PlantaSolar', 'Plantas solares'),
    DERA('DERA_g10_infra_energetica', 'g10_02_ParqueEolico', 'Parques eólicos'),
    DERA('DERA_g09_transport_com', 'g09_26_Antena', 'Antenas de telecomunicación'),
  ] },
  { id: 'agua', name: 'Agua: dominio público hidráulico e inundabilidad', items: [
    MITECO('DPH_Estimado', 'DPH cartográfico (cauces)'),
    MITECO('DPH_Deslindado', 'DPH deslindado'),
    MITECO('ZI_Laminas_ZFP', 'Zona de flujo preferente'),
    MITECO('Zi_laminas_q10', 'Zona inundable T=10 años'),
    MITECO('Zi_laminas_q100', 'Zona inundable T=100 años'),
    MITECO('Zi_laminas_q500', 'Zona inundable T=500 años'),
    DERA('DERA_g3_hidrografia', 'g03_01_Rio', 'Ríos y arroyos'),
    DERA('DERA_g3_hidrografia', 'g03_06_Embalse', 'Embalses'),
  ] },
  { id: 'hidraulica', name: 'Infraestructura hidráulica y saneamiento', items: [
    DERA('DERA_g3_hidrografia', 'g03_08_Conduccion', 'Conducciones de agua'),
    DERA('DERA_g3_hidrografia', 'g03_13_CanalArtificial', 'Canales'),
    DERA('DERA_g3_hidrografia', 'g03_11_Canalizacion', 'Canalizaciones'),
    DERA('DERA_g3_hidrografia', 'g03_15_Colector', 'Colectores'),
    DERA('DERA_g3_hidrografia', 'g03_07_Captacion', 'Captaciones'),
    DERA('DERA_g3_hidrografia', 'g03_09_Deposito', 'Depósitos'),
    DERA('DERA_g3_hidrografia', 'g03_10_Balsa', 'Balsas'),
    DERA('DERA_g10_infra_energetica', 'g10_27_Edar', 'Depuradoras (EDAR)'),
    DERA('DERA_g10_infra_energetica', 'g10_29_Etap', 'Potabilizadoras (ETAP)'),
  ] },
  { id: 'transporte', name: 'Carreteras y ferrocarril', items: [
    DERA('DERA_g9_transport_com', 'g09_14_RedCarreteras', 'Red de carreteras'),
    DERA('DERA_g9_transport_com', 'g09_17_PuntoKilometrico', 'Puntos kilométricos'),
    DERA('DERA_g9_transport_com', 'g09_21_Ferrocarril', 'Ferrocarril'),
    DERA('DERA_g9_transport_com', 'g09_19_Camino', 'Caminos'),
    DERA('DERA_g9_transport_com', 'g09_24_ViaVerde', 'Vías verdes'),
  ] },
  { id: 'vvpp', name: 'Vías pecuarias', items: [
    { name: 'Vías pecuarias (inventario REDIAM)', kind: 'wms', url: VVPP_URL, layers: 'Inventario_VVPP', info: 'html', cover: 'Andalucía', attribution: 'REDIAM, Junta de Andalucía' },
    { name: 'Tramos deslindados de vías pecuarias', kind: 'wms', url: VVPP_URL, layers: 'linea_base_deslindada', info: 'html', cover: 'Andalucía', attribution: 'REDIAM, Junta de Andalucía' },
    { name: 'Lugares asociados a vías pecuarias', kind: 'wms', url: VVPP_URL, layers: 'Lugares_VVPP', info: 'html', cover: 'Andalucía', attribution: 'REDIAM, Junta de Andalucía' },
    DERA('DERA_g9_transport_com', 'g09_22_ViasPecuarias', 'Vías pecuarias (DERA)'),
  ] },
  { id: 'natural', name: 'Espacios naturales y montes', items: [
    DERA('DERA_g11_patrimonio', 'g11_07_Enp_RegimenProteccion', 'Espacios naturales protegidos', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_09_RedNatura_ZEC', 'Red Natura 2000 · ZEC', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_09_RedNatura_ZEPA', 'Red Natura 2000 · ZEPA', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_09_RedNatura_LIC', 'Red Natura 2000 · LIC', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_15_Montes', 'Montes públicos', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_14_HumedalesRamsar', 'Humedales Ramsar', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_10_ReservaBiosfera', 'Reservas de la Biosfera', { opacity: 0.5 }),
    DERA('DERA_g11_patrimonio', 'g11_04_InventarioAndaluzGeorrecursos', 'Georrecursos'),
  ] },
  { id: 'patrimonio', name: 'Patrimonio cultural', items: [
    DERA('DERA_g11_patrimonio', 'g11_18_BienesProtegidos_pol', 'Bienes protegidos (áreas)', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_17_BienesProtegidos_pun', 'Bienes protegidos (puntos)'),
    DERA('DERA_g11_patrimonio', 'g11_19_EntornosProteccionBIC', 'Entornos de protección de BIC', { opacity: 0.5 }),
  ] },
  { id: 'parcelario', name: 'Parcelario, límites y servidumbres', items: [
    { name: 'Parcelas de Catastro', kind: 'wms', url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx', layers: 'Catastro', info: 'html', cover: 'España', attribution: '© D. G. del Catastro' },
    { name: 'SIGPAC · recintos', kind: 'wms', url: 'https://wms.mapa.gob.es/sigpac/wms', layers: 'AU.Sigpac:recinto', info: 'html', cover: 'España', attribution: 'SIGPAC © MAPA' },
    DERA('DERA_g13_limites_administrativos', 'g13_01_TerminoMunicipal', 'Términos municipales', { opacity: 0.8 }),
    DERA('DERA_g13_limites_administrativos', 'g13_42_LineaCostaDMPT', 'Deslinde dominio público marítimo-terrestre'),
    DERA('DERA_g12_servicios', 'g12_31_ZonaMilitar', 'Zonas militares', { opacity: 0.6 }),
    DERA('DERA_g8_tejido_economico', 'g08_07_ActividadExtractiva', 'Actividades extractivas (canteras)'),
  ] },
  { id: 'referencia', name: 'Cartografía de referencia', items: [
    { name: 'Mapa topográfico MTN (IGN)', kind: 'wmts', url: ign('mapa-raster', 'MTN', 'image/jpeg'), maxNative: 18, opacity: 0.7, cover: 'España', attribution: ATTR_IGN },
    DERA('DERA_g1_relieve', 'g01_03_CurvaNivel', 'Curvas de nivel'),
    { name: 'Límites administrativos (IGN)', kind: 'wms', url: 'https://www.ign.es/wms-inspire/unidades-administrativas', layers: 'AU.AdministrativeBoundary', cover: 'España', attribution: ATTR_IGN },
  ] },
];
const CATALOG = CATALOG_GROUPS.flatMap(g => g.items.map(i => ({ ...i, group: g.id })));
// Selección básica para revisar las afecciones de una obra
const AFECCIONES_KIT = ['Líneas eléctricas', 'Subestaciones eléctricas', 'Gasoductos', 'Oleoductos', 'Red de carreteras', 'Ferrocarril',
  'Vías pecuarias (inventario REDIAM)', 'DPH cartográfico (cauces)', 'Zona de flujo preferente', 'Zona inundable T=100 años',
  'Conducciones de agua', 'Canales', 'Espacios naturales protegidos', 'Red Natura 2000 · ZEC', 'Red Natura 2000 · ZEPA',
  'Montes públicos', 'Bienes protegidos (áreas)', 'Bienes protegidos (puntos)', 'Parcelas de Catastro'];

/* ---------------- Lectura de KML ---------------- */
const byTag = (el, tag) => Array.from(el.getElementsByTagNameNS('*', tag));
const childText = (el, tag) => { const n = Array.from(el.children).find(c => c.localName === tag); return n ? n.textContent.trim() : ''; };
const firstText = (el, tag) => { const n = byTag(el, tag)[0]; return n ? n.textContent.trim() : ''; };
const parseCoords = t => (t || '').trim().replace(/\s*,\s*/g, ',').split(/\s+/).map(s => s.split(',').map(Number)) // «lng, lat» con espacios también vale
  .filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1]) && Math.abs(a[0]) <= 180 && Math.abs(a[1]) <= 90).map(a => (a.length > 2 && isFinite(a[2]) ? [a[1], a[0], a[2]] : [a[1], a[0]])); // → [lat, lng, z?]

function kmlColor(abgr) {
  const s = (abgr || '').trim().replace('#', '');
  if (!/^[0-9a-f]{8}$/i.test(s)) return null;
  return { color: '#' + s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4), op: parseInt(s.slice(0, 2), 16) / 255 };
}
function readStyle(st) {
  const o = {};
  const ls = byTag(st, 'LineStyle')[0], ps = byTag(st, 'PolyStyle')[0], is = byTag(st, 'IconStyle')[0];
  if (ls) { const c = kmlColor(firstText(ls, 'color')); if (c) { o.line = c.color; o.lineOp = c.op; } const w = parseFloat(firstText(ls, 'width')); if (w) o.width = w; }
  if (ps) { const c = kmlColor(firstText(ps, 'color')); if (c) { o.fill = c.color; o.fillOp = c.op; } if (firstText(ps, 'fill') === '0') o.noFill = true; }
  if (is) { const c = kmlColor(firstText(is, 'color')); if (c) o.icon = c.color; }
  return o;
}
function parseStyles(doc) {
  const styles = {};
  byTag(doc, 'Style').forEach(st => { const id = st.getAttribute('id'); if (id) styles['#' + id] = readStyle(st); });
  byTag(doc, 'StyleMap').forEach(sm => {
    const id = sm.getAttribute('id'); if (!id) return;
    const pair = byTag(sm, 'Pair').find(p => firstText(p, 'key') === 'normal');
    if (!pair) return;
    const inline = byTag(pair, 'Style')[0];
    styles['#' + id] = inline ? readStyle(inline) : { ref: firstText(pair, 'styleUrl') };
  });
  Object.keys(styles).forEach(k => { const r = styles[k].ref; if (r !== undefined) styles[k] = styles[r.replace(/^.*#/, '#')] || {}; });
  return styles;
}
function htmlToText(html) {
  if (!html) return '';
  const d = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li)>/gi, '\n'), 'text/html');
  return (d.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}
function folderPath(pm) {
  const parts = []; let p = pm.parentElement;
  while (p) { if (p.localName === 'Folder') { const n = childText(p, 'name'); if (n) parts.unshift(n); } p = p.parentElement; }
  return parts.join(' › ');
}
// Distancias y áreas sobre el elipsoide (WGS84 ≈ ETRS89): radios de curvatura en la latitud media.
// Para tramos de obra (vértices a menos de unos km) coincide con el cálculo elipsoidal de QGIS al milímetro.
const ELL_A = 6378137, ELL_E2 = 0.00669437999014;
function ellRadii(lat) { const s2 = Math.sin(lat * Math.PI / 180) ** 2, w = Math.sqrt(1 - ELL_E2 * s2); return { M: ELL_A * (1 - ELL_E2) / (w * w * w), N: ELL_A / w }; }
function ellDist(a, b) {
  const lat = (a.lat + b.lat) / 2, { M, N } = ellRadii(lat), r = Math.PI / 180;
  return Math.hypot((b.lat - a.lat) * r * M, (b.lng - a.lng) * r * N * Math.cos(lat * r));
}
L.CRS.Earth.distance = (a, b) => ellDist(L.latLng(a), L.latLng(b)); // todas las distancias de la app (PK, mediciones, anchos…)
function polyArea(c) { // área en m² sobre el elipsoide (proyección local en el centro del polígono)
  if (c.length < 3) return 0;
  const lat0 = c.reduce((s2, p) => s2 + p[0], 0) / c.length, R = ellRadii(lat0), k = Math.cos(lat0 * Math.PI / 180) * R.N * Math.PI / 180, m = R.M * Math.PI / 180;
  let a = 0; for (let i = 0; i < c.length; i++) { const p = c[i], q = c[(i + 1) % c.length]; a += (p[1] * k) * (q[0] * m) - (q[1] * k) * (p[0] * m); }
  return Math.abs(a) / 2;
}
function lineLength(c) { let s = 0; for (let i = 1; i < c.length; i++) s += L.latLng(c[i - 1]).distanceTo(c[i]); return s; }
function centroid(c) {
  let n = c.length; if (n > 1 && c[0][0] === c[n - 1][0] && c[0][1] === c[n - 1][1]) n--;
  let a = 0, b = 0; for (let i = 0; i < n; i++) { a += c[i][0]; b += c[i][1]; } return [a / n, b / n];
}

function parseKML(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('El fichero no es un KML válido.');
  const styles = parseStyles(doc);
  const docName = firstText(doc.documentElement, 'name');
  const out = [];
  byTag(doc, 'Placemark').forEach((pm, i) => {
    const parts = [];
    byTag(pm, 'Point').forEach(g => { const c = parseCoords(firstText(g, 'coordinates')); if (c.length) parts.push({ t: 'pt', c }); });
    byTag(pm, 'LineString').forEach(g => { const c = parseCoords(firstText(g, 'coordinates')); if (c.length > 1) parts.push({ t: 'ln', c }); });
    byTag(pm, 'Polygon').forEach(g => { const r = byTag(g, 'outerBoundaryIs')[0] || g; const c = parseCoords(firstText(r, 'coordinates'));
      const holes = byTag(g, 'innerBoundaryIs').map(ib => parseCoords(firstText(ib, 'coordinates'))).filter(h => h.length > 2); // huecos (islas, enclaves)
      if (c.length > 2) parts.push(holes.length ? { t: 'pg', c, holes } : { t: 'pg', c }); });
    byTag(pm, 'Track').forEach(g => {
      const c = byTag(g, 'coord').map(n => n.textContent.trim().split(/\s+/).map(Number)).filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1])).map(a => [a[1], a[0]]);
      if (c.length > 1) parts.push({ t: 'ln', c });
    });
    if (!parts.length) return;
    const inline = Array.from(pm.children).find(c => c.localName === 'Style');
    const style = Object.assign({}, styles[(childText(pm, 'styleUrl') || '').replace(/^.*#/, '#')] || {}, inline ? readStyle(inline) : {});
    const attrs = [];
    byTag(pm, 'Data').forEach(d => attrs.push([d.getAttribute('displayName') || d.getAttribute('name') || '', firstText(d, 'value'), d.getAttribute('name') || '']));
    byTag(pm, 'SimpleData').forEach(d => attrs.push([d.getAttribute('name') || '', d.textContent.trim(), d.getAttribute('name') || '']));
    const lines = parts.filter(p => p.t === 'ln');
    const type = lines.length ? 'ln' : parts.some(p => p.t === 'pg') ? 'pg' : 'pt';
    const f = { pm: i, name: childText(pm, 'name') || 'Elemento ' + (i + 1), folder: folderPath(pm), desc: htmlToText(childText(pm, 'description')), attrs, parts, type, style };
    if (type === 'ln') { f.start = lines[0].c[0]; const last = lines[lines.length - 1].c; f.end = last[last.length - 1]; f.length = lines.reduce((s, l) => s + lineLength(l.c), 0); }
    else if (type === 'pg') { const c = parts.find(p => p.t === 'pg').c; f.start = centroid(c); f.length = lineLength(c); f.area = parts.filter(p => p.t === 'pg').reduce((s2, p) => s2 + Math.max(0, polyArea(p.c) - (p.holes || []).reduce((h, r) => h + polyArea(r), 0)), 0); }
    else f.start = parts[0].c[0];
    out.push(f);
  });
  return { docName, feats: out };
}

/* ---------------- Gestor de capas ----------------
   Tipos: kml (vectorial), wms/wmts (imagen de un servicio), photos (fotos importadas con GPS)
   y la capa fija "Mis anotaciones". Las vectoriales se dibujan siempre sobre las de imagen. */
const PALETTE = ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#f783ac', '#ffa94d', '#b197fc', '#3bc9db'];
const layers = new Map();       // id → { rec, feats?, group?, tile? }
const pointGroups = new Map();  // id de capa de puntos → L.layerGroup
const highlight = L.layerGroup().addTo(map);
const typeOf = rec => rec.type || 'kml';
const isPointLayer = rec => typeOf(rec) === 'photos';
const nextOrder = () => Math.max(0, ...[...layers.values()].map(e => e.rec.order || 0)) + 1;

function pointGroup(id) {
  let g = pointGroups.get(id);
  if (!g) { g = L.layerGroup(); pointGroups.set(id, g); }
  return g;
}
function layerVisible(id) {
  if (id === 'notes') return settings.notesVisible !== false;
  if (id === 'acts') return settings.actsVisible !== false;
  if (id === 'res') return settings.resVisible !== false;
  const e = layers.get(id); return !!(e && e.rec.visible);
}

/* ---------------- PK: marcas de distancia en las trazas (cada 100 m por defecto; configurable en general y por capa) ---------------- */
const PK_STEP = 100, PK_STEPS = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const PK_NICE = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
const pkStepOf = rec => Math.max(1, Math.round((rec && rec.pkStep) || settings.pkStep || PK_STEP));
const fmtStep = m => m >= 1000 && m % 1000 === 0 ? `${m / 1000} km` : `${m} m`;
function pkStepOptions(cur, withGeneral) {
  const list = PK_STEPS.includes(cur) || !cur ? PK_STEPS : [...PK_STEPS, cur].sort((a, b) => a - b);
  return (withGeneral ? `<option value="" ${!cur ? 'selected' : ''}>General (${fmtStep(settings.pkStep || PK_STEP)})</option>` : '')
    + list.map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>Cada ${fmtStep(v)}</option>`).join('') + '<option value="otra">Otra distancia…</option>';
}
function askPkStep(sel, cur) {
  if (sel.value !== 'otra') return sel.value === '' ? null : +sel.value;
  const v = parseNum(prompt('Distancia entre marcas de PK, en metros (1 a 5000):', String(cur || settings.pkStep || PK_STEP)) || '');
  if (!isFinite(v) || v < 1 || v > 5000) { toast('Distancia no válida. Escribe un número de metros entre 1 y 5000.'); return undefined; }
  return Math.round(v);
}
// Celda CSV entre comillas. Si el texto empieza por = + @ (o - sin ser un número) se antepone ' para que Excel no lo ejecute como fórmula.
const csvQ = v => { let t = String(v ?? ''); if (/^[=+@\t\r]/.test(t) || (/^-/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t))) t = "'" + t; return '"' + t.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"'; };
// PK con formato km+metros. Se redondea al metro ANTES de separar los km (antes salía «0+1000»).
const fmtPK = d => { if (!isFinite(d)) return '—'; const m = Math.round(Math.abs(d)); return `${d < 0 && m ? '−' : ''}${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, '0')}`; };
function lineParts(f) { return f.parts.filter(p => p.t === 'ln'); }
function chainage(f, step = PK_STEP) {
  const out = []; let acc = 0, next = 0, last = null;
  lineParts(f).forEach(p => {
    const c = p.c;
    for (let i = 1; i < c.length; i++) {
      const a = L.latLng(c[i - 1]), b = L.latLng(c[i]), seg = a.distanceTo(b);
      if (!seg) continue;
      const dx = (b.lng - a.lng) * Math.cos(a.lat * Math.PI / 180), dy = b.lat - a.lat;
      while (next <= acc + seg + 1e-6) {
        const t = (next - acc) / seg;
        out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, d: next, dx, dy });
        next += step;
      }
      acc += seg; last = { lat: b.lat, lng: b.lng, dx, dy };
    }
  });
  if (last && acc - (next - step) > Math.min(15, step * 0.3)) out.push({ ...last, d: acc, end: true }); // PK final de la traza
  return out;
}
// PK del punto de la traza más cercano a una posición
function pkAt(f, ll) {
  const R0 = ellRadii(ll.lat), k = Math.cos(ll.lat * Math.PI / 180) * R0.N / R0.M, M = R0.M * Math.PI / 180;
  let best = Infinity, bestD = 0, acc = 0;
  lineParts(f).forEach(p => {
    const c = p.c;
    for (let i = 1; i < c.length; i++) {
      const ax = c[i - 1][1] * k * M, ay = c[i - 1][0] * M, bx = c[i][1] * k * M, by = c[i][0] * M, px = ll.lng * k * M, py = ll.lat * M;
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
      const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)) : 0;
      const qx = ax + t * vx, qy = ay + t * vy, dist = Math.hypot(px - qx, py - qy);
      const seg = L.latLng(c[i - 1]).distanceTo(c[i]);
      if (dist < best) { best = dist; bestD = acc + t * seg; }
      acc += seg;
    }
  });
  return { d: bestD, off: best };
}
map.createPane('pk').style.zIndex = 420;
map.getPane('pk').style.pointerEvents = 'none';
const pkRenderer = L.canvas({ pane: 'pk' });
const pkLayer = L.layerGroup().addTo(map);
function drawPK() {
  pkLayer.clearLayers();
  const z = map.getZoom();
  if (!settings.pk || z < 12) return;
  const mpp = 40075016.686 * Math.cos(map.getCenter().lat * Math.PI / 180) / (256 * 2 ** z); // metros por píxel
  const bounds = map.getBounds().pad(0.05);
  let n = 0;
  for (const e of layers.values()) {
    if (typeOf(e.rec) !== 'kml' || !e.rec.visible || !e.pk) continue;
    const step = e.pkStep || PK_STEP, base = e.pkBase || step;
    let tickEvery, labelEvery, majorEvery = step;
    if (step / mpp >= 12) {
      // Calibración principal visible: al acercar se añaden subcalibraciones (½, ⅕, 1/10 del paso) sin bajar de 10 m
      const subs = settings.pkSub === false ? [] : [step / 10, step / 5, step / 4, step / 2].filter(v => v >= base && Math.abs(v / base - Math.round(v / base)) < 1e-6);
      tickEvery = subs.find(v => v / mpp >= 16) || step;
      const isM = (x, y) => Math.abs(x / y - Math.round(x / y)) < 1e-6;
      labelEvery = [...new Set([tickEvery, ...subs, ...[1, 2, 5, 10, 20, 50].map(k => k * step)])].sort((x, y) => x - y).find(v => isM(v, tickEvery) && (isM(step, v) || isM(v, step)) && v / mpp >= 64) || step * 50;
    } else {
      const cands = [...new Set([step, ...PK_NICE.filter(v => v % step === 0), ...[2, 5, 10, 20, 50, 100, 200].map(k => k * step)])].sort((x, y) => x - y);
      tickEvery = cands.find(v => v / mpp >= 12); if (!tickEvery) continue;
      labelEvery = cands.find(v => v % tickEvery === 0 && v / mpp >= 60) || tickEvery;
      majorEvery = tickEvery;
    }
    const bigEvery = Math.max(1000, step * 10);
    const op = e.rec.opacity ?? 1;
    for (const m of e.pk) {
      if (n > 2500) return;
      const dr = Math.round(m.d * 100) / 100, mod = v => Math.abs(dr / v - Math.round(dr / v)) < 1e-6;
      if (!m.end && !mod(tickEvery)) continue;
      if (!bounds.contains([m.lat, m.lng])) continue;
      const p = map.latLngToLayerPoint([m.lat, m.lng]);
      const len = Math.hypot(m.dx, m.dy) || 1, nx = m.dy / len, ny = m.dx / len; // perpendicular en pantalla
      const major = m.end || mod(majorEvery), big = m.end || mod(bigEvery), lab = m.end || mod(labelEvery);
      const h = big ? 10 : major ? 7 : 4;
      const a = map.layerPointToLatLng([p.x + nx * h, p.y + ny * h]), b = map.layerPointToLatLng([p.x - nx * h, p.y - ny * h]);
      L.polyline([a, b], { renderer: pkRenderer, color: '#102018', weight: major ? 4 : 3, opacity: 0.55 * op, interactive: false }).addTo(pkLayer);
      L.polyline([a, b], { renderer: pkRenderer, color: major ? '#ffffff' : '#ffe08a', weight: major ? 2 : 1.5, opacity: op, interactive: false }).addTo(pkLayer);
      if (lab) {
        const at = map.layerPointToLatLng([p.x + nx * (h + 13), p.y + ny * (h + 13)]);
        L.marker(at, { interactive: false, keyboard: false, pane: 'pk',
          icon: L.divIcon({ className: 'pk-label' + (big ? ' big' : major ? '' : ' sub'), html: `<span style="opacity:${op}">${fmtPK(m.d)}</span>`, iconSize: [0, 0] }) }).addTo(pkLayer);
      }
      n++;
    }
  }
}
let pkT; map.on('moveend', () => { clearTimeout(pkT); pkT = setTimeout(() => { drawPK(); drawActs(); drawWidths(); }, 60); clearTimeout(odT); odT = setTimeout(updateOrthoDate, 900); });
/* Fecha de vuelo de la ortofoto PNOA en el centro del mapa (capa OI.MosaicElement del IGN) */
let odT, odKey = '';
async function updateOrthoDate() {
  const el = $('#orthoDate'); if (!el) return;
  if (!['pnoa', 'pnoaSolo'].includes(settings.base) || map.getZoom() < 11) { el.hidden = true; return; }
  const c = map.getCenter(), key = `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;
  if (key === odKey) return; odKey = key;
  try {
    const txt = await httpGetText(featureInfoUrl({ url: 'https://www.ign.es/wms-inspire/pnoa-ma', layers: 'OI.MosaicElement' }, c, 'text/html'));
    const info = parseOrthoInfo(txt);
    el.textContent = 'Ortofoto PNOA · ' + (info || 'fecha no disponible en esta zona');
  } catch (e) { el.textContent = 'Ortofoto PNOA · máxima actualidad'; }
  el.hidden = false;
}
function parseOrthoInfo(html) {
  const t = htmlToText(html || '');
  let m, date = '';
  if ((m = /(\d{4})[-/](\d{2})[-/](\d{2})/.exec(t))) date = `${m[3]}/${m[2]}/${m[1]}`;
  else if ((m = /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(t))) date = `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
  else if ((m = /(?:fecha|vuelo|a[ñn]o|date|year)[^\d]{0,20}((?:19|20)\d{2})/i.exec(t))) date = m[1];
  if (!date) return '';
  const r = /(?:resoluci[oó]n|resolution|gsd)[^\d]{0,15}(\d+(?:[.,]\d+)?)\s*(cm|m)?/i.exec(t);
  return 'vuelo ' + date + (r ? ` · ${r[1].replace('.', ',')} ${r[2] || 'm'}/píxel` : '');
}

const isFeatHidden = (rec, i) => !!(rec && rec.hiddenFeats && rec.hiddenFeats.includes(i));
async function setFeatHidden(rec, i, hide) {
  const s0 = new Set(rec.hiddenFeats || []); hide ? s0.add(i) : s0.delete(i);
  await updateLayer(rec.id, { hiddenFeats: [...s0].sort((a, b) => a - b) }); rebuildLayer(rec.id);
}
function buildKml(entry) {
  const { rec } = entry;
  const { feats } = parseKML(rec.text);
  const op = rec.opacity ?? 1;
  const group = L.featureGroup();
  feats.forEach((f, fi) => {
    if (isFeatHidden(rec, fi)) return; // elemento ocultado por el usuario
    const st = f.style, col = st.line || rec.color;
    f.parts.forEach(p => {
      let lyr;
      if (p.t === 'ln') lyr = L.polyline(p.c, { color: col, weight: Math.max(3, st.width || 3), opacity: (st.lineOp > 0.2 ? st.lineOp : 1) * op });
      else if (p.t === 'pg') lyr = L.polygon(p.holes ? [p.c, ...p.holes] : p.c, { color: col, weight: Math.max(2, st.width || 2), opacity: op, fillColor: st.fill || col, fillOpacity: st.noFill ? 0 : Math.min(st.fillOp ?? 0.2, 0.45) * op });
      else lyr = L.circleMarker(p.c[0], { radius: 7, color: '#fff', weight: 2, opacity: op, fillColor: st.icon || rec.color, fillOpacity: op });
      lyr.on('click', e => {
        L.DomEvent.stop(e);
        if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng);
        if (measure) return addMeasurePt(e.latlng);
        featureSheet(f, e.latlng, rec);
      });
      group.addLayer(lyr);
    });
  });
  entry.feats = feats; entry.group = group;
  entry.pkStep = pkStepOf(entry.rec);
  // marcas cada 10 m (o 5 m) para poder dibujar subcalibraciones al acercar el mapa
  entry.pkBase = entry.pkStep % 10 === 0 && entry.pkStep >= 20 ? 10 : entry.pkStep % 5 === 0 && entry.pkStep >= 10 ? 5 : entry.pkStep;
  entry.pk = feats.filter((f, i) => f.type === 'ln' && !isFeatHidden(rec, i)).flatMap(f => chainage(f, entry.pkBase));
}
function buildRaster(entry) {
  const r = entry.rec, common = { pane: 'rasters', opacity: r.opacity ?? 1, maxZoom: 21, attribution: r.attribution || '' };
  entry.tile = r.kind === 'wmts'
    ? tiles(r.url, { ...common, maxNativeZoom: r.maxNative || 19 })
    : new CachedWMS(r.url, { ...common, layers: r.layers, format: 'image/png', transparent: true, version: r.version || '1.1.1' });
  let errors = 0, warned = false;
  entry.tile.on('tileerror', () => {
    if (++errors >= 6 && !warned && navigator.onLine !== false) { warned = true; toast(`El servicio «${r.name}» no responde ahora mismo. Prueba más tarde o quita la capa.`, 6000); }
  });
  entry.tile.on('tileload', () => { errors = 0; });
}
function mapLayerOf(entry) { return entry.group || entry.tile || pointGroup(entry.rec.id); }

function registerLayer(rec) {
  const entry = { rec };
  const t = typeOf(rec);
  if (t === 'kml') buildKml(entry);
  else if (t === 'wms') buildRaster(entry);
  layers.set(rec.id, entry);
  if (rec.visible) mapLayerOf(entry).addTo(map);
  applyOrder();
  return entry;
}
function rebuildLayer(id) {
  const e = layers.get(id); if (!e) return;
  setTimeout(() => { drawPK(); drawActs(); drawWidths(); }, 0);
  if (e.group || e.tile) map.removeLayer(mapLayerOf(e));
  if (typeOf(e.rec) === 'kml') buildKml(e); else if (typeOf(e.rec) === 'wms') buildRaster(e);
  if (e.rec.visible) mapLayerOf(e).addTo(map);
  applyOrder();
}
function orderedLayers() { return [...layers.values()].filter(e => !isPointLayer(e.rec)).sort((a, b) => (b.rec.order || 0) - (a.rec.order || 0)); }
function applyOrder() {
  const asc = orderedLayers().reverse();
  let z = 1;
  asc.forEach(e => {
    if (e.tile) e.tile.setZIndex(z++);
    if (e.group && map.hasLayer(e.group)) e.group.eachLayer(l => l.bringToFront && l.bringToFront());
  });
}
async function setLayerVisible(id, on) {
  setTimeout(() => { drawPK(); drawActs(); drawWidths(); }, 0);
  if (id === 'acts') { settings.actsVisible = on; saveSettings(); drawActs(); return; }
  if (id === 'res') { settings.resVisible = on; saveSettings(); on ? resLayer.addTo(map) : map.removeLayer(resLayer); return; }
  if (id === 'notes') { settings.notesVisible = on; saveSettings(); on ? pointGroup('notes').addTo(map) : map.removeLayer(pointGroup('notes')); return; }
  const e = layers.get(id); if (!e) return;
  e.rec.visible = on;
  on ? mapLayerOf(e).addTo(map) : map.removeLayer(mapLayerOf(e));
  applyOrder();
  await DB.put('layers', e.rec);
}
async function moveLayer(id, dir) { return groupMove([id], dir); }
async function groupMove(ids, dir) {
  const list = orderedLayers(), sel = new Set(ids), n = list.length;
  if (dir < 0) { for (let i = 1; i < n; i++) if (sel.has(list[i].rec.id) && !sel.has(list[i - 1].rec.id)) [list[i - 1], list[i]] = [list[i], list[i - 1]]; }
  else { for (let i = n - 2; i >= 0; i--) if (sel.has(list[i].rec.id) && !sel.has(list[i + 1].rec.id)) [list[i + 1], list[i]] = [list[i], list[i + 1]]; }
  for (let i = 0; i < n; i++) { const r = list[i].rec, o = n - i; if (r.order !== o) { r.order = o; await DB.put('layers', r); } }
  applyOrder(); renderDrawer();
}
function layerBounds(id) {
  if (id === 'notes' || isPointLayer((layers.get(id) || {}).rec || {})) {
    const pts = [...notes.values()].filter(n => (n.layerId || 'notes') === id).map(n => [n.lat, n.lng]);
    return pts.length ? L.latLngBounds(pts) : null;
  }
  const e = layers.get(id);
  return e && e.group ? e.group.getBounds() : null;
}
function zoomToLayer(id) {
  const b = layerBounds(id);
  if (b && b.isValid()) map.fitBounds(b.pad(0.15), { maxZoom: 18 });
  else toast('Esta capa es un servicio de imagen: no tiene una extensión que encuadrar.');
}
// Actuaciones cuya capa ya no está: se conservan y se vuelven a enlazar al cargar otra vez la traza (por su nombre)
async function relinkOrphanActs(e) {
  if (!e || !e.feats || typeOf(e.rec) !== 'kml') return;
  const orphans = [...acts.values()].filter(a => !layers.has(a.layerId));
  const matches = orphans.map(a => ({ a, fi: e.feats.findIndex(f => f.type === 'ln' && f.name === a.traceName) })).filter(x => x.fi >= 0);
  if (!matches.length) return;
  const names = [...new Set(matches.map(x => x.a.traceName))].join(', ');
  if (!confirm(`Hay ${matches.length} actuaciones de «${names}» que se quedaron sin traza. ¿Enlazarlas a la capa «${e.rec.name}» que acabas de cargar?`)) return;
  const upd = matches.map(({ a, fi }) => { const f = e.feats[fi], d1 = Math.min(f.length, a.d1), d0 = Math.min(a.d0, d1);
    return { ...a, layerId: e.rec.id, layerName: e.rec.name, featIdx: fi, d0, d1, coords: segmentCoords(f, d0, d1), updated: Date.now() }; });
  try { await DB.putMany(upd.map(a => ['acts', a])); upd.forEach(a => acts.set(a.id, a)); drawActs(); toast(`${upd.length} actuaciones enlazadas de nuevo a su traza.`, 5000); }
  catch (err) { toast('No se pudieron enlazar: ' + (err.message || err), 6000); }
}
async function deleteLayer(id) {
  const e = layers.get(id); if (!e) return;
  const pts = [...notes.values()].filter(n => n.layerId === id);
  const nActs = [...acts.values()].filter(a => a.layerId === id).length;
  const extra = pts.length ? ` y sus ${pts.length} fotos` : '';
  if (!confirm(`¿Quitar la capa «${e.rec.name}»${extra} de la app?${nActs ? `\n\nSus ${nActs} actuaciones NO se borran: se quedan en la obra sin traza y se volverán a enlazar si vuelves a cargar ese KML.` : ''}`)) return;
  map.removeLayer(mapLayerOf(e));
  for (const n of pts) { await DB.del('notes', n.id); notes.delete(n.id); noteMarkers.delete(n.id); }
  pointGroups.delete(id);
  layers.delete(id); await DB.del('layers', id); drawPK(); drawActs();
  renderDrawer(); toast('Capa eliminada');
}
async function updateLayer(id, changes) {
  const e = layers.get(id); if (!e) return;
  Object.assign(e.rec, changes);
  await DB.put('layers', e.rec);
}

function featureSheet(f, ll, rec) {
  const kind = f.type === 'ln' ? 'Traza · ' + fmtLen(f.length) : f.type === 'pg' ? `Polígono · superficie ${fmtArea(f.area || 0)}${(f.area || 0) >= 10000 ? '' : ` (${String(Math.round((f.area || 0) / 100) / 100).replace('.', ',')} ha)`} · perímetro ${fmtLen(f.length)}` : 'Punto';
  let acts = '';
  if (f.type === 'ln') {
    acts += goBtn(f.start[0], f.start[1], 'Ir al inicio') + goBtn(f.end[0], f.end[1], 'Ir al final');
    acts += goBtn(ll.lat, ll.lng, 'Ir al punto tocado', 'full');
  } else if (f.type === 'pg') {
    acts += goBtn(f.start[0], f.start[1], 'Ir al centro') + goBtn(ll.lat, ll.lng, 'Ir al punto tocado');
  } else {
    acts += goBtn(f.start[0], f.start[1], 'Llévame aquí', 'full');
  }
  const noteAt = f.type === 'pt' ? { lat: f.start[0], lng: f.start[1] } : ll;
  acts += `<button class="btn" data-a="note">${ICON.note}Anotar aquí</button><button class="btn" data-a="fit">Encuadrar</button>`;
  if (f.type === 'ln') acts += `<button class="btn pri" data-a="slope">${ICON.slope}Pendiente</button><button class="btn" data-a="slclass">${ICON.slope}Tramificar pendientes</button><button class="btn pri" data-a="width">${ICON.width}Anchos</button><button class="btn go full" data-a="ficha">${ICON.note}Ficha de inspección de campo</button>`;
  acts += `<button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button><button class="btn" data-a="measure">${ICON.ruler}Medir desde aquí</button>`;
  if (f.type === 'ln') acts += `<button class="btn" data-a="reverse">${ICON.swap}Invertir sentido</button>`;
  acts += `<button class="btn" data-a="props">${ICON.info}Propiedades de la capa</button><button class="btn" data-a="hidef">${ICON.eyeOff || ''}Ocultar este elemento</button><button class="btn" data-a="hidel">Ocultar la capa</button>`;

  let coords = '';
  const pkTap = f.type === 'ln' ? pkAt(f, ll) : null;
  const fiw = layers.get(rec.id).feats.indexOf(f);
  let wq = '';
  if (f.type === 'ln') {
    const wHere = roadWidthAt(rec, fiw, pkTap.d, pkTap.d), wd = rec.widths && rec.widths[fiw], wsg = wd ? widthSegments(wd, f) : [], wst = wsg.length ? widthStats(wsg) : null;
    wq = `<div class="wquick"><div><b>Ancho en este punto:</b> ${wHere ? fmtW(wHere) : 'sin dato'}${wst ? ` · ancho medio de la traza ${fmtW(wst.mean)}` : ''}</div>
      <div class="field row"><input type="text" id="wqV" inputmode="decimal" placeholder="Ancho aquí (m)"><button class="mini pri" data-a="wq">Guardar en PK ${fmtPK(pkTap.d)}</button></div>
      <div class="field row"><input type="text" id="goPk" inputmode="decimal" placeholder="Ir a PK (p. ej. 1+250)"><button class="mini" data-a="gopk">Ver PK</button></div><div id="goPkRes"></div></div>`;
  }
  if (f.type === 'ln') coords = `<div class="coords"><b>PK del punto tocado</b> ${fmtPK(pkTap.d)} de ${fmtPK(f.length)}<br><b>Inicio</b> ${fmtLL(...f.start)}${distFromMe(...f.start)}<br>${fmtUTM(...f.start)}<br><b>Final</b>&nbsp; ${fmtLL(...f.end)}${distFromMe(...f.end)}<br>${fmtUTM(...f.end)}</div>`;
  else coords = coordsBlock(f.start[0], f.start[1]);
  const attrs = f.attrs.length ? `<table class="attrs">${f.attrs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : '';

  const b = openSheet(`<h2>${esc(f.name)}</h2><p class="sub">${esc(kind)} · ${esc(rec.name)}${f.folder ? ' › ' + esc(f.folder) : ''}</p>
    ${f.type === 'ln' ? `<div class="acts"><button class="btn go full" data-a="newact">${ICON.road}Nueva actuación aquí (PK ${fmtPK(pkTap.d)})</button></div>` : ''}
    ${coords}${wq}${f.desc ? `<div class="desc">${esc(f.desc)}</div>` : ''}${attrs}<div class="acts">${acts}</div>`);
  highlight.clearLayers();
  f.parts.forEach(p => {
    if (p.t === 'pt') L.circleMarker(p.c[0], { renderer: hlRenderer, radius: 12, color: '#fff', weight: 3, fill: false, interactive: false }).addTo(highlight);
    else L.polyline(p.t === 'pg' ? [...p.c, p.c[0]] : p.c, { renderer: hlRenderer, color: '#fff', weight: 8, opacity: 0.55, interactive: false }).addTo(highlight);
  });
  if (f.type === 'ln') {
    L.circleMarker(f.start, { renderer: hlRenderer, radius: 8, color: '#0b6e4f', weight: 4, fillColor: '#fff', fillOpacity: 1, interactive: false }).bindTooltip('Inicio', { permanent: true, direction: 'top', offset: [0, -8] }).addTo(highlight);
    L.circleMarker(f.end, { renderer: hlRenderer, radius: 8, color: '#fff', weight: 3, fillColor: '#e8590c', fillOpacity: 1, interactive: false }).bindTooltip('Final', { permanent: true, direction: 'top', offset: [0, -8] }).addTo(highlight);
  }
  onSheetClose(() => highlight.clearLayers());
  b.querySelector('[data-a=note]').onclick = () => openEditor({ lat: noteAt.lat, lng: noteAt.lng, src: 'mapa', title: f.name });
  b.querySelector('[data-a=fit]').onclick = () => map.fitBounds(L.featureGroup(highlight.getLayers()).getBounds().pad(0.2), { maxZoom: 18 });
  b.querySelector('[data-a=copy]').onclick = () => copyText(f.type === 'ln' ? `Inicio: ${fmtLL(...f.start)}\nFinal: ${fmtLL(...f.end)}` : fmtLL(f.start[0], f.start[1]));
  b.querySelector('[data-a=measure]').onclick = () => { closeSheet(); startMeasure(ll); };
  const sl = b.querySelector('[data-a=slope]');
  if (sl) sl.onclick = () => slopeSheet(f, rec, 0, f.length);
  const sc = b.querySelector('[data-a=slclass]');
  if (sc) sc.onclick = () => { slopeScrollToClass = true; slopeSheet(f, rec, 0, f.length, { autorun: true }); };
  const wb = b.querySelector('[data-a=width]');
  if (wb) wb.onclick = () => widthSheet(rec, f);
  const na = b.querySelector('[data-a=newact]');
  if (na) na.onclick = () => { const d = pkAt(f, ll).d; openActEditor({ rec, f, d0: d, d1: d }); };
  const rv = b.querySelector('[data-a=reverse]');
  if (rv) rv.onclick = () => reverseTrace(rec, f);
  const fb = b.querySelector('[data-a=ficha]');
  if (fb) fb.onclick = () => fichaForTrace(rec, f);
  b.querySelector('[data-a=props]').onclick = () => layerProps(rec.id);
  b.querySelector('[data-a=hidef]').onclick = async () => { await setFeatHidden(rec, fiw, true); closeSheet(); toast(`«${f.name}» oculto. Para verlo otra vez: Capas → opciones de «${rec.name}» → Mostrar ocultos.`, 6000); };
  b.querySelector('[data-a=hidel]').onclick = async () => { await setLayerVisible(rec.id, false); if (!$('#drawer').hidden) renderDrawer(); closeSheet(); toast(`Capa «${rec.name}» oculta. Vuelve a marcarla en Capas para verla.`, 5000); };
  const wqb = b.querySelector('[data-a=wq]');
  if (wqb) wqb.onclick = async () => {
    const v = parseNum($('#wqV').value); if (!(v > 0 && v < 100)) { toast('Escribe el ancho en metros, por ejemplo 4,20.'); return; }
    rec.widths = rec.widths || {};
    const data = rec.widths[fiw] || { mode: 'changes', interval: 20, points: [] }, d = Math.round(pkTap.d * 100) / 100;
    data.points = (data.points || []).filter(q => Math.abs(q.d - d) > 1).concat([{ d, w: v }]).sort((x, y) => x.d - y.d);
    if (data.mode === 'changes' && data.points[0].d > 0.5 && data.points.length === 1) toast('Con un solo dato, ese ancho se aplica desde este PK hasta el final. Añade más anchos en otros puntos.', 6000);
    data.updated = Date.now(); rec.widths[fiw] = data;
    await updateLayer(rec.id, { widths: rec.widths }); drawWidths();
    toast(`Ancho de ${fmtW(v)} guardado en el PK ${fmtPK(d)}`); featureSheet(f, ll, rec);
  };
  const gpi = b.querySelector('#goPk'); if (gpi) gpi.onkeydown = ev => { if (ev.key === 'Enter') b.querySelector('[data-a=gopk]').click(); };
  const wqi = b.querySelector('#wqV'); if (wqi) wqi.onkeydown = ev => { if (ev.key === 'Enter') b.querySelector('[data-a=wq]').click(); };
  const gpb = b.querySelector('[data-a=gopk]');
  if (gpb) gpb.onclick = () => {
    const d = parsePK($('#goPk').value); if (!isFinite(d) || d < 0 || d > f.length + 0.5) { toast(`Escribe un PK entre 0+000 y ${fmtPK(f.length)}.`); return; }
    const q = pointAtPK(f, Math.min(d, f.length)); map.setView([q.lat, q.lng], Math.max(map.getZoom(), 17));
    L.circleMarker([q.lat, q.lng], { renderer: hlRenderer, radius: 10, color: '#fff', weight: 3, fillColor: '#e8590c', fillOpacity: 1, interactive: false }).bindTooltip('PK ' + fmtPK(d), { permanent: true, direction: 'top', offset: [0, -10] }).addTo(highlight);
    $('#goPkRes').innerHTML = `<div class="acts">${goBtn(q.lat, q.lng, 'Llévame al PK ' + fmtPK(d), 'full')}</div>`;
  };
}
