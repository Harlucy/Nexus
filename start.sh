#!/bin/sh

CONFIG_FILE=/usr/share/nginx/html/conf/config.js

echo "==============================="
echo "  Nexus 配置初始化"
echo "==============================="

# 设置默认值
SITE_NAME=${SITE_NAME:-Nexus}
API_URL=${API_URL:-http://localhost:25500}
CONFIG_SERVER=${CONFIG_SERVER:-http://localhost:25503}
YAMLFORGE_BACKEND=${YAMLFORGE_BACKEND:-http://localhost:25501}
YAMLFORGE_API_KEY=${YAMLFORGE_API_KEY:-}
SHLINK_BACKEND=${SHLINK_BACKEND:-http://localhost:25502}
SHLINK_API_KEY=${SHLINK_API_KEY:-}
SHLINK_PUBLIC_URL=${SHLINK_PUBLIC_URL:-http://localhost:25502}
ADMIN_PATH=${ADMIN_PATH:-admin}

# 生成 config.js
cat > "$CONFIG_FILE" << EOCONF
window.config = {
  siteName: '${SITE_NAME}',
  apiUrl: '${API_URL}',
  configServer: '${CONFIG_SERVER}',
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

echo "配置已生成:"
echo "  Site Name: $SITE_NAME"
echo "  API URL: $API_URL"
echo "  Config Server: $CONFIG_SERVER"
echo "  Admin Path: /$ADMIN_PATH"
echo "==============================="

nginx -g "daemon off;"
