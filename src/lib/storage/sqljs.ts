// ==================== SqlJsStorage - Docker 路线 ====================
// 基于 sql.js 的内存 + 磁盘持久化存储

import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import * as path from "path";
import * as fs from "fs";
import { StorageBackend, RegionRecord } from "./interface";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, "cloud-regions.db");

let _db: SqlJsDatabase | null = null;
let _initPromise: Promise<SqlJsDatabase> | null = null;

function findWasmPath(): string {
  const candidates = [
    path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    path.join(__dirname, "..", "..", "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    (() => { try { return path.join(path.dirname(require.resolve("sql.js")), "sql-wasm.wasm"); } catch { return null; } })(),
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    if (fs.existsSync(p)) { console.log("[DB] 找到 WASM:", p); return p; }
  }
  return path.join(path.dirname(require.resolve("sql.js")), "sql-wasm.wasm");
}

async function initDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;
  const wasmPath = findWasmPath();
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file === "sql-wasm.wasm" || file.endsWith(".wasm")) return wasmPath;
      return file;
    },
  });
  let buffer: ArrayBuffer | null = null;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH).buffer as ArrayBuffer;
  }
  _db = new SQL.Database(buffer ? new Uint8Array(buffer) : undefined);
  _db.run(`
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
  _db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_region ON cloud_regions(vendor, region_id);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_vendor ON cloud_regions(vendor);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_country ON cloud_regions(country);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_status ON cloud_regions(status);`);
  _db.run(`
    CREATE TABLE IF NOT EXISTS collect_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL, regions_added INTEGER NOT NULL DEFAULT 0,
      regions_updated INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]', duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  console.log(`[DB] 数据库已初始化: ${DB_PATH}`);
  return _db;
}

function saveDb(): void {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getDb(): SqlJsDatabase {
  if (_db) return _db;
  throw new Error("数据库未初始化");
}

function firstValue(result: any, field: string): any {
  if (result.length > 0 && result[0].values.length > 0) {
    const idx = result[0].columns.indexOf(field);
    return idx >= 0 ? result[0].values[0][idx] : null;
  }
  return null;
}

export class SqlJsStorage implements StorageBackend {
  async init(): Promise<void> {
    if (!_initPromise) _initPromise = initDb();
    await _initPromise;
  }

  async queryRegions(params: { vendor?: string; country?: string; status?: string; search?: string; limit: number; offset: number }) {
    const db = getDb();
    const conditions: string[] = [];
    const values: any[] = [];
    if (params.vendor && params.vendor !== "all") { conditions.push("vendor = ?"); values.push(params.vendor); }
    if (params.country) { conditions.push("country = ?"); values.push(params.country); }
    if (params.status) { conditions.push("status = ?"); values.push(params.status); }
    if (params.search) { conditions.push("(region_name LIKE ? OR region_id LIKE ? OR city LIKE ? OR country LIKE ?)"); const s = `%${params.search}%`; values.push(s, s, s, s); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataResult = db.exec(`SELECT * FROM cloud_regions ${where} ORDER BY vendor, country, city LIMIT ? OFFSET ?`, [...values, params.limit, params.offset]);
    const columns = dataResult.length > 0 ? dataResult[0].columns : [];
    const rows = dataResult.length > 0 ? dataResult[0].values : [];
    const data = rows.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj as RegionRecord;
    });
    const countResult = db.exec(`SELECT COUNT(*) as total FROM cloud_regions ${where}`, values);
    const total = countResult.length > 0 ? (countResult[0].values[0]?.[0] as number) : 0;
    return { data, total };
  }

  async getStats() {
    const db = getDb();
    const summary = db.exec("SELECT COUNT(*) as total_regions, COALESCE(SUM(az_count), 0) as total_azs FROM cloud_regions WHERE status = 'active'");
    const totalRegions = firstValue(summary, "total_regions") || 0;
    const totalAzs = firstValue(summary, "total_azs") || 0;
    const vendorResult = db.exec("SELECT vendor, COUNT(*) as count FROM cloud_regions WHERE status = 'active' GROUP BY vendor ORDER BY count DESC");
    const vendorBreakdown: Record<string, number> = {};
    if (vendorResult.length > 0) {
      for (const row of vendorResult[0].values) { vendorBreakdown[row[0] as string] = row[1] as number; }
    }
    const countryResult = db.exec("SELECT country, COUNT(*) as count FROM cloud_regions WHERE status = 'active' GROUP BY country ORDER BY count DESC LIMIT 15");
    const countryBreakdown: Record<string, number> = {};
    if (countryResult.length > 0) {
      for (const row of countryResult[0].values) { countryBreakdown[row[0] as string] = row[1] as number; }
    }
    const plannedResult = db.exec("SELECT COUNT(*) as planned_count FROM cloud_regions WHERE status = 'planned'");
    const plannedRegions = firstValue(plannedResult, "planned_count") || 0;
    const lastResult = db.exec("SELECT MAX(fetched_at) as last_updated FROM cloud_regions");
    const lastUpdated = firstValue(lastResult, "last_updated") || null;
    return { total_regions: totalRegions, total_azs: totalAzs, vendor_breakdown: vendorBreakdown, country_breakdown: countryBreakdown, planned_regions: plannedRegions, last_updated: lastUpdated };
  }

  async upsertRegion(record: Omit<RegionRecord, "id">): Promise<void> {
    const db = getDb();
    db.run("DELETE FROM cloud_regions WHERE vendor = ? AND region_id = ?", [record.vendor, record.region_id]);
    db.run(
      "INSERT INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, planned_date, data_source_url, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [record.vendor, record.region_id, record.region_name, record.country, record.city, record.lat, record.lng, record.az_list, record.az_count, record.status, record.region_type, record.planned_date, record.data_source_url, record.fetched_at]
    );
    saveDb();
  }

  async getVendors(): Promise<string[]> {
    const db = getDb();
    const r = db.exec("SELECT DISTINCT vendor FROM cloud_regions ORDER BY vendor");
    return r.length > 0 ? r[0].values.map((v: any[]) => v[0]) : [];
  }

  async getCountries(): Promise<string[]> {
    const db = getDb();
    const r = db.exec("SELECT DISTINCT country FROM cloud_regions ORDER BY country");
    return r.length > 0 ? r[0].values.map((v: any[]) => v[0]) : [];
  }

  async logCollection(vendor: string, added: number, updated: number, errors: string[]): Promise<void> {
    const db = getDb();
    try {
      db.run("INSERT INTO collect_logs (vendor, regions_added, regions_updated, errors, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [vendor, added, updated, JSON.stringify(errors), 0, new Date().toISOString()]
      );
      saveDb();
    } catch (e) {
      console.warn("[SqlJsStorage] collect_logs 写入失败:", e);
    }
  }

  async getLastUpdated(): Promise<string | null> {
    const db = getDb();
    return firstValue(db.exec("SELECT MAX(fetched_at) as last_updated FROM cloud_regions"), "last_updated") || null;
  }
}

export const sqlJsStorage = new SqlJsStorage();
export { getDb, saveDb };
export const ensureDbCompat = () => sqlJsStorage.init();
