const CACHE_NAME = 'aptechka-sw-v1';

// Храним расписание в памяти SW
let schedules = [];
let timers = [];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Принимаем сообщения от приложения
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_SCHEDULES') {
    schedules = event.data.schedules || [];
    resetTimers();
  }
});

function resetTimers() {
  timers.forEach(t => clearTimeout(t));
  timers = [];
  scheduleForToday();
}

function scheduleForToday() {
  const now = new Date();
  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = DAY_KEYS[now.getDay()];

  schedules.forEach(s => {
    if (!s.days?.[todayKey]) return;

    const [h, m] = s.time.split(':').map(Number);
    const notifTime = new Date();
    notifTime.setHours(h, m, 0, 0);

    const diff = notifTime - now;
    console.log(`[SW] Schedule: ${s.medicineName} at ${s.time}, diff=${diff}ms`);
    if (diff <= 0) {
      console.log(`[SW] Skipped (already passed): ${s.medicineName}`);
      return;
    }

    const timer = setTimeout(async () => {
      // Уведомляем клиента чтобы он записал в активность
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => c.postMessage({
        type: 'MEDICINE_REMINDER',
        scheduleId: s.id,
        medicineName: s.medicineName,
        time: s.time
      }));

      self.registration.showNotification('💊 Время принять лекарство', {
        body: `${s.medicineName} — ${s.time}`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: `med-${s.id}`,
        requireInteraction: true,
        actions: [
          { action: 'taken', title: '✓ Принял' },
          { action: 'dismiss', title: 'Закрыть' }
        ]
      });
    }, diff);

    timers.push(timer);
  });

  // Перезапускаем в полночь для следующего дня
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const tillMidnight = midnight - now;
  const midnightTimer = setTimeout(() => {
    scheduleForToday();
  }, tillMidnight);
  timers.push(midnightTimer);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'taken') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          clients[0].focus();
          clients[0].postMessage({ type: 'MARK_TAKEN', scheduleId: event.notification.tag.replace('med-', '') });
        } else {
          self.clients.openWindow('/calendar');
        }
      })
    );
  }
});
