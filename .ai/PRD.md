# PRD - 地图中文化 + 华为云伊斯坦布尔节点补充

## 1. 需求背景

- 当前地图底图为 OpenStreetMap 英文版，用户希望使用中文版底图
- 华为云伊斯坦布尔节点存在于采集器中，但地图视图无圆点标识

## 2. 需求分析

### 2.1 地图中文化
- 当前 TileLayer URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` （英文标注）
- 改为高德地图或其它中文瓦片服务
- 候选：高德 `https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}` （子域名 1-4）

### 2.2 伊斯坦布尔节点缺失
- 根因：华为云采集器已有 `tr-west-1`（Istanbul），但 `utils.ts` 中 `CITY_COORDS` 缺少 Istanbul 坐标
- 导致 `lookupCoords("Istanbul")` 返回 `{lat:0, lng:0}`
- 地图组件过滤掉了 `lat=0 && lng=0` 的点
- 修复：在 CITY_COORDS 中添加 Istanbul 坐标

## 3. 验收标准
- 地图视图展示中文标注的城市/国家名称
- 华为云伊斯坦布尔节点在地图上有圆点标识
- 现有测试不改动，全部通过
