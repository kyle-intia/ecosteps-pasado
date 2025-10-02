self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};

  const title = data.title || 'New Notification';
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  const url = event.notification.data.url || '/';
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
