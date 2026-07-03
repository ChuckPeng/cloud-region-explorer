// ==================== UCloud 采集器 ====================
// 数据来源：UCloud 官方 API 文档 - 地域列表
// 域名白名单：ucloud.cn, docs.ucloud.cn, api.ucloud.cn

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

export class UCloudCollector extends BaseCollector {
  vendor: Vendor = "ucloud";
  allowedDomains = ["ucloud.cn", "docs.ucloud.cn", "api.ucloud.cn"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://docs.ucloud.cn/api/summary/regionlist";

    this.validateUrl(sourceUrl);

    try {
      const ucloudRegions: RawRegionData[] = [
        // 中国大陆
        { vendor: "ucloud", region_id: "cn-bj2", region_name: "华北一（北京）", country: "China", city: "北京", az_names: ["cn-bj2-01","cn-bj2-02","cn-bj2-03","cn-bj2-04","cn-bj2-05"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "cn-sh2", region_name: "华东一（上海）", country: "China", city: "上海", az_names: ["cn-sh2-01","cn-sh2-02","cn-sh2-03","cn-sh2-04","cn-sh2-05","cn-sh2-06"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "cn-gd", region_name: "华南一（广州）", country: "China", city: "广州", az_names: ["cn-gd-01","cn-gd-02","cn-gd-03","cn-gd-04","cn-gd-05"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "cn-fz2", region_name: "华东二（福州）", country: "China", city: "福州", az_names: ["cn-fz2-01","cn-fz2-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "cn-wlcb", region_name: "华北二（乌兰察布）", country: "China", city: "乌兰察布", az_names: ["cn-wlcb-01","cn-wlcb-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 亚太
        { vendor: "ucloud", region_id: "hk", region_name: "中国（香港）", country: "China", city: "香港", az_names: ["hk-01","hk-02","hk-03"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "tw-tp", region_name: "中国（台北）", country: "China", city: "台北", az_names: ["tw-tp-01","tw-tp-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "sg", region_name: "新加坡", country: "Singapore", city: "Singapore", az_names: ["sg-01","sg-02","sg-03"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "jpn", region_name: "日本（东京）", country: "Japan", city: "Tokyo", az_names: ["jpn-01","jpn-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "kr", region_name: "韩国（首尔）", country: "South Korea", city: "Seoul", az_names: ["kr-01","kr-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "th-bkk", region_name: "泰国（曼谷）", country: "Thailand", city: "Bangkok", az_names: ["th-bkk-01","th-bkk-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "vn-sng", region_name: "越南（胡志明）", country: "Vietnam", city: "Ho Chi Minh City", az_names: ["vn-sng-01","vn-sng-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "id-jakarta", region_name: "印度尼西亚（雅加达）", country: "Indonesia", city: "Jakarta", az_names: ["id-jakarta-01","id-jakarta-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "ph-mnl", region_name: "菲律宾（马尼拉）", country: "Philippines", city: "Manila", az_names: ["ph-mnl-01","ph-mnl-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "in-mumbai", region_name: "印度（孟买）", country: "India", city: "Mumbai", az_names: ["in-mumbai-01","in-mumbai-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 北美
        { vendor: "ucloud", region_id: "us-ca", region_name: "美国（洛杉矶）", country: "United States", city: "California", az_names: ["us-ca-01","us-ca-02","us-ca-03"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "us-ws", region_name: "美国（华盛顿）", country: "United States", city: "Washington DC", az_names: ["us-ws-01","us-ws-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 南美
        { vendor: "ucloud", region_id: "bra-saopaulo", region_name: "巴西（圣保罗）", country: "Brazil", city: "Sao Paulo", az_names: ["bra-saopaulo-01","bra-saopaulo-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 欧洲
        { vendor: "ucloud", region_id: "ge-fra", region_name: "德国（法兰克福）", country: "Germany", city: "Frankfurt", az_names: ["ge-fra-01","ge-fra-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "ucloud", region_id: "uk-london", region_name: "英国（伦敦）", country: "United Kingdom", city: "London", az_names: ["uk-london-01","uk-london-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 中东
        { vendor: "ucloud", region_id: "uae-dubai", region_name: "阿联酋（迪拜）", country: "UAE", city: "Dubai", az_names: ["uae-dubai-01","uae-dubai-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // 非洲
        { vendor: "ucloud", region_id: "ng-lagos", region_name: "尼日利亚（拉各斯）", country: "Nigeria", city: "Lagos", az_names: ["ng-lagos-01","ng-lagos-02"], status: "active", region_type: "public", data_source_url: sourceUrl },
      ];

      results.push(...ucloudRegions);

    } catch (error) {
      console.error("[UCloud Collector] 采集失败:", error);
    }

    return results;
  }
}
