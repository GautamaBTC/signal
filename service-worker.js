// SIGNAL — Service Worker v1.0
// Offline support & asset caching

const CACHE_NAME = 'signal-cache-v3';
const CACHE_STATIC = 'signal-static-v3';
const CACHE_MEDIA = 'signal-media-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/hud-ring.svg',
  './assets/hud-corners.svg',
  './assets/route.svg',
  './assets/timeline.svg',
  './assets/signal-pulse.svg'
];

const MEDIA_ASSETS = [
  './assets/signal.mp4'
];

// ─── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SIGNAL SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(cache => {
        console.log('[SIGNAL SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      caches.open(CACHE_MEDIA).then(cache => {
        console.log('[SIGNAL SW] Attempting to cache media');
        return Promise.allSettled(
          MEDIA_ASSETS.map(url =>
            cache.add(new Request(url, { cache: 'reload' })).catch(err => {
              console.warn('[SIGNAL SW] Could not cache media:', url, err);
            })
          )
        );
      })
    ]).then(() => {
      console.log('[SIGNAL SW] Install complete');
      return self.skipWaiting();
    })
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SIGNAL SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_STATIC && name !== CACHE_MEDIA && name !== CACHE_NAME)
          .map(name => {
            console.log('[SIGNAL SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SIGNAL SW] Activate complete');
      return self.clients.claim();
    })
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Media files — cache-first with range support
  if (url.pathname.endsWith('.mp4')) {
    event.respondWith(handleMediaRequest(event.request));
    return;
  }

  // Static assets — cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Update cache in background
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_STATIC).then(cache => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache — fetch from network
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_STATIC).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ─── Media Handler ─────────────────────────────────────────────────────────────
async function handleMediaRequest(request) {
  try {
    const cache = await caches.open(CACHE_MEDIA);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Media unavailable offline', { status: 503 });
  }
}

// ─── Push notifications (future) ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'SIGNAL', {
    body: data.body || 'New signal received',
    icon: './assets/signal-pulse.svg',
    badge: './assets/signal-pulse.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || './' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || './')
  );
});
