# Cloudflare Dashboard 一键部署指南
> 零命令行，全部在 Cloudflare 网页操作，5 分钟完成

---

## 前置准备

1. Fork 本仓库到你的 GitHub
2. 获取 [Cloudflare API Token](https://dash.cloudflare.com/profile/api-tokens)（需要 Workers 和 D1 权限）
3. 获取 [Cloudflare Account ID](https://dash.cloudflare.com/)（首页右侧）

---

## 第一步：创建 D1 数据库

1. Cloudflare Dashboard → **Workers & Pages** → 左侧 **D1**
2. 点击 **创建数据库** → 名称填 `cloud-regions-db` → **创建**
3. 记下 **Database ID**（类似 `143b0415-...`）

---

## 第二步：设置 GitHub Secrets

在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**：

| Name | Value |
|------|-------|
| `CF_API_TOKEN` | 你的 API Token |
| `CF_ACCOUNT_ID` | 你的 Account ID |

---

## 第三步：更新 wrangler.toml

编辑 `worker/wrangler.toml`，将 `database_id` 改为第一步记录的 ID：

```toml
[[d1_databases]]
binding = "CLOUD_REGIONS_DB"
database_name = "cloud-regions-db"
database_id = "你的-Database-ID"
```

提交 → 自动触发 GitHub Actions 部署。

---

## 第四步：初始化 D1 表结构

GitHub → **Actions** → 左侧 **Init D1 Database** → **Run workflow**

---

## 第五步：触发首次数据采集

部署完成后，访问：

```
https://cloud-region-explorer-api.你的后缀.workers.dev/api/collect
```

或者在浏览器中直接 POST（用 fetch）：

```js
fetch("https://cloud-region-explorer-api.xxx.workers.dev/api/collect", { method: "POST" })
```

等待 30-60 秒后访问 `/api/stats` 查看采集结果。

---

## 部署架构

| Worker 名称 | 用途 | URL |
|------------|------|-----|
| `cloud-region-explorer-api` | 查询 API + 采集调度 | `...workers.dev/api/stats` |
| `cloud-region-explorer-aws` | AWS 采集 | 内部 |
| `cloud-region-explorer-azure` | Azure 采集 | 内部 |
| `cloud-region-explorer-gcp` | GCP 采集 | 内部 |
| `cloud-region-explorer-aliyun` | 阿里云采集 | 内部 |
| `cloud-region-explorer-huawei` | 华为云采集 | 内部 |
| `cloud-region-explorer-tencent` | 腾讯云采集 | 内部 |
| `cloud-region-explorer-ucloud` | UCloud 采集 | 内部 |

所有 Worker 共享 `cloud-regions-db` D1 数据库。

## 定时采集

每个 collector Worker 有独立的 cron 触发器，每天错开时间执行：

| Collector | Cron (UTC) |
|-----------|------------|
| AWS | 00:30 |
| Azure | 01:30 |
| GCP | 02:30 |
| Aliyun | 03:30 |
| Huawei | 04:30 |
| Tencent | 05:30 |
| UCloud | 06:30 |

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/stats` | GET | 总览统计 |
| `/api/regions?vendor=&country=&search=&page=&limit=` | GET | 区域列表 |
| `/api/collect` | POST | 触发全量采集 |
| `/api/sync` | POST | Docker 端数据同步 |
