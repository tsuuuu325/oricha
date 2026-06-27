// sw.js — オフライン起動用の最小キャッシュ
// 注意: Service Worker は「アプリを閉じた状態でのGPS追跡」はできない。
// あくまでオフライン起動とインストール可能化のための役割。
const CACHE = "oricha-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./stations.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML（ナビゲーション）はネットワーク優先にして、デプロイ後すぐ新しい内容に更新されるようにする。
// それ以外の静的アセットはキャッシュ優先（オフライン起動用）。
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
