// service-worker.js

const CACHE_NAME = 'complaints-dashboard-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// تثبيت Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// جلب الملفات من الكاش أولاً، ثم من الشبكة
self.addEventListener('fetch', (event) => {
  // لا نتدخل في طلبات OneSignal أو Netlify Functions
  if (
    event.request.url.includes('onesignal.com') ||
    event.request.url.includes('/.netlify/functions/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا وُجد في الكاش، أعد استخدامه
        if (response) {
          return response;
        }
        // وإلا، اجلبه من الشبكة
        return fetch(event.request).then((networkResponse) => {
          // لا نخزن طلبات غير GET أو طلبات API
          if (
            !event.request.url.startsWith('http') ||
            event.request.method !== 'GET' ||
            event.request.url.includes('/supabase/')
          ) {
            return networkResponse;
          }

          // احفظ النسخة الجديدة في الكاش
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });

          return networkResponse;
        });
      })
  );
});

// تحديث الكاش عند التحديث
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
