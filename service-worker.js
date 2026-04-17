const CACHE_NAME = 'vendas-v99';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (
    url.includes('supabase.co') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('cdnjs.') ||
    !url.startsWith('https://raizes-da-terra-eta.vercel.app')
  ) {
    return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        return cached || new Response('Offline', { status: 503 });
      }))
  );
});
