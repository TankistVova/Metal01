const CHECK_INTERVAL_MS = 30000;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const NOTIFIED_STORAGE_KEY = 'aptechka-notified-schedules';
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

let schedulerInterval = null;
let visibilityHandlerBound = false;
let currentSchedules = [];
let currentUserId = null;
let pushSubscriptionSynced = false;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function normalizeSubscription(subscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime || null,
    p256dh: json.keys?.p256dh || null,
    auth: json.keys?.auth || null
  };
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    reg.update?.();
    console.log('[SW] Registered:', reg.scope);
  } catch (e) {
    console.error('[SW] Registration failed:', e);
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (e) {
    console.error('[Notification] Permission request failed:', e);
    return false;
  }
}

async function syncPushSubscription(userId, supabase) {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const payload = normalizeSubscription(subscription);
    const { error } = await supabase.from('push_subscriptions').upsert(
      [{
        user_id: userId,
        endpoint: payload.endpoint,
        expiration_time: payload.expirationTime,
        p256dh: payload.p256dh,
        auth: payload.auth,
        user_agent: navigator.userAgent
      }],
      { onConflict: 'endpoint' }
    );

    if (error) {
      throw error;
    }

    pushSubscriptionSynced = true;
  } catch (e) {
    console.error('[Push] Subscription sync failed:', e);
  }
}

export async function disablePushSubscription(userId, supabase) {
  if (!isPushSupported()) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint)
        .eq('user_id', userId);

      await subscription.unsubscribe();
    }
  } catch (e) {
    console.error('[Push] Failed to disable subscription:', e);
  }
}

function getTodayKey(now = new Date()) {
  return DAY_KEYS[now.getDay()];
}

function getStorageDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function readNotifiedMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeNotifiedMap(map) {
  localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(map));
}

function wasNotifiedToday(scheduleId, now = new Date()) {
  const map = readNotifiedMap();
  const today = getStorageDate(now);
  return Array.isArray(map[today]) && map[today].includes(String(scheduleId));
}

function markNotifiedToday(scheduleId, now = new Date()) {
  const map = readNotifiedMap();
  const today = getStorageDate(now);

  Object.keys(map).forEach((dateKey) => {
    if (dateKey !== today) delete map[dateKey];
  });

  const todayItems = new Set((map[today] || []).map(String));
  todayItems.add(String(scheduleId));
  map[today] = Array.from(todayItems);

  writeNotifiedMap(map);
}

function isScheduleDue(schedule, now = new Date()) {
  const todayKey = getTodayKey(now);
  if (!schedule.days?.[todayKey]) return false;
  if (!schedule.time || wasNotifiedToday(schedule.id, now)) return false;

  const [hours, minutes] = schedule.time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;

  return now.getHours() === hours && now.getMinutes() === minutes;
}

async function showReminder(schedule) {
  const title = 'Время принять лекарство';
  const body = `${schedule.medicineName} - ${schedule.time}`;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          title,
          body,
          scheduleId: String(schedule.id),
          medicineName: schedule.medicineName,
          time: schedule.time
        }
      });
      return;
    }
  } catch (e) {
    console.error('[SW] showReminder via service worker failed:', e);
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo192.png'
    });
  }
}

async function processDueSchedules() {
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const dueSchedules = currentSchedules.filter((schedule) => isScheduleDue(schedule, now));

  for (const schedule of dueSchedules) {
    markNotifiedToday(schedule.id, now);
    await showReminder(schedule);
  }
}

function ensureVisibilityRefresh(supabase) {
  if (visibilityHandlerBound || typeof document === 'undefined') return;

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && currentUserId) {
      void syncNotificationSchedules(currentUserId, supabase);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);
  visibilityHandlerBound = true;
}

export async function sendSchedulesToSW(schedules) {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'SET_SCHEDULES', schedules });
  } catch (e) {
    console.error('[SW] sendSchedulesToSW error:', e);
  }
}

async function syncNotificationSchedules(userId, supabase) {
  const { data, error } = await supabase
    .from('medicine_schedules')
    .select('id, time, days, medicines(name, icon)')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  currentSchedules = (data || []).map((schedule) => ({
    id: schedule.id,
    medicineName: schedule.medicines?.name || 'Лекарство',
    time: schedule.time,
    days: schedule.days || {}
  }));

  await sendSchedulesToSW(currentSchedules);
  await processDueSchedules();
}

function startScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  schedulerInterval = window.setInterval(() => {
    void processDueSchedules();
  }, CHECK_INTERVAL_MS);
}

export async function initNotifications(userId, supabase) {
  currentUserId = userId;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    await syncNotificationSchedules(userId, supabase);
    if (!pushSubscriptionSynced) {
      await syncPushSubscription(userId, supabase);
    }
    startScheduler();
    ensureVisibilityRefresh(supabase);
    console.log('[Notification] Scheduler initialized');
  } catch (e) {
    console.error('[Notification] initNotifications error:', e);
  }
}

export async function refreshNotifications(userId, supabase) {
  currentUserId = userId;

  try {
    await syncNotificationSchedules(userId, supabase);
    startScheduler();
  } catch (e) {
    console.error('[Notification] refreshNotifications error:', e);
  }
}
