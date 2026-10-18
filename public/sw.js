/* Service worker independente do build. Escopo: /icones-quiz/. */
const CACHE = 'icones-shell-v1';
const BASE = new URL(self.registration.scope).pathname;
const shell = [BASE, BASE + 'manifest.webmanifest', BASE + 'favicon.svg',
  BASE + 'icons/icon-192.png', BASE + 'icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch(BASE, {cache: 'reload'});
    if (!page.ok) throw new Error('Falha ao preparar aplicação offline');
    await cache.put(BASE, page.clone());
    const html = await page.text();
    const assets = [...html.matchAll(/(?:src|href)=["'](\/icones-quiz\/assets\/[^"']+)["']/g)]
      .map((match) => match[1]);
    await cache.addAll([...new Set([...shell.slice(1), ...assets])]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter((key) => key.startsWith('icones-shell-') && key !== CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        if (response.ok) (await caches.open(CACHE)).put(BASE, response.clone());
        return response;
      } catch {
        return (await caches.match(BASE)) || Response.error();
      }
    })());
    return;
  }
  if (url.pathname.startsWith(BASE + 'assets/') || url.pathname.startsWith(BASE + 'icons/')
    || url.pathname === BASE + 'favicon.svg' || url.pathname === BASE + 'manifest.webmanifest') {
    event.respondWith((async () => {
      const saved = await caches.match(req);
      if (saved) return saved;
      const response = await fetch(req);
      if (response.ok) (await caches.open(CACHE)).put(req, response.clone());
      return response;
    })());
  }
});
