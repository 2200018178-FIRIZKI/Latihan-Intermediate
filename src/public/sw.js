if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

const CACHE_NAME = 'ruangkisah-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/manifest.json',
  '/images/logo.png',
  // tambahkan file statis lain
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || 'Notifikasi Baru';
  const options = data.options || {
    body: 'Ada update baru!',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});