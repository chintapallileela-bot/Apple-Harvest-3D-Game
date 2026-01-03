
const CACHE_NAME = 'apple-harvest-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://i.postimg.cc/nc3MbVTw/Apple.jpg',
  'https://i.postimg.cc/rFjWN5Jg/Green-Apple.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((networkResponse) => {
        // Cache new static assets or images on the fly
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (event.request.url.includes('postimg.cc') || event.request.url.includes('esm.sh'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline if no network
        return cachedResponse;
      });

      return cachedResponse || networkFetch;
    })
  );
});
