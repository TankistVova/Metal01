export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[SW] Registered:', reg.scope);
  } catch (e) {
    console.error('[SW] Registration failed:', e);
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function sendSchedulesToSW(schedules) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return;
    reg.active.postMessage({ type: 'SET_SCHEDULES', schedules });
  } catch (e) {
    console.error('[SW] sendSchedulesToSW error:', e);
  }
}

let _initialized = false;

export async function initNotifications(userId, supabase) {
  if (_initialized) return;
  _initialized = true;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    const { data } = await supabase
      .from('medicine_schedules')
      .select('id, time, days, medicines(name, icon)')
      .eq('user_id', userId);

    if (!data?.length) return;

    const payload = data.map(s => ({
      id: s.id,
      medicineName: s.medicines?.name || 'Лекарство',
      time: s.time,
      days: s.days
    }));

    await sendSchedulesToSW(payload);
    console.log('[SW] Schedules sent:', payload);
  } catch (e) {
    console.error('[SW] initNotifications error:', e);
  }
}

// Вызывать после изменения расписания чтобы обновить SW
export async function refreshNotifications(userId, supabase) {
  _initialized = false;
  await initNotifications(userId, supabase);
}
