'use strict';
/* OBRA-GIS · Anchos, dibujar/grabar trazas, distancia por carretera, calculadora, recursos e informe de afecciones.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Anchos del camino ----------------
   Dos formas de tomar datos sobre una traza:
   · «interval»: estaciones cada X m; el ancho varía linealmente entre estaciones.
   · «changes»: puntos de cambio; cada ancho vale desde su PK hasta el siguiente cambio (o el final). */
const fmtW = w => (Math.round(w * 100) / 100).toFixed(2).replace('.', ',') + ' m';
const fmtArea = a => (a >= 10000 ? (a / 10000).toFixed(3).replace('.', ',') + ' ha' : thousands(a) + ' m²');
// Lee un número escrito a mano: «4,5», «4.5», «4,5 m», «1.234,5» (miles con punto), «20cm». Devuelve NaN si no hay número.
const parseNum = t => {
  let x = String(t ?? '').trim().toLowerCase().replace(/\s+/g, '').replace(/(m²|m2|m³|m3|cm|mm|kg\/m²|kg|ud|uds|m|t|%)$/, '');
  if (!x) return NaN;
  if (x.includes('.') && x.includes(',')) x = x.replace(/\./g, '').replace(',', '.'); else x = x.replace(',', '.');
  if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/.test(x)) return NaN;
  const v = parseFloat(x); return isFinite(v) ? v : NaN;
};
function widthSegments(data, f) {
  const pts = (data.points || []).filter(p => isFinite(p.w) && p.w > 0 && isFinite(p.d)).sort((a, b) => a.d - b.d);
  const segs = [];
  if (!pts.length) return segs;
  if (data.mode === 'changes') {
    pts.forEach((p, i) => { const b = i + 1 < pts.length ? pts[i + 1].d : f.length; if (b > p.d) segs.push({ a: p.d, b, wa: p.w, wb: p.w }); });
  } else {
    for (let i = 0; i + 1 < pts.length; i++) if (pts[i + 1].d > pts[i].d) segs.push({ a: pts[i].d, b: pts[i + 1].d, wa: pts[i].w, wb: pts[i + 1].w });
  }
  return segs;
}
function widthAt(segs, d) {
  for (const s of segs) if (d >= s.a && d <= s.b) return s.b > s.a ? s.wa + (s.wb - s.wa) * (d - s.a) / (s.b - s.a) : s.wa;
  return null;
}
function widthStats(segs, d0 = -Infinity, d1 = Infinity) {
  let len = 0, area = 0, min = Infinity, max = -Infinity, from = Infinity, to = -Infinity;
  for (const s of segs) {
    const a = Math.max(s.a, d0), b = Math.min(s.b, d1); if (b <= a) continue;
    const wa = widthAt([s], a), wb = widthAt([s], b);
    len += b - a; area += (wa + wb) / 2 * (b - a);
    min = Math.min(min, wa, wb); max = Math.max(max, wa, wb); from = Math.min(from, a); to = Math.max(to, b);
  }
  return len ? { len, area, mean: area / len, min, max, from, to } : null;
}
// Polígono de la plataforma: desplaza el eje ±ancho/2 en metros, perpendicular a la traza
function widthPolygon(f, segs) {
  const out = [];
  segs.forEach(sg => {
    const ds = new Set([sg.a, sg.b]);
    for (let d = sg.a; d < sg.b; d += 5) ds.add(d);
    vertexTable(f).forEach(v => { if (v.d > sg.a && v.d < sg.b) ds.add(v.d); });
    const list = [...ds].sort((a, b) => a - b), left = [], right = [];
    list.forEach(d => {
      const p = pointAtPK(f, d), q0 = pointAtPK(f, Math.max(0, d - 1)), q1 = pointAtPK(f, Math.min(f.length, d + 1));
      const k = Math.cos(p.lat * Math.PI / 180), ex = (q1.lng - q0.lng) * 111320 * k, ny = (q1.lat - q0.lat) * 111320;
      const l = Math.hypot(ex, ny) || 1, nx = -ny / l, nn = ex / l, h = widthAt([sg], d) / 2;
      left.push([p.lat + nn * h / 111320, p.lng + nx * h / (111320 * k)]);
      right.push([p.lat - nn * h / 111320, p.lng - nx * h / (111320 * k)]);
    });
    if (list.length > 1) out.push({ ring: [...left, ...right.reverse()], seg: sg });
  });
  return out;
}
const widthLayer = L.layerGroup().addTo(map);
function drawWidths() {
  widthLayer.clearLayers();
  const z = map.getZoom(); if (z < 15) return;
  const bounds = map.getBounds().pad(0.2);
  for (const e of layers.values()) {
    if (typeOf(e.rec) !== 'kml' || !e.rec.visible || !e.rec.widths) continue;
    for (const [fi, data] of Object.entries(e.rec.widths)) {
      const f = e.feats[+fi]; if (!f || data.show === false) continue;
      const segs = widthSegments(data, f); if (!segs.length) continue;
      widthGaps(data, f).gaps.forEach(g => { const c = segmentCoords(f, g.a, g.b); if (c.length > 1 && bounds.intersects(L.latLngBounds(c))) L.polyline(c, { renderer: hlRenderer, color: '#e03131', weight: 4, dashArray: '8 6', opacity: 0.9, interactive: false }).addTo(widthLayer); }); // sin ancho asignado
      const key = (data.updated || 0) + ':' + fi;
      if (!f._wpoly || f._wkey !== key) { f._wpoly = widthPolygon(f, segs); f._wkey = key; }
      f._wpoly.forEach(pg => {
        if (!bounds.intersects(L.latLngBounds(pg.ring))) return;
        L.polygon(pg.ring, { renderer: hlRenderer, color: '#ffffff', weight: 1, dashArray: '4 3', fillColor: '#ffd43b', fillOpacity: 0.22, interactive: false }).addTo(widthLayer);
      });
      if (z >= 17) (data.points || []).filter(p => p.w > 0).forEach(p => {
        const c = pointAtPK(f, p.d); if (!bounds.contains([c.lat, c.lng])) return;
        L.marker([c.lat, c.lng], { interactive: false, keyboard: false, pane: 'pk', icon: L.divIcon({ className: 'w-label', html: `<span>${fmtW(p.w)}</span>`, iconSize: [0, 0] }) }).addTo(widthLayer);
      });
    }
  }
}

let wDraft = null, widthPick = null;
function widthSheet(rec, f) {
  const fi = layers.get(rec.id).feats.indexOf(f);
  const saved = rec.widths && rec.widths[fi];
  wDraft = saved ? JSON.parse(JSON.stringify({ ...saved, rec: undefined })) : { mode: 'interval', interval: 20, points: [] };
  wDraft.points = (wDraft.points || []).map(p => ({ d: p.d, w: p.w == null ? NaN : p.w }));
  Object.assign(wDraft, { recId: rec.id, fi, r0: '', r1: '' });
  renderWidthSheet();
}
function wCtx() { const e = layers.get(wDraft.recId); return e ? { rec: e.rec, f: e.feats[wDraft.fi] } : null; }
function syncWidth() {
  if (!wDraft) return;
  document.querySelectorAll('[data-wi]').forEach(inp => { const p = wDraft.points[+inp.dataset.wi]; if (p) p.w = parseNum(inp.value); });
  const iv = $('#wInt'); if (iv) { const v = parseNum(iv.value); if (v > 0) wDraft.interval = v; }
  ['wcPk', 'wcW', 'wR0', 'wR1'].forEach(id => { const el = $('#' + id); if (el) wDraft['_' + id] = el.value; });
}
function renderWidthSheet() {
  const ctx = wCtx(); if (!ctx || !wDraft) return;
  const { rec, f } = ctx, d = wDraft;
  d.points.sort((a, b) => a.d - b.d);
  const segs = widthSegments(d, f), st = widthStats(segs);
  const rows = d.mode === 'interval'
    ? (d.points.length ? `<div class="wtable">${d.points.map((p, i) => `<div class="wrow" id="wr${i}"><span>PK ${fmtPK(p.d)}</span><input type="text" inputmode="decimal" data-wi="${i}" value="${isFinite(p.w) ? String(p.w).replace('.', ',') : ''}" placeholder="ancho (m)"></div>`).join('')}</div>`
      : '<p class="hint">Pulsa «Generar estaciones» para crear los puntos de toma de datos a lo largo de la traza.</p>')
    : `<div class="wtable">${d.points.map((p, i) => `<div class="wrow"><span>Desde PK ${fmtPK(p.d)}<small>${fmtLen((i + 1 < d.points.length ? d.points[i + 1].d : f.length) - p.d)} hasta ${i + 1 < d.points.length ? 'el siguiente' : 'el final'}</small></span><input type="text" inputmode="decimal" data-wi="${i}" value="${isFinite(p.w) ? String(p.w).replace('.', ',') : ''}"><button class="mini ic del" data-wdel="${i}" aria-label="Quitar">${ICON.close}</button></div>`).join('') || '<p class="hint">Añade el primer ancho, normalmente desde el PK 0+000.</p>'}</div>
      <div class="wadd">
        <div class="pkrow"><div class="field"><label for="wcPk">Desde PK</label><input type="text" id="wcPk" inputmode="decimal" value="${esc(d._wcPk ?? (d.points.length ? '' : '0+000'))}"></div>
          <div class="field"><label for="wcW">Ancho (m)</label><input type="text" id="wcW" inputmode="decimal" value="${esc(d._wcW || '')}"></div></div>
        <div class="row"><button class="mini" data-a="cgps">PK: mi posición</button><button class="mini" data-a="cmap">PK: tocar mapa</button><button class="mini pri" data-a="cadd">Añadir cambio</button></div>
      </div>`;
  const b = openSheet(`<h2>Anchos del camino</h2><p class="sub">${esc(f.name)} · ${esc(rec.name)} · ${fmtLen(f.length)}</p>
    <div class="seg two"><button type="button" class="${d.mode === 'interval' ? 'on' : ''}" data-wmode="interval">Cada X metros</button><button type="button" class="${d.mode === 'changes' ? 'on' : ''}" data-wmode="changes">Cuando cambia</button></div>
    ${d.mode === 'interval' ? `<div class="field row" style="margin-top:10px"><label for="wInt" class="grow">Separación entre estaciones (m)</label><input type="text" id="wInt" inputmode="decimal" value="${String(d.interval).replace('.', ',')}" style="max-width:80px"><button class="mini" data-a="gen">Generar estaciones</button></div>
      <div class="row"><button class="mini" data-a="near">${ICON.locate}Estación más cercana a mí</button></div>` : '<p class="hint" style="margin-top:10px">Cada ancho vale desde su PK hasta el siguiente cambio o el final de la traza.</p>'}
    ${rows}
    <div id="wRes">${widthResultsHtml(st, d, f)}</div>
    <div class="pkrow"><div class="field"><label for="wR0">Tramo desde PK</label><input type="text" id="wR0" inputmode="decimal" value="${esc(d._wR0 || '')}" placeholder="0+000"></div>
      <div class="field"><label for="wR1">hasta PK</label><input type="text" id="wR1" inputmode="decimal" value="${esc(d._wR1 || '')}" placeholder="${fmtPK(f.length)}"></div></div>
    <div class="acts">
      <button class="btn" data-a="calc">${ICON.width}Recalcular</button>
      <button class="btn" data-a="csv">Anchos a Excel (CSV)</button>
      <label class="opt full"><input type="checkbox" id="wShow" ${d.show === false ? '' : 'checked'}>Dibujar la plataforma en el mapa</label>
      <button class="btn pri full" data-a="save">Guardar anchos</button>
      ${rec.widths && rec.widths[d.fi] ? '<button class="btn del full" data-a="clear">Borrar los anchos de esta traza</button>' : ''}
    </div>`);
  showSlopeSegment(f, 0, f.length);
  onSheetClose(() => setTimeout(() => { if (!widthPick && !$('#wRes')) slopeHL.clearLayers(); }, 0));
  b.querySelectorAll('[data-wmode]').forEach(bt => bt.onclick = () => {
    syncWidth(); if (d.mode === bt.dataset.wmode) return;
    if (d.points.some(p => p.w > 0) && !confirm(bt.dataset.wmode === 'changes' ? 'Los anchos tomados se conservan, pero cada uno pasará a valer desde su PK hasta el siguiente (sin transición entre ellos). El ancho medio puede cambiar. ¿Continuar?' : 'Los anchos tomados se conservan, pero entre dos puntos el ancho pasará a variar de forma gradual. El ancho medio puede cambiar. ¿Continuar?')) return;
    d.mode = bt.dataset.wmode; renderWidthSheet();
  });
  b.querySelectorAll('[data-wi]').forEach(inp => inp.onchange = () => { syncWidth(); $('#wRes').innerHTML = widthResultsHtml(widthStats(widthSegments(d, f), ...rangeOf(f)), d, f); });
  b.querySelectorAll('[data-wdel]').forEach(bt => bt.onclick = () => { syncWidth(); d.points.splice(+bt.dataset.wdel, 1); renderWidthSheet(); });
  const gen = b.querySelector('[data-a=gen]');
  if (gen) gen.onclick = () => {
    syncWidth();
    const step = d.interval, old = new Map(d.points.map(p => [Math.round(p.d), p.w])), pts = [];
    for (let x = 0; x < f.length - 0.5; x += step) pts.push({ d: x, w: old.get(Math.round(x)) ?? NaN });
    pts.push({ d: f.length, w: old.get(Math.round(f.length)) ?? NaN });
    if (pts.length > 400) { toast('Salen demasiadas estaciones. Aumenta la separación.'); return; }
    d.points = pts; renderWidthSheet(); toast(`${pts.length} estaciones cada ${String(step).replace('.', ',')} m`);
  };
  const near = b.querySelector('[data-a=near]');
  if (near) near.onclick = async () => {
    syncWidth(); if (!d.points.length) { toast('Genera primero las estaciones.'); return; }
    try {
      const p = await getPos(), r = pkAt(f, L.latLng(p.lat, p.lng));
      let bi = 0; d.points.forEach((q, i) => { if (Math.abs(q.d - r.d) < Math.abs(d.points[bi].d - r.d)) bi = i; });
      const row = $('#wr' + bi); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.classList.add('hit'); row.querySelector('input').focus();
      toast(`Estás en el PK ${fmtPK(r.d)}${r.off > 30 ? ` (a ${Math.round(r.off)} m de la traza)` : ''}. Estación más cercana: PK ${fmtPK(d.points[bi].d)}.`, 5000);
    } catch (e) { toast(geoErr(e), 6000); }
  };
  const cgps = b.querySelector('[data-a=cgps]');
  if (cgps) cgps.onclick = async () => { syncWidth(); try { const p = await getPos(), r = pkAt(f, L.latLng(p.lat, p.lng)); $('#wcPk').value = fmtPK(r.d); d._wcPk = fmtPK(r.d); if (r.off > 30) toast(`Estás a ${Math.round(r.off)} m de la traza: se usa el punto más cercano.`, 5000); $('#wcW').focus(); } catch (e) { toast(geoErr(e), 6000); } };
  const cmap = b.querySelector('[data-a=cmap]');
  if (cmap) cmap.onclick = () => { syncWidth(); widthPick = true; closeSheet(); $('#pickText').textContent = 'Toca en el mapa dónde cambia el ancho'; $('#pickBar').hidden = false; };
  const cadd = b.querySelector('[data-a=cadd]');
  if (cadd) cadd.onclick = () => {
    syncWidth();
    const pk = parsePK($('#wcPk').value), w = parseNum($('#wcW').value);
    if (!isFinite(pk) || pk < 0 || pk > f.length + 0.5) { toast('Revisa el PK (entre 0+000 y ' + fmtPK(f.length) + ').'); return; }
    if (!(w > 0)) { toast('Escribe el ancho en metros.'); return; }
    d.points = d.points.filter(p => Math.abs(p.d - pk) > 0.5); d.points.push({ d: Math.min(pk, f.length), w });
    d._wcPk = ''; d._wcW = ''; renderWidthSheet();
  };
  b.querySelector('[data-a=calc]').onclick = () => { syncWidth(); $('#wRes').innerHTML = widthResultsHtml(widthStats(widthSegments(d, f), ...rangeOf(f)), d, f); };
  b.querySelector('[data-a=csv]').onclick = async () => {
    syncWidth(); const x = widthsExport([{ ...rec, widths: { [d.fi]: { ...d } } }]);
    if (x.rows <= 1) { toast('Todavía no hay anchos que exportar.'); return; }
    try { await saveBlob(new Blob([x.csv], { type: 'text/csv' }), `anchos_${safeName(f.name)}_${new Date().toISOString().slice(0, 10)}.csv`); } catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar.'); }
  };
  b.querySelector('[data-a=save]').onclick = async () => {
    syncWidth();
    const data = { mode: d.mode, interval: d.interval, points: d.points.filter(p => isFinite(p.d)).map(p => ({ d: +p.d.toFixed(2), w: isFinite(p.w) ? p.w : null })), show: $('#wShow').checked, updated: Date.now() };
    rec.widths = { ...(rec.widths || {}), [d.fi]: data };
    await updateLayer(rec.id, { widths: rec.widths }); drawWidths();
    const s2 = widthStats(widthSegments(data, f));
    toast(s2 ? `Anchos guardados. Ancho medio ${fmtW(s2.mean)} en ${fmtLen(s2.len)}.` : 'Anchos guardados.', 5000);
  };
  const clr = b.querySelector('[data-a=clear]');
  if (clr) clr.onclick = async () => {
    if (!confirm('¿Borrar todos los anchos de esta traza?')) return;
    delete rec.widths[d.fi]; await updateLayer(rec.id, { widths: rec.widths }); drawWidths(); widthSheet(rec, f);
  };
}
function rangeOf(f) { const a = parsePK($('#wR0') && $('#wR0').value), b = parsePK($('#wR1') && $('#wR1').value); return [isFinite(a) ? a : -Infinity, isFinite(b) ? b : Infinity]; }
// Partes de la traza que no tienen ancho (antes del primer dato, después del último o entre estaciones sin ancho)
function widthGaps(d, f) {
  const segs = widthSegments(d, f).sort((a, b) => a.a - b.a), gaps = []; let x = 0;
  segs.forEach(s => { if (s.a - x > 1) gaps.push({ a: x, b: s.a }); x = Math.max(x, s.b); });
  if (f.length - x > 1) gaps.push({ a: x, b: f.length });
  const sinDato = d.mode === 'interval' ? (d.points || []).filter(p => !(p.w > 0)) : [];
  return { gaps, sinDato, len: gaps.reduce((t, g) => t + g.b - g.a, 0) };
}
function widthBreakdownHtml(d, f) {
  const segs = widthSegments(d, f); if (!segs.length) return '';
  const rows = segs.map(sg => ({ a: sg.a, b: sg.b, w: (sg.wa + sg.wb) / 2, var: Math.abs(sg.wa - sg.wb) > 0.005, wa: sg.wa, wb: sg.wb }));
  const byW = new Map(); rows.forEach(r => { const k = (Math.round(r.w * 20) / 20).toFixed(2); byW.set(k, (byW.get(k) || 0) + r.b - r.a); });
  const tot = rows.reduce((t, r) => t + r.b - r.a, 0);
  return `<h3 class="sh">Longitud de cada ancho</h3><table class="attrs">${[...byW].sort((x, y) => +x[0] - +y[0]).map(([w, l]) => `<tr><td>${fmtW(+w)}</td><td><b>${fmtLen(l)}</b> · ${Math.round(l / tot * 100)} %</td></tr>`).join('')}</table>
    <details class="more"><summary>Tramo a tramo (${rows.length})</summary><table class="attrs wtramos"><tr><th>Desde – hasta</th><th>Ancho</th><th>Longitud</th></tr>${rows.slice(0, 300).map(r => `<tr><td>${fmtPK(r.a)} – ${fmtPK(r.b)}</td><td>${r.var ? `${fmtW(r.wa)} → ${fmtW(r.wb)}` : fmtW(r.w)}</td><td>${fmtLen(r.b - r.a)}</td></tr>`).join('')}</table></details>`;
}
function widthGapsHtml(d, f) {
  const g = widthGaps(d, f); if (!g.gaps.length && !g.sinDato.length) return (d.points || []).some(p => p.w > 0) ? '<p class="hint okline">✓ Toda la traza tiene ancho asignado.</p>' : '';
  return `<div class="fwarn" role="status"><b>Traza sin ancho asignado${g.len ? `: ${fmtLen(g.len)} (${Math.round(g.len / f.length * 100)} %)` : ''}</b>
    ${g.gaps.length ? `<ul class="plain">${g.gaps.slice(0, 12).map(x => `<li>PK ${fmtPK(x.a)} – ${fmtPK(x.b)} · ${fmtLen(x.b - x.a)}</li>`).join('')}${g.gaps.length > 12 ? `<li>… y ${g.gaps.length - 12} más</li>` : ''}</ul>` : ''}
    ${g.sinDato.length ? `<p>${plural(g.sinDato.length, 'estación sin ancho', 'estaciones sin ancho')} (entre ellas se ha supuesto el ancho de las vecinas): ${g.sinDato.slice(0, 10).map(p => 'PK ' + fmtPK(p.d)).join(', ')}${g.sinDato.length > 10 ? '…' : ''}.</p>` : ''}
    <p class="hint" style="margin:4px 0 0">En el mapa, los tramos sin ancho se marcan con una línea roja discontinua.</p></div>`;
}
function widthResultsHtml(st, d, f) {
  return widthResultsHtml0(st, d, f) + widthGapsHtml(d, f) + widthBreakdownHtml(d, f);
}
function widthResultsHtml0(st, d, f) {
  if (!st) return '<p class="hint">Introduce al menos ' + (d.mode === 'interval' ? 'dos estaciones con ancho' : 'un cambio de ancho') + ' para calcular.</p>';
  const full = st.from <= 0.5 && st.to >= f.length - 0.5;
  return `<div class="slope-main"><span>${fmtW(st.mean)}</span><small>ancho medio ponderado por longitud</small></div>
    <table class="attrs">
      <tr><td>Tramo calculado</td><td>PK ${fmtPK(st.from)} a ${fmtPK(st.to)} · ${fmtLen(st.len)}${full ? '' : ' (no cubre toda la traza)'}</td></tr>
      <tr><td>Ancho mínimo / máximo</td><td>${fmtW(st.min)} / ${fmtW(st.max)}</td></tr>
      <tr><td>Superficie</td><td>${fmtArea(st.area)}</td></tr>
    </table>`;
}
var slopePickPoint2 = slopePickPoint;
slopePickPoint = function (ll) {
  if (offPick) return offlinePickAt(L.latLng(ll));
  if (calcPick) return calcPickPoint(L.latLng(ll));
  if (!widthPick) return slopePickPoint2(ll);
  widthPick = null; $('#pickBar').hidden = true;
  const ctx = wCtx(); const r = pkAt(ctx.f, L.latLng(ll));
  wDraft._wcPk = fmtPK(r.d); renderWidthSheet(); const w = $('#wcW'); if (w) w.focus();
};
function widthsExport(recs) {
  const n = v => String(v).replace('.', ','), q = csvQ;
  const rows = [['Capa', 'Traza', 'Forma de toma', 'PK inicio', 'PK fin', 'Ancho inicio (m)', 'Ancho fin (m)', 'Longitud (m)', 'Superficie (m2)']];
  const polys = [];
  recs.forEach(r => {
    const feats = (layers.get(r.id) || {}).feats || parseKML(r.text).feats;
    Object.entries(r.widths || {}).forEach(([fi, data]) => {
      const f = feats[+fi]; if (!f) return;
      const segs = widthSegments(data, f), st = widthStats(segs); if (!st) return;
      segs.forEach(s => rows.push([r.name, f.name, data.mode === 'changes' ? 'Cambios de ancho' : `Cada ${data.interval} m`, fmtPK(s.a), fmtPK(s.b), n(s.wa), n(s.wb), n((s.b - s.a).toFixed(2)), n(((s.wa + s.wb) / 2 * (s.b - s.a)).toFixed(2))]));
      rows.push([r.name, f.name, 'TOTAL (ancho inicio = mínimo, ancho fin = máximo)', fmtPK(st.from), fmtPK(st.to), n(st.min.toFixed(2)), n(st.max.toFixed(2)), n(st.len.toFixed(2)), n(st.area.toFixed(2))]);
      rows.push([r.name, f.name, 'ANCHO MEDIO', '', '', n(st.mean.toFixed(3)), '', '', '']);
      widthPolygon(f, segs).forEach(pg => polys.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...pg.ring, pg.ring[0]].map(c => [+c[1].toFixed(7), +c[0].toFixed(7)])] },
        properties: { capa: r.name, traza: f.name, pk_inicio: fmtPK(pg.seg.a), pk_fin: fmtPK(pg.seg.b), ancho_inicio_m: pg.seg.wa, ancho_fin_m: pg.seg.wb,
          longitud_m: +(pg.seg.b - pg.seg.a).toFixed(2), superficie_m2: +((pg.seg.wa + pg.seg.wb) / 2 * (pg.seg.b - pg.seg.a)).toFixed(2) } }));
    });
  });
  return { csv: '\ufeff' + rows.map(r => r.map(q).join(';')).join('\r\n'), polys, rows: rows.length };
}

/* ---------------- Dibujar o grabar una traza nueva ---------------- */
let drawing = null;
// modo: false = línea tocando el mapa · true = línea grabada con GPS · 'points' = puntos
function startDrawing(mode) {
  if (drawing) endDrawing(false);
  const gps = mode === true, points = mode === 'points';
  drawing = { gps, points, pts: [], line: L.polyline([], { renderer: hlRenderer, color: '#ff6b00', weight: 4, interactive: false }).addTo(map), dots: L.layerGroup().addTo(map) };
  $('#drawBar').hidden = false; $('#drawGps').hidden = !points; updateDrawBar();
  if (gps) { if (!startWatch()) { endDrawing(false); return; } if (lastPos && Date.now() - lastPos.t < 10000) drawGpsPoint(lastPos); toast('Grabando: camina por el eje del camino. Se añade un punto cada 5 m.', 5000); }
  else if (points) toast('Toca el mapa para añadir puntos, o pulsa «Aquí» para añadir tu posición GPS.', 5000);
  else toast('Toca el mapa para ir añadiendo los vértices de la traza.', 4000);
}
function addDrawPt(ll) {
  if (!drawing) return;
  drawing.pts.push(L.latLng(ll.lat, ll.lng));
  if (!drawing.points) drawing.line.setLatLngs(drawing.pts);
  if (drawing.points) L.marker(ll, { interactive: false, icon: L.divIcon({ className: 'dp-label', html: `<span>P${drawing.pts.length}</span>`, iconSize: [0, 0] }) }).addTo(drawing.dots);
  else if (!drawing.gps) L.circleMarker(ll, { renderer: hlRenderer, radius: 5, color: '#fff', weight: 2, fillColor: '#ff6b00', fillOpacity: 1, interactive: false }).addTo(drawing.dots);
  updateDrawBar();
}
function drawGpsPoint(p) {
  if (!drawing || !drawing.gps || (p.acc && p.acc > 25)) return;
  const ll = L.latLng(p.lat, p.lng), last = drawing.pts[drawing.pts.length - 1];
  if (!last || last.distanceTo(ll) >= 5) { addDrawPt(ll); map.panTo(ll, { animate: true }); }
}
function updateDrawBar() {
  const p = drawing.pts;
  if (drawing.points) { $('#drawText').textContent = `Puntos · ${p.length}`; return; }
  let len = 0; for (let i = 1; i < p.length; i++) len += p[i - 1].distanceTo(p[i]);
  $('#drawText').textContent = `${drawing.gps ? 'Grabando con GPS' : 'Dibujando'} · ${p.length} puntos · ${fmtLen(len)}`;
}
async function saveKmlLayer(name, text, extra = {}) {
  const nk = [...layers.values()].filter(e => typeOf(e.rec) === 'kml').length;
  const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name, text, color: PALETTE[nk % PALETTE.length], visible: true, opacity: 1, order: nextOrder(), created: Date.now(), ...extra };
  await DB.put('layers', rec);
  const e = registerLayer(rec); drawPK(); drawActs();
  return e;
}
function endDrawing(save) {
  if (!drawing) return;
  const pts = drawing.pts, points = drawing.points;
  map.removeLayer(drawing.line); map.removeLayer(drawing.dots); $('#drawBar').hidden = true;
  drawing = null;
  if (!save) return;
  if (!points && pts.length < 2) { toast('La traza necesita al menos dos puntos.'); return; }
  if (points && !pts.length) { toast('No has añadido ningún punto.'); return; }
  const b = openSheet(`<h2>Guardar ${points ? 'puntos' : 'traza'}</h2><p class="sub">${pts.length} puntos</p>
    <div class="field"><input type="text" id="trName" placeholder="${points ? 'Nombre (p. ej. Arquetas a revisar)' : 'Nombre (p. ej. Camino de servicio C-3)'}" value="${points ? 'Puntos' : 'Traza'} ${new Date().toLocaleDateString('es-ES')}"></div>
    ${points ? `<div class="field"><label>Nombres de los puntos (opcional, uno por línea)</label><textarea id="ptNames" rows="4" placeholder="${pts.map((p, i) => 'P' + (i + 1)).join('\n')}"></textarea></div>` : ''}
    <div class="acts"><button class="btn pri full" data-a="ok">Guardar como capa KML de la obra</button><button class="btn full" data-a="no">Descartar</button></div>`);
  b.querySelector('[data-a=no]').onclick = closeSheet;
  b.querySelector('[data-a=ok]').onclick = async () => {
    const name = $('#trName').value.trim() || (points ? 'Puntos' : 'Traza nueva');
    let body;
    if (points) {
      const names = ($('#ptNames').value || '').split('\n').map(x => x.trim());
      body = pts.map((p, i) => `<Placemark><name>${xml(names[i] || 'P' + (i + 1))}</name><Point><coordinates>${p.lng.toFixed(7)},${p.lat.toFixed(7)},0</coordinates></Point></Placemark>`).join('\n');
    } else body = `<Placemark><name>${xml(name)}</name><LineString><tessellate>1</tessellate><coordinates>${pts.map(p => `${p.lng.toFixed(7)},${p.lat.toFixed(7)},0`).join(' ')}</coordinates></LineString></Placemark>`;
    const text = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(name)}</name>\n${body}\n</Document></kml>`;
    const e = await saveKmlLayer(name, text, { drawn: true });
    closeSheet(); toast(`«${name}» guardada en la obra.`);
    if (!points) { const f = e.feats[0]; featureSheet(f, L.latLng(f.start[0], f.start[1]), e.rec); }
    else map.fitBounds(e.group.getBounds().pad(0.3), { maxZoom: 18 });
  };
}
$('#drawGps').onclick = async () => { if (!drawing) return; try { const p = await getPos(); addDrawPt(L.latLng(p.lat, p.lng)); map.panTo([p.lat, p.lng]); toast(`Punto P${drawing.pts.length} en tu posición (±${Math.round(p.acc || 0)} m)`); } catch (e) { toast(geoErr(e), 6000); } };
$('#drawUndo').onclick = () => { if (!drawing || !drawing.pts.length) return; drawing.pts.pop(); drawing.line.setLatLngs(drawing.pts); const ds = drawing.dots.getLayers(); if (ds.length) drawing.dots.removeLayer(ds[ds.length - 1]); updateDrawBar(); };
$('#drawEnd').onclick = () => endDrawing(true);
$('#drawCancel').onclick = () => endDrawing(false);

/* ---------------- Distancia por carretera (OSRM sobre OpenStreetMap) ---------------- */
const routeLayer = L.layerGroup().addTo(map);
async function roadRoute(a, b) {
  const q = `${a.lng.toFixed(6)},${a.lat.toFixed(6)};${b.lng.toFixed(6)},${b.lat.toFixed(6)}?overview=full&geometries=geojson`;
  for (const [base, src] of [['https://routing.openstreetmap.de/routed-car/route/v1/driving/', 'OpenStreetMap (OSRM · FOSSGIS)'], ['https://router.project-osrm.org/route/v1/driving/', 'OpenStreetMap (OSRM)']]) {
    try { const j = JSON.parse(await httpGetText(base + q)); if (j.code === 'Ok' && j.routes && j.routes[0]) { const r = j.routes[0]; return { dist: r.distance, dur: r.duration, coords: r.geometry.coordinates.map(c => [c[1], c[0]]), src }; } } catch (e) { /* siguiente servidor */ }
  }
  throw new Error('El servicio de rutas no responde');
}
const fmtDur = s => s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round(s % 3600 / 60)} min` : `${Math.max(1, Math.round(s / 60))} min`;
function drawRoute(r, a, b) {
  routeLayer.clearLayers();
  L.polyline(r.coords, { renderer: hlRenderer, color: '#1c7ed6', weight: 6, opacity: 0.85, interactive: false }).addTo(routeLayer);
  [[a, 'A'], [b, 'B']].forEach(([p, t]) => L.circleMarker([p.lat, p.lng], { renderer: hlRenderer, radius: 8, color: '#fff', weight: 3, fillColor: '#1c7ed6', fillOpacity: 1, interactive: false }).bindTooltip(t, { permanent: true, direction: 'top', offset: [0, -8] }).addTo(routeLayer));
}
function obraCenter() {
  const pts = []; layers.forEach(e => { if (e.group) { const bb = e.group.getBounds(); if (bb.isValid()) pts.push(bb.getCenter()); } });
  return pts.length ? L.latLngBounds(pts).getCenter() : null;
}
function refPoint() {
  if (lastPos && Date.now() - lastPos.t < 120000) return { lat: lastPos.lat, lng: lastPos.lng, label: 'tu posición' };
  const c = obraCenter(); if (c) return { lat: c.lat, lng: c.lng, label: 'el centro de la obra' };
  const m = map.getCenter(); return { lat: m.lat, lng: m.lng, label: 'el centro del mapa' };
}

/* ---------------- Calculadora ---------------- */
let calcPick = null; const calcState = { a: null, b: null, s1: null, s2: null };
function calcSheet(focus) {
  const st = calcState, P = p => p ? `${esc(p.label || fmtLL(p.lat, p.lng))}` : '—';
  const b = openSheet(`<h2>${ICON.calc} Calculadora</h2><p class="sub">Distancias, áreas, pendientes y coordenadas</p>
    <div class="ccard"><h3>Medir en el mapa</h3><div class="row"><button class="mini" data-c="dist">${ICON.ruler}Distancia</button><button class="mini" data-c="area">Área y perímetro</button></div></div>
    <div class="ccard ${focus === 'route' ? 'hl' : ''}"><h3>Distancia por carretera</h3>
      <div class="cpair"><span>A · ${P(st.a)}</span><div class="row"><button class="mini" data-c="aMe">Mi posición</button><button class="mini" data-c="aObra">Centro de la obra</button><button class="mini" data-c="aMap">Tocar mapa</button></div></div>
      <div class="cpair"><span>B · ${P(st.b)}</span><div class="row"><button class="mini" data-c="bMap">Tocar mapa</button><button class="mini" data-c="bRes">Un recurso</button></div></div>
      <div class="row"><button class="mini pri" data-c="route">Calcular ruta</button>${st.a && st.b ? `<a class="mini" href="https://www.google.com/maps/dir/?api=1&origin=${st.a.lat.toFixed(6)},${st.a.lng.toFixed(6)}&destination=${st.b.lat.toFixed(6)},${st.b.lng.toFixed(6)}&travelmode=driving" target="_blank" rel="noopener">Ver en Google Maps</a>` : ''}</div>
      <div id="cRoute"></div></div>
    <div class="ccard"><h3>Pendiente entre dos puntos</h3><p class="hint">Toca dos puntos del mapa; la cota se toma del MDT05 del IGN.</p>
      <div class="row"><button class="mini" data-c="slope2">Elegir los dos puntos</button></div><div id="cSlope"></div></div>
    <div class="ccard"><h3>Conversor de pendientes</h3>
      <div class="pkrow"><div class="field"><label for="cvDz">Desnivel (m)</label><input id="cvDz" inputmode="decimal" type="text"></div><div class="field"><label for="cvL">Longitud en planta (m)</label><input id="cvL" inputmode="decimal" type="text"></div></div>
      <div class="pkrow"><div class="field"><label for="cvP">Pendiente (%)</label><input id="cvP" inputmode="decimal" type="text"></div><div class="field"><label for="cvT">Talud H:V (1 vertical)</label><input id="cvT" inputmode="decimal" type="text" placeholder="p. ej. 1,5"></div></div>
      <p class="cout" id="cvOut">Escribe desnivel y longitud, una pendiente o un talud.</p></div>
    <div class="ccard"><h3>Coordenadas</h3>
      <div class="field"><input id="coIn" type="text" placeholder="37.6123, -2.9154 · o UTM: 30 507302 4162826"></div>
      <div class="row"><button class="mini" data-c="coGo">Convertir y ver en el mapa</button></div><p class="cout" id="coOut"></p></div>`);
  const pick = (mode, text) => { calcPick = mode; closeSheet(); $('#pickText').textContent = text; $('#pickBar').hidden = false; };
  const on = (k, fn) => { const el = b.querySelector(`[data-c=${k}]`); if (el) el.onclick = fn; };
  on('dist', () => { closeSheet(); startMeasure(); });
  on('area', () => { closeSheet(); startMeasure(null, true); toast('Toca los vértices del contorno. El área se cierra sola.', 4000); });
  on('aMe', async () => { try { const p = await getPos(); st.a = { lat: p.lat, lng: p.lng, label: 'tu posición' }; calcSheet('route'); } catch (e) { toast(geoErr(e), 6000); } });
  on('aObra', () => { const c = obraCenter(); if (!c) { toast('La obra activa no tiene capas.'); return; } st.a = { lat: c.lat, lng: c.lng, label: 'centro de la obra' }; calcSheet('route'); });
  on('aMap', () => pick('routeA', 'Toca el punto de salida (A)'));
  on('bMap', () => pick('routeB', 'Toca el punto de llegada (B)'));
  on('bRes', () => resourceList({ pickFor: 'routeB' }));
  on('route', async () => {
    if (!st.a || !st.b) { toast('Elige los puntos A y B.'); return; }
    $('#cRoute').innerHTML = '<p class="hint">Calculando la ruta…</p>';
    try {
      const r = await roadRoute(st.a, st.b); drawRoute(r, st.a, st.b);
      const straight = L.latLng(st.a).distanceTo(st.b);
      $('#cRoute').innerHTML = `<div class="slope-main"><span>${fmtLen(r.dist)}</span><small>por carretera · ${fmtDur(r.dur)} en coche · en línea recta ${fmtLen(straight)}</small></div><p class="hint">Red viaria: ${r.src}. Tiempo orientativo.</p>`;
      map.fitBounds(L.latLngBounds(r.coords).pad(0.15));
    } catch (e) { $('#cRoute').innerHTML = `<p class="hint">${esc(e.message)}. Usa «Ver en Google Maps».</p>`; }
  });
  on('slope2', () => { st.s1 = st.s2 = null; pick('slope2', 'Toca el primer punto'); });
  if (st.s1 && st.s2) calcSlope2();
  const cv = () => {
    const dz = parseNum($('#cvDz').value), Lp = parseNum($('#cvL').value), pc = parseNum($('#cvP').value), ta = parseNum($('#cvT').value);
    let p = NaN; if (isFinite(dz) && Lp > 0) p = dz / Lp * 100; else if (isFinite(pc)) p = pc; else if (ta > 0) p = 100 / ta;
    if (!isFinite(p)) { $('#cvOut').textContent = 'Escribe desnivel y longitud, una pendiente o un talud.'; return; }
    const deg = Math.atan(p / 100) * 180 / Math.PI, n = v => v.toFixed(2).replace('.', ',');
    $('#cvOut').innerHTML = `<b>${n(p)} %</b> · ${n(p * 10)} ‰ · ${n(deg)}° · talud ${p ? n(100 / Math.abs(p)) : '∞'}H:1V${isFinite(dz) && Lp > 0 ? ` · longitud real ${n(Math.hypot(dz, Lp))} m` : ''}`;
  };
  ['cvDz', 'cvL', 'cvP', 'cvT'].forEach(id => $('#' + id).oninput = cv);
  on('coGo', () => {
    const t = $('#coIn').value.trim(); let ll = null;
    const u = /^(2[7-9]|3[01])\D+(\d{6}(?:[.,]\d+)?)\D+(\d{7}(?:[.,]\d+)?)$/.exec(t);
    if (u) ll = fromUTM(+u[1], parseNum(u[2]), parseNum(u[3]));
    else { const p = parseWatermark(t); if (p.lat != null) ll = { lat: p.lat, lng: p.lng }; else { const m = /^\s*(-?\d{1,2}[.,]\d+)\s*[,; ]\s*(-?\d{1,3}[.,]\d+)\s*$/.exec(t); if (m) ll = { lat: parseNum(m[1]), lng: parseNum(m[2]) }; } }
    if (!ll) { $('#coOut').textContent = 'No entiendo esas coordenadas. Ejemplos: 37.6123, -2.9154 · 37°36\'44"N 2°54\'55"W · 30 507302 4162826'; return; }
    $('#coOut').innerHTML = `${fmtLL(ll.lat, ll.lng)}<br>${fmtUTM(ll.lat, ll.lng)}<br><a href="${navUrl(ll.lat, ll.lng)}" target="_blank" rel="noopener">Llévame aquí</a>`;
    map.setView([ll.lat, ll.lng], 17); routeLayer.clearLayers();
    L.circleMarker([ll.lat, ll.lng], { renderer: hlRenderer, radius: 9, color: '#fff', weight: 3, fillColor: '#e8590c', fillOpacity: 1, interactive: false }).addTo(routeLayer);
  });
}
function calcPickPoint(ll) {
  const mode = calcPick; calcPick = null; $('#pickBar').hidden = true;
  const p = { lat: ll.lat, lng: ll.lng, label: fmtLL(ll.lat, ll.lng) };
  if (mode === 'routeA') { calcState.a = p; return calcSheet('route'); }
  if (mode === 'routeB') { calcState.b = p; return calcSheet('route'); }
  if (mode === 'slope2') {
    if (!calcState.s1) { calcState.s1 = p; L.circleMarker(ll, { renderer: hlRenderer, radius: 7, color: '#fff', weight: 3, fillColor: '#ff6b00', fillOpacity: 1, interactive: false }).addTo(routeLayer); calcPick = 'slope2'; $('#pickText').textContent = 'Toca el segundo punto'; $('#pickBar').hidden = false; return; }
    calcState.s2 = p; return calcSheet();
  }
}
async function calcSlope2() {
  const box = $('#cSlope'), a = calcState.s1, b = calcState.s2; if (!box) return;
  routeLayer.clearLayers(); L.polyline([a, b], { renderer: hlRenderer, color: '#ff6b00', weight: 4, dashArray: '6 5', interactive: false }).addTo(routeLayer);
  box.innerHTML = '<p class="hint">Consultando cotas…</p>';
  let z, src = 'MDT05 del IGN';
  try { z = await demIGN([a, b]); } catch (e) { try { z = await demGlobal([a, b]); src = 'modelo global de 90 m (orientativo)'; } catch (e2) { box.innerHTML = '<p class="hint">No se pudieron obtener las cotas. Comprueba la conexión.</p>'; return; } }
  const d = L.latLng(a).distanceTo(b), dz = z[1] - z[0], p = dz / d * 100;
  box.innerHTML = `<div class="slope-main"><span>${fmtPct(p)}</span><small>${(Math.atan(p / 100) * 180 / Math.PI).toFixed(2).replace('.', ',')}° · desnivel ${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))} en ${fmtLen(d)}</small></div><p class="hint">Cota A ${fmtZ(z[0])} · cota B ${fmtZ(z[1])} · ${src}</p>`;
}

/* ---------------- Recursos: plantas de RCD, hormigón, canteras, aglomerado… (comunes a todas las obras) ---------------- */
const RES_TYPES = [['Planta de RCD', '#6d4c41', 'R'], ['Planta de hormigón', '#607d8b', 'H'], ['Cantera de zahorras y áridos', '#b08d3c', 'Z'], ['Cantera de escollera', '#795548', 'E'],
  ['Planta de aglomerado', '#263238', 'A'], ['Vertedero o gestor de tierras', '#8d6e63', 'V'], ['Préstamo de tierras', '#a1887f', 'P'], ['Almacén o suministros', '#1565c0', 'S'], ['Otro', '#455a64', 'O']];
const resources = new Map(), resMarkers = new Map(), resLayer = L.layerGroup();
const RES_KEYS = [[/rcd|reciclaj|residu/i, 0], [/hormig/i, 1], [/zahorr|[áa]rido|grava/i, 2], [/escoller|piedra|cantera/i, 3], [/aglomer|asfalt|mbc/i, 4], [/vertedero|gestor|tierras/i, 5], [/pr[ée]stamo/i, 6], [/almac|suminist/i, 7]];
function resTypeFromText(v) { v = String(v || '').trim(); const ex = RES_TYPES.find(x => x[0].toLowerCase() === v.toLowerCase()); if (ex) return ex[0]; const k = RES_KEYS.find(([re]) => re.test(v)); return RES_TYPES[k ? k[1] : RES_TYPES.length - 1][0]; }
const resType = t => RES_TYPES.find(x => x[0] === t) || RES_TYPES[RES_TYPES.length - 1];
const resIcon = t => { const [, c, l] = resType(t); return L.divIcon({ className: '', html: `<div class="resmk" style="--c:${c}"><span>${l}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 13] }); };
function drawResource(r) {
  let m = resMarkers.get(r.id);
  if (!m) { m = L.marker([r.lat, r.lng], { icon: resIcon(r.type) }).addTo(resLayer); m.on('click', e => { L.DomEvent.stop(e); viewResource(r.id); }); resMarkers.set(r.id, m); }
  else m.setLatLng([r.lat, r.lng]).setIcon(resIcon(r.type));
}
async function loadResources() {
  for (const r of await DB.all('resources')) { resources.set(r.id, r); drawResource(r); }
  if (settings.resVisible !== false) resLayer.addTo(map);
}
let resDraft = null, resMarkerDraft = null;
function resourceEditor(o) {
  resDraft = o.id ? { ...o } : { id: uid(), type: RES_TYPES[0][0], name: '', company: '', phone: '', address: '', materials: '', notes: '', lat: o.lat, lng: o.lng, created: Date.now() };
  const d = resDraft;
  const b = openSheet(`<h2>${resources.has(d.id) ? 'Editar recurso' : 'Nuevo recurso'}</h2><p class="sub">${fmtLL(d.lat, d.lng)} · arrastra el marcador para corregir</p>
    <div class="field"><label for="rType">Tipo</label><select id="rType">${RES_TYPES.map(([t]) => `<option ${t === d.type ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
    <div class="field"><input type="text" id="rName" placeholder="Nombre (p. ej. Planta RCD Baza)" value="${esc(d.name)}"></div>
    <div class="field"><input type="text" id="rComp" placeholder="Empresa" value="${esc(d.company)}"></div>
    <div class="pkrow"><div class="field"><input type="tel" id="rPhone" placeholder="Teléfono" value="${esc(d.phone)}"></div><div class="field"><input type="text" id="rAddr" placeholder="Dirección o paraje" value="${esc(d.address)}"></div></div>
    <div class="field"><input type="text" id="rMat" placeholder="Materiales, precios, horario…" value="${esc(d.materials)}"></div>
    <div class="field"><textarea id="rNotes" rows="2" placeholder="Observaciones">${esc(d.notes)}</textarea></div>
    <div class="row"><button class="mini" data-a="gps">Usar mi posición</button></div>
    <div class="acts"><button class="btn pri full" data-a="save">Guardar recurso</button>${resources.has(d.id) ? '<button class="btn del full" data-a="del">Eliminar recurso</button>' : ''}</div>`);
  resMarkerDraft = L.marker([d.lat, d.lng], { draggable: true, icon: resIcon(d.type), zIndexOffset: 2000 }).addTo(map);
  resMarkerDraft.on('dragend', () => { const ll = resMarkerDraft.getLatLng(); d.lat = ll.lat; d.lng = ll.lng; b.querySelector('.sub').textContent = fmtLL(d.lat, d.lng) + ' · arrastra el marcador para corregir'; });
  onSheetClose(() => { if (resMarkerDraft) { map.removeLayer(resMarkerDraft); resMarkerDraft = null; } });
  $('#rType').onchange = () => resMarkerDraft.setIcon(resIcon($('#rType').value));
  b.querySelector('[data-a=gps]').onclick = async () => { try { const p = await getPos(); d.lat = p.lat; d.lng = p.lng; resMarkerDraft.setLatLng([p.lat, p.lng]); map.panTo([p.lat, p.lng]); } catch (e) { toast(geoErr(e), 6000); } };
  b.querySelector('[data-a=save]').onclick = async () => {
    Object.assign(d, { type: $('#rType').value, name: $('#rName').value.trim() || $('#rType').value, company: $('#rComp').value.trim(), phone: $('#rPhone').value.trim(), address: $('#rAddr').value.trim(), materials: $('#rMat').value.trim(), notes: $('#rNotes').value.trim(), updated: Date.now() });
    await DB.put('resources', d); resources.set(d.id, d); drawResource(d);
    if (!layerVisible('res')) setLayerVisible('res', true);
    closeSheet(); toast(`Recurso «${d.name}» guardado`);
  };
  const del = b.querySelector('[data-a=del]');
  if (del) del.onclick = async () => { if (!confirm(`¿Eliminar «${d.name}»?`)) return; await DB.del('resources', d.id); resources.delete(d.id); const m = resMarkers.get(d.id); if (m) { resLayer.removeLayer(m); resMarkers.delete(d.id); } closeSheet(); toast('Recurso eliminado'); };
}
function viewResource(id) {
  const r = resources.get(id); if (!r) return;
  const [, col] = resType(r.type), ref = refPoint();
  const b = openSheet(`<h2><span class="dot" style="background:${col}"></span>${esc(r.name)}</h2><p class="sub">${esc(r.type)}${r.company ? ' · ' + esc(r.company) : ''}</p>
    <table class="attrs">${[['Teléfono', r.phone ? `<a href="tel:${esc(r.phone.replace(/\s/g, ''))}">${esc(r.phone)}</a>` : ''], ['Dirección', esc(r.address)], ['Materiales', esc(r.materials)], ['Observaciones', esc(r.notes)], ['Coordenadas', fmtLL(r.lat, r.lng) + '<br>' + fmtUTM(r.lat, r.lng)], ['En línea recta', `${fmtLen(L.latLng(ref).distanceTo([r.lat, r.lng]))} desde ${ref.label}`]].filter(x => x[1]).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
    <div id="rRoute"></div>
    <div class="acts">${goBtn(r.lat, r.lng, 'Llévame aquí', 'full')}
      <button class="btn" data-a="road">${ICON.road}Distancia por carretera</button><button class="btn" data-a="edit">Editar</button></div>`);
  b.querySelector('[data-a=edit]').onclick = () => resourceEditor(r);
  b.querySelector('[data-a=road]').onclick = async () => {
    const box = $('#rRoute'); box.innerHTML = '<p class="hint">Calculando la ruta…</p>';
    try { const rt = await roadRoute(ref, r); drawRoute(rt, ref, r); r.lastRoad = { dist: rt.dist, from: ref.label, t: Date.now() };
      box.innerHTML = `<div class="slope-main"><span>${fmtLen(rt.dist)}</span><small>por carretera desde ${esc(ref.label)} · ${fmtDur(rt.dur)}</small></div>`;
      map.fitBounds(L.latLngBounds(rt.coords).pad(0.15)); }
    catch (e) { box.innerHTML = `<p class="hint">${esc(e.message)}.</p>`; }
  };
}
function resourceList(opt = {}) {
  const ref = refPoint(), filt = settings.resFilter || '';
  const list = [...resources.values()].filter(r => !filt || r.type === filt).map(r => ({ r, d: L.latLng(ref).distanceTo([r.lat, r.lng]) })).sort((a, b) => a.d - b.d);
  const b = openSheet(`<h2>${ICON.pin} Recursos</h2><p class="sub">Comunes a todas las obras · distancias desde ${esc(ref.label)}</p>
    <div class="chips"><button class="chip ${!filt ? 'on' : ''}" data-rf="" style="--c:var(--accent)" type="button">Todos (${resources.size})</button>${RES_TYPES.map(([t, c]) => { const n = [...resources.values()].filter(r => r.type === t).length; return n ? `<button class="chip ${filt === t ? 'on' : ''}" data-rf="${esc(t)}" style="--c:${c}" type="button">${esc(t)} (${n})</button>` : ''; }).join('')}</div>
    ${list.length ? `<div class="wmlist">${list.map(({ r, d }) => `<div class="nrow" data-r="${r.id}"><span class="dot" style="background:${resType(r.type)[1]}"></span><span class="t"><b>${esc(r.name)}</b><small>${esc(r.type)} · ${fmtLen(d)} en línea recta${r._road ? ` · <b>${fmtLen(r._road)} por carretera</b>` : ''}</small></span></div>`).join('')}</div>`
      : '<p class="empty">No hay recursos todavía. Mantén pulsado en el mapa y elige «Añadir recurso aquí», o importa un CSV.</p>'}
    <div class="acts">
      ${opt.pickFor ? '' : '<button class="btn pri" data-a="new">Nuevo en el centro del mapa</button>'}
      ${list.length ? `<button class="btn" data-a="road">${ICON.road}Por carretera (10 más cercanos)</button>` : ''}
      <button class="btn" data-a="imp">Importar CSV</button><button class="btn" data-a="exp" ${resources.size ? '' : 'disabled'}>Exportar CSV</button>
    </div>
    <p class="hint">CSV con columnas: tipo; nombre; empresa; telefono; direccion; materiales; notas; lat; lon. La distancia por carretera usa la red de OpenStreetMap.</p>
    <input type="file" id="inRes" accept=".csv,text/csv,text/plain" hidden>`);
  b.querySelectorAll('[data-rf]').forEach(c => c.onclick = () => { settings.resFilter = c.dataset.rf; saveSettings(); resourceList(opt); });
  b.querySelectorAll('[data-r]').forEach(row => row.onclick = () => {
    const r = resources.get(row.dataset.r);
    if (opt.pickFor === 'routeB') { calcState.b = { lat: r.lat, lng: r.lng, label: r.name }; return calcSheet('route'); }
    map.setView([r.lat, r.lng], Math.max(map.getZoom(), 14)); viewResource(r.id);
  });
  const nb = b.querySelector('[data-a=new]'); if (nb) nb.onclick = () => { const c = map.getCenter(); resourceEditor({ lat: c.lat, lng: c.lng }); };
  const rb = b.querySelector('[data-a=road]');
  if (rb) rb.onclick = async () => {
    const top = list.slice(0, 10); rb.disabled = true;
    for (let i = 0; i < top.length; i++) {
      rb.textContent = `Calculando ${i + 1} de ${top.length}…`;
      try { const rt = await roadRoute(ref, top[i].r); top[i].r._road = rt.dist; } catch (e) { /* sigue */ }
      await new Promise(res => setTimeout(res, 1100)); // el servidor público admite 1 consulta por segundo
    }
    list.sort((a, b2) => (a.r._road ?? 1e12) - (b2.r._road ?? 1e12));
    [...resources.values()].forEach(r => { if (!top.some(t => t.r === r)) delete r._road; });
    resourceList(opt);
  };
  b.querySelector('[data-a=imp]').onclick = () => $('#inRes').click();
  $('#inRes').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    const rows = parseCSV(await f.text()); if (rows.length < 2) { toast('El CSV está vacío.'); return; }
    const h = rows[0].map(x => x.trim().toLowerCase()), col = k => h.findIndex(x => x.startsWith(k));
    const ci = { tipo: col('tipo'), nombre: col('nombre'), empresa: col('empresa'), tel: col('tel'), dir: col('direc'), mat: col('mater'), notas: col('nota'), lat: col('lat'), lon: [col('lon'), col('lng')].find(i => i >= 0) ?? -1 };
    if (ci.lat < 0 || ci.lon < 0) { toast('El CSV necesita columnas «lat» y «lon».', 6000); return; }
    let n = 0;
    for (const r of rows.slice(1)) {
      const lat = parseNum(r[ci.lat]), lng = parseNum(r[ci.lon]); if (!isFinite(lat) || !isFinite(lng)) continue;
      const t = ci.tipo >= 0 ? resTypeFromText(r[ci.tipo]) : 'Otro';
      const g = i => (i >= 0 ? (r[i] || '').trim() : '');
      const rec = { id: uid(), type: t, name: g(ci.nombre) || t, company: g(ci.empresa), phone: g(ci.tel), address: g(ci.dir), materials: g(ci.mat), notes: g(ci.notas), lat, lng, created: Date.now() };
      await DB.put('resources', rec); resources.set(rec.id, rec); drawResource(rec); n++;
    }
    if (!layerVisible('res')) setLayerVisible('res', true);
    toast(`${n} recursos importados.`); resourceList(opt);
  };
  b.querySelector('[data-a=exp]').onclick = async () => {
    const q = csvQ, n = v => String(v).replace('.', ',');
    const rows = [['tipo', 'nombre', 'empresa', 'telefono', 'direccion', 'materiales', 'notas', 'lat', 'lon']].concat([...resources.values()].map(r => [r.type, r.name, r.company, r.phone, r.address, r.materials, r.notes, n(r.lat.toFixed(6)), n(r.lng.toFixed(6))]));
    try { await saveBlob(new Blob(['\ufeff' + rows.map(r => r.map(q).join(';')).join('\r\n')], { type: 'text/csv' }), 'recursos_OBRA-GIS.csv'); } catch (e) { /* cancelado */ }
  };
}

/* ---------------- Informe de afecciones ----------------
   Recorre las trazas que elige el usuario, consulta en cada punto las capas de servicios marcadas (GetFeatureInfo)
   con una banda de búsqueda a cada lado del eje y agrupa los resultados por elemento y tramo de PK. */
const AFEC_ORG = [
  [/el[ée]ctric|subestaci|transformador/i, 'Compañía eléctrica titular (distribuidora o Red Eléctrica)'],
  [/gas(oducto)?\b|gasoducto|planta de gas/i, 'Titular de la red de gas'],
  [/oleoducto/i, 'Exolum (antes CLH), titular del oleoducto'],
  [/carretera|autov|autopista|v[ií]a de gran/i, 'Titular de la carretera (Ministerio, Junta de Andalucía o Diputación)'],
  [/ferrocarril|ferroviari|tren/i, 'Adif'],
  [/pecuari/i, 'Delegación Territorial de Medio Ambiente (Junta de Andalucía): ocupación o cruce de vía pecuaria'],
  [/dph|cauce|inundab|flujo preferente|r[ií]o|hidrogr|policía/i, 'Organismo de cuenca (CH Guadalquivir, CH Segura o Junta en cuencas mediterráneas): autorización en DPH o zona de policía'],
  [/conducci|canal|abastec|saneam|depuradora|embalse/i, 'Titular de la infraestructura hidráulica (ayuntamiento, comunidad de regantes o ente gestor)'],
  [/natura|zec|zepa|lic\b|espacio|natural protegid|humedal|monte|forestal|h[áa]bitat/i, 'Delegación Territorial de Medio Ambiente (Junta de Andalucía)'],
  [/patrimonio|bien(es)? protegid|bic\b|arqueol/i, 'Delegación Territorial de Cultura y Patrimonio Histórico'],
  [/catastro|parcela|sigpac|recinto/i, 'Titulares de las parcelas (relación de bienes y derechos afectados)'],
];
const afecOrg = name => (AFEC_ORG.find(([re]) => re.test(name)) || [null, 'Revisar el organismo competente'])[1];
const NAME_KEYS = /^(nombre|name|denominaci|toponim|matricula|c[oó]digo|codigo|refcat|referencia|cod_|id_vp|via|carretera|titular|descrip|tipo)/i;
function afecTitle(attrs) {
  const a = attrs.find(([k, v]) => NAME_KEYS.test(k) && String(v).trim()) || attrs.find(([, v]) => String(v).trim());
  return a ? String(a[1]).trim().slice(0, 90) : 'Elemento';
}
// GetFeatureInfo con tolerancia fija en metros: imagen de 9×9 píxeles de r/3 m (3 px de tolerancia del servidor ≈ r)
function featureInfoUrlR(rec, ll, fmt, r) {
  const p = L.CRS.EPSG3857.project(L.latLng(ll)), k = 1 / Math.cos(ll.lat * Math.PI / 180), half = 1.5 * Math.max(3, r) * k;
  const bbox = [p.x - half, p.y - half, p.x + half, p.y + half].map(v => v.toFixed(2)).join(','), lay = encodeURIComponent(rec.layers);
  return `${rec.url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${lay}&QUERY_LAYERS=${lay}&STYLES=&SRS=EPSG:3857&BBOX=${bbox}`
    + `&WIDTH=9&HEIGHT=9&X=4&Y=4&FEATURE_COUNT=10&FORMAT=image/png&INFO_FORMAT=${encodeURIComponent(fmt)}&BUFFER=3`;
}
// Elementos de una capa KML como «trazas» medibles por PK (las superficies se recorren por su contorno)
function afecTargets(e) {
  const out = [];
  e.feats.forEach((f, i) => {
    if (f.type === 'ln') out.push({ f, i, kind: 'línea', len: f.length });
    else if (f.type === 'pg') { const ring = f.parts.find(p => p.t === 'pg').c; const c = ring.concat([ring[0]]); const pf = { name: f.name, parts: [{ t: 'ln', c }], type: 'ln' }; pf.length = lineLength(c); out.push({ f: pf, i, kind: 'superficie (contorno)', len: pf.length, name: f.name }); }
    else out.push({ f, i, kind: 'punto', len: 0, pt: f.start });
  });
  return out;
}
const afecQueryable = () => [...layers.values()].filter(e => typeOf(e.rec) === 'wms' && e.rec.kind === 'wms' && e.rec.info);
let afecJob = null;
function afecSheet(preIds) {
  const kmls = [...layers.values()].filter(e => typeOf(e.rec) === 'kml' && e.feats && e.feats.length);
  const pre = new Set(preIds && preIds.length ? preIds : kmls.filter(e => e.rec.visible).map(e => e.rec.id));
  const svcs = afecQueryable();
  const st = settings.afec || { step: 25, band: 10 };
  const b = openSheet(`<h2>Informe de afecciones</h2><p class="sub">Recorre las trazas elegidas y consulta las capas de servicios marcadas</p>
    <h3 class="sh">Trazas y elementos a revisar</h3>
    ${kmls.length ? `<div class="chklist">${kmls.map(e => `<label class="opt"><input type="checkbox" data-ak="${e.rec.id}" ${pre.has(e.rec.id) ? 'checked' : ''}>${esc(e.rec.name)} <small>${e.feats.length} elem.</small></label>`).join('')}</div>` : '<p class="empty">La obra no tiene capas KML.</p>'}
    <h3 class="sh">Capas de afecciones a consultar</h3>
    ${svcs.length ? `<div class="chklist">${svcs.map(e => `<label class="opt"><input type="checkbox" data-as="${e.rec.id}" ${e.rec.visible ? 'checked' : ''}>${esc(e.rec.name)}</label>`).join('')}</div>`
      : '<p class="empty">No hay capas de servicios consultables en la obra.</p>'}
    <div class="row"><button class="mini" data-a="kit">${ICON.layers}Añadir kit de afecciones</button>${svcs.length ? '<button class="mini" data-a="all">Marcar todas</button>' : ''}</div>
    <div class="pkrow"><div class="field"><label for="afStep">Consultar cada</label><select id="afStep">${[10, 25, 50, 100].map(v => `<option value="${v}" ${v === st.step ? 'selected' : ''}>${v} m</option>`).join('')}</select></div>
      <div class="field"><label for="afBand">Banda a cada lado del eje</label><select id="afBand">${[[3, 'Solo el eje (±3 m)'], [5, '±5 m'], [10, '±10 m'], [25, '±25 m'], [50, '±50 m'], [100, '±100 m']].map(([v, t]) => `<option value="${v}" ${v === st.band ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
    <p class="hint" id="afEst"></p>
    <div class="acts"><button class="btn pri full" data-a="go">Generar informe</button>${afecLast() ? '<button class="btn full" data-a="last">Ver el último informe de esta obra</button>' : ''}</div>`);
  const chosen = () => ({ ks: [...b.querySelectorAll('[data-ak]:checked')].map(x => layers.get(x.dataset.ak)), ss: [...b.querySelectorAll('[data-as]:checked')].map(x => layers.get(x.dataset.as)), step: +$('#afStep').value, band: +$('#afBand').value });
  const est = () => {
    const c = chosen(); let n = 0;
    c.ks.forEach(e => afecTargets(e).forEach(t => { n += t.pt ? 1 : Math.ceil(t.len / c.step) + 1; }));
    const q = n * c.ss.length, sec = q / 5;
    const eff = Math.max(c.band, c.step / 2);
    $('#afEst').textContent = !c.ks.length || !c.ss.length ? 'Marca al menos una traza y una capa.' : `${eff > c.band ? `Banda efectiva ±${eff} m (mitad de la distancia entre consultas). ` : ''}${n} puntos × ${c.ss.length} capas = ${q} consultas · unos ${sec < 60 ? Math.max(5, Math.round(sec)) + ' s' : Math.round(sec / 60) + ' min'} con buena cobertura.${q > 6000 ? ' Es mucho: sube la distancia entre consultas o elige menos capas.' : ''}`;
  };
  b.querySelectorAll('input,select').forEach(x => x.onchange = est); est();
  b.querySelector('[data-a=kit]').onclick = () => addServices(CATALOG.filter(c => AFECCIONES_KIT.includes(c.name)), 'kit de afecciones').then(() => afecSheet([...b.querySelectorAll('[data-ak]:checked')].map(x => x.dataset.ak)));
  const all = b.querySelector('[data-a=all]'); if (all) all.onclick = () => { b.querySelectorAll('[data-as]').forEach(x => x.checked = true); est(); };
  const last = b.querySelector('[data-a=last]'); if (last) last.onclick = () => afecResults(afecLast());
  b.querySelector('[data-a=go]').onclick = () => {
    const c = chosen(); if (!c.ks.length || !c.ss.length) { toast('Marca al menos una traza y una capa de afecciones.'); return; }
    settings.afec = { step: c.step, band: c.band }; saveSettings();
    runAfecReport(c);
  };
}
const afecLastCache = {};
const afecLast = () => afecLastCache[settings.activeObra] || null;
async function loadAfecLast() { try { const r = await DB.get('kv', 'afec:' + settings.activeObra); if (r) afecLastCache[settings.activeObra] = r; } catch (e) { /* nada */ } }
async function runAfecReport(c) {
  // 1) puntos de muestreo por elemento
  const samples = [];
  c.ks.forEach(e => afecTargets(e).forEach(t => {
    if (t.pt) { samples.push({ e, t, d: 0, ll: { lat: t.pt[0], lng: t.pt[1] } }); return; }
    for (let d = 0; d < t.len; d += c.step) samples.push({ e, t, d, ll: pointAtPK(t.f, d) });
    samples.push({ e, t, d: t.len, ll: pointAtPK(t.f, t.len) });
  }));
  // radio de búsqueda: la banda pedida, y nunca menos de media distancia entre consultas (para no dejar huecos en los cruces)
  c.radius = Math.max(c.band, c.step / 2);
  const jobs = []; samples.forEach(s => c.ss.forEach(svc => jobs.push({ s, svc })));
  const job = afecJob = { stop: false, done: 0, total: jobs.length, fails: new Map(), dead: new Set() };
  const b = openSheet(`<h2>Informe de afecciones</h2><p class="sub">${c.ks.length} capa(s) · ${c.ss.length} capas de afecciones · cada ${c.step} m · banda ±${c.band} m</p>
    <div class="progress" id="afProg"><div></div><span>0 %</span></div><p class="hint" id="afMsg">Consultando los servicios…</p>
    <div class="acts"><button class="btn full" data-a="stop">Parar y ver lo obtenido</button></div>`);
  b.querySelector('[data-a=stop]').onclick = () => { job.stop = true; };
  onSheetClose(() => { job.stop = true; });
  const hits = []; const cache = new Map();
  const upd = () => { const p = Math.round(job.done / job.total * 100), el = $('#afProg'); if (!el) return; el.firstElementChild.style.width = p + '%'; el.lastElementChild.textContent = `${p} % · ${job.done} de ${job.total}`; };
  let qi = 0;
  const worker = async () => {
    while (qi < jobs.length && !job.stop) {
      const { s, svc } = jobs[qi++], r = svc.rec;
      if (job.dead.has(r.id)) { job.done++; continue; }
      const fmt = r.info === 'json' ? 'application/json' : 'text/html', url = featureInfoUrlR(r, s.ll, fmt, c.radius);
      try {
        let feats = cache.get(url); if (!feats) { feats = parseInfo(await httpGetText(url), r.info, r); cache.set(url, feats); }
        job.fails.set(r.id, 0);
        feats.forEach(attrs => { if (attrs.length) hits.push({ s, svc, attrs, key: r.id + '|' + JSON.stringify(attrs.slice(0, 6)) }); });
      } catch (err) {
        const n = (job.fails.get(r.id) || 0) + 1; job.fails.set(r.id, n);
        if (n >= 6) { job.dead.add(r.id); const m = $('#afMsg'); if (m) m.textContent = `«${r.name}» no responde: se omite.`; }
      }
      job.done++; if (job.done % 5 === 0) upd();
    }
  };
  await Promise.all([1, 2, 3, 4].map(worker)); upd();
  // 2) agrupar por elemento afectado y tramo continuo de PK
  const groups = new Map();
  hits.forEach(h => {
    const k = h.s.e.rec.id + '#' + h.s.t.i + '#' + h.key;
    if (!groups.has(k)) groups.set(k, { h, ds: [] });
    groups.get(k).ds.push(h.s.d);
  });
  const rows = [];
  groups.forEach(({ h, ds }) => {
    ds = [...new Set(ds)].sort((a, b2) => a - b2);
    let cur = null;
    ds.forEach(d => { if (cur && d - cur.d1 <= c.step * 1.5 + 0.01) cur.d1 = d; else { cur = { d0: d, d1: d }; rows.push({ cur, h }); } });
  });
  const rep = {
    v: APP_VERSION, date: Date.now(), obra: (obras.get(settings.activeObra) || {}).name || '', step: c.step, band: c.band, radius: c.radius, partial: job.stop && job.done < job.total,
    services: c.ss.map(e => ({ id: e.rec.id, name: e.rec.name, dead: job.dead.has(e.rec.id) })),
    targets: c.ks.flatMap(e => afecTargets(e).map(t => ({ layer: e.rec.name, layerId: e.rec.id, fi: t.i, name: t.name || t.f.name, kind: t.kind, len: t.len }))),
    rows: rows.map(({ cur, h }) => ({ layer: h.s.e.rec.name, layerId: h.s.e.rec.id, fi: h.s.t.i, poly: h.s.t.kind.startsWith('sup'), trace: h.s.t.name || h.s.t.f.name, kind: h.s.t.kind,
      d0: cur.d0, d1: cur.d1, len: cur.d1 - cur.d0, cross: cur.d1 - cur.d0 <= c.step + 0.01 && h.s.t.kind !== 'punto', svc: h.svc.rec.name, el: afecTitle(h.attrs), org: afecOrg(h.svc.rec.name), attrs: h.attrs.slice(0, 10).map(([k, v]) => [k, String(v).slice(0, 120)]) }))
      .sort((a, b2) => a.layer.localeCompare(b2.layer) || a.fi - b2.fi || a.d0 - b2.d0),
  };
  afecLastCache[settings.activeObra] = rep;
  DB.put('kv', rep, 'afec:' + settings.activeObra).catch(() => {});
  afecResults(rep);
}
const afecHL = L.layerGroup().addTo(map);
function afecDrawRows(rep, only) {
  afecHL.clearLayers();
  (only ? [only] : rep.rows).forEach(r => {
    const e = layers.get(r.layerId); if (!e) return; const f = e.feats[r.fi]; if (!f) return;
    const t = afecTargets(e).find(x => x.i === r.fi); if (!t) return;
    if (t.pt) { L.circleMarker(t.pt, { renderer: hlRenderer, radius: 11, color: '#e03131', weight: 4, fill: false, interactive: false }).addTo(afecHL); return; }
    const d0 = r.d1 - r.d0 < 2 ? Math.max(0, r.d0 - 3) : r.d0, d1 = r.d1 - r.d0 < 2 ? Math.min(t.len, r.d1 + 3) : r.d1;
    L.polyline(segmentCoords(t.f, d0, d1), { renderer: hlRenderer, color: '#e03131', weight: 10, opacity: 0.75, interactive: false }).addTo(afecHL);
  });
}
function afecResults(rep) {
  afecDrawRows(rep);
  const byOrg = new Map(); rep.rows.forEach(r => { if (!byOrg.has(r.org)) byOrg.set(r.org, new Set()); byOrg.get(r.org).add(r.svc); });
  const dead = rep.services.filter(s => s.dead);
  const tramo = r => r.kind === 'punto' ? 'en el punto' : r.cross ? `PK ${fmtPK((r.d0 + r.d1) / 2)} (cruce o afección puntual)` : `PK ${fmtPK(r.d0)} – ${fmtPK(r.d1)}`;
  const b = openSheet(`<h2>Informe de afecciones</h2><p class="sub">${esc(rep.obra)} · ${new Date(rep.date).toLocaleString('es-ES')} · cada ${rep.step} m · banda ±${rep.radius || rep.band} m${rep.partial ? ' · <b>incompleto (parado)</b>' : ''}</p>
    ${rep.rows.length ? `<p><b>${rep.rows.length} afecciones</b> en ${new Set(rep.rows.map(r => r.layer + r.fi)).size} de ${rep.targets.length} elemento${rep.targets.length === 1 ? '' : 's'} revisado${rep.targets.length === 1 ? '' : 's'}.</p>
      <h3 class="sh">Organismos a consultar</h3><table class="attrs">${[...byOrg].map(([o, s]) => `<tr><td>${esc(o)}</td><td>${[...s].map(esc).join(', ')}</td></tr>`).join('')}</table>
      <h3 class="sh">Detalle por traza</h3><div class="wmlist">${rep.rows.map((r, i) => `<div class="nrow" data-ar="${i}"><span class="dot" style="background:#e03131"></span><span class="t"><b>${esc(r.svc)}: ${esc(r.el)}</b><small>${esc(r.trace)} · ${tramo(r)}${!r.cross && r.len >= 1 ? ' · ' + fmtLen(r.len) : ''}</small></span></div>`).join('')}</div>`
      : `<p><b>No se han encontrado afecciones</b> en las capas consultadas${dead.length ? ' que respondieron' : ''}.</p>`}
    ${dead.length ? `<p class="hint">Sin respuesta (no revisadas): ${dead.map(s => esc(s.name)).join(', ')}.</p>` : ''}
    <p class="hint">Resultado orientativo a partir de los servicios públicos de cartografía. No sustituye a las consultas oficiales a cada organismo ni al replanteo en campo.</p>
    <div class="acts"><button class="btn pri full" data-a="html">Exportar informe (para imprimir o PDF)</button><button class="btn" data-a="csv">CSV para Excel</button><button class="btn" data-a="kmz">KMZ de tramos afectados</button><button class="btn" data-a="new">Nuevo informe</button></div>`);
  onSheetClose(() => afecHL.clearLayers());
  b.querySelectorAll('[data-ar]').forEach(el => el.onclick = () => {
    const r = rep.rows[+el.dataset.ar]; afecDrawRows(rep, r);
    const g = afecHL.getLayers()[0]; if (g) map.fitBounds(g.getBounds ? g.getBounds().pad(0.6) : L.latLngBounds([g.getLatLng()]).pad(0.01), { maxZoom: 18 });
    toast(`${r.svc}: ${r.el} · ${r.trace} · ${tramo(r)}`, 5000);
  });
  const fname = ext => `afecciones_${safeName(rep.obra)}_${new Date(rep.date).toISOString().slice(0, 10)}.${ext}`;
  b.querySelector('[data-a=html]').onclick = () => saveBlob(new Blob([afecHtml(rep)], { type: 'text/html' }), fname('html')).catch(() => {});
  b.querySelector('[data-a=csv]').onclick = () => saveBlob(new Blob(['﻿' + afecCsv(rep)], { type: 'text/csv' }), fname('csv')).catch(() => {});
  b.querySelector('[data-a=kmz]').onclick = async () => { const z = new JSZip(); z.file('doc.kml', afecKml(rep)); saveBlob(await z.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' }), fname('kmz')).catch(() => {}); };
  b.querySelector('[data-a=new]').onclick = () => afecSheet([...new Set(rep.targets.map(t => t.layerId))]);
}
function afecCsv(rep) {
  const q = csvQ, n = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
  const head = ['capa', 'elemento', 'tipo', 'pk_inicio', 'pk_fin', 'longitud_m', 'afeccion', 'elemento_afectado', 'organismo', 'datos'];
  return [head.map(q).join(';')].concat(rep.rows.map(r => [r.layer, r.trace, r.kind, fmtPK(r.d0), fmtPK(r.d1), n(r.len), r.svc, r.el, r.org, r.attrs.map(([k, v]) => (k ? k + ': ' : '') + v).join(' | ')].map(q).join(';'))).join('\r\n');
}
function afecKml(rep) {
  const pms = rep.rows.map(r => {
    const e = layers.get(r.layerId), t = e && afecTargets(e).find(x => x.i === r.fi); if (!t) return '';
    const desc = `${r.svc}: ${r.el}\n${r.trace} · PK ${fmtPK(r.d0)} – ${fmtPK(r.d1)}\nOrganismo: ${r.org}\n` + r.attrs.map(([k, v]) => (k ? k + ': ' : '') + v).join('\n');
    const geom = t.pt ? `<Point><coordinates>${t.pt[1]},${t.pt[0]},0</coordinates></Point>`
      : `<LineString><tessellate>1</tessellate><coordinates>${segmentCoords(t.f, r.len < 1 ? Math.max(0, r.d0 - 3) : r.d0, r.len < 1 ? Math.min(t.len, r.d1 + 3) : r.d1).map(c => `${c[1]},${c[0]},0`).join(' ')}</coordinates></LineString>`;
    return `<Placemark><name>${xml(r.svc + ' · ' + r.el)}</name><styleUrl>#af</styleUrl><description>${xml(desc)}</description>
<ExtendedData><Data name="capa"><value>${xml(r.layer)}</value></Data><Data name="pk_inicio"><value>${fmtPK(r.d0)}</value></Data><Data name="pk_fin"><value>${fmtPK(r.d1)}</value></Data><Data name="organismo"><value>${xml(r.org)}</value></Data></ExtendedData>${geom}</Placemark>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="${KML_NS}"><Document><name>${xml('Afecciones ' + rep.obra)}</name>
<Style id="af"><LineStyle><color>ff3131e0</color><width>6</width></LineStyle><IconStyle><color>ff3131e0</color></IconStyle></Style>\n${pms}\n</Document></kml>`;
}
// Croquis SVG de las trazas con los tramos afectados en rojo
function afecSvg(rep) {
  const lines = [], reds = [];
  const ids = [...new Set(rep.targets.map(t => t.layerId))];
  ids.forEach(id => { const e = layers.get(id); if (!e) return; afecTargets(e).forEach(t => { if (t.pt) lines.push({ pt: t.pt }); else lines.push({ c: segmentCoords(t.f, 0, t.len) }); }); });
  rep.rows.forEach(r => { const e = layers.get(r.layerId), t = e && afecTargets(e).find(x => x.i === r.fi); if (!t) return; reds.push(t.pt ? { pt: t.pt } : { c: segmentCoords(t.f, r.len < 1 ? Math.max(0, r.d0 - 5) : r.d0, r.len < 1 ? Math.min(t.len, r.d1 + 5) : r.d1) }); });
  const all = lines.flatMap(l => l.c || [l.pt]); if (!all.length) return '';
  const P = c => L.CRS.EPSG3857.project(L.latLng(c[0], c[1]));
  const ps = all.map(P), x0 = Math.min(...ps.map(p => p.x)), x1 = Math.max(...ps.map(p => p.x)), y0 = Math.min(...ps.map(p => p.y)), y1 = Math.max(...ps.map(p => p.y));
  const W = 700, pad = 24, dx = (x1 - x0) || 1, dy = (y1 - y0) || 1, H = Math.round(Math.min(520, Math.max(170, dy / dx * (W - 2 * pad) + 2 * pad)));
  const s = Math.min((W - 2 * pad) / dx, (H - 2 * pad) / dy);
  const T = c => { const p = P(c); return `${(pad + (p.x - x0) * s).toFixed(1)},${(H - pad - (p.y - y0) * s).toFixed(1)}`; };
  const draw = (l, col, w) => l.pt ? `<circle cx="${T(l.pt).split(',')[0]}" cy="${T(l.pt).split(',')[1]}" r="${w}" fill="${col}"/>` : `<polyline points="${l.c.map(T).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const kc = 1 / Math.cos(all[0][0] * Math.PI / 180); // metros reales → metros de la proyección
  const sc = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].find(v => v * kc * s >= 80) || 20000;
  const scPx = sc * kc * s;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;border:1px solid #ccc;background:#fafaf7">${lines.map(l => draw(l, '#555', 2)).join('')}${reds.map(l => draw(l, '#e03131', 6)).join('')}
<line x1="10" y1="14" x2="${10 + scPx}" y2="14" stroke="#000" stroke-width="2"/><text x="${10 + scPx + 6}" y="18" font-size="12">${sc >= 1000 ? sc / 1000 + ' km' : sc + ' m'}</text><text x="${W - 30}" y="24" font-size="16" font-weight="700">N↑</text></svg>`;
}
function afecHtml(rep) {
  const E = esc, byOrg = new Map(); rep.rows.forEach(r => { if (!byOrg.has(r.org)) byOrg.set(r.org, []); byOrg.get(r.org).push(r); });
  const per = new Map(); rep.targets.forEach(t => per.set(t.layerId + '#' + t.fi, { t, rows: [] })); rep.rows.forEach(r => { const g = per.get(r.layerId + '#' + r.fi); if (g) g.rows.push(r); });
  const tramo = r => r.kind === 'punto' ? '—' : r.cross ? `${fmtPK((r.d0 + r.d1) / 2)} (cruce)` : `${fmtPK(r.d0)} – ${fmtPK(r.d1)}`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe de afecciones · ${E(rep.obra)}</title>
<style>body{font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#16211c;max-width:900px;margin:24px auto;padding:0 16px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:26px 0 8px;border-bottom:2px solid #0b3d2e;padding-bottom:3px}
table{border-collapse:collapse;width:100%;margin:6px 0 12px;font-size:13px}th,td{border:1px solid #cfd8d3;padding:5px 7px;text-align:left;vertical-align:top}th{background:#eef3f0}.sub{color:#5b6b63}.ok{color:#2f9e44;font-weight:600}.warn{background:#fff4e6;border:1px solid #ffd8a8;padding:8px 10px;border-radius:6px}small{color:#5b6b63}
@media print{body{margin:0}h2{break-after:avoid}tr{break-inside:avoid}}</style></head><body>
<h1>Informe de afecciones</h1><p class="sub">Obra: <b>${E(rep.obra)}</b> · ${new Date(rep.date).toLocaleString('es-ES')} · OBRA-GIS v${E(rep.v)}</p>
<p>Se han revisado <b>${rep.targets.length} elemento${rep.targets.length === 1 ? '' : 's'}</b> (${fmtLen(rep.targets.reduce((s, t) => s + t.len, 0))} de traza) consultando cada <b>${rep.step} m</b> con una banda de <b>±${rep.radius || rep.band} m</b> a cada lado del eje${rep.radius > rep.band ? ` (pedida ±${rep.band} m; se amplía a la mitad de la distancia entre consultas para no dejar huecos)` : ''}. Resultado: <b>${rep.rows.length ? rep.rows.length + ' afecciones' : 'sin afecciones'}</b>${rep.partial ? ' (informe incompleto: se paró antes de terminar)' : ''}.</p>
<h2>Capas consultadas</h2><table><tr><th>Capa</th><th>Estado</th></tr>${rep.services.map(s => `<tr><td>${E(s.name)}</td><td>${s.dead ? '<b>Sin respuesta: no revisada</b>' : 'Consultada'}</td></tr>`).join('')}</table>
${rep.rows.length ? `<h2>Organismos y titulares a consultar</h2><table><tr><th>Organismo</th><th>Afecciones</th></tr>${[...byOrg].map(([o, l]) => `<tr><td>${E(o)}</td><td>${[...new Set(l.map(r => `${r.svc}: ${r.el}`))].map(E).join('<br>')}</td></tr>`).join('')}</table>` : ''}
<h2>Croquis</h2>${afecSvg(rep)}<p><small>Gris: trazas revisadas. Rojo: tramos con afección.</small></p>
<h2>Detalle por traza</h2>${[...per.values()].map(({ t, rows }) => `<h3 style="font-size:15px;margin:16px 0 4px">${E(t.layer)} · ${E(t.name)} <small>(${E(t.kind)}${t.len ? ', ' + fmtLen(t.len) : ''})</small></h3>
${rows.length ? `<table><tr><th>PK</th><th>Long.</th><th>Afección</th><th>Elemento afectado y datos</th></tr>${rows.map(r => `<tr><td>${tramo(r)}</td><td>${!r.cross && r.len >= 1 ? fmtLen(r.len) : '—'}</td><td>${E(r.svc)}</td><td><b>${E(r.el)}</b><br><small>${r.attrs.map(([k, v]) => (k ? E(k) + ': ' : '') + E(v)).join(' · ')}</small></td></tr>`).join('')}</table>` : '<p class="ok">Sin afecciones en las capas consultadas.</p>'}`).join('')}
<h2>Advertencia</h2><p class="warn">Informe orientativo elaborado con los servicios públicos de cartografía (IECA-DERA, REDIAM, MITECO, Catastro, SIGPAC…) en la fecha indicada. La exactitud depende de esas fuentes y de la distancia entre consultas: un elemento estrecho puede no detectarse si cae entre dos consultas fuera de la banda. No sustituye a las consultas oficiales a los organismos y titulares, ni a la comprobación en campo.</p>
</body></html>`;
}
