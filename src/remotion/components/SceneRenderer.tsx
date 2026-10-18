import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, spring, OffthreadVideo } from 'remotion';
import { noise2D } from '@remotion/noise';
import { Scene } from '../../types/scene';
import { generateCssFilterString } from '../../config/filterPresetCatalog';
import { ElementFactory } from '../elements/ElementFactory';
import { BrandAvatar } from './BrandAvatar';
import { ViralProgressBar } from './ViralProgressBar';
import { BeatInterrupt } from './BeatInterrupt';
import { scheduleBeat } from '../../utils/beatTimeline';
import { formatHudText } from '../../utils/hudFormatter';
import { getSceneWordTimeline, resolveElementWordAnchors, resolveRowRevealTimes, resolveWordRevealMap } from '../../utils/wordTimeline';
import { resolveHighlightVariant, highlightBulletRows } from '../../config/highlightBoxLayout';
import { resolveSceneEnergy, HIGH_ENERGY } from '../../config/cinematicRules';
import { computeCameraPose, composeCameraPose } from '../hooks/cameraMotion';
import { resolveThemePalette, getPaletteCssVariables, hexToRgba, getContrastTextColor, resolveSceneBackground } from '../../utils/themeResolver';
import { isPeakScene } from '../../config/sceneRoles';

export const SceneRenderer: React.FC<{ 
  scene: Scene; 
  sceneIndex: number; 
  totalScenes?: number; 
  isLastScene?: boolean; 
}> = ({ scene, sceneIndex, totalScenes = 1, isLastScene = false }) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const durationFrames = scene.duration * fps;

  // ── 5-LAYER THEME PALETTE & BACKGROUND RESOLUTION (SSOT) ───────────────────
  // patternColor & ambientColor luôn là hex #RRGGBB (SSOT resolveSceneBackground) → nối hậu tố alpha an toàn
  const { palette: themePalette, effectiveBgColor, bgGradient, isDarkBg, rawPattern, ambientColor, patternColor } = useMemo(() => {
    return resolveSceneBackground(scene);
  }, [scene]);

  const paletteCssVars = useMemo(() => getPaletteCssVariables(themePalette), [themePalette]);

  // Word timeline SSOT của cảnh: phụ đề, animation neo theo từ và nhấn nhá cùng đọc một nguồn
  const wordTimeline = useMemo(() => getSceneWordTimeline(scene), [scene]);

  // Nhịp giữ chân (rehook / payoff): chữ phủ màn hình lúc mở cảnh, lịch theo giọng đọc (beatTimeline SSOT)
  const beat = scene.beat;
  const beatSchedule = useMemo(
    () => (beat ? scheduleBeat(beat, scene.voiceoverText, wordTimeline, scene.duration || 3) : null),
    [beat, scene.voiceoverText, wordTimeline, scene.duration]
  );
  const isRehook = beat?.kind === 'rehook';
  // Hook: phụ đề chờ giọng đọc qua hết chữ hero (chữ đang phủ màn hình) rồi mới chạy, tránh hai lần cùng một câu
  const hookCaptionStartSec = useMemo(() => {
    const hook = scene.elements.find(e => e.type === 'master-hook' && e.revealOnVoice !== false);
    if (!hook || wordTimeline.length === 0) return 0;
    const h = hook.hookData;
    const hookText = [h?.heroTitle || hook.content, h?.heroLine2, h?.statValue].filter(Boolean).join(' ');
    const spoken = Object.values(resolveWordRevealMap(hookText, scene.voiceoverText, wordTimeline));
    return spoken.length > 0 ? Math.max(...spoken) + 0.35 : 0;
  }, [scene.elements, scene.voiceoverText, wordTimeline]);
  // Cảnh có nhịp thì giấu HUD để chữ nhịp và widget là thứ duy nhất trên khung
  const showHud = !beat;

  // Cinematic subtle camera floating using noise2D (refined for rock-solid clarity)
  const cameraDriftX = noise2D(`cam-x-${sceneIndex}`, frame * 0.01, 0) * 0.8;
  const cameraDriftY = noise2D(`cam-y-${sceneIndex}`, frame * 0.01, 1) * 0.6;

  // Gentle subtle zoom out for the entire scene background
  const zoomScale = interpolate(
    frame,
    [0, durationFrames],
    [1.012, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  // Ambient Breathe calculation (gentle 6% pulse)
  const isAccentBreathe = scene.viralEffects?.accentBreathe !== false;
  const breatheMultiplier = isAccentBreathe ? 1 + noise2D(`breathe-${sceneIndex}`, frame * 0.02, 2) * 0.06 : 1;
  const ambientOpacity = Math.max(0.1, Math.min(0.35, (0.18 + (noise2D(`glow-${sceneIndex}`, frame * 0.02, 0) + 1) * 0.03) * breatheMultiplier));

  // Vignette pulse
  const isVignettePulse = scene.viralEffects?.vignettePulse !== false;
  const vignetteDarkness = isVignettePulse 
    ? 0.32 + (noise2D(`vig-${sceneIndex}`, frame * 0.015, 0) + 1) * 0.03 
    : 0.32;


  // Background patterns (memoized per scene, synchronized 1:1 with Fabric)
  const { isGrid, isDots, isMesh, isNoise, isCyber3D, isTopoContour, isSpeedLines, patternOpacity, showMicroParticles, colorInverted } = useMemo(() => {
    return {
      isGrid: rawPattern === 'grid',
      isDots: rawPattern === 'dots',
      isMesh: rawPattern === 'mesh',
      isNoise: rawPattern === 'noise',
      isCyber3D: rawPattern === 'cyber-3d',
      isTopoContour: rawPattern === 'topo-contour',
      isSpeedLines: rawPattern === 'speed-lines',
      patternOpacity: scene.bgPatternOpacity ?? 1,
      showMicroParticles: scene.viralEffects?.microParticles === true,
      colorInverted: scene.colorInverted === true,
    };
  }, [rawPattern, scene.bgPatternOpacity, scene.viralEffects, scene.colorInverted]);

  // ── HYBRID CAMERA ENGINE: Spring Impact Punch (0.3s) + Continuous Drift (3.7s) ──
  const isHookScene = scene.temporalRole === 'hook' || sceneIndex === 0;
  // Năng lượng cảnh (SSOT cinematicRules) điều khiển biên độ camera & hiệu ứng mở cảnh,
  // để cảnh trầm thì êm, cảnh cao trào mới "đấm" — tránh mọi cảnh mở ra giống hệt nhau
  const energy = resolveSceneEnergy(scene);
  // Rehook "đấm" mạnh như hook để cú ngắt mạch cảm nhận được bằng camera
  const punchHard = isHookScene || isRehook;
  const punchAmp = punchHard ? 0.045 : 0.032 * energy;
  const shakeAmp = punchHard ? 1 : energy * 0.6;
  const punchDamping = punchHard ? 9 : 12;
  // Chớp sáng 2 frame khi vào rehook / cao trào (tắt được qua viralEffects.flashOnBeat, mặc định tắt cho thiền)
  const showFlash = scene.viralEffects?.flashOnBeat !== false && (isRehook || isPeakScene(scene)) && frame < 3;
  const showLightSweep = isHookScene || energy >= HIGH_ENERGY;
  const punchSpring = spring({
    fps,
    frame,
    config: {
      damping: punchDamping,
      mass: 0.28,
      stiffness: 220,
    },
  });
  const impactPunchScale = interpolate(punchSpring, [0, 1], [1 + punchAmp, 1.0], {
    extrapolateRight: 'clamp',
  });
  const impactPunchShakeX = interpolate(punchSpring, [0, 0.35, 0.75, 1], [0, 3.5 * shakeAmp, -2 * shakeAmp, 0], {
    extrapolateRight: 'clamp',
  });

  // Camera theo ràng buộc phủ khung & giữ nội dung (cameraMotion.ts): biên độ theo energy,
  // không bao giờ lộ nền ở mép hay đẩy thẻ rộng 88% ra sát mép khung
  const cameraPose = useMemo(() => {
    const progress = durationFrames > 0 ? frame / durationFrames : 0;
    const base = scene.cameraMotion
      ? computeCameraPose(scene.cameraMotion, progress, energy, {
          x: noise2D(`cam-shake-x-${sceneIndex}`, frame * 0.4, 0),
          y: noise2D(`cam-shake-y-${sceneIndex}`, frame * 0.4, 1),
          r: noise2D(`cam-shake-r-${sceneIndex}`, frame * 0.3, 0),
        })
      : { scale: zoomScale, x: 0, y: 0, rotate: 0 };
    // Drift nền nhẹ chỉ dùng khi cảnh không có chuyển động camera riêng
    const driftX = scene.cameraMotion ? 0 : cameraDriftX;
    const driftY = scene.cameraMotion ? 0 : cameraDriftY;
    return composeCameraPose(base, impactPunchScale, impactPunchShakeX, driftX, driftY);
  }, [scene.cameraMotion, frame, durationFrames, energy, sceneIndex, zoomScale, impactPunchScale, impactPunchShakeX, cameraDriftX, cameraDriftY]);
  const camScale = cameraPose.scale;
  const camX = cameraPose.x;
  const camY = cameraPose.y;
  const camRotateZ = cameraPose.rotate;

  // ── DIRECTIONAL VELOCITY-BASED MOTION BLUR (True Cinematic Optical Blur) ──
  const framePrev = Math.max(0, frame - 1);
  const punchSpringPrev = spring({
    fps,
    frame: framePrev,
    config: {
      damping: punchDamping,
      mass: 0.28,
      stiffness: 220,
    },
  });
  const impactPunchShakeXPrev = interpolate(punchSpringPrev, [0, 0.35, 0.75, 1], [0, 3.5 * shakeAmp, -2 * shakeAmp, 0], {
    extrapolateRight: 'clamp',
  });
  const punchScalePrev = interpolate(punchSpringPrev, [0, 1], [1 + punchAmp, 1.0], {
    extrapolateRight: 'clamp',
  });

  const velX = Math.abs(impactPunchShakeX - impactPunchShakeXPrev);
  const velScale = Math.abs(impactPunchScale - punchScalePrev) * 60;
  const motionBlurX = Math.min(5.0, (velX * 1.5 + velScale * 0.3));
  const motionBlurY = Math.min(2.0, velScale * 0.15);
  // Only apply optical SVG filter during high-velocity impact punch frames (first ~10 frames)
  const hasMotionBlur = frame < 12 && (motionBlurX > 1.2 || motionBlurY > 0.8);

  const transform = `scale(${camScale}) translate3d(${camX.toFixed(2)}px, ${camY.toFixed(2)}px, 0) rotateZ(${camRotateZ.toFixed(2)}deg)`;

  // Deterministic micro particles (Optimized GPU rendering)
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      xRatio: ((i * 37 + 13) % 100) / 100,
      baseYRatio: ((i * 53 + 29) % 100) / 100,
      size: 2.5 + (i % 3) * 1.2,
      speed: 0.15 + (i % 4) * 0.1,
      opacity: 0.3 + (i % 3) * 0.12,
      twinkleSpeed: 0.03 + (i % 3) * 0.02,
    }));
  }, []);

  const bgStyle = useMemo(() => bgGradient, [bgGradient]);
  const filterStyle = useMemo(() => generateCssFilterString(scene.filter), [scene.filter]);

  const combinedFilter = useMemo(() => {
    return [
      filterStyle !== 'none' ? filterStyle : '',
      hasMotionBlur ? `url(#cam-motion-blur-${sceneIndex})` : '',
    ].filter(Boolean).join(' ') || undefined;
  }, [filterStyle, hasMotionBlur, sceneIndex]);

  return (
    <AbsoluteFill 
      data-palette={themePalette.id}
      data-space-mode={themePalette.spaceMode}
      style={{ 
        ...paletteCssVars,
        // Chỉ đặt MỘT thuộc tính nền: React ghi `background: ''` cho giá trị undefined,
        // và shorthand rỗng xoá luôn background-color → theme sáng (không gradient) bị mất nền.
        ...(bgStyle ? { background: bgStyle } : { backgroundColor: effectiveBgColor }),
        transform,
        filter: combinedFilter,
        overflow: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        fontFamily: "'Be Vietnam Pro', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Directional Velocity Motion Blur SVG Filter */}
      {hasMotionBlur && (
        <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
          <filter id={`cam-motion-blur-${sceneIndex}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={`${motionBlurX.toFixed(2)} ${motionBlurY.toFixed(2)}`} />
          </filter>
        </svg>
      )}
      {/* Background Video Layer */}
      {scene.bgVideoUrl && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <OffthreadVideo
            src={scene.bgVideoUrl}
            volume={scene.bgVideoVolume ?? 0}
            playbackRate={scene.speedRate || 1}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Hook stage: sân khấu riêng cho hero — mép khung tối dần về màu nền, mắt dồn vào tiêu điểm vàng */}
      {isHookScene && !scene.bgVideoUrl && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: `radial-gradient(ellipse 70% 52% at 50% 40%, transparent 0%, transparent 45%, ${
            /^#[0-9a-f]{6}$/i.test(effectiveBgColor) ? hexToRgba(effectiveBgColor, 0.78) : (isDarkBg ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.78)')
          } 100%)`,
        }} />
      )}

      {/* Atmospheric Center Spotlight (Focal Depth) */}
      {!scene.bgVideoUrl && !isMesh && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${ambientColor} 0%, transparent 65%)`,
          opacity: isDarkBg ? 0.06 : 0.03,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}

      {/* Mesh Gradient Background (GPU-Optimized Multi-Stop Radial Field, 0ms blur overhead) */}
      {isMesh && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 15% 25%, ${ambientColor}40 0%, ${ambientColor}18 35%, transparent 70%), radial-gradient(circle at 85% 85%, ${ambientColor}55 0%, ${ambientColor}15 45%, transparent 75%)`,
          opacity: (isDarkBg ? 0.7 : 0.35) * patternOpacity,
          transform: `scale(${1 + Math.sin(frame * 0.02) * 0.06})`,
          willChange: 'transform',
        }} />
      )}

      {/* Noise Film Overlay */}
      {isNoise && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          // overlay không tạo khác biệt trên nền gần trắng → nền sáng dùng multiply để hạt nhiễu hiện ra
          opacity: (isDarkBg ? 0.08 : 0.12) * patternOpacity,
          pointerEvents: 'none',
          mixBlendMode: isDarkBg ? 'overlay' : 'multiply'
        }} />
      )}

      {/* Kinetic Background Text */}
      {scene.kineticBgWord && (
        <div style={{
          position: 'absolute', top: '25%', left: '-10%', right: '-10%',
          fontSize: 160, fontWeight: 900, fontFamily: 'Be Vietnam Pro',
          color: colorInverted ? (isDarkBg ? '#000000' : '#FFFFFF') : (isDarkBg ? '#FFFFFF' : '#000000'),
          opacity: isDarkBg ? 0.025 : 0.04,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          transform: `translateX(${interpolate(frame, [0, durationFrames], [0, -100])}px)`
        }}>
          {scene.kineticBgWord} {scene.kineticBgWord} {scene.kineticBgWord}
        </div>
      )}

      {/* Dynamic Ambient Spotlight Glow with Noise Breathing */}
      <div style={{
        position: 'absolute', inset: 0,
        // Vầng sáng lan bằng chính gradient (stop 72%) thay cho drop-shadow toàn khung:
        // drop-shadow 20px trên lớp phủ cả khung tốn ~18 ms/frame ở 1080×1920 mà gần như không nhìn thấy
        background: `radial-gradient(circle at 50% 35%, ${ambientColor}${Math.round(ambientOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent ${isAccentBreathe ? 72 : 65}%)`,
        pointerEvents: 'none'
      }} />

      {/* Light Sweep / Optical Flare Transition (Frame 0 to 20) */}
      {showLightSweep && frame < 25 && (
        <div style={{
          position: 'absolute', top: '-20%', bottom: '-20%', width: '150%',
          background: `linear-gradient(90deg, transparent 0%, ${ambientColor}00 40%, ${ambientColor}44 50%, ${ambientColor}00 60%, transparent 100%)`,
          transform: `translateX(${interpolate(frame, [0, 20], [-100, 100], { extrapolateRight: 'clamp' })}%) rotate(-25deg)`,
          pointerEvents: 'none',
          mixBlendMode: isDarkBg ? 'screen' : 'overlay',
          zIndex: 10, // Nổi lên che phủ các grid/mesh nhưng không che element (element có AbsoluteFill riêng)
        }} />
      )}

      {/* Beat flash: rehook chớp màu accent, cao trào chớp trắng (theme sáng: màu chữ) */}
      {showFlash && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 95,
          background: isRehook ? ambientColor : (isDarkBg ? '#FFFFFF' : themePalette.tokens.text),
          opacity: interpolate(frame, [0, 2], [0.5, 0], { extrapolateRight: 'clamp' }),
        }} />
      )}

      {/* Tech HUD Grid & Crosshairs Overlay */}
      {isGrid && (
        <>
          <div style={{
            position: 'absolute', inset: -50, // Tràn viền để trượt không bị hụt
            backgroundImage: `
              linear-gradient(to right, ${patternColor}${Math.min(255, Math.max(16, Math.round(46 * patternOpacity))).toString(16).padStart(2, '0')} 1.2px, transparent 1.2px),
              linear-gradient(to bottom, ${patternColor}${Math.min(255, Math.max(16, Math.round(46 * patternOpacity))).toString(16).padStart(2, '0')} 1.2px, transparent 1.2px)
            `,
            backgroundSize: '30px 30px', pointerEvents: 'none',
            backgroundPosition: `${-(frame % 300) * 0.4}px ${-(frame % 300) * 0.2}px`,
            willChange: 'background-position'
          }} />
          <div style={{ position: 'absolute', top: 10, left: 12, color: patternColor, opacity: Math.min(1, 0.5 * patternOpacity), textShadow: `0 0 6px ${patternColor}88`, fontSize: 14, fontFamily: 'monospace' }}>+</div>
          <div style={{ position: 'absolute', top: 10, right: 12, color: patternColor, opacity: Math.min(1, 0.5 * patternOpacity), textShadow: `0 0 6px ${patternColor}88`, fontSize: 14, fontFamily: 'monospace' }}>+</div>
          <div style={{ position: 'absolute', bottom: 10, left: 12, color: patternColor, opacity: Math.min(1, 0.5 * patternOpacity), textShadow: `0 0 6px ${patternColor}88`, fontSize: 14, fontFamily: 'monospace' }}>+</div>
          <div style={{ position: 'absolute', bottom: 10, right: 12, color: patternColor, opacity: Math.min(1, 0.5 * patternOpacity), textShadow: `0 0 6px ${patternColor}88`, fontSize: 14, fontFamily: 'monospace' }}>+</div>
        </>
      )}

      {/* Dots Pattern Overlay (for Zen / Healing) */}
      {isDots && (
        <div style={{
          position: 'absolute', inset: -50,
          backgroundImage: `radial-gradient(${patternColor}${Math.min(255, Math.max(25, Math.round(80 * patternOpacity))).toString(16).padStart(2, '0')} 1.4px, transparent 1.4px)`,
          backgroundSize: '24px 24px', pointerEvents: 'none',
          backgroundPosition: `${-(frame % 240) * 0.3}px ${-(frame % 240) * 0.4}px`,
          willChange: 'background-position'
        }} />
      )}

      {/* ── NEW PATTERN 1: CYBER 3D GROUND PERSPECTIVE GRID ────────── */}
      {isCyber3D && (
        <div style={{
          position: 'absolute',
          left: -100,
          right: -100,
          bottom: -40,
          height: 380,
          perspective: 260,
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: Math.min(1, 0.65 * patternOpacity),
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 20%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 20%, transparent 95%)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateX(68deg)',
            transformOrigin: '50% 100%',
            backgroundImage: `
              linear-gradient(to right, ${patternColor}66 1.5px, transparent 1.5px),
              linear-gradient(to bottom, ${patternColor}66 1.5px, transparent 1.5px)
            `,
            backgroundSize: '36px 36px',
            backgroundPosition: `center ${(frame * 1.6) % 36}px`,
          }} />
          {/* Horizon neon glow beam */}
          <div style={{
            position: 'absolute',
            bottom: 110,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(to right, transparent, ${patternColor}CC, transparent)`,
            filter: `drop-shadow(0 0 12px ${patternColor})`
          }} />
        </div>
      )}

      {/* ── NEW PATTERN 2: TOPO CONTOUR ORGANIC WAVES ─────────────── */}
      {isTopoContour && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: Math.min(1, 0.45 * patternOpacity),
        }}>
          <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id={`topo-grad-${sceneIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={patternColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={patternColor} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {Array.from({ length: 7 }).map((_, i) => {
              const waveOffset = Math.sin(frame * 0.02 + i * 0.85) * 16;
              const yBase = 110 + i * 78;
              return (
                <path
                  key={i}
                  d={`M -20 ${yBase + waveOffset} Q 90 ${yBase - 50 + waveOffset * 0.5}, 180 ${yBase + 20 - waveOffset} T 380 ${yBase - 30 + waveOffset}`}
                  fill="none"
                  stroke={`url(#topo-grad-${sceneIndex})`}
                  strokeWidth={1.8}
                  strokeDasharray={i % 2 === 0 ? "none" : "6 4"}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* ── NEW PATTERN 3: HYPERSPACE / ACTION SPEED LINES ─────────── */}
      {isSpeedLines && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: Math.min(1, 0.48 * patternOpacity),
          mixBlendMode: 'screen',
        }}>
          <svg width="360" height="640" viewBox="0 0 360 640" style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const angle = (i * 360) / 28;
              const rad = (angle * Math.PI) / 180;
              const pulse = (Math.sin(frame * 0.35 + i * 1.5) + 1) / 2;
              const rStart = 85 + pulse * 45;
              const rEnd = 390;
              const cx = 180;
              const cy = 300;
              const x1 = cx + Math.cos(rad) * rStart;
              const y1 = cy + Math.sin(rad) * rStart;
              const x2 = cx + Math.cos(rad) * rEnd;
              const y2 = cy + Math.sin(rad) * rEnd;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={patternColor}
                  strokeWidth={1.6 + (i % 3) * 0.9}
                  strokeLinecap="round"
                  opacity={0.35 + pulse * 0.65}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* Micro Particle Rain */}
      {showMicroParticles && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          {particles.map((p, i) => {
            const yOffset = ((p.baseYRatio * 640 + frame * p.speed * 2) % 660) - 10;
            const xWobble = Math.sin(frame * 0.05 + i) * 12;
            const twinkle = 0.5 + Math.sin(frame * p.twinkleSpeed + i) * 0.5;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: p.xRatio * 360 + xWobble,
                  top: yOffset,
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  opacity: p.opacity * twinkle,
                  boxShadow: `0 0 8px ${ambientColor}, 0 0 16px ${ambientColor}`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* BRAND AVATAR */}
      {(scene.authorAvatarUrl || scene.authorName) && (
        <BrandAvatar
          avatarUrl={scene.authorAvatarUrl}
          authorName={scene.authorName}
          accentColor={ambientColor}
          position={scene.authorAvatarPosition || 'top-left'}
          left={scene.authorAvatarLeft}
          top={scene.authorAvatarTop}
          size={scene.authorAvatarSize || 44}
          effect={scene.authorAvatarEffect || 'none'}
        />
      )}

      {/* HUD HEADER */}
      {scene.hudHeader && showHud && (
        <div style={{
          position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'center', zIndex: 100,
          opacity: spring({ fps, frame, config: { damping: 10 } })
        }}>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 700, 
            color: isDarkBg ? 'rgba(255, 255, 255, 0.45)' : hexToRgba(themePalette.tokens.text, 0.6), 
            letterSpacing: 2, 
            fontFamily: 'Inter' 
          }}>
            {formatHudText(scene.hudHeader, sceneIndex, totalScenes)}
          </span>
        </div>
      )}

      {/* Elements Render Loop */}
      {scene.elements.map((el, i) => {
        const enhancedEl = { ...el, ...resolveElementWordAnchors(el, wordTimeline) };
        // Bullet của highlight-box xuất hiện theo lời thoại (từng dòng khi giọng đọc tới từ khoá của dòng)
        if (el.type === 'highlight-box') {
          // Skin theo tông theme + nền có họa tiết/video (skin không khung sẽ thêm nền lót)
          enhancedEl.sceneHighlightSkin = themePalette.highlightSkin;
          enhancedEl.bgBusy = rawPattern !== 'none' || Boolean(scene.bgVideoUrl);
        }
        // Từ của tiêu đề hook bật lên khi giọng đọc nói tới (H5)
        if (el.type === 'master-hook' && el.revealOnVoice !== false && wordTimeline.length > 0) {
          const h = el.hookData;
          const hookText = [h?.heroTitle || el.content, h?.heroLine2, h?.statValue].filter(Boolean).join(' ');
          enhancedEl.hookWordRevealSec = resolveWordRevealMap(hookText, scene.voiceoverText, wordTimeline);
        }
        if (el.type === 'highlight-box' && el.revealOnVoice !== false && resolveHighlightVariant(el) === 'bullet-list') {
          enhancedEl.rowRevealAtSec = resolveRowRevealTimes(highlightBulletRows(el.content), scene.voiceoverText, wordTimeline).map(t => t ?? null);
        }
        if (enhancedEl.type === 'caption' && hookCaptionStartSec > 0 && enhancedEl.captionStartSec === undefined) {
          enhancedEl.captionStartSec = hookCaptionStartSec;
        }
        if (!enhancedEl.wordTimings) {
          if (enhancedEl.type === 'visual-paradox' && scene.voiceoverWordTimings) {
            enhancedEl.wordTimings = scene.voiceoverWordTimings;
          } else if (enhancedEl.type === 'caption' && wordTimeline.length > 0
            && (scene.voiceoverWordTimings || (enhancedEl.content || '').trim() === (scene.voiceoverText || '').trim())) {
            // Timeline ước lượng chỉ khớp khi phụ đề đúng là lời thoại; phụ đề tự viết thì tự ước lượng
            enhancedEl.wordTimings = wordTimeline;
          }
        }
        return <ElementFactory key={`${sceneIndex}-${i}-${el.type}`} el={enhancedEl} fps={fps} sceneDuration={scene.duration} />;
      })}

      {/* HUD FOOTER */}
      <div style={{
        position: 'absolute', bottom: 32, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', zIndex: 100,
        opacity: spring({ fps, frame: frame - 10, config: { damping: 10 } })
      }}>
        {scene.hudFooterLeft && showHud && (
          <span style={{ 
            fontSize: 10, 
            fontWeight: 600, 
            color: isDarkBg ? 'rgba(255, 255, 255, 0.45)' : hexToRgba(themePalette.tokens.text, 0.65), 
            fontFamily: 'var(--font-sans, inherit)' 
          }}>
            {scene.authorName 
              ? `${formatHudText(scene.hudFooterLeft, sceneIndex, totalScenes)} • @${scene.authorName}` 
              : formatHudText(scene.hudFooterLeft, sceneIndex, totalScenes)}
          </span>
        )}
        {scene.hudFooterRight && showHud && (
          <span style={{ 
            fontSize: 10, 
            fontWeight: 600, 
            color: isDarkBg ? 'rgba(255, 255, 255, 0.45)' : hexToRgba(themePalette.tokens.text, 0.65), 
            fontFamily: 'var(--font-sans, inherit)' 
          }}>
            {formatHudText(scene.hudFooterRight, sceneIndex, totalScenes)}
          </span>
        )}
      </div>

      {/* FINAL SCENE AI DISCLAIMER */}
      {isLastScene && scene.showAiDisclaimer !== false && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 105,
            opacity: spring({ fps, frame: frame - 15, config: { damping: 12 } }),
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 500,
              color: isDarkBg ? 'rgba(255, 255, 255, 0.7)' : themePalette.tokens.onSurface,
              fontFamily: 'var(--font-sans, inherit)',
              letterSpacing: 0.2,
              backgroundColor: isDarkBg ? 'rgba(0, 0, 0, 0.65)' : hexToRgba(themePalette.tokens.surface, 0.95),
              padding: '2px 8px',
              borderRadius: 10,
              border: isDarkBg ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{scene.aiDisclaimerText || 'AI tạo (có thể có sai sót).'}</span>
          </span>
        </div>
      )}

      {/* Nhịp giữ chân: chữ phủ màn hình rồi rút đi nhường widget */}
      {beat && beatSchedule && (
        <BeatInterrupt
          beat={beat}
          schedule={beatSchedule}
          accentColor={ambientColor}
          textColor={isDarkBg ? '#FFFFFF' : themePalette.tokens.text}
          backdrop={/^#[0-9a-f]{6}$/i.test(effectiveBgColor) ? hexToRgba(effectiveBgColor, 0.82) : (isDarkBg ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.82)')}
        />
      )}

      {/* Ambient Vignette Pulse Layer */}
      {isVignettePulse && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 90,
          // Theme sáng: vignette pha từ màu chữ của theme và nhạt hơn — đen 0.32 làm góc khung xám đục
          background: `radial-gradient(ellipse at 50% 50%, transparent 58%, ${isDarkBg
            ? `rgba(0,0,0,${vignetteDarkness.toFixed(3)})`
            : hexToRgba(themePalette.tokens.text, vignetteDarkness * 0.3)} 100%)`
        }} />
      )}

      {/* VIRAL PROGRESS BAR */}
      <ViralProgressBar
        config={scene.progressBar}
        accentColor={ambientColor}
        sceneIndex={sceneIndex}
        totalScenes={totalScenes || 1}
      />
    </AbsoluteFill>
  );
};

