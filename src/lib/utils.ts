// ==================== 工具函数 ====================

/**
 * 城市名称 → 经纬度映射表
 * 用于采集器在解析数据时自动补全坐标
 */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // === 中国 ===
  "北京": { lat: 39.9042, lng: 116.4074 },
  "上海": { lat: 31.2304, lng: 121.4737 },
  "广州": { lat: 23.1291, lng: 113.2644 },
  "深圳": { lat: 22.5431, lng: 114.0579 },
  "杭州": { lat: 30.2741, lng: 120.1551 },
  "成都": { lat: 30.5728, lng: 104.0668 },
  "南京": { lat: 32.0603, lng: 118.7969 },
  "重庆": { lat: 29.5630, lng: 106.5516 },
  "张家口": { lat: 40.8244, lng: 114.8875 },
  "呼和浩特": { lat: 40.8424, lng: 111.7490 },
  "乌兰察布": { lat: 41.0226, lng: 113.1280 },
  "香港": { lat: 22.3193, lng: 114.1694 },
  "台北": { lat: 25.0330, lng: 121.5654 },
  "武汉": { lat: 30.5928, lng: 114.3055 },
  "福州": { lat: 26.0745, lng: 119.2965 },
  "河源": { lat: 23.7436, lng: 114.7024 },
  "济南": { lat: 36.6508, lng: 117.1201 },
  "青岛": { lat: 36.0671, lng: 120.3826 },
  "贵阳": { lat: 26.6470, lng: 106.6302 },
  "昆明": { lat: 25.0389, lng: 102.7183 },
  "沈阳": { lat: 41.8057, lng: 123.4315 },
  "大连": { lat: 38.9140, lng: 121.6147 },
  "西安": { lat: 34.3416, lng: 108.9398 },
  "兰州": { lat: 36.0611, lng: 103.8343 },
  "银川": { lat: 38.4872, lng: 106.2309 },
  "郑州": { lat: 34.7466, lng: 113.6254 },
  "合肥": { lat: 31.8206, lng: 117.2272 },
  "长沙": { lat: 28.2282, lng: 112.9388 },
  "南昌": { lat: 28.6820, lng: 115.8579 },
  "南宁": { lat: 22.8170, lng: 108.3665 },
  "海口": { lat: 20.0440, lng: 110.3500 },
  "天津": { lat: 39.3434, lng: 117.3616 },
  "石家庄": { lat: 38.0423, lng: 114.5149 },
  "太原": { lat: 37.8706, lng: 112.5509 },
  "哈尔滨": { lat: 45.8023, lng: 126.5360 },
  "长春": { lat: 43.8178, lng: 125.3235 },
  "乌鲁木齐": { lat: 43.8256, lng: 87.6168 },
  "无锡": { lat: 31.4912, lng: 120.3119 },
  "苏州": { lat: 31.2990, lng: 120.5853 },
  "宁波": { lat: 29.8683, lng: 121.5440 },
  "佛山": { lat: 23.0218, lng: 113.1214 },
  "珠海": { lat: 22.2707, lng: 113.5767 },
  "拉萨": { lat: 29.6500, lng: 91.1000 },
  "西宁": { lat: 36.6232, lng: 101.7792 },

  // === 全球主要城市 ===
  // 亚太
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Tokyo": { lat: 35.6762, lng: 139.6503 },
  "Osaka": { lat: 34.6937, lng: 135.5023 },
  "Seoul": { lat: 37.5665, lng: 126.9780 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  "Jakarta": { lat: -6.2088, lng: 106.8456 },
  "Sydney": { lat: -33.8688, lng: 151.2093 },
  "Melbourne": { lat: -37.8136, lng: 144.9631 },
  "Bangkok": { lat: 13.7563, lng: 100.5018 },
  "Kuala Lumpur": { lat: 3.1390, lng: 101.6869 },
  "Manila": { lat: 14.5995, lng: 120.9842 },
  "Hanoi": { lat: 21.0278, lng: 105.8342 },

  // 北美
  "Virginia": { lat: 38.9072, lng: -77.0369 },
  "Ohio": { lat: 40.4173, lng: -82.9071 },
  "California": { lat: 37.7749, lng: -122.4194 },
  "Oregon": { lat: 45.5051, lng: -122.6750 },
  "Iowa": { lat: 41.5868, lng: -93.6250 },
  "Texas": { lat: 29.7499, lng: -95.3584 },
  "Montreal": { lat: 45.5017, lng: -73.5673 },
  "Toronto": { lat: 43.6532, lng: -79.3832 },
  "Washington DC": { lat: 38.9072, lng: -77.0369 },

  // 欧洲
  "Frankfurt": { lat: 50.1109, lng: 8.6821 },
  "London": { lat: 51.5074, lng: -0.1278 },
  "Ireland": { lat: 53.3331, lng: -6.2489 },
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Milan": { lat: 45.4642, lng: 9.1900 },
  "Amsterdam": { lat: 52.3676, lng: 4.9041 },
  "Stockholm": { lat: 59.3293, lng: 18.0686 },
  "Zurich": { lat: 47.3769, lng: 8.5417 },
  "Madrid": { lat: 40.4168, lng: -3.7038 },
  "Warsaw": { lat: 52.2297, lng: 21.0122 },
  "Munich": { lat: 48.1351, lng: 11.5820 },
  "Berlin": { lat: 52.5200, lng: 13.4050 },

  // 中东
  "Dubai": { lat: 25.2048, lng: 55.2708 },
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  "Tel Aviv": { lat: 32.0853, lng: 34.7818 },
  "Bahrain": { lat: 26.0667, lng: 50.5577 },
  "Riyadh": { lat: 24.7136, lng: 46.6753 },

  // 南美
  "Sao Paulo": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Santiago": { lat: -33.4489, lng: -70.6693 },
  "Istanbul": { lat: 41.0082, lng: 28.9784 },

  // 非洲
  "Cape Town": { lat: -33.9249, lng: 18.4241 },
  "Johannesburg": { lat: -26.2041, lng: 28.0473 },
  "Lagos": { lat: 6.5244, lng: 3.3792 },
  "Nairobi": { lat: -1.2921, lng: 36.8219 },

  // 大洋洲
  "Auckland": { lat: -36.8485, lng: 174.7633 },
  "Perth": { lat: -31.9505, lng: 115.8605 },
  "Canberra": { lat: -35.2809, lng: 149.1300 },
  "Wellington": { lat: -41.2865, lng: 174.7762 },
};

/**
 * 根据城市名称查找坐标
 * 支持模糊匹配：中文名、英文名、带国家后缀
 */
export function lookupCoords(city: string): { lat: number; lng: number } {
  // 精确匹配
  if (CITY_COORDS[city]) return CITY_COORDS[city];

  // 模糊匹配：尝试拆分复合名称
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (city.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }

  return { lat: 0, lng: 0 };
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
