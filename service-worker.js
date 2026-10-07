/*******************************************************
 * CutiCoach - Service Worker v4 (Auto-actualizable)
 * Estrategia: Network-first para HTML, cache-first para assets
 * Se auto-actualiza cuando cambia VERSION
 *******************************************************/

const VERSION = 'v5-1';  // ⚠️ CAMBIA este número cada vez que subas cambios importantes
const CACHE_NAME = 'cuticoach-' + VERSION;

const ASSETS = [
  './alimentos.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Instalar: precachear assets estáticos */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('No se pudo cachear:', url, err);
          return null;
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

/* Activar: borrar cachés viejos */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* Fetch */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  const url = e.request.url;
  
  // NUNCA interceptar APIs externas
  if (url.includes('script.google.com')) return;
  if (url.includes('script.googleusercontent.com')) return;
  if (url.includes('cdn.tailwindcss.com')) return;
  if (url.includes('cdn.jsdelivr.net')) return;
  if (url.includes('fonts.googleapis.com')) return;
  if (url.includes('fonts.gstatic.com')) return;
  
  // HTML, manifest, service worker → NETWORK FIRST (siempre lo último)
  const isHTML = e.request.mode === 'navigate' 
              || url.endsWith('.html') 
              || url.endsWith('/')
              || url.includes('manifest.json');
  
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(response => {
        // Cachear la respuesta nueva
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Si falla la red, usar caché
        return caches.match(e.request);
      })
    );
    return;
  }
  
  // Assets (imágenes, js) → CACHE FIRST
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
