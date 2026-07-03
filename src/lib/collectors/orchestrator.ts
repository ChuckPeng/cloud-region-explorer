// ==================== 采集编排器 (sql.js 版本) ====================

import { Vendor, CollectResponse } from "@/types";
import { getDb, saveDb } from "../db";
import { AwsCollector } from "./aws";
import { AzureCollector } from "./azure";
import { GcpCollector } from "./gcp";
import { AliyunCollector } from "./aliyun";
import { HuaweiCollector } from "./huawei";
import { TencentCollector } from "./tencent";
import { UCloudCollector } from "./ucloud";
import { BaseCollector } from "./base";

function getCollectors(): Map<Vendor, BaseCollector> {
  const map = new Map<Vendor, BaseCollector>();
  map.set("aws", new AwsCollector());
  map.set("azure", new AzureCollector());
  map.set("gcp", new GcpCollector());
  map.set("aliyun", new AliyunCollector());
  map.set("huawei", new HuaweiCollector());
  map.set("tencent", new TencentCollector());
  map.set("ucloud", new UCloudCollector());
  return map;
}

async function collectVendor(collector: BaseCollector): Promise<{ added: number; updated: number; errors: string[] }> {
  const db = getDb();
  const errors: string[] = [];
  let added = 0;
  let updated = 0;

  try {
    const rawData = await collector.collect();
    const normalized = collector.normalize(rawData);

    for (const record of normalized) {
      try {
        // 检查是否已存在
        const existed = db.exec(
          "SELECT id FROM cloud_regions WHERE vendor = ? AND region_id = ?",
          [record.vendor, record.region_id]
        );
        const existedRows = existed.length > 0 ? existed[0].values : [];

        // 先删除旧记录再插入（实现 UPSERT）
        db.run("DELETE FROM cloud_regions WHERE vendor = ? AND region_id = ?", [
          record.vendor,
          record.region_id,
        ]);

        db.run(
          `INSERT INTO cloud_regions 
            (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, data_source_url, fetched_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.vendor,
            record.region_id,
            record.region_name,
            record.country,
            record.city,
            record.lat,
            record.lng,
            record.az_list,
            record.az_count,
            record.status,
            record.region_type,
            record.data_source_url,
            record.fetched_at,
          ]
        );

        if (existedRows.length > 0) {
          updated++;
        } else {
          added++;
        }
      } catch (err) {
        errors.push(`入库失败 [${record.vendor}/${record.region_id}]: ${String(err)}`);
      }
    }

    // 每次采集后持久化
    saveDb();
  } catch (err) {
    errors.push(`采集器执行失败: ${String(err)}`);
  }

  return { added, updated, errors };
}

export async function runCollection(vendor?: Vendor): Promise<CollectResponse> {
  const startTime = Date.now();
  const collectors = getCollectors();

  let targetVendors: Vendor[];
  if (vendor && collectors.has(vendor)) {
    targetVendors = [vendor];
  } else {
    targetVendors = [...collectors.keys()];
  }

  let totalAdded = 0;
  let totalUpdated = 0;
  const allErrors: string[] = [];
  const now = new Date().toISOString();

  for (const v of targetVendors) {
    const c = collectors.get(v)!;
    console.log(`[Orchestrator] 开始采集 ${v}...`);
    const result = await collectVendor(c);
    totalAdded += result.added;
    totalUpdated += result.updated;
    allErrors.push(...result.errors);

    // 记录采集日志
    getDb().run(
      "INSERT INTO collect_logs (vendor, regions_added, regions_updated, errors, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [v, result.added, result.updated, JSON.stringify(result.errors), 0, now]
    );
    saveDb();

    console.log(`[Orchestrator] ${v} 采集完成: +${result.added} ~${result.updated} err:${result.errors.length}`);
  }

  const duration = Date.now() - startTime;

  return {
    success: allErrors.length === 0,
    vendor: vendor || "all",
    regions_added: totalAdded,
    regions_updated: totalUpdated,
    duration_ms: duration,
    errors: allErrors,
  };
}

async function main() {
  const { initDb, closeDb } = await import("../db");
  await initDb();
  console.log("[Orchestrator] 开始全量采集...");
  const result = await runCollection();
  console.log("[Orchestrator] 采集完成:", JSON.stringify(result, null, 2));
  closeDb();
  process.exit(0);
}

// 直接运行时执行
const _isMain = typeof require !== "undefined" && require.main === module;
if (_isMain) {
  main();
}
