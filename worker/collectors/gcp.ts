// ==================== GCP Collector Worker ====================
// 数据源: cloud.google.com/compute/docs/regions-zones (HTML 正则提取)
// + 内置 region 元数据 (名称/国家/城市/AZ数)

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

// GCP region → [displayName, country, city, azCount, status]
const GCP_META: Record<string, [string, string, string, number, string]> = {
  "us-central1": ["Iowa", "United States", "Iowa", 4, "active"],
  "us-east1": ["South Carolina", "United States", "South Carolina", 3, "active"],
  "us-east4": ["Northern Virginia", "United States", "Virginia", 3, "active"],
  "us-east5": ["Columbus", "United States", "Ohio", 3, "active"],
  "us-south1": ["Dallas", "United States", "Texas", 3, "active"],
  "us-west1": ["Oregon", "United States", "Oregon", 3, "active"],
  "us-west2": ["Los Angeles", "United States", "California", 3, "active"],
  "us-west3": ["Salt Lake City", "United States", "Utah", 3, "active"],
  "us-west4": ["Las Vegas", "United States", "Nevada", 3, "active"],
  "northamerica-northeast1": ["Montreal", "Canada", "Montreal", 3, "active"],
  "northamerica-northeast2": ["Toronto", "Canada", "Toronto", 3, "active"],
  "southamerica-east1": ["Sao Paulo", "Brazil", "Sao Paulo", 3, "active"],
  "southamerica-west1": ["Santiago", "Chile", "Santiago", 3, "active"],
  "southamerica-north1": ["Mexico City", "Mexico", "Mexico City", 3, "active"],
  "europe-west1": ["Belgium", "Belgium", "Brussels", 3, "active"],
  "europe-west2": ["London", "United Kingdom", "London", 3, "active"],
  "europe-west3": ["Frankfurt", "Germany", "Frankfurt", 3, "active"],
  "europe-west4": ["Netherlands", "Netherlands", "Amsterdam", 3, "active"],
  "europe-west6": ["Zurich", "Switzerland", "Zurich", 3, "active"],
  "europe-west8": ["Milan", "Italy", "Milan", 3, "active"],
  "europe-west9": ["Paris", "France", "Paris", 3, "active"],
  "europe-west10": ["Berlin", "Germany", "Berlin", 3, "active"],
  "europe-west12": ["Turin", "Italy", "Turin", 3, "active"],
  "europe-north1": ["Finland", "Finland", "Hamina", 3, "active"],
  "europe-southwest1": ["Madrid", "Spain", "Madrid", 3, "active"],
  "europe-central2": ["Warsaw", "Poland", "Warsaw", 3, "active"],
  "asia-east1": ["Taiwan", "Taiwan", "台北", 3, "active"],
  "asia-east2": ["Hong Kong", "China", "香港", 3, "active"],
  "asia-northeast1": ["Tokyo", "Japan", "Tokyo", 3, "active"],
  "asia-northeast2": ["Osaka", "Japan", "Osaka", 3, "active"],
  "asia-northeast3": ["Seoul", "South Korea", "Seoul", 3, "active"],
  "asia-south1": ["Mumbai", "India", "Mumbai", 3, "active"],
  "asia-south2": ["Delhi", "India", "Delhi", 3, "active"],
  "asia-southeast1": ["Singapore", "Singapore", "Singapore", 3, "active"],
  "asia-southeast2": ["Jakarta", "Indonesia", "Jakarta", 3, "active"],
  "australia-southeast1": ["Sydney", "Australia", "Sydney", 3, "active"],
  "australia-southeast2": ["Melbourne", "Australia", "Melbourne", 3, "active"],
  "me-west1": ["Tel Aviv", "Israel", "Tel Aviv", 3, "active"],
  "me-central1": ["Doha", "Qatar", "Doha", 3, "active"],
  "me-central2": ["Dammam", "Saudi Arabia", "Dammam", 3, "active"],
  "africa-south1": ["Johannesburg", "South Africa", "Johannesburg", 3, "active"],
  "africa-east1": ["Nairobi", "Kenya", "Nairobi", 3, "active"],
  "africa-south2": ["Cape Town", "South Africa", "Cape Town", 0, "planned"],
  "me-south2": ["Kuwait", "Kuwait", "Kuwait City", 0, "planned"],
  "asia-southeast3": ["Malaysia", "Malaysia", "Kuala Lumpur", 0, "planned"],
  "asia-southeast4": ["Thailand", "Thailand", "Bangkok", 0, "planned"],
  "asia-east3": ["Philippines", "Philippines", "Manila", 0, "planned"],
  "southamerica-north2": ["Colombia", "Colombia", "Bogota", 0, "planned"],
};

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://cloud.google.com/about/locations";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  // Fetch the regions-zones page
  let liveRegions: Set<string> = new Set();
  try {
    const resp = await fetch("https://cloud.google.com/compute/docs/regions-zones", {
      headers: { "User-Agent": "CloudRegionExplorer/1.0" },
    });
    if (!resp.ok) throw new Error(`GCP page returned ${resp.status}`);
    const html = await resp.text();

    // Extract region codes: pattern like "us-central1", "asia-east1", etc.
    const regionRegex = /([a-z]+-[a-z]+\d+)/g;
    let match;
    while ((match = regionRegex.exec(html)) !== null) {
      const code = match[1];
      // Filter false positives (IP ranges, CSS classes, etc.)
      if (code.length > 8 && code.length < 30 && !code.startsWith("http")) {
        liveRegions.add(code.toLowerCase());
      }
    }
    console.log(`[GCP] Extracted ${liveRegions.size} region codes from HTML`);
  } catch (e: any) {
    errors.push("GCP page fetch failed: " + e.message);
  }

  // Cross reference
  const records: RegionRecord[] = [];

  for (const [regionCode, [displayName, country, city, azCount, status]] of Object.entries(GCP_META)) {
    const inLive = liveRegions.has(regionCode.toLowerCase()) || status === "planned";
    const finalStatus = (status === "active" && !inLive) ? "planned" : status;

    const coords = lookupCoords(city);

    records.push({
      vendor: "gcp",
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
      planned_date: finalStatus === "planned" ? "2026" : null,
      data_source_url: sourceUrl,
      fetched_at: now,
    });
  }

  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "gcp", records);
  await logCollect(env.CLOUD_REGIONS_DB, "gcp", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "gcp",
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
    console.log("[GCP Cron] Starting...");
    await collect(env);
    console.log("[GCP Cron] Done.");
  },
};
