#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Deploy: admin-check-frontend"
echo "==> Directory: $APP_DIR"

if [ ! -f .env.production ]; then
  if [ -f .env.production.example ]; then
    cp .env.production.example .env.production
    echo "Yangi .env.production yaratildi (.env.production.example dan)."
  fi
fi

mkdir -p logs

echo "==> npm install"
npm ci

echo "==> build (production)"
npm run build

echo "==> PM2 restart"
if pm2 describe admin-check-frontend >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

FRONTEND_PORT=$(grep -E '^PORT=' .env.production 2>/dev/null | cut -d= -f2 || echo 3007)

echo ""
echo "Deploy tugadi."
echo "Admin panel: http://38.247.134.248:${FRONTEND_PORT}"
echo "PM2 status: pm2 status"
echo "Logs: pm2 logs admin-check-frontend"
