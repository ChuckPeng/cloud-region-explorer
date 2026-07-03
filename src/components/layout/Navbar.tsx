"use client";

// ==================== 顶部导航栏 ====================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Map, BarChart3, Database, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: BarChart3 },
  { href: "/regions", label: "数据查询", icon: Database },
  { href: "/map", label: "地图视图", icon: Map },
  { href: "/compare", label: "对比矩阵", icon: Globe },
];

export function Navbar() {
  const pathname = usePathname();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /** 手动触发全量采集 */
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setToast(null);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor: "all" }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`更新完成: +${data.regions_added} 新增, ~${data.regions_updated} 更新 (${(data.duration_ms / 1000).toFixed(1)}s)`);
      } else {
        setToast(`更新失败: ${data.errors?.[0] || "未知错误"}`);
      }
    } catch (err) {
      setToast(`请求失败: ${err}`);
    } finally {
      setRefreshing(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Globe className="w-6 h-6 text-blue-500" />
            <span className="hidden sm:inline">Cloud Region Explorer</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-[rgb(var(--muted))]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-2",
                "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
                refreshing && "opacity-50 cursor-not-allowed"
              )}
              title="立即刷新全部数据"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              <span className="hidden md:inline">{refreshing ? "更新中..." : "刷新数据"}</span>
            </button>
          </div>
        </div>

        {/* Toast 通知 */}
        {toast && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg text-sm shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    </nav>
  );
}
