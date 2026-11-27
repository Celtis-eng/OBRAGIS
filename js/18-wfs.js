'use strict';
/* OBRA-GIS · Pasar a KML los elementos de las capas de servicios (WMS).
   Parte de la app (los ficheros js/ se cargan en orden desde index.html y comparten el ámbito global).
   Un WMS solo da imágenes; los elementos (líneas eléctricas, vías pecuarias…) se piden al servicio de datos (WFS)
   que publican casi todos los servidores de la Junta (DERA, REDIAM) y del MITECO, en la zona elegida.
   El resultado es una capa KML normal: se puede tocar, medir, sacar en informes y exportar. */
const WFS_MAX = 5000;
// Servicio de datos (WFS) y nombre del tipo de elemento de una capa WMS
function wfsFor(rec) {
  const u = String(rec.url || '').split('?')[0], lay = String(rec.layers || '').split(',')[0];
  if (!u || !lay || rec.kind === 'wmts') return null;
  if (rec.wfsUrl) return { url: rec.wfsUrl, type: /^\/.*\/$/.test(rec.wfsType || '') ? '' : (rec.wfsType || lay), find: /^\/.*\/$/.test(rec.wfsType || '') ? rec.wfsType.slice(1, -1) : '', json: true, rec }; // servicio de datos propio (IGN, BCA10)
  let m = u.match(/^(https:\/\/www\.ideandalucia\.es\/services\/([^/]+))\/wms$/i); // DERA (GeoServer)
  if (m) return { url: m[1] + '/wfs', type: lay, json: true };
  m = u.match(/^(https:\/\/[^/]+\/geoserver\/.+)\/wms$/i); // GeoServer (MITECO y otros)
  if (m) return { url: m[1] + '/wfs', type: lay, json: true };
  if (/catastro|sigpac|ign\.es/i.test(u)) return null; // sin WFS con esos nombres de capa
  return { url: u, type: lay, json: false }; // MapServer (REDIAM) y otros: la misma dirección con SERVICE=WFS
}
const wfsOk = rec => typeOf(rec) === 'wms' && !!wfsFor(rec);
function wfsUrl(w, b, json, v2) {
  // WFS 1.1.0 con la zona en grados y su sistema dicho expresamente (en 1.0.0 los servidores de la Junta la leen en UTM); 2.0.0 de reserva
  const bb = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map(v => v.toFixed(6)).join(',') + ',urn:ogc:def:crs:EPSG::4326';
  return v2 ? `${w.url}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=${encodeURIComponent(w.type)}&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${encodeURIComponent(bb)}&COUNT=${WFS_MAX}${json ? '&OUTPUTFORMAT=application%2Fjson' : ''}`
    : `${w.url}?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=${encodeURIComponent(w.type)}&SRSNAME=EPSG:4326&BBOX=${encodeURIComponent(bb)}&MAXFEATURES=${WFS_MAX}${json ? '&OUTPUTFORMAT=application%2Fjson' : ''}`;
}
// Tipo de elemento sin nombre fijo: se busca en la descripción del servicio de datos (y se recuerda en la capa)
async function wfsResolve(w) {
  if (w.type) return;
  if (w.rec && w.rec._wfsType) { w.type = w.rec._wfsType; return; }
  const caps = new DOMParser().parseFromString(await httpGetText(`${w.url}?SERVICE=WFS&REQUEST=GetCapabilities`), 'application/xml');
  const names = byTag(caps, 'FeatureType').map(ft => { const n = [...ft.children].find(c => c.localName === 'Name'); return n ? n.textContent.trim() : ''; }).filter(Boolean);
  const re = new RegExp(w.find || '.', 'i'), hits = names.filter(n => re.test(n));
  if (!hits.length) throw new Error('el servicio no ofrece ese tipo de datos');
  w.type = hits.join(','); if (w.rec) w.rec._wfsType = w.type;
}
// [lng, lat] con el orden corregido si el servidor lo da al revés (en España la latitud está entre 27 y 45)
const lonLat = (a, b) => (a > 26 && a < 45 && b > -20 && b < 6) ? [b, a] : [a, b];
function geomFromGeoJSON(g) {
  if (!g) return [];
  const ln = c => c.map(p => lonLat(p[0], p[1]));
  switch (g.type) {
    case 'Point': return [{ t: 'pt', c: [lonLat(g.coordinates[0], g.coordinates[1])] }];
    case 'MultiPoint': return g.coordinates.map(p => ({ t: 'pt', c: [lonLat(p[0], p[1])] }));
    case 'LineString': return [{ t: 'ln', c: ln(g.coordinates) }];
    case 'MultiLineString': return g.coordinates.map(l => ({ t: 'ln', c: ln(l) }));
    case 'Polygon': return [{ t: 'pg', rings: g.coordinates.map(ln) }];
    case 'MultiPolygon': return g.coordinates.map(p => ({ t: 'pg', rings: p.map(ln) }));
    case 'GeometryCollection': return (g.geometries || []).flatMap(geomFromGeoJSON);
    default: return [];
  }
}
// GML 2/3 (MapServer, GeoServer sin JSON): elementos con sus atributos sencillos y su geometría
function featsFromGML(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('respuesta no válida');
  const ex = byTag(doc, 'ExceptionText')[0] || byTag(doc, 'ServiceException')[0]; if (ex) throw new Error(ex.textContent.trim().slice(0, 160));
  const members = [...byTag(doc, 'featureMember'), ...byTag(doc, 'member')].map(m => m.firstElementChild).filter(Boolean);
  const nums = s => s.trim().split(/[\s,]+/).map(Number);
  const pairs = (el) => { const pl = byTag(el, 'posList')[0] || byTag(el, 'coordinates')[0], ps = byTag(el, 'pos');
    if (pl) { if (pl.localName === 'coordinates') return pl.textContent.trim().split(/\s+/).map(t => t.split(',').map(Number)).map(p => lonLat(p[0], p[1]));
      const n = nums(pl.textContent), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push(lonLat(n[i], n[i + 1])); return out; }
    return ps.map(p => { const n = nums(p.textContent); return lonLat(n[0], n[1]); }); };
  return members.map(f => {
    const props = {}, geoms = [];
    for (const ch of f.children) {
      if (ch.children.length === 0) { const v = ch.textContent.trim(); if (v) props[ch.localName] = v; continue; }
      const g = ch.querySelector('*'); if (!g) continue;
      byTag(ch, 'Polygon').forEach(pg => { const outer = byTag(pg, 'exterior')[0] || byTag(pg, 'outerBoundaryIs')[0]; const inner = [...byTag(pg, 'interior'), ...byTag(pg, 'innerBoundaryIs')];
        if (outer) geoms.push({ t: 'pg', rings: [pairs(outer), ...inner.map(pairs)] }); });
      if (!geoms.length) [...byTag(ch, 'LineString'), ...byTag(ch, 'LineStringSegment')].forEach(l => geoms.push({ t: 'ln', c: pairs(l) }));
      if (!geoms.length) byTag(ch, 'Point').forEach(p => { const c = pairs(p); if (c.length) geoms.push({ t: 'pt', c: [c[0]] }); });
    }
    return { props, geoms };
  }).filter(x => x.geoms.length);
}
const kmlEsc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const WFS_NAME_KEYS = /^(nombre|name|denominaci|denom|titulo|título|etiqueta|desc_?|matricula|cod_?vp|codigo|código|id)/i;
function featsToKML(title, feats, color) {
  const hex = (color || '#ff6b00').replace('#', ''), kcol = 'ff' + hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
  const cs = c => c.map(p => `${(+p[0]).toFixed(7)},${(+p[1]).toFixed(7)}`).join(' ');
  const pms = feats.map((f, i) => {
    const keys = Object.keys(f.props).filter(k => !/^(the_geom|geom|shape|bbox|gml_id|fid|objectid|boundedBy)$/i.test(k));
    const okv = k => f.props[k] && String(f.props[k]).length < 120;
    const nk = keys.find(k => /^(nombre|name|denominaci|denom|titulo|título|etiqueta)/i.test(k) && okv(k)) || keys.find(k => WFS_NAME_KEYS.test(k) && okv(k));
    const name = nk ? f.props[nk] : `${title} ${i + 1}`;
    const geo = f.geoms.map(g => g.t === 'pt' ? `<Point><coordinates>${cs(g.c)}</coordinates></Point>`
      : g.t === 'ln' ? `<LineString><tessellate>1</tessellate><coordinates>${cs(g.c)}</coordinates></LineString>`
      : `<Polygon><outerBoundaryIs><LinearRing><coordinates>${cs(g.rings[0])}</coordinates></LinearRing></outerBoundaryIs>${g.rings.slice(1).map(r => `<innerBoundaryIs><LinearRing><coordinates>${cs(r)}</coordinates></LinearRing></innerBoundaryIs>`).join('')}</Polygon>`);
    return `<Placemark><name>${kmlEsc(name)}</name><styleUrl>#s</styleUrl><ExtendedData>${keys.map(k => `<Data name="${kmlEsc(k)}"><value>${kmlEsc(f.props[k])}</value></Data>`).join('')}</ExtendedData>${geo.length > 1 ? `<MultiGeometry>${geo.join('')}</MultiGeometry>` : geo[0]}</Placemark>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${kmlEsc(title)}</name>
<Style id="s"><LineStyle><color>${kcol}</color><width>3</width></LineStyle><PolyStyle><color>40${kcol.slice(2)}</color></PolyStyle><IconStyle><color>${kcol}</color></IconStyle></Style>
${pms}
</Document></kml>`;
}
async function wfsFeatures(rec, b) {
  const w = wfsFor(rec); if (!w) throw new Error('este servicio no publica sus datos');
  await wfsResolve(w);
  const fromJSON = txt => { const j = JSON.parse(txt); return (j.features || []).map(f => ({ props: Object.fromEntries(Object.entries(f.properties || {}).filter(([, v]) => v !== null && v !== '' && typeof v !== 'object')), geoms: geomFromGeoJSON(f.geometry) })).filter(x => x.geoms.length); };
  let feats = null, err = null;
  for (const [json, v2] of [[true, false], [false, false], [false, true]]) { // JSON, GML y WFS 2.0 (INSPIRE), por este orden
    if (json && !w.json) continue;
    try { const txt = await httpGetText(wfsUrl(w, b, json, v2)); feats = json ? fromJSON(txt) : featsFromGML(txt); break; } catch (e) { err = e; }
  }
  if (!feats) throw err || new Error('sin respuesta');
  return feats;
}
// Zona: lo que se ve en pantalla o el entorno de las trazas de la obra
function obraBounds(pad) {
  const pts = []; layers.forEach(e => { if (typeOf(e.rec) === 'kml' && e.feats) e.feats.forEach(f => f.parts.forEach(p => p.c.forEach(c => pts.push(c)))); });
  if (!pts.length) return null;
  const b = L.latLngBounds(pts), dLat = pad / 111320, dLng = pad / (111320 * Math.cos(b.getCenter().lat * Math.PI / 180));
  return L.latLngBounds([b.getSouth() - dLat, b.getWest() - dLng], [b.getNorth() + dLat, b.getEast() + dLng]);
}
function wfsSheet(ids) {
  const list = ids.map(id => layers.get(id)).filter(e => e && wfsOk(e.rec)), sin = ids.map(id => layers.get(id)).filter(e => e && typeOf(e.rec) === 'wms' && !wfsOk(e.rec));
  const ob = obraBounds(500);
  const b = openSheet(`<h2>Pasar a KML</h2><p class="sub">Se descargan los elementos de ${plural(list.length, 'capa', 'capas')} de servicios y se crea una capa KML de cada una</p>
    ${list.length ? `<ul class="plain">${list.map(e => `<li>${esc(e.rec.name)}</li>`).join('')}</ul>` : '<p class="empty">Ninguna de las capas elegidas publica sus datos.</p>'}
    ${sin.length ? `<p class="hint">No se pueden pasar a KML (solo dan imagen): ${sin.map(e => esc(e.rec.name)).join(', ')}.</p>` : ''}
    <div class="field"><span class="flabel">Zona</span><div class="seg">
      <button type="button" class="on" data-z="view">Lo que se ve en pantalla</button>
      <button type="button" data-z="obra" ${ob ? '' : 'disabled'}>Entorno de las trazas (500 m)</button></div></div>
    <p class="hint">Como mucho ${thousands(WFS_MAX)} elementos por capa: si la zona es grande, acerca el mapa.</p>
    <div class="acts"><button class="btn pri full" data-a="go" ${list.length ? '' : 'disabled'}>Pasar a KML</button></div><div id="wfsRes"></div>`);
  let zona = 'view';
  b.querySelectorAll('[data-z]').forEach(bt => bt.onclick = () => { zona = bt.dataset.z; b.querySelectorAll('[data-z]').forEach(x => x.classList.toggle('on', x === bt)); });
  b.querySelector('[data-a=go]').onclick = async () => {
    const bounds = zona === 'obra' && ob ? ob : map.getBounds(), res = $('#wfsRes'), go = b.querySelector('[data-a=go]'); go.disabled = true;
    const out = []; let last = null;
    for (const e of list) {
      res.innerHTML = `<p class="hint">Descargando «${esc(e.rec.name)}»…</p>`;
      try {
        const feats = await wfsFeatures(e.rec, bounds);
        if (!feats.length) { out.push(`<li>${esc(e.rec.name)}: no hay elementos en la zona</li>`); continue; }
        const nk = [...layers.values()].filter(x => typeOf(x.rec) === 'kml').length, color = PALETTE[nk % PALETTE.length];
        const text = featsToKML(e.rec.name, feats, color);
        const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name: `${e.rec.name} (datos)`, text, color, visible: true, opacity: 1, order: nextOrder(), created: Date.now(), folder: 'Servicios y afecciones/En KML' };
        await DB.put('layers', rec); last = registerLayer(rec);
        out.push(`<li><b>${esc(e.rec.name)}</b>: ${plural(feats.length, 'elemento', 'elementos')}${feats.length >= WFS_MAX ? ' (límite: acerca el mapa para tenerlos todos)' : ''}</li>`);
      } catch (er) { out.push(`<li>${esc(e.rec.name)}: no se pudo (${esc(er.message || String(er))})</li>`); }
    }
    drawPK(); if (!$('#drawer').hidden) renderDrawer();
    res.innerHTML = `<ul class="plain">${out.join('')}</ul><p class="hint">Las capas nuevas están en la carpeta «Servicios y afecciones › En KML». Se pueden tocar, exportar y usar en el informe de afecciones.</p>`;
    go.disabled = false;
    if (last && zona === 'obra') map.fitBounds(bounds);
  };
}
