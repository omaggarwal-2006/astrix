/**
 * LANDFALL - Service Worker (sw.js)
 * Network-first caching strategy for real-time development and 100% offline fallback.
 */

const CACHE_NAME = 'landfall-v5-network-first';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './lib/chart.umd.min.js',
  './fonts/saira-condensed.woff2',
  './fonts/hanken-grotesk.woff2',
  './adapter.js',
  './pipeline.js',
  './queue.js',
  './packet.js',
  './triage.js',
  './sources.js',
  './sample_alert.js',
  './sample/sample_data.js',
  './js/mission-scene.js',
  './js/constellation.js',
  './js/cone-renderer.js',
  './js/twin-model.js',
  './main.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network first: always fetch fresh from server, fall back to offline cache
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
