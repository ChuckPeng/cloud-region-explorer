// ==================== Cloudflare Workers API ====================
// 替代 Next.js API Routes，跑在 Cloudflare Workers 上

import { getStorage } from "../src/lib/storage";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // 绑定 D1 到存储层
    (globalThis as any).CLOUD_REGIONS_DB = env.CLOUD_REGIONS_DB;

    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const storage = await getStorage();

      // GET /api/stats
      if (path === "/api/stats" && request.method === "GET") {
        const stats = await storage.getStats();
        return Response.json(stats, { headers: corsHeaders });
      }

      // GET /api/regions
      if (path === "/api/regions" && request.method === "GET") {
        const params = url.searchParams;
        const limit = Math.min(parseInt(params.get("limit") || "100"), 500);
        const page = parseInt(params.get("page") || "1");
        const result = await storage.queryRegions({
          vendor: params.get("vendor") || undefined,
          country: params.get("country") || undefined,
          status: params.get("status") || undefined,
          search: params.get("search") || undefined,
          limit,
          offset: (page - 1) * limit,
        });
        const vendors = await storage.getVendors();
        const countries = await storage.getCountries();
        return Response.json({ ...result, vendors, countries }, { headers: corsHeaders });
      }

      // POST /api/collect
      if (path === "/api/collect" && request.method === "POST") {
        const { runCollection } = await import("../src/lib/collectors/orchestrator");
        const body: any = await request.json().catch(() => ({}));
        const result = await runCollection(body.vendor);
        return Response.json(result, { headers: corsHeaders });
      }

      return Response.json({ error: "Not found", path }, { status: 404, headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message, stack: e.stack }, { status: 500, headers: corsHeaders });
    }
  },

  // 定时采集
  async scheduled(event: ScheduledEvent, env: any) {
    (globalThis as any).CLOUD_REGIONS_DB = env.CLOUD_REGIONS_DB;
    try {
      const storage = await getStorage();
      const { runCollection } = await import("../src/lib/collectors/orchestrator");
      const result = await runCollection();
      console.log("[Cron] 采集完成:", JSON.stringify(result));
    } catch (e: any) {
      console.error("[Cron] 采集失败:", e.message);
    }
  },
};