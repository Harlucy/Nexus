#!/bin/sh

# 复制默认配置
if [ ! -f /usr/share/nginx/html/conf/config.js ]; then
  cp /app/dist/conf/config.js /usr/share/nginx/html/conf/
fi

# Subconverter API 地址
if [ "$API_URL" ]; then
  echo "当前 API 地址为: $API_URL"
  sed -i "s|http://82.158.91.229:25500|$API_URL|g" /usr/share/nginx/html/conf/config.js
fi

# YamlForge 配置
if [ "$YAMLFORGE_BACKEND" ]; then
  echo "当前 YamlForge 后端地址为: $YAMLFORGE_BACKEND"
  sed -i "s|http://82.158.91.229:25501|$YAMLFORGE_BACKEND|g" /usr/share/nginx/html/conf/config.js
fi

if [ "$YAMLFORGE_API_KEY" ]; then
  echo "已配置 YamlForge API Key"
  sed -i "s|47UJdTgW8JZLchH8Wrc|$YAMLFORGE_API_KEY|g" /usr/share/nginx/html/conf/config.js
fi

# Shlink 配置
if [ "$SHLINK_BACKEND" ]; then
  echo "当前 Shlink 后端地址为: $SHLINK_BACKEND"
  sed -i "s|http://82.158.91.229:25502|$SHLINK_BACKEND|g" /usr/share/nginx/html/conf/config.js
fi

if [ "$SHLINK_API_KEY" ]; then
  echo "已配置 Shlink API Key"
  sed -i "s|2iDiMtFkGbtnJkSY7JkpeW8p|$SHLINK_API_KEY|g" /usr/share/nginx/html/conf/config.js
fi

if [ "$SHLINK_PUBLIC_URL" ]; then
  echo "当前 Shlink 公开URL为: $SHLINK_PUBLIC_URL"
  sed -i "s|http://82.158.91.229:25502|$SHLINK_PUBLIC_URL|g" /usr/share/nginx/html/conf/config.js
fi

# 配置服务器地址
if [ "$CONFIG_SERVER" ]; then
  echo "当前配置服务器地址为: $CONFIG_SERVER"
  # 在前端代码中替换配置服务器地址
  find /usr/share/nginx/html -name "*.js" -exec sed -i "s|http://localhost:25503|$CONFIG_SERVER|g" {} \;
fi

# 网站标题
if [ "$SITE_NAME" ]; then
  sed -i "s|Subconverter Web|$SITE_NAME|g" /usr/share/nginx/html/conf/config.js
fi

nginx -g "daemon off;"
