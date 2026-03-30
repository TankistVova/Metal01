# Aptechka

React-приложение с Supabase и браузерными уведомлениями о приеме лекарств.

## Основные команды

```bash
npm start
npm run build
npm test
```

## Web Push

В проект добавлена полноценная заготовка для push-уведомлений, которые могут приходить даже при закрытом сайте.

### 1. Сгенерировать VAPID-ключи

```bash
npm run push:keys
```

Сохрани значения в `.env`:

```env
REACT_APP_VAPID_PUBLIC_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
PUSH_TIMEZONE=Europe/Moscow
PUSH_POLL_INTERVAL_MS=60000
```

### 2. Подготовить таблицы в Supabase

Выполни SQL из [supabase_push_setup.sql](./supabase_push_setup.sql).

### 3. Пересобрать фронтенд

Публичный VAPID-ключ должен попасть в сборку:

```bash
npm run build
```

Если используешь Docker, `REACT_APP_VAPID_PUBLIC_KEY` уже пробрасывается через `Dockerfile` и `docker-compose.yml`.

### 4. Запустить отправку push-уведомлений

Разовая проверка:

```bash
npm run push:send
```

Постоянный воркер:

```bash
npm run push:worker
```

Или запускай `npm run push:send` каждую минуту через cron/systemd timer.

## Как это работает

- фронтенд регистрирует `service worker`
- браузер подписывается на Web Push
- подписка сохраняется в таблицу `push_subscriptions`
- скрипт `scripts/sendPushReminders.js` ищет расписания на текущую минуту
- скрипт отправляет push во все активные подписки пользователя
- `public/sw.js` показывает системное уведомление

## Важные условия

- сайт должен открываться по `HTTPS`
- для серверной отправки нужен `SUPABASE_SERVICE_ROLE_KEY`
- `push-worker` должен быть запущен отдельно от nginx-контейнера со статикой
- текущая реализация использует одну таймзону через `PUSH_TIMEZONE`
