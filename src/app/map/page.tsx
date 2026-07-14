"use client";

// ==================== 地图可视化页面 ====================

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { CloudRegion, VENDOR_LABELS, VENDOR_COLORS, Vendor, VENDORS } from "@/types";

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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  const vendors = [...new Set(group.items.map(r => r.vendor))];
  const markerColor = vendors.length === 1
    ? VENDOR_COLORS[vendors[0]]
    : "#555555";
  const totalAzs = group.items.reduce((sum, r) => sum + r.az_count, 0);

  const L = require("leaflet");

  const size = vendors.length === 1 ? 14 : 20;
  const html = vendors.length === 1
    ? '<div style="background:' + markerColor + ';width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>'
    : '<div style="background:' + markerColor + ';width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold">' + vendors.length + '</div>';

  const icon = L.divIcon({
    className: "custom-marker",
    html: html,
    iconSize: [size + 4, size + 4],
    iconAnchor: [size/2 + 2, size/2 + 2],
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
