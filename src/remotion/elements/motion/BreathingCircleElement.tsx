import React from 'react';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { mixColor } from '../../utils/rich-text-parser';

export const BreathingCircleElement: React.FC<ElementProps & { frame: number; fps: number }> = ({
  el,
  computedStyle,
  positionStyle,
  frame,
  fps = 30,
}) => {
  const data = el.breathingData || {
    title: 'HÍT THỞ CHÁNH NIỆM',
    subtitle: 'Kỹ thuật 4-7-8',
    pattern: '4-7-8',
    visualStyle: 'concentric-orb',
    cycleDurationSec: 19,
  };

  const pattern = data.pattern || '4-7-8';
  const visualStyle = data.visualStyle || 'concentric-orb';
  const accentColor = el.accentColor || data.accentColor || 'var(--accent, #86EFAC)';
  const showPhaseText = data.showPhaseText !== false;
  // Chữ nhỏ màu accent: pha 20% màu chữ theme → đậm hơn ở theme sáng, sáng hơn ở theme tối
  const accentInk = `color-mix(in srgb, ${accentColor} 80%, var(--text))`;
  const showParticles = data.showParticles !== false;

  let inhaleDuration = 4;
  let holdDuration = 2;
  let exhaleDuration = 4;
  let holdEmptyDuration = 0;

  if (pattern === 'box') {
    inhaleDuration = 4; holdDuration = 4; exhaleDuration = 4; holdEmptyDuration = 4;
  } else if (pattern === 'calm') {
    inhaleDuration = 4; holdDuration = 1; exhaleDuration = 5; holdEmptyDuration = 0;
  } else if (pattern === 'coherence') {
    inhaleDuration = 5.5; holdDuration = 0; exhaleDuration = 5.5; holdEmptyDuration = 0;
  } else if (pattern === 'vagus') {
    inhaleDuration = 4; holdDuration = 0; exhaleDuration = 6; holdEmptyDuration = 0;
  } else {
    inhaleDuration = 4; holdDuration = 7; exhaleDuration = 8; holdEmptyDuration = 0;
  }

  const baseTotal = inhaleDuration + holdDuration + exhaleDuration + holdEmptyDuration;
  const targetTotal = data.cycleDurationSec || baseTotal;
  const scaleTime = targetTotal / baseTotal;

  inhaleDuration *= scaleTime;
  holdDuration *= scaleTime;
  exhaleDuration *= scaleTime;
  holdEmptyDuration *= scaleTime;

  const cycleFrames = targetTotal * fps;
  const currentFrameInCycle = frame % cycleFrames;
  const currentSecInCycle = currentFrameInCycle / fps;

  let breathScale = 1;
  let phaseText = 'HÍT VÀO';
  let phaseSub = 'Lấp đầy năng lượng';
  let remainingSeconds = 1;
  let phaseProgress = 0;

  if (currentSecInCycle < inhaleDuration) {
    phaseProgress = currentSecInCycle / inhaleDuration;
    breathScale = 0.75 + 0.35 * Math.sin((phaseProgress * Math.PI) / 2);
    phaseText = 'HÍT VÀO';
    phaseSub = 'Tĩnh lặng • Sâu';
    remainingSeconds = Math.ceil(inhaleDuration - currentSecInCycle);
  } else if (currentSecInCycle < inhaleDuration + holdDuration) {
    const holdElapsed = currentSecInCycle - inhaleDuration;
    phaseProgress = holdElapsed / holdDuration;
    breathScale = 1.1;
    phaseText = 'GIỮ HƠI';
    phaseSub = 'Cảm nhận hiện tại';
    remainingSeconds = Math.ceil(holdDuration - holdElapsed);
  } else if (currentSecInCycle < inhaleDuration + holdDuration + exhaleDuration) {
    const exhaleElapsed = currentSecInCycle - (inhaleDuration + holdDuration);
    phaseProgress = exhaleElapsed / exhaleDuration;
    breathScale = 1.1 - 0.35 * Math.sin((phaseProgress * Math.PI) / 2);
    phaseText = 'THỞ RA';
    phaseSub = 'Buông bỏ lo âu';
    remainingSeconds = Math.ceil(exhaleDuration - exhaleElapsed);
  } else {
    const holdEmptyElapsed = currentSecInCycle - (inhaleDuration + holdDuration + exhaleDuration);
    phaseProgress = holdEmptyElapsed / holdEmptyDuration;
    breathScale = 0.75;
    phaseText = 'GIỮ RỖNG';
    phaseSub = 'Thả lỏng hoàn toàn';
    remainingSeconds = Math.ceil(holdEmptyDuration - holdEmptyElapsed);
  }

  const w = el.width || 240;
  const h = el.height || Math.round(w * 1.08);
  const activeFont = el.fontFamily || 'Be Vietnam Pro, sans-serif';
  const scale = w / 240;
  const SVG_SIZE = Math.round(190 * scale);
  const coreOrbSize = Math.round(130 * scale);

  const particles = [
    { angle: 30, distance: 80 * scale, size: Math.max(2.5, 4 * scale), speed: 0.05 },
    { angle: 110, distance: 75 * scale, size: Math.max(2, 3 * scale), speed: 0.07 },
    { angle: 195, distance: 84 * scale, size: Math.max(3, 5 * scale), speed: 0.04 },
    { angle: 280, distance: 76 * scale, size: Math.max(2.5, 3.5 * scale), speed: 0.06 },
    { angle: 345, distance: 88 * scale, size: Math.max(3, 4.5 * scale), speed: 0.05 },
  ];

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: Math.round(12 * scale), userSelect: 'none', pointerEvents: 'none', boxSizing: 'border-box' }}>
        <div style={{ width: SVG_SIZE, height: SVG_SIZE, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          
          {/* Core Visual Renderer */}
          {visualStyle === 'water-ripple' && (
            <>
               <div style={{ width: SVG_SIZE, height: SVG_SIZE, position: 'absolute', top: 0, left: 0 }}>
                  {[0, 1, 2].map((i) => {
                    const rippleProgress = (phaseProgress + (i / 3)) % 1;
                    return (
                      <div key={i} style={{
                        position: 'absolute', top: '50%', left: '50%',
                        width: SVG_SIZE * rippleProgress, height: SVG_SIZE * rippleProgress,
                        border: `2px solid ${accentColor}`, borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        opacity: (1 - rippleProgress) * 0.6
                      }} />
                    )
                  })}
               </div>
               <div style={{ width: 14*scale, height: 14*scale, background: accentColor, borderRadius: '50%', boxShadow: `0 0 10px ${accentColor}`, transform: `scale(${breathScale})` }} />
            </>
          )}

          {visualStyle === 'singing-bowl' && (
            <div style={{ width: SVG_SIZE*0.9, height: SVG_SIZE*0.9, borderRadius: '50%', background: `radial-gradient(circle, ${mixColor(accentColor, 27)} 0%, transparent 70%)`, borderBottom: `4px solid ${accentColor}`, borderLeft: `2px solid ${mixColor(accentColor, 53)}`, borderRight: `2px solid ${mixColor(accentColor, 53)}`, transform: `scale(${breathScale})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 40px ${mixColor(accentColor, 13)}` }}>
              <div style={{ width: '80%', height: '80%', borderRadius: '50%', border: `1px dashed ${mixColor(accentColor, 53)}`, animation: 'spin 10s linear infinite' }} />
            </div>
          )}

          {visualStyle === 'zen-stones' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', transform: `scale(${breathScale})` }}>
              <div style={{ width: 40*scale, height: 20*scale, background: accentColor, borderRadius: '50%', marginBottom: -5*scale, opacity: 0.9 }} />
              <div style={{ width: 70*scale, height: 35*scale, background: accentColor, borderRadius: '50%', marginBottom: -10*scale, opacity: 0.7 }} />
              <div style={{ width: 100*scale, height: 50*scale, background: accentColor, borderRadius: '50%', opacity: 0.5 }} />
            </div>
          )}

          {(visualStyle === 'concentric-orb' || visualStyle === 'lotus-pulse') && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: coreOrbSize, height: coreOrbSize, borderRadius: '50%', background: `linear-gradient(135deg, ${mixColor(accentColor, 16)} 0%, var(--surface-1, rgba(10, 18, 14, 0.94)) 100%)`, border: `2px solid ${accentColor}`, boxShadow: `0 0 ${Math.round(24 * scale)}px ${mixColor(accentColor, 33)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translate(-50%, -50%) scale(${breathScale})`, textAlign: 'center', padding: Math.round(8 * scale), boxSizing: 'border-box', zIndex: 3 }}>
              <div style={{ fontSize: Math.max(14, Math.round(22 * scale)), fontWeight: 900, color: 'var(--text)', fontFamily: activeFont, lineHeight: 1, textShadow: `0 0 12px ${accentColor}` }}>
                {remainingSeconds}<span style={{ fontSize: Math.round(Math.max(14, Math.round(22 * scale)) * 0.45), fontWeight: 700, marginLeft: 1 }}>s</span>
              </div>
              {showPhaseText && (
                <>
                  <span style={{ fontSize: Math.max(8, Math.round(11 * scale)), fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text)', fontFamily: activeFont, textShadow: `0 0 8px ${mixColor(accentColor, 53)}` }}>{phaseText}</span>
                  <span style={{ fontSize: Math.max(6, Math.round(7.5 * scale)), fontWeight: 600, color: accentInk, fontFamily: activeFont, marginTop: 2, letterSpacing: '0.03em' }}>{phaseSub}</span>
                </>
              )}
            </div>
          )}

          {/* Ambient Particles */}
          {showParticles && particles.map((p, i) => {
            const orbitAngle = (p.angle + frame * p.speed * 20) * (Math.PI / 180);
            const currentDist = p.distance * breathScale;
            const px = Math.cos(orbitAngle) * currentDist;
            const py = Math.sin(orbitAngle) * currentDist;
            const pOpacity = 0.4 + 0.5 * Math.sin(frame * 0.1 + i);
            return (
              <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`, width: p.size, height: p.size, borderRadius: '50%', background: accentColor, boxShadow: `0 0 ${Math.round(8 * scale)}px ${accentColor}`, opacity: pOpacity, zIndex: 2 }} />
            );
          })}
        </div>

        {/* Bottom Title Label */}
        <div style={{ marginTop: Math.round(8 * scale), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', padding: `${Math.round(6 * scale)}px ${Math.round(16 * scale)}px`, borderRadius: Math.round(24 * scale), background: 'var(--surface-2, rgba(10, 16, 28, 0.92))', border: '1px solid var(--border, rgba(255, 255, 255, 0.12))', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: Math.max(7.5, Math.round(9.5 * scale)), fontWeight: 700, color: 'var(--text, rgba(255, 255, 255, 0.85))', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: activeFont }}>
            {data.title || 'HÍT THỞ CHÁNH NIỆM'}
          </span>
          {data.subtitle && (
            <span style={{ fontSize: Math.max(6, Math.round(7.5 * scale)), fontWeight: 600, color: accentInk, marginTop: 2 }}>{data.subtitle}</span>
          )}
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
