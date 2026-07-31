#!/bin/bash
# Nexus 一键安装脚本

set -e

echo "🚀 开始安装 Nexus..."

# 安装 Docker（如果没有）
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
fi

# 创建 .env（如果没有）
if [ ! -f .env ]; then
    echo "📝 创建 .env 配置文件..."
    cp .env.example .env
    echo ""
    echo "⚠️  请编辑 .env 文件填入你的配置，然后重新运行此脚本"
    echo ""
    exit 0
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data/config data/shlink

# 启动服务
echo "🐳 启动 Docker 服务..."
docker compose up -d --build

echo ""
echo "✅ 安装完成！"
echo ""
echo "查看 TOTP 密钥: ./get-totp.sh"
echo "或查看日志: docker compose logs config-server"
echo ""
