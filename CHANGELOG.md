# Changelog

## v1.0.0-beta.2 - 2026-07-06

### Fixed

- 地图页面 `MapMarkerContent` 中 CJS `require("leaflet")` 和 `require("react-leaflet")` 改为 ESM `import L from "leaflet"`，确保 Turbopack 与严格 ESM 模式兼容
- 地图页面 `MapMarkerContent` 移除组件内部重复的 require，复用模块顶层的 dynamic import 组件
- README.md 中文编码损坏修复（UTF-8 BOM → UTF-8）

### Tests

- 数据库层测试：11/11 通过
- API 数据层测试：16/16 通过
- 采集器测试：4/5 通过（AWS 因网络环境 fetch 超时，非代码缺陷）
- TypeScript 类型检查：生产代码 0 错误

## v1.0.0-beta.1 - 2026-07-03

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
