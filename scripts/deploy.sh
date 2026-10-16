#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "🚀 S2S Matrimony - Production Deployment Pipeline"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================"

APP_DIR="/var/www/s2s-matrimony"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"

cd "${APP_DIR}"

# 1. Pull Latest Code
echo "📥 [1/6] Pulling latest code from Git repository..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull origin main || git pull || echo "⚠️ Git pull warning, continuing with current files..."
else
  echo "ℹ️ Not a git checkout, skipping git pull."
fi

# 2. Backend Dependencies & Prisma Generation
echo "📦 [2/6] Installing backend dependencies & generating Prisma Client..."
cd "${BACKEND_DIR}"
npm install --silent
npx prisma generate

# 3. Build Backend
echo "🔨 [3/6] Compiling backend NestJS application..."
npm run build

# 4. Safe, Idempotent Database Seeding
echo "🌱 [4/6] Running safe idempotent database plan seeding..."
node scripts/seed-elite-plans.js

# 5. Build Frontend
echo "🌐 [5/6] Building frontend client application..."
cd "${FRONTEND_DIR}"
npm install --silent
npm run build

# 6. Restart PM2 Process & Reload Nginx
echo "🔄 [6/6] Restarting backend service in PM2..."
pm2 restart s2s-backend --update-env
pm2 status s2s-backend

if command -v nginx >/dev/null 2>&1; then
  echo "♻️ Reloading Nginx..."
  nginx -s reload || systemctl reload nginx || true
fi

echo "========================================================"
echo "🎉 Deployment completed successfully!"
echo "========================================================"
