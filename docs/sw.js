/* 自动生成，请勿手改；由 tools/build-pwa.js 生成 */
const CACHE = 'meru-465d7b6f37fc';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(CORE); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 页面导航：应用外壳优先（离线也能打开）
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(function (cached) {
        return cached || fetch(req).catch(function () { return caches.match('./index.html'); });
      })
    );
    return;
  }

  // 同源静态资源：缓存优先
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  // 跨域 CDN（pdf.js / mammoth / tesseract）：网络优先，失败回退缓存
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, clone); });
      }
      return res;
    }).catch(function () { return caches.match(req); })
  );
});
