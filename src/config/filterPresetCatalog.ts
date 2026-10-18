export interface SceneFilterConfig {
  presetId?: string;
  brightness?: number;   // Mặc định 100 (%) [0 - 200]
  contrast?: number;     // Mặc định 100 (%) [0 - 200]
  saturate?: number;     // Mặc định 100 (%) [0 - 200]
  hueRotate?: number;    // Mặc định 0 (deg) [-180 - 180]
  sepia?: number;        // Mặc định 0 (%) [0 - 100]
  grayscale?: number;    // Mặc định 0 (%) [0 - 100]
  blur?: number;         // Mặc định 0 (px) [0 - 8] -> Giới hạn tối đa 8px để không chậm render
  temperature?: number;  // Tone ấm / lạnh (-50 đến 50)
}

export interface FilterPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  config: SceneFilterConfig;
}

export const DEFAULT_FILTER_CONFIG: SceneFilterConfig = {
  presetId: 'none',
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  temperature: 0,
};

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'Gốc',
    emoji: '⚪',
    description: 'Không áp dụng bộ lọc',
    config: { ...DEFAULT_FILTER_CONFIG }
  },
  {
    id: 'cinematic',
    name: 'Điện Ảnh',
    emoji: '🎬',
    description: 'Tone Teal & Orange, tương phản cao',
    config: {
      presetId: 'cinematic',
      brightness: 96,
      contrast: 125,
      saturate: 120,
      hueRotate: 8,
      sepia: 0,
      grayscale: 0,
      blur: 0,
      temperature: 5
    }
  },
  {
    id: 'vintage_90s',
    name: 'Retro 90s',
    emoji: '📼',
    description: 'Màu phim cũ hoài niệm, ánh vàng sepia',
    config: {
      presetId: 'vintage_90s',
      brightness: 95,
      contrast: 115,
      saturate: 85,
      hueRotate: -5,
      sepia: 35,
      grayscale: 0,
      blur: 0,
      temperature: 15
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Neon',
    emoji: '⚡',
    description: 'Màu tím xanh tương lai huyền bí',
    config: {
      presetId: 'cyberpunk',
      brightness: 100,
      contrast: 135,
      saturate: 170,
      hueRotate: 185,
      sepia: 0,
      grayscale: 0,
      blur: 0,
      temperature: -20
    }
  },
  {
    id: 'warm_sunset',
    name: 'Ấm Áp',
    emoji: '🌅',
    description: 'Nắng chiều ấm áp, rực rỡ',
    config: {
      presetId: 'warm_sunset',
      brightness: 104,
      contrast: 110,
      saturate: 130,
      hueRotate: -8,
      sepia: 18,
      grayscale: 0,
      blur: 0,
      temperature: 25
    }
  },
  {
    id: 'nordic_cold',
    name: 'Lạnh Lùng',
    emoji: '❄️',
    description: 'Tone xanh băng giá, trầm mặc',
    config: {
      presetId: 'nordic_cold',
      brightness: 94,
      contrast: 110,
      saturate: 80,
      hueRotate: 190,
      sepia: 0,
      grayscale: 0,
      blur: 0,
      temperature: -30
    }
  },
  {
    id: 'noir_bw',
    name: 'Đen Trắng',
    emoji: '🖤',
    description: 'Trắng đen nghệ thuật, tương phản cao',
    config: {
      presetId: 'noir_bw',
      brightness: 92,
      contrast: 145,
      saturate: 0,
      hueRotate: 0,
      sepia: 0,
      grayscale: 100,
      blur: 0,
      temperature: 0
    }
  },
  {
    id: 'vivid_pop',
    name: 'Rực Rỡ',
    emoji: '🌈',
    description: 'Màu sắc sống động, thu hút ánh nhìn',
    config: {
      presetId: 'vivid_pop',
      brightness: 102,
      contrast: 115,
      saturate: 160,
      hueRotate: 0,
      sepia: 0,
      grayscale: 0,
      blur: 0,
      temperature: 0
    }
  },
  {
    id: 'dreamy_soft',
    name: 'Mộng Mơ',
    emoji: '🌸',
    description: 'Sáng nhẹ dịu mắt, huyền ảo',
    config: {
      presetId: 'dreamy_soft',
      brightness: 110,
      contrast: 92,
      saturate: 110,
      hueRotate: -4,
      sepia: 8,
      grayscale: 0,
      blur: 0,
      temperature: 10
    }
  }
];

/**
 * Chuyển đổi SceneFilterConfig thành chuỗi CSS filter tối ưu GPU
 */
export function generateCssFilterString(config?: SceneFilterConfig): string {
  if (!config) return 'none';

  const {
    brightness = 100,
    contrast = 100,
    saturate = 100,
    hueRotate = 0,
    sepia = 0,
    grayscale = 0,
    blur = 0,
    temperature = 0
  } = config;

  // Nếu tất cả thông số đều ở mức mặc định
  if (
    brightness === 100 &&
    contrast === 100 &&
    saturate === 100 &&
    hueRotate === 0 &&
    sepia === 0 &&
    grayscale === 0 &&
    blur === 0 &&
    temperature === 0
  ) {
    return 'none';
  }

  const parts: string[] = [];

  if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
  if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
  if (saturate !== 100) parts.push(`saturate(${saturate}%)`);
  if (hueRotate !== 0) parts.push(`hue-rotate(${hueRotate}deg)`);
  if (sepia > 0) parts.push(`sepia(${sepia}%)`);
  if (grayscale > 0) parts.push(`grayscale(${grayscale}%)`);
  if (blur > 0) parts.push(`blur(${Math.min(blur, 8)}px)`); // Giới hạn an toàn

  // Xử lý temperature (tone ấm / lạnh) bằng kết hợp sepia và hue-rotate nhẹ
  if (temperature > 0) {
    parts.push(`sepia(${Math.round(temperature * 0.4)}%)`);
  } else if (temperature < 0) {
    parts.push(`hue-rotate(${Math.round(temperature * 0.8)}deg)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}
