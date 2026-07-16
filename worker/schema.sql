-- D1 数据库初始化 Schema
-- 也可以通过 Worker 的 initDB() 自动创建
-- 如果手动在 D1 Console 执行，复制下面的 SQL

CREATE TABLE IF NOT EXISTS cloud_regions (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_region ON cloud_regions(vendor, region_id);
CREATE INDEX IF NOT EXISTS idx_vendor ON cloud_regions(vendor);
CREATE INDEX IF NOT EXISTS idx_country ON cloud_regions(country);
CREATE INDEX IF NOT EXISTS idx_status ON cloud_regions(status);

CREATE TABLE IF NOT EXISTS collect_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor TEXT NOT NULL,
  regions_added INTEGER NOT NULL DEFAULT 0,
  regions_updated INTEGER NOT NULL DEFAULT 0,
  errors TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT ''
);
