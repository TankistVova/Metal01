const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.REACT_APP_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@projectaptechka.space'
const PUSH_TIMEZONE = process.env.PUSH_TIMEZONE || 'Europe/Moscow'
const PUSH_POLL_INTERVAL_MS = Number(process.env.PUSH_POLL_INTERVAL_MS || 60000)
const WATCH_MODE = process.argv.includes('--watch')
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_PUSH_MAX_BATCH_SIZE = 100

let mobilePushTableMissingLogged = false

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

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
  })

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  const weekdayMap = {
    Sun: 'sun',
    Mon: 'mon',
    Tue: 'tue',
    Wed: 'wed',
    Thu: 'thu',
    Fri: 'fri',
    Sat: 'sat'
  }

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    dayKey: weekdayMap[parts.weekday]
  }
}

function chunkArray(items, size) {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function isMissingRelationError(error) {
  return error?.code === '42P01' || /relation .*mobile_push_tokens/i.test(error?.message || '')
}

async function loadDueSchedules(nowParts) {
  const { data, error } = await supabase
    .from('medicine_schedules')
    .select('id, user_id, time, days, medicines(name)')
    .eq('time', nowParts.time)

  if (error) {
    throw error
  }

  return (data || []).filter((schedule) => schedule.days?.[nowParts.dayKey])
}

async function wasAlreadySent(schedule, nowParts) {
  const { data, error } = await supabase
    .from('push_notification_logs')
    .select('id')
    .eq('user_id', schedule.user_id)
    .eq('schedule_id', schedule.id)
    .eq('scheduled_for', nowParts.date)
    .limit(1)

  if (error) {
    throw error
  }

  return Boolean(data?.length)
}

async function loadSubscriptions(userId) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return data || []
}

async function loadMobilePushTokens(userId) {
  const { data, error } = await supabase
    .from('mobile_push_tokens')
    .select('id, expo_push_token, project_id')
    .eq('user_id', userId)

  if (error) {
    if (isMissingRelationError(error)) {
      if (!mobilePushTableMissingLogged) {
        console.warn('[Push Worker] Table mobile_push_tokens is missing. Mobile Expo push will be skipped until the SQL setup is applied.')
        mobilePushTableMissingLogged = true
      }

      return []
    }

    throw error
  }

  return data || []
}

async function removeSubscription(endpoint) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) {
    console.error('[Push Worker] Failed to remove expired subscription:', error.message)
  }
}

async function removeMobilePushToken(token) {
  const { error } = await supabase
    .from('mobile_push_tokens')
    .delete()
    .eq('expo_push_token', token)

  if (error) {
    console.error('[Push Worker] Failed to remove expired Expo push token:', error.message)
  }
}

async function createLog(schedule, nowParts, sentCount) {
  const { error } = await supabase
    .from('push_notification_logs')
    .insert([
      {
        user_id: schedule.user_id,
        schedule_id: schedule.id,
        scheduled_for: nowParts.date,
        sent_count: sentCount
      }
    ])

  if (error) {
    throw error
  }
}

async function sendExpoPushNotifications(tokens, schedule) {
  if (!tokens.length) {
    return 0
  }

  let sentCount = 0

  const groupedTokens = tokens.reduce((accumulator, tokenRow) => {
    const groupKey = tokenRow.project_id || '__default__'
    accumulator[groupKey] = accumulator[groupKey] || []
    accumulator[groupKey].push(tokenRow)
    return accumulator
  }, {})

  for (const tokenGroup of Object.values(groupedTokens)) {
    for (const batch of chunkArray(tokenGroup, EXPO_PUSH_MAX_BATCH_SIZE)) {
      const messages = batch.map((tokenRow) => ({
        to: tokenRow.expo_push_token,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        title: 'Время принять лекарство',
        body: `${schedule.medicines?.name || 'Лекарство'} - ${schedule.time}`,
        data: {
          scheduleId: String(schedule.id),
          medicineName: schedule.medicines?.name || 'Лекарство',
          time: schedule.time,
          screen: 'calendar',
          url: 'aptechka://calendar'
        }
      }))

      try {
        const response = await fetch(EXPO_PUSH_API_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messages)
        })

        const responseBody = await response.json().catch(() => ({}))

        if (!response.ok) {
          console.error('[Push Worker] Expo push request failed:', response.status, responseBody.errors || responseBody)
          continue
        }

        const tickets = Array.isArray(responseBody.data) ? responseBody.data : [responseBody.data].filter(Boolean)

        tickets.forEach((ticket, index) => {
          const tokenRow = batch[index]

          if (!ticket || !tokenRow) {
            return
          }

          if (ticket.status === 'ok') {
            sentCount += 1
            return
          }

          console.error(
            `[Push Worker] Expo ticket error for ${tokenRow.expo_push_token}:`,
            ticket.message || ticket.details?.error || 'Unknown error'
          )

          if (ticket.details?.error === 'DeviceNotRegistered') {
            void removeMobilePushToken(tokenRow.expo_push_token)
          }
        })
      } catch (error) {
        console.error('[Push Worker] Failed to send Expo push batch:', error.message || error)
      }
    }
  }

  return sentCount
}

async function sendScheduleReminder(schedule, nowParts) {
  if (await wasAlreadySent(schedule, nowParts)) {
    return { skipped: true, sent: 0 }
  }

  const [subscriptions, mobilePushTokens] = await Promise.all([
    loadSubscriptions(schedule.user_id),
    loadMobilePushTokens(schedule.user_id)
  ])

  if (!subscriptions.length && !mobilePushTokens.length) {
    return { skipped: true, sent: 0 }
  }

  let sentCount = 0

  const payload = JSON.stringify({
    title: 'Время принять лекарство',
    body: `${schedule.medicines?.name || 'Лекарство'} - ${schedule.time}`,
    scheduleId: String(schedule.id),
    medicineName: schedule.medicines?.name || 'Лекарство',
    time: schedule.time,
    url: '/calendar'
  })

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
      )

      sentCount += 1
    } catch (error) {
      const statusCode = error.statusCode || error.status
      console.error(`[Push Worker] Failed to send push to ${subscription.endpoint}:`, error.body || error.message)

      if (statusCode === 404 || statusCode === 410) {
        await removeSubscription(subscription.endpoint)
      }
    }
  }

  sentCount += await sendExpoPushNotifications(mobilePushTokens, schedule)

  if (sentCount > 0) {
    await createLog(schedule, nowParts, sentCount)
  }

  return { skipped: false, sent: sentCount }
}

async function runOnce() {
  const nowParts = formatNowParts()
  const dueSchedules = await loadDueSchedules(nowParts)

  if (!dueSchedules.length) {
    console.log(`[Push Worker] No schedules due at ${nowParts.date} ${nowParts.time} (${PUSH_TIMEZONE})`)
    return
  }

  let totalSent = 0

  for (const schedule of dueSchedules) {
    const result = await sendScheduleReminder(schedule, nowParts)
    totalSent += result.sent
  }

  console.log(
    `[Push Worker] Processed ${dueSchedules.length} schedules at ${nowParts.date} ${nowParts.time} (${PUSH_TIMEZONE}), sent ${totalSent} pushes`
  )
}

async function main() {
  await runOnce()

  if (!WATCH_MODE) {
    return
  }

  console.log(`[Push Worker] Watch mode enabled, polling every ${PUSH_POLL_INTERVAL_MS}ms`)
  setInterval(() => {
    runOnce().catch((error) => {
      console.error('[Push Worker] Iteration failed:', error)
    })
  }, PUSH_POLL_INTERVAL_MS)
}

main().catch((error) => {
  console.error('[Push Worker] Fatal error:', error)
  process.exit(1)
})
