/**
 * LANDFALL - Service Worker (sw.js)
 *
 * Network-first for same-origin GET requests, with an offline cache fallback.
 * The list of files to pre-cache is generated into src/sw-manifest.js by
 * scripts/build-sw-manifest.mjs (run `npm run build:sw` after adding or moving files).
 * This file must stay at the repo root so it controls the whole site.
 */

importScripts('./src/sw-manifest.js');   // defines self.LANDFALL_ASSETS

const CACHE_NAME = 'landfall-v10-unified-ml';
const ASSETS_TO_CACHE = self.LANDFALL_ASSETS || ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      // Cache files one by one: a single missing file must not break offline mode
      .then((cache) => Promise.allSettled(ASSETS_TO_CACHE.map((url) => cache.add(url))))
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed) console.warn(`[sw] ${failed} of ${ASSETS_TO_CACHE.length} files could not be cached`);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only handle same-origin GET requests; let everything else go straight to the network
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.destination === 'document') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
