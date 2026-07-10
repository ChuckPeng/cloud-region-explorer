// ==================== AWS 采集器 ====================
// 数据来源：aws_regions.py 脚本（行业公开资料整理 + ip-ranges.json 实时校验）
// 核心逻辑：内置权威 REGIONS 表 → ip-ranges.json EC2 校验 → 合并输出
// 域名白名单：amazonaws.com, aws.amazon.com

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

// AWS 官方 Global Infrastructure 公开信息整理的权威 Region 数据
// (国家, 城市, region code, AZ数, 类型)
// 数据源：aws_regions.py 维护的 REGIONS 列表
const REGIONS: Array<[string, string, string, number, string]> = [
    // ---- 商业区 (aws) ----
    ["United States", "Virginia", "us-east-1", 6, "public"],
    ["United States", "Ohio", "us-east-2", 3, "public"],
    ["United States", "California", "us-west-1", 2, "public"],
    ["United States", "Oregon", "us-west-2", 4, "public"],
    ["South Africa", "Cape Town", "af-south-1", 3, "public"],
    ["China", "香港", "ap-east-1", 3, "public"],
    ["India", "Mumbai", "ap-south-1", 3, "public"],
    ["Japan", "Osaka", "ap-northeast-3", 3, "public"],
    ["South Korea", "Seoul", "ap-northeast-2", 4, "public"],
    ["Singapore", "Singapore", "ap-southeast-1", 3, "public"],
    ["Australia", "Sydney", "ap-southeast-2", 3, "public"],
    ["Indonesia", "Jakarta", "ap-southeast-3", 3, "public"],
    ["Australia", "Melbourne", "ap-southeast-4", 3, "public"],
    ["Malaysia", "Kuala Lumpur", "ap-southeast-5", 3, "public"],
    ["Japan", "Tokyo", "ap-northeast-1", 4, "public"],
    ["Canada", "Montreal", "ca-central-1", 3, "public"],
    ["Canada", "Calgary", "ca-west-1", 2, "public"],
    ["Germany", "Frankfurt", "eu-central-1", 3, "public"],
    ["Ireland", "Ireland", "eu-west-1", 3, "public"],
    ["United Kingdom", "London", "eu-west-2", 3, "public"],
    ["France", "Paris", "eu-west-3", 3, "public"],
    ["Sweden", "Stockholm", "eu-north-1", 3, "public"],
    ["Italy", "Milan", "eu-south-1", 3, "public"],
    ["Spain", "Madrid", "eu-south-2", 3, "public"],
    ["Switzerland", "Zurich", "eu-central-2", 3, "public"],
    ["Israel", "Tel Aviv", "il-central-1", 3, "public"],
    ["Bahrain", "Bahrain", "me-south-1", 3, "public"],
    ["UAE", "Dubai", "me-central-1", 3, "public"],
    // ---- 中国区 (aws-cn) ----
    ["China", "北京", "cn-north-1", 3, "dedicated"],
    ["China", "银川", "cn-northwest-1", 3, "dedicated"],
        ["India", "Hyderabad", "ap-south-2", 3, "public"],
    ["Philippines", "Manila", "ap-southeast-6", 3, "public"],
    ["Thailand", "Bangkok", "ap-southeast-7", 3, "public"],
    ["New Zealand", "Auckland", "ap-southeast-8", 3, "public"],
    ["Taiwan", "台北", "ap-east-2", 3, "public"],
    ["UAE", "Abu Dhabi", "me-west-1", 3, "public"],
    ["Mexico", "Mexico City", "mx-central-1", 3, "public"],
    ["Chile", "Santiago", "sa-west-1", 3, "public"],
    ["United States", "Texas", "us-south-1", 3, "public"],
    ["Germany", "Berlin", "eusc-de-east-1", 3, "public"],
    ["Brazil", "Sao Paulo", "sa-east-1", 3, "public"],
    // ---- 政府云区 (aws-us-gov) ----
    ["United States", "Oregon", "us-gov-west-1", 3, "gov"],
    ["United States", "Virginia", "us-gov-east-1", 3, "gov"],
];

export class AwsCollector extends BaseCollector {
  vendor: Vendor = "aws";
  allowedDomains = ["amazonaws.com", "aws.amazon.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://aws.amazon.com/about-aws/global-infrastructure/";

    try {
      // 1. 实时校验：从 ip-ranges.json 获取 EC2 Region 列表
      const ipRangesUrl = "https://ip-ranges.amazonaws.com/ip-ranges.json";
      this.validateUrl(ipRangesUrl);

      let feedRegions: Set<string> | null = null;
      try {
        const response = await fetch(ipRangesUrl);
        if (response.ok) {
          const data = await response.json() as {
            prefixes: Array<{ region: string; service: string }>;
            createDate: string;
          };
          feedRegions = new Set(
            data.prefixes
              .filter(p => p.service === "EC2")
              .map(p => p.region)
              .filter(r => r !== "GLOBAL")
          );
          console.log("[AWS] ip-ranges.json 实时校验成功, createDate:", data.createDate);
        }
      } catch (e) {
        console.warn("[AWS] ip-ranges.json 获取失败，使用内置数据:", e);
      }

      // 2. 从权威 REGIONS 表生成结果
      for (const [country, city, regionId, azCount, regionType] of REGIONS) {
        const azNames = Array.from(
          { length: azCount },
          (_, i) => regionId + String.fromCharCode(97 + i) // a, b, c, ...
        );

        // 如果实时校验成功且此 region 不在 feed 中，标记为 planned
        let status: string = "active";
        if (feedRegions && !feedRegions.has(regionId)) {
          status = "planned";
          console.warn(`[AWS] ${regionId} 不在 ip-ranges EC2 列表中，标记为 planned`);
        }

        results.push({
          vendor: "aws",
          region_id: regionId,
          region_name: city,
          country: country,
          city: city,
          az_names: azNames,
          status: status,
          region_type: regionType,
          data_source_url: sourceUrl,
        });
      }

      // 3. 如果实时校验成功，检查是否有新 Region（在 feed 中但不在 REGIONS 表中）
      if (feedRegions) {
        const knownRegions = new Set(REGIONS.map(r => r[2]));
        const missing = [...feedRegions].filter(r => !knownRegions.has(r)).sort();
        if (missing.length > 0) {
          console.warn("[AWS] ip-ranges 中有未收录的新 Region:", missing.join(", "));
          // 自动添加未知 Region（使用 region_id 作为名称）
          for (const regionId of missing) {
            results.push({
              vendor: "aws",
              region_id: regionId,
              region_name: regionId,
              country: "Unknown",
              city: "Unknown",
              az_names: [regionId + "a", regionId + "b", regionId + "c"],
              status: "active",
              region_type: regionId.startsWith("cn-") ? "dedicated" : regionId.startsWith("us-gov") ? "gov" : "public",
              data_source_url: sourceUrl,
            });
          }
        }
      }

    } catch (error) {
      console.error("[AWS Collector] 采集失败:", error);
    }

    return results;
  }
}
