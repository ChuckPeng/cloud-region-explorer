export const dynamic = 'force-dynamic';

// GET /api/stats - 统计概览
import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";

function firstValue(result: any, field: string): any {
  if (result.length > 0 && result[0].values.length > 0) {
    const idx = result[0].columns.indexOf(field);
    return idx >= 0 ? result[0].values[0][idx] : null;
  }
  return null;
}

export async function GET() {
  try {
    const db = await ensureDb();

    const summaryResult = db.exec(
      "SELECT COUNT(*) as total_regions, COALESCE(SUM(az_count), 0) as total_azs FROM cloud_regions WHERE status = 'active'"
    );
    const totalRegions = firstValue(summaryResult, "total_regions") || 0;
    const totalAzs = firstValue(summaryResult, "total_azs") || 0;

    const vendorResult = db.exec(
      "SELECT vendor, COUNT(*) as count FROM cloud_regions WHERE status = 'active' GROUP BY vendor ORDER BY count DESC"
    );
    const vendorBreakdown: Record<string, number> = {};
    if (vendorResult.length > 0) {
      for (const row of vendorResult[0].values) {
        vendorBreakdown[row[0] as string] = row[1] as number;
      }
    }

    const countryResult = db.exec(
      "SELECT country, COUNT(*) as count FROM cloud_regions WHERE status = 'active' GROUP BY country ORDER BY count DESC LIMIT 15"
    );
    const countryBreakdown: Record<string, number> = {};
    if (countryResult.length > 0) {
      for (const row of countryResult[0].values) {
        countryBreakdown[row[0] as string] = row[1] as number;
      }
    }

    
    const plannedResult = db.exec(
      "SELECT COUNT(*) as planned_count FROM cloud_regions WHERE status = 'planned'"
    );
    const plannedRegions = firstValue(plannedResult, "planned_count") || 0;

    const lastUpdatedResult = db.exec("SELECT MAX(fetched_at) as last_updated FROM cloud_regions");
    const lastUpdated = firstValue(lastUpdatedResult, "last_updated") || null;

    return NextResponse.json({
      total_regions: totalRegions,
      total_azs: totalAzs,
      vendor_breakdown: vendorBreakdown,
      country_breakdown: countryBreakdown,
      planned_regions: plannedRegions,
      last_updated: lastUpdated,
    });
  } catch (error) {
    console.error("[API /api/stats] 查询失败:", error);
    return NextResponse.json({ error: "查询失败", message: String(error) }, { status: 500 });
  }
}
