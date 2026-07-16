// ==================== Huawei Collector Worker ====================
// 数据源: huaweicloud.com/intl/en-us/region/ (HTML 正则提取)
// 附内置元数据表

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

const HUAWEI_META: Record<string, [string, string, string, number, string]> = {
  "cn-north-1": ["华北-北京一", "China", "北京", 3, "active"],
  "cn-north-2": ["华北-北京二", "China", "北京", 3, "active"],
  "cn-north-4": ["华北-北京四", "China", "北京", 3, "active"],
  "cn-east-2": ["华东-上海二", "China", "上海", 3, "active"],
  "cn-east-3": ["华东-上海一", "China", "上海", 3, "active"],
  "cn-south-1": ["华南-广州", "China", "广州", 3, "active"],
  "cn-southwest-2": ["西南-贵阳一", "China", "贵阳", 3, "active"],
  "cn-east-4": ["华东-青岛", "China", "青岛", 3, "active"],
  "cn-northeast-1": ["东北-大连", "China", "大连", 3, "active"],
  "cn-south-4": ["华南-深圳", "China", "深圳", 3, "active"],
  "cn-north-5": ["华北-乌兰察布", "China", "乌兰察布", 3, "active"],
  "af-south-1": ["非洲-约翰内斯堡", "South Africa", "Johannesburg", 3, "active"],
  "ap-southeast-1": ["亚太-香港", "China", "香港", 3, "active"],
  "ap-southeast-2": ["亚太-曼谷", "Thailand", "Bangkok", 3, "active"],
  "ap-southeast-3": ["亚太-新加坡", "Singapore", "Singapore", 3, "active"],
  "ap-southeast-4": ["亚太-雅加达", "Indonesia", "Jakarta", 3, "active"],
  "ap-southeast-5": ["亚太-马尼拉", "Philippines", "Manila", 3, "active"],
  "la-north-2": ["拉美-墨西哥城一", "Mexico", "Mexico City", 3, "active"],
  "la-south-2": ["拉美-圣地亚哥", "Chile", "Santiago", 3, "active"],
  "na-mexico-1": ["拉美-墨西哥城二", "Mexico", "Mexico City", 3, "active"],
  "sa-brazil-1": ["拉美-圣保罗一", "Brazil", "Sao Paulo", 3, "active"],
  "tr-west-1": ["土耳其-伊斯坦布尔", "Turkey", "Istanbul", 3, "active"],
  "ap-southeast-6": ["亚太-开罗", "Egypt", "Cairo", 3, "active"],
};

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://www.huaweicloud.com/intl/en-us/region/";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  let liveRegions: Set<string> = new Set();
  try {
    // Try multiple URLs since Huawei may block from certain locations
    const urls = [
      "https://www.huaweicloud.com/intl/en-us/region/",
      "https://www.huaweicloud.com/about/global-infrastructure.html",
    ];
    for (const url of urls) {
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "CloudRegionExplorer/1.0" },
        });
        if (resp.ok) {
          const html = await resp.text();
          const regionRegex = /([a-z]{2}-[a-z]+-\d+|[a-z]+-[a-z]+-\d+)/g;
          let match;
          while ((match = regionRegex.exec(html)) !== null) {
            liveRegions.add(match[1].toLowerCase());
          }
          console.log(`[Huawei] Extracted ${liveRegions.size} region codes from ${url}`);
          if (liveRegions.size > 0) break;
        }
      } catch { /* try next */ }
    }
  } catch (e: any) {
    errors.push("Huawei page fetch failed: " + e.message);
  }

  const records: RegionRecord[] = [];

  for (const [regionCode, [displayName, country, city, azCount, status]] of Object.entries(HUAWEI_META)) {
    const coords = lookupCoords(city);

    records.push({
      vendor: "huawei",
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

  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "huawei", records);
  await logCollect(env.CLOUD_REGIONS_DB, "huawei", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "huawei",
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
    console.log("[Huawei Cron] Starting...");
    await collect(env);
    console.log("[Huawei Cron] Done.");
  },
};
