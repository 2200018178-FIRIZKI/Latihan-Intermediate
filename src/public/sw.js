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