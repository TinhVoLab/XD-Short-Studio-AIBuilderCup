import { Scene, SceneElement, AudioTrackClip } from '@/types/scene';
import { useEditorStore } from '@/store/useEditorStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { GoogleGenAI } from '@google/genai';
import { generateBatchVoiceovers } from '@/utils/batchAudioGenerator';
import { ParadoxRegistry } from '@/remotion/elements/stem/paradox/ParadoxRegistry';
import { VisualParadoxData, ParadoxCameraMode, ParadoxTimingMode } from '@/remotion/elements/stem/paradox/types';
import { MathDeclarativeSpec } from '@/remotion/elements/stem/paradox/math/mathAstTypes';
import { resolveGeminiModel } from '@/config/aiModels';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParadoxActScript {
  act: number;
  actTitle: string;
  scene?: number;
  sceneTitle?: string;
  beatTag?: 'hook' | 'breakdown' | 'formula' | 'resolution' | 'misconception' | 'comparison';
  voiceover: string;
  targetDuration: number;
  cameraMode: ParadoxCameraMode;
  timingMode: ParadoxTimingMode;
  showHUD: boolean;
  showTrails: boolean;
  showSlipVector: boolean;
  cueKeywords: string[];
  startTau: number;
  endTau: number;
  persistentTrails: boolean;
  showGalileoMode?: boolean;
  galileoSides?: number;
  mathSpec?: MathDeclarativeSpec;
}

export type ParadoxSceneScript = ParadoxActScript;

export interface ParadoxExpanderOptions {
  voiceName?: string;
  durationPerScene?: number;
  onProgress?: (msg: string) => void;
  includeStemSfx?: boolean;
  useGalileoMode?: boolean;
  separateFormulaElement?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STEM Sound FX — Tạo hiệu ứng âm thanh đồng bộ với nhịp phân cảnh
// ─────────────────────────────────────────────────────────────────────────────

export function generateStemSoundFxClips(scenes: Scene[], paradoxId?: string): AudioTrackClip[] {
  const clips: AudioTrackClip[] = [];
  let relSec = 0;

  let detectedId = paradoxId;
  if (!detectedId) {
    for (const sc of scenes) {
      const el = (sc.elements || []).find(e => e.type === 'visual-paradox');
      if (el?.paradoxData?.paradoxId) {
        detectedId = el.paradoxData.paradoxId;
        break;
      }
    }
  }

  const isSorting = detectedId === 'sorting-duel';
  const isTraffic = detectedId === 'phantom-traffic-jam';

  scenes.forEach((sc, idx) => {
    const scDur = sc.duration || 6;

    if (idx === 0) {
      clips.push({
        id: `sfx-stem-intro-${Date.now()}-${idx}`,
        name: isSorting ? 'Xáo trộn mảng (Pop)' : isTraffic ? 'Khởi động luồng xe (Click)' : 'Khởi tạo không gian (Whoosh)',
        url: isSorting ? '/sfx/pop.wav' : '/sfx/whoosh.wav',
        startSec: Number((relSec + 0.5).toFixed(2)),
        duration: 0.4,
        playDurationSec: 0.4,
        trimStartSec: 0,
        volume: 0.55,
        trackId: 'A2',
      });
    } else if (idx === 1) {
      clips.push({
        id: `sfx-stem-whoosh-${Date.now()}-${idx}`,
        name: 'Phóng to điểm nóng (Whoosh)',
        url: '/sfx/whoosh.wav',
        startSec: Number((relSec + 0.1).toFixed(2)),
        duration: 0.8,
        playDurationSec: 0.8,
        trimStartSec: 0,
        volume: 0.75,
        trackId: 'A2',
      });
      clips.push({
        id: `sfx-stem-riser-${Date.now()}-${idx}`,
        name: 'Cao trào (Riser)',
        url: '/sfx/riser.wav',
        startSec: Number((relSec + 1.2).toFixed(2)),
        duration: 1.4,
        playDurationSec: 1.4,
        trimStartSec: 0,
        volume: 0.65,
        trackId: 'A2',
      });
    } else if (idx === scenes.length - 1) {
      clips.push({
        id: `sfx-stem-bell-${Date.now()}-${idx}`,
        name: 'Khai sáng (Bell Chime)',
        url: '/sfx/bell_ding.wav',
        startSec: Number((relSec + 0.6).toFixed(2)),
        duration: 1.2,
        playDurationSec: 1.2,
        trimStartSec: 0,
        volume: 0.7,
        trackId: 'A2',
      });
    } else {
      clips.push({
        id: `sfx-stem-pop-${Date.now()}-${idx}`,
        name: 'Nhịp chuyển (Pop)',
        url: '/sfx/pop.wav',
        startSec: Number((relSec + 0.5).toFixed(2)),
        duration: 0.2,
        playDurationSec: 0.2,
        trimStartSec: 0,
        volume: 0.5,
        trackId: 'A2',
      });
    }

    relSec += scDur;
  });

  return clips;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Voiceover Generator — 1 lần gọi Gemini, sinh lời thoại cho 1 cảnh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sinh lời thoại ngắn gọn (~30–50 từ) cho cảnh đang mở trong Inspector.
 * Nhận paradoxId và topic (chủ đề người dùng đang làm) để sinh lời thoại liên quan.
 */
export async function generateSceneVoiceover(
  paradoxId: string,
  topic?: string,
  currentDuration: number = 7
): Promise<string> {
  const settings = useSettingsStore.getState();
  const plugin = ParadoxRegistry.get(paradoxId);
  const apiKey = settings.geminiApiKey?.trim();
  const model = resolveGeminiModel(settings.preferredScriptModel);

  const minWords = Math.round(currentDuration * 3.0);
  const maxWords = Math.round(currentDuration * 4.5);
  const context = topic?.trim() ? `Chủ đề cụ thể: "${topic}".` : `Chủ đề: ${plugin.name}.`;
  const formulaHint = plugin.latexFormula ? ` Công thức cốt lõi: ${plugin.latexFormula}.` : '';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là biên kịch video khoa học ngắn theo phong cách Veritasium/TikTok.
${context}${formulaHint}

Viết ĐÚNG 1 đoạn lời thoại thuyết minh tiếng Việt tự nhiên, hấp dẫn, trực diện cho video ${currentDuration} giây.
Độ dài: ${minWords}–${maxWords} từ. Không dùng emoji. Không dùng câu sáo rỗng như "Bạn có biết không?".
Kết thúc bằng 1 câu ấn tượng tóm tắt bản chất hiện tượng.
Chỉ trả về đoạn lời thoại, không có tiêu đề hay giải thích thêm.`;

      const res = await ai.models.generateContent({ model, contents: prompt });
      const text = res.text?.trim();
      if (text) return text.replace(/[*"]/g, '');
    } catch (err) {
      console.warn('[generateSceneVoiceover] Gemini error, using fallback:', err);
    }
  }

  // Fallback chuẩn — không hardcode cảnh nào cụ thể
  return `${plugin.name} — ${plugin.description} Hiểu đúng cơ chế này giúp chúng ta nhìn thế giới bằng con mắt toán học chính xác hơn.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Scene Expander — Nhận danh sách acts, tạo các Scene thực tế trên Timeline
// Đây là hàm duy nhất tạo ra chuỗi phân cảnh. Acts được truyền vào từ ngoài
// (ví dụ từ Inspector hoặc bất kỳ UI nào) — không tự sinh kịch bản bên trong.
// ─────────────────────────────────────────────────────────────────────────────

export async function expandToScenes(
  sourceScene: Scene,
  paradoxElement: SceneElement,
  acts: ParadoxActScript[],
  options: ParadoxExpanderOptions = {}
): Promise<{ success: boolean; createdCount: number; error?: string }> {
  const store = useEditorStore.getState();
  const settings = useSettingsStore.getState();
  const paradoxData: VisualParadoxData = paradoxElement.paradoxData || { paradoxId: 'aristotle-wheel' };

  options.onProgress?.(`Đang tạo cấu trúc ${acts.length} phân cảnh trên Timeline...`);

  const newScenes: Scene[] = [];
  const sourceIdx = store.scenes.findIndex(s => s.id === sourceScene.id);
  const baseIdx = sourceIdx !== -1 ? sourceIdx : store.currentSceneIdx;

  acts.forEach((actItem, i) => {
    const sceneId = `scene-paradox-${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 6)}`;
    const isSubsequentAct = i > 0;

    const clonedElements: SceneElement[] = (sourceScene.elements || []).map(el => {
      const newElId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (el.id === paradoxElement.id) {
        return {
          ...el,
          id: newElId,
          title: actItem.actTitle,
          content: actItem.actTitle,
          animPreset: isSubsequentAct ? 'none' : el.animPreset,
          animDuration: isSubsequentAct ? 0 : el.animDuration,
          animDelay: isSubsequentAct ? 0 : el.animDelay,
          paradoxData: {
            ...paradoxData,
            separateFormula: Boolean(options.separateFormulaElement),
            mathSpec: actItem.mathSpec,
            cameraMode: actItem.cameraMode,
            timingMode: actItem.timingMode,
            showHUD: actItem.showHUD,
            showTrails: actItem.showTrails,
            startTau: actItem.startTau,
            endTau: actItem.endTau,
            persistentTrails: actItem.persistentTrails,
            params: {
              ...(paradoxData.params || {}),
              title: actItem.sceneTitle || actItem.actTitle,
              topic: actItem.sceneTitle || actItem.actTitle,
              ...(actItem.mathSpec ? { mathSpec: actItem.mathSpec } : {}),
              ...(actItem.showGalileoMode !== undefined ? { showGalileoMode: actItem.showGalileoMode, galileoSides: actItem.galileoSides || 6 } : {}),
            },
          },
        };
      }

      if (el.type === 'caption') {
        return { ...el, id: newElId, content: actItem.voiceover, wordTimings: undefined };
      }

      return { ...el, id: newElId };
    });

    // Tách công thức thành element độc lập nếu được bật
    if (options.separateFormulaElement) {
      const labelNode = actItem.mathSpec?.nodes?.find((n: any) => n.type === 'label') as any;
      const activePlugin = ParadoxRegistry.get(paradoxData.paradoxId || 'aristotle-wheel');
      const rawFormula = labelNode?.formula || activePlugin.latexFormula;
      const formulaTitle = labelNode?.text || 'Mô hình Toán học';
      if (rawFormula) {
        const formulaEl: SceneElement = {
          id: `el-formula-${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'latex-formula',
          title: formulaTitle,
          content: formulaTitle,
          left: paradoxElement.left ?? 12,
          top: (paradoxElement.top ?? 30) + (paradoxElement.height || 420) + 12,
          width: paradoxElement.width || 336,
          height: 110,
          scaleX: 1, scaleY: 1, angle: 0, opacity: 1,
          latexData: { title: formulaTitle, latex: rawFormula, color: '#BEFF01', displayMode: true },
          animPreset: isSubsequentAct ? 'none' : 'fade',
          animDuration: isSubsequentAct ? 0 : 0.4,
        };
        clonedElements.push(formulaEl);
      }
    }

    newScenes.push({
      ...sourceScene,
      id: sceneId,
      name: `Cảnh ${actItem.scene || actItem.act}: ${actItem.sceneTitle || actItem.actTitle}`,
      description: `Phân cảnh khoa học ${actItem.scene || actItem.act}`,
      duration: actItem.targetDuration,
      voiceoverText: actItem.voiceover,
      voiceoverUrl: undefined,
      voiceoverWordTimings: undefined,
      elements: clonedElements,
    });
  });

  // TTS batch
  let generatedAudioClips: AudioTrackClip[] = [];
  const apiKey = settings.geminiApiKey?.trim() || '';
  try {
    options.onProgress?.('Đang sinh giọng đọc AI (TTS)...');
    const voice = options.voiceName || 'vi-VN-NamMinhNeural';
    const batchRes = await generateBatchVoiceovers(newScenes, voice, apiKey);
    if (batchRes) {
      batchRes.sceneUpdates?.forEach(update => {
        const sc = newScenes.find(s => s.id === update.id);
        if (sc) Object.assign(sc, update.patch);
      });
      if (batchRes.audioClips?.length) generatedAudioClips = batchRes.audioClips;
    }
  } catch (err) {
    console.warn('[expandToScenes] TTS batch error (scenes preserved):', err);
  }

  // STEM SFX
  if (options.includeStemSfx !== false) {
    options.onProgress?.('Đang đồng bộ hiệu ứng âm thanh khoa học (Track A2)...');
    generatedAudioClips = [...generatedAudioClips, ...generateStemSoundFxClips(newScenes)];
  }

  store.insertScenesBatch(
    baseIdx + 1,
    newScenes,
    `Tạo bài giảng ${newScenes.length} phân cảnh khoa học`,
    generatedAudioClips
  );
  store.showToast(`Đã tạo ${newScenes.length} phân cảnh, lồng tiếng AI và đồng bộ Sound FX!`);

  return { success: true, createdCount: newScenes.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compat shim — giữ object export để không break import cũ nếu còn sót
// ─────────────────────────────────────────────────────────────────────────────

export const paradoxStoryExpander = {
  generateSingleSceneVoiceover: (paradoxId: string, duration?: number) =>
    generateSceneVoiceover(paradoxId, undefined, duration),
  expandToScenes,
  generateStemSoundFxClips,
};
