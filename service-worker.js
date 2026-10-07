/*******************************************************
 * CutiCoach - Service Worker v3 (sin CORS)
 *******************************************************/

const CACHE_NAME = 'cuticoach-v3';
const ASSETS = [
  './',
  './optimetrics.html',
  './alimentos.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Instalar */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('No se pudo cachear:', url, err);
          return null;
        }))
      );
    })
  );
  self.skipWaiting();
});

/* Activar */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

/* Fetch */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  const url = e.request.url;
  // No interceptar APIs externas (romperían CORS)
  if (url.includes('script.google.com')) return;
  if (url.includes('script.googleusercontent.com')) return;
  if (url.includes('cdn.tailwindcss.com')) return;
  if (url.includes('cdn.jsdelivr.net')) return;
  if (url.includes('fonts.googleapis.com')) return;
  if (url.includes('fonts.gstatic.com')) return;
  
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