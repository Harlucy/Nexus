#!/bin/bash
set -e

echo "==================================="
echo "  Nexus 部署脚本"
echo "==================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 .env
check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}未找到 .env 文件${NC}"
        echo "正在从 .env.example 创建..."
        cp .env.example .env
        echo -e "${GREEN}.env 已创建，请编辑 .env 填入你的配置${NC}"
        echo ""
        echo "必填项："
        echo "  - API_URL (你的 subconverter 域名)"
        echo "  - YAMLFORGE_API_KEY"
        echo "  - SHLINK_API_KEY"
        echo "  - SHLINK_DOMAIN (你的短链接域名)"
        echo ""
        echo "编辑完成后重新运行此脚本"
        exit 0
    fi
    echo -e "${GREEN}.env 文件已存在${NC}"
}

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: 未安装 docker${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        echo -e "${RED}错误: 未安装 docker compose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}依赖检查通过${NC}"
}

# 创建数据目录
create_data_dirs() {
    echo -e "${YELLOW}创建数据目录...${NC}"
    mkdir -p data/config data/shlink
    echo -e "${GREEN}数据目录创建完成${NC}"
}

# 启动服务
start_services() {
    echo -e "${YELLOW}启动 Docker 服务...${NC}"
    docker compose up -d --build
    echo -e "${GREEN}服务启动完成${NC}"
}

# 获取 TOTP 密钥
get_totp() {
    echo -e "${YELLOW}等待配置服务器启动...${NC}"
    sleep 3
    
    AUTH_FILE="data/config/auth.json"
    if [ -f "$AUTH_FILE" ]; then
        SECRET=$(grep -o '"totpSecret":"[^"]*"' "$AUTH_FILE" | cut -d'"' -f4)
        if [ -n "$SECRET" ]; then
            echo ""
            echo "================================="
            echo -e "${GREEN}  TOTP 密钥${NC}"
            echo "================================="
            echo ""
            echo "密钥: $SECRET"
            echo ""
            echo "请用 Google Authenticator 添加此密钥"
            echo "================================="
        fi
    else
        echo -e "${YELLOW}TOTP 密钥将在首次启动时生成${NC}"
        echo "查看日志: docker compose logs config-server"
    fi
}

# 显示信息
show_info() {
    # 从 .env 读取域名
    source .env 2>/dev/null || true
    
    SUB_DOMAIN=${SUB_DOMAIN:-localhost}
    CONV_DOMAIN=${API_URL:-localhost}
    ADMIN=${ADMIN_PATH:-admin}
    
    echo ""
    echo "==================================="
    echo -e "${GREEN}  部署完成！${NC}"
    echo "==================================="
    echo ""
    echo "服务端口（仅本地访问）:"
    echo "  - subconverter: 127.0.0.1:25500"
    echo "  - yamlforge:    127.0.0.1:25501"
    echo "  - shlink:       127.0.0.1:25502"
    echo "  - config-server: 127.0.0.1:25503"
    echo "  - subweb:       127.0.0.1:25504"
    echo ""
    echo "请配置反向代理将域名指向上述端口"
    echo "详见 README.md"
    echo ""
}

# 主流程
main() {
    check_env
    check_dependencies
    create_data_dirs
    start_services
    get_totp
    show_info
}

main "$@"
