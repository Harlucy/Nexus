# Nexus

一个基于 [subconverter](https://github.com/tindy2013/subconverter) 的订阅转换 Web 界面，支持 [YamlForge](https://github.com/peasoft/NoMoreWalls) 高级处理和 [Shlink](https://shlink.io/) 短链接。

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ 功能特性

- 🔄 **多客户端支持** - Clash、ClashR、V2Ray、Quantumult X、Surge、Sing-box
- 📝 **YamlForge 集成** - 支持自定义 JS 脚本处理订阅
- 🔗 **Shlink 短链接** - 生成短链接便于分享
- 🔐 **TOTP 两步验证** - 保护管理后台安全
- 🎨 **可视化配置** - Web 界面管理订阅源和规则
- 🐳 **Docker 部署** - 一键启动，无需手动构建

## 🚀 快速开始

### 前置要求

- Docker 和 Docker Compose
- 反向代理（如 Nginx）用于 HTTPS

### 1. 克隆项目

```bash
git clone https://github.com/Harlucy/Nexus.git
cd Nexus
```

### 2. 配置

```bash
cp .env.example .env
vim .env
```

填入你的域名和 API Key：

```bash
# 你的服务域名
API_URL=https://conv.example.com
YAMLFORGE_BACKEND=https://forge.example.com
SHLINK_BACKEND=https://s.example.com
SHLINK_PUBLIC_URL=https://s.example.com
SHLINK_DOMAIN=s.example.com
SHLINK_HTTPS=true

# API Keys
YAMLFORGE_API_KEY=your-key
SHLINK_API_KEY=your-key

# 前端配置
ADMIN_PATH=admin-your-secret-path
SITE_NAME=Nexus
```

### 3. 启动

```bash
docker compose up -d
```

Docker 会自动完成依赖安装和前端构建。

### 4. 配置反向代理

服务启动后，需要配置反向代理将域名指向本地端口：

| 域名 | 本地端口 | 说明 |
|------|---------|------|
| `sub.example.com` | `127.0.0.1:25504` | Web 界面 |
| `conv.example.com` | `127.0.0.1:25500` | Subconverter API |
| `forge.example.com` | `127.0.0.1:25501` | YamlForge |
| `s.example.com` | `127.0.0.1:25502` | Shlink 短链接 |

Nginx 示例：

```nginx
server {
    listen 443 ssl;
    server_name sub.example.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:25504;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. 获取 TOTP 密钥

```bash
# 查看日志获取密钥
docker compose logs config-server

# 或查看密钥文件
cat data/config/auth.json
```

用 Google Authenticator 添加密钥后即可登录。

## 📁 项目结构

```
Nexus/
├── src/                        # 前端源码（Vue 3）
├── server/                     # 配置服务器（Express）
├── public/conf/
│   └── config.example.js      # 前端配置模板
├── data/                       # 持久化数据（gitignore）
├── docker-compose.yml
├── Dockerfile                  # 多阶段构建
├── start.sh                    # 启动脚本（生成 config.js）
├── .env.example               # 环境变量模板
└── README.md
```

## ⚙️ 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_URL` | Subconverter 地址 | `http://localhost:25500` |
| `YAMLFORGE_BACKEND` | YamlForge 地址 | `http://localhost:25501` |
| `YAMLFORGE_API_KEY` | YamlForge API Key | - |
| `SHLINK_BACKEND` | Shlink 地址 | `http://localhost:25502` |
| `SHLINK_API_KEY` | Shlink API Key | - |
| `SHLINK_PUBLIC_URL` | Shlink 公开地址 | `http://localhost:25502` |
| `SHLINK_DOMAIN` | Shlink 短链域名 | `localhost` |
| `SHLINK_HTTPS` | Shlink 是否启用 HTTPS | `false` |
| `ADMIN_PATH` | 后台管理路径 | `admin` |
| `SITE_NAME` | 网站标题 | `Nexus` |

## 🔒 安全说明

- 所有端口只绑定 `127.0.0.1`，需通过反向代理暴露
- **TOTP 密钥**：首次启动自动生成，保存在 `data/config/auth.json`
- **API 认证**：所有配置 API 需要 Bearer Token
- **频率限制**：每分钟最多 5 次验证尝试
- **Token 有效期**：24 小时

## 🛠️ 本地开发

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 启动配置服务器
cd server && node server.js

# 新终端：启动前端
npm run dev
```

访问 `http://localhost:8080`

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)

## 🙏 致谢

- [stilleshan/subweb](https://github.com/stilleshan/subweb) - 原项目
- [subconverter](https://github.com/tindy2013/subconverter) - 订阅转换核心
- [YamlForge](https://github.com/peasoft/NoMoreWalls) - YAML 处理工具
- [Shlink](https://shlink.io/) - 短链接服务
