import React, { useMemo } from 'react';
import { evolvePath } from '@remotion/paths';
import { interpolate, spring } from 'remotion';
import { ElementProps } from './types';
import {
  computeFormula,
  isValidFormula,
} from './generativeSvg/formulaRegistry';
import { FormulaId, RenderStyle } from './generativeSvg/types';
import { applyRenderStyle } from './generativeSvg/styles';
import { CINEMA_PALETTES } from './generativeSvg/palettes';

interface GenerativePath {
  d: string;
  layer?: 'base' | 'hero' | 'spark';
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export const GenerativeSvgElement: React.FC<
  ElementProps & {
    frame: number;
    fps?: number;
    delayFrames?: number;
    durFrames?: number;
  }
> = ({
  el,
  computedStyle,
  frame,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 200;
  const h = el.height || 200;
  
  // Resolve Cinema Palette or fallback to branding colors
  let accentColor = el.accentColor || el.color || 'var(--accent, #BEFF01)';
  let secondaryColor = el.secondaryColor || 'var(--info, #00F2FE)';
  
  if (el.paletteId) {
    const pal = CINEMA_PALETTES.find(p => p.id === el.paletteId);
    if (pal) {
      accentColor = pal.accent;
      secondaryColor = pal.secondary;
    }
  }

  const dangerColor = 'var(--danger, #FF3B30)';
  const borderColor = 'var(--border, rgba(255, 255, 255, 0.15))';
  
  const localFrame = frame - (delayFrames || 0);

  // Active formula resolution (formula prop or fallback default)
  const activeFormula: FormulaId | null = useMemo(() => {
    if (isValidFormula(el.formula)) return el.formula;
    const content = (el.svgContent || el.content || '').trim();
    if (!el.paths && !content) {
      // Upgraded default fallback: Quantum Orbit formula
      return 'quantum-orbit';
    }
    return null;
  }, [el.formula, el.paths, el.svgContent, el.content]);

  // Compute frame geometry if in formula mode
  const t = Math.max(0, localFrame) / fps;
  const formulaFrame = useMemo(() => {
    if (!activeFormula) return null;
    const baseFrame = computeFormula(activeFormula, t, accentColor, secondaryColor, el.formulaParams);
    const style: RenderStyle = (el.renderStyle as RenderStyle) || 'neon-cyber';
    return applyRenderStyle(baseFrame, style);
  }, [activeFormula, t, accentColor, secondaryColor, el.formulaParams, el.renderStyle]);

  // Parse raw SVG or path array safely (legacy backward compatibility)
  const { paths, rawSvg, isError } = useMemo(() => {
    if (activeFormula) {
      return { paths: null, rawSvg: null, isError: false };
    }
    try {
      if (el.paths && Array.isArray(el.paths)) {
        return { paths: el.paths as GenerativePath[], rawSvg: null, isError: false };
      }

      const content = (el.svgContent || el.content || '').trim();
      if (!content) {
        return { paths: null, rawSvg: null, isError: false };
      }

      // If it's a full or partial SVG string, extract paths or sanitize
      if (content.includes('<svg') || content.includes('<path')) {
        // Strip any solid background rect to ensure 100% alpha transparency and prevent Box-in-a-Box
        const sanitized = content.replace(/<rect\s+[^>]*(?:width=["'](?:100%|100)["']|height=["'](?:100%|100)["'])[^>]*\/?>/gi, '');
        return { paths: null, rawSvg: sanitized, isError: false };
      }

      // If single path string `d="..."`
      return {
        paths: [{ d: content, layer: 'hero', stroke: accentColor, strokeWidth: 2.5, fill: 'none' }],
        rawSvg: null,
        isError: false
      };
    } catch {
      return { paths: null, rawSvg: null, isError: true };
    }
  }, [activeFormula, el.paths, el.svgContent, el.content, accentColor]);

  // Spring animation for drawing hero strokes
  const drawSpring = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  // Pulse oscillation for spark layer (trigonometric time function)
  const pulse = 1 + 0.12 * Math.sin((localFrame / fps) * Math.PI * 3);
  const breathOpacity = interpolate(Math.sin((localFrame / fps) * Math.PI * 2), [-1, 1], [0.4, 0.8]);

  if (localFrame < 0) return null;

  // Safe Sandbox Fallback: If AI generated broken SVG, display elegant kinetic fallback
  if (isError) {
    return (
      <div
        style={{
          ...computedStyle,
          width: w,
          height: h,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--border)',
          borderRadius: 8,
          padding: 12,
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ color: accentColor, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
          {el.title || 'KINETIC METAPHOR'}
        </div>
        <div style={{ color: 'var(--text-sub, #8b949e)', fontSize: 10, marginTop: 4 }}>
          [SYNTHESIS ERROR - SAFE FALLBACK]
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          filter: 'drop-shadow(0 0 12px rgba(190, 255, 1, 0.15))',
        }}
      >
        <defs>
          {/* Neon Glow Filter */}
          <filter id="xd-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {formulaFrame ? (
          // Render mathematically computed formula frame
          <g>
            {formulaFrame.paths.map((p, idx) => (
              <path
                key={`fp-${idx}`}
                d={p.d}
                stroke={p.stroke}
                strokeWidth={p.strokeWidth}
                fill={p.fill || 'none'}
                opacity={p.opacity ?? 1}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={p.strokeDasharray}
                strokeDashoffset={p.strokeDashoffset}
                filter={p.filter}
              />
            ))}
            {formulaFrame.particles.map((pt, idx) => (
              <circle
                key={`fpt-${idx}`}
                cx={pt.cx}
                cy={pt.cy}
                r={pt.r}
                fill={pt.fill}
                opacity={pt.opacity ?? 1}
                filter={pt.filter}
              />
            ))}
          </g>
        ) : rawSvg ? (
          // Render sanitized raw SVG content
          <g dangerouslySetInnerHTML={{ __html: rawSvg.replace(/<\/?svg[^>]*>/gi, '') }} />
        ) : (
          paths?.map((p, idx) => {
            const layer = p.layer || 'hero';
            const strokeColor = p.stroke || (layer === 'hero' ? accentColor : borderColor);
            const fillColor = p.fill || 'none';
            const strokeW = p.strokeWidth || (layer === 'hero' ? 2.5 : 1.5);

            if (layer === 'spark') {
              return (
                <path
                  key={idx}
                  d={p.d}
                  fill={p.fill || secondaryColor}
                  stroke="none"
                  style={{
                    transformOrigin: '50px 50px',
                    transform: `scale(${pulse})`,
                    filter: 'url(#xd-neon-glow)',
                  }}
                />
              );
            }

            if (layer === 'base') {
              return (
                <path
                  key={idx}
                  d={p.d}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={breathOpacity}
                />
              );
            }

            // Hero Layer: Stroke-Draw via evolvePath & spring
            let evolved = { strokeDasharray: 'none', strokeDashoffset: 0 };
            try {
              evolved = evolvePath(drawSpring, p.d);
            } catch {
              // Graceful fallback if evolvePath fails on exotic commands
              evolved = { strokeDasharray: 'none', strokeDashoffset: 0 };
            }

            return (
              <g key={idx}>
                {/* Subtle underglow */}
                <path
                  d={p.d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeW + 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                  opacity={0.25}
                  filter="url(#xd-neon-glow)"
                />
                {/* Core animated stroke */}
                <path
                  d={p.d}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                />
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
};
