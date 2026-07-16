// ==================== Tencent Collector Worker ====================
// 数据源: tencentcloud.com/zh/global-infrastructure (HTML 正则提取)

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

const TENCENT_META: Record<string, [string, string, string, number, string]> = {
  "ap-beijing": ["华北地区(北京)", "China", "北京", 3, "active"],
  "ap-shanghai": ["华东地区(上海)", "China", "上海", 3, "active"],
  "ap-guangzhou": ["华南地区(广州)", "China", "广州", 3, "active"],
  "ap-chengdu": ["西南地区(成都)", "China", "成都", 3, "active"],
  "ap-chongqing": ["西南地区(重庆)", "China", "重庆", 3, "active"],
  "ap-nanjing": ["华东地区(南京)", "China", "南京", 3, "active"],
  "ap-shenzhen": ["华南地区(深圳)", "China", "深圳", 3, "active"],
  "ap-hongkong": ["中国香港", "China", "香港", 3, "active"],
  "ap-singapore": ["东南亚(新加坡)", "Singapore", "Singapore", 3, "active"],
  "ap-bangkok": ["东南亚(曼谷)", "Thailand", "Bangkok", 3, "active"],
  "ap-jakarta": ["东南亚(雅加达)", "Indonesia", "Jakarta", 3, "active"],
  "ap-mumbai": ["南亚(孟买)", "India", "Mumbai", 3, "active"],
  "ap-seoul": ["东北亚(首尔)", "South Korea", "Seoul", 3, "active"],
  "ap-tokyo": ["东北亚(东京)", "Japan", "Tokyo", 3, "active"],
  "na-siliconvalley": ["美国西部(硅谷)", "United States", "California", 3, "active"],
  "na-ashburn": ["美国东部(弗吉尼亚)", "United States", "Virginia", 3, "active"],
  "eu-frankfurt": ["欧洲(法兰克福)", "Germany", "Frankfurt", 3, "active"],
  "sa-saopaulo": ["南美洲(圣保罗)", "Brazil", "Sao Paulo", 3, "active"],
  "me-dubai": ["中东(迪拜)", "UAE", "Dubai", 3, "active"],
  "me-riyadh": ["中东(利雅得)", "Saudi Arabia", "Riyadh", 3, "active"],
  "ap-taipei": ["中国台北", "Taiwan", "台北", 3, "active"],
  "ap-sydney": ["大洋洲(悉尼)", "Australia", "Sydney", 0, "planned"],
  "ap-melbourne": ["大洋洲(墨尔本)", "Australia", "Melbourne", 0, "planned"],
  "na-toronto": ["北美(多伦多)", "Canada", "Toronto", 0, "planned"],
  "eu-london": ["欧洲(伦敦)", "United Kingdom", "London", 0, "planned"],
};

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://www.tencentcloud.com/zh/global-infrastructure";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  let liveRegions: Set<string> = new Set();
  try {
    const resp = await fetch(sourceUrl, {
      headers: { "User-Agent": "CloudRegionExplorer/1.0" },
    });
    if (!resp.ok) throw new Error(`Tencent page returned ${resp.status}`);
    const html = await resp.text();

    const regionRegex = /(ap-[a-z]+|na-[a-z]+|eu-[a-z]+|sa-[a-z]+|me-[a-z]+)/g;
    let match;
    while ((match = regionRegex.exec(html)) !== null) {
      liveRegions.add(match[1].toLowerCase());
    }
    console.log(`[Tencent] Extracted ${liveRegions.size} region codes from HTML`);
  } catch (e: any) {
    errors.push("Tencent page fetch failed: " + e.message);
  }

  const records: RegionRecord[] = [];

  for (const [regionCode, [displayName, country, city, azCount, status]] of Object.entries(TENCENT_META)) {
    const coords = lookupCoords(city);

    records.push({
      vendor: "tencent",
      region_id: regionCode,
      region_name: displayName,
      country,
      city,
      lat: coords.lat,
      lng: coords.lng,
      az_list: JSON.stringify(Array.from({ length: azCount }, (_, i) => `${regionCode}-${i + 1}`)),
      az_count: azCount,
      status,
      region_type: "public",
      planned_date: status === "planned" ? "TBD" : null,
      data_source_url: sourceUrl,
      fetched_at: now,
    });
  }

  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "tencent", records);
  await logCollect(env.CLOUD_REGIONS_DB, "tencent", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "tencent",
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
    console.log("[Tencent Cron] Starting...");
    await collect(env);
    console.log("[Tencent Cron] Done.");
  },
};
