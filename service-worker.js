const CACHE_NAME = 'woordenboek-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// The app's HTML gets updated regularly, so it must always be network-first:
// fetch it fresh whenever online, and only fall back to the cached copy when
// offline. Cache-first stays for static assets (icons, manifest) that rarely
// change. This is what makes future index.html updates show up immediately
// without needing to clear the cache by hand every time.
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;

  const isHtmlRequest = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if(isHtmlRequest){
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      }).catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if(cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      }).catch(() => cached);
    })
  );
});
