#!/bin/bash
# SubWeb 一键安装脚本（服务器端执行）

set -e

echo "🚀 开始安装 SubWeb..."

# 安装 Node.js（如果没有）
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# 安装 Docker（如果没有）
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
fi

# 创建项目目录
mkdir -p /root/subweb
cd /root/subweb

# 克隆代码（如果有git仓库）
# git clone <your-repo> .

# 或者从本地复制代码后执行：
echo "📁 创建数据目录..."
mkdir -p data/config data/shlink

echo "🔨 安装前端依赖..."
npm install

echo "🔨 构建前端..."
npm run build

echo "🐳 启动 Docker 服务..."
docker compose up -d --build

echo ""
echo "✅ 安装完成！"
echo ""
echo "🌐 访问地址: http://$(curl -s ifconfig.me):25504"
echo "🔐 首次访问需要设置 TOTP 验证"
echo ""
