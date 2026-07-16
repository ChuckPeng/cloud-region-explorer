# Cloudflare Dashboard 一键部署指南
> 零命令行，全部在 Cloudflare 网页上操作，10 分钟完成

---

## 准备

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Fork 本仓库到你的 GitHub：`ChuckPeng/cloud-region-explorer`

---

## 第一步：创建 D1 数据库

1. 左侧菜单 → **Workers & Pages** → **D1**
2. 点击右上角 **创建数据库**
3. 数据库名称填：`cloud-regions-db`
4. 点击 **创建**
5. 记录创建完成后的 **Database ID**（类似 `a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

---

## 第二步：部署 Workers API

1. Workers & Pages → **概述** → **创建应用程序** → 选 **Workers**
2. 点击 **"从 Git 仓库部署"** → 授权 GitHub → 选择你的仓库
3. 配置构建：

   | 字段 | 值 |
   |------|-----|
   | **Production branch** | `main` |
   | **Root directory** | `/worker` |
   | **Build command** | `npm install` |
   | **Deploy command** | `npx wrangler deploy --env=""` |

4. 点击 **保存并部署**

> 第一次部署会**失败**，因为还没有绑定 D1。接下来绑定。

---

## 第三步：绑定 D1 数据库

1. 进入刚创建的 Worker → **设置** → **绑定**（部分界面在 **Variables and secrets** 下方）
2. 找到 **D1 数据库绑定** 区域 → 点击 **添加绑定**
3. 填写：

   | 字段 | 值 |
   |------|-----|
   | **Variable name** | `CLOUD_REGIONS_DB` |
   | **D1 database** | 选择 `cloud-regions-db` |

4. 点击 **保存**

---

## 第四步：填入 D1 database_id 到 wrangler.toml

1. 回到 GitHub 仓库，编辑 `worker/wrangler.toml`
2. 将第一步记录的 Database ID 填入：

   ```toml
   [[d1_databases]]
   binding = "CLOUD_REGIONS_DB"
   database_name = "cloud-regions-db"
   database_id = "你的-Database-ID-这里"
   ```

3. 提交 → Cloudflare 自动重新部署

---

## 第五步：初始化 D1 表结构

1. Workers & Pages → 左侧 **D1** → 点击 `cloud-regions-db`
2. 点击顶部的 **控制台** 标签
3. 打开本仓库 `worker/schema.sql`，复制全部 SQL
4. 粘贴到 D1 Console → 点击 **执行**

---

## 第六步：定时触发器

1. 进入 Worker → **触发器** → **Cron 触发器** → 添加
2. 填写：

   | 字段 | 值 |
   |------|-----|
   | **名称** | `daily-collect` |
   | **Cron 表达式** | `0 0 * * *`（每天 UTC 00:00） |

---

## 第七步：触发首次数据同步

Worker 本身不做采集。你需要先在 **Docker 端** 采集数据后同步过来。

Docker 端运行：
```bash
# 先采集数据
curl -X POST http://localhost:3000/api/collect

# 再同步到 Cloudflare Worker
curl -X POST https://你的worker域名.workers.dev/api/sync \
  -H "Content-Type: application/json" \
  -d "{\"vendor\":\"all\",\"regions\":[...]}"  # 从本地 DB 导出
```

或者在 Docker 端的 `.env` 中配置：
```
CF_SYNC_URL=https://你的worker域名.workers.dev/api/sync
```

---

## 完成！

| 资源 | 地址 |
|------|------|
| API | `https://cloud-region-explorer-api.xxx.workers.dev/api/stats` |
| 定时同步 | 每天 UTC 00:00（Worker cron）+ Docker 侧定时同步 |
