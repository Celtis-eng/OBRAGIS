'use strict';
/* OBRA-GIS v1.16.0 (2026-11-10) — Ficha de inspección de campo · Restauración de caminos agrarios.
   · Parte de PROYECTO: se rellena sola a partir del presupuesto (BC3 de Presto) y de los KMZ de las actuaciones.
   · Parte de CAMPO: se rellena en la visita con el móvil (botones grandes, fotos con GPS y PK, sin conexión).
   · Exporta la ficha para imprimir (PDF) y en JSON para la revisión del presupuesto.
   Este fichero se carga después de app.js y usa sus funciones (DB, openSheet, layers, pkAt…). */

const FICHA_HEAD = 'RESTAURACIÓN DE CAMINOS AGRARIOS DE USO PÚBLICO E INFRAESTRUCTURAS ASOCIADAS EN ANDALUCÍA ORIENTAL, EN EL ÁMBITO DE LAS ACTUACIONES DE EMERGENCIA DEL ARTÍCULO 12 DEL REAL DECRETO LEY 5/2026, DE 17 DE FEBRERO';
const FICHA_TITLE = 'FICHA DE INSPECCIÓN DE CAMPO – RESTAURACIÓN DE CAMINOS AGRARIOS';

/* ---------------- Estructura de la ficha (copia de la ficha oficial) ----------------
   Cada casilla tiene grupos de opciones; «one» = solo una opción del grupo (grados bajo/medio/alto). */
const DENS = { k: 'den', opts: ['Densidad baja', 'Densidad media', 'Densidad alta'], one: true };
const METODO = { k: 'met', opts: ['Manual', 'Mecanizado'] };
const MATERIAL = { k: 'mat', opts: ['Material procedente excavación', 'Material cantera'] };
const FICHA_SECTIONS = [
  { id: 'A', name: 'Actuaciones sobre la vegetación', items: [
    { k: 'veg_margenes', name: 'Desbroce de márgenes', groups: [METODO, DENS] },
    { k: 'veg_traza', name: 'Desbroce de la traza', groups: [METODO, DENS] },
    { k: 'veg_poda', name: 'Poda y retirada de árboles', groups: [], noAlc: true },
  ] },
  { id: 'B', name: 'Actuaciones sobre la explanada', items: [
    { k: 'exp_exc', name: 'Excavación', groups: [{ k: 'ter', opts: ['Compacto', 'Tránsito', 'Roca'] }] },
    { k: 'exp_cons', name: 'Construcción', groups: [MATERIAL] },
    { k: 'exp_perf', name: 'Perfilado, refino y compactación', groups: [{ k: 'eq', opts: ['Equipo de compactación', 'Pequeña maquinaria'] }] },
  ] },
  { id: 'C', name: 'Actuaciones sobre la capa de firme', items: [
    { k: 'firme_zah', name: 'Zahorra', groups: [{ k: 't', opts: ['Escarificado', 'Aporte', 'Construcción'] }] },
    { k: 'firme_hor', name: 'Hormigón', groups: [{ k: 't', opts: ['Demolición de pavimento existente', 'Construcción de pavimento'] }, { k: 'x', opts: ['Incluye fibra', 'Incluye mallazo'] }] },
    { k: 'firme_asf', name: 'Asfaltos / Tratamientos especiales', groups: [{ k: 't', opts: ['Demolición / Fresado de pavimento existente', 'Construcción de Mezcla Bituminosa en Caliente', 'Construcción de Asfalto en Frío', 'Construcción Doble Tratamiento'] }] },
  ] },
  { id: 'D', name: 'Actuaciones sobre taludes', items: [
    { k: 'tal_perf', name: 'Perfilado', groups: [] },
    { k: 'tal_cons', name: 'Construcción con aporte de material', groups: [MATERIAL] },
    { k: 'tal_mamp', name: 'Ejecución de muro de mampostería', groups: [] },
    { k: 'tal_esc', name: 'Ejecución de muro de escollera', groups: [] },
  ] },
  { id: 'E', name: 'Actuaciones sobre el drenaje', items: [
    { k: 'dren_cun', name: 'Cunetas', groups: [{ k: 'des', opts: ['Desbroce bajo', 'Desbroce medio', 'Desbroce alto'], one: true }, { k: 'lim', opts: ['Limpieza baja', 'Limpieza media', 'Limpieza alta'], one: true }, { k: 't', opts: ['Excavación', 'Revestimiento de hormigón'] }] },
    { k: 'dren_bad', name: 'Badenes', groups: [{ k: 't', opts: ['Demolición de badenes en mal estado', 'Excavación y construcción completa de badenes de hormigón', 'Reconstrucción de badenes de hormigón'] }] },
    { k: 'dren_cano', name: 'Caños', groups: [{ k: 'lim', opts: ['Limpieza baja', 'Limpieza media', 'Limpieza alta'], one: true }, { k: 'inst', opts: ['Instalación'] }], diam: true },
  ] },
];
const FICHA_ITEMS = FICHA_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, sec: s.id })));
const fichaItem = k => FICHA_ITEMS.find(i => i.k === k);
const YESNO = [['si', 'Sí'], ['no', 'No']];
const COINC = [['si', 'Sí'], ['no', 'No'], ['parcial', 'Parcialmente']];
const PEND = [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']];
const SUMIN = ['Bañera', 'Dúmper', 'Hormigonera 6 m³', 'Hormigonera 10 m³'];
const ADEC = ['Poda', 'Hormigonado', 'Movimiento de tierras', 'Otras'];
const ACCESO_Q = [
  ['pend', 'Pendiente', 'pend'], ['alejada', '¿Zona de actuación alejada de la vía principal?', 'yn', 'tiempo'], ['galibo', '¿Limitación de gálibo?', 'yn'],
  ['adec', '¿Adecuación necesaria?', 'yn', 'adecTipos'], ['maqGrande', 'Maquinaria grandes dimensiones', 'yn'], ['sumin', 'Suministro de materiales', 'sumin'],
];
const ZONA_Q = [
  ['pend', 'Pendiente', 'pend'], ['galibo', '¿Limitación de gálibo?', 'yn'], ['maqGrande', 'Maquinaria grandes dimensiones', 'yn'], ['sumin', 'Suministro de materiales', 'sumin'],
  ['acopio', '¿Existen zonas de acopio?', 'yn'], ['transp', '¿Necesidad de transportes internos?', 'yn'], ['volv', '¿Existen volvederos?', 'yn'],
  ['corte', '¿Corte temporal de acceso a parcelas o de tráfico?', 'yn'], ['serv', '¿Servicios afectados?', 'yn'],
];
const FICHA_TABS = [['datos', 'Datos'], ...FICHA_SECTIONS.map(s => [s.id, s.id + '. ' + s.name.replace('Actuaciones sobre ', '').replace(/^la |^el /, '')]),
  ['F', 'F. Otras (memoria)'], ['G', 'Detectadas in situ'], ['med', 'Mediciones'], ['acc', 'Vías de acceso'], ['zona', 'Zona de actuación'], ['rec', 'Recursos'], ['exp', 'Exportar']];

/* ---------------- Lector de BC3 (FIEBDC-3) ---------------- */
// Presto suele declarar «ANSI» aunque guarde en UTF-8: se prueba UTF-8 estricto y, si falla, Windows-1252
function bc3Decode(buf) { let t; try { t = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { t = new TextDecoder('windows-1252').decode(buf); } return t.replace(/^\ufeff/, ''); }
function parseBC3(src) {
  const txt = typeof src === 'string' ? src : bc3Decode(src);
  const C = new Map(), D = new Map(), T = new Map(), M = new Map();
  let root = null;
  const clean = s => String(s || '').replace(/#+$/, '');
  for (const raw of txt.split(/\r?\n?~/)) {
    const r = raw.replace(/^~/, '').replace(/\r?\n$/, '');
    const f = r.split('|'), t = f[0];
    if (t === 'C') {
      const codes = (f[1] || '').split('\\').filter(Boolean); if (!codes.length) continue;
      const c0 = codes[0], code = clean(c0);
      if (/##$/.test(c0)) root = code;
      C.set(code, { code, chapter: /#$/.test(c0), unit: f[2] || '', summary: (f[3] || '').trim(), price: parseFloat(String(f[4] || '').split('\\')[0]) || 0, type: f[6] || '' });
    } else if (t === 'D') {
      const parts = (f[2] || '').split('\\'), kids = [];
      for (let i = 0; i + 2 < parts.length; i += 3) if (parts[i]) kids.push({ code: clean(parts[i]), factor: parseFloat(parts[i + 1]) || 1, qty: parts[i + 2] === '' ? 1 : parseFloat(parts[i + 2]) || 0 });
      D.set(clean(f[1]), kids);
    } else if (t === 'T') {
      T.set(clean(f[1]), (f[2] || '').trim());
    } else if (t === 'M') {
      const [par, ch] = (f[1] || '').split('\\').map(clean);
      const p = (f[4] || '').split('\\'), lines = [];
      for (let i = 0; i + 5 < p.length; i += 6) {
        const l = { tipo: p[i], com: (p[i + 1] || '').trim(), n: p[i + 2], lo: p[i + 3], an: p[i + 4], al: p[i + 5] };
        if (l.com || l.n || l.lo || l.an || l.al) lines.push(l);
      }
      M.set(par + '\\' + ch, { total: parseFloat(f[3]) || 0, lines });
    }
  }
  return { C, D, T, M, root };
}
// Caminos del presupuesto: capítulos con subcapítulos (actuaciones) que llevan partidas
const BC3_SKIP = /seguridad y salud|control de calidad|gesti[oó]n de residuos|protecciones/i;
function bc3Caminos(b) {
  const isCh = c => b.C.get(c) && b.C.get(c).chapter;
  const hasPart = c => (b.D.get(c) || []).some(k => !isCh(k.code));
  const out = [];
  const walk = (code, depth) => {
    for (const k of b.D.get(code) || []) {
      const c = b.C.get(k.code); if (!c || !c.chapter || BC3_SKIP.test(c.summary)) continue;
      const subs = (b.D.get(k.code) || []).filter(x => isCh(x.code) && !BC3_SKIP.test(b.C.get(x.code).summary));
      if (subs.some(x => hasPart(x.code))) out.push({ code: k.code, summary: c.summary, total: c.price, acts: subs.filter(x => hasPart(x.code)).map(x => x.code) });
      else if (hasPart(k.code) && depth === 0) out.push({ code: k.code, summary: c.summary, total: c.price, acts: [k.code] });
      else if (depth < 3) walk(k.code, depth + 1);
    }
  };
  if (b.root) walk(b.root, 0);
  return out;
}
function bc3Actuacion(b, code) {
  const c = b.C.get(code) || { summary: '', price: 0 };
  const partidas = (b.D.get(code) || []).filter(k => !(b.C.get(k.code) || {}).chapter).map(k => {
    const p = b.C.get(k.code) || { code: k.code, unit: '', summary: '', price: 0 };
    const m = b.M.get(code + '\\' + k.code);
    const qty = m ? m.total : k.qty;
    return { code: k.code, unit: p.unit, summary: p.summary, text: b.T.get(k.code) || '', qty, price: p.price, amount: Math.round(qty * p.price * 100) / 100,
      lines: m ? m.lines.filter(l => l.com).map(l => l.com) : [] };
  });
  return { code, summary: c.summary, total: c.price, partidas };
}

/* ---------------- Partida del presupuesto → casilla de la ficha ----------------
   Solo se marca lo que dicen el código, el resumen o el texto de la partida. Lo que no encaja en A–E pasa
   a «F. Otras actuaciones»; transportes, cargas y traslados de maquinaria quedan como partidas auxiliares. */
const nrm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function fichaClassify(p) {
  const sum = nrm(p.summary), all = nrm(p.summary + ' ' + p.text);
  const subs = {}, add = (g, o) => { (subs[g] = subs[g] || []).includes(o) || subs[g].push(o); };
  const r = (item, extra) => ({ item, subs, ...(extra || {}) });
  if (/^(transporte|carga mecanica|carga y transporte|suplemento|desplazamiento|traslado|riego a humedad|canon|cuadrilla|peon)/.test(sum)) return { aux: true };
  if (/escollera/.test(sum)) return r('tal_esc');
  if (/mamposter/.test(sum)) return r('tal_mamp');
  if (/baden/.test(sum)) {
    if (/demolici/.test(all)) add('t', 'Demolición de badenes en mal estado');
    if (/reconstrucci|reparaci/.test(sum)) add('t', 'Reconstrucción de badenes de hormigón');
    else if (/construcci|ejecuci/.test(sum) && /excavaci/.test(all)) add('t', 'Excavación y construcción completa de badenes de hormigón');
    return r('dren_bad');
  }
  if (/cuneta/.test(sum)) {
    if (/excavaci/.test(all)) add('t', 'Excavación');
    if (/revest|hormig/.test(sum)) add('t', 'Revestimiento de hormigón');
    const g = /limpieza/.test(sum) ? 'limpieza' : /desbroce/.test(sum) ? 'desbroce' : '';
    return r('dren_cun', g ? { note: `grado de ${g} sin indicar en el presupuesto` } : null);
  }
  if (/\bcanos?\b|caño|alcantarill|salvacuneta|\btubo\b|tuberia/.test(sum)) {
    if (/limpieza/.test(sum)) return r('dren_cano', { note: 'grado de limpieza sin indicar en el presupuesto' });
    add('inst', 'Instalación');
    const dm = /(?:ø|diametro|dn)\s*(\d{2,4})/.exec(all);
    return r('dren_cano', dm ? { diam: dm[1] + ' mm' } : null);
  }
  if (/talud/.test(sum) && /perfilad|refino/.test(sum)) return r('tal_perf');
  if (/talud/.test(sum) && /relleno|terraplen|aporte|construcci/.test(sum)) {
    if (/procedente de (la )?(propia )?excavaci/.test(all)) add('mat', 'Material procedente excavación');
    if (/cantera|prestamo/.test(all)) add('mat', 'Material cantera');
    return r('tal_cons');
  }
  if (/desbroce|desbroz/.test(sum)) {
    const k = /margen/.test(all) ? 'veg_margenes' : /traza|plataforma|calzada/.test(all) ? 'veg_traza' : null;
    if (!k) return null;
    if (/manual/.test(all)) add('met', 'Manual');
    if (/mecanic|desbrozadora|tractor|maquina/.test(all)) add('met', 'Mecanizado');
    const d = /densidad (baja|media|alta)|(baja|media|alta) densidad/.exec(all); if (d) add('den', 'Densidad ' + (d[1] || d[2]));
    return r(k);
  }
  if (/\bpoda\b|\btala\b|apeo|arbol/.test(sum)) return r('veg_poda');
  if (/bitumin|aglomerad|asfalt|\bmbc\b|\bac ?\d{2}\b|tratamiento superficial|doble tratamiento|fresado/.test(sum)) {
    if (/fresad|demolici/.test(sum)) add('t', 'Demolición / Fresado de pavimento existente');
    if (/caliente|\bmbc\b|\bac ?\d{2}\b/.test(all) && !/fresad|demolici/.test(sum)) add('t', 'Construcción de Mezcla Bituminosa en Caliente');
    if (/en frio|grava-?emulsion/.test(all)) add('t', 'Construcción de Asfalto en Frío');
    if (/doble tratamiento|bicapa/.test(all)) add('t', 'Construcción Doble Tratamiento');
    return r('firme_asf');
  }
  if (/pavimento (de )?hormig|firme de hormig|solera/.test(sum) || (/demolici/.test(sum) && /hormig/.test(sum))) {
    if (/demolici/.test(sum)) add('t', 'Demolición de pavimento existente'); else add('t', 'Construcción de pavimento');
    if (/fibra/.test(all)) add('x', 'Incluye fibra');
    if (/mallazo|malla electrosoldada/.test(all)) add('x', 'Incluye mallazo');
    return r('firme_hor');
  }
  if (/zahorra|granular|\bz\.?a\.? ?0/.test(sum)) {
    if (/escarifica/.test(all)) add('t', 'Escarificado');
    if (/aporte|suministro/.test(all)) add('t', 'Aporte');
    if (/construcci/.test(sum)) add('t', 'Construcción');
    return r('firme_zah');
  }
  if (/escarificado/.test(sum)) { add('t', 'Escarificado'); return r('firme_zah'); }
  if (/excavaci|desmonte|vaciado/.test(sum)) {
    if (/compacto/.test(all)) add('ter', 'Compacto');
    if (/transito/.test(all)) add('ter', 'Tránsito');
    if (/roca/.test(all)) add('ter', 'Roca');
    return r('exp_exc');
  }
  if (/relleno|terraplen|pedraplen/.test(sum)) {
    if (/procedente de (la )?(propia )?excavaci/.test(all)) add('mat', 'Material procedente excavación');
    if (/cantera|prestamo/.test(all)) add('mat', 'Material cantera');
    return r('exp_cons');
  }
  if (/refino|planeo|reperfilad|perfilado|compactaci|nivelaci/.test(sum)) {
    if (/compactador|rodillo/.test(all)) add('eq', 'Equipo de compactación');
    if (/bandeja|pison|\brana\b|pequena maquinaria/.test(all)) add('eq', 'Pequeña maquinaria');
    return r('exp_perf');
  }
  return null;
}

/* ---------------- Almacenamiento: una ficha por camino, guardadas por obra ---------------- */
const fichaCache = {};
async function fichasOf(obraId = settings.activeObra) {
  if (!fichaCache[obraId]) { try { fichaCache[obraId] = (await DB.get('kv', 'ficha:' + obraId)) || {}; } catch (e) { fichaCache[obraId] = {}; } }
  return fichaCache[obraId];
}
let fichaSaveT = null;
function fichaSave(fc, now) {
  fc.updated = Date.now();
  const obraId = fc.obraId, run = () => DB.put('kv', fichaCache[obraId], 'ficha:' + obraId).catch(e => toast('No se pudo guardar la ficha: ' + (e.message || e), 6000));
  clearTimeout(fichaSaveT);
  return now ? run() : (fichaSaveT = setTimeout(run, 350));
}
function fichaNew(code, obraId = settings.activeObra) {
  const items = {}; FICHA_ITEMS.forEach(i => { items[i.k] = { proy: { on: false, subs: {}, alc: '', coin: '', obs: '', ev: [] }, campo: { on: false, subs: {}, alc: '', obs: '' } }; });
  return { id: uid(), code, obraId, created: Date.now(), updated: Date.now(), alcUmbral: 100,
    general: { municipio: '', expediente: '', actuacion: code, responsable: settings.fichaResp || '', fecha: '' },
    items, otrasMem: [], insitu: { hay: '', rows: [] }, anchos: {}, acceso: {}, zona: {}, recursos: [], proyecto: null };
}
// Traza del camino: elemento de línea o capa con el mismo nombre que el código del camino
function fichaTrace(fc) {
  const want = nrm(fc.code);
  let best = null;
  for (const e of layers.values()) {
    if (typeOf(e.rec) !== 'kml' || !e.feats) continue;
    e.feats.forEach((f, fi) => {
      if (f.type !== 'ln') return;
      if (nrm(f.name) === want || (nrm(e.rec.name) === want && !best)) best = { rec: e.rec, f, fi };
    });
  }
  if (!best && fc.layerId && layers.get(fc.layerId)) { const e = layers.get(fc.layerId), fi = fc.fi || 0; if (e.feats && e.feats[fi] && e.feats[fi].type === 'ln') best = { rec: e.rec, f: e.feats[fi], fi }; }
  return best;
}
function featByName(name) {
  const want = nrm(name);
  for (const e of layers.values()) { if (typeOf(e.rec) !== 'kml' || !e.feats) continue; for (const f of e.feats) if (f.type === 'ln' && (nrm(f.name) === want || nrm(e.rec.name) === want)) return { rec: e.rec, f }; }
  return null;
}

/* ---------------- Parte de proyecto a partir del presupuesto ---------------- */
function fichaFromBC3(fc, b, camino, fileName) {
  const tr = fichaTrace(fc);
  const acts = camino.acts.map(code => {
    const a = bc3Actuacion(b, code), af = featByName(code);
    if (af && tr) {
      const d = [pkAt(tr.f, L.latLng(af.f.start)).d, pkAt(tr.f, L.latLng(af.f.end)).d].sort((x, y) => x - y);
      a.d0 = Math.round(d[0]); a.d1 = Math.round(d[1]); a.len = Math.round(af.f.length);
    }
    return a;
  });
  const rootC = b.C.get(b.root) || { summary: '' };
  // Código del expediente: el del capítulo raíz o, si es genérico («0»), el que encabeza su título (p. ej. «CM18128-011 Marchal Granada»)
  const tok = /^([A-Z]{1,5}\d[\w.\-\/]*)\s+(.*)$/i.exec(rootC.summary.trim());
  const exped = /^[A-Z]{1,5}\d/i.test(b.root || '') ? b.root : tok ? tok[1] : (b.root || '');
  const rootTitle = tok && exped === tok[1] ? tok[2] : rootC.summary.replace(exped, '').trim();
  fc.proyecto = { file: fileName || '', root: exped, rootTitle, rootSummary: rootC.summary, camino: camino.code, caminoSummary: camino.summary, total: camino.total, acts, date: Date.now() };
  // casillas: se rehace lo automático y se conserva lo que se haya comprobado en campo
  FICHA_ITEMS.forEach(i => { const p = fc.items[i.k].proy; if (p.auto) { p.on = false; p.subs = {}; p.ev = []; p.alcAuto = ''; if (p.alcFrom === 'auto') p.alc = ''; p.auto = false; } });
  const aux = [], otras = new Map(), ext = {};
  acts.forEach(a => a.partidas.forEach(p => {
    const c = fichaClassify(p);
    const where = `${a.code}${a.d0 != null ? ` · PK ${fmtPK(a.d0)}–${fmtPK(a.d1)}` : ''}`;
    const qty = `${String(Math.round(p.qty * 100) / 100).replace('.', ',')} ${p.unit}`;
    p.casilla = c ? (c.aux ? 'aux' : c.item) : 'F';
    if (c && c.aux) { aux.push({ ...p, act: a.code }); return; }
    if (!c || !c.item) {
      const o = otras.get(p.code) || { code: p.code, summary: p.summary, refs: [] };
      o.refs.push(`${qty} (${where})`); otras.set(p.code, o); return;
    }
    const it = fc.items[c.item].proy;
    it.on = true; it.auto = true;
    Object.entries(c.subs).forEach(([g, list]) => { it.subs[g] = [...new Set([...(it.subs[g] || []), ...list])]; });
    if (c.diam && !it.diam) it.diam = c.diam;
    it.ev.push(`${p.code} ${p.summary} — ${qty} (${where})${c.note ? ' · ' + c.note : ''}`);
    if (a.len != null) ext[c.item] = Math.max(ext[c.item] || 0, a.d1 - a.d0);
  }));
  fc.proyecto.aux = aux.map(p => ({ code: p.code, summary: p.summary, qty: p.qty, unit: p.unit, act: p.act }));
  FICHA_ITEMS.forEach(i => {
    const p = fc.items[i.k].proy; if (!p.on || i.noAlc || ext[i.k] == null) return;
    p.alcAuto = ext[i.k] >= (fc.alcUmbral || 100) ? 'amplio' : 'puntual';
    if (!p.alc || p.alcFrom === 'auto') { p.alc = p.alcAuto; p.alcFrom = 'auto'; }
  });
  // F. Otras actuaciones: las partidas que no tienen casilla; se conservan las comprobaciones ya hechas
  const keep = new Map(fc.otrasMem.filter(r => r.src).map(r => [r.src, r]));
  fc.otrasMem = [...fc.otrasMem.filter(r => !r.src),
    ...[...otras.values()].map(o => ({ ...(keep.get(o.code) || { alc: '', coin: '', obs: '' }), act: `${o.summary} (${o.code})`, src: o.code, ev: o.refs.join(' · ') }))];
  const g = fc.general;
  if (!g.expediente || g.expediente === '0') g.expediente = exped;
  if (!g.actuacion) g.actuacion = camino.code;
  if ((!g.municipio || g.municipioAuto) && rootTitle) {
    const m = rootTitle.replace(/\s+(almer[ií]a|granada|ja[eé]n|m[aá]laga|c[oó]rdoba|sevilla|huelva|c[aá]diz)$/i, '').trim();
    if (m) { g.municipio = m; g.municipioAuto = true; }
  }
  if (tr) { fc.layerId = tr.rec.id; fc.fi = tr.fi; }
}

/* ---------------- Importar el previo: BC3 + KMZ de camino y actuaciones + fotos ---------------- */
let fichaInput = null;
function fichaImportPick() {
  closeSheet();
  if (!fichaInput) {
    fichaInput = document.createElement('input'); fichaInput.type = 'file'; fichaInput.multiple = true; fichaInput.hidden = true;
    document.body.appendChild(fichaInput);
    fichaInput.addEventListener('change', e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) fichaImportFiles(f); });
  }
  fichaInput.click();
}
const baseName = p => p.split('/').pop().replace(/\.[^.]+$/, '');
async function fichaImportFiles(files) {
  toast('Leyendo el previo…', 20000);
  // Los ficheros del .zip se descomprimen de uno en uno cuando hacen falta (las fotos de móvil pesan mucho)
  const kmls = [], photos = [], bc3s = [];
  const take = (name, get, dir) => {
    const fname = name.split('/').pop(), type = /png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : '';
    const file = async () => { const b = await get(); return b instanceof File ? b : new File([b], fname, { type }); };
    if (/\.km[lz]$/i.test(name)) kmls.push({ name, file, dir });
    else if (/\.(jpe?g|png|webp)$/i.test(name)) photos.push({ name, file, dir });
    else if (/\.bc3$/i.test(name)) bc3s.push({ name: fname, file });
  };
  for (const f of files) {
    if (/\.zip$/i.test(f.name) || /zip/.test(f.type)) {
      try {
        const z = await JSZip.loadAsync(f);
        for (const e of Object.values(z.files)) {
          if (e.dir || /(^|\/)(__MACOSX|\.)/.test(e.name)) continue;
          const parts = e.name.split('/'); take(e.name, () => e.async('blob'), parts.length > 1 ? parts[parts.length - 2] : '');
        }
      } catch (e) { toast(f.name + ': no se pudo abrir el .zip', 6000); }
    } else take(f.name, async () => f, '');
  }
  if (!kmls.length && !photos.length && !bc3s.length) { toast('No se ha encontrado ningún BC3, KML/KMZ ni foto en lo que has abierto.', 6000); return; }
  // Presupuesto
  let b = null, caminos = [], bName = '', bFile = null;
  if (bc3s.length) {
    try { bFile = await bc3s[0].file(); b = parseBC3(await bFile.arrayBuffer()); caminos = bc3Caminos(b); bName = bc3s[0].name; }
    catch (e) { toast('No se pudo leer el BC3: ' + (e.message || e), 7000); }
  }
  const caminoCodes = caminos.map(c => c.code);
  const kmlNames = kmls.map(k => baseName(k.name));
  if (!caminoCodes.length) kmlNames.forEach(n => { if (!kmlNames.some(o => o !== n && n.startsWith(o + '-')) && kmlNames.some(o => o.startsWith(n + '-'))) caminoCodes.push(n); });
  const caminoOf = name => caminoCodes.filter(c => name === c || name.startsWith(c + '-') || name.startsWith(c + '_')).sort((x, y) => y.length - x.length)[0] || '';
  // Capas KML (primero el camino, para que las actuaciones queden encima)
  kmls.sort((a, b) => (caminoCodes.includes(baseName(a.name)) ? 0 : 1) - (caminoCodes.includes(baseName(b.name)) ? 0 : 1) || a.name.localeCompare(b.name));
  const existing = new Set([...layers.values()].map(e => nrm(e.rec.name)));
  let nK = 0, nSkip = 0, ci = 0;
  for (const k of kmls) {
    const name = baseName(k.name), cam = caminoOf(name);
    if (existing.has(nrm(name))) { nSkip++; continue; }
    try {
      const text = await readKmlFile(await k.file());
      const { feats } = parseKML(text); if (!feats.length) continue;
      const isCam = cam && name === cam;
      const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name, text, color: isCam ? '#ffd43b' : PALETTE[1 + (ci++ % (PALETTE.length - 1))],
        visible: true, opacity: 1, order: nextOrder(), created: Date.now(), folder: cam ? (isCam ? `Previo ${cam}` : `Previo ${cam}/Actuaciones`) : 'Previo' };
      await DB.put('layers', rec); registerLayer(rec); existing.add(nrm(name)); nK++;
    } catch (e) { toast(e.message || 'No se pudo leer ' + k.name, 5000); }
  }
  drawPK();
  // Fotos agrupadas por carpeta (una capa de fotos por actuación)
  const byDir = new Map(); photos.forEach(p => { const d = p.dir || 'Fotos'; if (!byDir.has(d)) byDir.set(d, []); byDir.get(d).push(p); });
  const haveTitles = new Set([...notes.values()].filter(n => n.layerId).map(n => n.title));
  let nP = 0, nNoGps = 0;
  for (const [dir, list] of byDir) {
    const cam = caminoOf(dir) || caminoOf(baseName(list[0].name));
    const rec = { id: uid(), obraId: settings.activeObra, type: 'photos', name: `Fotos ${dir}`, visible: true, order: 0, created: Date.now(), folder: cam ? `Previo ${cam}/Fotos del previo` : 'Previo/Fotos del previo' };
    const added = [];
    for (let i = 0; i < list.length; i++) {
      const p = list[i], title = baseName(p.name);
      if (haveTitles.has(title)) continue;
      toast(`Situando fotos de ${dir}: ${i + 1} de ${list.length}…`, 20000);
      const pf = await p.file();
      let ex = null; try { ex = await readExif(pf); } catch (e) { ex = null; }
      if (!ex || ex.lat == null) { nNoGps++; continue; }
      let blob = await processImage(pf, null, false);
      blob = await writeExif(blob, { lat: ex.lat, lng: ex.lng, alt: ex.alt, date: ex.date });
      added.push(photoNote(rec, pf, blob, { lat: ex.lat, lng: ex.lng, alt: ex.alt ?? null, dir: ex.dir ?? null, src: 'exif', created: ex.date || Date.now() }));
    }
    if (!added.length) continue;
    try {
      await DB.put('layers', rec); registerLayer(rec);
      for (const n of added) { await DB.put('notes', n); notes.set(n.id, n); drawNote(n); nP++; }
    } catch (e) { toast('No se pudieron guardar las fotos: ' + (e.message || 'almacenamiento lleno'), 7000); }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  // Fichas
  const fcs = await fichasOf(); const made = [];
  for (const code of caminoCodes) {
    const fc = fcs[code] || (fcs[code] = fichaNew(code));
    const cam = caminos.find(c => c.code === code);
    if (cam && b) { fichaFromBC3(fc, b, cam, bName); if (bFile) { try { fc.bc3Text = bc3Decode(await bFile.arrayBuffer()); } catch (e) { /* sin copia */ } } }
    else { const tr = fichaTrace(fc); if (tr) { fc.layerId = tr.rec.id; fc.fi = tr.fi; } }
    await fichaSave(fc, true); made.push(fc);
  }
  if (!$('#drawer').hidden) renderDrawer();
  const pts = []; layers.forEach(e => { if (e.group && e.rec.folder && /^Previo/.test(e.rec.folder)) { const bb = e.group.getBounds(); if (bb.isValid()) pts.push(bb.getSouthWest(), bb.getNorthEast()); } });
  if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.1), { maxZoom: 18 });
  $('#toast').hidden = true;
  const msg = [`${nK} trazas`, `${nP} fotos situadas`, nSkip ? `${nSkip} KML ya estaban` : '', nNoGps ? `${nNoGps} fotos sin GPS (impórtalas con «Fotos» para leer la marca de agua)` : ''].filter(Boolean).join(' · ');
  if (made.length === 1) { fichaOpen(made[0].code, 'datos', `Previo cargado: ${msg}`); return; }
  if (made.length) { fichaList(`Previo cargado: ${msg}`); return; }
  toast(`Previo cargado: ${msg}. Sin BC3 no se crea la ficha: ábrela desde la traza del camino.`, 8000);
}

/* ---------------- Lista de fichas de la obra ---------------- */
async function fichaList(msg) {
  const fcs = await fichasOf(), list = Object.values(fcs).sort((a, b) => a.code.localeCompare(b.code));
  const b = openSheet(`<h2>Fichas de inspección</h2><p class="sub">${msg ? esc(msg) : 'Restauración de caminos agrarios · una ficha por camino'}</p>
    ${list.length ? `<div class="obras">${list.map(fc => { const s = fichaProgress(fc); return `<div class="obra"><button class="otitle" data-open="${esc(fc.code)}" type="button"><b>${esc(fc.code)}</b><small>${esc((fc.proyecto && fc.proyecto.caminoSummary) || fc.traceName || '')}<br>${s.txt}${fc.general.fecha ? ' · visita ' + esc(fc.general.fecha.split('-').reverse().join('/')) : ''}</small></button></div>`; }).join('')}</div>`
      : '<p class="empty">Todavía no hay fichas en esta obra.</p>'}
    <div class="acts"><button class="btn pri full" data-a="imp">${ICON.folder}Cargar previo (BC3, KMZ y fotos)</button></div>
    <p class="hint">Abre a la vez el BC3 del presupuesto y el .zip del previo (KMZ del camino, KMZ de cada actuación y sus fotos). También puedes abrir la ficha tocando la traza del camino en el mapa.</p>`);
  b.querySelectorAll('[data-open]').forEach(bt => bt.onclick = () => fichaOpen(bt.dataset.open));
  b.querySelector('[data-a=imp]').onclick = fichaImportPick;
}
// Desde la traza: abre su ficha o la crea
async function fichaForTrace(rec, f) {
  const fcs = await fichasOf();
  const found = Object.values(fcs).find(fc => { const t = fichaTrace(fc); return t && t.rec.id === rec.id && t.f === f; });
  if (found) return fichaOpen(found.code);
  const code = f.name || rec.name;
  const b = openSheet(`<h2>Ficha de inspección</h2><p class="sub">${esc(code)} · ${fmtLen(f.length)}</p>
    <p>Esta traza todavía no tiene ficha.</p>
    <div class="acts"><button class="btn pri full" data-a="bc3">Cargar el BC3 del presupuesto</button><button class="btn full" data-a="empty">Crear la ficha sin presupuesto</button></div>
    <p class="hint">Con el BC3, la parte de proyecto se rellena sola: la app busca en el presupuesto el capítulo que se llama como la traza (${esc(code)}).</p>`);
  const make = async () => { const fc = fcs[code] || (fcs[code] = fichaNew(code)); fc.layerId = rec.id; fc.fi = (layers.get(rec.id).feats || []).indexOf(f); fc.traceName = f.name; await fichaSave(fc, true); return fc; };
  b.querySelector('[data-a=empty]').onclick = async () => { const fc = await make(); fichaOpen(fc.code); };
  b.querySelector('[data-a=bc3]').onclick = async () => { const fc = await make(); fichaPickBC3(fc); };
}
function fichaPickBC3(fc) {
  const i = document.createElement('input'); i.type = 'file'; i.hidden = true; document.body.appendChild(i);
  i.onchange = async () => {
    const file = i.files[0]; i.remove(); if (!file) return;
    try {
      const b = parseBC3(await file.arrayBuffer()), cams = bc3Caminos(b);
      let cam = cams.find(c => nrm(c.code) === nrm(fc.code));
      if (!cam && cams.length === 1) cam = cams[0];
      if (!cam) {
        const s = openSheet(`<h2>¿Qué camino del presupuesto es?</h2><p class="sub">${esc(file.name)} · no hay ningún capítulo llamado ${esc(fc.code)}</p><div class="acts">${cams.map((c, k) => `<button class="btn full" data-k="${k}">${esc(c.code)} · ${esc(c.summary)}</button>`).join('') || '<p class="empty">El BC3 no tiene capítulos de caminos con actuaciones.</p>'}</div>`);
        s.querySelectorAll('[data-k]').forEach(bt => bt.onclick = async () => { fichaFromBC3(fc, b, cams[+bt.dataset.k], file.name); fc.bc3Text = bc3Decode(await file.arrayBuffer()); await fichaSave(fc, true); fichaOpen(fc.code, 'datos', 'Parte de proyecto rellenada desde el presupuesto.'); });
        return;
      }
      fichaFromBC3(fc, b, cam, file.name); fc.bc3Text = bc3Decode(await file.arrayBuffer()); await fichaSave(fc, true);
      fichaOpen(fc.code, 'datos', 'Parte de proyecto rellenada desde el presupuesto.');
    } catch (e) { toast('No se pudo leer el BC3: ' + (e.message || e), 7000); }
  };
  i.click();
}

/* ---------------- Formulario ---------------- */
let fichaState = { code: null, tab: 'datos', scroll: 0 };
const fichaBack = (() => { const d = document.createElement('button'); d.type = 'button'; d.className = 'fback'; d.hidden = true; d.textContent = '← Volver a la ficha'; document.body.appendChild(d);
  d.onclick = () => { d.hidden = true; if (fichaState.code) fichaOpen(fichaState.code, fichaState.tab, null, fichaState.scroll); }; return d; })();
function fichaLeave() { fichaState.scroll = $('#sheet').scrollTop; closeSheet(); fichaBack.hidden = false; }
function fichaProgress(fc) {
  const proj = FICHA_ITEMS.filter(i => fc.items[i.k].proy.on), done = proj.filter(i => fc.items[i.k].proy.coin);
  const om = fc.otrasMem.filter(r => r.act), omd = om.filter(r => r.coin);
  const tot = proj.length + om.length, ok = done.length + omd.length;
  return { tot, ok, txt: tot ? `${ok} de ${tot} actuaciones de proyecto comprobadas` : 'Sin actuaciones de proyecto' };
}
// Botones de una sola opción (seg) y de varias (chips): data-seg / data-chips llevan la clave del dato; cada botón, data-v con el valor
const segHtml = (opts, cur, key) => `<div class="seg fseg n${opts.length}" data-seg="${esc(key)}">${opts.map(([v, t]) => `<button type="button" data-v="${esc(v)}" class="${cur === v ? 'on ' + v : ''}">${esc(t)}</button>`).join('')}</div>`;
const chipHtml = (opts, sel, key) => `<div class="chips fchips" data-chips="${esc(key)}">${opts.map(o => `<button type="button" class="chip ${(sel || []).includes(o) ? 'on' : ''}" data-v="${esc(o)}" style="--c:var(--accent)">${esc(o)}</button>`).join('')}</div>`;
const ALC = [['amplio', 'Amplio'], ['puntual', 'Puntual']];
function fichaPhotos(fc, ref) { return [...notes.values()].filter(n => n.ficha && n.ficha.code === fc.code && n.ficha.ref === ref).sort((a, b) => a.created - b.created); }
function photoStrip(fc, ref, label) {
  const ph = fichaPhotos(fc, ref);
  return `<div class="fphotos">${ph.map(n => { const m = (n.media || [])[0]; return m ? `<img src="${objectUrl(m.blob)}" data-full alt="Foto" data-nid="${n.id}">` : ''; }).join('')}
    <button type="button" class="mini" data-photo="${esc(ref)}" data-plabel="${esc(label)}">${ICON.photo}Foto${ph.length ? ` (${ph.length})` : ''}</button></div>`;
}

async function fichaOpen(code, tab, msg, scroll) {
  const fcs = await fichasOf(), fc = fcs[code]; if (!fc) { toast('No se encuentra la ficha ' + code); return; }
  fichaBack.hidden = true;
  fichaState = { code, tab: tab || (fichaState.code === code ? fichaState.tab : 'datos') || 'datos', scroll: 0 };
  const tr = fichaTrace(fc);
  const pr = fichaProgress(fc);
  const b = openSheet(`<div class="fhead2"><h2>Ficha de inspección · ${esc(fc.code)}</h2>
      <p class="sub">${esc((fc.proyecto && fc.proyecto.caminoSummary) || (tr ? tr.f.name : 'Traza no encontrada en la obra'))}${tr ? ' · ' + fmtLen(tr.f.length) : ''} · <span data-prog>${pr.txt}</span></p>
      <div class="ftabs">${FICHA_TABS.map(([k, t]) => `<button type="button" data-tab="${k}" class="${k === fichaState.tab ? 'on' : ''}">${esc(t)}${fichaTabBadge(fc, k)}</button>`).join('')}</div></div>
    ${msg ? `<p class="fmsg">${esc(msg)}</p>` : ''}<div id="fichaBody"></div>`, 'ficha');
  $('#sheet').classList.add('ficha-full');
  onSheetClose(() => { $('#sheet').classList.remove('ficha-full'); fichaHL.clearLayers(); });
  b.querySelectorAll('[data-tab]').forEach(bt => bt.onclick = () => { fichaState.tab = bt.dataset.tab; fichaOpen(code, bt.dataset.tab); });
  const on = b.querySelector('.ftabs .on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  fichaRenderTab(fc, tr);
  if (scroll) $('#sheet').scrollTop = scroll;
}
function fichaTabBadge(fc, k) {
  const sec = FICHA_SECTIONS.find(s => s.id === k);
  if (sec) {
    const p = sec.items.filter(i => fc.items[i.k].proy.on), d = p.filter(i => fc.items[i.k].proy.coin), c = sec.items.filter(i => fc.items[i.k].campo.on).length;
    return p.length || c ? ` <small class="${d.length === p.length ? 'ok' : ''}">${p.length ? d.length + '/' + p.length : ''}${c ? (p.length ? ' ' : '') + '+' + c : ''}</small>` : '';
  }
  if (k === 'F') { const om = fc.otrasMem.filter(r => r.act); return om.length ? ` <small class="${om.every(r => r.coin) ? 'ok' : ''}">${om.filter(r => r.coin).length}/${om.length}</small>` : ''; }
  if (k === 'G') return fc.insitu.rows.length ? ` <small>+${fc.insitu.rows.length}</small>` : '';
  return '';
}
function fichaRefresh(fc) { // actualiza contadores de las pestañas sin redibujar
  const pr = fichaProgress(fc), s = $('#sheetBody [data-prog]'); if (s) s.textContent = pr.txt;
  $('#sheetBody').querySelectorAll('[data-tab]').forEach(bt => { const k = bt.dataset.tab, t = FICHA_TABS.find(x => x[0] === k)[1]; bt.innerHTML = esc(t) + fichaTabBadge(fc, k); });
}
const fichaHL = L.layerGroup().addTo(map);

function fichaRenderTab(fc, tr) {
  const body = $('#fichaBody'), tab = fichaState.tab;
  const save = () => { fichaSave(fc); fichaRefresh(fc); };
  if (tab === 'datos') body.innerHTML = fichaDatosHtml(fc, tr);
  else if (FICHA_SECTIONS.some(s => s.id === tab)) {
    const sec = FICHA_SECTIONS.find(s => s.id === tab);
    body.innerHTML = `<h3 class="sh">${sec.id}. ${esc(sec.name)}</h3>` + sec.items.map(i => fichaItemHtml(fc, i)).join('');
  } else if (tab === 'F') body.innerHTML = fichaOtrasMemHtml(fc);
  else if (tab === 'G') body.innerHTML = fichaInsituHtml(fc, tr);
  else if (tab === 'med') body.innerHTML = fichaMedHtml(fc, tr);
  else if (tab === 'acc') body.innerHTML = fichaCondHtml(fc, 'acceso', ACCESO_Q, 'Vías de acceso', tr);
  else if (tab === 'zona') body.innerHTML = fichaCondHtml(fc, 'zona', ZONA_Q, 'Zona de actuación', tr);
  else if (tab === 'rec') body.innerHTML = fichaRecHtml(fc);
  else if (tab === 'exp') body.innerHTML = fichaExpHtml(fc);
  fichaWire(fc, tr, body, save);
}

function fichaDatosHtml(fc, tr) {
  const g = fc.general, P = fc.proyecto;
  const fld = (k, label, type = 'text', extra = '') => `<div class="field"><label>${label}</label><input type="${type}" data-g="${k}" value="${esc(g[k] || '')}" ${extra}></div>`;
  let h = `<h3 class="sh">Datos generales</h3>
    ${fld('municipio', 'Municipio' + (g.municipioAuto ? ' <small>(tomado del título del presupuesto: compruébalo)</small>' : ''))}
    ${fld('expediente', 'Código expediente')}${fld('actuacion', 'Código actuación')}
    ${fld('responsable', 'Responsable de la inspección')}
    <div class="field"><label>Fecha de inspección</label><div class="row"><input type="date" data-g="fecha" value="${esc(g.fecha || '')}"><button class="mini" data-a="hoy" type="button">Hoy</button></div></div>`;
  if (!tr) h += `<p class="fwarn">No encuentro en esta obra la traza «${esc(fc.code)}». Importa su KML/KMZ (con ese nombre) para tener PK, fotos situadas y mediciones.</p>`;
  if (P) {
    h += `<h3 class="sh">Presupuesto</h3><p class="sub">${esc(P.file)} · ${esc(P.root)} ${esc(P.rootTitle || '')}<br>${esc(P.camino)} · ${esc(P.caminoSummary)} · <b>${fmtEur(P.total)}</b></p>
    <div class="facts">${P.acts.map(a => `<div class="fact"><div class="fact-h"><b>${esc(a.code)}</b><span>${fmtEur(a.total)}</span></div>
      <small>${esc(a.summary)}</small>
      <small>${a.d0 != null ? `PK ${fmtPK(a.d0)} – ${fmtPK(a.d1)} (${fmtLen(a.d1 - a.d0)} sobre el camino)` : 'Sin KMZ de la actuación en la obra'}</small>
      <details><summary>${a.partidas.length} partidas</summary><table class="attrs">${a.partidas.map(p => `<tr><td>${esc(p.code)}<br><small>${fichaCasillaLabel(p.casilla)}</small></td><td>${esc(p.summary)}<br><b>${String(Math.round(p.qty * 100) / 100).replace('.', ',')} ${esc(p.unit)}</b>${p.lines.length ? `<br><small>${p.lines.map(esc).join('<br>')}</small>` : ''}</td></tr>`).join('')}</table></details>
      ${a.d0 != null ? `<div class="row"><button class="mini" data-see="${esc(a.code)}" type="button">Ver en el mapa</button>${fichaGo(a, tr)}</div>` : ''}</div>`).join('')}</div>`;
  }
  h += `<div class="acts"><button class="btn full" data-a="bc3" type="button">${P ? 'Volver a cargar el BC3 (actualiza la parte de proyecto)' : 'Cargar el BC3 del presupuesto'}</button>
    ${tr ? `<button class="btn" data-a="trace" type="button">${ICON.road}Ver el camino</button>${goBtn(tr.f.start[0], tr.f.start[1], 'Ir al inicio')}` : ''}</div>
    <div class="field"><label>Umbral para proponer «Amplio» (longitud del tramo afectado)</label><div class="row"><input type="text" inputmode="decimal" data-umbral value="${fc.alcUmbral || 100}" style="max-width:110px"><span>m · por debajo se propone «Puntual»</span></div></div>
    <p class="hint">La parte de proyecto se rellena con las partidas del presupuesto: cada casilla marcada indica las partidas, la medición y el tramo de PK de donde sale. El alcance se propone con la longitud del KMZ de cada actuación; cámbialo si no es correcto.</p>`;
  return h;
}
const fmtEur = v => (Math.round((v || 0) * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
function fichaCasillaLabel(k) { if (k === 'aux') return 'auxiliar (transporte, carga…)'; if (k === 'F') return 'F. otras actuaciones'; const i = fichaItem(k); return i ? `${i.sec}. ${i.name}` : ''; }
function fichaGo(a, tr) { if (!tr || a.d0 == null) return ''; const p = pointAtPK(tr.f, a.d0); return p ? `<a class="mini" href="${navUrl(p.lat, p.lng)}" target="_blank" rel="noopener">Llévame al inicio</a>` : ''; }

function fichaItemHtml(fc, i) {
  const it = fc.items[i.k], p = it.proy, c = it.campo;
  const groups = (st, side) => i.groups.map(g => `<div class="fgrp">${chipHtml(g.opts, st.subs[g.k], `sub|${side}|${i.k}|${g.k}`)}</div>`).join('')
    + (i.diam && ((st.subs.inst || []).includes('Instalación')) ? `<div class="field"><label>Diámetro de instalación</label><input type="text" data-diam="${side}" value="${esc(st.diam || '')}" placeholder="p. ej. 400 mm"></div>` : '');
  const alc = (st, side) => i.noAlc ? '' : `<div class="field"><label>Alcance${side === 'proy' && p.alcFrom === 'auto' && p.alc ? ' <small>(propuesto por la longitud del tramo)</small>' : ''}</label>${segHtml(ALC, st.alc, `alc|${side}|${i.k}`)}</div>`;
  let h = `<div class="fcard ${p.on ? 'inproj' : ''} ${p.on && p.coin ? 'done ' + p.coin : ''}" data-item="${i.k}">
    <div class="fcard-h"><b>${esc(i.name)}</b>${p.on ? '<span class="tag p">En proyecto</span>' : '<span class="tag">No en proyecto</span>'}</div>`;
  if (p.on) {
    if (p.ev && p.ev.length) h += `<details class="fev"><summary>Según el presupuesto (${p.ev.length} partida${p.ev.length > 1 ? 's' : ''})</summary><ul>${p.ev.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`;
    h += groups(p, 'proy') + alc(p, 'proy')
      + `<div class="field"><label><b>¿Coincide con la realidad?</b></label>${segHtml(COINC, p.coin, `coin|${i.k}`)}</div>
      <div class="field"><label>Observaciones</label><textarea rows="2" data-obs="proy" placeholder="${p.coin && p.coin !== 'si' ? '¿Qué es distinto? Medición, tramo, tipo…' : ''}">${esc(p.obs || '')}</textarea></div>
      ${p.auto ? '' : '<button type="button" class="mini" data-projoff>Quitar de proyecto</button>'}`;
  } else h += `<button type="button" class="mini" data-projon>Marcar como de proyecto (memoria)</button>`;
  if (c.on) {
    h += `<div class="fcampo"><div class="fcard-h"><b>Detectado en campo</b><span class="tag c">No en proyecto</span></div>${groups(c, 'campo')}${alc(c, 'campo')}
      <div class="field"><label>Observaciones (justificación)</label><textarea rows="2" data-obs="campo">${esc(c.obs || '')}</textarea></div>
      <button type="button" class="mini del" data-campooff>Quitar</button></div>`;
  } else h += ` <button type="button" class="mini fadd" data-campoon>+ Detectado en campo (no en proyecto)</button>`;
  h += photoStrip(fc, i.k, i.name) + '</div>';
  return h;
}
function fichaOtrasMemHtml(fc) {
  return `<h3 class="sh">F. Otras actuaciones contempladas en la memoria</h3>
    <p class="hint">Se proponen las partidas del presupuesto que no tienen casilla en A–E. Añade las de la memoria que falten.</p>
    ${fc.otrasMem.map((r, k) => `<div class="fcard ${r.coin ? 'done ' + r.coin : ''}">
      <div class="field"><label>Actuación</label><input type="text" data-om="${k}|act" value="${esc(r.act || '')}"></div>
      ${r.ev ? `<p class="hint">Presupuesto: ${esc(r.ev)}</p>` : ''}
      <div class="field"><label>Alcance</label>${segHtml(ALC, r.alc, `om|${k}|alc`)}</div>
      <div class="field"><label><b>¿Coincide con la realidad?</b></label>${segHtml(COINC, r.coin, `om|${k}|coin`)}</div>
      <div class="field"><label>Observaciones</label><textarea rows="2" data-om="${k}|obs">${esc(r.obs || '')}</textarea></div>
      ${photoStrip(fc, 'F' + (r.src || r.id || k), r.act || 'Otra actuación')}
      <button type="button" class="mini del" data-omdel="${k}">Quitar</button></div>`).join('') || '<p class="empty">Sin otras actuaciones.</p>'}
    <div class="acts"><button class="btn full" data-a="omadd" type="button">${ICON.plus}Añadir actuación de la memoria</button></div>`;
}
function fichaInsituHtml(fc, tr) {
  const I = fc.insitu;
  return `<h3 class="sh">Otras actuaciones no contempladas en la memoria y detectadas in situ</h3>
    ${segHtml([['si', 'Sí (justificar)'], ['no', 'No']], I.hay, 'hay')}
    ${I.rows.map((r, k) => `<div class="fcard">
      <div class="field"><label>Actuación</label><input type="text" data-is="${k}|act" value="${esc(r.act || '')}" placeholder="p. ej. Paso salvacunetas en acceso a finca"></div>
      <div class="field"><label>Alcance</label>${segHtml(ALC, r.alc, `is|${k}|alc`)}</div>
      <div class="field"><label>Observaciones (justificación y medición estimada)</label><textarea rows="2" data-is="${k}|obs">${esc(r.obs || '')}</textarea></div>
      <div class="row"><button type="button" class="mini" data-isgps="${k}">${ICON.locate}${r.lat != null ? 'Situada' + (r.pk != null ? ' en PK ' + fmtPK(r.pk) : '') + ' · volver a situar' : 'Situar aquí (GPS)'}</button>${r.lat != null ? `<button type="button" class="mini" data-issee="${k}">Ver</button>` : ''}</div>
      ${photoStrip(fc, 'G' + r.id, r.act || 'Actuación detectada in situ')}
      <button type="button" class="mini del" data-isdel="${k}">Quitar</button></div>`).join('')}
    <div class="acts"><button class="btn go full" data-a="isadd" type="button">${ICON.plus}Añadir actuación detectada in situ</button></div>
    ${tr ? '' : '<p class="hint">Sin la traza del camino en la obra no se puede calcular el PK.</p>'}`;
}
function fichaMedRows(fc, tr) { // un PK cada 100 m hasta pasar el final del camino (sin traza: hasta 3+000, como la ficha en papel)
  const n = Math.max(1, Math.ceil((tr ? tr.f.length : 3000) / 100 - 1e-6));
  return Array.from({ length: n }, (_, i) => (i + 1) * 100);
}
function fichaMedHtml(fc, tr) {
  const rows = fichaMedRows(fc, tr);
  const hasW = tr && tr.rec.widths && tr.rec.widths[tr.fi];
  return `<h3 class="sh">Comprobación de mediciones</h3>
    <div class="acts"><button class="btn pri full" data-a="whereami" type="button">${ICON.locate}¿En qué PK estoy?</button>
    ${hasW ? '<button class="btn full" data-a="fromw" type="button">Rellenar con los anchos medidos en la app</button>' : ''}</div>
    <table class="ftable"><tr><th>P.K.</th><th>Ancho medio (m)</th></tr>
    ${rows.map(d => `<tr data-pkrow="${d}"><td>${fmtPK(d)}</td><td><input type="text" inputmode="decimal" data-ancho="${d}" value="${esc(fc.anchos[d] ?? '')}"></td></tr>`).join('')}</table>
    <p class="hint">${tr ? `El camino mide ${fmtLen(tr.f.length)}. ` : ''}Con «¿En qué PK estoy?» la app marca la fila más cercana a tu posición. También puedes medir con la herramienta «Anchos» de la traza y traer los valores aquí.</p>`;
}
function fichaCondHtml(fc, key, Q, title, tr) {
  const S = fc[key];
  const q = ([k, label, kind, extra]) => {
    let w = '';
    if (kind === 'pend') w = segHtml(PEND, S[k], `c|${k}`);
    else if (kind === 'yn') w = segHtml(YESNO, S[k], `c|${k}`);
    else if (kind === 'sumin') w = chipHtml(SUMIN, S[k], `cm|${k}`);
    if (extra === 'tiempo' && S[k] === 'si') w += `<input type="text" data-ct="tiempo" value="${esc(S.tiempo || '')}" placeholder="Tiempo aproximado (p. ej. 20 min)">`;
    if (extra === 'adecTipos' && S[k] === 'si') w += chipHtml(ADEC, S.adecTipos, 'cm|adecTipos') + ((S.adecTipos || []).includes('Otras') ? `<input type="text" data-ct="adecOtras" value="${esc(S.adecOtras || '')}" placeholder="¿Qué otras?">` : '');
    return `<div class="field fq"><label>${esc(label)}</label>${w}</div>`;
  };
  let extra = '';
  if (key === 'zona' && tr) {
    const rep = afecLast(); const n = rep ? rep.rows.filter(r => r.layerId === tr.rec.id && r.fi === tr.fi).length : null;
    extra = rep ? `<p class="hint">Informe de afecciones de la obra: ${n ? `<b>${n} afecciones</b> en esta traza` : 'sin afecciones en esta traza'} (${new Date(rep.date).toLocaleDateString('es-ES')}).</p>`
      : '<p class="hint">Puedes generar el informe de afecciones de esta traza en Herramientas → Informe de afecciones.</p>';
  }
  return `<h3 class="sh">${title}</h3>${Q.map(q).join('')}
    <div class="field"><label>Observaciones</label><textarea rows="2" data-ct="obs">${esc(S.obs || '')}</textarea></div>
    ${photoStrip(fc, key, title)}${extra}
    ${tr ? `<div class="acts"><button class="btn full" data-a="slope" type="button">${ICON.slope}Ver la pendiente de la traza</button></div>` : ''}`;
}
function fichaRecHtml(fc) {
  return `<h3 class="sh">Estimación de recursos y tiempo de ejecución</h3>
    ${fc.recursos.map((r, k) => `<div class="fcard">${segHtml([['trab', 'Trabajadores'], ['maq', 'Maquinaria']], r.tipo, `r|${k}`)}
      <div class="field"><label>${r.tipo === 'maq' ? 'Tipo, tonelaje, orugas/ruedas, implementos…' : 'Categoría'}</label><input type="text" data-r="${k}|desc" value="${esc(r.desc || '')}"></div>
      <div class="row"><div class="field"><label>Número</label><input type="text" inputmode="numeric" data-r="${k}|num" value="${esc(r.num || '')}"></div>
      <div class="field"><label>Tiempo en obra (jornadas)</label><input type="text" inputmode="decimal" data-r="${k}|jor" value="${esc(r.jor || '')}"></div></div>
      <div class="field"><label>Observaciones</label><input type="text" data-r="${k}|obs" value="${esc(r.obs || '')}"></div>
      <button type="button" class="mini del" data-rdel="${k}">Quitar</button></div>`).join('') || '<p class="empty">Añade trabajadores y maquinaria.</p>'}
    <div class="acts"><button class="btn" data-a="radd" data-t="trab" type="button">${ICON.plus}Trabajadores</button><button class="btn" data-a="radd" data-t="maq" type="button">${ICON.plus}Maquinaria</button></div>`;
}
function fichaPending(fc) {
  const out = [];
  if (!fc.general.responsable) out.push('Responsable de la inspección');
  if (!fc.general.fecha) out.push('Fecha de inspección');
  FICHA_ITEMS.forEach(i => { if (fc.items[i.k].proy.on && !fc.items[i.k].proy.coin) out.push(`${i.sec}. ${i.name}: ¿coincide con la realidad?`); });
  fc.otrasMem.forEach(r => { if (r.act && !r.coin) out.push(`F. ${r.act}: ¿coincide con la realidad?`); });
  if (!fc.insitu.hay) out.push('Otras actuaciones detectadas in situ: Sí / No');
  if (!Object.values(fc.anchos).some(v => String(v).trim())) out.push('Comprobación de mediciones (anchos)');
  if (!fc.recursos.length) out.push('Estimación de recursos');
  return out;
}
function fichaExpHtml(fc) {
  const pend = fichaPending(fc);
  return `<h3 class="sh">Revisión y exportación</h3>
    ${pend.length ? `<div class="fwarn"><b>Queda por rellenar:</b><ul>${pend.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : '<p class="fok">Ficha completa.</p>'}
    <div class="acts"><button class="btn pri full" data-a="html" type="button">Ficha para imprimir o guardar en PDF</button>
      <button class="btn full" data-a="json" type="button">Datos para la revisión del presupuesto (JSON)</button></div>
    <p class="hint">La ficha impresa reproduce la ficha oficial (PROYECTO / CAMPO) y añade las fotos con su PK y, como anexo, las partidas del presupuesto con la casilla a la que se han asignado. La ficha viaja también en el paquete de la obra (Obras → Exportar / compartir).</p>
    <div class="acts"><button class="btn del full" data-a="del" type="button">Borrar esta ficha</button></div>`;
}

/* ---------------- Eventos del formulario ---------------- */
function fichaWire(fc, tr, body, save) {
  const $$ = s => body.querySelectorAll(s);
  const rerender = () => { const sc = $('#sheet').scrollTop; fichaRenderTab(fc, tr); fichaRefresh(fc); $('#sheet').scrollTop = sc; };
  // datos
  $$('[data-g]').forEach(i => i.oninput = () => { fc.general[i.dataset.g] = i.value; if (i.dataset.g === 'municipio') fc.general.municipioAuto = false; if (i.dataset.g === 'responsable') { settings.fichaResp = i.value; saveSettings(); } save(); });
  const hoy = body.querySelector('[data-a=hoy]'); if (hoy) hoy.onclick = () => { const d = new Date(); fc.general.fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; save(); rerender(); };
  const bc3 = body.querySelector('[data-a=bc3]'); if (bc3) bc3.onclick = () => fichaPickBC3(fc);
  const um = body.querySelector('[data-umbral]'); if (um) um.onchange = () => {
    const v = parseNum(um.value); if (!(v > 0)) return; fc.alcUmbral = v;
    if (fc.proyecto && fc.bc3Text) { const b = parseBC3(fc.bc3Text); const cam = bc3Caminos(b).find(c => c.code === fc.proyecto.camino); if (cam) fichaFromBC3(fc, b, cam, fc.proyecto.file); }
    save(); toast('Alcances propuestos recalculados.');
  };
  const trc = body.querySelector('[data-a=trace]'); if (trc) trc.onclick = () => { fichaLeave(); map.fitBounds(L.polyline(lineParts(tr.f).flatMap(p => p.c)).getBounds().pad(0.15)); };
  $$('[data-see]').forEach(bt => bt.onclick = () => {
    const a = fc.proyecto.acts.find(x => x.code === bt.dataset.see); if (!a || !tr) return;
    fichaLeave(); fichaHL.clearLayers();
    const c = segmentCoords(tr.f, a.d0, Math.max(a.d1, a.d0 + 1));
    const pl = L.polyline(c, { renderer: hlRenderer, color: '#fff', weight: 10, opacity: 0.8, interactive: false }).addTo(fichaHL);
    L.polyline(c, { renderer: hlRenderer, color: '#e8590c', weight: 5, interactive: false }).bindTooltip(`${a.code} · PK ${fmtPK(a.d0)}–${fmtPK(a.d1)}`, { permanent: true }).addTo(fichaHL);
    map.fitBounds(pl.getBounds().pad(0.6), { maxZoom: 19 });
    setTimeout(() => fichaHL.clearLayers(), 30000);
  });
  // casillas: marcar en proyecto / detectado en campo, observaciones y diámetro
  $$('[data-item]').forEach(card => {
    const it = fc.items[card.dataset.item];
    card.querySelectorAll('[data-obs]').forEach(t => t.oninput = () => { it[t.dataset.obs].obs = t.value; save(); });
    card.querySelectorAll('[data-diam]').forEach(t => t.oninput = () => { it[t.dataset.diam].diam = t.value; save(); });
    const pon = card.querySelector('[data-projon]'); if (pon) pon.onclick = () => { it.proy.on = true; it.proy.auto = false; save(); rerender(); };
    const pof = card.querySelector('[data-projoff]'); if (pof) pof.onclick = () => { it.proy = { on: false, subs: {}, alc: '', coin: '', obs: it.proy.obs, ev: [] }; save(); rerender(); };
    const con = card.querySelector('[data-campoon]'); if (con) con.onclick = () => { it.campo.on = true; save(); rerender(); };
    const cof = card.querySelector('[data-campooff]'); if (cof) cof.onclick = () => { if (it.campo.obs && !confirm('¿Quitar lo anotado como detectado en campo?')) return; it.campo = { on: false, subs: {}, alc: '', obs: '' }; save(); rerender(); };
  });
  // botones de una opción: tocar otra vez la opción marcada la desmarca
  const cobj = fichaState.tab === 'acc' ? fc.acceso : fc.zona;
  $$('[data-seg] [data-v]').forEach(bt => bt.onclick = () => {
    const key = bt.parentElement.dataset.seg.split('|'), v = bt.dataset.v;
    const tog = (o, f) => { o[f] = o[f] === v ? '' : v; };
    switch (key[0]) {
      case 'coin': tog(fc.items[key[1]].proy, 'coin'); break;
      case 'alc': { const st = fc.items[key[2]][key[1]]; tog(st, 'alc'); if (key[1] === 'proy') st.alcFrom = 'user'; break; }
      case 'om': tog(fc.otrasMem[+key[1]], key[2]); break;
      case 'is': tog(fc.insitu.rows[+key[1]], key[2]); break;
      case 'hay': tog(fc.insitu, 'hay'); if (fc.insitu.hay === 'si' && !fc.insitu.rows.length) fc.insitu.rows.push({ id: uid(), act: '', alc: '', obs: '' }); break;
      case 'c': tog(cobj, key[1]); break;
      case 'r': fc.recursos[+key[1]].tipo = v; break;
    }
    save(); rerender();
  });
  // botones de varias opciones (en grupos «one», como bajo/medio/alto, solo una)
  $$('[data-chips] [data-v]').forEach(bt => bt.onclick = () => {
    const key = bt.parentElement.dataset.chips.split('|'), o = bt.dataset.v;
    let obj, f, one = false;
    if (key[0] === 'sub') { const st = fc.items[key[2]][key[1]]; obj = st.subs; f = key[3]; one = !!fichaItem(key[2]).groups.find(g => g.k === f).one; }
    else { obj = cobj; f = key[1]; }
    const cur = obj[f] || [];
    obj[f] = cur.includes(o) ? cur.filter(x => x !== o) : one ? [o] : [...cur, o];
    save(); rerender();
  });
  // F
  $$('[data-om]').forEach(i => i.oninput = () => { const [k, f] = i.dataset.om.split('|'); fc.otrasMem[k][f] = i.value; save(); });
  $$('[data-omdel]').forEach(bt => bt.onclick = () => { if (!confirm('¿Quitar esta actuación de la ficha?')) return; fc.otrasMem.splice(+bt.dataset.omdel, 1); save(); rerender(); });
  const omadd = body.querySelector('[data-a=omadd]'); if (omadd) omadd.onclick = () => { fc.otrasMem.push({ id: uid(), act: '', alc: '', coin: '', obs: '' }); save(); rerender(); };
  // G (in situ)
  $$('[data-is]').forEach(i => i.oninput = () => { const [k, f] = i.dataset.is.split('|'); fc.insitu.rows[k][f] = i.value; save(); });
  $$('[data-isdel]').forEach(bt => bt.onclick = () => { if (!confirm('¿Quitar esta actuación?')) return; fc.insitu.rows.splice(+bt.dataset.isdel, 1); save(); rerender(); });
  const isadd = body.querySelector('[data-a=isadd]'); if (isadd) isadd.onclick = () => { fc.insitu.hay = 'si'; fc.insitu.rows.push({ id: uid(), act: '', alc: '', obs: '' }); save(); rerender(); };
  $$('[data-isgps]').forEach(bt => bt.onclick = async () => {
    toast('Obteniendo posición GPS…', 4000);
    try { const p = await getPos(), r = fc.insitu.rows[+bt.dataset.isgps]; r.lat = p.lat; r.lng = p.lng; r.acc = p.acc; r.pk = tr ? Math.round(pkAt(tr.f, L.latLng(p.lat, p.lng)).d) : null; save(); rerender(); toast(r.pk != null ? `Situada en PK ${fmtPK(r.pk)}` : 'Situada'); }
    catch (e) { toast(geoErr(e), 6000); }
  });
  $$('[data-issee]').forEach(bt => bt.onclick = () => { const r = fc.insitu.rows[+bt.dataset.issee]; fichaLeave(); fichaHL.clearLayers(); L.circleMarker([r.lat, r.lng], { renderer: hlRenderer, radius: 12, color: '#e8590c', weight: 4, interactive: false }).bindTooltip(r.act || 'Actuación in situ', { permanent: true }).addTo(fichaHL); map.setView([r.lat, r.lng], 19); });
  // mediciones
  $$('[data-ancho]').forEach(i => i.oninput = () => { fc.anchos[i.dataset.ancho] = i.value.replace('.', ','); save(); });
  const wai = body.querySelector('[data-a=whereami]'); if (wai) wai.onclick = async () => {
    if (!tr) { toast('No está la traza del camino en la obra.'); return; }
    toast('Obteniendo posición GPS…', 4000);
    try {
      const p = await getPos(), r = pkAt(tr.f, L.latLng(p.lat, p.lng));
      const row = Math.min(Math.max(100, Math.round(r.d / 100) * 100), Math.ceil(tr.f.length / 100) * 100);
      $$('[data-pkrow]').forEach(x => x.classList.toggle('here', +x.dataset.pkrow === row));
      const inp = body.querySelector(`[data-ancho="${row}"]`); if (inp) { inp.scrollIntoView({ block: 'center' }); inp.focus(); }
      toast(`Estás en el PK ${fmtPK(r.d)}${r.off > 30 ? ` (a ${Math.round(r.off)} m del eje)` : ''}`, 5000);
    } catch (e) { toast(geoErr(e), 6000); }
  };
  const fw = body.querySelector('[data-a=fromw]'); if (fw) fw.onclick = () => {
    const segs = widthSegments(tr.rec.widths[tr.fi], tr.f); let n = 0;
    $$('[data-ancho]').forEach(i => { const w = widthAt(segs, Math.min(+i.dataset.ancho, tr.f.length)); if (w != null) { fc.anchos[i.dataset.ancho] = (Math.round(w * 100) / 100).toString().replace('.', ','); n++; } });
    save(); rerender(); toast(`${n} anchos rellenados.`);
  };
  // condicionantes
  $$('[data-ct]').forEach(i => i.oninput = () => { cobj[i.dataset.ct] = i.value; save(); });
  const sl = body.querySelector('[data-a=slope]'); if (sl) sl.onclick = () => { fichaLeave(); slopeScrollToClass = true; slopeSheet(tr.f, tr.rec, 0, tr.f.length, { autorun: true }); fichaBack.hidden = false; };
  // recursos
  $$('[data-r]').forEach(i => i.oninput = () => { const [k, f] = i.dataset.r.split('|'); fc.recursos[k][f] = i.value; save(); });
  $$('[data-rdel]').forEach(bt => bt.onclick = () => { fc.recursos.splice(+bt.dataset.rdel, 1); save(); rerender(); });
  $$('[data-a=radd]').forEach(bt => bt.onclick = () => { fc.recursos.push({ tipo: bt.dataset.t, desc: '', num: '', jor: '', obs: '' }); save(); rerender(); });
  // fotos
  $$('[data-photo]').forEach(bt => bt.onclick = () => fichaPhoto(fc, tr, bt.dataset.photo, bt.dataset.plabel));
  $$('img[data-full]').forEach(img => { img.onclick = () => { if (Date.now() - longPressAt > 800) showPhoto(img.src); }; onLongPress(img, () => fichaPhotoMenu(fc, img.dataset.nid)); });
  // exportar
  const eh = body.querySelector('[data-a=html]'); if (eh) eh.onclick = async () => { toast('Preparando la ficha…', 10000); const h = await fichaHtml(fc); saveBlob(new Blob([h], { type: 'text/html' }), `Ficha_${safeName(fc.code)}.html`).then(() => toast('Ficha lista. Ábrela en el navegador e imprime en PDF.', 6000)).catch(() => {}); };
  const ej = body.querySelector('[data-a=json]'); if (ej) ej.onclick = () => saveBlob(new Blob([JSON.stringify(fichaJson(fc), null, 1)], { type: 'application/json' }), `Ficha_${safeName(fc.code)}.json`).catch(() => {});
  const ed = body.querySelector('[data-a=del]'); if (ed) ed.onclick = async () => {
    if (!confirm(`¿Borrar la ficha ${fc.code}? Las fotos se quedan como anotaciones en el mapa.`)) return;
    const fcs = await fichasOf(fc.obraId); delete fcs[fc.code]; await DB.put('kv', fcs, 'ficha:' + fc.obraId); closeSheet(); toast('Ficha borrada');
  };
}

// Foto de una casilla: cámara + GPS en paralelo; se guarda como anotación enlazada a la ficha (se ve en el mapa)
function fichaPhoto(fc, tr, ref, label) {
  const posP = getPos().catch(() => null);
  capture('inPhoto', async files => {
    const p = await posP; let at = p ? { lat: p.lat, lng: p.lng, acc: p.acc } : null;
    if (!at) { toast('Sin señal GPS: la foto se sitúa en el centro del mapa.', 6000); const c = map.getCenter(); at = { lat: c.lat, lng: c.lng }; }
    const pk = tr ? pkAt(tr.f, L.latLng(at.lat, at.lng)) : null;
    const title = `Ficha ${fc.code} · ${label}${pk && pk.off < 80 ? ' · PK ' + fmtPK(pk.d) : ''}`;
    for (const f of files) {
      let blob = await processImage(f, { ...at, label: title });
      blob = await writeExif(blob, { lat: at.lat, lng: at.lng, date: Date.now(), desc: title });
      const n = { id: uid(), obraId: settings.activeObra, layerId: null, lat: at.lat, lng: at.lng, acc: at.acc ?? null, src: p ? 'gps' : 'mapa', title, text: '',
        created: Date.now(), media: [{ id: uid(), kind: 'photo', blob, mime: blob.type || 'image/jpeg', t: Date.now() }], ficha: { code: fc.code, ref, pk: pk ? Math.round(pk.d) : null } };
      try { await DB.put('notes', n); notes.set(n.id, n); drawNote(n); } catch (e) { toast('No se pudo guardar la foto: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
    }
    fichaOpen(fc.code, fichaState.tab, null, $('#sheet').hidden ? fichaState.scroll : $('#sheet').scrollTop);
    toast('Foto guardada en la ficha' + (pk && pk.off < 80 ? ` (PK ${fmtPK(pk.d)})` : ''));
  });
}
function fichaPhotoMenu(fc, nid) {
  const n = notes.get(nid); if (!n) return;
  if (!confirm(`¿Quitar la foto «${n.title}» de la ficha? Seguirá como anotación en el mapa.`)) return;
  delete n.ficha; DB.put('notes', n); fichaOpen(fc.code, fichaState.tab, null, $('#sheet').scrollTop);
}

/* ---------------- Exportación ---------------- */
async function thumbData(blob, max = 900) {
  try {
    const bmp = await createImageBitmap(blob); const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.72);
  } catch (e) { return ''; }
}
function fichaJson(fc) {
  const tr = fichaTrace(fc);
  const fotos = [...notes.values()].filter(n => n.ficha && n.ficha.code === fc.code).map(n => ({ titulo: n.title, casilla: n.ficha.ref, pk_m: n.ficha.pk, lat: n.lat, lng: n.lng, fecha: new Date(n.created).toISOString() }));
  const items = {}; FICHA_ITEMS.forEach(i => { const it = fc.items[i.k]; if (it.proy.on || it.campo.on) items[i.k] = { seccion: i.sec, casilla: i.name, proyecto: it.proy.on ? { opciones: it.proy.subs, diametro: it.proy.diam, alcance: it.proy.alc, coincide: it.proy.coin, observaciones: it.proy.obs, presupuesto: it.proy.ev } : null, campo: it.campo.on ? { opciones: it.campo.subs, diametro: it.campo.diam, alcance: it.campo.alc, observaciones: it.campo.obs } : null }; });
  return { formato: 'OBRA-GIS-FICHA-INSPECCION', version: 1, app_version: APP_VERSION, exportado: new Date().toISOString(), obra: (obras.get(fc.obraId) || {}).name || '',
    camino: fc.code, longitud_traza_m: tr ? Math.round(tr.f.length) : null, datos_generales: fc.general, casillas: items,
    otras_memoria: fc.otrasMem, detectadas_in_situ: fc.insitu, anchos_por_pk: fc.anchos, vias_de_acceso: fc.acceso, zona_de_actuacion: fc.zona, recursos: fc.recursos,
    presupuesto: fc.proyecto ? { fichero: fc.proyecto.file, expediente: fc.proyecto.root, camino: fc.proyecto.camino, importe: fc.proyecto.total,
      actuaciones: fc.proyecto.acts.map(a => ({ codigo: a.code, resumen: a.summary, importe: a.total, pk_inicio_m: a.d0, pk_fin_m: a.d1,
        partidas: a.partidas.map(p => ({ codigo: p.code, ud: p.unit, resumen: p.summary, medicion: p.qty, precio: p.price, importe: p.amount, casilla: p.casilla, lineas: p.lines })) })) } : null,
    fotos };
}
async function fichaHtml(fc) {
  const E = esc, g = fc.general, tr = fichaTrace(fc);
  const X = on => on ? '☒' : '☐';
  const opts = (st, grp) => grp.opts.map(o => `${X((st.subs[grp.k] || []).includes(o))} ${E(o)}`).join('&nbsp;&nbsp; ');
  const alcH = st => `${X(st.alc === 'amplio')} Amplio<br>${X(st.alc === 'puntual')} Puntual`;
  const coinH = st => `${X(st.coin === 'si')} Sí<br>${X(st.coin === 'no')} No<br>${X(st.coin === 'parcial')} Parcialmente`;
  const itemRows = i => {
    const it = fc.items[i.k], p = it.proy, c = it.campo;
    const body = st => `<b>${X(st.on)} ${E(i.name)}</b>${i.groups.map(gr => `<div class="o">${opts(st, gr)}</div>`).join('')}${i.diam ? `<div class="o">Diámetro: ${E(st.diam || '')}</div>` : ''}`;
    return `<tr class="${p.on ? 'pon' : ''}"><th class="v">PROYECTO</th><td>${body(p)}${p.on && p.ev.length ? `<div class="ev">Presupuesto: ${p.ev.map(E).join('<br>')}</div>` : ''}</td><td>${i.noAlc ? '' : alcH(p)}</td><td>${coinH(p)}</td><td>${E(p.obs || '')}</td></tr>
      <tr class="${c.on ? 'con' : ''}"><th class="v">CAMPO<br><small>(no en proyecto)</small></th><td>${body(c)}</td><td>${i.noAlc ? '' : alcH(c)}</td><td class="na"></td><td>${E(c.obs || '')}</td></tr>`;
  };
  const head = '<colgroup><col style="width:72px"><col><col style="width:92px"><col style="width:112px"><col style="width:24%"></colgroup><tr><th></th><th>Actuación</th><th>Alcance</th><th>¿Coincide con la realidad?</th><th>Observaciones</th></tr>';
  const yn = v => `${X(v === 'si')} Sí &nbsp; ${X(v === 'no')} No`;
  const pd = v => PEND.map(([k, t]) => `${X(v === k)} ${t}`).join(' &nbsp; ');
  const sm = v => SUMIN.map(s => `${X((v || []).includes(s))} ${E(s)}`).join(' &nbsp; ');
  const cond = (S, Q) => `<table>${Q.map(([k, label, kind, extra]) => `<tr><td style="width:45%">${E(label)}</td><td>${kind === 'pend' ? pd(S[k]) : kind === 'yn' ? yn(S[k]) : sm(S[k])}${extra === 'tiempo' ? ` &nbsp; Tiempo aprox.: ${E(S.tiempo || '')}` : ''}${extra === 'adecTipos' ? `<br>${ADEC.map(a => `${X((S.adecTipos || []).includes(a))} ${E(a)}`).join(' &nbsp; ')}${S.adecOtras ? ': ' + E(S.adecOtras) : ''}` : ''}</td></tr>`).join('')}${S.obs ? `<tr><td>Observaciones</td><td>${E(S.obs)}</td></tr>` : ''}</table>`;
  const rows = fichaMedRows(fc, tr); const cols = 3, per = Math.ceil(rows.length / cols);
  const med = `<table class="med"><tr>${Array.from({ length: cols }, () => '<th>P.K.</th><th>ANCHO MEDIO (m)</th>').join('')}</tr>${Array.from({ length: per }, (_, r) => `<tr>${Array.from({ length: cols }, (_, c) => { const d = rows[c * per + r]; return d != null ? `<td>${fmtPK(d)}</td><td>${E(fc.anchos[d] ?? '')}</td>` : '<td></td><td></td>'; }).join('')}</tr>`).join('')}</table>`;
  const fotos = [...notes.values()].filter(n => n.ficha && n.ficha.code === fc.code).sort((a, b) => a.created - b.created);
  const fotoHtml = []; for (const n of fotos) { const m = (n.media || [])[0]; if (!m) continue; fotoHtml.push(`<figure><img src="${await thumbData(m.blob)}"><figcaption>${E(n.title)}<br><small>${fmtDate(n.created)} · ${fmtLL(n.lat, n.lng)}</small></figcaption></figure>`); }
  const P = fc.proyecto;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ficha de inspección · ${E(fc.code)}</title>
<style>body{font:12px/1.35 Arial,Helvetica,sans-serif;color:#111;max-width:1000px;margin:20px auto;padding:0 14px}.cab{font-size:11px;text-align:center;font-weight:700;border-bottom:2px solid #0b3d2e;padding-bottom:6px}
h1{font-size:18px;text-align:center;margin:12px 0}h2{font-size:14px;background:#0b3d2e;color:#fff;padding:5px 8px;margin:18px 0 6px}h3{font-size:13px;margin:12px 0 4px}
table{border-collapse:collapse;width:100%;margin:4px 0 10px;table-layout:fixed}td{overflow-wrap:anywhere}th,td{border:1px solid #888;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eef3f0}th.v{width:70px;font-size:11px;text-align:center;vertical-align:middle}
td.na{background:#f3f3f3}.o{margin-top:3px;font-size:11px}.ev{margin-top:4px;font-size:10px;color:#444;border-top:1px dashed #bbb;padding-top:3px}tr.pon th.v{background:#d3f0de}tr.con th.v{background:#ffe8cc}
table.med td,table.med th{text-align:center}figure{display:inline-block;width:31%;margin:0 1% 10px;vertical-align:top;break-inside:avoid}figure img{width:100%;border:1px solid #ccc}figcaption{font-size:10px}
small{color:#555}.pie{font-size:10px;color:#555;margin-top:20px;border-top:1px solid #ccc;padding-top:4px}@media print{body{margin:0;max-width:none}h2{break-after:avoid}tr{break-inside:avoid}}</style></head><body>
<div class="cab">${E(FICHA_HEAD)}</div><h1>${E(FICHA_TITLE)}</h1>
<h2>DATOS GENERALES</h2><table><tr><td style="width:30%">Municipio</td><td>${E(g.municipio)}</td></tr><tr><td>Código Expediente</td><td>${E(g.expediente)}</td></tr><tr><td>Código Actuación</td><td>${E(g.actuacion)}</td></tr>
<tr><td>Responsable de la inspección</td><td>${E(g.responsable)}</td></tr><tr><td>Fecha de Inspección</td><td>${E((g.fecha || '').split('-').reverse().join('/'))}</td></tr></table>
<h2>ACTUACIONES – COMPROBACIÓN</h2>
${FICHA_SECTIONS.map(s => `<h3>${s.id}. ${E(s.name.toUpperCase())}</h3><table>${head}${s.items.map(itemRows).join('')}</table>`).join('')}
<h3>F. OTRAS ACTUACIONES CONTEMPLADAS EN LA MEMORIA</h3><table><tr><th>Actuación</th><th>Alcance</th><th>¿Coincide con la realidad?</th><th>Observaciones</th></tr>
${(fc.otrasMem.length ? fc.otrasMem : [{}]).map(r => `<tr><td>${E(r.act || '')}${r.ev ? `<div class="ev">Presupuesto: ${E(r.ev)}</div>` : ''}</td><td>${alcH(r)}</td><td>${coinH(r)}</td><td>${E(r.obs || '')}</td></tr>`).join('')}</table>
<h3>OTRAS ACTUACIONES NO CONTEMPLADAS EN LA MEMORIA Y DETECTADAS IN SITU</h3><p>${X(fc.insitu.hay === 'si')} Sí (Justificar) &nbsp; ${X(fc.insitu.hay === 'no')} No</p>
<table><tr><th>Actuación</th><th>Alcance</th><th>Observaciones</th></tr>${(fc.insitu.rows.length ? fc.insitu.rows : [{}]).map(r => `<tr><td>${E(r.act || '')}${r.lat != null ? `<br><small>${r.pk != null ? 'PK ' + fmtPK(r.pk) + ' · ' : ''}${fmtLL(r.lat, r.lng)}</small>` : ''}</td><td>${alcH(r)}</td><td>${E(r.obs || '')}</td></tr>`).join('')}</table>
<h2>COMPROBACIÓN DE MEDICIONES</h2>${med}
<h2>UBICACIÓN Y CONDICIONANTES DE EJECUCIÓN</h2><h3>VÍAS DE ACCESO</h3>${cond(fc.acceso, ACCESO_Q)}<h3>ZONA DE ACTUACIÓN</h3>${cond(fc.zona, ZONA_Q)}
<h2>ESTIMACIÓN DE RECURSOS Y TIEMPO DE EJECUCIÓN</h2><table><tr><th>Recursos</th><th>Número</th><th>Tiempo estimado en obra (jornadas)</th><th>Observaciones</th></tr>
${(fc.recursos.length ? fc.recursos : [{}]).map(r => `<tr><td>${r.tipo ? (r.tipo === 'maq' ? 'Maquinaria: ' : 'Trabajadores: ') : ''}${E(r.desc || '')}</td><td>${E(r.num || '')}</td><td>${E(r.jor || '')}</td><td>${E(r.obs || '')}</td></tr>`).join('')}</table>
${fotoHtml.length ? `<h2>REPORTAJE FOTOGRÁFICO DE LA VISITA</h2>${fotoHtml.join('')}` : ''}
${P ? `<h2>ANEXO · PARTIDAS DEL PRESUPUESTO Y CASILLA ASIGNADA</h2><p>${E(P.file)} · ${E(P.camino)} ${E(P.caminoSummary)} · ${fmtEur(P.total)}</p>
${P.acts.map(a => `<h3>${E(a.code)} · ${E(a.summary)} <small>(${fmtEur(a.total)}${a.d0 != null ? ` · PK ${fmtPK(a.d0)}–${fmtPK(a.d1)}` : ''})</small></h3><table><tr><th>Código</th><th>Ud</th><th>Resumen</th><th>Medición</th><th>Casilla de la ficha</th></tr>
${a.partidas.map(p => `<tr><td>${E(p.code)}</td><td>${E(p.unit)}</td><td>${E(p.summary)}${p.lines.length ? `<br><small>${p.lines.map(E).join('<br>')}</small>` : ''}</td><td>${String(Math.round(p.qty * 100) / 100).replace('.', ',')}</td><td>${E(fichaCasillaLabel(p.casilla))}</td></tr>`).join('')}</table>`).join('')}` : ''}
<p class="pie">Ficha generada con OBRA-GIS v${E(APP_VERSION)} el ${fmtDate(Date.now())}. La parte de proyecto se ha rellenado a partir del presupuesto y debe comprobarse.</p>
</body></html>`;
}

/* ---------------- Paquete de obra ---------------- */
async function fichaPackExport(Z, obraId) {
  const fcs = await fichasOf(obraId), list = Object.values(fcs); if (!list.length) return 0;
  Z.file('datos/fichas_inspeccion.json', JSON.stringify(fcs));
  for (const fc of list) {
    if (obraId === settings.activeObra) { Z.file(`informes/ficha_${safeName(fc.code)}.html`, await fichaHtml(fc)); Z.file(`informes/ficha_${safeName(fc.code)}.json`, JSON.stringify(fichaJson(fc), null, 1)); }
    if (fc.bc3Text) Z.file(`presupuesto/${safeName(fc.proyecto && fc.proyecto.file ? fc.proyecto.file.replace(/\.bc3$/i, '') : fc.code)}.bc3`, fc.bc3Text);
  }
  return list.length;
}
async function fichaPackImport(zip, pre, obraId, idMap) {
  const f = zip.file(pre + 'datos/fichas_inspeccion.json'); if (!f) return 0;
  try {
    const fcs = JSON.parse(await f.async('string'));
    Object.values(fcs).forEach(fc => { fc.obraId = obraId; if (fc.layerId) fc.layerId = idMap[fc.layerId] || null; });
    await DB.put('kv', fcs, 'ficha:' + obraId); fichaCache[obraId] = fcs; return Object.keys(fcs).length;
  } catch (e) { return 0; }
}
