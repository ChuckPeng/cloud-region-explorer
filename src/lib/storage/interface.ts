// ==================== 存储层抽象接口 ====================
// Docker 路线: SqlJsStorage (sql.js)
// Cloudflare 路线: D1Storage (Cloudflare D1)

export interface RegionRecord {
  vendor: string;
  region_id: string;
  region_name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  az_list: string;
  az_count: number;
  status: string;
  region_type: string;
  planned_date: string | null;
  data_source_url: string;
  fetched_at: string;
}

export interface StorageBackend {
  /** 初始化存储 */
  init(): Promise<void>;
  /** 查询 Regions */
  queryRegions(params: {
    vendor?: string;
    country?: string;
    status?: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<{ data: RegionRecord[]; total: number }>;
  /** 统计概览 */
  getStats(): Promise<{
    total_regions: number;
    total_azs: number;
    vendor_breakdown: Record<string, number>;
    country_breakdown: Record<string, number>;
    planned_regions: number;
    last_updated: string | null;
  }>;
  /** 插入或更新 Region */
  upsertRegion(record: Omit<RegionRecord, "id">): Promise<void>;
  /** 获取所有 distinct vendors */
  getVendors(): Promise<string[]>;
  /** 获取所有 distinct countries */
  getCountries(): Promise<string[]>;
  /** 记录采集日志 */
  logCollection(vendor: string, added: number, updated: number, errors: string[]): Promise<void>;
  /** 获取最后更新时间 */
  getLastUpdated(): Promise<string | null>;
}