'use strict';
/* OBRA-GIS · Panel lateral (menú), unir KML, propiedades y tabla de atributos.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Panel lateral con el gestor de capas ---------------- */
let openLayerId = null, folderIds = new Map();
function openDrawer() { renderDrawer(); $('#drawer').hidden = false; $('#scrim').hidden = false; armBack(); }
function closeDrawer() { $('#drawer').hidden = true; $('#scrim').hidden = true; }

function layerRow(id, name, sub, swatch, opts) {
  const sel = selMode && layers.has(id), vis = sel ? selIds.has(id) : layerVisible(id), open = openLayerId === id && !selMode;
  return `<div class="lyr ${open ? 'open' : ''} ${sel && selIds.has(id) ? 'picked' : ''}">
    <div class="lrow" style="--dep:${opts.depth || 0}"><input type="checkbox" class="${sel ? 'selbox' : ''}" data-vis="${id}" ${vis ? 'checked' : ''} aria-label="${sel ? 'Seleccionar' : 'Mostrar'} ${esc(name)}">
      ${swatch}<button class="nm" data-open="${id}" type="button">${esc(name)}<small>${esc(sub)}</small></button>
    </div>
    ${open ? `<div class="lopts">${opts.move ? `<div class="row ord"><span class="hint grow">Orden en el mapa</span><button class="mini" data-up="${id}">${ICON.up}Subir</button><button class="mini" data-down="${id}">${ICON.down}Bajar</button></div>` : ''}${opts.body}</div>` : ''}
  </div>`;
}
function layerOptions(e) {
  const r = e.rec, t = typeOf(r), id = r.id;
  let h = '';
  if (t !== 'photos') h += `<label class="rng">Opacidad<input type="range" min="10" max="100" step="5" value="${Math.round((r.opacity ?? 1) * 100)}" data-op="${id}"></label>`;
  if (t === 'kml') h += `<label class="rng">Color<input type="color" value="${r.color}" data-col="${id}"></label>`;
  if (t === 'kml' && r.hiddenFeats && r.hiddenFeats.length) h += `<div class="row"><span class="hint grow">${r.hiddenFeats.length} elemento${r.hiddenFeats.length > 1 ? 's' : ''} oculto${r.hiddenFeats.length > 1 ? 's' : ''}: ${r.hiddenFeats.map(i => esc((e.feats[i] || {}).name || '?')).join(', ')}</span><button class="mini" data-unhide="${id}">Mostrar ocultos</button></div>`;
  if (t === 'kml' && e.feats && e.feats.some(f => f.type === 'ln')) h += `<label class="rng">PK<select data-pkstep="${id}" aria-label="Distancia entre marcas de PK de esta capa">${pkStepOptions(r.pkStep || 0, true)}</select></label>`;
  h += `<div class="field row"><input type="text" value="${esc(r.name)}" data-name="${id}" aria-label="Nombre de la capa"><button class="mini" data-rename="${id}">Renombrar</button></div>`;
  h += `<div class="row"><button class="mini" data-props="${id}">${ICON.info}Propiedades</button>${t === 'kml' ? `<button class="mini" data-attr="${id}">${ICON.table}Tabla</button><button class="mini" data-afec="${id}">Afecciones</button>` : ''}${t !== 'wms' ? `<button class="mini" data-zoom="${id}">Encuadrar</button>` : ''}${t === 'photos' ? `<button class="mini" data-sharephotos="${id}">Compartir fotos con GPS</button>` : ''}<button class="mini del" data-dell="${id}">Eliminar capa</button></div>`;
  h += `<div class="field row"><input type="text" list="folderList" value="${esc(folderOf(r))}" data-folder="${id}" aria-label="Carpeta de la capa"><button class="mini" data-movefolder="${id}">Mover a carpeta</button></div>`;
  if (t === 'wms' && r.kind !== 'wmts') h += `<div class="legend"><img src="${esc(legendUrl(r))}" alt="Leyenda de ${esc(r.name)}" onerror="this.parentNode.remove()"></div>`;
  if (t === 'wms') h += `<p class="hint">${esc(r.url)}${r.layers ? ' · ' + esc(r.layers) : ''}${r.cover ? ' · cobertura: ' + esc(r.cover) : ''}</p>`;
  return h;
}
const legendUrl = r => `${r.url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${encodeURIComponent(r.layers.split(',')[0])}`;
function layerSub(e) {
  const t = typeOf(e.rec);
  if (t === 'kml') return `KML · ${plural(e.feats.length, 'elemento', 'elementos')}`;
  if (t === 'wms') return 'Servicio' + (e.rec.cover ? ' · ' + e.rec.cover : '');
  const n = [...notes.values()].filter(x => x.layerId === e.rec.id).length;
  return `Fotos con GPS · ${n}`;
}
const DEFAULT_FOLDER = { kml: 'Trazas y KML', wms: 'Servicios y afecciones', photos: 'Fotos importadas' };
const folderOf = rec => (rec.folder || '').trim() || DEFAULT_FOLDER[typeOf(rec)] || 'Capas';
// Árbol de carpetas: la ruta de carpeta usa «/» (p. ej. «Proyecto/Tramo 1»). Las carpetas vacías se guardan en la obra.
let selMode = false; const selIds = new Set();
function buildTree(entries) {
  const root = { name: '', path: '', folders: new Map(), layers: [] };
  const ensure = path => {
    const parts = String(path || '').split('/').map(x => x.trim()).filter(Boolean);
    let node = root, acc = '';
    for (const p of parts) { acc = acc ? acc + '/' + p : p; if (!node.folders.has(p)) node.folders.set(p, { name: p, path: acc, folders: new Map(), layers: [] }); node = node.folders.get(p); }
    return node;
  };
  const o = obras.get(settings.activeObra); (o && o.folders || []).forEach(ensure);
  entries.forEach(e => ensure(folderOf(e.rec)).layers.push(e));
  return root;
}
const treeLayers = node => [...node.layers, ...[...node.folders.values()].flatMap(treeLayers)];
function layerSwatch(e) {
  return isPointLayer(e.rec) ? `<span class="sw pin-sw photo"></span>` : typeOf(e.rec) === 'kml' ? `<span class="sw" style="background:${e.rec.color}"></span>` : `<span class="sw ic">${ICON.wms}</span>`;
}
async function renderDrawer() {
  const d = $('#drawer');
  const scroll = d.scrollTop;
  const ordered = orderedLayers();
  const photoLayers = [...layers.values()].filter(e => isPointLayer(e.rec)).sort((a, b) => b.rec.created - a.rec.created);
  const own = [...notes.values()].filter(n => !n.layerId).sort((a, b) => b.created - a.created);
  let storage = '';
  try { const e = await navigator.storage.estimate(); storage = `${(e.usage / 1048576).toFixed(1).replace('.', ',')} MB usados en el dispositivo`; } catch (e) {}
  const obra = obras.get(settings.activeObra);
  [...selIds].forEach(id => { if (!layers.has(id)) selIds.delete(id); });

  const fieldRows = layerRow('acts', 'Actuaciones en trazas', `${acts.size} actuaciones`, `<span class="sw" style="background:linear-gradient(90deg,#8d6e63,#1e88e5,#00acc1)"></span>`,
    { move: false, body: `<div class="row"><button class="mini" data-actlist>Ver listado</button></div>` })
    + layerRow('notes', 'Mis anotaciones', `${own.length} anotaciones`, `<span class="sw pin-sw note"></span>`,
    { move: false, body: `<div class="row"><button class="mini" data-zoom="notes">Encuadrar</button></div>` })
    + layerRow('res', 'Recursos (todas las obras)', `${resources.size} plantas, canteras…`, `<span class="sw res-sw"></span>`,
    { move: false, body: `<div class="row"><button class="mini" data-reslist>Ver y editar</button></div>` });
  folderIds = new Map([['Datos de campo', ['acts', 'notes', 'res']]]);
  const folderHead = (key, name, path, ids, count, depth, extra = '') => {
    const closed = settings.collapsed && settings.collapsed[key];
    const anyVis = ids.some(id => layerVisible(id));
    return `<div class="fhead" style="--dep:${depth}"><input type="checkbox" data-fvis="${esc(key)}" ${anyVis ? 'checked' : ''} aria-label="Mostrar carpeta ${esc(name)}">
      <button class="fname" data-fold="${esc(key)}" ${path ? `data-fpress="${esc(path)}"` : ''} type="button"><span class="caret">${closed ? ICON.right : ICON.down}</span>${ICON.folder}<span class="ft">${esc(name)}</span><small>${count}</small></button>${extra}</div>`;
  };
  const renderNode = (node, depth) => {
    let h = '';
    for (const fnode of node.folders.values()) {
      const all = treeLayers(fnode), key = 'f:' + fnode.path, closed = settings.collapsed && settings.collapsed[key];
      folderIds.set(key, all.map(e => e.rec.id));
      h += `<div class="folder ${closed ? '' : 'open'}">${folderHead(key, fnode.name, fnode.path, all.map(e => e.rec.id), all.length, depth, `<button class="mini ic" data-fmenu="${esc(fnode.path)}" aria-label="Opciones de la carpeta">${ICON.dots}</button>`)}
        ${closed ? '' : `<div class="fbody">${renderNode(fnode, depth + 1)}${fnode.layers.map(e => layerRow(e.rec.id, e.rec.name, layerSub(e), layerSwatch(e), { move: !isPointLayer(e.rec) && !selMode, depth: depth + 1, body: layerOptions(e) })).join('')}${!fnode.layers.length && !fnode.folders.size ? '<p class="empty fe">Carpeta vacía. Mueve capas aquí desde sus opciones o seleccionándolas.</p>' : ''}</div>`}
      </div>`;
    }
    return h;
  };
  const tree = buildTree([...ordered, ...photoLayers]);
  const looseRows = tree.layers.map(e => layerRow(e.rec.id, e.rec.name, layerSub(e), layerSwatch(e), { move: !isPointLayer(e.rec) && !selMode, depth: 0, body: layerOptions(e) })).join('');
  const treeHtml = `<div class="folder ${settings.collapsed && settings.collapsed['Datos de campo'] ? '' : 'open'}">${folderHead('Datos de campo', 'Datos de campo', '', ['acts', 'notes', 'res'], 3, 0)}${settings.collapsed && settings.collapsed['Datos de campo'] ? '' : `<div class="fbody">${fieldRows}</div>`}</div>` + renderNode(tree, 0) + looseRows;
  const allPaths = []; (function walk(n) { n.folders.forEach(f => { allPaths.push(f.path); walk(f); }); })(tree);
  const folderNames = [...new Set([...allPaths, ...Object.values(DEFAULT_FOLDER), 'Proyecto', 'Replanteo', 'Afecciones'])];
  const nSel = selIds.size, selKml = [...selIds].filter(id => typeOf(layers.get(id).rec) === 'kml').length;

  d.innerHTML = `<div class="dhead"><h2>OBRA-GIS</h2><button class="mini ic" id="dClose" aria-label="Cerrar">${ICON.close}</button></div>
    <button class="obra-card" data-t="obras" type="button"><small>Obra activa</small><b>${esc(obra ? obra.name : '—')}</b><span>${obras.size} obra${obras.size === 1 ? '' : 's'} · Cambiar, crear o compartir</span></button>
    ${selMode ? `<div class="selbar"><div class="selhead"><b>${nSel} capa${nSel === 1 ? '' : 's'} seleccionada${nSel === 1 ? '' : 's'}</b><button class="mini" data-s="all">Todas</button><button class="mini" data-s="cancel">Cancelar</button></div>
      <div class="selacts">
        <button class="mini" data-s="show" ${nSel ? '' : 'disabled'}>Mostrar</button><button class="mini" data-s="hide" ${nSel ? '' : 'disabled'}>Ocultar</button>
        <button class="mini ic" data-s="up" aria-label="Subir" ${nSel ? '' : 'disabled'}>${ICON.up}</button><button class="mini ic" data-s="down" aria-label="Bajar" ${nSel ? '' : 'disabled'}>${ICON.down}</button>
        <button class="mini" data-s="folder" ${nSel ? '' : 'disabled'}>${ICON.folder}Agrupar en carpeta</button>
        <button class="mini" data-s="union" ${selKml >= 2 ? '' : 'disabled'}>Unir KML</button>
        <button class="mini" data-s="afec" ${selKml >= 1 ? '' : 'disabled'}>Informe de afecciones</button>
        <button class="mini" data-s="export" ${nSel ? '' : 'disabled'}>Exportar / compartir</button>
        <button class="mini del" data-s="del" ${nSel ? '' : 'disabled'}>Eliminar</button>
      </div></div>` : ''}
    <div class="acts"><button class="btn go full" data-t="send">Enviar a la oficina</button></div>
    <div class="treehead"><h3>Capas de la obra</h3><button class="mini" data-t="newfolder">${ICON.folder}Nueva carpeta</button>${selMode ? '' : '<button class="mini" data-t="selmode">Seleccionar</button>'}</div>
    <div class="tree ${selMode ? 'selecting' : ''}">${treeHtml}</div>
    <datalist id="folderList">${folderNames.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <p class="hint">${selMode ? 'Toca las capas para marcarlas. Mantén pulsada una carpeta para marcar todo su contenido.' : 'Mantén pulsada una capa para seleccionar varias (exportar, agrupar, unir, ordenar). Las KML se dibujan siempre sobre las de imagen.'}</p>
    <div class="acts"><button class="btn pri full" data-t="add">${ICON.plus}Añadir capa</button></div>
    <h3>Mapa base</h3>
    ${Object.entries(BASES).map(([id, b]) => `<label class="opt"><input type="radio" name="base" value="${id}" ${settings.base === id ? 'checked' : ''}>${esc(b.name)}</label>`).join('')}
    <h3>Mis anotaciones (${own.length})</h3>
    ${own.length ? own.slice(0, 50).map(n => `<div class="nrow" data-note="${n.id}"><span class="pin ${noteType(n)}" style="transform:scale(.7)"><span></span>${ICON[noteType(n)]}</span>
      <span class="t"><b>${esc(n.title)}</b><small>${fmtDate(n.created)} · ${(n.media || []).length} archivos</small></span></div>`).join('')
      : '<p class="empty">Mantén pulsado en el mapa o usa el botón naranja para crear la primera.</p>'}
    <h3>Informes y datos</h3>
    <div class="acts mlist">
      <button class="btn full" data-t="actlist">${ICON.road}Listado de actuaciones (${acts.size})</button>
      <button class="btn full" data-t="visit">${ICON.note}Informe de la visita</button>
      <button class="btn full" data-t="bc3">Presupuesto (BC3 para Presto o Arquímedes)</button>
      <button class="btn full" data-t="csv">Tabla para Excel (CSV)</button>
    </div>
    <h3 class="tech">Herramientas</h3>
    <div class="acts mlist tech">
      <button class="btn full" data-t="measure">${ICON.ruler}Medir distancia o superficie</button>
      <button class="btn full" data-t="calc">${ICON.calc}Calculadora</button>
      <button class="btn full" data-t="afec">${ICON.layers}Informe de afecciones</button>
    </div>
    <details class="more dmore tech"><summary>Más herramientas</summary><div class="acts mlist">
      <button class="btn full" data-t="fichas">${ICON.note}Fichas de inspección de campo</button>
      <button class="btn full" data-t="reslist">${ICON.pin}Recursos (plantas, canteras, vertederos)</button>
      <button class="btn full" data-t="export">Compartir para Google Earth (KMZ)</button>
      <button class="btn full" data-t="offline">Mapas sin conexión</button>
    </div></details>
    <details class="more dmore" ${settings.setOpen ? 'open' : ''} id="dSet"><summary>Ajustes</summary>
    <label class="opt"><input type="checkbox" id="chkSimple" ${settings.simple ? 'checked' : ''}>Modo sencillo: letra grande y solo lo necesario para apuntar en campo</label>
    <div class="field"><label for="selTravel">Indicaciones de Google Maps</label>
      <select id="selTravel"><option value="driving">En coche</option><option value="walking">A pie</option></select></div>
    <label class="opt"><input type="checkbox" id="chkPK" ${settings.pk ? 'checked' : ''}>Marcas de PK en las trazas (al acercar el mapa)</label>
    <label class="opt tech"><input type="checkbox" id="chkPKsub" ${settings.pkSub !== false ? 'checked' : ''}>Subcalibración al acercar (marcas intermedias hasta cada 10 m)</label>
    <label class="opt"><input type="checkbox" id="chkLive" ${settings.livePK !== false ? 'checked' : ''}>PK en directo: con el GPS activo, muestra la traza, el PK y el margen donde estás</label>
    <div class="field tech"><label for="selPkStep">Calibración general de los KML (distancia entre PK)</label><select id="selPkStep">${pkStepOptions(settings.pkStep || PK_STEP, false)}</select></div>
    <label class="opt"><input type="checkbox" id="chkStamp" ${settings.stamp ? 'checked' : ''}>Sellar fecha y coordenadas en las fotos que hago</label>
    </details>
    <div class="version"><span>OBRA-GIS <b>v${APP_VERSION}</b> · ${NATIVE ? 'app Android' : 'versión web'}</span><button class="mini" data-t="news" type="button">Novedades</button><button class="mini" data-t="lic" type="button">Licencia</button><button class="mini" data-t="upd" type="button">Buscar actualización</button></div>
    <p class="hint">${storage}</p>`;
  d.scrollTop = scroll;

  $('#dClose').onclick = closeDrawer;
  { const ds = $('#dSet'); if (ds) ds.ontoggle = () => { settings.setOpen = ds.open; saveSettings(); }; }
  d.querySelectorAll('input[name=base]').forEach(r => r.onchange = () => setBase(r.value));
  d.querySelectorAll('[data-vis]').forEach(c => c.onchange = () => {
    if (selMode && layers.has(c.dataset.vis)) { c.checked ? selIds.add(c.dataset.vis) : selIds.delete(c.dataset.vis); renderDrawer(); return; }
    setLayerVisible(c.dataset.vis, c.checked);
  });
  d.querySelectorAll('[data-open]').forEach(bt => {
    bt.onclick = () => {
      const id = bt.dataset.open;
      if (Date.now() - longPressAt < 700) return;
      if (selMode) { if (layers.has(id)) { selIds.has(id) ? selIds.delete(id) : selIds.add(id); renderDrawer(); } return; }
      openLayerId = openLayerId === id ? null : id; renderDrawer();
    };
    if (layers.has(bt.dataset.open)) onLongPress(bt, () => { selMode = true; selIds.add(bt.dataset.open); openLayerId = null; renderDrawer(); if (navigator.vibrate) navigator.vibrate(30); });
  });
  d.querySelectorAll('[data-fpress]').forEach(bt => onLongPress(bt, () => {
    const key = 'f:' + bt.dataset.fpress; selMode = true; (folderIds.get(key) || []).forEach(id => selIds.add(id)); renderDrawer(); if (navigator.vibrate) navigator.vibrate(30);
  }));
  d.querySelectorAll('[data-up]').forEach(bt => bt.onclick = () => moveLayer(bt.dataset.up, -1));
  d.querySelectorAll('[data-down]').forEach(bt => bt.onclick = () => moveLayer(bt.dataset.down, 1));
  d.querySelectorAll('[data-zoom]').forEach(bt => bt.onclick = () => {
    const id = bt.dataset.zoom;
    if (!layerVisible(id)) setLayerVisible(id, true);
    closeDrawer(); zoomToLayer(id);
  });
  d.querySelectorAll('[data-dell]').forEach(bt => bt.onclick = () => deleteLayer(bt.dataset.dell));
  d.querySelectorAll('[data-props]').forEach(bt => bt.onclick = () => { closeDrawer(); layerProps(bt.dataset.props); });
  d.querySelectorAll('[data-attr]').forEach(bt => bt.onclick = () => { closeDrawer(); attrTable(bt.dataset.attr); });
  d.querySelectorAll('[data-op]').forEach(r => {
    r.oninput = () => {
      const e = layers.get(r.dataset.op), v = +r.value / 100;
      e.rec.opacity = v;
      if (e.tile) e.tile.setOpacity(v);
    };
    r.onchange = async () => { const id = r.dataset.op; await updateLayer(id, { opacity: +r.value / 100 }); if (typeOf(layers.get(id).rec) === 'kml') rebuildLayer(id); };
  });
  d.querySelectorAll('[data-unhide]').forEach(bt => bt.onclick = async () => { await updateLayer(bt.dataset.unhide, { hiddenFeats: [] }); rebuildLayer(bt.dataset.unhide); renderDrawer(); });
  d.querySelectorAll('[data-afec]').forEach(bt => bt.onclick = () => { closeDrawer(); afecSheet([bt.dataset.afec]); });
  d.querySelectorAll('[data-pkstep]').forEach(sel => sel.onchange = async () => {
    const id = sel.dataset.pkstep, rec = layers.get(id).rec, v = askPkStep(sel, rec.pkStep);
    if (v === undefined) { renderDrawer(); return; }
    await updateLayer(id, { pkStep: v || null }); rebuildLayer(id); renderDrawer();
    toast(`«${rec.name}»: PK cada ${fmtStep(pkStepOf(layers.get(id).rec))}${v ? '' : ' (calibración general)'}.`);
  });
  d.querySelectorAll('[data-col]').forEach(c => c.onchange = async () => { await updateLayer(c.dataset.col, { color: c.value }); rebuildLayer(c.dataset.col); renderDrawer(); });
  d.querySelectorAll('[data-rename]').forEach(bt => bt.onclick = async () => {
    const id = bt.dataset.rename, v = d.querySelector(`[data-name="${id}"]`).value.trim();
    if (!v) return; await updateLayer(id, { name: v }); renderDrawer(); toast('Capa renombrada');
  });
  d.querySelectorAll('[data-note]').forEach(r => r.onclick = () => {
    const n = notes.get(r.dataset.note); closeDrawer();
    if (!layerVisible('notes')) setLayerVisible('notes', true);
    map.setView([n.lat, n.lng], Math.max(map.getZoom(), 17)); viewNote(n.id);
  });
  d.querySelector('[data-t=add]').onclick = () => { closeDrawer(); importMenu(); };
  d.querySelector('[data-t=obras]').onclick = () => { closeDrawer(); obrasSheet(); };
  d.querySelectorAll('[data-sharephotos]').forEach(bt => bt.onclick = () => { const id = bt.dataset.sharephotos; sharePhotos([...notes.values()].filter(n => n.layerId === id), layers.get(id).rec.name); });
  d.querySelector('[data-t=news]').onclick = () => { closeDrawer(); newsSheet(); };
  d.querySelector('[data-t=lic]').onclick = () => { closeDrawer(); licenseSheet(); };
  d.querySelector('[data-t=upd]').onclick = () => { closeDrawer(); checkAppUpdate(true); };
  d.querySelectorAll('[data-fold]').forEach(bt => bt.onclick = () => { if (Date.now() - longPressAt < 700) return; settings.collapsed = settings.collapsed || {}; settings.collapsed[bt.dataset.fold] = !settings.collapsed[bt.dataset.fold]; saveSettings(); renderDrawer(); });
  d.querySelectorAll('[data-fvis]').forEach(c => c.onchange = async () => { for (const id of folderIds.get(c.dataset.fvis) || []) await setLayerVisible(id, c.checked); renderDrawer(); });
  d.querySelectorAll('[data-fmenu]').forEach(bt => bt.onclick = () => folderMenu(bt.dataset.fmenu));
  d.querySelectorAll('[data-movefolder]').forEach(bt => bt.onclick = async () => {
    const id = bt.dataset.movefolder, v = d.querySelector(`[data-folder="${id}"]`).value.trim().replace(/\s*\/\s*/g, '/');
    await updateLayer(id, { folder: v }); settings.collapsed['f:' + v] = false; renderDrawer(); toast(v ? `Capa movida a «${v}»` : 'Capa devuelta a su carpeta por defecto');
  });
  d.querySelector('[data-t=newfolder]').onclick = () => newFolderSheet('');
  const sm = d.querySelector('[data-t=selmode]'); if (sm) sm.onclick = () => { selMode = true; openLayerId = null; renderDrawer(); };
  d.querySelectorAll('[data-s]').forEach(bt => bt.onclick = () => selectionAction(bt.dataset.s));
  d.querySelector('[data-t=export]').onclick = exportKMZ;
  d.querySelector('[data-t=csv]').onclick = exportActsCSV;
  d.querySelector('[data-t=actlist]').onclick = () => { closeDrawer(); actList(); };
  const al = d.querySelector('[data-actlist]'); if (al) al.onclick = () => { closeDrawer(); actList(); };
  d.querySelectorAll('[data-reslist], [data-t=reslist]').forEach(bt => bt.onclick = () => { closeDrawer(); resourceList(); });
  d.querySelector('[data-t=calc]').onclick = () => { closeDrawer(); calcSheet(); };
  d.querySelector('[data-t=fichas]').onclick = () => { closeDrawer(); fichaList(); };
  d.querySelector('[data-t=afec]').onclick = () => { closeDrawer(); afecSheet(); };
  d.querySelector('[data-t=send]').onclick = () => { closeDrawer(); sendToOffice(); };
  d.querySelector('[data-t=bc3]').onclick = () => { closeDrawer(); bc3Sheet(); };
  $('#chkSimple').onchange = e => { settings.simple = e.target.checked; saveSettings(); applySimple(); renderDrawer(); };
  d.querySelector('[data-t=visit]').onclick = () => { closeDrawer(); visitReportSheet(); };
  d.querySelector('[data-t=measure]').onclick = () => { closeDrawer(); startMeasure(); };
  d.querySelector('[data-t=offline]').onclick = () => { closeDrawer(); offlineSheet(); };
  const sel = $('#selTravel'); sel.value = settings.travel; sel.onchange = () => { settings.travel = sel.value; saveSettings(); };
  $('#chkStamp').onchange = e => { settings.stamp = e.target.checked; saveSettings(); };
  $('#chkPK').onchange = e => { settings.pk = e.target.checked; saveSettings(); drawPK(); };
  $('#chkPKsub').onchange = e => { settings.pkSub = e.target.checked; saveSettings(); drawPK(); };
  $('#chkLive').onchange = e => { settings.livePK = e.target.checked; saveSettings(); livePkT = 0; updateLivePK(); };
  $('#selPkStep').onchange = e => {
    const v = askPkStep(e.target, settings.pkStep); if (!v) { renderDrawer(); return; }
    settings.pkStep = v; saveSettings();
    layers.forEach((en, id) => { if (typeOf(en.rec) === 'kml' && !en.rec.pkStep) rebuildLayer(id); });
    toast(`PK cada ${fmtStep(v)} en los KML sin calibración propia.`); renderDrawer();
  };
}
let longPressAt = 0;
function onLongPress(el, fn) {
  let t = null, sx = 0, sy = 0;
  const clear = () => { if (t) { clearTimeout(t); t = null; } };
  el.addEventListener('touchstart', e => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; clear(); t = setTimeout(() => { t = null; longPressAt = Date.now(); fn(); }, 550); }, { passive: true });
  el.addEventListener('touchmove', e => { const p = e.touches[0]; if (Math.hypot(p.clientX - sx, p.clientY - sy) > 10) clear(); }, { passive: true });
  el.addEventListener('touchend', clear, { passive: true });
  el.addEventListener('contextmenu', e => { e.preventDefault(); longPressAt = Date.now(); fn(); }); // clic derecho en el ordenador
}
async function saveObraFolders(list) {
  const o = obras.get(settings.activeObra); if (!o) return;
  o.folders = [...new Set(list.filter(Boolean))].sort(); await DB.put('obras', o);
}
function newFolderSheet(parent) {
  const b = openSheet(`<h2>Nueva carpeta</h2><p class="sub">${parent ? 'Dentro de «' + esc(parent) + '»' : 'En la raíz de la obra'}</p>
    <div class="field"><input type="text" id="nfName" placeholder="Nombre (p. ej. Tramo 1)"></div>
    <p class="hint">Puedes crear varios niveles a la vez separándolos con «/», por ejemplo «Proyecto/Tramo 1/Drenaje».</p>
    <div class="acts"><button class="btn pri full" data-a="ok">Crear carpeta</button></div>`);
  b.querySelector('[data-a=ok]').onclick = async () => {
    const n = $('#nfName').value.trim().replace(/\s*\/\s*/g, '/').replace(/^\/|\/$/g, ''); if (!n) { toast('Escribe el nombre de la carpeta.'); return; }
    const path = parent ? parent + '/' + n : n, o = obras.get(settings.activeObra);
    await saveObraFolders([...(o.folders || []), path]); closeSheet(); openDrawer(); toast(`Carpeta «${path}» creada`);
  };
}
function folderMenu(path) {
  const all = [...layers.values()].filter(e => folderOf(e.rec) === path || folderOf(e.rec).startsWith(path + '/'));
  const b = openSheet(`<h2>${ICON.folder} ${esc(path.split('/').pop())}</h2><p class="sub">${esc(path)} · ${all.length} capas</p>
    <div class="field row"><input type="text" id="fRen" value="${esc(path.split('/').pop())}" aria-label="Nombre de la carpeta"><button class="mini" data-a="ren">Renombrar</button></div>
    <div class="acts">
      <button class="btn" data-a="sub">${ICON.folder}Nueva subcarpeta</button>
      <button class="btn" data-a="sel">Seleccionar sus capas</button>
      <button class="btn del full" data-a="del">Eliminar carpeta (las capas pasan a la carpeta superior)</button>
    </div>`);
  b.querySelector('[data-a=sub]').onclick = () => newFolderSheet(path);
  b.querySelector('[data-a=sel]').onclick = () => { closeSheet(); selMode = true; all.forEach(e => selIds.add(e.rec.id)); openDrawer(); };
  b.querySelector('[data-a=ren]').onclick = async () => {
    const nn = $('#fRen').value.trim().replace(/\//g, '-'); if (!nn) return;
    const np = path.split('/').slice(0, -1).concat(nn).join('/'), swap = p => p === path ? np : p.startsWith(path + '/') ? np + p.slice(path.length) : p;
    for (const e of all) await updateLayer(e.rec.id, { folder: swap(folderOf(e.rec)) });
    const o = obras.get(settings.activeObra); await saveObraFolders((o.folders || []).map(swap));
    closeSheet(); openDrawer(); toast('Carpeta renombrada');
  };
  b.querySelector('[data-a=del]').onclick = async () => {
    const parent = path.split('/').slice(0, -1).join('/'), swap = p => p === path ? parent : p.startsWith(path + '/') ? (parent ? parent + '/' : '') + p.slice(path.length + 1) : p;
    for (const e of all) await updateLayer(e.rec.id, { folder: swap(folderOf(e.rec)) });
    const o = obras.get(settings.activeObra); await saveObraFolders((o.folders || []).filter(p => p !== path).map(swap));
    closeSheet(); openDrawer(); toast('Carpeta eliminada');
  };
}
async function selectionAction(act) {
  const ids = [...selIds].filter(id => layers.has(id)), ents = ids.map(id => layers.get(id));
  if (act === 'cancel') { selMode = false; selIds.clear(); return renderDrawer(); }
  if (act === 'all') { layers.forEach((e, id) => selIds.add(id)); return renderDrawer(); }
  if (!ids.length) return;
  if (act === 'show' || act === 'hide') { for (const id of ids) await setLayerVisible(id, act === 'show'); return renderDrawer(); }
  if (act === 'up' || act === 'down') return groupMove(ids.filter(id => !isPointLayer(layers.get(id).rec)), act === 'up' ? -1 : 1);
  if (act === 'del') {
    const nActs = [...acts.values()].filter(a => ids.includes(a.layerId)).length;
    if (!confirm(`¿Quitar ${ids.length} capas de la obra? Las fotos importadas de esas capas también se borrarán.${nActs ? ` Sus ${nActs} actuaciones se conservan sin traza y se volverán a enlazar si vuelves a cargar esos KML.` : ''}`)) return;
    for (const id of ids) { const e = layers.get(id); map.removeLayer(mapLayerOf(e)); for (const n of [...notes.values()].filter(n => n.layerId === id)) { await DB.del('notes', n.id); notes.delete(n.id); removeNoteMarker(n.id); } layers.delete(id); await DB.del('layers', id); }
    selIds.clear(); selMode = false; drawPK(); drawActs(); drawWidths(); renderDrawer(); return toast('Capas eliminadas');
  }
  if (act === 'folder') {
    closeDrawer();
    const tree = buildTree([...layers.values()]); const paths = []; (function walk(n) { n.folders.forEach(f => { paths.push(f.path); walk(f); }); })(tree);
    const b = openSheet(`<h2>Agrupar en carpeta</h2><p class="sub">${ids.length} capas</p>
      <div class="field"><input type="text" id="gFolder" list="gFolders" placeholder="Carpeta (p. ej. Proyecto/Tramo 1)"><datalist id="gFolders">${paths.map(p => `<option value="${esc(p)}">`).join('')}</datalist></div>
      <div class="chips">${paths.map(p => `<button class="chip" data-p="${esc(p)}" style="--c:var(--accent)" type="button">${esc(p)}</button>`).join('')}</div>
      <div class="acts"><button class="btn pri full" data-a="ok">Mover a esta carpeta</button><button class="btn full" data-a="root">Sacar de las carpetas (carpeta por defecto)</button></div>`);
    b.querySelectorAll('[data-p]').forEach(c => c.onclick = () => { $('#gFolder').value = c.dataset.p; });
    const go = async v => { for (const id of ids) await updateLayer(id, { folder: v }); if (v) { const o = obras.get(settings.activeObra); await saveObraFolders([...(o.folders || []), v]); settings.collapsed['f:' + v] = false; } selMode = false; selIds.clear(); closeSheet(); openDrawer(); toast(v ? `${ids.length} capas en «${v}»` : 'Capas devueltas a su carpeta por defecto'); };
    b.querySelector('[data-a=ok]').onclick = () => { const v = $('#gFolder').value.trim().replace(/\s*\/\s*/g, '/').replace(/^\/|\/$/g, ''); if (!v) { toast('Escribe o elige una carpeta.'); return; } go(v); };
    b.querySelector('[data-a=root]').onclick = () => go('');
    return;
  }
  if (act === 'afec') { closeDrawer(); const k = ids.filter(id => typeOf(layers.get(id).rec) === 'kml'); selMode = false; selIds.clear(); return afecSheet(k); }
  if (act === 'union') { closeDrawer(); return unionSheet(ents.filter(e => typeOf(e.rec) === 'kml')); }
  if (act === 'export') return exportLayersKMZ(ents);
}

/* ---------------- Unir varios KML en uno ----------------
   Cada KML de origen pasa a una carpeta del KML nuevo. Se conservan estilos (con prefijo para no chocar),
   atributos (ExtendedData), descripciones y la estructura de carpetas interna. */
const KML_NS = 'http://www.opengis.net/kml/2.2';
function unionKmlText(recs, name) {
  const out = document.implementation.createDocument(KML_NS, 'kml', null);
  const D = out.createElementNS(KML_NS, 'Document'); out.documentElement.appendChild(D);
  const nm = out.createElementNS(KML_NS, 'name'); nm.textContent = name; D.appendChild(nm);
  recs.forEach((r, i) => {
    const src = new DOMParser().parseFromString(r.text, 'application/xml'), pre = 'u' + (i + 1) + '_';
    [...byTag(src, 'Style'), ...byTag(src, 'StyleMap'), ...byTag(src, 'Schema')].forEach(st => { const id = st.getAttribute('id'); if (id) st.setAttribute('id', pre + id); });
    byTag(src, 'styleUrl').forEach(u => { const t = u.textContent.trim(); if (t.includes('#') && !/^https?:/.test(t)) u.textContent = '#' + pre + t.replace(/^.*#/, ''); });
    byTag(src, 'SchemaData').forEach(sd => { const t = sd.getAttribute('schemaUrl'); if (t) sd.setAttribute('schemaUrl', '#' + pre + t.replace(/^.*#/, '')); });
    const srcDoc = byTag(src, 'Document')[0] || src.documentElement;
    const F = out.createElementNS(KML_NS, 'Folder'), fn = out.createElementNS(KML_NS, 'name'); fn.textContent = r.name; F.appendChild(fn);
    [...srcDoc.children].forEach(ch => {
      if (['Style', 'StyleMap', 'Schema'].includes(ch.localName)) D.insertBefore(out.importNode(ch, true), D.children[1] || null);
      else if (!['name', 'open', 'visibility', 'LookAt', 'Camera'].includes(ch.localName)) F.appendChild(out.importNode(ch, true));
    });
    // estilos definidos en carpetas internas siguen funcionando: se dejan donde estaban
    D.appendChild(F);
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(out);
}
function unionSheet(ents) {
  if (ents.length < 2) { toast('Selecciona al menos dos capas KML.'); return; }
  const total = ents.reduce((s2, e) => s2 + e.feats.length, 0);
  const b = openSheet(`<h2>Unir KML</h2><p class="sub">${ents.length} capas · ${total} elementos</p>
    <ul class="ulist">${ents.map(e => `<li>${esc(e.rec.name)} <small>(${e.feats.length})</small></li>`).join('')}</ul>
    <div class="field"><input type="text" id="unName" value="${esc(ents.map(e => e.rec.name).join(' + ').slice(0, 60))}" aria-label="Nombre del KML unido"></div>
    <label class="opt"><input type="checkbox" id="unDel">Quitar las capas originales (sus actuaciones y anchos pasan a la capa unida)</label>
    <div class="acts"><button class="btn pri full" data-a="ok">Crear KML unido</button></div>
    <p class="hint">Cada KML original queda como una carpeta dentro del nuevo, con sus estilos, atributos y descripciones.</p>`);
  b.querySelector('[data-a=ok]').onclick = async () => {
    const name = $('#unName').value.trim() || 'KML unido', del = $('#unDel').checked;
    const recs = ents.map(e => e.rec), text = unionKmlText(recs, name);
    const ne = await saveKmlLayer(name, text, { folder: ents[0].rec.folder || '' });
    if (ne.feats.length !== total) toast(`Aviso: el KML unido tiene ${ne.feats.length} elementos y los originales sumaban ${total}.`, 7000);
    if (del) {
      let off = 0; const widths = {}, hidden = [];
      for (const e of ents) {
        for (const a of [...acts.values()].filter(a => a.layerId === e.rec.id)) { a.layerId = ne.rec.id; a.featIdx = off + a.featIdx; a.layerName = name; await DB.put('acts', a); }
        Object.entries(e.rec.widths || {}).forEach(([fi, w]) => { widths[off + +fi] = w; });
        (e.rec.hiddenFeats || []).forEach(i => hidden.push(off + i)); // los elementos ocultos siguen ocultos
        off += e.feats.length;
        map.removeLayer(mapLayerOf(e)); layers.delete(e.rec.id); await DB.del('layers', e.rec.id);
      }
      if (Object.keys(widths).length || hidden.length) { if (Object.keys(widths).length) ne.rec.widths = widths; if (hidden.length) ne.rec.hiddenFeats = hidden; await DB.put('layers', ne.rec); rebuildLayer(ne.rec.id); }
    }
    selMode = false; selIds.clear(); closeSheet(); drawActs(); drawWidths(); drawPK();
    map.fitBounds(ne.group.getBounds().pad(0.1), { maxZoom: 17 });
    toast(`KML unido «${name}» creado con ${ne.feats.length} elementos.`, 5000);
  };
}
async function exportLayersKMZ(ents) {
  const kmls = ents.filter(e => typeOf(e.rec) === 'kml'), photos = ents.filter(e => isPointLayer(e.rec)), wms = ents.filter(e => typeOf(e.rec) === 'wms');
  if (!kmls.length && !photos.length) { toast('Las capas de servicios (WMS) no se pueden exportar: son imágenes de un servidor. Selecciona capas KML o de fotos.', 6000); return; }
  toast('Preparando KMZ…', 8000);
  const zip = new JSZip(); const name = ents.length === 1 ? ents[0].rec.name : `capas_${new Date().toISOString().slice(0, 10)}`;
  let text = kmls.length ? unionKmlText(kmls.map(e => e.rec), name) : `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="${KML_NS}"><Document><name>${xml(name)}</name></Document></kml>`;
  if (photos.length) {
    let extra = '';
    photos.forEach(e => {
      extra += `<Folder><name>${xml(e.rec.name)}</name>`;
      [...notes.values()].filter(n => n.layerId === e.rec.id).forEach(n => {
        let html = `<p>${esc(fmtDate(n.created))}<br>${esc(fmtLL(n.lat, n.lng))}</p>`;
        (n.media || []).forEach((m, i) => { const fnm = `files/${n.id}_${i + 1}.${extFor(m)}`; zip.file(fnm, m.blob); html += `<p><img src="${fnm}" width="480"></p>`; });
        extra += `<Placemark><name>${xml(n.title)}</name><description>${cdata(html)}</description><Point><coordinates>${n.lng.toFixed(7)},${n.lat.toFixed(7)},0</coordinates></Point></Placemark>`;
      });
      extra += '</Folder>';
    });
    text = text.replace(/<\/Document>\s*<\/kml>\s*$/, extra + '</Document></kml>');
  }
  zip.file('doc.kml', text);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' });
  try { await saveBlob(blob, safeName(name) + '.kmz'); toast(`Exportadas ${kmls.length + photos.length} capas${wms.length ? ' (las de servicios WMS no se exportan)' : ''}.`, 5000); }
  catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 6000); }
}

/* ---------------- Propiedades de una capa ---------------- */
function layerProps(id) {
  const e = layers.get(id); if (!e) return;
  const r = e.rec, t = typeOf(r);
  let rows = [['Nombre', esc(r.name)], ['Tipo', { kml: 'KML (vectorial)', wms: 'Servicio de imagen (' + (r.kind === 'wmts' ? 'WMTS' : 'WMS') + ')', photos: 'Fotos con GPS' }[t]], ['Carpeta', esc(folderOf(r))], ['Añadida', fmtDate(r.created)], ['Visible', r.visible ? 'Sí' : 'No']];
  let extra = '', btns = '';
  if (t === 'kml') {
    const f = e.feats, ln = f.filter(x => x.type === 'ln'), pg = f.filter(x => x.type === 'pg'), pt = f.filter(x => x.type === 'pt');
    const keys = new Set(); f.forEach(x => x.attrs.forEach(a => keys.add(a[0])));
    const b = e.group.getBounds(), c = b.getCenter();
    const la = [...acts.values()].filter(a => a.layerId === id), wcount = Object.keys(r.widths || {}).length;
    rows = rows.concat([
      ['Elementos', `${f.length}: ${ln.length} líneas · ${pg.length} polígonos · ${pt.length} puntos`],
      ...(ln.length ? [['Calibración PK', `cada ${fmtStep(pkStepOf(r))}${r.pkStep ? ' (propia de la capa)' : ' (general)'}`]] : []),
      ln.length ? ['Longitud total de líneas', fmtLen(ln.reduce((s2, x) => s2 + x.length, 0))] : null,
      pg.length ? ['Superficie de polígonos', fmtArea(pg.reduce((s2, x) => s2 + (x.area || 0), 0))] : null,
      ['Campos de atributos', keys.size ? esc([...keys].join(', ')) : 'Ninguno'],
      ['Centro', `${fmtLL(c.lat, c.lng)}<br>${fmtUTM(c.lat, c.lng)}`],
      ['Extensión', `${fmtLen(b.getSouthWest().distanceTo(b.getSouthEast()))} × ${fmtLen(b.getSouthWest().distanceTo(b.getNorthWest()))}`],
      ['Actuaciones', la.length ? `${la.length} · ${fmtLen(la.reduce((s2, a) => s2 + a.d1 - a.d0, 0))}` : 'Ninguna'],
      ['Trazas con anchos', wcount ? String(wcount) : 'Ninguna'],
      ['Origen', r.drawn ? 'Dibujada o grabada en la app' : 'Importada'],
    ].filter(Boolean));
    extra = ln.length ? `<h3 class="sh">Trazas</h3><div class="wtable">${ln.map(x => `<div class="wrow pick" data-f="${f.indexOf(x)}"><span>${esc(x.name)}</span><small>${fmtLen(x.length)}</small></div>`).join('')}</div>` : '';
    btns = `<button class="btn pri full" data-a="attr">${ICON.table}Tabla de atributos y hoja de cálculo</button>
      <button class="btn" data-a="kml">Exportar KML</button><button class="btn" data-a="zoom">Encuadrar</button>`;
  } else if (t === 'wms') {
    rows = rows.concat([['Servicio', `<span class="brk">${esc(r.url)}</span>`], ['Capa(s)', esc(r.layers || '—')], ['Cobertura', esc(r.cover || '—')], ['Atribución', esc(r.attribution || '—')], ['Opacidad', Math.round((r.opacity ?? 1) * 100) + ' %'], ['Consulta de datos en un punto', r.info ? 'Sí' : 'No']]);
    extra = r.kind !== 'wmts' ? `<div class="legend"><img src="${esc(legendUrl(r))}" alt="Leyenda" onerror="this.parentNode.remove()"></div>` : '';
    btns = `<a class="btn full" href="${esc(r.url)}?SERVICE=WMS&REQUEST=GetCapabilities" target="_blank" rel="noopener">Ver la ficha técnica del servicio</a>`;
  } else {
    const ns = [...notes.values()].filter(n => n.layerId === id), dates = ns.map(n => n.created).sort();
    rows = rows.concat([['Fotos', String(ns.length)], ['Situadas por GPS de la foto', String(ns.filter(n => n.src === 'exif').length)], ['Situadas por marca de agua', String(ns.filter(n => n.src === 'marca').length)], dates.length ? ['Fechas', `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}`] : null].filter(Boolean));
    btns = `<button class="btn full" data-a="share">${ICON.photo}Compartir fotos con GPS</button><button class="btn" data-a="zoom">Encuadrar</button>`;
  }
  const b = openSheet(`<h2>${ICON.info} Propiedades</h2><p class="sub">${esc(r.name)}</p>
    <table class="attrs">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>${extra}
    <div class="acts">${btns}</div>`);
  const q = s2 => b.querySelector(`[data-a=${s2}]`);
  if (q('attr')) q('attr').onclick = () => attrTable(id);
  if (q('zoom')) q('zoom').onclick = () => { closeSheet(); zoomToLayer(id); };
  if (q('share')) q('share').onclick = () => sharePhotos([...notes.values()].filter(n => n.layerId === id), r.name);
  if (q('kml')) q('kml').onclick = () => saveBlob(new Blob([r.text], { type: 'application/vnd.google-earth.kml+xml' }), safeName(r.name) + '.kml').catch(() => {});
  b.querySelectorAll('[data-f]').forEach(row => row.onclick = () => { const f = e.feats[+row.dataset.f]; map.fitBounds(L.latLngBounds(f.parts.flatMap(p => p.c)).pad(0.2), { maxZoom: 18 }); featureSheet(f, L.latLng(f.start[0], f.start[1]), r); });
}

/* ---------------- Tabla de atributos y hoja de cálculo asociada ----------------
   Exporta los elementos del KML a CSV (Excel, LibreOffice Calc, Google Sheets) y vuelve a leer los cambios:
   se emparejan por la columna «id»; las columnas nuevas se convierten en atributos (ExtendedData) del KML. */
const FIXED_COLS = ['id', 'nombre', 'tipo', 'carpeta', 'longitud_m', 'superficie_m2', 'lat', 'lon'];
function attrKeys(feats) { const k = []; feats.forEach(f => f.attrs.forEach(a => { const key = a[2] || a[0]; if (key && !k.includes(key)) k.push(key); })); return k; }
function attrTable(id) {
  const e = layers.get(id); if (!e || typeOf(e.rec) !== 'kml') return;
  const feats = e.feats, keys = attrKeys(feats);
  const val = (f, k) => { const a = f.attrs.find(x => (x[2] || x[0]) === k); return a ? a[1] : ''; };
  const b = openSheet(`<h2>${ICON.table} Tabla de atributos</h2><p class="sub">${esc(e.rec.name)} · ${feats.length} elementos · ${keys.length} campos</p>
    <div class="ttable"><table><thead><tr><th>id</th><th>Nombre</th><th>Tipo</th><th>Long./sup.</th>${keys.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead>
    <tbody>${feats.map((f, i) => `<tr data-i="${i}"><td>${i + 1}</td><td>${esc(f.name)}</td><td>${{ ln: 'Línea', pg: 'Polígono', pt: 'Punto' }[f.type]}</td><td>${f.type === 'ln' ? fmtLen(f.length) : f.type === 'pg' ? fmtArea(f.area || 0) : ''}</td>${keys.map(k => `<td>${esc(val(f, k))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="acts">
      <button class="btn pri" data-a="csv">Abrir en hoja de cálculo (CSV)</button>
      <button class="btn" data-a="imp">Cargar cambios desde CSV</button>
    </div>
    <p class="hint">Exporta la tabla, edítala en Excel, LibreOffice Calc o Google Sheets (puedes añadir columnas) y vuelve a cargarla aquí: los cambios de nombre y de atributos se guardan en el KML. No cambies la columna «id».</p>
    <input type="file" id="inCsv" accept=".csv,text/csv,text/plain" hidden>`);
  b.querySelectorAll('tr[data-i]').forEach(tr => tr.onclick = () => { const f = feats[+tr.dataset.i]; map.fitBounds(L.latLngBounds(f.parts.flatMap(p => p.c)).pad(0.3), { maxZoom: 18 }); featureSheet(f, L.latLng(f.start[0], f.start[1]), e.rec); });
  b.querySelector('[data-a=csv]').onclick = async () => {
    const q = csvQ, n = v => String(v).replace('.', ',');
    const rows = [[...FIXED_COLS, ...keys]].concat(feats.map((f, i) => [i + 1, f.name, { ln: 'linea', pg: 'poligono', pt: 'punto' }[f.type], f.folder, f.type === 'ln' ? n(f.length.toFixed(2)) : '', f.type === 'pg' ? n((f.area || 0).toFixed(2)) : '', n(f.start[0].toFixed(7)), n(f.start[1].toFixed(7)), ...keys.map(k => val(f, k))]));
    try { await saveBlob(new Blob(['﻿' + rows.map(r => r.map(q).join(';')).join('\r\n')], { type: 'text/csv' }), `atributos_${safeName(e.rec.name)}.csv`); } catch (er) { if (!/cancel/i.test(er.message || '')) toast('No se pudo exportar.'); }
  };
  b.querySelector('[data-a=imp]').onclick = () => $('#inCsv').click();
  $('#inCsv').onchange = async ev => { const f = ev.target.files[0]; if (f) await importAttrCsv(e, await f.text()); };
}
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '', delim = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : (first.includes('\t') ? '\t' : ',');
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}
async function importAttrCsv(e, text) {
  const rows = parseCSV(text); if (rows.length < 2) { toast('El CSV está vacío.'); return; }
  const head = rows[0].map(h => h.trim()), iId = head.findIndex(h => h.toLowerCase() === 'id'), iName = head.findIndex(h => h.toLowerCase() === 'nombre');
  if (iId < 0) { toast('El CSV no tiene la columna «id». Exporta primero la tabla desde la app.', 6000); return; }
  const attrCols = head.map((h, i) => [h, i]).filter(([h]) => h && !FIXED_COLS.includes(h.toLowerCase()));
  const doc = new DOMParser().parseFromString(e.rec.text, 'application/xml'), pms = byTag(doc, 'Placemark');
  let changed = 0;
  for (const r of rows.slice(1)) {
    const idx = parseInt(r[iId], 10) - 1, f = e.feats[idx]; if (!f) continue;
    const pm = pms[f.pm]; if (!pm) continue;
    if (iName >= 0 && r[iName] != null && r[iName].trim() && r[iName].trim() !== f.name) {
      let nmEl = [...pm.children].find(c => c.localName === 'name');
      if (!nmEl) { nmEl = doc.createElementNS(KML_NS, 'name'); pm.insertBefore(nmEl, pm.firstChild); }
      nmEl.textContent = r[iName].trim(); changed++;
    }
    for (const [h, i] of attrCols) {
      const v = (r[i] ?? '').trim();
      const sd = byTag(pm, 'SimpleData').find(x => x.getAttribute('name') === h);
      if (sd) { if (sd.textContent !== v) { sd.textContent = v; changed++; } continue; }
      let dEl = byTag(pm, 'Data').find(x => x.getAttribute('name') === h);
      if (!dEl) {
        if (!v) continue;
        let ed = [...pm.children].find(c => c.localName === 'ExtendedData');
        if (!ed) { ed = doc.createElementNS(KML_NS, 'ExtendedData'); const geom = [...pm.children].find(c => ['Point', 'LineString', 'Polygon', 'MultiGeometry', 'Track', 'MultiTrack'].includes(c.localName)); pm.insertBefore(ed, geom || null); }
        dEl = doc.createElementNS(KML_NS, 'Data'); dEl.setAttribute('name', h); dEl.appendChild(doc.createElementNS(KML_NS, 'value')); ed.appendChild(dEl);
      }
      const vEl = byTag(dEl, 'value')[0] || dEl.appendChild(doc.createElementNS(KML_NS, 'value'));
      if (vEl.textContent !== v) { vEl.textContent = v; changed++; }
    }
  }
  if (!changed) { toast('No hay cambios respecto al KML.'); return; }
  e.rec.text = new XMLSerializer().serializeToString(doc);
  await DB.put('layers', e.rec); rebuildLayer(e.rec.id);
  toast(`${changed} cambios guardados en «${e.rec.name}».`, 5000);
  attrTable(e.rec.id);
}
