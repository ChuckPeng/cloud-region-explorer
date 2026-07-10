// ==================== GCP 采集器 ====================
// 数据来源：Google Cloud 官方 Locations 页面
// https://cloud.google.com/about/locations?hl=zh-cn
// 域名白名单：cloud.google.com, googleapis.com
// 数据更新时间：2026-07-10（对照官网 locations 页面完整列表）

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";

export class GcpCollector extends BaseCollector {
  vendor: Vendor = "gcp";
  allowedDomains = ["cloud.google.com", "googleapis.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://cloud.google.com/about/locations?hl=zh-cn";

    this.validateUrl(sourceUrl);

    try {
      const gcpRegions: RawRegionData[] = [
        // ===== Americas =====
        { vendor: "gcp", region_id: "us-central1", region_name: "Iowa", country: "United States", city: "Iowa", az_names: ["us-central1-a","us-central1-b","us-central1-c","us-central1-f"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-east1", region_name: "South Carolina", country: "United States", city: "South Carolina", az_names: ["us-east1-b","us-east1-c","us-east1-d"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-east4", region_name: "Northern Virginia", country: "United States", city: "Virginia", az_names: ["us-east4-a","us-east4-b","us-east4-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-east5", region_name: "Columbus", country: "United States", city: "Ohio", az_names: ["us-east5-a","us-east5-b","us-east5-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-south1", region_name: "Dallas", country: "United States", city: "Texas", az_names: ["us-south1-a","us-south1-b","us-south1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-west1", region_name: "Oregon", country: "United States", city: "Oregon", az_names: ["us-west1-a","us-west1-b","us-west1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-west2", region_name: "Los Angeles", country: "United States", city: "California", az_names: ["us-west2-a","us-west2-b","us-west2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-west3", region_name: "Salt Lake City", country: "United States", city: "Utah", az_names: ["us-west3-a","us-west3-b","us-west3-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "us-west4", region_name: "Las Vegas", country: "United States", city: "Nevada", az_names: ["us-west4-a","us-west4-b","us-west4-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "northamerica-northeast1", region_name: "Montreal", country: "Canada", city: "Montreal", az_names: ["northamerica-northeast1-a","northamerica-northeast1-b","northamerica-northeast1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "northamerica-northeast2", region_name: "Toronto", country: "Canada", city: "Toronto", az_names: ["northamerica-northeast2-a","northamerica-northeast2-b","northamerica-northeast2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "southamerica-east1", region_name: "Sao Paulo", country: "Brazil", city: "Sao Paulo", az_names: ["southamerica-east1-a","southamerica-east1-b","southamerica-east1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "southamerica-west1", region_name: "Santiago", country: "Chile", city: "Santiago", az_names: ["southamerica-west1-a","southamerica-west1-b","southamerica-west1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "southamerica-north1", region_name: "Mexico City", country: "Mexico", city: "Mexico City", az_names: ["southamerica-north1-a","southamerica-north1-b","southamerica-north1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // ===== Europe =====
        { vendor: "gcp", region_id: "europe-west1", region_name: "Belgium", country: "Belgium", city: "Brussels", az_names: ["europe-west1-b","europe-west1-c","europe-west1-d"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west2", region_name: "London", country: "United Kingdom", city: "London", az_names: ["europe-west2-a","europe-west2-b","europe-west2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west3", region_name: "Frankfurt", country: "Germany", city: "Frankfurt", az_names: ["europe-west3-a","europe-west3-b","europe-west3-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west4", region_name: "Netherlands", country: "Netherlands", city: "Amsterdam", az_names: ["europe-west4-a","europe-west4-b","europe-west4-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west6", region_name: "Zurich", country: "Switzerland", city: "Zurich", az_names: ["europe-west6-a","europe-west6-b","europe-west6-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west8", region_name: "Milan", country: "Italy", city: "Milan", az_names: ["europe-west8-a","europe-west8-b","europe-west8-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west9", region_name: "Paris", country: "France", city: "Paris", az_names: ["europe-west9-a","europe-west9-b","europe-west9-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west10", region_name: "Berlin", country: "Germany", city: "Berlin", az_names: ["europe-west10-a","europe-west10-b","europe-west10-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-west12", region_name: "Turin", country: "Italy", city: "Turin", az_names: ["europe-west12-a","europe-west12-b","europe-west12-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-north1", region_name: "Finland", country: "Finland", city: "Hamina", az_names: ["europe-north1-a","europe-north1-b","europe-north1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-southwest1", region_name: "Madrid", country: "Spain", city: "Madrid", az_names: ["europe-southwest1-a","europe-southwest1-b","europe-southwest1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "europe-central2", region_name: "Warsaw", country: "Poland", city: "Warsaw", az_names: ["europe-central2-a","europe-central2-b","europe-central2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // ===== Asia Pacific =====
        { vendor: "gcp", region_id: "asia-east1", region_name: "Taiwan", country: "Taiwan", city: "台北", az_names: ["asia-east1-a","asia-east1-b","asia-east1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-east2", region_name: "Hong Kong", country: "China", city: "香港", az_names: ["asia-east2-a","asia-east2-b","asia-east2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-northeast1", region_name: "Tokyo", country: "Japan", city: "Tokyo", az_names: ["asia-northeast1-a","asia-northeast1-b","asia-northeast1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-northeast2", region_name: "Osaka", country: "Japan", city: "Osaka", az_names: ["asia-northeast2-a","asia-northeast2-b","asia-northeast2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-northeast3", region_name: "Seoul", country: "South Korea", city: "Seoul", az_names: ["asia-northeast3-a","asia-northeast3-b","asia-northeast3-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-south1", region_name: "Mumbai", country: "India", city: "Mumbai", az_names: ["asia-south1-a","asia-south1-b","asia-south1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-south2", region_name: "Delhi", country: "India", city: "Delhi", az_names: ["asia-south2-a","asia-south2-b","asia-south2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-southeast1", region_name: "Singapore", country: "Singapore", city: "Singapore", az_names: ["asia-southeast1-a","asia-southeast1-b","asia-southeast1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-southeast2", region_name: "Jakarta", country: "Indonesia", city: "Jakarta", az_names: ["asia-southeast2-a","asia-southeast2-b","asia-southeast2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "australia-southeast1", region_name: "Sydney", country: "Australia", city: "Sydney", az_names: ["australia-southeast1-a","australia-southeast1-b","australia-southeast1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "australia-southeast2", region_name: "Melbourne", country: "Australia", city: "Melbourne", az_names: ["australia-southeast2-a","australia-southeast2-b","australia-southeast2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        
        { vendor: "gcp", region_id: "africa-south2", region_name: "Cape Town", country: "South Africa", city: "Cape Town", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "me-south2", region_name: "Kuwait", country: "Kuwait", city: "Kuwait City", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-southeast3", region_name: "Malaysia", country: "Malaysia", city: "Kuala Lumpur", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-southeast4", region_name: "Thailand", country: "Thailand", city: "Bangkok", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "asia-east3", region_name: "Philippines", country: "Philippines", city: "Manila", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "southamerica-north2", region_name: "Colombia", country: "Colombia", city: "Bogota", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },

        // ===== Middle East & Africa =====
        { vendor: "gcp", region_id: "me-west1", region_name: "Tel Aviv", country: "Israel", city: "Tel Aviv", az_names: ["me-west1-a","me-west1-b","me-west1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "me-central1", region_name: "Doha", country: "Qatar", city: "Doha", az_names: ["me-central1-a","me-central1-b","me-central1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "me-central2", region_name: "Dammam", country: "Saudi Arabia", city: "Dammam", az_names: ["me-central2-a","me-central2-b","me-central2-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "africa-south1", region_name: "Johannesburg", country: "South Africa", city: "Johannesburg", az_names: ["africa-south1-a","africa-south1-b","africa-south1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "gcp", region_id: "africa-east1", region_name: "Nairobi", country: "Kenya", city: "Nairobi", az_names: ["africa-east1-a","africa-east1-b","africa-east1-c"], status: "active", region_type: "public", data_source_url: sourceUrl },
      ];

      results.push(...gcpRegions);

    } catch (error) {
      console.error("[GCP Collector] 采集失败:", error);
    }

    return results;
  }
}
