# 数据源采集规则与完整性校验

> 版本：v1.3.0 | 更新时间：2026-07-14

## 采集策略

| 厂商 | 方式 | 数据源 |
|------|------|--------|
| AWS | **动态 API** | ip-ranges.json + regional-table.a2z.com |
| Azure | 硬编码 + 定期核对 | learn.microsoft.com + datacenters.microsoft.com |
| GCP | 硬编码 + 定期核对 | cloud.google.com/locations |
| 阿里云 | 硬编码 + 定期核对 | help.aliyun.com |
| 华为云 | 硬编码 + 定期核对 | huaweicloud.com/global-infrastructure |
| 腾讯云 | 硬编码 + 定期核对 | tencentcloud.com/global-infrastructure |
| UCloud | 硬编码 + 定期核对 | docs.ucloud.cn |

## Region 统计

| 厂商 | Active | Planned | 总数 | 最后核对 |
|------|--------|---------|------|----------|
| AWS | 42 | 2 | 44 | 动态（无需核对） |
| Azure | 58 | 10 | 68 | 2026-07-10 |
| GCP | 42 | 6 | 48 | 2026-07-10 |
| 阿里云 | 35 | 0 | 35 | 2026-07-10 |
| 华为云 | 23 | 0 | 23 | 2026-07-10 |
| 腾讯云 | 25 | 0 | 25 | 2026-07-10 |
| UCloud | 22 | 0 | 22 | 2026-07-10 |
| **总计** | **247** | **18** | **265** | |

## 维护流程

1. **每季度**访问各厂商官网
2. 比对 src/lib/collectors/<vendor>.ts 开头的校验注释（含 Region 数量）
3. 如有新增，更新文件并递增版本号
4. 部署后点"刷新数据"

## DB Schema 兼容清单

新增列时需同步修改以下 5 个文件：
- src/types/index.ts
- src/lib/db/index.ts（CREATE TABLE + 升级逻辑）
- src/lib/collectors/base.ts（normalize）
- src/lib/collectors/orchestrator.ts（INSERT 列名 + 参数）
- src/app/api/stats/route.ts（统计查询）