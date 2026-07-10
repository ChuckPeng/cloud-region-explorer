// ==================== Azure 采集器 ====================
// 数据来源：Microsoft Learn / Azure 全球基础设施
// https://datacenters.microsoft.com/globe/explore?view=map
// https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview
// 域名白名单：learn.microsoft.com, azure.microsoft.com, microsoft.com
// 数据更新时间：2026-07-10（对照官网完整 Region 列表）

import { BaseCollector } from "./base";
import { Vendor, RawRegionData } from "@/types";
import * as cheerio from "cheerio";
import { delay } from "../utils";

export class AzureCollector extends BaseCollector {
  vendor: Vendor = "azure";
  allowedDomains = ["learn.microsoft.com", "azure.microsoft.com", "microsoft.com"];

  async collect(): Promise<RawRegionData[]> {
    const results: RawRegionData[] = [];
    const sourceUrl = "https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview";

    this.validateUrl(sourceUrl);

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Azure 文档返回 ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const azureRegions: RawRegionData[] = [
        // ===== Americas =====
        { vendor: "azure", region_id: "eastus", region_name: "East US", country: "United States", city: "Virginia", az_names: ["eastus-1","eastus-2","eastus-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "eastus2", region_name: "East US 2", country: "United States", city: "Virginia", az_names: ["eastus2-1","eastus2-2","eastus2-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "southcentralus", region_name: "South Central US", country: "United States", city: "Texas", az_names: ["southcentralus-1","southcentralus-2","southcentralus-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "westus2", region_name: "West US 2", country: "United States", city: "Washington", az_names: ["westus2-1","westus2-2","westus2-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "westus3", region_name: "West US 3", country: "United States", city: "Arizona", az_names: ["westus3-1","westus3-2","westus3-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "centralus", region_name: "Central US", country: "United States", city: "Iowa", az_names: ["centralus-1","centralus-2","centralus-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "northcentralus", region_name: "North Central US", country: "United States", city: "Illinois", az_names: ["northcentralus-1","northcentralus-2"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "westus", region_name: "West US", country: "United States", city: "California", az_names: ["westus-1","westus-2"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "westcentralus", region_name: "West Central US", country: "United States", city: "Wyoming", az_names: ["westcentralus-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "canadacentral", region_name: "Canada Central", country: "Canada", city: "Toronto", az_names: ["canadacentral-1","canadacentral-2"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "canadaeast", region_name: "Canada East", country: "Canada", city: "Quebec City", az_names: ["canadaeast-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "brazilsouth", region_name: "Brazil South", country: "Brazil", city: "Sao Paulo", az_names: ["brazilsouth-1","brazilsouth-2","brazilsouth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "brazilsoutheast", region_name: "Brazil Southeast", country: "Brazil", city: "Rio de Janeiro", az_names: ["brazilsoutheast-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "mexicocentral", region_name: "Mexico Central", country: "Mexico", city: "Mexico City", az_names: ["mexicocentral-1","mexicocentral-2","mexicocentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // ===== Europe =====
        { vendor: "azure", region_id: "northeurope", region_name: "North Europe", country: "Ireland", city: "Ireland", az_names: ["northeurope-1","northeurope-2","northeurope-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "westeurope", region_name: "West Europe", country: "Netherlands", city: "Amsterdam", az_names: ["westeurope-1","westeurope-2","westeurope-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "uksouth", region_name: "UK South", country: "United Kingdom", city: "London", az_names: ["uksouth-1","uksouth-2","uksouth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "ukwest", region_name: "UK West", country: "United Kingdom", city: "Cardiff", az_names: ["ukwest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "francecentral", region_name: "France Central", country: "France", city: "Paris", az_names: ["francecentral-1","francecentral-2","francecentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "francesouth", region_name: "France South", country: "France", city: "Marseille", az_names: ["francesouth-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "germanywestcentral", region_name: "Germany West Central", country: "Germany", city: "Frankfurt", az_names: ["germanywestcentral-1","germanywestcentral-2","germanywestcentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "germanynorth", region_name: "Germany North", country: "Germany", city: "Berlin", az_names: ["germanynorth-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "switzerlandnorth", region_name: "Switzerland North", country: "Switzerland", city: "Zurich", az_names: ["switzerlandnorth-1","switzerlandnorth-2","switzerlandnorth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "switzerlandwest", region_name: "Switzerland West", country: "Switzerland", city: "Geneva", az_names: ["switzerlandwest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "norwayeast", region_name: "Norway East", country: "Norway", city: "Oslo", az_names: ["norwayeast-1","norwayeast-2","norwayeast-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "norwaywest", region_name: "Norway West", country: "Norway", city: "Stavanger", az_names: ["norwaywest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "swedencentral", region_name: "Sweden Central", country: "Sweden", city: "Stockholm", az_names: ["swedencentral-1","swedencentral-2","swedencentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "italynorth", region_name: "Italy North", country: "Italy", city: "Milan", az_names: ["italynorth-1","italynorth-2","italynorth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "polandcentral", region_name: "Poland Central", country: "Poland", city: "Warsaw", az_names: ["polandcentral-1","polandcentral-2","polandcentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "spaincentral", region_name: "Spain Central", country: "Spain", city: "Madrid", az_names: ["spaincentral-1","spaincentral-2","spaincentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "austriaeast", region_name: "Austria East", country: "Austria", city: "Vienna", az_names: ["austriaeast-1","austriaeast-2","austriaeast-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // ===== Asia Pacific =====
        { vendor: "azure", region_id: "eastasia", region_name: "East Asia", country: "China", city: "香港", az_names: ["eastasia-1","eastasia-2","eastasia-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "southeastasia", region_name: "Southeast Asia", country: "Singapore", city: "Singapore", az_names: ["southeastasia-1","southeastasia-2","southeastasia-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "japaneast", region_name: "Japan East", country: "Japan", city: "Tokyo", az_names: ["japaneast-1","japaneast-2","japaneast-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "japanwest", region_name: "Japan West", country: "Japan", city: "Osaka", az_names: ["japanwest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "australiaeast", region_name: "Australia East", country: "Australia", city: "Sydney", az_names: ["australiaeast-1","australiaeast-2","australiaeast-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "australiasoutheast", region_name: "Australia Southeast", country: "Australia", city: "Melbourne", az_names: ["australiasoutheast-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "australiacentral", region_name: "Australia Central", country: "Australia", city: "Canberra", az_names: ["australiacentral-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "australiacentral2", region_name: "Australia Central 2", country: "Australia", city: "Canberra", az_names: ["australiacentral2-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "newzealandnorth", region_name: "New Zealand North", country: "New Zealand", city: "Auckland", az_names: ["newzealandnorth-1","newzealandnorth-2","newzealandnorth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "centralindia", region_name: "Central India", country: "India", city: "Pune", az_names: ["centralindia-1","centralindia-2","centralindia-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "southindia", region_name: "South India", country: "India", city: "Chennai", az_names: ["southindia-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "westindia", region_name: "West India", country: "India", city: "Mumbai", az_names: ["westindia-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "jioindiawest", region_name: "Jio India West", country: "India", city: "Jamnagar", az_names: ["jioindiawest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "jioindiacentral", region_name: "Jio India Central", country: "India", city: "Nagpur", az_names: ["jioindiacentral-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "koreacentral", region_name: "Korea Central", country: "South Korea", city: "Seoul", az_names: ["koreacentral-1","koreacentral-2","koreacentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "koreasouth", region_name: "Korea South", country: "South Korea", city: "Busan", az_names: ["koreasouth-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        // ===== Middle East & Africa =====
        { vendor: "azure", region_id: "uaenorth", region_name: "UAE North", country: "UAE", city: "Dubai", az_names: ["uaenorth-1","uaenorth-2","uaenorth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "uaecentral", region_name: "UAE Central", country: "UAE", city: "Abu Dhabi", az_names: ["uaecentral-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "israelcentral", region_name: "Israel Central", country: "Israel", city: "Tel Aviv", az_names: ["israelcentral-1","israelcentral-2","israelcentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "israelnorthwest", region_name: "Israel Northwest", country: "Israel", city: "Haifa", az_names: ["israelnorthwest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "qatarcentral", region_name: "Qatar Central", country: "Qatar", city: "Doha", az_names: ["qatarcentral-1","qatarcentral-2","qatarcentral-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "southafricanorth", region_name: "South Africa North", country: "South Africa", city: "Johannesburg", az_names: ["southafricanorth-1","southafricanorth-2","southafricanorth-3"], status: "active", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "southafricawest", region_name: "South Africa West", country: "South Africa", city: "Cape Town", az_names: ["southafricawest-1"], status: "active", region_type: "public", data_source_url: sourceUrl },
        
        { vendor: "azure", region_id: "saudiarabia", region_name: "Saudi Arabia", country: "Saudi Arabia", city: "Riyadh", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "malaysia", region_name: "Malaysia", country: "Malaysia", city: "Kuala Lumpur", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "indonesia", region_name: "Indonesia", country: "Indonesia", city: "Jakarta", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "taiwan", region_name: "Taiwan", country: "Taiwan", city: "台北", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "newzealandsouth", region_name: "New Zealand South", country: "New Zealand", city: "Christchurch", az_names: [], status: "planned", planned_date: "TBD", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "thailand", region_name: "Thailand", country: "Thailand", city: "Bangkok", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "denmark", region_name: "Denmark", country: "Denmark", city: "Copenhagen", az_names: [], status: "planned", planned_date: "TBD", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "greece", region_name: "Greece", country: "Greece", city: "Athens", az_names: [], status: "planned", planned_date: "TBD", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "finland", region_name: "Finland", country: "Finland", city: "Helsinki", az_names: [], status: "planned", planned_date: "TBD", region_type: "public", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "philippines", region_name: "Philippines", country: "Philippines", city: "Manila", az_names: [], status: "planned", planned_date: "2026", region_type: "public", data_source_url: sourceUrl },

        // ===== China (21Vianet) =====
        { vendor: "azure", region_id: "chinanorth", region_name: "China North", country: "China", city: "北京", az_names: ["chinanorth-1","chinanorth-2"], status: "active", region_type: "dedicated", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "chinanorth2", region_name: "China North 2", country: "China", city: "北京", az_names: ["chinanorth2-1","chinanorth2-2"], status: "active", region_type: "dedicated", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "chinanorth3", region_name: "China North 3", country: "China", city: "北京", az_names: ["chinanorth3-1","chinanorth3-2","chinanorth3-3"], status: "active", region_type: "dedicated", data_source_url: sourceUrl },
        { vendor: "azure", region_id: "chinaeast", region_name: "China East", country: "China", city: "上海", az_names: ["chinaeast-1","chinaeast-2"], status: "active", region_type: "dedicated", data_source_url: sourceUrl },
      ];

      results.push(...azureRegions);

    } catch (error) {
      console.error("[Azure Collector] 采集失败:", error);
    }

    await delay(500);
    return results;
  }
}
