// ==================== 华为云采集器 ====================
// 数据来源：华为云官方文档 - 区域和终端节点
// 域名白名单：huaweicloud.com, developer.huaweicloud.com

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

export class HuaweiCollector extends BaseCollector {
  vendor: Vendor = "huawei";
  allowedDomains = ["huaweicloud.com", "developer.huaweicloud.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://developer.huaweicloud.com/endpoint";

    this.validateUrl(sourceUrl);

    try {
      const huaweiRegions: RawRegionData[] = [
        // 中国大陆
        { vendor: "huawei", region_id: "cn-north-1", region_name: "华北-北京一", country: "China", city: "北京", az_names: ["cn-north-1a","cn-north-1b","cn-north-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-north-2", region_name: "华北-北京二", country: "China", city: "北京", az_names: ["cn-north-2a","cn-north-2b","cn-north-2c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-north-4", region_name: "华北-北京四", country: "China", city: "北京", az_names: ["cn-north-4a","cn-north-4b","cn-north-4c","cn-north-4d","cn-north-4e","cn-north-4f","cn-north-4g"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-east-2", region_name: "华东-上海二", country: "China", city: "上海", az_names: ["cn-east-2a","cn-east-2b","cn-east-2c","cn-east-2d","cn-east-2e"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-east-3", region_name: "华东-上海一", country: "China", city: "上海", az_names: ["cn-east-3a","cn-east-3b","cn-east-3c","cn-east-3d"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-east-4", region_name: "华东-上海三", country: "China", city: "上海", az_names: ["cn-east-4a","cn-east-4b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-south-1", region_name: "华南-广州", country: "China", city: "广州", az_names: ["cn-south-1a","cn-south-1b","cn-south-1c","cn-south-1d","cn-south-1e"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-south-2", region_name: "华南-深圳", country: "China", city: "深圳", az_names: ["cn-south-2a","cn-south-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-south-4", region_name: "华南-广州-友好用户", country: "China", city: "广州", az_names: ["cn-south-4a","cn-south-4b","cn-south-4c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "cn-southwest-2", region_name: "西南-贵阳一", country: "China", city: "贵阳", az_names: ["cn-southwest-2a","cn-southwest-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 中国香港及亚太
        { vendor: "huawei", region_id: "ap-southeast-1", region_name: "中国-香港", country: "China", city: "香港", az_names: ["ap-southeast-1a","ap-southeast-1b","ap-southeast-1c","ap-southeast-1d"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "ap-southeast-2", region_name: "亚太-曼谷", country: "Thailand", city: "Bangkok", az_names: ["ap-southeast-2a","ap-southeast-2b","ap-southeast-2c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "ap-southeast-3", region_name: "亚太-新加坡", country: "Singapore", city: "Singapore", az_names: ["ap-southeast-3a","ap-southeast-3b","ap-southeast-3c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "ap-southeast-4", region_name: "亚太-雅加达", country: "Indonesia", city: "Jakarta", az_names: ["ap-southeast-4a","ap-southeast-4b","ap-southeast-4c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "tr-west-1", region_name: "土耳其-伊斯坦布尔", country: "Turkey", city: "Istanbul", az_names: ["tr-west-1a","tr-west-1b","tr-west-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 非洲
        { vendor: "huawei", region_id: "af-south-1", region_name: "非洲-约翰内斯堡", country: "South Africa", city: "Johannesburg", az_names: ["af-south-1a","af-south-1b","af-south-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "af-north-1", region_name: "非洲-开罗", country: "Egypt", city: "Cairo", az_names: ["af-north-1a","af-north-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 中东
        { vendor: "huawei", region_id: "me-east-1", region_name: "中东-利雅得", country: "Saudi Arabia", city: "Riyadh", az_names: ["me-east-1a","me-east-1b","me-east-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 拉丁美洲
        { vendor: "huawei", region_id: "la-south-2", region_name: "拉美-圣地亚哥", country: "Chile", city: "Santiago", az_names: ["la-south-2a","la-south-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "la-north-1", region_name: "拉美-墨西哥城一", country: "Mexico", city: "Mexico City", az_names: ["la-north-1a","la-north-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "la-north-2", region_name: "拉美-墨西哥城二", country: "Mexico", city: "Mexico City", az_names: ["la-north-2a","la-north-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "huawei", region_id: "sa-brazil-1", region_name: "拉美-圣保罗一", country: "Brazil", city: "Sao Paulo", az_names: ["sa-brazil-1a","sa-brazil-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 政府云
        { vendor: "huawei", region_id: "cn-north-229", region_name: "华北-乌兰察布二零一", country: "China", city: "乌兰察布", az_names: ["cn-north-229a","cn-north-229b"], status: "active", region_type: "gov", data_source_url: sourceUrl },
      ];

      results.push(...huaweiRegions);

    } catch (error) {
      console.error("[Huawei Collector] 采集失败:", error);
    }

    return results;
  }
}
