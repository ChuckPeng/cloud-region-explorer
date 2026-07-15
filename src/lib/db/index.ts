// ==================== 数据库兼容层 ====================
// 兼容旧 API Routes，底层使用 SqlJsStorage

import { sqlJsStorage } from "../storage/sqljs";
import { getDb as sqlGetDb } from "../storage/sqljs";

// 兼容旧代码的 ensureDb（返回 sql.js Database 实例）
export async function ensureDb() {
  await sqlJsStorage.init();
  return sqlGetDb();
}

export { sqlJsStorage };
export { getDb, saveDb } from "../storage/sqljs";