"use client";

// ==================== 对比矩阵页面 (F10) ====================

import { useEffect, useState, useMemo, useCallback } from "react";
import { CloudRegion, VENDOR_LABELS, VENDOR_COLORS, Vendor, VENDORS } from "@/types";
import { Check, X } from "lucide-react";

export default function ComparePage() {
  const [regions, setRegions] = useState<CloudRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState<Set<Vendor>>(
    new Set(["aws", "azure", "gcp", "aliyun", "huawei", "tencent"])
  );
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"country" | "city">("country");

  useEffect(() => {
    fetch("/api/regions?limit=500&status=active")
      .then((r) => r.json())
      .then((data) => {
        setRegions(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleVendor = (v: Vendor) => {
    const next = new Set(selectedVendors);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setSelectedVendors(next);
  };

  const toggleCountry = (c: string) => {
    const next = new Set(selectedCountries);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setSelectedCountries(next);
  };

  // 所有唯一的国家列表
  const allCountries = useMemo(
    () => [...new Set(regions.map((r) => r.country))].sort(),
    [regions]
  );

  // 按国家/城市聚合的对比矩阵数据
  const matrix = useMemo(() => {
    const key = viewMode === "country" ? "country" : "city";
    const uniqueKeys = [...new Set(regions.map((r) => r[key]))]
      .filter(Boolean)
      .sort();

    // 筛选国家
    const filtered = selectedCountries.size > 0
      ? uniqueKeys.filter((k) => selectedCountries.has(k))
      : uniqueKeys;

    return filtered.map((keyVal) => {
      const row: Record<string, { has: boolean; count: number }> = {};
      for (const v of selectedVendors) {
        const vendorRegions = regions.filter(
          (r) => r[key] === keyVal && r.vendor === v
        );
        row[v] = {
          has: vendorRegions.length > 0,
          count: vendorRegions.reduce((s, r) => s + r.az_count, 0),
        };
      }
      return { key: keyVal, row };
    });
  }, [regions, viewMode, selectedVendors, selectedCountries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeVendors = [...selectedVendors];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Region 对比矩阵</h1>
        {/* 视图模式切换 */}
        <div className="flex rounded-lg border border-[rgb(var(--border))] overflow-hidden">
          <button
            onClick={() => setViewMode("country")}
            className={`px-3 py-1.5 text-sm ${viewMode === "country" ? "bg-blue-500 text-white" : "bg-[rgb(var(--card))]"}`}
          >
            按国家
          </button>
          <button
            onClick={() => setViewMode("city")}
            className={`px-3 py-1.5 text-sm ${viewMode === "city" ? "bg-blue-500 text-white" : "bg-[rgb(var(--card))]"}`}
          >
            按城市
          </button>
        </div>
      </div>

      {/* 厂商选择 */}
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">选择对比厂商</h3>
        <div className="flex flex-wrap gap-2">
          {VENDORS.map((v) => (
            <button
              key={v}
              onClick={() => toggleVendor(v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedVendors.has(v)
                  ? "text-white border-transparent"
                  : "text-muted-foreground border-[rgb(var(--border))] hover:border-current"
              }`}
              style={
                selectedVendors.has(v)
                  ? { backgroundColor: VENDOR_COLORS[v] }
                  : {}
              }
            >
              {selectedVendors.has(v) ? <Check className="w-3.5 h-3.5" /> : null}
              {VENDOR_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* 国家筛选（仅在按城市模式时显示） */}
      {viewMode === "city" && (
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">
            筛选国家 {selectedCountries.size > 0 && `(已选 ${selectedCountries.size})`}
          </h3>
          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
            {allCountries.map((c) => (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                className={`px-2.5 py-1 rounded text-xs ${
                  selectedCountries.has(c)
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-[rgb(var(--muted))] text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 矩阵表格 */}
      <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--muted))] sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium sticky left-0 bg-[rgb(var(--muted))] z-20">
                  {viewMode === "country" ? "国家" : "城市"}
                </th>
                {activeVendors.map((v) => (
                  <th
                    key={v}
                    className="text-center px-4 py-3 font-medium whitespace-nowrap"
                    style={{ color: VENDOR_COLORS[v] }}
                  >
                    {VENDOR_LABELS[v]}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-medium">覆盖率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {matrix.length === 0 ? (
                <tr>
                  <td colSpan={activeVendors.length + 2} className="text-center py-12 text-muted-foreground">
                    请选择至少一个厂商
                  </td>
                </tr>
              ) : (
                matrix.map(({ key, row }) => {
                  const covered = activeVendors.filter((v) => row[v]?.has).length;
                  const pct = Math.round((covered / activeVendors.length) * 100);
                  return (
                    <tr key={key} className="hover:bg-[rgb(var(--muted))]/50">
                      <td className="px-4 py-2.5 font-medium sticky left-0 bg-[rgb(var(--card))]">
                        {key}
                      </td>
                      {activeVendors.map((v) => (
                        <td key={v} className="text-center px-4 py-2.5">
                          {row[v]?.has ? (
                            <div className="flex flex-col items-center">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-muted-foreground">
                                {row[v].count} AZ
                              </span>
                            </div>
                          ) : (
                            <X className="w-4 h-4 text-red-300 mx-auto" />
                          )}
                        </td>
                      ))}
                      <td className="text-center px-4 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            pct === 100
                              ? "bg-green-100 text-green-700"
                              : pct >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {covered}/{activeVendors.length} ({pct}%)
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="对比厂商" value={`${activeVendors.length}`} />
        <SummaryCard label="维度数" value={`${matrix.length}`} />
        <SummaryCard
          label="全覆盖"
          value={`${matrix.filter(({ row }) => activeVendors.every((v) => row[v]?.has)).length}`}
        />
        <SummaryCard
          label="仅单厂商"
          value={`${matrix.filter(({ row }) => activeVendors.filter((v) => row[v]?.has).length === 1).length}`}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
