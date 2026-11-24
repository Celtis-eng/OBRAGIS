'use strict';
/* OBRA-GIS · Copia automática de las obras (app Android).
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global).

   Los datos de la app (IndexedDB del WebView) se borran al DESINSTALAR. Para que no se pierdan:
   - Cada obra que cambia se guarda sola como paquete .zip (el mismo formato que «Exportar obra») en
     Documentos › OBRA-GIS › Copia automática, que Android NO borra al desinstalar.
   - Se escribe primero a un .tmp y solo al terminar bien se renombra: nunca queda una copia a medias.
     La copia anterior se conserva como «_anterior.zip» (dos generaciones).
   - Tras reinstalar: aviso «Recuperar obras de una copia» en el mapa vacío y en la bienvenida → se eligen los .zip.
   Al ACTUALIZAR no hace falta nada: el APK se firma siempre con la misma clave (android-build/debug.keystore)
   y Android conserva los datos. */
const AB_DIR = 'OBRA-GIS/Copia automática/';
const AB_EVERY = 5 * 60000;     // como mucho una copia cada 5 min mientras se trabaja
const abOn = () => NATIVE || window.__abTest === true;
const abDirty = new Map();      // obraId → nº de cambios (para no dar por copiado algo que cambió durante la copia)
let abBusy = false;
let abSaveT = null;
function abMark(obraId) {
  if (!obraId) return;
  settings.obraMod = { ...(settings.obraMod || {}), [obraId]: Date.now() }; // último cambio de cada obra (también borrados): sirve para avisar al importar un paquete más antiguo
  clearTimeout(abSaveT); abSaveT = setTimeout(saveSettings, 1500);
  abDirty.set(obraId, (abDirty.get(obraId) || 0) + 1);
  const l = settings.abDirty || []; if (!l.includes(obraId)) { settings.abDirty = [...l, obraId]; saveSettings(); } // se recuerda aunque la app se cierre de golpe
}
// Cualquier escritura de datos de una obra la marca para copiar (la obra del registro, no la activa)
(() => {
  const STORES = new Set(['acts', 'notes', 'layers', 'obras']);
  const owner = (s, v) => s === 'obras' ? v && v.id : (v && v.obraId) || settings.activeObra;
  const kvObra = k => typeof k === 'string' && /^(ficha|afec)/.test(k);
  const put0 = DB.put, del0 = DB.del, many0 = DB.putMany;
  DB.put = (s, v, k) => put0(s, v, k).then(r => { if (STORES.has(s)) abMark(owner(s, v)); else if (s === 'kv' && kvObra(k)) abMark(settings.activeObra); return r; });
  DB.del = async (s, k) => { let ob = null;
    if (STORES.has(s) && s !== 'obras') { try { const v = await DB.get(s, k); ob = v && v.obraId; } catch (e) { /* nada */ } } // al borrar otra obra no se marca la activa
    const r = await del0(s, k);
    if (STORES.has(s) && s !== 'obras') abMark(ob || null); else if (s === 'kv' && kvObra(k)) abMark(settings.activeObra);
    return r; };
  DB.putMany = list => many0(list).then(r => { list.forEach(([s, v]) => { if (STORES.has(s)) abMark(owner(s, v)); }); return r; });
})();
// El nombre lleva una marca de esta instalación: tras reinstalar, Android no deja sobrescribir los ficheros que creó
// la instalación anterior, así que la nueva escribe los suyos al lado (y los antiguos siguen sirviendo para recuperar).
const abInst = () => settings.abInst || (settings.abInst = Math.random().toString(36).slice(2, 6), saveSettings(), settings.abInst);
const abName = o => `OBRA-GIS_${safeName(o.name).slice(0, 40)}_${o.id.replace(/[^a-z0-9]/gi, '').slice(-4)}_${abInst()}`;
const AB_KEEP = 24 * 3600000; // la copia «_anterior» se renueva como mucho una vez al día: un borrado por error no llega a las dos copias enseguida
async function autoBackup(force) {
  if (!abOn() || abBusy) return false;
  // primera vez tras actualizar a una versión con copia automática: se copian todas las obras, aunque no se toquen
  if (!settings.abInit && obras.size) { settings.abInit = true; settings.abDirty = [...new Set([...(settings.abDirty || []), ...obras.keys()])]; saveSettings(); }
  settings.abDirty = (settings.abDirty || []).filter(id => obras.has(id)); // sin obras que ya no existen
  const ids = settings.abDirty;
  if (!ids.length) return false;
  if (!force && Date.now() - (settings.abLast || 0) < AB_EVERY) return false;
  const FS = Plug('Filesystem'); if (!FS) return false;
  abBusy = true; const errs = { ...(settings.abErrs || {}) }; let okAll = true;
  try {
    for (const id of [...ids]) {
      const gen = abDirty.get(id) || 0, o = obras.get(id); if (!o) continue;
      try {
        const r = await exportObraPackage(id, { blobOnly: true, silent: true }); if (!r || !r.blob) throw new Error('no se pudo preparar el paquete');
        const base = AB_DIR + abName(o), fin = base + '.zip', tmp = base + '.tmp', ant = base + '_anterior.zip', D = 'DOCUMENTS';
        await nativeWrite(FS, tmp, r.blob, D);
        const antAt = (settings.abAnt || {})[id] || 0;
        if (Date.now() - antAt > AB_KEEP) { // la copia buena pasa a ser la anterior (una vez al día)
          await FS.deleteFile({ path: ant, directory: D }).catch(() => {});
          const moved = await FS.rename({ from: fin, to: ant, directory: D }).then(() => true, () => false);
          if (moved) settings.abAnt = { ...(settings.abAnt || {}), [id]: Date.now() };
        } else await FS.deleteFile({ path: fin, directory: D }).catch(() => {});
        if (!obras.has(id)) { await FS.deleteFile({ path: tmp, directory: D }).catch(() => {}); continue; } // se eliminó mientras se copiaba
        await FS.rename({ from: tmp, to: fin, directory: D });
        const old = (settings.abBase || {})[id]; // la obra se renombró: se quitan las copias con el nombre viejo
        if (old && old !== base) await FS.rename({ from: old + '_anterior.zip', to: ant, directory: D }).catch(() => {}); // al renombrar no se pierde la copia anterior
        if (old && old !== base) for (const x of [old + '.zip', old + '_anterior.zip', old + '.tmp']) await FS.deleteFile({ path: x, directory: D }).catch(() => {});
        settings.abBase = { ...(settings.abBase || {}), [id]: base };
        if ((abDirty.get(id) || 0) === gen) { abDirty.delete(id); settings.abDirty = (settings.abDirty || []).filter(x => x !== id); }
        delete errs[id];
      } catch (e) { okAll = false; errs[id] = e.message || String(e); console.warn('Copia automática', e); }
    }
    for (const k of Object.keys(errs)) if (!obras.has(k)) delete errs[k];
    settings.abErrs = errs; settings.abErr = Object.values(errs)[0] || ''; settings.abLast = Date.now();
    if (!okAll && Date.now() - (settings.abErrShown || 0) > 3600000) { // el aviso se repite (como mucho cada hora) mientras siga fallando
      settings.abErrShown = Date.now(); toast(`No se pudo hacer la copia automática de ${plural(Object.keys(errs).length, 'obra', 'obras')}. Haz una copia en Obras → «Copia de seguridad de todas las obras».`, 9000); }
    saveSettings();
    return okAll;
  } finally { abBusy = false; }
}
// Cuándo: cada minuto se mira si toca (sin ficha abierta, para no estorbar), y siempre al salir de la app
setInterval(() => { if ($('#sheet').hidden) autoBackup(false); }, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autoBackup(true); });
function abStatusHtml() {
  if (!abOn()) return '';
  const pend = settings.abInit ? (settings.abDirty || []).filter(id => obras.has(id)).length : obras.size, ne = Object.keys(settings.abErrs || {}).filter(id => obras.has(id)).length;
  return `<p class="hint abst${ne ? ' err' : ''}"><b>Copia automática activada</b>: cada obra se guarda sola en <b>Documentos › OBRA-GIS › Copia automática</b>, que no se borra al desinstalar la app${settings.abLast ? ` · última: ${fmtDate(settings.abLast)}` : ''}${pend ? ` · ${plural(pend, 'obra', 'obras')} con cambios por copiar` : ''}.${ne ? ` <b>⚠ ${plural(ne, 'obra no se pudo copiar', 'obras no se pudieron copiar')}</b> (${esc(settings.abErr)}).` : ''}</p>`;
}
// Obra eliminada: al recuperar la carpeta entera no debe volver (M12-5). Su copia NO se borra (por si fue un error):
// se renombra a «_borrada.zip», y la lista de obras eliminadas se guarda en la carpeta (un .zip pequeño, para que el
// selector de ficheros lo muestre junto a las copias) y sirve también tras reinstalar.
const obraKey = o => o.srcId || o.id; // el id que llevan sus paquetes
async function abObraDeleted(o) {
  settings.obraDel = { ...(settings.obraDel || {}), [obraKey(o)]: Date.now() }; saveSettings();
  if (!abOn()) return; const FS = Plug('Filesystem'); if (!FS) return; const D = 'DOCUMENTS';
  const base = (settings.abBase || {})[o.id] || AB_DIR + abName(o);
  for (const [a, b] of [[base + '.zip', base + '_borrada.zip'], [base + '_anterior.zip', base + '_borrada_anterior.zip']]) {
    await FS.deleteFile({ path: b, directory: D }).catch(() => {}); await FS.rename({ from: a, to: b, directory: D }).catch(() => {}); }
  await FS.deleteFile({ path: base + '.tmp', directory: D }).catch(() => {});
  const ab = { ...(settings.abBase || {}) }; delete ab[o.id]; settings.abBase = ab;
  const an = { ...(settings.abAnt || {}) }; delete an[o.id]; settings.abAnt = an; saveSettings();
  try {
    const z = new JSZip(); z.file('obras_eliminadas.json', JSON.stringify({ formato: 'OBRA-GIS-eliminadas', eliminadas: settings.obraDel }));
    const p = AB_DIR + `OBRA-GIS_obras_eliminadas_${abInst()}`;
    await nativeWrite(FS, p + '.tmp', await z.generateAsync({ type: 'blob' }), D);
    await FS.deleteFile({ path: p + '.zip', directory: D }).catch(() => {});
    await FS.rename({ from: p + '.tmp', to: p + '.zip', directory: D });
  } catch (e) { console.warn('Lista de obras eliminadas', e); }
}
// Importar lo que sea, todo junto: paquetes de obra (también varios, y los que vienen dentro de otro .zip, como una
// carpeta descargada de Drive), la lista de obras eliminadas, y lo demás (KML/KMZ, fotos, BC3, previos) a su sitio.
// Varios paquetes de la misma obra (la carpeta de la copia): se queda el más reciente de cada una.
async function importAll(files) {
  const pk = [], otros = [], danados = [], del = { ...(settings.obraDel || {}) }; const cola = [...files]; let nz = 0;
  if (files.length > 3) toast(`Leyendo ${files.length} ficheros…`, 20000);
  while (cola.length) {
    const f = cola.shift();
    if (/(^|\/)\.|__MACOSX|(^|\/)(Thumbs\.db|desktop\.ini)$/i.test(f.webkitRelativePath || f.name)) continue; // ficheros ocultos del sistema
    if (/^OBRA-GIS_obras_eliminadas/i.test(f.name)) { // lista de obras eliminadas (de esta instalación o de otra anterior)
      try { const j = JSON.parse(await (await JSZip.loadAsync(f)).file('obras_eliminadas.json').async('string'));
        for (const [k, t] of Object.entries(j.eliminadas || {})) if (typeof t === 'number' && !(del[k] >= t)) del[k] = t; } catch (e) { /* no sirve: se ignora */ }
      continue; }
    if (!(/\.(zip|tmp)$/i.test(f.name) || /zip/.test(f.type))) { otros.push(f); continue; }
    let z = null; try { z = await JSZip.loadAsync(f); } catch (e) { danados.push(f.name); continue; } // solo es «dañado» si no se puede abrir
    const oj = z.file(/(^|\/)obra\.json$/)[0];
    if (oj) { let m = null; try { m = JSON.parse(await oj.async('string')); } catch (e) { /* lo dirá la importación */ }
      pk.push({ f, z, id: m && m.obra && m.obra.id, t: Date.parse(m && m.exportado) || f.lastModified || 0 }); continue; }
    const inner = z.file(/\.zip$/i).filter(e => !/(^|\/)(__MACOSX|\.)/.test(e.name));
    if (inner.length && nz < 300) { // .zip con más .zip dentro (carpeta comprimida, descarga de Drive)
      for (const e of inner) { nz++; cola.push(new File([await e.async('blob')], e.name.split('/').pop(), { type: 'application/zip' })); }
      if (z.file(/\.(km[lz]|bc3|jpe?g|png|webp)$/i).length) otros.push(f); // y sus planos o fotos sueltos, si los tiene
      continue; }
    if (z.file(/\.(km[lz]|bc3|jpe?g|png|webp)$/i).length) otros.push(f);
    else danados.push(f.name + ' (no contiene obras, planos ni fotos)');
  }
  if (otros.length) await rutaOtros(otros); // primero lo suelto (va a la obra activa); luego las obras
  const best = new Map(), skipped = [];
  for (const x of pk) { const k = x.id || x.f.name, b = best.get(k); if (!b || x.t > b.t) { if (b) skipped.push(b); best.set(k, x); } else skipped.push(x); }
  // varias copias a la vez (la carpeta entera): no vuelven las obras eliminadas después de esa copia.
  // Si se elige a mano una sola copia, se importa siempre (es lo que se ha pedido).
  const gone = [];
  if (pk.length > 1) for (const [k, x] of [...best]) if ((x.id && del[x.id] >= x.t) || /_borrada(_anterior)?\.zip$/i.test(x.f.name)) { gone.push(x); best.delete(k); }
  for (const x of [...best.values()].sort((a, b) => a.t - b.t)) await importObraPackage(x.f, x.z, { fecha: x.t });
  const avisos = [];
  if (gone.length) avisos.push(`No se ${gone.length > 1 ? 'han' : 'ha'} recuperado ${plural(gone.length, 'obra que habías eliminado', 'obras que habías eliminado')}. Si la quieres, elige solo su .zip.`);
  if (skipped.length) avisos.push(`Recuperada la copia más reciente de cada obra (${plural(best.size, 'obra', 'obras')}). ${plural(skipped.length, 'copia más antigua se ha descartado', 'copias más antiguas se han descartado')}: ${skipped.map(x => x.f.name).slice(0, 3).join(', ')}${skipped.length > 3 ? '…' : ''}.`);
  if (danados.length) avisos.push(`No se ${danados.length > 1 ? 'han' : 'ha'} podido abrir: ${danados.slice(0, 3).join(', ')}${danados.length > 3 ? '…' : ''}. ${danados.some(n => !/no contiene/.test(n)) ? 'El .zip está dañado o incompleto.' : ''}`);
  for (const a of avisos) { toast(a, 9000); await new Promise(r => setTimeout(r, avisos.length > 1 ? 4500 : 0)); } // al final: no lo tapa «Importando…»
}
const importManyPackages = importAll;
// Elegir una carpeta entera: en el ordenador con el selector de carpetas; en la app de Android con el de Android
const folderPickOk = () => NATIVE ? !!Plug('Inbox') : !matchMedia('(pointer: coarse)').matches && 'webkitdirectory' in document.createElement('input');
async function pickFolder() {
  if (!NATIVE) { $('#inDir').click(); return; }
  const IB = Plug('Inbox'); if (!IB || !IB.pickFolder) { toast('Esta versión de la app no puede elegir carpetas: usa «Varios ficheros».', 7000); return; }
  try {
    const r = await IB.pickFolder(); const list = r.files || [];
    if (!list.length) { if (!r.cancelled) toast('En esa carpeta no hay planos, fotos, .zip ni BC3.', 6000); return; }
    toast(`Leyendo ${plural(list.length, 'fichero', 'ficheros')} de la carpeta…`, 20000);
    const files = [];
    for (const x of list) { try { const b = await (await fetch(Capacitor.convertFileSrc('file://' + x.path))).blob(); files.push(new File([b], x.name, { type: x.mime || b.type || '' })); } catch (e) { console.warn(x.name, e); } }
    await importAll(files);
  } catch (e) { toast('No se pudo leer la carpeta: ' + (e.message || e), 7000); }
  finally { try { await IB.clearFolder(); } catch (e) { /* nada */ } }
}
function restoreFromBackup() {
  toast('Elige los .zip de Documentos › OBRA-GIS › Copia automática (puedes marcar varios).', 8000);
  $('#inObra').click();
}
