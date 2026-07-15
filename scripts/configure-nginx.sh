#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${APP_DOMAIN:-makhlwf.duckdns.org}"
APP_PORT="${APP_PORT:-3000}"
SITE_NAME="${APP_SITE_NAME:-my-website}"
CERTBOT_WEBROOT="${CERTBOT_WEBROOT:-/var/www/certbot}"

if [ "$(id -u)" -eq 0 ]; then
  SUDO=()
else
  SUDO=(sudo)
fi

run() {
  "${SUDO[@]}" "$@"
}

reload_nginx() {
  if command -v systemctl >/dev/null 2>&1; then
    run systemctl reload nginx || run service nginx reload
  else
    run service nginx reload
  fi
}

write_http_config() {
  local temp_config
  temp_config="$(mktemp)"

  cat > "$temp_config" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} 102.203.200.132;

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

  run cp "$temp_config" "/etc/nginx/sites-available/${SITE_NAME}"
  rm -f "$temp_config"
}

write_https_config() {
  local temp_config
  temp_config="$(mktemp)"

  cat > "$temp_config" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 102.203.200.132 _;

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

  run cp "$temp_config" "/etc/nginx/sites-available/${SITE_NAME}"
  rm -f "$temp_config"
}

export DEBIAN_FRONTEND=noninteractive

if command -v apt-get >/dev/null 2>&1; then
  run apt-get update
  run apt-get install -y nginx certbot
fi

run mkdir -p "$CERTBOT_WEBROOT" /etc/nginx/sites-available /etc/nginx/sites-enabled
write_http_config
run ln -sfn "/etc/nginx/sites-available/${SITE_NAME}" "/etc/nginx/sites-enabled/${SITE_NAME}"
run rm -f /etc/nginx/sites-enabled/default
run nginx -t
reload_nginx

if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  run certbot certonly \
    --webroot \
    -w "$CERTBOT_WEBROOT" \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --keep-until-expiring
else
  run certbot renew --quiet || true
fi

if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "Certificate was not created for ${DOMAIN}." >&2
  exit 1
fi

write_https_config
run nginx -t
reload_nginx

echo "Nginx is configured for http://${DOMAIN} and https://${DOMAIN}."
