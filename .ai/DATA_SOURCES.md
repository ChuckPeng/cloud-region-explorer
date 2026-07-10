# 数据源采集规则与完整性校验

> 自动生成时间：2026-07-10 | 版本：v1.1.1-beta

## 各厂商数据源与核对规则

### 1. AWS
- **主数据源**：`https://ip-ranges.amazonaws.com/ip-ranges.json`（EC2 service regions）
- **辅助数据源**：`https://aws.amazon.com/cn/about-aws/global-infrastructure/`
- **采集方式**：API 自动获取 EC2 region 列表，硬编码 meta 字典补齐名称/坐标/AZ
- **核对频率**：每次部署时 `npm run collect` 自动拉取最新 ip-ranges.json
- **Region 数量**：41 active + 2 planned
- **planned 节点**：sa-south-1 (Chile, 2026), me-central-2 (Saudi Arabia, 2026)
- **特殊处理**：GovCloud (`us-gov-*`) 标记为 `region_type: "gov"`；中国区 (`cn-*`) 标记为 `"dedicated"`

### 2. Azure
- **主数据源**：`https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview`
- **辅助数据源**：`https://datacenters.microsoft.com/globe/explore?view=map`
- **采集方式**：硬编码（官网 JS 渲染无法直接抓取），需人工定期核对
- **核对频率**：每季度人工核对一次 datacenters.microsoft.com
- **Region 数量**：58 active + 10 planned
- **planned 节点**：Saudi Arabia, Malaysia, Indonesia, Taiwan, NZ South, Thailand, Denmark, Greece, Finland, Philippines
- **特殊处理**：中国区 21Vianet (`chinanorth*`, `chinaeast*`) 标记为 `region_type: "dedicated"`

### 3. GCP
- **主数据源**：`https://cloud.google.com/about/locations?hl=zh-cn`
- **采集方式**：硬编码，需人工定期核对
- **核对频率**：每季度人工核对一次
- **Region 数量**：42 active + 6 planned
- **planned 节点**：Cape Town, Kuwait, Malaysia, Thailand, Philippines, Colombia

### 4. 阿里云
- **主数据源**：`https://help.aliyun.com/zh/document_detail/40654.html`
- **辅助数据源**：`https://www.alibabacloud.com/zh/global-locations`
- **采集方式**：硬编码，可从 help.aliyun.com 页面正则提取 region ID 辅助核对
- **核对频率**：每季度人工核对一次
- **Region 数量**：35 active（含 1 gov）
- **正则提取规则**：`/cn-\w+|ap-\w+-\d|eu-\w+-\d|us-\w+-\d|me-\w+-\d/g` 匹配 help.aliyun.com 页面

### 5. 华为云
- **主数据源**：`https://www.huaweicloud.com/about/global-infrastructure.html`
- **辅助数据源**：`https://developer.huaweicloud.com/endpoint`
- **采集方式**：硬编码，需人工定期核对
- **核对频率**：每季度人工核对一次
- **Region 数量**：23 active（含 1 gov：cn-north-229 乌兰察布）
- **已核对**：2026-07-10 与官网一致

### 6. 腾讯云
- **主数据源**：`https://www.tencentcloud.com/zh/global-infrastructure`
- **辅助数据源**：`https://cloud.tencent.com/document/product/213/6091`
- **采集方式**：硬编码，需人工定期核对
- **核对频率**：每季度人工核对一次
- **Region 数量**：25 active（含 3 gov 金融云）
- **已知新增**：ap-taipei, ap-frankfurt-v2（2026-07-10 已更新）

### 7. UCloud
- **主数据源**：`https://docs.ucloud.cn/api/summary/regionlist`
- **采集方式**：硬编码，需人工定期核对
- **核对频率**：每季度人工核对一次
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

```bash
# 运行后对比各厂商采集器与实际抓取数据
npx tsx tests/collectors.test.ts
```

## 数据更新流程

1. 人工访问各厂商官网链接，检查是否有新 Region
2. 更新对应 `src/lib/collectors/<vendor>.ts` 文件
3. 运行 `npm run build` 确保编译通过
4. 运行 `npx tsx tests/collectors.test.ts` 验证数据完整性
5. 提交代码并发布新版本
6. 部署后点击"刷新数据"更新数据库