import { Scene, SceneElement, AudioTrackClip } from '@/types/scene';
import { useEditorStore } from '@/store/useEditorStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { GoogleGenAI } from '@google/genai';
import { generateBatchVoiceovers } from '@/utils/batchAudioGenerator';
import { resolveGeminiModel } from '@/config/aiModels';

export interface BranchScriptItem {
  branchId: string;
  branchLabel: string;
  voiceover: string;
  duration: number;
}

export interface BranchExpanderOptions {
  voiceName?: string;
  durationPerScene?: number;
  addOutro?: boolean;
  onProgress?: (msg: string) => void;
}

export const knowledgeGraphBranchExpander = {
  /**
   * Tách các nhánh của Cây Tri Thức thành chuỗi phân cảnh tiếp theo trên Timeline
   */
  expandToScenes: async (
    sourceScene: Scene,
    graphElement: SceneElement,
    options: BranchExpanderOptions = {}
  ): Promise<{ success: boolean; createdCount: number; error?: string }> => {
    const store = useEditorStore.getState();
    const settings = useSettingsStore.getState();
    const graphData = graphElement.knowledgeGraphData;

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return { success: false, createdCount: 0, error: 'Sơ đồ chưa có dữ liệu nút hợp lệ.' };
    }

    // 1. Lọc danh sách các nhánh cần làm sâu (Ưu tiên Tier 1, hoặc tất cả node con)
    const rootNode = graphData.nodes.find(n => n.tier === 0) || graphData.nodes[0];
    const rawBranches = graphData.nodes.filter(n => n.id !== rootNode.id);
    const tier1Branches = rawBranches.filter(n => n.tier === 1);
    const targetBranches = tier1Branches.length > 0 ? tier1Branches : rawBranches;

    if (targetBranches.length === 0) {
      return { success: false, createdCount: 0, error: 'Cây tri thức cần có ít nhất 1 nhánh con để tách phân cảnh.' };
    }

    options.onProgress?.('Đang phân tích các nhánh kiến thức...');

    // 2. Tạo kịch bản lời thoại (Voiceover Scripts) cho từng nhánh
    const scripts: BranchScriptItem[] = [];
    const apiKey = settings.geminiApiKey;
    const targetDur = options.durationPerScene || 8;
    const minWords = Math.round(targetDur * 3.2);
    const maxWords = Math.round(targetDur * 4.4);

    // Model Gemini người dùng chọn trong Cài đặt; DeepSeek hoặc model đã ngừng → Gemini mặc định (config/aiModels)
    const scriptModel = resolveGeminiModel(settings.preferredScriptModel);

    let geminiGenerated = false;

    if (apiKey) {
      try {
        options.onProgress?.(`AI (${scriptModel}) đang viết lời dẫn thuyết minh từng nhánh...`);
        const ai = new GoogleGenAI({ apiKey });
        
        const branchContext = targetBranches.map((b, i) => 
          `Nhánh ${i + 1} (id: "${b.id}", tên: "${b.label}", nhãn phụ: "${b.subLabel || ''}", tóm tắt: "${b.insight || ''}")`
        ).join('\n');

        const prompt = `Bạn là biên kịch video ngắn giáo dục/edutainment hàng đầu trên TikTok/Reels/Shorts.
Chủ đề tổng quan: "${graphData.title || rootNode.label}".
Chúng tôi có một Cây Tri Thức (Knowledge Graph) gồm các nhánh sau:
${branchContext}

Nhiệm vụ: Viết lời dẫn thoại thuyết minh (voiceover script) cho từng nhánh một cách mạch lạc, liền mạch và lôi cuốn:
- Mỗi nhánh là 1 cảnh riêng (khoảng ${targetDur} giây, tương đương ${minWords} - ${maxWords} từ tiếng Việt).
- Giọng văn: Giàu tính giáo dục, gãy gọn, nhấn mạnh từ khóa trọng tâm, nối ý tự nhiên (ví dụ: "Quy luật đầu tiên là...", "Tiếp theo là...", "Và then chốt nhất là...").
- KHÔNG dùng emoji hay ký tự đặc biệt trong lời thoại.

Trả về DUY NHẤT một mảng JSON hợp lệ theo định dạng:
[
  {
    "branchId": "id_nhánh",
    "voiceover": "lời dẫn thoại tiếng Việt chuẩn..."
  }
]`;

        const res = await ai.models.generateContent({
          model: scriptModel,
          contents: prompt,
        });

        const rawText = res.text?.trim() || '';
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              const matchedBranch = targetBranches.find(b => b.id === item.branchId);
              if (matchedBranch && item.voiceover) {
                scripts.push({
                  branchId: matchedBranch.id,
                  branchLabel: matchedBranch.label,
                  voiceover: item.voiceover.trim(),
                  duration: targetDur,
                });
              }
            });
            geminiGenerated = scripts.length === targetBranches.length;
          }
        }
      } catch (err) {
        console.warn('[BranchExpander] Gemini API error, falling back to smart heuristic:', err);
      }
    }

    // Heuristic Fallback nếu không có API key hoặc lỗi mạng
    if (!geminiGenerated) {
      options.onProgress?.('Khởi tạo kịch bản tối ưu theo cấu trúc tri thức...');
      targetBranches.forEach((b, idx) => {
        const orderWord = idx === 0 ? 'Đầu tiên' : (idx === targetBranches.length - 1 ? 'Cuối cùng' : 'Tiếp theo');
        const desc = b.insight || b.subLabel || `tìm hiểu sâu hơn về ${b.label}`;
        scripts.push({
          branchId: b.id,
          branchLabel: b.label,
          voiceover: `${orderWord}, chúng ta cùng khám phá ${b.label}. ${desc}. Đây là luận điểm then chốt bạn cần ghi nhớ.`,
          duration: targetDur,
        });
      });
    }

    // 3. Nhân bản và cấu hình các Phân cảnh mới (Scenes)
    options.onProgress?.('Đang tạo các phân cảnh trên Timeline...');
    const newScenes: Scene[] = [];
    const sourceIdx = store.scenes.findIndex(s => s.id === sourceScene.id);
    const baseIdx = sourceIdx !== -1 ? sourceIdx : store.currentSceneIdx;

    scripts.forEach((item, i) => {
      const sceneId = `scene-${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 6)}`;
      
      // Clone elements và gán activeNodeId cho Cây Tri Thức
      const clonedElements: SceneElement[] = (sourceScene.elements || []).map(el => {
        const newElId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        if (el.id === graphElement.id) {
          return {
            ...el,
            id: newElId,
            knowledgeGraphData: {
              ...graphData,
              activeNodeId: item.branchId, // Spotlight vào đúng nhánh này
            },
          };
        }
        return { ...el, id: newElId };
      });

      const newScene: Scene = {
        ...sourceScene,
        id: sceneId,
        name: `Cảnh ${baseIdx + i + 2}: ${item.branchLabel}`,
        description: `Phân tích sâu nhánh ${item.branchLabel}`,
        duration: item.duration,
        voiceoverText: item.voiceover,
        voiceoverUrl: undefined, // Sẽ được cập nhật nếu render TTS
        elements: clonedElements,
      };

      newScenes.push(newScene);
    });

    // Cảnh Tổng kết Outro (Tùy chọn)
    if (options.addOutro) {
      const outroSceneId = `scene-${Date.now()}-outro-${Math.random().toString(36).slice(2, 6)}`;
      const outroElements: SceneElement[] = (sourceScene.elements || []).map(el => {
        const newElId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        if (el.id === graphElement.id) {
          return {
            ...el,
            id: newElId,
            knowledgeGraphData: {
              ...graphData,
              activeNodeId: null, // Gán null rõ ràng: Zoom out toàn cảnh tổng quan
              badgeText: 'Tổng kết toàn cảnh',
              cameraZoom: false, // Giữ camera toàn cảnh tĩnh, không bị lệch vào nhánh nào
            },
          };
        }
        return { ...el, id: newElId };
      });

      newScenes.push({
        ...sourceScene,
        id: outroSceneId,
        name: `Cảnh ${baseIdx + newScenes.length + 1}: Tổng kết`,
        description: 'Tóm tắt toàn bộ cây tri thức',
        duration: Math.max(5, Math.round((options.durationPerScene || 8) * 0.75)),
        voiceoverText: `Đó là toàn bộ sơ đồ tri thức về ${graphData.title || rootNode.label}. Đừng quên lưu video lại để ôn tập nhé!`,
        voiceoverUrl: undefined,
        elements: outroElements,
      });
    }

    // 4. Tạo giọng đọc AI thuyết minh (TTS) cho các phân cảnh mới
    let generatedAudioClips: AudioTrackClip[] = [];
    try {
      options.onProgress?.('Đang tạo giọng đọc AI thuyết minh (TTS)...');
      const voice = options.voiceName || 'vi-VN-NamMinhNeural';
      const batchRes = await generateBatchVoiceovers(newScenes, voice, apiKey || '');
      
      if (batchRes) {
        if (batchRes.sceneUpdates && batchRes.sceneUpdates.length > 0) {
          batchRes.sceneUpdates.forEach(update => {
            const sc = newScenes.find(s => s.id === update.id);
            if (sc) {
              Object.assign(sc, update.patch);
            }
          });
        }
        if (batchRes.audioClips && batchRes.audioClips.length > 0) {
          generatedAudioClips = batchRes.audioClips;
        }
      }
    } catch (ttsErr) {
      console.warn('[BranchExpander] Batch TTS notice (scenes still preserved with voiceover text):', ttsErr);
    }

    // 5. Chèn các phân cảnh mới vào Timeline Store kèm audio clips
    store.insertScenesBatch(
      baseIdx + 1,
      newScenes,
      `Tách Cây Tri Thức thành ${newScenes.length} cảnh tiếp theo`,
      generatedAudioClips
    );

    if (generatedAudioClips.length > 0) {
      store.showToast(`Đã tự động tạo ${newScenes.length} cảnh và đồng bộ ${generatedAudioClips.length} đoạn lồng tiếng trên Timeline!`);
    } else {
      store.showToast(`Đã tự động tạo ${newScenes.length} phân cảnh tiếp theo từ Cây Tri Thức!`);
    }
    return { success: true, createdCount: newScenes.length };
  },
};
