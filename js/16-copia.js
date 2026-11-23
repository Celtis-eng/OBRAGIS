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
function abMark(obraId) {
  if (!obraId) return;
  abDirty.set(obraId, (abDirty.get(obraId) || 0) + 1);
  const l = settings.abDirty || []; if (!l.includes(obraId)) { settings.abDirty = [...l, obraId]; saveSettings(); } // se recuerda aunque la app se cierre de golpe
}
// Cualquier escritura de datos de una obra la marca para copiar
(() => {
  const STORES = new Set(['acts', 'notes', 'layers', 'obras']);
  const owner = (s, v) => s === 'obras' ? v && v.id : (v && v.obraId) || settings.activeObra;
  const kvObra = k => typeof k === 'string' && /^(ficha|afec)/.test(k);
  const put0 = DB.put, del0 = DB.del, many0 = DB.putMany;
  DB.put = (s, v, k) => put0(s, v, k).then(r => { if (STORES.has(s)) abMark(owner(s, v)); else if (s === 'kv' && kvObra(k)) abMark(settings.activeObra); return r; });
  DB.del = (s, k) => del0(s, k).then(r => { if (STORES.has(s) || (s === 'kv' && kvObra(k))) abMark(s === 'obras' ? null : settings.activeObra); return r; });
  DB.putMany = list => many0(list).then(r => { list.forEach(([s, v]) => { if (STORES.has(s)) abMark(owner(s, v)); }); return r; });
})();
// El nombre lleva una marca de esta instalación: tras reinstalar, Android no deja sobrescribir los ficheros que creó
// la instalación anterior, así que la nueva escribe los suyos al lado (y los antiguos siguen sirviendo para recuperar).
const abInst = () => settings.abInst || (settings.abInst = Math.random().toString(36).slice(2, 6), saveSettings(), settings.abInst);
const abName = o => `OBRA-GIS_${safeName(o.name).slice(0, 40)}_${o.id.replace(/[^a-z0-9]/gi, '').slice(-4)}_${abInst()}`;
async function autoBackup(force) {
  if (!abOn() || abBusy) return false;
  const ids = (settings.abDirty || []).filter(id => obras.has(id));
  if (!ids.length) return false;
  if (!force && Date.now() - (settings.abLast || 0) < AB_EVERY) return false;
  const FS = Plug('Filesystem'); if (!FS) return false;
  abBusy = true; let okAll = true;
  try {
    for (const id of ids) {
      const gen = abDirty.get(id) || 0, o = obras.get(id); if (!o) continue;
      try {
        const r = await exportObraPackage(id, { blobOnly: true, silent: true }); if (!r || !r.blob) throw new Error('no se pudo preparar el paquete');
        const base = AB_DIR + abName(o), fin = base + '.zip', tmp = base + '.tmp', ant = base + '_anterior.zip';
        await nativeWrite(FS, tmp, r.blob, 'DOCUMENTS');
        await FS.deleteFile({ path: ant, directory: 'DOCUMENTS' }).catch(() => {});
        await FS.rename({ from: fin, to: ant, directory: 'DOCUMENTS' }).catch(() => {});
        await FS.rename({ from: tmp, to: fin, directory: 'DOCUMENTS' });
        if ((abDirty.get(id) || 0) === gen) { abDirty.delete(id); settings.abDirty = (settings.abDirty || []).filter(x => x !== id); }
        settings.abErr = '';
      } catch (e) { okAll = false; settings.abErr = e.message || String(e); console.warn('Copia automática', e); }
    }
    settings.abLast = Date.now(); saveSettings();
    if (!okAll && !settings.abErrShown) { settings.abErrShown = true; saveSettings(); toast('No se pudo hacer la copia automática de las obras. Haz una copia en Obras → «Copia de seguridad de todas las obras».', 9000); }
    if (okAll) settings.abErrShown = false;
    return okAll;
  } finally { abBusy = false; }
}
// Cuándo: cada minuto se mira si toca (sin ficha abierta, para no estorbar), y siempre al salir de la app
setInterval(() => { if ($('#sheet').hidden) autoBackup(false); }, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autoBackup(true); });
function abStatusHtml() {
  if (!abOn()) return '';
  const pend = (settings.abDirty || []).filter(id => obras.has(id)).length;
  return `<p class="hint abst"><b>Copia automática activada</b>: cada obra se guarda sola en <b>Documentos › OBRA-GIS › Copia automática</b>, que no se borra al desinstalar la app${settings.abLast ? ` · última: ${fmtDate(settings.abLast)}` : ''}${pend ? ` · ${plural(pend, 'obra', 'obras')} con cambios por copiar` : ''}.${settings.abErr ? ` <b>Último fallo:</b> ${esc(settings.abErr)}` : ''}</p>`;
}
// Recuperar tras reinstalar: se eligen uno o varios .zip (de la copia automática o de una copia manual)
function restoreFromBackup() {
  toast('Elige los .zip de Documentos › OBRA-GIS › Copia automática (puedes marcar varios).', 8000);
  $('#inObra').click();
}
