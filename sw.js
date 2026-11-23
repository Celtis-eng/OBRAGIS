/* OBRA-GIS v1.19.4 (2026-11-23) — service worker: app disponible sin conexión, teselas PNOA en caché
   y recepción de KML/KMZ compartidos desde otras apps.
   VERSION debe coincidir con APP_VERSION de js/01-version.js: al cambiarla, los móviles descargan la versión nueva. */
const VERSION = '1.19.4';
const SHELL = 'shell-' + VERSION;
const TILES = 'tiles-v1';
const ASSETS = ['./', 'index.html', 'app.css', 'js/01-version.js', 'js/02-base.js', 'js/03-mapa.js', 'js/04-capas.js', 'js/05-campo.js', 'js/06-pendiente.js', 'js/07-actuaciones.js', 'js/08-obras.js', 'js/09-herramientas.js', 'js/10-informes.js', 'js/11-tramo.js', 'js/12-bc3.js', 'js/13-licencia.js', 'js/14-panel.js', 'js/15-arranque.js', 'js/16-copia.js', 'ficha.js', 'manifest.webmanifest',
  'vendor/leaflet.js', 'vendor/leaflet.css', 'vendor/jszip.min.js', 'vendor/piexif.js',
  'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method === 'POST' && url.origin === location.origin && url.pathname.endsWith('/share')) {
    e.respondWith(receiveShare(req)); return;
  }
  if (req.method !== 'GET') return;
  if (url.origin === location.origin && /\/(licencia|version)\.json$/.test(url.pathname)) return; // siempre de la red
  if (url.origin === location.origin) { e.respondWith(staleWhileRevalidate(req)); return; }
  if (url.hostname === 'www.ign.es') { e.respondWith(tile(req)); return; }
  if (req.destination === 'image') { e.respondWith(cachedImage(req)); return; } // capas de servicios descargadas para uso sin conexión
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
  return hit || (await net) || new Response('Sin conexión', { status: 503 });
}

// Ortofoto IGN: primero la caché; si no está, red en modo CORS para poder guardarla.
async function tile(req) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const r = await fetch(req.url, { mode: 'cors' });
    if (r.ok) cache.put(req.url, r.clone());
    return r;
  } catch (e) {
    return fetch(req); // servidor sin CORS: se muestra pero no se guarda
  }
}

async function cachedImage(req) {
  const hit = await (await caches.open(TILES)).match(req.url);
  return hit || fetch(req);
}

async function receiveShare(req) {
  try {
    const fd = await req.formData();
    const cache = await caches.open('inbox');
    let i = 0;
    for (const f of fd.getAll('files')) {
      if (!(f instanceof File)) continue;
      await cache.put(`inbox/${Date.now()}-${i++}`, new Response(f, { headers: { 'x-name': encodeURIComponent(f.name) } }));
    }
  } catch (e) { /* se ignora */ }
  return Response.redirect('./?shared=1', 303);
}
