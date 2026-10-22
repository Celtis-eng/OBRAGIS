'use strict';
/* Campo KML — visor de KML/KMZ sobre ortofoto con anotaciones georreferenciadas
   (fotos, vídeos, notas de voz y texto) y navegación con Google Maps. */

const $ = (s, r = document) => r.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  locate: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  photo: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
  audio: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  nav: '<svg viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ruler: '<svg viewBox="0 0 24 24"><path d="M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
  gallery: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>',
};

/* ---------------- Almacenamiento local (IndexedDB) ---------------- */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('campo-kml', 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore('layers', { keyPath: 'id' });
      d.createObjectStore('notes', { keyPath: 'id' });
      d.createObjectStore('kv');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  async function tx(store, mode, fn) {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Operación cancelada'));
    });
  }
  return {
    all: s => tx(s, 'readonly', st => st.getAll()),
    get: (s, k) => tx(s, 'readonly', st => st.get(k)),
    put: (s, v, k) => tx(s, 'readwrite', st => (k === undefined ? st.put(v) : st.put(v, k))),
    del: (s, k) => tx(s, 'readwrite', st => st.delete(k)),
  };
})();

const settings = { base: 'pnoa', catastro: false, googleKey: '', travel: 'driving', stamp: true, view: null };
const saveSettings = () => DB.put('kv', { ...settings }, 'settings').catch(() => {});

/* ---------------- Utilidades geográficas ---------------- */
const fmtLen = m => (m >= 1000 ? (m / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(m) + ' m');
const fmtLL = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
const fmtDate = t => new Date(t).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const thousands = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function toUTM(lat, lon) { // WGS84 ≈ ETRS89 (diferencia submétrica)
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const zone = Math.floor((lon + 180) / 6) + 1;
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const p = lat * Math.PI / 180, l = lon * Math.PI / 180, l0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(p) ** 2), T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = Math.cos(p) * (l - l0);
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
  const x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
  let y = k0 * (M + N * Math.tan(p) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  if (lat < 0) y += 10000000;
  return { zone, x, y };
}
const fmtUTM = (lat, lng) => { const u = toUTM(lat, lng); return `UTM ETRS89 H${u.zone}  X ${thousands(u.x)}  Y ${thousands(u.y)}`; };
const coordsBlock = (lat, lng) => `<div class="coords">${fmtLL(lat, lng)}<br>${fmtUTM(lat, lng)}</div>`;

const navUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}&travelmode=${settings.travel}`;
const viewUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
const goBtn = (lat, lng, label, extra = '') => `<a class="btn go ${extra}" href="${navUrl(lat, lng)}" target="_blank" rel="noopener">${ICON.nav}${esc(label)}</a>`;
function distFromMe(lat, lng) {
  if (!lastPos) return '';
  return ` · a ${fmtLen(L.latLng(lastPos.lat, lastPos.lng).distanceTo([lat, lng]))} de ti`;
}

/* ---------------- Interfaz: aviso, hoja inferior, panel ---------------- */
let toastT;
function toast(msg, ms = 3500) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms);
}

let sheetCleanup = [], pendingUrls = [];
function openSheet(html, cls = '') {
  const urls = pendingUrls; pendingUrls = [];
  closeSheet();
  urls.forEach(u => sheetCleanup.push(() => URL.revokeObjectURL(u)));
  const b = $('#sheetBody'); b.className = cls; b.innerHTML = html;
  $('#sheet').hidden = false; $('#sheet').scrollTop = 0;
  return b;
}
function onSheetClose(fn) { sheetCleanup.push(fn); }
function closeSheet() {
  const fns = sheetCleanup; sheetCleanup = [];
  fns.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  $('#sheet').hidden = true; $('#sheetBody').innerHTML = '';
}
const objectUrl = blob => { const u = URL.createObjectURL(blob); pendingUrls.push(u); return u; };

function copyText(text) {
  const done = () => toast('Copiado: ' + text.split('\n')[0]);
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast(text, 6000));
  else toast(text, 6000);
}

/* ---------------- Mapa y capas base ---------------- */
const map = L.map('map', { zoomControl: false, renderer: L.canvas({ tolerance: 12 }), maxZoom: 21 }).setView([37.18, -3.6], 9);
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

const ign = (svc, layer, fmt) => `https://www.ign.es/wmts/${svc}?service=WMTS&request=GetTile&version=1.0.0&layer=${layer}&style=default&tilematrixset=GoogleMapsCompatible&tilematrix={z}&tilerow={y}&tilecol={x}&format=${fmt}`;
const URL_PNOA = ign('pnoa-ma', 'OI.OrthoimageCoverage', 'image/jpeg');
const URL_LABELS = ign('ign-base', 'IGNBaseOrto', 'image/png');
const ATTR_IGN = 'PNOA y Base IGN CC-BY 4.0 <a href="https://www.scne.es" target="_blank" rel="noopener">scne.es</a>';
const pnoaTiles = () => L.tileLayer(URL_PNOA, { maxNativeZoom: 19, maxZoom: 21, attribution: ATTR_IGN });

const BASES = {
  pnoa: { name: 'Ortofoto PNOA híbrida (IGN)', make: () => L.layerGroup([pnoaTiles(), L.tileLayer(URL_LABELS, { maxNativeZoom: 18, maxZoom: 21 })]) },
  google: { name: 'Google híbrido (con clave)', make: makeGoogle },
  pnoaSolo: { name: 'Ortofoto PNOA sin rótulos', make: pnoaTiles },
  osm: { name: 'Callejero OpenStreetMap', make: () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 21, maxNativeZoom: 19, attribution: '© OpenStreetMap' }) },
};

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
  settings.base = id; saveSettings();
  if (!$('#drawer').hidden) renderDrawer();
}

const catastro = L.tileLayer.wms('https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx', {
  layers: 'Catastro', format: 'image/png', transparent: true, version: '1.1.1', zIndex: 5, maxZoom: 21, attribution: '© D. G. del Catastro',
});
function setCatastro(on) { settings.catastro = on; saveSettings(); on ? catastro.addTo(map) : map.removeLayer(catastro); }

/* ---------------- Lectura de KML ---------------- */
const byTag = (el, tag) => Array.from(el.getElementsByTagNameNS('*', tag));
const childText = (el, tag) => { const n = Array.from(el.children).find(c => c.localName === tag); return n ? n.textContent.trim() : ''; };
const firstText = (el, tag) => { const n = byTag(el, tag)[0]; return n ? n.textContent.trim() : ''; };
const parseCoords = t => (t || '').trim().split(/\s+/).map(s => s.split(',').map(Number))
  .filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1])).map(a => [a[1], a[0]]); // → [lat, lng]

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
    byTag(pm, 'Polygon').forEach(g => { const r = byTag(g, 'outerBoundaryIs')[0] || g; const c = parseCoords(firstText(r, 'coordinates')); if (c.length > 2) parts.push({ t: 'pg', c }); });
    byTag(pm, 'Track').forEach(g => {
      const c = byTag(g, 'coord').map(n => n.textContent.trim().split(/\s+/).map(Number)).filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1])).map(a => [a[1], a[0]]);
      if (c.length > 1) parts.push({ t: 'ln', c });
    });
    if (!parts.length) return;
    const inline = Array.from(pm.children).find(c => c.localName === 'Style');
    const style = Object.assign({}, styles[(childText(pm, 'styleUrl') || '').replace(/^.*#/, '#')] || {}, inline ? readStyle(inline) : {});
    const attrs = [];
    byTag(pm, 'Data').forEach(d => attrs.push([d.getAttribute('displayName') || d.getAttribute('name') || '', firstText(d, 'value')]));
    byTag(pm, 'SimpleData').forEach(d => attrs.push([d.getAttribute('name') || '', d.textContent.trim()]));
    const lines = parts.filter(p => p.t === 'ln');
    const type = lines.length ? 'ln' : parts.some(p => p.t === 'pg') ? 'pg' : 'pt';
    const f = { name: childText(pm, 'name') || 'Elemento ' + (i + 1), folder: folderPath(pm), desc: htmlToText(childText(pm, 'description')), attrs, parts, type, style };
    if (type === 'ln') { f.start = lines[0].c[0]; const last = lines[lines.length - 1].c; f.end = last[last.length - 1]; f.length = lines.reduce((s, l) => s + lineLength(l.c), 0); }
    else if (type === 'pg') { const c = parts.find(p => p.t === 'pg').c; f.start = centroid(c); f.length = lineLength(c); }
    else f.start = parts[0].c[0];
    out.push(f);
  });
  return { docName, feats: out };
}

/* ---------------- Capas KML en el mapa ---------------- */
const PALETTE = ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#f783ac', '#ffa94d', '#b197fc', '#3bc9db'];
const kml = new Map(); // id → { rec, feats, group }
const highlight = L.layerGroup().addTo(map);

function renderKml(rec) {
  const { feats } = parseKML(rec.text);
  const group = L.featureGroup();
  feats.forEach(f => {
    const st = f.style;
    const col = st.line || rec.color;
    f.parts.forEach(p => {
      let lyr;
      if (p.t === 'ln') lyr = L.polyline(p.c, { color: col, weight: Math.max(3, st.width || 3), opacity: st.lineOp > 0.2 ? st.lineOp : 1 });
      else if (p.t === 'pg') lyr = L.polygon(p.c, { color: col, weight: Math.max(2, st.width || 2), fillColor: st.fill || col, fillOpacity: st.noFill ? 0 : Math.min(st.fillOp ?? 0.2, 0.45) });
      else lyr = L.circleMarker(p.c[0], { radius: 7, color: '#fff', weight: 2, fillColor: st.icon || rec.color, fillOpacity: 1 });
      lyr.on('click', e => {
        L.DomEvent.stop(e);
        if (measure) return addMeasurePt(e.latlng);
        featureSheet(f, e.latlng, rec);
      });
      group.addLayer(lyr);
    });
  });
  const entry = { rec, feats, group };
  kml.set(rec.id, entry);
  if (rec.visible) group.addTo(map);
  return entry;
}

function featureSheet(f, ll, rec) {

  const kind = f.type === 'ln' ? 'Traza · ' + fmtLen(f.length) : f.type === 'pg' ? 'Polígono · perímetro ' + fmtLen(f.length) : 'Punto';
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
  acts += `<button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button><button class="btn" data-a="measure">${ICON.ruler}Medir desde aquí</button>`;

  let coords = '';
  if (f.type === 'ln') coords = `<div class="coords"><b>Inicio</b> ${fmtLL(...f.start)}${distFromMe(...f.start)}<br>${fmtUTM(...f.start)}<br><b>Final</b>&nbsp; ${fmtLL(...f.end)}${distFromMe(...f.end)}<br>${fmtUTM(...f.end)}</div>`;
  else coords = coordsBlock(f.start[0], f.start[1]);
  const attrs = f.attrs.length ? `<table class="attrs">${f.attrs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : '';

  const b = openSheet(`<h2>${esc(f.name)}</h2><p class="sub">${esc(kind)} · ${esc(rec.name)}${f.folder ? ' › ' + esc(f.folder) : ''}</p>
    ${coords}${f.desc ? `<div class="desc">${esc(f.desc)}</div>` : ''}${attrs}<div class="acts">${acts}</div>`);
  highlight.clearLayers();
  f.parts.forEach(p => {
    if (p.t === 'pt') L.circleMarker(p.c[0], { radius: 12, color: '#fff', weight: 3, fill: false, interactive: false }).addTo(highlight);
    else L.polyline(p.t === 'pg' ? [...p.c, p.c[0]] : p.c, { color: '#fff', weight: 8, opacity: 0.55, interactive: false }).addTo(highlight);
  });
  if (f.type === 'ln') {
    L.circleMarker(f.start, { radius: 8, color: '#0b6e4f', weight: 4, fillColor: '#fff', fillOpacity: 1, interactive: false }).bindTooltip('Inicio', { permanent: true, direction: 'top', offset: [0, -8] }).addTo(highlight);
    L.circleMarker(f.end, { radius: 8, color: '#fff', weight: 3, fillColor: '#e8590c', fillOpacity: 1, interactive: false }).bindTooltip('Final', { permanent: true, direction: 'top', offset: [0, -8] }).addTo(highlight);
  }
  onSheetClose(() => highlight.clearLayers());
  b.querySelector('[data-a=note]').onclick = () => openEditor({ lat: noteAt.lat, lng: noteAt.lng, src: 'mapa', title: f.name });
  b.querySelector('[data-a=fit]').onclick = () => map.fitBounds(L.featureGroup(highlight.getLayers()).getBounds().pad(0.2), { maxZoom: 18 });
  b.querySelector('[data-a=copy]').onclick = () => copyText(f.type === 'ln' ? `Inicio: ${fmtLL(...f.start)}\nFinal: ${fmtLL(...f.end)}` : fmtLL(f.start[0], f.start[1]));
  b.querySelector('[data-a=measure]').onclick = () => { closeSheet(); startMeasure(ll); };
}

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
      const rec = { id: uid(), name: file.name.replace(/\.km[lz]$/i, '') || docName || 'Capa', text, color: PALETTE[kml.size % PALETTE.length], visible: true, created: Date.now() };
      await DB.put('layers', rec);
      last = renderKml(rec);
      toast(`${rec.name}: ${feats.length} elementos cargados`);
    } catch (e) { toast(e.message || 'No se pudo leer ' + file.name, 6000); }
  }
  if (last) map.fitBounds(last.group.getBounds().pad(0.1), { maxZoom: 18 });
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
  if (measure) return addMeasurePt(ll);
  const cross = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="cross"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }), interactive: false }).addTo(map);
  const b = openSheet(`<h2>Punto seleccionado</h2><p class="sub">Pulsación larga${distFromMe(ll.lat, ll.lng)}</p>
    ${coordsBlock(ll.lat, ll.lng)}
    <div class="acts">
      ${goBtn(ll.lat, ll.lng, 'Llévame aquí', 'full')}
      <button class="btn" data-a="note">${ICON.note}Añadir anotación</button>
      <button class="btn" data-a="photo">${ICON.photo}Foto en este punto</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button>
      <button class="btn" data-a="measure">${ICON.ruler}Medir desde aquí</button>
      <a class="btn full" href="${viewUrl(ll.lat, ll.lng)}" target="_blank" rel="noopener">Ver en Google Maps</a>
    </div>`);
  onSheetClose(() => map.removeLayer(cross));
  b.querySelector('[data-a=note]').onclick = () => openEditor({ lat: ll.lat, lng: ll.lng, src: 'mapa' });
  b.querySelector('[data-a=photo]').onclick = () => { const at = { lat: ll.lat, lng: ll.lng, src: 'mapa' }; capture('inPhoto', files => { openEditor(at, true); addMedia(files); }); };
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${fmtLL(ll.lat, ll.lng)}\n${fmtUTM(ll.lat, ll.lng)}`);
  b.querySelector('[data-a=measure]').onclick = () => { closeSheet(); startMeasure(ll); };
}

/* ---------------- GPS ---------------- */
let lastPos = null, watchId = null, wantCenter = false, meMarker = null, meCircle = null;
function geoErr(e) {
  return e.code === 1 ? 'Sin permiso de ubicación. Actívalo en los ajustes del navegador para esta app.'
    : e.code === 3 ? 'El GPS tarda en responder. Prueba al aire libre.' : 'No se pudo obtener la posición.';
}
function onPos(p) {
  lastPos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
  const ll = [lastPos.lat, lastPos.lng];
  if (!meMarker) {
    meCircle = L.circle(ll, { radius: lastPos.acc, color: '#1c7ed6', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(map);
    meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
  } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(lastPos.acc); }
  const f = $('#fabLocate'); f.classList.remove('wait'); f.classList.add('on');
  if (wantCenter) { wantCenter = false; map.setView(ll, Math.max(map.getZoom(), 17)); }
}
function startWatch() {
  if (!navigator.geolocation) { toast('Este dispositivo no ofrece posición GPS.'); return false; }
  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(onPos, e => { $('#fabLocate').classList.remove('wait'); toast(geoErr(e), 6000); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
  }
  return true;
}
function locate() {
  if (!startWatch()) return;
  if (lastPos && Date.now() - lastPos.t < 60000) map.setView([lastPos.lat, lastPos.lng], Math.max(map.getZoom(), 17));
  else { wantCenter = true; $('#fabLocate').classList.add('wait'); }
}
function getPos() {
  if (lastPos && Date.now() - lastPos.t < 20000) return Promise.resolve(lastPos);
  if (!navigator.geolocation) return Promise.reject(new Error('Sin GPS'));
  startWatch();
  return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(p => { onPos(p); res(lastPos); }, rej,
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }));
}

/* ---------------- Captura de fotos, vídeo y audio ---------------- */
let captureCb = null;
function capture(inputId, cb) { captureCb = cb; const i = $('#' + inputId); i.value = ''; i.click(); }
['inPhoto', 'inVideo', 'inGallery'].forEach(id => $('#' + id).addEventListener('change', e => {
  const files = Array.from(e.target.files || []); const cb = captureCb; captureCb = null;
  if (files.length && cb) cb(files);
}));

async function processImage(file, at) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const s = Math.min(1, 2560 / Math.max(bmp.width, bmp.height));
    if (s === 1 && file.size < 2.5e6 && !settings.stamp) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    const g = c.getContext('2d'); g.drawImage(bmp, 0, 0, c.width, c.height);
    if (settings.stamp && at) {
      const fs = Math.max(14, Math.round(c.width / 55)), pad = Math.round(fs * 0.6);
      const lines = [fmtDate(Date.now()), fmtLL(at.lat, at.lng) + (at.acc ? ` ±${Math.round(at.acc)} m` : ''), fmtUTM(at.lat, at.lng)];
      const h = lines.length * fs * 1.3 + pad * 2;
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, c.height - h, c.width, h);
      g.fillStyle = '#fff'; g.font = `600 ${fs}px system-ui, sans-serif`; g.textBaseline = 'top';
      lines.forEach((t, i) => g.fillText(t, pad, c.height - h + pad + i * fs * 1.3));
    }
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.85));
  } catch (e) { return file; }
}

/* ---------------- Anotaciones ---------------- */
const notes = new Map();       // id → nota
const noteMarkers = new Map(); // id → marcador
const notesLayer = L.layerGroup().addTo(map);
const noteType = n => (n.media && n.media[0] ? n.media[0].kind : 'note');
const pinIcon = type => L.divIcon({ className: '', html: `<div class="pin ${type}"><span></span>${ICON[type] || ICON.note}</div>`, iconSize: [34, 42], iconAnchor: [17, 40] });

function drawNote(n) {
  let m = noteMarkers.get(n.id);
  if (!m) {
    m = L.marker([n.lat, n.lng], { icon: pinIcon(noteType(n)) }).addTo(notesLayer);
    m.on('click', e => { L.DomEvent.stop(e); if (measure) return addMeasurePt(e.latlng); viewNote(n.id); });
    noteMarkers.set(n.id, m);
  } else { m.setLatLng([n.lat, n.lng]).setIcon(pinIcon(noteType(n))); }
}

let draft = null, draftMarker = null, recorder = null, recTimer = null;
function openEditor(at, keepCapture = false) {
  const existing = at.note;
  draft = existing ? { ...existing, media: [...(existing.media || [])] }
    : { id: uid(), lat: at.lat, lng: at.lng, acc: at.acc || null, src: at.src || 'gps', title: at.title || '', text: '', media: [], created: Date.now() };
  renderEditor();
}
function syncDraft() {
  if (!draft) return;
  const t = $('#nTitle'), x = $('#nText');
  if (t) draft.title = t.value; if (x) draft.text = x.value;
}
function mediaHtml(list, editable) {
  return list.map((m, i) => {
    const u = objectUrl(m.blob);
    const rm = editable ? `<button class="rm" data-rm="${i}" aria-label="Quitar">${ICON.close}</button>` : '';
    if (m.kind === 'photo') return `<div class="m">${editable ? `<img src="${u}" alt="">` : `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="Foto"></a>`}${rm}</div>`;
    if (m.kind === 'video') return `<div class="m"><video src="${u}" ${editable ? 'muted' : 'controls'} playsinline preload="metadata"></video>${rm}</div>`;
    return `<div class="m aud"><audio src="${u}" controls preload="metadata"></audio>${rm}</div>`;
  }).join('');
}
function renderEditor() {
  const d = draft; if (!d) return;
  const isNew = !notes.has(d.id);
  const keepDraft = draft;
  const b = openSheet(`<h2>${isNew ? 'Nueva anotación' : 'Editar anotación'}</h2>
    <div class="loc"><span>${fmtLL(d.lat, d.lng)}${d.acc ? ' · ±' + Math.round(d.acc) + ' m' : ''} · ${d.src === 'gps' ? 'posición GPS' : 'punto del mapa'}</span>
      <button class="mini" data-a="gps">Usar mi posición</button></div>
    <p class="hint">Puedes arrastrar el marcador amarillo para corregir la posición.</p>
    <div class="field"><input type="text" id="nTitle" placeholder="Título (p. ej. Fuga en hidrante H-12)" value="${esc(d.title)}"></div>
    <div class="field"><textarea id="nText" rows="3" placeholder="Descripción u observaciones">${esc(d.text)}</textarea></div>
    <div class="media">${mediaHtml(d.media, true)}</div>
    <div class="acts">
      <button class="btn" data-a="photo">${ICON.photo}Foto</button>
      <button class="btn" data-a="video">${ICON.video}Vídeo</button>
      <button class="btn ${recorder ? 'rec' : ''}" data-a="audio">${ICON.audio}<span id="recLbl">${recorder ? 'Detener' : 'Nota de voz'}</span></button>
      <button class="btn" data-a="gallery">${ICON.gallery}De la galería</button>
      <button class="btn pri full" data-a="save">Guardar</button>
      ${isNew ? '' : '<button class="btn del full" data-a="delete">Eliminar anotación</button>'}
    </div>`);
  draft = keepDraft;

  if (!draftMarker) {
    draftMarker = L.marker([d.lat, d.lng], { icon: pinIcon('draft'), draggable: true, zIndexOffset: 2000 }).addTo(map);
    draftMarker.on('dragend', () => { syncDraft(); const ll = draftMarker.getLatLng(); draft.lat = ll.lat; draft.lng = ll.lng; draft.src = 'mapa'; draft.acc = null; renderEditor(); });
  } else draftMarker.setLatLng([d.lat, d.lng]);
  const m = noteMarkers.get(d.id); if (m) m.setOpacity(0.3);
  onSheetClose(() => {
    // si el cierre no viene de otro renderEditor, se descarta el borrador
    setTimeout(() => {
      if ($('#sheet').hidden || !$('#nTitle')) {
        if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; recorder.stop(); recorder.stream.getTracks().forEach(t => t.stop()); recorder = null; clearInterval(recTimer); }
        if (draftMarker) { map.removeLayer(draftMarker); draftMarker = null; }
        const mk = noteMarkers.get(d.id); if (mk) mk.setOpacity(1);
        draft = null;
      }
    }, 0);
  });

  b.querySelectorAll('[data-rm]').forEach(el => el.onclick = () => { syncDraft(); draft.media.splice(+el.dataset.rm, 1); renderEditor(); });
  b.querySelector('[data-a=gps]').onclick = async () => {
    syncDraft(); toast('Obteniendo posición GPS…');
    try { const p = await getPos(); Object.assign(draft, { lat: p.lat, lng: p.lng, acc: p.acc, src: 'gps' }); renderEditor(); }
    catch (e) { toast(geoErr(e), 6000); }
  };
  b.querySelector('[data-a=photo]').onclick = () => { syncDraft(); capture('inPhoto', addMedia); };
  b.querySelector('[data-a=video]').onclick = () => { syncDraft(); capture('inVideo', addMedia); };
  b.querySelector('[data-a=gallery]').onclick = () => { syncDraft(); capture('inGallery', addMedia); };
  b.querySelector('[data-a=audio]').onclick = toggleRecord;
  b.querySelector('[data-a=save]').onclick = saveDraft;
  const del = b.querySelector('[data-a=delete]');
  if (del) del.onclick = () => deleteNote(d.id);
}
async function addMedia(files) {
  if (!draft) return;
  syncDraft();
  for (const f of files) {
    const kind = f.type.startsWith('image/') ? 'photo' : f.type.startsWith('video/') ? 'video' : f.type.startsWith('audio/') ? 'audio' : null;
    if (!kind) { toast(f.name + ': tipo de archivo no admitido'); continue; }
    const blob = kind === 'photo' ? await processImage(f, draft) : f;
    draft.media.push({ id: uid(), kind, blob, mime: blob.type || f.type, t: Date.now() });
  }
  renderEditor();
}
async function toggleRecord() {
  if (recorder) { recorder.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Este navegador no permite grabar audio.'); return; }
  syncDraft();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { toast('Sin permiso para usar el micrófono.', 5000); return; }
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || '';
  const chunks = [];
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  rec.stream = stream;
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    stream.getTracks().forEach(t => t.stop()); clearInterval(recTimer); recorder = null;
    if (!draft) return;
    syncDraft();
    const type = rec.mimeType || mime || 'audio/webm';
    draft.media.push({ id: uid(), kind: 'audio', blob: new Blob(chunks, { type }), mime: type, t: Date.now() });
    renderEditor();
  };
  rec.start(); recorder = rec;
  const t0 = Date.now();
  renderEditor();
  recTimer = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000), l = $('#recLbl');
    if (l) l.textContent = `Detener ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);
}
async function saveDraft() {
  if (recorder) { toast('Detén la grabación antes de guardar.'); return; }
  syncDraft();
  const n = draft;
  if (!n.title.trim()) {
    const label = { photo: 'Foto', video: 'Vídeo', audio: 'Nota de voz', note: 'Anotación' }[noteType(n)];
    n.title = `${label} ${fmtDate(n.created)}`;
  }
  n.updated = Date.now();
  try { await DB.put('notes', n); }
  catch (e) { toast('No se pudo guardar: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  notes.set(n.id, n); drawNote(n);
  closeSheet(); toast('Anotación guardada');
  if (!$('#drawer').hidden) renderDrawer();
}
async function deleteNote(id) {
  if (!confirm('¿Eliminar esta anotación y sus archivos? No se puede deshacer.')) return;
  await DB.del('notes', id);
  notes.delete(id);
  const m = noteMarkers.get(id); if (m) { notesLayer.removeLayer(m); noteMarkers.delete(id); }
  closeSheet(); toast('Anotación eliminada');
  if (!$('#drawer').hidden) renderDrawer();
}
function viewNote(id) {
  const n = notes.get(id); if (!n) return;
  const b = openSheet(`<h2>${esc(n.title)}</h2>
    <p class="sub">${fmtDate(n.created)}${n.acc ? ' · GPS ±' + Math.round(n.acc) + ' m' : ''}${distFromMe(n.lat, n.lng)}</p>
    ${coordsBlock(n.lat, n.lng)}
    ${n.text ? `<div class="desc">${esc(n.text)}</div>` : ''}
    <div class="media">${mediaHtml(n.media || [], false)}</div>
    <div class="acts">
      ${goBtn(n.lat, n.lng, 'Llévame aquí', 'full')}
      <button class="btn" data-a="edit">Editar</button>
      <button class="btn" data-a="share">Compartir</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button>
      <button class="btn del" data-a="delete">Eliminar</button>
    </div>`, 'view');
  b.querySelector('[data-a=edit]').onclick = () => openEditor({ note: n });
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${fmtLL(n.lat, n.lng)}\n${fmtUTM(n.lat, n.lng)}`);
  b.querySelector('[data-a=delete]').onclick = () => deleteNote(n.id);
  b.querySelector('[data-a=share]').onclick = () => shareNote(n);
}
async function shareNote(n) {
  const text = `${n.title}\n${n.text ? n.text + '\n' : ''}${fmtLL(n.lat, n.lng)}\n${viewUrl(n.lat, n.lng)}`;
  const files = (n.media || []).map((m, i) => new File([m.blob], `${n.id}_${i + 1}.${extFor(m)}`, { type: m.mime }));
  try {
    if (files.length && navigator.canShare && navigator.canShare({ files })) await navigator.share({ title: n.title, text, files });
    else if (navigator.share) await navigator.share({ title: n.title, text });
    else copyText(text);
  } catch (e) { if (e.name !== 'AbortError') copyText(text); }
}
const extFor = m => ({ photo: 'jpg', video: (m.mime || '').includes('mp4') ? 'mp4' : 'webm', audio: (m.mime || '').includes('mp4') ? 'm4a' : (m.mime || '').includes('ogg') ? 'ogg' : 'webm' }[m.kind]);

/* ---------------- Medición ---------------- */
let measure = null;
function startMeasure(ll) {
  if (measure) endMeasure();
  measure = { pts: [], line: L.polyline([], { color: '#ffd43b', weight: 4, dashArray: '8 6', interactive: false }).addTo(map), marks: L.layerGroup().addTo(map) };
  $('#measureBar').hidden = false;
  if (ll) addMeasurePt(ll); else updateMeasure();
}
function addMeasurePt(ll) {
  measure.pts.push(L.latLng(ll));
  L.circleMarker(ll, { radius: 6, color: '#1f1a00', weight: 2, fillColor: '#ffd43b', fillOpacity: 1, interactive: false }).addTo(measure.marks);
  measure.line.setLatLngs(measure.pts); updateMeasure();
}
function updateMeasure() {
  const p = measure.pts; let d = 0;
  for (let i = 1; i < p.length; i++) d += p[i - 1].distanceTo(p[i]);
  $('#mText').textContent = p.length < 2 ? 'Toca el mapa para añadir puntos' : `Distancia: ${fmtLen(d)} · ${p.length} puntos`;
}
function endMeasure() { if (!measure) return; map.removeLayer(measure.line); map.removeLayer(measure.marks); measure = null; $('#measureBar').hidden = true; }
map.on('click', e => { if (measure) addMeasurePt(e.latlng); });
$('#mUndo').onclick = () => {
  if (!measure || !measure.pts.length) return;
  measure.pts.pop(); measure.marks.clearLayers();
  measure.pts.forEach(p => L.circleMarker(p, { radius: 6, color: '#1f1a00', weight: 2, fillColor: '#ffd43b', fillOpacity: 1, interactive: false }).addTo(measure.marks));
  measure.line.setLatLngs(measure.pts); updateMeasure();
};
$('#mEnd').onclick = endMeasure;

/* ---------------- Exportar anotaciones a KMZ ---------------- */
const cdata = s => '<![CDATA[' + String(s).replace(/]]>/g, ']]]]><![CDATA[>') + ']]>';
const xml = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
async function exportKMZ() {
  const list = [...notes.values()].sort((a, b) => a.created - b.created);
  if (!list.length) { toast('Todavía no hay anotaciones que exportar.'); return; }
  toast('Preparando KMZ…');
  const zip = new JSZip(); let pms = '';
  for (const n of list) {
    let html = `<p><b>${esc(fmtDate(n.created))}</b><br>${esc(fmtLL(n.lat, n.lng))}<br>${esc(fmtUTM(n.lat, n.lng))}</p>`;
    if (n.text) html += `<p>${esc(n.text).replace(/\n/g, '<br>')}</p>`;
    (n.media || []).forEach((m, i) => {
      const name = `files/${n.id}_${i + 1}.${extFor(m)}`;
      zip.file(name, m.blob);
      html += m.kind === 'photo' ? `<p><img src="${name}" width="480"></p>` : `<p><a href="${name}">${m.kind === 'video' ? 'Vídeo' : 'Nota de voz'} ${i + 1}</a></p>`;
    });
    pms += `<Placemark><name>${xml(n.title)}</name><description>${cdata(html)}</description>
<TimeStamp><when>${new Date(n.created).toISOString()}</when></TimeStamp><styleUrl>#${noteType(n)}</styleUrl>
<Point><coordinates>${n.lng.toFixed(7)},${n.lat.toFixed(7)},0</coordinates></Point></Placemark>\n`;
  }
  const st = (id, c) => `<Style id="${id}"><IconStyle><color>${c}</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>`;
  const kmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Anotaciones Campo KML ${new Date().toLocaleDateString('es-ES')}</name>
${st('photo', 'ffc27119')}${st('video', 'ffb5369c')}${st('audio', 'ff3e8a2b')}${st('note', 'ff0c59e8')}
<Folder><name>Anotaciones</name>\n${pms}</Folder></Document></kml>`;
  zip.file('doc.kml', kmlDoc);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' });
  const name = `anotaciones_${new Date().toISOString().slice(0, 10)}.kmz`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  toast(`Exportadas ${list.length} anotaciones en ${name}`);
}

/* ---------------- Guardar zona para trabajar sin cobertura ---------------- */
function tileRange(b, z) {
  const n = 2 ** z;
  const x = lng => Math.floor((lng + 180) / 360 * n);
  const y = lat => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n); };
  return { x0: x(b.getWest()), x1: x(b.getEast()), y0: y(b.getNorth()), y1: y(b.getSouth()) };
}
async function cacheArea() {
  if (!('caches' in window)) { toast('Este navegador no permite guardar mapas sin conexión.'); return; }
  const b = map.getBounds(), z0 = Math.max(12, map.getZoom()), urls = [];
  for (let z = z0; z <= Math.min(z0 + 3, 19); z++) {
    const r = tileRange(b, z);
    for (let x = r.x0; x <= r.x1; x++) for (let y = r.y0; y <= r.y1; y++) {
      urls.push(URL_PNOA.replace('{z}', z).replace('{x}', x).replace('{y}', y));
      if (z <= 18) urls.push(URL_LABELS.replace('{z}', z).replace('{x}', x).replace('{y}', y));
    }
  }
  if (urls.length > 4000) { toast(`La zona visible necesita ${urls.length} imágenes. Acerca el mapa y vuelve a intentarlo.`, 6000); return; }
  if (!confirm(`Se descargarán ${urls.length} imágenes de ortofoto PNOA (unos ${Math.round(urls.length * 0.025)} MB) para usarlas sin cobertura. ¿Continuar?`)) return;
  const cache = await caches.open('tiles-v1');
  let done = 0, ok = 0; const queue = urls.slice();
  async function worker() {
    while (queue.length) {
      const u = queue.shift();
      try {
        if (!(await cache.match(u))) { const r = await fetch(u, { mode: 'cors' }); if (r.ok) { await cache.put(u, r); ok++; } }
        else ok++;
      } catch (e) { /* servidor sin CORS o sin red */ }
      done++;
      if (done % 40 === 0) toast(`Guardando zona… ${done}/${urls.length}`, 2000);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  toast(ok ? `Zona guardada: ${ok} de ${urls.length} imágenes disponibles sin conexión.` : 'No se pudo guardar la zona. Comprueba la conexión.', 7000);
}

/* ---------------- Panel lateral ---------------- */
function openDrawer() { renderDrawer(); $('#drawer').hidden = false; $('#scrim').hidden = false; }
function closeDrawer() { $('#drawer').hidden = true; $('#scrim').hidden = true; }
async function renderDrawer() {
  const d = $('#drawer');
  const layers = [...kml.values()].sort((a, b) => b.rec.created - a.rec.created);
  const nl = [...notes.values()].sort((a, b) => b.created - a.created);
  let storage = '';
  try { const e = await navigator.storage.estimate(); storage = `${(e.usage / 1048576).toFixed(1).replace('.', ',')} MB usados en el dispositivo`; } catch (e) {}
  d.innerHTML = `<h2>Campo KML</h2>
    <h3>Mapa base</h3>
    ${Object.entries(BASES).map(([id, b]) => `<label class="opt"><input type="radio" name="base" value="${id}" ${settings.base === id ? 'checked' : ''}>${esc(b.name)}</label>`).join('')}
    <label class="opt"><input type="checkbox" id="chkCat" ${settings.catastro ? 'checked' : ''}>Parcelas de Catastro</label>
    <h3>Capas KML (${layers.length})</h3>
    ${layers.length ? layers.map(({ rec, feats }) => `<div class="lrow"><input type="checkbox" data-vis="${rec.id}" ${rec.visible ? 'checked' : ''} aria-label="Mostrar ${esc(rec.name)}">
      <span class="sw" style="background:${rec.color}"></span><span class="nm">${esc(rec.name)}<small>${feats.length} elementos</small></span>
      <button class="mini" data-zoom="${rec.id}">Ver</button><button class="mini del" data-dell="${rec.id}" aria-label="Quitar capa">${ICON.close}</button></div>`).join('')
      : '<p class="empty">Importa un KML o KMZ con el botón Importar.</p>'}
    <h3>Anotaciones (${nl.length})</h3>
    ${nl.length ? nl.map(n => `<div class="nrow" data-note="${n.id}"><span class="pin ${noteType(n)}" style="transform:scale(.7)"><span></span>${ICON[noteType(n)]}</span>
      <span class="t"><b>${esc(n.title)}</b><small>${fmtDate(n.created)} · ${(n.media || []).length} archivos</small></span></div>`).join('')
      : '<p class="empty">Mantén pulsado en el mapa o usa el botón naranja para crear la primera.</p>'}
    <h3>Herramientas</h3>
    <div class="acts">
      <button class="btn" data-t="import">Importar KML</button>
      <button class="btn" data-t="export">Exportar KMZ</button>
      <button class="btn" data-t="measure">${ICON.ruler}Medir</button>
      <button class="btn" data-t="cache">Guardar zona sin conexión</button>
    </div>
    <h3>Ajustes</h3>
    <div class="field"><label for="selTravel">Indicaciones de Google Maps</label>
      <select id="selTravel"><option value="driving">En coche</option><option value="walking">A pie</option></select></div>
    <label class="opt"><input type="checkbox" id="chkStamp" ${settings.stamp ? 'checked' : ''}>Sellar fecha y coordenadas en las fotos</label>
    <div class="field"><label for="gKey">Clave de Google (API Map Tiles)</label>
      <input type="password" id="gKey" autocomplete="off" placeholder="AIza…" value="${esc(settings.googleKey)}">
      <button class="mini" id="gKeySave" type="button">Guardar clave</button>
      <p class="hint">Solo hace falta para el fondo Google híbrido. La ortofoto PNOA del IGN funciona sin clave.</p></div>
    <p class="hint">${storage}</p>`;
  d.querySelectorAll('input[name=base]').forEach(r => r.onchange = () => setBase(r.value));
  $('#chkCat').onchange = e => setCatastro(e.target.checked);
  d.querySelectorAll('[data-vis]').forEach(c => c.onchange = async () => {
    const e = kml.get(c.dataset.vis); e.rec.visible = c.checked;
    c.checked ? e.group.addTo(map) : map.removeLayer(e.group);
    await DB.put('layers', e.rec);
  });
  d.querySelectorAll('[data-zoom]').forEach(bt => bt.onclick = () => {
    const e = kml.get(bt.dataset.zoom);
    if (!e.rec.visible) { e.rec.visible = true; e.group.addTo(map); DB.put('layers', e.rec); }
    closeDrawer(); map.fitBounds(e.group.getBounds().pad(0.1), { maxZoom: 18 });
  });
  d.querySelectorAll('[data-dell]').forEach(bt => bt.onclick = async () => {
    const e = kml.get(bt.dataset.dell);
    if (!confirm(`¿Quitar la capa «${e.rec.name}» de la app?`)) return;
    map.removeLayer(e.group); kml.delete(e.rec.id); await DB.del('layers', e.rec.id); renderDrawer();
  });
  d.querySelectorAll('[data-note]').forEach(r => r.onclick = () => {
    const n = notes.get(r.dataset.note); closeDrawer();
    map.setView([n.lat, n.lng], Math.max(map.getZoom(), 17)); viewNote(n.id);
  });
  d.querySelector('[data-t=import]').onclick = () => { closeDrawer(); $('#inKml').click(); };
  d.querySelector('[data-t=export]').onclick = exportKMZ;
  d.querySelector('[data-t=measure]').onclick = () => { closeDrawer(); startMeasure(); };
  d.querySelector('[data-t=cache]').onclick = () => { closeDrawer(); cacheArea(); };
  const sel = $('#selTravel'); sel.value = settings.travel; sel.onchange = () => { settings.travel = sel.value; saveSettings(); };
  $('#chkStamp').onchange = e => { settings.stamp = e.target.checked; saveSettings(); };
  $('#gKeySave').onclick = () => { settings.googleKey = $('#gKey').value.trim(); googleCache = null; saveSettings(); toast('Clave guardada'); if (settings.base === 'google') setBase('google'); };
}

/* ---------------- Botones principales ---------------- */
$('#btnMenu').innerHTML = ICON.menu;
$('#fabLocate').innerHTML = ICON.locate;
$('#fabPhoto').innerHTML = ICON.photo;
$('#fabNote').innerHTML = ICON.plus;
$('#sheetX').innerHTML = ICON.close;
$('#btnMenu').onclick = openDrawer;
$('#scrim').onclick = closeDrawer;
$('#sheetX').onclick = closeSheet;
$('#btnImport').onclick = () => $('#inKml').click();
$('#inKml').addEventListener('change', e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) importFiles(f); });
$('#fabLocate').onclick = locate;

// Foto rápida: abre la cámara al instante y georreferencia con el GPS en paralelo
$('#fabPhoto').onclick = () => {
  const posP = getPos().catch(() => null);
  capture('inPhoto', async files => {
    const p = await posP;
    const at = p ? { lat: p.lat, lng: p.lng, acc: p.acc, src: 'gps' } : { ...map.getCenter(), src: 'mapa' };
    if (!p) toast('Sin señal GPS: la foto se ha situado en el centro del mapa. Arrastra el marcador para corregirla.', 7000);
    openEditor(at); addMedia(files);
  });
};
// Nueva anotación en mi posición
$('#fabNote').onclick = async () => {
  toast('Obteniendo posición GPS…', 2500);
  try { const p = await getPos(); openEditor({ lat: p.lat, lng: p.lng, acc: p.acc, src: 'gps' }); map.panTo([p.lat, p.lng]); }
  catch (e) { toast(geoErr(e) + ' Mantén pulsado en el mapa para anotar en un punto concreto.', 7000); }
};

map.on('moveend', () => { const c = map.getCenter(); settings.view = [c.lat, c.lng, map.getZoom()]; clearTimeout(map._svT); map._svT = setTimeout(saveSettings, 800); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#drawer').hidden) closeDrawer(); else if (measure) endMeasure(); else closeSheet(); } });

/* ---------------- Arranque ---------------- */
async function receiveShared() { // ficheros compartidos desde otras apps (WhatsApp, Drive…)
  if (!('caches' in window)) return;
  const c = await caches.open('inbox'); const keys = await c.keys(); if (!keys.length) return;
  const files = [];
  for (const k of keys) {
    const r = await c.match(k);
    files.push(new File([await r.blob()], decodeURIComponent(r.headers.get('x-name') || 'compartido.kml')));
    await c.delete(k);
  }
  const kmlFiles = files.filter(f => /\.km[lz]$/i.test(f.name));
  if (kmlFiles.length) importFiles(kmlFiles); else toast('Los archivos compartidos no son KML ni KMZ.');
}

(async function init() {
  try { Object.assign(settings, (await DB.get('kv', 'settings')) || {}); } catch (e) {}
  if (settings.view) map.setView([settings.view[0], settings.view[1]], settings.view[2]);
  await setBase(settings.base in BASES ? settings.base : 'pnoa');
  if (settings.catastro) catastro.addTo(map);
  try {
    for (const rec of (await DB.all('layers')).sort((a, b) => a.created - b.created)) {
      try { renderKml(rec); } catch (e) { console.error(e); }
    }
    for (const n of await DB.all('notes')) { notes.set(n.id, n); drawNote(n); }
  } catch (e) { toast('No se pudieron leer los datos guardados: ' + e.message, 7000); }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
  }
  if (new URLSearchParams(location.search).has('shared')) { history.replaceState(null, '', './'); receiveShared(); }
  if (!kml.size && !notes.size) toast('Pulsa Importar para abrir un KML o KMZ. Mantén pulsado en el mapa para ver las opciones de un punto.', 8000);
})();
