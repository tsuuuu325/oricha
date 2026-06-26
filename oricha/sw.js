// sw.js — オフライン起動用の最小キャッシュ
// 注意: Service Worker は「アプリを閉じた状態でのGPS追跡」はできない。
// あくまでオフライン起動とインストール可能化のための役割。
const CACHE = "oricha-v1";
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

// キャッシュ優先（無ければネットワーク）
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
