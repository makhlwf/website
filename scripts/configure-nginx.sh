#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${APP_DOMAIN:-makhlwf.duckdns.org}"
APP_PORT="${APP_PORT:-3000}"
SITE_NAME="${APP_SITE_NAME:-my-website}"
CERTBOT_WEBROOT="${CERTBOT_WEBROOT:-/var/www/certbot}"
APP_ROOT="${APP_ROOT:-/var/www/my-website}"
NGINX_CONF_PATH="${NGINX_CONF_PATH:-/etc/nginx/conf.d/000-${SITE_NAME}.conf}"
STATUS_FILE="${STATUS_FILE:-${APP_ROOT}/public/deploy-status.json}"

FALLBACK_CERT="/etc/ssl/certs/selfsigned-${DOMAIN}.pem"
FALLBACK_KEY="/etc/ssl/private/selfsigned-${DOMAIN}.key"

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
    run systemctl reload nginx || run service nginx reload || run systemctl restart nginx || true
  else
    run service nginx reload || run service nginx restart || true
  fi
}

write_status() {
  local status="$1"
  local detail="$2"

  if [ -d "$(dirname "$STATUS_FILE")" ]; then
    cat > "$STATUS_FILE" <<JSON
{
  "status": "${status}",
  "detail": "${detail}",
  "domain": "${DOMAIN}",
  "nginxConfig": "${NGINX_CONF_PATH}",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
JSON
  fi
}

ensure_fallback_certificate() {
  if [ ! -f "$FALLBACK_CERT" ] || [ ! -f "$FALLBACK_KEY" ]; then
    echo "Creating self-signed fallback certificate..."
    run mkdir -p /etc/ssl/certs /etc/ssl/private
    run openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$FALLBACK_KEY" \
      -out "$FALLBACK_CERT" \
      -subj "/CN=${DOMAIN}/O=Makhlwf/C=LY" >/dev/null 2>&1 || true
    run chmod 600 "$FALLBACK_KEY" || true
  fi
}

write_http_config() {
  local temp_config
  temp_config="$(mktemp)"

  cat > "$temp_config" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} 102.203.200.132 localhost _;

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
        default_type "text/plain";
        try_files \$uri =404;
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

  run cp "$temp_config" "$NGINX_CONF_PATH"
  rm -f "$temp_config"
}

write_https_config() {
  local cert_file="$1"
  local key_file="$2"
  local temp_config
  temp_config="$(mktemp)"

  cat > "$temp_config" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} 102.203.200.132 localhost _;

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
        default_type "text/plain";
        try_files \$uri =404;
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
    server_name ${DOMAIN} 102.203.200.132 localhost _;

    ssl_certificate ${cert_file};
    ssl_certificate_key ${key_file};
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

  run cp "$temp_config" "$NGINX_CONF_PATH"
  rm -f "$temp_config"
}

export DEBIAN_FRONTEND=noninteractive

if command -v apt-get >/dev/null 2>&1; then
  run apt-get update -y || true
  run apt-get install -y nginx certbot openssl || true
fi

run mkdir -p "$CERTBOT_WEBROOT" /etc/nginx/conf.d /etc/nginx/sites-enabled
run chown -R www-data:www-data "$CERTBOT_WEBROOT" || true
run chmod -R 755 "$CERTBOT_WEBROOT" || true

write_http_config
run rm -f /etc/nginx/sites-enabled/default
run rm -f "/etc/nginx/sites-enabled/${SITE_NAME}"
run nginx -t || true
reload_nginx
write_status "http-ready" "Nginx HTTP config active."

LE_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
LE_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

if [ ! -f "$LE_CERT" ]; then
  echo "Requesting Let's Encrypt certificate for ${DOMAIN}..."
  run certbot certonly \
    --webroot \
    -w "$CERTBOT_WEBROOT" \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --keep-until-expiring || true
else
  run certbot renew --quiet || true
fi

if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
  echo "Configuring Nginx with Let's Encrypt SSL certificate..."
  write_https_config "$LE_CERT" "$LE_KEY"
  run nginx -t || true
  reload_nginx
  write_status "https-ready" "Nginx HTTPS config loaded with Let's Encrypt certificate."
else
  echo "Let's Encrypt certificate not ready. Using fallback SSL..."
  ensure_fallback_certificate
  if [ -f "$FALLBACK_CERT" ] && [ -f "$FALLBACK_KEY" ]; then
    write_https_config "$FALLBACK_CERT" "$FALLBACK_KEY"
    run nginx -t || true
    reload_nginx
    write_status "https-fallback-ready" "Nginx HTTPS loaded with fallback SSL."
  fi
fi

echo "Nginx setup complete. Domain: http://${DOMAIN} and https://${DOMAIN}"

