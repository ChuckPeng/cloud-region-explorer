export const dynamic = 'force-dynamic';

// POST /api/collect - 手动触发数据采集（含速率限制）
import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { runCollection } from "@/lib/collectors/orchestrator";
import { VENDORS, Vendor } from "@/types";
import { z } from "zod";

// 简易内存限流：每个 IP 60 秒内最多 1 次采集
const rateLimitMap = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastTime = rateLimitMap.get(ip);
  if (lastTime && now - lastTime < 60000) {
    return false;
  }
  rateLimitMap.set(ip, now);
  // 定期清理（每 100 次清理一次过期记录）
  if (rateLimitMap.size > 100) {
    for (const [key, time] of rateLimitMap) {
      if (now - time > 120000) rateLimitMap.delete(key);
    }
  }
  return true;
}

const collectSchema = z.object({
  vendor: z
    .string()
    .optional()
    .refine((val) => !val || val === "all" || VENDORS.includes(val as Vendor), {
      message: `无效的厂商名称，可选值: all, ${VENDORS.join(", ")}`,
    }),
});

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请 60 秒后再试" },
        { status: 429 }
      );
    }

    await ensureDb();

    const body = await request.json().catch(() => ({}));
    const parsed = collectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const vendor = parsed.data.vendor === "all" || !parsed.data.vendor
      ? undefined
      : (parsed.data.vendor as Vendor);

    const result = await runCollection(vendor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/collect] 采集失败:", error);
    return NextResponse.json(
      { success: false, error: "采集失败", message: String(error) },
      { status: 500 }
    );
  }
}
