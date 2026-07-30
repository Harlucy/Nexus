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

### 1. 克隆项目

```bash
git clone https://github.com/Harlucy/Nexus.git
cd Nexus
```

### 2. 配置

```bash
cp .env.example .env
vim .env  # 填入你的服务器地址和 API Key
```

### 3. 启动

```bash
docker compose up -d
```

就这么简单！Docker 会自动完成依赖安装和前端构建。

### 4. 获取 TOTP 密钥

```bash
# 查看日志获取密钥
docker compose logs config-server

# 或查看密钥文件
cat data/config/auth.json
```

然后用 Google Authenticator 添加密钥即可登录。

## 📁 项目结构

```
Nexus/
├── src/                        # 前端源码
├── server/                     # 配置服务器
├── public/conf/
│   └── config.example.js      # 配置模板
├── data/                       # 持久化数据（git忽略）
├── docker-compose.yml
├── Dockerfile                  # 多阶段构建
├── start.sh                    # 启动脚本（自动生成config.js）
├── .env.example               # 环境变量模板
└── README.md
```

## ⚙️ 配置说明

只需编辑 `.env` 文件：

```bash
cp .env.example .env
vim .env
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SERVER_IP` | 服务器地址 | - |
| `API_URL` | Subconverter 地址 | `http://localhost:25500` |
| `CONFIG_SERVER` | 配置服务器地址 | `http://localhost:25503` |
| `YAMLFORGE_BACKEND` | YamlForge 地址 | `http://localhost:25501` |
| `YAMLFORGE_API_KEY` | YamlForge API Key | - |
| `SHLINK_BACKEND` | Shlink 地址 | `http://localhost:25502` |
| `SHLINK_API_KEY` | Shlink API Key | - |
| `SHLINK_PUBLIC_URL` | Shlink 公开地址 | `http://localhost:25502` |
| `WEB_PORT` | Web 界面端口 | `25504` |
| `SITE_NAME` | 网站标题 | `Nexus` |

> 前端配置 `config.js` 会在启动时根据 `.env` 自动生成，无需手动配置。

## 🔒 安全说明

- **TOTP 密钥**：首次启动自动生成，保存在 `data/config/auth.json`，不会在网页显示
- **API 认证**：所有配置 API 需要 Bearer Token
- **频率限制**：每分钟最多 5 次验证尝试
- **Token 有效期**：24 小时

## 📡 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| subconverter | 25500 | 订阅转换核心 |
| yamlforge | 25501 | YAML 处理 |
| shlink | 25502 | 短链接服务 |
| config-server | 25503 | 配置管理 API |
| subweb | 25504 | Web 界面 |

## 🛠️ 本地开发

如需本地开发调试：

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
