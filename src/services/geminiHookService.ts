import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { useSettingsStore } from '@/store/useSettingsStore';
import { hookStorageService } from './hookStorageService';
import { VisualStyle, PsychArchetype, SFXKeyframeMarker } from '@/types/hookLibraryV2';
import { HookLayoutStyle } from '@/types/scene';
import { DEFAULT_GEMINI_MODEL } from '@/config/aiModels';

export interface GeneratedHookVariantV2 {
  id: string;
  name: string;
  label: string;
  visualStyle: VisualStyle;
  psychArchetype: PsychArchetype;
  layoutStyle: HookLayoutStyle;
  badgeText: string;
  heroTitle: string;
  heroLine2: string;
  highlightWords: string[];
  statValue?: string;
  statLabel?: string;
  subText: string;
  accentColor: string;
  viralScore: number;
  sfxSequence: SFXKeyframeMarker[];
}

export interface GenerationResult {
  variants: GeneratedHookVariantV2[];
  source: 'gemini' | 'cache' | 'offline_fallback';
}

function hashPromptKey(topic: string, style: string): string {
  let h = 0;
  const str = `${topic.trim().toLowerCase()}::${style.trim().toLowerCase()}`;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `hook-cache-${Math.abs(h)}`;
}

// Split text into 2 natural punchy lines for offline heuristic
function splitToTwoLines(text: string, fallbackLead: string = 'BÍ QUYẾT VỀ'): { line1: string; line2: string } {
  const words = text.trim().split(/\s+/);
  if (words.length <= 3) {
    return {
      line1: fallbackLead.toUpperCase(),
      line2: words.join(' ').toUpperCase(),
    };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' ').toUpperCase(),
    line2: words.slice(mid).join(' ').toUpperCase(),
  };
}

// Offline Heuristic Fallback Generator (V1 Engine)
export function generateOfflineFallbackVariants(rawTopic: string): GeneratedHookVariantV2[] {
  const topic = rawTopic.trim();
  const lower = topic.toLowerCase();
  const { line1, line2 } = splitToTwoLines(topic);

  // Variant 1: Hazard / Urgency Strip Highlight
  const variant1: GeneratedHookVariantV2 = {
    id: `v-strip-${Date.now()}-1`,
    name: `Hook Strip: ${topic.slice(0, 24)}`,
    label: 'Phương án 1: Cảnh báo khẩn (Dải Strip)',
    visualStyle: 'hazard',
    psychArchetype: 'fomo_warning',
    layoutStyle: 'kinetic-strip-highlight',
    badgeText: '🚨 CẢNH BÁO QUAN TRỌNG',
    heroTitle: lower.includes('sai lầm') || lower.includes('mất tiền') ? 'LÝ DO KHIẾN BẠN' : line1,
    heroLine2: lower.includes('sai lầm') || lower.includes('mất tiền') ? 'LUÔN BỊ THUA LỖ' : line2,
    highlightWords: [lower.includes('sai lầm') ? 'THUA LỖ' : line2.split(' ')[0] || 'QUAN TRỌNG'],
    subText: 'Xem hết video trước khi quá muộn',
    accentColor: '#FF3B30',
    viralScore: 88,
    sfxSequence: [
      { frame: 0, type: 'sub_drop', volume: 0.9, duckOthers: true },
      { frame: 15, type: 'whoosh', volume: 0.7 },
    ],
  };

  // Variant 2: Curiosity Kinetic Contrast (2-Line Duo)
  const variant2: GeneratedHookVariantV2 = {
    id: `v-contrast-${Date.now()}-2`,
    name: `Hook Contrast: ${topic.slice(0, 24)}`,
    label: 'Phương án 2: Tò mò (Đối lập Size)',
    visualStyle: 'kinetic',
    psychArchetype: 'curiosity_gap',
    layoutStyle: 'kinetic-contrast',
    badgeText: '⚡ BÍ MẬT NGÀNH',
    heroTitle: 'ĐỪNG VỘI LÀM NẾU CHƯA BIẾT',
    heroLine2: line2.length > 0 ? line2 : topic.toUpperCase(),
    highlightWords: [line2.split(' ')[0] || 'BÍ MẬT'],
    subText: 'Áp dụng ngay để thấy sự khác biệt',
    accentColor: '#BEFF01',
    viralScore: 92,
    sfxSequence: [
      { frame: 0, type: 'whoosh', volume: 0.8 },
      { frame: 18, type: 'glitch_hit', volume: 0.75 },
    ],
  };

  // Variant 3: Data / Giant Stat or Solid Box
  const hasNumber = /\d+/.test(topic);
  const numberMatch = topic.match(/\d+(%|k|tr|m)?/i);
  const detectedNumber = numberMatch ? numberMatch[0].toUpperCase() : '87%';

  const variant3: GeneratedHookVariantV2 = hasNumber
    ? {
        id: `v-stat-${Date.now()}-3`,
        name: `Hook Stat: ${topic.slice(0, 24)}`,
        label: 'Phương án 3: Số liệu thực chứng',
        visualStyle: 'kinetic',
        psychArchetype: 'giant_stat',
        layoutStyle: 'kinetic-giant-stat',
        badgeText: '📊 THỐNG KÊ THỰC TẾ',
        heroTitle: 'TỶ LỆ THƯỜNG GẶP',
        statValue: detectedNumber,
        statLabel: 'NGƯỜI MẮC PHẢI ĐIỀU NÀY',
        heroLine2: '',
        highlightWords: [detectedNumber],
        subText: 'Bạn có nằm trong con số trên?',
        accentColor: '#00D4FF',
        viralScore: 95,
        sfxSequence: [
          { frame: 0, type: 'sub_drop', volume: 0.85 },
          { frame: 12, type: 'camera_shutter', volume: 0.8 },
        ],
      }
    : {
        id: `v-box-${Date.now()}-3`,
        name: `Hook Solid: ${topic.slice(0, 24)}`,
        label: 'Phương án 3: Khối chữ xếp tầng',
        visualStyle: 'kinetic',
        psychArchetype: 'speed_hack',
        layoutStyle: 'kinetic-solid-box',
        badgeText: '💡 HƯỚNG DẪN CHI TIẾT',
        heroTitle: 'CÁCH LÀM CHUẨN XÁC',
        heroLine2: topic.toUpperCase(),
        highlightWords: [topic.split(' ')[0] || 'CHUẨN'],
        subText: 'Quy trình thực chiến tinh gọn',
        accentColor: '#FFB800',
        viralScore: 89,
        sfxSequence: [
          { frame: 0, type: 'whoosh', volume: 0.8 },
          { frame: 15, type: 'pop', volume: 0.85 },
        ],
      };

  return [variant1, variant2, variant3];
}

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia hàng đầu về Viral Short-form Video (TikTok/Reels/Shorts). 
Nhiệm vụ: Phân tích chủ đề người dùng nhập và sáng tạo 3 phương án Master Hook 3s đầu cực kỳ cuốn hút, giữ chân người xem cao nhất theo tâm lý học Short-form.
Mỗi phương án phải có:
1. archetype: 'fomo_warning' (cảnh báo mất mát) | 'curiosity_gap' (khoảng trống tò mò) | 'giant_stat' (số liệu) | 'speed_hack' (mẹo nhanh) | 'versus' (đối đầu).
2. layoutStyle: 'kinetic-strip-highlight' | 'kinetic-contrast' | 'kinetic-giant-stat' | 'kinetic-solid-box' | 'hazard-alert' | 'cyber-hud'.
3. visualStyle: 'hazard' | 'kinetic' | 'cyber' | 'zen' | 'versus'.
4. badgeText: ngắn gọn 2-4 từ, chữ in hoa (VD: 'CẢNH BÁO', 'BÍ MẬT', 'THỰC TẾ').
5. heroTitle: dòng 1 ngắn, đanh thép (3-5 từ).
6. heroLine2: dòng 2 nhấn mạnh kết quả hoặc nỗi đau.
7. highlightWords: mảng các từ khoá đắt giá nhất cần phát sáng.
8. statValue & statLabel: nếu có số liệu.
9. subText: câu thúc giục hành động hoặc tò mò.
10. accentColor: mã màu hex neon bắt mắt (VD: #FF3B30, #BEFF01, #00D4FF, #FFB800).
11. viralScore: điểm ước tính từ 80 đến 99.`;

/**
 * Gọi Gemini AI sinh Hook có Structured Output, Caching và Resilience Fallback
 */
export async function generateViralHooks(
  topic: string,
  style: string = 'kinetic',
  timeoutMs: number = 4500
): Promise<GenerationResult> {
  const cleanTopic = topic.trim();
  if (!cleanTopic) {
    return { variants: [], source: 'offline_fallback' };
  }

  // 1. Kiểm tra Cache trước (0ms response)
  const cacheKey = hashPromptKey(cleanTopic, style);
  try {
    const cached = await hookStorageService.getCached(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log('[geminiHookService] Cache hit for:', cacheKey);
      return { variants: cached, source: 'cache' };
    }
  } catch (err) {
    console.warn('[geminiHookService] Cache check error:', err);
  }

  // 2. Kiểm tra API Key
  const apiKey = useSettingsStore.getState().geminiApiKey?.trim();
  if (!apiKey) {
    console.warn('[geminiHookService] No Gemini API key found, fallback to offline heuristic');
    const fallback = generateOfflineFallbackVariants(cleanTopic);
    return { variants: fallback, source: 'offline_fallback' };
  }

  // 3. Gọi Gemini API với Timeout Control
  try {
    const ai = new GoogleGenAI({ apiKey });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_4S')), timeoutMs)
    );

    const callPromise = ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Chủ đề video: "${cleanTopic}". Hãy tạo 3 phương án Master Hook 3s đầu theo phong cách "${style}".` }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        // Chỉ chờ ~4,5 s: Gemini 3 mặc định suy nghĩ mức trung bình, quá giờ là rơi về phương án offline
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    const response = await Promise.race([callPromise, timeoutPromise]) as any;
    const responseText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
    
    if (!responseText) {
      throw new Error('Empty Gemini response');
    }

    const rawJson = JSON.parse(responseText);
    const rawVariants = Array.isArray(rawJson) ? rawJson : (rawJson.variants || rawJson.hooks || [rawJson]);

    const mappedVariants: GeneratedHookVariantV2[] = rawVariants.slice(0, 3).map((item: any, idx: number) => {
      const layoutStyle: HookLayoutStyle = item.layoutStyle || (idx === 0 ? 'kinetic-strip-highlight' : idx === 1 ? 'kinetic-contrast' : 'kinetic-giant-stat');
      const vStyle: VisualStyle = item.visualStyle || (layoutStyle === 'kinetic-strip-highlight' ? 'hazard' : 'kinetic');
      const pArchetype: PsychArchetype = item.archetype || (idx === 0 ? 'fomo_warning' : idx === 1 ? 'curiosity_gap' : 'giant_stat');

      return {
        id: `v-ai-${Date.now()}-${idx + 1}`,
        name: `Hook AI: ${cleanTopic.slice(0, 20)} (${idx + 1})`,
        label: `Phương án ${idx + 1}: ${item.badgeText || (idx === 0 ? 'Cảnh báo' : idx === 1 ? 'Tò mò' : 'Thống kê')}`,
        visualStyle: vStyle,
        psychArchetype: pArchetype,
        layoutStyle,
        badgeText: item.badgeText || '⚡ BÍ MẬT',
        heroTitle: item.heroTitle || cleanTopic.toUpperCase(),
        heroLine2: item.heroLine2 || '',
        highlightWords: Array.isArray(item.highlightWords) ? item.highlightWords : [],
        statValue: item.statValue || undefined,
        statLabel: item.statLabel || undefined,
        subText: item.subText || 'Xem hết video để nhận trọn bộ giải pháp',
        accentColor: item.accentColor || (idx === 0 ? '#FF3B30' : idx === 1 ? '#BEFF01' : '#00D4FF'),
        viralScore: typeof item.viralScore === 'number' ? Math.min(99, Math.max(75, item.viralScore)) : 90 + idx * 3,
        sfxSequence: [
          { frame: 0, type: (idx === 0 ? 'sub_drop' : 'whoosh'), volume: 0.85, duckOthers: true },
          { frame: 15, type: (idx === 0 ? 'glitch_hit' : idx === 1 ? 'pop' : 'camera_shutter'), volume: 0.8 },
        ],
      };
    });

    if (mappedVariants.length === 0) {
      throw new Error('No valid variants parsed from AI');
    }

    // Ghi vào Cache IndexedDB cho các lần sau
    await hookStorageService.setCached(cacheKey, cleanTopic, style, mappedVariants);

    return { variants: mappedVariants, source: 'gemini' };

  } catch (err: any) {
    console.warn('[geminiHookService] Gemini API call failed or timed out:', err?.message || err);
    // Tự động chuyển sang Offline Heuristic Fallback
    const fallback = generateOfflineFallbackVariants(cleanTopic);
    return { variants: fallback, source: 'offline_fallback' };
  }
}
