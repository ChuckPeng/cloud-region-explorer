# Changelog

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
