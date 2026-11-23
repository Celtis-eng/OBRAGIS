'use strict';
/* OBRA-GIS · Informe de la visita, PK en directo y aviso de versión nueva.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Informe de la visita ----------------
   Recoge lo que se ha registrado o cambiado desde una fecha (actuaciones con sus datos y mediciones, anotaciones, fotos,
   anchos y trazas nuevas) y lo entrega como informe para imprimir o guardar en PDF, con resumen de mediciones y CSV. */
const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const stamp = (t = Date.now()) => { const d = new Date(t); return isoDay(d) + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(d.getSeconds()).padStart(2, '0'); }; // fecha y hora para nombres de fichero
const isoDay = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function visitReportSheet() {
  const all = [...acts.values()], last = all.reduce((m, a) => Math.max(m, a.updated || a.created || 0), 0);
  const since0 = settings.visitSince && settings.visitSince <= Date.now() ? settings.visitSince : dayStart(last || Date.now());
  const b = openSheet(`<h2>Informe de la visita</h2><p class="sub">${esc((obras.get(settings.activeObra) || {}).name || '')} · actuaciones, anotaciones, fotos, anchos y trazas nuevas</p>
    <div class="pkrow"><div class="field"><label for="vrSince">Cambios desde el día</label><input type="date" id="vrSince" value="${isoDay(since0)}"></div>
      <div class="field"><label for="vrWho">Técnico</label><input type="text" id="vrWho" value="${esc(settings.surveyor || '')}" placeholder="Nombre"></div></div>
    <label class="opt"><input type="checkbox" id="vrAll">Incluir todo lo registrado en la obra (sin filtrar por fecha)</label>
    <label class="opt"><input type="checkbox" id="vrPh" checked>Incluir las fotos</label>
    <div class="field"><label for="vrObs">Observaciones generales</label><textarea id="vrObs" rows="3" placeholder="Estado general del camino, accesos, incidencias…">${esc(settings.visitObs || '')}</textarea></div>
    <p class="hint" id="vrCount"></p>
    <div class="acts"><button class="btn pri full" data-a="html">Generar informe (imprimir o PDF)</button><button class="btn" data-a="csv">Mediciones en CSV</button></div>`);
  const opts = () => ({ since: $('#vrAll').checked ? 0 : new Date($('#vrSince').value + 'T00:00:00').getTime() || 0, who: $('#vrWho').value.trim(), photos: $('#vrPh').checked, obs: $('#vrObs').value.trim() });
  const count = () => { const d = visitData(opts()); $('#vrCount').textContent = `${plural(d.acts.length, 'actuación', 'actuaciones')} · ${plural(d.notes.length, 'anotación', 'anotaciones')} · ${plural(d.photos, 'foto', 'fotos')} · ${d.widths.length} trazas con anchos · ${d.newTraces.length} trazas nuevas`; };
  b.querySelectorAll('input,textarea').forEach(x => x.onchange = count); count();
  const save = o => { settings.surveyor = o.who; settings.visitObs = o.obs; if (o.since) settings.visitSince = o.since; saveSettings(); };
  b.querySelector('[data-a=html]').onclick = async () => {
    const o = opts(); save(o); const bt = b.querySelector('[data-a=html]'); bt.disabled = true; bt.textContent = 'Preparando el informe…';
    try { const html = await visitHtml(o); await saveBlob(new Blob([html], { type: 'text/html' }), `informe_visita_${safeName((obras.get(settings.activeObra) || {}).name)}_${isoDay(Date.now())}.html`); }
    catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo generar el informe: ' + (e.message || e), 7000); }
    bt.disabled = false; bt.textContent = 'Generar informe (imprimir o PDF)';
  };
  b.querySelector('[data-a=csv]').onclick = async () => { const o = opts(); save(o); const d = visitData(o);
    if (!d.acts.length) { toast('No hay actuaciones en ese periodo.'); return; }
    try { await saveBlob(new Blob([actsCSV(d.acts)], { type: 'text/csv' }), `mediciones_visita_${isoDay(Date.now())}.csv`); } catch (e) { /* cancelado */ } };
}
// Longitud de traza cubierta por actuaciones, sin contar dos veces los solapes
function unionLen(list) {
  const iv = list.map(a => [a.d0, a.d1]).sort((x, y) => x[0] - y[0]); let tot = 0, cur = null;
  iv.forEach(([a, b]) => { if (!cur || a > cur[1]) { if (cur) tot += cur[1] - cur[0]; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); });
  return tot + (cur ? cur[1] - cur[0] : 0);
}
function visitData(o) {
  const ch = x => (x.updated || x.created || 0) >= o.since;
  const actsL = actsSorted().filter(ch), notesL = [...notes.values()].filter(n => !n.layerId && (n.created || 0) >= o.since).sort((a, b) => a.created - b.created);
  const widths = [], newTraces = [];
  layers.forEach(e => {
    if (typeOf(e.rec) !== 'kml') return;
    if (e.rec.drawn && (e.rec.created || 0) >= o.since) newTraces.push(e);
    Object.entries(e.rec.widths || {}).forEach(([fi, w]) => { if ((w.updated || 0) >= o.since || !o.since) { const f = e.feats[+fi]; if (f) { const st = widthStats(widthSegments(w, f)); if (st) widths.push({ e, f, st }); } } });
  });
  const photos = actsL.reduce((s, a) => s + (a.media || []).filter(m => m.kind === 'photo').length, 0) + notesL.reduce((s, n) => s + (n.media || []).filter(m => m.kind === 'photo').length, 0);
  return { acts: actsL, notes: notesL, widths, newTraces, photos };
}
async function photoDataUrl(blob, max = 900) {
  try {
    const bmp = await createImageBitmap(blob); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.72);
  } catch (e) { return null; }
}
// Croquis de una traza con sus actuaciones numeradas (SVG, sin fondo cartográfico)
function traceSvg(f, list, num) {
  const P = c => L.CRS.EPSG3857.project(L.latLng(c[0], c[1]));
  const base = segmentCoords(f, 0, f.length), ps = base.map(P);
  const x0 = Math.min(...ps.map(p => p.x)), x1 = Math.max(...ps.map(p => p.x)), y0 = Math.min(...ps.map(p => p.y)), y1 = Math.max(...ps.map(p => p.y));
  const W = 700, pad = 30, dx = (x1 - x0) || 1, dy = (y1 - y0) || 1, H = Math.round(Math.min(460, Math.max(160, dy / dx * (W - 2 * pad) + 2 * pad))), s = Math.min((W - 2 * pad) / dx, (H - 2 * pad) / dy);
  const T = c => { const p = P(c); return [pad + (p.x - x0) * s, H - pad - (p.y - y0) * s]; };
  const pl = cs => cs.map(c => T(c).map(v => v.toFixed(1)).join(',')).join(' ');
  const kc = 1 / Math.cos(base[0][0] * Math.PI / 180), sc = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find(v => v * kc * s >= 70) || 5000, scPx = sc * kc * s;
  let g = `<polyline points="${pl(base)}" fill="none" stroke="#777" stroke-width="3" stroke-linecap="round"/>`;
  const [sx, sy] = T(base[0]), [ex, ey] = T(base[base.length - 1]);
  g += `<circle cx="${sx}" cy="${sy}" r="5" fill="#0b6e4f"/><text x="${sx + 7}" y="${sy - 7}" font-size="11">0+000</text><circle cx="${ex}" cy="${ey}" r="5" fill="#e8590c"/><text x="${ex > W - 80 ? ex - 7 : ex + 7}" y="${ey - 9}" font-size="11" text-anchor="${ex > W - 80 ? 'end' : 'start'}">${fmtPK(f.length)}</text>`;
  const placed = [];
  list.forEach(a => { const col = actColor(a.type), cs = a.coords && a.coords.length ? a.coords : segmentCoords(f, a.d0, a.d1);
    g += cs.length > 1 ? `<polyline points="${pl(cs)}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="butt" opacity=".9"/>` : `<circle cx="${T(cs[0])[0]}" cy="${T(cs[0])[1]}" r="6" fill="${col}"/>`;
    let [lx, ly] = T(cs[Math.floor(cs.length / 2)]); const ax = lx, ay = ly;
    for (let k = 0; k < 12 && placed.some(([px, py]) => Math.hypot(px - lx, py - ly) < 20); k++) ly = ay - 22 * (k % 2 ? -(k + 1) / 2 : (k + 2) / 2); // separa números que se tapan
    placed.push([lx, ly]); if (ly !== ay) g += `<line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly}" stroke="${col}" stroke-width="1"/>`;
    g += `<circle cx="${lx}" cy="${ly}" r="9" fill="#fff" stroke="${col}" stroke-width="2"/><text x="${lx}" y="${ly + 4}" font-size="10" font-weight="700" text-anchor="middle">${num.get(a.id)}</text>`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;border:1px solid #ccc;background:#fafaf7">${g}<line x1="10" y1="14" x2="${10 + scPx}" y2="14" stroke="#000" stroke-width="2"/><text x="${14 + scPx}" y="18" font-size="11">${sc >= 1000 ? sc / 1000 + ' km' : sc + ' m'}</text><text x="${W - 26}" y="22" font-size="15" font-weight="700">N↑</text></svg>`;
}
async function visitHtml(o) {
  const E = esc, d = visitData(o), ob = obras.get(settings.activeObra) || {}, num = new Map(); d.acts.forEach((a, i) => num.set(a.id, i + 1));
  const ph = async list => { if (!o.photos) return ''; const out = []; for (const m of (list || []).filter(x => x.kind === 'photo')) { const u = await photoDataUrl(m.blob); if (u) out.push(u); } return out; };
  // por traza
  const byTrace = new Map(); d.acts.forEach(a => { const k = a.layerId + '#' + a.featIdx; byTrace.set(k, [...(byTrace.get(k) || []), a]); });
  let tracesHtml = '';
  for (const [, list] of byTrace) {
    const ctx = featOf(list[0]), f = ctx && ctx.f, wst = f && ctx.rec.widths && ctx.rec.widths[list[0].featIdx] ? widthStats(widthSegments(ctx.rec.widths[list[0].featIdx], f)) : null;
    tracesHtml += `<h2>${E(list[0].traceName)} <small>${E(list[0].layerName || '')}</small></h2>
      <p>${f ? `Longitud de la traza: <b>${fmtLen(f.length)}</b>` : 'Traza no cargada'}${wst ? ` · ancho medio <b>${fmtW(wst.mean)}</b> (${fmtW(wst.min)} – ${fmtW(wst.max)})` : ''} · ${list.length} actuaciones${f ? ` · tramo con actuaciones: <b>${fmtLen(unionLen(list))}</b> (${Math.round(unionLen(list) / f.length * 100)} % de la traza)` : ''}</p>
      ${f ? traceSvg(f, list, num) : ''}
      <table><tr><th>Nº</th><th>PK</th><th>Margen</th><th>Actuación</th><th>Datos</th><th>Mediciones</th><th>Observaciones</th></tr>
      ${list.map(a => `<tr><td><b>${num.get(a.id)}</b></td><td style="white-space:nowrap">${fmtPK(a.d0)}${a.d1 > a.d0 ? '<br>' + fmtPK(a.d1) : ''}</td><td>${E(SIDE_ABBR[a.side] || '')}</td>
        <td><span class="dot" style="background:${actColor(a.type)}"></span><b>${E(a.type)}</b><br><small>${E(actItem(a.type).catName)}${a.prio ? ' · prioridad ' + E((ACT_PRIO[a.prio] || [a.prio])[0].toLowerCase()) : ''}</small></td>
        <td>${actParamRows(a).filter(([k]) => k !== 'Prioridad').map(([k, v]) => `${E(k)}: ${E(String(v))}`).join('<br>')}</td><td>${actMeasRows(a).map(([k, v]) => `${E(k)}: <b>${E(v)}</b>`).join('<br>')}</td><td>${E(a.text || '')}</td></tr>`).join('')}</table>`;
    for (const a of list) { const imgs = await ph(a.media); if (imgs && imgs.length) tracesHtml += `<div class="ph">${imgs.map((u, i) => `<figure><img src="${u}"><figcaption>${num.get(a.id)}. ${E(a.type)} · PK ${fmtPK(a.d0)}${imgs.length > 1 ? ` (${i + 1})` : ''}</figcaption></figure>`).join('')}</div>`; }
  }
  let notesHtml = '';
  if (d.notes.length) {
    notesHtml = `<h2>Anotaciones</h2><table><tr><th>Nº</th><th>Anotación</th><th>Coordenadas</th><th>Fecha</th></tr>${d.notes.map((n, i) => `<tr><td>A${i + 1}</td><td><b>${E(n.title || 'Anotación')}</b>${n.text ? '<br>' + E(n.text) : ''}</td><td>${fmtLL(n.lat, n.lng)}<br><small>${fmtUTM(n.lat, n.lng)}</small></td><td>${fmtDate(n.created)}</td></tr>`).join('')}</table>`;
    for (const [i, n] of d.notes.entries()) { const imgs = await ph(n.media); if (imgs && imgs.length) notesHtml += `<div class="ph">${imgs.map(u => `<figure><img src="${u}"><figcaption>A${i + 1}. ${E(n.title || '')}</figcaption></figure>`).join('')}</div>`; }
  }
  const wHtml = d.widths.length ? `<h2>Anchos del camino</h2><table><tr><th>Traza</th><th>Tramo medido</th><th>Ancho medio</th><th>Mín. – máx.</th><th>Superficie</th></tr>${d.widths.map(w => `<tr><td>${E(w.f.name)}</td><td>PK ${fmtPK(w.st.from)} – ${fmtPK(w.st.to)} (${fmtLen(w.st.len)})</td><td><b>${fmtW(w.st.mean)}</b></td><td>${fmtW(w.st.min)} – ${fmtW(w.st.max)}</td><td>${fmtArea(w.st.area)}</td></tr>`).join('')}</table>` : '';
  const ntHtml = d.newTraces.length ? `<h2>Trazas nuevas dibujadas o grabadas</h2><ul>${d.newTraces.map(e => `<li>${E(e.rec.name)}: ${e.feats.map(f => f.type === 'ln' ? `${E(f.name)} (${fmtLen(f.length)})` : E(f.name)).join(', ')}</li>`).join('')}</ul>` : '';
  const sum = actsSummary(d.acts), prioA = d.acts.filter(a => a.prio === 'alta');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe de visita · ${E(ob.name || '')}</title>
<style>body{font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#16211c;max-width:960px;margin:24px auto;padding:0 16px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 8px;border-bottom:2px solid #0b3d2e;padding-bottom:3px}h2 small{font-weight:400;color:#5b6b63}
table{border-collapse:collapse;width:100%;margin:8px 0 12px;font-size:12px}th,td{border:1px solid #cfd8d3;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eef3f0}.sub{color:#5b6b63}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}
.num td:not(:first-child){text-align:right}.ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin:6px 0 14px}figure{margin:0;break-inside:avoid}figure img{width:100%;border-radius:4px;border:1px solid #ddd}figcaption{font-size:11px;color:#5b6b63}
.box{background:#f4f7f5;border-radius:6px;padding:8px 10px}.warn{background:#fff4e6;border:1px solid #ffd8a8;padding:8px 10px;border-radius:6px}small{color:#5b6b63}
@media (max-width:700px){body{margin:12px auto;font-size:12px}table{display:block;overflow-x:auto;font-size:11px}h1{font-size:19px}}
@media print{body{margin:0;max-width:none}h2{break-after:avoid}tr,figure{break-inside:avoid}}</style></head><body>
<h1>Informe de visita de campo</h1>
<p class="sub">Obra: <b>${E(ob.name || '')}</b> · ${o.since ? `cambios desde el ${new Date(o.since).toLocaleDateString('es-ES')}` : 'todo lo registrado'} · emitido el ${new Date().toLocaleString('es-ES')}${o.who ? ` · técnico: <b>${E(o.who)}</b>` : ''} · OBRA-GIS v${APP_VERSION}</p>
<div class="box"><b>${plural(d.acts.length, 'actuación', 'actuaciones')}</b> en ${byTrace.size} traza${byTrace.size === 1 ? '' : 's'} (${fmtLen([...byTrace.values()].reduce((s, l) => s + unionLen(l), 0))} de camino con actuaciones) · ${d.notes.length} anotaciones · ${d.photos} fotos${d.widths.length ? ` · anchos en ${d.widths.length} trazas` : ''}${d.newTraces.length ? ` · ${d.newTraces.length} trazas nuevas` : ''}${prioA.length ? ` · <b style="color:#e03131">${prioA.length} de prioridad alta</b>` : ''}</div>
${o.obs ? `<h2>Observaciones generales</h2><p>${E(o.obs).replace(/\n/g, '<br>')}</p>` : ''}
${sum.length ? `<h2>Resumen de mediciones</h2>${(() => { const cols = [['Longitud (m)', 'L', MEAS_DEC.L], ['Superficie (m²)', 'area', MEAS_DEC.area], ['Volumen (m³)', 'vol', MEAS_DEC.vol], ['Peso (t)', 't', MEAS_DEC.t], ['Unidades', 'ud', 0]].filter(c => sum.some(r => r[c[1]])); // solo las columnas con datos (cabe en el móvil)
  return `<table class="num"><tr><th>Actuación</th><th>Nº</th>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>${sum.map(r => `<tr><td><span class="dot" style="background:${actColor(r.type)}"></span>${E(r.type)}</td><td>${r.n}</td>${cols.map(c => `<td>${r[c[1]] ? nf(r[c[1]], c[2]) : ''}</td>`).join('')}</tr>`).join('')}</table>`; })()}
<p><small>Mediciones calculadas con los datos tomados en campo (longitud por PK × ancho × espesor; densidades orientativas para el peso). Comprobar antes de usarlas en una medición oficial.</small></p>` : ''}
${prioA.length ? `<h2>Actuaciones de prioridad alta</h2><ul>${prioA.map(a => `<li><b>${num.get(a.id)}. ${E(a.type)}</b> · ${E(a.traceName)} · PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? '–' + fmtPK(a.d1) : ''}${a.text ? ' · ' + E(a.text) : ''}</li>`).join('')}</ul>` : ''}
${tracesHtml}${wHtml}${ntHtml}${notesHtml}
<h2>Nota</h2><p class="warn">Informe generado con OBRA-GIS a partir de los datos tomados en la visita. Los PK se miden sobre la traza del KML; las mediciones son orientativas y deben comprobarse antes de su uso en proyecto o certificación.</p>
</body></html>`;
}

/* ---------------- PK en directo: dónde estoy respecto a la traza más cercana ---------------- */
let livePkT = 0, livePkCur = null, livePkTO = null;
function updateLivePK() {
  if (settings.livePK === false || !lastPos) { const el0 = $('#livePk'); if (el0) el0.hidden = true; return; }
  if (Date.now() - livePkT < 1500) { clearTimeout(livePkTO); livePkTO = setTimeout(updateLivePK, 1510 - (Date.now() - livePkT)); return; } livePkT = Date.now(); // la última posición se aplica siempre (no se queda una lectura vieja)
  let el = $('#livePk');
  if (!el) { el = document.createElement('div'); el.id = 'livePk'; el.className = 'livepk'; el.hidden = true; document.body.appendChild(el); el.onclick = livePkMenu; }
  const n = nearestTrace(L.latLng(lastPos.lat, lastPos.lng));
  if (!n || n.off > 60) { el.hidden = true; livePkCur = null; return; }
  const a = pointAtPK(n.f, Math.max(0, n.d - 2)), b = pointAtPK(n.f, Math.min(n.f.length, n.d + 2)), k = Math.cos(lastPos.lat * Math.PI / 180);
  const cross = (b.lng - a.lng) * k * (lastPos.lat - a.lat) - (b.lat - a.lat) * (lastPos.lng - a.lng) * k;
  const fi = layers.get(n.rec.id).feats.indexOf(n.f), w = roadWidthAt(n.rec, fi, n.d, n.d);
  livePkCur = { ...n, fi };
  if (walkAct) showWalkBar();
  el.innerHTML = `${esc(n.f.name)} · PK ${fmtPK(n.d)}<small>${n.off < 2 ? 'en el eje' : `${Math.round(n.off)} m a la ${cross > 0 ? 'izquierda' : 'derecha'}`}${w ? ' · ancho ' + fmtW(w) : ''}</small>`;
  el.hidden = false;
}
function livePkMenu() {
  const c = livePkCur; if (!c) return;
  const b = openSheet(`<h2>PK ${fmtPK(c.d)}</h2><p class="sub">${esc(c.f.name)} · ${esc(c.rec.name)} · a ${Math.round(c.off)} m del eje</p>
    <div class="acts">${walkHere() ? `<button class="btn go full" data-a="wend">Terminar aquí el tramo de ${esc(walkAct.draft.type)}</button>` : `<button class="btn go full" data-a="wstart">${ICON.road}Empezar tramo aquí</button>`}
      <button class="btn full" data-a="act">${ICON.road}Actuación en este punto</button>${repeatRow()}
      <button class="btn" data-a="trace">Ficha de la traza</button><button class="btn" data-a="off">Ocultar el PK en directo</button></div>`);
  b.querySelector('[data-a=act]').onclick = () => openActEditor({ rec: c.rec, f: c.f, d0: c.d, d1: c.d });
  const ws = b.querySelector('[data-a=wstart]'); if (ws) ws.onclick = () => walkStartSheet();
  const we = b.querySelector('[data-a=wend]'); if (we) we.onclick = () => { closeSheet(); if (walkAct) walkAct.shown = 0; walkEnd(false); };
  const rp = b.querySelector('[data-a=rep]'); if (rp) rp.onclick = () => repeatLastAct();
  const rw = b.querySelector('[data-a=repw]'); if (rw) rw.onclick = () => repeatWalk();
  b.querySelector('[data-a=trace]').onclick = () => { const p = pointAtPK(c.f, c.d); featureSheet(c.f, L.latLng(p.lat, p.lng), c.rec); };
  b.querySelector('[data-a=off]').onclick = () => { settings.livePK = false; saveSettings(); $('#livePk').hidden = true; closeSheet(); toast('PK en directo desactivado. Se vuelve a activar en Capas → Ajustes.', 5000); };
}

/* ---------------- Aviso de versión nueva (app Android) ----------------
   version.json se publica junto a la web. Si hay una versión más reciente, la app lo avisa y ofrece hacer antes una copia de seguridad. */
const VERSION_URL = 'https://celtis-eng.github.io/OBRAGIS/version.json';
async function checkAppUpdate(manual) {
  if (!NATIVE && !manual) return;
  let v; try { v = JSON.parse(await httpGetText(VERSION_URL + '?t=' + Date.now())); } catch (e) { if (manual) toast('No se pudo comprobar: sin conexión.'); return; }
  if (!v || !v.version || !semverLess(APP_VERSION, v.version)) { if (manual) toast(`Tienes la última versión (${APP_VERSION}).`); return; }
  if (!manual && settings.updDismiss === v.version) return;
  let el = $('#upBanner'); if (!el) { el = document.createElement('div'); el.id = 'upBanner'; el.className = 'upbanner'; document.body.appendChild(el); }
  const apk = v.apk || 'https://github.com/Celtis-eng/OBRAGIS/releases/download/apk/CampoKML.apk';
  el.innerHTML = `<b>Hay una versión nueva de OBRA-GIS: ${esc(v.version)}</b>${v.notas ? `<br><small>${esc(v.notas)}</small>` : ''}<br>Antes de instalarla, haz una copia de seguridad de tus obras.
    <div class="row"><button class="mini pri" data-u="bk">1. Copia de seguridad</button><a class="mini" href="${esc(apk)}" target="_blank" rel="noopener" data-u="dl">2. Descargar e instalar</a><button class="mini" data-u="no">Más tarde</button></div>`;
  el.hidden = false;
  el.querySelector('[data-u=bk]').onclick = () => backupAllObras();
  el.querySelector('[data-u=no]').onclick = () => { settings.updDismiss = v.version; saveSettings(); el.hidden = true; };
}
