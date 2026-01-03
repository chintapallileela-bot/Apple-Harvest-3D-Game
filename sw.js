
const CACHE_NAME = 'apple-harvest-v15';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'sw.js',
  'https://cdn.tailwindcss.com',
  'https://i.postimg.cc/P5Gqt83s/Red-Apple-Icon.png',
  'https://i.postimg.cc/nc3MbVTw/Apple.jpg',
  'https://i.postimg.cc/rFjWN5Jg/Green-Apple.jpg'
];

// Install Event: Cache essential assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      // Use strictly relative paths to ensure they resolve within the current subdomain/origin
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Pre-cache failed for some assets:', err);
      });
    })
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch Event: Robust Cache-First with Network Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache new successful GET requests
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return new Response('Offline content unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
