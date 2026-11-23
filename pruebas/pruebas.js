// Batería de pruebas automáticas de OBRA-GIS. Uso (desde la carpeta del repositorio):
//   python3 -m http.server 8765 &   y luego   node pruebas/pruebas.js
// Devuelve código de salida 1 si falla alguna comprobación (así GitHub marca la entrega en rojo).
const { abrir, ok, resumen, DATOS } = require('./entorno.js');
const { leerBC3 } = require('./bc3check.js');
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function pkYNumeros() {
  const { browser, page: p, errores } = await abrir();
  const r = await p.evaluate(() => ({
    pk: [fmtPK(999.6), fmtPK(1999.5), fmtPK(0), fmtPK(12345)].join(' '),
    lee: ['1+250', '1250', '1.250', '1,250', '250 m', 'PK 1+250', '1+250,5'].map(parsePK).join(' '),
    num: ['4,5', '4.5', '4,5 m', '1.234,5', '20cm', 'abc'].map(parseNum).map(String).join(' '),
    csv: csvQ('=HYPERLINK("x")') + ' ' + csvQ('-3,5'),
  }));
  ok('PK sin «0+1000»', r.pk === '1+000 2+000 0+000 12+345', r.pk);
  ok('Lectura de PK', r.lee === '1250 1250 1250 1250 250 1250 1250.5', r.lee);
  ok('Lectura de números', r.num === '4.5 4.5 4.5 1234.5 20 NaN', r.num);
  ok('CSV a prueba de fórmulas', r.csv === `"'=HYPERLINK(""x"")" "-3,5"`, r.csv);
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function geometriaYPendientes() {
  const { browser, page: p, errores } = await abrir();
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml', DATOS + 'parcela_1ha.kml']); await esperar(700);
  const g = await p.evaluate(() => { const a = [...layers.values()].find(x => x.rec.name === 'parcela_1ha').feats[0], t = [...layers.values()].find(x => x.rec.name === 'pendientes_rangos').feats[0]; return { area: a.area, per: a.length, len: t.length }; });
  ok('Parcela de 1 ha', Math.abs(g.area - 10000) < 5 && Math.abs(g.per - 400) < 0.5, `${g.area.toFixed(1)} m² · ${g.per.toFixed(2)} m`);
  ok('Traza de 1.800 m', Math.abs(g.len - 1800) < 0.5, g.len.toFixed(2) + ' m');
  await p.evaluate(() => { const e = [...layers.values()].find(x => x.rec.name === 'pendientes_rangos'); slopeSheet(e.feats[0], e.rec, 0, e.feats[0].length, { autorun: true }); }); await esperar(1500);
  const cl = await p.evaluate(() => ($('#slClass') ? $('#slClass').innerText : '').replace(/\t/g, ' | '));
  ok('Tramificación 900/300/400/200 m', /Menor del 5 % \| 900 m/.test(cl) && /5 y el 10 % \| 300 m/.test(cl) && /10 y el 20 % \| 400 m/.test(cl) && /20 % o más \| 200 m/.test(cl), cl.split('\n').slice(1, 5).join(' / '));
  const kml = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Hueco</name><Polygon><outerBoundaryIs><LinearRing><coordinates>-2.93,37.61 -2.928866,37.61 -2.928866,37.610898 -2.93,37.610898 -2.93,37.61</coordinates></LinearRing></outerBoundaryIs><innerBoundaryIs><LinearRing><coordinates>-2.929717,37.610225 -2.92915,37.610225 -2.92915,37.610674 -2.929717,37.610674 -2.929717,37.610225</coordinates></LinearRing></innerBoundaryIs></Polygon></Placemark><Placemark><name>Espacios</name><LineString><coordinates>-2.93, 37.61, 0 -2.92, 37.61, 0</coordinates></LineString></Placemark></Document></kml>`;
  await p.evaluate(async k => handleIncoming([new File([k], 'hueco.kml', { type: 'application/vnd.google-earth.kml+xml' })]), kml); await esperar(600);
  const h = await p.evaluate(() => { const e = [...layers.values()].find(x => x.rec.name === 'hueco'); return e ? { a: e.feats[0].area, l: e.feats[1].length } : null; });
  ok('Polígono con hueco y coordenadas con espacios', h && h.a > 7300 && h.a < 7700 && h.l > 800 && h.l < 900, JSON.stringify(h));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function actuacionesYBorradores() {
  const { browser, page: p, errores } = await abrir({ tactil: true });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const nueva = (d0, d1, type) => p.evaluate(([d0, d1, type]) => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0, d1, type }); }, [d0, d1, type]).then(() => esperar(450));
  await nueva(100, 300, 'Zahorra artificial');
  await p.fill('#pf_w', '4,2'); await p.fill('#pf_e', '20'); await p.dispatchEvent('#pf_e', 'input');
  const m = await p.evaluate(() => $('#aMeas').innerText.replace(/\s+/g, ''));
  ok('Mediciones de zahorra', /Superficie840m²/.test(m) && /Volumen168m³/.test(m) && /Pesoestimado378t/.test(m), m);
  await p.click('[data-a=save]'); await esperar(300);
  await nueva(600, 620, 'Sobreancho / abanico'); await p.fill('#pf_S', '3'); await p.dispatchEvent('#pf_S', 'input');
  ok('Abanico triangular ½·L·S', /30 m²/.test(await p.evaluate(() => $('#aMeas').innerText)));
  await p.click('[data-a=save]'); await esperar(300);
  // borrador: se cierra sin guardar y se recupera tras recargar
  await nueva(1000, 1000, 'Escollera'); await p.fill('#aText', 'falta escollera'); await p.click('#sheetX'); await esperar(300);
  await p.reload(); await esperar(1500);
  ok('Borrador recuperable tras cerrar y recargar', await p.evaluate(() => !!$('#draftBar') && !$('#draftBar').hidden));
  await p.click('#draftBar [data-d=go]'); await esperar(400);
  ok('El texto del borrador vuelve', await p.evaluate(() => $('#aText') && $('#aText').value === 'falta escollera'));
  await p.fill('#pf_e', '', { timeout: 500 }).catch(() => {});
  await p.fill('#pf_h', '-3'); await p.click('[data-a=save]'); await esperar(300);
  ok('Rechaza valores imposibles (mensaje junto al campo)', await p.evaluate(() => !!$('#aText') && /Altura/.test(($('#ferr_pf_h') || {}).textContent || '') && $('#pf_h').getAttribute('aria-invalid') === 'true'), await p.evaluate(() => ($('#ferr_pf_h') || {}).textContent));
  await p.fill('#pf_h', '2'); await p.fill('#pf_b', '1,5'); await p.fill('#aPk1', '1+050'); await p.dispatchEvent('#aPk1', 'change'); await esperar(100);
  await p.click('[data-a=save]'); await esperar(300);
  const res = await p.evaluate(() => [...acts.values()].map(a => `${a.type}:${a.d0}-${a.d1}`).sort().join(' '));
  ok('Tres actuaciones guardadas (con el PK cambiado justo antes de guardar)', res === 'Escollera:1000-1050 Sobreancho / abanico:600-620 Zahorra artificial:100-300', res);
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function tramoAndandoYRepetir() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  await ctx.setGeolocation(await enPK(100)); await esperar(200);
  await p.evaluate(() => walkStartSheet()); await esperar(450);
  await p.selectOption('#wType', 'Limpieza de cunetas'); await esperar(200); await p.click('[data-a=wgo]'); await esperar(1500);
  ok('Tramo empezado (barra visible)', await p.evaluate(() => !!walkAct && !$('#walkBar').hidden), await p.evaluate(() => $('#walkBar') && $('#walkBar').innerText.replace(/\s+/g, ' ')));
  await ctx.setGeolocation(await enPK(450)); await esperar(300);
  await p.click('#walkBar [data-w=end]'); await esperar(1500);
  const d = await p.evaluate(() => actDraft && [Math.round(actDraft.d0), Math.round(actDraft.d1), actDraft.type]);
  ok('Terminar aquí abre el editor con el tramo 100–450', d && Math.abs(d[0] - 100) <= 2 && Math.abs(d[1] - 450) <= 2 && d[2] === 'Limpieza de cunetas', JSON.stringify(d));
  await esperar(800); await p.click('[data-a=save]'); await esperar(400);
  await p.evaluate(() => repeatLastAct()); await esperar(450);
  const r = await p.evaluate(() => actDraft && [Math.round(actDraft.d0), actDraft.type, actDraft.side]);
  ok('Repetir la última empieza donde acabó', r && Math.abs(r[0] - 450) <= 2 && r[1] === 'Limpieza de cunetas'&& r[2] === 'ambos', JSON.stringify(r));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

const ACTS3 = () => {
  const e = [...layers.values()][0], f = e.feats[0];
  const mk = (type, d0, d1, side, params) => ({ id: uid(), obraId: settings.activeObra, layerId: e.rec.id, featIdx: 0, traceName: f.name, layerName: e.rec.name, d0, d1, type, side, text: '', media: [], created: Date.now(), coords: segmentCoords(f, d0, d1), params, prio: '' });
  return [mk('Zahorra artificial', 100, 300, 'eje', { w: 4, e: 20 }), mk('Limpieza de cunetas', 0, 500, 'ambos', {}), mk('Escollera', 1000, 1050, 'izq', { h: 2, b: 1.5 }), mk('Caño / obra de drenaje', 700, 700, 'eje', { n: 2, dia: 600, lt: 8 })];
};
async function bc3() {
  const { browser, page: p, errores } = await abrir();
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  // los 40 tipos del catálogo (y uno antiguo con caracteres raros): el BC3 lo lee un lector independiente y cada partida suma su total
  const todo = await p.evaluate(() => {
    const e = [...layers.values()][0], f = e.feats[0], P = { w: 4.2, e: 20, h: 2, b: 1.5, S: 3, n: 2, dia: 600, lt: 8, dot: 1.2, area: 50, vol: 12 };
    const list = ACT_ITEMS.map((it, i) => { const params = {}; it.fields.forEach(k => { if (P[k]) params[k] = P[k]; }); const d0 = 10 + i * 37.3, d1 = d0 + 123.456;
      return { id: 'x' + i, type: it.name, traceName: 'Camino Ñandú', d0, d1, side: i % 3 ? 'ambos' : 'izq', params, coords: segmentCoords(f, d0, d1) }; });
    list.push({ id: 'z', type: 'Tipo antiguo | con ~ y \\ raros', traceName: 'Traza «€»', d0: 0, d1: 10, side: 'eje', params: {}, coords: [] });
    return Array.from(encodeANSI(buildBC3(list, 'Obra «€» ñ')));
  });
  const r = leerBC3(new Uint8Array(todo));
  ok('BC3 de los 40 tipos sin errores de formato y con líneas que suman el total', !r.errores.length && Object.keys(r.M).length === 41, r.errores.slice(0, 3).join(' / '));
  // base de precios con coma decimal: propuestas, unidad y precio de la partida, exportación desde el botón
  await p.evaluate(async src => { for (const a of (0, eval)('(' + src + ')')()) { await DB.put('acts', a); acts.set(a.id, a); } }, ACTS3.toString());
  await p.evaluate(() => bc3Sheet()); await esperar(500);
  await p.setInputFiles('#inBase', DATOS + 'base_precios_prueba.bc3'); await esperar(900);
  const filas = await p.evaluate(() => [...document.querySelectorAll('.bc3row')].map(r => [r.querySelector('b').textContent, r.querySelector('[data-k=code]').value, r.querySelector('[data-k=unit]').value, r.querySelector('[data-k=price]').value]));
  const F = Object.fromEntries(filas.map(x => [x[0], x.slice(1)]));
  ok('Precio de la base con coma (24,80 €, no 24)', F['Zahorra artificial'] && F['Zahorra artificial'][0] === 'E03ZA020' && F['Zahorra artificial'][2] === '24,8', JSON.stringify(F['Zahorra artificial']));
  ok('Propuestas sin códigos repetidos', new Set(filas.map(x => x[1]).filter(Boolean)).size === filas.filter(x => x[1]).length, JSON.stringify(filas));
  // el caño se asigna a mano a la partida «ud» de la base: la unidad cambia sola (2 ud, no 16 m)
  await p.fill('.bc3row:has-text("Caño") [data-k=code]', 'E06OF010'); await p.dispatchEvent('.bc3row:has-text("Caño") [data-k=code]', 'change'); await esperar(200);
  ok('Al elegir una partida de la base se toma su unidad', await p.evaluate(() => document.querySelector('.bc3row:has(b) [data-k=unit]') && [...document.querySelectorAll('.bc3row')].find(r => /Caño/.test(r.innerText)).querySelector('[data-k=unit]').value === 'ud'));
  await esperar(400);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.click('[data-a=exp]')]);
  const buf = require('fs').readFileSync(await dl.path()); const x = leerBC3(new Uint8Array(buf));
  const cano = Object.entries(x.C).find(([, c]) => /Caño/.test(c.resumen));
  ok('BC3 exportado con el botón: sin errores', !x.errores.length, x.errores.join(' / '));
  ok('Caño medido en ud con 1.250 €/ud', cano && cano[0] === 'E06OF010' && cano[1].unit === 'ud' && x.M.E06OF010.total === 2 && cano[1].precio === 1250, JSON.stringify(cano) + JSON.stringify(x.M.E06OF010));
  // ajustes BC3 dañados (p. ej. de un paquete manipulado) y tipos personalizados parecidos
  const rob = await p.evaluate(() => { settings.bc3Map = { 'Zahorra artificial': { unit: 'valueOf', price: -5, code: 'Z😀1' }, 'Escollera': { unit: 'constructor', price: 1e300 } };
    const L = actsSorted().concat(['Tipo A', 'Tipo B', 'Tipo C'].map((t, i) => ({ ...actsSorted()[0], id: 'q' + i, type: t })));
    return { txt: buildBC3(L, 'x'), u: bc3Map('Zahorra artificial').unit, pz: bc3Map('Zahorra artificial').price, pe: bc3Map('Escollera').price, codes: ['Tipo A', 'Tipo B', 'Tipo C'].map(bc3AutoCode) }; });
  const rb = leerBC3(new TextEncoder().encode(rob.txt));
  ok('Ajustes BC3 dañados: unidad y precio válidos, sin notación científica', rob.u === 'm3' && rob.pz === 0 && rob.pe === 0 && !/e\+/.test(rob.txt) && !rb.errores.length, JSON.stringify([rob.u, rob.pz, rob.pe, rb.errores.slice(0, 2)]));
  ok('Tipos personalizados parecidos con códigos distintos', new Set(rob.codes).size === 3, rob.codes.join(' '));
  await p.evaluate(() => { settings.bc3Map = {}; bc3Sheet(); }); await esperar(500);
  // base realista: no propone precios básicos (material «a pie de planta») ni partidas de otra cosa para el caño
  await p.evaluate(() => { const e = [...layers.values()][0], f = e.feats[0]; const a = { ...actsSorted()[0], id: 'ag1', type: 'Aglomerado asfáltico en caliente', d0: 400, d1: 600, side: 'eje', params: { w: 4, e: 5 }, coords: segmentCoords(f, 400, 600) }; acts.set(a.id, a); closeSheet(); bc3Sheet(); }); await esperar(500);
  await p.setInputFiles('#inBase', DATOS + 'base_realista.bc3'); await esperar(900);
  const R = Object.fromEntries(await p.evaluate(() => [...document.querySelectorAll('.bc3row')].map(r => [r.querySelector('b').textContent, r.querySelector('[data-k=code]').value])));
  ok('Base realista: aglomerado → partida (no el material), caño → tubo (no la limpieza)', R['Aglomerado asfáltico en caliente'] === 'U03AC010' && R['Caño / obra de drenaje'] !== 'U01LOD010' && R['Limpieza de cunetas'] === 'U05LC010', JSON.stringify(R));
  await p.evaluate(() => { acts.delete('ag1'); closeSheet(); bc3Sheet(); }); await esperar(500);
  ok('La ficha BC3 se abre aunque los ajustes estuvieran dañados', await p.evaluate(() => document.querySelectorAll('.bc3row').length === 4));
  ok('Nombre del BC3 con fecha y hora', /_\d{4}-\d\d-\d\d_\d{6}\.bc3$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function paqueteYEnvio() {
  const { browser, page: p, errores } = await abrir();
  // obra vacía: no se envía nada
  const vac = await p.evaluate(async () => { let k = 0; const o = window.saveBlob; window.saveBlob = async () => { k++; return { where: 'DOWNLOAD' }; }; await sendToOffice(); await new Promise(r => setTimeout(r, 450)); document.querySelector('#sheetBody [data-a=go]').click(); await new Promise(r => setTimeout(r, 800)); window.saveBlob = o; return [k, $('#toast').textContent]; });
  ok('Obra vacía: avisa y no envía', vac[0] === 0 && /vacía/.test(vac[1]), JSON.stringify(vac));
  await p.evaluate(() => closeSheet());
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  await p.evaluate(async src => { for (const a of (0, eval)('(' + src + ')')()) { await DB.put('acts', a); acts.set(a.id, a); } }, ACTS3.toString());
  const pk = await p.evaluate(async () => { const r = await buildObraPackage(settings.activeObra, { blobOnly: true }); const z = await JSZip.loadAsync(r.blob); return Object.keys(z.files).filter(n => /actuaciones\.geojson|obra\.json/.test(n)).length; });
  ok('Paquete de obra con datos', pk === 2);
  const envio = () => p.evaluate(async () => { const names = []; const o = window.saveBlob; window.saveBlob = async (b, n) => { names.push(n); return { where: 'DOWNLOAD' }; }; await sendToOffice(); await new Promise(r => setTimeout(r, 450)); document.querySelector('#sheetBody [data-a=go]').click(); await new Promise(r => setTimeout(r, 2500)); window.saveBlob = o; return names; });
  const n1 = await envio();
  ok('Enviar a la oficina: paquete, informe, CSV y BC3', n1.length === 4 && n1.some(n => /\.bc3$/.test(n)), n1.join(', '));
  await esperar(1100); await p.evaluate(() => closeSheet());
  const n2 = await envio();
  ok('Segundo envío sin novedades: avisa y no envía', n2.length === 0, n2.join(', '));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function toquesYBarras() {
  const { browser, ctx, page: p, errores } = await abrir({ ancho: 360, alto: 740, tactil: true, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  // toques seguidos en «+» (con una actuación previa, así aparece también «Repetir la última»)
  await p.evaluate(async src => { const a = (0, eval)('(' + src + ')')()[1]; await DB.put('acts', a); acts.set(a.id, a); }, ACTS3.toString());
  const bb = await p.locator('#fabNote').boundingBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
  const vistos = [];
  for (const w of [0, 450, 450, 450]) { await esperar(w); await p.mouse.click(cx, cy); await esperar(30); vistos.push(await p.evaluate(() => ($('#sheetBody h2') || {}).textContent || '')); }
  await esperar(500);
  ok('Toques repetidos en «+»: nunca llegan a «Enviar a la oficina» ni guardan nada', !vistos.some(t => /Enviar/.test(t)) && await p.evaluate(() => !notes.size && acts.size === 1 && !document.querySelector('#sheetBody [data-a=go]')), vistos.join(' → '));
  await p.evaluate(() => closeSheet());
  // tramo andando: lejos del camino no empieza
  await ctx.setGeolocation({ latitude: 37.62, longitude: -2.93 }); await esperar(200);
  await p.evaluate(() => walkStartSheet()); await esperar(450); await p.selectOption('#wType', 'Desbroce de márgenes'); await esperar(200); await p.click('[data-a=wgo]'); await esperar(1500);
  ok('Tramo a más de 50 m del camino: no empieza y lo dice', await p.evaluate(() => !walkAct && /acércate/.test($('#toast').textContent)), await p.evaluate(() => $('#toast').textContent + ' · ' + JSON.stringify(walkAct && [walkAct.draft.type, walkAct.draft.d0])));
  const q = await p.evaluate(() => { const f = [...layers.values()][0].feats[0], x = pointAtPK(f, 200); return { latitude: x.lat, longitude: x.lng }; });
  await ctx.setGeolocation(q); await esperar(200);
  await p.evaluate(() => walkStartSheet()); await esperar(450); await p.click('[data-wt="Desbroce de márgenes"]'); await esperar(500); await p.click('[data-wt="Desbroce de márgenes"]'); await esperar(800);
  ok('Toques de más en «Empezar tramo» solo marcan el tipo: nunca empiezan un tramo', await p.evaluate(() => !walkAct && /Desbroce/.test($('[data-a=wgo]').textContent)));
  await p.click('[data-wt="Limpieza de cunetas"]'); await esperar(200); await p.click('[data-a=wgo]'); await esperar(1500);
  // con el aviso a la vista, «Terminar aquí» y la cámara siguen accesibles
  const libre = await p.evaluate(() => { const hit = el => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!t && (t === el || el.contains(t)); };
    return { toast: !$('#toast').hidden, fin: hit(document.querySelector('#walkBar [data-w=end]')), foto: hit($('#fabPhoto')), mas: hit($('#fabNote')) }; });
  ok('Con el aviso y la barra del tramo, «Terminar aquí», la cámara y «+» se pueden pulsar', libre.toast && libre.fin && libre.foto && libre.mas, JSON.stringify(libre));
  ok('Margen automático según el tipo (cunetas: ambos)', await p.evaluate(() => walkAct && walkAct.draft.side === 'ambos'));
  // invertir la traza a mitad de tramo: el inicio se recalcula
  await p.evaluate(async () => { const e = [...layers.values()][0]; await reverseTrace(e.rec, e.feats[0]); }); await esperar(500);
  ok('Invertir la traza a mitad de tramo recalcula el inicio', await p.evaluate(() => walkAct && Math.abs(walkAct.draft.d0 - 1600) < 2), await p.evaluate(() => walkAct && walkAct.draft.d0));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function borradoresYDictado() {
  const { browser, page: p, errores } = await abrir({ tactil: true, dialogo: d => d.dismiss() });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  // la app se cierra de golpe con una anotación a medias: el texto se recupera
  await p.evaluate(() => openEditor({ ...map.getCenter(), src: 'mapa' })); await esperar(450);
  await p.fill('#nText', 'cuneta sucia junto al olivar'); await esperar(900);
  await p.reload(); await esperar(1500);
  await p.click('#draftBar [data-d=go]').catch(() => {}); await esperar(400);
  ok('Anotación a medias recuperada tras cerrar la app de golpe', await p.evaluate(() => $('#nText') && $('#nText').value === 'cuneta sucia junto al olivar'));
  await p.evaluate(() => { closeSheet(); clearDraft(); });
  // actuación de 0 m: pide confirmación (aquí se cancela) y no se guarda
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 300, d1: 300, type: 'Limpieza de cunetas' }); }); await esperar(450);
  for (let k = 0; k < 4; k++) { await p.click('[data-a=save]'); await esperar(500); }
  ok('Actuación de 0 m: ni con varios toques en «Guardar» se guarda; avisa dentro de la ficha', await p.evaluate(() => !acts.size && !!$('#aText') && !!$('#zeroWarn') && /0 m/.test($('#zeroWarn').textContent)));
  await esperar(700); await p.click('#zeroWarn [data-a=save0]'); await esperar(400);
  ok('Actuación de 0 m: «Guardar con 0 m» la guarda', await p.evaluate(() => acts.size === 1));
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 500, d1: 500, type: 'Badén' }); }); await esperar(450);
  await p.click('[data-a=save]'); await esperar(300);
  ok('Badén en un solo PK se guarda sin avisos', await p.evaluate(() => acts.size === 2));
  // varios borradores: cerrar sin guardar uno y guardar otro no borra el primero
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 800, d1: 900, type: 'Escollera' }); }); await esperar(450);
  await p.fill('#aText', 'pendiente de medir'); await esperar(400); await p.click('#sheetX'); await esperar(300);
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 1000, d1: 1100, type: 'Limpieza de cunetas' }); }); await esperar(450);
  await p.click('[data-a=save]'); await esperar(400);
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 1200, d1: 1300, type: 'Bacheo' }); }); await esperar(450); await p.click('#sheetX'); await esperar(300);
  ok('Borrador de otra actuación conservado al guardar o cerrar otras', await p.evaluate(() => !!pendingDraft && pendingDraft.data.text === 'pendiente de medir' && !$('#draftBar').hidden), await p.evaluate(() => pendingDraft && pendingDraft.data.type));
  // dictado en un navegador sin reconocimiento de voz que responda: avisa y vuelve a «Dictar texto»
  const hay = await p.evaluate(() => !!document.querySelector('.dict'));
  if (hay) { await p.click('.dict'); await esperar(7000);
    ok('Dictado sin respuesta: avisa y no se queda colgado', await p.evaluate(() => /Dictar texto/.test($('.dict').textContent) && /micrófono del teclado|permiso|dictar/i.test($('#toast').textContent)), await p.evaluate(() => $('.dict').textContent + ' · ' + $('#toast').textContent)); }
  // KMZ dañado: mensaje claro, sin repetir el nombre
  await p.setInputFiles('#inKml', { name: 'roto.kmz', mimeType: 'application/vnd.google-earth.kmz', buffer: Buffer.from('esto no es un zip') }); await esperar(800);
  const m = await p.evaluate(() => $('#toast').textContent);
  ok('KMZ dañado: aviso en español y sin nombre repetido', /dañado|no es un KMZ/.test(m) && m.split('roto.kmz').length === 2, m);
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda4() {
  const { browser, page: p, errores } = await abrir({ tactil: true });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  // volver a escribir el PK con que se abrió: se guarda lo que se ve
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 100, d1: 300, type: 'Limpieza de cunetas' }); }); await esperar(450);
  await p.fill('#aPk1', '0+400'); await p.dispatchEvent('#aPk1', 'change'); await esperar(100); await p.fill('#aPk1', '0+300'); await p.click('[data-a=save]'); await esperar(400);
  ok('PK reescrito al valor original: se guarda lo que se ve', await p.evaluate(() => [...acts.values()].some(a => Math.round(a.d1) === 300)), await p.evaluate(() => JSON.stringify([...acts.values()].map(a => [a.d0, a.d1]))));
  // editar y cerrar sin cambios: no deja borrador falso
  await p.evaluate(() => { openActEditor({ act: [...acts.values()][0] }); }); await esperar(450); await p.click('#sheetX'); await esperar(300);
  ok('Editar y cerrar sin cambios no deja «sin guardar»', await p.evaluate(() => !pendingDraft));
  // borradores: antiguo (1.18.1) migrado y guardado, entradas dañadas descartadas sin perder las buenas, otra obra no se ofrece aquí
  await p.evaluate(async () => { const e = [...layers.values()][0];
    await DB.put('kv', { kind: 'act', data: { id: 'viejo', obraId: settings.activeObra, layerId: e.rec.id, featIdx: 0, traceName: 'T', d0: 10, d1: 20, type: 'Escollera', side: 'izq', text: 'del 1.18.1', media: [], params: {} }, t: Date.now() }, 'draft');
    await DB.put('kv', { malo: { kind: 'act', data: { id: 'malo', text: 123, media: 'abc', d0: 1, d1: 2, type: 'Bacheo' } }, roto: 5, otra: { kind: 'note', data: { id: 'otra', obraId: 'OTRA', lat: 37, lng: -3, title: 'de otra obra', text: 'x', media: [] }, t: Date.now() + 5 } }, 'drafts'); });
  await p.reload(); await esperar(1500);
  const D = await p.evaluate(async () => ({ kv: Object.keys((await DB.get('kv', 'drafts')) || {}).sort().join(','), viejo: !!(await DB.get('kv', 'draft')), bar: !$('#draftBar').hidden, pend: pendingDraft && pendingDraft.data.id }));
  ok('Borradores: el antiguo se migra y se guarda, los dañados no rompen nada y los de otra obra esperan', /viejo/.test(D.kv) && /otra/.test(D.kv) && !D.viejo && D.bar && D.pend !== 'otra', JSON.stringify(D));
  // base sin «#» y con partida auxiliar presupuestada también sola; «Canon» no es «caño»; precio «1.250» y total
  await p.evaluate(async src => { await DB.put('kv', {}, 'drafts'); drafts = {}; for (const a of (0, eval)('(' + src + ')')()) { await DB.put('acts', a); acts.set(a.id, a); } closeSheet(); bc3Sheet(); }, ACTS3.toString()); await esperar(500);
  await p.setInputFiles('#inBase', DATOS + 'base_sin_almohadilla.bc3'); await esperar(900);
  const R = Object.fromEntries(await p.evaluate(() => [...document.querySelectorAll('.bc3row')].map(r => [r.querySelector('b').textContent, [r.querySelector('[data-k=code]').value, r.querySelector('[data-k=unit]').value]])));
  ok('Base sin «#»: se carga; la zahorra auxiliar se propone y el caño no es «Canon»', R['Zahorra artificial'][0] === 'P10' && R['Caño / obra de drenaje'][0] === 'P13' && R['Caño / obra de drenaje'][1] === 'ud', JSON.stringify(R));
  await p.fill('.bc3row:has-text("Escollera") [data-k=price]', '1.250'); await p.dispatchEvent('.bc3row:has-text("Escollera") [data-k=price]', 'input'); await esperar(200);
  const imp = await p.evaluate(() => [[...document.querySelectorAll('.bc3row')].find(r => /Escollera/.test(r.innerText)).querySelector('[data-imp]').textContent, $('#bc3Tot').textContent]);
  ok('Precio «1.250» = 1.250 € e importe y total a la vista', /1\.250,00 €/.test(imp[0]) && /Total/.test(imp[1]), imp.join(' | '));
  // paquete con ajustes BC3 manipulados: se sanean al importar
  const m = await p.evaluate(async () => { const r = await buildObraPackage(settings.activeObra, { blobOnly: true }); const z = await JSZip.loadAsync(r.blob); const f = Object.keys(z.files).find(n => /obra\.json$/.test(n));
    const j = JSON.parse(await z.file(f).async('string')); j.obra.id = 'otra_' + Date.now(); j.bc3 = { 'Bacheo': { unit: 'valueOf', price: -3, code: 'B|1~' }, '__proto__': { code: 'X' } }; z.file(f, JSON.stringify(j));
    settings.bc3Map = {}; await importObraPackage(new File([await z.generateAsync({ type: 'blob' })], 'p.zip')); await new Promise(r => setTimeout(r, 1500)); return JSON.stringify(settings.bc3Map.Bacheo || null); });
  ok('Ajustes BC3 manipulados en un paquete se sanean al importar', !/valueOf|-3|\||~/.test(m), m);
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda5() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, ancho: 360, alto: 740, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  // el botón «Guardar con 0 m» se puede pulsar (no lo tapa la barra de guardar)
  await p.evaluate(() => { const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 300, d1: 300, type: 'Limpieza de cunetas' }); }); await esperar(450);
  await p.click('[data-a=save]'); await esperar(700);
  const libre = await p.evaluate(() => { const el = document.querySelector('#zeroWarn [data-a=save0]'); if (!el) return false; const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t === el || el.contains(t); });
  ok('«Guardar con 0 m» visible y pulsable', libre);
  await p.evaluate(() => { closeSheet(); clearDraft(); });
  // tramo: doble toque al aparecer la barra no lo termina; «Terminar y seguir» guarda y empieza el siguiente; cancelar se deshace
  await ctx.setGeolocation(await enPK(100)); await esperar(200);
  await p.evaluate(() => startWalk('Limpieza de cunetas', 'ambos', {})); await esperar(1200);
  await p.click('#walkBar [data-w=end]'); await esperar(300);
  ok('Toque de más justo al aparecer la barra: el tramo sigue', await p.evaluate(() => !!walkAct && !actDraft));
  await esperar(1300); await p.click('#walkBar [data-w=end]'); await esperar(1300);
  ok('«Terminar aquí» sin haber avanzado: avisa y no crea un tramo de 0 m', await p.evaluate(() => !!walkAct && /Aún estás/.test($('#toast').textContent)));
  await ctx.setGeolocation(await enPK(400)); await esperar(300);
  await p.click('#walkBar [data-w=split]'); await esperar(1600);
  const sp = await p.evaluate(() => ({ n: acts.size, a: [...acts.values()].map(a => [Math.round(a.d0), Math.round(a.d1), a.type]), w: walkAct && Math.round(walkAct.draft.d0) }));
  ok('«Terminar y seguir»: guarda 100–400 y empieza el siguiente en 400', sp.n === 1 && sp.a[0][0] === 100 && sp.a[0][1] === 400 && sp.w === 400, JSON.stringify(sp));
  await esperar(1600); await p.click('#walkBar [data-w=x]'); await esperar(700);
  ok('Cancelar el tramo no pregunta y se puede deshacer', await p.evaluate(() => !walkAct && !$('#undoBar').hidden));
  await p.click('#undoBar button'); await esperar(400);
  ok('Deshacer recupera el tramo', await p.evaluate(() => !!walkAct && Math.round(walkAct.draft.d0) === 400));
  // eliminar una actuación se deshace
  await p.evaluate(() => deleteAct([...acts.values()][0].id)); await esperar(700); await p.click('#undoBar button'); await esperar(400);
  ok('Eliminar una actuación se puede deshacer', await p.evaluate(() => acts.size === 1));
  // precios
  const pr = await p.evaluate(() => [parsePrice('0.125'), parsePrice('24.800'), priceAmbiguous('24.800'), parsePrice('1.250,50'), parsePrice('24,80')]);
  ok('Precios: «0.125» = 0,125 €; «24.800» se avisa; «1.250,50» y «24,80» bien', pr[0] === 0.125 && pr[1] === 24800 && pr[2] === true && pr[3] === 1250.5 && pr[4] === 24.8, JSON.stringify(pr));
  // cambiar una foto por otra en una actuación guardada sí es un cambio
  ok('Cambiar una foto por otra cuenta como cambio', await p.evaluate(() => actKey({ type: 'x', d0: 1, d1: 2, media: [{ id: 'a' }] }) !== actKey({ type: 'x', d0: 1, d1: 2, media: [{ id: 'b' }] })));
  // revisión antes de enviar
  await p.evaluate(async () => { const e = [...layers.values()][0], f = e.feats[0]; const a = { id: 'rv1', obraId: settings.activeObra, layerId: e.rec.id, featIdx: 0, traceName: f.name, layerName: e.rec.name, d0: 900, d1: 1000, type: 'Zahorra artificial', side: 'eje', text: '', media: [], created: Date.now(), coords: segmentCoords(f, 900, 1000), params: {}, prio: '' }; await DB.put('acts', a); acts.set(a.id, a); });
  await p.evaluate(() => { walkAct = null; showWalkBar(); sendToOffice(); }); await esperar(500);
  ok('Antes de enviar avisa de lo que falta (sin medidas)', await p.evaluate(() => /sin medidas/.test($('#sheetBody').innerText)));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda6() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, ancho: 360, alto: 740, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  // andando hacia PK decrecientes: el siguiente tramo empieza donde estás
  await ctx.setGeolocation(await enPK(600)); await esperar(200);
  await p.evaluate(() => startWalk('Limpieza de cunetas', 'ambos', {})); await esperar(1800);
  await ctx.setGeolocation(await enPK(530)); await esperar(300);
  await p.click('#walkBar [data-w=split]'); await esperar(1500);
  const b = await p.evaluate(() => ({ a: [...acts.values()].map(a => [Math.round(a.d0), Math.round(a.d1)]), w: walkAct && Math.round(walkAct.draft.d0) }));
  ok('Hacia atrás: «Guardar y seguir» guarda 530–600 y el siguiente empieza en 530', b.a.length === 1 && b.a[0][0] === 530 && b.a[0][1] === 600 && b.w === 530, JSON.stringify(b));
  // con «Deshacer» a la vista, los botones de la barra del tramo siguen libres (Playwright pulsa sin esperar a que se vaya)
  const libres = await p.evaluate(() => { if ($('#undoBar').hidden) return 'sin deshacer'; const hit = el => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!t && (t === el || el.contains(t)); };
    return ['end', 'split', 'x'].map(k => hit(document.querySelector(`#walkBar [data-w=${k}]`))).join(','); });
  ok('«Deshacer» no tapa «Terminar», «Guardar y seguir» ni la ✕', libres === 'true,true,true', libres);
  // puntual con un toque
  await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); }); await ctx.setGeolocation(await enPK(700)); await esperar(200);
  await p.click('#fabNote'); await esperar(1700); await p.click('[data-pq="Caño / obra de drenaje"]'); await esperar(1500);
  ok('Caño con un toque desde el «+», en el PK donde estás', await p.evaluate(() => [...acts.values()].some(a => a.type === 'Caño / obra de drenaje' && Math.round(a.d0) === 700 && a.d1 === a.d0)));
  // tramos andando solo con tipos lineales
  await p.evaluate(() => walkStartSheet()); await esperar(500);
  ok('«Empezar tramo» no ofrece tipos puntuales', await p.evaluate(() => ![...document.querySelectorAll('[data-wt]')].some(x => ACT_POINT.has(x.dataset.wt))));
  // zahorra sin medidas: avisa dentro de la ficha
  await p.evaluate(() => { closeSheet(); const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 1000, d1: 1100, type: 'Zahorra artificial' }); }); await esperar(450);
  await p.click('[data-a=save]'); await esperar(400);
  ok('Zahorra sin medidas: avisa y no guarda al primer toque', await p.evaluate(() => !!$('#measWarn') && ![...acts.values()].some(a => a.type === 'Zahorra artificial')));
  await esperar(700); await p.click('#measWarn [data-a=savenm]'); await esperar(400);
  ok('«Guardar sin medidas» la guarda', await p.evaluate(() => [...acts.values()].some(a => a.type === 'Zahorra artificial')));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda7() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, ancho: 360, alto: 740, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  // «+» › «Terminar aquí el tramo» funciona (no se lo come la espera de la barra)
  await ctx.setGeolocation(await enPK(100)); await esperar(200);
  await p.evaluate(() => startWalk('Desbroce de márgenes', 'ambos', { w: 1.5 })); await esperar(1800);
  await ctx.setGeolocation(await enPK(300)); await esperar(300);
  await p.click('#fabNote'); await esperar(1100); await p.click('#sheetBody [data-a=wend]'); await esperar(1500);
  ok('«+» › «Terminar aquí» abre el editor con el tramo', await p.evaluate(() => !!actDraft && Math.round(actDraft.d0) === 100 && Math.round(actDraft.d1) === 300), await p.evaluate(() => actDraft && [actDraft.d0, actDraft.d1]));
  await p.evaluate(() => closeSheet());
  // hacia atrás desde el editor: «Guardar y seguir andando» empieza donde está el técnico
  await p.evaluate(async () => { for (const k of Object.keys(drafts)) await clearDraft(k); });
  await ctx.setGeolocation(await enPK(620)); await esperar(200);
  await p.evaluate(() => startWalk('Limpieza de cunetas', 'ambos', {})); await esperar(1800);
  await ctx.setGeolocation(await enPK(560)); await esperar(300);
  await p.click('#walkBar [data-w=end]'); await esperar(2000); await p.click('#sheetBody [data-a=savecont]'); await esperar(1500);
  const w = await p.evaluate(() => ({ a: [...acts.values()].filter(a => a.type === 'Limpieza de cunetas').map(a => [Math.round(a.d0), Math.round(a.d1)]), w: walkAct && Math.round(walkAct.draft.d0) }));
  ok('Hacia atrás desde el editor: guarda 560–620 y sigue en 560', JSON.stringify(w.a) === '[[560,620]]' && w.w === 560, JSON.stringify(w));
  // «Deshacer» arriba: no tapa la barra del tramo ni con un puntual en medio
  await ctx.setGeolocation(await enPK(500)); await esperar(200);
  await p.click('#fabNote'); await esperar(1700); await p.click('[data-pq="Badén"]'); await esperar(1500);
  const lib = await p.evaluate(() => { const hit = el => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!t && (t === el || el.contains(t)); };
    return { undo: !$('#undoBar').hidden, top: $('#undoBar').getBoundingClientRect().top < 200, end: hit(document.querySelector('#walkBar [data-w=end]')), split: hit(document.querySelector('#walkBar [data-w=split]')) }; });
  ok('Con «Deshacer» a la vista, la barra del tramo sigue libre', lib.undo && lib.top && lib.end && lib.split, JSON.stringify(lib));
  ok('Badén puntual: se mide por unidad en el BC3', await p.evaluate(() => { const b = [...acts.values()].find(a => a.type === 'Badén'); return !!b && bc3Map('Badén').unit === 'ud' && actQty(b, 'ud').q === 1; }));
  // «Guardar y seguir» sin medidas conocidas abre el editor
  await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); for (const a of [...acts.values()].filter(a => a.type === 'Zahorra artificial')) { acts.delete(a.id); await DB.del('acts', a.id); } });
  await ctx.setGeolocation(await enPK(800)); await esperar(200);
  await p.evaluate(() => startWalk('Zahorra artificial', 'eje', {})); await esperar(1800);
  await ctx.setGeolocation(await enPK(900)); await esperar(300);
  await p.click('#walkBar [data-w=split]'); await esperar(1500);
  ok('«Guardar y seguir» sin medidas: abre el editor para ponerlas', await p.evaluate(() => !!actDraft && actDraft.type === 'Zahorra artificial' && !!$('#pf_w') && ![...acts.values()].some(a => a.type === 'Zahorra artificial')));
  await p.evaluate(() => closeSheet());
  ok('«▶ Seguir» sigue ofreciendo el último tramo aunque después se apunte un puntual', await p.evaluate(() => { updateSeguir(); const b = $('#fabSeguir'); return !!b && !b.hidden && /Limpieza/.test(b.getAttribute('aria-label')); }));
  await p.evaluate(() => { for (const a of [...acts.values()].filter(a => a.type === 'Badén')) acts.delete(a.id); updateSeguir(); });
  ok('«▶ Seguir» junto al «+» cuando la última es un tramo', await p.evaluate(() => { const b = $('#fabSeguir'); return !!b && !b.hidden && /Limpieza/.test(b.getAttribute('aria-label')); }), await p.evaluate(() => JSON.stringify([lastAct() && lastAct().type, walkHere(), settings.simple, !!$('#fabSeguir'), $('#fabSeguir') && $('#fabSeguir').hidden])));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda8() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, ancho: 400, alto: 820, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  const tramos = t => p.evaluate(t => [...acts.values()].filter(a => a.type === t).map(a => [Math.round(a.d0), Math.round(a.d1)]).sort((x, y) => x[0] - y[0]), t);
  // un «Deshacer» viejo desaparece en cuanto se termina el tramo siguiente
  await ctx.setGeolocation(await enPK(300)); await esperar(200);
  await p.evaluate(() => startWalk('Limpieza de cunetas', 'ambos', {})); await esperar(1800);
  await ctx.setGeolocation(await enPK(400)); await esperar(300); await p.click('#walkBar [data-w=split]'); await esperar(1800);
  ok('Tras «Guardar y seguir» hay «Deshacer»', await p.evaluate(() => !$('#undoBar').hidden));
  await ctx.setGeolocation(await enPK(460)); await esperar(300); await p.click('#walkBar [data-w=end]'); await esperar(400);
  ok('Al terminar el tramo siguiente, el «Deshacer» viejo desaparece', await p.evaluate(() => $('#undoBar').hidden));
  await esperar(1800); await p.evaluate(() => { if (actDraft) { actDraft._cont = undefined; } }); await p.click('#sheetBody [data-a=save]'); await esperar(500);
  ok('Tramos 300–400 y 400–460 sin solape', JSON.stringify(await tramos('Limpieza de cunetas')) === '[[300,400],[400,460]]', JSON.stringify(await tramos('Limpieza de cunetas')));
  // PK final corregido en el editor: el siguiente tramo empieza en el PK guardado
  await ctx.setGeolocation(await enPK(600)); await esperar(200);
  await p.evaluate(() => startWalk('Desbroce de márgenes', 'ambos', { w: 1.5 })); await esperar(1800);
  await ctx.setGeolocation(await enPK(700)); await esperar(300); await p.click('#walkBar [data-w=end]'); await esperar(2000);
  await p.fill('#aPk1', '0+740'); await p.dispatchEvent('#aPk1', 'change'); await esperar(100);
  await p.click('#sheetBody [data-a=savecont]'); await esperar(1500);
  ok('PK final corregido a 0+740: el siguiente empieza en 0+740', await p.evaluate(() => walkAct && Math.round(walkAct.draft.d0) === 740), await p.evaluate(() => walkAct && walkAct.draft.d0));
  // «Guardar y seguir andando» con aviso «Sin medidas»: tras «Guardar sin medidas» sigue andando
  await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); });
  await ctx.setGeolocation(await enPK(1000)); await esperar(200);
  await p.evaluate(() => startWalk('Pavimento de hormigón', 'eje', {})); await esperar(1800);
  await ctx.setGeolocation(await enPK(1100)); await esperar(300); await p.click('#walkBar [data-w=end]'); await esperar(2000);
  await p.click('#sheetBody [data-a=savecont]'); await esperar(500);
  await esperar(700); await p.click('#measWarn [data-a=savenm]'); await esperar(1500);
  ok('«Guardar sin medidas» tras «Guardar y seguir andando» sigue el tramo', await p.evaluate(() => walkAct && Math.round(walkAct.draft.d0) === 1100 && [...acts.values()].some(a => a.type === 'Pavimento de hormigón')));
  // badén: 1 ud en pantalla, CSV y BC3
  await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); const e = [...layers.values()][0], f = e.feats[0];
    for (const [d0, d1, pr] of [[1300, 1300, {}], [1400, 1406, { w: 4, e: 20 }]]) { const a = { id: uid(), obraId: settings.activeObra, layerId: e.rec.id, featIdx: 0, traceName: f.name, layerName: e.rec.name, d0, d1, type: 'Badén', side: 'eje', text: '', media: [], created: Date.now(), coords: segmentCoords(f, d0, d1), params: pr, prio: '' }; await DB.put('acts', a); acts.set(a.id, a); } });
  const bd = await p.evaluate(() => { const L = actsSorted().filter(a => a.type === 'Badén'), csv = actsCSV(L).split('\r\n'), h = csv[0].split(';'), iu = h.findIndex(x => /Unidades/.test(x));
    return { csv: csv.slice(1).map(r => r.split(';')[iu].replace(/"/g, '')), bc3: L.reduce((s, a) => s + actQty(a, bc3Map('Badén').unit).q, 0), sum: actsSummary(L)[0].ud }; });
  ok('Badén: cada uno 1 ud en CSV, resumen y BC3', bd.csv.join() === '1,1' && bd.bc3 === 2 && bd.sum === 2, JSON.stringify(bd));
  // ficha «+»: un segundo toque donde estaba el «+» solo cierra la ficha
  const bb = await p.locator('#fabNote').boundingBox();
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await esperar(1200);
  const n0 = await p.evaluate(() => acts.size); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await esperar(800);
  ok('Segundo toque en el sitio del «+» cierra la ficha sin apuntar nada', await p.evaluate(n0 => $('#sheet').hidden && acts.size === n0, n0));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda9() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, ancho: 400, alto: 820, geo: { latitude: 37.61, longitude: -2.93 } });
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  // ficha «+» llena (repetir, tipos recientes): los puntuales se pueden pulsar, no los tapa «Cerrar»
  await p.evaluate(async () => { settings.actRecent = ['Limpieza de cunetas', 'Zahorra artificial', 'Desbroce de márgenes']; const e = [...layers.values()][0], f = e.feats[0];
    const a = { id: uid(), obraId: settings.activeObra, layerId: e.rec.id, featIdx: 0, traceName: f.name, layerName: e.rec.name, d0: 0, d1: 100, type: 'Limpieza de cunetas', side: 'ambos', text: '', media: [], created: Date.now(), coords: segmentCoords(f, 0, 100), params: {}, prio: '' }; await DB.put('acts', a); acts.set(a.id, a); });
  await ctx.setGeolocation(await enPK(700)); await esperar(200);
  await p.click('#fabNote'); await esperar(1700);
  const pq = await p.evaluate(() => [...document.querySelectorAll('[data-pq]')].map(el => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!t && (t === el || el.contains(t)); }));
  ok('Ficha «+» llena: los tres puntuales se pueden pulsar', pq.length === 3 && pq.every(Boolean), JSON.stringify(pq));
  await p.click('[data-pq="Caño / obra de drenaje"]'); await esperar(1500);
  ok('Caño de un toque guardado', await p.evaluate(() => [...acts.values()].some(a => a.type === 'Caño / obra de drenaje')));
  // caño y arqueta sin número: 1 ud en pantalla, CSV, resumen y BC3; bacheo sin «ud»
  const u = await p.evaluate(() => { const e = [...layers.values()][0], f = e.feats[0], mk = (t, pr) => ({ id: uid(), type: t, d0: 50, d1: 50, side: 'eje', params: pr, coords: segmentCoords(f, 50, 50), traceName: f.name });
    const L = [mk('Caño / obra de drenaje', {}), mk('Arqueta / pozo', {}), mk('Entronque / intersección', {}), mk('Bacheo', { area: 3, e: 5 })];
    const csv = actsCSV(L).split('\r\n'), iu = csv[0].split(';').findIndex(x => /Unidades/.test(x));
    return { csv: csv.slice(1).map(r => r.split(';')[iu].replace(/"/g, '')), bc3: L.slice(0, 3).map(a => actQty(a, bc3Map(a.type).unit).q), sum: actsSummary(L).map(r => r.type.slice(0, 4) + ':' + r.ud) }; });
  ok('Puntuales sin número: 1 ud en CSV, resumen y BC3; el bacheo no cuenta unidades', u.csv.join() === '1,1,1,' && u.bc3.join() === '1,1,1' && u.sum.some(x => x === 'Bach:0'), JSON.stringify(u));
  // hacia atrás: «Aquí» junto a «Hasta PK» alarga el tramo por abajo, sin perder metros
  await p.evaluate(async () => { for (const k of Object.keys(drafts)) await clearDraft(k); });
  await ctx.setGeolocation(await enPK(900)); await esperar(200);
  await p.evaluate(() => startWalk('Limpieza de cunetas', 'ambos', {})); await esperar(1800);
  await ctx.setGeolocation(await enPK(800)); await esperar(300); await p.click('#walkBar [data-w=end]'); await esperar(2000);
  await ctx.setGeolocation(await enPK(780)); await esperar(300); await p.click('#sheetBody [data-a=gps1]'); await esperar(1200);
  ok('Hacia atrás, «Aquí» en «Hasta PK»: tramo 780–900', await p.evaluate(() => actDraft && Math.round(actDraft.d0) === 780 && Math.round(actDraft.d1) === 900), await p.evaluate(() => actDraft && [actDraft.d0, actDraft.d1]));
  // «Guardar y seguir andando» desde el editor ofrece «Deshacer», y un toque fallido no lo borra
  await p.click('#sheetBody [data-a=savecont]'); await esperar(1500);
  ok('«Guardar y seguir andando» desde el editor: «Deshacer» y sigue en 780', await p.evaluate(() => !$('#undoBar').hidden && walkAct && Math.round(walkAct.draft.d0) === 780));
  await p.click('#walkBar [data-w=end]').catch(() => {}); await esperar(500);
  ok('Un toque ignorado en la barra no borra el «Deshacer»', await p.evaluate(() => !$('#undoBar').hidden));
  // tramo de milímetros: también avisa de 0 m
  await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); closeSheet(); const e = [...layers.values()][0]; openActEditor({ rec: e.rec, f: e.feats[0], d0: 1200, d1: 1200.008, type: 'Zahorra artificial' }); }); await esperar(450);
  await p.fill('#pf_w', '4'); await p.fill('#pf_e', '20'); await p.click('[data-a=save]'); await esperar(400);
  ok('Tramo de 8 mm: avisa de 0 m y no guarda', await p.evaluate(() => !!$('#zeroWarn') && ![...acts.values()].some(a => a.type === 'Zahorra artificial')));
  // «▶ Seguir» con nombres distintos para aglomerado en caliente y en frío
  ok('Nombres cortos de «▶ Seguir» distintos', await p.evaluate(() => shortType('Aglomerado asfáltico en caliente') !== shortType('Aglomerado asfáltico en frío') && shortType('Desbroce de la traza') === 'Desbroce traza'));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function ronda10() {
  const { browser, ctx, page: p, errores } = await abrir({ tactil: true, ancho: 400, alto: 820, geo: { latitude: 37.61, longitude: -2.93 } });
  ok('Primer uso sin plano: el mapa dice qué hacer', await p.evaluate(() => !!$('#mapEmpty') && !$('#mapEmpty').hidden && /plano/.test($('#mapEmpty').textContent)));
  await p.setInputFiles('#inKml', [DATOS + 'pendientes_rangos.kml']); await esperar(600);
  ok('Con plano cargado el aviso desaparece', await p.evaluate(() => $('#mapEmpty').hidden));
  const enPK = d => p.evaluate(d => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, d); return { latitude: q.lat + 0.00002, longitude: q.lng }; }, d);
  const atras = async (tipo = 'Limpieza de cunetas') => { // tramo andado hacia atrás de 900 a 800 y «Terminar aquí»
    await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); closeSheet(); for (const k of Object.keys(drafts)) await clearDraft(k); }); await esperar(300);
    await ctx.setGeolocation(await enPK(900)); await esperar(200);
    await p.evaluate(t => { settings.actRecent = []; for (const a of [...acts.values()]) if (a.type === t) acts.delete(a.id); startWalk(t, 'ambos', {}); }, tipo); await esperar(1800);
    await ctx.setGeolocation(await enPK(800)); await esperar(300); await p.click('#walkBar [data-w=end]'); await esperar(2000); };
  // P10-1: tras «Terminar», los PK se ven y la ✕ no queda encima de «Mapa»
  await atras();
  const sx = await p.evaluate(() => { const x = $('#sheetX').getBoundingClientRect(), m = $('#sheetBody [data-a=map1]').getBoundingClientRect(), k = $('#aPk1').getBoundingClientRect();
    return { solapa: !(m.right < x.left || m.left > x.right || m.bottom < x.top || m.top > x.bottom), pkVisible: k.top >= x.bottom - 4 && k.bottom <= innerHeight }; });
  ok('Tras «Terminar»: PK a la vista y la ✕ no tapa «Mapa»', !sx.solapa && sx.pkVisible, JSON.stringify(sx));
  // M10-1: «Mapa» en «Hasta PK» con un toque real en el mapa alarga el tramo (780–900), no lo recorta
  await p.click('#sheetBody [data-a=map1]'); await esperar(500);
  const pt = await p.evaluate(() => { const f = [...layers.values()][0].feats[0], q = pointAtPK(f, 780); map.setView([q.lat, q.lng], 17, { animate: false }); const c = map.latLngToContainerPoint([q.lat, q.lng]), r = $('#map').getBoundingClientRect(); return { x: r.left + c.x, y: r.top + c.y }; }); await esperar(400);
  await p.touchscreen.tap(pt.x, pt.y); await esperar(800);
  ok('Hacia atrás, «Mapa» en «Hasta PK»: tramo 780–900 (no se pierden metros)', await p.evaluate(() => actDraft && Math.abs(actDraft.d0 - 780) < 3 && Math.round(actDraft.d1) === 900), await p.evaluate(() => actDraft && [actDraft.d0, actDraft.d1]));
  // M10-2: escribir «0+780» en «Hasta PK» hace lo mismo
  await atras();
  await p.fill('#aPk1', '0+780'); await p.press('#aPk1', 'Tab'); await esperar(300);
  ok('Hacia atrás, PK escrito en «Hasta»: tramo 780–900', await p.evaluate(() => actDraft && Math.round(actDraft.d0) === 780 && Math.round(actDraft.d1) === 900 && $('#aPk0').value === '0+780' && $('#aPk1').value === '0+900'), await p.evaluate(() => actDraft && [actDraft.d0, actDraft.d1, $('#aPk0').value, $('#aPk1').value]));
  // M10-5: «Guardar sin medidas» + «Guardar y seguir andando» → Deshacer conserva la cadena «sin medidas»
  await atras('Desbroce de márgenes'); await p.evaluate(() => { const w = $('#pf_w'); if (w) w.value = ''; });
  await p.click('#sheetBody [data-a=savecont]'); await esperar(900);
  const nm = await p.$('#sheetBody [data-a=savenm]'); ok('Desbroce sin ancho: pide medidas', !!nm); if (nm) { await nm.click(); await esperar(1500); }
  await p.click('#undoBar .mini'); await esperar(800);
  ok('Deshacer del editor mantiene la cadena «sin medidas»', await p.evaluate(() => !!walkAct && walkAct.draft._noMeasChain === true), await p.evaluate(() => walkAct && walkAct.draft._noMeasChain));
  // P10-2 y M10-4: andando, el «+» no ofrece «Desde donde acabó» y baja a su sitio sobre el pie «Cerrar»
  await esperar(1600); await p.click('#fabNote'); await esperar(1200);
  const pl = await p.evaluate(() => { const r = $('#fabNote').getBoundingClientRect(), u = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).find(e => e.closest && e.closest('#sheetBody'));
    return { rep: !!$('#sheetBody [data-a=rep]'), bajo: u ? (u.closest('.plusfoot') ? 'pie' : (u.textContent || '').trim().slice(0, 30)) : 'nada' }; });
  ok('Andando, el «+» no ofrece «Desde donde acabó»', !pl.rep, JSON.stringify(pl));
  ok('Andando, bajo el «+» queda el pie «Cerrar» (o nada)', pl.bajo === 'pie' || pl.bajo === 'nada', JSON.stringify(pl));
  // M10-3: al llegar al final de la traza con «Guardar y seguir», el «Deshacer» dice «Fin del camino»
  const fin = await p.evaluate(async () => { walkAct = null; await DB.del('kv', 'walk'); showWalkBar(); closeSheet(); const e = [...layers.values()][0], f = e.feats[0];
    actDraft = { id: uid(), obraId: settings.activeObra, layerId: e.rec.id, featIdx: 0, traceName: f.name, layerName: e.rec.name, d0: f.length - 60, d1: f.length, type: 'Limpieza de cunetas', side: 'ambos', text: '', media: [], created: Date.now(), coords: [], params: {}, prio: '', _walk: true, _cont: 1, _noMeasOk: true };
    renderActEditor(); await saveAct(); return $('#undoBar').hidden ? '' : $('#undoBar').textContent; });
  ok('Fin de la traza: el «Deshacer» dice «Fin del camino»', /Fin del camino/.test(fin), fin);
  // P7-3: «Enviar a la oficina» la primera vez no muestra una casilla desactivada
  await p.evaluate(() => { hideUndo(); closeSheet(); sendToOffice(); }); await esperar(500);
  ok('Primer envío: sin casilla desactivada', await p.evaluate(() => !!$('#sheetBody [data-a=go]') && !$('#soSince')));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

async function modoSencillo() {
  const { browser, page: p, errores } = await abrir({ ancho: 360, alto: 740, tactil: true });
  await p.evaluate(() => { settings.simple = true; applySimple(); openDrawer(); }); await esperar(300);
  ok('Modo sencillo oculta herramientas técnicas', await p.evaluate(() => document.body.classList.contains('simple') && getComputedStyle(document.querySelector('[data-t=calc]')).display === 'none'));
  await p.evaluate(() => { closeDrawer(); importMenu(); }); await esperar(300);
  ok('Modo sencillo: sin WMS ni previo BC3 al importar', await p.evaluate(() => getComputedStyle(document.querySelector('#sheetBody [data-a=service]')).display === 'none' && getComputedStyle(document.querySelector('#sheetBody [data-a=previo]')).display === 'none'));
  ok('Letra más grande', await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize) >= 18));
  ok('Sin errores JS', !errores.length, errores.join(' | '));
  await browser.close();
}

(async () => {
  for (const t of [pkYNumeros, geometriaYPendientes, actuacionesYBorradores, tramoAndandoYRepetir, bc3, paqueteYEnvio, toquesYBarras, borradoresYDictado, ronda4, ronda5, ronda6, ronda7, ronda8, ronda9, ronda10, modoSencillo]) {
    console.log(`\n— ${t.name}`);
    try { await t(); } catch (e) { ok(t.name + ' terminó sin excepciones', false, e.message.split('\n')[0]); }
  }
  process.exit(resumen() ? 1 : 0);
})();
