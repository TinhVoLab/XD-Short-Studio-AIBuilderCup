import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, Sequence, Audio, useVideoConfig, delayRender, continueRender, Easing } from 'remotion';
import { TransitionSeries, linearTiming, TransitionPresentation } from '@remotion/transitions';
import { glitch, zoomBlur, whipPan, crossBlur } from './transitions/cinematicTransitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { Scene, AudioTrackClip } from '../types/scene';
import { SceneRenderer } from './components/SceneRenderer';
import { sceneTimeToAudioFrame, getTransitionFrames, getSceneTransition } from '../utils/sceneTiming';
import { fontsReady } from './fonts/fontCatalog';

const getTransitionPresentation = (type?: string, width = 360, height = 640): TransitionPresentation<any> => {
  switch (type) {
    case 'slide':
    case 'slide-left':
      return slide({ direction: 'from-right' });
    case 'slide-right':
      return slide({ direction: 'from-left' });
    case 'slide-up':
      return slide({ direction: 'from-bottom' });
    case 'slide-down':
      return slide({ direction: 'from-top' });
    case 'wipe':
      return wipe({ direction: 'from-left' });
    case 'flip':
      return flip({ direction: 'from-right' });
    case 'clock-wipe':
      return clockWipe({ width, height });
    case 'blur':
    case 'linear-blur':
      return crossBlur();
    case 'glitch':
      return glitch();
    case 'zoom-blur':
      return zoomBlur();
    case 'whip-pan':
      return whipPan();
    case 'crossfade':
    case 'fade':
    default:
      return fade();
  }
};

// Ease-in-out cho mọi transition: tăng tốc rồi hãm, giữ đúng durationInFrames (khớp sceneTiming)
const TRANSITION_EASING = Easing.inOut(Easing.cubic);

export interface MainCompositionProps {
  scenes?: Scene[];
  bgMusicUrl?: string;
  bgMusicVolume?: number;
  audioClips?: AudioTrackClip[];
  durationInFrames?: number;
  isMuted?: boolean;
  masterVolume?: number;
  voiceoverVolume?: number;
  sfxVolume?: number;
  bgmVolume?: number;
  isVoiceMuted?: boolean;
  isSfxMuted?: boolean;
  isBgmMuted?: boolean;
  soloTrackId?: string | null;
  soloTrackIds?: string[];
  mutedTrackIds?: string[];
  showWatermark?: boolean;
}

export const MainComposition: React.FC<MainCompositionProps> = ({ 
  scenes = [], 
  bgMusicUrl, 
  bgMusicVolume = 0.3, 
  audioClips = [], 
  durationInFrames, 
  isMuted = false, 
  masterVolume = 1.0, 
  voiceoverVolume = 1.0,
  sfxVolume = 0.8,
  bgmVolume = 0.8,
  isVoiceMuted = false,
  isSfxMuted = false,
  isBgmMuted = false,
  soloTrackId = null,
  soloTrackIds = [],
  mutedTrackIds = [],
  showWatermark = false 
}) => {
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender('Readying fonts', { timeoutInMilliseconds: 15000 }));

  const fontsContinuedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (fontsContinuedRef.current) return;
      fontsContinuedRef.current = true;
      continueRender(handle);
    };
    // Fallback 4s: mạng lỗi thì vẫn render bằng font dự phòng thay vì treo cả job
    const timer = setTimeout(finish, 4000);
    fontsReady.then(finish);
    return () => clearTimeout(timer);
  }, [handle]);

  const hasAnySolo = (soloTrackIds && soloTrackIds.length > 0) || Boolean(soloTrackId);
  const legacyBgmSilenced = hasAnySolo
    ? !(soloTrackId === 'bgm' || soloTrackIds?.includes('A3') || soloTrackIds?.includes('bgm'))
    : (isBgmMuted || mutedTrackIds?.includes('A3') || mutedTrackIds?.includes('bgm'));

  return (
    <AbsoluteFill style={{ 
      backgroundColor: '#060D16',
      fontFamily: "'Be Vietnam Pro', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Twemoji Mozilla', sans-serif"
    }}>
      
      {/* Background Audio Tracks */}
      {!isMuted && audioClips.map((clip: AudioTrackClip) => {
        if (!clip.url || clip.isExpired) return null;

        const normTrack = (clip.trackId || 'A1').toLowerCase();
        const isVoice = normTrack === 'a1' || normTrack.includes('voice');
        const isBgm = normTrack === 'a3' || normTrack.includes('bgm') || normTrack.includes('music');
        const isSfx = normTrack === 'a2' || normTrack.includes('sfx');

        // Mute / Solo Gate evaluation
        let isTrackSilenced = false;
        if (hasAnySolo) {
          if (isVoice) isTrackSilenced = !(soloTrackId === 'voice' || soloTrackIds?.includes('A1') || soloTrackIds?.includes('voice'));
          else if (isSfx) isTrackSilenced = !(soloTrackId === 'sfx' || soloTrackIds?.includes('A2') || soloTrackIds?.includes('sfx'));
          else if (isBgm) isTrackSilenced = !(soloTrackId === 'bgm' || soloTrackIds?.includes('A3') || soloTrackIds?.includes('bgm'));
          else isTrackSilenced = !soloTrackIds?.includes(clip.trackId);
        } else {
          if (isVoice && (isVoiceMuted || mutedTrackIds?.includes('A1') || mutedTrackIds?.includes('voice'))) isTrackSilenced = true;
          else if (isSfx && (isSfxMuted || mutedTrackIds?.includes('A2') || mutedTrackIds?.includes('sfx'))) isTrackSilenced = true;
          else if (isBgm && (isBgmMuted || mutedTrackIds?.includes('A3') || mutedTrackIds?.includes('bgm'))) isTrackSilenced = true;
          else if (clip.trackId && mutedTrackIds?.includes(clip.trackId)) isTrackSilenced = true;
        }

        if (isTrackSilenced) return null;

        const channelGain = isVoice ? (voiceoverVolume ?? 1.0) : isBgm ? (bgmVolume ?? 1.0) : (sfxVolume ?? 0.8);
        const startFrame = isBgm 
          ? Math.round((clip.startSec ?? 0) * fps)
          : sceneTimeToAudioFrame(scenes, clip.startSec ?? 0, fps);
        const durationInFramesClip = Math.max(1, Math.round((clip.playDurationSec || clip.duration) * fps));
        const trimStartFrame = Math.max(0, Math.round((clip.trimStartSec || 0) * fps));

        return (
          <Sequence
            key={clip.id}
            from={startFrame}
            durationInFrames={durationInFramesClip}
          >
            <Audio
              src={clip.url}
              startFrom={trimStartFrame}
              playbackRate={clip.playbackRate || 1}
              volume={(f) => {
                const baseVol = Math.max(0, clip.volume ?? 1.0) * channelGain * (masterVolume ?? 1.0);
                if (baseVol === 0) return 0;

                // Voice & SFX play at constant volume determined by Bus Gain
                if (!isBgm) return baseVol;

                // BGM: Smooth fade-in (first 0.3s) & fade-out (last 0.5s) without choppy ducking
                const fadeIn = Math.min(1, Math.max(0, f / (0.3 * fps)));
                const fadeOut = Math.min(1, Math.max(0, (durationInFramesClip - f) / (0.5 * fps)));
                return baseVol * fadeIn * fadeOut;
              }}
            />
          </Sequence>
        );
      })}

      {/* Legacy/Global BGM: Only render if Track A3 does not already contain clips to prevent dual-playback echo */}
      {!isMuted && !legacyBgmSilenced && bgMusicUrl && !audioClips.some(c => (c.trackId === 'A3' || c.trackId === 'bgm') && c.url && !c.isExpired) && (
        <Audio 
          src={bgMusicUrl} 
          volume={(f) => {
            const channelGain = (bgmVolume ?? 1.0) * (bgMusicVolume ?? 0.3);
            const baseVol = Math.max(0, channelGain) * (masterVolume ?? 1.0);
            const totalDurationFrames = durationInFrames || Math.round(scenes.reduce((acc, s) => acc + s.duration, 0) * fps);
            const fadeOut = Math.min(1, Math.max(0, (totalDurationFrames - f) / (0.8 * fps)));
            return baseVol * fadeOut;
          }}
        />
      )}

      {/* Render Scenes with TransitionSeries */}
      <TransitionSeries>
        {scenes.map((scene, index) => {
          const sceneDurationFrames = Math.max(1, Math.round(scene.duration * fps));
          const trans = getSceneTransition(scene);
          const transDurationFrames = getTransitionFrames(scene, fps);
          const hasTrans = transDurationFrames > 0 && index < scenes.length - 1;

          return (
            <React.Fragment key={scene.id || index}>
              <TransitionSeries.Sequence durationInFrames={sceneDurationFrames}>
                <SceneRenderer scene={scene} sceneIndex={index} totalScenes={scenes.length} isLastScene={index === scenes.length - 1} />
              </TransitionSeries.Sequence>

              {hasTrans && (
                <TransitionSeries.Transition
                  presentation={getTransitionPresentation(trans?.type, width, height)}
                  timing={linearTiming({ durationInFrames: transDurationFrames, easing: TRANSITION_EASING })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      {/* Free Tier Watermark Overlay (Option 2: Giant Center Cinema Translucent Mark) */}
      {showWatermark && (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-14deg)',
              width: '135%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              opacity: 0.17,
              mixBlendMode: 'overlay',
            }}
          >
            {/* Top Hairline accent */}
            <div
              style={{
                width: '100%',
                height: Math.max(1, Math.round(width * 0.002)),
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 30%, rgba(190, 255, 1, 0.8) 50%, rgba(255, 255, 255, 0.4) 70%, transparent 100%)',
                marginBottom: Math.round(height * 0.016),
              }}
            />

            {/* Giant Center Emblem & Typography */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: Math.round(height * 0.008),
                padding: `${Math.round(height * 0.012)}px ${Math.round(width * 0.04)}px`,
              }}
            >
              {/* Shield Icon SVG */}
              <svg
                width={Math.round(width * 0.22)}
                height={Math.round(width * 0.22)}
                viewBox="0 0 28 28"
                fill="none"
                style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))' }}
              >
                <path d="M4 4L14 2L24 4V14C24 20.627 19.627 26 14 27C8.373 26 4 20.627 4 14V4Z" fill="#FFFFFF" fillOpacity="0.85" />
                <path d="M10 10L14 8L18 10V14C18 17.3 16.3 19.8 14 20.5C11.7 19.8 10 17.3 10 14V10Z" fill="#0D0D0D" />
                <path d="M14 5L22 6.5V13.5C22 18.8 18.5 23.2 14 24.2C9.5 23.2 6 18.8 6 13.5V6.5L14 5Z" stroke="#BEFF01" strokeWidth="1.2" fill="none" />
              </svg>

              {/* Title Text */}
              <span
                style={{
                  fontSize: Math.round(width * 0.056),
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 12px rgba(0,0,0,0.8)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                XD-SHORT STUDIO
              </span>

              {/* Subtitle Pill / Badge */}
              <div
                style={{
                  padding: `${Math.max(2, Math.round(width * 0.008))}px ${Math.round(width * 0.03)}px`,
                  borderRadius: Math.round(width * 0.012),
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  background: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <span
                  style={{
                    fontSize: Math.round(width * 0.024),
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    color: '#BEFF01',
                    textTransform: 'uppercase',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  FREE PREVIEW VERSION
                </span>
              </div>
            </div>

            {/* Bottom Hairline accent */}
            <div
              style={{
                width: '100%',
                height: Math.max(1, Math.round(width * 0.002)),
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 30%, rgba(190, 255, 1, 0.8) 50%, rgba(255, 255, 255, 0.4) 70%, transparent 100%)',
                marginTop: Math.round(height * 0.016),
              }}
            />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

