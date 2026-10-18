import { Scene } from '@/types/scene'

// ── Blank scene — dùng khi tạo dự án mới trắng ─────────
export const BLANK_SCENE: Scene = {
  id: 'scene-0',
  name: 'Cảnh 1',
  description: '',
  duration: 5,
  paletteId: 'neon-night',
  bgColor: '#080a0f',
  elements: [],
  hudHeader: '-- XD-SHORT . 2026 --',
  hudFooterLeft: '',
  hudFooterRight: '',
  authorName: '',
  svgContent: '',
  temporalRole: 'hook',
  progressBar: { enabled: false, position: 'bottom', style: 'solid' },
  viralEffects: { vignettePulse: false, accentBreathe: false, microParticles: false },
}

// ── Default scene data (giữ nguyên để fallback load project cũ) ──
export const DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene-0',
    name: 'Hook',
    description: 'Câu hỏi gây tò mò',
    duration: 4,
    paletteId: 'neon-night',
    bgColor: '#0E200E',
    elements: [
      { id: 'el-1', type: 'badge', left: 180, top: 70, width: 100, height: 26, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, bgColor: '#BEFF01', content: '#1 HOOK', color: '#000', radius: 13, fontSize: 11, fontWeight: 900, animPreset: 'zoom-in', animDelay: 0.0, animDuration: 0.4 },
      { id: 'el-2', type: 'text', left: 180, top: 150, width: 200, height: 100, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: '10', fontSize: 96, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'center', shadow: true, animPreset: 'zoom-in', animDelay: 0.2, animDuration: 0.5 },
      { id: 'el-3', type: 'text', left: 180, top: 270, width: 260, height: 40, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'MẸO SEO', fontSize: 34, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'center', animPreset: 'slide-up', animDelay: 0.4, animDuration: 0.5 },
      { id: 'el-4', type: 'text', left: 180, top: 350, width: 312, height: 60, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'GIÚP TĂNG TRAFFIC\nWEBSITE NHANH CHÓNG', fontSize: 18, fontFamily: 'Inter', fontWeight: 700, color: '#fff', textAlign: 'center', animPreset: 'fade-in', animDelay: 0.6, animDuration: 0.5 },
      { id: 'el-5', type: 'text', left: 180, top: 430, width: 312, height: 30, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.75, content: 'Áp dụng ngay hôm nay!', fontSize: 14, fontFamily: 'Inter', fontWeight: 400, color: '#fff', textAlign: 'center', animPreset: 'fade-in', animDelay: 0.9, animDuration: 0.4 }
    ],
    hudHeader: '-- XD-SHORT . 2026 --',
    hudFooterLeft: 'TIPS & TRICKS',
    hudFooterRight: '@xdshort.official',
    authorName: 'XD-Short',
    svgContent: '',
    transition: { type: 'slide', duration: 0.5 },
    temporalRole: 'hook',
    progressBar: { enabled: true, position: 'bottom', style: 'neon-pulse' },
    viralEffects: { vignettePulse: true, accentBreathe: true, microParticles: false },
  },
  {
    id: 'scene-1',
    name: 'Mẹo #1',
    description: 'Nghiên cứu từ khóa đúng cách',
    duration: 7,
    paletteId: 'neon-night',
    bgColor: '#080a0f',
    bgPattern: 'grid',
    elements: [
      { id: 's1-el1', type: 'text', left: 24, top: 72, width: 100, height: 20, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.8, content: '01 / 10', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, color: '#BEFF01', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.1, animDuration: 0.4 },
      { id: 's1-el2', type: 'text', left: 24, top: 95, width: 260, height: 55, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'MẸO #1', fontSize: 48, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.2, animDuration: 0.5 },
      { id: 's1-el3', type: 'divider', left: 180, top: 155, width: 312, height: 2, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.5, accentColor: '#BEFF01', animPreset: 'fade-in', animDelay: 0.35, animDuration: 0.4 },
      { id: 's1-el4', type: 'text', left: 24, top: 175, width: 312, height: 60, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'Nghiên cứu từ khóa\nđúng cách', fontSize: 24, fontFamily: 'Inter', fontWeight: 700, color: '#fff', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.5, animDuration: 0.5 },
      { id: 's1-el5', type: 'highlight-box', left: 180, top: 310, width: 312, height: 125, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, bgColor: 'rgba(190,255,1,0.06)', accentColor: '#BEFF01', radius: 12, content: '• Dùng Google Keyword Planner\n• Tìm từ khóa long-tail từ người dùng\n• Phân tích từ khóa đối thủ cạnh tranh', fontSize: 13, color: '#fff', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.75, animDuration: 0.5 }
    ],
    hudHeader: '-- MẸO SEO TOP #1 --',
    hudFooterLeft: 'SEO STRATEGY',
    hudFooterRight: '@xdshort.official',
    authorName: 'XD-Short',
    svgContent: '',
    transition: { type: 'crossfade', duration: 0.5 },
    temporalRole: 'normal',
    progressBar: { enabled: true, position: 'bottom', style: 'neon-pulse' },
    viralEffects: { vignettePulse: true, accentBreathe: true, microParticles: false },
  },
  {
    id: 'scene-2',
    name: 'Mẹo #2',
    description: 'Tối ưu Onpage chuẩn SEO',
    duration: 7,
    bgColor: '#080808',
    elements: [
      { id: 's2-el1', type: 'text', left: 24, top: 72, width: 100, height: 20, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.8, content: '02 / 10', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, color: '#BEFF01', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.1, animDuration: 0.4 },
      { id: 's2-el2', type: 'text', left: 24, top: 95, width: 260, height: 55, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'MẸO #2', fontSize: 48, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.2, animDuration: 0.5 },
      { id: 's2-el3', type: 'divider', left: 180, top: 155, width: 312, height: 2, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.5, accentColor: '#BEFF01', animPreset: 'fade-in', animDelay: 0.35, animDuration: 0.4 },
      { id: 's2-el4', type: 'text', left: 24, top: 175, width: 312, height: 60, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'Tối ưu Onpage\nchuẩn SEO', fontSize: 24, fontFamily: 'Inter', fontWeight: 700, color: '#fff', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.5, animDuration: 0.5 },
      { id: 's2-el5', type: 'highlight-box', left: 180, top: 310, width: 312, height: 125, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, bgColor: 'rgba(190,255,1,0.06)', accentColor: '#BEFF01', radius: 12, content: '• Title tag dưới 60 ký tự chuẩn SEO\n• Meta description hấp dẫn gây kích thích\n• URL ngắn gọn và chứa từ khóa chính', fontSize: 13, color: '#fff', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.75, animDuration: 0.5 }
    ],
    hudHeader: '-- MẸO SEO TOP #2 --',
    hudFooterLeft: 'SEO STRATEGY',
    hudFooterRight: '@xdshort.official',
    authorName: 'XD-Short',
    svgContent: '',
    transition: { type: 'flip', duration: 0.5 },
    temporalRole: 'normal',
    progressBar: { enabled: true, position: 'bottom', style: 'neon-pulse' },
    viralEffects: { vignettePulse: true, accentBreathe: true, microParticles: false },
  },
  {
    id: 'scene-3',
    name: 'Mẹo #3',
    description: 'Tạo nội dung chất lượng',
    duration: 7,
    bgColor: '#060606',
    elements: [
      { id: 's3-el1', type: 'text', left: 24, top: 72, width: 100, height: 20, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.8, content: '03 / 10', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, color: '#BEFF01', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.1, animDuration: 0.4 },
      { id: 's3-el2', type: 'text', left: 24, top: 95, width: 260, height: 55, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'MẸO #3', fontSize: 48, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.2, animDuration: 0.5 },
      { id: 's3-el3', type: 'divider', left: 180, top: 155, width: 312, height: 2, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.5, accentColor: '#BEFF01', animPreset: 'fade-in', animDelay: 0.35, animDuration: 0.4 },
      { id: 's3-el4', type: 'text', left: 24, top: 175, width: 312, height: 60, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'Nội dung\nchất lượng cao', fontSize: 24, fontFamily: 'Inter', fontWeight: 700, color: '#fff', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.5, animDuration: 0.5 },
      { id: 's3-el5', type: 'highlight-box', left: 180, top: 310, width: 312, height: 125, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, bgColor: 'rgba(190,255,1,0.06)', accentColor: '#BEFF01', radius: 12, content: '• Tập trung giải quyết nỗi đau người đọc\n• Bài viết chuyên sâu và độc đáo\n• Đính kèm hình ảnh & Infographic trực quan', fontSize: 13, color: '#fff', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.75, animDuration: 0.5 }
    ],
    hudHeader: '-- MẸO SEO TOP #3 --',
    hudFooterLeft: 'SEO STRATEGY',
    hudFooterRight: '@xdshort.official',
    authorName: 'XD-Short',
    svgContent: '',
    transition: { type: 'wipe', duration: 0.5 },
    temporalRole: 'highlight',
    progressBar: { enabled: true, position: 'bottom', style: 'neon-pulse' },
    viralEffects: { vignettePulse: true, accentBreathe: true, microParticles: false },
  },
  {
    id: 'scene-4',
    name: 'Mẹo #4',
    description: 'Xây dựng liên kết chất lượng',
    duration: 7,
    bgColor: '#080808',
    elements: [
      { id: 's4-el1', type: 'text', left: 24, top: 72, width: 100, height: 20, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.8, content: '04 / 10', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, color: '#BEFF01', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.1, animDuration: 0.4 },
      { id: 's4-el2', type: 'text', left: 24, top: 95, width: 260, height: 55, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'MẸO #4', fontSize: 48, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.2, animDuration: 0.5 },
      { id: 's4-el3', type: 'divider', left: 180, top: 155, width: 312, height: 2, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.5, accentColor: '#BEFF01', animPreset: 'fade-in', animDelay: 0.35, animDuration: 0.4 },
      { id: 's4-el4', type: 'text', left: 24, top: 175, width: 312, height: 60, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'Xây dựng\nliên kết chất lượng', fontSize: 24, fontFamily: 'Inter', fontWeight: 700, color: '#fff', textAlign: 'left', animPreset: 'slide-up', animDelay: 0.5, animDuration: 0.5 },
      { id: 's4-el5', type: 'highlight-box', left: 180, top: 310, width: 312, height: 125, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, bgColor: 'rgba(190,255,1,0.06)', accentColor: '#BEFF01', radius: 12, content: '• Viết Guest Post trên các trang uy tín\n• Cấu trúc Internal Link chặt chẽ\n• Tuyệt đối tránh các hình thức Link Spam', fontSize: 13, color: '#fff', textAlign: 'left', animPreset: 'fade-in', animDelay: 0.75, animDuration: 0.5 }
    ],
    hudHeader: '-- MẸO SEO TOP #4 --',
    hudFooterLeft: 'SEO STRATEGY',
    hudFooterRight: '@xdshort.official',
    authorName: 'XD-Short',
    svgContent: '',
    transition: { type: 'slide', duration: 0.5 },
    temporalRole: 'normal',
    progressBar: { enabled: true, position: 'bottom', style: 'neon-pulse' },
    viralEffects: { vignettePulse: true, accentBreathe: true, microParticles: false },
  },
  {
    id: 'scene-5',
    name: 'CTA',
    description: 'Kêu gọi hành động',
    duration: 5,
    bgColor: '#0E200E',
    elements: [
      { id: 's5-el1', type: 'text', left: 180, top: 80, width: 240, height: 30, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.85, content: '─── BẮT ĐẦU NGAY ───', fontSize: 12, fontFamily: 'Inter', fontWeight: 700, color: '#BEFF01', textAlign: 'center', animPreset: 'fade-in', animDelay: 0.1, animDuration: 0.4 },
      { id: 's5-el2', type: 'text', left: 180, top: 130, width: 312, height: 80, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'TỐI ƯU HÓA', fontSize: 40, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#fff', textAlign: 'center', animPreset: 'slide-up', animDelay: 0.25, animDuration: 0.5 },
      { id: 's5-el3', type: 'text', left: 180, top: 220, width: 312, height: 100, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: 'SEO', fontSize: 84, fontFamily: 'Be Vietnam Pro', fontWeight: 900, color: '#BEFF01', textAlign: 'center', shadow: true, animPreset: 'zoom-in', animDelay: 0.4, animDuration: 0.6 },
      { id: 's5-el4', type: 'text', left: 180, top: 330, width: 260, height: 40, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.9, content: 'HÔM NAY!', fontSize: 22, fontFamily: 'Inter', fontWeight: 700, color: '#fff', textAlign: 'center', animPreset: 'slide-up', animDelay: 0.65, animDuration: 0.5 },
      { id: 's5-el5', type: 'divider', left: 180, top: 385, width: 200, height: 2, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.6, accentColor: '#BEFF01', animPreset: 'fade-in', animDelay: 0.8, animDuration: 0.4 },
      { id: 's5-el6', type: 'text', left: 180, top: 405, width: 312, height: 30, scaleX: 1, scaleY: 1, angle: 0, opacity: 0.85, content: '👆 Nhấn Follow để nhận thêm nhiều bí quyết!', fontSize: 12, fontFamily: 'Inter', fontWeight: 500, color: '#fff', textAlign: 'center', animPreset: 'fade-in', animDelay: 0.95, animDuration: 0.4 }
    ],
    hudHeader: '-- KẾT LUẬN & HÀNH ĐỘNG --',
    hudFooterLeft: 'CALL TO ACTION',
    hudFooterRight: '@xdshort.official',
    authorName: 'XD-Short',
    svgContent: '',
    temporalRole: 'cta',
    progressBar: { enabled: true, position: 'bottom', style: 'neon-pulse' },
    viralEffects: { vignettePulse: true, accentBreathe: true, microParticles: false },
  },
]

export const SCENE_DURATIONS = DEFAULT_SCENES.map(s => s.duration)
export const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0)
export const SCENE_START_TIMES = SCENE_DURATIONS.reduce<number[]>((acc, dur, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENE_DURATIONS[i - 1])
  return acc
}, [])

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1).padStart(4, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}

export function getSceneAtTime(sec: number): number {
  for (let i = SCENE_START_TIMES.length - 1; i >= 0; i--) {
    if (sec >= SCENE_START_TIMES[i]) return i
  }
  return 0
}
