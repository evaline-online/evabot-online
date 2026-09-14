const CACHE_VERSION = 'v2';
const STATIC_CACHE = `evabot-static-${CACHE_VERSION}`;
const HTML_CACHE = `evabot-html-${CACHE_VERSION}`;
const IMAGE_CACHE = `evabot-images-${CACHE_VERSION}`;
const FONT_CACHE = `evabot-fonts-${CACHE_VERSION}`;
const MANIFEST_CACHE = `evabot-manifest-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/index.html',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/manifest.webmanifest',
];

const OFFLINE_URL = '/offline.html';

const API_PATHS = [
  '/api/health',
  '/api/models/',
];

function isApiRequest(url) {
  return API_PATHS.some(path => url.pathname.startsWith(path));
}

function isStaticAsset(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname === '/manifest.webmanifest'
  );
}

function isImageRequest(url) {
  const pathname = url.pathname;
  return (
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) !== null
  );
}

function isHtmlRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
}

async function cacheFirstStrategy(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    if (maxAge) {
      const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
      const age = Date.now() - cachedDate.getTime();
      if (age < maxAge) {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      if (maxAge) {
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cache-date', Date.now().toString());
        const responseWithDate = new Response(await responseToCache.blob(), {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });
        await cache.put(request, responseWithDate);
      } else {
        await cache.put(request, responseToCache);
      }
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (isHtmlRequest(request)) {
      const offlineResponse = await cache.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

async function handleInstall(event) {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      
      const offlineCache = await caches.open(HTML_CACHE);
      await offlineCache.add(OFFLINE_URL);
      
      await self.skipWaiting();
      await self.clients.claim();
    })()
  );
}

async function handleActivate(event) {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCaches = [
        STATIC_CACHE,
        HTML_CACHE,
        IMAGE_CACHE,
        FONT_CACHE,
        MANIFEST_CACHE,
      ];
      
      await Promise.all(
        cacheNames
          .filter(name => !validCaches.includes(name))
          .map(name => caches.delete(name))
      );
      
      await self.clients.claim();
    })()
  );
}

async function handleFetch(event) {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') {
    return;
  }
  
  if (isApiRequest(url)) {
    return;
  }
  
  if (url.origin !== location.origin && !url.href.startsWith('https://fonts.googleapis.com') && !url.href.startsWith('https://fonts.gstatic.com')) {
    return;
  }
  
  if (isHtmlRequest(request)) {
    event.respondWith(networkFirstStrategy(request, HTML_CACHE));
    return;
  }
  
  if (url.pathname === '/manifest.webmanifest') {
    event.respondWith(cacheFirstStrategy(request, MANIFEST_CACHE));
    return;
  }
  
  if (isStaticAsset(url)) {
    if (url.href.startsWith('https://fonts.googleapis.com') || url.href.startsWith('https://fonts.gstatic.com')) {
      event.respondWith(cacheFirstStrategy(request, FONT_CACHE));
    } else {
      event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    }
    return;
  }
  
  if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000));
    return;
  }
  
  // Text files (manifesto.txt, etc.) - network first, no cache
  if (url.pathname.endsWith(".txt")) {
    event.respondWith(networkFirstStrategy(request, HTML_CACHE));
    return;
  }
  
  event.respondWith(staleWhileRevalidateStrategy(request, STATIC_CACHE));
}

self.addEventListener('install', handleInstall);
self.addEventListener('activate', handleActivate);
self.addEventListener('fetch', handleFetch);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
