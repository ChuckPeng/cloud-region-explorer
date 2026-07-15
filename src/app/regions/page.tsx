"use client";

// ==================== 数据查询页面（Region 表格 + 筛选） ====================

import { useEffect, useState, useCallback } from "react";
import { CloudRegion, VENDOR_LABELS, VENDOR_COLORS, Vendor, VENDORS, RegionsResponse } from "@/types";
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export default function RegionsPage() {
  const [data, setData] = useState<RegionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 筛选条件
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVendor !== "all") params.set("vendor", selectedVendor);
      if (selectedCountry) params.set("country", selectedCountry);
      if (searchText) params.set("search", searchText);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/regions?" + params.toString());
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("查询失败:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVendor, selectedCountry, searchText, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Region 数据查询</h1>
        <span className="text-sm text-muted-foreground">
          {data ? `共 ${data.total} 条记录` : "加载中..."}
        </span>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 厂商选择 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedVendor}
            onChange={(e) => { setSelectedVendor(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部厂商</option>
            {VENDORS.map((v) => (
              <option key={v} value={v}>{VENDOR_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {/* 国家选择 */}
        {data && (
          <select
            value={selectedCountry}
            onChange={(e) => { setSelectedCountry(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部国家</option>
            {data.countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* 搜索框 */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索 Region 名称、ID、城市..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={fetchData}
          className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))] transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 数据表格 */}
      <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--muted))]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">厂商</th>
                <th className="text-left px-4 py-3 font-medium">Region ID</th>
                <th className="text-left px-4 py-3 font-medium">Region 名称</th>
                <th className="text-left px-4 py-3 font-medium">国家</th>
                <th className="text-left px-4 py-3 font-medium">城市</th>
                <th className="text-center px-4 py-3 font-medium">AZ 数量</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">类型</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : data && data.data.length > 0 ? (
                data.data.map((region: CloudRegion) => (
                  <tr key={region.id} className="hover:bg-[rgb(var(--muted))]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${VENDOR_COLORS[region.vendor]}20`,
                          color: VENDOR_COLORS[region.vendor],
                        }}
                      >
                        {VENDOR_LABELS[region.vendor]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{region.region_id}</td>
                    <td className="px-4 py-3">{region.region_name}</td>
                    <td className="px-4 py-3">{region.country}</td>
                    <td className="px-4 py-3">{region.city}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-medium">{region.az_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={region.status} />
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={region.region_type} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无数据，请先点击右上角"刷新数据"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgb(var(--border))]">
            <span className="text-sm text-muted-foreground">
              第 {page} / {totalPages} 页 (共 {data.total} 条)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-[rgb(var(--border))] disabled:opacity-30 hover:bg-[rgb(var(--muted))]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-[rgb(var(--border))] disabled:opacity-30 hover:bg-[rgb(var(--muted))]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    planned: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    retired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const label: Record<string, string> = {
    active: "运行中",
    planned: "规划中",
    retired: "已下线",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || ""}`}>
      {label[status] || status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    public: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gov: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    dedicated: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  const label: Record<string, string> = {
    public: "公有云",
    gov: "政府云",
    dedicated: "专有云",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[type] || ""}`}>
      {label[type] || type}
    </span>
  );
}
