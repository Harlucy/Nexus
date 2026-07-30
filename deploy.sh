#!/bin/bash

# SubWeb 部署脚本

set -e

echo "==================================="
echo "  SubWeb 部署脚本"
echo "==================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: 未安装 docker${NC}"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        echo -e "${RED}错误: 未安装 docker compose${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未安装 node${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未安装 npm${NC}"
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

# 安装依赖并构建
build_frontend() {
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install
    
    echo -e "${YELLOW}构建前端...${NC}"
    npm run build
    
    echo -e "${GREEN}前端构建完成${NC}"
}

# 启动服务
start_services() {
    echo -e "${YELLOW}启动 Docker 服务...${NC}"
    docker compose up -d --build
    
    echo -e "${GREEN}服务启动完成${NC}"
}

# 显示信息
show_info() {
    echo ""
    echo "==================================="
    echo -e "${GREEN}  部署完成！${NC}"
    echo "==================================="
    echo ""
    echo "服务端口:"
    echo "  - subconverter: 25500"
    echo "  - yamlforge:    25501"
    echo "  - shlink:       25502"
    echo "  - config-server: 25503"
    echo "  - subweb:       25504"
    echo ""
    echo "访问地址:"
    echo "  http://$(hostname -I | awk '{print $1}'):25504"
    echo ""
    echo "首次访问需要设置 TOTP 两步验证"
    echo ""
    echo "后台管理地址:"
    echo "  http://$(hostname -I | awk '{print $1}'):25504/wl9w5sv019c98n9t"
    echo ""
}

# 主流程
main() {
    check_dependencies
    create_data_dirs
    build_frontend
    start_services
    show_info
}

main "$@"
