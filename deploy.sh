#!/usr/bin/env bash
# ==============================================================================
# WannaGo Deployment Script
# Target: https://v2.leadgenr.work (Edge Server: 65.109.134.191)
# ==============================================================================

set -euo pipefail

# Configuration
REMOTE_HOST="${REMOTE_HOST:-root@65.109.134.191}"
REMOTE_DIR="${REMOTE_DIR:-/opt/wannago}"
APP_URL="${APP_URL:-https://v2.leadgenr.work}"

# Resolve project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🚀 Starting WannaGo Deployment"
echo "📂 Source Directory : $SCRIPT_DIR"
echo "🌐 Remote Target    : $REMOTE_HOST:$REMOTE_DIR"
echo "🔗 Live App URL     : $APP_URL"
echo "=================================================="

# 1. Sync files to the server (hardened exclusions to preserve server secrets)
echo "📦 Step 1/3: Syncing application files via rsync..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude '*.local' \
  --exclude 'ecosystem.config.js' \
  --exclude '.DS_Store' \
  "$SCRIPT_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"

# 2. Remote build & PM2 process reload
echo "⚙️  Step 2/3: Compiling standalone build and reloading PM2 on remote server..."
ssh "$REMOTE_HOST" "bash -s" << 'EOF'
  set -euo pipefail
  cd /opt/wannago

  # Install any new dependencies if package.json changed
  npm install --legacy-peer-deps

  # Build Next.js standalone package
  npm run build

  # Synchronize static assets into the standalone bundle
  cp -r .next/static .next/standalone/.next/
  cp .env.local .next/standalone/.env.local 2>/dev/null || true
  cp .env.local .next/standalone/.env.production 2>/dev/null || true

  # Ensure strict file permissions on secrets
  chmod 600 .env.local ecosystem.config.js .next/standalone/.env.local 2>/dev/null || true

  # Reload PM2 process with updated environment
  pm2 restart wannago --update-env || pm2 start ecosystem.config.js
  pm2 save
EOF

# 3. Health check verification
echo "🩺 Step 3/3: Verifying deployment health..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/")

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Deployment Successful! $APP_URL returned HTTP $HTTP_STATUS"
else
  echo "⚠️ Warning: $APP_URL returned HTTP $HTTP_STATUS. Check PM2 logs with: ssh $REMOTE_HOST 'pm2 logs wannago --lines 30'"
fi
echo "=================================================="
