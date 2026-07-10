// ==================== 采集器基类 ====================

import { Vendor, RawRegionData, CloudRegion } from "@/types";
import { lookupCoords } from "../utils";

export abstract class BaseCollector {
  abstract vendor: Vendor;
  /** 允许访问的 URL 域名白名单 */
  abstract allowedDomains: string[];

  /**
   * 校验 URL 是否在白名单内
   */
  protected validateUrl(url: string): void {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const allowed = this.allowedDomains.some((domain) => hostname === domain || hostname.endsWith("." + domain));
    if (!allowed) {
      throw new Error(`[安全] URL ${url} 不在白名单域名内。允许的域名: ${this.allowedDomains.join(", ")}`);
    }
  }

  /**
   * 采集原始数据（子类必须实现）
   */
  abstract collect(): Promise<RawRegionData[]>;

  /**
   * 标准化为数据库记录
   */
  normalize(raw: RawRegionData[]): Omit<CloudRegion, "id">[] {
    const now = new Date().toISOString();
    return raw.map((item) => {
      const { lat, lng } = lookupCoords(item.city);
      return {
        vendor: item.vendor,
        region_id: item.region_id,
        region_name: item.region_name,
        country: item.country,
        city: item.city,
        lat,
        lng,
        az_list: JSON.stringify(item.az_names),
        az_count: item.az_names.length,
        status: (item.status as CloudRegion["status"]) || "active",
        planned_date: item.planned_date || null,
        region_type: (item.region_type as CloudRegion["region_type"]) || "public",
        data_source_url: item.data_source_url,
        fetched_at: now,
      };
    });
  }
}
