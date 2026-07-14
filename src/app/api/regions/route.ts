// GET /api/regions - 查询 Region 数据
import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();
    const { searchParams } = new URL(request.url);
    const vendor = searchParams.get("vendor");
    const country = searchParams.get("country");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (vendor && vendor !== "all") {
      conditions.push("vendor = ?");
      params.push(vendor);
    }
    if (country) {
      conditions.push("country = ?");
      params.push(country);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(region_name LIKE ? OR region_id LIKE ? OR city LIKE ? OR country LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataResult = db.exec(
      `SELECT * FROM cloud_regions ${whereClause} ORDER BY vendor, country, city LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const columns = dataResult.length > 0 ? dataResult[0].columns : [];
    const rows = dataResult.length > 0 ? dataResult[0].values : [];
    const data = rows.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });

    const countResult = db.exec(`SELECT COUNT(*) as total FROM cloud_regions ${whereClause}`, params);
    const total = countResult.length > 0 ? (countResult[0].values[0]?.[0] as number) : 0;

    const vendorResult = db.exec("SELECT DISTINCT vendor FROM cloud_regions ORDER BY vendor");
    const vendors = vendorResult.length > 0 ? vendorResult[0].values.map((r: any[]) => r[0]) : [];

    const countryResult = db.exec("SELECT DISTINCT country FROM cloud_regions ORDER BY country");
    const countries = countryResult.length > 0 ? countryResult[0].values.map((r: any[]) => r[0]) : [];

    return NextResponse.json({ data, total, vendors, countries });
  } catch (error) {
    console.error("[API /api/regions] 查询失败:", error);
    return NextResponse.json({ error: "查询失败", message: String(error) }, { status: 500 });
  }
}
