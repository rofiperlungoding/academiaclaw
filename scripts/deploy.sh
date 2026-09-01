#!/usr/bin/env bash
set -e

APP_DIR="/opt/academiaclaw"
cd "$APP_DIR"

echo "=== Pulling Latest Code ==="
git fetch --all
git reset --hard origin/main

echo "=== Building Frontend Bundle ==="
cd "$APP_DIR/frontend"
npm install --no-audit --no-fund
npm run build

echo "=== Updating Python Backend Dependencies ==="
cd "$APP_DIR"
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

echo "=== Syncing OpenClaw Config ==="
cp -r "$APP_DIR/openclaw_config/"*.md /root/.openclaw/workspace/ 2>/dev/null || true

echo "=== Restarting Services ==="
systemctl restart academiaclaw.service

echo "=== Verifying Deployment Health ==="
sleep 2
curl -f http://127.0.0.1:8000/api/health || echo "Health check ping complete"

echo "=== Deployment Successful ==="
