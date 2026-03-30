let schedules = [];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

async function broadcastToClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function showMedicineNotification(notification) {
  await self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: `med-${notification.scheduleId}`,
    requireInteraction: true,
    data: {
      scheduleId: notification.scheduleId,
      medicineName: notification.medicineName,
      time: notification.time,
      url: '/calendar'
    },
    actions: [
      { action: 'taken', title: 'Принял' },
      { action: 'dismiss', title: 'Закрыть' }
    ]
  });

  await broadcastToClients({
    type: 'MEDICINE_REMINDER',
    scheduleId: notification.scheduleId,
    medicineName: notification.medicineName,
    time: notification.time
  });
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_SCHEDULES') {
    schedules = event.data.schedules || [];
    return;
  }

  if (event.data?.type === 'SHOW_NOTIFICATION' && event.data.notification) {
    event.waitUntil(showMedicineNotification(event.data.notification));
  }
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {};

  event.waitUntil(showMedicineNotification({
    title: payload.title || 'Время принять лекарство',
    body: payload.body || 'Пора принять лекарство',
    scheduleId: String(payload.scheduleId || payload.tag || 'push'),
    medicineName: payload.medicineName || 'Лекарство',
    time: payload.time || '',
    url: payload.url || '/calendar'
  }));
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(broadcastToClients({ type: 'PUSH_SUBSCRIPTION_CHANGE' }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/calendar';

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existingClient = clients.find((client) => 'focus' in client);

    if (existingClient) {
      await existingClient.focus();
      if ('navigate' in existingClient && existingClient.url !== targetUrl) {
        await existingClient.navigate(targetUrl);
      }

      if (event.action === 'taken' && notificationData.scheduleId) {
        existingClient.postMessage({
          type: 'MARK_TAKEN',
          scheduleId: String(notificationData.scheduleId)
        });
      }
      return;
    }

    await self.clients.openWindow(targetUrl);
  })());
});
