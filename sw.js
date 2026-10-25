/* Service worker de OBRA-GIS: app disponible sin conexión, teselas PNOA en caché
   y recepción de KML/KMZ compartidos desde otras apps. */
const SHELL = 'shell-v9';
const TILES = 'tiles-v1';
const ASSETS = ['./', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest',
  'vendor/leaflet.js', 'vendor/leaflet.css', 'vendor/jszip.min.js',
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
  if (url.origin === location.origin) { e.respondWith(staleWhileRevalidate(req)); return; }
  if (url.hostname === 'www.ign.es') { e.respondWith(tile(req)); return; }
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
