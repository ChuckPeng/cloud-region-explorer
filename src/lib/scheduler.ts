// ==================== 定时调度器 ====================
// 每月 1 号 00:00 自动执行全量采集

import cron from "node-cron";
import { runCollection } from "./collectors/orchestrator";

let cronJob: cron.ScheduledTask | null = null;

/**
 * 启动定时采集任务
 * 每月 1 号凌晨 0 点执行
 */
export function startScheduler(): void {
  if (cronJob) {
    console.log("[Scheduler] 调度器已在运行中");
    return;
  }

  // cron 表达式: 分 时 日 月 周
  // "0 0 1 * *" = 每月 1 号 00:00
  cronJob = cron.schedule("0 0 1 * *", async () => {
    console.log("[Scheduler] 触发定时采集任务...");
    try {
      const result = await runCollection();
      console.log("[Scheduler] 定时采集完成:", JSON.stringify(result));
    } catch (err) {
      console.error("[Scheduler] 定时采集失败:", err);
    }
  });

  console.log("[Scheduler] 定时采集已启动: 每月 1 号 00:00");
}

/**
 * 停止定时采集任务
 */
export function stopScheduler(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("[Scheduler] 调度器已停止");
  }
}
