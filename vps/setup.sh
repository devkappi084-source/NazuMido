#!/usr/bin/env bash
# NazuMido VPS setup script
# Run as root on a fresh Debian/Ubuntu server
# Usage: bash setup.sh

set -euo pipefail

APP_DIR=/var/www/nazumido
APP_USER=nazumido
NODE_MAJOR=20

echo "==> Installing Node.js ${NODE_MAJOR}.x …"
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates nginx
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt-get install -y -qq nodejs

echo "==> Installing PM2 …"
npm install -g pm2

echo "==> Creating system user '${APP_USER}' …"
id "${APP_USER}" &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin "${APP_USER}"

echo "==> Setting up application directory …"
mkdir -p "${APP_DIR}/photos"
cp server.js package.json .env "${APP_DIR}/"
cd "${APP_DIR}"
npm install --omit=dev
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo "==> Starting server with PM2 …"
pm2 start "${APP_DIR}/server.js" \
  --name nazumido-photos \
  --user "${APP_USER}" \
  --env production
pm2 save
pm2 startup systemd -u root --hp /root

echo "==> Writing nginx config …"
DOMAIN=${1:-your-vps-hostname}
cat > /etc/nginx/sites-available/nazumido-photos <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 30M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/nazumido-photos /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "==> Done!  Next steps:"
echo "    1. Point your DNS A record for '${DOMAIN}' to this server's IP."
echo "    2. Install certbot:  apt-get install -y certbot python3-certbot-nginx"
echo "    3. Get TLS cert:     certbot --nginx -d ${DOMAIN}"
echo "    4. Test health:      curl https://${DOMAIN}/health"
echo ""
echo "    Set PHOTOS_VPS_URL=https://${DOMAIN} in your Cloudflare Pages env vars."
