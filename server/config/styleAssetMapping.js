// Server-side Style-to-3D-Asset Mapping (Single Source of Truth)
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';

const FLUENT_3D_ASSETS = [
  // ── Healing & Zen ───────────────────────────
  { id: 'lotus', name: 'Hoa sen', category: 'healing', url: `${CDN_BASE}/Lotus/3D/lotus_3d.png`, tags: ['thien', 'chua lanh', 'sen', 'zen', 'lotus', 'tinh tam'] },
  { id: 'seedling', name: 'Mầm non', category: 'healing', url: `${CDN_BASE}/Seedling/3D/seedling_3d.png`, tags: ['mam non', 'cay', 'sinh soi', 'growth', 'nature'] },
  { id: 'candle', name: 'Nến tĩnh tâm', category: 'healing', url: `${CDN_BASE}/Candle/3D/candle_3d.png`, tags: ['nen', 'candle', 'anh sang', 'thien', 'am ap'] },
  { id: 'crescent_moon', name: 'Trăng an giấc', category: 'healing', url: `${CDN_BASE}/Crescent%20moon/3D/crescent_moon_3d.png`, tags: ['trang', 'moon', 'dem', 'ngu ngon', 'an giac'] },
  { id: 'water_wave', name: 'Làn sóng êm đềm', category: 'healing', url: `${CDN_BASE}/Water%20wave/3D/water_wave_3d.png`, tags: ['song', 'wave', 'nuoc', 'bien', 'flow', 'relax'] },
  { id: 'dove', name: 'Chim bồ câu bình an', category: 'healing', url: `${CDN_BASE}/Dove/3D/dove_3d.png`, tags: ['bồ câu', 'dove', 'hoa binh', 'an yen', 'peace'] },
  { id: 'hot_tea', name: 'Tách trà ấm', category: 'healing', url: `${CDN_BASE}/Hot%20beverage/3D/hot_beverage_3d.png`, tags: ['tra', 'tea', 'cafe', 'chill', 'thu gian'] },
  { id: 'leaf_wind', name: 'Lá bay trong gió', category: 'healing', url: `${CDN_BASE}/Leaf%20fluttering%20in%20wind/3D/leaf_fluttering_in_wind_3d.png`, tags: ['la', 'leaf', 'gio', 'buong bo', 'wind'] },

  // ── Finance & Business ──────────────────────
  { id: 'money_bag', name: 'Túi tiền', category: 'finance', url: `${CDN_BASE}/Money%20bag/3D/money_bag_3d.png`, tags: ['tien', 'money', 'bag', 'dola', 'tai chinh'] },
  { id: 'money_wings', name: 'Tiền bay', category: 'finance', url: `${CDN_BASE}/Money%20with%20wings/3D/money_with_wings_3d.png`, tags: ['tien', 'rich', 'dola', 'cash', 'doanh thu'] },
  { id: 'chart_up', name: 'Biểu đồ tăng', category: 'finance', url: `${CDN_BASE}/Chart%20increasing/3D/chart_increasing_3d.png`, tags: ['chart', 'growth', 'tang truong', 'lai', 'crypto'] },
  { id: 'gem_stone', name: 'Kim cương', category: 'finance', url: `${CDN_BASE}/Gem%20stone/3D/gem_stone_3d.png`, tags: ['kim cuong', 'diamond', 'gia tri', 'luxury'] },
  { id: 'trophy', name: 'Cúp vô địch', category: 'finance', url: `${CDN_BASE}/Trophy/3D/trophy_3d.png`, tags: ['cup', 'trophy', 'top 1', 'chien thang'] },
  { id: 'coin', name: 'Đồng xu', category: 'finance', url: `${CDN_BASE}/Coin/3D/coin_3d.png`, tags: ['xu', 'coin', 'vang', 'token'] },

  // ── Tech, AI & Dev ──────────────────────────
  { id: 'robot', name: 'Robot AI', category: 'tech', url: `${CDN_BASE}/Robot/3D/robot_3d.png`, tags: ['robot', 'ai', 'bot', 'tu dong', 'chatgpt'] },
  { id: 'brain', name: 'Bộ não trí tuệ', category: 'tech', url: `${CDN_BASE}/Brain/3D/brain_3d.png`, tags: ['nao', 'brain', 'tri tue', 'mind', 'iq'] },
  { id: 'laptop', name: 'Laptop', category: 'tech', url: `${CDN_BASE}/Laptop/3D/laptop_3d.png`, tags: ['laptop', 'may tinh', 'code', 'work', 'phan mem'] },
  { id: 'phone', name: 'Điện thoại', category: 'tech', url: `${CDN_BASE}/Mobile%20phone/3D/mobile_phone_3d.png`, tags: ['phone', 'app', 'mobile', 'tiktok'] },
  { id: 'light_bulb', name: 'Bóng đèn ý tưởng', category: 'tech', url: `${CDN_BASE}/Light%20bulb/3D/light_bulb_3d.png`, tags: ['y tuong', 'idea', 'sang tao', 'den'] },
  { id: 'locked', name: 'Ổ khóa bảo mật', category: 'tech', url: `${CDN_BASE}/Locked/3D/locked_3d.png`, tags: ['khoa', 'lock', 'bao mat', 'security', '2fa'] },

  // ── Viral & Hype ────────────────────────────
  { id: 'fire', name: 'Lửa cháy', category: 'viral', url: `${CDN_BASE}/Fire/3D/fire_3d.png`, tags: ['lua', 'fire', 'hot', 'viral', 'trending'] },
  { id: 'rocket', name: 'Tên lửa', category: 'viral', url: `${CDN_BASE}/Rocket/3D/rocket_3d.png`, tags: ['ten lua', 'rocket', 'launch', 'nhanh'] },
  { id: 'sparkles', name: 'Lấp lánh', category: 'viral', url: `${CDN_BASE}/Sparkles/3D/sparkles_3d.png`, tags: ['lap lanh', 'sparkles', 'magic', 'ai', 'sao'] },
  { id: 'zap', name: 'Tia sét', category: 'viral', url: `${CDN_BASE}/High%20voltage/3D/high_voltage_3d.png`, tags: ['set', 'zap', 'lightning', 'energy', 'dien'] },
  { id: 'collision', name: 'Bùng nổ', category: 'viral', url: `${CDN_BASE}/Collision/3D/collision_3d.png`, tags: ['boom', 'no', 'impact', 'blast'] },
  { id: 'hundred', name: '100 Điểm', category: 'viral', url: `${CDN_BASE}/Hundred%20points/3D/hundred_points_3d.png`, tags: ['100', 'score', 'perfect', 'diem'] },

  // ── Warnings & Tips ─────────────────────────
  { id: 'warning', name: 'Biển cảnh báo', category: 'warnings', url: `${CDN_BASE}/Warning/3D/warning_3d.png`, tags: ['canh bao', 'warning', 'nguy hiem', 'luu y'] },
  { id: 'check', name: 'Dấu tick xanh', category: 'warnings', url: `${CDN_BASE}/Check%20mark%20button/3D/check_mark_button_3d.png`, tags: ['tick', 'check', 'dung', 'dat', 'nen'] },
  { id: 'cross', name: 'Dấu chéo đỏ', category: 'warnings', url: `${CDN_BASE}/Cross%20mark/3D/cross_mark_3d.png`, tags: ['cheo', 'sai', 'cross', 'x', 'cam', 'khong nen'] },
  { id: 'shield', name: 'Khiên bảo vệ', category: 'warnings', url: `${CDN_BASE}/Shield/3D/shield_3d.png`, tags: ['khien', 'shield', 'bao ve', 'an toan'] },

  // ── Story & Faces ───────────────────────────
  { id: 'mind_blown', name: 'Nổ não', category: 'faces', url: `${CDN_BASE}/Exploding%20head/3D/exploding_head_3d.png`, tags: ['no nao', 'mind blown', 'shock', 'kinh ngac'] },
  { id: 'star_struck', name: 'Mắt sao', category: 'faces', url: `${CDN_BASE}/Star-struck/3D/star-struck_3d.png`, tags: ['mat sao', 'star struck', 'wow', 'dinh'] },
  { id: 'cool_sunglasses', name: 'Kính râm ngầu', category: 'faces', url: `${CDN_BASE}/Smiling%20face%20with%20sunglasses/3D/smiling_face_with_sunglasses_3d.png`, tags: ['ngau', 'cool', 'pro', 'uy tin'] },
  { id: 'eyes', name: 'Đôi mắt tò mò', category: 'faces', url: `${CDN_BASE}/Eyes/3D/eyes_3d.png`, tags: ['mat', 'eyes', 'to mo', 'chu y', 'xem'] },
];

function getRelevant3dAssets(style = '', prompt = '') {
  const query = `${style} ${prompt}`.toLowerCase();
  
  let primaryCategory = 'viral';
  if (query.includes('thiền') || query.includes('chữa lành') || query.includes('an nhiên') || query.includes('tâm hồn') || query.includes('chill') || query.includes('asmr')) {
    primaryCategory = 'healing';
  } else if (query.includes('tài chính') || query.includes('kinh doanh') || query.includes('tiền') || query.includes('crypto') || query.includes('bán hàng')) {
    primaryCategory = 'finance';
  } else if (query.includes('công nghệ') || query.includes('ai') || query.includes('code') || query.includes('lập trình') || query.includes('chuyên gia')) {
    primaryCategory = 'tech';
  } else if (query.includes('mẹo') || query.includes('tips') || query.includes('thủ thuật') || query.includes('cảnh báo') || query.includes('sai lầm')) {
    primaryCategory = 'warnings';
  } else if (query.includes('kịch tính') || query.includes('hài hước') || query.includes('meme') || query.includes('kể chuyện')) {
    primaryCategory = 'faces';
  }

  const primaryItems = FLUENT_3D_ASSETS.filter(a => a.category === primaryCategory);
  const otherItems = FLUENT_3D_ASSETS.filter(a => a.category !== primaryCategory && a.tags.some(t => query.includes(t)));

  const combined = [...primaryItems, ...otherItems].slice(0, 6);
  return combined.map(item => ({ name: item.name, url: item.url }));
}

export {
  FLUENT_3D_ASSETS,
  getRelevant3dAssets,
};

