"use client";

// ==================== 地图可视化页面 (F9) - 动态导入版本 ====================

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { CloudRegion, VENDOR_LABELS, VENDOR_COLORS, Vendor, VENDORS } from "@/types";
import { Layers } from "lucide-react";

// 动态导入地图组件，禁用 SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function MapPage() {
  const [regions, setRegions] = useState<CloudRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/regions?limit=500")
      .then((r) => r.json())
      .then((data) => {
        setRegions(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      selectedVendor === "all"
        ? regions
        : regions.filter((r) => r.vendor === selectedVendor),
    [regions, selectedVendor]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      if (r.lat === 0 && r.lng === 0) continue;
      const key = `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()].map(([key, items]) => {
      const [lat, lng] = key.split(",").map(Number);
      return { lat, lng, items };
    });
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🌍 地图视图</h1>
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部厂商</option>
          {VENDORS.map((v) => (
            <option key={v} value={v}>{VENDOR_LABELS[v]}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden border border-[rgb(var(--border))]" style={{ height: "600px" }}>
        {mounted && (
          <MapContainer
            key="map"
            center={[30, 104]}
            zoom={3}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; 高德地图 | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            />
            {grouped.map((group, idx) => (
              <MapMarkerContent key={idx} group={group} />
            ))}
          </MapContainer>
        )}
      </div>

      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
        <h3 className="font-medium mb-3 text-sm">厂商图例</h3>
        <div className="flex flex-wrap gap-3">
          {VENDORS.map((v) => (
            <div key={v} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: VENDOR_COLORS[v] }} />
              <span>{VENDOR_LABELS[v]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapMarkerContent({ group }: { group: { lat: number; lng: number; items: CloudRegion[] } }) {
  const primaryColor = VENDOR_COLORS[group.items[0].vendor] || "#3B82F6";
  const totalAzs = group.items.reduce((sum, r) => sum + r.az_count, 0);

  // require() 在函数体内是懒加载，Next.js webpack 构建时不会尝试在服务端解析 leaflet 模块。
  // 该组件只在 dynamic({ ssr: false }) 的 MapContainer 子树上渲染，因此 require 仅执行于浏览器。
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const L = require("leaflet");

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${primaryColor};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <Marker position={[group.lat, group.lng]} icon={icon}>
      <Popup>
        <div className="text-sm max-h-[200px] overflow-y-auto">
          <p className="font-semibold mb-1">{group.items[0].city}, {group.items[0].country}</p>
          <p className="text-xs text-muted-foreground mb-2">{group.items.length} Region · {totalAzs} AZ</p>
          {group.items.map((r) => (
            <div key={r.id} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: VENDOR_COLORS[r.vendor] }} />
              <span className="font-medium">{VENDOR_LABELS[r.vendor]}</span>
              <span className="text-muted-foreground">{r.region_name} ({r.az_count} AZ)</span>
            </div>
          ))}
        </div>
      </Popup>
    </Marker>
  );
}
