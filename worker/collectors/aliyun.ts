// ==================== Aliyun Collector Worker ====================
// 数据源: help.aliyun.com/zh/document_detail/40654.html (HTML 正则提取)
// 备选: www.alibabacloud.com/zh/global-locations

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

// Aliyun region → [displayName, country, city, azCount, status]
const ALIYUN_META: Record<string, [string, string, string, number, string]> = {
  "cn-hangzhou": ["华东1(杭州)", "China", "杭州", 3, "active"],
  "cn-shanghai": ["华东2(上海)", "China", "上海", 3, "active"],
  "cn-nanjing": ["华东5(南京)", "China", "南京", 3, "active"],
  "cn-beijing": ["华北2(北京)", "China", "北京", 3, "active"],
  "cn-zhangjiakou": ["华北3(张家口)", "China", "张家口", 3, "active"],
  "cn-huhehaote": ["华北5(呼和浩特)", "China", "呼和浩特", 3, "active"],
  "cn-wulanchabu": ["华北6(乌兰察布)", "China", "乌兰察布", 3, "active"],
  "cn-shenzhen": ["华南1(深圳)", "China", "深圳", 3, "active"],
  "cn-guangzhou": ["华南2(广州)", "China", "广州", 3, "active"],
  "cn-heyuan": ["华南3(河源)", "China", "河源", 3, "active"],
  "cn-chengdu": ["西南1(成都)", "China", "成都", 3, "active"],
  "cn-qingdao": ["华北1(青岛)", "China", "青岛", 3, "active"],
  "cn-zhongwei": ["西北2(中卫)", "China", "中卫", 3, "active"],
  "cn-fuzhou": ["华东6(福州)", "China", "福州", 3, "active"],
  "cn-wuhan": ["华中1(武汉)", "China", "武汉", 3, "active"],
  "cn-shenyang": ["东北2(沈阳)", "China", "沈阳", 3, "active"],
  "cn-jinan": ["华东7(济南)", "China", "济南", 3, "active"],
  "cn-hongkong": ["香港", "China", "香港", 3, "active"],
  "ap-southeast-1": ["新加坡", "Singapore", "Singapore", 3, "active"],
  "ap-southeast-2": ["澳大利亚(悉尼)", "Australia", "Sydney", 3, "active"],
  "ap-southeast-3": ["马来西亚(吉隆坡)", "Malaysia", "Kuala Lumpur", 3, "active"],
  "ap-southeast-5": ["印度尼西亚(雅加达)", "Indonesia", "Jakarta", 3, "active"],
  "ap-southeast-6": ["菲律宾(马尼拉)", "Philippines", "Manila", 3, "active"],
  "ap-southeast-7": ["泰国(曼谷)", "Thailand", "Bangkok", 3, "active"],
  "ap-south-1": ["印度(孟买)", "India", "Mumbai", 3, "active"],
  "ap-northeast-1": ["日本(东京)", "Japan", "Tokyo", 3, "active"],
  "ap-northeast-2": ["韩国(首尔)", "South Korea", "Seoul", 3, "active"],
  "us-east-1": ["美国(弗吉尼亚)", "United States", "Virginia", 3, "active"],
  "us-west-1": ["美国(硅谷)", "United States", "California", 3, "active"],
  "eu-central-1": ["德国(法兰克福)", "Germany", "Frankfurt", 3, "active"],
  "eu-west-1": ["英国(伦敦)", "United Kingdom", "London", 3, "active"],
  "me-east-1": ["阿联酋(迪拜)", "UAE", "Dubai", 3, "active"],
  "me-central-1": ["沙特(利雅得)", "Saudi Arabia", "Riyadh", 3, "active"],
  "ap-southeast-8": ["新西兰(奥克兰)", "New Zealand", "Auckland", 0, "planned"],
  "ap-south-2": ["印度(德里)", "India", "Delhi", 0, "planned"],
};

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://www.alibabacloud.com/zh/global-locations";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  // Fetch help page to discover new regions
  let liveRegions: Set<string> = new Set();
  try {
    const resp = await fetch("https://help.aliyun.com/zh/document_detail/40654.html", {
      headers: { "User-Agent": "CloudRegionExplorer/1.0" },
    });
    if (!resp.ok) throw new Error(`Aliyun help returned ${resp.status}`);
    const html = await resp.text();

    // Extract region IDs: cn-xxxx, ap-xxxx-x, us-xxxx-x, eu-xxxx-x, me-xxxx-x
    const regionRegex = /(cn-[a-z]+|ap-[a-z]+-\d+|us-[a-z]+-\d+|eu-[a-z]+-\d+|me-[a-z]+-\d+)/g;
    let match;
    while ((match = regionRegex.exec(html)) !== null) {
      liveRegions.add(match[1].toLowerCase());
    }
    console.log(`[Aliyun] Extracted ${liveRegions.size} region codes from HTML`);
  } catch (e: any) {
    errors.push("Aliyun help page fetch failed: " + e.message);
  }

  const records: RegionRecord[] = [];

  for (const [regionCode, [displayName, country, city, azCount, status]] of Object.entries(ALIYUN_META)) {
    const inLive = liveRegions.has(regionCode.toLowerCase()) || status === "planned";
    const finalStatus = (status === "active" && !inLive) ? "planned" : status;

    const coords = lookupCoords(city);

    records.push({
      vendor: "aliyun",
      region_id: regionCode,
      region_name: displayName,
      country,
      city,
      lat: coords.lat,
      lng: coords.lng,
      az_list: JSON.stringify(Array.from({ length: azCount }, (_, i) => `${regionCode}-${String.fromCharCode(97 + i)}`)),
      az_count: azCount,
      status: finalStatus,
      region_type: "public",
      planned_date: finalStatus === "planned" ? "TBD" : null,
      data_source_url: sourceUrl,
      fetched_at: now,
    });
  }

  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "aliyun", records);
  await logCollect(env.CLOUD_REGIONS_DB, "aliyun", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "aliyun",
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
    console.log("[Aliyun Cron] Starting...");
    await collect(env);
    console.log("[Aliyun Cron] Done.");
  },
};
