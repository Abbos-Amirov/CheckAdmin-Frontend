#!/usr/bin/env bash
# Birinchi marta serverda ishga tushirish (Node 18+, PM2 o'rnatilgan bo'lishi kerak)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Server setup: admin-check-frontend"

if ! command -v node >/dev/null 2>&1; then
  echo "XATO: Node.js topilmadi. Avval Node 18+ o'rnating."
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> PM2 o'rnatilmoqda..."
  npm install -g pm2
fi

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo ""
  echo "MUHIM: .env.production yaratildi. Kerak bo'lsa PORT va API_PROXY_TARGET ni tekshiring."
  echo ""
fi

bash scripts/deploy.sh

echo ""
echo "Server rebootdan keyin avtomatik start uchun:"
echo "  pm2 startup"
echo "  pm2 save"
