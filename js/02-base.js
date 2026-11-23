'use strict';
/* OBRA-GIS · Base: almacenamiento, utilidades geográficas, EXIF, avisos, fichas inferiores y borradores.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Almacenamiento local (IndexedDB) ---------------- */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('campo-kml', 4);
    r.onupgradeneeded = () => {
      const d = r.result, has = n => d.objectStoreNames.contains(n);
      if (!has('layers')) d.createObjectStore('layers', { keyPath: 'id' });
      if (!has('notes')) d.createObjectStore('notes', { keyPath: 'id' });
      if (!has('kv')) d.createObjectStore('kv');
      if (!has('acts')) d.createObjectStore('acts', { keyPath: 'id' }); // actuaciones lineales sobre trazas
      if (!has('obras')) d.createObjectStore('obras', { keyPath: 'id' }); // cada obra agrupa sus capas y datos
      if (!has('resources')) d.createObjectStore('resources', { keyPath: 'id' }); // plantas, canteras… comunes a todas las obras
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
    // varias escrituras en una sola transacción: o se guardan todas o ninguna
    putMany: async list => { const d = await open(), stores = [...new Set(list.map(x => x[0]))];
      return new Promise((res, rej) => { const t = d.transaction(stores, 'readwrite'); list.forEach(([s0, v]) => t.objectStore(s0).put(v));
        t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Operación cancelada')); }); },
  };
})();

const settings = { base: 'pnoa', catastro: false, googleKey: '', travel: 'driving', stamp: true, view: null, notesVisible: true, pk: true, activeObra: null, collapsed: {} };
const saveSettings = () => DB.put('kv', { ...settings }, 'settings').catch(() => {});

/* ---------------- Utilidades geográficas ---------------- */
const fmtLen = m => (m >= 1000 ? (m / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(m) + ' m');
const fmtLL = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
const fmtDate = t => new Date(t).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const thousands = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function toUTM(lat, lon, forceZone) { // WGS84 ≈ ETRS89 (diferencia submétrica)
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const zone = forceZone || Math.floor((lon + 180) / 6) + 1;
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

/* ---------------- Lectura de EXIF (coordenadas, fecha y orientación de fotos) ---------------- */
async function readExif(file) {
  const buf = await file.slice(0, 256 * 1024).arrayBuffer();
  const v = new DataView(buf);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null; // no es JPEG
  let off = 2;
  while (off + 4 <= v.byteLength) {
    const marker = v.getUint16(off);
    if ((marker & 0xFF00) !== 0xFF00) break;
    const len = v.getUint16(off + 2);
    if (marker === 0xFFE1 && off + 10 <= v.byteLength && v.getUint32(off + 4) === 0x45786966) return parseTiff(v, off + 10);
    if (marker === 0xFFDA) break; // empieza la imagen
    off += 2 + len;
  }
  return null;
}
function parseTiff(v, t) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = o => v.getUint16(o, le), u32 = o => v.getUint32(o, le);
  const SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const ifd = o => {
    const tags = {}; const n = u16(o);
    for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; tags[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 }; }
    return tags;
  };
  const val = tag => {
    if (!tag) return null;
    const { type, count, at } = tag, size = (SIZE[type] || 1) * count;
    const p = size > 4 ? t + u32(at) : at;
    if (p + size > v.byteLength) return null;
    if (type === 2) { let s = ''; for (let i = 0; i < count; i++) { const c = v.getUint8(p + i); if (!c) break; s += String.fromCharCode(c); } return s; }
    const out = [];
    for (let i = 0; i < count; i++) {
      if (type === 5) { const b = u32(p + i * 8 + 4); out.push(b ? u32(p + i * 8) / b : 0); }
      else if (type === 10) { const b = v.getInt32(p + i * 8 + 4, le); out.push(b ? v.getInt32(p + i * 8, le) / b : 0); }
      else if (type === 3) out.push(u16(p + i * 2));
      else if (type === 4) out.push(u32(p + i * 4));
      else out.push(v.getUint8(p + i));
    }
    return out;
  };
  const ifd0 = ifd(t + u32(t + 4));
  const res = {};
  if (ifd0[0x8769]) { const ex = ifd(t + val(ifd0[0x8769])[0]); const d = val(ex[0x9003]) || val(ifd0[0x0132]); if (d) res.date = exifDate(d); }
  if (ifd0[0x8825]) {
    const g = ifd(t + val(ifd0[0x8825])[0]);
    const lat = val(g[2]), lng = val(g[4]), latRef = val(g[1]), lngRef = val(g[3]);
    if (lat && lng && lat.length === 3 && lng.length === 3) {
      let la = lat[0] + lat[1] / 60 + lat[2] / 3600, lo = lng[0] + lng[1] / 60 + lng[2] / 3600;
      if (latRef === 'S') la = -la; if (lngRef === 'W') lo = -lo;
      if (isFinite(la) && isFinite(lo) && !(la === 0 && lo === 0) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) { res.lat = la; res.lng = lo; }
    }
    const alt = val(g[6]); if (alt) res.alt = (val(g[5]) || [0])[0] === 1 ? -alt[0] : alt[0];
    const dir = val(g[0x11]); if (dir && isFinite(dir[0])) res.dir = dir[0];
  }
  return res;
}
function exifDate(s) { // "AAAA:MM:DD HH:MM:SS" en hora local
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s || '');
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null;
}

/* ---------------- Interfaz: aviso, hoja inferior, panel ---------------- */
let toastT;
function toast(msg, ms = 3500) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms);
}

let sheetCleanup = [], pendingUrls = [];
let sheetOpenAt = 0, editorRerender = false, sheetTitle = '', lastFocus = null;
function openSheet(html, cls = '') {
  const urls = pendingUrls; pendingUrls = [];
  const wasHidden = $('#sheet').hidden;
  closeSheet(true);
  const title = (/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html) || [])[1] || html.slice(0, 80);
  if (wasHidden || title !== sheetTitle) sheetOpenAt = Date.now(); // ficha nueva bajo el dedo (también si sustituye a otra): se ignoran los toques de 350 ms
  sheetTitle = title;
  if (wasHidden) { armBack(); lastFocus = document.activeElement; } // «Atrás» la cierra · el foco vuelve aquí al cerrar
  urls.forEach(u => sheetCleanup.push(() => URL.revokeObjectURL(u)));
  if (/^Obteniendo posición/.test($('#toast').textContent)) $('#toast').hidden = true; // aviso ya resuelto
  const b = $('#sheetBody'); b.className = cls; b.innerHTML = html;
  $('#sheet').hidden = false; $('#sheet').scrollTop = 0;
  a11ySheet(b, wasHidden || sheetOpenAt === Date.now());
  return b;
}
// Accesibilidad de las fichas: diálogo con título, foco al título al abrir y estado «pulsado» de los botones segmentados
function a11ySheet(b, fresh) {
  const sh = $('#sheet'), h = b.querySelector('h2');
  sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'false');
  if (h) { h.id = h.id || 'sheetTitle'; h.tabIndex = -1; sh.setAttribute('aria-labelledby', h.id); if (fresh) try { h.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  b.querySelectorAll('.seg button:not([role])').forEach(x => x.setAttribute('aria-pressed', x.classList.contains('on')));
}
new MutationObserver(ms => ms.forEach(m => { const x = m.target; if (x.matches && x.matches('.seg button:not([role])')) x.setAttribute('aria-pressed', x.classList.contains('on')); }))
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
function onSheetClose(fn) { sheetCleanup.push(fn); }
let histArmed = false;
function armBack() { if (!histArmed) { try { history.pushState({ obragis: 1 }, ''); histArmed = true; } catch (e) { /* nada */ } } }
window.addEventListener('popstate', () => {
  histArmed = false;
  if (!$('#viewer').hidden) { $('#viewer').hidden = true; armBack(); return; }
  if (!$('#sheet').hidden) { closeSheet(); return; }
  if (!$('#drawer').hidden) { closeDrawer(); return; }
});
// Evita «toques fantasma»: si se pulsa dos veces seguidas, el segundo toque caía en el botón que aparece debajo del dedo
document.addEventListener('click', e => {
  if (e.isTrusted && Date.now() - sheetOpenAt < 350 && e.target.closest && e.target.closest('#sheetBody button, #sheetBody a')) { e.stopPropagation(); e.preventDefault(); }
}, true);
// Al pasar la app a segundo plano (o cerrarla) se guarda al momento lo que se esté escribiendo
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') return;
  try { if (typeof draft !== 'undefined' && draft && $('#nTitle')) { syncDraft(); storeDraft('note', { ...draft, media: [...draft.media] }, true); }
    if (typeof actDraft !== 'undefined' && actDraft && $('#aText')) { syncAct(); storeDraft('act', { ...actDraft, params: { ...actDraft.params } }, true); } } catch (e) { /* nada */ } });
/* ---------------- Borradores: lo que se escribe no se pierde ----------------
   Si se cierra un editor sin guardar (X, Escape, otra ficha, la app se cierra…), el borrador se guarda y se ofrece recuperarlo. */
// Huella de una actuación para saber si ha cambiado (parámetros vacíos o internos no cuentan; PK redondeados al cm)
const actKey = d => JSON.stringify([d.type, Math.round((+d.d0 || 0) * 100), Math.round((+d.d1 || 0) * 100), d.side, String(d.text || ''), Object.fromEntries(Object.entries(d.params || {}).filter(([k, v]) => v != null && v !== '' && k[0] !== '_').sort()), d.prio || '', (d.media || []).map(m => m && m.id || '?').join(',')]); // las fotos cuentan por su identificador (cambiar una por otra también es un cambio)
const noteKey = d => JSON.stringify([String(d.title || ''), String(d.text || ''), (d.media || []).map(m => m && m.id || '?').join(',')]);
let pendingDraft = null, drafts = {}; // un borrador por anotación o actuación (id → { kind, data, t }); pendingDraft = el más reciente
const draftHasContent = d => !!(d && d.data && ((d.data.media || []).length || String(d.data.text || '').trim() || (d.kind === 'act' ? d.data.type : String(d.data.title || '').trim() && d.data.title !== d.data._autoTitle)));
// solo se ofrecen los borradores de la obra abierta (los de otras obras esperan a que se abra la suya)
function refreshPending() { const l = Object.values(drafts).filter(d => draftHasContent(d) && (!d.data.obraId || d.data.obraId === settings.activeObra)).sort((x, y) => y.t - x.t); pendingDraft = l[0] || null; return l.length; }
// un borrador leído de la base de datos se comprueba y se normaliza; si está dañado se descarta solo ese
function cleanDraft(d) {
  if (!d || typeof d !== 'object' || !d.data || typeof d.data !== 'object' || !['act', 'note'].includes(d.kind)) return null;
  const x = { ...d.data }; if (!x.id || typeof x.id !== 'string') x.id = uid();
  x.media = Array.isArray(x.media) ? x.media.filter(m => m && m.blob instanceof Blob) : [];
  x.text = typeof x.text === 'string' ? x.text : x.text == null ? '' : String(x.text);
  if (d.kind === 'note') { x.title = typeof x.title === 'string' ? x.title : ''; if (!isFinite(x.lat) || !isFinite(x.lng)) return null; }
  else { if (!isFinite(x.d0) || !isFinite(x.d1)) return null; x.params = x.params && typeof x.params === 'object' && !Array.isArray(x.params) ? x.params : {}; }
  return { kind: d.kind, data: x, t: isFinite(d.t) ? d.t : Date.now() };
}
async function storeDraft(kind, data, silent) {
  if (!data || !data.id) return;
  drafts[data.id] = { kind, data, t: Date.now() }; refreshPending();
  try { await DB.put('kv', drafts, 'drafts'); } catch (e) { /* sin espacio */ }
  if (!silent) showDraftBar();
}
async function clearDraft(id) { // sin id: el borrador que muestra la barra
  const k = id || (pendingDraft && pendingDraft.data.id); if (k) delete drafts[k];
  refreshPending(); try { await DB.put('kv', drafts, 'drafts'); } catch (e) { /* nada */ }
  const b = $('#draftBar'); if (b) { if (pendingDraft && $('#sheet').hidden) showDraftBar(); else if (!pendingDraft) b.hidden = true; }
}
function draftLabel(d) { return d.kind === 'act' ? `${d.data.type || 'Actuación sin tipo'} · ${esc(d.data.traceName || '')} · PK ${fmtPK(d.data.d0)}` : esc(d.data.title || d.data.text || 'Anotación'); }
function showDraftBar() {
  if (!pendingDraft) return;
  let el = $('#draftBar'); if (!el) { el = document.createElement('div'); el.id = 'draftBar'; el.className = 'upbanner draftbar'; document.body.appendChild(el); }
  const nD = refreshPending(); if (!pendingDraft) { el.hidden = true; return; }
  el.innerHTML = `<b>Tienes ${pendingDraft.kind === 'act' ? 'una actuación' : 'una anotación'} sin guardar${nD > 1 ? ` (y ${nD - 1} más)` : ''}</b><br><small>${draftLabel(pendingDraft)}${pendingDraft.data.media && pendingDraft.data.media.length ? ` · ${pendingDraft.data.media.length} foto(s)` : ''}</small>
    <div class="row"><button class="mini pri" data-d="go">Seguir editando</button><button class="mini del" data-d="no">Descartar</button></div>`;
  el.hidden = false;
  el.querySelector('[data-d=go]').onclick = () => {
    const d = pendingDraft; if (!d) return;
    try { if (d.kind === 'act') { actDraft = { ...d.data }; renderActEditor(); } else { draft = { ...d.data }; renderEditor(); } el.hidden = true; }
    catch (e) { console.error(e); toast('Este borrador está dañado y no se puede abrir. Puedes descartarlo.', 6000); }
  };
  el.querySelector('[data-d=no]').onclick = () => { const id = pendingDraft && pendingDraft.data.id; if (confirm('¿Descartar lo que no has guardado?')) clearDraft(id); };
}
function closeSheet(replacing) {
  const fns = sheetCleanup; sheetCleanup = [];
  fns.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  // al cerrar una ficha la barra del tramo reaparece bajo el dedo: 0,7 s sin toques (no 1,5 s)
  if (replacing !== true) { $('#sheet').hidden = true; if (walkAct) walkAct.shown = Date.now() - 800; if (lastFocus && lastFocus.isConnected && lastFocus !== document.body) try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* nada */ } lastFocus = null; } // la barra del tramo reaparece bajo el dedo: 1,5 s sin toques // al sustituir una ficha por otra no se oculta (evita parpadeos y toques perdidos)
  $('#sheetBody').innerHTML = '';
}
const objectUrl = blob => { const u = URL.createObjectURL(blob); pendingUrls.push(u); return u; };

function copyText(text) {
  const done = () => toast('Copiado: ' + text.split('\n')[0]);
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast(text, 6000));
  else toast(text, 6000);
}
const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
const b64ToBlob = (b64, type) => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new Blob([a], { type }); };

// Guardar o enviar un fichero generado (KMZ). En la app nativa abre el menú Compartir de Android.
// En la app nativa el fichero se guarda en Documentos/OBRA-GIS (sobrevive a desinstalar la app) y después se abre
// el menú Compartir. Se escribe por trozos para que los paquetes grandes (con muchas fotos) no agoten la memoria.
let lastSaved = null;
async function nativeWrite(FS, path, blob, directory) {
  const CH = 3 * 1024 * 1024; // múltiplo de 3: el base64 de cada trozo se puede concatenar
  let first = true;
  for (let i = 0; first || i < blob.size; i += CH) {
    const data = await blobToB64(blob.slice(i, i + CH));
    if (first) await FS.writeFile({ path, data, directory, recursive: true });
    else await FS.appendFile({ path, data, directory });
    first = false;
  }
  return (await FS.getUri({ path, directory })).uri;
}
async function saveBlob(blob, name, opts = {}) {
  const FS = Plug('Filesystem'), SH = Plug('Share');
  if (NATIVE && FS) {
    let uri = null, where = '', errMsg = '';
    if (FS.requestPermissions) { try { await FS.requestPermissions(); } catch (e) { /* Android 11+ no lo necesita */ } }
    for (const directory of ['DOCUMENTS', 'EXTERNAL', 'CACHE']) {
      try { uri = await nativeWrite(FS, 'OBRA-GIS/' + name, blob, directory); where = directory; break; }
      catch (e) { errMsg = e.message || String(e); console.warn('No se pudo escribir en', directory, e); }
    }
    if (!uri) throw new Error('no se pudo escribir el fichero en el móvil (' + errMsg + ')');
    lastSaved = { name, where, uri, t: Date.now() };
    if (where === 'DOCUMENTS') toast(`Guardado en Documentos › OBRA-GIS › ${name}`, 7000);
    else if (where === 'EXTERNAL') toast('Guardado en la carpeta de la app. Ojo: se borra si desinstalas la app. Envíalo a Drive o por correo.', 8000);
    if (SH && opts.share !== false) {
      try { await SH.share({ title: name, files: [uri], dialogTitle: 'Guardar o enviar ' + name }); }
      catch (e) { if (!/cancel/i.test(e.message || '') && where === 'CACHE') throw e; }
    }
    return { uri, where };
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  return { where: 'DOWNLOAD' };
}
