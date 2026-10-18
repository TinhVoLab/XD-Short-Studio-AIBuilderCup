import React from 'react';
import { useCurrentFrame, useVideoConfig, Audio, Sequence } from 'remotion';
import { MasterHookElement } from '../elements/infographic/MasterHookElement';
import { MasterHookData, SceneElement } from '@/types/scene';
import { MasterHookSceneConfigV2, SFXKeyframeMarker } from '@/types/hookLibraryV2';
import { SFX_TYPE_URL_MAP } from '@/services/hookStorageService';
import { mixColor } from '../utils/rich-text-parser';

export interface HookCompositionProps {
  hookData?: MasterHookData;
  sceneConfig?: Partial<MasterHookSceneConfigV2>;
  accentColor?: string;
  enableAudio?: boolean;
}

export const DEFAULT_HOOK_PROPS: HookCompositionProps = {
  hookData: {
    archetype: 'tips',
    layoutStyle: 'kinetic-contrast',
    badgeText: 'BÍ QUYẾT',
    heroTitle: 'CÁCH LÀM VIDEO VIRAL',
    heroLine2: 'ĐƠN GIẢN HIỆU QUẢ',
    highlightWords: ['VIRAL'],
    subText: 'Xem hết video để nhận trọn bộ',
    accentColor: '#BEFF01',
    wordAnimation: 'stagger-pop',
    fontSize: 40,
  },
  sceneConfig: {
    duration: 4,
    bgColor: '#09090b',
    bgPattern: 'grid',
    cameraMotion: 'zoom-in',
    transitionOut: 'glitch',
    sfxSequence: [
      { frame: 0, type: 'whoosh', volume: 0.8 },
      { frame: 15, type: 'pop', volume: 0.85 },
    ],
  },
  accentColor: '#BEFF01',
  enableAudio: true,
};

export const HookComposition: React.FC<HookCompositionProps> = ({
  hookData,
  sceneConfig = DEFAULT_HOOK_PROPS.sceneConfig,
  accentColor = '#BEFF01',
  enableAudio = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fallbackDefaults = DEFAULT_HOOK_PROPS.hookData!;
  const activeHookData: MasterHookData = {
    ...fallbackDefaults,
    ...(hookData || {}),
    archetype: (hookData?.archetype || fallbackDefaults.archetype || 'tips'),
    badgeText: hookData?.badgeText || fallbackDefaults.badgeText || 'BÍ QUYẾT',
    heroTitle: hookData?.heroTitle || fallbackDefaults.heroTitle || 'TIÊU ĐỀ HOOK',
    accentColor: hookData?.accentColor || accentColor,
  };

  const mockElement: SceneElement = {
    id: 'preview-hook-el',
    type: 'master-hook',
    left: width / 2,
    top: height * 0.38,
    width: width * 0.92,
    height: 280,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    opacity: 1,
    accentColor: activeHookData.accentColor || accentColor,
    content: activeHookData.heroTitle || '',
    hookData: activeHookData,
  };

  const computedStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '38%',
    transform: 'translate(-50%, -50%)',
    width: '92%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const sfxSequence: SFXKeyframeMarker[] = sceneConfig?.sfxSequence || [];
  const bgColor = sceneConfig?.bgColor || '#09090b';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Grid Accent Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      />

      {/* Radial Gradient Glow Center (GPU-Optimized Multi-Stop, 0ms blur overhead) */}
      <div
        style={{
          position: 'absolute',
          width: '90%',
          height: '60%',
          background: `radial-gradient(ellipse at center, ${mixColor(activeHookData.accentColor || accentColor, 16)} 0%, ${mixColor(activeHookData.accentColor || accentColor, 3)} 45%, transparent 72%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Master Hook Visual Element (Single Render Source of Truth) */}
      <MasterHookElement
        el={mockElement}
        computedStyle={computedStyle}
        frame={frame}
        fps={fps}
        delayFrames={0}
      />

      {/* Frame-accurate Multi-layer Audio SFX */}
      {enableAudio &&
        sfxSequence.map((sfx, idx) => {
          const audioUrl = SFX_TYPE_URL_MAP[sfx.type] || '/sfx/whoosh.wav';
          return (
            <Sequence key={`${sfx.type}-${sfx.frame}-${idx}`} from={sfx.frame} durationInFrames={45}>
              <Audio src={audioUrl} volume={sfx.volume ?? 0.8} />
            </Sequence>
          );
        })}
    </div>
  );
};
