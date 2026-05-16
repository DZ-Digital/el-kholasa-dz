/**
 * =============================================================================
 * El-Kholasa DZ — Service Worker (PWA)
 * =============================================================================
 * Strategy: Stale-While-Revalidate for API calls, Cache-First for static assets
 *
 * Features:
 *   - Auto-cache: Background fetch + cache top 20 latest news clusters
 *   - Manual "Save for Later": Caches cluster HTML+assets for offline reading
 *   - Smart Push Notifications: Breaking news alerts mapped to AI SEO descriptions
 *   - Asset versioning: Cache busted on SW version update
 * =============================================================================
 */

const SW_VERSION = 'v1.0.0';
const STATIC_CACHE = `elkholasa-static-${SW_VERSION}`;
const API_CACHE = `elkholasa-api-${SW_VERSION}`;
const IMAGE_CACHE = `elkholasa-images-${SW_VERSION}`;
const OFFLINE_CACHE = `elkholasa-offline-${SW_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API routes to cache (Stale-While-Revalidate)
const API_BASE = 'https://api.elkholasa.dz';
const API_CACHE_ROUTES = [
  `${API_BASE}/api/v1/clusters`,
  `${API_BASE}/api/v1/categories`,
];

// Maximum clusters to auto-cache for offline
const AUTO_CACHE_LIMIT = 20;

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL EVENT — Pre-cache static assets
// ═══════════════════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${SW_VERSION}...`);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets pre-cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((err) => {
        console.error('[SW] Pre-cache failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT — Clean up old caches
// ═══════════════════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${SW_VERSION}...`);
  const validCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE, OFFLINE_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !validCaches.includes(name))
            .map((name) => {
              console.log(`[SW] Deleting obsolete cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Old caches purged');
        return self.clients.claim(); // Take control immediately
      })
  );

  // Trigger background sync of latest clusters after activation
  event.waitUntil(backgroundSyncClusters());
});

// ═══════════════════════════════════════════════════════════════════════════
// FETCH EVENT — Intercept all requests with smart cache strategies
// ═══════════════════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) return;

  // ── Strategy 1: Cache-First for static app assets ────────────────────
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Strategy 2: Stale-While-Revalidate for API endpoints ─────────────
  if (url.hostname === new URL(API_BASE).hostname) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // ── Strategy 3: Cache-First with network fallback for images ─────────
  if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i) ||
    url.hostname === 'images.unsplash.com' ||
    url.hostname.includes('cdn')
  ) {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE, 7 * 24 * 60 * 60)); // 7 day cache
    return;
  }

  // ── Strategy 4: Network-First for HTML pages (SPA) ───────────────────
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cache-First: Serve from cache, fall back to network
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — Resource not cached', { status: 503 });
  }
}

/**
 * Cache-First with TTL expiry check
 */
async function cacheFirstWithExpiry(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get('date');
    if (dateHeader) {
      const cachedAge = (Date.now() - new Date(dateHeader).getTime()) / 1000;
      if (cachedAge < maxAgeSeconds) return cached;
    } else {
      return cached; // No date header — serve as-is
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (cached) return cached; // Serve stale on network failure
    return new Response('Image not available offline', { status: 503 });
  }
}

/**
 * Stale-While-Revalidate: Serve cached, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || new Response(
    JSON.stringify({ error: 'Offline — no cached data available' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Network-First with offline fallback to cached app shell
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match('/') || await cache.match('/index.html');
    if (cached) return cached;
    return new Response(
      `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>غير متصل</title></head>
      <body style="font-family:Cairo,sans-serif;text-align:center;padding:4rem;background:#000;color:#F5F5F7">
        <h1>📡 غير متصل بالإنترنت</h1>
        <p>يتم تحميل المحتوى المحفوظ...</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC — Auto-cache top 20 latest clusters
// ═══════════════════════════════════════════════════════════════════════════

async function backgroundSyncClusters() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/clusters?limit=${AUTO_CACHE_LIMIT}`);
    if (!response.ok) return;

    const cache = await caches.open(API_CACHE);
    cache.put(`${API_BASE}/api/v1/clusters?limit=${AUTO_CACHE_LIMIT}`, response.clone());

    const data = await response.json();
    const clusters = data.data ?? [];

    // Pre-cache hero images for each cluster
    const imageCache = await caches.open(IMAGE_CACHE);
    const imageUrls = clusters
      .map(c => c.hero_image_url)
      .filter(Boolean)
      .slice(0, 10); // Cache first 10 images

    await Promise.allSettled(
      imageUrls.map(url =>
        fetch(url).then(r => r.ok && imageCache.put(url, r)).catch(() => {})
      )
    );

    console.log(`[SW] Auto-cached ${clusters.length} clusters and ${imageUrls.length} images`);
  } catch (err) {
    console.log('[SW] Background sync skipped (probably offline):', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS — Breaking news alerts
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'خبر عاجل', body: event.data.text(), url: '/' };
  }

  const {
    title = 'الخلاصة الجزائرية — خبر عاجل',
    body,                                        // AI-generated <150 char SEO description
    url = '/',
    icon = '/icons/icon-192.png',
    badge = '/icons/icon-72.png',
    category = 'breaking',
    cluster_slug,
  } = payload;

  const notificationOptions = {
    body,
    icon,
    badge,
    tag: cluster_slug || `news-${Date.now()}`,  // Prevents duplicate notifications
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {
      url: cluster_slug ? `/?cluster=${cluster_slug}` : url,
      cluster_slug,
      category,
    },
    actions: [
      {
        action: 'read',
        title: 'اقرأ الآن',
        icon: '/icons/icon-72.png',
      },
      {
        action: 'dismiss',
        title: 'إغلاق',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        const existingClient = clients.find(c => c.url === targetUrl);
        if (existingClient) {
          return existingClient.focus();
        }
        // Otherwise open new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER — Receive commands from the PWA
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  const { type, payload } = event.data ?? {};

  switch (type) {
    case 'SAVE_CLUSTER': {
      // Manual "Save for Later" — cache cluster data
      event.waitUntil(saveClusterOffline(payload));
      break;
    }
    case 'REMOVE_CLUSTER': {
      event.waitUntil(removeClusterFromCache(payload.slug));
      break;
    }
    case 'FORCE_SYNC': {
      event.waitUntil(backgroundSyncClusters());
      break;
    }
    case 'GET_CACHE_SIZE': {
      getCacheSize().then(size => {
        event.ports[0]?.postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
    }
    default:
      break;
  }
});

/**
 * Cache a cluster's data for offline reading
 */
async function saveClusterOffline(cluster) {
  if (!cluster?.slug) return;
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const clusterData = new Response(JSON.stringify(cluster), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(`/offline/cluster/${cluster.slug}`, clusterData);

    // Also cache the hero image if available
    if (cluster.hero_image_url) {
      const imgResponse = await fetch(cluster.hero_image_url).catch(() => null);
      if (imgResponse?.ok) {
        const imgCache = await caches.open(IMAGE_CACHE);
        imgCache.put(cluster.hero_image_url, imgResponse);
      }
    }

    console.log(`[SW] Cluster "${cluster.slug}" saved for offline reading`);
  } catch (err) {
    console.error('[SW] Failed to save cluster offline:', err);
  }
}

/**
 * Remove a cluster from the offline cache
 */
async function removeClusterFromCache(slug) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.delete(`/offline/cluster/${slug}`);
    console.log(`[SW] Cluster "${slug}" removed from offline cache`);
  } catch (err) {
    console.error('[SW] Failed to remove cluster from cache:', err);
  }
}

/**
 * Get approximate total cache size
 */
async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage } = await navigator.storage.estimate();
    return usage;
  }
  return null;
}
