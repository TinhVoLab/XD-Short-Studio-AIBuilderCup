import { KnowledgeGraphData } from '@/types/scene';

export interface KnowledgeGraphPresetItem {
  id: string;
  name: string;
  category: 'edu' | 'history' | 'language' | 'book' | 'tech';
  description: string;
  accentColor: string;
  data: KnowledgeGraphData;
}

export const KNOWLEDGE_GRAPH_PRESETS: KnowledgeGraphPresetItem[] = [
  {
    id: 'menden-genetics',
    name: 'Sinh học 9: 3 Quy luật Men-đen',
    category: 'edu',
    description: 'Quy luật đồng tính, phân li và phân li độc lập',
    accentColor: '#BEFF01',
    data: {
      title: '3 Quy luật di truyền Men-đen',
      layout: 'cascade',
      theme: 'obsidian-dark',
      nodes: [
        { id: 'root', label: 'Di truyền học', subLabel: 'Gregor Mendel', icon: '🌱', tier: 0, color: '#BEFF01' },
        { id: 'n1', label: '1. Đồng tính', subLabel: 'F1 100% Trội', icon: '🧬', tier: 1, color: '#00D4FF', parentId: 'root', insight: 'Khi lai bố mẹ thuần chủng tương phản, F1 đồng hình tính trạng trội.' },
        { id: 'n2', label: '2. Phân li', subLabel: 'Tỉ lệ 3 trội : 1 lặn', icon: '⚖️', tier: 1, color: '#FFB800', parentId: 'root', insight: 'Đến đời F2, các tính trạng phân li theo tỉ lệ trung bình 3 trội 1 lặn.' },
        { id: 'n3', label: '3. Phân li độc lập', subLabel: 'Tỉ lệ 9:3:3:1', icon: '⚡', tier: 1, color: '#BEFF01', parentId: 'root', insight: 'Các cặp alen phân li độc lập tạo ra 4 loại giao tử với tỉ lệ cân bằng.' },
        { id: 'n4', label: 'Đậu Hà Lan', subLabel: 'Đối tượng nghiên cứu', icon: '🫛', tier: 2, color: '#00FF88', parentId: 'n3', insight: 'Đặc tính tự thụ phấn nghiêm ngặt giúp Men-đen thu được kết quả chính xác.' },
      ],
      activeNodeId: 'n3',
      showParticles: true,
      autoBloom: true,
      cameraZoom: true,
      cameraZoomLevel: 1.45,
      heroMorph: true,
      safeZonePlatform: 'tiktok',
      showMiniMap: true,
      loopableEnding: true,
      showGridBackground: true,
    }
  },
  {
    id: 'dien-bien-phu',
    name: 'Lịch sử: Chiến dịch Điện Biên Phủ 1954',
    category: 'history',
    description: '3 đợt tiến công đập tan tập đoàn cứ điểm',
    accentColor: '#FF3366',
    data: {
      title: 'Chiến dịch Điện Biên Phủ 1954',
      layout: 'cascade',
      theme: 'obsidian-dark',
      nodes: [
        { id: 'root', label: 'Điện Biên Phủ', subLabel: '56 Ngày đêm', icon: '🎖️', tier: 0, color: '#FF3366' },
        { id: 'n1', label: 'Đợt 1: Him Lam', subLabel: '13/3 - 17/3', icon: '💥', tier: 1, color: '#FF5544', parentId: 'root', insight: 'Tiêu diệt nhanh cứ điểm Him Lam và Độc Lập, mở toang cánh cửa phía Bắc.' },
        { id: 'n2', label: 'Đợt 2: Đồi A1', subLabel: '30/3 - 30/4', icon: '🛡️', tier: 1, color: '#FFB800', parentId: 'root', insight: 'Giao tranh ác liệt, thắt chặt vòng vây bóp nghẹt sân bay Mường Thanh.' },
        { id: 'n3', label: 'Đợt 3: Toàn thắng', subLabel: '1/5 - 7/5', icon: '🚩', tier: 1, color: '#00FF88', parentId: 'root', insight: 'Tổng công kích tiêu diệt toàn bộ tập đoàn cứ điểm, bắt sống tướng De Castries.' },
        { id: 'n4', label: 'Bộc phá 1 tấn', subLabel: 'Đồi A1 phát nổ', icon: '💣', tier: 2, color: '#BEFF01', parentId: 'n3', insight: 'Tiếng nổ bộc phá đêm 6/5 là hiệu lệnh tổng công kích quyết định thắng lợi.' },
      ],
      activeNodeId: 'n1',
      showParticles: true,
      autoBloom: true,
      cameraZoom: true,
      cameraZoomLevel: 1.45,
      heroMorph: true,
      safeZonePlatform: 'tiktok',
      showMiniMap: true,
      loopableEnding: true,
      showGridBackground: true,
    }
  },
  {
    id: 'ielts-tenses',
    name: 'Tiếng Anh: 4 Nhóm thì cốt lõi',
    category: 'language',
    description: 'Hiện tại, quá khứ, tương lai, hoàn thành',
    accentColor: '#00D4FF',
    data: {
      title: '4 Nhóm thì cốt lõi tiếng Anh',
      layout: 'spine',
      theme: 'obsidian-dark',
      nodes: [
        { id: 'root', label: '12 Thì tiếng Anh', subLabel: 'Tenses Master', icon: '🇬🇧', tier: 0, color: '#00D4FF' },
        { id: 'n1', label: 'Hiện tại đơn', subLabel: 'Present Simple', icon: '⏰', tier: 1, color: '#00D4FF', parentId: 'root', insight: 'Diễn tả thói quen, sự thật hiển nhiên hoặc hành động lặp đi lặp lại.' },
        { id: 'n2', label: 'Quá khứ đơn', subLabel: 'Past Simple', icon: '📜', tier: 1, color: '#FFB800', parentId: 'root', insight: 'Hành động đã bắt đầu và kết thúc hoàn toàn trong quá khứ.' },
        { id: 'n3', label: 'Tương lai đơn', subLabel: 'Will / Going to', icon: '🚀', tier: 1, color: '#00FF88', parentId: 'root', insight: 'Quyết định tức thì hoặc kế hoạch đã được dự định trước.' },
        { id: 'n4', label: 'Hoàn thành', subLabel: 'Have + V3/ed', icon: '⭐', tier: 2, color: '#BEFF01', parentId: 'n1', insight: 'Nhấn mạnh kết quả hoặc sự tiếp diễn từ quá khứ kéo dài đến hiện tại.' },
      ],
      activeNodeId: 'n1',
      showParticles: true,
      autoBloom: true,
      cameraZoom: true,
      cameraZoomLevel: 1.45,
      heroMorph: true,
      safeZonePlatform: 'tiktok',
      showMiniMap: true,
      loopableEnding: true,
      showGridBackground: true,
    }
  },
  {
    id: 'atomic-habits',
    name: 'Atomic Habits: 4 Quy tắc thói quen',
    category: 'book',
    description: 'Rõ ràng, hấp dẫn, dễ dàng, thỏa mãn',
    accentColor: '#BEFF01',
    data: {
      title: '4 Quy luật tạo thói quen (Atomic Habits)',
      layout: 'orbit',
      theme: 'obsidian-dark',
      nodes: [
        { id: 'root', label: 'Atomic Habits', subLabel: 'James Clear', icon: '📖', tier: 0, color: '#BEFF01' },
        { id: 'n1', label: '1. Rõ ràng', subLabel: 'Tạo gợi ý (Cue)', icon: '👁️', tier: 1, color: '#00D4FF', parentId: 'root', insight: 'Gắn thói quen mới với một thời gian và địa điểm cụ thể.' },
        { id: 'n2', label: '2. Hấp dẫn', subLabel: 'Tạo khao khát (Craving)', icon: '🔥', tier: 1, color: '#FFB800', parentId: 'root', insight: 'Kết hợp điều bạn cần làm với điều bạn thích làm (Temptation bundling).' },
        { id: 'n3', label: '3. Dễ dàng', subLabel: 'Hành động nhỏ (Response)', icon: '⚡', tier: 1, color: '#BEFF01', parentId: 'root', insight: 'Quy tắc 2 phút: bắt đầu với hành động mất chưa đầy 120 giây.' },
        { id: 'n4', label: '4. Thỏa mãn', subLabel: 'Thưởng ngay (Reward)', icon: '🎁', tier: 1, color: '#00FF88', parentId: 'root', insight: 'Bộ não ưa thích phần thưởng tức thì để củng cố hành vi lặp lại.' },
      ],
      activeNodeId: 'n3',
      showParticles: true,
      autoBloom: true,
      cameraZoom: true,
      cameraZoomLevel: 1.45,
      heroMorph: true,
      safeZonePlatform: 'tiktok',
      showMiniMap: true,
      loopableEnding: true,
      showGridBackground: true,
    }
  },
];
