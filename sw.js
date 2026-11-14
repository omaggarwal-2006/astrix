/**
 * LANDFALL - Service Worker (sw.js)
 * Enables 100% offline functionality after first load over HTTP/HTTPS.
 */

const CACHE_NAME = 'landfall-v4-kinematic-engine';
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
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
