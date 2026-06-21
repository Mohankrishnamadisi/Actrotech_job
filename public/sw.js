const CACHE_NAME = 'actotech-cache-v1';
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
  '/job_logo.png'
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

  // Always try network first for API calls
  if (request.url.includes('/api/') || request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // For navigation and static assets, serve cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
      if (!resp || resp.status !== 200) return resp;
      const respClone = resp.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
      return resp;
    })).catch(() => caches.match('/index.html'))
  );
});
