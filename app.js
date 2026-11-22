'use strict';
/* OBRA-GIS v1.18.8 (2026-11-22) — visor de KML/KMZ sobre ortofoto con gestor de capas, anotaciones
   georreferenciadas (fotos, vídeos, notas de voz y texto), importación de fotos con GPS
   y navegación con Google Maps. Funciona como web instalable y como app nativa (Capacitor). */

/* ---------------- Versión de la app ----------------
   Cambia APP_VERSION en cada entrega (también se usa como versión de la app Android).
   Formato MAYOR.MENOR.CORRECCIÓN: menor = función nueva, corrección = arreglo. */
const APP_VERSION = '1.18.8';
const APP_DATE = '2026-11-22';
const CHANGELOG = [
  ['1.18.8', '22/11/2026', 'Depuración: los puntuales del «+» ya no quedan bajo «Cerrar» y van arriba; caño, arqueta, entronque y badén sin número cuentan 1 ud en todas las salidas (el bacheo, por superficie, no); andando hacia atrás «Aquí» en «Hasta PK» alarga el tramo sin perder metros; «Guardar y seguir andando» desde el editor también ofrece «Deshacer»; un toque fallido ya no borra el «Deshacer»; en una cadena «sin medidas» no se vuelve a preguntar en cada corte; un tramo de milímetros avisa de 0 m; nombres claros en «▶ Seguir»; un doble toque sin querer ya no amplía el mapa; avisos arriba, sin tapar «▶ Seguir».'],
  ['1.18.7', '22/11/2026', 'Depuración: «Deshacer» caduca en cuanto cambia la situación (no puede borrar un tramo viejo ni solapar tramos); «Guardar y seguir andando» sigue desde el PK guardado aunque se corrija en el editor y también después de «Guardar sin medidas» o «Guardar con 0 m»; la ficha «+» tiene un pie «Cerrar» bajo el dedo (un toque de más ya no apunta un puntual); badén y puntuales sin número cuentan 1 ud en pantalla, CSV, informe y BC3; «▶ Seguir» muestra el tipo y ofrece el último tramo aunque luego se apunte un caño; el «+» ya no se mueve; el PK en directo no se queda con una lectura vieja; pulido de Irene.'],
  ['1.18.6', '22/11/2026', '«▶ Seguir» junto al «+»: un toque empieza andando otro tramo como el último. «Deshacer» siempre arriba, sin tapar nada. «Terminar aquí» desde el «+» vuelve a funcionar. «Guardar y seguir andando» desde el editor, también hacia atrás, sin tramos repetidos. Si no hay medidas que copiar, «Guardar y seguir» abre el editor. Badén puntual por unidad en el BC3. Puntuales protegidos 1,5 s frente a toques de más. Foco accesible en las fichas.'],
  ['1.18.5', '21/11/2026', 'Actuaciones puntuales (caño, badén, arqueta) con un toque desde el «+». «Guardar y seguir» en la barra del tramo (antes «Y seguir»), también andando hacia atrás. «Deshacer» ya no tapa la barra del tramo. Toques de más protegidos al abrir el «+», al terminar un tramo y al cerrar fichas. Aviso de actuaciones sin medidas con «Guardar sin medidas». Tramos andando solo de tipos lineales. Total del BC3 siempre a la vista.'],
  ['1.18.4', '21/11/2026', 'Trabajo más fluido: «Y seguir» en la barra del tramo guarda el tramo y empieza el siguiente igual sin abrir nada; al terminar un tramo, sus medidas se rellenan con las de la última del mismo tipo y hay «Guardar y seguir andando»; tipos recientes como atajo en el «+»; «Deshacer» en lugar de preguntas al cancelar un tramo o eliminar una actuación; vibración al empezar y terminar; pantalla encendida durante el tramo; revisión antes de enviar a la oficina. Arreglos: «Guardar con 0 m» ya no queda tapado, un toque de más al aparecer la barra no termina el tramo, no se puede terminar un tramo sin haber andado, precios «0.125» y aviso en «24.800», cambiar una foto cuenta como cambio, y más.'],
  ['1.18.3', '21/11/2026', 'Nuevo diseño: colores con buen contraste (también en modo oscuro y a pleno sol), botones de 48 px, opción elegida con ✓ distinta de «Guardar», naranja solo para las acciones de campo. Menú por secciones (informes, herramientas, más, ajustes), ficha «+» más corta con «Repetir» en una fila, editor de actuación en 4 pasos con «Más opciones». Tramo andando: se elige y luego se pulsa «Empezar» (un toque de más nunca empieza un tramo) y el mapa acompaña. Aviso de 0 m dentro de la ficha con su botón. BC3: importe y total a la vista, precios con punto de miles, bases sin «#», partidas auxiliares, caño por unidad. Borradores más robustos y por obra. El APK lleva el código ofuscado.'],
  ['1.18.2', '21/11/2026', 'Arreglos de la tercera ronda de pruebas. Borradores: uno por anotación o actuación (guardar o cerrar otra ya no borra el que tenías pendiente), copia al pasar la app a segundo plano y sin avisos falsos. Tramo andando: un toque rápido de más ya no elige un tipo, «Repetir la última andando», aviso antes de descartar un tramo en curso, barra a todo el ancho y sin avisos de GPS pasajeros. 0 m: los puntuales (badén, caño, arqueta…) se guardan sin aviso; los demás piden un segundo «Guardar» pausado. BC3: sin precios básicos de las descomposiciones en las propuestas, palabra principal obligatoria (caño ≠ limpieza de drenaje), unidades «Tn», «ml», «Ud»…, propuestas no fijadas al cambiar de base, resumen conservado sin la base, ajustes dañados saneados, sin notación científica y códigos únicos. Aviso al escribir un PK que pasa del final, etiquetas que no se montan, nombres con segundos.'],
  ['1.18.1', '21/11/2026', 'Arreglos de la segunda ronda de pruebas. BC3: precios con coma de la base, unidad y precio tomados de la partida elegida, propuestas más prudentes y sin códigos repetidos, líneas de medición que suman el total, códigos propios únicos y BC3 incluido en «Enviar a la oficina». Los avisos ya no tapan botones; la barra del tramo deja libre la cámara. Toques repetidos que ya no abren otra ficha por error. Borradores guardados mientras se escribe. Tramo andando por obra, con margen automático y a menos de 50 m del camino. Dictado que avisa si no responde. Modo sencillo más limpio.'],
  ['1.18.0', '20/11/2026', 'Tramo andando: «Empezar tramo aquí» y «Terminar aquí» con el GPS, sin tener el editor abierto. «Repetir la última» actuación desde donde acabó la anterior. «Enviar a la oficina» en un paso (paquete de obra + informe de la visita + mediciones). Exportación de mediciones a BC3 (FIEBDC-3) con los códigos de tu base de precios o presupuesto. Modo sencillo con letra grande, guía de primer uso y dictado por voz en las observaciones.'],
  ['1.17.1', '20/11/2026', 'Arreglos tras las pruebas con usuarios: PK bien escritos (nunca «0+1000») y bien leídos («1.250», «1+250», «250 m»), con comprobación al escribir; números con unidades y avisos de valores imposibles; lo escrito en actuaciones y anotaciones ya no se pierde (borrador recuperable); sin toques fantasma; botón Atrás cierra fichas; importación de obras que no borra nada si falla; fotos y copias con nombres únicos; invertir trazas sin riesgo; actuaciones conservadas al borrar una capa y reenlazadas al recargarla; polígonos con huecos; distancias sobre el elipsoide; tramificación exacta con cotas del KML; mismas cifras en pantalla, CSV, KMZ e informe; botones más grandes y «Guardar» siempre visible.'],
  ['1.17.0', '20/11/2026', 'Actuaciones completas: catálogo en desplegable por familias (desbroces, demoliciones, explanada, firmes, drenaje, contención, sobreanchos/abanicos…) con favoritas y recientes, datos de cada una (ancho, espesor, altura, unidades, material…) y mediciones automáticas (m, m², m³, t). Informe de la visita con resumen de mediciones, croquis y fotos. Etiquetas de actuación que se pueden tocar. Ocultar elementos. Ancho en el punto tocado y anchos a mano. Subcalibración de PK hasta 10 m. PK en directo con el GPS. Copias de seguridad en Documentos y arreglo de la exportación de obras en Android. La app Android ya se actualiza sin desinstalar (firma fija).'],
  ['1.16.0', '10/11/2026', 'Ficha de inspección de campo (restauración de caminos agrarios): al cargar el previo (BC3 del presupuesto y .zip con los KMZ del camino y de las actuaciones y sus fotos) la app sitúa trazas y fotos y rellena sola la parte de PROYECTO de la ficha con las partidas del presupuesto, su medición y su tramo de PK. En la visita se rellena la parte de CAMPO con botones grandes: ¿coincide con la realidad?, lo detectado en campo, otras actuaciones in situ situadas con GPS, anchos cada 100 m («¿En qué PK estoy?»), vías de acceso, zona de actuación, recursos y fotos de cada casilla con su PK. Se exporta para imprimir o PDF y en JSON para la revisión del presupuesto, y viaja en el paquete de obra.'],
  ['1.15.0', '09/11/2026', 'Tramificación de pendientes: la traza se divide en rangos (menos del 5 %, 5–10 %, 10–20 % y 20 % o más, editables) con la longitud y el porcentaje de cada uno, sus tramos con PK, colores en el mapa, pendiente media, pendiente media absoluta y desnivel medio (m/km). Exportación a CSV y KMZ.'],
  ['1.14.0', '07/11/2026', 'Informe de afecciones de las trazas que elijas: recorre cada traza consultando las capas de servicios marcadas, con banda a cada lado del eje, y da las afecciones por tramos de PK con los organismos a consultar. Se exporta como informe para imprimir o PDF, CSV y KMZ, y va en el paquete de obra.'],
  ['1.13.0', '07/11/2026', 'Calibración de los KML: distancia entre marcas de PK configurable en Ajustes para todas las trazas (5 m a 1 km u otra distancia) y, si se quiere, distinta para cada capa. Las marcas y rótulos se adaptan al zoom para no amontonarse.'],
  ['1.12.0', '04/11/2026', 'Carpetas en árbol y selección múltiple de capas (mantener pulsado): mostrar, ocultar, subir, bajar, mover a carpeta, unir, exportar y borrar. Invertir el sentido de una traza con sus PK. KML de puntos. Unión de KML sin perder información. Tabla de atributos con exportación e importación CSV (Excel/Calc). Propiedades de la capa. Capa de recursos (plantas de RCD, hormigón, canteras, aglomerado…). Calculadora: distancias, áreas, pendientes, coordenadas y distancia por carretera. Pendientes por tramos ≤/≥. Fecha de la ortofoto. Modo sin conexión por municipio o tocando el mapa. Licencia de uso. Se retira Google híbrido.'],
  ['1.11.0', '27/10/2026', 'Fotos con marca de agua: la app lee el texto de la marca (coordenadas, UTM, fecha, altitud), sitúa la foto y le vuelve a escribir los metadatos GPS. Las fotos hechas con la app llevan también GPS en sus metadatos. Compartir fotos con GPS.'],
  ['1.10.0', '27/10/2026', 'Anchos del camino: datos cada X metros o en cada cambio de ancho, ancho medio, mínimo, máximo y superficie, también por tramos. Plataforma dibujada en el mapa. Trazas nuevas dibujando en el mapa o grabando con el GPS.'],
  ['1.9.0', '25/10/2026', 'Control de versiones: número de versión visible, historial de novedades y versión en los paquetes de obra.'],
  ['1.8.0', '25/10/2026', 'Obras: cada obra guarda sus capas y datos. Árbol de capas por carpetas. Paquete de obra (.zip) para exportar, compartir e importar en otro móvil.'],
  ['1.7.0', '25/10/2026', 'Actuaciones en trazas (escolleras, badenes, cunetas…) por PK, margen y fotos. Listado y exportación a Excel (CSV) y KMZ.'],
  ['1.6.0', '25/10/2026', 'Pendiente media y perfil longitudinal de una traza o un tramo (por PK o tocando el mapa). Cotas del KML o del MDT05 del IGN.'],
  ['1.5.0', '25/10/2026', 'Marcas de PK cada 100 m en las trazas según el zoom. PK del punto tocado.'],
  ['1.4.0', '23/10/2026', 'La app pasa a llamarse OBRA-GIS.'],
  ['1.3.0', '23/10/2026', 'Catálogo de servicios públicos (DERA, REDIAM, MITECO, Catastro, SIGPAC), kit de afecciones y consulta de afecciones en un punto.'],
  ['1.2.0', '22/10/2026', 'Fotos con GPS, gestor de capas con servicios WMS y versión nativa Android compilada en GitHub.'],
  ['1.1.0', '22/10/2026', 'Abrir KML/KMZ compartidos desde otras apps.'],
  ['1.0.0', '22/10/2026', 'Primera versión: visor de KML/KMZ sobre ortofoto, navegación con Google Maps, anotaciones con fotos, vídeo y voz.'],
];

const $ = (s, r = document) => r.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const Plug = name => (window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins[name] : null);

const ICON = {
  menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  locate: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  photo: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
  audio: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  nav: '<svg viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>',
  swap: '<svg viewBox="0 0 24 24"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  calc: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2M16 12v4"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>',
  table: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v16"/></svg>',
  width: '<svg viewBox="0 0 24 24"><path d="M5 3v18M19 3v18M8 12h8M8 12l2-2M8 12l2 2M16 12l-2-2M16 12l-2 2"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>',
  road: '<svg viewBox="0 0 24 24"><path d="M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3"/></svg>',
  slope: '<svg viewBox="0 0 24 24"><path d="M3 19L21 7M3 19h18M15 19v-8"/></svg>',
  ruler: '<svg viewBox="0 0 24 24"><path d="M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
  gallery: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 6h6l2 2h10v11H3z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  kml: '<svg viewBox="0 0 24 24"><path d="M3 18l6-8 4 5 3-3 5 6"/></svg>',
  wms: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
};

/* ---------------- Almacenamiento local (IndexedDB) ---------------- */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('campo-kml', 4);
    r.onupgradeneeded = () => {
      const d = r.result, has = n => d.objectStoreNames.contains(n);
      if (!has('layers')) d.createObjectStore('layers', { keyPath: 'id' });
      if (!has('notes')) d.createObjectStore('notes', { keyPath: 'id' });
      if (!has('kv')) d.createObjectStore('kv');
      if (!has('acts')) d.createObjectStore('acts', { keyPath: 'id' }); // actuaciones lineales sobre trazas
      if (!has('obras')) d.createObjectStore('obras', { keyPath: 'id' }); // cada obra agrupa sus capas y datos
      if (!has('resources')) d.createObjectStore('resources', { keyPath: 'id' }); // plantas, canteras… comunes a todas las obras
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  async function tx(store, mode, fn) {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Operación cancelada'));
    });
  }
  return {
    all: s => tx(s, 'readonly', st => st.getAll()),
    get: (s, k) => tx(s, 'readonly', st => st.get(k)),
    put: (s, v, k) => tx(s, 'readwrite', st => (k === undefined ? st.put(v) : st.put(v, k))),
    del: (s, k) => tx(s, 'readwrite', st => st.delete(k)),
    // varias escrituras en una sola transacción: o se guardan todas o ninguna
    putMany: async list => { const d = await open(), stores = [...new Set(list.map(x => x[0]))];
      return new Promise((res, rej) => { const t = d.transaction(stores, 'readwrite'); list.forEach(([s0, v]) => t.objectStore(s0).put(v));
        t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Operación cancelada')); }); },
  };
})();

const settings = { base: 'pnoa', catastro: false, googleKey: '', travel: 'driving', stamp: true, view: null, notesVisible: true, pk: true, activeObra: null, collapsed: {} };
const saveSettings = () => DB.put('kv', { ...settings }, 'settings').catch(() => {});

/* ---------------- Utilidades geográficas ---------------- */
const fmtLen = m => (m >= 1000 ? (m / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(m) + ' m');
const fmtLL = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
const fmtDate = t => new Date(t).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const thousands = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function toUTM(lat, lon, forceZone) { // WGS84 ≈ ETRS89 (diferencia submétrica)
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const zone = forceZone || Math.floor((lon + 180) / 6) + 1;
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const p = lat * Math.PI / 180, l = lon * Math.PI / 180, l0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(p) ** 2), T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = Math.cos(p) * (l - l0);
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
  const x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
  let y = k0 * (M + N * Math.tan(p) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  if (lat < 0) y += 10000000;
  return { zone, x, y };
}
const fmtUTM = (lat, lng) => { const u = toUTM(lat, lng); return `UTM ETRS89 H${u.zone}  X ${thousands(u.x)}  Y ${thousands(u.y)}`; };
const coordsBlock = (lat, lng) => `<div class="coords">${fmtLL(lat, lng)}<br>${fmtUTM(lat, lng)}</div>`;

const navUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}&travelmode=${settings.travel}`;
const viewUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
const goBtn = (lat, lng, label, extra = '') => `<a class="btn go ${extra}" href="${navUrl(lat, lng)}" target="_blank" rel="noopener">${ICON.nav}${esc(label)}</a>`;
function distFromMe(lat, lng) {
  if (!lastPos) return '';
  return ` · a ${fmtLen(L.latLng(lastPos.lat, lastPos.lng).distanceTo([lat, lng]))} de ti`;
}

/* ---------------- Lectura de EXIF (coordenadas, fecha y orientación de fotos) ---------------- */
async function readExif(file) {
  const buf = await file.slice(0, 256 * 1024).arrayBuffer();
  const v = new DataView(buf);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null; // no es JPEG
  let off = 2;
  while (off + 4 <= v.byteLength) {
    const marker = v.getUint16(off);
    if ((marker & 0xFF00) !== 0xFF00) break;
    const len = v.getUint16(off + 2);
    if (marker === 0xFFE1 && off + 10 <= v.byteLength && v.getUint32(off + 4) === 0x45786966) return parseTiff(v, off + 10);
    if (marker === 0xFFDA) break; // empieza la imagen
    off += 2 + len;
  }
  return null;
}
function parseTiff(v, t) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = o => v.getUint16(o, le), u32 = o => v.getUint32(o, le);
  const SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const ifd = o => {
    const tags = {}; const n = u16(o);
    for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; tags[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 }; }
    return tags;
  };
  const val = tag => {
    if (!tag) return null;
    const { type, count, at } = tag, size = (SIZE[type] || 1) * count;
    const p = size > 4 ? t + u32(at) : at;
    if (p + size > v.byteLength) return null;
    if (type === 2) { let s = ''; for (let i = 0; i < count; i++) { const c = v.getUint8(p + i); if (!c) break; s += String.fromCharCode(c); } return s; }
    const out = [];
    for (let i = 0; i < count; i++) {
      if (type === 5) { const b = u32(p + i * 8 + 4); out.push(b ? u32(p + i * 8) / b : 0); }
      else if (type === 10) { const b = v.getInt32(p + i * 8 + 4, le); out.push(b ? v.getInt32(p + i * 8, le) / b : 0); }
      else if (type === 3) out.push(u16(p + i * 2));
      else if (type === 4) out.push(u32(p + i * 4));
      else out.push(v.getUint8(p + i));
    }
    return out;
  };
  const ifd0 = ifd(t + u32(t + 4));
  const res = {};
  if (ifd0[0x8769]) { const ex = ifd(t + val(ifd0[0x8769])[0]); const d = val(ex[0x9003]) || val(ifd0[0x0132]); if (d) res.date = exifDate(d); }
  if (ifd0[0x8825]) {
    const g = ifd(t + val(ifd0[0x8825])[0]);
    const lat = val(g[2]), lng = val(g[4]), latRef = val(g[1]), lngRef = val(g[3]);
    if (lat && lng && lat.length === 3 && lng.length === 3) {
      let la = lat[0] + lat[1] / 60 + lat[2] / 3600, lo = lng[0] + lng[1] / 60 + lng[2] / 3600;
      if (latRef === 'S') la = -la; if (lngRef === 'W') lo = -lo;
      if (isFinite(la) && isFinite(lo) && !(la === 0 && lo === 0) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) { res.lat = la; res.lng = lo; }
    }
    const alt = val(g[6]); if (alt) res.alt = (val(g[5]) || [0])[0] === 1 ? -alt[0] : alt[0];
    const dir = val(g[0x11]); if (dir && isFinite(dir[0])) res.dir = dir[0];
  }
  return res;
}
function exifDate(s) { // "AAAA:MM:DD HH:MM:SS" en hora local
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s || '');
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null;
}

/* ---------------- Interfaz: aviso, hoja inferior, panel ---------------- */
let toastT;
function toast(msg, ms = 3500) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms);
}

let sheetCleanup = [], pendingUrls = [];
let sheetOpenAt = 0, editorRerender = false, sheetTitle = '', lastFocus = null;
function openSheet(html, cls = '') {
  const urls = pendingUrls; pendingUrls = [];
  const wasHidden = $('#sheet').hidden;
  closeSheet(true);
  const title = (/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html) || [])[1] || html.slice(0, 80);
  if (wasHidden || title !== sheetTitle) sheetOpenAt = Date.now(); // ficha nueva bajo el dedo (también si sustituye a otra): se ignoran los toques de 350 ms
  sheetTitle = title;
  if (wasHidden) { armBack(); lastFocus = document.activeElement; } // «Atrás» la cierra · el foco vuelve aquí al cerrar
  urls.forEach(u => sheetCleanup.push(() => URL.revokeObjectURL(u)));
  if (/^Obteniendo posición/.test($('#toast').textContent)) $('#toast').hidden = true; // aviso ya resuelto
  const b = $('#sheetBody'); b.className = cls; b.innerHTML = html;
  $('#sheet').hidden = false; $('#sheet').scrollTop = 0;
  a11ySheet(b, wasHidden || sheetOpenAt === Date.now());
  return b;
}
// Accesibilidad de las fichas: diálogo con título, foco al título al abrir y estado «pulsado» de los botones segmentados
function a11ySheet(b, fresh) {
  const sh = $('#sheet'), h = b.querySelector('h2');
  sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'false');
  if (h) { h.id = h.id || 'sheetTitle'; h.tabIndex = -1; sh.setAttribute('aria-labelledby', h.id); if (fresh) try { h.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  b.querySelectorAll('.seg button:not([role])').forEach(x => x.setAttribute('aria-pressed', x.classList.contains('on')));
}
new MutationObserver(ms => ms.forEach(m => { const x = m.target; if (x.matches && x.matches('.seg button:not([role])')) x.setAttribute('aria-pressed', x.classList.contains('on')); }))
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
function onSheetClose(fn) { sheetCleanup.push(fn); }
let histArmed = false;
function armBack() { if (!histArmed) { try { history.pushState({ obragis: 1 }, ''); histArmed = true; } catch (e) { /* nada */ } } }
window.addEventListener('popstate', () => {
  histArmed = false;
  if (!$('#viewer').hidden) { $('#viewer').hidden = true; armBack(); return; }
  if (!$('#sheet').hidden) { closeSheet(); return; }
  if (!$('#drawer').hidden) { closeDrawer(); return; }
});
// Evita «toques fantasma»: si se pulsa dos veces seguidas, el segundo toque caía en el botón que aparece debajo del dedo
document.addEventListener('click', e => {
  if (e.isTrusted && Date.now() - sheetOpenAt < 350 && e.target.closest && e.target.closest('#sheetBody button, #sheetBody a')) { e.stopPropagation(); e.preventDefault(); }
}, true);
// Al pasar la app a segundo plano (o cerrarla) se guarda al momento lo que se esté escribiendo
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') return;
  try { if (typeof draft !== 'undefined' && draft && $('#nTitle')) { syncDraft(); storeDraft('note', { ...draft, media: [...draft.media] }, true); }
    if (typeof actDraft !== 'undefined' && actDraft && $('#aText')) { syncAct(); storeDraft('act', { ...actDraft, params: { ...actDraft.params } }, true); } } catch (e) { /* nada */ } });
/* ---------------- Borradores: lo que se escribe no se pierde ----------------
   Si se cierra un editor sin guardar (X, Escape, otra ficha, la app se cierra…), el borrador se guarda y se ofrece recuperarlo. */
// Huella de una actuación para saber si ha cambiado (parámetros vacíos o internos no cuentan; PK redondeados al cm)
const actKey = d => JSON.stringify([d.type, Math.round((+d.d0 || 0) * 100), Math.round((+d.d1 || 0) * 100), d.side, String(d.text || ''), Object.fromEntries(Object.entries(d.params || {}).filter(([k, v]) => v != null && v !== '' && k[0] !== '_').sort()), d.prio || '', (d.media || []).map(m => m && m.id || '?').join(',')]); // las fotos cuentan por su identificador (cambiar una por otra también es un cambio)
const noteKey = d => JSON.stringify([String(d.title || ''), String(d.text || ''), (d.media || []).map(m => m && m.id || '?').join(',')]);
let pendingDraft = null, drafts = {}; // un borrador por anotación o actuación (id → { kind, data, t }); pendingDraft = el más reciente
const draftHasContent = d => !!(d && d.data && ((d.data.media || []).length || String(d.data.text || '').trim() || (d.kind === 'act' ? d.data.type : String(d.data.title || '').trim() && d.data.title !== d.data._autoTitle)));
// solo se ofrecen los borradores de la obra abierta (los de otras obras esperan a que se abra la suya)
function refreshPending() { const l = Object.values(drafts).filter(d => draftHasContent(d) && (!d.data.obraId || d.data.obraId === settings.activeObra)).sort((x, y) => y.t - x.t); pendingDraft = l[0] || null; return l.length; }
// un borrador leído de la base de datos se comprueba y se normaliza; si está dañado se descarta solo ese
function cleanDraft(d) {
  if (!d || typeof d !== 'object' || !d.data || typeof d.data !== 'object' || !['act', 'note'].includes(d.kind)) return null;
  const x = { ...d.data }; if (!x.id || typeof x.id !== 'string') x.id = uid();
  x.media = Array.isArray(x.media) ? x.media.filter(m => m && m.blob instanceof Blob) : [];
  x.text = typeof x.text === 'string' ? x.text : x.text == null ? '' : String(x.text);
  if (d.kind === 'note') { x.title = typeof x.title === 'string' ? x.title : ''; if (!isFinite(x.lat) || !isFinite(x.lng)) return null; }
  else { if (!isFinite(x.d0) || !isFinite(x.d1)) return null; x.params = x.params && typeof x.params === 'object' && !Array.isArray(x.params) ? x.params : {}; }
  return { kind: d.kind, data: x, t: isFinite(d.t) ? d.t : Date.now() };
}
async function storeDraft(kind, data, silent) {
  if (!data || !data.id) return;
  drafts[data.id] = { kind, data, t: Date.now() }; refreshPending();
  try { await DB.put('kv', drafts, 'drafts'); } catch (e) { /* sin espacio */ }
  if (!silent) showDraftBar();
}
async function clearDraft(id) { // sin id: el borrador que muestra la barra
  const k = id || (pendingDraft && pendingDraft.data.id); if (k) delete drafts[k];
  refreshPending(); try { await DB.put('kv', drafts, 'drafts'); } catch (e) { /* nada */ }
  const b = $('#draftBar'); if (b) { if (pendingDraft && $('#sheet').hidden) showDraftBar(); else if (!pendingDraft) b.hidden = true; }
}
function draftLabel(d) { return d.kind === 'act' ? `${d.data.type || 'Actuación sin tipo'} · ${esc(d.data.traceName || '')} · PK ${fmtPK(d.data.d0)}` : esc(d.data.title || d.data.text || 'Anotación'); }
function showDraftBar() {
  if (!pendingDraft) return;
  let el = $('#draftBar'); if (!el) { el = document.createElement('div'); el.id = 'draftBar'; el.className = 'upbanner draftbar'; document.body.appendChild(el); }
  const nD = refreshPending(); if (!pendingDraft) { el.hidden = true; return; }
  el.innerHTML = `<b>Tienes ${pendingDraft.kind === 'act' ? 'una actuación' : 'una anotación'} sin guardar${nD > 1 ? ` (y ${nD - 1} más)` : ''}</b><br><small>${draftLabel(pendingDraft)}${pendingDraft.data.media && pendingDraft.data.media.length ? ` · ${pendingDraft.data.media.length} foto(s)` : ''}</small>
    <div class="row"><button class="mini pri" data-d="go">Seguir editando</button><button class="mini del" data-d="no">Descartar</button></div>`;
  el.hidden = false;
  el.querySelector('[data-d=go]').onclick = () => {
    const d = pendingDraft; if (!d) return;
    try { if (d.kind === 'act') { actDraft = { ...d.data }; renderActEditor(); } else { draft = { ...d.data }; renderEditor(); } el.hidden = true; }
    catch (e) { console.error(e); toast('Este borrador está dañado y no se puede abrir. Puedes descartarlo.', 6000); }
  };
  el.querySelector('[data-d=no]').onclick = () => { const id = pendingDraft && pendingDraft.data.id; if (confirm('¿Descartar lo que no has guardado?')) clearDraft(id); };
}
function closeSheet(replacing) {
  const fns = sheetCleanup; sheetCleanup = [];
  fns.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  if (replacing !== true) { $('#sheet').hidden = true; if (walkAct) walkAct.shown = Date.now(); if (lastFocus && lastFocus.isConnected && lastFocus !== document.body) try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* nada */ } lastFocus = null; } // la barra del tramo reaparece bajo el dedo: 1,5 s sin toques // al sustituir una ficha por otra no se oculta (evita parpadeos y toques perdidos)
  $('#sheetBody').innerHTML = '';
}
const objectUrl = blob => { const u = URL.createObjectURL(blob); pendingUrls.push(u); return u; };

function copyText(text) {
  const done = () => toast('Copiado: ' + text.split('\n')[0]);
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast(text, 6000));
  else toast(text, 6000);
}
const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
const b64ToBlob = (b64, type) => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new Blob([a], { type }); };

// Guardar o enviar un fichero generado (KMZ). En la app nativa abre el menú Compartir de Android.
// En la app nativa el fichero se guarda en Documentos/OBRA-GIS (sobrevive a desinstalar la app) y después se abre
// el menú Compartir. Se escribe por trozos para que los paquetes grandes (con muchas fotos) no agoten la memoria.
let lastSaved = null;
async function nativeWrite(FS, path, blob, directory) {
  const CH = 3 * 1024 * 1024; // múltiplo de 3: el base64 de cada trozo se puede concatenar
  let first = true;
  for (let i = 0; first || i < blob.size; i += CH) {
    const data = await blobToB64(blob.slice(i, i + CH));
    if (first) await FS.writeFile({ path, data, directory, recursive: true });
    else await FS.appendFile({ path, data, directory });
    first = false;
  }
  return (await FS.getUri({ path, directory })).uri;
}
async function saveBlob(blob, name, opts = {}) {
  const FS = Plug('Filesystem'), SH = Plug('Share');
  if (NATIVE && FS) {
    let uri = null, where = '', errMsg = '';
    if (FS.requestPermissions) { try { await FS.requestPermissions(); } catch (e) { /* Android 11+ no lo necesita */ } }
    for (const directory of ['DOCUMENTS', 'EXTERNAL', 'CACHE']) {
      try { uri = await nativeWrite(FS, 'OBRA-GIS/' + name, blob, directory); where = directory; break; }
      catch (e) { errMsg = e.message || String(e); console.warn('No se pudo escribir en', directory, e); }
    }
    if (!uri) throw new Error('no se pudo escribir el fichero en el móvil (' + errMsg + ')');
    lastSaved = { name, where, uri, t: Date.now() };
    if (where === 'DOCUMENTS') toast(`Guardado en Documentos › OBRA-GIS › ${name}`, 7000);
    else if (where === 'EXTERNAL') toast('Guardado en la carpeta de la app. Ojo: se borra si desinstalas la app. Envíalo a Drive o por correo.', 8000);
    if (SH && opts.share !== false) {
      try { await SH.share({ title: name, files: [uri], dialogTitle: 'Guardar o enviar ' + name }); }
      catch (e) { if (!/cancel/i.test(e.message || '') && where === 'CACHE') throw e; }
    }
    return { uri, where };
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  return { where: 'DOWNLOAD' };
}

/* ---------------- Mapa y capas base ---------------- */
const map = L.map('map', { zoomControl: false, renderer: L.canvas({ tolerance: 12 }), maxZoom: 21 }).setView([37.18, -3.6], 9);
if (matchMedia('(pointer:coarse)').matches) map.doubleClickZoom.disable(); // con el dedo se amplía pellizcando; un doble toque sin querer no mueve el mapa
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
map.createPane('rasters').style.zIndex = 350;   // servicios WMS/WMTS, por encima del mapa base
map.createPane('hl').style.zIndex = 590;        // resaltes y mediciones, por debajo de los marcadores
map.getPane('hl').style.pointerEvents = 'none';
const hlRenderer = L.canvas({ pane: 'hl' });

const ign = (svc, layer, fmt) => `https://www.ign.es/wmts/${svc}?service=WMTS&request=GetTile&version=1.0.0&layer=${layer}&style=default&tilematrixset=GoogleMapsCompatible&tilematrix={z}&tilerow={y}&tilecol={x}&format=${fmt}`;
const URL_PNOA = ign('pnoa-ma', 'OI.OrthoimageCoverage', 'image/jpeg');
const URL_LABELS = ign('ign-base', 'IGNBaseOrto', 'image/png');
const ATTR_IGN = 'PNOA y Base IGN CC-BY 4.0 <a href="https://www.scne.es" target="_blank" rel="noopener">scne.es</a>';
// En la app nativa no hay service worker: las teselas guardadas para uso sin conexión se leen aquí.
const CachedTileLayer = L.TileLayer.extend({
  createTile(coords, done) {
    const img = document.createElement('img');
    img.alt = ''; img.setAttribute('role', 'presentation');
    L.DomEvent.on(img, 'load', L.Util.bind(this._tileOnLoad, this, done, img));
    L.DomEvent.on(img, 'error', L.Util.bind(this._tileOnError, this, done, img));
    const url = this.getTileUrl(coords);
    if (!NATIVE || !('caches' in window)) { img.src = url; return img; }
    caches.open('tiles-v1').then(c => c.match(url)).then(r => (r ? r.blob() : null)).then(b => {
      if (!b) { img.src = url; return; }
      const u = URL.createObjectURL(b); img.addEventListener('load', () => URL.revokeObjectURL(u), { once: true }); img.src = u;
    }).catch(() => { img.src = url; });
    return img;
  },
});
const tiles = (url, o) => new CachedTileLayer(url, o);
const CachedWMS = L.TileLayer.WMS.extend({ createTile: CachedTileLayer.prototype.createTile });
const pnoaTiles = () => tiles(URL_PNOA, { maxNativeZoom: 19, maxZoom: 21, attribution: ATTR_IGN });

const BASES = {
  pnoa: { name: 'Ortofoto PNOA híbrida (IGN)', make: () => L.layerGroup([pnoaTiles(), tiles(URL_LABELS, { maxNativeZoom: 18, maxZoom: 21 })]) },
  // google: { name: 'Google híbrido', make: makeGoogle },  ← reservado para una futura versión premium con usuarios
  pnoaSolo: { name: 'Ortofoto PNOA sin rótulos', make: pnoaTiles },
  osm: { name: 'Callejero OpenStreetMap', make: () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 21, maxNativeZoom: 19, attribution: '© OpenStreetMap' }) },
};

// Capa Google (API Map Tiles): retirada de la versión gratuita. Se conserva para una futura versión premium.
let googleCache = null;
async function makeGoogle() {
  const key = (settings.googleKey || '').trim();
  if (!key) throw new Error('Para ver Google híbrido añade tu clave de la API Map Tiles en el menú, apartado Ajustes.');
  if (googleCache && googleCache.key === key && googleCache.exp > Date.now()) return googleCache.layer;
  let r;
  try {
    r = await fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapType: 'satellite', language: 'es-ES', region: 'ES', layerTypes: ['layerRoadmap'] }),
    });
  } catch (e) { throw new Error('Sin conexión con Google. Se muestra la ortofoto del IGN.'); }
  if (!r.ok) {
    let m = ''; try { m = (await r.json()).error.message; } catch (_) {}
    throw new Error('Google no acepta la clave (' + (m || r.status) + '). Revisa que la API Map Tiles esté activada.');
  }
  const j = await r.json();
  const layer = L.tileLayer(`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(j.session)}&key=${encodeURIComponent(key)}`,
    { maxZoom: 22, attribution: 'Imágenes y datos del mapa © Google' });
  googleCache = { key, layer, exp: Number(j.expiry) * 1000 - 3600e3 };
  return layer;
}

let baseLayer = null;
async function setBase(id) {
  let layer;
  try { layer = await BASES[id].make(); } catch (e) {
    toast(e.message, 7000);
    if (id !== 'pnoa') return setBase('pnoa');
    return;
  }
  if (baseLayer) map.removeLayer(baseLayer);
  baseLayer = layer.addTo(map);
  settings.base = id; saveSettings(); odKey = ''; updateOrthoDate();
  if (!$('#drawer').hidden) renderDrawer();
}

/* ---------------- Catálogo de servicios de capas (afecciones de obra) ----------------
   DERA: Datos Espaciales de Referencia de Andalucía (IECA). REDIAM: Junta de Andalucía.
   MITECO: Sistema Nacional de Cartografía de Zonas Inundables y DPH. */
const DERA = (tema, capa, name, extra = {}) => ({ name, kind: 'wms', url: `https://www.ideandalucia.es/services/${tema}/wms`, layers: capa, info: 'json', cover: 'Andalucía', attribution: 'DERA © IECA, Junta de Andalucía', ...extra });
const MITECO = (svc, name, extra = {}) => ({ name, kind: 'wms', url: `https://gis.miteco.gob.es/geoserver/agua/${svc}/wms`, layers: svc, info: 'json', cover: 'España', opacity: 0.6, attribution: '© MITECO', ...extra });
const VVPP_URL = 'https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_Inventario_VVPP';
const CATALOG_GROUPS = [
  { id: 'energia', name: 'Redes eléctricas, gas y energía', items: [
    DERA('DERA_g10_infra_energetica', 'g10_14_LineaElectrica', 'Líneas eléctricas'),
    DERA('DERA_g10_infra_energetica', 'g10_13_SubestacionElectrica', 'Subestaciones eléctricas'),
    DERA('DERA_g10_infra_energetica', 'g10_18_Gasoducto', 'Gasoductos'),
    DERA('DERA_g10_infra_energetica', 'g10_19_Oleoducto', 'Oleoductos'),
    DERA('DERA_g10_infra_energetica', 'g10_15_PlantaGas', 'Plantas de gas'),
    DERA('DERA_g10_infra_energetica', 'g10_03_PlantaSolar', 'Plantas solares'),
    DERA('DERA_g10_infra_energetica', 'g10_02_ParqueEolico', 'Parques eólicos'),
    DERA('DERA_g09_transport_com', 'g09_26_Antena', 'Antenas de telecomunicación'),
  ] },
  { id: 'agua', name: 'Agua: dominio público hidráulico e inundabilidad', items: [
    MITECO('DPH_Estimado', 'DPH cartográfico (cauces)'),
    MITECO('DPH_Deslindado', 'DPH deslindado'),
    MITECO('ZI_Laminas_ZFP', 'Zona de flujo preferente'),
    MITECO('Zi_laminas_q10', 'Zona inundable T=10 años'),
    MITECO('Zi_laminas_q100', 'Zona inundable T=100 años'),
    MITECO('Zi_laminas_q500', 'Zona inundable T=500 años'),
    DERA('DERA_g3_hidrografia', 'g03_01_Rio', 'Ríos y arroyos'),
    DERA('DERA_g3_hidrografia', 'g03_06_Embalse', 'Embalses'),
  ] },
  { id: 'hidraulica', name: 'Infraestructura hidráulica y saneamiento', items: [
    DERA('DERA_g3_hidrografia', 'g03_08_Conduccion', 'Conducciones de agua'),
    DERA('DERA_g3_hidrografia', 'g03_13_CanalArtificial', 'Canales'),
    DERA('DERA_g3_hidrografia', 'g03_11_Canalizacion', 'Canalizaciones'),
    DERA('DERA_g3_hidrografia', 'g03_15_Colector', 'Colectores'),
    DERA('DERA_g3_hidrografia', 'g03_07_Captacion', 'Captaciones'),
    DERA('DERA_g3_hidrografia', 'g03_09_Deposito', 'Depósitos'),
    DERA('DERA_g3_hidrografia', 'g03_10_Balsa', 'Balsas'),
    DERA('DERA_g10_infra_energetica', 'g10_27_Edar', 'Depuradoras (EDAR)'),
    DERA('DERA_g10_infra_energetica', 'g10_29_Etap', 'Potabilizadoras (ETAP)'),
  ] },
  { id: 'transporte', name: 'Carreteras y ferrocarril', items: [
    DERA('DERA_g9_transport_com', 'g09_14_RedCarreteras', 'Red de carreteras'),
    DERA('DERA_g9_transport_com', 'g09_17_PuntoKilometrico', 'Puntos kilométricos'),
    DERA('DERA_g9_transport_com', 'g09_21_Ferrocarril', 'Ferrocarril'),
    DERA('DERA_g9_transport_com', 'g09_19_Camino', 'Caminos'),
    DERA('DERA_g9_transport_com', 'g09_24_ViaVerde', 'Vías verdes'),
  ] },
  { id: 'vvpp', name: 'Vías pecuarias', items: [
    { name: 'Vías pecuarias (inventario REDIAM)', kind: 'wms', url: VVPP_URL, layers: 'Inventario_VVPP', info: 'html', cover: 'Andalucía', attribution: 'REDIAM, Junta de Andalucía' },
    { name: 'Tramos deslindados de vías pecuarias', kind: 'wms', url: VVPP_URL, layers: 'linea_base_deslindada', info: 'html', cover: 'Andalucía', attribution: 'REDIAM, Junta de Andalucía' },
    { name: 'Lugares asociados a vías pecuarias', kind: 'wms', url: VVPP_URL, layers: 'Lugares_VVPP', info: 'html', cover: 'Andalucía', attribution: 'REDIAM, Junta de Andalucía' },
    DERA('DERA_g9_transport_com', 'g09_22_ViasPecuarias', 'Vías pecuarias (DERA)'),
  ] },
  { id: 'natural', name: 'Espacios naturales y montes', items: [
    DERA('DERA_g11_patrimonio', 'g11_07_Enp_RegimenProteccion', 'Espacios naturales protegidos', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_09_RedNatura_ZEC', 'Red Natura 2000 · ZEC', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_09_RedNatura_ZEPA', 'Red Natura 2000 · ZEPA', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_09_RedNatura_LIC', 'Red Natura 2000 · LIC', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_15_Montes', 'Montes públicos', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_14_HumedalesRamsar', 'Humedales Ramsar', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_10_ReservaBiosfera', 'Reservas de la Biosfera', { opacity: 0.5 }),
    DERA('DERA_g11_patrimonio', 'g11_04_InventarioAndaluzGeorrecursos', 'Georrecursos'),
  ] },
  { id: 'patrimonio', name: 'Patrimonio cultural', items: [
    DERA('DERA_g11_patrimonio', 'g11_18_BienesProtegidos_pol', 'Bienes protegidos (áreas)', { opacity: 0.6 }),
    DERA('DERA_g11_patrimonio', 'g11_17_BienesProtegidos_pun', 'Bienes protegidos (puntos)'),
    DERA('DERA_g11_patrimonio', 'g11_19_EntornosProteccionBIC', 'Entornos de protección de BIC', { opacity: 0.5 }),
  ] },
  { id: 'parcelario', name: 'Parcelario, límites y servidumbres', items: [
    { name: 'Parcelas de Catastro', kind: 'wms', url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx', layers: 'Catastro', info: 'html', cover: 'España', attribution: '© D. G. del Catastro' },
    { name: 'SIGPAC · recintos', kind: 'wms', url: 'https://wms.mapa.gob.es/sigpac/wms', layers: 'AU.Sigpac:recinto', info: 'html', cover: 'España', attribution: 'SIGPAC © MAPA' },
    DERA('DERA_g13_limites_administrativos', 'g13_01_TerminoMunicipal', 'Términos municipales', { opacity: 0.8 }),
    DERA('DERA_g13_limites_administrativos', 'g13_42_LineaCostaDMPT', 'Deslinde dominio público marítimo-terrestre'),
    DERA('DERA_g12_servicios', 'g12_31_ZonaMilitar', 'Zonas militares', { opacity: 0.6 }),
    DERA('DERA_g8_tejido_economico', 'g08_07_ActividadExtractiva', 'Actividades extractivas (canteras)'),
  ] },
  { id: 'referencia', name: 'Cartografía de referencia', items: [
    { name: 'Mapa topográfico MTN (IGN)', kind: 'wmts', url: ign('mapa-raster', 'MTN', 'image/jpeg'), maxNative: 18, opacity: 0.7, cover: 'España', attribution: ATTR_IGN },
    DERA('DERA_g1_relieve', 'g01_03_CurvaNivel', 'Curvas de nivel'),
    { name: 'Límites administrativos (IGN)', kind: 'wms', url: 'https://www.ign.es/wms-inspire/unidades-administrativas', layers: 'AU.AdministrativeBoundary', cover: 'España', attribution: ATTR_IGN },
  ] },
];
const CATALOG = CATALOG_GROUPS.flatMap(g => g.items.map(i => ({ ...i, group: g.id })));
// Selección básica para revisar las afecciones de una obra
const AFECCIONES_KIT = ['Líneas eléctricas', 'Subestaciones eléctricas', 'Gasoductos', 'Oleoductos', 'Red de carreteras', 'Ferrocarril',
  'Vías pecuarias (inventario REDIAM)', 'DPH cartográfico (cauces)', 'Zona de flujo preferente', 'Zona inundable T=100 años',
  'Conducciones de agua', 'Canales', 'Espacios naturales protegidos', 'Red Natura 2000 · ZEC', 'Red Natura 2000 · ZEPA',
  'Montes públicos', 'Bienes protegidos (áreas)', 'Bienes protegidos (puntos)', 'Parcelas de Catastro'];

/* ---------------- Lectura de KML ---------------- */
const byTag = (el, tag) => Array.from(el.getElementsByTagNameNS('*', tag));
const childText = (el, tag) => { const n = Array.from(el.children).find(c => c.localName === tag); return n ? n.textContent.trim() : ''; };
const firstText = (el, tag) => { const n = byTag(el, tag)[0]; return n ? n.textContent.trim() : ''; };
const parseCoords = t => (t || '').trim().replace(/\s*,\s*/g, ',').split(/\s+/).map(s => s.split(',').map(Number)) // «lng, lat» con espacios también vale
  .filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1]) && Math.abs(a[0]) <= 180 && Math.abs(a[1]) <= 90).map(a => (a.length > 2 && isFinite(a[2]) ? [a[1], a[0], a[2]] : [a[1], a[0]])); // → [lat, lng, z?]

function kmlColor(abgr) {
  const s = (abgr || '').trim().replace('#', '');
  if (!/^[0-9a-f]{8}$/i.test(s)) return null;
  return { color: '#' + s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4), op: parseInt(s.slice(0, 2), 16) / 255 };
}
function readStyle(st) {
  const o = {};
  const ls = byTag(st, 'LineStyle')[0], ps = byTag(st, 'PolyStyle')[0], is = byTag(st, 'IconStyle')[0];
  if (ls) { const c = kmlColor(firstText(ls, 'color')); if (c) { o.line = c.color; o.lineOp = c.op; } const w = parseFloat(firstText(ls, 'width')); if (w) o.width = w; }
  if (ps) { const c = kmlColor(firstText(ps, 'color')); if (c) { o.fill = c.color; o.fillOp = c.op; } if (firstText(ps, 'fill') === '0') o.noFill = true; }
  if (is) { const c = kmlColor(firstText(is, 'color')); if (c) o.icon = c.color; }
  return o;
}
function parseStyles(doc) {
  const styles = {};
  byTag(doc, 'Style').forEach(st => { const id = st.getAttribute('id'); if (id) styles['#' + id] = readStyle(st); });
  byTag(doc, 'StyleMap').forEach(sm => {
    const id = sm.getAttribute('id'); if (!id) return;
    const pair = byTag(sm, 'Pair').find(p => firstText(p, 'key') === 'normal');
    if (!pair) return;
    const inline = byTag(pair, 'Style')[0];
    styles['#' + id] = inline ? readStyle(inline) : { ref: firstText(pair, 'styleUrl') };
  });
  Object.keys(styles).forEach(k => { const r = styles[k].ref; if (r !== undefined) styles[k] = styles[r.replace(/^.*#/, '#')] || {}; });
  return styles;
}
function htmlToText(html) {
  if (!html) return '';
  const d = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li)>/gi, '\n'), 'text/html');
  return (d.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}
function folderPath(pm) {
  const parts = []; let p = pm.parentElement;
  while (p) { if (p.localName === 'Folder') { const n = childText(p, 'name'); if (n) parts.unshift(n); } p = p.parentElement; }
  return parts.join(' › ');
}
// Distancias y áreas sobre el elipsoide (WGS84 ≈ ETRS89): radios de curvatura en la latitud media.
// Para tramos de obra (vértices a menos de unos km) coincide con el cálculo elipsoidal de QGIS al milímetro.
const ELL_A = 6378137, ELL_E2 = 0.00669437999014;
function ellRadii(lat) { const s2 = Math.sin(lat * Math.PI / 180) ** 2, w = Math.sqrt(1 - ELL_E2 * s2); return { M: ELL_A * (1 - ELL_E2) / (w * w * w), N: ELL_A / w }; }
function ellDist(a, b) {
  const lat = (a.lat + b.lat) / 2, { M, N } = ellRadii(lat), r = Math.PI / 180;
  return Math.hypot((b.lat - a.lat) * r * M, (b.lng - a.lng) * r * N * Math.cos(lat * r));
}
L.CRS.Earth.distance = (a, b) => ellDist(L.latLng(a), L.latLng(b)); // todas las distancias de la app (PK, mediciones, anchos…)
function polyArea(c) { // área en m² sobre el elipsoide (proyección local en el centro del polígono)
  if (c.length < 3) return 0;
  const lat0 = c.reduce((s2, p) => s2 + p[0], 0) / c.length, R = ellRadii(lat0), k = Math.cos(lat0 * Math.PI / 180) * R.N * Math.PI / 180, m = R.M * Math.PI / 180;
  let a = 0; for (let i = 0; i < c.length; i++) { const p = c[i], q = c[(i + 1) % c.length]; a += (p[1] * k) * (q[0] * m) - (q[1] * k) * (p[0] * m); }
  return Math.abs(a) / 2;
}
function lineLength(c) { let s = 0; for (let i = 1; i < c.length; i++) s += L.latLng(c[i - 1]).distanceTo(c[i]); return s; }
function centroid(c) {
  let n = c.length; if (n > 1 && c[0][0] === c[n - 1][0] && c[0][1] === c[n - 1][1]) n--;
  let a = 0, b = 0; for (let i = 0; i < n; i++) { a += c[i][0]; b += c[i][1]; } return [a / n, b / n];
}

function parseKML(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('El fichero no es un KML válido.');
  const styles = parseStyles(doc);
  const docName = firstText(doc.documentElement, 'name');
  const out = [];
  byTag(doc, 'Placemark').forEach((pm, i) => {
    const parts = [];
    byTag(pm, 'Point').forEach(g => { const c = parseCoords(firstText(g, 'coordinates')); if (c.length) parts.push({ t: 'pt', c }); });
    byTag(pm, 'LineString').forEach(g => { const c = parseCoords(firstText(g, 'coordinates')); if (c.length > 1) parts.push({ t: 'ln', c }); });
    byTag(pm, 'Polygon').forEach(g => { const r = byTag(g, 'outerBoundaryIs')[0] || g; const c = parseCoords(firstText(r, 'coordinates'));
      const holes = byTag(g, 'innerBoundaryIs').map(ib => parseCoords(firstText(ib, 'coordinates'))).filter(h => h.length > 2); // huecos (islas, enclaves)
      if (c.length > 2) parts.push(holes.length ? { t: 'pg', c, holes } : { t: 'pg', c }); });
    byTag(pm, 'Track').forEach(g => {
      const c = byTag(g, 'coord').map(n => n.textContent.trim().split(/\s+/).map(Number)).filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1])).map(a => [a[1], a[0]]);
      if (c.length > 1) parts.push({ t: 'ln', c });
    });
    if (!parts.length) return;
    const inline = Array.from(pm.children).find(c => c.localName === 'Style');
    const style = Object.assign({}, styles[(childText(pm, 'styleUrl') || '').replace(/^.*#/, '#')] || {}, inline ? readStyle(inline) : {});
    const attrs = [];
    byTag(pm, 'Data').forEach(d => attrs.push([d.getAttribute('displayName') || d.getAttribute('name') || '', firstText(d, 'value'), d.getAttribute('name') || '']));
    byTag(pm, 'SimpleData').forEach(d => attrs.push([d.getAttribute('name') || '', d.textContent.trim(), d.getAttribute('name') || '']));
    const lines = parts.filter(p => p.t === 'ln');
    const type = lines.length ? 'ln' : parts.some(p => p.t === 'pg') ? 'pg' : 'pt';
    const f = { pm: i, name: childText(pm, 'name') || 'Elemento ' + (i + 1), folder: folderPath(pm), desc: htmlToText(childText(pm, 'description')), attrs, parts, type, style };
    if (type === 'ln') { f.start = lines[0].c[0]; const last = lines[lines.length - 1].c; f.end = last[last.length - 1]; f.length = lines.reduce((s, l) => s + lineLength(l.c), 0); }
    else if (type === 'pg') { const c = parts.find(p => p.t === 'pg').c; f.start = centroid(c); f.length = lineLength(c); f.area = parts.filter(p => p.t === 'pg').reduce((s2, p) => s2 + Math.max(0, polyArea(p.c) - (p.holes || []).reduce((h, r) => h + polyArea(r), 0)), 0); }
    else f.start = parts[0].c[0];
    out.push(f);
  });
  return { docName, feats: out };
}

/* ---------------- Gestor de capas ----------------
   Tipos: kml (vectorial), wms/wmts (imagen de un servicio), photos (fotos importadas con GPS)
   y la capa fija "Mis anotaciones". Las vectoriales se dibujan siempre sobre las de imagen. */
const PALETTE = ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#f783ac', '#ffa94d', '#b197fc', '#3bc9db'];
const layers = new Map();       // id → { rec, feats?, group?, tile? }
const pointGroups = new Map();  // id de capa de puntos → L.layerGroup
const highlight = L.layerGroup().addTo(map);
const typeOf = rec => rec.type || 'kml';
const isPointLayer = rec => typeOf(rec) === 'photos';
const nextOrder = () => Math.max(0, ...[...layers.values()].map(e => e.rec.order || 0)) + 1;

function pointGroup(id) {
  let g = pointGroups.get(id);
  if (!g) { g = L.layerGroup(); pointGroups.set(id, g); }
  return g;
}
function layerVisible(id) {
  if (id === 'notes') return settings.notesVisible !== false;
  if (id === 'acts') return settings.actsVisible !== false;
  if (id === 'res') return settings.resVisible !== false;
  const e = layers.get(id); return !!(e && e.rec.visible);
}

/* ---------------- PK: marcas de distancia en las trazas (cada 100 m por defecto; configurable en general y por capa) ---------------- */
const PK_STEP = 100, PK_STEPS = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const PK_NICE = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
const pkStepOf = rec => Math.max(1, Math.round((rec && rec.pkStep) || settings.pkStep || PK_STEP));
const fmtStep = m => m >= 1000 && m % 1000 === 0 ? `${m / 1000} km` : `${m} m`;
function pkStepOptions(cur, withGeneral) {
  const list = PK_STEPS.includes(cur) || !cur ? PK_STEPS : [...PK_STEPS, cur].sort((a, b) => a - b);
  return (withGeneral ? `<option value="" ${!cur ? 'selected' : ''}>General (${fmtStep(settings.pkStep || PK_STEP)})</option>` : '')
    + list.map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>Cada ${fmtStep(v)}</option>`).join('') + '<option value="otra">Otra distancia…</option>';
}
function askPkStep(sel, cur) {
  if (sel.value !== 'otra') return sel.value === '' ? null : +sel.value;
  const v = parseNum(prompt('Distancia entre marcas de PK, en metros (1 a 5000):', String(cur || settings.pkStep || PK_STEP)) || '');
  if (!isFinite(v) || v < 1 || v > 5000) { toast('Distancia no válida. Escribe un número de metros entre 1 y 5000.'); return undefined; }
  return Math.round(v);
}
// Celda CSV entre comillas. Si el texto empieza por = + @ (o - sin ser un número) se antepone ' para que Excel no lo ejecute como fórmula.
const csvQ = v => { let t = String(v ?? ''); if (/^[=+@\t\r]/.test(t) || (/^-/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t))) t = "'" + t; return '"' + t.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"'; };
// PK con formato km+metros. Se redondea al metro ANTES de separar los km (antes salía «0+1000»).
const fmtPK = d => { if (!isFinite(d)) return '—'; const m = Math.round(Math.abs(d)); return `${d < 0 && m ? '−' : ''}${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, '0')}`; };
function lineParts(f) { return f.parts.filter(p => p.t === 'ln'); }
function chainage(f, step = PK_STEP) {
  const out = []; let acc = 0, next = 0, last = null;
  lineParts(f).forEach(p => {
    const c = p.c;
    for (let i = 1; i < c.length; i++) {
      const a = L.latLng(c[i - 1]), b = L.latLng(c[i]), seg = a.distanceTo(b);
      if (!seg) continue;
      const dx = (b.lng - a.lng) * Math.cos(a.lat * Math.PI / 180), dy = b.lat - a.lat;
      while (next <= acc + seg + 1e-6) {
        const t = (next - acc) / seg;
        out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, d: next, dx, dy });
        next += step;
      }
      acc += seg; last = { lat: b.lat, lng: b.lng, dx, dy };
    }
  });
  if (last && acc - (next - step) > Math.min(15, step * 0.3)) out.push({ ...last, d: acc, end: true }); // PK final de la traza
  return out;
}
// PK del punto de la traza más cercano a una posición
function pkAt(f, ll) {
  const R0 = ellRadii(ll.lat), k = Math.cos(ll.lat * Math.PI / 180) * R0.N / R0.M, M = R0.M * Math.PI / 180;
  let best = Infinity, bestD = 0, acc = 0;
  lineParts(f).forEach(p => {
    const c = p.c;
    for (let i = 1; i < c.length; i++) {
      const ax = c[i - 1][1] * k * M, ay = c[i - 1][0] * M, bx = c[i][1] * k * M, by = c[i][0] * M, px = ll.lng * k * M, py = ll.lat * M;
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
      const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)) : 0;
      const qx = ax + t * vx, qy = ay + t * vy, dist = Math.hypot(px - qx, py - qy);
      const seg = L.latLng(c[i - 1]).distanceTo(c[i]);
      if (dist < best) { best = dist; bestD = acc + t * seg; }
      acc += seg;
    }
  });
  return { d: bestD, off: best };
}
map.createPane('pk').style.zIndex = 420;
map.getPane('pk').style.pointerEvents = 'none';
const pkRenderer = L.canvas({ pane: 'pk' });
const pkLayer = L.layerGroup().addTo(map);
function drawPK() {
  pkLayer.clearLayers();
  const z = map.getZoom();
  if (!settings.pk || z < 12) return;
  const mpp = 40075016.686 * Math.cos(map.getCenter().lat * Math.PI / 180) / (256 * 2 ** z); // metros por píxel
  const bounds = map.getBounds().pad(0.05);
  let n = 0;
  for (const e of layers.values()) {
    if (typeOf(e.rec) !== 'kml' || !e.rec.visible || !e.pk) continue;
    const step = e.pkStep || PK_STEP, base = e.pkBase || step;
    let tickEvery, labelEvery, majorEvery = step;
    if (step / mpp >= 12) {
      // Calibración principal visible: al acercar se añaden subcalibraciones (½, ⅕, 1/10 del paso) sin bajar de 10 m
      const subs = settings.pkSub === false ? [] : [step / 10, step / 5, step / 4, step / 2].filter(v => v >= base && Math.abs(v / base - Math.round(v / base)) < 1e-6);
      tickEvery = subs.find(v => v / mpp >= 16) || step;
      const isM = (x, y) => Math.abs(x / y - Math.round(x / y)) < 1e-6;
      labelEvery = [...new Set([tickEvery, ...subs, ...[1, 2, 5, 10, 20, 50].map(k => k * step)])].sort((x, y) => x - y).find(v => isM(v, tickEvery) && (isM(step, v) || isM(v, step)) && v / mpp >= 64) || step * 50;
    } else {
      const cands = [...new Set([step, ...PK_NICE.filter(v => v % step === 0), ...[2, 5, 10, 20, 50, 100, 200].map(k => k * step)])].sort((x, y) => x - y);
      tickEvery = cands.find(v => v / mpp >= 12); if (!tickEvery) continue;
      labelEvery = cands.find(v => v % tickEvery === 0 && v / mpp >= 60) || tickEvery;
      majorEvery = tickEvery;
    }
    const bigEvery = Math.max(1000, step * 10);
    const op = e.rec.opacity ?? 1;
    for (const m of e.pk) {
      if (n > 2500) return;
      const dr = Math.round(m.d * 100) / 100, mod = v => Math.abs(dr / v - Math.round(dr / v)) < 1e-6;
      if (!m.end && !mod(tickEvery)) continue;
      if (!bounds.contains([m.lat, m.lng])) continue;
      const p = map.latLngToLayerPoint([m.lat, m.lng]);
      const len = Math.hypot(m.dx, m.dy) || 1, nx = m.dy / len, ny = m.dx / len; // perpendicular en pantalla
      const major = m.end || mod(majorEvery), big = m.end || mod(bigEvery), lab = m.end || mod(labelEvery);
      const h = big ? 10 : major ? 7 : 4;
      const a = map.layerPointToLatLng([p.x + nx * h, p.y + ny * h]), b = map.layerPointToLatLng([p.x - nx * h, p.y - ny * h]);
      L.polyline([a, b], { renderer: pkRenderer, color: '#102018', weight: major ? 4 : 3, opacity: 0.55 * op, interactive: false }).addTo(pkLayer);
      L.polyline([a, b], { renderer: pkRenderer, color: major ? '#ffffff' : '#ffe08a', weight: major ? 2 : 1.5, opacity: op, interactive: false }).addTo(pkLayer);
      if (lab) {
        const at = map.layerPointToLatLng([p.x + nx * (h + 13), p.y + ny * (h + 13)]);
        L.marker(at, { interactive: false, keyboard: false, pane: 'pk',
          icon: L.divIcon({ className: 'pk-label' + (big ? ' big' : major ? '' : ' sub'), html: `<span style="opacity:${op}">${fmtPK(m.d)}</span>`, iconSize: [0, 0] }) }).addTo(pkLayer);
      }
      n++;
    }
  }
}
let pkT; map.on('moveend', () => { clearTimeout(pkT); pkT = setTimeout(() => { drawPK(); drawActs(); drawWidths(); }, 60); clearTimeout(odT); odT = setTimeout(updateOrthoDate, 900); });
/* Fecha de vuelo de la ortofoto PNOA en el centro del mapa (capa OI.MosaicElement del IGN) */
let odT, odKey = '';
async function updateOrthoDate() {
  const el = $('#orthoDate'); if (!el) return;
  if (!['pnoa', 'pnoaSolo'].includes(settings.base) || map.getZoom() < 11) { el.hidden = true; return; }
  const c = map.getCenter(), key = `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;
  if (key === odKey) return; odKey = key;
  try {
    const txt = await httpGetText(featureInfoUrl({ url: 'https://www.ign.es/wms-inspire/pnoa-ma', layers: 'OI.MosaicElement' }, c, 'text/html'));
    const info = parseOrthoInfo(txt);
    el.textContent = 'Ortofoto PNOA · ' + (info || 'fecha no disponible en esta zona');
  } catch (e) { el.textContent = 'Ortofoto PNOA · máxima actualidad'; }
  el.hidden = false;
}
function parseOrthoInfo(html) {
  const t = htmlToText(html || '');
  let m, date = '';
  if ((m = /(\d{4})[-/](\d{2})[-/](\d{2})/.exec(t))) date = `${m[3]}/${m[2]}/${m[1]}`;
  else if ((m = /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(t))) date = `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
  else if ((m = /(?:fecha|vuelo|a[ñn]o|date|year)[^\d]{0,20}((?:19|20)\d{2})/i.exec(t))) date = m[1];
  if (!date) return '';
  const r = /(?:resoluci[oó]n|resolution|gsd)[^\d]{0,15}(\d+(?:[.,]\d+)?)\s*(cm|m)?/i.exec(t);
  return 'vuelo ' + date + (r ? ` · ${r[1].replace('.', ',')} ${r[2] || 'm'}/píxel` : '');
}

const isFeatHidden = (rec, i) => !!(rec && rec.hiddenFeats && rec.hiddenFeats.includes(i));
async function setFeatHidden(rec, i, hide) {
  const s0 = new Set(rec.hiddenFeats || []); hide ? s0.add(i) : s0.delete(i);
  await updateLayer(rec.id, { hiddenFeats: [...s0].sort((a, b) => a - b) }); rebuildLayer(rec.id);
}
function buildKml(entry) {
  const { rec } = entry;
  const { feats } = parseKML(rec.text);
  const op = rec.opacity ?? 1;
  const group = L.featureGroup();
  feats.forEach((f, fi) => {
    if (isFeatHidden(rec, fi)) return; // elemento ocultado por el usuario
    const st = f.style, col = st.line || rec.color;
    f.parts.forEach(p => {
      let lyr;
      if (p.t === 'ln') lyr = L.polyline(p.c, { color: col, weight: Math.max(3, st.width || 3), opacity: (st.lineOp > 0.2 ? st.lineOp : 1) * op });
      else if (p.t === 'pg') lyr = L.polygon(p.holes ? [p.c, ...p.holes] : p.c, { color: col, weight: Math.max(2, st.width || 2), opacity: op, fillColor: st.fill || col, fillOpacity: st.noFill ? 0 : Math.min(st.fillOp ?? 0.2, 0.45) * op });
      else lyr = L.circleMarker(p.c[0], { radius: 7, color: '#fff', weight: 2, opacity: op, fillColor: st.icon || rec.color, fillOpacity: op });
      lyr.on('click', e => {
        L.DomEvent.stop(e);
        if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng);
        if (measure) return addMeasurePt(e.latlng);
        featureSheet(f, e.latlng, rec);
      });
      group.addLayer(lyr);
    });
  });
  entry.feats = feats; entry.group = group;
  entry.pkStep = pkStepOf(entry.rec);
  // marcas cada 10 m (o 5 m) para poder dibujar subcalibraciones al acercar el mapa
  entry.pkBase = entry.pkStep % 10 === 0 && entry.pkStep >= 20 ? 10 : entry.pkStep % 5 === 0 && entry.pkStep >= 10 ? 5 : entry.pkStep;
  entry.pk = feats.filter((f, i) => f.type === 'ln' && !isFeatHidden(rec, i)).flatMap(f => chainage(f, entry.pkBase));
}
function buildRaster(entry) {
  const r = entry.rec, common = { pane: 'rasters', opacity: r.opacity ?? 1, maxZoom: 21, attribution: r.attribution || '' };
  entry.tile = r.kind === 'wmts'
    ? tiles(r.url, { ...common, maxNativeZoom: r.maxNative || 19 })
    : new CachedWMS(r.url, { ...common, layers: r.layers, format: 'image/png', transparent: true, version: r.version || '1.1.1' });
  let errors = 0, warned = false;
  entry.tile.on('tileerror', () => {
    if (++errors >= 6 && !warned && navigator.onLine !== false) { warned = true; toast(`El servicio «${r.name}» no responde ahora mismo. Prueba más tarde o quita la capa.`, 6000); }
  });
  entry.tile.on('tileload', () => { errors = 0; });
}
function mapLayerOf(entry) { return entry.group || entry.tile || pointGroup(entry.rec.id); }

function registerLayer(rec) {
  const entry = { rec };
  const t = typeOf(rec);
  if (t === 'kml') buildKml(entry);
  else if (t === 'wms') buildRaster(entry);
  layers.set(rec.id, entry);
  if (rec.visible) mapLayerOf(entry).addTo(map);
  applyOrder();
  return entry;
}
function rebuildLayer(id) {
  const e = layers.get(id); if (!e) return;
  setTimeout(() => { drawPK(); drawActs(); drawWidths(); }, 0);
  if (e.group || e.tile) map.removeLayer(mapLayerOf(e));
  if (typeOf(e.rec) === 'kml') buildKml(e); else if (typeOf(e.rec) === 'wms') buildRaster(e);
  if (e.rec.visible) mapLayerOf(e).addTo(map);
  applyOrder();
}
function orderedLayers() { return [...layers.values()].filter(e => !isPointLayer(e.rec)).sort((a, b) => (b.rec.order || 0) - (a.rec.order || 0)); }
function applyOrder() {
  const asc = orderedLayers().reverse();
  let z = 1;
  asc.forEach(e => {
    if (e.tile) e.tile.setZIndex(z++);
    if (e.group && map.hasLayer(e.group)) e.group.eachLayer(l => l.bringToFront && l.bringToFront());
  });
}
async function setLayerVisible(id, on) {
  setTimeout(() => { drawPK(); drawActs(); drawWidths(); }, 0);
  if (id === 'acts') { settings.actsVisible = on; saveSettings(); drawActs(); return; }
  if (id === 'res') { settings.resVisible = on; saveSettings(); on ? resLayer.addTo(map) : map.removeLayer(resLayer); return; }
  if (id === 'notes') { settings.notesVisible = on; saveSettings(); on ? pointGroup('notes').addTo(map) : map.removeLayer(pointGroup('notes')); return; }
  const e = layers.get(id); if (!e) return;
  e.rec.visible = on;
  on ? mapLayerOf(e).addTo(map) : map.removeLayer(mapLayerOf(e));
  applyOrder();
  await DB.put('layers', e.rec);
}
async function moveLayer(id, dir) { return groupMove([id], dir); }
async function groupMove(ids, dir) {
  const list = orderedLayers(), sel = new Set(ids), n = list.length;
  if (dir < 0) { for (let i = 1; i < n; i++) if (sel.has(list[i].rec.id) && !sel.has(list[i - 1].rec.id)) [list[i - 1], list[i]] = [list[i], list[i - 1]]; }
  else { for (let i = n - 2; i >= 0; i--) if (sel.has(list[i].rec.id) && !sel.has(list[i + 1].rec.id)) [list[i + 1], list[i]] = [list[i], list[i + 1]]; }
  for (let i = 0; i < n; i++) { const r = list[i].rec, o = n - i; if (r.order !== o) { r.order = o; await DB.put('layers', r); } }
  applyOrder(); renderDrawer();
}
function layerBounds(id) {
  if (id === 'notes' || isPointLayer((layers.get(id) || {}).rec || {})) {
    const pts = [...notes.values()].filter(n => (n.layerId || 'notes') === id).map(n => [n.lat, n.lng]);
    return pts.length ? L.latLngBounds(pts) : null;
  }
  const e = layers.get(id);
  return e && e.group ? e.group.getBounds() : null;
}
function zoomToLayer(id) {
  const b = layerBounds(id);
  if (b && b.isValid()) map.fitBounds(b.pad(0.15), { maxZoom: 18 });
  else toast('Esta capa es un servicio de imagen: no tiene una extensión que encuadrar.');
}
// Actuaciones cuya capa ya no está: se conservan y se vuelven a enlazar al cargar otra vez la traza (por su nombre)
async function relinkOrphanActs(e) {
  if (!e || !e.feats || typeOf(e.rec) !== 'kml') return;
  const orphans = [...acts.values()].filter(a => !layers.has(a.layerId));
  const matches = orphans.map(a => ({ a, fi: e.feats.findIndex(f => f.type === 'ln' && f.name === a.traceName) })).filter(x => x.fi >= 0);
  if (!matches.length) return;
  const names = [...new Set(matches.map(x => x.a.traceName))].join(', ');
  if (!confirm(`Hay ${matches.length} actuaciones de «${names}» que se quedaron sin traza. ¿Enlazarlas a la capa «${e.rec.name}» que acabas de cargar?`)) return;
  const upd = matches.map(({ a, fi }) => { const f = e.feats[fi], d1 = Math.min(f.length, a.d1), d0 = Math.min(a.d0, d1);
    return { ...a, layerId: e.rec.id, layerName: e.rec.name, featIdx: fi, d0, d1, coords: segmentCoords(f, d0, d1), updated: Date.now() }; });
  try { await DB.putMany(upd.map(a => ['acts', a])); upd.forEach(a => acts.set(a.id, a)); drawActs(); toast(`${upd.length} actuaciones enlazadas de nuevo a su traza.`, 5000); }
  catch (err) { toast('No se pudieron enlazar: ' + (err.message || err), 6000); }
}
async function deleteLayer(id) {
  const e = layers.get(id); if (!e) return;
  const pts = [...notes.values()].filter(n => n.layerId === id);
  const nActs = [...acts.values()].filter(a => a.layerId === id).length;
  const extra = pts.length ? ` y sus ${pts.length} fotos` : '';
  if (!confirm(`¿Quitar la capa «${e.rec.name}»${extra} de la app?${nActs ? `\n\nSus ${nActs} actuaciones NO se borran: se quedan en la obra sin traza y se volverán a enlazar si vuelves a cargar ese KML.` : ''}`)) return;
  map.removeLayer(mapLayerOf(e));
  for (const n of pts) { await DB.del('notes', n.id); notes.delete(n.id); noteMarkers.delete(n.id); }
  pointGroups.delete(id);
  layers.delete(id); await DB.del('layers', id); drawPK(); drawActs();
  renderDrawer(); toast('Capa eliminada');
}
async function updateLayer(id, changes) {
  const e = layers.get(id); if (!e) return;
  Object.assign(e.rec, changes);
  await DB.put('layers', e.rec);
}

function featureSheet(f, ll, rec) {
  const kind = f.type === 'ln' ? 'Traza · ' + fmtLen(f.length) : f.type === 'pg' ? `Polígono · superficie ${fmtArea(f.area || 0)}${(f.area || 0) >= 10000 ? '' : ` (${String(Math.round((f.area || 0) / 100) / 100).replace('.', ',')} ha)`} · perímetro ${fmtLen(f.length)}` : 'Punto';
  let acts = '';
  if (f.type === 'ln') {
    acts += goBtn(f.start[0], f.start[1], 'Ir al inicio') + goBtn(f.end[0], f.end[1], 'Ir al final');
    acts += goBtn(ll.lat, ll.lng, 'Ir al punto tocado', 'full');
  } else if (f.type === 'pg') {
    acts += goBtn(f.start[0], f.start[1], 'Ir al centro') + goBtn(ll.lat, ll.lng, 'Ir al punto tocado');
  } else {
    acts += goBtn(f.start[0], f.start[1], 'Llévame aquí', 'full');
  }
  const noteAt = f.type === 'pt' ? { lat: f.start[0], lng: f.start[1] } : ll;
  acts += `<button class="btn" data-a="note">${ICON.note}Anotar aquí</button><button class="btn" data-a="fit">Encuadrar</button>`;
  if (f.type === 'ln') acts += `<button class="btn pri" data-a="slope">${ICON.slope}Pendiente</button><button class="btn" data-a="slclass">${ICON.slope}Tramificar pendientes</button><button class="btn pri" data-a="width">${ICON.width}Anchos</button><button class="btn go full" data-a="ficha">${ICON.note}Ficha de inspección de campo</button>`;
  acts += `<button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button><button class="btn" data-a="measure">${ICON.ruler}Medir desde aquí</button>`;
  if (f.type === 'ln') acts += `<button class="btn" data-a="reverse">${ICON.swap}Invertir sentido</button>`;
  acts += `<button class="btn" data-a="props">${ICON.info}Propiedades de la capa</button><button class="btn" data-a="hidef">${ICON.eyeOff || ''}Ocultar este elemento</button><button class="btn" data-a="hidel">Ocultar la capa</button>`;

  let coords = '';
  const pkTap = f.type === 'ln' ? pkAt(f, ll) : null;
  const fiw = layers.get(rec.id).feats.indexOf(f);
  let wq = '';
  if (f.type === 'ln') {
    const wHere = roadWidthAt(rec, fiw, pkTap.d, pkTap.d), wd = rec.widths && rec.widths[fiw], wsg = wd ? widthSegments(wd, f) : [], wst = wsg.length ? widthStats(wsg) : null;
    wq = `<div class="wquick"><div><b>Ancho en este punto:</b> ${wHere ? fmtW(wHere) : 'sin dato'}${wst ? ` · ancho medio de la traza ${fmtW(wst.mean)}` : ''}</div>
      <div class="field row"><input type="text" id="wqV" inputmode="decimal" placeholder="Ancho aquí (m)"><button class="mini pri" data-a="wq">Guardar en PK ${fmtPK(pkTap.d)}</button></div>
      <div class="field row"><input type="text" id="goPk" inputmode="decimal" placeholder="Ir a PK (p. ej. 1+250)"><button class="mini" data-a="gopk">Ver PK</button></div><div id="goPkRes"></div></div>`;
  }
  if (f.type === 'ln') coords = `<div class="coords"><b>PK del punto tocado</b> ${fmtPK(pkTap.d)} de ${fmtPK(f.length)}<br><b>Inicio</b> ${fmtLL(...f.start)}${distFromMe(...f.start)}<br>${fmtUTM(...f.start)}<br><b>Final</b>&nbsp; ${fmtLL(...f.end)}${distFromMe(...f.end)}<br>${fmtUTM(...f.end)}</div>`;
  else coords = coordsBlock(f.start[0], f.start[1]);
  const attrs = f.attrs.length ? `<table class="attrs">${f.attrs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : '';

  const b = openSheet(`<h2>${esc(f.name)}</h2><p class="sub">${esc(kind)} · ${esc(rec.name)}${f.folder ? ' › ' + esc(f.folder) : ''}</p>
    ${f.type === 'ln' ? `<div class="acts"><button class="btn go full" data-a="newact">${ICON.road}Nueva actuación aquí (PK ${fmtPK(pkTap.d)})</button></div>` : ''}
    ${coords}${wq}${f.desc ? `<div class="desc">${esc(f.desc)}</div>` : ''}${attrs}<div class="acts">${acts}</div>`);
  highlight.clearLayers();
  f.parts.forEach(p => {
    if (p.t === 'pt') L.circleMarker(p.c[0], { renderer: hlRenderer, radius: 12, color: '#fff', weight: 3, fill: false, interactive: false }).addTo(highlight);
    else L.polyline(p.t === 'pg' ? [...p.c, p.c[0]] : p.c, { renderer: hlRenderer, color: '#fff', weight: 8, opacity: 0.55, interactive: false }).addTo(highlight);
  });
  if (f.type === 'ln') {
    L.circleMarker(f.start, { renderer: hlRenderer, radius: 8, color: '#0b6e4f', weight: 4, fillColor: '#fff', fillOpacity: 1, interactive: false }).bindTooltip('Inicio', { permanent: true, direction: 'top', offset: [0, -8] }).addTo(highlight);
    L.circleMarker(f.end, { renderer: hlRenderer, radius: 8, color: '#fff', weight: 3, fillColor: '#e8590c', fillOpacity: 1, interactive: false }).bindTooltip('Final', { permanent: true, direction: 'top', offset: [0, -8] }).addTo(highlight);
  }
  onSheetClose(() => highlight.clearLayers());
  b.querySelector('[data-a=note]').onclick = () => openEditor({ lat: noteAt.lat, lng: noteAt.lng, src: 'mapa', title: f.name });
  b.querySelector('[data-a=fit]').onclick = () => map.fitBounds(L.featureGroup(highlight.getLayers()).getBounds().pad(0.2), { maxZoom: 18 });
  b.querySelector('[data-a=copy]').onclick = () => copyText(f.type === 'ln' ? `Inicio: ${fmtLL(...f.start)}\nFinal: ${fmtLL(...f.end)}` : fmtLL(f.start[0], f.start[1]));
  b.querySelector('[data-a=measure]').onclick = () => { closeSheet(); startMeasure(ll); };
  const sl = b.querySelector('[data-a=slope]');
  if (sl) sl.onclick = () => slopeSheet(f, rec, 0, f.length);
  const sc = b.querySelector('[data-a=slclass]');
  if (sc) sc.onclick = () => { slopeScrollToClass = true; slopeSheet(f, rec, 0, f.length, { autorun: true }); };
  const wb = b.querySelector('[data-a=width]');
  if (wb) wb.onclick = () => widthSheet(rec, f);
  const na = b.querySelector('[data-a=newact]');
  if (na) na.onclick = () => { const d = pkAt(f, ll).d; openActEditor({ rec, f, d0: d, d1: d }); };
  const rv = b.querySelector('[data-a=reverse]');
  if (rv) rv.onclick = () => reverseTrace(rec, f);
  const fb = b.querySelector('[data-a=ficha]');
  if (fb) fb.onclick = () => fichaForTrace(rec, f);
  b.querySelector('[data-a=props]').onclick = () => layerProps(rec.id);
  b.querySelector('[data-a=hidef]').onclick = async () => { await setFeatHidden(rec, fiw, true); closeSheet(); toast(`«${f.name}» oculto. Para verlo otra vez: Capas → opciones de «${rec.name}» → Mostrar ocultos.`, 6000); };
  b.querySelector('[data-a=hidel]').onclick = async () => { await setLayerVisible(rec.id, false); if (!$('#drawer').hidden) renderDrawer(); closeSheet(); toast(`Capa «${rec.name}» oculta. Vuelve a marcarla en Capas para verla.`, 5000); };
  const wqb = b.querySelector('[data-a=wq]');
  if (wqb) wqb.onclick = async () => {
    const v = parseNum($('#wqV').value); if (!(v > 0 && v < 100)) { toast('Escribe el ancho en metros, por ejemplo 4,20.'); return; }
    rec.widths = rec.widths || {};
    const data = rec.widths[fiw] || { mode: 'changes', interval: 20, points: [] }, d = Math.round(pkTap.d * 100) / 100;
    data.points = (data.points || []).filter(q => Math.abs(q.d - d) > 1).concat([{ d, w: v }]).sort((x, y) => x.d - y.d);
    if (data.mode === 'changes' && data.points[0].d > 0.5 && data.points.length === 1) toast('Con un solo dato, ese ancho se aplica desde este PK hasta el final. Añade más anchos en otros puntos.', 6000);
    data.updated = Date.now(); rec.widths[fiw] = data;
    await updateLayer(rec.id, { widths: rec.widths }); drawWidths();
    toast(`Ancho de ${fmtW(v)} guardado en el PK ${fmtPK(d)}`); featureSheet(f, ll, rec);
  };
  const gpi = b.querySelector('#goPk'); if (gpi) gpi.onkeydown = ev => { if (ev.key === 'Enter') b.querySelector('[data-a=gopk]').click(); };
  const wqi = b.querySelector('#wqV'); if (wqi) wqi.onkeydown = ev => { if (ev.key === 'Enter') b.querySelector('[data-a=wq]').click(); };
  const gpb = b.querySelector('[data-a=gopk]');
  if (gpb) gpb.onclick = () => {
    const d = parsePK($('#goPk').value); if (!isFinite(d) || d < 0 || d > f.length + 0.5) { toast(`Escribe un PK entre 0+000 y ${fmtPK(f.length)}.`); return; }
    const q = pointAtPK(f, Math.min(d, f.length)); map.setView([q.lat, q.lng], Math.max(map.getZoom(), 17));
    L.circleMarker([q.lat, q.lng], { renderer: hlRenderer, radius: 10, color: '#fff', weight: 3, fillColor: '#e8590c', fillOpacity: 1, interactive: false }).bindTooltip('PK ' + fmtPK(d), { permanent: true, direction: 'top', offset: [0, -10] }).addTo(highlight);
    $('#goPkRes').innerHTML = `<div class="acts">${goBtn(q.lat, q.lng, 'Llévame al PK ' + fmtPK(d), 'full')}</div>`;
  };
}

/* ---------------- Invertir el sentido de una traza ----------------
   Invierte el orden de los vértices en el KML; los PK pasan a contarse desde el otro extremo.
   Las actuaciones y los anchos de esa traza se recalculan (y el margen izquierdo pasa a ser el derecho). */
function reverseKmlPlacemark(text, pmIndex) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const pm = byTag(doc, 'Placemark')[pmIndex]; if (!pm) throw new Error('No se encuentra el elemento en el KML');
  const lines = [...byTag(pm, 'LineString'), ...byTag(pm, 'Track')];
  byTag(pm, 'LineString').forEach(ls => { const c = byTag(ls, 'coordinates')[0]; if (c) c.textContent = c.textContent.trim().split(/\s+/).reverse().join(' '); });
  byTag(pm, 'Track').forEach(tr => { const cs = byTag(tr, 'coord'), ws = byTag(tr, 'when'); const cv = cs.map(n => n.textContent).reverse(); cs.forEach((n, i) => { n.textContent = cv[i]; }); const wv = ws.map(n => n.textContent).reverse(); ws.forEach((n, i) => { n.textContent = wv[i]; }); });
  if (lines.length > 1) { const parent = lines[0].parentNode; if (lines.every(l => l.parentNode === parent)) { const anchor = lines[lines.length - 1].nextSibling; lines.slice().reverse().forEach(l => parent.insertBefore(l, anchor)); } }
  return new XMLSerializer().serializeToString(doc);
}
async function reverseTrace(rec, f) {
  const e = layers.get(rec.id), fi = e.feats.indexOf(f), L0 = f.length;
  const relActs = [...acts.values()].filter(a => a.layerId === rec.id && a.featIdx === fi);
  const wd = rec.widths && rec.widths[fi];
  if (!confirm(`¿Invertir el sentido de «${f.name}»? El inicio pasa a ser el final y los PK se cuentan desde el otro extremo.${relActs.length ? ` Se recalcularán ${relActs.length} actuaciones (el margen izquierdo pasa a ser el derecho).` : ''}${wd ? ' También se recalcularán sus anchos.' : ''}`)) return;
  // Se prepara todo en copias y se guarda en una sola transacción; solo si se guarda bien se aplica en pantalla
  let newText;
  try { newText = reverseKmlPlacemark(rec.text, f.pm); } catch (err) { toast('No se pudo invertir: ' + err.message, 6000); return; }
  const newWidths = rec.widths ? JSON.parse(JSON.stringify(rec.widths)) : rec.widths;
  if (wd) {
    const segs = widthSegments(wd, f);
    const pts = wd.mode === 'changes'
      ? segs.map(sg => ({ d: +(L0 - sg.b).toFixed(2), w: sg.wa })).sort((a, b) => a.d - b.d)
      : (wd.points || []).map(p => ({ d: +(L0 - p.d).toFixed(2), w: p.w })).sort((a, b) => a.d - b.d);
    newWidths[fi] = { ...wd, points: pts, updated: Date.now() };
  }
  const nf = parseKML(newText).feats[fi]; // mismos índices de elementos que la capa cargada
  const newActs = relActs.map(a => { const d0 = Math.max(0, L0 - a.d1), d1 = Math.min(nf.length, L0 - a.d0);
    return { ...a, d0, d1, side: a.side === 'izq' ? 'der' : a.side === 'der' ? 'izq' : a.side, coords: segmentCoords(nf, d0, d1), updated: Date.now() }; });
  try { await DB.putMany([['layers', { ...rec, text: newText, widths: newWidths }], ...newActs.map(a => ['acts', a])]); }
  catch (err) { toast('No se pudo guardar el cambio de sentido (' + (err && err.message || 'almacenamiento lleno') + '). No se ha cambiado nada.', 8000); return; }
  rec.text = newText; rec.widths = newWidths; newActs.forEach(a => acts.set(a.id, a));
  if (walkAct && walkAct.draft.layerId === rec.id && walkAct.draft.featIdx === fi) { const w = walkAct.draft; w.d0 = w.d1 = Math.max(0, L0 - w.d0); w.side = w.side === 'izq' ? 'der' : w.side === 'der' ? 'izq' : w.side; DB.put('kv', walkAct, 'walk').catch(() => {}); showWalkBar(); }
  rebuildLayer(rec.id);
  const nf2 = layers.get(rec.id).feats[fi];
  drawActs(); drawWidths(); drawPK(); closeSheet();
  toast(`Sentido invertido: «${nf2.name}» empieza ahora en el antiguo final.`, 5000);
  featureSheet(nf2, L.latLng(nf2.start[0], nf2.start[1]), rec);
}

/* ---------------- Importación de ficheros ---------------- */
async function readKmlFile(file) {
  if (/\.kmz$/i.test(file.name) || file.type === 'application/vnd.google-earth.kmz') {
    const zip = await JSZip.loadAsync(file);
    const entry = zip.file('doc.kml') || zip.file(/\.kml$/i)[0];
    if (!entry) throw new Error(file.name + ': el KMZ no contiene ningún .kml.');
    return entry.async('string');
  }
  return file.text();
}
async function importFiles(files) {
  let last = null;
  for (const file of files) {
    try {
      const text = await readKmlFile(file);
      const { docName, feats } = parseKML(text);
      if (!feats.length) throw new Error(file.name + ': no contiene puntos, líneas ni polígonos.');
      const nk = [...layers.values()].filter(e => typeOf(e.rec) === 'kml').length;
      const rec = { id: uid(), obraId: settings.activeObra, type: 'kml', name: file.name.replace(/\.km[lz]$/i, '') || docName || 'Capa', text, color: PALETTE[nk % PALETTE.length], visible: true, opacity: 1, order: nextOrder(), created: Date.now() };
      await DB.put('layers', rec);
      last = registerLayer(rec);
      toast(`${rec.name}: ${plural(feats.length, 'elemento cargado', 'elementos cargados')}`);
      await relinkOrphanActs(last);
    } catch (e) { const msg = String(e.message || 'no se pudo leer'); toast(msg.startsWith(file.name) ? msg : `${file.name}: ${/zip|central directory|end of data|corrupt/i.test(msg) ? 'el fichero está dañado o no es un KMZ/ZIP válido' : msg}`, 6000); }
  }
  if (last) map.fitBounds(last.group.getBounds().pad(0.1), { maxZoom: 18 });
  drawPK();
  if (!$('#drawer').hidden) renderDrawer();
}

// Fotos con coordenadas en el EXIF → nueva capa de fotos
async function importPhotos(files) {
  const imgs = files.filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!imgs.length) return;
  toast(`Leyendo ${imgs.length} foto${imgs.length > 1 ? 's' : ''}…`, 10000);
  const rec = { id: uid(), obraId: settings.activeObra, type: 'photos', name: 'Fotos ' + new Date().toLocaleDateString('es-ES'), visible: true, order: 0, created: Date.now() };
  const added = [], noExif = [], report = [];
  for (const f of imgs) {
    let ex = null;
    try { ex = await readExif(f); } catch (e) { ex = null; }
    if (!ex || ex.lat == null) { noExif.push(f); continue; }
    let blob = await processImage(f, null, false);
    blob = await writeExif(blob, { lat: ex.lat, lng: ex.lng, alt: ex.alt, date: ex.date });
    added.push(photoNote(rec, f, blob, { lat: ex.lat, lng: ex.lng, alt: ex.alt ?? null, dir: ex.dir ?? null, src: 'exif', created: ex.date || f.lastModified || Date.now() }));
  }
  // Fotos sin GPS en los metadatos (p. ej. recibidas por WhatsApp): se intenta leer la marca de agua
  for (let i = 0; i < noExif.length; i++) {
    const f = noExif[i];
    toast(`Leyendo la marca de agua ${i + 1} de ${noExif.length}…`, 60000);
    let r = null;
    try { r = await ocrWatermark(f); } catch (e) { console.warn(e); r = { error: e.message || String(e) }; }
    if (r && r.lat != null) {
      let blob = await processImage(f, null, false);
      blob = await writeExif(blob, { lat: r.lat, lng: r.lng, alt: r.alt, date: r.date, desc: r.text });
      const n = photoNote(rec, f, blob, { lat: r.lat, lng: r.lng, alt: r.alt ?? null, acc: r.acc ?? null, src: 'marca', created: r.date || f.lastModified || Date.now(),
        text: 'Datos recuperados de la marca de agua (' + r.method + '):\n' + r.text });
      added.push(n); report.push({ name: f.name, ok: true, n, r });
    } else report.push({ name: f.name, ok: false, r });
  }
  ocrDone();
  if (added.length) {
    try {
      await DB.put('layers', rec);
      registerLayer(rec);
      for (const n of added) { await DB.put('notes', n); notes.set(n.id, n); drawNote(n); }
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      zoomToLayer(rec.id);
    } catch (e) { toast('No se pudieron guardar las fotos: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
  }
  const fromExif = added.length - report.filter(x => x.ok).length;
  if (report.length) watermarkReport(report, fromExif, rec);
  else toast(`${added.length} fotos situadas en el mapa (capa «${rec.name}»).`, 5000);
  if (!$('#drawer').hidden) renderDrawer();
}
function photoNote(rec, f, blob, o) {
  return { id: uid(), obraId: settings.activeObra, layerId: rec.id, lat: o.lat, lng: o.lng, acc: o.acc ?? null, alt: o.alt ?? null, dir: o.dir ?? null, src: o.src,
    title: f.name.replace(/\.[^.]+$/, ''), text: o.text || '', created: o.created, media: [{ id: uid(), kind: 'photo', blob, mime: blob.type || 'image/jpeg', t: Date.now() }] };
}
function watermarkReport(report, fromExif, rec) {
  $('#toast').hidden = true;
  const ok = report.filter(x => x.ok);
  const b = openSheet(`<h2>Fotos sin GPS en los metadatos</h2>
    <p class="sub">${ok.length} de ${report.length} recuperadas leyendo la marca de agua${fromExif ? ` · ${fromExif} más con GPS propio` : ''}</p>
    <div class="wmlist">${report.map((x, i) => `<div class="wm ${x.ok ? 'ok' : 'ko'}">
      <b>${esc(x.name)}</b>
      ${x.ok ? `<small>${fmtLL(x.r.lat, x.r.lng)}${x.r.date ? ' · ' + fmtDate(x.r.date) : ''}${x.r.alt != null ? ' · ' + Math.round(x.r.alt) + ' m' : ''} · ${esc(x.r.method)}</small>
        <div class="row"><button class="mini" data-see="${i}">Ver en el mapa</button><button class="mini" data-fix="${i}">Corregir posición</button></div>`
      : `<small>${x.r && x.r.error ? 'Error: ' + esc(x.r.error) : x.r && x.r.text ? 'No se han encontrado coordenadas en la marca de agua.' : 'No se ha encontrado texto.'}</small>`}
      ${x.r && x.r.text ? `<details><summary>Texto leído</summary><pre>${esc(x.r.text)}</pre></details>` : ''}
    </div>`).join('')}</div>
    ${ok.length ? `<div class="acts"><button class="btn pri full" data-a="share">${ICON.photo}Compartir las fotos con su GPS</button></div>
    <p class="hint">Cada foto se guarda ya con las coordenadas, la fecha y la altitud escritas en sus metadatos (EXIF). Compartidas como archivo (no como foto de WhatsApp) las conservan.</p>` : ''}
    ${report.length > ok.length ? '<p class="hint">Si una foto no se ha podido leer, ábrela desde «Mantén pulsado en el mapa → Foto en este punto» para situarla a mano.</p>' : ''}`);
  b.querySelectorAll('[data-see]').forEach(bt => bt.onclick = () => { const n = report[+bt.dataset.see].n; map.setView([n.lat, n.lng], 18); viewNote(n.id); });
  b.querySelectorAll('[data-fix]').forEach(bt => bt.onclick = () => { const n = report[+bt.dataset.fix].n; map.setView([n.lat, n.lng], 18); openEditor({ note: n }); });
  const sh = b.querySelector('[data-a=share]'); if (sh) sh.onclick = () => sharePhotos(ok.map(x => x.n), rec.name);
}
async function sharePhotos(list, label) {
  const items = list.flatMap(n => (n.media || []).filter(m => m.kind === 'photo').map((m, i) => ({ blob: m.blob, name: `${safeName(n.title)}${i ? '_' + (i + 1) : ''}.jpg` })));
  if (!items.length) { toast('No hay fotos que compartir.'); return; }
  try {
    if (items.length === 1) { await saveBlob(new Blob([items[0].blob], { type: 'image/jpeg' }), items[0].name); return; }
    const zip = new JSZip(); const used = new Set();
    items.forEach(it => { let nm = it.name, k = 2; while (used.has(nm)) nm = it.name.replace(/\.jpg$/, `_${k++}.jpg`); used.add(nm); zip.file(nm, it.blob); });
    await saveBlob(await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' }), `fotos_GPS_${safeName(label)}.zip`);
  } catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudieron compartir: ' + (e.message || e), 6000); }
}

/* ---------------- Lectura de la marca de agua (OCR) ---------------- */
let ocrWorker = null, ocrIdle = null;
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el lector de texto')); document.head.appendChild(s); });
}
async function getOcr() {
  clearTimeout(ocrIdle);
  if (ocrWorker) return ocrWorker;
  if (!window.Tesseract) await loadScript('vendor/tesseract/tesseract.min.js');
  const abs = p => new URL(p, location.href).href;
  ocrWorker = await Tesseract.createWorker('eng', 1, { workerPath: abs('vendor/tesseract/worker.min.js'), corePath: abs('vendor/tesseract/core'), langPath: abs('vendor/tesseract/lang'), gzip: true, cacheMethod: 'none' });
  await ocrWorker.setParameters({ preserve_interword_spaces: '1' });
  return ocrWorker;
}
function ocrDone() { clearTimeout(ocrIdle); ocrIdle = setTimeout(() => { if (ocrWorker) { ocrWorker.terminate(); ocrWorker = null; } }, 60000); }
function ocrCanvas(bmp, rx, ry, rw, rh, invert, mask) {
  const sx = Math.round(bmp.width * rx), sy = Math.round(bmp.height * ry), sw = Math.round(bmp.width * rw), sh = Math.round(bmp.height * rh);
  const scale = Math.min(2.5, Math.max(1, 1800 / sw));
  const c = document.createElement('canvas'); c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
  const g = c.getContext('2d'); g.drawImage(bmp, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (mask) { // solo el texto claro (marca blanca o amarilla con borde oscuro): texto negro sobre fondo blanco
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      v = (mx > 205 && (mx - mn < 60 || (d[i] > 200 && d[i + 1] > 200))) ? 0 : 255;
    } else { v = Math.max(0, Math.min(255, (v - 128) * 1.5 + 128)); if (invert) v = 255 - v; }
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  g.putImageData(im, 0, 0);
  return c;
}
async function ocrWatermark(file) {
  const w = await getOcr();
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const passes = [[0, 0.55, 1, 0.45, false], [0, 0.55, 1, 0.45, false, true], [0, 0.55, 1, 0.45, true], [0, 0, 1, 0.3, false], [0, 0, 1, 0.3, false, true], [0, 0, 1, 1, false]];
  let all = '';
  for (const [x, y, ww, hh, inv, mask] of passes) {
    const { data } = await w.recognize(ocrCanvas(bmp, x, y, ww, hh, inv, mask));
    const t = (data.text || '').trim(); if (t) all += t + '\n';
    const p = parseWatermark(t);
    if (p.lat != null) { const full = parseWatermark(all); return { ...p, date: p.date || full.date, alt: p.alt ?? full.alt, text: t }; }
  }
  const p = parseWatermark(all);
  return p.lat != null ? { ...p, text: all.trim() } : { text: all.trim() };
}

// Interpreta coordenadas, fecha y altitud en el texto de una marca de agua (tolerante a errores de lectura)
const MONTHS = { ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12 };
function parseWatermark(raw) {
  const out = { lat: null, lng: null, alt: null, date: null, acc: null, method: '' };
  if (!raw) return out;
  const t = raw.replace(/[º˚°*]/g, '°').replace(/[’´′`‘]/g, "'").replace(/[”″“]/g, '"').replace(/''/g, '"').replace(/\u2212/g, '-')
    .replace(/(?<=\d)[lI|](?=\d)/g, '1').replace(/(?<=\d)[oO](?=\d)/g, '0').replace(/(?<=\d)[,.] (?=\d{4,})/g, m => m[0]); // confusiones típicas del OCR
  const num = s => parseFloat(String(s).replace(',', '.'));
  const inSpain = (la, lo) => la >= 27 && la <= 44.5 && lo >= -19 && lo <= 5;
  const okLL = (la, lo) => isFinite(la) && isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 && !(la === 0 && lo === 0);
  const set = (la, lo, m) => { if (out.lat == null && okLL(la, lo)) { out.lat = la; out.lng = lo; out.method = m; } };
  // 1) grados, minutos y segundos: 37°36'44.4"N 2°54'55.6"W
  const dms = [...t.matchAll(/(\d{1,3})\s*[°:]\s*(\d{1,2})\s*['":]\s*(\d{1,2}(?:[.,]\d+)?)\s*["':]{0,2}\s*([NSEWO])/gi)];
  if (dms.length >= 2) {
    const v = m => (num(m[1]) + num(m[2]) / 60 + num(m[3]) / 3600) * (/[SWO]/i.test(m[4]) ? -1 : 1);
    const la = dms.find(m => /[NS]/i.test(m[4])), lo = dms.find(m => /[EWO]/i.test(m[4]));
    if (la && lo) set(v(la), v(lo), 'grados, minutos y segundos');
  }
  // 2) grados y minutos decimales: 37°36.740'N
  if (out.lat == null) {
    const dm = [...t.matchAll(/(\d{1,3})\s*°\s*(\d{1,2}[.,]\d+)\s*'?\s*([NSEWO])/gi)];
    const la = dm.find(m => /[NS]/i.test(m[3])), lo = dm.find(m => /[EWO]/i.test(m[3]));
    if (la && lo) set((num(la[1]) + num(la[2]) / 60) * (/S/i.test(la[3]) ? -1 : 1), (num(lo[1]) + num(lo[2]) / 60) * (/[WO]/i.test(lo[3]) ? -1 : 1), 'grados y minutos');
  }
  // 3) grados decimales con etiqueta: Lat 37.612345 Long -2.915432
  if (out.lat == null) {
    const la = /lat(?:itud|itude)?\.?\s*[:=]?\s*([+-]?\d{1,2}[.,]\d{3,})\s*°?\s*([NS])?/i.exec(t);
    const lo = /(?:lon(?:g(?:itud|itude)?)?|lng)\.?\s*[:=]?\s*([+-]?\d{1,3}[.,]\d{3,})\s*°?\s*([EWO])?/i.exec(t);
    if (la && lo) set(num(la[1]) * (la[2] && /S/i.test(la[2]) ? -1 : 1), num(lo[1]) * (lo[2] && /[WO]/i.test(lo[2]) && num(lo[1]) > 0 ? -1 : 1), 'grados decimales');
  }
  // 4) par de grados decimales sin etiqueta: 37,613764, -2,917264  ·  37.6137N 2.9172W
  if (out.lat == null) {
    const re = /([+-]?\d{1,2}[.,]\d{4,})\s*°?\s*([NS])?[\s,;/|]+([+-]?\d{1,3}[.,]\d{4,})\s*°?\s*([EWO])?/gi;
    for (const m of t.matchAll(re)) {
      let la = num(m[1]), lo = num(m[3]);
      if (m[2] && /S/i.test(m[2])) la = -Math.abs(la);
      if (m[4] && /[WO]/i.test(m[4])) lo = -Math.abs(lo);
      if (okLL(la, lo) && (inSpain(la, lo) || m[2] || m[4])) { set(la, lo, 'grados decimales'); break; }
    }
  }
  // 5) UTM: «UTM ETRS89 H30 X 507.302 Y 4.162.826» · «X: 446862 Y: 4114708» · «30S 446862 4114708»
  if (out.lat == null) {
    const zm = /\bH\s?(2[7-9]|3[01])\b|\b(2[7-9]|3[01])\s?[STN]\b|huso\s*(2[7-9]|3[01])|zona?\s*(2[7-9]|3[01])/i.exec(t);
    const zone = zm ? +(zm[1] || zm[2] || zm[3] || zm[4]) : 30;
    const clean = s => +String(s).replace(/[.\s]/g, '').replace(',', '.');
    let xy = /X\s*[:=]?\s*(\d{3}[.\s]?\d{3}(?:[.,]\d+)?)\s*[,;]?\s*(?:m\s*)?Y\s*[:=]?\s*(\d{1}[.\s]?\d{3}[.\s]?\d{3}(?:[.,]\d+)?)/i.exec(t);
    if (!xy) xy = /\b(?:2[7-9]|3[01])\s?[STN]\s+(\d{6}(?:[.,]\d+)?)\s*(?:m\s*E)?[\s,]+(\d{7}(?:[.,]\d+)?)/i.exec(t);
    if (xy) {
      const x = clean(xy[1]), y = clean(xy[2]);
      if (x > 100000 && x < 900000 && y > 3000000 && y < 5000000) { const ll = fromUTM(zone, x, y); set(ll.lat, ll.lng, `UTM huso ${zone}`); }
    }
  }
  // fecha y hora
  let m = /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})[\s,T]+(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?\s*(AM|PM)?/i.exec(t);
  if (m) { let Y = +m[3]; if (Y < 100) Y += 2000; let H = +m[4]; if (m[7]) { if (/PM/i.test(m[7]) && H < 12) H += 12; if (/AM/i.test(m[7]) && H === 12) H = 0; } out.date = new Date(Y, +m[2] - 1, +m[1], H, +m[5], +(m[6] || 0)).getTime(); }
  else if ((m = /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[\s,T]+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/.exec(t))) out.date = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime();
  else if ((m = /(\d{1,2})\s+(?:de\s+)?([a-zA-Zé]{3})[a-zA-Zé]*\.?\s+(?:de\s+)?(\d{4})[\s,]+(\d{1,2}):(\d{2})/i.exec(t)) && MONTHS[m[2].toLowerCase()]) out.date = new Date(+m[3], MONTHS[m[2].toLowerCase()] - 1, +m[1], +m[4], +m[5]).getTime();
  else if ((m = /\b([a-zA-Z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})[\s,]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t)) && MONTHS[m[1].toLowerCase()]) { let H = +m[4]; if (m[6] && /PM/i.test(m[6]) && H < 12) H += 12; out.date = new Date(+m[3], MONTHS[m[1].toLowerCase()] - 1, +m[2], H, +m[5]).getTime(); }
  if (out.date && (out.date > Date.now() + 864e5 || out.date < Date.UTC(2000, 0, 1))) out.date = null;
  // altitud y precisión
  if ((m = /(?:alt(?:itud|itude|\.)?|elev(?:aci[oó]n|ation)?|cota|asl)\s*[:=]?\s*(-?\d{1,4}(?:[.,]\d+)?)\s*m/i.exec(t))) out.alt = num(m[1]);
  if ((m = /(?:±|\+\/-|precisi[oó]n|accuracy)\s*[:=]?\s*(\d{1,4}(?:[.,]\d+)?)\s*m/i.exec(t))) out.acc = num(m[1]);
  return out;
}
function fromUTM(zone, x, y, north = true) { // UTM (ETRS89 ≈ WGS84) → latitud/longitud
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const X = x - 500000, Y = north ? y : y - 10000000, M = Y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), T1 = Math.tan(p1) ** 2, C1 = ep2 * Math.cos(p1) ** 2;
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(p1) ** 2, 1.5), D = X / (N1 * k0);
  const lat = p1 - (N1 * Math.tan(p1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / Math.cos(p1);
  return { lat: lat * 180 / Math.PI, lng: ((zone - 1) * 6 - 180 + 3) + lon * 180 / Math.PI };
}

// Escribe GPS, fecha y descripción en los metadatos EXIF de una foto JPEG
async function writeExif(blob, m) {
  if (!window.piexif || !m || m.lat == null) return blob;
  try {
    let jpg = blob;
    if (!/jpe?g/i.test(blob.type || '')) { const bmp = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0); jpg = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); }
    const u8 = new Uint8Array(await jpg.arrayBuffer()); let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    let ex; try { ex = piexif.load(bin); } catch (e) { ex = null; }
    ex = ex || {}; ['0th', 'Exif', 'GPS', '1st'].forEach(k => { ex[k] = ex[k] || {}; }); ex.thumbnail = null; ex['1st'] = {};
    const G = piexif.GPSIFD, dms = v => piexif.GPSHelper.degToDmsRational(Math.abs(v));
    Object.assign(ex.GPS, { [G.GPSVersionID]: [2, 3, 0, 0], [G.GPSLatitudeRef]: m.lat >= 0 ? 'N' : 'S', [G.GPSLatitude]: dms(m.lat), [G.GPSLongitudeRef]: m.lng >= 0 ? 'E' : 'W', [G.GPSLongitude]: dms(m.lng), [G.GPSMapDatum]: 'WGS-84' });
    if (m.alt != null && isFinite(m.alt)) Object.assign(ex.GPS, { [G.GPSAltitudeRef]: m.alt < 0 ? 1 : 0, [G.GPSAltitude]: [Math.round(Math.abs(m.alt) * 100), 100] });
    if (m.date) { const d = new Date(m.date), p = n => String(n).padStart(2, '0'); const s2 = `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; ex.Exif[piexif.ExifIFD.DateTimeOriginal] = s2; ex['0th'][piexif.ImageIFD.DateTime] = s2; }
    if (m.desc) ex['0th'][piexif.ImageIFD.ImageDescription] = String(m.desc).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
    ex['0th'][piexif.ImageIFD.Software] = 'OBRA-GIS ' + APP_VERSION;
    const out = piexif.insert(piexif.dump(ex), bin);
    const o8 = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) o8[i] = out.charCodeAt(i);
    return new Blob([o8], { type: 'image/jpeg' });
  } catch (e) { console.warn('EXIF', e); return blob; }
}
async function handleIncoming(files) {
  const rest = []; let previo = false;
  for (const f of files) {
    if (/\.zip$/i.test(f.name) || /zip/.test(f.type)) { const z = await isObraPackage(f); if (z) { await importObraPackage(f, z); continue; } previo = true; }
    if (/\.bc3$/i.test(f.name)) previo = true;
    rest.push(f);
  }
  if (previo) fichaImportFiles(rest); // .zip que no es paquete de obra o BC3: previo de la ficha de inspección
  else if (rest.length) handleIncomingFiles(rest);
}
function handleIncomingFiles(files) {
  const k = files.filter(f => /\.km[lz]$/i.test(f.name) || /google-earth/.test(f.type));
  const p = files.filter(f => !k.includes(f) && (f.type.startsWith('image/') || /\.jpe?g$/i.test(f.name)));
  if (k.length) importFiles(k);
  if (p.length) importPhotos(p);
  if (!k.length && !p.length) toast('Solo se pueden abrir ficheros KML, KMZ o fotos JPEG.');
}
function importMenu() {
  const b = openSheet(`<h2>Importar</h2><p class="sub">Elige qué quieres añadir al mapa</p>
    <div class="acts">
      <button class="btn full" data-a="kml">${ICON.kml}KML o KMZ</button>
      <button class="btn full" data-a="photos">${ICON.gallery}Fotos (con GPS o con marca de agua)</button>
      <button class="btn full tech" data-a="service">${ICON.wms}Capa de un servicio (WMS)</button>
      <button class="btn full" data-a="obra">${ICON.folder}Obra completa (paquete .zip)</button>
      <button class="btn go full tech" data-a="previo">${ICON.note}Previo de camino: BC3, KMZ y fotos (ficha de inspección)</button>
      <button class="btn" data-a="drawtap">${ICON.pen}Dibujar traza</button>
      <button class="btn" data-a="drawgps">${ICON.locate}Grabar traza con GPS</button>
      <button class="btn full tech" data-a="drawpts">${ICON.pin}Crear KML de puntos (tocando el mapa o con GPS)</button>
    </div>
    <p class="hint">Las fotos se sitúan solas si la cámara guardó la ubicación. ${NATIVE ? '' : 'En Android, si llegan sin posición, elígelas desde «Archivos» y no desde la galería.'}</p>`);
  b.querySelector('[data-a=kml]').onclick = () => { closeSheet(); $('#inKml').click(); };
  b.querySelector('[data-a=photos]').onclick = () => { closeSheet(); $('#inPhotosImport').click(); };
  b.querySelector('[data-a=service]').onclick = serviceMenu;
  b.querySelector('[data-a=obra]').onclick = () => { closeSheet(); $('#inObra').click(); };
  b.querySelector('[data-a=previo]').onclick = fichaImportPick;
  b.querySelector('[data-a=drawtap]').onclick = () => { closeSheet(); startDrawing(false); };
  b.querySelector('[data-a=drawgps]').onclick = () => { closeSheet(); startDrawing(true); };
  b.querySelector('[data-a=drawpts]').onclick = () => { closeSheet(); startDrawing('points'); };
}
let catalogQuery = '', catalogOpen = 'energia';
function serviceMenu() {
  const q = catalogQuery.trim().toLowerCase();
  const groups = CATALOG_GROUPS.map(g => {
    const items = g.items.filter(i => !q || i.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
    if (!items.length) return '';
    const open = q || catalogOpen === g.id;
    const rows = items.map(i => {
      const k = CATALOG.findIndex(c => c.url === i.url && c.layers === i.layers);
      const added = !!serviceExists(i);
      return `<button class="crow ${added ? 'added' : ''}" data-cat="${k}" type="button"><span>${esc(i.name)}</span><small>${esc(i.cover || '')}${added ? ' · añadida' : ''}</small></button>`;
    }).join('');
    return `<div class="cgroup ${open ? 'open' : ''}">
      <button class="chead" data-grp="${g.id}" type="button">${esc(g.name)}<small>${items.length}</small></button>
      ${open ? `<div class="citems">${rows}<button class="mini" data-grpall="${g.id}" type="button">Añadir todas las de este grupo</button></div>` : ''}
    </div>`;
  }).join('');
  const b = openSheet(`<h2>Capas de servicios públicos</h2>
    <p class="sub">Servicios afectados y condicionantes a revisar antes de la obra</p>
    <div class="acts"><button class="btn go full" data-a="kit">${ICON.layers}Añadir kit de afecciones de obra</button></div>
    <div class="field"><input type="text" id="catQ" placeholder="Buscar capa (p. ej. gas, carretera, inundable)" value="${esc(catalogQuery)}"></div>
    <div class="catalog">${groups || '<p class="empty">Ninguna capa coincide con la búsqueda.</p>'}</div>
    <h3 class="sh">Otro servicio WMS</h3>
    <div class="field"><input type="text" id="wName" placeholder="Nombre (p. ej. Planeamiento urbanístico)"></div>
    <div class="field"><input type="text" id="wUrl" placeholder="URL del servicio (https://…)" inputmode="url"></div>
    <div class="field"><input type="text" id="wLayers" placeholder="Nombre de la capa o capas, separadas por comas"></div>
    <div class="acts"><button class="btn pri full" data-a="add">Añadir servicio</button></div>
    <p class="hint">Las redes de distribución (baja y media tensión, gas canalizado, telecomunicaciones, abastecimiento y saneamiento municipal) no son públicas: hay que pedírselas a cada compañía antes de excavar.</p>`);
  const qi = $('#catQ');
  qi.oninput = () => { catalogQuery = qi.value; const pos = qi.selectionStart; serviceMenu(); const n = $('#catQ'); n.focus(); n.setSelectionRange(pos, pos); };
  b.querySelector('[data-a=kit]').onclick = () => addServices(CATALOG.filter(c => AFECCIONES_KIT.includes(c.name)), 'kit de afecciones').then(serviceMenu);
  b.querySelectorAll('[data-grp]').forEach(bt => bt.onclick = () => { catalogOpen = catalogOpen === bt.dataset.grp ? '' : bt.dataset.grp; serviceMenu(); });
  b.querySelectorAll('[data-grpall]').forEach(bt => bt.onclick = () => { const g = CATALOG_GROUPS.find(x => x.id === bt.dataset.grpall); addServices(g.items, g.name).then(serviceMenu); });
  b.querySelectorAll('[data-cat]').forEach(bt => bt.onclick = async () => { await addService(CATALOG[+bt.dataset.cat]); serviceMenu(); });
  b.querySelector('[data-a=add]').onclick = () => {
    const url = $('#wUrl').value.trim().split('?')[0], lay = $('#wLayers').value.trim();
    if (!/^https:\/\//i.test(url) || !lay) { toast('Escribe la URL (https://…) y el nombre de la capa.'); return; }
    addService({ name: $('#wName').value.trim() || lay, kind: 'wms', url, layers: lay, info: 'html' }).then(() => closeSheet());
  };
}
const serviceExists = def => [...layers.values()].find(e => e.rec.url === def.url && (e.rec.layers || '') === (def.layers || ''));
async function addService(def, quiet = false) {
  const dup = serviceExists(def);
  if (dup) { if (!quiet) toast(`«${dup.rec.name}» ya está en tus capas.`); return false; }
  const rec = { id: uid(), obraId: settings.activeObra, type: 'wms', kind: def.kind, name: def.name, url: def.url, layers: def.layers || '', maxNative: def.maxNative, info: def.info || '', cover: def.cover || '',
    attribution: def.attribution || '', visible: true, opacity: def.opacity ?? 1, order: nextOrder(), created: Date.now() };
  await DB.put('layers', rec);
  registerLayer(rec);
  if (!quiet) toast(`Capa «${rec.name}» añadida. Mantén pulsado un punto del mapa para ver sus datos.`, 5000);
  return true;
}
async function addServices(defs, label) {
  let n = 0;
  for (const d of defs) if (await addService(d, true)) n++;
  toast(n ? `${plural(n, 'capa añadida', 'capas añadidas')}${label ? ' (' + label + ')' : ''}. Mantén pulsado un punto para consultar las afecciones.` : 'Esas capas ya estaban añadidas.', 6000);
  if (!$('#drawer').hidden) renderDrawer();
}

/* ---------------- Pulsación larga en el mapa ---------------- */
let longFired = 0;
(function longPress() {
  const el = map.getContainer(); let t = null, start = null;
  const clear = () => { if (t) { clearTimeout(t); t = null; } };
  el.addEventListener('touchstart', e => {
    clear();
    if (e.touches.length !== 1 || e.target.closest('.leaflet-control')) return;
    const p = e.touches[0]; start = { x: p.clientX, y: p.clientY };
    t = setTimeout(() => {
      t = null; longFired = Date.now();
      if (navigator.vibrate) navigator.vibrate(30);
      pointMenu(map.mouseEventToLatLng({ clientX: start.x, clientY: start.y }));
    }, 550);
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (!t) return; const p = e.touches[0];
    if (e.touches.length > 1 || Math.hypot(p.clientX - start.x, p.clientY - start.y) > 10) clear();
  }, { passive: true });
  ['touchend', 'touchcancel'].forEach(ev => el.addEventListener(ev, clear, { passive: true }));
  map.on('contextmenu', e => { if (Date.now() - longFired < 1200) return; pointMenu(e.latlng); });
})();

function pointMenu(ll) {
  if (drawing && !drawing.gps) return addDrawPt(L.latLng(ll)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(ll);
  if (measure) return addMeasurePt(ll);
  const queryable = orderedLayers().filter(e => e.rec.visible && e.tile && e.rec.kind === 'wms' && e.rec.info);
  const b = openSheet(`<h2>Punto seleccionado</h2><p class="sub">${matchMedia('(pointer:fine)').matches ? 'Clic derecho' : 'Pulsación larga'}${distFromMe(ll.lat, ll.lng)}</p>
    ${coordsBlock(ll.lat, ll.lng)}
    <div class="acts">
      ${goBtn(ll.lat, ll.lng, 'Llévame aquí', 'full')}
      <button class="btn" data-a="note">${ICON.note}Añadir anotación</button>
      <button class="btn" data-a="photo">${ICON.photo}Foto en este punto</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button>
      <button class="btn" data-a="measure">${ICON.ruler}Medir desde aquí</button>
      <button class="btn full" data-a="actnear">${ICON.road}Actuación en la traza más cercana</button>
      <button class="btn" data-a="resadd">${ICON.pin}Añadir recurso aquí</button>
      <button class="btn" data-a="route">${ICON.road}Distancia por carretera</button>
      <a class="btn full" href="${viewUrl(ll.lat, ll.lng)}" target="_blank" rel="noopener">Ver en Google Maps</a>
    </div>
    ${queryable.length ? `<div class="afec"><h3 class="sh">Afecciones en este punto</h3><div id="afecList"><p class="hint">Consultando ${queryable.length} capas…</p></div></div>` : ''}`);
  const cross = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="cross"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }), interactive: false }).addTo(map);
  onSheetClose(() => map.removeLayer(cross));
  b.querySelector('[data-a=note]').onclick = () => openEditor({ lat: ll.lat, lng: ll.lng, src: 'mapa' });
  b.querySelector('[data-a=photo]').onclick = () => { const at = { lat: ll.lat, lng: ll.lng, src: 'mapa' }; capture('inPhoto', files => { openEditor(at); addMedia(files); }); };
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${fmtLL(ll.lat, ll.lng)}\n${fmtUTM(ll.lat, ll.lng)}`);
  b.querySelector('[data-a=measure]').onclick = () => { closeSheet(); startMeasure(ll); };
  b.querySelector('[data-a=resadd]').onclick = () => resourceEditor({ lat: ll.lat, lng: ll.lng });
  b.querySelector('[data-a=route]').onclick = () => { calcState.b = { lat: ll.lat, lng: ll.lng, label: 'punto elegido' }; calcSheet('route'); };
  b.querySelector('[data-a=actnear]').onclick = () => {
    const n = nearestTrace(ll); if (!n) { toast('No hay ninguna traza KML visible. Importa o muestra el KML del camino.'); return; }
    if (n.off > 100) toast(`La traza más cercana («${n.f.name}») está a ${Math.round(n.off)} m.`, 5000);
    openActEditor({ rec: n.rec, f: n.f, d0: n.d, d1: n.d });
  };
  if (queryable.length) queryAfecciones(ll, queryable);
}

/* ---------------- Consulta de datos de las capas WMS (GetFeatureInfo) ---------------- */
function featureInfoUrl(rec, ll, fmt) {
  const z = map.getZoom(), size = 101, res = 40075016.686 / (256 * 2 ** z) * 1.5; // tolerancia de unos 75 px de pantalla
  const p = L.CRS.EPSG3857.project(L.latLng(ll)), half = size / 2 * res;
  const bbox = [p.x - half, p.y - half, p.x + half, p.y + half].map(v => v.toFixed(2)).join(',');
  const lay = encodeURIComponent(rec.layers);
  return `${rec.url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${lay}&QUERY_LAYERS=${lay}&STYLES=&SRS=EPSG:3857&BBOX=${bbox}`
    + `&WIDTH=${size}&HEIGHT=${size}&X=${Math.floor(size / 2)}&Y=${Math.floor(size / 2)}&FEATURE_COUNT=5&FORMAT=image/png&INFO_FORMAT=${encodeURIComponent(fmt)}`;
}
async function httpGetText(url) {
  const H = Plug('CapacitorHttp');
  if (NATIVE && H) { const r = await H.get({ url, responseType: 'text', connectTimeout: 12000, readTimeout: 12000 }); if (r.status >= 400) throw new Error('HTTP ' + r.status); return typeof r.data === 'string' ? r.data : JSON.stringify(r.data); }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.text(); }
  finally { clearTimeout(t); }
}
const HIDE_KEYS = /^(fid|gid|objectid|shape|geom|the_geom|bbox|id_?$)/i;
function parseInfo(text, fmt) {
  if (fmt === 'json') {
    const j = JSON.parse(text);
    return (j.features || []).map(f => Object.entries(f.properties || {}).filter(([k, v]) => v !== null && v !== '' && !HIDE_KEYS.test(k) && typeof v !== 'object'));
  }
  const d = new DOMParser().parseFromString(text, 'text/html');
  d.querySelectorAll('script,style').forEach(n => n.remove());
  const trs = [...d.querySelectorAll('tr')].filter(tr => tr.children.length >= 2 && [...tr.children].some(td => td.textContent.trim()));
  const rows = trs.map(tr => [...tr.children].map(td => td.textContent.trim()));
  if (rows.length) {
    // tablas con cabecera en la primera fila (más de 2 columnas o celdas <th>) → un elemento por fila
    const thHead = [...trs[0].children].every(c => c.tagName === 'TH');
    if ((rows[0].length > 2 || thHead) && rows.length >= 2) return rows.slice(1).map(r => rows[0].map((h, i) => [h, r[i] || '']).filter(([k, v]) => v && !HIDE_KEYS.test(k)));
    return [rows.map(r => [r[0], r.slice(1).join(' ')]).filter(([k, v]) => v)];
  }
  const txt = (d.body.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  if (!txt || /no (features|results|se ha encontrado)|search returned no results/i.test(txt)) return [];
  return [[['', txt.slice(0, 600)]]];
}
async function queryAfecciones(ll, list) {
  const out = list.map(e => ({ e, html: '' }));
  const render = () => {
    const box = $('#afecList'); if (!box) return;
    const hits = out.filter(o => o.html && o.html !== 'none' && !o.fail);
    const fails = out.filter(o => o.fail);
    const pending = out.filter(o => !o.html).length;
    let h = hits.map(o => o.html).join('');
    if (pending) h += `<p class="hint">Consultando ${pending} capas…</p>`;
    else if (!hits.length) h += '<p class="hint">Ninguna de las capas consultadas tiene elementos en este punto. Si buscas algo fino, como una línea, acerca el mapa y vuelve a pulsar.</p>';
    if (fails.length) h += `<p class="hint">Sin respuesta: ${fails.map(o => `<a href="${esc(o.link)}" target="_blank" rel="noopener">${esc(o.e.rec.name)}</a>`).join(', ')}. Pulsa una para ver sus datos en el navegador.</p>`;
    box.innerHTML = h;
  };
  await Promise.all(out.map(async o => {
    const r = o.e.rec, fmt = r.info === 'json' ? 'application/json' : 'text/html';
    const link = featureInfoUrl(r, ll, 'text/html');
    try {
      const feats = parseInfo(await httpGetText(featureInfoUrl(r, ll, fmt)), r.info);
      o.html = feats.length ? `<div class="afec-item"><b>${esc(r.name)}</b>${feats.slice(0, 3).map(f => `<table class="attrs">${f.slice(0, 12).map(([k, v]) => `<tr>${k ? `<td>${esc(k)}</td>` : ''}<td${k ? '' : ' colspan="2"'}>${esc(String(v))}</td></tr>`).join('')}</table>`).join('')}</div>` : 'none';
    } catch (err) {
      o.html = 'fail'; o.fail = true; o.link = link;
    }
    render();
  }));
  render();
}

/* ---------------- GPS ---------------- */
let lastPos = null, watchId = null, wantCenter = false, meMarker = null, meCircle = null;
function geoErr(e) {
  return e && e.code === 1 ? 'Sin permiso de ubicación. Actívalo en los ajustes para esta app.'
    : e && e.code === 3 ? 'El GPS tarda en responder. Prueba al aire libre.' : 'No se pudo obtener la posición.';
}
function onPos(p) {
  lastPos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
  if (drawing && drawing.gps) drawGpsPoint(lastPos);
  const ll = [lastPos.lat, lastPos.lng];
  if (!meMarker) {
    meCircle = L.circle(ll, { renderer: hlRenderer, radius: lastPos.acc, color: '#1c7ed6', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(map);
    meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
  } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(lastPos.acc); }
  const f = $('#fabLocate'); f.classList.remove('wait'); f.classList.add('on');
  if (wantCenter) { wantCenter = false; map.setView(ll, Math.max(map.getZoom(), 17)); }
  else if (walkHere() && $("#sheet").hidden && !map.getBounds().pad(-0.25).contains(ll)) map.panTo(ll, { animate: true }); // con un tramo en marcha, el mapa acompaña
  updateLivePK();
}
function startWatch() {
  if (!navigator.geolocation) { toast('Este dispositivo no ofrece posición GPS.'); return false; }
  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(onPos, e => { $('#fabLocate').classList.remove('wait'); if (!(lastPos && Date.now() - lastPos.t < 30000)) toast(geoErr(e), 6000); }, // fallos pasajeros del GPS: no se avisa si hay posición reciente
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
  }
  return true;
}
function locate() {
  if (!startWatch()) return;
  if (lastPos && Date.now() - lastPos.t < 60000) map.setView([lastPos.lat, lastPos.lng], Math.max(map.getZoom(), 17));
  else { wantCenter = true; $('#fabLocate').classList.add('wait'); }
}
function getPos() {
  if (lastPos && Date.now() - lastPos.t < 20000) return Promise.resolve(lastPos);
  if (!navigator.geolocation) return Promise.reject(new Error('Sin GPS'));
  startWatch();
  return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(p => { onPos(p); res(lastPos); }, rej,
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }));
}

/* ---------------- Captura de fotos, vídeo y audio ---------------- */
let captureCb = null;
function capture(inputId, cb) { captureCb = cb; const i = $('#' + inputId); i.value = ''; i.click(); }
['inPhoto', 'inVideo', 'inGallery'].forEach(id => $('#' + id).addEventListener('change', e => {
  const files = Array.from(e.target.files || []); const cb = captureCb; captureCb = null;
  if (files.length && cb) cb(files);
}));

async function processImage(file, at, stamp = settings.stamp) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const s = Math.min(1, 2560 / Math.max(bmp.width, bmp.height));
    if (s === 1 && file.size < 2.5e6 && !(stamp && at)) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    const g = c.getContext('2d'); g.drawImage(bmp, 0, 0, c.width, c.height);
    if (stamp && at) {
      const fs = Math.max(14, Math.round(c.width / 55)), pad = Math.round(fs * 0.6);
      const lines = [fmtDate(Date.now()), fmtLL(at.lat, at.lng) + (at.acc ? ` ±${Math.round(at.acc)} m` : ''), fmtUTM(at.lat, at.lng)];
      if (at.label) lines.unshift(at.label);
      const h = lines.length * fs * 1.3 + pad * 2;
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, c.height - h, c.width, h);
      g.fillStyle = '#fff'; g.font = `600 ${fs}px system-ui, sans-serif`; g.textBaseline = 'top';
      lines.forEach((t, i) => g.fillText(t, pad, c.height - h + pad + i * fs * 1.3));
    }
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.85));
  } catch (e) { return file; }
}

/* ---------------- Anotaciones y fotos ---------------- */
const notes = new Map();       // id → nota
const noteMarkers = new Map(); // id → marcador
const noteType = n => (n.media && n.media[0] ? n.media[0].kind : 'note');
const pinIcon = (type, dir) => L.divIcon({
  className: '',
  html: `<div class="pin ${type}">${dir != null ? `<svg class="cone" viewBox="-20 -20 40 40" style="transform:rotate(${Math.round(dir)}deg)"><path d="M0 0L-10-19A21 21 0 0 1 10-19Z"/></svg>` : ''}<span></span>${ICON[type] || ICON.note}</div>`,
  iconSize: [34, 42], iconAnchor: [17, 40],
});

function drawNote(n) {
  const gid = n.layerId || 'notes';
  const g = pointGroup(gid);
  if (layerVisible(gid) && !map.hasLayer(g)) g.addTo(map);
  let m = noteMarkers.get(n.id);
  if (!m) {
    m = L.marker([n.lat, n.lng], { icon: pinIcon(noteType(n), n.dir) }).addTo(g);
    m.on('click', e => { L.DomEvent.stop(e); if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng); if (measure) return addMeasurePt(e.latlng); viewNote(n.id); });
    noteMarkers.set(n.id, m);
  } else { m.setLatLng([n.lat, n.lng]).setIcon(pinIcon(noteType(n), n.dir)); }
}
function removeNoteMarker(id) {
  const m = noteMarkers.get(id); if (!m) return;
  pointGroups.forEach(g => g.removeLayer(m)); noteMarkers.delete(id);
}

let draft = null, draftMarker = null, recorder = null, recTimer = null;
function openEditor(at) {
  const existing = at.note;
  draft = existing ? { ...existing, media: [...(existing.media || [])] }
    : { id: uid(), obraId: settings.activeObra, lat: at.lat, lng: at.lng, acc: at.acc || null, src: at.src || 'gps', title: at.title || '', _autoTitle: at.title || '', text: '', media: [], created: Date.now() };
  renderEditor();
}
function syncDraft() {
  if (!draft) return;
  const t = $('#nTitle'), x = $('#nText');
  if (t) draft.title = t.value; if (x) draft.text = x.value;
}
function mediaHtml(list, editable) {
  return list.map((m, i) => {
    const u = objectUrl(m.blob);
    const rm = editable ? `<button class="rm" data-rm="${i}" aria-label="Quitar">${ICON.close}</button>` : '';
    if (m.kind === 'photo') return `<div class="m"><img src="${u}" alt="Foto" ${editable ? '' : 'data-full'}>${rm}</div>`;
    if (m.kind === 'video') return `<div class="m"><video src="${u}" ${editable ? 'muted' : 'controls'} playsinline preload="metadata"></video>${rm}</div>`;
    return `<div class="m aud"><audio src="${u}" controls preload="metadata"></audio>${rm}</div>`;
  }).join('');
}
const srcLabel = s => ({ gps: 'posición GPS', exif: 'coordenadas de la foto', marca: 'marca de agua de la foto', mapa: 'punto del mapa' }[s] || 'punto del mapa');
function renderEditor() {
  const d = draft; if (!d) return;
  const isNew = !notes.has(d.id);
  const keepDraft = draft;
  editorRerender = true;
  const b = openSheet(`<h2>${isNew ? 'Nueva anotación' : 'Editar anotación'}</h2>
    <div class="loc"><span>${fmtLL(d.lat, d.lng)}${d.acc ? ' · ±' + Math.round(d.acc) + ' m' : ''} · ${srcLabel(d.src)}</span>
      <button class="mini" data-a="gps">Usar mi posición</button></div>
    <p class="hint">Puedes arrastrar el marcador amarillo para corregir la posición.</p>
    <div class="field"><input type="text" id="nTitle" placeholder="Título (p. ej. Fuga en hidrante H-12)" value="${esc(d.title)}"></div>
    <div class="field"><textarea id="nText" rows="3" placeholder="Descripción u observaciones">${esc(d.text)}</textarea></div>
    <div class="media">${mediaHtml(d.media, true)}</div>
    <div class="acts">
      <button class="btn" data-a="photo">${ICON.photo}Foto</button>
      <button class="btn" data-a="video">${ICON.video}Vídeo</button>
      <button class="btn ${recorder ? 'rec' : ''}" data-a="audio">${ICON.audio}<span id="recLbl">${recorder ? 'Detener' : 'Nota de voz'}</span></button>
      <button class="btn" data-a="gallery">${ICON.gallery}De la galería</button>
      ${isNew ? '' : '<button class="btn del full" data-a="delete">Eliminar anotación</button>'}
    </div>
    <div class="savebar"><button class="btn pri full" data-a="save">Guardar anotación</button></div>`);
  draft = keepDraft; editorRerender = false;
  addDictation($('#nText'));
  const noteSnap = notes.has(d.id) ? JSON.stringify([notes.get(d.id).title, notes.get(d.id).text, (notes.get(d.id).media || []).length]) : null;
  onSheetClose(() => { if (editorRerender || !draft) return; syncDraft();
    const ch = noteSnap === null ? !!((draft.title || '').trim() && draft.title !== d._autoTitle || (draft.text || '').trim() || (draft.media || []).length) : noteSnap !== JSON.stringify([draft.title, draft.text, (draft.media || []).length]);
    if (ch) storeDraft('note', { ...draft, media: [...draft.media] }); else clearDraft(d.id); });
  storeDraft('note', { ...draft, media: [...draft.media] }, true);
  let liveT; b.addEventListener('input', () => { clearTimeout(liveT); liveT = setTimeout(() => { if (!draft || !$('#nTitle')) return; syncDraft(); storeDraft('note', { ...draft, media: [...draft.media] }, true); }, 250); }); // copia continua por si la app se cierra de golpe

  if (!draftMarker) {
    draftMarker = L.marker([d.lat, d.lng], { icon: pinIcon('draft'), draggable: true, zIndexOffset: 2000 }).addTo(map);
    draftMarker.on('dragend', () => { syncDraft(); const ll = draftMarker.getLatLng(); draft.lat = ll.lat; draft.lng = ll.lng; draft.src = 'mapa'; draft.acc = null; renderEditor(); });
  } else draftMarker.setLatLng([d.lat, d.lng]);
  const m = noteMarkers.get(d.id); if (m) m.setOpacity(0.3);
  onSheetClose(() => {
    // si el cierre no viene de otro renderEditor, se descarta el borrador
    setTimeout(() => {
      if ($('#sheet').hidden || !$('#nTitle')) {
        if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; recorder.stop(); recorder.stream.getTracks().forEach(t => t.stop()); recorder = null; clearInterval(recTimer); }
        if (draftMarker) { map.removeLayer(draftMarker); draftMarker = null; }
        const mk = noteMarkers.get(d.id); if (mk) mk.setOpacity(1);
        draft = null;
      }
    }, 0);
  });

  b.querySelectorAll('[data-rm]').forEach(el => el.onclick = () => { syncDraft(); draft.media.splice(+el.dataset.rm, 1); renderEditor(); });
  b.querySelector('[data-a=gps]').onclick = async () => {
    syncDraft(); toast('Obteniendo posición GPS…');
    try { const p = await getPos(); Object.assign(draft, { lat: p.lat, lng: p.lng, acc: p.acc, src: 'gps' }); renderEditor(); }
    catch (e) { toast(geoErr(e), 6000); }
  };
  b.querySelector('[data-a=photo]').onclick = () => { syncDraft(); capture('inPhoto', addMedia); };
  b.querySelector('[data-a=video]').onclick = () => { syncDraft(); capture('inVideo', addMedia); };
  b.querySelector('[data-a=gallery]').onclick = () => { syncDraft(); capture('inGallery', addMedia); };
  b.querySelector('[data-a=audio]').onclick = toggleRecord;
  b.querySelector('[data-a=save]').onclick = saveDraft;
  const del = b.querySelector('[data-a=delete]');
  if (del) del.onclick = () => deleteNote(d.id);
}
async function addMedia(files) {
  if (!draft) return;
  syncDraft();
  for (const f of files) {
    const kind = f.type.startsWith('image/') ? 'photo' : f.type.startsWith('video/') ? 'video' : f.type.startsWith('audio/') ? 'audio' : null;
    if (!kind) { toast(f.name + ': tipo de archivo no admitido'); continue; }
    let blob = kind === 'photo' ? await processImage(f, draft) : f;
    if (kind === 'photo') blob = await writeExif(blob, { lat: draft.lat, lng: draft.lng, date: Date.now(), desc: draft.title || 'OBRA-GIS' });
    draft.media.push({ id: uid(), kind, blob, mime: blob.type || f.type, t: Date.now() });
  }
  renderEditor();
}
async function toggleRecord() {
  if (recorder) { recorder.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Este dispositivo no permite grabar audio aquí.'); return; }
  syncDraft();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { toast('Sin permiso para usar el micrófono.', 5000); return; }
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || '';
  const chunks = [];
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  rec.stream = stream;
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    stream.getTracks().forEach(t => t.stop()); clearInterval(recTimer); recorder = null;
    if (!draft) return;
    syncDraft();
    const type = rec.mimeType || mime || 'audio/webm';
    draft.media.push({ id: uid(), kind: 'audio', blob: new Blob(chunks, { type }), mime: type, t: Date.now() });
    renderEditor();
  };
  rec.start(); recorder = rec;
  const t0 = Date.now();
  renderEditor();
  recTimer = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000), l = $('#recLbl');
    if (l) l.textContent = `Detener ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);
}
async function saveDraft() {
  if (recorder) { toast('Detén la grabación antes de guardar.'); return; }
  syncDraft();
  const n = draft;
  if (!n.title.trim() && !(n.text || '').trim() && !(n.media || []).length && !notes.has(n.id)) { toast('La anotación está vacía: escribe algo o añade una foto.', 4000); return; }
  if (!n.title.trim()) {
    const label = { photo: 'Foto', video: 'Vídeo', audio: 'Nota de voz', note: 'Anotación' }[noteType(n)];
    n.title = `${label} ${fmtDate(n.created)}`;
  }
  n.updated = Date.now();
  try { await DB.put('notes', n); }
  catch (e) { toast('No se pudo guardar: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  notes.set(n.id, n); drawNote(n); draft = null; clearDraft(n.id);
  const wasHidden = !n.layerId && settings.notesVisible === false;
  if (wasHidden) await setLayerVisible('notes', true);
  closeSheet(); toast(wasHidden ? 'Anotación guardada. «Mis anotaciones» estaba oculta y se ha vuelto a mostrar.' : 'Anotación guardada', wasHidden ? 6000 : 3500);
  if (!$('#drawer').hidden) renderDrawer();
}
async function deleteNote(id) {
  if (!confirm('¿Eliminar esta anotación y sus archivos? No se puede deshacer.')) return;
  await DB.del('notes', id); draft = null; clearDraft(id);
  notes.delete(id); removeNoteMarker(id);
  closeSheet(); toast('Anotación eliminada');
  if (!$('#drawer').hidden) renderDrawer();
}
function layerName(id) { if (!id || id === 'notes') return 'Mis anotaciones'; const e = layers.get(id); return e ? e.rec.name : ''; }
function viewNote(id) {
  const n = notes.get(id); if (!n) return;
  const extra = [n.acc ? 'GPS ±' + Math.round(n.acc) + ' m' : '', n.alt != null ? 'altitud ' + Math.round(n.alt) + ' m' : '', n.dir != null ? 'orientación ' + Math.round(n.dir) + '°' : ''].filter(Boolean).join(' · ');
  const b = openSheet(`<h2>${esc(n.title)}</h2>
    <p class="sub">${fmtDate(n.created)} · ${esc(layerName(n.layerId))}${extra ? ' · ' + extra : ''}${distFromMe(n.lat, n.lng)}</p>
    ${coordsBlock(n.lat, n.lng)}
    ${n.text ? `<div class="desc">${esc(n.text)}</div>` : ''}
    <div class="media">${mediaHtml(n.media || [], false)}</div>
    <div class="acts">
      ${goBtn(n.lat, n.lng, 'Llévame aquí', 'full')}
      <button class="btn" data-a="edit">Editar</button>
      <button class="btn" data-a="share">Compartir</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar coordenadas</button>
      <button class="btn del" data-a="delete">Eliminar</button>
    </div>`, 'view');
  b.querySelectorAll('img[data-full]').forEach(img => img.onclick = () => showPhoto(img.src));
  b.querySelector('[data-a=edit]').onclick = () => openEditor({ note: n });
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${fmtLL(n.lat, n.lng)}\n${fmtUTM(n.lat, n.lng)}`);
  b.querySelector('[data-a=delete]').onclick = () => deleteNote(n.id);
  b.querySelector('[data-a=share]').onclick = () => shareNote(n);
}
function showPhoto(src) {
  const v = $('#viewer'); v.innerHTML = `<img src="${src}" alt="Foto">`; v.hidden = false;
  v.onclick = () => { v.hidden = true; v.innerHTML = ''; };
}
async function shareNote(n) {
  const text = `${n.title}\n${n.text ? n.text + '\n' : ''}${fmtLL(n.lat, n.lng)}\n${viewUrl(n.lat, n.lng)}`;
  const media = n.media || [];
  const FS = Plug('Filesystem'), SH = Plug('Share');
  try {
    if (NATIVE && SH) {
      const files = [];
      if (FS) for (let i = 0; i < media.length; i++) {
        const w = await FS.writeFile({ path: `${n.id}_${i + 1}.${extFor(media[i])}`, data: await blobToB64(media[i].blob), directory: 'CACHE' });
        files.push(w.uri);
      }
      await SH.share(files.length ? { title: n.title, text, files } : { title: n.title, text });
      return;
    }
    const files = media.map((m, i) => new File([m.blob], `${n.id}_${i + 1}.${extFor(m)}`, { type: m.mime }));
    if (files.length && navigator.canShare && navigator.canShare({ files })) await navigator.share({ title: n.title, text, files });
    else if (navigator.share) await navigator.share({ title: n.title, text });
    else copyText(text);
  } catch (e) { if (e && e.name !== 'AbortError' && !/cancel/i.test(e.message || '')) copyText(text); }
}
const extFor = m => ({ photo: 'jpg', video: (m.mime || '').includes('mp4') ? 'mp4' : 'webm', audio: (m.mime || '').includes('mp4') ? 'm4a' : (m.mime || '').includes('ogg') ? 'ogg' : 'webm' }[m.kind]);

/* ---------------- Pendiente media y perfil longitudinal ---------------- */
const DEM_IGN = 'https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_25830_5_PB/coverage';
function vertexTable(f) { // vértices de la traza con su PK acumulado (misma regla que las marcas de PK)
  if (f._v) return f._v;
  const v = []; let acc = 0;
  lineParts(f).forEach(p => p.c.forEach((c, i) => {
    if (i > 0) acc += L.latLng(p.c[i - 1]).distanceTo(c);
    v.push({ lat: c[0], lng: c[1], z: c.length > 2 ? c[2] : null, d: acc });
  }));
  return (f._v = v);
}
function kmlHasZ(f) { const v = vertexTable(f); return v.every(p => p.z != null) && v.some(p => p.z !== 0) && new Set(v.map(p => p.z)).size > 1; }
function pointAtPK(f, d) {
  const v = vertexTable(f);
  if (d <= 0) return { ...v[0] };
  for (let i = 1; i < v.length; i++) {
    if (v[i].d >= d) {
      const a = v[i - 1], b = v[i], t = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, z: a.z != null && b.z != null ? a.z + (b.z - a.z) * t : null, d };
    }
  }
  return { ...v[v.length - 1] };
}
// Lee un PK escrito de cualquier forma habitual: «1+250», «1+250,5», «1250», «1.250» (miles), «1250 m», «PK 1+250».
function parsePK(txt) {
  let t = String(txt || '').trim().toLowerCase().replace(/^p\.?\s*k\.?\s*/, '').replace(/\s*(m|metros?)$/, '').replace(/\s/g, '');
  if (!t) return NaN;
  let m = /^(\d+)\+(\d+(?:[.,]\d+)?)$/.exec(t);
  if (m) return +m[1] * 1000 + parseFloat(m[2].replace(',', '.'));
  if (/^\d{1,3}([.,]\d{3})+$/.test(t) && !/^0[.,]/.test(t)) return +t.replace(/[.,]/g, ''); // 1.250 / 1,250 → 1250 m
  if (/^\d+(?:[.,]\d+)?$/.test(t)) return parseFloat(t.replace(',', '.'));
  return NaN;
}
// Texto de ayuda para comprobar cómo se ha entendido un PK
function pkReadBack(txt) {
  const v = parsePK(txt); if (!String(txt || '').trim()) return '';
  if (!isFinite(v)) return '⚠ No se entiende. Escribe por ejemplo 1+250 o 1250.';
  return `= PK ${fmtPK(v)}${v > 0 && v < 10 && /[.,]/.test(txt) ? ' (¿querías decir ' + fmtPK(v * 1000) + '? escribe ' + Math.floor(v) + '+' + String(Math.round(v % 1 * 1000)).padStart(3, '0') + ')' : ''}`;
}
// Cotas del MDT05 del IGN (OGC API Coverages, CoverageJSON). Agrupa los puntos en ventanas de ~500 m.
function covGrid(j) {
  const ax = j.domain.axes, rk = Object.keys(j.ranges)[0], rg = j.ranges[rk];
  const axis = a => a.values ? { v0: a.values[0], dv: a.values.length > 1 ? a.values[1] - a.values[0] : 1, n: a.values.length } : { v0: a.start, dv: a.num > 1 ? (a.stop - a.start) / (a.num - 1) : 1, n: a.num };
  const x = axis(ax.x || ax.lon || ax.E), y = axis(ax.y || ax.lat || ax.N);
  const names = rg.axisNames || ['y', 'x'];
  const yFirst = /^(y|lat|N)$/i.test(names[0]);
  return { x, y, yFirst, vals: rg.values, geo: Math.abs(x.v0) <= 180 && Math.abs(y.v0) <= 90 };
}
function sampleGrid(g, p) {
  let X, Y;
  if (g.geo) { X = p.lng; Y = p.lat; } else { const u = toUTM(p.lat, p.lng, 30); X = u.x; Y = u.y; }
  const fi = (X - g.x.v0) / g.x.dv, fj = (Y - g.y.v0) / g.y.dv;
  const i0 = Math.floor(fi), j0 = Math.floor(fj), ti = fi - i0, tj = fj - j0;
  const at = (i, j) => {
    if (i < 0 || j < 0 || i >= g.x.n || j >= g.y.n) return null;
    const v = g.vals[g.yFirst ? j * g.x.n + i : i * g.y.n + j];
    return v == null || !isFinite(v) || v < -500 || v > 9000 ? null : v;
  };
  const q = [at(i0, j0), at(i0 + 1, j0), at(i0, j0 + 1), at(i0 + 1, j0 + 1)];
  if (q.some(v => v == null)) { const ok = q.filter(v => v != null); return ok.length ? ok.reduce((a, b) => a + b) / ok.length : null; }
  return q[0] * (1 - ti) * (1 - tj) + q[1] * ti * (1 - tj) + q[2] * (1 - ti) * tj + q[3] * ti * tj;
}
async function demIGN(pts) {
  const out = new Array(pts.length).fill(null), SPAN = 0.0045;
  let i = 0;
  while (i < pts.length) {
    let j = i, b = [pts[i].lng, pts[i].lat, pts[i].lng, pts[i].lat];
    while (j + 1 < pts.length) {
      const p = pts[j + 1], nb = [Math.min(b[0], p.lng), Math.min(b[1], p.lat), Math.max(b[2], p.lng), Math.max(b[3], p.lat)];
      if (nb[2] - nb[0] > SPAN || nb[3] - nb[1] > SPAN) break;
      b = nb; j++;
    }
    const m = 0.0002, bbox = [b[0] - m, b[1] - m, b[2] + m, b[3] + m].map(v => v.toFixed(6)).join(',');
    const g = covGrid(JSON.parse(await httpGetText(`${DEM_IGN}?f=json&bbox=${bbox}`)));
    for (let k = i; k <= j; k++) out[k] = sampleGrid(g, pts[k]);
    i = j + 1;
  }
  if (out.filter(v => v != null).length < pts.length * 0.8) throw new Error('El MDT del IGN no devolvió cotas para este tramo');
  return out;
}
async function demGlobal(pts) { // Copernicus GLO-90 a través de Open-Meteo (reserva)
  const out = [];
  for (let i = 0; i < pts.length; i += 100) {
    const ch = pts.slice(i, i + 100);
    const j = JSON.parse(await httpGetText(`https://api.open-meteo.com/v1/elevation?latitude=${ch.map(p => p.lat.toFixed(6)).join(',')}&longitude=${ch.map(p => p.lng.toFixed(6)).join(',')}`));
    out.push(...j.elevation);
  }
  return out;
}
async function profileElevations(f, pts, source) {
  if (source === 'kml') return { z: pts.map(p => p.z), label: 'cotas del KML' };
  try { return { z: await demIGN(pts), label: 'MDT05 del IGN (LiDAR, paso de malla 5 m)' }; }
  catch (e) { console.warn('IGN', e); return { z: await demGlobal(pts), label: 'modelo global Copernicus de 90 m (el IGN no respondió; resultado orientativo)' }; }
}

let slopePick = null;
const slopeHL = L.layerGroup().addTo(map);
function showSlopeSegment(f, d0, d1) {
  slopeHL.clearLayers();
  const v = vertexTable(f).filter(p => p.d > d0 && p.d < d1);
  const a = pointAtPK(f, d0), b = pointAtPK(f, d1);
  L.polyline([[a.lat, a.lng], ...v.map(p => [p.lat, p.lng]), [b.lat, b.lng]], { renderer: hlRenderer, color: '#ff6b00', weight: 7, opacity: 0.85, interactive: false }).addTo(slopeHL);
  [[a, fmtPK(d0)], [b, fmtPK(d1)]].forEach(([p, t]) => L.circleMarker([p.lat, p.lng], { renderer: hlRenderer, radius: 7, color: '#fff', weight: 3, fillColor: '#ff6b00', fillOpacity: 1, interactive: false })
    .bindTooltip(t, { permanent: true, direction: 'top', offset: [0, -8], className: 'pk-tip' }).addTo(slopeHL));
}
function slopeSheet(f, rec, d0, d1, opts = {}) {
  const hasZ = kmlHasZ(f);
  const source = opts.source || (hasZ ? 'kml' : 'dem');
  const b = openSheet(`<h2>Pendiente y perfil</h2><p class="sub">${esc(f.name)} · ${esc(rec.name)} · longitud total ${fmtLen(f.length)} (PK ${fmtPK(f.length)})</p>
    <div class="pkrow">
      <div class="field"><label for="pk0">Desde PK</label><input type="text" id="pk0" inputmode="decimal" value="${fmtPK(d0)}"></div>
      <div class="field"><label for="pk1">Hasta PK</label><input type="text" id="pk1" inputmode="decimal" value="${fmtPK(d1)}"></div>
    </div>
    ${hasZ ? `<div class="field"><label for="zsrc">Cotas</label><select id="zsrc"><option value="kml" ${source === 'kml' ? 'selected' : ''}>Las del KML</option><option value="dem" ${source === 'dem' ? 'selected' : ''}>Modelo del terreno (MDT05 del IGN)</option></select></div>` : ''}
    <div class="acts">
      <button class="btn pri full" data-a="calc">${ICON.slope}Calcular pendiente</button>
      <button class="btn" data-a="pick">Elegir tramo en el mapa</button>
      <button class="btn" data-a="all">Toda la traza</button>
    </div>
    <p class="hint">Escribe los PK como 0+350 o en metros (350).</p>
    <div id="slopeRes"></div>`);
  showSlopeSegment(f, d0, d1);
  onSheetClose(() => { if (!slopePick) slopeHL.clearLayers(); });
  const read = () => {
    let a = parsePK($('#pk0').value), c = parsePK($('#pk1').value);
    if (!isFinite(a) || !isFinite(c)) { toast('Revisa los PK: escríbelos como 0+350 o en metros.'); return null; }
    if (a > c) [a, c] = [c, a];
    a = Math.max(0, a); c = Math.min(f.length, c);
    $('#pk0').value = fmtPK(a); $('#pk1').value = fmtPK(c);
    if (c - a < 5) { toast('El tramo es demasiado corto. Elige al menos 5 m.'); return null; }
    return [a, c];
  };
  const src = () => ($('#zsrc') ? $('#zsrc').value : 'dem');
  b.querySelector('[data-a=calc]').onclick = () => { const r = read(); if (r) { showSlopeSegment(f, r[0], r[1]); computeSlope(f, rec, r[0], r[1], src()); } };
  b.querySelector('[data-a=all]').onclick = () => { $('#pk0').value = fmtPK(0); $('#pk1').value = fmtPK(f.length); showSlopeSegment(f, 0, f.length); computeSlope(f, rec, 0, f.length, src()); };
  b.querySelector('[data-a=pick]').onclick = () => {
    slopePick = { f, rec, pts: [], source: src() };
    closeSheet(); slopeHL.clearLayers();
    $('#pickText').textContent = 'Toca en el mapa el inicio del tramo';
    $('#pickBar').hidden = false;
  };
  if (opts.autorun) computeSlope(f, rec, d0, d1, source);
}
var slopePickPoint = function (ll) {
  const sp = slopePick; if (!sp) return;
  const r = pkAt(sp.f, L.latLng(ll));
  sp.pts.push(r.d);
  const p = pointAtPK(sp.f, r.d);
  L.circleMarker([p.lat, p.lng], { renderer: hlRenderer, radius: 7, color: '#fff', weight: 3, fillColor: '#ff6b00', fillOpacity: 1, interactive: false })
    .bindTooltip(fmtPK(r.d), { permanent: true, direction: 'top', offset: [0, -8], className: 'pk-tip' }).addTo(slopeHL);
  if (r.off > 60) toast(`Has tocado a ${Math.round(r.off)} m de la traza: se usa el punto más cercano (PK ${fmtPK(r.d)}).`, 4000);
  if (sp.pts.length === 1) { $('#pickText').textContent = `Inicio en PK ${fmtPK(r.d)}. Toca ahora el final del tramo`; return; }
  const [a, c] = sp.pts[0] <= sp.pts[1] ? sp.pts : [sp.pts[1], sp.pts[0]];
  slopePick = null; $('#pickBar').hidden = true;
  slopeSheet(sp.f, sp.rec, a, c, { source: sp.source, autorun: true });
};
$('#pickCancel').onclick = () => { offPick = false; calcPick = null; slopePick = null; $('#pickBar').hidden = true; slopeHL.clearLayers(); if (actPick) { actPick = null; renderActEditor(); } if (widthPick) { widthPick = null; renderWidthSheet(); } };

const fmtPct = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2).replace('.', ',') + ' %';
const fmtZ = z => z.toFixed(2).replace('.', ',') + ' m';
async function computeSlope(f, rec, d0, d1, source) {
  const box = $('#slopeRes'); if (!box) return;
  const L0 = d1 - d0, step = Math.min(25, Math.max(5, L0 / 200));
  let ds = []; for (let d = d0; d < d1; d += step) ds.push(d); ds.push(d1);
  // con cotas del KML se añaden los vértices: los cambios de pendiente caen exactamente donde están
  if (source === 'kml') { const vs = vertexTable(f).map(v => v.d).filter(d => d > d0 && d < d1); if (vs.length < 20000) ds = [...new Set([...ds, ...vs].map(d => Math.round(d * 1000) / 1000))].sort((a, b) => a - b); }
  const pts = ds.map(d => pointAtPK(f, d));
  box.innerHTML = `<p class="hint">Obteniendo ${pts.length} cotas…</p>`;
  let res;
  try { res = await profileElevations(f, pts, source); }
  catch (e) { box.innerHTML = '<p class="hint">No se pudieron obtener las cotas del terreno. Comprueba la conexión y vuelve a intentarlo.</p>'; return; }
  const prof = ds.map((d, i) => ({ d, z: res.z[i] })).filter(p => p.z != null && isFinite(p.z));
  prof.src = source === 'kml' ? 'kml' : 'dem';
  if (prof.length < 2) { box.innerHTML = '<p class="hint">No hay cotas suficientes para este tramo.</p>'; return; }
  const zi = prof[0].z, zf = prof[prof.length - 1].z, dz = zf - zi, len = prof[prof.length - 1].d - prof[0].d;
  const media = dz / len * 100;
  let up = 0, down = 0; for (let i = 1; i < prof.length; i++) { const v = prof[i].z - prof[i - 1].z; v > 0 ? up += v : down -= v; }
  const zmax = prof.reduce((a, b) => (b.z > a.z ? b : a)), zmin = prof.reduce((a, b) => (b.z < a.z ? b : a));
  // pendientes por subtramos de 100 m (o la décima parte si el tramo es corto)
  const win = Math.min(100, Math.max(20, len / 10)); let smax = null, smin = null;
  for (let k = 0; k < prof.length; k++) {
    const target = prof[k].d + win; let j = k; while (j < prof.length - 1 && prof[j].d < target) j++;
    if (prof[j].d - prof[k].d < win * 0.8) break;
    const s = (prof[j].z - prof[k].z) / (prof[j].d - prof[k].d) * 100;
    if (!smax || s > smax.s) smax = { s, a: prof[k].d, b: prof[j].d };
    if (!smin || s < smin.s) smin = { s, a: prof[k].d, b: prof[j].d };
  }
  const word = Math.abs(media) < 0.05 ? 'prácticamente horizontal' : media > 0 ? 'sube en el sentido del PK' : 'baja en el sentido del PK';
  const text = `${f.name} · PK ${fmtPK(d0)} a ${fmtPK(d1)}\nLongitud: ${fmtLen(len)}\nCota inicial: ${fmtZ(zi)} · Cota final: ${fmtZ(zf)}\nDesnivel: ${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))}\nPendiente media: ${fmtPct(media)} (${word})\nFuente: ${res.label}`;
  box.innerHTML = `<div class="slope-main"><span>${fmtPct(media)}</span><small>pendiente media · ${word}</small></div>
    <table class="attrs">
      <tr><td>Tramo</td><td>PK ${fmtPK(d0)} a ${fmtPK(d1)} · ${fmtLen(len)}</td></tr>
      <tr><td>Cota inicial / final</td><td>${fmtZ(zi)} / ${fmtZ(zf)}</td></tr>
      <tr><td>Desnivel</td><td>${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))} (${(Math.abs(dz) / len * 1000).toFixed(1).replace('.', ',')} m/km)</td></tr>
      <tr><td>Cota máxima</td><td>${fmtZ(zmax.z)} en PK ${fmtPK(zmax.d)}</td></tr>
      <tr><td>Cota mínima</td><td>${fmtZ(zmin.z)} en PK ${fmtPK(zmin.d)}</td></tr>
      <tr><td>Subida / bajada acumulada</td><td>+${up.toFixed(1).replace('.', ',')} m / −${down.toFixed(1).replace('.', ',')} m</td></tr>
      ${smax && smax.s > 0 ? `<tr><td>Mayor subida (tramos de ${Math.round(win)} m)</td><td>${fmtPct(smax.s)} entre PK ${fmtPK(smax.a)} y ${fmtPK(smax.b)}</td></tr>` : ''}
      ${smin && smin.s < 0 ? `<tr><td>Mayor bajada (tramos de ${Math.round(win)} m)</td><td>${fmtPct(smin.s)} entre PK ${fmtPK(smin.a)} y ${fmtPK(smin.b)}</td></tr>` : ''}
    </table>
    ${profileSVG(prof)}
    <p class="hint">Cotas: ${esc(res.label)}. Pendiente media = desnivel entre extremos ÷ longitud en planta.</p>
    <div class="acts"><button class="btn full" data-a="copyres">${ICON.copy}Copiar resultados</button></div>
    <h3 class="sh" id="slClassH">Tramificación por rangos de pendiente</h3>
    <div class="pkrow"><div class="field"><label for="slBr">Límites de los rangos (%)</label><input type="text" id="slBr" inputmode="decimal" value="${esc((settings.slopeBreaks || [5, 10, 20]).join('; '))}"></div>
      <div class="field"><label for="slCMin">Tramo mínimo (m)</label><input type="text" id="slCMin" inputmode="decimal" value="${settings.slopeMin ?? 20}"></div></div>
    <div class="acts"><button class="btn full" data-a="classify">${ICON.slope}Recalcular rangos</button></div>
    <div id="slClass"></div>
    <h3 class="sh">Buscar tramos por pendiente</h3>
    <div class="pkrow"><div class="field"><label for="slLe">Pendiente ≤ (%)</label><input type="text" id="slLe" inputmode="decimal" placeholder="p. ej. 2"></div>
      <div class="field"><label for="slGe">Pendiente ≥ (%)</label><input type="text" id="slGe" inputmode="decimal" placeholder="p. ej. 8"></div></div>
    <div class="field row"><label class="opt grow" style="padding:0"><input type="checkbox" id="slAbs" checked>En valor absoluto (subidas y bajadas)</label><label for="slMin" class="grow" style="text-align:right">Tramo mínimo (m)</label><input type="text" id="slMin" inputmode="decimal" value="20" style="max-width:70px"></div>
    <div class="acts"><button class="btn full" data-a="ranges">${ICON.slope}Buscar tramos</button></div>
    <div id="slRanges"></div>`;
  box.querySelector('[data-a=copyres]').onclick = () => copyText(text);
  box.querySelector('[data-a=ranges]').onclick = () => slopeRanges(f, prof);
  box.querySelector('[data-a=classify]').onclick = () => slopeClasses(f, prof, true);
  slopeClasses(f, prof, false);
  if (slopeScrollToClass) { slopeScrollToClass = false; setTimeout(() => { const h = $('#slClassH'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }
}
let slopeScrollToClass = false;
/* Tramificación de la traza por rangos de pendiente (por defecto < 5 %, 5–10 %, 10–20 % y ≥ 20 %, en valor absoluto)
   Pendiente suavizada en ventanas de 20 m; los tramos más cortos que el mínimo se unen al tramo vecino. */
const SLOPE_COLORS = ['#2f9e44', '#f2c94c', '#f08c00', '#e03131', '#862e9c', '#343a40'];
function slopeCells(prof) {
  const zAt = d => { for (let i = 1; i < prof.length; i++) if (prof[i].d >= d) { const a = prof[i - 1], b = prof[i]; return a.z + (b.z - a.z) * (d - a.d) / ((b.d - a.d) || 1); } return prof[prof.length - 1].z; };
  const d0 = prof[0].d, d1 = prof[prof.length - 1].d;
  if (prof.src === 'kml') { // cotas del KML: el perfil es exacto, cada tramo entre puntos tiene su pendiente (sin suavizar)
    const cells = []; for (let i = 1; i < prof.length; i++) { const a = prof[i - 1], b = prof[i]; if (b.d > a.d) cells.push({ a: a.d, b: b.d, s: (b.z - a.z) / (b.d - a.d) * 100 }); }
    return { cells, zAt, d0, d1 };
  }
  const W = 20, st = Math.max(1, Math.min(5, (d1 - d0) / 500)), cells = []; // modelo del terreno: se suaviza en ventanas de 20 m
  for (let d = d0; d < d1 - 1e-6; d += st) {
    const e = Math.min(d1, d + st), m = (d + e) / 2, a = Math.max(d0, m - W / 2), b = Math.min(d1, m + W / 2);
    cells.push({ a: d, b: e, s: b > a ? (zAt(b) - zAt(a)) / (b - a) * 100 : 0 });
  }
  return { cells, zAt, d0, d1 };
}
function slopeClasses(f, prof, fromUser) {
  const box = $('#slClass'); if (!box) return;
  const br = String($('#slBr').value || '').split(/[;\s]+/).map(parseNum).filter(v => isFinite(v) && v > 0).sort((a, b) => a - b).filter((v, i, a) => i === 0 || v !== a[i - 1]).slice(0, 5);
  if (!br.length) { box.innerHTML = '<p class="hint">Escribe los límites separados por punto y coma, por ejemplo 5; 10; 20.</p>'; return; }
  const minL = Math.max(0, parseNum($('#slCMin').value) || 0);
  if (fromUser) { settings.slopeBreaks = br; settings.slopeMin = minL; saveSettings(); }
  const n = v => String(v).replace('.', ',');
  const labels = br.map((v, i) => i === 0 ? `Menor del ${n(v)} %` : `Entre el ${n(br[i - 1])} y el ${n(v)} %`).concat([`${n(br[br.length - 1])} % o más`]);
  const cls = v => { const a = Math.abs(v); let k = 0; while (k < br.length && a >= br[k]) k++; return k; };
  const { cells, zAt, d0, d1 } = slopeCells(prof), L0 = d1 - d0;
  // tramos continuos de la misma clase
  let runs = [];
  cells.forEach(c => { const k = cls(c.s), last = runs[runs.length - 1]; if (last && last.k === k) last.b = c.b; else runs.push({ a: c.a, b: c.b, k }); });
  // los tramos cortos se unen al vecino de clase más parecida (y, si empata, al más largo)
  while (runs.length > 1) {
    let i = -1, mn = Infinity; runs.forEach((r, j) => { const l = r.b - r.a; if (l < minL && l < mn) { mn = l; i = j; } });
    if (i < 0) break;
    const r = runs[i], L = runs[i - 1], R = runs[i + 1];
    const t = !L ? R : !R ? L : (Math.abs(L.k - r.k) < Math.abs(R.k - r.k) || (Math.abs(L.k - r.k) === Math.abs(R.k - r.k) && L.b - L.a >= R.b - R.a)) ? L : R;
    t.a = Math.min(t.a, r.a); t.b = Math.max(t.b, r.b); runs.splice(i, 1);
    for (let j = runs.length - 1; j > 0; j--) if (runs[j].k === runs[j - 1].k) { runs[j - 1].b = runs[j].b; runs.splice(j, 1); }
  }
  runs = runs.map(r => {
    const cs = cells.filter(c => c.a >= r.a - 1e-6 && c.b <= r.b + 1e-6), len = r.b - r.a;
    return { ...r, len, s: (zAt(r.b) - zAt(r.a)) / (len || 1) * 100, sAbs: cs.reduce((t, c) => t + Math.abs(c.s) * (c.b - c.a), 0) / (len || 1) };
  });
  const tot = labels.map((lb, k) => { const rr = runs.filter(r => r.k === k); return { lb, k, len: rr.reduce((t, r) => t + r.len, 0), n: rr.length }; });
  // indicadores medios de la traza
  const meanAbs = cells.reduce((t, c) => t + Math.abs(c.s) * (c.b - c.a), 0) / (L0 || 1);
  let up = 0, down = 0; for (let i = 1; i < prof.length; i++) { const v = prof[i].z - prof[i - 1].z; v > 0 ? up += v : down -= v; }
  const dz = prof[prof.length - 1].z - prof[0].z, mean = dz / (L0 || 1) * 100, perKm = (up + down) / (L0 || 1) * 1000;
  // mapa
  slopeHL.clearLayers(); showSlopeSegment(f, d0, d1);
  runs.forEach(r => L.polyline(segmentCoords(f, r.a, r.b), { renderer: hlRenderer, color: SLOPE_COLORS[r.k], weight: 9, opacity: 0.9, interactive: false }).addTo(slopeHL));
  const pc = v => (v / (L0 || 1) * 100).toFixed(1).replace('.', ',') + ' %';
  box.innerHTML = `<table class="attrs ranges"><tr><th>Rango</th><th>Longitud</th><th>% traza</th><th>Tramos</th></tr>
      ${tot.map(t => `<tr><td><span class="dot" style="background:${SLOPE_COLORS[t.k]}"></span>${t.lb}</td><td>${fmtLen(t.len)}</td><td>${pc(t.len)}</td><td>${t.n}</td></tr>`).join('')}
      <tr class="tot"><td>Total</td><td>${fmtLen(L0)}</td><td>100 %</td><td>${runs.length}</td></tr></table>
    <table class="attrs">
      <tr><td>Pendiente media de la traza</td><td><b>${fmtPct(mean)}</b> (desnivel entre extremos ${(dz >= 0 ? '+' : '−') + fmtZ(Math.abs(dz))} en ${fmtLen(L0)})</td></tr>
      <tr><td>Pendiente media absoluta</td><td><b>${meanAbs.toFixed(2).replace('.', ',')} %</b> (media de subidas y bajadas, ponderada por longitud)</td></tr>
      <tr><td>Desnivel medio</td><td><b>${perKm.toFixed(1).replace('.', ',')} m/km</b> (subida + bajada acumulada: +${up.toFixed(1).replace('.', ',')} / −${down.toFixed(1).replace('.', ',')} m)</td></tr>
    </table>
    <details class="tramos"><summary>Ver los ${runs.length} tramos con sus PK</summary><table class="attrs"><tr><th>PK</th><th>Long.</th><th>Pend.</th><th>Rango</th></tr>
      ${runs.map(r => `<tr><td>${fmtPK(r.a)} – ${fmtPK(r.b)}</td><td>${fmtLen(r.len)}</td><td>${fmtPct(r.s)}</td><td><span class="dot" style="background:${SLOPE_COLORS[r.k]}"></span>${labels[r.k]}</td></tr>`).join('')}</table></details>
    <p class="hint">Rangos en valor absoluto (subidas y bajadas por igual), con la pendiente ${prof.src === 'kml' ? 'exacta de cada tramo entre vértices (cotas del KML)' : 'del terreno medida en ventanas de 20 m'}. Los tramos de menos de ${n(minL)} m se unen al vecino. Colores en el mapa: ${tot.map(t => `<span class="dot" style="background:${SLOPE_COLORS[t.k]}"></span>${t.lb.toLowerCase()}`).join(' · ')}.</p>
    <div class="acts"><button class="btn" data-a="clcopy">${ICON.copy}Copiar</button><button class="btn" data-a="clcsv">CSV para Excel</button><button class="btn" data-a="clkmz">KMZ coloreado</button></div>`;
  const summary = `${f.name} · PK ${fmtPK(d0)} a ${fmtPK(d1)} · ${fmtLen(L0)}\n` + tot.map(t => `${t.lb}: ${fmtLen(t.len)} (${pc(t.len)}) · ${t.n} tramos`).join('\n')
    + `\nPendiente media: ${fmtPct(mean)}\nPendiente media absoluta: ${meanAbs.toFixed(2).replace('.', ',')} %\nDesnivel medio: ${perKm.toFixed(1).replace('.', ',')} m/km (+${up.toFixed(1).replace('.', ',')} / −${down.toFixed(1).replace('.', ',')} m)`;
  box.querySelector('[data-a=clcopy]').onclick = () => copyText(summary);
  const base = `pendientes_${safeName(f.name)}`;
  box.querySelector('[data-a=clcsv]').onclick = () => {
    const q = csvQ, d = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
    const rows = [['resumen'], ['rango', 'longitud_m', 'porcentaje', 'n_tramos']].concat(tot.map(t => [t.lb, d(t.len), d(t.len / L0 * 100), t.n]))
      .concat([[], ['pendiente_media_%', d(mean)], ['pendiente_media_absoluta_%', d(meanAbs)], ['desnivel_medio_m_km', d(perKm)], ['subida_acumulada_m', d(up)], ['bajada_acumulada_m', d(down)], [],
        ['tramos'], ['pk_inicio', 'pk_fin', 'longitud_m', 'pendiente_%', 'pendiente_abs_media_%', 'rango']])
      .concat(runs.map(r => [fmtPK(r.a), fmtPK(r.b), d(r.len), d(r.s), d(r.sAbs), labels[r.k]]));
    saveBlob(new Blob(['\ufeff' + rows.map(r => r.map(q).join(';')).join('\r\n')], { type: 'text/csv' }), base + '.csv').catch(() => {});
  };
  box.querySelector('[data-a=clkmz]').onclick = async () => {
    const kc = h => 'ff' + h.slice(5, 7) + h.slice(3, 5) + h.slice(1, 3);
    const k = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="${KML_NS}"><Document><name>${xml('Pendientes · ' + f.name)}</name>
${tot.map(t => `<Style id="r${t.k}"><LineStyle><color>${kc(SLOPE_COLORS[t.k])}</color><width>6</width></LineStyle></Style>`).join('')}
${tot.map(t => `<Folder><name>${xml(t.lb)} · ${fmtLen(t.len)}</name>${runs.filter(r => r.k === t.k).map(r => `<Placemark><name>PK ${fmtPK(r.a)} – ${fmtPK(r.b)}</name><styleUrl>#r${t.k}</styleUrl><description>${xml(`${t.lb} · ${fmtLen(r.len)} · pendiente ${fmtPct(r.s)}`)}</description>
<ExtendedData><Data name="pk_inicio"><value>${fmtPK(r.a)}</value></Data><Data name="pk_fin"><value>${fmtPK(r.b)}</value></Data><Data name="longitud_m"><value>${r.len.toFixed(1)}</value></Data><Data name="pendiente_pct"><value>${r.s.toFixed(2)}</value></Data><Data name="rango"><value>${xml(t.lb)}</value></Data></ExtendedData>
<LineString><tessellate>1</tessellate><coordinates>${segmentCoords(f, r.a, r.b).map(c => `${c[1]},${c[0]},0`).join(' ')}</coordinates></LineString></Placemark>`).join('')}</Folder>`).join('\n')}
</Document></kml>`;
    const z = new JSZip(); z.file('doc.kml', k); saveBlob(await z.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' }), base + '.kmz').catch(() => {});
  };
}
// Clasifica la traza en tramos que cumplen pendiente ≤ X o ≥ Y (pendiente suavizada en ventanas de 20 m)
function slopeRanges(f, prof) {
  const le = parseNum($('#slLe').value), ge = parseNum($('#slGe').value), abs = $('#slAbs').checked, minL = Math.max(0, parseNum($('#slMin').value) || 0);
  if (!isFinite(le) && !isFinite(ge)) { toast('Escribe al menos uno de los dos límites.'); return; }
  const zAt = d => { for (let i = 1; i < prof.length; i++) if (prof[i].d >= d) { const a = prof[i - 1], b = prof[i]; return a.z + (b.z - a.z) * (d - a.d) / ((b.d - a.d) || 1); } return prof[prof.length - 1].z; };
  const d0 = prof[0].d, d1 = prof[prof.length - 1].d, W = 20, st = Math.max(2, Math.min(5, (d1 - d0) / 500));
  const cells = [];
  for (let d = d0; d < d1; d += st) {
    const e = Math.min(d1, d + st), m = (d + e) / 2, a = Math.max(d0, m - W / 2), b = Math.min(d1, m + W / 2);
    let sl = b > a ? (zAt(b) - zAt(a)) / (b - a) * 100 : 0; const v = abs ? Math.abs(sl) : sl;
    cells.push({ a: d, b: e, v });
  }
  const runs = test => {
    const out = []; let cur = null;
    cells.forEach(c => { if (test(c.v)) { if (cur && Math.abs(cur.b - c.a) < 0.01) cur.b = c.b; else { cur = { a: c.a, b: c.b }; out.push(cur); } } else cur = null; });
    return out.filter(r => r.b - r.a >= minL).map(r => ({ ...r, s: (zAt(r.b) - zAt(r.a)) / (r.b - r.a) * 100 }));
  };
  const lo = isFinite(le) ? runs(v => v <= le) : [], hi = isFinite(ge) ? runs(v => v >= ge) : [];
  slopeHL.clearLayers(); showSlopeSegment(f, d0, d1);
  const draw = (list, color) => list.forEach(r => L.polyline(segmentCoords(f, r.a, r.b), { renderer: hlRenderer, color, weight: 9, opacity: 0.9, interactive: false }).addTo(slopeHL));
  draw(lo, '#2f9e44'); draw(hi, '#e03131');
  const tot = l => l.reduce((s2, r) => s2 + r.b - r.a, 0), L0 = d1 - d0;
  const table = (list, label, color) => list.length ? `<p class="rhead"><span class="dot" style="background:${color}"></span><b>${label}</b> · ${list.length} tramo${list.length === 1 ? '' : 's'} · ${fmtLen(tot(list))} (${(tot(list) / L0 * 100).toFixed(1).replace('.', ',')} % del tramo)</p>
    <table class="attrs">${list.map(r => `<tr><td>PK ${fmtPK(r.a)} – ${fmtPK(r.b)}</td><td>${fmtLen(r.b - r.a)} · ${fmtPct(r.s)}</td></tr>`).join('')}</table>` : `<p class="hint">${label}: ningún tramo de al menos ${minL} m.</p>`;
  const sym = abs ? '|pendiente|' : 'pendiente';
  $('#slRanges').innerHTML = (isFinite(le) ? table(lo, `${sym} ≤ ${String(le).replace('.', ',')} %`, '#2f9e44') : '') + (isFinite(ge) ? table(hi, `${sym} ≥ ${String(ge).replace('.', ',')} %`, '#e03131') : '')
    + '<p class="hint">Los tramos se marcan en el mapa: verde para ≤ y rojo para ≥.</p>';
}
function profileSVG(prof) {
  const W = 360, H = 170, pl = 46, pr = 10, pt = 10, pb = 26;
  const d0 = prof[0].d, d1 = prof[prof.length - 1].d;
  let z0 = Math.min(...prof.map(p => p.z)), z1 = Math.max(...prof.map(p => p.z));
  if (z1 - z0 < 2) { const m = (z0 + z1) / 2; z0 = m - 1; z1 = m + 1; }
  const pad = (z1 - z0) * 0.08; z0 -= pad; z1 += pad;
  const X = d => pl + (d - d0) / (d1 - d0 || 1) * (W - pl - pr), Y = z => pt + (1 - (z - z0) / (z1 - z0)) * (H - pt - pb);
  const line = prof.map((p, i) => `${i ? 'L' : 'M'}${X(p.d).toFixed(1)},${Y(p.z).toFixed(1)}`).join('');
  const area = `${line}L${X(d1).toFixed(1)},${H - pb}L${X(d0).toFixed(1)},${H - pb}Z`;
  const ticksZ = [0, 0.5, 1].map(t => z0 + pad + t * (z1 - z0 - 2 * pad));
  const ticksD = [d0, (d0 + d1) / 2, d1];
  return `<div class="profile"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Perfil longitudinal">
    ${ticksZ.map(z => `<line x1="${pl}" x2="${W - pr}" y1="${Y(z).toFixed(1)}" y2="${Y(z).toFixed(1)}" class="pg"/><text x="${pl - 4}" y="${(Y(z) + 4).toFixed(1)}" text-anchor="end" class="pt">${Math.round(z)}</text>`).join('')}
    <path d="${area}" class="pa"/><path d="${line}" class="pl"/>
    ${ticksD.map((d, i) => `<text x="${X(d).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}" class="pt">${fmtPK(d)}</text>`).join('')}
    <circle cx="${X(d0).toFixed(1)}" cy="${Y(prof[0].z).toFixed(1)}" r="3.5" class="pe"/><circle cx="${X(d1).toFixed(1)}" cy="${Y(prof[prof.length - 1].z).toFixed(1)}" r="3.5" class="pe"/>
  </svg></div>`;
}

/* ---------------- Actuaciones sobre las trazas (caminos) ----------------
   Catálogo por familias: cada tipo indica qué datos se piden (ancho, espesor, altura…) y con ellos se calculan
   las mediciones (longitud, superficie, volumen, peso, unidades). Densidades orientativas para pasar m³ a t. */
const ACT_FIELDS = {
  w: { l: 'Ancho', u: 'm', ph: 'p. ej. 4,0' },
  e: { l: 'Espesor de capa', u: 'cm', ph: 'p. ej. 20' },
  h: { l: 'Altura media', u: 'm', ph: 'p. ej. 2,0' },
  b: { l: 'Anchura media de la sección', u: 'm', ph: 'p. ej. 1,5' },
  S: { l: 'Sobreancho máximo', u: 'm', ph: 'p. ej. 3,0' },
  n: { l: 'Unidades', u: 'ud', ph: 'p. ej. 1' },
  dia: { l: 'Diámetro', u: 'mm', ph: 'p. ej. 600' },
  lt: { l: 'Longitud de cada tubo', u: 'm', ph: 'p. ej. 6' },
  dot: { l: 'Dotación', u: 'kg/m²', ph: 'p. ej. 1,2' },
  pct: { l: 'Dotación de conglomerante', u: '%', ph: 'p. ej. 3' },
  area: { l: 'Superficie', u: 'm²', ph: 'medida a mano' },
  vol: { l: 'Volumen', u: 'm³', ph: 'medido a mano' },
};
// Valores admitidos (para avisar de errores de tecleo: «-3», «99999999»…)
const ACT_RANGE = { w: [0.1, 60], e: [0.5, 150], h: [0.1, 40], b: [0.05, 40], S: [0.1, 60], n: [1, 100000], dia: [50, 5000], lt: [0.5, 200], dot: [0.05, 20], pct: [0.5, 30], area: [0.1, 1e6], vol: [0.01, 1e6] };
// [nombre, color, campos, opciones] · opciones: road (el ancho por defecto es el del camino), dens (t/m³), mat (lista de materiales/tipos), hint
const ACT_CATS = [
  { id: 'veg', name: 'Desbroce y limpieza', items: [
    ['Desbroce de márgenes', '#7cb342', ['w'], { hint: 'Ancho de la franja desbrozada en cada margen', mat: ['Manual', 'Mecanizado'] }],
    ['Desbroce de la traza', '#9ccc65', ['w'], { road: true, mat: ['Manual', 'Mecanizado'] }],
    ['Tala y poda de arbolado', '#558b2f', ['n'], { hint: 'Número de árboles' }],
    ['Limpieza de cunetas', '#8bc34a', [], { hint: 'Se mide en metros de cuneta. Ambos márgenes cuenta doble.' }],
    ['Limpieza de obra de drenaje', '#43a047', ['n'], {}],
  ] },
  { id: 'dem', name: 'Demoliciones y firme existente', items: [
    ['Demolición de firme existente', '#6d4c41', ['w', 'e'], { road: true, mat: ['Hormigón', 'Aglomerado asfáltico', 'Tratamiento superficial', 'Zahorra'] }],
    ['Fresado de firme asfáltico', '#5d4037', ['w', 'e'], { road: true }],
    ['Machacado y escarificado de firme', '#8d6e63', ['w', 'e'], { road: true, hint: 'Escarificado y machacado del firme existente para reutilizarlo' }],
    ['Demolición de obra de fábrica', '#4e342e', ['n', 'vol'], { mat: ['Caño / tubo', 'Muro', 'Badén', 'Cuneta', 'Arqueta', 'Otra'] }],
  ] },
  { id: 'exp', name: 'Explanada y subbase', items: [
    ['Refino y planeo sin aporte', '#a1887f', ['w'], { road: true, hint: 'Perfilado, refino y compactación de la explanada sin aportar material' }],
    ['Escarificado y compactación', '#bcaaa4', ['w'], { road: true }],
    ['Excavación / desmonte', '#795548', ['w', 'h'], { mat: ['Terreno compacto', 'Tránsito', 'Roca'] }],
    ['Terraplén / relleno', '#a67c52', ['w', 'h'], { mat: ['Material de la excavación', 'Material de préstamo'] }],
    ['Estabilización de suelos', '#c0a16b', ['w', 'e', 'pct'], { road: true, mat: ['Con cal', 'Con cemento', 'Mecánica'] }],
    ['Subbase de zahorra natural', '#d4b483', ['w', 'e'], { road: true, dens: 2.1 }],
    ['Otra actuación en la explanada', '#9e9d24', ['w'], { road: true }],
  ] },
  { id: 'firme', name: 'Firmes y pavimentos', items: [
    ['Zahorra artificial', '#b08d3c', ['w', 'e'], { road: true, dens: 2.25, mat: ['ZA 0/32', 'ZA 0/20', 'Otra'] }],
    ['Pavimento de hormigón', '#90a4ae', ['w', 'e'], { road: true, dens: 2.4, mat: ['HM-20', 'HM-25', 'HF (con fibras)', 'HA con mallazo'] }],
    ['Aglomerado asfáltico en caliente', '#263238', ['w', 'e'], { road: true, dens: 2.4, mat: ['AC16 surf', 'AC22 bin', 'AC16 surf D/S', 'Otra mezcla'] }],
    ['Aglomerado asfáltico en frío', '#455a64', ['w', 'e'], { road: true, dens: 2.3 }],
    ['Tratamiento superficial', '#546e7a', ['w', 'dot'], { road: true, mat: ['Monocapa', 'Bicapa', 'Tricapa', 'Lechada bituminosa'], hint: 'Dotación de ligante (emulsión)' }],
    ['Riego de imprimación / adherencia', '#78909c', ['w', 'dot'], { road: true, mat: ['Imprimación', 'Adherencia', 'Curado'] }],
    ['Bacheo', '#37474f', ['area', 'e'], { mat: ['Con aglomerado', 'Con hormigón', 'Con zahorra'] }],
  ] },
  { id: 'dren', name: 'Drenaje', items: [
    ['Cuneta en tierra', '#a1887f', [], { mat: ['Triangular', 'Trapecial'] }],
    ['Cuneta revestida', '#1e88e5', ['b', 'e'], { dens: 2.4, mat: ['Hormigón triangular', 'Hormigón trapecial', 'Prefabricada'], hint: 'Anchura desarrollada y espesor del revestimiento' }],
    ['Badén', '#00acc1', ['w', 'e'], { road: true, dens: 2.4, mat: ['Hormigón', 'Hormigón con escollera', 'Prefabricado'] }],
    ['Caño / obra de drenaje', '#3949ab', ['n', 'dia', 'lt'], { mat: ['Tubo de hormigón', 'Tubo de PEAD / PVC', 'Marco', 'Bóveda'] }],
    ['Paso salvacunetas', '#00897b', ['n', 'dia', 'lt'], {}],
    ['Arqueta / pozo', '#8e24aa', ['n'], { mat: ['Arqueta de entrada', 'Arqueta de salida', 'Pozo'] }],
    ['Boquilla / aletas', '#5e35b1', ['n'], {}],
  ] },
  { id: 'cont', name: 'Muros, escolleras y contención', items: [
    ['Escollera', '#8d6e63', ['h', 'b'], { hint: 'Altura y anchura media: volumen = altura × anchura × longitud', mat: ['Piedra 300–500 kg', 'Piedra 500–1000 kg', 'Hormigonada'] }],
    ['Muro', '#757575', ['h', 'b'], { mat: ['Hormigón armado', 'Mampostería', 'Gaviones', 'Bloque'] }],
    ['Gaviones', '#9e9e9e', ['h', 'b'], {}],
    ['Barrera / bionda', '#e53935', [], { mat: ['Bionda metálica', 'Barrera mixta madera-metal', 'Pretil'] }],
  ] },
  { id: 'punt', name: 'Sobreanchos y puntuales', items: [
    ['Sobreancho / abanico', '#f9a825', ['S', 'e'], { forma: true, hint: 'Longitud = tramo de PK. Superficie según la forma: triangular ½·L·S, trapecial ¾·L·S, rectangular L·S' }],
    ['Apartadero / zona de cruce', '#fbc02d', ['S', 'e'], { hint: 'Superficie = longitud × sobreancho' }],
    ['Entronque / intersección', '#ff8f00', ['n', 'area'], {}],
    ['Acceso a finca', '#ffb300', ['n'], {}],
  ] },
  { id: 'otros', name: 'Señalización y otros', items: [
    ['Señalización vertical', '#d81b60', ['n'], { mat: ['Señal de peligro', 'Señal de prescripción', 'Cartel de obra', 'Hito'] }],
    ['Otro', '#f4511e', ['w', 'e', 'n'], {}],
  ] },
];
const ACT_FORMS = { tri: ['Triangular', 0.5], trap: ['Trapecial', 0.75], rect: ['Rectangular', 1] };
const ACT_PRIO = { alta: ['Alta', '#e03131'], media: ['Media', '#f08c00'], baja: ['Baja', '#2f9e44'] };
const ACT_ITEMS = ACT_CATS.flatMap(c => c.items.map(([name, color, fields, o]) => ({ name, color, fields, ...o, cat: c.id, catName: c.name })));
const ACT_LEGACY = { 'Firme / pavimento': '#455a64', 'Reperfilado / desbroce': '#7cb342' };  // tipos de versiones anteriores
const ACT_TYPES = ACT_ITEMS.map(i => [i.name, i.color]).concat(Object.entries(ACT_LEGACY)); // (lo usan la exportación KMZ y otros módulos)
const actItem = t => ACT_ITEMS.find(i => i.name === t) || { name: t, color: ACT_LEGACY[t] || '#f4511e', fields: [], cat: 'otros', catName: 'Señalización y otros', legacy: true };
const SIDES = { izq: 'Margen izquierdo', der: 'Margen derecho', ambos: 'Ambos márgenes', eje: 'Eje / calzada' };
const SIDE_ABBR = { izq: 'MI', der: 'MD', ambos: 'AM', eje: 'Eje' };
const acts = new Map();
const actColor = t => actItem(t).color;
const actTitle = a => `${a.type} ${SIDE_ABBR[a.side] || ''} · PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? '–' + fmtPK(a.d1) : ''}`;
const actsSorted = () => [...acts.values()].sort((a, b) => (a.traceName || '').localeCompare(b.traceName || '') || a.d0 - b.d0);
const MEAS_DEC = { L: 1, area: 1, vol: 2, t: 1 }; // mismos decimales en pantalla, CSV, KMZ e informes
const nf = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('es-ES', { maximumFractionDigits: d });
// Mediciones de una actuación a partir de su tramo y sus datos
function actMeasure(a) {
  const it = actItem(a.type), p = a.params || {}, L = Math.max(0, a.d1 - a.d0), sidesK = a.side === 'ambos' ? 2 : 1;
  const v = k => (isFinite(p[k]) && p[k] > 0 ? +p[k] : null);
  const m = { L, sides: sidesK };
  if (it.fields.includes('S') && v('S')) m.area = L * v('S') * (it.forma ? (ACT_FORMS[p.forma || 'tri'] || ACT_FORMS.tri)[1] : 1) * sidesK; // un sobreancho en cada margen
  else if (v('area')) m.area = v('area');
  else if (it.fields.includes('w') && !it.fields.includes('h') && v('w')) m.area = L * v('w') * (it.road ? 1 : sidesK);
  else if (it.fields.includes('b') && it.fields.includes('e') && v('b')) m.area = L * v('b') * sidesK;
  if (v('vol')) m.vol = v('vol');
  else if (it.fields.includes('h') && it.fields.includes('b') && v('h') && v('b')) m.vol = L * v('h') * v('b') * sidesK;
  else if (it.fields.includes('h') && v('w') && v('h')) m.vol = L * v('w') * v('h');
  else if (m.area && v('e')) m.vol = m.area * v('e') / 100;
  if (m.vol && it.dens) m.t = m.vol * it.dens;
  if (m.area && v('dot')) m.kg = m.area * v('dot');
  if (v('n')) m.n = v('n'); else if (ACT_POINT.has(a.type) && (it.fields.includes('n') || !it.fields.some(k => ['area', 'vol'].includes(k)))) m.n = 1; // el bacheo (por superficie) no cuenta unidades // badén, entronque…: cada uno cuenta como 1 ud (pantalla, CSV, informe y BC3)
  if (v('n') && v('lt')) m.tubo = v('n') * v('lt');
  if (!it.fields.length || ['Limpieza de cunetas', 'Cuneta en tierra', 'Barrera / bionda'].includes(a.type)) m.Lm = L * sidesK;
  return m;
}
function actFieldError(k, raw) {
  if (raw === undefined || String(raw).trim() === '') return '';
  const v = parseNum(raw), f = ACT_FIELDS[k], r = ACT_RANGE[k];
  if (!isFinite(v)) return `${f.l}: «${raw}» no es un número.`;
  if (r && (v < r[0] || v > r[1])) return `${f.l}: ${String(v).replace('.', ',')} ${f.u} no parece correcto (entre ${String(r[0]).replace('.', ',')} y ${r[1].toLocaleString('es-ES')} ${f.u}).`;
  return '';
}
function actMeasRows(a) {
  const m = actMeasure(a), r = [];
  if (m.L > 0) r.push(['Longitud', fmtLen(m.L) + (m.Lm && m.sides > 1 ? ` (×2 márgenes = ${fmtLen(m.Lm)})` : '')]);
  if (m.area) r.push(['Superficie', nf(m.area, MEAS_DEC.area) + ' m²']);
  if (m.vol) r.push(['Volumen', nf(m.vol, MEAS_DEC.vol) + ' m³']);
  if (m.t) r.push(['Peso estimado', nf(m.t, MEAS_DEC.t) + ` t (densidad ${nf(actItem(a.type).dens, 2)} t/m³)`]);
  if (m.kg) r.push(['Ligante', nf(m.kg, 0) + ' kg']);
  if (m.n) r.push(['Unidades', nf(m.n, 0) + ' ud']);
  if (m.tubo) r.push(['Tubo', nf(m.tubo, 1) + ' m' + (a.params && a.params.dia ? ` Ø ${a.params.dia} mm` : '')]);
  return r;
}
function actParamRows(a) {
  const it = actItem(a.type), p = a.params || {}, r = [];
  if (p.mat) r.push([it.name.includes('Demolición de obra') ? 'Elemento' : 'Tipo / material', p.mat]);
  if (it.forma && ACT_FORMS[p.forma]) r.push(['Forma', ACT_FORMS[p.forma][0]]);
  it.fields.forEach(k => { if (isFinite(p[k]) && p[k] > 0) r.push([ACT_FIELDS[k].l, nf(p[k], 2) + ' ' + ACT_FIELDS[k].u]); });
  if (a.prio) r.push(['Prioridad', (ACT_PRIO[a.prio] || [a.prio])[0]]);
  return r;
}
function featOf(a) { const e = layers.get(a.layerId); return e && e.feats ? { rec: e.rec, f: e.feats[a.featIdx] } : null; }
// Ancho medio del camino en un tramo (o en un punto) según los anchos tomados
function roadWidthAt(rec, fi, d0, d1) {
  const data = rec && rec.widths && rec.widths[fi]; if (!data) return null;
  const e = layers.get(rec.id), f = e && e.feats[fi]; if (!f) return null;
  const segs = widthSegments(data, f); if (!segs.length) return null;
  if (d1 > d0 + 0.5) { const st = widthStats(segs, d0, d1); return st ? st.mean : null; }
  return widthAt(segs, d0);
}
function segmentCoords(f, d0, d1) {
  const a = pointAtPK(f, d0); if (d1 <= d0) return [[a.lat, a.lng]];
  const b = pointAtPK(f, d1);
  return [[a.lat, a.lng], ...vertexTable(f).filter(p => p.d > d0 && p.d < d1).map(p => [p.lat, p.lng]), [b.lat, b.lng]];
}
function nearestTrace(ll) {
  let best = null;
  for (const e of layers.values()) {
    if (typeOf(e.rec) !== 'kml' || !e.rec.visible) continue;
    e.feats.forEach((f, i) => { if (f.type !== 'ln' || isFeatHidden(e.rec, i)) return; const r = pkAt(f, ll); if (!best || r.off < best.off) best = { rec: e.rec, f, d: r.d, off: r.off }; });
  }
  return best;
}
// Desplaza una polilínea unos píxeles a la izquierda (+) o derecha (−) del sentido del PK
function offsetLatLngs(coords, px) {
  if (!px || coords.length < 2) return coords.map(c => L.latLng(c));
  const pts = coords.map(c => map.latLngToLayerPoint(c));
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    return map.layerPointToLatLng([p.x + dy * px, p.y - dx * px]);
  });
}
const actsLayer = L.layerGroup().addTo(map);
function actClick(a) {
  return e => { L.DomEvent.stop(e); if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng); if (measure) return addMeasurePt(e.latlng); viewAct(a.id, e && e.latlng); };
}
function drawActs() {
  setTimeout(() => { try { updateSeguir(); } catch (e) { /* nada */ } }, 0);
  actsLayer.clearLayers();
  if (settings.actsVisible === false) return;
  const z = map.getZoom(), off = z >= 15 ? 9 : 0, bounds = map.getBounds().pad(0.3), hiddenCats = new Set(settings.actHideCats || []);
  const placed = []; // etiquetas ya puestas (en píxeles): las que se montarían encima se omiten hasta acercar más
  for (const a of acts.values()) {
    if (!a.coords || !a.coords.length || !bounds.intersects(L.latLngBounds(a.coords))) continue;
    if (hiddenCats.has(actItem(a.type).cat)) continue;
    const col = actColor(a.type), sides = a.side === 'ambos' ? [off, -off] : a.side === 'izq' ? [off] : a.side === 'der' ? [-off] : [0];
    sides.forEach(px => {
      let lyr;
      if (a.coords.length > 1 && a.d1 > a.d0) {
        const ll = offsetLatLngs(a.coords, px);
        L.polyline(ll, { color: '#102018', weight: 9, opacity: 0.45, interactive: false }).addTo(actsLayer);
        lyr = L.polyline(ll, { color: col, weight: 6, opacity: 0.95, lineCap: 'butt' });
      } else {
        const ctx = featOf(a), c = ctx && ctx.f ? segmentCoords(ctx.f, Math.max(0, a.d0 - 5), a.d0 + 5) : a.coords;
        const ll = offsetLatLngs(c.length > 1 ? c : a.coords, px);
        lyr = L.circleMarker(ll[Math.floor(ll.length / 2)] || L.latLng(a.coords[0]), { radius: 7, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1 });
      }
      lyr.on('click', actClick(a));
      lyr.addTo(actsLayer);
    });
    if (z >= 16) { // etiqueta: también se puede tocar para abrir la actuación
      const mid = a.coords[Math.floor(a.coords.length / 2)];
      const lab = offsetLatLngs(a.coords.length > 1 ? a.coords : [mid, mid], (sides[0] || 0) + (sides[0] < 0 ? -22 : 22));
      const at = lab[Math.floor(lab.length / 2)], pt = map.latLngToLayerPoint(at), wpx = Math.min(220, 7 * (a.type.length + 4));
      if (placed.some(q => Math.abs(q.x - pt.x) < (q.w + wpx) / 2 && Math.abs(q.y - pt.y) < 22)) continue;
      placed.push({ x: pt.x, y: pt.y, w: wpx });
      const mk = L.marker(at, { keyboard: false, zIndexOffset: -500, riseOnHover: true,
        icon: L.divIcon({ className: 'act-label clk', html: `<span style="border-color:${col}">${esc(a.type)} ${SIDE_ABBR[a.side] || ''}${a.prio === 'alta' ? ' ⚠' : ''}</span>`, iconSize: [0, 0] }) });
      mk.on('click', actClick(a)); mk.addTo(actsLayer);
    }
  }
}

let actDraft = null;
// margen más probable según el tipo: firmes y badenes ocupan la calzada; limpiezas de cunetas, los dos márgenes
const defaultSideFor = (t, cur) => { const it = actItem(t); return it.road || ['Bacheo', 'Badén'].includes(t) ? 'eje' : ['Limpieza de cunetas', 'Desbroce de márgenes'].includes(t) ? 'ambos' : cur; };
function openActEditor(o) {
  if (o.act) actDraft = { ...o.act, params: { ...(o.act.params || {}) }, media: [...(o.act.media || [])] };
  else actDraft = { id: uid(), obraId: settings.activeObra, layerId: o.rec.id, featIdx: layers.get(o.rec.id).feats.indexOf(o.f), traceName: o.f.name, layerName: o.rec.name,
    d0: o.d0, d1: o.d1, type: o.type || '', side: o.type ? defaultSideFor(o.type, 'izq') : 'izq', text: '', media: [], created: Date.now(), coords: [], params: {}, prio: '' };
  renderActEditor();
}
function syncAct() {
  if (!actDraft) return;
  const g = id => $('#' + id);
  if (g('aText')) actDraft.text = g('aText').value;
  if (g('aOther') && actDraft.type === 'Otro') actDraft.custom = g('aOther').value;
  // los PK solo se releen si se han cambiado a mano (así no se pierden los decimales del GPS)
  // (se compara con el PK actual del borrador, no con el valor con que se abrió: volver a escribir el original también cuenta)
  if (g('aPk0') && g('aPk0').value.trim() !== fmtPK(actDraft.d0)) { const v = parsePK(g('aPk0').value); if (isFinite(v)) actDraft.d0 = v; }
  if (g('aPk1') && g('aPk1').value.trim() !== fmtPK(actDraft.d1)) { const v = parsePK(g('aPk1').value); if (isFinite(v)) actDraft.d1 = v; }
  actDraft.params = actDraft.params || {};
  document.querySelectorAll('[data-pf]').forEach(inp => { const v = parseNum(inp.value); actDraft.params[inp.dataset.pf] = isFinite(v) ? v : null; });
  const mt = g('aMat'); if (mt) actDraft.params.mat = mt.value;
}
function actTypeSelect(cur, onlyLinear) {
  const okT = t => ACT_ITEMS.some(i => i.name === t) && !(onlyLinear && (ACT_POINT.has(t) || t === 'Otro'));
  const fav = (settings.actFav || []).filter(okT), rec = (settings.actRecent || []).filter(t => !fav.includes(t) && okT(t)).slice(0, 5);
  const opt = t => `<option value="${esc(t)}" ${t === cur ? 'selected' : ''}>${esc(t)}</option>`;
  return `<select id="aType"><option value="" ${cur ? '' : 'selected'}>— Elige el tipo de actuación —</option>
    ${cur && !ACT_ITEMS.some(i => i.name === cur) && cur !== 'Otro' ? `<optgroup label="Actual">${opt(cur)}</optgroup>` : ''}
    ${fav.length ? `<optgroup label="★ Favoritas">${fav.map(opt).join('')}</optgroup>` : ''}
    ${rec.length ? `<optgroup label="Recientes">${rec.map(opt).join('')}</optgroup>` : ''}
    ${ACT_CATS.map(c => { const its = c.items.map(([t]) => t).filter(t => !onlyLinear || okT(t)); return its.length ? `<optgroup label="${esc(c.name)}">${its.map(opt).join('')}</optgroup>` : ''; }).join('')}</select>`;
}
function renderActEditor() {
  const a = actDraft; if (!a) return;
  const ctx = featOf(a); const f = ctx && ctx.f;
  const isNew = !acts.has(a.id), keep = actDraft;
  const len = Math.max(0, Math.min(a.d1, f ? f.length : a.d1) - a.d0), it = a.type ? actItem(a.type) : null, p = a.params || (a.params = {}); // longitud recortada al final de la traza
  // ancho del camino por defecto (de los anchos tomados en la traza)
  const rw = ctx ? roadWidthAt(ctx.rec, a.featIdx, Math.min(a.d0, a.d1), Math.max(a.d0, a.d1)) : null;
  if (it && it.road && it.fields.includes('w') && !(p.w > 0) && rw) { p.w = Math.round(rw * 100) / 100; p._wAuto = true; }
  const isFav = it && (settings.actFav || []).includes(it.name);
  const fieldHtml = it ? it.fields.map(k => { const fd = ACT_FIELDS[k];
    return `<div class="field"><label for="pf_${k}">${fd.l} (${fd.u})${k === 'w' && it.road && rw ? ` <button type="button" class="linkb" data-a="wroad">usar ancho del camino: ${nf(rw, 2)} m</button>` : ''}</label>
      <input type="text" id="pf_${k}" data-pf="${k}" inputmode="decimal" placeholder="${fd.ph}" value="${isFinite(p[k]) && p[k] !== null ? String(p[k]).replace('.', ',') : ''}"></div>`; }).join('') : '';
  editorRerender = true;
  const b = openSheet(`<h2>${isNew ? 'Nueva actuación' : 'Editar actuación'}</h2>
    <p class="sub">${esc(a.traceName)} · ${esc(a.layerName || '')}${f ? ' · longitud ' + fmtLen(f.length) : ''}</p>
    <h3 class="sh">1 · Qué</h3>
    <div class="field"><label for="aType">Tipo de actuación</label><div class="row">${actTypeSelect(a.type)}${it && !it.legacy ? `<button type="button" class="mini ic fav ${isFav ? 'on' : ''}" data-a="fav" title="Favorita" aria-label="Marcar como favorita">${isFav ? '★' : '☆'}</button>` : ''}</div>
      ${it ? `<p class="hint"><span class="dot" style="background:${it.color}"></span>${esc(it.catName)}${it.hint ? ' · ' + esc(it.hint) : ''}</p>` : ''}</div>
    ${a.type === 'Otro' ? `<div class="field"><input type="text" id="aOther" placeholder="¿Qué actuación es?" value="${esc(a.custom || '')}"></div>` : ''}
    ${it && it.mat ? `<div class="field"><label for="aMat">Tipo / material</label><select id="aMat"><option value="">—</option>${it.mat.map(m => `<option ${p.mat === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></div>` : ''}
    ${it && it.forma ? `<div class="field"><label>Forma del sobreancho</label><div class="seg three">${Object.entries(ACT_FORMS).map(([k, [t]]) => `<button type="button" class="${(p.forma || 'tri') === k ? 'on' : ''}" data-forma="${k}">${t}</button>`).join('')}</div></div>` : ''}
    <h3 class="sh">2 · Dónde</h3>
    <div class="field"><label>Margen<span class="tech"> (según el sentido del PK)</span></label><div class="seg">${Object.entries(SIDES).map(([k, v]) => `<button type="button" class="${a.side === k ? 'on' : ''}" data-side="${k}">${esc(v.replace('Margen ', '').replace(' / calzada', ''))}</button>`).join('')}</div></div>
    <div class="pkrow">
      <div class="field"><label for="aPk0">Desde PK</label><input type="text" id="aPk0" inputmode="decimal" value="${fmtPK(a.d0)}" data-v="${fmtPK(a.d0)}"><small class="rb" id="aPk0rb"></small>
        <div class="pkbtns"><button class="mini" data-a="gps0" aria-label="Inicio en mi posición">${ICON.locate}Aquí</button><button class="mini" data-a="map0" aria-label="Inicio tocando el mapa">${ICON.pin}Mapa</button></div></div>
      <div class="field"><label for="aPk1">Hasta PK</label><input type="text" id="aPk1" inputmode="decimal" value="${fmtPK(a.d1)}" data-v="${fmtPK(a.d1)}"><small class="rb" id="aPk1rb"></small>
        <div class="pkbtns"><button class="mini" data-a="gps1" aria-label="Fin en mi posición">${ICON.locate}Aquí</button><button class="mini" data-a="map1" aria-label="Fin tocando el mapa">${ICON.pin}Mapa</button></div></div>
    </div>
    <p class="hint">${len > 0 ? `Tramo de ${fmtLen(len)}.` : 'Ahora es una actuación puntual. Para un tramo, camina hasta el final y pulsa «Aquí» junto a «Hasta PK», o escribe el PK final.'}</p>
    ${fieldHtml ? `<h3 class="sh">3 · Medidas</h3><div class="pgrid">${fieldHtml}</div>` : ''}
    ${it ? '<div class="meas" id="aMeas"></div>' : ''}
    <h3 class="sh">${fieldHtml ? 4 : 3} · Observaciones y fotos</h3>
    <div class="field"><label for="aText">Observaciones</label><textarea id="aText" rows="2" placeholder="p. ej. estado actual, causa, solución propuesta">${esc(a.text)}</textarea></div>
    <div class="media">${mediaHtml(a.media, true)}</div>
    <div class="acts">
      <button class="btn" data-a="photo">${ICON.photo}Foto</button>
      <button class="btn" data-a="video">${ICON.video}Vídeo</button>
    </div>
    <details class="more" id="aMore" ${a._moreOpen || a.prio ? 'open' : ''}><summary>Más opciones${a.prio ? ` · prioridad ${esc((ACT_PRIO[a.prio] || [a.prio])[0]).toLowerCase()}` : ''}</summary>
      <div class="field"><span class="flabel">Prioridad</span><div class="seg">${[['', 'Sin indicar'], ...Object.entries(ACT_PRIO).map(([k, [t]]) => [k, t])].map(([k, t]) => `<button type="button" class="${(a.prio || '') === k ? 'on' : ''}" data-prio="${k}">${t}</button>`).join('')}</div></div>
      <div class="field row"><label for="aLen" class="grow">Longitud desde el inicio (m)</label><input type="text" id="aLen" inputmode="decimal" placeholder="m" value="${len ? Math.round(len) : ''}"><button class="mini" data-a="len">Aplicar</button></div>
      ${isNew ? '' : '<div class="acts"><button class="btn" data-a="dup">Duplicar en otro tramo</button><button class="btn del" data-a="delete">Eliminar actuación</button></div>'}
    </details>
    <div class="savebar">${a._walk && isNew ? '<div class="row2"><button class="btn pri" data-a="save">Guardar</button><button class="btn go" data-a="savecont">Guardar y seguir andando</button></div>' : '<button class="btn pri full" data-a="save">Guardar actuación</button>'}</div>`);
  { const sc = $('#sheetBody [data-a=savecont]'); if (sc) sc.onclick = () => { if (!actDraft) return; actDraft._cont = actDraft._dir || 1; saveAct().then(ok => { if (!ok && actDraft && !$('#measWarn') && !$('#zeroWarn')) delete actDraft._cont; }); }; } // con un aviso pendiente se recuerda que hay que seguir
  { const mo = $('#aMore'); if (mo) mo.ontoggle = () => { if (actDraft) actDraft._moreOpen = mo.open; }; }
  editorRerender = false;
  actDraft = keep;
  const snapOf = actKey, actSnap = acts.has(a.id) ? actKey(acts.get(a.id)) : null;
  if (actSnap === null && !actDraft._init) actDraft._init = snapOf(actDraft); // cómo se abrió: si se cierra sin cambiar nada no es un borrador (salvo un tramo andando)
  const actChanged = d => actSnap === null ? !!(d._walk || snapOf(d) !== d._init)
    : actSnap !== actKey(d);
  onSheetClose(() => { if (editorRerender || actPick || !actDraft) return; syncAct(); if (actChanged(actDraft)) storeDraft('act', { ...actDraft, params: { ...actDraft.params } }); else clearDraft(actDraft.id); });
  storeDraft('act', { ...actDraft, params: { ...actDraft.params } }, true); // copia de trabajo por si la app se cierra de golpe
  { let liveT; const live = () => { clearTimeout(liveT); liveT = setTimeout(() => { if (!actDraft || !$('#aText')) return; syncAct(); storeDraft('act', { ...actDraft, params: { ...actDraft.params } }, true); }, 250); }; b.addEventListener('input', live); b.addEventListener('change', live); }
  const meas = () => { const box = $('#aMeas'); if (!box) return; syncAct(); const r = actMeasRows(actDraft);
    box.innerHTML = (r.length ? `<table class="attrs">${r.map(([k, v]) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join('')}</table>` : '')
      + (actDraft.d1 <= actDraft.d0 && actItem(actDraft.type).fields.some(k => ['w', 'b', 'S', 'h'].includes(k)) ? '<p class="hint">Actuación puntual: indica el PK final o la longitud para calcular superficie y volumen.</p>' : r.length ? '' : '<p class="hint">Rellena los datos para ver las mediciones.</p>'); };
  meas();
  addDictation($('#aText'));
  b.querySelectorAll('[data-pf]').forEach(inp => inp.oninput = () => { if (inp.dataset.pf === 'w') delete actDraft.params._wAuto; inp.classList.toggle('bad', !!actFieldError(inp.dataset.pf, inp.value)); meas(); });
  if (f) showSlopeSegment(f, Math.min(a.d0, a.d1), Math.max(a.d0, a.d1));
  onSheetClose(() => setTimeout(() => { if (!actPick && ($('#sheet').hidden || !$('#aText'))) { slopeHL.clearLayers(); if (!$('#aText')) actDraft = actPick ? actDraft : null; } }, 0));
  const setPK = (which, d) => { syncAct(); d = Math.max(0, Math.min(f ? f.length : d, d));
    if (which === 'd1' && d < actDraft.d0 && actDraft.d1 > actDraft.d0) which = 'd0'; // «Hasta» por debajo de «Desde» en un tramo: se alarga por ese lado
    else if (which === 'd0' && d > actDraft.d1 && actDraft.d1 > actDraft.d0) which = 'd1';
    actDraft[which] = d; if (which === 'd0' && actDraft.d1 < actDraft.d0) actDraft.d1 = actDraft.d0; if (actDraft.params._wAuto) delete actDraft.params.w; renderActEditor(); };
  $('#aType').onchange = () => { syncAct(); const nt = $('#aType').value, old = actItem(actDraft.type); actDraft.type = nt;
    if (!actDraft._sideSet && !acts.has(actDraft.id)) actDraft.side = defaultSideFor(nt, actDraft.side);
    const ni = actItem(nt); if (old && old.mat && !(ni.mat || []).includes(actDraft.params.mat)) delete actDraft.params.mat; if (actDraft.params._wAuto) delete actDraft.params.w; renderActEditor(); };
  const fv = b.querySelector('[data-a=fav]');
  if (fv) fv.onclick = () => { syncAct(); const l = settings.actFav || []; settings.actFav = l.includes(actDraft.type) ? l.filter(x => x !== actDraft.type) : [...l, actDraft.type]; saveSettings(); renderActEditor(); };
  const wr = b.querySelector('[data-a=wroad]'); if (wr) wr.onclick = () => { $('#pf_w').value = String(Math.round(rw * 100) / 100).replace('.', ','); meas(); };
  b.querySelectorAll('[data-forma]').forEach(bt => bt.onclick = () => { syncAct(); actDraft.params.forma = bt.dataset.forma; renderActEditor(); });
  b.querySelectorAll('[data-prio]').forEach(bt => bt.onclick = () => { syncAct(); actDraft.prio = bt.dataset.prio; renderActEditor(); });
  b.querySelectorAll('[data-side]').forEach(bt => bt.onclick = () => { syncAct(); actDraft.side = bt.dataset.side; actDraft._sideSet = true; renderActEditor(); });
  ['aPk0', 'aPk1'].forEach(id => { const el = $('#' + id);
    el.oninput = () => { const v = parsePK(el.value); let t = el.value !== el.dataset.v ? pkReadBack(el.value) : '';
      if (f && isFinite(v) && v > f.length + 0.5) t = `⚠ Pasa del final de la traza (${fmtPK(f.length)})`; // aviso al escribir, no solo al guardar
      $('#' + id + 'rb').textContent = t; el.classList.toggle('bad', t.startsWith('⚠')); };
    // sin volver a dibujar la ficha: así no se pierde el toque en «Guardar» justo después de escribir el PK
    el.onchange = () => { if (!isFinite(parsePK(el.value))) { $('#' + id + 'rb').textContent = pkReadBack(el.value); return; } syncAct(); refreshActInline(); }; });
  const refreshActInline = () => {
    const d = actDraft; if (!d) return;
    const lo = Math.min(d.d0, d.d1), hi = Math.max(d.d0, d.d1), ln = Math.max(0, Math.min(hi, f ? f.length : hi) - lo);
    if (f) showSlopeSegment(f, lo, Math.min(hi, f.length));
    const al = $('#aLen'); if (al) al.value = ln ? Math.round(ln) : '';
    if (d.params._wAuto && ctx) { const nw = roadWidthAt(ctx.rec, d.featIdx, lo, hi); if (nw) { d.params.w = Math.round(nw * 100) / 100; const wi = $('#pf_w'); if (wi) wi.value = String(d.params.w).replace('.', ','); } }
    meas();
  };
  const gps = which => async () => {
    if (!f) { toast('La traza de esta actuación ya no está cargada.'); return; }
    toast('Obteniendo posición GPS…', 2000);
    try { const p2 = await getPos(); const r = pkAt(f, L.latLng(p2.lat, p2.lng)); if (r.off > 40) toast(`Estás a ${Math.round(r.off)} m de la traza: se usa el punto más cercano.`, 5000); setPK(which, r.d); }
    catch (e) { toast(geoErr(e), 6000); }
  };
  b.querySelector('[data-a=gps0]').onclick = gps('d0');
  b.querySelector('[data-a=gps1]').onclick = gps('d1');
  const pick = which => () => {
    if (!f) { toast('La traza de esta actuación ya no está cargada.'); return; }
    syncAct(); actPick = which; closeSheet();
    $('#pickText').textContent = which === 'd0' ? 'Toca en el mapa el inicio de la actuación' : 'Toca en el mapa el final de la actuación';
    $('#pickBar').hidden = false;
  };
  b.querySelector('[data-a=map0]').onclick = pick('d0');
  b.querySelector('[data-a=map1]').onclick = pick('d1');
  b.querySelector('[data-a=len]').onclick = () => { syncAct(); const v = parseFloat(($('#aLen').value || '').replace(',', '.')); if (!(v >= 0)) { toast('Escribe la longitud en metros.'); return; } setPK('d1', actDraft.d0 + v); };
  const stampAt = () => { const pp = f ? pointAtPK(f, actDraft.d0) : { lat: actDraft.coords[0][0], lng: actDraft.coords[0][1] };
    const base = lastPos && Date.now() - lastPos.t < 60000 ? { lat: lastPos.lat, lng: lastPos.lng, acc: lastPos.acc } : { lat: pp.lat, lng: pp.lng };
    return { ...base, label: `${actDraft.type || 'Actuación'} ${SIDE_ABBR[actDraft.side] || ''} · PK ${fmtPK(actDraft.d0)}${actDraft.d1 > actDraft.d0 ? '–' + fmtPK(actDraft.d1) : ''} · ${actDraft.traceName}` }; };
  const addMediaAct = async files => {
    syncAct();
    for (const fl of files) {
      const kind = fl.type.startsWith('image/') ? 'photo' : fl.type.startsWith('video/') ? 'video' : null; if (!kind) continue;
      const sa = stampAt(); let blob = kind === 'photo' ? await processImage(fl, sa) : fl;
      if (kind === 'photo') blob = await writeExif(blob, { lat: sa.lat, lng: sa.lng, date: Date.now(), desc: sa.label });
      actDraft.media.push({ id: uid(), kind, blob, mime: blob.type || fl.type, t: Date.now() });
    }
    renderActEditor();
  };
  b.querySelector('[data-a=photo]').onclick = () => { syncAct(); capture('inPhoto', addMediaAct); };
  b.querySelector('[data-a=video]').onclick = () => { syncAct(); capture('inVideo', addMediaAct); };
  b.querySelectorAll('[data-rm]').forEach(el => el.onclick = () => { syncAct(); actDraft.media.splice(+el.dataset.rm, 1); renderActEditor(); });
  b.querySelector('[data-a=save]').onclick = () => { if (actDraft) delete actDraft._cont; saveAct(); };
  const dup = b.querySelector('[data-a=dup]');
  if (dup) dup.onclick = () => { syncAct(); const src = actDraft; actDraft = { ...src, id: uid(), media: [], created: Date.now(), updated: undefined, params: { ...src.params } }; toast('Copia lista: cambia los PK y guarda.', 4000); renderActEditor(); };
  const del = b.querySelector('[data-a=delete]'); if (del) del.onclick = () => deleteAct(a.id);
}
let actPick = null;
const _slopePickPoint = slopePickPoint;
slopePickPoint = function (ll) { // también atiende la selección de inicio/fin de actuaciones
  if (!actPick) return _slopePickPoint(ll);
  const ctx = featOf(actDraft); const r = pkAt(ctx.f, L.latLng(ll));
  const which = actPick; actPick = null; $('#pickBar').hidden = true;
  actDraft[which] = r.d; if (actDraft.d1 < actDraft.d0) [actDraft.d0, actDraft.d1] = [actDraft.d1, actDraft.d0];
  if (actDraft.params && actDraft.params._wAuto) delete actDraft.params.w;
  renderActEditor();
};
async function saveAct() {
  syncAct();
  const a = actDraft; if (!a) return false;
  if (a.type === 'Otro') a.type = (a.custom || '').trim() || 'Otro';
  if (!a.type) { toast('Elige el tipo de actuación.'); return; }
  for (const inp of document.querySelectorAll('[data-pf]')) { const er = actFieldError(inp.dataset.pf, inp.value); if (er) { inp.classList.add('bad'); inp.focus(); toast(er, 6000); return; } }
  if (!isFinite(a.d0) || !isFinite(a.d1)) { toast('Revisa los PK: escribe por ejemplo 1+250.'); return; }
  if (a.d1 < a.d0) [a.d0, a.d1] = [a.d1, a.d0];
  const ctx = featOf(a);
  if (ctx && ctx.f) {
    const Lf = ctx.f.length;
    if (a.d0 > Lf + 0.5) { toast(`El PK inicial ${fmtPK(a.d0)} está fuera de la traza, que acaba en ${fmtPK(Lf)}.`, 6000); return; }
    if (a.d1 > Lf + 0.5 && !confirm(`El PK final ${fmtPK(a.d1)} pasa del final de la traza (${fmtPK(Lf)}). ¿Guardar la actuación hasta el final de la traza?`)) return;
    a.d0 = Math.max(0, Math.min(Lf, a.d0)); a.d1 = Math.max(a.d0, Math.min(Lf, a.d1)); a.coords = segmentCoords(ctx.f, a.d0, a.d1);
  }
  { const pp = a.params || {}, puntual = ACT_POINT.has(a.type) || pp.area > 0 || pp.vol > 0 || pp.n > 0; // un tramo de milímetros no cuenta como puntual
    if (a.d1 - a.d0 < 0.5 && !puntual && a._zeroOk !== a.d0 + '|' + a.d1) { // aviso dentro de la ficha, con su propio botón (no se guarda con toques repetidos en «Guardar»)
      const f1 = $('#aPk1'); if (f1) { f1.classList.add('bad'); setTimeout(() => f1.scrollIntoView({ block: 'start' }), 50); }
      let w = $('#zeroWarn'); if (!w) { const sb = $('#sheetBody .savebar'); sb.insertAdjacentHTML('afterbegin', '<div class="fwarn" id="zeroWarn" role="alert"></div>'); w = $('#zeroWarn'); } // dentro de la barra fija: siempre a la vista
      w.innerHTML = `<b>«${esc(a.type)}» tiene 0 m</b>: el PK final es igual al inicial (${fmtPK(a.d0)}). Escribe el PK final arriba o, si de verdad es puntual:<div class="row"><button type="button" class="mini" data-a="save0">Guardar con 0 m</button></div>`;
      const t0 = Date.now(); w.querySelector('[data-a=save0]').onclick = () => { if (Date.now() - t0 < 600 || !actDraft) return; actDraft._zeroOk = actDraft.d0 + '|' + actDraft.d1; saveAct(); };
      w.scrollIntoView({ block: 'nearest' }); return; } }
  { const it = actItem(a.type), mf = it.fields.filter(k => ['w', 'e', 'h', 'b', 'S', 'n'].includes(k));
    if (mf.length && !mf.some(k => a.params && a.params[k] > 0) && !ACT_POINT.has(a.type) && a._noMeasOk !== true && !a._noMeasChain && $('#aText')) {
      const f0 = $('#pf_' + mf[0]); if (f0) { f0.classList.add('bad'); f0.scrollIntoView({ block: 'center' }); }
      let w = $('#measWarn'); if (!w) { $('#sheetBody .savebar').insertAdjacentHTML('afterbegin', '<div class="fwarn" id="measWarn" role="alert"></div>'); w = $('#measWarn'); }
      w.innerHTML = `<b>Sin medidas</b>: no saldrá superficie ni volumen. Escribe ${mf.map(k => ACT_FIELDS[k].l.toLowerCase()).join(' / ')} o:<div class="row"><button type="button" class="mini" data-a="savenm">Guardar sin medidas</button></div>`;
      const t0 = Date.now(); w.querySelector('[data-a=savenm]').onclick = () => { if (Date.now() - t0 < 600 || !actDraft) return; actDraft._noMeasOk = true; saveAct(); };
      return; } }
  const cont = a._cont, fromSplit = a._split, noMeasUsed = a._noMeasOk === true || !!a._noMeasChain; delete a._cont; delete a._split; delete a._noMeasChain; delete a._dir; delete a._noMeasOk; delete a._zeroWarn; delete a._zeroOk; delete a._moreOpen; delete a._init; delete a._walk; if (a.params) { delete a.params._wAuto; Object.keys(a.params).forEach(k => { if (a.params[k] === null || a.params[k] === '') delete a.params[k]; }); }
  a.updated = Date.now();
  hideUndo(); // solo cuando de verdad se guarda (un toque fallido no borra el «Deshacer»)
  try { await DB.put('acts', a); } catch (e) { toast('No se pudo guardar: ' + (e.message || 'almacenamiento lleno'), 7000); return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (ACT_ITEMS.some(i => i.name === a.type)) { settings.actRecent = [a.type, ...(settings.actRecent || []).filter(t => t !== a.type)].slice(0, 8); saveSettings(); }
  acts.set(a.id, a); actDraft = null; slopeHL.clearLayers(); clearDraft(a.id);
  closeSheet(); drawActs(); toast(`Guardada: ${actTitle(a)}`);
  if (!$('#drawer').hidden) renderDrawer();
  if (cont) { // «Guardar y seguir andando»: el siguiente tramo empieza en el PK guardado (corregido o no)
    buzz(40); const go = await continueWalk(a, cont === -1 ? a.d0 : a.d1, { noMeas: noMeasUsed });
    if (!fromSplit) showUndo(`Guardado: ${a.type} ${fmtPK(a.d0)}–${fmtPK(a.d1)}${go ? '. Sigue el siguiente tramo.' : ''}`, async () => { // mismo «Deshacer» que desde la barra
      if (a.obraId !== settings.activeObra) { toast('Ese tramo es de otra obra.'); return; }
      await DB.del('acts', a.id); acts.delete(a.id); drawActs(); const st = cont === -1 ? a.d1 : a.d0;
      walkAct = { draft: { ...a, id: uid(), d0: st, d1: st, media: [], text: '', created: Date.now(), coords: [], params: { ...(a.params || {}) } }, t: Date.now(), shown: Date.now() };
      await DB.put('kv', walkAct, 'walk').catch(() => {}); showWalkBar(); keepAwake(true); }); }
  return true;
}
async function deleteAct(id) { // sin pregunta: se puede deshacer unos segundos
  const old = acts.get(id); if (!old) return;
  await DB.del('acts', id); acts.delete(id); actDraft = null; slopeHL.clearLayers(); clearDraft(id);
  closeSheet(); drawActs(); showUndo(`Actuación eliminada: ${old.type}`, async () => { if (old.obraId !== settings.activeObra) { toast('Esa actuación es de otra obra.'); return; } await DB.put('acts', old); acts.set(old.id, old); drawActs(); if (!$('#drawer').hidden) renderDrawer(); toast('Actuación recuperada'); });
  if (!$('#drawer').hidden) renderDrawer();
}
function viewAct(id, at) {
  const a = acts.get(id); if (!a) return;
  const ctx0 = featOf(a), dHere = ctx0 && ctx0.f && at ? Math.max(0, Math.min(ctx0.f.length, pkAt(ctx0.f, L.latLng(at)).d)) : a.d0; // PK del punto tocado
  const p0 = a.coords[0], p1 = a.coords[a.coords.length - 1], col = actColor(a.type), it = actItem(a.type);
  const mr = actMeasRows(a), pr = actParamRows(a);
  const b = openSheet(`<h2><span class="dot" style="background:${col}"></span>${esc(a.type)}</h2>
    <p class="sub">${esc(it.catName)} · ${esc(SIDES[a.side] || '')} · ${esc(a.traceName)} · ${fmtDate(a.created)}</p>
    <div class="slope-main"><span style="color:${col}">PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? ' – ' + fmtPK(a.d1) : ''}</span><small>${a.d1 > a.d0 ? 'longitud ' + fmtLen(a.d1 - a.d0) : 'actuación puntual'}${a.prio ? ` · prioridad <b style="color:${(ACT_PRIO[a.prio] || ['', '#888'])[1]}">${(ACT_PRIO[a.prio] || [a.prio])[0].toLowerCase()}</b>` : ''}</small></div>
    ${mr.length ? `<h3 class="sh">Mediciones</h3><table class="attrs meas">${mr.map(([k, v]) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join('')}</table>` : ''}
    ${pr.length ? `<h3 class="sh">Datos</h3><table class="attrs">${pr.map(([k, v]) => `<tr><td>${k}</td><td>${esc(String(v))}</td></tr>`).join('')}</table>` : ''}
    ${it.fields.length && !actMeasRows(a).some(([k]) => k !== 'Longitud') ? `<p class="hint">${a.d1 <= a.d0 && Object.keys(a.params || {}).length ? 'Es una actuación puntual: para calcular superficie o volumen indica su longitud (PK final).' : 'Sin datos para calcular mediciones. Pulsa «Editar» y rellena ancho, espesor…'}</p>` : ''}
    ${a.text ? `<div class="desc">${esc(a.text)}</div>` : ''}
    <div class="media">${mediaHtml(a.media || [], false)}</div>
    <div class="acts">
      ${goBtn(p0[0], p0[1], 'Ir al inicio', a.d1 > a.d0 ? '' : 'full')}${a.d1 > a.d0 ? goBtn(p1[0], p1[1], 'Ir al final') : ''}
      <button class="btn pri" data-a="edit">Editar / añadir fotos</button>
      <button class="btn" data-a="copy">${ICON.copy}Copiar</button>
      ${featOf(a) && featOf(a).f ? `<button class="btn go full" data-a="newhere">${ICON.road}Otra actuación en el PK ${fmtPK(dHere)}</button><button class="btn" data-a="trace">Ficha de la traza (anchos, pendiente…)</button>` : '<p class="hint">La traza de esta actuación no está cargada. Al volver a cargar su KML se enlaza sola.</p>'}
    </div>`, 'view');
  const ctx = featOf(a); if (ctx && ctx.f) showSlopeSegment(ctx.f, a.d0, Math.max(a.d1, a.d0 + 0.1));
  onSheetClose(() => setTimeout(() => { if (!$('#aText')) slopeHL.clearLayers(); }, 0));
  b.querySelectorAll('img[data-full]').forEach(img => img.onclick = () => showPhoto(img.src));
  b.querySelector('[data-a=edit]').onclick = () => openActEditor({ act: a });
  const nh = b.querySelector('[data-a=newhere]'); if (nh) nh.onclick = () => { const c = featOf(a); openActEditor({ rec: c.rec, f: c.f, d0: dHere, d1: dHere }); };
  const tr = b.querySelector('[data-a=trace]'); if (tr) tr.onclick = () => { const c = featOf(a), q = pointAtPK(c.f, dHere); featureSheet(c.f, L.latLng(q.lat, q.lng), c.rec); };
  b.querySelector('[data-a=copy]').onclick = () => copyText(`${a.type} (${SIDES[a.side]}) · ${a.traceName} · PK ${fmtPK(a.d0)} a ${fmtPK(a.d1)} · ${fmtLen(a.d1 - a.d0)}${pr.length ? ' · ' + pr.map(([k, v]) => `${k}: ${v}`).join(', ') : ''}${mr.length ? ' · ' + mr.map(([k, v]) => `${k}: ${v}`).join(', ') : ''}${a.text ? ' · ' + a.text : ''}`);
}
// Resumen de mediciones por tipo de actuación
function actsSummary(list) {
  const m = new Map();
  list.forEach(a => { const k = a.type, r = m.get(k) || { type: k, n: 0, L: 0, area: 0, vol: 0, t: 0, kg: 0, ud: 0, tubo: 0 }, x = actMeasure(a);
    r.n++; r.L += x.Lm || x.L; r.area += x.area || 0; r.vol += x.vol || 0; r.t += x.t || 0; r.kg += x.kg || 0; r.ud += x.n || 0; r.tubo += x.tubo || 0; m.set(k, r); });
  return [...m.values()].sort((a, b) => ACT_ITEMS.findIndex(i => i.name === a.type) - ACT_ITEMS.findIndex(i => i.name === b.type));
}
function summaryTableHtml(sum, escf = esc) {
  const c = (v, d) => (v ? nf(v, d) : '');
  return `<table class="attrs sumt"><tr><th>Actuación</th><th>Nº</th><th>m</th><th>m²</th><th>m³</th><th>t</th><th>ud</th></tr>${sum.map(r => `<tr><td><span class="dot" style="background:${actColor(r.type)}"></span>${escf(r.type)}</td><td>${r.n}</td><td>${c(r.L, MEAS_DEC.L)}</td><td>${c(r.area, MEAS_DEC.area)}</td><td>${c(r.vol, MEAS_DEC.vol)}</td><td>${c(r.t, MEAS_DEC.t)}</td><td>${c(r.ud, 0)}</td></tr>`).join('')}</table>`;
}
function actList() {
  const list = actsSorted();
  const byTrace = new Map(); list.forEach(a => { const k = a.traceName || 'Traza'; byTrace.set(k, [...(byTrace.get(k) || []), a]); });
  const hid = new Set(settings.actHideCats || []);
  const cats = ACT_CATS.map(c => ({ ...c, n: list.filter(a => actItem(a.type).cat === c.id).length })).filter(c => c.n);
  const b = openSheet(`<h2>Actuaciones</h2><p class="sub">${plural(list.length, 'actuación', 'actuaciones')} en ${plural(byTrace.size, 'traza', 'trazas')}</p>
    ${list.length ? `<h3 class="sh">Resumen de mediciones</h3>${summaryTableHtml(actsSummary(list))}
      <h3 class="sh">Ver en el mapa</h3><div class="chips">${cats.map(c => `<button type="button" class="chip ${hid.has(c.id) ? '' : 'on'}" data-hc="${c.id}" style="--c:${c.items[0][1]}">${esc(c.name)} (${c.n})</button>`).join('')}</div>`
      : '<p class="empty">Todavía no hay actuaciones. Toca una traza y pulsa «Nueva actuación en esta traza».</p>'}
    ${[...byTrace].map(([t, arr]) => `<details class="tgroup" open><summary>${esc(t)} <small>${arr.length}</small></summary>${ACT_CATS.map(c => { const xs = arr.filter(a => actItem(a.type).cat === c.id); return xs.length ? `<div class="cgroup"><div class="cname">${esc(c.name)}</div>${xs.map(a => { const mr = actMeasRows(a).filter(([k]) => k !== 'Longitud').map(([, v]) => v.split(' (')[0]).slice(0, 2).join(' · ');
      return `<div class="nrow" data-act="${a.id}"><span class="dot" style="background:${actColor(a.type)}"></span>
      <span class="t"><b>${esc(a.type)} · ${SIDE_ABBR[a.side] || ''}${a.prio === 'alta' ? ' <span class="prio">alta</span>' : ''}</b><small>PK ${fmtPK(a.d0)}${a.d1 > a.d0 ? '–' + fmtPK(a.d1) + ' · ' + fmtLen(a.d1 - a.d0) : ' · puntual'}${mr ? ' · ' + mr : ''} · ${(a.media || []).length} fotos</small></span></div>`; }).join('')}</div>` : ''; }).join('')}</details>`).join('')}
    ${list.length ? `<div class="acts"><button class="btn pri full" data-a="rep">${ICON.note}Informe de la visita</button><button class="btn" data-a="csv">Exportar a Excel (CSV)</button><button class="btn" data-a="bc3">Exportar a BC3</button></div>` : ''}`);
  b.querySelectorAll('[data-act]').forEach(r => r.onclick = () => { const a = acts.get(r.dataset.act); map.fitBounds(L.latLngBounds(a.coords).pad(0.4), { maxZoom: 18 }); viewAct(a.id); });
  b.querySelectorAll('[data-hc]').forEach(c => c.onclick = () => { const s = new Set(settings.actHideCats || []); s.has(c.dataset.hc) ? s.delete(c.dataset.hc) : s.add(c.dataset.hc); settings.actHideCats = [...s]; saveSettings(); drawActs(); actList(); });
  const c = b.querySelector('[data-a=csv]'); if (c) c.onclick = exportActsCSV;
  const rp = b.querySelector('[data-a=rep]'); if (rp) rp.onclick = () => visitReportSheet();
  const bb = b.querySelector('[data-a=bc3]'); if (bb) bb.onclick = () => bc3Sheet();
}
async function exportActsCSV() {
  const list = actsSorted();
  if (!list.length) { toast('Todavía no hay actuaciones que exportar.'); return; }
  const csv = actsCSV(list);
  const name = `actuaciones_${new Date().toISOString().slice(0, 10)}.csv`;
  try { await saveBlob(new Blob([csv], { type: 'text/csv' }), name); toast(`Exportadas ${list.length} actuaciones en ${name}`); }
  catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 6000); }
}
function actsCSV(list) {
  const n = (v, d = 2) => (v === null || v === undefined || v === '' ? '' : String(Math.round(v * 10 ** d) / 10 ** d).replace('.', ','));
  const c6 = v => v.toFixed(6).replace('.', ',');
  const q = csvQ;
  const rows = [['Traza', 'Capa', 'Familia', 'Tipo', 'Material / tipo', 'Margen', 'PK inicio', 'PK fin', 'Longitud (m)', 'Ancho (m)', 'Espesor (cm)', 'Altura (m)', 'Anchura sección (m)', 'Sobreancho (m)', 'Unidades', 'Diámetro (mm)',
    'Superficie (m²)', 'Volumen (m³)', 'Peso (t)', 'Ligante (kg)', 'Prioridad', 'Descripción', 'Fotos', 'Fecha', 'Lat inicio', 'Lon inicio', 'Lat fin', 'Lon fin']];
  list.forEach(a => { const p0 = a.coords[0], p1 = a.coords[a.coords.length - 1], p = a.params || {}, m = actMeasure(a);
    rows.push([a.traceName, a.layerName, actItem(a.type).catName, a.type, p.mat || '', SIDES[a.side], fmtPK(a.d0), fmtPK(a.d1), n(m.Lm || m.L, MEAS_DEC.L), n(p.w), n(p.e), n(p.h), n(p.b), n(p.S), n(m.n, 0), n(p.dia),
      n(m.area, MEAS_DEC.area), n(m.vol, MEAS_DEC.vol), n(m.t, MEAS_DEC.t), n(m.kg, 0), a.prio ? (ACT_PRIO[a.prio] || [a.prio])[0] : '', a.text, (a.media || []).length, fmtDate(a.created), c6(p0[0]), c6(p0[1]), c6(p1[0]), c6(p1[1])]); });
  return '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n');
}

/* ---------------- Obras: cada obra agrupa sus capas, anotaciones, fotos y actuaciones ---------------- */
const obras = new Map();
const safeName = s => String(s || 'obra').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'obra';
function updateObraLabel() { const o = obras.get(settings.activeObra); $('#obraName').textContent = o ? o.name : ''; }
async function clearMapData() {
  for (const e of layers.values()) { try { map.removeLayer(mapLayerOf(e)); } catch (_) {} }
  pointGroups.forEach(g => map.removeLayer(g));
  layers.clear(); pointGroups.clear(); notes.clear(); noteMarkers.clear(); acts.clear();
  highlight.clearLayers(); slopeHL.clearLayers(); actsLayer.clearLayers(); pkLayer.clearLayers(); widthLayer.clearLayers();
}
async function loadObra(id, fit) {
  closeSheet(); await clearMapData();
  settings.activeObra = id; saveSettings(); updateObraLabel(); loadAfecLast(); showWalkBar(); if (refreshPending()) showDraftBar(); else { const db = $('#draftBar'); if (db) db.hidden = true; }
  const recs = (await DB.all('layers')).filter(r => r.obraId === id).sort((a, b) => a.created - b.created);
  recs.forEach((r, i) => { if (r.order == null) r.order = i + 1; if (!r.type) r.type = 'kml'; });
  for (const rec of recs) { try { registerLayer(rec); } catch (e) { console.error(e); } }
  for (const r of recs) { // completa datos de capas añadidas con versiones anteriores
    const c = r.type === 'wms' && !r.info && CATALOG.find(x => x.url === r.url && x.layers === r.layers);
    if (c) { r.info = c.info || ''; r.cover = c.cover || ''; DB.put('layers', r); }
  }
  if (settings.notesVisible !== false) pointGroup('notes').addTo(map);
  for (const n of (await DB.all('notes')).filter(n => n.obraId === id)) { notes.set(n.id, n); drawNote(n); }
  for (const a of (await DB.all('acts')).filter(a => a.obraId === id)) acts.set(a.id, a);
  drawActs(); drawPK(); drawWidths();
  if (fit) {
    const pts = [];
    layers.forEach(e => { if (e.group) { const b = e.group.getBounds(); if (b.isValid()) pts.push(b.getSouthWest(), b.getNorthEast()); } });
    notes.forEach(n => pts.push(L.latLng(n.lat, n.lng)));
    acts.forEach(a => a.coords.forEach(c => pts.push(L.latLng(c))));
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.1), { maxZoom: 17 });
  }
  if (!$('#drawer').hidden) renderDrawer();
}
async function createObra(name, desc = '') {
  const o = { id: uid(), name: name.trim() || 'Obra nueva', desc, created: Date.now() };
  await DB.put('obras', o); obras.set(o.id, o); return o;
}
async function obraCounts(id) {
  const [l, n, a] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
  return { layers: l.filter(x => x.obraId === id).length, notes: n.filter(x => x.obraId === id).length, acts: a.filter(x => x.obraId === id).length };
}
async function deleteObraData(id) {
  const [l, n, a] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
  for (const x of l.filter(x => x.obraId === id)) await DB.del('layers', x.id);
  for (const x of n.filter(x => x.obraId === id)) await DB.del('notes', x.id);
  for (const x of a.filter(x => x.obraId === id)) await DB.del('acts', x.id);
  await DB.del('kv', 'ficha:' + id).catch(() => {}); delete fichaCache[id];
  for (const [k, d] of Object.entries(drafts)) if (d.data && d.data.obraId === id) delete drafts[k]; await DB.put('kv', drafts, 'drafts').catch(() => {}); refreshPending();
}
async function obrasSheet() {
  const list = [...obras.values()].sort((a, b) => a.name.localeCompare(b.name));
  const counts = await Promise.all(list.map(o => obraCounts(o.id)));
  const b = openSheet(`<h2>Obras</h2><p class="sub">Cada obra guarda sus propias capas, anotaciones, fotos y actuaciones</p>
    <div class="obras">${list.map((o, i) => { const c = counts[i], act = o.id === settings.activeObra;
      return `<div class="obra ${act ? 'on' : ''}">
        <button class="otitle" data-open="${o.id}" type="button"><b>${esc(o.name)}</b><small>${plural(c.layers, 'capa', 'capas')} · ${plural(c.notes, 'anotación', 'anotaciones')} · ${c.acts} actuaciones${act ? ' · <em>activa</em>' : ''}</small></button>
        <div class="row"><button class="mini" data-share="${o.id}">Exportar / compartir</button><button class="mini" data-ren="${o.id}">Renombrar</button>${list.length > 1 ? `<button class="mini del" data-delo="${o.id}">Eliminar</button>` : ''}</div>
      </div>`; }).join('')}</div>
    <h3 class="sh">Nueva obra</h3>
    <div class="field row"><input type="text" id="newObra" placeholder="Nombre (p. ej. Modernización regadío Cuevas del Campo)"><button class="mini" data-a="create">Crear</button></div>
    <div class="acts"><button class="btn pri full" data-a="backup">Copia de seguridad de todas las obras</button><button class="btn full" data-a="import">${ICON.folder}Importar obra (paquete .zip)</button></div>
    <p class="hint">${settings.lastBackup ? `Última copia: ${fmtDate(settings.lastBackup)}.` : '<b>Aún no has hecho ninguna copia de seguridad.</b>'} ${NATIVE ? 'Las copias se guardan en <b>Documentos › OBRA-GIS</b> y no se borran al desinstalar la app.' : 'Las copias se guardan en Descargas.'} Haz una antes de actualizar o desinstalar la app.</p>
    <p class="hint">«Exportar / compartir» crea un .zip con toda la obra: capas, KML originales, anotaciones, actuaciones, fotos, vídeos y notas de voz. Al abrir ese .zip en otro móvil con OBRA-GIS, la obra aparece completa.</p>`);
  b.querySelectorAll('[data-open]').forEach(bt => bt.onclick = () => loadObra(bt.dataset.open, true).then(() => toast(`Obra activa: ${obras.get(bt.dataset.open).name}`)));
  b.querySelectorAll('[data-share]').forEach(bt => bt.onclick = () => exportObraPackage(bt.dataset.share));
  b.querySelectorAll('[data-ren]').forEach(bt => bt.onclick = () => {
    const o = obras.get(bt.dataset.ren);
    const s2 = openSheet(`<h2>Renombrar obra</h2><div class="field"><input type="text" id="renObra" value="${esc(o.name)}"></div><div class="acts"><button class="btn pri full" data-a="ok">Guardar</button></div>`);
    s2.querySelector('[data-a=ok]').onclick = async () => { o.name = $('#renObra').value.trim() || o.name; await DB.put('obras', o); updateObraLabel(); obrasSheet(); };
  });
  b.querySelectorAll('[data-delo]').forEach(bt => bt.onclick = async () => {
    const o = obras.get(bt.dataset.delo);
    if (!confirm(`¿Eliminar la obra «${o.name}» con todas sus capas, anotaciones, fotos y actuaciones? No se puede deshacer. Si quieres conservarla, expórtala antes.`)) return;
    await deleteObraData(o.id); await DB.del('obras', o.id); obras.delete(o.id);
    if (settings.activeObra === o.id) await loadObra([...obras.keys()][0], true);
    obrasSheet(); toast('Obra eliminada');
  });
  b.querySelector('[data-a=create]').onclick = async () => {
    const name = $('#newObra').value.trim(); if (!name) { toast('Escribe el nombre de la obra.'); return; }
    const o = await createObra(name); await loadObra(o.id); toast(`Obra «${o.name}» creada. Ya puedes importar sus KML y capas.`, 5000);
  };
  b.querySelector('[data-a=import]').onclick = () => $('#inObra').click();
  b.querySelector('[data-a=backup]').onclick = async () => { await backupAllObras(); obrasSheet(); };
}

// Paquete de obra (.zip): estructura de carpetas legible desde QGIS, Excel o Google Earth
const MIME_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', webm: 'video/webm', m4a: 'audio/mp4', ogg: 'audio/ogg' };
async function exportObraPackage(id, opts = {}) {
  try { return await buildObraPackage(id, opts); }
  catch (e) { console.error(e); toast('No se pudo exportar la obra: ' + (e.message || e), 8000); return null; }
}
async function buildObraPackage(id, opts = {}) {
  const o = obras.get(id); if (!o) return;
  toast('Preparando el paquete de la obra…', 15000);
  const [L0, N0, A0] = await Promise.all([DB.all('layers'), DB.all('notes'), DB.all('acts')]);
  const lays = L0.filter(x => x.obraId === id), nts = N0.filter(x => x.obraId === id), ats = A0.filter(x => x.obraId === id);
  const zip = new JSZip(), root = `OBRA-GIS_${safeName(o.name)}`, Z = zip.folder(root);
  const layerName = lid => { const l = lays.find(x => x.id === lid); return l ? l.name : 'Mis anotaciones'; };
  const usedPaths = new Set();
  const media = (owner, list, dir) => (list || []).map((m, i) => {
    if (!m || !(m.blob instanceof Blob)) return null;
    // nombre único: el texto se acorta, pero se añade un contador si ya existe (antes se pisaban fotos de nombres largos)
    const base = `multimedia/${dir}/${safeName(owner).slice(0, 48)}`; let path, k = 0;
    do { path = `${base}${k ? '_' + k : ''}_${i + 1}.${extFor(m)}`; k++; } while (usedPaths.has(path));
    usedPaths.add(path); Z.file(path, m.blob, { compression: 'STORE' }); // las fotos ya van comprimidas
    return { archivo: path, tipo: { photo: 'foto', video: 'video', audio: 'audio' }[m.kind], mime: m.mime, fecha: m.t ? new Date(m.t).toISOString() : undefined };
  }).filter(Boolean);
  const capas = lays.map(r => {
    const c = { id: r.id, tipo: r.type || 'kml', nombre: r.name, carpeta: folderOf(r), orden: r.order || 0, visible: !!r.visible, opacidad: r.opacity ?? 1, creada: new Date(r.created || Date.now()).toISOString() };
    if (r.drawn) c.dibujada = true;
    if (c.tipo === 'kml') { c.archivo = `capas/kml/${safeName(r.name)}_${r.id}.kml`; c.color = r.color; Z.file(c.archivo, r.text); if (r.widths && Object.keys(r.widths).length) c.anchos = r.widths; if (r.pkStep) c.pk_cada_m = r.pkStep; if (r.hiddenFeats && r.hiddenFeats.length) c.elementos_ocultos = r.hiddenFeats; }
    if (c.tipo === 'wms') Object.assign(c, { servicio: r.kind, url: r.url, capas_wms: r.layers, consulta: r.info || '', cobertura: r.cover || '', atribucion: r.attribution || '', zoom_max_nativo: r.maxNative || null });
    return c;
  });
  const notePts = nts.map(n => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [n.lng, n.lat] },
    properties: { id: n.id, titulo: n.title, texto: n.text || '', fecha: new Date(n.created).toISOString(), origen_posicion: n.src || '', precision_m: n.acc ?? null,
      altitud_m: n.alt ?? null, orientacion_grados: n.dir ?? null, capa: layerName(n.layerId), capa_id: n.layerId || null, ficha: n.ficha || undefined, multimedia: media(n.title + '_' + n.id.slice(-4), n.media, n.layerId ? 'fotos_importadas' : 'anotaciones') } }));
  const actFeats = ats.filter(a => a.coords && a.coords.length).map(a => ({ type: 'Feature',
    geometry: a.coords.length > 1 && a.d1 > a.d0 ? { type: 'LineString', coordinates: a.coords.map(c => [c[1], c[0]]) } : { type: 'Point', coordinates: [a.coords[0][1], a.coords[0][0]] },
    properties: { id: a.id, tipo: a.type, margen: SIDES[a.side] || '', margen_cod: a.side, pk_inicio: fmtPK(a.d0), pk_fin: fmtPK(a.d1), pk_inicio_m: +a.d0.toFixed(2), pk_fin_m: +a.d1.toFixed(2),
      longitud_m: +(a.d1 - a.d0).toFixed(2), traza: a.traceName, capa: a.layerName, capa_id: a.layerId, elemento: a.featIdx, descripcion: a.text || '', fecha: new Date(a.created).toISOString(),
      familia: actItem(a.type).catName, parametros: a.params || {}, prioridad: a.prio ? (ACT_PRIO[a.prio] || [a.prio])[0] : '', prioridad_cod: a.prio || '', actualizada: a.updated ? new Date(a.updated).toISOString() : null,
      mediciones: Object.fromEntries(Object.entries(actMeasure(a)).filter(([k, v]) => k !== 'sides' && v).map(([k, v]) => [{ L: 'longitud_m', Lm: 'longitud_total_m', area: 'superficie_m2', vol: 'volumen_m3', t: 'peso_t', kg: 'ligante_kg', n: 'unidades', tubo: 'tubo_m' }[k] || k, +v.toFixed(2)])),
      multimedia: media(`${a.type}_PK${fmtPK(a.d0)}_${a.id.slice(-4)}`, a.media, 'actuaciones') } }));
  const fc = features => JSON.stringify({ type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }, features }, null, 1);
  Z.file('datos/anotaciones.geojson', fc(notePts.filter(f => !f.properties.capa_id)));
  Z.file('datos/fotos_importadas.geojson', fc(notePts.filter(f => f.properties.capa_id)));
  Z.file('datos/actuaciones.geojson', fc(actFeats));
  const wx = widthsExport(lays.filter(r => (r.type || 'kml') === 'kml' && r.widths));
  if (wx.rows > 1) { Z.file('datos/anchos.csv', wx.csv); Z.file('datos/anchos_superficie.geojson', fc(wx.polys)); }
  const resFC = [...resources.values()].map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.lng, r.lat] }, properties: { id: r.id, tipo: r.type, nombre: r.name, empresa: r.company, telefono: r.phone, direccion: r.address, materiales: r.materials, notas: r.notes } }));
  if (resFC.length) Z.file('datos/recursos.geojson', fc(resFC));
  const afr = id === settings.activeObra ? afecLast() : await DB.get('kv', 'afec:' + id).catch(() => null);
  if (afr) { Z.file('informes/afecciones.html', afecHtml(afr)); Z.file('informes/afecciones.csv', '\ufeff' + afecCsv(afr)); Z.file('informes/afecciones.json', JSON.stringify(afr)); }
  const nFichas = await fichaPackExport(Z, id);
  Z.file('datos/actuaciones.csv', actsCSV(ats.sort((a, b) => (a.traceName || '').localeCompare(b.traceName || '') || a.d0 - b.d0)));
  Z.file('obra.json', JSON.stringify({ formato: 'OBRA-GIS', version: 1, app_version: APP_VERSION, exportado: new Date().toISOString(),
    obra: { id: o.srcId || o.id, nombre: o.name, descripcion: o.desc || '', creada: new Date(o.created).toISOString() },
    sistema_referencia: 'WGS84 / ETRS89 geográficas (EPSG:4326)', capas, bc3: settings.bc3Map || undefined,
    resumen: { capas: capas.length, anotaciones: notePts.length, actuaciones: actFeats.length, fichas_inspeccion: nFichas } }, null, 2));
  Z.file('LEEME.txt', [`OBRA-GIS · ${o.name}`, `Exportado el ${fmtDate(Date.now())}`, '',
    'obra.json                    Datos de la obra y lista de capas (carpeta, orden, estilo, servicios WMS)',
    'capas/kml/                   KML originales de las trazas',
    'datos/anotaciones.geojson    Anotaciones de campo (puntos)',
    'datos/fotos_importadas.geojson  Fotos situadas por sus coordenadas GPS',
    'datos/actuaciones.geojson    Actuaciones sobre las trazas (líneas o puntos) con tipo, margen y PK',
    'datos/actuaciones.csv        Listado de actuaciones para Excel',
    'datos/recursos.geojson       Plantas, canteras y demás recursos (comunes a todas las obras)',
    'informes/afecciones.html     Último informe de afecciones (abrir en el navegador; imprimir a PDF)',
    'datos/anchos.csv             Anchos del camino por tramos (PK, ancho, longitud, superficie)',
    'datos/anchos_superficie.geojson  Plataforma del camino con su ancho (polígonos, con superficie en m²)',
    'datos/fichas_inspeccion.json Fichas de inspección de campo (para cargarlas en otro móvil)',
    'informes/ficha_*.html        Fichas de inspección para imprimir o guardar en PDF (y su .json para la revisión del presupuesto)',
    'presupuesto/                 BC3 del presupuesto usado para la parte de proyecto de las fichas',
    'multimedia/                  Fotos, vídeos y notas de voz, enlazados desde los GeoJSON (campo multimedia)', '',
    'Para cargar la obra completa en otro móvil: abre este .zip con OBRA-GIS (Compartir → OBRA-GIS, o Obras → Importar obra).',
    'Los GeoJSON se abren directamente en QGIS (coordenadas EPSG:4326).'].join('\r\n'));
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE', compressionOptions: { level: 5 } });
  const name = `${root}_${stamp()}_${o.id.replace(/[^a-z0-9]/gi, '').slice(-4)}.zip`; // único aunque dos obras se llamen casi igual
  if (opts.blobOnly) return { blob, name };
  try {
    const r = await saveBlob(blob, name, opts);
    if (!opts.quiet) toast(`Paquete listo: ${name} (${(blob.size / 1048576).toFixed(1).replace('.', ',')} MB)${r && r.where === 'DOCUMENTS' ? ' · en Documentos › OBRA-GIS' : ''}`, 7000);
    return { name, size: blob.size, where: r && r.where };
  } catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 8000); return null; }
}
// Copia de seguridad de todas las obras (un paquete por obra). Imprescindible antes de desinstalar o cambiar de móvil.
async function backupAllObras() {
  const ids = [...obras.keys()]; if (!ids.length) return;
  toast(`Copia de seguridad de ${ids.length} obra${ids.length > 1 ? 's' : ''}…`, 20000);
  let ok = 0, where = '';
  for (const id of ids) { const r = await exportObraPackage(id, { share: false, quiet: true }); if (r) { ok++; where = r.where; } }
  settings.lastBackup = Date.now(); saveSettings();
  toast(ok === ids.length ? `Copia hecha: ${ok} paquete${ok > 1 ? 's' : ''} ${where === 'DOCUMENTS' ? 'en Documentos › OBRA-GIS' : where === 'DOWNLOAD' ? 'en Descargas' : 'guardados'}. Para restaurar: Obras → Importar obra.` : `Solo se copiaron ${ok} de ${ids.length} obras.`, 9000);
}
async function isObraPackage(file) {
  try { const zip = await JSZip.loadAsync(file); return zip.file(/(^|\/)obra\.json$/)[0] ? zip : null; } catch (e) { return null; }
}
// La importación no toca nada de lo que ya hay hasta terminar bien: se lee y valida todo el paquete,
// se escribe como obra nueva y solo al final, si se eligió «Reemplazar», se borra la obra antigua.
async function importObraPackage(file, zipIn) {
  const fname = file && file.name ? `«${file.name}»` : 'El paquete';
  let zip, meta, pre;
  try {
    zip = zipIn || await JSZip.loadAsync(file);
    const entry = zip.file(/(^|\/)obra\.json$/)[0];
    if (!entry) { toast(`${fname} no es un paquete de obra de OBRA-GIS.`, 6000); return; }
    pre = entry.name.replace(/obra\.json$/, '');
    meta = JSON.parse(await entry.async('string'));
    if (meta.formato !== 'OBRA-GIS' || !meta.obra || !meta.obra.id) throw new Error('obra.json no tiene el formato de OBRA-GIS');
    for (const path of ['datos/anotaciones.geojson', 'datos/fotos_importadas.geojson', 'datos/actuaciones.geojson', 'datos/recursos.geojson']) { // comprobar antes de escribir nada
      const f = zip.file(pre + path); if (f) { const j = JSON.parse(await f.async('string')); if (!Array.isArray(j.features)) throw new Error(path + ' no es un GeoJSON válido'); }
    }
  } catch (e) { toast(`${fname} está dañado y no se ha importado (${e.message || e}). No se ha cambiado nada.`, 8000); return; }
  // la obra se reconoce por su identificador original (srcId), aunque ya se haya reemplazado antes
  const exists = obras.get(meta.obra.id) || [...obras.values()].find(x => x.srcId === meta.obra.id);
  const mode = exists ? await askImportMode(exists.name) : 'new';
  if (!mode) return;
  toast('Importando la obra…', 15000);
  const obraId = exists ? uid() : meta.obra.id;
  const o = { id: obraId, name: mode === 'copy' ? meta.obra.nombre + ' (copia)' : meta.obra.nombre, desc: meta.obra.descripcion || '', created: Date.parse(meta.obra.creada) || Date.now() };
  if (exists && mode === 'replace') o.srcId = meta.obra.id;
  if (meta.bc3 && typeof meta.bc3 === 'object') { const m0 = { ...(settings.bc3Map || {}) }; for (const [t, v] of Object.entries(meta.bc3)) if (!m0[t] && v && typeof v === 'object') if (t !== '__proto__' && t.length < 200) m0[t] = { code: typeof v.code === 'string' ? bc3Code(v.code) || undefined : undefined, unit: isUnit(v.unit) ? v.unit : undefined, price: typeof v.price === 'number' && isFinite(v.price) && v.price >= 0 && v.price < 1e9 ? v.price : undefined, summary: typeof v.summary === 'string' ? v.summary.slice(0, 200) : undefined }; settings.bc3Map = m0; saveSettings(); }
  let nN = 0, nA = 0;
  try {
  await DB.put('obras', o); obras.set(o.id, o);
  const idMap = {};
  for (const c of meta.capas || []) {
    const nid = uid(); idMap[c.id] = nid;
    const base = { id: nid, obraId, type: c.tipo, name: c.nombre, folder: c.carpeta, order: c.orden, visible: c.visible, opacity: c.opacidad, created: Date.parse(c.creada) || Date.now() };
    if (c.dibujada) base.drawn = true;
    if (c.tipo === 'kml') { const f = zip.file(pre + c.archivo); if (!f) continue; Object.assign(base, { text: await f.async('string'), color: c.color || PALETTE[0] }); }
    if (c.tipo === 'wms') Object.assign(base, { kind: c.servicio, url: c.url, layers: c.capas_wms, info: c.consulta, cover: c.cobertura, attribution: c.atribucion, maxNative: c.zoom_max_nativo || undefined });
    if (c.tipo === 'photos') base.order = 0;
    if (c.anchos) base.widths = c.anchos;
    if (c.pk_cada_m) base.pkStep = c.pk_cada_m;
    if (c.elementos_ocultos) base.hiddenFeats = c.elementos_ocultos;
    if (DEFAULT_FOLDER[c.tipo] === c.carpeta) delete base.folder;
    await DB.put('layers', base);
  }
  const readMedia = async list => {
    const out = [];
    for (const m of list || []) {
      const f = zip.file(pre + m.archivo); if (!f) continue;
      const ext = m.archivo.split('.').pop().toLowerCase();
      const kind = { foto: 'photo', video: 'video', audio: 'audio' }[m.tipo] || 'photo';
      out.push({ id: uid(), kind, blob: new Blob([await f.async('arraybuffer')], { type: m.mime || MIME_EXT[ext] || '' }), mime: m.mime || MIME_EXT[ext] || '', t: Date.parse(m.fecha) || Date.now() });
    }
    return out;
  };
  const readFC = async path => { const f = zip.file(pre + path); return f ? JSON.parse(await f.async('string')).features || [] : []; };
  for (const ft of [...await readFC('datos/anotaciones.geojson'), ...await readFC('datos/fotos_importadas.geojson')]) {
    const p = ft.properties, [lng, lat] = ft.geometry.coordinates;
    await DB.put('notes', { id: uid(), obraId, layerId: p.capa_id ? idMap[p.capa_id] || null : null, lat, lng, title: p.titulo, text: p.texto, created: Date.parse(p.fecha) || Date.now(),
      src: p.origen_posicion, acc: p.precision_m, alt: p.altitud_m, dir: p.orientacion_grados, ficha: p.ficha || undefined, media: await readMedia(p.multimedia) }); nN++;
  }
  for (const ft of await readFC('datos/actuaciones.geojson')) {
    const p = ft.properties, g = ft.geometry;
    const coords = g.type === 'LineString' ? g.coordinates.map(c => [c[1], c[0]]) : [[g.coordinates[1], g.coordinates[0]]];
    await DB.put('acts', { id: uid(), obraId, layerId: idMap[p.capa_id] || null, featIdx: p.elemento, traceName: p.traza, layerName: p.capa, d0: p.pk_inicio_m, d1: p.pk_fin_m,
      type: p.tipo, side: p.margen_cod || 'izq', text: p.descripcion, created: Date.parse(p.fecha) || Date.now(), updated: Date.parse(p.actualizada) || undefined, params: cleanActParams(p.parametros), prio: ACT_PRIO[p.prioridad_cod] ? p.prioridad_cod : '', coords, media: await readMedia(p.multimedia) }); nA++;
  }
  const afj = zip.file(pre + 'informes/afecciones.json');
  if (afj) { try { const r = JSON.parse(await afj.async('string')); r.rows.forEach(x => { x.layerId = idMap[x.layerId] || x.layerId; }); r.targets.forEach(x => { x.layerId = idMap[x.layerId] || x.layerId; }); await DB.put('kv', r, 'afec:' + obraId); delete afecLastCache[obraId]; } catch (e) { /* informe no válido */ } }
  for (const ft of await readFC('datos/recursos.geojson')) { // recursos comunes: se añaden los que no existan
    const p = ft.properties; if (!p.id || resources.has(p.id)) continue;
    const r = { id: p.id, type: p.tipo, name: p.nombre, company: p.empresa, phone: p.telefono, address: p.direccion, materials: p.materiales, notes: p.notas, lat: ft.geometry.coordinates[1], lng: ft.geometry.coordinates[0], created: Date.now() };
    await DB.put('resources', r); resources.set(r.id, r); drawResource(r);
  }
  await fichaPackImport(zip, pre, obraId, idMap);
  } catch (e) {
    console.error(e);
    try { await deleteObraData(obraId); await DB.del('obras', obraId); } catch (e2) { /* nada */ }
    obras.delete(obraId);
    toast(`No se pudo importar ${fname}: ${e.message || e}. ${exists ? 'La obra que tenías sigue intacta.' : 'No se ha creado ninguna obra.'}`, 9000);
    return;
  }
  if (mode === 'replace' && exists) { // ya está todo dentro: ahora sí se quita la versión antigua
    await deleteObraData(exists.id); await DB.del('obras', exists.id); obras.delete(exists.id);
    try { const afOld = await DB.get('kv', 'afec:' + exists.id); if (afOld && !(await DB.get('kv', 'afec:' + obraId))) await DB.put('kv', afOld, 'afec:' + obraId); } catch (e) { /* nada */ }
  }
  // una obra vacía con el mismo nombre (p. ej. «Mi primera obra» de una instalación nueva) sobra: se quita
  for (const x of [...obras.values()]) {
    if (x.id === obraId || x.name !== o.name) continue;
    const c = await obraCounts(x.id); if (c.layers || c.notes || c.acts) continue;
    await deleteObraData(x.id); await DB.del('obras', x.id); obras.delete(x.id);
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  await loadObra(obraId, true);
  toast(`Obra «${o.name}» importada: ${(meta.capas || []).length} capas, ${nN} anotaciones y ${nA} actuaciones.`, 7000);
}
function cleanActParams(p) {
  const out = {}; if (!p || typeof p !== 'object') return out;
  Object.entries(p).forEach(([k, v]) => { if (ACT_FIELDS[k] && isFinite(v) && v > 0) out[k] = +v; });
  if (typeof p.mat === 'string') out.mat = p.mat.slice(0, 80);
  if (ACT_FORMS[p.forma]) out.forma = p.forma;
  return out;
}
function askImportMode(name) {
  return new Promise(res => {
    const b = openSheet(`<h2>La obra ya existe</h2><p class="sub">Ya tienes «${esc(name)}» en este móvil.</p><div class="acts">
      <button class="btn pri full" data-m="replace">Reemplazarla por la del paquete</button>
      <button class="btn full" data-m="copy">Importarla como copia</button>
      <button class="btn full" data-m="">Cancelar</button></div>
      <p class="hint">Reemplazar borra lo que tienes ahora de esa obra en este móvil y lo sustituye por el contenido del paquete.</p>`);
    let done = false;
    b.querySelectorAll('[data-m]').forEach(bt => bt.onclick = () => { done = true; closeSheet(); res(bt.dataset.m || null); });
    onSheetClose(() => { if (!done) res(null); });
  });
}

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
    : `<div class="wtable">${d.points.map((p, i) => `<div class="wrow"><span>Desde PK ${fmtPK(p.d)}</span><input type="text" inputmode="decimal" data-wi="${i}" value="${isFinite(p.w) ? String(p.w).replace('.', ',') : ''}"><button class="mini ic del" data-wdel="${i}" aria-label="Quitar">${ICON.close}</button></div>`).join('') || '<p class="hint">Añade el primer ancho, normalmente desde el PK 0+000.</p>'}</div>
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
function widthResultsHtml(st, d, f) {
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
        let feats = cache.get(url); if (!feats) { feats = parseInfo(await httpGetText(url), r.info); cache.set(url, feats); }
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
let undoT = null;
function showUndo(msg, fn, ms = 8000) {
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
  if (Date.now() - (walkAct.shown || 0) < 1500) return; // la barra acaba de aparecer bajo el dedo: un toque de más no termina el tramo
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
    if (ok) showUndo(`Guardado: ${d.type} ${fmtPK(d.d0)}–${fmtPK(d.d1)}${walkAct ? '. Sigue el siguiente tramo.' : ''}`, async () => { if (d.obraId !== settings.activeObra) { toast('Ese tramo es de otra obra.'); return; } await DB.del('acts', d.id); acts.delete(d.id); drawActs(); walkAct = { ...prev, shown: Date.now() }; await DB.put('kv', walkAct, 'walk'); showWalkBar(); keepAwake(true); });
    return; }
  d._walk = true; d._dir = endAt < startAt ? -1 : 1; actDraft = d; renderActEditor(); sheetOpenAt = Date.now() + 1150; // 1,5 s sin toques: el dedo que pulsó «Terminar» está sobre «Guardar»
  setTimeout(() => { const it = actItem(d.type), f0 = it.fields.find(k => !(d.params && d.params[k] > 0)), el = f0 && $('#pf_' + f0); if (el && it.fields.some(k => ['w', 'e', 'h', 'b', 'S'].includes(k))) el.scrollIntoView({ block: 'center' }); }, 300); // se lleva a las medidas que faltan: solo falta revisar los datos y guardar
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
const repeatRow = () => { const rl = repeatLabel(); if (!rl) return ''; const la = lastAct();
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
    <label class="opt"><input type="checkbox" id="soSince" ${sent ? 'checked' : ''} ${sent ? '' : 'disabled'}>Informe solo con lo nuevo desde el último envío${sent ? ` (${fmtDate(sent)})` : ''}</label>
    <div class="field"><label for="soWho">Tu nombre (sale en el informe)</label><input type="text" id="soWho" value="${esc(settings.surveyor || '')}"></div>
    <div class="savebar"><button class="btn go full" data-a="go">Preparar y enviar</button></div>`);
  b.querySelectorAll('[data-rv]').forEach(x => x.onclick = () => { const a = acts.get(x.dataset.rv); if (a) { map.fitBounds(L.latLngBounds(a.coords).pad(0.4), { maxZoom: 18 }); viewAct(a.id); } });
  b.querySelector('[data-a=go]').onclick = async () => {
    const bt = b.querySelector('[data-a=go]'); bt.disabled = true; bt.textContent = 'Preparando…';
    settings.surveyor = $('#soWho').value.trim(); saveSettings();
    const since = $('#soSince').checked ? sent : 0;
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
    <ol class="steps"><li><b>Abre el plano del camino</b> que te manden (KML o KMZ) con «Importar» o desde WhatsApp/correo con «Abrir con OBRA-GIS».</li>
      <li><b>Pulsa el botón naranja +</b> donde estés para apuntar lo que ves: la app pone sola el punto kilométrico (PK).</li>
      <li><b>Al terminar</b>, pulsa el botón naranja <b>+</b> o el <b>menú</b> (arriba a la izquierda) y elige <b>«Enviar a la oficina»</b>.</li></ol>
    <p><b>¿Cómo vas a usar la app?</b></p>
    <div class="acts"><button class="btn go full" data-r="simple">Apuntar en campo (modo sencillo, letra grande)</button><button class="btn pri full" data-r="full">Técnico: todas las herramientas</button></div>
    <p class="hint">Se puede cambiar cuando quieras en el menú (arriba a la izquierda) → Ajustes.</p>`);
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
  return { code: code || auto, unit: isUnit(m.unit) ? m.unit : defaultUnit(it), price, summary: typeof m.summary === 'string' && m.summary ? m.summary : type, own: !!code, auto };
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

/* ---------------- Licencia de uso ----------------
   La app consulta licencia.json publicado junto a la web (GitHub Pages). Si el autor pone "activa": false,
   la app queda bloqueada salvo para exportar las obras. Sin conexión se permite trabajar DIAS_GRACIA días
   desde la última comprobación correcta. */
const LICENSE_URL = 'https://celtis-eng.github.io/OBRAGIS/licencia.json';
const EULA_VERSION = '1';
const EULA_TEXT = `<p><b>OBRA-GIS · Licencia de uso gratuita</b></p>
<p>El autor concede una licencia personal, gratuita, no exclusiva, intransferible y revocable para usar OBRA-GIS como herramienta de apoyo en trabajos de campo.</p>
<ul><li>La app se ofrece «tal cual», sin garantía. Las mediciones, pendientes, distancias, afecciones y coordenadas son orientativas y deben comprobarse con medios topográficos y fuentes oficiales antes de tomar decisiones de proyecto u obra.</li>
<li>Los datos que introduces (obras, capas, fotos, anotaciones) se guardan en tu dispositivo. Eres responsable de sus copias de seguridad; usa «Exportar obra» con regularidad.</li>
<li>Los mapas y servicios de terceros (IGN, Junta de Andalucía, MITECO, Catastro, OpenStreetMap…) se rigen por sus propias licencias y condiciones.</li>
<li>El autor puede modificar estas condiciones, pasar la app a un modelo de pago o retirarla. En ese caso la app avisará y <b>siempre te permitirá exportar tus obras</b> antes de bloquearse.</li>
<li>No está permitido redistribuir, vender ni modificar la app sin permiso del autor.</li></ul>`;
let licState = { status: 'ok', msg: '' };
function semverLess(a, b) { const p = v => String(v || '0').split('.').map(n => parseInt(n, 10) || 0); const x = p(a), y = p(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); } return false; }
async function checkLicense() {
  const urls = location.protocol.startsWith('http') && !NATIVE && /github\.io$/.test(location.hostname) ? ['licencia.json'] : [LICENSE_URL];
  let lic = null;
  for (const u of urls) { try { lic = JSON.parse(await httpGetText(u + (u.includes('?') ? '&' : '?') + 't=' + Date.now())); break; } catch (e) { /* sin conexión */ } }
  const now = Date.now();
  if (lic) {
    settings.license = { ...lic, checked: now }; saveSettings();
    if (lic.activa === false) licState = { status: 'off', msg: lic.mensaje || 'El autor ha desactivado esta versión de OBRA-GIS.' };
    else if (lic.version_minima && semverLess(APP_VERSION, lic.version_minima)) licState = { status: 'old', msg: lic.mensaje_version || `Esta versión (${APP_VERSION}) ya no está admitida. Actualiza a la ${lic.version_minima} o posterior.` };
    else licState = { status: 'ok', msg: lic.aviso || '' };
  } else {
    const last = settings.license && settings.license.checked, days = (settings.license && settings.license.dias_sin_conexion) || 60;
    if (!last) { settings.license = { checked: now, firstOffline: true }; saveSettings(); licState = { status: 'ok', msg: '' }; }
    else if (now - last > days * 864e5) licState = { status: 'expired', msg: `La licencia no se ha podido comprobar en ${days} días. Conéctate a internet y pulsa «Reintentar».` };
    else licState = { status: settings.license.activa === false ? 'off' : 'ok', msg: settings.license.mensaje || '' };
  }
  applyLicense();
  if (licState.status === 'ok' && licState.msg && settings.licNotice !== licState.msg) { settings.licNotice = licState.msg; saveSettings(); toast(licState.msg, 8000); }
}
function applyLicense() {
  let ov = $('#licBlock');
  if (licState.status === 'ok') { if (ov) ov.remove(); return; }
  if (!ov) { ov = document.createElement('div'); ov.id = 'licBlock'; ov.className = 'licblock'; document.body.appendChild(ov); }
  const url = settings.license && settings.license.url;
  ov.innerHTML = `<div class="licbox"><h2>OBRA-GIS no está disponible</h2><p>${esc(licState.msg)}</p>
    <p class="hint">Tus datos siguen en este dispositivo. Exporta tus obras para no perderlas.</p>
    <div class="acts"><button class="btn pri full" data-l="exp">Exportar mis obras</button><button class="btn" data-l="retry">Reintentar</button>${url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Más información</a>` : ''}</div></div>`;
  ov.querySelector('[data-l=exp]').onclick = async () => { for (const id of obras.keys()) { try { await exportObraPackage(id); } catch (e) { /* cancelado */ } } };
  ov.querySelector('[data-l=retry]').onclick = () => checkLicense();
}
function eulaSheet(first) {
  const b = openSheet(`<h2>Licencia de uso</h2><div class="eula">${EULA_TEXT}</div>
    <div class="acts">${first ? '<button class="btn pri full" data-a="ok">Acepto las condiciones</button>' : '<button class="btn full" data-a="ok">Cerrar</button>'}</div>`);
  b.querySelector('[data-a=ok]').onclick = () => { if (first) { settings.eulaAccepted = EULA_VERSION; settings.eulaDate = Date.now(); saveSettings(); } closeSheet(); if (first && !settings.welcomed && !layers.size) setTimeout(welcomeSheet, 100); };
  if (first) onSheetClose(() => { if (settings.eulaAccepted !== EULA_VERSION) setTimeout(() => eulaSheet(true), 50); });
}
function licenseSheet() {
  const l = settings.license || {}, st = { ok: 'Activa', off: 'Desactivada por el autor', old: 'Versión no admitida', expired: 'Sin comprobar (caducada)' }[licState.status];
  const b = openSheet(`<h2>Licencia</h2><p class="sub">OBRA-GIS ${APP_VERSION} · ${APP_DATE}</p>
    <table class="attrs"><tr><td>Estado</td><td>${st}</td></tr><tr><td>Tipo</td><td>${esc(l.tipo || 'Gratuita')}</td></tr>
    <tr><td>Última comprobación</td><td>${l.checked && !l.firstOffline ? new Date(l.checked).toLocaleString('es-ES') : 'pendiente (sin conexión)'}</td></tr>
    <tr><td>Uso sin conexión</td><td>hasta ${l.dias_sin_conexion || 60} días sin comprobar</td></tr>
    <tr><td>Condiciones aceptadas</td><td>${settings.eulaDate ? new Date(settings.eulaDate).toLocaleDateString('es-ES') : '—'}</td></tr></table>
    <div class="acts"><button class="btn" data-a="eula">Ver condiciones</button><button class="btn" data-a="chk">Comprobar ahora</button></div>`);
  b.querySelector('[data-a=eula]').onclick = () => eulaSheet(false);
  b.querySelector('[data-a=chk]').onclick = async () => { await checkLicense(); toast('Licencia: ' + ({ ok: 'activa', off: 'desactivada', old: 'versión no admitida', expired: 'sin comprobar' }[licState.status])); licenseSheet(); };
}

/* ---------------- Novedades por versión ---------------- */
function newsSheet() {
  openSheet(`<h2>Novedades</h2><p class="sub">Versión instalada: <b>v${APP_VERSION}</b> (${APP_DATE.split('-').reverse().join('/')})</p>
    <div class="news">${CHANGELOG.map(([v, d, t], i) => `<div class="nv ${i === 0 ? 'on' : ''}"><div><b>v${v}</b><small>${d}</small></div><p>${esc(t)}</p></div>`).join('')}</div>`);
}

/* ---------------- Medición ---------------- */
let measure = null;
const mDot = ll => L.circleMarker(ll, { renderer: hlRenderer, radius: 6, color: '#1f1a00', weight: 2, fillColor: '#ffd43b', fillOpacity: 1, interactive: false });
function startMeasure(ll, area = false) {
  if (measure) endMeasure();
  measure = { area, pts: [], line: (area ? L.polygon([], { renderer: hlRenderer, color: '#ffd43b', weight: 3, dashArray: '8 6', fillOpacity: 0.15, interactive: false }) : L.polyline([], { renderer: hlRenderer, color: '#ffd43b', weight: 4, dashArray: '8 6', interactive: false })).addTo(map), marks: L.layerGroup().addTo(map) };
  $('#measureBar').hidden = false;
  if (ll) addMeasurePt(ll); else updateMeasure();
}
function addMeasurePt(ll) {
  measure.pts.push(L.latLng(ll));
  mDot(ll).addTo(measure.marks);
  measure.line.setLatLngs(measure.pts); updateMeasure();
}
function updateMeasure() {
  const p = measure.pts; let d = 0;
  for (let i = 1; i < p.length; i++) d += p[i - 1].distanceTo(p[i]);
  if (measure.area) {
    if (p.length < 3) { $('#mText').textContent = 'Área: toca al menos 3 puntos del contorno'; return; }
    const per = d + p[p.length - 1].distanceTo(p[0]), a = polyArea(p.map(q => [q.lat, q.lng]));
    $('#mText').textContent = `Área: ${fmtArea(a)} (${(a / 10000).toFixed(4).replace('.', ',')} ha) · perímetro ${fmtLen(per)}`;
  } else $('#mText').textContent = p.length < 2 ? 'Toca el mapa para añadir puntos' : `Distancia: ${fmtLen(d)} · ${p.length} puntos`;
}
function endMeasure() { if (!measure) return; map.removeLayer(measure.line); map.removeLayer(measure.marks); measure = null; $('#measureBar').hidden = true; }
map.on('click', e => { if (drawing && !drawing.gps) return addDrawPt(L.latLng(e && e.latlng ? e.latlng : e)); if (slopePick || actPick || widthPick || offPick || calcPick) return slopePickPoint(e.latlng); if (measure) addMeasurePt(e.latlng); });
$('#mUndo').onclick = () => {
  if (!measure || !measure.pts.length) return;
  measure.pts.pop(); measure.marks.clearLayers();
  measure.pts.forEach(p => mDot(p).addTo(measure.marks));
  measure.line.setLatLngs(measure.pts); updateMeasure();
};
$('#mEnd').onclick = endMeasure;

/* ---------------- Exportar anotaciones y fotos a KMZ ---------------- */
const cdata = s => '<![CDATA[' + String(s).replace(/]]>/g, ']]]]><![CDATA[>') + ']]>';
const xml = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
async function exportKMZ() {
  const list = [...notes.values()].sort((a, b) => a.created - b.created);
  if (!list.length && !acts.size) { toast('Todavía no hay anotaciones, fotos ni actuaciones que exportar.'); return; }
  toast('Preparando KMZ…', 8000);
  const zip = new JSZip(); const folders = new Map();
  for (const n of list) {
    let html = `<p><b>${esc(fmtDate(n.created))}</b><br>${esc(fmtLL(n.lat, n.lng))}<br>${esc(fmtUTM(n.lat, n.lng))}</p>`;
    if (n.text) html += `<p>${esc(n.text).replace(/\n/g, '<br>')}</p>`;
    (n.media || []).forEach((m, i) => {
      const name = `files/${n.id}_${i + 1}.${extFor(m)}`;
      zip.file(name, m.blob);
      html += m.kind === 'photo' ? `<p><img src="${name}" width="480"></p>` : `<p><a href="${name}">${m.kind === 'video' ? 'Vídeo' : 'Nota de voz'} ${i + 1}</a></p>`;
    });
    const pm = `<Placemark><name>${xml(n.title)}</name><description>${cdata(html)}</description>
<TimeStamp><when>${new Date(n.created).toISOString()}</when></TimeStamp><styleUrl>#${noteType(n)}</styleUrl>
<Point><coordinates>${n.lng.toFixed(7)},${n.lat.toFixed(7)},0</coordinates></Point></Placemark>\n`;
    const fname = layerName(n.layerId);
    folders.set(fname, (folders.get(fname) || '') + pm);
  }
  let actPms = '', actStyles = '';
  ACT_TYPES.forEach(([t, c], i) => { actStyles += `<Style id="act${i}"><LineStyle><color>ff${c.slice(5, 7)}${c.slice(3, 5)}${c.slice(1, 3)}</color><width>5</width></LineStyle><IconStyle><color>ff${c.slice(5, 7)}${c.slice(3, 5)}${c.slice(1, 3)}</color></IconStyle></Style>`; });
  for (const a of actsSorted()) {
    let html = `<p><b>${esc(a.type)}</b> · ${esc(SIDES[a.side] || '')}<br>PK ${fmtPK(a.d0)} a ${fmtPK(a.d1)} · ${fmtLen(a.d1 - a.d0)}<br>${esc(a.traceName)}</p>`;
    const kr = [...actParamRows(a), ...actMeasRows(a).filter(([k]) => k !== 'Longitud')];
    if (kr.length) html += `<p>${kr.map(([k, v]) => `${esc(k)}: <b>${esc(String(v))}</b>`).join('<br>')}</p>`;
    if (a.text) html += `<p>${esc(a.text).replace(/\n/g, '<br>')}</p>`;
    (a.media || []).forEach((m, i) => {
      const name = `files/${a.id}_${i + 1}.${extFor(m)}`;
      zip.file(name, m.blob);
      html += m.kind === 'photo' ? `<p><img src="${name}" width="480"></p>` : `<p><a href="${name}">${m.kind === 'video' ? 'Vídeo' : 'Nota de voz'} ${i + 1}</a></p>`;
    });
    const ti = Math.max(0, ACT_TYPES.findIndex(([t]) => t === a.type));
    const geom = a.coords.length > 1 && a.d1 > a.d0
      ? `<LineString><tessellate>1</tessellate><coordinates>${a.coords.map(c => `${c[1].toFixed(7)},${c[0].toFixed(7)},0`).join(' ')}</coordinates></LineString>`
      : `<Point><coordinates>${a.coords[0][1].toFixed(7)},${a.coords[0][0].toFixed(7)},0</coordinates></Point>`;
    actPms += `<Placemark><name>${xml(actTitle(a))}</name><description>${cdata(html)}</description><styleUrl>#act${ti}</styleUrl>
<ExtendedData><Data name="Tipo"><value>${xml(a.type)}</value></Data><Data name="Margen"><value>${xml(SIDES[a.side] || '')}</value></Data><Data name="PK_inicio"><value>${fmtPK(a.d0)}</value></Data><Data name="PK_fin"><value>${fmtPK(a.d1)}</value></Data><Data name="Longitud_m"><value>${(a.d1 - a.d0).toFixed(1)}</value></Data>${(() => { const m = actMeasure(a), x = [['Longitud_total_m', m.Lm || m.L, MEAS_DEC.L], ['Superficie_m2', m.area, MEAS_DEC.area], ['Volumen_m3', m.vol, MEAS_DEC.vol], ['Peso_t', m.t, MEAS_DEC.t], ['Unidades', m.n, 0]];
  return x.filter(([, v]) => v).map(([k, v, dd]) => `<Data name="${k}"><value>${(+v).toFixed(dd)}</value></Data>`).join('') + Object.entries(a.params || {}).filter(([k, v]) => k[0] !== '_' && v !== '' && v != null).map(([k, v]) => `<Data name="${xml((ACT_FIELDS[k] || { l: k === 'mat' ? 'Material' : k }).l.replace(/ /g, '_'))}"><value>${xml(String(v))}</value></Data>`).join('') + (a.prio ? `<Data name="Prioridad"><value>${xml((ACT_PRIO[a.prio] || [a.prio])[0])}</value></Data>` : ''); })()}</ExtendedData>
${geom}</Placemark>\n`;
  }
  if (actPms) folders.set('Actuaciones', actPms);
  const st = (id, c) => `<Style id="${id}"><IconStyle><color>${c}</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>`;
  const body = [...folders].map(([name, pms]) => `<Folder><name>${xml(name)}</name>\n${pms}</Folder>`).join('\n');
  const kmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>OBRA-GIS ${new Date().toLocaleDateString('es-ES')}</name>
${st('photo', 'ffc27119')}${st('video', 'ffb5369c')}${st('audio', 'ff3e8a2b')}${st('note', 'ff0c59e8')}${actStyles}
${body}</Document></kml>`;
  zip.file('doc.kml', kmlDoc);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.google-earth.kmz' });
  const name = `anotaciones_${new Date().toISOString().slice(0, 10)}.kmz`;
  try { await saveBlob(blob, name); toast(`Exportadas ${list.length} anotaciones y ${acts.size} actuaciones en ${name}`); }
  catch (e) { if (!/cancel/i.test(e.message || '')) toast('No se pudo exportar: ' + (e.message || e), 6000); }
}

/* ---------------- Guardar zona para trabajar sin cobertura ---------------- */
function tileRange(b, z) {
  const n = 2 ** z;
  const x = lng => Math.floor((lng + 180) / 360 * n);
  const y = lat => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n); };
  return { x0: x(b.getWest()), x1: x(b.getEast()), y0: y(b.getNorth()), y1: y(b.getSouth()) };
}
async function cacheArea() { offlineSheet(); }

/* ---------------- Mapas sin conexión ----------------
   Descarga la ortofoto PNOA (y opcionalmente los rótulos y las capas de servicios visibles) de una zona:
   la vista actual, un municipio buscado por nombre o el municipio del punto que se toque en el mapa.
   Los límites municipales se obtienen de OpenStreetMap (Nominatim). */
const NOMINATIM = 'https://nominatim.openstreetmap.org';
let offZone = null, offCancel = false, offPick = false;
function pointInRing(lat, lng, ring) { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const yi = ring[i][1], xi = ring[i][0], yj = ring[j][1], xj = ring[j][0]; if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
function inGeom(lat, lng, g) {
  if (!g) return true;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.some(p => pointInRing(lat, lng, p[0]) && !p.slice(1).some(h => pointInRing(lat, lng, h)));
}
function tile2lat(y, z) { const n = Math.PI - 2 * Math.PI * y / 2 ** z; return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }
function tile2lng(x, z) { return x / 2 ** z * 360 - 180; }
function zoneTiles(zone, zMax) {
  const out = [], b = zone.bounds;
  for (let z = 10; z <= zMax; z++) {
    const r = tileRange(b, z);
    for (let x = r.x0; x <= r.x1; x++) for (let y = r.y0; y <= r.y1; y++) {
      if (zone.geom) {
        const la0 = tile2lat(y + 1, z), la1 = tile2lat(y, z), lo0 = tile2lng(x, z), lo1 = tile2lng(x + 1, z);
        const pts = [[(la0 + la1) / 2, (lo0 + lo1) / 2], [la0, lo0], [la0, lo1], [la1, lo0], [la1, lo1]];
        if (!pts.some(([a, c]) => inGeom(a, c, zone.geom))) continue;
      }
      out.push({ x, y, z });
    }
  }
  return out;
}
function zoneUrls(zone, opts) {
  const urls = [], tl = zoneTiles(zone, opts.zMax);
  const wmsLayers = opts.wms ? [...layers.values()].filter(e => e.rec.visible && e.tile) : [];
  tl.forEach(t => {
    const sub = u => u.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y);
    urls.push(sub(URL_PNOA));
    if (opts.labels && t.z <= 18) urls.push(sub(URL_LABELS));
    if (t.z <= Math.min(opts.zMax, 17)) wmsLayers.forEach(e => { try { urls.push(e.tile.getTileUrl(L.point(t.x, t.y).set ? t : Object.assign(L.point(t.x, t.y), { z: t.z }))); } catch (_) {} });
  });
  return urls;
}
async function fetchTileBlob(u) {
  const H = Plug('CapacitorHttp');
  if (NATIVE && H) { const r = await H.get({ url: u, responseType: 'blob', connectTimeout: 15000, readTimeout: 15000 }); if (r.status >= 400) throw new Error('HTTP ' + r.status); const ct = (r.headers && (r.headers['Content-Type'] || r.headers['content-type'])) || (/png/i.test(u) ? 'image/png' : 'image/jpeg'); return b64ToBlob(r.data, ct); }
  const r = await fetch(u, { mode: 'cors' }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob();
}
async function offlineSheet() {
  const zones = (await DB.get('kv', 'zones').catch(() => null)) || [];
  const z = offZone;
  const b = openSheet(`<h2>Mapas sin conexión</h2><p class="sub">Descarga la ortofoto de una zona para trabajar sin cobertura</p>
    <div class="seg three"><button type="button" data-zmode="view" class="${!z || z.kind === 'view' ? 'on' : ''}">Vista actual</button><button type="button" data-zmode="search" class="${z && z.kind === 'search' ? 'on' : ''}">Municipio</button><button type="button" data-zmode="tap" class="${z && z.kind === 'tap' ? 'on' : ''}">Tocar mapa</button></div>
    <div id="zSel">${z ? `<p class="zsel"><b>${esc(z.name)}</b>${z.geom ? ' · límite municipal' : ''}</p>` : '<p class="hint">Se descargará la zona que ves ahora en pantalla.</p>'}</div>
    <div id="zSearch" ${z && z.kind === 'search' ? '' : 'hidden'} class="field row"><input type="text" id="zQ" placeholder="Municipio (p. ej. Cuevas del Campo, Granada)"><button class="mini" data-a="find">Buscar</button></div>
    <div id="zRes"></div>
    <div class="field row"><label for="zMax" class="grow">Detalle máximo</label><select id="zMax" style="max-width:180px">
      <option value="15">Bajo (5 m/píxel)</option><option value="16">Medio (2,4 m/píxel)</option><option value="17" selected>Alto (1,2 m/píxel)</option><option value="18">Muy alto (0,6 m/píxel)</option><option value="19">Máximo (0,3 m/píxel)</option></select></div>
    <label class="opt"><input type="checkbox" id="zLab" checked>Incluir carreteras y nombres</label>
    <label class="opt"><input type="checkbox" id="zWms">Incluir las capas de servicios visibles ahora (hasta detalle alto)</label>
    <p class="hint" id="zEst"></p>
    <div class="progress" id="zProg" hidden><div></div><span></span></div>
    <div class="acts"><button class="btn pri full" data-a="dl">Descargar</button><button class="btn full" data-a="stop" hidden>Detener</button></div>
    <h3 class="sh">Zonas descargadas</h3>
    ${zones.length ? zones.map(zz => `<div class="nrow"><span class="t"><b>${esc(zz.name)}</b><small>${fmtDate(zz.created)} · ${zz.count} imágenes · ${(zz.bytes / 1048576).toFixed(0)} MB · detalle ${zz.zMax}</small></span><button class="mini del" data-zdel="${zz.id}">Borrar</button></div>`).join('') : '<p class="empty">Ninguna todavía.</p>'}
    <p class="hint">Las capas KML, anotaciones, fotos y actuaciones ya están siempre en el móvil y funcionan sin conexión.</p>`);
  const est = () => {
    const zone = offZone || { kind: 'view', name: 'Vista actual', bounds: map.getBounds() };
    const opts = { zMax: +$('#zMax').value, labels: $('#zLab').checked, wms: $('#zWms').checked };
    const n = zoneUrls(zone, opts).length, mb = Math.round(n * 0.022);
    $('#zEst').textContent = n > 40000 ? `Son ${thousands(n)} imágenes (unos ${thousands(mb)} MB): demasiadas. Baja el detalle máximo o elige una zona más pequeña.` : `${thousands(n)} imágenes · unos ${thousands(mb)} MB`;
    return { zone, opts, n };
  };
  est();
  ['zMax', 'zLab', 'zWms'].forEach(id => $('#' + id).onchange = est);
  b.querySelectorAll('[data-zmode]').forEach(bt => bt.onclick = () => {
    const m = bt.dataset.zmode;
    if (m === 'view') { offZone = null; offlineSheet(); }
    if (m === 'search') { offZone = { kind: 'search', name: 'Busca un municipio', bounds: map.getBounds() }; offlineSheet(); }
    if (m === 'tap') { closeSheet(); offPick = true; $('#pickText').textContent = 'Toca un punto del municipio que quieres descargar'; $('#pickBar').hidden = false; }
  });
  const fb = b.querySelector('[data-a=find]');
  if (fb) fb.onclick = async () => {
    const q = $('#zQ').value.trim(); if (!q) return;
    $('#zRes').innerHTML = '<p class="hint">Buscando…</p>';
    try {
      const res = JSON.parse(await httpGetText(`${NOMINATIM}/search?q=${encodeURIComponent(q)}&countrycodes=es&format=jsonv2&polygon_geojson=1&limit=6`));
      const ok = res.filter(r => r.geojson && /Polygon/.test(r.geojson.type));
      $('#zRes').innerHTML = ok.length ? ok.map((r, i) => `<button class="crow" data-zr="${i}" type="button"><span>${esc(r.display_name)}</span><small>${esc(r.addresstype || r.type || '')}</small></button>`).join('') : '<p class="hint">No se ha encontrado ningún municipio con ese nombre.</p>';
      $('#zRes').querySelectorAll('[data-zr]').forEach(bt => bt.onclick = () => { const r = ok[+bt.dataset.zr]; setOffZone('search', r.display_name.split(',').slice(0, 2).join(','), r.geojson); offlineSheet(); });
    } catch (e) { $('#zRes').innerHTML = '<p class="hint">No se pudo buscar. Comprueba la conexión.</p>'; }
  };
  b.querySelectorAll('[data-zdel]').forEach(bt => bt.onclick = async () => {
    const list = (await DB.get('kv', 'zones')) || [], zz = list.find(x => x.id === bt.dataset.zdel);
    if (!zz || !confirm(`¿Borrar la zona «${zz.name}» del móvil?`)) return;
    const urls = (await DB.get('kv', 'zone:' + zz.id)) || [], keep = new Set();
    for (const o of list.filter(x => x.id !== zz.id)) ((await DB.get('kv', 'zone:' + o.id)) || []).forEach(u => keep.add(u));
    const cache = await caches.open('tiles-v1'); for (const u of urls) if (!keep.has(u)) await cache.delete(u);
    await DB.put('kv', list.filter(x => x.id !== zz.id), 'zones'); await DB.del('kv', 'zone:' + zz.id);
    toast('Zona borrada'); offlineSheet();
  });
  b.querySelector('[data-a=stop]').onclick = () => { offCancel = true; };
  b.querySelector('[data-a=dl]').onclick = async () => {
    if (!('caches' in window)) { toast('Este dispositivo no permite guardar mapas sin conexión.'); return; }
    const { zone, opts, n } = est();
    if (zone.kind === 'search' && !zone.geom) { toast('Busca y elige primero el municipio.'); return; }
    if (n > 40000) { toast('Demasiadas imágenes: baja el detalle máximo.'); return; }
    const urls = zoneUrls(zone, opts), cache = await caches.open('tiles-v1'), prog = $('#zProg');
    prog.hidden = false; b.querySelector('[data-a=dl]').hidden = true; b.querySelector('[data-a=stop]').hidden = false;
    let done = 0, ok = 0, bytes = 0, fail = 0; offCancel = false; const queue = urls.slice();
    const upd = () => { const p = prog.querySelector('div'), t = prog.querySelector('span'); if (p) p.style.width = (done / urls.length * 100).toFixed(1) + '%'; if (t) t.textContent = `${thousands(done)} / ${thousands(urls.length)} · ${(bytes / 1048576).toFixed(0)} MB`; };
    async function worker() {
      while (queue.length && !offCancel) {
        const u = queue.shift();
        try { const hit = await cache.match(u); if (hit) { ok++; } else { const bl = await fetchTileBlob(u); await cache.put(u, new Response(bl, { headers: { 'Content-Type': bl.type || 'image/jpeg' } })); bytes += bl.size; ok++; } } catch (e) { fail++; }
        done++; if (done % 20 === 0) upd();
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker)); upd();
    const list = (await DB.get('kv', 'zones').catch(() => null)) || [], id = uid();
    list.push({ id, name: zone.name, created: Date.now(), count: ok, bytes, zMax: opts.zMax });
    await DB.put('kv', urls.slice(0, done), 'zone:' + id); await DB.put('kv', list, 'zones');
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    toast(offCancel ? `Descarga detenida: ${ok} imágenes guardadas.` : `Zona «${zone.name}» lista sin conexión: ${ok} imágenes${fail ? ` (${fail} no se pudieron bajar)` : ''}.`, 7000);
    offZone = null; offlineSheet();
  };
}
function setOffZone(kind, name, geojson) {
  const coords = []; (function walk(c) { if (typeof c[0] === 'number') coords.push([c[1], c[0]]); else c.forEach(walk); })(geojson.coordinates);
  offZone = { kind, name, geom: geojson, bounds: L.latLngBounds(coords) };
  if (geojson) { slopeHL.clearLayers(); L.geoJSON(geojson, { renderer: hlRenderer, style: { color: '#ff6b00', weight: 3, fillOpacity: 0.08 }, interactive: false }).addTo(slopeHL); map.fitBounds(offZone.bounds.pad(0.05)); setTimeout(() => slopeHL.clearLayers(), 8000); }
}
async function offlinePickAt(ll) {
  offPick = false; $('#pickBar').hidden = true;
  toast('Buscando el municipio…', 4000);
  try {
    const r = JSON.parse(await httpGetText(`${NOMINATIM}/reverse?lat=${ll.lat.toFixed(6)}&lon=${ll.lng.toFixed(6)}&zoom=10&format=jsonv2&polygon_geojson=1`));
    if (!r.geojson || !/Polygon/.test(r.geojson.type)) throw new Error('sin límite');
    setOffZone('tap', r.name || (r.display_name || '').split(',')[0], r.geojson);
  } catch (e) { toast('No se ha encontrado el municipio de ese punto. Prueba con «Municipio» o «Vista actual».', 6000); }
  offlineSheet();
}
/* ---------------- Panel lateral con el gestor de capas ---------------- */
let openLayerId = null, folderIds = new Map();
function openDrawer() { renderDrawer(); $('#drawer').hidden = false; $('#scrim').hidden = false; armBack(); }
function closeDrawer() { $('#drawer').hidden = true; $('#scrim').hidden = true; }

function layerRow(id, name, sub, swatch, opts) {
  const sel = selMode && layers.has(id), vis = sel ? selIds.has(id) : layerVisible(id), open = openLayerId === id && !selMode;
  return `<div class="lyr ${open ? 'open' : ''} ${sel && selIds.has(id) ? 'picked' : ''}">
    <div class="lrow" style="--dep:${opts.depth || 0}"><input type="checkbox" class="${sel ? 'selbox' : ''}" data-vis="${id}" ${vis ? 'checked' : ''} aria-label="${sel ? 'Seleccionar' : 'Mostrar'} ${esc(name)}">
      ${swatch}<button class="nm" data-open="${id}" type="button">${esc(name)}<small>${esc(sub)}</small></button>
      ${opts.move ? `<button class="mini ic" data-up="${id}" aria-label="Subir">${ICON.up}</button><button class="mini ic" data-down="${id}" aria-label="Bajar">${ICON.down}</button>` : ''}
    </div>
    ${open ? `<div class="lopts">${opts.body}</div>` : ''}
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
$('#inObra').addEventListener('change', async e => { const f = (e.target.files || [])[0]; e.target.value = ''; if (f) { const z = await isObraPackage(f); z ? importObraPackage(f, z) : fichaImportFiles([f]); } });
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
  const id = actDraft.id; closeSheet(); const ok = await saveAct();
  if (ok) { buzz(50); const pr = actParamRows({ type, params: last.params }).filter(([k]) => k !== 'Prioridad').map(([, v]) => v).slice(0, 3).join(' · ');
    showUndo(`${type} en el PK ${fmtPK(n.d)}${pr ? ` (${pr}, como la última)` : ''}`, async () => { await DB.del('acts', id); acts.delete(id); drawActs(); }, 10000); }
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
