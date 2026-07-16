// ==================== Worker 共享 DB 操作 ====================
// 所有 collector 共用：写入 D1、记录采集日志

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

export async function initSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS cloud_regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL,
      region_id TEXT NOT NULL,
      region_name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      lat REAL NOT NULL DEFAULT 0,
      lng REAL NOT NULL DEFAULT 0,
      az_list TEXT NOT NULL DEFAULT '[]',
      az_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      region_type TEXT NOT NULL DEFAULT 'public',
      planned_date TEXT DEFAULT NULL,
      data_source_url TEXT NOT NULL DEFAULT '',
      fetched_at TEXT NOT NULL DEFAULT ''
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_region ON cloud_regions(vendor, region_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_vendor ON cloud_regions(vendor)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_status ON cloud_regions(status)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS collect_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL,
      regions_added INTEGER NOT NULL DEFAULT 0,
      regions_updated INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT ''
    )`),
  ]);
}

/** Upsert regions in batch. Returns { added, updated } counts. */
export async function upsertRegions(
  db: D1Database,
  vendor: string,
  regions: RegionRecord[],
): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  for (const r of regions) {
    // Check existence
    const existing = await db
      .prepare("SELECT id FROM cloud_regions WHERE vendor = ?1 AND region_id = ?2")
      .bind(vendor, r.region_id)
      .first<{ id: number }>();

    if (existing) {
      // Update
      await db
        .prepare(`UPDATE cloud_regions SET
          region_name=?1, country=?2, city=?3, lat=?4, lng=?5,
          az_list=?6, az_count=?7, status=?8, region_type=?9,
          planned_date=?10, data_source_url=?11, fetched_at=?12
          WHERE vendor=?13 AND region_id=?14`)
        .bind(r.region_name, r.country, r.city, r.lat, r.lng,
          r.az_list, r.az_count, r.status, r.region_type,
          r.planned_date, r.data_source_url, r.fetched_at,
          vendor, r.region_id)
        .run();
      updated++;
    } else {
      // Insert
      await db
        .prepare(`INSERT INTO cloud_regions
          (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, planned_date, data_source_url, fetched_at)
          VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)`)
        .bind(vendor, r.region_id, r.region_name, r.country, r.city,
          r.lat, r.lng, r.az_list, r.az_count, r.status, r.region_type,
          r.planned_date, r.data_source_url, r.fetched_at)
        .run();
      added++;
    }
  }

  return { added, updated };
}

/** Log collection result */
export async function logCollect(
  db: D1Database,
  vendor: string,
  added: number,
  updated: number,
  errors: string[],
): Promise<void> {
  await db
    .prepare("INSERT INTO collect_logs (vendor, regions_added, regions_updated, errors, created_at) VALUES (?1,?2,?3,?4,?5)")
    .bind(vendor, added, updated, JSON.stringify(errors), new Date().toISOString())
    .run();
}
