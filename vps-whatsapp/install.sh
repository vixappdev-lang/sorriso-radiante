#!/usr/bin/env bash
set -euo pipefail

# ===== Levii WhatsApp VPS — Instalador =====
# Uso: chmod +x install.sh && ./install.sh
# Opcional: DOMAIN=meu.dominio.com EMAIL=eu@email.com ./install.sh

PORT="${PORT:-3000}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-admin@example.com}"
APP_DIR="$(pwd)"

cyan(){ printf "\033[1;36m%s\033[0m\n" "$1"; }
green(){ printf "\033[1;32m%s\033[0m\n" "$1"; }
red(){ printf "\033[1;31m%s\033[0m\n" "$1"; }

cyan "==> Atualizando sistema"
apt-get update -y && apt-get upgrade -y

cyan "==> Instalando Node 20"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

cyan "==> Instalando PM2"
npm install -g pm2

cyan "==> Instalando dependências do app"
cd "$APP_DIR"
npm ci --production || npm install --production

cyan "==> Gerando token seguro"
LEVII_TOKEN="$(openssl rand -hex 32)"
mkdir -p logs auth

cat > .env <<EOF
PORT=$PORT
LEVII_TOKEN=$LEVII_TOKEN
EOF
chmod 600 .env

cyan "==> Iniciando via PM2"
LEVII_TOKEN="$LEVII_TOKEN" PORT="$PORT" pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

# Firewall
if command -v ufw >/dev/null; then
  ufw allow OpenSSH || true
  ufw allow "$PORT"/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw --force enable || true
fi

# Nginx + HTTPS (opcional)
if [ -n "$DOMAIN" ]; then
  cyan "==> Configurando Nginx + HTTPS para $DOMAIN"
  apt-get install -y nginx certbot python3-certbot-nginx

  cat > /etc/nginx/sites-available/levii-wa <<NGINX
server {
  listen 80;
  server_name $DOMAIN;
  client_max_body_size 5m;

  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 90s;
  }
}
NGINX
  ln -sf /etc/nginx/sites-available/levii-wa /etc/nginx/sites-enabled/levii-wa
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN" --redirect || red "Falha no certbot — siga manual"
fi

green ""
green "============================================="
green " ✅ Instalação concluída!"
green "============================================="
echo ""
echo "  TOKEN (cole no painel):"
echo ""
green "    $LEVII_TOKEN"
echo ""
if [ -n "$DOMAIN" ]; then
  echo "  URL pública: https://$DOMAIN"
else
  IP="$(curl -s ifconfig.me || echo 'SEU_IP')"
  echo "  URL: http://$IP:$PORT  (configure DOMAIN para HTTPS)"
fi
echo ""
echo "  Comandos úteis:"
echo "    pm2 status           # status"
echo "    pm2 logs levii-wa    # logs em tempo real"
echo "    pm2 restart levii-wa # restart"
echo ""
green "============================================="
