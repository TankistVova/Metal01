const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.REACT_APP_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@projectaptechka.space';
const PUSH_TIMEZONE = process.env.PUSH_TIMEZONE || 'Europe/Moscow';
const PUSH_POLL_INTERVAL_MS = Number(process.env.PUSH_POLL_INTERVAL_MS || 60000);
const WATCH_MODE = process.argv.includes('--watch');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function formatNowParts(date = new Date(), timeZone = PUSH_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const weekdayMap = {
    Sun: 'sun',
    Mon: 'mon',
    Tue: 'tue',
    Wed: 'wed',
    Thu: 'thu',
    Fri: 'fri',
    Sat: 'sat'
  };

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    dayKey: weekdayMap[parts.weekday]
  };
}

async function loadDueSchedules(nowParts) {
  const { data, error } = await supabase
    .from('medicine_schedules')
    .select('id, user_id, time, days, medicines(name)')
    .eq('time', nowParts.time);

  if (error) {
    throw error;
  }

  return (data || []).filter((schedule) => schedule.days?.[nowParts.dayKey]);
}

async function wasAlreadySent(schedule, nowParts) {
  const { data, error } = await supabase
    .from('push_notification_logs')
    .select('id')
    .eq('user_id', schedule.user_id)
    .eq('schedule_id', schedule.id)
    .eq('scheduled_for', nowParts.date)
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data?.length);
}

async function loadSubscriptions(userId) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data || [];
}

async function removeSubscription(endpoint) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Push Worker] Failed to remove expired subscription:', error.message);
  }
}

async function createLog(schedule, nowParts, sentCount) {
  const { error } = await supabase
    .from('push_notification_logs')
    .insert([{
      user_id: schedule.user_id,
      schedule_id: schedule.id,
      scheduled_for: nowParts.date,
      sent_count: sentCount
    }]);

  if (error) {
    throw error;
  }
}

async function sendScheduleReminder(schedule, nowParts) {
  if (await wasAlreadySent(schedule, nowParts)) {
    return { skipped: true, sent: 0 };
  }

  const subscriptions = await loadSubscriptions(schedule.user_id);
  if (!subscriptions.length) {
    return { skipped: true, sent: 0 };
  }

  let sentCount = 0;
  const payload = JSON.stringify({
    title: 'Время принять лекарство',
    body: `${schedule.medicines?.name || 'Лекарство'} - ${schedule.time}`,
    scheduleId: String(schedule.id),
    medicineName: schedule.medicines?.name || 'Лекарство',
    time: schedule.time,
    url: '/calendar'
  });

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        payload
      );
      sentCount += 1;
    } catch (error) {
      const statusCode = error.statusCode || error.status;
      console.error(`[Push Worker] Failed to send push to ${subscription.endpoint}:`, error.body || error.message);

      if (statusCode === 404 || statusCode === 410) {
        await removeSubscription(subscription.endpoint);
      }
    }
  }

  if (sentCount > 0) {
    await createLog(schedule, nowParts, sentCount);
  }

  return { skipped: false, sent: sentCount };
}

async function runOnce() {
  const nowParts = formatNowParts();
  const dueSchedules = await loadDueSchedules(nowParts);

  if (!dueSchedules.length) {
    console.log(`[Push Worker] No schedules due at ${nowParts.date} ${nowParts.time} (${PUSH_TIMEZONE})`);
    return;
  }

  let totalSent = 0;

  for (const schedule of dueSchedules) {
    const result = await sendScheduleReminder(schedule, nowParts);
    totalSent += result.sent;
  }

  console.log(
    `[Push Worker] Processed ${dueSchedules.length} schedules at ${nowParts.date} ${nowParts.time} (${PUSH_TIMEZONE}), sent ${totalSent} pushes`
  );
}

async function main() {
  await runOnce();

  if (!WATCH_MODE) {
    return;
  }

  console.log(`[Push Worker] Watch mode enabled, polling every ${PUSH_POLL_INTERVAL_MS}ms`);
  setInterval(() => {
    runOnce().catch((error) => {
      console.error('[Push Worker] Iteration failed:', error);
    });
  }, PUSH_POLL_INTERVAL_MS);
}

main().catch((error) => {
  console.error('[Push Worker] Fatal error:', error);
  process.exit(1);
});
