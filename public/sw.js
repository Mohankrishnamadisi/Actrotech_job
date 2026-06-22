const CACHE_NAME = 'actro-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png',
  '/actrotitle.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Treat known API/third-party endpoints (Supabase, REST paths) as network-first
  const isSupabase = url.hostname.includes('supabase.co');
  const isRestApiPath = url.pathname.includes('/rest/v1') || url.pathname.includes('/storage/v1') || url.pathname.includes('/auth/v1');

  if (request.method !== 'GET' || request.url.includes('/api/') || isSupabase || isRestApiPath) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => networkResponse)
        .catch(() => caches.match(request))
    );
    return;
  }

  // For navigation and static assets, serve cache first. Cache only same-origin GET responses.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        if (!resp || resp.status !== 200) return resp;
        try {
          const respClone = resp.clone();
          // Only cache same-origin resources to avoid caching third-party API responses
          if (new URL(request.url).origin === self.location.origin) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
          }
        } catch (e) {
          // ignore cache failures
        }
        return resp;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
