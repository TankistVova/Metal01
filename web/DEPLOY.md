# Server update

## First deploy

1. Copy the project to the server.
2. Create `.env` рядом с `docker-compose.yml`:

```env
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_VAPID_PUBLIC_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
PUSH_TIMEZONE=Europe/Moscow
PUSH_POLL_INTERVAL_MS=60000
```

3. Запусти контейнеры:

```bash
docker compose up -d --build
```

## Update existing server

Из директории проекта на сервере:

```bash
git pull
docker compose up -d --build
```

Если нужно подчистить старые неиспользуемые образы:

```bash
docker image prune -f
```

## Check status

```bash
docker compose ps
docker compose logs web --tail=100
docker compose logs push-worker --tail=100
```

## Important

- `web` обслуживает React-приложение через `nginx`
- `push-worker` отдельно отправляет push-уведомления
- для `web` сертификаты Let's Encrypt ожидаются в `/etc/letsencrypt`
