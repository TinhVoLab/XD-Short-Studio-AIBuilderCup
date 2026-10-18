import { SceneElement } from '@/types/scene'

export interface TypographyPreset {
  id: string
  label: string
  badge: string
  mood: string[]                        // Tags cảm xúc/chủ đề — AI dùng để match với nội dung scene
  aiHint: string                        // Hướng dẫn ngắn gọn cho AI: khi nào nên dùng preset này
  elementPatch: Partial<SceneElement>   // Patch trực tiếp vào SceneElement khi click
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'viral-hook',
    label: 'Viral Hook',
    badge: '🔥 NÓNG',
    mood: ['hype', 'hook', 'warning', 'tips'],
    aiHint: 'Dùng cho cảnh mở đầu (hook 3s), cảnh cảnh báo, top tips. Nền tối. Tone ấm neon vàng-chanh nổi bật.',
    elementPatch: {
      fontFamily: 'Be Vietnam Pro',
      fontWeight: 900,
      color: '#BEFF01',
      textTransform: 'uppercase',
      textStroke: '#000000',
      textStrokeWidth: 3,
    },
  },
  {
    id: 'cyber-neon',
    label: 'Cyber Neon',
    badge: '✦ TECH',
    mood: ['tech', 'future', 'mystery', 'ai', 'crypto'],
    aiHint: 'Dùng cho video AI, blockchain, công nghệ tương lai, hacker. Nền tối lạnh. Glow xanh cyan phát sáng.',
    elementPatch: {
      fontFamily: 'Montserrat',
      fontWeight: 800,
      color: '#00D4FF',
      letterSpacing: 2,
      shadowColor: 'rgba(0,212,255,0.75)',
      shadowBlur: 18,
    },
  },
  {
    id: 'luxury-gold',
    label: 'Luxury Gold',
    badge: '👑 SANG',
    mood: ['luxury', 'secret', 'premium', 'finance', 'realestate'],
    aiHint: 'Dùng cho tài chính, bất động sản, lifestyle cao cấp, bí mật top 1%. Gradient vàng kim sang trọng.',
    elementPatch: {
      fontFamily: 'Montserrat',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 3,
      textGradientFrom: '#FFE259',
      textGradientTo: '#FFA751',
      textGradientAngle: 135,
    },
  },
  {
    id: 'dark-boxed',
    label: 'Dark Boxed',
    badge: '📦 BOX',
    mood: ['hook', 'tips', 'highlight', 'cta', 'stat'],
    aiHint: 'Dùng để đóng khung số liệu, từ khoá quan trọng, CTA. Nền đen tạo độ tương phản cực cao trên bất kỳ nền nào.',
    elementPatch: {
      fontFamily: 'Inter',
      fontWeight: 800,
      color: '#BEFF01',
      textBgColor: 'rgba(0,0,0,0.88)',
      textBgPadding: 8,
      textBgRadius: 6,
    },
  },
  {
    id: 'manga-impact',
    label: 'Comic Impact',
    badge: '💥 POP',
    mood: ['hype', 'humor', 'surprise', 'reaction', 'meme', 'action'],
    aiHint: 'Dùng cho video comic, meme, phản ứng kịch tính, hành động. Chữ trắng viền đen 1.5px sắc sảo.',
    elementPatch: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 1,
      textStroke: '#000000',
      textStrokeWidth: 1.5,
    },
  },
  {
    id: 'minimal-clean',
    label: 'Minimal Clean',
    badge: '🌿 ZEN',
    mood: ['healing', 'calm', 'education', 'podcast', 'journal'],
    aiHint: 'Dùng cho nội dung chữa lành, học thuật, podcast, nhật ký. Giãn dòng rộng rãi, font nhẹ, không gây mệt mắt.',
    elementPatch: {
      fontFamily: 'Inter',
      fontWeight: 400,
      color: '#E0E0E0',
      letterSpacing: 1,
      lineHeight: 1.5,
    },
  },
]

/**
 * AI helper: Tìm preset phù hợp nhất theo mood và temporalRole của scene.
 * AI Wizard gọi hàm này khi sinh SceneElement type='text' để chọn đúng phong cách.
 */
export function findTypographyPreset(
  mood: string,
  temporalRole?: string
): TypographyPreset {
  // Hook scenes ưu tiên viral-hook
  if (temporalRole === 'hook') {
    return TYPOGRAPHY_PRESETS.find(p => p.id === 'viral-hook')!
  }
  // CTA scenes ưu tiên dark-boxed
  if (temporalRole === 'cta') {
    return TYPOGRAPHY_PRESETS.find(p => p.id === 'dark-boxed')!
  }
  // Match theo mood tag
  const match = TYPOGRAPHY_PRESETS.find(p => p.mood.includes(mood.toLowerCase()))
  return match ?? TYPOGRAPHY_PRESETS[0] // Fallback: viral-hook
}
