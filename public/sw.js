/* Service Worker لتطبيق سبايك: صفحة أوفلاين + تسريع الملفات الثابتة. مفيش تخزين للـ API أو للصفحات الديناميكية عشان البيانات تفضل حديثة. */
const V = 'spike-v1';
const STATIC = V + '-static';
const OFFLINE = '/offline.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE, '/brand/icon-192.png?v=2'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(V)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/')) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).catch(() => caches.match(OFFLINE)));
    return;
  }
  /* ملفات ثابتة بتتغير اسمها مع كل نسخة (hash)، أو صور الهوية */
  if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/brand/')) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(r);
      if (hit) return hit;
      const res = await fetch(r);
      if (res && res.ok) c.put(r, res.clone());
      return res;
    }));
  }
});
