# Architecture - 地图中文化 + 伊斯坦布尔补充

## 变更范围

### 文件 1: `src/app/map/page.tsx`
- TileLayer URL 替换为高德中文瓦片
- attribution 更新为高德版权声明

### 文件 2: `src/lib/utils.ts`
- CITY_COORDS 新增 Istanbul: { lat: 41.0082, lng: 28.9784 }

## 技术选型

| 项目 | 方案 |
|------|------|
| 中文地图底图 | 高德地图瓦片服务（免费，无需 API Key） |
| Tile URL 模板 | `https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}` |
| 子域名 | 1-4 |

## 不改变的部分
- 地图组件架构（react-leaflet dynamic import）
- 数据采集器逻辑
- 数据库 schema
- API 端点
