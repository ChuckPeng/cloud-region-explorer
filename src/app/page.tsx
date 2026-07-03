"use client";

// ==================== 仪表盘首页 ====================

import { useEffect, useState } from "react";
import { StatsResponse } from "@/types";
import { VENDOR_LABELS, VENDOR_COLORS, Vendor } from "@/types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Cloud, Server, MapPin, Clock } from "lucide-react";

export default function HomePage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Cloud className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">暂无数据</p>
        <p className="text-sm text-muted-foreground">请点击右上角"刷新数据"按钮采集数据</p>
      </div>
    );
  }

  // 为图表准备数据
  const vendorData = Object.entries(stats.vendor_breakdown)
    .filter(([, count]) => count > 0)
    .map(([vendor, count]) => ({
      name: VENDOR_LABELS[vendor as Vendor] || vendor,
      vendor: vendor as Vendor,
      value: count,
    }));

  const countryData = Object.entries(stats.country_breakdown)
    .filter(([, count]) => count > 0)
    .slice(0, 10)
    .map(([country, count]) => ({ name: country, value: count }));

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Cloud} label="活跃 Region" value={stats.total_regions} color="text-blue-500" />
        <StatCard icon={Server} label="可用区总数" value={stats.total_azs} color="text-green-500" />
        <StatCard icon={MapPin} label="覆盖国家" value={Object.keys(stats.country_breakdown).length} color="text-orange-500" />
        <StatCard
          icon={Clock}
          label="最近更新"
          value={stats.last_updated ? new Date(stats.last_updated).toLocaleDateString("zh-CN") : "-"}
          color="text-purple-500"
        />
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 厂商饼图 */}
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">厂商 Region 分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vendorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ strokeWidth: 1 }}
              >
                {vendorData.map((entry) => (
                  <Cell key={entry.vendor} fill={VENDOR_COLORS[entry.vendor]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 国家柱状图 */}
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Region 覆盖 Top 10 国家</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 厂商明细卡片 */}
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">厂商详情</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {vendorData.map((item) => (
            <div
              key={item.vendor}
              className="flex flex-col items-center p-3 rounded-lg border border-[rgb(var(--border))]"
              style={{ borderLeftColor: VENDOR_COLORS[item.vendor], borderLeftWidth: 3 }}
            >
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <span className="text-2xl font-bold mt-1">{item.value}</span>
              <span className="text-xs text-muted-foreground">Regions</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-[rgb(var(--muted))] ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
