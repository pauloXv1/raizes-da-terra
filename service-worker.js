// N?o armazena dados privados nem pre?os offline.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('vendas-')).map(n=>caches.delete(n)));await self.clients.claim();})()));
