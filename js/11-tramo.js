'use strict';
/* OBRA-GIS · Tramo andando, «Guardar y seguir», «Deshacer», puntuales, enviar a la oficina, modo sencillo y dictado.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Tramo andando: «Empezar aquí» y «Terminar aquí» ----------------
   Se elige el tipo, se empieza en el PK donde estás y se termina al llegar al final, sin tener el editor abierto. */
let walkAct = null; // { draft, t }
const walkHere = () => !!(walkAct && walkAct.draft.obraId === settings.activeObra);
async function currentTracePos() {
  const p = await getPos(); const n = nearestTrace(L.latLng(p.lat, p.lng));
  if (!n) throw new Error('No hay ninguna traza KML visible cerca.');
  return { ...n, p };
}
function walkStartSheet(pre) {
  const WALK_COMMON = ['Limpieza de cunetas', 'Desbroce de márgenes', 'Refino y planeo sin aporte', 'Zahorra artificial', 'Cuneta revestida', 'Bacheo'];
  const types = [...new Set([...(settings.actFav || []), ...(settings.actRecent || []), ...WALK_COMMON])].filter(t => ACT_ITEMS.some(i => i.name === t) && !ACT_POINT.has(t)).slice(0, 6); // un tramo andando no es para caños ni arquetas
  // primero se elige (tipo y margen) y luego se pulsa «Empezar»: un toque de más solo marca una opción, nunca empieza un tramo
  const b = openSheet(`<h2>Empezar tramo aquí</h2><p class="sub">1. Elige qué vas a medir · 2. Pulsa «Empezar» · 3. Camina y pulsa «Terminar aquí» al llegar al final.</p>
    <div class="field"><span class="flabel" id="wsLbl">Margen</span><div class="seg walkseg" role="radiogroup" aria-labelledby="wsLbl"><button type="button" role="radio" aria-checked="${pre && pre.side ? 'false' : 'true'}" class="${pre && pre.side ? '' : 'on'}" data-ws="auto">Automático</button>${Object.entries(SIDES).map(([k, v]) => `<button type="button" role="radio" aria-checked="${pre && k === pre.side ? 'true' : 'false'}" class="${pre && k === pre.side ? 'on' : ''}" data-ws="${k}">${esc(v.replace('Margen ', '').replace(' / calzada', '').replace(' márgenes', ''))}</button>`).join('')}</div>
      <p class="hint">Automático: cunetas y desbroces en los dos márgenes; firmes en el eje.</p></div>
    <div class="field"><span class="flabel" id="wtLbl">Qué vas a medir</span>
    ${types.length ? `<div class="bigtypes" role="radiogroup" aria-labelledby="wtLbl">${types.map(t => `<button type="button" class="btn" role="radio" aria-checked="false" data-wt="${esc(t)}"><span class="dot" style="background:${actColor(t)}"></span>${esc(t)}</button>`).join('')}</div>` : ''}
    <label for="wType" class="small">u otro tipo</label>${actTypeSelect('', true).replace('id="aType"', 'id="wType"')}</div>
    <div class="savebar"><button class="btn go full" data-a="wgo" disabled>Elige primero qué vas a medir</button></div>`);
  let side = pre && pre.side || 'izq', sideSet = !!(pre && pre.side), type = '';
  const GO = b.querySelector('[data-a=wgo]');
  const pick = t => { type = t; b.querySelectorAll('[data-wt]').forEach(x => { const on = x.dataset.wt === t; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
    if ($('#wType').value !== t) $('#wType').value = ACT_ITEMS.some(i => i.name === t) && !types.includes(t) ? t : '';
    GO.disabled = !t; GO.textContent = t ? `▶ Empezar aquí: ${t}` : 'Elige primero qué vas a medir'; };
  b.querySelectorAll('[data-ws]').forEach(bt => bt.onclick = () => { sideSet = bt.dataset.ws !== 'auto'; if (sideSet) side = bt.dataset.ws; b.querySelectorAll('[data-ws]').forEach(x => { x.classList.toggle('on', x === bt); x.setAttribute('aria-checked', x === bt); }); });
  b.querySelectorAll('[data-wt]').forEach(bt => bt.onclick = () => pick(bt.dataset.wt));
  $('#wType').onchange = () => pick($('#wType').value);
  GO.onclick = () => { if (type) startWalk(type, sideSet ? side : defaultSideFor(type, side), lastParamsOf(type).params); };
  if (pre && pre.type) pick(pre.type);
}
async function startWalk(type, side, params) {
  if (walkAct) { const o = obras.get(walkAct.draft.obraId);
    if (!confirm(`Ya hay un tramo de «${walkAct.draft.type}» empezado${walkAct.draft.obraId !== settings.activeObra ? ` en la obra «${o ? o.name : '¿?'}»` : ''} en el PK ${fmtPK(walkAct.draft.d0)}. ¿Descartarlo y empezar este?`)) return; }
  toast('Obteniendo posición GPS…', 2500);
  let n; try { n = await currentTracePos(); } catch (e) { toast((e.code ? geoErr(e) : e.message), 6000); return; }
  if (n.off > 50) { toast(`Estás a ${Math.round(n.off)} m de «${n.f.name}»: acércate al camino (menos de 50 m) para empezar el tramo.`, 7000); return; }
  hideUndo(); const e = layers.get(n.rec.id);
  walkAct = { draft: { id: uid(), obraId: settings.activeObra, layerId: n.rec.id, featIdx: e.feats.indexOf(n.f), traceName: n.f.name, layerName: n.rec.name, d0: n.d, d1: n.d, type, side, text: '', media: [], created: Date.now(), coords: [], params: { ...(params || {}) }, prio: '' }, t: Date.now() };
  try { await DB.put('kv', walkAct, 'walk'); } catch (er) { /* nada */ }
  startWatch(); keepAwake(true); buzz(60); closeSheet(); showWalkBar(); toast(`Tramo de «${type}» empezado en el PK ${fmtPK(n.d)}. Pulsa «Terminar aquí» al llegar al final.`, 6000);
}
// Deshacer en lugar de preguntar: una barra con «Deshacer» durante unos segundos
let undoT = null, undoKind = '';
function showUndo(msg, fn, ms = 8000) { undoKind = '';
  let el = $('#undoBar'); if (!el) { el = document.createElement('div'); el.id = 'undoBar'; el.className = 'undobar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.innerHTML = `<span>${esc(msg)}</span><button class="mini" type="button">Deshacer</button>`; el.hidden = false; $('#toast').hidden = true;
  clearTimeout(undoT); undoT = setTimeout(() => { el.hidden = true; }, ms);
  const t0 = Date.now(); el.querySelector('button').onclick = async () => { if (Date.now() - t0 < 600) return; clearTimeout(undoT); el.hidden = true; try { await fn(); } catch (e) { toast('No se pudo deshacer: ' + (e.message || e), 6000); } };
}
function hideUndo() { clearTimeout(undoT); const el = $('#undoBar'); if (el) el.hidden = true; } // un «Deshacer» viejo no debe actuar sobre una situación nueva
const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* nada */ } }; // vibración al empezar y terminar (se nota con guantes)
// Pantalla siempre encendida mientras hay un tramo en marcha (si el móvil lo permite)
let wakeLock = null;
async function keepAwake(on) {
  try { if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; } } catch (e) { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && walkHere()) keepAwake(true); });
// Datos de la última actuación del mismo tipo (para no volver a escribir ancho, espesor…)
function lastParamsOf(type) { const a = [...acts.values()].filter(x => x.type === type && x.obraId === settings.activeObra).sort((x, y) => (y.updated || y.created) - (x.updated || x.created))[0];
  const p = a ? { ...(a.params || {}) } : {}; delete p._wAuto; return { params: p, side: a && a.side }; }
// Sigue andando: nuevo tramo del mismo tipo, margen y datos que empieza donde terminó el anterior (sin pedir GPS)
async function continueWalk(a, at, opts = {}) {
  const ctx = featOf(a), from = isFinite(at) ? at : a.d1; // «at» = PK donde empieza el siguiente (hacia atrás, el menor)
  if (!ctx || !ctx.f || (from >= ctx.f.length - 0.5 && !(isFinite(at) && at < a.d1)) || (isFinite(at) && at <= 0.5 && at < a.d1)) { toast('Fin del camino: no hay más tramo que seguir.', 5000); return false; }
  walkAct = { draft: { id: uid(), obraId: a.obraId, layerId: a.layerId, featIdx: a.featIdx, traceName: a.traceName, layerName: a.layerName, d0: from, d1: from, type: a.type, side: a.side, text: '', media: [], created: Date.now(), coords: [], params: { ...(a.params || {}) }, prio: '', _noMeasChain: !!opts.noMeas }, t: Date.now() };
  try { await DB.put('kv', walkAct, 'walk'); } catch (e) { /* nada */ }
  startWatch(); keepAwake(true); showWalkBar(); toast(`Siguiente tramo de «${a.type}» desde el PK ${fmtPK(from)}.`, 4000);
  return true;
}
// «Repetir la última» andando: mismo tipo, margen y datos; empieza aquí y se termina al llegar
function repeatWalk() { const a = lastLinear(); if (!a) { toast('Todavía no hay ningún tramo que repetir.'); return; } const p = { ...(a.params || {}) }; delete p._wAuto; startWalk(a.type, a.side, p); }
// «▶ Seguir»: junto al «+», un toque empieza andando otro tramo como el último (tipo, margen y medidas)
const lastLinear = () => [...acts.values()].filter(a => a.obraId === settings.activeObra && !ACT_POINT.has(a.type)).sort((a, b) => (b.updated || b.created) - (a.updated || a.created))[0] || null;
const SHORT_TYPE = { 'Desbroce de márgenes': 'Desbroce márg.', 'Desbroce de la traza': 'Desbroce traza', 'Limpieza de cunetas': 'Cunetas', 'Demolición de firme existente': 'Demolición', 'Fresado de firme asfáltico': 'Fresado', 'Machacado y escarificado de firme': 'Machacado', 'Refino y planeo sin aporte': 'Refino', 'Escarificado y compactación': 'Escarificado', 'Excavación / desmonte': 'Excavación', 'Terraplén / relleno': 'Terraplén', 'Estabilización de suelos': 'Estabilización', 'Subbase de zahorra natural': 'Zahorra nat.', 'Otra actuación en la explanada': 'Explanada', 'Zahorra artificial': 'Zahorra art.', 'Pavimento de hormigón': 'Hormigón', 'Aglomerado asfáltico en caliente': 'Aglom. caliente', 'Aglomerado asfáltico en frío': 'Aglom. frío', 'Tratamiento superficial': 'Tratamiento', 'Riego de imprimación / adherencia': 'Riego', 'Cuneta en tierra': 'Cuneta tierra', 'Cuneta revestida': 'Cuneta revest.', 'Escollera': 'Escollera', 'Muro': 'Muro', 'Gaviones': 'Gaviones', 'Barrera / bionda': 'Bionda', 'Sobreancho / abanico': 'Sobreancho', 'Apartadero / zona de cruce': 'Apartadero' };
const shortType = t => SHORT_TYPE[t] || (t.length > 15 ? t.slice(0, 14) + '…' : t);
function updateSeguir() {
  let bt = $('#fabSeguir'); const la = lastLinear(), ok = la && !walkHere() && !settings.simple;
  if (!bt) { if (!ok) return; bt = document.createElement('button'); bt.id = 'fabSeguir'; bt.type = 'button'; bt.className = 'fab seguir'; $('#fabNote').before(bt);
    bt.onclick = () => repeatWalk(); }
  bt.hidden = !ok; if (ok) { bt.innerHTML = `<span>▶ ${esc(shortType(la.type))}</span>`; bt.setAttribute('aria-label', `Seguir andando: nuevo tramo de ${la.type} desde aquí`); bt.title = `Nuevo tramo de ${la.type} desde aquí`; }
}
function showWalkBar() {
  setTimeout(updateSeguir, 0);
  let el = $('#walkBar');
  if (!walkAct || walkAct.draft.obraId !== settings.activeObra) { if (el) el.hidden = true; return; } // el tramo es de otra obra: se verá al volver a ella
  if (!el) { el = document.createElement('div'); el.id = 'walkBar'; el.className = 'walkbar'; document.body.appendChild(el);
    el.innerHTML = `<span data-w="txt"></span><button class="mini pri" data-w="end">Terminar aquí</button><button class="mini" data-w="split" title="Guarda este tramo y empieza otro igual aquí">Guardar y seguir</button><button class="mini" data-w="x" aria-label="Cancelar tramo">✕</button>`;
    el.querySelector('[data-w=end]').onclick = () => walkEnd(false);
    el.querySelector('[data-w=split]').onclick = () => walkEnd(true);
    el.querySelector('[data-w=x]').onclick = async () => { if (!walkAct || Date.now() - walkAct.shown < 1500) return; const prev = walkAct; walkAct = null; await DB.del('kv', 'walk').catch(() => {}); showWalkBar(); keepAwake(false);
      showUndo(`Tramo de «${prev.draft.type}» cancelado`, async () => { if (prev.draft.obraId !== settings.activeObra) { toast('Ese tramo es de otra obra.'); return; } walkAct = { ...prev, shown: Date.now() }; await DB.put('kv', walkAct, 'walk'); showWalkBar(); keepAwake(true); }); }; }
  const d = walkAct.draft, here = livePkCur && livePkCur.rec.id === d.layerId && livePkCur.fi === d.featIdx && livePkT >= walkAct.t ? livePkCur.d : null;
  el.querySelector('[data-w=txt]').innerHTML = `<b>${esc(d.type)}</b><br>PK ${fmtPK(d.d0)}${here != null ? ` → ${fmtPK(here)} · ${fmtLen(Math.abs(here - d.d0))}` : ''}`;
  if (el.hidden !== false || !walkAct.shown) walkAct.shown = Date.now();
  el.hidden = false;
  if (el.offsetHeight > 0) document.documentElement.style.setProperty('--wbh', el.offsetHeight + 'px');
}
async function walkEnd(split) {
  if (!walkAct) return;
  if (Date.now() - (walkAct.shown || 0) < 1500) { if (Date.now() - (walkAct.shown || 0) > 400) toast('Vuelve a pulsar «Terminar aquí».', 2500); return; } // la barra acaba de aparecer bajo el dedo: un toque de más no termina el tramo
  const d = walkAct.draft; let ctx = featOf(d);
  if (!ctx || !ctx.f) { // la capa se borró y se volvió a cargar: se busca por nombre
    const e = [...layers.values()].find(x => x.rec.type === 'kml' && x.rec.name === d.layerName && x.feats[d.featIdx] && x.feats[d.featIdx].name === d.traceName);
    if (e) { d.layerId = e.rec.id; ctx = featOf(d); }
  }
  if (!ctx || !ctx.f) { if (confirm(`La traza «${d.traceName}» de este tramo ya no está cargada. ¿Cancelar el tramo?`)) { walkAct = null; await DB.del('kv', 'walk').catch(() => {}); showWalkBar(); } return; }
  toast('Obteniendo posición GPS…', 2500);
  let p; try { p = await getPos(); } catch (e) { toast(geoErr(e), 6000); return; }
  const r = pkAt(ctx.f, L.latLng(p.lat, p.lng));
  if (r.off > 150 && !confirm(`Estás a ${Math.round(r.off)} m de «${ctx.f.name}». ¿Terminar el tramo en el punto del camino más cercano (PK ${fmtPK(r.d)})?`)) return;
  if (r.off > 50) toast(`Estás a ${Math.round(r.off)} m de la traza: se usa el punto más cercano.`, 5000);
  if (Math.abs(r.d - d.d0) < 1) { toast(`Aún estás en el PK ${fmtPK(d.d0)}, donde empezó el tramo: camina hasta el final y pulsa otra vez.`, 6000); return; }
  hideUndo(); const endAt = r.d, startAt = d.d0; d.d1 = r.d; if (d.d1 < d.d0) [d.d0, d.d1] = [d.d1, d.d0];
  const prev = { ...walkAct, draft: { ...walkAct.draft, d0: startAt, d1: startAt } }; // copia para «Deshacer» (sin los PK ya reordenados)
  walkAct = null; await DB.del('kv', 'walk').catch(() => {}); showWalkBar(); keepAwake(false); buzz([60, 80, 60]);
  if (!Object.keys(d.params || {}).some(k => d.params[k] != null && d.params[k] !== '' && k[0] !== '_')) d.params = lastParamsOf(d.type).params; // mismos datos que la última de su tipo
  if (split === true && !d._noMeasChain && (() => { const mf = actItem(d.type).fields.filter(k => ['w', 'e', 'h', 'b', 'S'].includes(k)); return mf.length && !mf.some(k => d.params && d.params[k] > 0); })()) {
    split = false; toast(`Primero indica las medidas de «${d.type}»; las siguientes se copiarán solas.`, 6000); }
  if (split === true) { // «Terminar y seguir»: se guarda tal cual y empieza el siguiente tramo, con «Deshacer»
    actDraft = { ...d, _cont: endAt < startAt ? -1 : 1, _split: true, _zeroOk: d.d0 + '|' + d.d1 }; const ok = await saveAct();
    if (ok) showUndo(`Guardado: ${d.type} ${fmtPK(d.d0)}–${fmtPK(d.d1)}${walkAct ? '. Sigue el siguiente tramo.' : '. Fin del camino: no hay más tramo que seguir.'}`, async () => { if (d.obraId !== settings.activeObra) { toast('Ese tramo es de otra obra.'); return; } await DB.del('acts', d.id); acts.delete(d.id); drawActs(); walkAct = { ...prev, shown: Date.now() }; await DB.put('kv', walkAct, 'walk'); showWalkBar(); keepAwake(true); });
    return; }
  d._walk = true; d._dir = endAt < startAt ? -1 : 1; actDraft = d; renderActEditor(); sheetOpenAt = Date.now() + 1150; // 1,5 s sin toques: el dedo que pulsó «Terminar» está sobre «Guardar»
  setTimeout(() => { // se ve el tipo, los PK y, si cabe, la medida que falta (sin quedar nada bajo la ✕)
    const ty = $('#aType') && $('#aType').closest('.field');
    const it = actItem(d.type), f0 = it.fields.find(k => !(d.params && d.params[k] > 0)), el = f0 && $('#pf_' + f0);
    if (el && it.fields.some(k => ['w', 'e', 'h', 'b', 'S'].includes(k))) { el.classList.add('need'); el.insertAdjacentHTML('afterend', `<small class="fneed" id="need_${el.id}">Falta: escribe ${esc(ACT_FIELDS[f0].l.toLowerCase())}</small>`); el.scrollIntoView({ block: 'center' }); } // lo que falta, a la vista (el resumen fijo de arriba dice tipo y PK)
    else if (ty) ty.scrollIntoView({ block: 'start' }); }, 300);
}
// «Repetir la última»: misma actuación, margen y datos, empezando donde terminó la anterior
function lastAct() { return [...acts.values()].filter(a => a.obraId === settings.activeObra).sort((a, b) => (b.updated || b.created) - (a.updated || a.created))[0] || null; }
function repeatLastAct() {
  const a = lastAct(); if (!a) { toast('Todavía no hay ninguna actuación que repetir.'); return; }
  const ctx = featOf(a); if (!ctx || !ctx.f) { toast('La traza de la última actuación no está cargada.', 5000); return; }
  const d0 = Math.min(a.d1, ctx.f.length);
  actDraft = { ...a, id: uid(), d0, d1: d0, media: [], text: '', created: Date.now(), updated: undefined, params: { ...(a.params || {}) }, _sideSet: true };
  delete actDraft.params._wAuto;
  renderActEditor(); toast(`Copia de «${a.type}» desde el PK ${fmtPK(d0)}: indica dónde termina (PK final o «Aquí» junto a «Hasta PK») y guarda.`, 6000);
  setTimeout(() => { const f1 = $('#aPk1'); if (f1) { f1.focus(); f1.select(); } }, 400);
}
// «Repetir la última»: una fila con las dos formas (aquí, escribiendo el final, o andando)
// (andando no se ofrece: «Desde donde acabó» abriría una actuación de 0 m encima del tramo en marcha)
const repeatRow = () => { const rl = repeatLabel(); if (!rl || walkHere()) return ''; const la = lastAct();
  return `<div class="reprow"><span><b>↻ Repetir la última</b><small>${esc(rl)}</small></span><button class="mini" data-a="rep">Desde donde acabó</button>${walkHere() || (la && ACT_POINT.has(la.type)) ? '' : '<button class="mini" data-a="repw">Andando desde aquí</button>'}</div>`; };
const repeatLabel = () => { const a = lastAct(); return a ? `${a.type} ${SIDE_ABBR[a.side] || ''}${actParamRows(a).filter(([k]) => k !== 'Prioridad').length ? ' · ' + actParamRows(a).filter(([k]) => k !== 'Prioridad').map(([, v]) => v).slice(0, 2).join(' · ') : ''}` : ''; };

/* ---------------- Enviar a la oficina: paquete de obra + informe de la visita + mediciones, en un paso ---------------- */
async function saveBlobsShare(files) { // [{blob, name}]
  const FS = Plug('Filesystem'), SH = Plug('Share');
  if (NATIVE && FS) {
    const uris = []; let where = '';
    for (const f of files) { const r = await saveBlob(f.blob, f.name, { share: false }); uris.push(r.uri); where = r.where; }
    if (SH) { try { await SH.share({ title: 'OBRA-GIS', text: files.map(f => f.name).join('\n'), files: uris, dialogTitle: 'Enviar a la oficina' }); } catch (e) { if (/cancel/i.test(e.message || '')) return 'CANCEL'; throw e; } }
    return where;
  }
  const fl = files.map(f => new File([f.blob], f.name, { type: f.blob.type || 'application/octet-stream' }));
  if (navigator.canShare && navigator.canShare({ files: fl })) { try { await navigator.share({ files: fl, title: 'OBRA-GIS' }); return 'SHARE'; } catch (e) { if (/abort|cancel/i.test(e.name + e.message)) return 'CANCEL'; } }
  for (const f of files) await saveBlob(f.blob, f.name);
  return 'DOWNLOAD';
}
async function sendToOffice() {
  const o = obras.get(settings.activeObra); if (!o) return;
  const sent = (settings.lastSent || {})[o.id] || 0;
  const b = openSheet(`<h2>Enviar a la oficina</h2><p class="sub">${esc(o.name)}</p>
    <p>Se prepara todo lo necesario para la oficina:</p>
    <ul class="ulist"><li><b>Paquete de la obra</b> (.zip): capas, actuaciones, fotos y anchos. Se abre con OBRA-GIS en otro móvil o en el ordenador.</li>
      <li><b>Informe de la visita</b> (.html): para leer, imprimir o guardar en PDF.</li><li><b>Mediciones</b>: .csv para Excel (lo enviado) y .bc3 para Presto o Arquímedes (toda la obra, con los códigos de partida que hayas asignado).</li></ul>
    ${(() => { const L0 = actsSorted(), zero = L0.filter(a => a.d1 - a.d0 < 0.5 && !ACT_POINT.has(a.type) && !(actMeasure(a).area || actMeasure(a).vol || actMeasure(a).n)),
        nodat = L0.filter(a => { const it = actItem(a.type); return !ACT_POINT.has(a.type) && it.fields.some(k => ['w', 'e', 'h', 'b', 'S', 'n'].includes(k)) && !it.fields.some(k => a.params && a.params[k] > 0); }),
        nofoto = L0.filter(a => !(a.media || []).length && a.prio === 'alta'), items = [[zero, 'de 0 m'], [nodat, 'sin medidas (no saldrá superficie ni volumen)'], [nofoto, 'de prioridad alta sin foto']].filter(x => x[0].length);
      return items.length ? `<div class="fwarn" role="alert"><b>Antes de enviar, revisa:</b><ul class="revlist">${items.map(([l, t]) => `<li>${plural(l.length, 'actuación', 'actuaciones')} ${t}: ${l.slice(0, 4).map(a => `<button class="linkbtn" data-rv="${esc(a.id)}">${esc(a.type)} ${fmtPK(a.d0)}</button>`).join(' ')}${l.length > 4 ? ' …' : ''}</li>`).join('')}</ul><small>Se puede enviar igualmente.</small></div>` : ''; })()}
    ${sent ? `<label class="opt"><input type="checkbox" id="soSince" checked>Informe solo con lo nuevo desde el último envío (${fmtDate(sent)})</label>` : ''}
    <div class="field"><label for="soWho">Tu nombre (sale en el informe)</label><input type="text" id="soWho" value="${esc(settings.surveyor || '')}"></div>
    <div class="savebar"><button class="btn go full" data-a="go">Preparar y enviar</button></div>`);
  b.querySelectorAll('[data-rv]').forEach(x => x.onclick = () => { const a = acts.get(x.dataset.rv); if (a) { map.fitBounds(L.latLngBounds(a.coords).pad(0.4), { maxZoom: 18 }); viewAct(a.id); } });
  b.querySelector('[data-a=go]').onclick = async () => {
    const bt = b.querySelector('[data-a=go]'); bt.disabled = true; bt.textContent = 'Preparando…';
    settings.surveyor = $('#soWho').value.trim(); saveSettings();
    const since = $('#soSince') && $('#soSince').checked ? sent : 0;
    const all = actsSorted(), nuevas = all.filter(a => (a.updated || a.created || 0) >= since), notasN = [...notes.values()].filter(n => (n.updated || n.created || n.t || 0) >= since);
    if (!all.length && !notes.size && ![...layers.values()].some(e => e.rec.type === 'kml')) { toast('La obra está vacía: todavía no hay nada que enviar.', 6000); bt.disabled = false; bt.textContent = 'Preparar y enviar'; return; }
    if (since && !nuevas.length && !notasN.length) { toast('No hay nada nuevo desde el último envío. Quita la marca de «solo lo nuevo» para enviarlo todo otra vez.', 7000); bt.disabled = false; bt.textContent = 'Preparar y enviar'; return; }
    try {
      const pkg = await buildObraPackage(o.id, { blobOnly: true }); if (!pkg) throw new Error('no se pudo preparar el paquete');
      const day = stamp(), base = safeName(o.name).slice(0, 40);
      const html = await visitHtml({ since, who: settings.surveyor, photos: true, obs: settings.visitObs || '' });
      const list = actsSorted().filter(a => (a.updated || a.created || 0) >= since);
      const files = [{ blob: pkg.blob, name: pkg.name }, { blob: new Blob([html], { type: 'text/html' }), name: `informe_visita_${base}_${day}.html` }];
      if (list.length) files.push({ blob: new Blob([actsCSV(list)], { type: 'text/csv' }), name: `mediciones_${base}_${day}.csv` });
      if (all.length) files.push({ blob: new Blob([encodeANSI(buildBC3(all, o.name))], { type: 'application/octet-stream' }), name: `mediciones_${base}_${day}.bc3` });
      const where = await saveBlobsShare(files);
      if (where === 'CANCEL') { bt.disabled = false; bt.textContent = 'Preparar y enviar'; return; }
      settings.lastSent = { ...(settings.lastSent || {}), [o.id]: Date.now() }; settings.lastBackup = Date.now(); saveSettings();
      closeSheet(); toast(where === 'DOCUMENTS' ? 'Listo. Una copia queda en Documentos › OBRA-GIS.' : `Listo: ${files.length} ficheros preparados (paquete, informe${list.length ? ', mediciones' : ''}).`, 7000);
    } catch (e) { toast('No se pudo preparar el envío: ' + (e.message || e), 8000); bt.disabled = false; bt.textContent = 'Preparar y enviar'; }
  };
}

/* ---------------- Modo sencillo y primera vez ---------------- */
function applySimple() { document.body.classList.toggle('simple', !!settings.simple); }
function welcomeSheet() {
  const b = openSheet(`<h2>Bienvenido a OBRA-GIS</h2>
    ${NATIVE || window.__abTest ? '<div class="restorebox"><span>¿Ya usabas la app y la has reinstalado?</span><button type="button" class="btn full" data-a="restore">Recuperar mis obras</button></div>' : ''}
    <ol class="steps"><li><b>Abre el plano del camino</b> que te manden (KML o KMZ) con «Importar» o desde WhatsApp/correo con «Abrir con OBRA-GIS».</li>
      <li><b>Pulsa el botón naranja +</b> donde estés para apuntar lo que ves: la app pone sola el punto kilométrico (PK).</li>
      <li><b>Al terminar</b>, pulsa el botón naranja <b>+</b> o el <b>menú</b> (arriba a la izquierda) y elige <b>«Enviar a la oficina»</b>.</li></ol>
    <p><b>¿Cómo vas a usar la app?</b></p>
    <div class="acts"><button class="btn go full" data-r="simple">Apuntar en campo (modo sencillo, letra grande)</button><button class="btn pri full" data-r="full">Técnico: todas las herramientas</button></div>
    <p class="hint">Se puede cambiar cuando quieras en el menú (arriba a la izquierda) → Ajustes.</p>
`);
  { const rb = b.querySelector('[data-a=restore]'); if (rb) rb.onclick = () => { if (!settings.welcomed) { settings.welcomed = true; saveSettings(); } closeSheet(); restoreFromBackup(); }; }
  b.querySelectorAll('[data-r]').forEach(bt => bt.onclick = () => { settings.simple = bt.dataset.r === 'simple'; settings.welcomed = true; saveSettings(); applySimple(); closeSheet(); });
  onSheetClose(() => { if (!settings.welcomed) { settings.welcomed = true; saveSettings(); } });
}

/* ---------------- Dictado por voz en los cuadros de texto ---------------- */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
function addDictation(textarea) {
  if (!textarea || textarea.parentNode.querySelector('.dict')) return;
  const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'mini dict'; bt.innerHTML = `${ICON.audio}Dictar texto`;
  textarea.insertAdjacentElement('afterend', bt);
  const SR = Plug('SpeechRecognition'); // app Android: reconocimiento de voz del sistema (ventana de Google)
  if (NATIVE && SR) {
    bt.onclick = async () => {
      try {
        const av = await SR.available(); if (!av || !av.available) throw new Error('no disponible');
        try { await SR.requestPermissions(); } catch (e) { /* ya concedido */ }
        const r = await SR.start({ language: 'es-ES', maxResults: 1, prompt: 'Habla ahora', partialResults: false, popup: true });
        const t = r && r.matches && r.matches[0]; if (!t) return;
        textarea.value = (textarea.value ? textarea.value.trimEnd() + ' ' : '') + t.trim(); textarea.dispatchEvent(new Event('input'));
      } catch (e) { toast('No se pudo dictar. Toca el cuadro de texto y usa el micrófono del teclado.', 6000); }
    };
    return;
  }
  if (!SpeechRec) { bt.onclick = () => toast('Para dictar, toca el cuadro de texto y pulsa el micrófono del teclado del móvil.', 6000); return; }
  let rec = null, watchdog = null;
  const reset = () => { clearTimeout(watchdog); rec = null; bt.classList.remove('rec'); bt.innerHTML = `${ICON.audio}Dictar texto`; };
  onSheetClose(() => { if (rec) { try { rec.abort(); } catch (e) { /* nada */ } reset(); } }); // al cerrar la ficha se deja de escuchar
  bt.onclick = () => {
    if (rec) { rec.stop(); return; }
    rec = new SpeechRec(); rec.lang = 'es-ES'; rec.interimResults = false; rec.continuous = true;
    let heard = false;
    rec.onaudiostart = () => { heard = true; };
    rec.onresult = e => { heard = true; let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (!t.trim()) return; textarea.value = (textarea.value.trim() ? textarea.value.trimEnd() + ' ' : '') + t.trim(); textarea.dispatchEvent(new Event('input')); }; // se añade a lo escrito, nunca lo sustituye
    rec.onend = reset;
    rec.onerror = ev => { toast(ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'Sin permiso de micrófono.' : 'No se pudo dictar: toca el cuadro de texto y usa el micrófono del teclado.', 6000); };
    try { rec.start(); bt.classList.add('rec'); bt.innerHTML = `${ICON.audio}Parar dictado`; } catch (e) { reset(); toast('No se pudo dictar: usa el micrófono del teclado.', 5000); return; }
    watchdog = setTimeout(() => { if (rec && !heard) { try { rec.abort(); } catch (e) { /* nada */ } reset(); toast('El dictado no responde en este dispositivo. Toca el cuadro de texto y usa el micrófono del teclado.', 7000); } }, 6000);
  };
}
