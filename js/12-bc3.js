'use strict';
/* OBRA-GIS · Exportación BC3 (FIEBDC-3) y base de precios.
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global). */
/* ---------------- Exportar mediciones a BC3 (FIEBDC-3) ----------------
   Cada tipo de actuación se asigna a una partida (código, unidad, precio). Se puede cargar una base de precios o un
   presupuesto en BC3 para elegir sus códigos. Cada actuación es una línea de medición con su PK y dimensiones. */
const BC3_UNITS = { m: 'm', m2: 'm2', m3: 'm3', t: 't', ud: 'ud', kg: 'kg' };
const BC3_DEC = { m: MEAS_DEC.L, m2: MEAS_DEC.area, m3: MEAS_DEC.vol, t: MEAS_DEC.t, ud: 0, kg: 0 }; // mismos decimales que en pantalla
const isUnit = u => typeof u === 'string' && Object.prototype.hasOwnProperty.call(BC3_UNITS, u);
const normUnit = u => { const x = String(u || '').toLowerCase().replace('²', '2').replace('³', '3').replace(/[\s.]/g, '');
  return ({ ml: 'm', mlin: 'm', u: 'ud', uds: 'ud', un: 'ud', und: 'ud', tn: 't', tm: 't', tonelada: 't', toneladas: 't', kgs: 'kg' })[x] || x; };
function defaultUnit(it) {
  if (ACT_POINT.has(it.name) && (it.fields.includes('n') || !it.fields.some(k => ['area', 'vol'].includes(k)))) return 'ud'; // puntuales que se cuentan (caño, arqueta, entronque, badén…) // badén, entronque…: se apuntan en un PK y se cuentan
  if (it.fields.includes('S')) return 'm2';
  if (it.fields.includes('h') && it.fields.includes('b')) return 'm3';
  if (it.fields.includes('w') && it.fields.includes('h')) return 'm3';
  if (/aglomerado/i.test(it.name)) return 't';
  if (it.fields.includes('e') && it.dens) return 'm3';
  if (it.fields.includes('dot') || (it.fields.includes('w') && !it.fields.includes('e')) || it.fields.includes('area')) return 'm2';
  if (it.fields.includes('w') && it.fields.includes('e')) return 'm2';
  if (it.fields.includes('n')) return 'ud'; // caños, arquetas…: por unidad
  if (it.fields.includes('lt')) return 'm';
  return 'm';
}
// Código propio de una partida: OG + nº del tipo en el catálogo; los tipos antiguos o personalizados llevan uno derivado de su nombre
function bc3AutoCode(type) {
  const i = ACT_ITEMS.findIndex(x => x.name === type);
  if (i >= 0) return 'OG' + String(i + 1).padStart(3, '0');
  let h = 0; for (const ch of String(type)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return 'OGX' + h.toString(36).toUpperCase().padStart(7, '0'); // completo: dos nombres parecidos no comparten código
}
const bc3Code = s => String(s || '').normalize('NFC').replace(/[^\x21-\x7e\xa1-\xff]|[#|\\~]/g, '').slice(0, 20); // solo caracteres que caben en ANSI
function bc3Map(type) {
  const it = actItem(type), m = (settings.bc3Map || {})[type] || {}, auto = bc3AutoCode(type);
  const code = bc3Code(m.code) && bc3Code(m.code) !== auto ? bc3Code(m.code) : '';
  const price = typeof m.price === 'number' && isFinite(m.price) && m.price >= 0 && m.price < 1e9 ? m.price : 0;
  const du = defaultUnit(it), stale = m.unit === 'm' && du === 'ud' && ACT_POINT.has(it.name); // badén y demás puntuales guardados en «m» por versiones antiguas (salían 0)
  return { code: code || auto, unit: isUnit(m.unit) && !stale ? m.unit : du, price, summary: typeof m.summary === 'string' && m.summary ? m.summary : type, own: !!code, auto };
}
const bc3Round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
// Cantidad y línea de medición de una actuación en la unidad elegida. Las dimensiones de la línea reproducen siempre la
// cantidad (unidades × longitud × anchura × altura); si no se puede, la cantidad va entera en «unidades».
function actQty(a, unit) {
  const it = actItem(a.type), m = actMeasure(a), p = a.params || {}, L = bc3Round(Math.max(0, a.d1 - a.d0), 2), N = m.sides || 1;
  const com = `${a.traceName || ''} PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? '-' + fmtPK(a.d1) : ''} ${SIDE_ABBR[a.side] || ''}${p.mat ? ' ' + p.mat : ''}`.replace(/\s+/g, ' ').trim();
  const pos = k => (isFinite(p[k]) && p[k] > 0 ? +p[k] : null);
  const fF = it.forma ? (ACT_FORMS[p.forma || 'tri'] || ACT_FORMS.tri)[1] : 1;
  const A = [[N, L, pos('w')], [1, L, pos('w')], [N, L, pos('b')], [N * fF, L, pos('S')]];
  const V = [...A.map(c => [...c, pos('e') ? pos('e') / 100 : null]), [N, L, pos('b'), pos('h')], [1, L, pos('w'), pos('h')]];
  const dens = it.dens || 0, dot = pos('dot') || 0;
  let q = 0, C = [];
  switch (unit) {
    case 'm': q = m.tubo || m.Lm || m.L || 0; C = [[N, L], [1, L], [pos('n'), pos('lt')]]; break;
    case 'm2': q = m.area || 0; C = A; break;
    case 'm3': q = m.vol || 0; C = V; break;
    case 't': q = m.t || 0; C = V.map(c => [c[0] * dens, ...c.slice(1)]); break;
    case 'kg': q = m.kg || 0; C = A.map(c => [c[0] * dot, ...c.slice(1)]); break;
    case 'ud': q = m.n || 1; C = []; break; // por unidad: cada actuación cuenta 1 si no tiene número
  }
  let dims = null, qr = bc3Round(q, 3);
  if (qr > 0) for (const c of C) {
    if (c.some(x => !(x > 0))) continue;
    const cr = c.map((x, i) => bc3Round(x, i === 0 ? 4 : i === 1 ? 2 : 3)), prod = cr.reduce((s, x) => s * x, 1);
    if (Math.abs(prod - q) <= Math.max(0.01, q * 5e-4)) { dims = cr; qr = bc3Round(prod, 3); break; }
  }
  if (!dims) dims = [qr];
  while (dims.length < 4) dims.push('');
  if (dims[0] === 1 && dims[1] !== '') dims[0] = '';
  return { com, n: dims[0], lo: dims[1], an: dims[2], al: dims[3], q: qr };
}
const ACT_POINT = new Set(['Badén', 'Paso salvacunetas', 'Arqueta / pozo', 'Caño / obra de drenaje', 'Boquilla / aletas', 'Acceso a finca', 'Entronque / intersección', 'Señalización vertical', 'Bacheo', 'Limpieza de obra de drenaje', 'Demolición de obra de fábrica', 'Tala y poda de arbolado', 'Otro']); // se apuntan en un solo PK
const it_road = a => !!actItem(a.type).road;
const bc3Num = v => (v === '' || v == null || !isFinite(v) ? '' : (+v).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 4 })); // nunca en notación científica
// Códigos únicos para todas las partidas (si dos tipos coinciden, el segundo lleva sufijo)
function bc3Codes(types) { const used = new Set(), out = {}; types.forEach(t => { let c = bc3Map(t).code, k = 2; while (used.has(c)) c = bc3Map(t).code.slice(0, 17) + '_' + k++; used.add(c); out[t] = c; }); return out; }
function buildBC3(list, obraName) {
  const day = new Date(), fecha = String(day.getDate()).padStart(2, '0') + String(day.getMonth() + 1).padStart(2, '0') + String(day.getFullYear()).slice(2);
  const safe = t => String(t || '').normalize('NFC').replace(/[|\\~\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const types = [...new Set(list.map(a => a.type))], codes = bc3Codes(types);
  const fecha8 = String(day.getDate()).padStart(2, '0') + String(day.getMonth() + 1).padStart(2, '0') + day.getFullYear();
  const out = [`~V|OBRA-GIS|FIEBDC-3/2016\\${fecha8}|OBRA-GIS ${APP_VERSION}|\\|ANSI|`];
  out.push(`~K|\\2\\2\\3\\2\\2\\2\\2\\EUR\\|`);
  out.push(`~C|OBRAGIS##||${safe(obraName)} · mediciones de campo|0|${fecha}|0|`);
  out.push(`~C|OG01#||Actuaciones medidas en campo (${list.length})|0|${fecha}|0|`);
  out.push(`~D|OBRAGIS##|OG01#\\1\\1\\|`);
  const rows = [];
  types.forEach((t, k) => {
    const mp = bc3Map(t), code = codes[t], lines = list.filter(a => a.type === t).map(a => actQty(a, mp.unit)), tot = bc3Round(lines.reduce((s, l) => s + l.q, 0), 3);
    out.push(`~C|${code}|${mp.unit}|${safe(mp.summary)}|${bc3Num(mp.price) || 0}|${fecha}|0|`);
    out.push(`~T|${code}|${safe(t)}: medición obtenida con OBRA-GIS a partir de las actuaciones tomadas en campo.|`);
    rows.push(`${code}\\1\\${bc3Num(tot)}`);
    out.push(`~M|OG01#\\${code}|1\\${k + 1}\\|${bc3Num(tot)}|${lines.map(l => `\\${safe(l.com)}\\${bc3Num(l.n)}\\${bc3Num(l.lo)}\\${bc3Num(l.an)}\\${bc3Num(l.al)}\\`).join('')}|`);
  });
  out.push(`~D|OG01#|${rows.join('\\')}\\|`);
  return out.join('\r\n') + '\r\n';
}
function encodeANSI(str) { // windows-1252 (lo que esperan Presto, Arquímedes, etc.)
  const ext = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f, '−': 0x2d, '·': 0xb7, '²': 0xb2, '³': 0xb3, 'Ø': 0xd8 };
  str = String(str).normalize('NFC'); const u = new Uint8Array(str.length); let i = 0;
  for (const ch of str) { const c = ch.codePointAt(0); u[i++] = c < 0x80 || (c >= 0xa0 && c <= 0xff) ? c : ext[ch] || 0x3f; }
  return u.slice(0, i);
}
async function loadBaseBC3(file) {
  const b = parseBC3(new Uint8Array(await file.arrayBuffer()));
  // capítulos: con «#» o, en bases que no lo ponen, conceptos sin unidad que tienen descomposición
  const anyHash = [...b.C.values()].some(c => c.chapter); const isCh = code => { const c = b.C.get(code); return !!c && (c.chapter || (!anyHash && !c.unit && b.D.has(code))); };
  const enCap = new Set(), enPartida = new Set();
  for (const [par, kids] of b.D) kids.forEach(k => (isCh(par) ? enCap : enPartida).add(k.code));
  // precio básico (material, mano de obra, maquinaria): solo está dentro de partidas y nunca directamente en un capítulo
  const basicos = new Set([...enPartida].filter(c => !enCap.has(c)));
  const base = [...b.C.values()].filter(c => !isCh(c.code) && c.unit && c.code && !basicos.has(c.code) && !['1', '2', '3'].includes(String(c.type)))
    .map(c => ({ code: bc3Code(c.code), unit: String(c.unit).slice(0, 10), u: normUnit(c.unit), summary: String(c.summary || c.code).slice(0, 300), price: c.price >= 0 && c.price < 1e9 ? c.price : 0 })).filter(c => c.code);
  if (!base.length) throw new Error('no tiene partidas con unidad (¿es un fichero BC3?)');
  await DB.put('kv', { name: file.name, list: base, t: Date.now() }, 'bc3base');
  return base.length;
}
// Propuestas de la base: cada tipo con la partida cuyo resumen contiene sus palabras (palabras completas), en una unidad en la
// que esas actuaciones se pueden medir; un mismo código no se propone a dos tipos.
const BC3_STOP = new Set(['para', 'desde', 'hasta', 'como', 'sobre', 'entre', 'otro', 'otra', 'tipo', 'medios', 'material', 'aporte', 'existente', 'obra', 'obras']);
const BC3_SYN = { aglomerado: ['aglomerad', 'mezcla', 'bitumin'], cano: ['cano', 'tubo', 'tuberia', 'marco'], zahorra: ['zahorra'], arqueta: ['arqueta', 'pozo'], desbroce: ['desbroce', 'despeje'], refino: ['refino', 'perfilado', 'planeo'], pavimento: ['pavimento', 'solera', 'firme'], cuneta: ['cuneta'], escollera: ['escollera'], muro: ['muro'], bionda: ['bionda', 'barrera'], baden: ['baden'] };
const bc3Words = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 3 && !BC3_STOP.has(w));
function suggestFromBase(types, base, acts) {
  const cand = [];
  types.forEach(t => {
    const ws = bc3Words(t.replace(/\(.*?\)/g, '')); if (!ws.length) return;
    const head = BC3_SYN[ws[0]] || [ws[0].slice(0, Math.max(5, ws[0].length - 2))]; // la palabra principal del tipo (o un sinónimo) tiene que aparecer
    const la = acts.filter(a => a.type === t), def = defaultUnit(actItem(t));
    base.forEach(c => {
      if (!isUnit(c.u) || !la.every(a => actQty(a, c.u).q > 0)) return;
      if (!isUnit(c.u)) return;
      const sw = bc3Words(c.summary), hit = ws.filter(w => sw.some(x => x.startsWith(w.slice(0, Math.max(5, w.length - 2))))).length;
      const wm = (x, h) => x === h || x === h + 's' || x === h + 'es' || (h.length >= 5 && x.startsWith(h)); // palabras cortas (caño, tubo) enteras: «canon» no es «caño»
      if (!sw.some(x => head.some(h => wm(x, h)))) return;
      const hits = hit + (sw.some(x => x.startsWith(ws[0].slice(0, Math.max(5, ws[0].length - 2)))) ? 0 : 1); // el sinónimo de la palabra principal cuenta
      if (hits / ws.length < 0.5) return;
      cand.push({ t, c, s: hits / ws.length + hits * 0.1 + (c.u === def ? 0.3 : 0) });
    });
  });
  cand.sort((x, y) => y.s - x.s);
  const out = {}, used = new Set(Object.values(settings.bc3Map || {}).map(m => m && m.code).filter(Boolean));
  for (const x of cand) if (!out[x.t] && !used.has(x.c.code)) { out[x.t] = x.c; used.add(x.c.code); }
  return out;
}
// Precio escrito a mano: «1.250» es mil doscientos cincuenta (miles con punto), «24,80» o «24.8» son decimales
const parsePrice = v => { const t = String(v || '').trim().replace(/\s*€$/, ''); return /^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(t) ? parseNum(t.replace(/\./g, '')) : parseNum(t); };
const priceAmbiguous = v => /^[1-9]\d{0,2}\.\d{3}$/.test(String(v || '').trim()); // «24.800»: ¿miles o decimales? se dice cómo se ha entendido
const fmtEuro = v => { const [e, d] = (Math.round(v * 100) / 100).toFixed(2).split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d + ' €'; }; // 1.250,00 € (con punto de miles también en 4 cifras)
async function bc3Sheet() {
  const list = actsSorted(); if (!list.length) { toast('Todavía no hay actuaciones que exportar.'); return; }
  const types = [...new Set(list.map(a => a.type))];
  const baseRec = await DB.get('kv', 'bc3base').catch(() => null), base = baseRec ? baseRec.list.map(c => ({ ...c, u: c.u || normUnit(c.unit) })) : [];
  const sug = base.length ? suggestFromBase(types.filter(t => !bc3Map(t).own), base, list) : {};
  const fmtQ = (t, u) => { const ls = list.filter(a => a.type === t).map(a => actQty(a, u)), tot = ls.reduce((s, l) => s + l.q, 0), z = ls.filter(l => !(l.q > 0)).length;
    return `${nf(tot, BC3_DEC[u] || 0)} ${u}${z ? ` · <span class="warn">⚠ ${z} sin datos para medir en ${u}</span>` : ''}`; };
  const b = openSheet(`<h2>Exportar mediciones a BC3</h2><p class="sub">${plural(list.length, 'actuación', 'actuaciones')} · ${plural(types.length, 'partida', 'partidas')} · formato FIEBDC-3 (Presto, Arquímedes…)</p>
    <div class="row"><button class="mini" data-a="base">${baseRec ? 'Cambiar' : 'Cargar'} base de precios o presupuesto (.bc3)</button>${baseRec ? `<span class="hint">${esc(baseRec.name)} · ${base.length} partidas</span>` : ''}</div>
    <p class="hint">Asigna a cada tipo de actuación su código de partida, la unidad en que se mide y, si quieres, el precio. Al elegir un código de la base se toman su unidad y su precio. Se recuerda para la próxima vez.</p>
    <datalist id="bc3codes">${base.slice(0, 4000).map(c => `<option value="${esc(c.code)}">${esc(c.unit)} · ${esc(c.summary.slice(0, 80))}</option>`).join('')}</datalist>
    <div class="bc3map">${types.map((t, i) => { const mp = bc3Map(t), sg = sug[t], u = sg ? sg.u : mp.unit, code = sg ? sg.code : mp.own ? mp.code : '';
      return `<div class="bc3row" data-i="${i}"><div class="bt"><span class="dot" style="background:${actColor(t)}"></span><b>${esc(t)}</b> <small>${list.filter(a => a.type === t).length} act.</small></div>
        <div class="pgrid3"><input type="text" list="bc3codes" data-k="code" value="${esc(code)}" data-sug="${sg ? esc(sg.code) : ''}" placeholder="${esc(mp.auto)}" aria-label="Código de ${esc(t)}">
        <select data-k="unit" aria-label="Unidad">${Object.keys(BC3_UNITS).map(x => `<option ${x === u ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <input type="text" inputmode="decimal" data-k="price" value="${sg && sg.price ? String(sg.price).replace('.', ',') : !sg && mp.price ? String(mp.price).replace('.', ',') : ''}" placeholder="€/${esc(u)}" aria-label="Precio"></div>
        <small class="rb" data-q>${fmtQ(t, u)}</small><small class="rb" data-s>${sg ? `Propuesta de la base: ${esc(sg.code)} · ${esc(sg.summary.slice(0, 70))}. Revísala.` : ''}</small></div>`; }).join('')}</div>
    <p class="hint">Vacío = código propio de OBRA-GIS (el gris).</p>
    <input type="file" id="inBase" accept=".bc3,.BC3" hidden>
    <div class="savebar"><p class="bc3tot" id="bc3Tot" aria-live="polite"></p><button class="btn pri full" data-a="exp">Exportar BC3</button></div>`);
  const rows = [...b.querySelectorAll('.bc3row')];
  // final = al exportar (se aceptan las propuestas); si no (p. ej. al cambiar de base), las propuestas no tocadas no se guardan
  const read = final => { const map0 = { ...(settings.bc3Map || {}) };
    rows.forEach(r => { const t = types[+r.dataset.i], g = k => r.querySelector(`[data-k=${k}]`).value.trim(), C = r.querySelector('[data-k=code]');
      if (!final && C.dataset.sug && C.value.trim() === C.dataset.sug && !r.dataset.touched) return;
      const code = bc3Code(g('code')), bs = base.find(c => c.code === code), prev = map0[t] || {}, pr = parsePrice(g('price'));
      map0[t] = { code: code && code !== bc3AutoCode(t) ? code : undefined, unit: g('unit'), price: isFinite(pr) && pr >= 0 && pr < 1e9 ? pr : undefined,
        summary: bs ? bs.summary : prev.code && bc3Code(prev.code) === code ? prev.summary : undefined }; }); // sin la base cargada se conserva el resumen de la partida
    settings.bc3Map = map0; saveSettings(); };
  // importe de cada partida (cantidad × precio) y total, para revisar antes de exportar
  const amounts = () => { let tot = 0, n = 0;
    rows.forEach(r => { const t = types[+r.dataset.i], u = r.querySelector('[data-k=unit]').value, pr = parsePrice(r.querySelector('[data-k=price]').value), q = list.filter(a => a.type === t).reduce((s, a) => s + actQty(a, u).q, 0);
      const pv = r.querySelector('[data-k=price]').value, el = r.querySelector('[data-imp]'); // la cantidad con los mismos decimales que va al BC3
      if (isFinite(pr) && pr > 0) { tot += q * pr; n++; el.textContent = `Importe: ${nf(q, 3)} ${u} × ${pr.toLocaleString('es-ES', { maximumFractionDigits: 4 })} € = ${fmtEuro(q * pr)}${priceAmbiguous(pv) ? ` · ⚠ «${pv}» se ha entendido como ${fmtEuro(pr)}; si querías decimales escribe ${pv.replace('.', ',')}` : ''}`; } else el.textContent = ''; });
    $('#bc3Tot').textContent = n ? `Total (${plural(n, 'partida', 'partidas')} con precio): ${fmtEuro(tot)}` : ''; };
  rows.forEach(r => { const t = types[+r.dataset.i], U = r.querySelector('[data-k=unit]');
    r.insertAdjacentHTML('beforeend', '<small class="rb imp" data-imp></small>');
    r.addEventListener('input', () => { r.dataset.touched = '1'; amounts(); }); r.addEventListener('change', () => { r.dataset.touched = '1'; amounts(); });
    U.onchange = () => { r.querySelector('[data-q]').innerHTML = fmtQ(t, U.value); r.querySelector('[data-k=price]').placeholder = '€/' + U.value; amounts(); };
    r.querySelector('[data-k=code]').onchange = ev => { const bs = base.find(c => c.code === bc3Code(ev.target.value)), s = r.querySelector('[data-s]');
      if (!bs) { s.textContent = ''; return; }
      if (isUnit(bs.u)) U.value = bs.u; else s.textContent = `La unidad de la base («${bs.unit}») no la mide OBRA-GIS: elige la equivalente.`;
      r.querySelector('[data-k=price]').value = bs.price ? String(bs.price).replace('.', ',') : '';
      if (isUnit(bs.u)) s.textContent = bs.summary.slice(0, 90);
      U.onchange(); }; });
  amounts();
  b.querySelector('[data-a=base]').onclick = () => $('#inBase').click();
  $('#inBase').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { read(false); const n = await loadBaseBC3(f); toast(`${n} partidas cargadas de ${f.name}.`, 5000); bc3Sheet(); } catch (e) { toast(`${f.name}: ${e.message || 'no se pudo leer'}`, 6000); } };
  b.querySelector('[data-a=exp]').onclick = async () => {
    const badP = rows.find(r => { const v = r.querySelector('[data-k=price]').value.trim(), n = parsePrice(v); return v && !(isFinite(n) && n >= 0 && n < 1e9); });
    if (badP) { const P = badP.querySelector('[data-k=price]'); P.classList.add('bad'); P.focus(); toast(`Precio no válido en «${types[+badP.dataset.i]}»: escribe un número positivo, por ejemplo 24,80.`, 6000); return; }
    read(true);
    const codes = types.filter(t => bc3Map(t).own).map(t => bc3Map(t).code), dup = codes.find((c, i) => codes.indexOf(c) !== i); // los códigos propios de OBRA-GIS se hacen únicos solos
    if (dup) { toast(`El código ${dup} está en dos tipos: cada partida necesita un código distinto.`, 6000); return; }
    const zero = types.filter(t => list.some(a => a.type === t && !(actQty(a, bc3Map(t).unit).q > 0)));
    if (zero.length && !confirm(`${zero.join(', ')}: hay actuaciones sin datos para medir en la unidad elegida y saldrán con 0. ¿Exportar igualmente?`)) return;
    const txt = buildBC3(list, (obras.get(settings.activeObra) || {}).name || 'Obra');
    try { await saveBlob(new Blob([encodeANSI(txt)], { type: 'application/octet-stream' }), `mediciones_${safeName((obras.get(settings.activeObra) || {}).name).slice(0, 40)}_${stamp()}.bc3`); toast('BC3 exportado.'); }
    catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 6000); }
  };
}
