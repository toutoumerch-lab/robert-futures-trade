#!/bin/bash
# Run this script ON the DigitalOcean droplet as root (or sudo)
# Usage: bash deploy.sh

set -e

APP_DIR="/var/www/trades"
REPO_URL="https://github.com/nourabdelllaoui/trades.git"   # update if different

echo "=== [1/8] Updating system packages ==="
apt-get update -y && apt-get upgrade -y

echo "=== [2/8] Installing Node.js 20, Nginx, PostgreSQL ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx postgresql postgresql-contrib git

echo "=== [3/8] Installing PM2 globally ==="
npm install -g pm2

echo "=== [4/8] Cloning / pulling repository ==="
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  mkdir -p /var/www
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "=== [5/8] Installing server dependencies ==="
cd "$APP_DIR/server"
npm install --omit=dev

echo "=== [6/8] Building React frontend ==="
cd "$APP_DIR/client"
npm install --legacy-peer-deps
npm run build

echo "=== [7/8] Configuring Nginx ==="
cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/trades
ln -sf /etc/nginx/sites-available/trades /etc/nginx/sites-enabled/trades
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== [8/8] Starting API with PM2 ==="
cd "$APP_DIR"
pm2 delete trades-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo ""
echo "======================================"
echo "  Deployment complete!"
echo "  Site: http://165.227.214.126"
echo "  API:  http://165.227.214.126/api"
echo "======================================"
echo ""
echo "IMPORTANT: Make sure server/.env exists with production values."
echo "Run: nano $APP_DIR/server/.env"
