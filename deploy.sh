#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/root/TA-Portfolio"
APP_NAME="ta-portfolio"
BRANCH="main"
DB_PATH="$APP_DIR/apps/api/database.sqlite3"
BACKUP_DIR="$APP_DIR/backups"

echo "==> Starting deploy"
cd "$APP_DIR"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
  TS="$(date +%F-%H%M%S)"
  echo "==> Backing up database"
  cp "$DB_PATH" "$BACKUP_DIR/dev.db.$TS"
fi

echo "==> Fetching latest code from GitHub"
git fetch origin
git reset --hard "origin/$BRANCH"

echo "==> Installing dependencies"
npm install

echo "==> Building app"
npm run build

echo "==> Restarting PM2 process: $APP_NAME"
pm2 restart "$APP_NAME"
pm2 save

echo "==> Running health check"
sleep 2
curl -fsS http://127.0.0.1:3021/api/health

echo "==> Deploy complete"
git rev-parse --short HEAD