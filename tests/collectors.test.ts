// ==================== 测试套件：采集器 ====================
// 运行: npx tsx tests/collectors.test.ts

import { initDb, closeDb, getDb, saveDb } from "../src/lib/db";
import { AwsCollector } from "../src/lib/collectors/aws";
import { AzureCollector } from "../src/lib/collectors/azure";
import { GcpCollector } from "../src/lib/collectors/gcp";
import { AliyunCollector } from "../src/lib/collectors/aliyun";
import { HuaweiCollector } from "../src/lib/collectors/huawei";
import { TencentCollector } from "../src/lib/collectors/tencent";
import { UCloudCollector } from "../src/lib/collectors/ucloud";
import { BaseCollector } from "../src/lib/collectors/base";
import { VENDORS, Vendor } from "../src/types";
import * as fs from "fs";
import * as path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "data", "cloud-regions.db");

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}`); failed++; }
}

const COLLECTORS: Record<string, BaseCollector> = {
  aws: new AwsCollector(),
  azure: new AzureCollector(),
  gcp: new GcpCollector(),
  aliyun: new AliyunCollector(),
  huawei: new HuaweiCollector(),
  tencent: new TencentCollector(),
  ucloud: new UCloudCollector(),
};

async function runTests() {
  console.log("\n=== 采集器测试 ===\n");

  // 清理
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  await initDb();

  for (const vendor of VENDORS) {
    const collector = COLLECTORS[vendor];
    console.log(`\n--- ${vendor.toUpperCase()} ---`);

    // 1. vendor 属性
    assert(collector.vendor === vendor, `vendor 属性 = ${vendor}`);

    // 2. 域名白名单
    assert(collector.allowedDomains.length > 0, `allowedDomains 非空 (${collector.allowedDomains.length} 个)`);

    // 3. URL 校验：白名单内
    try {
      collector.validateUrl(`https://${collector.allowedDomains[0]}/test`);
      assert(true, `白名单 URL 校验通过`);
    } catch (e) {
      assert(false, `白名单 URL 校验异常: ${e}`);
    }

    // 4. URL 校验：白名单外
    let blocked = false;
    try {
      collector.validateUrl("https://evil-site.com/data");
    } catch {
      blocked = true;
    }
    assert(blocked, "非白名单 URL 被正确阻止");

    // 5. 采集数据
    const rawData = await collector.collect();
    assert(rawData.length > 0, `采集到 ${rawData.length} 条原始数据`);

    // 6. 数据完整性检查
    const firstItem = rawData[0];
    assert(firstItem.vendor === vendor, `数据 vendor 字段正确 (${firstItem.vendor})`);
    assert(firstItem.region_id.length > 0, `region_id 非空 (${firstItem.region_id})`);
    assert(firstItem.region_name.length > 0, `region_name 非空 (${firstItem.region_name})`);
    assert(firstItem.az_names.length > 0, `AZ 列表非空 (${firstItem.az_names.length} 个)`);
    assert(firstItem.country.length > 0, `country 非空 (${firstItem.country})`);

    // 7. 标准化
    const normalized = collector.normalize(rawData);
    assert(normalized.length === rawData.length, `标准化后条目数一致 (${normalized.length})`);
    assert(normalized[0].az_count === rawData[0].az_names.length, `az_count 正确 (${normalized[0].az_count})`);
    assert(typeof normalized[0].az_list === "string", "az_list 是 JSON 字符串");
    assert(JSON.parse(normalized[0].az_list).length === rawData[0].az_names.length, "az_list 可解析且长度正确");

    // 8. 入库
    const db = getDb();
    for (const record of normalized) {
      db.run("DELETE FROM cloud_regions WHERE vendor = ? AND region_id = ?", [record.vendor, record.region_id]);
      db.run(
        `INSERT INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, data_source_url, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [record.vendor, record.region_id, record.region_name, record.country, record.city, record.lat, record.lng, record.az_list, record.az_count, record.status, record.region_type, record.data_source_url, record.fetched_at]
      );
    }
    saveDb();

    const countResult = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE vendor = ?", [vendor]);
    const count = countResult[0].values[0][0] as number;
    assert(count === rawData.length, `入库后 count=${count} (期望 ${rawData.length})`);
  }

  // 交叉验证
  console.log("\n--- 交叉验证 ---");
  const db = getDb();
  const totalResult = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE status = 'active'");
  const total = totalResult[0].values[0][0] as number;
  assert(total > 50, `活跃 Region 总数=${total} (>50)`);

  const vendorResult = db.exec("SELECT DISTINCT vendor FROM cloud_regions ORDER BY vendor");
  const vendorsInDb = vendorResult[0].values.map((r: any) => r[0]) as string[];
  assert(vendorsInDb.length === 7, `DB 中有 ${vendorsInDb.length} 个不同的厂商 (期望 7)`);

  closeDb();
  fs.unlinkSync(TEST_DB_PATH);

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("测试异常:", e);
  process.exit(1);
});
