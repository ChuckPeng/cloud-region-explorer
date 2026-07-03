// ==================== Next.js Instrumentation ====================
// 服务启动时初始化数据库和定时调度

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDb } = await import("@/lib/db");
    await initDb();

    // 启动定时采集（如果启用）
    if (process.env.CRON_ENABLED !== "false") {
      const { startScheduler } = await import("@/lib/scheduler");
      startScheduler();
    }
  }
}
