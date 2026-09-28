/* ============================================================
   타이핑 마스터 — 서비스 워커 (오프라인 실행)
   https 또는 localhost 에서만 등록됩니다.
   ============================================================ */
const CACHE = 'typing-master-v1.0.2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/words.js',
  './js/sound.js',
  './js/keyboard.js',
  './js/game.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
  /* 스크린샷은 설치 화면·스토어 전용이라 미리 받아두지 않는다 (첫 설치 용량 절약) */
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      /* 일부 파일이 없어도 설치가 통째로 실패하지 않게 개별 처리 */
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   /* 외부 요청은 그대로 통과 */

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
