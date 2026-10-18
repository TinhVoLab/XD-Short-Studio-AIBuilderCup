import { Scene, SceneElement } from '@/types/scene'
import { API_BASE } from '@/config/api'
import { useEditorStore } from '@/store/useEditorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { ELEMENTS_REGISTRY } from '@/config/elementsRegistry'
import { normalizeMagicFillPayload } from './aiMagicFillNormalizer'
import { hydrateSceneFromSlots } from './ai/sceneSlotHydrator'
import { WIDGET_SLOT_REGISTRY } from './ai/widgetSlotRegistry'
import { SceneSlotEnvelope } from '@/types/aiSlots'
import { DEFAULT_GEMINI_MODEL, normalizeScriptModel, isGeminiModel } from '@/config/aiModels';

export const aiAssistantService = {
  /**
   * 1. Tạo Hook 3s đầu
   * Sinh một câu Hook thông minh bằng AI, chèn thêm 1 scene ở đầu timeline.
   */
  generateHookScene: async (apiKey: string) => {
    const store = useEditorStore.getState()
    const settings = useSettingsStore.getState()
    const topic = store.storyScript || store.projectName || "Sáng tạo nội dung"

    try {
      const res = await fetch(`${API_BASE}/api/ai/hook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          apiKey,
          deepseekApiKey: settings.deepseekApiKey,
          provider: settings.aiEngineMode,
          model: settings.preferredScriptModel,
          aiBannedWords: settings.aiBannedWords,
          aiHumanizerEnabled: settings.aiHumanizerEnabled
        })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      const hookText = data.hook || 'Dừng lại 3 giây để xem cái này!';
      const words = hookText.split(/\s+/);
      
      const p1 = Math.ceil(words.length / 3);
      const p2 = Math.ceil(words.length * 2 / 3);
      
      const chunk1 = words.slice(0, p1).join(' ');
      const chunk2 = words.slice(p1, p2).join(' ');
      const chunk3 = words.slice(p2).join(' ');

      // Tạo Scene mới (3s)
      const newScene: Scene = {
        id: `scene-hook-${Date.now()}`,
        name: `Cảnh Hook (AI)`,
        description: 'Hook 3s đầu (Kinetic)',
        duration: 3,
        bgColor: '#080808',
        elements: [
          {
            id: `el-hook-1-${Date.now()}`,
            type: 'text',
            left: 180,
            top: 220,
            width: 320,
            height: 100,
            content: chunk1,
            color: '#FF5544', // Đỏ
            fontSize: 56,
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 900,
            textAlign: 'center',
            animPreset: 'bounce',
            animDelay: 0,
            animDuration: 0.6,
            shadow: true,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0
          },
          {
            id: `el-hook-2-${Date.now()}`,
            type: 'text',
            left: 180,
            top: 320,
            width: 320,
            height: 100,
            content: chunk2,
            color: '#FFFFFF', // Trắng
            fontSize: 52,
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 900,
            textAlign: 'center',
            animPreset: 'glitch',
            animDelay: 0.8,
            animDuration: 0.5,
            shadow: true,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0
          },
          {
            id: `el-hook-3-${Date.now()}`,
            type: 'text',
            left: 180,
            top: 420,
            width: 320,
            height: 100,
            content: chunk3,
            color: '#BEFF01', // Vàng Neon
            fontSize: 58,
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 900,
            textAlign: 'center',
            animPreset: 'zoom-in',
            animDelay: 1.5,
            animDuration: 0.6,
            shadow: true,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            angle: 0
          }
        ]
      };

      // Thêm scene vào đầu
      store.setScenes([newScene, ...store.scenes]);
      store.showToast('Đã thêm Cảnh Hook thành công!');
    } catch (err: any) {
      console.error(err);
      store.showToast('Lỗi khi tạo Hook: ' + err.message);
    }
  },

  /**
   * 2. Auto Zoom & Pan
   * Gắn keyframes cho các phần tử image để tạo hiệu ứng chuyển động mượt (Ken Burns).
   */
  applyAutoZoomPan: () => {
    const store = useEditorStore.getState()
    const sceneIdx = store.currentSceneIdx
    const currentScene = store.scenes[sceneIdx]
    let modified = false;

    currentScene.elements.forEach(el => {
      if (el.type === 'image' || el.type === 'rect') {
        store.addKeyframe(el.id, { property: 'scale', timePct: 0, value: 1 });
        store.addKeyframe(el.id, { property: 'scale', timePct: 100, value: 1.15 });
        modified = true;
      }
    });

    if (modified) {
      store.showToast('Đã áp dụng Auto Zoom & Pan cho cảnh hiện tại!');
    } else {
      store.showToast('Không tìm thấy hình ảnh nào để tạo hiệu ứng trong cảnh này.');
    }
  },

  /**
   * 3. Thêm Emoji & Sticker tự động
   * Dùng AI đọc text của scene hiện tại và gợi ý Emoji thả vào.
   */
  autoAddEmojis: async (apiKey: string) => {
    const store = useEditorStore.getState()
    const sceneIdx = store.currentSceneIdx
    const currentScene = store.scenes[sceneIdx]
    
    // Thu thập text trong scene
    let textContent = currentScene.voiceoverText || '';
    if (!textContent) {
      textContent = currentScene.elements
        .filter(el => el.type === 'text')
        .map(el => el.content)
        .join(' ');
    }

    if (!textContent.trim()) {
      store.showToast('Cảnh này không có text để phân tích emoji!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ai/emoji`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent, apiKey })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      const emojis = data.emojis || [];
      if (emojis.length === 0) {
        store.showToast('AI không tìm thấy emoji phù hợp.');
        return;
      }

      // Rải emoji ngẫu nhiên xung quanh
      emojis.forEach((emoji: string, i: number) => {
        const randomLeft = 40 + Math.random() * 280;
        const randomTop = 100 + Math.random() * 400;
        
        store.addElement({
          type: 'text',
          left: randomLeft,
          top: randomTop,
          width: 60,
          height: 60,
          content: emoji,
          fontSize: 48,
          animPreset: 'bounce',
          animDelay: 0.2 + (i * 0.1),
          animDuration: 0.5,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          angle: 0
        });
      });

      store.showToast(`Đã thêm ${emojis.length} emoji!`);
    } catch (err: any) {
      console.error(err);
      store.showToast('Lỗi khi thêm emoji: ' + err.message);
    }
  },

  /**
   * 4. Hiệu ứng Viral
   * Quét toàn bộ scenes và áp dụng transition ngẫu nhiên nếu chưa có.
   */
  applyViralEffects: () => {
    const store = useEditorStore.getState()
    const viralTransitions: any[] = ['glitch', 'zoom', 'cube', 'slide', 'blur'];
    let count = 0;

    const newScenes = store.scenes.map((scene, idx) => {
      // Bỏ qua cảnh đầu tiên (không có cảnh trước để chuyển)
      if (idx === 0) return scene;
      
      if (!scene.transition || scene.transition.type === 'crossfade') {
        count++;
        const randomTrans = viralTransitions[Math.floor(Math.random() * viralTransitions.length)];
        return {
          ...scene,
          transition: { type: randomTrans, duration: 0.5 }
        };
      }
      return scene;
    });

    if (count > 0) {
      store.setScenes(newScenes);
      store.showToast(`Đã thêm hiệu ứng viral cho ${count} cảnh!`);
    } else {
      store.showToast(`Tất cả các cảnh đã có hiệu ứng chuyển cảnh đẹp rồi.`);
    }
  },

  /**
   * 5. Tự động tạo caption
   * Tạo caption element cho mỗi scene có voiceoverText.
   * Nhận optional preset để áp dụng style được chọn từ CaptionsPanel.
   */
  autoCaption: (preset?: { accentColor: string; color: string; captionStyle?: string }) => {
    const store = useEditorStore.getState()
    const scenes = JSON.parse(JSON.stringify(store.scenes))
    let captionsAdded = 0;

    const accentColor = preset?.accentColor || '#BEFF01'
    const color = preset?.color || '#FFFFFF'
    const captionStyle = preset?.captionStyle || 'word-highlight'

    scenes.forEach((scene: any) => {
      if (scene.voiceoverText && scene.voiceoverText.trim().length > 0) {
        // Check if scene already has a caption element
        const hasCaption = scene.elements.some((el: any) => el.type === 'caption')
        if (!hasCaption) {
          scene.elements.push({
            id: `caption-${scene.id}`,   // ✅ FIX: Unique per scene, no Date.now() collision
            type: 'caption',
            content: scene.voiceoverText,
            captionStyle,
            left: 180, // center horizontally
            top: 525,  // lower third (cách đáy 115px, tránh đè nội dung trên)
            width: 320,
            height: 100,
            scaleX: 1, scaleY: 1, angle: 0, opacity: 1,
            fontSize: 18,
            fontFamily: 'Be Vietnam Pro',
            fontWeight: 800,
            color,
            accentColor,
            textAlign: 'center',
            wordsPerLine: 4,
          })
          captionsAdded++
        }
      }
    })

    if (captionsAdded > 0) {
      useEditorStore.setState({ scenes })
      store.showToast(`Đã tự động thêm ${captionsAdded} lớp Caption vào các cảnh! Bạn có thể kéo thả để đổi vị trí.`);
    } else {
      store.showToast('Không tìm thấy lời đọc (Voiceover) nào hoặc các cảnh đã có sẵn Caption.');
    }
  },

  /**
   * 6. AI Magic Fill cho Biểu đồ & Khoa học STEM
   * Sinh dữ liệu JSON tự động cho các biểu đồ và phần tử nâng cao
   */
  generateChartDataWithAi: async (params: { 
    elementType: string; 
    elementId: string; 
    customPrompt?: string; 
    includeVoiceover?: boolean;
    onLoadingChange?: (isLoading: boolean) => void;
  }): Promise<{ patch: Record<string, any>; summary: string; rawData: any }> => {
    const store = useEditorStore.getState();
    const settings = useSettingsStore.getState();
    const apiKey = settings.geminiApiKey || '';
    const deepseekApiKey = settings.deepseekApiKey || '';
    
    if (!apiKey && !deepseekApiKey) {
      throw new Error('Vui lòng nhập API Key (Gemini hoặc DeepSeek) trong phần Cài đặt.');
    }

    const { elementType, elementId, customPrompt, includeVoiceover = true, onLoadingChange } = params;
    const currentScene = store.scenes[store.currentSceneIdx];
    
    if (!currentScene) {
      throw new Error('Không tìm thấy cảnh hiện tại.');
    }

    const sceneText = includeVoiceover ? (currentScene.voiceoverText || currentScene.description || '') : '';
    const videoTopic = store.projectName || 'Chủ đề video ngắn';
    const accentColor = store.brandingSettings?.brandColor || '#BEFF01';

    try {
      if (onLoadingChange) onLoadingChange(true);
      
      const res = await fetch(`${API_BASE}/api/ai/chart-fill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType,
          elementId,
          customPrompt,
          sceneText,
          videoTopic,
          accentColor,
          apiKey,
          deepseekApiKey,
          provider: settings.aiEngineMode || 'hybrid',
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 🛡️ Canonical Normalizer & Sanitizer Engine (100% Schema Integrity + Dynamic Box Model)
      const currentElement = currentScene.elements.find(el => el.id === elementId);
      const { patch, summary } = normalizeMagicFillPayload(elementType, data, currentElement);

      return { patch, summary, rawData: data };
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  },

  fillChartDataWithAi: async (params: { 
    elementType: string; 
    elementId: string; 
    customPrompt?: string; 
    includeVoiceover?: boolean;
    onLoadingChange?: (isLoading: boolean) => void;
  }) => {
    const store = useEditorStore.getState();
    try {
      const result = await aiAssistantService.generateChartDataWithAi(params);
      if (result && result.patch) {
        store.updateElement(params.elementId, result.patch);
        store.showToast('✨ AI đã điền dữ liệu thành công!');
      }
    } catch (err: any) {
      console.error('AI Chart Fill Error:', err);
      store.showToast(`❌ Lỗi AI: ${err.message}`);
      throw err;
    }
  },

  /**
   * Helper: Downscale and compress image Base64 to save tokens and latency
   */
  optimizeImageBase64: async (base64Str: string, maxDim: number = 768, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Str);

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (e) => reject(e);
      img.src = base64Str;
    });
  },

  /**
   * 7. AI Visual Inspector
   * Phân tích layout hiện tại bằng DeepSeek V4.1 Flash Vision và tự động sửa lỗi.
   */
  inspectAndAutoFixSceneLayout: async (rawCanvasSnapshotBase64: string) => {
    const store = useEditorStore.getState();
    const settings = useSettingsStore.getState();
    const deepseekApiKey = settings.deepseekApiKey || '';
    
    if (!deepseekApiKey) {
      throw new Error('Vui lòng nhập DeepSeek API Key để sử dụng tính năng Visual Inspector.');
    }

    const currentSceneIdx = store.currentSceneIdx;
    const currentScene = store.scenes[currentSceneIdx];

    if (!currentScene || !rawCanvasSnapshotBase64) {
      throw new Error('Không thể phân tích cảnh hiện tại (thiếu snapshot hoặc scene).');
    }

    try {
      store.showToast('🔍 AI Visual Inspector đang phân tích layout...');
      
      // Optimize image before sending
      const optimizedSnapshot = await aiAssistantService.optimizeImageBase64(rawCanvasSnapshotBase64, 768, 0.6);
      
      const res = await fetch(`${API_BASE}/api/ai/visual-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasSnapshot: optimizedSnapshot,
          currentScene: currentScene.elements,
          deepseekApiKey
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const patches = data.patches || [];
      if (patches.length === 0) {
        store.showToast('✅ Layout hoàn hảo, không cần chỉnh sửa!');
        return;
      }

      let appliedCount = 0;
      // Sanity check and apply patches
      patches.forEach((p: any) => {
        if (!p.elementId || !p.patch) return;
        
        const safePatch: any = {};
        const { left, top, fontSize, color } = p.patch;

        // Sanity Check: Ensure coordinates are within reasonable 360x640 bounds
        if (left !== undefined) {
          safePatch.left = Math.max(-100, Math.min(left, 460)); 
        }
        if (top !== undefined) {
          safePatch.top = Math.max(-50, Math.min(top, 700));
        }
        if (fontSize !== undefined) {
          safePatch.fontSize = Math.max(10, Math.min(fontSize, 120));
        }
        if (color !== undefined) {
          safePatch.color = color;
        }
        
        if (Object.keys(safePatch).length > 0) {
          store.updateElement(p.elementId, safePatch);
          appliedCount++;
        }
      });

      if (appliedCount > 0) {
        store.showToast(`✨ Đã nắn chỉnh layout cho ${appliedCount} phần tử bằng Native Vision!`);
      }
    } catch (err: any) {
      console.error('AI Visual Inspector Error:', err);
      // Fallback mechanism: The app will continue using existing trigonometric logic 
      store.showToast(`❌ Lỗi AI Inspector: ${err.message}. Đã lùi về Fallback an toàn.`);
      throw err;
    }
  },

  /**
   * Bộ phân giải API Key & Model tập trung cho toàn bộ hệ thống
   */
  resolveAiCredentials: (): {
    apiKey: string;
    deepseekApiKey: string;
    aiEngineMode: 'gemini' | 'hybrid' | 'deepseek';
    scriptModel: string;
    isValid: boolean;
    errorMessage?: string;
    actionHint?: string;
  } => {
    const settings = useSettingsStore.getState();
    let key = (settings.geminiApiKey || '').trim();
    let dsKey = (settings.deepseekApiKey || '').replace(/[\s\uFEFF\xA0]/g, '').trim();

    // Tự động nhận diện nếu người dùng dán nhầm key sk- của DeepSeek vào ô Gemini
    if (key.startsWith('sk-') && !dsKey) {
      dsKey = key;
      key = '';
    }

    const aiEngineMode = settings.aiEngineMode || 'hybrid';
    const scriptModel = normalizeScriptModel(settings.preferredScriptModel || 'deepseek-flash');

    const isGeminiExplicit = isGeminiModel(scriptModel);
    const isDeepSeekExplicit = scriptModel.startsWith('deepseek');

    if (!key && !dsKey) {
      return {
        apiKey: '',
        deepseekApiKey: '',
        aiEngineMode,
        scriptModel,
        isValid: false,
        errorMessage: 'Chưa cấu hình API Key AI.',
        actionHint: 'Vui lòng vào Cài đặt để thêm Gemini API Key hoặc DeepSeek API Key.',
      };
    }

    if (isGeminiExplicit && !key) {
      return {
        apiKey: '',
        deepseekApiKey: dsKey,
        aiEngineMode,
        scriptModel,
        isValid: false,
        errorMessage: 'Thiếu Gemini API Key.',
        actionHint: 'Mô hình bạn chọn cần Gemini API Key. Vui lòng thêm key trong Cài đặt hoặc chuyển sang mô hình DeepSeek.',
      };
    }

    if (isDeepSeekExplicit && !dsKey) {
      return {
        apiKey: key,
        deepseekApiKey: '',
        aiEngineMode,
        scriptModel,
        isValid: false,
        errorMessage: 'Thiếu DeepSeek API Key.',
        actionHint: 'Mô hình bạn chọn cần DeepSeek API Key. Vui lòng thêm key trong Cài đặt hoặc chuyển sang mô hình Gemini.',
      };
    }

    return {
      apiKey: key,
      deepseekApiKey: dsKey,
      aiEngineMode,
      scriptModel,
      isValid: true,
    };
  },

  /**
   * Sinh 1 Scene hoàn chỉnh phù hợp ngữ cảnh mạch video cho Timeline.
   * Single Source of Truth: Đồng bộ API Key, Model, Quota, Style và Error Registry.
   */
  generateTimelineScene: async (options: {
    prompt: string;
    prevScene?: Scene;
    nextScene?: Scene;
    targetDuration?: number;
    viralFramework?: string;
    style?: string;
    targetArchetype?: 'general' | 'diagram' | 'chart' | 'bullets' | 'comparison' | 'hook' | 'stem';
    preferredElement?: string;
  }): Promise<Scene> => {
    const editorStore = useEditorStore.getState();
    const settingsStore = useSettingsStore.getState();

    // 1. Pre-flight Validation
    const creds = aiAssistantService.resolveAiCredentials();
    if (!creds.isValid) {
      const err = new Error(creds.errorMessage);
      (err as any).actionHint = creds.actionHint;
      (err as any).code = 'AI_KEY_MISSING';
      throw err;
    }

    const duration = options.targetDuration || 3.5;
    const effectivePrompt = options.prompt.trim() || 'Tạo 1 cảnh sinh động, trực quan phù hợp mạch video';
    const canvasWidth = 360;
    const canvasHeight = 640;
    const accentColor = editorStore.brandingSettings?.brandColor || '#BEFF01';
    const fontFamily = settingsStore.defaultFont || 'Be Vietnam Pro';

    // 2. User Token for Quota Middleware
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (editorStore.firebaseUser) {
      try {
        const token = await editorStore.firebaseUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (authErr) {
        console.warn('[aiAssistantService] Failed to acquire auth token for AI quota:', authErr);
      }
    }

    // 3. Fast-Path: Call TypeSafe Slot Decision API with 8s Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const slotPayload = {
      prompt: effectivePrompt,
      targetArchetype: options.targetArchetype || 'stem',
      preferredElement: options.preferredElement,
      prevScene: options.prevScene ? {
        voiceoverText: options.prevScene.voiceoverText,
        primaryWidgetType: options.prevScene.elements?.[0]?.type,
      } : undefined,
      nextScene: options.nextScene ? {
        voiceoverText: options.nextScene.voiceoverText,
        primaryWidgetType: options.nextScene.elements?.[0]?.type,
      } : undefined,
      apiKey: creds.apiKey,
      deepseekApiKey: creds.deepseekApiKey,
      aiEngineMode: creds.aiEngineMode,
      scriptModel: creds.scriptModel || DEFAULT_GEMINI_MODEL,
    };

    try {
      const res = await fetch(`${API_BASE}/api/ai/scene-slot-decision`, {
        method: 'POST',
        headers,
        body: JSON.stringify(slotPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.envelope) {
          return hydrateSceneFromSlots({
            envelope: data.envelope,
            duration,
            canvasWidth,
            canvasHeight,
            accentColor,
            fontFamily,
          });
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('[aiAssistantService] Slot decision API failed or timed out, executing zero-downtime heuristic hydrator:', err?.message || err);
    }

    // 4. Zero-Downtime Heuristic Fallback (Instant Client-side Hydration)
    // Resolves appropriate widget and extracts heuristic slots from prompt
    const targetType = options.preferredElement || (
      options.targetArchetype === 'diagram' ? 'flowchart' :
      options.targetArchetype === 'chart' ? 'chart-bar' :
      options.targetArchetype === 'comparison' ? 'vs-battle' :
      options.targetArchetype === 'bullets' ? 'highlight-box' :
      options.targetArchetype === 'general' ? 'quote-box' :
      'latex-formula'
    );

    const widgetDef = WIDGET_SLOT_REGISTRY[targetType] || WIDGET_SLOT_REGISTRY['latex-formula'];
    const heuristicSlots = widgetDef.extractHeuristics(effectivePrompt);

    const fallbackEnvelope: SceneSlotEnvelope = {
      archetype: options.targetArchetype || widgetDef.archetype,
      widgetType: widgetDef.type,
      title: effectivePrompt.slice(0, 30),
      voiceoverText: `Để giải quyết vấn đề này, hãy cùng quan sát cấu trúc ${widgetDef.description.slice(0, 30).toLowerCase()}...`,
      slots: heuristicSlots,
    };

    return hydrateSceneFromSlots({
      envelope: fallbackEnvelope,
      duration,
      canvasWidth,
      canvasHeight,
      accentColor,
      fontFamily,
    });
  },
};
