
const CACHE_NAME = 'apple-harvest-v13';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://i.postimg.cc/P5Gqt83s/Red-Apple-Icon.png'
];

// Install Event: Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      // Use addAll for speed, but individual adds would be more resilient if one fails
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] One or more assets failed to cache, proceeding anyway:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch Event: Optimized strategy for reliability
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Otherwise, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Only cache valid basic responses from same origin or trusted CDN
        const isSuccessful = networkResponse && networkResponse.status === 200;
        const isBasicOrCORS = networkResponse.type === 'basic' || networkResponse.type === 'cors';

        if (isSuccessful && isBasicOrCORS) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Offline Fallback logic
        if (event.request.mode === 'navigate') {
          return caches.match('index.html') || caches.match('./');
        }
        return null;
      });
    })
  );
});
