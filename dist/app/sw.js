const CACHE = 'four-du-canal-app-shell-v6-email-status';
const SHELL = [
  '/app/', '/app/team.js', '/app/pwa.js', '/style.css', '/app/manifest.webmanifest',
  '/app/icons/icon-192.png', '/app/icons/icon-512.png',
  '/app/icons/icon-maskable-512.png', '/app/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of SHELL) {
      const response = await fetch(new Request(path, { credentials: 'same-origin', cache: 'reload' }));
      // Ne pas mémoriser de redirection de connexion de la plateforme.
      if (!response.ok || response.redirected) throw new Error('Ressource indisponible');
      await cache.put(path, response);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('four-du-canal-app-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Aucune interception ni mise en cache des API, des jetons ou des données Supabase.
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('Authorization')) return;
  const path = url.pathname === '/app/index.html' ? '/app/' : url.pathname;
  if (!SHELL.includes(path)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected) {
        const cache = await caches.open(CACHE);
        await cache.put(path, response.clone());
      }
      return response;
    } catch {
      const cache = await caches.open(CACHE);
      return await cache.match(path) || new Response('Connexion Internet nécessaire.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
