// ==================== 测试套件：API 端点 ====================
// 运行: npx tsx tests/api.test.ts

import { initDb, closeDb, getDb, saveDb } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "data", "cloud-regions.db");

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}`); failed++; }
}

const TEST_DATA: any[][] = [
  ["aws", "us-east-1", "US East (N. Virginia)", "United States", "Virginia", 38.9, -77.0, JSON.stringify(["us-east-1a","us-east-1b","us-east-1c"]), 3, "active", "public", "https://aws.amazon.com"],
  ["aws", "ap-southeast-1", "Asia Pacific (Singapore)", "Singapore", "Singapore", 1.35, 103.82, JSON.stringify(["ap-southeast-1a","ap-southeast-1b","ap-southeast-1c"]), 3, "active", "public", "https://aws.amazon.com"],
  ["azure", "eastus", "East US", "United States", "Virginia", 38.9, -77.0, JSON.stringify(["eastus-1","eastus-2","eastus-3"]), 3, "active", "public", "https://azure.microsoft.com"],
  ["gcp", "asia-southeast1", "Singapore", "Singapore", "Singapore", 1.35, 103.82, JSON.stringify(["asia-southeast1-a","asia-southeast1-b","asia-southeast1-c"]), 3, "active", "public", "https://cloud.google.com"],
  ["aliyun", "cn-hangzhou", "华东1（杭州）", "China", "杭州", 30.27, 120.15, JSON.stringify(["cn-hangzhou-a","cn-hangzhou-b","cn-hangzhou-c"]), 3, "active", "public", "https://help.aliyun.com"],
  ["tencent", "ap-beijing", "华北地区（北京）", "China", "北京", 39.9, 116.4, JSON.stringify(["ap-beijing-1","ap-beijing-2","ap-beijing-3"]), 3, "active", "public", "https://cloud.tencent.com"],
  ["aws", "cn-north-1", "China (Beijing)", "China", "北京", 39.9, 116.4, JSON.stringify(["cn-north-1a","cn-north-1b"]), 2, "active", "dedicated", "https://aws.amazon.com"],
  ["azure", "chinanorth", "China North", "China", "北京", 39.9, 116.4, JSON.stringify(["chinanorth-1","chinanorth-2"]), 2, "active", "dedicated", "https://azure.microsoft.com"],
  ["aws", "eu-west-2", "Europe (London)", "United Kingdom", "London", 51.5, -0.13, JSON.stringify(["eu-west-2a","eu-west-2b","eu-west-2c"]), 3, "planned", "public", "https://aws.amazon.com"],
];

async function runTests() {
  console.log("\n=== API 数据层测试 (模拟) ===\n");

  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  const db = await initDb();

  for (const row of TEST_DATA) {
    db.run(
      `INSERT INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, data_source_url, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...row, new Date().toISOString()]
    );
  }
  saveDb();

  // 测试全量查询
  const all = db.exec("SELECT COUNT(*) FROM cloud_regions");
  assert(Number(all[0].values[0][0]) === 9, "全量查询: 9 条");

  // 按厂商筛选
  const awsOnly = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE vendor = 'aws'");
  assert(Number(awsOnly[0].values[0][0]) == 4, "按厂商 aws 筛选: 4 条");

  // 按国家筛选
  const chinaOnly = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE country = 'China'");
  assert(Number(chinaOnly[0].values[0][0]) === 4, "按国家 China 筛选: 4 条");

  // 按状态筛选
  const plannedOnly = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE status = 'planned'");
  assert(Number(plannedOnly[0].values[0][0]) === 1, "按状态 planned 筛选: 1 条");

  // 搜索
  const searchResult = db.exec(
    "SELECT COUNT(*) FROM cloud_regions WHERE region_name LIKE ? OR city LIKE ?",
    ["%Singapore%", "%Singapore%"]
  );
  assert(Number(searchResult[0].values[0][0]) === 2, '搜索 Singapore: 2 条');

  // 分页
  const paged = db.exec("SELECT * FROM cloud_regions ORDER BY id LIMIT 3 OFFSET 0");
  assert(paged[0].values.length === 3, "分页 limit=3: 3 条");

  const paged2 = db.exec("SELECT * FROM cloud_regions ORDER BY id LIMIT 3 OFFSET 3");
  assert(paged2[0].values.length === 3, "分页 limit=3 offset=3: 3 条");

  // distinct vendors
  const vendors = db.exec("SELECT DISTINCT vendor FROM cloud_regions ORDER BY vendor");
  const vendorList = vendors[0].values.map((r: any) => r[0]);
  assert(vendorList.length === 5, `distinct vendors: 5 个 (${vendorList.join(", ")})`);

  // distinct countries
  const countries = db.exec("SELECT DISTINCT country FROM cloud_regions ORDER BY country");
  const countryList = countries[0].values.map((r: any) => r[0]);
  assert(countryList.length === 4, `distinct countries: 4 个 (${countryList.join(", ")})`);

  // 活跃统计
  const stats = db.exec("SELECT COUNT(*), COALESCE(SUM(az_count), 0) FROM cloud_regions WHERE status = 'active'");
  const activeCount = Number(stats[0].values[0][0]);
  const azSum = Number(stats[0].values[0][1]);
  assert(activeCount === 8, `活跃 Region: ${activeCount}`);
  assert(azSum === 22, `活跃 AZ 总数: ${azSum}`);

  // 厂商分组
  const vendorStats = db.exec("SELECT vendor, COUNT(*) FROM cloud_regions WHERE status = 'active' GROUP BY vendor");
  assert(vendorStats[0].values.length === 5, `厂商分组: ${vendorStats[0].values.length} 行`);

  // Top 国家
  const countryStats = db.exec("SELECT country, COUNT(*) FROM cloud_regions WHERE status = 'active' GROUP BY country ORDER BY COUNT(*) DESC");
  assert(countryStats[0].values[0][0] === "China", `Top 国家: ${countryStats[0].values[0][0]}`);

  // last_updated
  const last = db.exec("SELECT MAX(fetched_at) FROM cloud_regions");
  assert(last[0].values[0][0] !== null, "last_updated 非空");

  // 边缘条件
  const emptySearch = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE region_name LIKE ?", ["%NONEXISTENT%"]);
  assert(Number(emptySearch[0].values[0][0]) === 0, "不存在的搜索词返回 0");

  const outOfBounds = db.exec("SELECT * FROM cloud_regions ORDER BY id LIMIT 10 OFFSET 100");
  assert(outOfBounds.length === 0 || outOfBounds[0].values.length === 0, "超范围分页返回空");

  closeDb();
  fs.unlinkSync(TEST_DB_PATH);

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("测试异常:", e);
  process.exit(1);
});
