
const CACHE_NAME = 'apple-harvest-v20';
const OFFLINE_URL = 'index.html';

const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'sw.js',
  'https://cdn.tailwindcss.com',
  'https://i.postimg.cc/P5Gqt83s/Red-Apple-Icon.png',
  'https://i.postimg.cc/nc3MbVTw/Apple.jpg',
  'https://i.postimg.cc/rFjWN5Jg/Green-Apple.jpg'
];

// Installation: Pre-cache everything
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation: Clean up old caches
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

// Fetch: Strategy for PWA auditors (Offline-First for navigation)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match('./');
      })
    );
    return;
  }

  // General Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for missing images/assets
        return new Response('Offline', { status: 404 });
      });
    })
  );
});
