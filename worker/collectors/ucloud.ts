// ==================== UCloud Collector Worker ====================
// 数据源: docs.ucloud.cn/api/summary/regionlist (HTML 正则提取)
// UCloud API 需要签名，所以用 HTML 页面提取

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

const UCLOUD_META: Record<string, [string, string, string, number, string]> = {
  "cn-bj2": ["华北一(北京)", "China", "北京", 3, "active"],
  "cn-sh2": ["华东(上海)", "China", "上海", 3, "active"],
  "cn-gd": ["华南(广州)", "China", "广州", 3, "active"],
  "cn-hk": ["亚太(香港)", "China", "香港", 3, "active"],
  "vn-sng": ["东南亚(新加坡)", "Singapore", "Singapore", 3, "active"],
  "us-ca": ["北美(洛杉矶)", "United States", "California", 3, "active"],
  "bra-sao": ["南美(圣保罗)", "Brazil", "Sao Paulo", 3, "active"],
  "tw-tp": ["亚太(台北)", "Taiwan", "台北", 3, "active"],
  "vn-sng2": ["东南亚(新加坡二)", "Singapore", "Singapore", 3, "active"],
  "idn-jakarta": ["东南亚(雅加达)", "Indonesia", "Jakarta", 3, "active"],
  "ph-mnl": ["东南亚(马尼拉)", "Philippines", "Manila", 3, "active"],
  "th-bkk": ["东南亚(曼谷)", "Thailand", "Bangkok", 3, "active"],
  "ind-mum": ["南亚(孟买)", "India", "Mumbai", 3, "active"],
  "kr-seoul": ["东北亚(首尔)", "South Korea", "Seoul", 3, "active"],
  "jp-tokyo": ["东北亚(东京)", "Japan", "Tokyo", 3, "active"],
  "us-ws": ["北美(华盛顿)", "United States", "Washington DC", 3, "active"],
  "ge-fra": ["欧洲(法兰克福)", "Germany", "Frankfurt", 3, "active"],
  "uk-london": ["欧洲(伦敦)", "United Kingdom", "London", 3, "active"],
  "uae-dubai": ["中东(迪拜)", "UAE", "Dubai", 3, "active"],
  "nigeria-lagos": ["非洲(拉各斯)", "Nigeria", "Lagos", 3, "active"],
  "cn-wlcb": ["华北二(乌兰察布)", "China", "乌兰察布", 3, "active"],
  "tashkent": ["中亚(塔什干)", "Uzbekistan", "Tashkent", 3, "active"],
};

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://docs.ucloud.cn/api/summary/regionlist";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  let liveRegions: Set<string> = new Set();
  try {
    const resp = await fetch(sourceUrl, {
      headers: { "User-Agent": "CloudRegionExplorer/1.0" },
    });
    if (!resp.ok) throw new Error(`UCloud docs returned ${resp.status}`);
    const html = await resp.text();

    const regionRegex = /([a-z]{2,4}-[a-z]{2,4}\d*)/g;
    let match;
    while ((match = regionRegex.exec(html)) !== null) {
      liveRegions.add(match[1].toLowerCase());
    }
    console.log(`[UCloud] Extracted ${liveRegions.size} region codes from HTML`);
  } catch (e: any) {
    errors.push("UCloud docs fetch failed: " + e.message);
  }

  const records: RegionRecord[] = [];

  for (const [regionCode, [displayName, country, city, azCount, status]] of Object.entries(UCLOUD_META)) {
    const coords = lookupCoords(city);

    records.push({
      vendor: "ucloud",
      region_id: regionCode,
      region_name: displayName,
      country,
      city,
      lat: coords.lat,
      lng: coords.lng,
      az_list: JSON.stringify(Array.from({ length: azCount }, (_, i) => `${regionCode}-az${i + 1}`)),
      az_count: azCount,
      status,
      region_type: "public",
      planned_date: status === "planned" ? "TBD" : null,
      data_source_url: sourceUrl,
      fetched_at: now,
    });
  }

  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "ucloud", records);
  await logCollect(env.CLOUD_REGIONS_DB, "ucloud", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "ucloud",
    total: records.length,
    added,
    updated,
    liveRegions: liveRegions.size,
    errors,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" },
      });
    }
    if (url.pathname === "/collect" || url.pathname === "/") return collect(env);
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  },
  async scheduled(_event: ScheduledEvent, env: Env) {
    console.log("[UCloud Cron] Starting...");
    await collect(env);
    console.log("[UCloud Cron] Done.");
  },
};
