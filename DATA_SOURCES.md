# 数据源采集规则与完整性校验

> 版本：v1.2.4-beta | 更新时间：2026-07-10

## 各厂商数据源与核对规则

### 1. AWS
- **主数据源**：https://ip-ranges.amazonaws.com/ip-ranges.json（EC2 service regions）
- **辅助数据源**：https://aws.amazon.com/cn/about-aws/global-infrastructure/
- **采集方式**：API 自动获取 EC2 region 列表，硬编码 meta 字典补齐名称/坐标/AZ
- **核对频率**：每次部署后点击"刷新数据"自动拉取最新 ip-ranges.json
- **Region 数量**：41 active + 2 planned
- **GA Region**：39（官方公告）+ 2 GovCloud = 41 active
- **planned 节点**：
  - sa-south-1：Chile，2026
  - me-central-2：Saudi Arabia，2026
- **已知已上线（易被遗漏）**：
  - p-southeast-8：New Zealand（2025 年上线，3 AZ）
  - p-southeast-6：Philippines（在 ip-ranges 中，active）
  - mx-central-1：Mexico（已上线）
- **校验规则**：active 节点必须全部存在于 ip-ranges.json 的 EC2 service 列表中
- **特殊处理**：GovCloud (us-gov-*) 标记为 egion_type: "gov"；中国区 (cn-*) 标记为 "dedicated"
- **易混淆点**：
  - me-central-1 (Dubai) vs me-west-1 (Abu Dhabi)：同国不同城市，非重复
  - eusc-de-east-1 = European Sovereign Cloud (Berlin)，非 eu-central-3

### 2. Azure
- **主数据源**：https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview
- **辅助数据源**：https://datacenters.microsoft.com/globe/explore?view=map
- **采集方式**：硬编码（官网 JS 渲染无法直接抓取），需人工定期核对
- **核对频率**：每季度人工核对一次 datacenters.microsoft.com
- **Region 数量**：58 active + 10 planned
- **planned 节点**：Saudi Arabia, Malaysia, Indonesia, Taiwan, NZ South, Thailand, Denmark, Greece, Finland, Philippines

### 3. GCP
- **主数据源**：https://cloud.google.com/about/locations?hl=zh-cn
- **采集方式**：硬编码，需人工定期核对
- **核对频率**：每季度人工核对一次
- **Region 数量**：42 active + 6 planned
- **planned 节点**：Cape Town, Kuwait, Malaysia, Thailand, Philippines, Colombia

### 4. 阿里云
- **主数据源**：https://help.aliyun.com/zh/document_detail/40654.html
- **辅助数据源**：https://www.alibabacloud.com/zh/global-locations
- **采集方式**：硬编码，可从 help.aliyun.com 页面正则提取 region ID 辅助核对
- **核对频率**：每季度人工核对一次
- **Region 数量**：35 active（含 1 gov）
- **正则提取规则**：/cn-\w+|ap-\w+-\d|eu-\w+-\d|us-\w+-\d|me-\w+-\d/g

### 5. 华为云
- **主数据源**：https://www.huaweicloud.com/about/global-infrastructure.html
- **辅助数据源**：https://developer.huaweicloud.com/endpoint
- **采集方式**：硬编码，需人工定期核对
- **Region 数量**：23 active（含 1 gov：cn-north-229）
- **已核对**：2026-07-10 与官网一致

### 6. 腾讯云
- **主数据源**：https://www.tencentcloud.com/zh/global-infrastructure
- **辅助数据源**：https://cloud.tencent.com/document/product/213/6091
- **采集方式**：硬编码，需人工定期核对
- **Region 数量**：25 active（含 3 gov 金融云）

### 7. UCloud
- **主数据源**：https://docs.ucloud.cn/api/summary/regionlist
- **采集方式**：硬编码，需人工定期核对
- **Region 数量**：22 active
- **已核对**：2026-07-10 与官网一致

## 整体统计

| 厂商 | Active | Planned | 合计 |
|------|--------|---------|------|
| AWS | 41 | 2 | 43 |
| Azure | 58 | 10 | 68 |
| GCP | 42 | 6 | 48 |
| 阿里云 | 35 | 0 | 35 |
| 华为云 | 23 | 0 | 23 |
| 腾讯云 | 25 | 0 | 25 |
| UCloud | 22 | 0 | 22 |
| **总计** | **246** | **18** | **264** |

## 自动核对脚本

`ash
npx tsx tests/collectors.test.ts
`

## 数据更新流程

1. 访问各厂商官网检查是否有新 Region
2. 更新 src/lib/collectors/<vendor>.ts
3. 
pm run build + 
px tsx tests/collectors.test.ts
4. 提交并发布新版本
5. 部署后点击"刷新数据"

## DB Schema 兼容

新增列时需同步更新：
- src/types/index.ts（CloudRegion + RawRegionData）
- src/lib/db/index.ts（CREATE TABLE + 兼容升级逻辑）
- src/lib/collectors/base.ts（normalize 方法）
- src/lib/collectors/orchestrator.ts（INSERT 列名 + 参数数组）