#!/bin/sh

CONFIG_FILE=/usr/share/nginx/html/conf/config.js

SITE_NAME=${SITE_NAME:-Nexus}
API_URL=${API_URL:-http://localhost:25500}
ADMIN_PATH=${ADMIN_PATH:-admin}
YAMLFORGE_BACKEND=${YAMLFORGE_BACKEND:-http://localhost:25501}
YAMLFORGE_API_KEY=${YAMLFORGE_API_KEY:-}
SHLINK_BACKEND=${SHLINK_BACKEND:-http://localhost:25502}
SHLINK_API_KEY=${SHLINK_API_KEY:-}
SHLINK_PUBLIC_URL=${SHLINK_PUBLIC_URL:-http://localhost:25502}

cat > "$CONFIG_FILE" << EOCONF
window.config = {
  siteName: '${SITE_NAME}',
  apiUrl: '${API_URL}',
  adminPath: '${ADMIN_PATH}',
  yamlforge: {
    backend: '${YAMLFORGE_BACKEND}',
    apiKey: '${YAMLFORGE_API_KEY}',
  },
  shlink: {
    backend: '${SHLINK_BACKEND}',
    apiKey: '${SHLINK_API_KEY}',
    publicUrl: '${SHLINK_PUBLIC_URL}',
  },
};
EOCONF

echo "Config generated:"
echo "  Site: $SITE_NAME"
echo "  API: $API_URL"
echo "  Admin: /$ADMIN_PATH"

nginx -g "daemon off;"
