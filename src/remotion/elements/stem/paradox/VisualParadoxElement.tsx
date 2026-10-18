import React, { useRef, useEffect, useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { AdvElementProps } from '../../types';
import { RemotionElementWrapper } from '../../core/RemotionElementWrapper';
import { ParadoxRegistry } from './ParadoxRegistry';
import { ParadoxTimingMode, ParadoxCameraMode, VisualParadoxData } from './types';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { mixColor } from '../../../utils/rich-text-parser';

export const VisualParadoxElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  fps = 30,
  sceneDuration = 5,
  delayFrames = 0,
  wordTimings,
}) => {
  const currentFrame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const paradoxData: VisualParadoxData = el.paradoxData || {
    paradoxId: 'aristotle-wheel',
  };

  const plugin = useMemo(
    () => ParadoxRegistry.get(paradoxData.paradoxId || 'aristotle-wheel'),
    [paradoxData.paradoxId]
  );

  const w = el.width || 336;
  const h = el.height || 480;
  const accent = el.accentColor || paradoxData.accentColor || '#BEFF01';
  const secondary = el.secondaryColor || paradoxData.secondaryColor || '#00D4FF';

  const title = String(el.title ?? el.content ?? plugin.name ?? '').trim();
  const hasTitle = Boolean(title);
  const showCardBg = el.showCardBg !== false;
  const showHUD = paradoxData.showHUD !== false;

  const timingMode: ParadoxTimingMode = paradoxData.timingMode || 'auto-fit';
  const cameraMode: ParadoxCameraMode = paradoxData.cameraMode || 'auto-director';

  // Combined parameters with defaults
  const params = useMemo(() => {
    return {
      ...plugin.defaultParams,
      ...(paradoxData.params || {}),
    };
  }, [plugin, paradoxData.params]);

  // Extract formula from mathSpec or plugin
  const labelNode = useMemo(() => {
    const spec = paradoxData.mathSpec || params.mathSpec;
    return spec?.nodes?.find((n: any) => n.type === 'label');
  }, [paradoxData.mathSpec, params.mathSpec]);

  const formulaLatex = labelNode?.formula || plugin.latexFormula;
  const formulaTitle = labelNode?.text || 'MÔ HÌNH TOÁN HỌC';

  const katexHtml = useMemo(() => {
    if (!formulaLatex || paradoxData.separateFormula) return null;
    try {
      return katex.renderToString(formulaLatex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return formulaLatex;
    }
  }, [formulaLatex, paradoxData.separateFormula]);

  // 1. Time Normalization & Synchronization with Scene Duration
  const effectiveFps = fps || 30;
  const sceneSec = typeof sceneDuration === 'number' && sceneDuration > 0 ? sceneDuration : 5;
  const totalSceneFrames = Math.max(30, Math.round(sceneSec * effectiveFps));

  // In auto-fit mode, motion finishes slightly before the scene cuts (e.g. 0.6-0.8s) so the full curves and telemetry remain legible
  const finishMarginSec = sceneSec > 3 ? Math.min(0.8, sceneSec * 0.12) : 0.2;
  const finishMarginFrames = Math.round(finishMarginSec * effectiveFps);
  const activeSimFrames = Math.max(30, totalSceneFrames - (delayFrames || 0) - finishMarginFrames);

  const simFrame = Math.max(0, currentFrame - (delayFrames || 0));
  const rawTau = Math.min(1, Math.max(0, simFrame / activeSimFrames));
  const tSec = simFrame / effectiveFps;

  const tau = useMemo(() => {
    if (timingMode === 'continuous') {
      const speed = Number(params.speed) || 1.0;
      const turns = Number(params.turns) || 2;
      const secPerTurn = 3.0 / Math.max(0.1, speed);
      const totalTurnsPassed = tSec / secPerTurn;
      return (totalTurnsPassed % turns) / turns;
    }

    if (timingMode === 'storyboard-warp') {
      // Piecewise time warping: normal -> slow motion reveal -> normal
      if (rawTau < 0.25) {
        return rawTau * 1.2; // 0 to 0.30
      } else if (rawTau < 0.75) {
        // Slow motion at climax
        const localP = (rawTau - 0.25) / 0.5;
        return 0.30 + localP * 0.40; // 0.30 to 0.70
      } else {
        const localP = (rawTau - 0.75) / 0.25;
        return 0.70 + localP * 0.30; // 0.70 to 1.00
      }
    }

    // Default: 'auto-fit' linear deterministic progression across the full scene
    return rawTau;
  }, [timingMode, rawTau, tSec, params.speed, params.turns]);

  // Global motion progress across the multi-scene continuous story arc
  const startTau = paradoxData.startTau !== undefined ? paradoxData.startTau : 0.0;
  const endTau = paradoxData.endTau !== undefined ? paradoxData.endTau : 1.0;
  const effectiveTau = useMemo(() => {
    if (startTau === endTau) return startTau;
    return startTau + tau * (endTau - startTau);
  }, [startTau, endTau, tau]);

  // Check if speech audio is currently pronouncing a keyword defined by the active plugin
  const activeCueKeywords = useMemo(() => {
    return plugin.cueKeywords || ['trượt', 'slip', 'tiếp xúc', 'nhìn kỹ', 'phóng to', 'zoom', 'bên trong', 'bí mật'];
  }, [plugin]);

  const isCueWordActive = useMemo(() => {
    if (!wordTimings || wordTimings.length === 0) return false;
    return wordTimings.some(w => 
      activeCueKeywords.some(keyword => w.word.toLowerCase().includes(keyword.toLowerCase())) &&
      tSec >= w.startSec - 0.15 && tSec <= w.endSec + 0.35
    );
  }, [wordTimings, tSec, activeCueKeywords]);

  // Audio-reactive secondary color: flares vibrant neon crimson when cue word is spoken
  const effectiveSecondary = isCueWordActive ? '#FF3366' : secondary;

  // 2. Camera Focus Computation
  const camFocus = useMemo(() => {
    // Grand Cinematic Outro Zoom-out for Act 3 of Aristotle Wheel
    if (plugin.id === 'aristotle-wheel' && startTau >= 1.0 && endTau >= 1.0) {
      const R = Number(params.R) || 85;
      const r = Math.min(R - 10, Number(params.r) || 42);
      const turns = Number(params.turns) || 2;
      const totalAngle = turns * Math.PI * 2;
      const hubX = R * totalAngle;

      if (tau < 0.15) {
        return { x: hubX, y: r, zoom: 1.75 };
      } else if (tau < 0.65) {
        const p = (tau - 0.15) / 0.50;
        const sp = p * p * (3 - 2 * p);
        return {
          x: hubX,
          y: r * (1 - sp),
          zoom: 1.75 - 0.75 * sp,
        };
      } else {
        return { x: 0, y: 0, zoom: 1.0 };
      }
    }

    // If auto-director and wordTimings available on Aristotle Wheel
    if (plugin.id === 'aristotle-wheel' && cameraMode === 'auto-director' && wordTimings && wordTimings.length > 0) {
      const matchedCue = wordTimings.find(w => 
        activeCueKeywords.some(keyword => w.word.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (matchedCue && matchedCue.startSec > 0.5 && matchedCue.startSec < sceneSec - 0.5) {
        const cueTau = matchedCue.startSec / sceneSec;
        const R = Number(params.R) || 85;
        const r = Math.min(R - 10, Number(params.r) || 42);
        const turns = Number(params.turns) || 2;
        const theta = effectiveTau * turns * Math.PI * 2;
        const hubX = R * theta;

        const zoomInStart = Math.max(0.12, cueTau - 0.12);
        const zoomInEnd = cueTau;
        const zoomOutStart = Math.min(0.85, cueTau + 0.18);
        const zoomOutEnd = Math.min(0.95, zoomOutStart + 0.12);

        if (tau < zoomInStart) {
          return { x: hubX, y: 0, zoom: 1.0 };
        } else if (tau < zoomInEnd) {
          const p = (tau - zoomInStart) / (zoomInEnd - zoomInStart);
          const sp = p * p * (3 - 2 * p);
          return { x: hubX, y: r * sp, zoom: 1.0 + 0.75 * sp };
        } else if (tau < zoomOutStart) {
          return { x: hubX, y: r, zoom: 1.75 };
        } else if (tau < zoomOutEnd) {
          const p = (tau - zoomOutStart) / (zoomOutEnd - zoomOutStart);
          const sp = p * p * (3 - 2 * p);
          return { x: hubX, y: r * (1 - sp), zoom: 1.75 - 0.75 * sp };
        } else {
          return { x: hubX, y: 0, zoom: 1.0 };
        }
      }
    }

    return plugin.getCameraFocus(tSec, effectiveTau, params, cameraMode);
  }, [plugin, tSec, tau, effectiveTau, startTau, endTau, params, cameraMode, wordTimings, sceneSec, activeCueKeywords]);

  // 3. Telemetry Metrics
  const metrics = useMemo(() => {
    if (!showHUD) return [];
    return plugin.getTelemetryMetrics(tSec, effectiveTau, params, { accent, secondary: effectiveSecondary });
  }, [plugin, tSec, effectiveTau, params, showHUD, accent, effectiveSecondary]);

  // 4. Canvas Drawing Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2; // High-resolution canvas rendering for broadcast quality
    const padX = showCardBg ? 28 : 8;
    const padY = showCardBg ? 24 : 8;
    const renderW = Math.max(120, w - padX);
    const renderH = Math.max(120, h - padY - (hasTitle ? 36 : 0));

    canvas.width = renderW * dpr;
    canvas.height = renderH * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, renderW, renderH);

    // ── Dynamic Normalized Camera Projection (Safe-Zone Zero-Clipping) ──
    const isRollingWorld = plugin.id === 'aristotle-wheel';
    const R = Number(params.R) || 85;
    const r = Math.min(R - 10, Number(params.r) || 42);
    const groundY = renderH * 0.75;
    const hubY = groundY - R;

    // Safe margins to strictly prevent clipping and HUD collision
    const safeMarginTop = showHUD ? 36 : 14;
    const safeMarginBottom = 14;
    const safeMarginX = 16;

    let targetZoom = 1.0;
    let camCenterX = 0;
    let camCenterY = 0;

    if (isRollingWorld) {
      // Wheel content bounding box relative to (targetWorldX, hubY)
      const contentH = 2 * R + 32; // Top of outer wheel to bottom of ground/roadway
      const contentW = 2 * R + 16; // Full diameter with stroke/glow

      const availableH = Math.max(80, renderH - safeMarginTop - safeMarginBottom);
      const availableW = Math.max(80, renderW - 2 * safeMarginX);

      // Adaptive safe zoom: guaranteed mathematically never to exceed canvas bounds
      const maxSafeZoomY = availableH / contentH;
      const maxSafeZoomX = availableW / contentW;
      const maxSafeZoom = Math.max(1.0, Math.min(1.40, maxSafeZoomY, maxSafeZoomX));
      const minSafeZoom = 0.80; // Allow wide-angle view for Act 3 finish-line framing
      targetZoom = camFocus.zoom < 1.0
        ? Math.max(minSafeZoom, camFocus.zoom)
        : (camFocus.zoom > 1.0 ? Math.min(camFocus.zoom, maxSafeZoom) : 1.0);

      // World target coordinates
      const targetWorldX = camFocus.x;
      // When camFocus.y is defined, it is offset from hubY (e.g. at contact point: hubY + r)
      const targetWorldY = hubY + (camFocus.y || 0);

      // Act 3 Finish-Line Hero Framing (Specific to Aristotle Wheel):
      const isAct3Finish = effectiveTau >= 0.85 && (cameraMode === 'auto-director' || cameraMode === 'overview');

      // Dynamic screen center anchor:
      const zoomProgress = Math.min(1.0, Math.max(0.0, (targetZoom - 1.0) / 0.38));
      const screenAnchorX = isAct3Finish
        ? renderW - safeMarginX - (R + 8) * targetZoom
        : renderW * 0.48; // Centered studio framing
      const screenAnchorY = safeMarginTop + availableH * (0.48 + zoomProgress * 0.04);

      camCenterX = screenAnchorX - targetWorldX * targetZoom;
      camCenterY = screenAnchorY - targetWorldY * targetZoom;

      // Overview mode (no tracking at 1.0x, but NOT at finish line): roll from left to right
      if (cameraMode === 'overview' && targetZoom === 1.0 && !isAct3Finish) {
        camCenterX = renderW * 0.15;
        camCenterY = 0;
      }

      // Zero-Clipping Clamping for Rolling Wheel
      const screenTopOuter = camCenterY + (hubY - R - 4) * targetZoom;
      if (screenTopOuter < safeMarginTop) {
        camCenterY += (safeMarginTop - screenTopOuter);
      }
      const screenBottomGround = camCenterY + (groundY + 22) * targetZoom;
      if (screenBottomGround > renderH - safeMarginBottom) {
        camCenterY -= (screenBottomGround - (renderH - safeMarginBottom));
      }

      if (cameraMode !== 'overview' || targetZoom > 1.0 || isAct3Finish) {
        const screenLeftOuter = camCenterX + (targetWorldX - R - 6) * targetZoom;
        if (screenLeftOuter < safeMarginX && !isAct3Finish) {
          camCenterX += (safeMarginX - screenLeftOuter);
        }
        const screenRightOuter = camCenterX + (targetWorldX + R + 6) * targetZoom;
        if (screenRightOuter > renderW - safeMarginX) {
          camCenterX -= (screenRightOuter - (renderW - safeMarginX));
        }
      }
    } else {
      // ── Centered Safe-Zone Camera for Bounded Canvas Plugins ──
      // (Traffic Flow, Sorting Duel, Neural Network, Brachistochrone, Dynamic Sandbox)
      targetZoom = cameraMode === 'overview' ? 1.0 : Math.max(0.9, Math.min(1.35, camFocus.zoom || 1.0));
      const panX = cameraMode === 'overview' ? 0 : (camFocus.x || 0);
      const panY = cameraMode === 'overview' ? 0 : (camFocus.y || 0);

      // Clamp pan offset so camera never drifts outside bounded canvas
      const maxPanX = (renderW * Math.max(0, targetZoom - 1)) / (2 * targetZoom);
      const maxPanY = (renderH * Math.max(0, targetZoom - 1)) / (2 * targetZoom);
      const clampedPanX = maxPanX > 0 ? Math.max(-maxPanX, Math.min(maxPanX, panX)) : 0;
      const clampedPanY = maxPanY > 0 ? Math.max(-maxPanY, Math.min(maxPanY, panY)) : 0;

      // Invariant center mapping: (renderW/2 + clampedPanX) maps to renderW/2
      camCenterX = (renderW / 2) * (1 - targetZoom) - clampedPanX * targetZoom;
      camCenterY = (renderH / 2) * (1 - targetZoom) - clampedPanY * targetZoom;
    }

    ctx.save();
    ctx.translate(camCenterX, camCenterY);
    if (targetZoom !== 1.0) {
      ctx.scale(targetZoom, targetZoom);
    }

    const effectiveParams = {
      ...params,
      mathSpec: (params.mathSpec || paradoxData.mathSpec) ? {
        ...(params.mathSpec || paradoxData.mathSpec),
        hasKaTexOverlay: Boolean(katexHtml),
        separateFormula: Boolean(paradoxData.separateFormula),
      } : undefined,
      hasKaTexOverlay: Boolean(katexHtml),
      separateFormula: Boolean(paradoxData.separateFormula),
    };

    // Delegate rendering to Plugin
    plugin.renderFrame(
      ctx,
      tSec,
      effectiveTau,
      effectiveParams,
      { w: renderW, h: renderH },
      { accent, secondary: effectiveSecondary }
    );

    ctx.restore(); // Restore camera translation & zoom
    ctx.restore(); // Restore DPR scale
  }, [w, h, showCardBg, hasTitle, plugin, tSec, tau, effectiveTau, params, camFocus, accent, secondary, effectiveSecondary, cameraMode, showHUD, katexHtml, paradoxData.separateFormula]);

  const fontFamily = el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: showCardBg
            ? (el.bgColor || 'linear-gradient(135deg, rgba(14, 20, 27, 0.96) 0%, rgba(8, 12, 18, 0.98) 100%)')
            : 'transparent',
          border: showCardBg ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          borderRadius: showCardBg ? (el.radius !== undefined ? el.radius : 16) : 0,
          boxShadow: showCardBg ? 'var(--shadow-md, 0 12px 32px rgba(0, 0, 0, 0.5)), 0 0 0 1px rgba(255, 255, 255, 0.04) inset' : 'none',
          padding: showCardBg ? '12px 14px' : '4px',
        }}
      >
        {/* Dynamic Header Bar */}
        {hasTitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: 8,
              marginBottom: 8,
              width: '100%',
              zIndex: 3,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily,
                }}
              >
                {title}
              </span>
            </div>

            <div
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                color: accent,
                fontFamily: 'monospace',
                background: `${mixColor(accent, 9)}`,
                border: `1px solid ${mixColor(accent, 20)}`,
                padding: '2px 6px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              {plugin.archetype ? plugin.archetype.replace('_', ' ').toUpperCase() : 'STEM'}
            </div>
          </div>
        )}

        {/* Real-time Telemetry HUD Chips (Ultra-compact 1-row Studio strip) */}
        {showHUD && metrics.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: hasTitle ? 44 : 10,
              left: 10,
              right: 10,
              zIndex: 2,
              display: 'flex',
              gap: 5,
              flexWrap: 'nowrap',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {metrics.map((m, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'rgba(13, 17, 23, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 6,
                  padding: '2.5px 5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 7.5,
                    color: '#8B949E',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: m.color || '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Canvas Render Stage */}
        <div style={{ flex: 1, width: '100%', position: 'relative', minHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />

          {/* KaTeX Vector Formula Footer (Glassmorphism Studio Card) */}
          {!paradoxData.separateFormula && (formulaTitle || katexHtml) && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: 8,
                right: 8,
                zIndex: 3,
                background: 'rgba(14, 20, 27, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '5px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              }}
            >
              {formulaTitle && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    letterSpacing: '0.02em',
                    fontFamily,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {formulaTitle}
                </span>
              )}
              {katexHtml && (
                <div
                  style={{
                    fontSize: 10.5,
                    color: accent,
                    display: 'flex',
                    alignItems: 'center',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                  dangerouslySetInnerHTML={{ __html: katexHtml }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
