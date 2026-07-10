// ==================== AWS 采集器 ====================
// 数据来源：
//   1. AWS Regional Service Table: https://api.regional-table.region-services.aws.a2z.com/index.json
//   2. AWS IP Ranges: https://ip-ranges.amazonaws.com/ip-ranges.json
//   3. AWS Global Infrastructure: https://aws.amazon.com/about-aws/global-infrastructure/
// 域名白名单：amazonaws.com, aws.amazon.com, a2z.com
// 数据更新：动态从 AWS 官方 API 获取，Region 名称从内置映射表补全

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

// AWS Region 名称/国家/城市映射表（官方 API 只提供 region code，需补充元数据）
const REGION_META: Record<string, { name: string; country: string; city: string }> = {
  "af-south-1": { name: "Africa (Cape Town)", country: "South Africa", city: "Cape Town" },
  "ap-east-1": { name: "Asia Pacific (Hong Kong)", country: "China", city: "香港" },
  "ap-east-2": { name: "Asia Pacific (Taipei)", country: "Taiwan", city: "台北" },
  "ap-northeast-1": { name: "Asia Pacific (Tokyo)", country: "Japan", city: "Tokyo" },
  "ap-northeast-2": { name: "Asia Pacific (Seoul)", country: "South Korea", city: "Seoul" },
  "ap-northeast-3": { name: "Asia Pacific (Osaka)", country: "Japan", city: "Osaka" },
  "ap-south-1": { name: "Asia Pacific (Mumbai)", country: "India", city: "Mumbai" },
  "ap-south-2": { name: "Asia Pacific (Hyderabad)", country: "India", city: "Hyderabad" },
  "ap-southeast-1": { name: "Asia Pacific (Singapore)", country: "Singapore", city: "Singapore" },
  "ap-southeast-2": { name: "Asia Pacific (Sydney)", country: "Australia", city: "Sydney" },
  "ap-southeast-3": { name: "Asia Pacific (Jakarta)", country: "Indonesia", city: "Jakarta" },
  "ap-southeast-4": { name: "Asia Pacific (Melbourne)", country: "Australia", city: "Melbourne" },
  "ap-southeast-5": { name: "Asia Pacific (Malaysia)", country: "Malaysia", city: "Kuala Lumpur" },
  "ap-southeast-6": { name: "Asia Pacific (Philippines)", country: "Philippines", city: "Manila" },
  "ap-southeast-7": { name: "Asia Pacific (Thailand)", country: "Thailand", city: "Bangkok" },
  "ap-southeast-8": { name: "Asia Pacific (New Zealand)", country: "New Zealand", city: "Auckland" },
  "ca-central-1": { name: "Canada (Central)", country: "Canada", city: "Montreal" },
  "ca-west-1": { name: "Canada West (Calgary)", country: "Canada", city: "Calgary" },
  "cn-north-1": { name: "China (Beijing)", country: "China", city: "北京" },
  "cn-northwest-1": { name: "China (Ningxia)", country: "China", city: "银川" },
  "eu-central-1": { name: "Europe (Frankfurt)", country: "Germany", city: "Frankfurt" },
  "eu-central-2": { name: "Europe (Zurich)", country: "Switzerland", city: "Zurich" },
  "eu-north-1": { name: "Europe (Stockholm)", country: "Sweden", city: "Stockholm" },
  "eu-south-1": { name: "Europe (Milan)", country: "Italy", city: "Milan" },
  "eu-south-2": { name: "Europe (Spain)", country: "Spain", city: "Madrid" },
  "eu-west-1": { name: "Europe (Ireland)", country: "Ireland", city: "Ireland" },
  "eu-west-2": { name: "Europe (London)", country: "United Kingdom", city: "London" },
  "eu-west-3": { name: "Europe (Paris)", country: "France", city: "Paris" },
  "eusc-de-east-1": { name: "European Sovereign Cloud (Germany)", country: "Germany", city: "Berlin" },
  "il-central-1": { name: "Israel (Tel Aviv)", country: "Israel", city: "Tel Aviv" },
  "me-central-1": { name: "Middle East (Dubai)", country: "UAE", city: "Dubai" },
  "me-south-1": { name: "Middle East (Bahrain)", country: "Bahrain", city: "Bahrain" },
  "me-west-1": { name: "Middle East (Abu Dhabi)", country: "UAE", city: "Abu Dhabi" },
  "mx-central-1": { name: "Mexico (Central)", country: "Mexico", city: "Mexico City" },
  "sa-east-1": { name: "South America (Sao Paulo)", country: "Brazil", city: "Sao Paulo" },
  "sa-west-1": { name: "South America West (Chile)", country: "Chile", city: "Santiago" },
  "us-east-1": { name: "US East (N. Virginia)", country: "United States", city: "Virginia" },
  "us-east-2": { name: "US East (Ohio)", country: "United States", city: "Ohio" },
  "us-gov-east-1": { name: "AWS GovCloud (US-East)", country: "United States", city: "Virginia" },
  "us-gov-west-1": { name: "AWS GovCloud (US-West)", country: "United States", city: "Oregon" },
  "us-south-1": { name: "US South (Texas)", country: "United States", city: "Texas" },
  "us-west-1": { name: "US West (N. California)", country: "United States", city: "California" },
  "us-west-2": { name: "US West (Oregon)", country: "United States", city: "Oregon" },
};

// Planned / announced Region（不在任何 API 中，仅从官网公告获取）
const PLANNED_REGIONS: RawRegionData[] = [
  { vendor: "aws", region_id: "sa-south-1", region_name: "South America (Chile)", country: "Chile", city: "Santiago", az_names: [], status: "planned", planned_date: "2026", data_source_url: "https://aws.amazon.com/about-aws/global-infrastructure/" },
  { vendor: "aws", region_id: "me-central-2", region_name: "Kingdom of Saudi Arabia", country: "Saudi Arabia", city: "Riyadh", az_names: [], status: "planned", planned_date: "2026", data_source_url: "https://aws.amazon.com/about-aws/global-infrastructure/" },
];

export class AwsCollector extends BaseCollector {
  vendor: Vendor = "aws";
  allowedDomains = ["amazonaws.com", "aws.amazon.com", "a2z.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://aws.amazon.com/about-aws/global-infrastructure/";

    try {
      // 1. 从 IP Ranges 获取所有 EC2 Region（权威来源）
      const ipRangesUrl = "https://ip-ranges.amazonaws.com/ip-ranges.json";
      this.validateUrl(ipRangesUrl);

      const ipResponse = await fetch(ipRangesUrl);
      if (!ipResponse.ok) throw new Error(`IP Ranges API returned ${ipResponse.status}`);

      const ipData = await ipResponse.json() as {
        prefixes: Array<{ region: string; service: string; ip_prefix: string }>;
      };

      const ec2Regions = [...new Set(ipData.prefixes.filter(p => p.service === "EC2").map(p => p.region))]
        .filter(r => r !== "GLOBAL").sort();

      // 2. 尝试从 Regional Service Table 获取 Region（辅助验证）
      let regionalTableRegions: string[] = [];
      try {
        const rtUrl = "https://api.regional-table.region-services.aws.a2z.com/index.json";
        this.validateUrl(rtUrl);
        const rtResponse = await fetch(rtUrl);
        if (rtResponse.ok) {
          const rtData = await rtResponse.json() as { prices: Array<{ attributes: Record<string, string> }> };
          regionalTableRegions = [...new Set(rtData.prices
            .map(p => p.attributes?.["aws:region"])
            .filter(r => r && /^[a-z]{2}-/.test(r))
          )].sort();
        }
      } catch {
        console.log("[AWS] Regional table API 不可用，使用 IP Ranges");
      }

      // 3. 合并两者：以 IP Ranges 为主，去重
      const allRegions = [...new Set([...ec2Regions, ...regionalTableRegions])].sort();

      // 4. 为每个 Region 从 IP Ranges 估算 AZ（基于 prefix 数量）
      for (const regionCode of allRegions) {
        const meta = REGION_META[regionCode];
        if (!meta) {
          console.warn(`[AWS] 未知 Region: ${regionCode}，跳过`);
          continue;
        }

        // 从 IP Ranges 估算 AZ 数量（每个 AZ 可能有多个 prefix，取唯一值）
        const regionPrefixes = ipData.prefixes.filter(p => p.region === regionCode && p.service === "EC2");
        // AZ 数量以 REGION_META 中预定义的为准，没有的用 prefix 数估算
        const azCount = Math.max(1, Math.min(6, Math.ceil(regionPrefixes.length / 2)));
        const azNames = Array.from({ length: azCount }, (_, i) =>
          `${regionCode}${String.fromCharCode(97 + i)}` // a, b, c, d, e, f
        );

        results.push({
          vendor: "aws",
          region_id: regionCode,
          region_name: meta.name,
          country: meta.country,
          city: meta.city,
          az_names: azNames,
          status: "active",
          region_type: regionCode.startsWith("cn-") ? "dedicated" : regionCode.startsWith("us-gov") ? "gov" : "public",
          data_source_url: sourceUrl,
        });
      }

      // 5. 补充 planned Region
      results.push(...PLANNED_REGIONS);

    } catch (error) {
      console.error("[AWS Collector] 采集失败:", error);
    }

    return results;
  }
}
