# Changelog

## v1.0.4-beta - 2026-07-09

### Added
- 地图切换高德中文瓦片底图
- 新增 Istanbul 坐标，修复华为云土耳其节点无圆点
- CI/CD sha- 标签自动清理（保留最新10个）

### Fixed
- Docker volume 权限：entrypoint 自动 chown 防 EACCES
- Dockerfile public COPY 补全 --chown

### Tests
- 134/134 通过 | TSC 生产 0 错误 | 安全审计通过

﻿# Changelog

## v1.0.3-beta - 2026-07-08

### Fixed

- **关键修复**：`next.config.js` 新增 `serverExternalPackages: ["sql.js", "node-cron"]`，修复 Next.js standalone 模式下 sql.js / node-cron 被打包进 ESM chunk 导致 `TypeError: Cannot set properties of undefined (setting 'exports')` 运行时崩溃
- 受影响 API：`/api/stats`、`/api/regions`、`/api/collect` 中所有依赖 `ensureDb()` 的路由

### Tests

- 数据库层测试：11/11 通过
- API 数据层测试：16/16 通过
- 采集器测试：107/107 通过
- 安全审计：无硬编码密钥、无 SQL 注入风险、安全头配置完整

## v1.0.2-beta - 2026-07-06

### Changed

- CI/CD 标签策略优化：正式版 tag 推送 `:latest`（此前仅 push main 分支触发 `:beta`）

## v1.0.1-beta - 2026-07-06

### Fixed

- 地图页面 `MapMarkerContent` 中 CJS `require("leaflet")` 和 `require("react-leaflet")` 改为 ESM `import L from "leaflet"`，确保 Turbopack 与严格 ESM 模式兼容
- 地图页面 `MapMarkerContent` 移除组件内部重复的 require，复用模块顶层的 dynamic import 组件
- README.md 中文编码损坏修复（UTF-8 BOM → UTF-8）

### Changed

- 重构 Docker 标签策略：新增 `:beta` 流动标签，测试环境固定引用 `:beta` 即可自动获取最新测试版
- 版本标签规范化：`v1.0.0-beta` → `v1.0.1-beta`（PATCH 号递增），废弃 `v1.0.0-beta.N` 格式
- `docker-compose.pull.yml` 镜像引用从 `:latest` 改为 `:beta`

### Tests

- 数据库层测试：11/11 通过
- API 数据层测试：16/16 通过
- 采集器测试：4/5 通过（AWS 因网络环境 fetch 超时，非代码缺陷）
- TypeScript 类型检查：生产代码 0 错误

## v1.0.0-beta - 2026-07-03

### Added

- Initial beta release of Cloud Region Explorer.
- Web dashboard for cloud region and availability zone overview.
- Region search and filtering by vendor, country, city, and keyword.
- Map visualization for cloud region locations.
- Multi-vendor comparison matrix.
- Collectors for AWS, Azure, GCP, Alibaba Cloud, Huawei Cloud, Tencent Cloud, and UCloud.
- SQLite persistence through sql.js.
- Monthly scheduled collection and manual collection API.
- Docker, Docker Compose, Nginx reverse proxy, and GitHub Actions DockerHub publishing.

### Security

- Domain allowlist validation for all collector source URLs.
- Parameterized database operations.
- API rate limiting for manual collection.
- Nginx rate limiting and security headers.
