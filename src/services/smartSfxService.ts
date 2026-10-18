import { Scene, AudioTrackClip } from '@/types/scene';
import { SFX_DURATIONS, SFX_ALIAS_MAP } from '@/components/AiWizardModal/config/wizardCatalog';
import { WIDGET_SLOT_REGISTRY } from '@/services/ai/widgetSlotRegistry';
import { getSceneWordTimeline, resolveElementWordAnchors } from '@/utils/wordTimeline';
import { getSceneTransition } from '@/utils/sceneTiming';
import { isPeakScene } from '@/config/sceneRoles';

const TRANSITION_SFX: Record<string, string> = {
  glitch: 'glitch',
  'zoom-blur': 'fast_woosh',
  'whip-pan': 'whip',
  slide: 'swoosh',
  wipe: 'swoosh',
};

export interface SmartSfxOptions {
  volume?: number;
  trackId?: string;
  minDistanceSec?: number;
  includeSceneSfx?: boolean;
}

/**
 * Smart SFX Foley Placement Engine (TypeSafe Jev & SSOT)
 *
 * Automatically resolves audio effects onto Track A2 using a 3-Layer Foley Resolver:
 * - Layer 1: Scene-level explicit intent (scene.soundEffects from AI / Hydrator)
 * - Layer 2: Registry-level SSOT fallback (WIDGET_SLOT_REGISTRY[el.type]?.sfxDefault)
 * - Layer 3: Cinematic Entrance & Cut Triggers (Hook Boom, Transition Whoosh, Anti-Crowding)
 */
export const smartSfxService = {
  generateClipsForScenes: (scenes: Scene[], options: SmartSfxOptions = {}): AudioTrackClip[] => {
    const defaultVolume = options.volume ?? 0.72;
    const trackId = options.trackId || 'A2';
    const minDistanceSec = options.minDistanceSec ?? 0.25;
    const includeSceneSfx = options.includeSceneSfx ?? true;

    const clips: AudioTrackClip[] = [];
    let currentSceneStartSec = 0;
    let lastPlacedTimeSec = -1;

    const resolveSfxType = (rawType: string): string => {
      const type = (rawType || 'pop').toLowerCase().trim();
      return SFX_DURATIONS[type] ? type : (SFX_ALIAS_MAP[type] || 'pop');
    };
    const tryAddSfx = (rawType: string, exactSec: number, nameDesc: string, customVol?: number) => {
      const resolvedType = resolveSfxType(rawType);
      const duration = SFX_DURATIONS[resolvedType] || 0.45;
      // Frame-Quantum Lock: Lượng tử hóa mốc thời gian sang bội số nguyên của 1/30s (30 FPS)
      const cleanSec = Math.max(0, Math.round(exactSec * 30) / 30);

      // Chống rác âm thanh (Anti-Crowding Guard)
      if (lastPlacedTimeSec >= 0 && Math.abs(cleanSec - lastPlacedTimeSec) < minDistanceSec) {
        return;
      }

      clips.push({
        id: `sfx-smart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: `SFX: ${resolvedType.toUpperCase()} · ${nameDesc}`,
        url: `/sfx/${resolvedType}.wav`,
        startSec: cleanSec,
        duration,
        playDurationSec: duration,
        volume: customVol ?? defaultVolume,
        trackId,
      });

      lastPlacedTimeSec = cleanSec;
    };

    scenes.forEach((scene, sceneIdx) => {
      const sceneDur = scene.duration || 3.0;
      const wordTimeline = getSceneWordTimeline(scene);

      // ── TẦNG 1: Scene-level Intent (Nếu scene đã có soundEffects định sẵn) ──
      let hasSceneExplicitSfx = false;
      if (includeSceneSfx && scene.soundEffects && Array.isArray(scene.soundEffects) && scene.soundEffects.length > 0) {
        scene.soundEffects.forEach(sfx => {
          if (!sfx || !sfx.type) return;
          const offset = sfx.delaySec ?? (sfx as any).startTime ?? 0.1;
          const sfxTime = currentSceneStartSec + offset;
          tryAddSfx(
            sfx.type,
            sfxTime,
            `Kịch bản (${scene.name || `Cảnh ${sceneIdx + 1}`})`,
            sfx.volume ?? defaultVolume
          );
          hasSceneExplicitSfx = true;
        });
      }

      // ── TẦNG 2: Registry-level SSOT Fallback (Mutual Exclusion: chỉ chạy khi Tầng 1 trống) ──
      if (!hasSceneExplicitSfx && scene.elements && Array.isArray(scene.elements)) {
        scene.elements.forEach(el => {
          // Cùng nguồn với SceneRenderer: element neo theo từ thì SFX cũng phát đúng lúc đó
          const delaySec = resolveElementWordAnchors(el, wordTimeline).animDelay ?? (el.animDelay || 0.1);
          const eventTime = currentSceneStartSec + delaySec;

          // 2.1. SFX chỉ định riêng cho element, rồi tới WIDGET_SLOT_REGISTRY
          const slotDef = WIDGET_SLOT_REGISTRY[el.type];
          const primarySfx = el.sfxType || slotDef?.sfxDefault?.primary;
          if (primarySfx) {
            let desc = `Linh kiện: ${el.type}`;
            if (el.type === 'latex-formula') desc = 'Viết công thức KaTeX';
            else if (el.type === 'math-plot') desc = 'Vẽ đồ thị toán học';
            else if (el.type === 'social-callout') desc = 'Biến động số dư';
            else if (el.type === 'document-evidence') desc = 'Tài liệu / Dập mộc';
            else if (el.type === 'vs-battle') desc = 'So sánh đối đầu';
            else if (el.type === 'stat-big') desc = 'Số liệu tăng trưởng';
            else if (el.type === 'interactive-quiz') desc = 'Câu hỏi tương tác';
            else if (el.type === 'roadmap-flow' || el.type === 'flowchart') desc = 'Sơ đồ tiến trình';
            else if (el.type === 'highlight-box' || el.type === 'quote-box') desc = 'Điểm nhấn nội dung';

            tryAddSfx(primarySfx, eventTime, desc, 0.72);
            return;
          }

          // 2.2. Fallback cho các component đồ họa / video / animPreset
          if (el.type === 'master-hook') {
            tryAddSfx('boom', eventTime, 'Master Hook 3s', 0.85);
          } else if (el.type === 'candlestick-chart') {
            tryAddSfx('kaching', eventTime + 0.05, 'Nến tài chính', 0.75);
          } else if (['circle-chart', 'speed-meter', 'racing-bar-chart', 'gauge-chart', 'liquid-fill', 'cyber-matrix'].includes(el.type)) {
            tryAddSfx('ding', eventTime + 0.05, `Đồ thị: ${el.type}`, 0.7);
          } else if (['checklist', 'numbered-list', 'badge', 'push-notification'].includes(el.type)) {
            tryAddSfx('pop', eventTime + 0.08, `Linh kiện: ${el.type}`, 0.65);
          } else if (el.type === 'code-terminal') {
            tryAddSfx('typewriter', eventTime, 'Terminal Code', 0.65);
          } else if (el.type === 'frame-mockup' || el.type === 'image') {
            tryAddSfx('camera_shutter', eventTime + 0.1, 'Khung ảnh / Mockup', 0.65);
          } else if (el.animPreset === 'glitch') {
            tryAddSfx('glitch', eventTime, 'Hiệu ứng Glitch', 0.7);
          } else if (el.animPreset === 'bounce') {
            tryAddSfx('pop', eventTime, 'Motion Pop', 0.65);
          }
        });
      }

      // ── TẦNG 3: Cinematic Entrance & Motion Cut Triggers ──
      // 3.1. Hook Boom mở đầu điện ảnh
      if (sceneIdx === 0 || scene.temporalRole === 'hook') {
        const hookTime = currentSceneStartSec + 0.05;
        if (lastPlacedTimeSec < 0 || Math.abs(hookTime - lastPlacedTimeSec) >= minDistanceSec) {
          tryAddSfx('boom', hookTime, `Hook Điện Ảnh (${scene.name || 'Cảnh 1'})`, 0.85);
        }
      } else if (isPeakScene(scene)) {
        const thudTime = currentSceneStartSec + 0.05;
        if (lastPlacedTimeSec < 0 || Math.abs(thudTime - lastPlacedTimeSec) >= minDistanceSec) {
          tryAddSfx('thud', thudTime, `Cảnh Cao Trào (${scene.name || 'Highlight'})`, 0.8);
        }
      }

      // 3.2. SFX chuyển cảnh phát đúng lúc transition bắt đầu, âm thanh theo kiểu transition
      const transition = getSceneTransition(scene);
      if (transition && sceneIdx < scenes.length - 1 && sceneDur >= 1.2) {
        const transitionStartSec = currentSceneStartSec + Math.max(0.2, sceneDur - transition.duration);
        tryAddSfx(TRANSITION_SFX[transition.type] || 'whoosh', transitionStartSec, `Chuyển cảnh: ${transition.type}`, 0.68);
      }

      currentSceneStartSec += sceneDur;
    });

    return clips;
  }
};
