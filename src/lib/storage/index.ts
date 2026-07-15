// ==================== 存储工厂 ====================
// 根据环境自动选择 SqlJsStorage (Docker) 或 D1Storage (Cloudflare)

import { StorageBackend } from "./interface";

let _storage: StorageBackend | null = null;
let _initPromise: Promise<void> | null = null;

export async function getStorage(): Promise<StorageBackend> {
  if (_storage) return _storage;

  // Cloudflare Workers 环境
  if (typeof (globalThis as any).D1Database !== "undefined" || typeof process === "undefined") {
    const { D1Storage } = await import("./d1");
    const db = (globalThis as any).CLOUD_REGIONS_DB as D1Database;
    if (!db) throw new Error("D1 数据库绑定未配置 (CLOUD_REGIONS_DB)");
    _storage = new D1Storage(db);
  } else {
    // Node.js / Docker 环境
    const { sqlJsStorage } = await import("./sqljs");
    _storage = sqlJsStorage;
  }

  if (!_initPromise) {
    _initPromise = _storage.init();
  }
  await _initPromise;
  return _storage;
}

/** 确保存储已初始化（兼容旧 API） */
export async function ensureDb(): Promise<StorageBackend> {
  return getStorage();
}