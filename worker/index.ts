// ==================== Cloudflare Workers API (Standalone) ====================
// 独立于 Next.js 代码，仅依赖 Cloudflare D1 和静态映射数据
// 采集工作由 Docker 端负责；Worker 负责查询 API

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ========== DB 初始化（D1 不支持 exec 多条SQL，改用 batch）==========
async function initDB(db: D1Database): Promise<void> {
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
    db.prepare("CREATE INDEX IF NOT EXISTS idx_country ON cloud_regions(country)"),
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

// ========== API: GET /api/stats ==========
async function handleStats(db: D1Database): Promise<Response> {
  const summary = await db
    .prepare('SELECT COUNT(*) as total_regions, COALESCE(SUM(az_count), 0) as total_azs FROM cloud_regions WHERE status = "active"')
    .first<{ total_regions: number; total_azs: number }>();

  const totalRegions = summary?.total_regions || 0;
  const totalAzs = summary?.total_azs || 0;

  const { results: vendorRows } = await db
    .prepare('SELECT vendor, COUNT(*) as count FROM cloud_regions WHERE status = "active" GROUP BY vendor ORDER BY count DESC')
    .all<{ vendor: string; count: number }>();

  const vendorBreakdown: Record<string, number> = {};
  (vendorRows || []).forEach((r) => { vendorBreakdown[r.vendor] = r.count; });

  const { results: countryRows } = await db
    .prepare('SELECT country, COUNT(*) as count FROM cloud_regions WHERE status = "active" GROUP BY country ORDER BY count DESC LIMIT 15')
    .all<{ country: string; count: number }>();

  const countryBreakdown: Record<string, number> = {};
  (countryRows || []).forEach((r) => { countryBreakdown[r.country] = r.count; });

  const planned = await db
    .prepare('SELECT COUNT(*) as planned_count FROM cloud_regions WHERE status = "planned"')
    .first<{ planned_count: number }>();

  const last = await db
    .prepare("SELECT MAX(fetched_at) as last_updated FROM cloud_regions")
    .first<{ last_updated: string }>();

  return json({
    total_regions: totalRegions,
    total_azs: totalAzs,
    vendor_breakdown: vendorBreakdown,
    country_breakdown: countryBreakdown,
    planned_regions: planned?.planned_count || 0,
    last_updated: last?.last_updated || null,
  });
}

// ========== API: GET /api/regions ==========
async function handleRegions(db: D1Database, url: URL): Promise<Response> {
  const vendor = url.searchParams.get("vendor");
  const country = url.searchParams.get("country");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: any[] = [];

  if (vendor && vendor !== "all") { conditions.push("vendor = ?"); bindings.push(vendor); }
  if (country) { conditions.push("country = ?"); bindings.push(country); }
  if (status) { conditions.push("status = ?"); bindings.push(status); }
  if (search) {
    conditions.push("(region_name LIKE ? OR region_id LIKE ? OR city LIKE ? OR country LIKE ?)");
    const s = "%"+search+"%";
    bindings.push(s, s, s, s);
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const queryData = db
    .prepare("SELECT * FROM cloud_regions "+where+" ORDER BY vendor, country, city LIMIT ? OFFSET ?")
    .bind(...bindings, limit, offset);

  const queryCount = db
    .prepare("SELECT COUNT(*) as total FROM cloud_regions "+where)
    .bind(...bindings);

  const [{ results: data }, { results: countRows }] = await Promise.all([
    queryData.all<Record<string, unknown>>(),
    queryCount.all<{ total: number }>(),
  ]);

  const { results: vendorRows } = await db
    .prepare("SELECT DISTINCT vendor FROM cloud_regions ORDER BY vendor")
    .all<{ vendor: string }>();

  const { results: countryRows } = await db
    .prepare("SELECT DISTINCT country FROM cloud_regions ORDER BY country")
    .all<{ country: string }>();

  return json({
    data: data || [],
    total: countRows?.[0]?.total || 0,
    vendors: (vendorRows || []).map((r) => r.vendor),
    countries: (countryRows || []).map((r) => r.country),
  });
}

// ========== Main Export ==========
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      const db = env.CLOUD_REGIONS_DB;
      if (!db) {
        return json({ error: "D1 database binding (CLOUD_REGIONS_DB) not found" }, 500);
      }

      await initDB(db);

      // GET /api/stats
      if (path === "/api/stats" && request.method === "GET") {
        return handleStats(db);
      }

      // GET /api/regions
      if (path === "/api/regions" && request.method === "GET") {
        return handleRegions(db, url);
      }

      // POST /api/sync
      if (path === "/api/sync" && request.method === "POST") {
        const body: any = await request.json().catch(() => null);
        if (!body || !body.regions || !Array.isArray(body.regions)) {
          return json({ error: "Invalid payload: regions array required" }, 400);
        }

        const { regions } = body;
        let inserted = 0;
        const batch: D1PreparedStatement[] = [];
        for (const r of regions) {
          batch.push(
            db.prepare(
              "INSERT OR REPLACE INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, planned_date, data_source_url, fetched_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"
            ).bind(
              r.vendor, r.region_id, r.region_name, r.country, r.city,
              r.lat, r.lng, r.az_list || "[]", r.az_count || 0,
              r.status || "active", r.region_type || "public",
              r.planned_date || null, r.data_source_url || "", r.fetched_at || new Date().toISOString()
            )
          );
          if (batch.length >= 50) {
            await db.batch(batch);
            inserted += batch.length;
            batch.length = 0;
          }
        }
        if (batch.length > 0) {
          await db.batch(batch);
          inserted += batch.length;
        }

        if (body.vendor) {
          await db
            .prepare("INSERT INTO collect_logs (vendor, regions_added, regions_updated, errors, created_at) VALUES (?1, ?2, ?3, ?4, ?5)")
            .bind(body.vendor, inserted, 0, JSON.stringify(body.errors || []), new Date().toISOString())
            .run();
        }

        return json({ ok: true, inserted, vendor: body.vendor });
      }

      return json({ error: "Not found", path }, 404);
    } catch (e: any) {
      return json({ error: e.message, stack: e.stack }, 500);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env) {
    console.log("[Cron] Worker 定时触发。数据采集请在 Docker 端执行，然后 POST /api/sync 同步到 D1。");
  },
};
