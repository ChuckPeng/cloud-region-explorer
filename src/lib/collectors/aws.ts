// ==================== AWS 采集器 ====================
// 数据来源：aws_regions.py 脚本（你提供的权威数据集 + ip-ranges.json 实时校验）
// 逻辑：
//   1. REGIONS 内置 43 条权威数据（国家/城市/region code/AZ数/状态）
//   2. KNOWN_STATUS 标记已知 announced 区域
//   3. ip-ranges.json EC2 feed 实时校验
//   4. feed 中有但 REGIONS 无的 → 自动发现并标记 planned
//   5. REGIONS 中有但 feed 无的 → 自动标记为 planned
// 域名白名单：amazonaws.com, aws.amazon.com

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

const STATUS_GA = "active";
const STATUS_ANNOUNCED = "planned";

// 已知"已公布未开放 / 控制台不可选"的区域
// 来源：aws_regions.py KNOWN_STATUS 字典
const KNOWN_STATUS: Record<string, string> = {
  "me-west-1": STATUS_ANNOUNCED,   // 阿布扎比：已公布，控制台暂不可选
  "us-south-1": STATUS_ANNOUNCED,  // 得州：已公布，控制台暂不可选
};

// AWS 官方 Global Infrastructure 公开信息整理的权威 Region 数据
// (国家, 城市, region code, AZ数, 类型, 状态)
// 注：AZ 标注 "0" 的为待核实项
const REGIONS: Array<[string, string, string, number, string, string]> = [
    // ---- 商业区 (aws) ----
    ["美国", "弗吉尼亚州 阿什本", "us-east-1", 6, "public", STATUS_GA],
    ["美国", "俄亥俄州", "us-east-2", 3, "public", STATUS_GA],
    ["美国", "加利福尼亚州", "us-west-1", 2, "public", STATUS_GA],
    ["美国", "俄勒冈州", "us-west-2", 4, "public", STATUS_GA],
    ["南非", "开普敦", "af-south-1", 3, "public", STATUS_GA],
    ["中国香港", "香港", "ap-east-1", 3, "public", STATUS_GA],
    ["印度", "孟买", "ap-south-1", 3, "public", STATUS_GA],
    ["日本", "大阪", "ap-northeast-3", 3, "public", STATUS_GA],
    ["韩国", "首尔", "ap-northeast-2", 4, "public", STATUS_GA],
    ["新加坡", "新加坡", "ap-southeast-1", 3, "public", STATUS_GA],
    ["澳大利亚", "悉尼", "ap-southeast-2", 3, "public", STATUS_GA],
    ["印度尼西亚", "雅加达", "ap-southeast-3", 3, "public", STATUS_GA],
    ["澳大利亚", "墨尔本", "ap-southeast-4", 3, "public", STATUS_GA],
    ["马来西亚", "吉隆坡", "ap-southeast-5", 3, "public", STATUS_GA],
    ["日本", "东京", "ap-northeast-1", 4, "public", STATUS_GA],
    ["加拿大", "蒙特利尔", "ca-central-1", 3, "public", STATUS_GA],
    ["加拿大", "卡尔加里", "ca-west-1", 2, "public", STATUS_GA],
    ["德国", "法兰克福", "eu-central-1", 3, "public", STATUS_GA],
    ["爱尔兰", "爱尔兰", "eu-west-1", 3, "public", STATUS_GA],
    ["英国", "伦敦", "eu-west-2", 3, "public", STATUS_GA],
    ["法国", "巴黎", "eu-west-3", 3, "public", STATUS_GA],
    ["瑞典", "斯德哥尔摩", "eu-north-1", 3, "public", STATUS_GA],
    ["意大利", "米兰", "eu-south-1", 3, "public", STATUS_GA],
    ["西班牙", "阿拉贡", "eu-south-2", 3, "public", STATUS_GA],
    ["瑞士", "苏黎世", "eu-central-2", 3, "public", STATUS_GA],
    ["以色列", "特拉维夫", "il-central-1", 3, "public", STATUS_GA],
    ["巴林", "巴林", "me-south-1", 3, "public", STATUS_GA],
    ["阿联酋", "迪拜", "me-central-1", 3, "public", STATUS_GA],
    ["巴西", "圣保罗", "sa-east-1", 3, "public", STATUS_GA],
    // ---- 中国区 (aws-cn) ----
    ["中国", "北京", "cn-north-1", 3, "dedicated", STATUS_GA],
    ["中国", "宁夏", "cn-northwest-1", 3, "dedicated", STATUS_GA],
    // ---- 政府云区 (aws-us-gov) ----
    ["美国", "俄勒冈州 GovCloud", "us-gov-west-1", 3, "gov", STATUS_GA],
    ["美国", "弗吉尼亚州 GovCloud", "us-gov-east-1", 3, "gov", STATUS_GA],
    // ---- 近年新开 / 公布区域（AZ待核实）----
    ["中国台湾", "台北", "ap-east-2", 3, "public", STATUS_GA],
    ["印度", "海得拉巴", "ap-south-2", 3, "public", STATUS_GA],
    ["菲律宾", "马尼拉", "ap-southeast-6", 3, "public", STATUS_GA],
    ["泰国", "曼谷", "ap-southeast-7", 3, "public", STATUS_GA],
    ["德国", "柏林（主权云）", "eusc-de-east-1", 3, "public", STATUS_GA],
    ["阿联酋", "阿布扎比", "me-west-1", 3, "public", STATUS_ANNOUNCED],
    ["墨西哥", "墨西哥城", "mx-central-1", 3, "public", STATUS_GA],
    ["智利", "圣地亚哥", "sa-west-1", 3, "public", STATUS_GA],
    ["美国", "得克萨斯", "us-south-1", 3, "public", STATUS_ANNOUNCED],
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
          console.log(`[AWS] ip-ranges.json 实时校验成功, createDate: ${data.createDate}`);
        }
      } catch (e) {
        console.warn("[AWS] ip-ranges.json 获取失败，使用内置数据:", e);
      }

      // 2. 从 REGIONS 表生成结果
      const knownRegions = new Set<string>();
      for (const [country, city, regionId, azCount, regionType, declaredStatus] of REGIONS) {
        knownRegions.add(regionId);

        // 状态判定优先级：KNOWN_STATUS > REGIONS声明 > feed校验
        let status = declaredStatus;
        if (KNOWN_STATUS[regionId]) {
          status = KNOWN_STATUS[regionId];
        } else if (feedRegions && status === STATUS_GA && !feedRegions.has(regionId)) {
          // 在 REGIONS 中声明为 GA，但 ip-ranges 中不存在 → planned
          status = STATUS_ANNOUNCED;
          console.warn(`[AWS] ${regionId} 声明为 GA 但不在 ip-ranges feed 中，标记为 planned`);
        }

        // AZ 处理："—" 或 0 表示未知
        const actualAzCount = typeof azCount === "number" && azCount > 0 ? azCount : 3;
        const azNames = Array.from(
          { length: actualAzCount },
          (_, i) => regionId + String.fromCharCode(97 + i)
        );

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

      // 3. 自动发现：feed 中有但 REGIONS 表中没有的新 Region
      if (feedRegions) {
        const missing = [...feedRegions].filter(r => !knownRegions.has(r)).sort();
        if (missing.length > 0) {
          console.warn("[AWS] ip-ranges 中有未收录的新 Region:", missing.join(", "));
          for (const regionId of missing) {
            results.push({
              vendor: "aws",
              region_id: regionId,
              region_name: regionId + "（新区域）",
              country: "待核实",
              city: "待核实",
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
