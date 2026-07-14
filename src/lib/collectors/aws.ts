// ==================== AWS 采集器 ====================
// 数据来源：aws_regions.py + ip-ranges.json 实时校验
// 域名白名单：amazonaws.com, aws.amazon.com, a2z.com

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

const STATUS_GA = "active";
const STATUS_ANNOUNCED = "planned";

// Region 元数据：英文国家名，中国城市用中文
const REGIONS: Array<[string, string, string, number, string, string]> = [
    ["United States", "Virginia", "us-east-1", 6, "public", STATUS_GA],
    ["United States", "Ohio", "us-east-2", 3, "public", STATUS_GA],
    ["United States", "California", "us-west-1", 2, "public", STATUS_GA],
    ["United States", "Oregon", "us-west-2", 4, "public", STATUS_GA],
    ["South Africa", "Cape Town", "af-south-1", 3, "public", STATUS_GA],
    ["China", "香港", "ap-east-1", 3, "public", STATUS_GA],
    ["India", "Mumbai", "ap-south-1", 3, "public", STATUS_GA],
    ["Japan", "Osaka", "ap-northeast-3", 3, "public", STATUS_GA],
    ["South Korea", "Seoul", "ap-northeast-2", 4, "public", STATUS_GA],
    ["Singapore", "Singapore", "ap-southeast-1", 3, "public", STATUS_GA],
    ["Australia", "Sydney", "ap-southeast-2", 3, "public", STATUS_GA],
    ["Indonesia", "Jakarta", "ap-southeast-3", 3, "public", STATUS_GA],
    ["Australia", "Melbourne", "ap-southeast-4", 3, "public", STATUS_GA],
    ["Malaysia", "Kuala Lumpur", "ap-southeast-5", 3, "public", STATUS_GA],
    ["Japan", "Tokyo", "ap-northeast-1", 4, "public", STATUS_GA],
    ["Canada", "Montreal", "ca-central-1", 3, "public", STATUS_GA],
    ["Canada", "Calgary", "ca-west-1", 2, "public", STATUS_GA],
    ["Germany", "Frankfurt", "eu-central-1", 3, "public", STATUS_GA],
    ["Ireland", "Ireland", "eu-west-1", 3, "public", STATUS_GA],
    ["United Kingdom", "London", "eu-west-2", 3, "public", STATUS_GA],
    ["France", "Paris", "eu-west-3", 3, "public", STATUS_GA],
    ["Sweden", "Stockholm", "eu-north-1", 3, "public", STATUS_GA],
    ["Italy", "Milan", "eu-south-1", 3, "public", STATUS_GA],
    ["Spain", "Madrid", "eu-south-2", 3, "public", STATUS_GA],
    ["Switzerland", "Zurich", "eu-central-2", 3, "public", STATUS_GA],
    ["Israel", "Tel Aviv", "il-central-1", 3, "public", STATUS_GA],
    ["Bahrain", "Bahrain", "me-south-1", 3, "public", STATUS_GA],
    ["UAE", "Dubai", "me-central-1", 3, "public", STATUS_GA],
    ["Brazil", "Sao Paulo", "sa-east-1", 3, "public", STATUS_GA],
    ["Mexico", "Mexico City", "mx-central-1", 0, "public", STATUS_GA],
    ["India", "Hyderabad", "ap-south-2", 3, "public", STATUS_GA],
    ["Philippines", "Manila", "ap-southeast-6", 0, "public", STATUS_GA],
    ["Thailand", "Bangkok", "ap-southeast-7", 3, "public", STATUS_GA],
    ["New Zealand", "Auckland", "ap-southeast-8", 3, "public", STATUS_GA],
    ["Taiwan", "台北", "ap-east-2", 0, "public", STATUS_GA],
    ["UAE", "Abu Dhabi", "me-west-1", 0, "public", STATUS_ANNOUNCED],
    ["Chile", "Santiago", "sa-south-1", 0, "public", STATUS_ANNOUNCED],
    ["United States", "Texas", "us-south-1", 0, "public", STATUS_ANNOUNCED],
    ["Germany", "Berlin", "eusc-de-east-1", 0, "public", STATUS_GA],
    ["Chile", "Santiago", "sa-west-1", 0, "public", STATUS_GA],
    // GovCloud
    ["United States", "Virginia", "us-gov-east-1", 3, "gov", STATUS_GA],
    ["United States", "Oregon", "us-gov-west-1", 3, "gov", STATUS_GA],
    // China
    ["China", "北京", "cn-north-1", 3, "dedicated", STATUS_GA],
    ["China", "银川", "cn-northwest-1", 3, "dedicated", STATUS_GA],
    // Saudi Arabia planned
    ["Saudi Arabia", "Riyadh", "me-central-2", 0, "public", STATUS_ANNOUNCED],
];

export class AwsCollector extends BaseCollector {
  vendor: Vendor = "aws";
  allowedDomains = ["amazonaws.com", "aws.amazon.com", "a2z.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://aws.amazon.com/about-aws/global-infrastructure/";

    try {
      // 从 IP Ranges 获取 EC2 Region（权威来源）
      const ipRangesUrl = "https://ip-ranges.amazonaws.com/ip-ranges.json";
      this.validateUrl(ipRangesUrl);

      const response = await fetch(ipRangesUrl);
      if (!response.ok) throw new Error(`AWS IP Ranges returned ${response.status}`);

      const data = await response.json() as {
        prefixes: Array<{ region: string; service: string }>;
        createDate: string;
      };

      const ec2Regions = new Set(
        data.prefixes.filter(p => p.service === "EC2").map(p => p.region)
      );
      console.log("[AWS] ip-ranges.json 实时校验成功, createDate:", data.createDate);

      for (const [country, city, regionCode, azCount, regionType, status] of REGIONS) {
        // 校验：在 ip-ranges 中是否存在
        const inFeed = ec2Regions.has(regionCode);

        // AZ 名称生成
        const azNames = azCount > 0
          ? Array.from({ length: azCount }, (_, i) => regionCode + String.fromCharCode(97 + i))
          : [];

        // 状态判定
        let finalStatus = status;
        if (status === STATUS_GA && !inFeed) {
          finalStatus = STATUS_ANNOUNCED;
        }

        results.push({
          vendor: "aws",
          region_id: regionCode,
          region_name: city,
          country: country,
          city: city,
          az_names: azNames,
          status: finalStatus,
          region_type: regionType,
          planned_date: finalStatus === STATUS_ANNOUNCED ? "TBD" : undefined,
          data_source_url: sourceUrl,
        });
      }

      // 自动发现 ip-ranges 中有但 REGIONS 中没有的新 Region
      for (const regionCode of ec2Regions) {
        if (regionCode === "GLOBAL") continue;
        if (!REGIONS.find(r => r[2] === regionCode)) {
          console.warn("[AWS] 发现新 Region（ip-ranges 中有但 REGIONS 表无）:", regionCode);
          results.push({
            vendor: "aws",
            region_id: regionCode,
            region_name: regionCode,
            country: "待核实",
            city: "待核实",
            az_names: [],
            status: "active",
            region_type: "public",
            data_source_url: sourceUrl,
          });
        }
      }

    } catch (error) {
      console.error("[AWS Collector] 采集失败:", error);
    }

    return results;
  }
}
