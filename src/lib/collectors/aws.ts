// ==================== AWS 采集器 ====================
// 数据来源：AWS 官方 IP Ranges API + 官方 Region 表格文档
// 域名白名单：amazonaws.com, aws.amazon.com, docs.aws.amazon.com

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

export class AwsCollector extends BaseCollector {
  vendor: Vendor = "aws";
  allowedDomains = ["amazonaws.com", "aws.amazon.com", "docs.aws.amazon.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html";

    this.validateUrl(sourceUrl);

    try {
      // AWS 通过 ip-ranges.json 获取 Region 列表来推断
      const ipRangesUrl = "https://ip-ranges.amazonaws.com/ip-ranges.json";
      this.validateUrl(ipRangesUrl);

      const response = await fetch(ipRangesUrl);
      if (!response.ok) {
        throw new Error(`AWS IP Ranges API 返回 ${response.status}`);
      }

      const data = await response.json() as {
        prefixes: Array<{ region: string; service: string }>;
      };

      // 提取唯一的 EC2 region（代表可用 Region）
      const ec2Regions = [...new Set(data.prefixes.filter((p) => p.service === "EC2").map((p) => p.region))];

      // AWS Region 元数据（硬编码自官方文档，因为无公开 Region API）
      const awsRegionMeta: Record<string, { name: string; country: string; city: string; azs: string[] }> = {
        "us-east-1": { name: "US East (N. Virginia)", country: "United States", city: "Virginia", azs: ["us-east-1a","us-east-1b","us-east-1c","us-east-1d","us-east-1e","us-east-1f"] },
        "us-east-2": { name: "US East (Ohio)", country: "United States", city: "Ohio", azs: ["us-east-2a","us-east-2b","us-east-2c"] },
        "us-west-1": { name: "US West (N. California)", country: "United States", city: "California", azs: ["us-west-1a","us-west-1b","us-west-1c"] },
        "us-west-2": { name: "US West (Oregon)", country: "United States", city: "Oregon", azs: ["us-west-2a","us-west-2b","us-west-2c","us-west-2d"] },
        "af-south-1": { name: "Africa (Cape Town)", country: "South Africa", city: "Cape Town", azs: ["af-south-1a","af-south-1b","af-south-1c"] },
        "ap-east-1": { name: "Asia Pacific (Hong Kong)", country: "China", city: "香港", azs: ["ap-east-1a","ap-east-1b","ap-east-1c"] },
        "ap-south-1": { name: "Asia Pacific (Mumbai)", country: "India", city: "Mumbai", azs: ["ap-south-1a","ap-south-1b","ap-south-1c"] },
        "ap-south-2": { name: "Asia Pacific (Hyderabad)", country: "India", city: "Hyderabad", azs: ["ap-south-2a","ap-south-2b","ap-south-2c"] },
        "ap-southeast-1": { name: "Asia Pacific (Singapore)", country: "Singapore", city: "Singapore", azs: ["ap-southeast-1a","ap-southeast-1b","ap-southeast-1c"] },
        "ap-southeast-2": { name: "Asia Pacific (Sydney)", country: "Australia", city: "Sydney", azs: ["ap-southeast-2a","ap-southeast-2b","ap-southeast-2c"] },
        "ap-southeast-3": { name: "Asia Pacific (Jakarta)", country: "Indonesia", city: "Jakarta", azs: ["ap-southeast-3a","ap-southeast-3b","ap-southeast-3c"] },
        "ap-southeast-4": { name: "Asia Pacific (Melbourne)", country: "Australia", city: "Melbourne", azs: ["ap-southeast-4a","ap-southeast-4b","ap-southeast-4c"] },
        "ap-northeast-1": { name: "Asia Pacific (Tokyo)", country: "Japan", city: "Tokyo", azs: ["ap-northeast-1a","ap-northeast-1b","ap-northeast-1c","ap-northeast-1d"] },
        "ap-northeast-2": { name: "Asia Pacific (Seoul)", country: "South Korea", city: "Seoul", azs: ["ap-northeast-2a","ap-northeast-2b","ap-northeast-2c","ap-northeast-2d"] },
        "ap-northeast-3": { name: "Asia Pacific (Osaka)", country: "Japan", city: "Osaka", azs: ["ap-northeast-3a","ap-northeast-3b","ap-northeast-3c"] },
        "ca-central-1": { name: "Canada (Central)", country: "Canada", city: "Montreal", azs: ["ca-central-1a","ca-central-1b","ca-central-1d"] },
        "ca-west-1": { name: "Canada West (Calgary)", country: "Canada", city: "Calgary", azs: ["ca-west-1a","ca-west-1b","ca-west-1c"] },
        "eu-central-1": { name: "Europe (Frankfurt)", country: "Germany", city: "Frankfurt", azs: ["eu-central-1a","eu-central-1b","eu-central-1c"] },
        "eu-central-2": { name: "Europe (Zurich)", country: "Switzerland", city: "Zurich", azs: ["eu-central-2a","eu-central-2b","eu-central-2c"] },
        "eu-west-1": { name: "Europe (Ireland)", country: "Ireland", city: "Ireland", azs: ["eu-west-1a","eu-west-1b","eu-west-1c"] },
        "eu-west-2": { name: "Europe (London)", country: "United Kingdom", city: "London", azs: ["eu-west-2a","eu-west-2b","eu-west-2c"] },
        "eu-west-3": { name: "Europe (Paris)", country: "France", city: "Paris", azs: ["eu-west-3a","eu-west-3b","eu-west-3c"] },
        "eu-south-1": { name: "Europe (Milan)", country: "Italy", city: "Milan", azs: ["eu-south-1a","eu-south-1b","eu-south-1c"] },
        "eu-south-2": { name: "Europe (Spain)", country: "Spain", city: "Madrid", azs: ["eu-south-2a","eu-south-2b","eu-south-2c"] },
        "eu-north-1": { name: "Europe (Stockholm)", country: "Sweden", city: "Stockholm", azs: ["eu-north-1a","eu-north-1b","eu-north-1c"] },
        "me-south-1": { name: "Middle East (Bahrain)", country: "Bahrain", city: "Bahrain", azs: ["me-south-1a","me-south-1b","me-south-1c"] },
        "me-central-1": { name: "Middle East (UAE)", country: "UAE", city: "Dubai", azs: ["me-central-1a","me-central-1b","me-central-1c"] },
        "il-central-1": { name: "Israel (Tel Aviv)", country: "Israel", city: "Tel Aviv", azs: ["il-central-1a","il-central-1b","il-central-1c"] },
        "sa-east-1": { name: "South America (Sao Paulo)", country: "Brazil", city: "Sao Paulo", azs: ["sa-east-1a","sa-east-1b","sa-east-1c"] },
        "cn-north-1": { name: "China (Beijing)", country: "China", city: "北京", azs: ["cn-north-1a","cn-north-1b"] },
        "cn-northwest-1": { name: "China (Ningxia)", country: "China", city: "银川", azs: ["cn-northwest-1a","cn-northwest-1b","cn-northwest-1c"] },
      };

      for (const regionCode of ec2Regions) {
        const meta = awsRegionMeta[regionCode];
        if (meta) {
          results.push({
            vendor: "aws",
            region_id: regionCode,
            region_name: meta.name,
            country: meta.country,
            city: meta.city,
            az_names: meta.azs,
            status: "active",
            region_type: regionCode.startsWith("cn-") ? "dedicated" : "public",
            data_source_url: sourceUrl,
          });
        }
      }

      // 补充可能不在 ip-ranges 中的中国区
      for (const regionCode of ["cn-north-1", "cn-northwest-1"]) {
        if (!results.find((r) => r.region_id === regionCode)) {
          const meta = awsRegionMeta[regionCode];
          if (meta) {
            results.push({
              vendor: "aws",
              region_id: regionCode,
              region_name: meta.name,
              country: meta.country,
              city: meta.city,
              az_names: meta.azs,
              status: "active",
              region_type: "dedicated",
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
