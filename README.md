# Nexus

一个基于 [subconverter](https://github.com/tindy2013/subconverter) 的订阅转换 Web 界面，支持 [YamlForge](https://github.com/peasoft/NoMoreWalls) 高级处理和 [Shlink](https://shlink.io/) 短链接。

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ 功能特性

- 🔄 **多客户端支持** - Clash、ClashR、V2Ray、Quantumult X、Surge、Sing-box
- 🔀 **多订阅合并** - 节点集合可多选，也可逐行追加订阅链接，用 Subconverter 的 `url=a|b` 合并成一份配置
- 🗂 **规则模式切换** - 「RuleProvider」生成 `rule-providers`（配置约 70 KB），「内联规则」把规则展开写进配置（约 1 MB）
- 📝 **YamlForge 集成** - 支持自定义 JS 脚本处理订阅
- 🔗 **Shlink 短链接** - 生成短链接便于分享
- 🔗 **短链接管理** - 查看、搜索并修改远端 Shlink 的目标地址和标签
- 🎨 **可视化配置** - Web 界面管理订阅源和规则
- 🖥️ **原生 Node 部署** - 前台按需启动，不依赖 Docker 或 Nginx

## 🚀 快速开始

### 前置要求

- Node.js 18+（推荐通过 nvm 管理）
- 本地页面不需要 Docker 或反向代理；远端后端继续使用 HTTPS

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

### 3. 启动本地服务

Windows PowerShell：

```powershell
cd subweb
.\start-local.ps1
```

也可以双击 `start-local.cmd`。启动时会先构建前端，再由同一个 Node 服务提供前端和 API。
服务会以前台进程运行，需要时启动，按 `Ctrl+C` 停止。
本地入口为 `http://127.0.0.1:25503`，配置数据保存在 `data/config`。

如果使用 nvm，启动脚本会读取 `.nvmrc`。没有系统 Node 时，也可使用本机现有的 Codex Node runtime。

首页生成订阅和短链接；`/short-links` 页面查询远端短链接，修改目标地址或标签后点击
“保存到服务器”立即写入远端 Shlink，原短链接保持不变。配置页保存的 API 设置无需重启即可生效。
当前远端没有旧短链接时列表为空，可以先在首页生成新短链接。

节点集合支持多选，下方的“追加订阅链接”每行写一个地址，两者会去重后按 `a|b` 合并成一次转换；
多源时输出文件名带 `合并N源_` 前缀，短链标签同样变成 `合并N源-规则-脚本`，方便和单源订阅区分。

规则模式对应 Subconverter 的 `expand` 参数：选「内联规则」写 `expand=true`，把所有 `ruleset`
展开成一条条规则写进配置（实测白名单入口约 1 MB）；选「RuleProvider」写 `expand=false`，输出
`rule-providers` 段和 48 条 `RULE-SET` 引用（约 70 KB），规则集交给客户端按 `interval`（8 小时）缓存更新。
**必须显式写 `expand=false`**——这台 Subconverter 省略 `expand` 时按 `true` 处理，所以「不传参数」等于内联。
`classic=true/false` 对 clash / clashr 的这两种输出没有影响，界面上以「Classical Provider」保留但默认勾选。

「转换参数」把 `/sub` 支持的布尔参数全部列出来了，默认值取自 subconverter 文档的推荐值：

| 默认勾选 | 默认不勾 |
| --- | --- |
| `new_name` `emoji` `add_emoji` `remove_emoji` `append_info` `insert` `prepend` `fdn` `classic` | `append_type` `sort` `tfo` `udp` `scv` `tls13` `script` `list` `strict` `upload` |

「高级参数」折叠区放字符串/正则/脚本类参数，**留空就不写进链接**：`interval`、`include`、`exclude`、
`rename`、`filter_script`、`sort_script`、`group`、`dev_id`、`upload_path`。
其中 `rename`、`filter_script`、`sort_script` 在服务端 `api_mode=true` 时需要正确的 `token` 才会生效。
`target` / `url` / `config` 由界面其他控件生成；`token` 属密钥不暴露；`filename` 由 YamlForge 处理；`ver` 已并入客户端下拉。

### 4. 配置反向代理

本地网页直接访问 `http://127.0.0.1:25503`，不需要反向代理。下表和 Nginx 示例仅供后端部署参考：

| 域名 | 本地端口 | 说明 |
|------|---------|------|
| `sub.example.com` | `127.0.0.1:25503` | Web 界面和配置 API（本地） |
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
        proxy_pass http://127.0.0.1:25503;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📁 项目结构

```
Nexus/
├── src/                        # 前端源码（Vue 3）
├── server/                     # 配置服务器（Express）
├── public/conf/
│   └── config.example.js      # 前端配置模板
├── data/                       # 持久化数据（gitignore）
├── docker-compose.yml
├── start-local.ps1             # 原生 Node 前台启动脚本
├── start-local.cmd             # Windows 双击启动入口
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

## 本地访问

验证码、登录和配置 API 的 Token 校验已经移除。服务只监听 `127.0.0.1`，
请勿通过反向代理将这个本地管理界面公开到互联网。远端 Shlink API Key 仍用于访问远端服务。
已有 `data/config/auth.json` 不再读取，也不会生成新的验证码密钥。

## 🛠️ 本地开发

```bash
# 安装依赖（首次使用且 npm 可用时）
npm install
cd server && npm install && cd ..

# 启动完整本地服务
./start-local.ps1

# 仅前端开发时可使用 Vite（API 代理到本地服务）
npm run dev

# 接口测试（使用模拟 Shlink，不修改正式服务器数据）
npm test
```

访问 `http://localhost:8080`

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)

## 🙏 致谢

- [stilleshan/subweb](https://github.com/stilleshan/subweb) - 原项目
- [subconverter](https://github.com/tindy2013/subconverter) - 订阅转换核心
- [YamlForge](https://github.com/peasoft/NoMoreWalls) - YAML 处理工具
- [Shlink](https://shlink.io/) - 短链接服务

## 🔄 更新部署

```bash
cd Nexus

# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build
```

## 📋 常用命令

```bash
# 查看所有服务日志
docker compose logs -f

# 查看某个服务的日志
docker compose logs -f subweb
docker compose logs -f config-server

# 重启单个服务
docker compose restart subweb

# 停止所有服务
docker compose down

# 完全重建（清除旧镜像）
docker compose up -d --build --force-recreate

```
