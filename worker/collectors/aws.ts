// ==================== AWS Collector Worker ====================
// 数据源: ip-ranges.amazonaws.com/ip-ranges.json (实时)
// + 内置 region 元数据表 (名称/国家/城市/AZ数)
// Cron: 每天一次, 也可手动 POST /collect 触发

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

// AWS region 元数据: [country, city, regionCode, azCount, type, status]
const AWS_META: Array<[string, string, string, number, string, string]> = [
  ["United States", "Virginia", "us-east-1", 6, "public", "active"],
  ["United States", "Ohio", "us-east-2", 3, "public", "active"],
  ["United States", "California", "us-west-1", 2, "public", "active"],
  ["United States", "Oregon", "us-west-2", 4, "public", "active"],
  ["South Africa", "Cape Town", "af-south-1", 3, "public", "active"],
  ["China", "香港", "ap-east-1", 3, "public", "active"],
  ["India", "Mumbai", "ap-south-1", 3, "public", "active"],
  ["Japan", "Osaka", "ap-northeast-3", 3, "public", "active"],
  ["South Korea", "Seoul", "ap-northeast-2", 4, "public", "active"],
  ["Singapore", "Singapore", "ap-southeast-1", 3, "public", "active"],
  ["Australia", "Sydney", "ap-southeast-2", 3, "public", "active"],
  ["Indonesia", "Jakarta", "ap-southeast-3", 3, "public", "active"],
  ["Australia", "Melbourne", "ap-southeast-4", 3, "public", "active"],
  ["Malaysia", "Kuala Lumpur", "ap-southeast-5", 3, "public", "active"],
  ["Japan", "Tokyo", "ap-northeast-1", 4, "public", "active"],
  ["Canada", "Montreal", "ca-central-1", 3, "public", "active"],
  ["Canada", "Calgary", "ca-west-1", 2, "public", "active"],
  ["Germany", "Frankfurt", "eu-central-1", 3, "public", "active"],
  ["Ireland", "Ireland", "eu-west-1", 3, "public", "active"],
  ["United Kingdom", "London", "eu-west-2", 3, "public", "active"],
  ["France", "Paris", "eu-west-3", 3, "public", "active"],
  ["Sweden", "Stockholm", "eu-north-1", 3, "public", "active"],
  ["Italy", "Milan", "eu-south-1", 3, "public", "active"],
  ["Spain", "Madrid", "eu-south-2", 3, "public", "active"],
  ["Switzerland", "Zurich", "eu-central-2", 3, "public", "active"],
  ["Israel", "Tel Aviv", "il-central-1", 3, "public", "active"],
  ["Bahrain", "Bahrain", "me-south-1", 3, "public", "active"],
  ["UAE", "Dubai", "me-central-1", 3, "public", "active"],
  ["Brazil", "Sao Paulo", "sa-east-1", 3, "public", "active"],
  ["Mexico", "Mexico City", "mx-central-1", 3, "public", "active"],
  ["India", "Hyderabad", "ap-south-2", 3, "public", "active"],
  ["Philippines", "Manila", "ap-southeast-6", 3, "public", "active"],
  ["Thailand", "Bangkok", "ap-southeast-7", 3, "public", "active"],
  ["New Zealand", "Auckland", "ap-southeast-8", 3, "public", "active"],
  ["Taiwan", "台北", "ap-east-2", 3, "public", "active"],
  ["UAE", "Abu Dhabi", "me-west-1", 3, "public", "active"],
  ["Chile", "Santiago", "sa-west-1", 3, "public", "active"],
  ["Germany", "Berlin", "eusc-de-east-1", 3, "public", "active"],
  ["Saudi Arabia", "Riyadh", "me-central-2", 0, "public", "planned"],
  ["United States", "Virginia", "us-gov-east-1", 3, "gov", "active"],
  ["United States", "Oregon", "us-gov-west-1", 3, "gov", "active"],
  ["China", "北京", "cn-north-1", 3, "dedicated", "active"],
  ["China", "银川", "cn-northwest-1", 3, "dedicated", "active"],
];

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://aws.amazon.com/about-aws/global-infrastructure/";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  // Step 1: Fetch ip-ranges.json for live EC2 region list
  let ec2Regions: Set<string> = new Set();
  try {
    const resp = await fetch("https://ip-ranges.amazonaws.com/ip-ranges.json");
    if (!resp.ok) throw new Error(`ip-ranges.json returned ${resp.status}`);
    const data = await resp.json() as {
      prefixes: Array<{ region: string; service: string }>;
      createDate: string;
    };
    ec2Regions = new Set(
      data.prefixes.filter((p) => p.service === "EC2").map((p) => p.region)
    );
    console.log(`[AWS] ip-ranges.json: ${ec2Regions.size} EC2 regions, date: ${data.createDate}`);
  } catch (e: any) {
    errors.push("ip-ranges fetch failed: " + e.message);
  }

  // Step 2: Cross-reference meta table with live EC2 regions
  const records: RegionRecord[] = [];

  for (const [country, city, regionCode, azCount, regionType, status] of AWS_META) {
    const inLive = ec2Regions.has(regionCode);
    const finalStatus = (status === "active" && !inLive) ? "planned" : status;

    const azNames = azCount > 0
      ? Array.from({ length: azCount }, (_, i) => regionCode + String.fromCharCode(97 + i))
      : [];

    const coords = lookupCoords(city);

    records.push({
      vendor: "aws",
      region_id: regionCode,
      region_name: city,
      country,
      city,
      lat: coords.lat,
      lng: coords.lng,
      az_list: JSON.stringify(azNames),
      az_count: azCount,
      status: finalStatus,
      region_type: regionType,
      planned_date: finalStatus === "planned" ? "TBD" : null,
      data_source_url: sourceUrl,
      fetched_at: now,
    });
  }

  // Find regions in ip-ranges but not in our meta table (new regions)
  for (const regionCode of ec2Regions) {
    if (regionCode === "GLOBAL") continue;
    if (!AWS_META.find((r) => r[2] === regionCode)) {
      console.warn(`[AWS] New region discovered via ip-ranges: ${regionCode}`);
      records.push({
        vendor: "aws",
        region_id: regionCode,
        region_name: regionCode,
        country: "Unknown",
        city: regionCode,
        lat: 0, lng: 0,
        az_list: JSON.stringify([]),
        az_count: 0,
        status: "active",
        region_type: "public",
        planned_date: null,
        data_source_url: sourceUrl,
        fetched_at: now,
      });
    }
  }

  // Step 3: Write to D1
  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "aws", records);
  await logCollect(env.CLOUD_REGIONS_DB, "aws", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "aws",
    total: records.length,
    added,
    updated,
    ec2LiveRegions: ec2Regions.size,
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

    if (url.pathname === "/collect" || url.pathname === "/") {
      return collect(env);
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env) {
    console.log("[AWS Cron] Starting collection...");
    await collect(env);
    console.log("[AWS Cron] Done.");
  },
};
