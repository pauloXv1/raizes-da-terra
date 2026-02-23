// const CACHE_NAME = 'vendas-v2'; 
// const urlsToCache = [
//   '/',
//   '/index.html',
//   '/style.css',
//   '/script-supabase.js',
//   'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
// ];

// self.addEventListener('install', (event) => {
//   console.log('Service Worker: Instalando...');
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(urlsToCache);
//     })
//   );
//   self.skipWaiting();
// });

// self.addEventListener('activate', (event) => {
//   console.log('Service Worker: Ativando...');
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cache) => {
//           if (cache !== CACHE_NAME) {
//             console.log('Service Worker: Limpando cache antigo:', cache);
//             return caches.delete(cache);
//           }
//         })
//       );
//     })
//   );
//   self.clients.claim();
// });

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     fetch(event.request)
//       .then((networkResponse) => {
//         const responseClone = networkResponse.clone();
//         caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, responseClone);
//         });
//         return networkResponse;
//       })
//       .catch(() => {
//         return caches.match(event.request);
//       })
//   );
// });


// Versão que limpa tudo e não faz cache de nada
const CACHE_NAME = 'vendas-v99';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((cache) => caches.delete(cache)))
    )
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((cache) => caches.delete(cache)))
    )
  );
});

// Sem cache — sempre busca da internet
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});