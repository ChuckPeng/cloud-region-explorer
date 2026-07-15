// ==================== D1Storage - Cloudflare 路线 ====================
// 基于 Cloudflare D1 (serverless SQLite) 的存储实现
// 部署到 Cloudflare Workers 时使用

import { StorageBackend, RegionRecord } from "./interface";

export class D1Storage implements StorageBackend {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async init(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS cloud_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT NOT NULL, region_id TEXT NOT NULL, region_name TEXT NOT NULL,
        country TEXT NOT NULL, city TEXT NOT NULL,
        lat REAL NOT NULL DEFAULT 0, lng REAL NOT NULL DEFAULT 0,
        az_list TEXT NOT NULL DEFAULT '[]', az_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active', region_type TEXT NOT NULL DEFAULT 'public',
        planned_date TEXT DEFAULT NULL,
        data_source_url TEXT NOT NULL, fetched_at TEXT NOT NULL
      );
    `);
    await this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_region ON cloud_regions(vendor, region_id);`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_vendor ON cloud_regions(vendor);`);
    await this.db.exec(`CREATE TABLE IF NOT EXISTS collect_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL, regions_added INTEGER NOT NULL DEFAULT 0,
      regions_updated INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL
    );`);
  }

  async queryRegions(params: { vendor?: string; country?: string; status?: string; search?: string; limit: number; offset: number }) {
    const conditions: string[] = [];
    const values: any[] = [];
    if (params.vendor && params.vendor !== "all") { conditions.push("vendor = ?"); values.push(params.vendor); }
    if (params.country) { conditions.push("country = ?"); values.push(params.country); }
    if (params.status) { conditions.push("status = ?"); values.push(params.status); }
    if (params.search) { conditions.push("(region_name LIKE ? OR region_id LIKE ? OR city LIKE ? OR country LIKE ?)"); const s = `%${params.search}%`; values.push(s, s, s, s); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { results: data } = await this.db.prepare(
      `SELECT * FROM cloud_regions ${where} ORDER BY vendor, country, city LIMIT ? OFFSET ?`
    ).bind(...values, params.limit, params.offset).all<RegionRecord>();

    const { results: countRows } = await this.db.prepare(
      `SELECT COUNT(*) as total FROM cloud_regions ${where}`
    ).bind(...values).all<{ total: number }>();
    return { data: data || [], total: countRows?.[0]?.total || 0 };
  }

  async getStats() {
    const db = this.db;
    const summary = await db.prepare("SELECT COUNT(*) as total_regions, COALESCE(SUM(az_count), 0) as total_azs FROM cloud_regions WHERE status = 'active'").first<{total_regions: number, total_azs: number}>();
    const totalRegions = summary?.total_regions || 0;
    const totalAzs = summary?.total_azs || 0;

    const { results: vendorRows } = await db.prepare("SELECT vendor, COUNT(*) as count FROM cloud_regions WHERE status = 'active' GROUP BY vendor ORDER BY count DESC").all<{vendor: string, count: number}>();
    const vendorBreakdown: Record<string, number> = {};
    (vendorRows || []).forEach(r => { vendorBreakdown[r.vendor] = r.count; });

    const { results: countryRows } = await db.prepare("SELECT country, COUNT(*) as count FROM cloud_regions WHERE status = 'active' GROUP BY country ORDER BY count DESC LIMIT 15").all<{country: string, count: number}>();
    const countryBreakdown: Record<string, number> = {};
    (countryRows || []).forEach(r => { countryBreakdown[r.country] = r.count; });

    const planned = await db.prepare("SELECT COUNT(*) as planned_count FROM cloud_regions WHERE status = 'planned'").first<{planned_count: number}>();
    const plannedRegions = planned?.planned_count || 0;

    const last = await db.prepare("SELECT MAX(fetched_at) as last_updated FROM cloud_regions").first<{last_updated: string}>();
    return { total_regions: totalRegions, total_azs: totalAzs, vendor_breakdown: vendorBreakdown, country_breakdown: countryBreakdown, planned_regions: plannedRegions, last_updated: last?.last_updated || null };
  }

  async upsertRegion(record: Omit<RegionRecord, "id">): Promise<void> {
    await this.db.prepare("DELETE FROM cloud_regions WHERE vendor = ? AND region_id = ?").bind(record.vendor, record.region_id).run();
    await this.db.prepare(
      "INSERT INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, planned_date, data_source_url, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(record.vendor, record.region_id, record.region_name, record.country, record.city, record.lat, record.lng, record.az_list, record.az_count, record.status, record.region_type, record.planned_date, record.data_source_url, record.fetched_at).run();
  }

  async getVendors(): Promise<string[]> {
    const { results } = await this.db.prepare("SELECT DISTINCT vendor FROM cloud_regions ORDER BY vendor").all<{vendor: string}>();
    return (results || []).map(r => r.vendor);
  }

  async getCountries(): Promise<string[]> {
    const { results } = await this.db.prepare("SELECT DISTINCT country FROM cloud_regions ORDER BY country").all<{country: string}>();
    return (results || []).map(r => r.country);
  }

  async logCollection(vendor: string, added: number, updated: number, errors: string[]): Promise<void> {
    await this.db.prepare("INSERT INTO collect_logs (vendor, regions_added, regions_updated, errors, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(vendor, added, updated, JSON.stringify(errors), new Date().toISOString()).run();
  }

  async getLastUpdated(): Promise<string | null> {
    const r = await this.db.prepare("SELECT MAX(fetched_at) as last_updated FROM cloud_regions").first<{last_updated: string}>();
    return r?.last_updated || null;
  }
}