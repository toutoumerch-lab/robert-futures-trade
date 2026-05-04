#!/bin/bash
# ============================================================
#  Robert Trades — Full Server Setup
#  Run on a FRESH Ubuntu 24.04 DigitalOcean droplet as root
#  Usage: curl -fsSL https://raw.githubusercontent.com/toutoumerch-lab/robert-futures-trade/main/setup-server.sh | bash
# ============================================================
set -e

REPO_URL="https://github.com/toutoumerch-lab/robert-futures-trade.git"
APP_DIR="/var/www/trades"
DROPLET_IP="142.93.203.57"
DB_NAME="roberts_trades_db"
DB_USER="postgres"
DB_PASS="Tr@des2024!"
JWT_SECRET=$(openssl rand -base64 48)

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      Robert Trades — Automated Deploy        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Swap file (needed for 1 GB RAM during npm build) ───────────────────────
echo "[1/11] Creating 2 GB swap file..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 2. System update ──────────────────────────────────────────────────────────
echo "[2/11] Updating system packages..."
apt-get update -y -qq && apt-get upgrade -y -qq

# ── 3. Install Node.js 20, Nginx, PostgreSQL, git ─────────────────────────────
echo "[3/11] Installing Node.js 20, Nginx, PostgreSQL..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y nodejs nginx postgresql postgresql-contrib git > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1
echo "       Node $(node -v) | npm $(npm -v) | PM2 $(pm2 -v)"

# ── 4. Clone repo ─────────────────────────────────────────────────────────────
echo "[4/11] Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
fi
mkdir -p "$APP_DIR/server/public/uploads/avatars"

# ── 5. Create server/.env ─────────────────────────────────────────────────────
echo "[5/11] Writing server/.env..."
cat > "$APP_DIR/server/.env" <<ENV
PORT=5001
CLIENT_URL=http://${DROPLET_IP}

DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}

JWT_SECRET=${JWT_SECRET}

GMAIL_USER=noreply@roberttrades.com
GMAIL_APP_PASSWORD=cdwgiefrdjhzyxhp

OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=400
MEMORY_SIZE=10
MEMORY_TTL_MINUTES=60

TAWK_SYSTEM_PROMPT=You are a helpful and professional support agent for Robert Trades Futures. Be concise and friendly.

ADMIN_EMAIL=admin@roberttrades.com
ADMIN_PASSWORD=Admin@1234!
ENV

# ── 6. PostgreSQL setup ───────────────────────────────────────────────────────
echo "[6/11] Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Set postgres password & create DB
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${DB_PASS}';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || true

# Switch local postgres auth from peer → md5 so the app can connect with password
PG_HBA=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
  sed -i 's/^local\s*all\s*postgres\s*peer/local all postgres md5/' "$PG_HBA"
  sed -i 's/^local\s*all\s*all\s*peer/local all all md5/' "$PG_HBA"
  systemctl restart postgresql
fi

# ── 7. Server dependencies + DB migrations ────────────────────────────────────
echo "[7/11] Installing server dependencies..."
cd "$APP_DIR/server"
npm install --omit=dev

echo "       Running database migrations..."
PGPASSWORD="${DB_PASS}" node "$APP_DIR/server/scripts/full-migrate.js"

# ── 8. Build React frontend ───────────────────────────────────────────────────
echo "[8/11] Building React frontend (this may take a minute)..."
cd "$APP_DIR/client"
npm install
npm run build

# ── 9. Configure Nginx ────────────────────────────────────────────────────────
echo "[9/11] Configuring Nginx..."
cat > /etc/nginx/sites-available/trades <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

    root /var/www/trades/client/dist;
    index index.html;

    client_max_body_size 20M;

    location /api {
        proxy_pass         http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias   /var/www/trades/server/public/uploads;
        expires 30d;
    }

    location /webhook {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/trades /etc/nginx/sites-enabled/trades
nginx -t
systemctl restart nginx
systemctl enable nginx

# ── 10. Start backend with PM2 ────────────────────────────────────────────────
echo "[10/11] Starting API server with PM2..."
cd "$APP_DIR"
pm2 delete trades-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

# ── 11. UFW firewall ──────────────────────────────────────────────────────────
echo "[11/11] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  ✅  Deployment complete!                      ║"
echo "║                                                ║"
echo "║  🌐  http://${DROPLET_IP}                   ║"
echo "║  🔌  API: http://${DROPLET_IP}/api/health   ║"
echo "║                                                ║"
echo "║  Admin login:                                  ║"
echo "║    Email:    admin@roberttrades.com            ║"
echo "║    Password: Admin@1234!                       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Useful commands:"
echo "  pm2 logs trades-api      — view backend logs"
echo "  pm2 restart trades-api   — restart backend"
echo "  nginx -t                 — test nginx config"
