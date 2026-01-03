
const CACHE_NAME = 'apple-harvest-v5';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://i.postimg.cc/P5Gqt83s/Red-Apple-Icon.png',
  'https://i.postimg.cc/tRK1gf7C/Red-Apple-Shortcut.png',
  'https://i.postimg.cc/nc3MbVTw/Apple.jpg',
  'https://i.postimg.cc/rFjWN5Jg/Green-Apple.jpg'
];

// Install: Pre-cache critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy for remote images (Cache-First)
  if (url.hostname.includes('postimg.cc')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Strategy for App Shell & Scripts (Stale-While-Revalidate)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse;
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});
