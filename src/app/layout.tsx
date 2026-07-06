// ==================== 根布局 ====================

import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Cloud Region Explorer - 公有云资源查询系统",
  description: "一站式查询 AWS/Azure/GCP/阿里云/华为云/腾讯云/UCloud 全球 Region 与可用区",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
