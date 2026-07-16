# 🛰 Cloud Region Explorer

一站式查询 **AWS、Azure、GCP、阿里云、华为云、腾讯云、UCloud** 全球 Region 与可用区 (AZ) 的 Web 系统。

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 📊 **仪表盘** | Region/AZ 统计概览、厂商饼图、国家柱状图 |
| 🔍 **数据查询** | 按厂商/国家/城市/关键词多维度搜索筛选 |
| 🗺️ **地图视图** | Leaflet 世界地图标注，按位置聚合展示 |
| 📱 **对比矩阵** | 多厂商横向对比各国家/城市的覆盖情况 |
| ⏰ **定时采集** | 每月 1 号自动刷新全量数据 |
| 🔧 **手动刷新** | 界面一键触发单厂商或全量数据更新 |
| 🐳 **Docker 部署** | 一行命令启动，SQLite 零配置 |

## 🔒 安全特性

- **API 速率限制**：采集接口 60 秒/IP/次限制
- **Nginx 反向代理**：请求速率限制 + 安全头 (XSS/Frame/Content-Type 防护)
- **域名白名单**：采集器仅访问厂商官方域名
- **参数化查询**：SQL 注入防护
- **Zod 校验**：API 入参类型校验
- **非 root 运行**：Docker 容器安全最佳实践

## 🚀 快速开始

### 前置条件
- Node.js 20+
- (可选) Docker & Docker Compose

### 本地开发

```bash
# 安装依赖
npm install

# 运行数据采集
npm run collect

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### Docker 部署

```bash
# 克隆仓库
git clone https://github.com/ChuckPeng/cloud-region-explorer.git
cd cloud-region-explorer

# 一键启动
docker compose up -d

# 访问 http://localhost:8080 (Nginx 反向代理)
```

### 从 DockerHub 拉取

```bash
docker pull ChuckPeng/cloud-region-explorer:latest
docker run -d -p 3000:3000 -v ./data:/app/data --name cloud-region-explorer ChuckPeng/cloud-region-explorer:latest
```

## 📦 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14, Tailwind CSS, Recharts, Leaflet |
| 后端 | Next.js API Routes |
| 数据库 | SQLite (sql.js 内存数据库) |
| 采集 | Cheerio, Playwright, node-cron |
| 部署 | Docker, Docker Compose, GitHub Actions |

## 📡 数据来源

所有数据仅从以下官方源获取：

| 厂商 | 数据来源 |
|------|----------|
| AWS | `ip-ranges.amazonaws.com` + 官方文档 |
| Azure | `learn.microsoft.com` |
| GCP | `cloud.google.com/about/locations` |
| 阿里云 | `help.aliyun.com` |
| 华为云 | `developer.huaweicloud.com` |
| 腾讯云 | `cloud.tencent.com` |
| UCloud | `docs.ucloud.cn` |

## 🔑 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `TZ` | `Asia/Shanghai` | 时区 |
| `CRON_ENABLED` | `true` | 是否启用定时采集 |
| `NODE_ENV` | `production` | 运行模式 |

## 📄 License

MIT

## ☁️ Cloudflare 部署（零服务器）

支持通过 Cloudflare Dashboard 一键连接 GitHub 自动部署，详见 [docs/CLOUDFLARE_DEPLOY.md](docs/CLOUDFLARE_DEPLOY.md)

- **Workers**：API 端点 + 定时采集
- **D1**：Serverless SQLite 数据库
- **Pages**：前端静态托管 + CDN

部署后无需维护任何服务器。