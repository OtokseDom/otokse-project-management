#!/bin/bash
# Project entrypoint — runs inside project_backend (php-fpm, no nginx).
# 1. Wait for MySQL to accept connections (compose also gates via service_healthy).
# 2. Run migrations (empty-DB strategy: schema from migrations; data from
#    MasterDataGeneratorService at signup — no seeder runs here).
# 3. Refresh route/view caches, then exec php-fpm in the foreground.
set -e

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"

echo "[entrypoint] waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
for i in $(seq 1 30); do
  if php -r "\$c=@new mysqli(getenv('DB_HOST')?:'mysql',getenv('DB_USERNAME')?:'root',getenv('DB_PASSWORD')?:'', '', (int)(getenv('DB_PORT')?:3306)); exit(\$c->connect_errno?1:0);" 2>/dev/null; then
    echo "[entrypoint] MySQL reachable."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[entrypoint] ERROR: MySQL not reachable after 30 tries — starting php-fpm anyway."
  fi
  sleep 2
done

echo "[entrypoint] running migrations..."
php artisan migrate --force || echo "[entrypoint] WARNING: migrate --force failed — check DB_* env."

echo "[entrypoint] refreshing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan route:cache
php artisan view:cache

echo "[entrypoint] linking storage..."
php artisan storage:link || true

echo "[entrypoint] starting: $*"
exec "$@"
