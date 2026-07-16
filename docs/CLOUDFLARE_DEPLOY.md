# Cloudflare Dashboard 一键部署指南

> 零命令行，全部在 Cloudflare 网页上操作，5 分钟完成

---

## 准备

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **Workers & Pages**
3. 确保右上角已选择你的账户

---

## 第一步：创建 D1 数据库

1. Workers & Pages → 左侧点 **D1**
2. 点击右上角 **创建数据库**
3. 数据库名称填：`cloud-regions-db`
4. 点击 **创建**
5. 记下新创建的数据库名称（后面绑定用）

---

## 第二步：部署 Workers API

1. Workers & Pages → 点 **概述**（Overview）
2. 点 **创建应用程序** → 选 **Workers**
3. 点击 **"从 Git 仓库部署"**（如果没看到这个选项，先创建 Worker 再配置 Git）
4. 点 **连接 GitHub** → 授权 Cloudflare 访问你的仓库
5. 选择仓库：`ChuckPeng/cloud-region-explorer`
6. 点击 **开始设置**
7. 填写构建配置：

   | 字段 | 值 |
   |------|-----|
   | **Branch** | `main` |
   | **Path** | `/worker` |
   | **Build command** | *(留空)* |
   | **Deploy command** | `npx wrangler deploy --env=""` |

8. 点击 **保存并部署**

> ⚠️ 第一次部署会失败（因为还没有绑定 D1），先不管，继续下一步。

---

## 第三步：获取 D1 数据库 ID 并写入配置

1. Workers & Pages → 左侧点 **D1**
2. 点击 `cloud-regions-db` 数据库
3. 复制页面上的 **Database ID**（一串 UUID，类似 `a1b2c3d4-...`）
4. 回到 GitHub，编辑 `worker/wrangler.toml`
5. 把 `database_id = ""` 改成你复制的 ID：

   ```toml
   [[d1_databases]]
   binding = "CLOUD_REGIONS_DB"
   database_name = "cloud-regions-db"
   database_id = "a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

6. 提交 → Cloudflare 自动重新部署，Worker 就绑定好 D1 了

---

## 第四步：初始化 D1 数据库表结构

1. Workers & Pages → 左侧点 **D1**
2. 点击 `cloud-regions-db` 数据库
3. 点击顶部的 **Console**（控制台）标签
4. 打开本仓库的 [worker/schema.sql](https://github.com/ChuckPeng/cloud-region-explorer/blob/main/worker/schema.sql)
5. 复制全部 SQL 内容
6. 粘贴到 D1 Console 的输入框
7. 点击 **执行**（Execute）

> 如果有多条语句，可能需要逐条执行

---

## 第五步：配置定时采集

1. Workers & Pages → 点你的 Worker
2. 点击 **触发器**（Triggers）标签
3. 找到 **Cron 触发器** → 点击 **添加 Cron 触发器**
4. 填写：
   - **名称**：`daily-collect`
   - **Cron 表达式**：`0 0 * * *`（每天 UTC 00:00，即北京时间 08:00）
5. 点击 **添加**

---

## 第六步：部署 Pages 前端

1. Workers & Pages → 点 **概述**（Overview）
2. 点 **创建应用程序** → 选 **Pages**
3. 点 **连接到 Git** → 选择 `ChuckPeng/cloud-region-explorer`
4. 点击 **开始设置**
5. 填写构建配置：

   | 字段 | 值 |
   |------|-----|
   | **Framework preset** | `None` / `Next.js` |
   | **Build command** | `cp next.config.cf.js next.config.js && npm install && npm run build` |
   | **Output directory** | `/out` |

6. 展开 **环境变量** → 添加：

   | 变量名 | 值 |
   |--------|-----|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://cloud-region-explorer-api.你的子域名.workers.dev` |

   > Worker 域名在 Worker 的概览页面可以看到，格式类似 `cloud-region-explorer-api.xxx.workers.dev`

7. 点击 **保存并部署**

---

## 第七步：触发首次数据采集

1. 部署完成后，打开浏览器访问：
   ```
   https://你的worker域名/api/collect
   ```
   页面会返回 `{"error":"Not found"}`（因为 POST 才触发采集）

2. 用 curl 或 Postman 发一个 POST 请求：
   ```bash
   curl -X POST https://你的worker域名/api/collect -H "Content-Type: application/json" -d '{}'
   ```

3. 等待几分钟（采集所有厂商大约需要 30-60 秒）

---

## 完成！

| 资源 | 地址 |
|------|------|
| 前端 | `https://cloud-region-explorer.pages.dev` |
| API | `https://cloud-region-explorer-api.xxx.workers.dev/api/stats` |
| 定时采集 | 每天 UTC 00:00 自动执行 |
| 手动采集 | POST `https://xxx.workers.dev/api/collect` |

每次 `git push main` 时，Pages 和 Workers 都会自动重新部署。