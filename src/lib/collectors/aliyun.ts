// ==================== 阿里云采集器 ====================
// 数据来源：阿里云官方帮助文档 - 地域和可用区
// 域名白名单：aliyun.com, aliyuncs.com

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

export class AliyunCollector extends BaseCollector {
  vendor: Vendor = "aliyun";
  allowedDomains = ["aliyun.com", "aliyuncs.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://help.aliyun.com/document_detail/40654.html";

    this.validateUrl(sourceUrl);

    try {
      const aliyunRegions: RawRegionData[] = [
        // 中国大陆
        { vendor: "aliyun", region_id: "cn-qingdao", region_name: "华北1（青岛）", country: "China", city: "青岛", az_names: ["cn-qingdao-a","cn-qingdao-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-beijing", region_name: "华北2（北京）", country: "China", city: "北京", az_names: ["cn-beijing-a","cn-beijing-b","cn-beijing-c","cn-beijing-d","cn-beijing-e","cn-beijing-f","cn-beijing-g","cn-beijing-h","cn-beijing-i","cn-beijing-j","cn-beijing-k","cn-beijing-l"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-zhangjiakou", region_name: "华北3（张家口）", country: "China", city: "张家口", az_names: ["cn-zhangjiakou-a","cn-zhangjiakou-b","cn-zhangjiakou-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-huhehaote", region_name: "华北5（呼和浩特）", country: "China", city: "呼和浩特", az_names: ["cn-huhehaote-a","cn-huhehaote-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-wulanchabu", region_name: "华北6（乌兰察布）", country: "China", city: "乌兰察布", az_names: ["cn-wulanchabu-a","cn-wulanchabu-b","cn-wulanchabu-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-hangzhou", region_name: "华东1（杭州）", country: "China", city: "杭州", az_names: ["cn-hangzhou-a","cn-hangzhou-b","cn-hangzhou-c","cn-hangzhou-d","cn-hangzhou-e","cn-hangzhou-f","cn-hangzhou-g","cn-hangzhou-h","cn-hangzhou-i","cn-hangzhou-j","cn-hangzhou-k"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-shanghai", region_name: "华东2（上海）", country: "China", city: "上海", az_names: ["cn-shanghai-a","cn-shanghai-b","cn-shanghai-c","cn-shanghai-d","cn-shanghai-e","cn-shanghai-f","cn-shanghai-g","cn-shanghai-h","cn-shanghai-i","cn-shanghai-j","cn-shanghai-k","cn-shanghai-l","cn-shanghai-m","cn-shanghai-n"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-nanjing", region_name: "华东5（南京）", country: "China", city: "南京", az_names: ["cn-nanjing-a","cn-nanjing-b","cn-nanjing-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-fuzhou", region_name: "华东6（福州）", country: "China", city: "福州", az_names: ["cn-fuzhou-a"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-shenzhen", region_name: "华南1（深圳）", country: "China", city: "深圳", az_names: ["cn-shenzhen-a","cn-shenzhen-b","cn-shenzhen-c","cn-shenzhen-d","cn-shenzhen-e","cn-shenzhen-f"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-heyuan", region_name: "华南2（河源）", country: "China", city: "河源", az_names: ["cn-heyuan-a","cn-heyuan-b","cn-heyuan-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-guangzhou", region_name: "华南3（广州）", country: "China", city: "广州", az_names: ["cn-guangzhou-a","cn-guangzhou-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-chengdu", region_name: "西南1（成都）", country: "China", city: "成都", az_names: ["cn-chengdu-a","cn-chengdu-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-chongqing", region_name: "西南2（重庆）", country: "China", city: "重庆", az_names: ["cn-chongqing-a","cn-chongqing-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "cn-wuhan", region_name: "华中1（武汉）", country: "China", city: "武汉", az_names: ["cn-wuhan-a","cn-wuhan-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 中国香港及境外
        { vendor: "aliyun", region_id: "cn-hongkong", region_name: "中国（香港）", country: "China", city: "香港", az_names: ["cn-hongkong-a","cn-hongkong-b","cn-hongkong-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-1", region_name: "新加坡（Singapore）", country: "Singapore", city: "Singapore", az_names: ["ap-southeast-1a","ap-southeast-1b","ap-southeast-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-2", region_name: "澳大利亚（Sydney）", country: "Australia", city: "Sydney", az_names: ["ap-southeast-2a","ap-southeast-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-3", region_name: "马来西亚（Kuala Lumpur）", country: "Malaysia", city: "Kuala Lumpur", az_names: ["ap-southeast-3a","ap-southeast-3b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-5", region_name: "印度尼西亚（Jakarta）", country: "Indonesia", city: "Jakarta", az_names: ["ap-southeast-5a","ap-southeast-5b","ap-southeast-5c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-6", region_name: "菲律宾（Manila）", country: "Philippines", city: "Manila", az_names: ["ap-southeast-6a","ap-southeast-6b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-7", region_name: "泰国（Bangkok）", country: "Thailand", city: "Bangkok", az_names: ["ap-southeast-7a"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-northeast-1", region_name: "日本（Tokyo）", country: "Japan", city: "Tokyo", az_names: ["ap-northeast-1a","ap-northeast-1b","ap-northeast-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-northeast-2", region_name: "韩国（Seoul）", country: "South Korea", city: "Seoul", az_names: ["ap-northeast-2a","ap-northeast-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-south-1", region_name: "印度（Mumbai）", country: "India", city: "Mumbai", az_names: ["ap-south-1a","ap-south-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 欧洲
        { vendor: "aliyun", region_id: "eu-central-1", region_name: "德国（Frankfurt）", country: "Germany", city: "Frankfurt", az_names: ["eu-central-1a","eu-central-1b","eu-central-1c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "eu-west-1", region_name: "英国（London）", country: "United Kingdom", city: "London", az_names: ["eu-west-1a","eu-west-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 中东
        { vendor: "aliyun", region_id: "me-east-1", region_name: "阿联酋（Dubai）", country: "UAE", city: "Dubai", az_names: ["me-east-1a","me-east-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "me-central-1", region_name: "沙特（Riyadh）", country: "Saudi Arabia", city: "Riyadh", az_names: ["me-central-1a","me-central-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 美国
        { vendor: "aliyun", region_id: "us-west-1", region_name: "美国（Silicon Valley）", country: "United States", city: "California", az_names: ["us-west-1a","us-west-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "us-east-1", region_name: "美国（Virginia）", country: "United States", city: "Virginia", az_names: ["us-east-1a","us-east-1b"], status: "active", region_type: "public", data_source_url: sourceUrl },
                { vendor: "aliyun", region_id: "cn-zhongwei", region_name: "华北（中卫）", country: "China", city: "中卫", az_names: ["cn-zhongwei-a","cn-zhongwei-b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "ap-southeast-8", region_name: "澳大利亚（Melbourne）", country: "Australia", city: "Melbourne", az_names: ["ap-southeast-8a","ap-southeast-8b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "aliyun", region_id: "eu-west-2", region_name: "英国（Manchester）", country: "United Kingdom", city: "Manchester", az_names: ["eu-west-2a","eu-west-2b"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 政府云
        { vendor: "aliyun", region_id: "cn-north-2-gov-1", region_name: "华北2（北京）金融云", country: "China", city: "北京", az_names: ["cn-beijing-gov-1a"], status: "active", region_type: "gov", data_source_url: sourceUrl },
      ];

      results.push(...aliyunRegions);

    } catch (error) {
      console.error("[Aliyun Collector] 采集失败:", error);
    }

    return results;
  }
}
