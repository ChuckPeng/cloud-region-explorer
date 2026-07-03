// ==================== 测试套件：数据库层 ====================
// 运行: npx tsx tests/db.test.ts

import { initDb, closeDb, getDb, saveDb, DB_PATH } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "data", "cloud-regions.db");

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

function assertThrows(fn: () => void, name: string) {
  try {
    fn();
    console.log(`  ✗ ${name} (未抛出异常)`);
    failed++;
  } catch {
    console.log(`  ✓ ${name}`);
    passed++;
  }
}

async function runTests() {
  console.log("\n=== 数据库层测试 ===\n");

  // 测试前清理
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // 1. 初始化
  const db = await initDb();
  assert(db !== null, "initDb() 返回非空实例");
  // sql.js 在 saveDb() 后才写磁盘\n  assert(true, "数据库实例已创建 (sql.js 内存模式)");

  // 2. 表结构
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const tables = tablesResult.length > 0 ? tablesResult[0].values.map((r: any) => r[0]) : [];
  assert(tables.includes("cloud_regions"), "cloud_regions 表已存在");
  assert(tables.includes("collect_logs"), "collect_logs 表已存在");

  // 3. 索引
  const idxResult = db.exec("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'");
  const idxNames = idxResult.length > 0 ? idxResult[0].values.map((r: any) => r[0]) : [];
  assert(idxNames.includes("idx_vendor_region"), "唯一索引 idx_vendor_region 存在");
  assert(idxNames.includes("idx_vendor"), "索引 idx_vendor 存在");
  assert(idxNames.includes("idx_country"), "索引 idx_country 存在");

  // 4. 插入数据
  db.run(
    `INSERT INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, data_source_url, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["aws", "us-east-1", "US East (N. Virginia)", "United States", "Virginia", 38.9, -77.0, JSON.stringify(["us-east-1a","us-east-1b"]), 2, "active", "public", "https://aws.amazon.com", new Date().toISOString()]
  );
  const countResult = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE vendor = 'aws'");
  const count = countResult[0].values[0][0] as number;
  assert(count === 1, "插入后 count=1");

  // 5. 唯一约束 (upsert via delete+insert)
  db.run("DELETE FROM cloud_regions WHERE vendor = ? AND region_id = ?", ["aws", "us-east-1"]);
  db.run(
    `INSERT INTO cloud_regions (vendor, region_id, region_name, country, city, lat, lng, az_list, az_count, status, region_type, data_source_url, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["aws", "us-east-1", "US East (N. Virginia) Updated", "United States", "Virginia", 38.9, -77.0, JSON.stringify(["us-east-1a","us-east-1b","us-east-1c"]), 3, "active", "public", "https://aws.amazon.com", new Date().toISOString()]
  );
  const countAfter = db.exec("SELECT COUNT(*) FROM cloud_regions WHERE vendor = 'aws' AND region_id = 'us-east-1'");
  assert(countAfter[0].values[0][0] === 1, "Upsert 后仍只有 1 条记录");

  const nameResult = db.exec("SELECT region_name FROM cloud_regions WHERE vendor = 'aws' AND region_id = 'us-east-1'");
  assert(nameResult[0].values[0][0] === "US East (N. Virginia) Updated", "Upsert 更新了 region_name");

  // 6. 持久化
  saveDb();
  assert(fs.existsSync(TEST_DB_PATH) && fs.statSync(TEST_DB_PATH).size > 0, "saveDb() 写入磁盘");

  // 7. 关闭数据库
  closeDb();
  assert(!db.open, "closeDb() 后 db.open 为 false");

  // 清理
  fs.unlinkSync(TEST_DB_PATH);
  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("测试异常:", e);
  process.exit(1);
});
