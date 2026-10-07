/*******************************************************
 * CutiCoach - Service Worker
 * Cachea los archivos para que la app funcione offline
 *******************************************************/

const CACHE_NAME = 'cuticoach-v1';
const ASSETS = [
  './',
  './optimetrics.html',
  './alimentos.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

/* Instalar: cachear todo */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

/* Activar: limpiar versiones viejas */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

/* Fetch: cache primero, luego red */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('script.googleusercontent.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});