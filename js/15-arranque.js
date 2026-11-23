'use strict';
/* OBRA-GIS · Botones principales, ficheros recibidos de otras apps y arranque.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Botones principales ---------------- */
$('#btnMenu').innerHTML = ICON.layers;
$('#fabLocate').innerHTML = ICON.locate;
$('#fabPhoto').innerHTML = ICON.photo;
$('#fabNote').innerHTML = ICON.plus;
$('#sheetX').innerHTML = ICON.close;
$('#btnMenu').onclick = openDrawer;
$('#scrim').onclick = closeDrawer;
$('#sheetX').onclick = closeSheet;
$('#btnImport').onclick = importMenu;
$('#inKml').addEventListener('change', e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) importFiles(f); });
$('#inObra').addEventListener('change', async e => { const fs = [...(e.target.files || [])]; e.target.value = ''; // varios .zip a la vez (recuperar todas las obras de la copia)
  if (fs.length) await importManyPackages(fs); });
$('#btnObra').onclick = obrasSheet;
$('#inPhotosImport').addEventListener('change', e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) importPhotos(f); });
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
$('#fabNote').onclick = () => {
  const nh = settings.plusHints || 0; if (nh < 3) { settings.plusHints = nh + 1; saveSettings(); } // la explicación solo las primeras veces
  const b = openSheet(`<h2>¿Qué apuntas aquí?</h2><p class="sub">En tu posición GPS · <button class="linkbtn" data-a="send">Enviar a la oficina</button></p><div class="acts">
    ${walkHere() ? `<button class="btn go full" data-a="wend">${ICON.road}Terminar aquí el tramo de ${esc(walkAct.draft.type)}</button>` : `<button class="btn go full" data-a="wstart">${ICON.road}Empezar tramo andando</button>`}
    ${(() => { const pts = [...new Set([...(settings.actRecent || []), 'Caño / obra de drenaje', 'Badén', 'Arqueta / pozo'])].filter(t => ACT_POINT.has(t) && ACT_ITEMS.some(i => i.name === t)).slice(0, 3);
      return `<div class="chiprow pts" aria-label="Actuación puntual aquí con un toque">${pts.map(t => `<button class="mini" data-pq="${esc(t)}"><span class="dot" style="background:${actColor(t)}"></span>${esc(t.replace(' / obra de drenaje', '').replace(' / pozo', ''))}</button>`).join('')}</div>`; })()}
    ${repeatRow()}
    ${walkHere() ? '' : (() => { const r = [...new Set(settings.actRecent || [])].filter(t => ACT_ITEMS.some(i => i.name === t) && !ACT_POINT.has(t)).slice(0, 3); return r.length ? `<div class="chiprow" aria-label="Tramo de un tipo reciente">${r.map(t => `<button class="mini" data-wq="${esc(t)}"><span class="dot" style="background:${actColor(t)}"></span>${esc(t)}</button>`).join('')}</div>` : ''; })()}
    <button class="btn full" data-a="act">${ICON.road}Otra actuación en este punto</button>
    <button class="btn full" data-a="note">${ICON.note}Anotación o foto suelta</button></div>
    ${nh < 3 ? '<p class="hint">Una actuación ocupa un tramo del camino (de un PK a otro), por ejemplo una escollera o una cuneta. Una anotación es un punto suelto con texto o fotos.</p>' : ''}
    <div class="savebar plusfoot"><button class="btn full" data-a="close">Cerrar</button></div>`); // pie fijo bajo el dedo que pulsa «+»: un toque de más solo cierra
  b.querySelector('[data-a=note]').onclick = () => { closeSheet(); newNoteHere(); };
  b.querySelector('[data-a=act]').onclick = () => { closeSheet(); newActHere(); };
  const ws = b.querySelector('[data-a=wstart]'); if (ws) ws.onclick = () => walkStartSheet();
  b.querySelector('[data-a=close]').onclick = () => closeSheet();
  sheetOpenAt = Date.now() + 550; // la ficha «+» aparece bajo el dedo que pulsó «+»: 0,9 s sin toques (dobles y triples toques)
  b.querySelectorAll('[data-wq]').forEach(x => x.onclick = () => walkStartSheet({ type: x.dataset.wq }));
  { const t0 = Date.now(); b.querySelectorAll('[data-pq]').forEach(x => x.onclick = () => { if (Date.now() - t0 < 1500) return; quickPoint(x.dataset.pq); }); } // se guardan al tocar: 1,5 s sin toques al abrir // un toque de más al abrir no crea nada // tipo ya elegido: solo falta «Empezar»
  const we = b.querySelector('[data-a=wend]'); if (we) we.onclick = () => { closeSheet(); if (walkAct) walkAct.shown = 0; walkEnd(false); };
  const rp = b.querySelector('[data-a=rep]'); if (rp) rp.onclick = () => repeatLastAct();
  const rw = b.querySelector('[data-a=repw]'); if (rw) rw.onclick = () => repeatWalk();
  b.querySelector('[data-a=send]').onclick = () => sendToOffice();
};
async function newActHere() {
  toast('Obteniendo posición GPS…', 2500);
  let p; try { p = await getPos(); } catch (e) { toast(geoErr(e) + ' Toca la traza en el mapa y usa «Nueva actuación aquí».', 7000); return; }
  const n = nearestTrace(L.latLng(p.lat, p.lng));
  if (!n) { toast('No hay ninguna traza KML visible. Importa o muestra el KML del camino.', 6000); return; }
  if (n.off > 50) toast(`Estás a ${Math.round(n.off)} m de «${n.f.name}». Comprueba que es la traza correcta.`, 6000);
  map.panTo([p.lat, p.lng]);
  openActEditor({ rec: n.rec, f: n.f, d0: n.d, d1: n.d, gps: true });
}
// Actuación puntual con un toque (caño, badén, arqueta…): en el PK donde estás, con los datos de la última de su tipo y «Deshacer»
async function quickPoint(type) {
  toast('Obteniendo posición GPS…', 2500);
  let p; try { p = await getPos(); } catch (e) { toast(geoErr(e), 6000); return; }
  const n = nearestTrace(L.latLng(p.lat, p.lng));
  if (!n) { toast('No hay ninguna traza KML visible. Importa o muestra el KML del camino.', 6000); return; }
  if (n.off > 50) { toast(`Estás a ${Math.round(n.off)} m de «${n.f.name}»: acércate al camino o toca la traza en el mapa.`, 7000); return; }
  hideUndo();
  const e = layers.get(n.rec.id), last = lastParamsOf(type);
  actDraft = { id: uid(), obraId: settings.activeObra, layerId: n.rec.id, featIdx: e.feats.indexOf(n.f), traceName: n.f.name, layerName: n.rec.name, d0: n.d, d1: n.d, type, side: last.side || defaultSideFor(type, 'eje'), text: '', media: [], created: Date.now(), coords: [], params: last.params, prio: '' };
  const id = actDraft.id, ob = actDraft.obraId; closeSheet(); const ok = await saveAct();
  if (ok) { buzz(50); const pr = actParamRows({ type, params: last.params }).filter(([k]) => k !== 'Prioridad').map(([, v]) => v).slice(0, 3).join(' · ');
    showUndo(`${type} en el PK ${fmtPK(n.d)}${pr ? ` (${pr}, como la última)` : ''}`, async () => { if (ob !== settings.activeObra) { toast('Ese puntual es de otra obra.'); return; } await DB.del('acts', id); acts.delete(id); drawActs(); }, 10000); }
}
async function newNoteHere() {
  toast('Obteniendo posición GPS…', 2500);
  try { const p = await getPos(); openEditor({ lat: p.lat, lng: p.lng, acc: p.acc, src: 'gps' }); map.panTo([p.lat, p.lng]); }
  catch (e) { toast(geoErr(e) + ' Mantén pulsado en el mapa para anotar en un punto concreto.', 7000); }
};

// Arrastrar ficheros sobre el mapa (ordenador)
const mapEl = map.getContainer();
mapEl.addEventListener('dragover', e => { e.preventDefault(); });
mapEl.addEventListener('drop', e => { e.preventDefault(); const f = Array.from(e.dataTransfer.files || []); if (f.length) handleIncoming(f); });

map.on('moveend', () => { const c = map.getCenter(); settings.view = [c.lat, c.lng, map.getZoom()]; clearTimeout(map._svT); map._svT = setTimeout(saveSettings, 800); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (slopePick) { $('#pickCancel').click(); return; } if (!$('#viewer').hidden) { $('#viewer').hidden = true; } else if (!$('#drawer').hidden) closeDrawer(); else if (measure) endMeasure(); else closeSheet(); } });

/* ---------------- Ficheros recibidos de otras apps ---------------- */
async function receiveShared() { // web instalada: menú Compartir de Android
  if (!('caches' in window)) return;
  const c = await caches.open('inbox'); const keys = await c.keys(); if (!keys.length) return;
  const files = [];
  for (const k of keys) {
    const r = await c.match(k);
    const blob = await r.blob();
    files.push(new File([blob], decodeURIComponent(r.headers.get('x-name') || 'compartido'), { type: blob.type }));
    await c.delete(k);
  }
  handleIncoming(files);
}
function nativeInbox() { // app nativa: «Abrir con» y «Compartir»
  const IB = Plug('Inbox'); if (!IB) return;
  const take = async () => {
    try {
      const r = await IB.take();
      const files = (r.files || []).map(f => new File([b64ToBlob(f.b64, f.mime || '')], f.name || 'archivo', { type: f.mime || '' }));
      if (files.length) handleIncoming(files);
    } catch (e) { toast('No se pudo abrir el archivo recibido: ' + (e.message || e), 6000); }
  };
  IB.addListener('files', take);
  take();
}

/* ---------------- Arranque ---------------- */
(async function init() {
  try { Object.assign(settings, (await DB.get('kv', 'settings')) || {}); } catch (e) {}
  if (settings.view) map.setView([settings.view[0], settings.view[1]], settings.view[2]);
  await setBase(settings.base in BASES ? settings.base : 'pnoa');
  try {
    for (const o of await DB.all('obras')) obras.set(o.id, o);
    // Migración: los datos de versiones anteriores pasan a una primera obra
    const [L0, N0, A0] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
    const orphans = [...L0, ...N0, ...A0].some(x => !x.obraId);
    if (!obras.size || orphans) {
      const o = obras.get(settings.activeObra) || [...obras.values()][0] || await createObra('Mi primera obra');
      for (const x of L0) if (!x.obraId) { x.obraId = o.id; await DB.put('layers', x); }
      for (const x of N0) if (!x.obraId) { x.obraId = o.id; await DB.put('notes', x); }
      for (const x of A0) if (!x.obraId) { x.obraId = o.id; await DB.put('acts', x); }
      if (!obras.get(settings.activeObra)) settings.activeObra = o.id;
    }
    if (!obras.get(settings.activeObra)) settings.activeObra = [...obras.keys()][0];
    await loadObra(settings.activeObra);
    await loadResources();
    const cat = CATALOG.find(c => c.name === 'Parcelas de Catastro');
    if (settings.catastro && ![...layers.values()].some(e => e.rec.url === cat.url)) { settings.catastro = false; saveSettings(); addService(cat, true); } // versión anterior
  } catch (e) { toast('No se pudieron leer los datos guardados: ' + e.message, 7000); }
  if (NATIVE) nativeInbox();
  else if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
  if ('launchQueue' in window) { // KML abiertos con doble clic (app instalada en el ordenador)
    window.launchQueue.setConsumer(async params => {
      if (!params.files || !params.files.length) return;
      handleIncoming(await Promise.all(params.files.map(h => h.getFile())));
    });
  }
  applySimple();
  if (settings.eulaAccepted !== EULA_VERSION) eulaSheet(true);
  else if (!settings.welcomed && !layers.size) welcomeSheet();
  try { const w = await DB.get('kv', 'walk'); if (w && w.draft) { walkAct = w; showWalkBar(); if (w.draft.obraId === settings.activeObra) { startWatch(); keepAwake(true); } } } catch (e) { /* nada */ }
  try { // borradores pendientes (y el único de versiones anteriores)
    let raw = null; try { raw = await DB.get('kv', 'drafts'); } catch (e) { /* nada */ }
    const old = await DB.get('kv', 'draft').catch(() => null);
    const list = [...(raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.values(raw) : []), ...(old ? [old] : [])];
    drafts = {};
    for (const d0 of list) { let d = null; try { d = cleanDraft(d0); } catch (e) { d = null; } if (!d || !draftHasContent(d) || drafts[d.data.id] && drafts[d.data.id].t > d.t) continue;
      const r = d.kind === 'act' ? acts.get(d.data.id) : notes.get(d.data.id);
      if (r && (d.kind === 'act' ? actKey(r) === actKey(d.data) : noteKey(r) === noteKey(d.data))) continue; // igual que lo guardado: no es un borrador
      drafts[d.data.id] = d; }
    await DB.put('kv', drafts, 'drafts'); if (old) await DB.del('kv', 'draft'); // primero se guarda lo migrado y después se borra lo antiguo
    if (refreshPending()) showDraftBar();
  } catch (e) { console.warn('borradores', e); if (!drafts || typeof drafts !== 'object') drafts = {}; }
  checkLicense(); setInterval(checkLicense, 6 * 3600e3);
  if (NATIVE) setTimeout(() => checkAppUpdate(false), 5000);
  if (new URLSearchParams(location.search).has('shared')) { history.replaceState(null, '', './'); receiveShared(); }
  drawPK();
  if (settings.lastVersion && settings.lastVersion !== APP_VERSION) { toast(`OBRA-GIS actualizada a la versión ${APP_VERSION}. Novedades en Capas → Novedades.`, 7000); }
  if (settings.lastVersion !== APP_VERSION) { settings.lastVersion = APP_VERSION; saveSettings(); }
  else if (!layers.size && !notes.size && settings.eulaAccepted) toast('Pulsa Importar para abrir un KML, un KMZ o fotos con GPS. Mantén pulsado en el mapa para ver las opciones de un punto.', 8000);
})();

// Primer uso: sin ningún plano cargado el mapa no queda en negro sin decir qué hacer
(() => { const box = document.createElement('div'); box.id = 'mapEmpty'; box.hidden = true;
  box.innerHTML = '<p><b>Aún no hay ningún plano.</b><br>Abre el plano del camino (KML o KMZ) para empezar.</p><button class="btn pri" type="button">Abrir plano</button><button class="linkbtn" type="button" data-a="restore">¿Has reinstalado la app? Recuperar mis obras</button>';
  $('#map').appendChild(box); box.querySelector('button').onclick = () => importMenu(); box.querySelector('[data-a=restore]').onclick = () => restoreFromBackup();
  box.querySelectorAll('button').forEach(x => L.DomEvent.disableClickPropagation(x)); // el resto del aviso deja pasar los toques al mapa
  let t; const upd = () => { clearTimeout(t); t = setTimeout(() => { box.hidden = layers.size > 0 || notes.size > 0; }, 150); };
  map.on('layeradd layerremove', upd); upd(); })();
