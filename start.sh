#!/bin/sh

# 配置文件路径
CONFIG_FILE=/usr/share/nginx/html/conf/config.js

# 如果配置文件不存在，从模板复制
if [ ! -f "$CONFIG_FILE" ]; then
  echo "配置文件不存在，使用默认配置"
  exit 1
fi

echo "==============================="
echo "  Nexus 配置初始化"
echo "==============================="

# Subconverter API 地址
if [ "$API_URL" ]; then
  echo "Subconverter: $API_URL"
  sed -i "s|http://localhost:25500|$API_URL|g" "$CONFIG_FILE"
fi

# 配置服务器地址
if [ "$CONFIG_SERVER" ]; then
  echo "Config Server: $CONFIG_SERVER"
  sed -i "s|http://localhost:25503|$CONFIG_SERVER|g" "$CONFIG_FILE"
fi

# YamlForge 配置
if [ "$YAMLFORGE_BACKEND" ]; then
  echo "YamlForge: $YAMLFORGE_BACKEND"
  sed -i "s|http://localhost:25501|$YAMLFORGE_BACKEND|g" "$CONFIG_FILE"
fi

if [ "$YAMLFORGE_API_KEY" ]; then
  echo "YamlForge API Key: 已配置"
  sed -i "s|apiKey: ''|apiKey: '$YAMLFORGE_API_KEY'|g" "$CONFIG_FILE"
fi

# Shlink 配置
if [ "$SHLINK_BACKEND" ]; then
  echo "Shlink: $SHLINK_BACKEND"
  sed -i "s|http://localhost:25502|$SHLINK_BACKEND|g" "$CONFIG_FILE"
fi

if [ "$SHLINK_API_KEY" ]; then
  echo "Shlink API Key: 已配置"
  sed -i "s|apiKey: ''|apiKey: '$SHLINK_API_KEY'|g" "$CONFIG_FILE"
fi

if [ "$SHLINK_PUBLIC_URL" ]; then
  echo "Shlink Public URL: $SHLINK_PUBLIC_URL"
  sed -i "s|publicUrl: 'http://localhost:25502'|publicUrl: '$SHLINK_PUBLIC_URL'|g" "$CONFIG_FILE"
fi

# 网站标题
if [ "$SITE_NAME" ]; then
  echo "Site Name: $SITE_NAME"
  sed -i "s|siteName: 'Nexus'|siteName: '$SITE_NAME'|g" "$CONFIG_FILE"
fi

echo "==============================="
echo "  启动 Nginx"
echo "==============================="

nginx -g "daemon off;"
