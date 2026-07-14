// ==================== 全局类型定义 ====================

/** 支持的云厂商 */
export const VENDORS = ["aws", "azure", "gcp", "aliyun", "huawei", "tencent", "ucloud"] as const;
export type Vendor = (typeof VENDORS)[number];

export type RegionStatus = "active" | "planned" | "retired";
export type RegionType = "public" | "gov" | "dedicated";

/** 厂商显示名映射 */
export const VENDOR_LABELS: Record<Vendor, string> = {
  aws: "AWS",
  azure: "Azure",
  gcp: "GCP",
  aliyun: "阿里云",
  huawei: "华为云",
  tencent: "腾讯云",
  ucloud: "UCloud",
};

/** 厂商颜色映射（Tailwind 颜色） */
export const VENDOR_COLORS: Record<Vendor, string> = {
  aws: "#E74C3C",
  azure: "#3498DB",
  gcp: "#F39C12",
  aliyun: "#2ECC71",
  huawei: "#9B59B6",
  tencent: "#1ABC9C",
  ucloud: "#E91E63",
};;;;;;

/** 数据库中的 Region 记录 */
export interface CloudRegion {
  id: number;
  vendor: Vendor;
  region_id: string;
  region_name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  az_list: string;       // JSON 字符串，例：'["cn-north-1a","cn-north-1b"]'
  az_count: number;
  status: RegionStatus;
  region_type: RegionType;
  data_source_url: string;
  planned_date: string | null; // 计划上线日期（仅 planned 状态有效）
  fetched_at: string;    // ISO 8601
}

/** 采集器采集到的原始数据，解析前 */
export interface RawRegionData {
  vendor: Vendor;
  region_id: string;
  region_name: string;
  country: string;
  city: string;
  az_names: string[];
  status?: string;
  region_type?: string;
  planned_date?: string;
  data_source_url: string;
}

/** API 响应：地区查询 */
export interface RegionsResponse {
  data: CloudRegion[];
  total: number;
  vendors: Vendor[];
  countries: string[];
}

/** API 响应：采集结果 */
export interface CollectResponse {
  success: boolean;
  vendor: "all" | Vendor;
  regions_added: number;
  regions_updated: number;
  duration_ms: number;
  errors: string[];
}

/** API 响应：统计概览 */
export interface StatsResponse {
  total_regions: number;
  total_azs: number;
  vendor_breakdown: Record<string, number>;
  country_breakdown: Record<string, number>;
  planned_regions: number;
  last_updated: string | null;
}
