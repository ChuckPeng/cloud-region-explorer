// ==================== 数据库连接与导出 (sql.js 纯 JS 实现) ====================

import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import * as path from "path";
import * as fs from "fs";

// 数据库文件路径
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "cloud-regions.db");

let _db: SqlJsDatabase | null = null;
let _initPromise: Promise<SqlJsDatabase> | null = null;

/** 获取数据库实例（单例，自动初始化） */
export function getDb(): SqlJsDatabase {
  if (_db) return _db;
  throw new Error("数据库未初始化，请先调用 initDb()");
}

/** 确保 DB 已初始化（lazy init，幂等） */
export async function ensureDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = initDb();
  }
  return _initPromise;
}

/** 查找 sql.js WASM 文件路径 */
function findWasmPath(): string {
  // 尝试多个可能的路径（覆盖开发、standalone、Docker 场景）
  const candidates = [
    // Docker / standalone 中手动 COPY 的路径
    path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    // Next.js standalone 自动追踪的路径
    path.join(__dirname, "..", "..", "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    // 直接 require.resolve
    (() => { try { return path.join(path.dirname(require.resolve("sql.js")), "sql-wasm.wasm"); } catch { return null; } })(),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log("[DB] 找到 WASM:", p);
      return p;
    }
  }

  // 默认回退：与 sql-wasm.js 同目录
  const defaultPath = path.join(path.dirname(require.resolve("sql.js")), "sql-wasm.wasm");
  console.log("[DB] WASM 默认路径:", defaultPath);
  return defaultPath;
}

/** 初始化数据库 */
export async function initDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;

  const wasmPath = findWasmPath();
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // sql.js 请求 "sql-wasm.wasm" 时返回我们找到的路径
      if (file === "sql-wasm.wasm" || file.endsWith(".wasm")) {
        return wasmPath;
      }
      return file;
    },
  });

  let buffer: ArrayBuffer | null = null;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH).buffer as ArrayBuffer;
  }

  _db = new SQL.Database(buffer ? new Uint8Array(buffer) : undefined);

  // 自动建表
  _db.run(`
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
      data_source_url TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

}

  `);

  _db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_region ON cloud_regions(vendor, region_id);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_vendor ON cloud_regions(vendor);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_country ON cloud_regions(country);`);
  _db.run(`CREATE INDEX IF NOT EXISTS idx_status ON cloud_regions(status);`);

  _db.run(`
    CREATE TABLE IF NOT EXISTS collect_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL,
      regions_added INTEGER NOT NULL DEFAULT 0,
      regions_updated INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  console.log(`[DB] 数据库已初始化: ${DB_PATH}`);
  return _db;
}

/** 持久化数据库到磁盘 */
export function saveDb(): void {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/** 关闭数据库 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
    _initPromise = null;
  }
}

export { DB_PATH };
