// ==================== Azure Collector Worker ====================
// 数据源: prices.azure.com/api/retail/prices (实时 JSON)
// 从 VM pricing 中提取所有唯一 region
// + 内置 region 元数据 (display name, country, city, AZ count)

import { RegionRecord, initSchema, upsertRegions, logCollect } from "../shared/db";
import { lookupCoords } from "../shared/utils";

export interface Env {
  CLOUD_REGIONS_DB: D1Database;
}

// Azure armRegionName → [displayName, country, city, azCount, status]
const AZURE_META: Record<string, [string, string, string, number, string]> = {
  "eastus": ["East US", "United States", "Virginia", 3, "active"],
  "eastus2": ["East US 2", "United States", "Virginia", 3, "active"],
  "southcentralus": ["South Central US", "United States", "Texas", 3, "active"],
  "westus": ["West US", "United States", "California", 0, "active"],
  "westus2": ["West US 2", "United States", "Washington DC", 3, "active"],
  "westus3": ["West US 3", "United States", "Arizona", 3, "active"],
  "centralus": ["Central US", "United States", "Iowa", 3, "active"],
  "northcentralus": ["North Central US", "United States", "Illinois", 0, "active"],
  "westcentralus": ["West Central US", "United States", "Wyoming", 0, "active"],
  "canadacentral": ["Canada Central", "Canada", "Toronto", 3, "active"],
  "canadaeast": ["Canada East", "Canada", "Montreal", 3, "active"],
  "brazilsouth": ["Brazil South", "Brazil", "Sao Paulo", 3, "active"],
  "brazilsoutheast": ["Brazil Southeast", "Brazil", "Rio de Janeiro", 3, "active"],
  "northeurope": ["North Europe", "Ireland", "Ireland", 3, "active"],
  "westeurope": ["West Europe", "Netherlands", "Amsterdam", 3, "active"],
  "uksouth": ["UK South", "United Kingdom", "London", 3, "active"],
  "ukwest": ["UK West", "United Kingdom", "Cardiff", 0, "active"],
  "francecentral": ["France Central", "France", "Paris", 3, "active"],
  "francesouth": ["France South", "France", "Marseille", 0, "active"],
  "germanywestcentral": ["Germany West Central", "Germany", "Frankfurt", 3, "active"],
  "germanynorth": ["Germany North", "Germany", "Berlin", 3, "active"],
  "switzerlandnorth": ["Switzerland North", "Switzerland", "Zurich", 3, "active"],
  "switzerlandwest": ["Switzerland West", "Switzerland", "Geneva", 0, "active"],
  "norwayeast": ["Norway East", "Norway", "Oslo", 3, "active"],
  "norwaywest": ["Norway West", "Norway", "Stavanger", 0, "active"],
  "swedencentral": ["Sweden Central", "Sweden", "Stockholm", 3, "active"],
  "swedensouth": ["Sweden South", "Sweden", "Malmo", 0, "active"],
  "italynorth": ["Italy North", "Italy", "Milan", 3, "active"],
  "polandcentral": ["Poland Central", "Poland", "Warsaw", 3, "active"],
  "spaincentral": ["Spain Central", "Spain", "Madrid", 3, "active"],
  "israelcentral": ["Israel Central", "Israel", "Tel Aviv", 3, "active"],
  "qatarcentral": ["Qatar Central", "Qatar", "Doha", 3, "active"],
  "uaenorth": ["UAE North", "UAE", "Dubai", 3, "active"],
  "uaecentral": ["UAE Central", "UAE", "Abu Dhabi", 0, "active"],
  "southafricanorth": ["South Africa North", "South Africa", "Johannesburg", 3, "active"],
  "southafricawest": ["South Africa West", "South Africa", "Cape Town", 0, "active"],
  "australiaeast": ["Australia East", "Australia", "Sydney", 3, "active"],
  "australiacentral": ["Australia Central", "Australia", "Canberra", 3, "active"],
  "australiasoutheast": ["Australia Southeast", "Australia", "Melbourne", 0, "active"],
  "southeastasia": ["Southeast Asia", "Singapore", "Singapore", 3, "active"],
  "eastasia": ["East Asia", "China", "香港", 3, "active"],
  "japaneast": ["Japan East", "Japan", "Tokyo", 3, "active"],
  "japanwest": ["Japan West", "Japan", "Osaka", 3, "active"],
  "koreacentral": ["Korea Central", "South Korea", "Seoul", 3, "active"],
  "koreasouth": ["Korea South", "South Korea", "Busan", 0, "active"],
  "centralindia": ["Central India", "India", "Pune", 3, "active"],
  "southindia": ["South India", "India", "Chennai", 3, "active"],
  "westindia": ["West India", "India", "Mumbai", 3, "active"],
  "jioindiawest": ["Jio India West", "India", "Mumbai", 3, "active"],
  "jioindiacentral": ["Jio India Central", "India", "Nagpur", 3, "active"],
  "chinanorth": ["China North", "China", "北京", 3, "active"],
  "chinanorth2": ["China North 2", "China", "北京", 3, "active"],
  "chinanorth3": ["China North 3", "China", "北京", 0, "active"],
  "chinaeast": ["China East", "China", "上海", 3, "active"],
  "chinaeast2": ["China East 2", "China", "上海", 3, "active"],
  "chinaeast3": ["China East 3", "China", "上海", 0, "active"],
  "mexicocentral": ["Mexico Central", "Mexico", "Queretaro", 3, "active"],
  "newzealandnorth": ["New Zealand North", "New Zealand", "Auckland", 3, "active"],
  "belgiumcentral": ["Belgium Central", "Belgium", "Brussels", 3, "active"],
  "austriaeast": ["Austria East", "Austria", "Vienna", 3, "active"],
  "indonesiacentral": ["Indonesia Central", "Indonesia", "Jakarta", 3, "planned"],
  "malaysiawest": ["Malaysia West", "Malaysia", "Kuala Lumpur", 3, "planned"],
  "taiwannorth": ["Taiwan North", "Taiwan", "台北", 3, "planned"],
  "koreacentral2": ["Korea Central 2", "South Korea", "Seoul", 3, "planned"],
  "brazilnortheast": ["Brazil Northeast", "Brazil", "Fortaleza", 3, "planned"],
  "denmarkeast": ["Denmark East", "Denmark", "Copenhagen", 3, "planned"],
  "finlandcentral": ["Finland Central", "Finland", "Helsinki", 3, "planned"],
  "greececentral": ["Greece Central", "Greece", "Athens", 3, "planned"],
  "spainnorth": ["Spain North", "Spain", "Barcelona", 3, "planned"],
};

async function fetchAzureRegions(): Promise<Set<string>> {
  const regions = new Set<string>();
  let nextUrl: string | null = "https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&currencyCode=USD&$filter=serviceName%20eq%20%27Virtual%20Machines%27";

  while (nextUrl) {
    const resp = await fetch(nextUrl);
    if (!resp.ok) throw new Error(`Azure prices API returned ${resp.status}`);
    const data = await resp.json() as { Items: Array<{ armRegionName: string }>; NextPageLink: string | null };
    for (const item of data.Items) {
      if (item.armRegionName) regions.add(item.armRegionName.toLowerCase());
    }
    nextUrl = data.NextPageLink || null;
    if (regions.size > 200) break; // safety limit
  }

  return regions;
}

async function collect(env: Env): Promise<Response> {
  const errors: string[] = [];
  const sourceUrl = "https://datacenters.microsoft.com/globe/explore";
  const now = new Date().toISOString();

  await initSchema(env.CLOUD_REGIONS_DB);

  // Fetch live regions from Azure pricing API
  let liveRegions: Set<string> = new Set();
  try {
    liveRegions = await fetchAzureRegions();
    console.log(`[Azure] Pricing API returned ${liveRegions.size} unique regions`);
  } catch (e: any) {
    errors.push("Azure pricing API failed: " + e.message);
  }

  // Cross-reference with meta table
  const records: RegionRecord[] = [];

  for (const [regionCode, [displayName, country, city, azCount, status]] of Object.entries(AZURE_META)) {
    const inLive = liveRegions.has(regionCode.toLowerCase());
    const finalStatus = (status === "active" && !inLive) ? "planned" : status;

    const coords = lookupCoords(city);

    records.push({
      vendor: "azure",
      region_id: regionCode,
      region_name: displayName,
      country,
      city,
      lat: coords.lat,
      lng: coords.lng,
      az_list: JSON.stringify(Array.from({ length: azCount }, (_, i) => `${regionCode}-az${i + 1}`)),
      az_count: azCount,
      status: finalStatus,
      region_type: "public",
      planned_date: finalStatus === "planned" ? "TBD" : null,
      data_source_url: sourceUrl,
      fetched_at: now,
    });
  }

  // Also add unknown live regions as-is
  for (const regionCode of liveRegions) {
    if (!AZURE_META[regionCode.toLowerCase()]) {
      console.warn(`[Azure] Unknown region from pricing API: ${regionCode}`);
      records.push({
        vendor: "azure",
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

  const { added, updated } = await upsertRegions(env.CLOUD_REGIONS_DB, "azure", records);
  await logCollect(env.CLOUD_REGIONS_DB, "azure", added, updated, errors);

  return new Response(JSON.stringify({
    vendor: "azure",
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
    console.log("[Azure Cron] Starting...");
    await collect(env);
    console.log("[Azure Cron] Done.");
  },
};
