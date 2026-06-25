// Service Worker - 人工管理システム
// バージョンを変えるだけで全端末が自動更新される
const CACHE_VERSION = 'toa-v1';
const CACHE_NAME = `toa-ninku-${CACHE_VERSION}`;

// キャッシュするファイル
const CACHE_FILES = [
  './',
  './index.html'
];

// インストール時：新しいキャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
  // 即座に新しいService Workerを有効化
  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  // 即座に全クライアントを制御
  self.clients.claim();
});

// ネットワークリクエスト：常にネットワーク優先、失敗時はキャッシュ
self.addEventListener('fetch', event => {
  // GASへのリクエストはキャッシュしない
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 正常なレスポンスをキャッシュに保存
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
