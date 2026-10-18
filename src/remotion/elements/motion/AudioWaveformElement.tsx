import React from 'react';
import { noise2D } from '@remotion/noise';
import { ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';

export const AudioWaveformElement: React.FC<ElementProps & { frame: number }> = ({ el, computedStyle, frame }) => {
  const style = el.waveformStyle || 'bars';
  const numBars = el.numberOfBars || (style === 'siri' ? 5 : style === 'dots' ? 20 : 24);
  const w = el.width || 280;
  const h = el.height || 40;
  const color = el.waveformColor || el.accentColor || 'var(--accent, #BEFF01)';
  const secondaryColor = el.waveformSecondaryColor || 'var(--chart-series-2, #00D4FF)';
  const coreColor = el.waveformCoreColor || 'var(--text, #FFFFFF)';
  const glow = el.waveformGlow !== false;

  // Helper for computing natural speech frequency amplitudes
  const getAmp = (i: number, total: number, speed = 0.09, harmonicSpeed = 0.22) => {
    const centerWeight = Math.sin(((i + 1) / (total + 1)) * Math.PI);
    const n = (noise2D('audio-wave-seed', frame * speed, i * 0.35) + 1) * 0.5;
    const harmonic = Math.sin(frame * harmonicSpeed + i * 0.45) * 0.3 + 0.5;
    return Math.max(0.08, Math.min(1, (n * 0.65 + harmonic * 0.35) * (0.3 + centerWeight * 0.7)));
  };

  // ── STYLE 1: BARS (Cột sóng cổ điển) ──
  if (style === 'bars') {
    const bars = Array.from({ length: numBars }).map((_, i) => Math.max(4, getAmp(i, numBars) * h));
    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {bars.map((barH, i) => (
          <div 
            key={i} 
            style={{ 
              flex: 1, 
              height: barH, 
              backgroundColor: color, 
              borderRadius: 2, 
              boxShadow: glow ? `0 0 8px ${mixColor(color, 53)}` : 'none',
            }} 
          />
        ))}
      </div>
    );
  }

  // ── STYLE 2: MIRRORED (Cột đối xứng 2 chiều Equalizer) ──
  if (style === 'mirrored') {
    const halfH = h / 2;
    const bars = Array.from({ length: numBars }).map((_, i) => Math.max(2, getAmp(i, numBars) * halfH));
    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {bars.map((barHalfH, i) => (
          <div key={i} style={{ flex: 1, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: barHalfH, backgroundColor: color, borderRadius: '2px 2px 0 0', boxShadow: glow ? `0 0 6px ${mixColor(color, 53)}` : 'none' }} />
            <div style={{ width: 2, height: 2, borderRadius: '50%', backgroundColor: coreColor, opacity: 0.8 }} />
            <div style={{ width: '100%', height: barHalfH, backgroundColor: color, borderRadius: '0 0 2px 2px', opacity: 0.75, boxShadow: glow ? `0 0 6px ${mixColor(color, 40)}` : 'none' }} />
          </div>
        ))}
      </div>
    );
  }

  // ── STYLE 3: CURVE (Dải lụa đa tầng mượt mà - Smooth Ribbon Waves) ──
  if (style === 'curve') {
    const pointsCount = 32;
    const stepX = w / (pointsCount - 1);
    const midY = h / 2;

    // Hàm làm mượt đường cong (Midpoint smoothing for open path)
    const smoothCurve = (pts: {x:number, y:number}[]) => {
      if (pts.length === 0) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
      }
      d += ` T ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
      return d;
    };

    const pts1: {x:number, y:number}[] = [];
    const pts2: {x:number, y:number}[] = [];
    const pts3: {x:number, y:number}[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const x = i * stepX;
      // Trọng số giảm dần ở 2 mép
      const centerWeight = Math.sin(((i + 1) / (pointsCount + 1)) * Math.PI);
      const amp = getAmp(i, pointsCount, 0.1, 0.25);
      
      // Layer 1: Ambient (chậm, thấp)
      pts1.push({ x, y: midY + Math.sin(frame * 0.05 + i * 0.3) * (h * 0.25 * centerWeight) });
      
      // Layer 2: Main audio (vừa)
      pts2.push({ x, y: midY + Math.sin(frame * 0.12 + i * 0.45) * (amp * h * 0.4) });
      
      // Layer 3: High frequency (nhanh, chi tiết)
      pts3.push({ x, y: midY + Math.sin(frame * 0.18 + i * 0.6 + Math.PI/3) * (amp * h * 0.45) });
    }

    const path1 = smoothCurve(pts1);
    const path2 = smoothCurve(pts2);
    const path3 = smoothCurve(pts3);

    // Vùng đổ bóng chân (Area chart) lấy theo Layer 2
    const areaPath = `${path2} L ${w} ${h} L 0 ${h} Z`;
    const gradId = `wave-grad-${frame % 50}`;
    const baseGradId = `wave-base-${frame % 50}`;

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.8} />
              <stop offset="50%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id={baseGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          {/* Vùng đổ bóng Gradient Fill (siêu nhẹ, không dùng filter) */}
          <path d={areaPath} fill={`url(#${baseGradId})`} />

          {/* Dải lụa 1 (Ẩn phía sau) */}
          <path d={path1} fill="none" stroke={secondaryColor} strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
          
          {/* Dải lụa 2 (Chính) */}
          {glow && <path d={path2} fill="none" stroke={color} strokeWidth={5} opacity={0.25} strokeLinecap="round" />}
          <path d={path2} fill="none" stroke={`url(#${gradId})`} strokeWidth={2.5} strokeLinecap="round" />

          {/* Dải lụa 3 (Tần số cao, sắc nét phía trước) */}
          <path d={path3} fill="none" stroke={coreColor} strokeWidth={1.2} opacity={0.4} strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // ── STYLE 4: DOTS (Ma trận hạt lượng tử Matrix Dots) ──
  if (style === 'dots') {
    const dotsCols = Math.min(24, numBars);
    const rows = 4;
    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {Array.from({ length: dotsCols }).map((_, colIdx) => {
          const amp = getAmp(colIdx, dotsCols);
          const activeRows = Math.max(1, Math.round(amp * rows));
          return (
            <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 3, height: h, justifyContent: 'center' }}>
              {Array.from({ length: rows }).map((_, rowIdx) => {
                const isActive = rowIdx < activeRows;
                const dotColor = isActive ? color : 'var(--border, rgba(255,255,255,0.08))';
                return (
                  <div
                    key={rowIdx}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      boxShadow: isActive && glow ? `0 0 6px ${color}` : 'none',
                      transform: isActive ? `scale(${1 + (rowIdx / rows) * 0.3})` : 'scale(0.8)',
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ── STYLE 5: SIRI (Viên thuốc giọng nói AI Đàn hồi Organic Capsules) ──
  if (style === 'siri') {
    const siriPills = 5;
    // Multi-tone Cyber Gradient: Cyan, Lime, Magenta, Purple, White
    const palette = [
      { top: '#00D4FF', bot: '#0077FF' },
      { top: '#BEFF01', bot: '#00E5FF' },
      { top: '#FFFFFF', bot: '#A855F7' },
      { top: '#FF2A85', bot: '#FF7A00' },
      { top: '#00E5FF', bot: '#7928CA' }
    ];
    
    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {Array.from({ length: siriPills }).map((_, i) => {
          const amp = getAmp(i, siriPills, 0.14, 0.32);
          const minH = 12;
          const maxH = h * 0.95;
          const pillH = Math.max(minH, amp * maxH);
          const pillW = Math.max(8, Math.round(w / 16));
          const pColor = palette[i % palette.length];
          const isCenter = i === 2;

          return (
            <div
              key={i}
              style={{
                width: pillW,
                height: pillH,
                borderRadius: 9999,
                background: `linear-gradient(180deg, ${pColor.top} 0%, ${pColor.bot} 100%)`,
                boxShadow: glow ? `0 0 16px ${mixColor(pColor.top, 53)}, 0 0 6px ${mixColor(pColor.bot, 67)}` : 'none',
                transform: `scaleX(${isCenter ? 1.1 : 1}) scaleY(${1 + amp * 0.15})`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // ── STYLE 6: CIRCULAR (Vòng tròn sóng tỏa âm Pulse Ring) ──
  if (style === 'circular') {
    const size = Math.min(w, h * 1.5, 60);
    const amp = getAmp(2, 5, 0.12);
    const ring1Scale = 1 + amp * 0.35;
    const ring2Scale = 1 + amp * 0.65;
    const ring3Scale = 1 + amp * 0.95;

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Core Dot */}
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 12px ${color}`, zIndex: 3 }} />
        {/* Radiating Waves */}
        <div style={{ position: 'absolute', width: size * 0.5, height: size * 0.5, borderRadius: '50%', border: `2px solid ${color}`, opacity: 0.8 - amp * 0.3, transform: `scale(${ring1Scale})`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: size * 0.75, height: size * 0.75, borderRadius: '50%', border: `1.5px dashed ${secondaryColor}`, opacity: 0.6 - amp * 0.3, transform: `scale(${ring2Scale})`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0.4 - amp * 0.3, transform: `scale(${ring3Scale})`, pointerEvents: 'none' }} />
      </div>
    );
  }

  // ── STYLE 7: LASER BEAM (Tia Laser Xuyên Thấu) ──
  if (style === 'laser-beam') {
    const ampCenter = getAmp(2, 5, 0.15, 0.3);
    const midY = h / 2;
    const segments = 24;
    const stepX = w / segments;
    
    // Generate lightning arcs using noise
    const renderLightning = (seedOffset: number, thickness: number, opacity: number, cColor: string) => {
      let d = `M 0 ${midY}`;
      for (let i = 1; i <= segments; i++) {
        const x = i * stepX;
        // Taper effect: arcs are wider in the center, zero at edges
        const distFromCenter = Math.sin((i / segments) * Math.PI); 
        const ampVal = getAmp(i % numBars, numBars, 0.1); 
        
        // Rapid noise for electric jitter
        const nVal = noise2D(`laser-${seedOffset}`, i * 0.4, frame * 0.3);
        const yOffset = nVal * (20 + ampVal * 50) * distFromCenter;
        
        d += ` L ${x} ${midY + yOffset}`;
      }
      return <path d={d} stroke={cColor} strokeWidth={thickness} fill="none" opacity={opacity} style={{ filter: glow ? `drop-shadow(0 0 6px ${cColor})` : 'none' }} />;
    };

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Lõi Core trắng chói */}
        <div style={{ position: 'absolute', width: '100%', height: 3 + ampCenter * 2, background: `linear-gradient(90deg, transparent 0%, ${coreColor} 30%, ${coreColor} 70%, transparent 100%)`, borderRadius: 2, boxShadow: glow ? `0 0 12px ${color}, 0 0 24px ${color}` : 'none', zIndex: 3 }} />
        
        {/* SVG Arcs */}
        <svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, overflow: 'visible' }}>
          {renderLightning(1, 2, 0.9, secondaryColor || '#00D4FF')}
          {renderLightning(2, 1.5, 0.7, color)}
        </svg>

        {/* Center Power Core (Hạt năng lượng) */}
        <div style={{ position: 'absolute', width: 8 + ampCenter * 16, height: 8 + ampCenter * 16, borderRadius: '50%', backgroundColor: coreColor, boxShadow: glow ? `0 0 16px ${color}, 0 0 32px ${secondaryColor}` : 'none', zIndex: 4 }} />
      </div>
    );
  }

  // ── STYLE 8: LIQUID BLOB (Thủy Ngân Lỏng Morphing iOS 18) ──
  if (style === 'liquid-blob') {
    const size = Math.min(w, h * 1.6, 90);
    const radius = size * 0.35;
    const numPoints = 24; // Mượt hơn rất nhiều so với 8
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const noiseVal = noise2D('liquid-seed', Math.cos(angle) * 1.5, Math.sin(angle) * 1.5 + frame * 0.05);
      const amp = getAmp(i % 5, 5, 0.08);
      const r = radius + (noiseVal * 0.5 + 0.5) * (amp * 28);
      points.push({
        x: size / 2 + Math.cos(angle) * r,
        y: size / 2 + Math.sin(angle) * r,
      });
    }

    // Catmull-Rom to Cubic Bezier for 100% smooth curve
    const splineCurve = (pts: {x:number, y:number}[]) => {
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[(i - 1 + pts.length) % pts.length];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const p3 = pts[(i + 2) % pts.length];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      d += ' Z';
      return d;
    };
    const pathData = splineCurve(points);
    const rot = (frame * 2) % 360;

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: glow ? `drop-shadow(0 0 16px ${mixColor(color, 53)})` : 'none', overflow: 'visible' }}>
          <defs>
            <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="50%" stopColor={secondaryColor || '#BEFF01'} />
              <stop offset="100%" stopColor={coreColor} />
            </linearGradient>
            
            <radialGradient id="specularGrad" cx="35%" cy="30%" r="55%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <g transform={`rotate(${rot * 0.5} ${size/2} ${size/2})`}>
            {/* Base liquid */}
            <path d={pathData} fill="url(#blobGrad)" opacity={0.9} />
            {/* Specular 3D highlight */}
            <path d={pathData} fill="url(#specularGrad)" style={{ mixBlendMode: 'overlay', transform: `translate(${-size*0.04}px, ${-size*0.04}px) scale(0.95)`, transformOrigin: 'center' }} />
          </g>
        </svg>
      </div>
    );
  }

  // ── STYLE 9: VU METER (Cyber Tech Neon LED HUD Gauge) ──
  if (style === 'vu-meter') {
    const ampRaw = getAmp(1, 4, 0.12, 0.28);
    const mechVib = noise2D('vib', frame * 0.6, 0) * 0.03;
    const amp = Math.max(0, Math.min(1, ampRaw + (ampRaw > 0.15 ? mechVib : 0)));

    const rot = -46 + amp * 92; // Góc quét rộng hơn từ -46deg tới +46deg

    const meterW = Math.min(w, 230); // Tăng chiều rộng toàn cảnh
    const meterH = Math.min(h, 50);
    const centerX = meterW / 2;
    const centerY = meterH - 4;
    const radius = meterH * 0.72;

    const numSegments = 22; // Tăng mật độ LED trải rộng
    const activeSegments = Math.max(1, Math.round(amp * numSegments));
    const dbDisplay = amp > 0.05 ? `${(amp * 18 - 14).toFixed(1)} dB` : '-INF dB';

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: meterW,
            height: meterH,
            background: 'linear-gradient(180deg, #0C121D 0%, #06090F 100%)',
            border: `1px solid ${mixColor(color, 33)}`,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: glow ? `0 0 14px ${mixColor(color, 20)}, inset 0 0 10px ${mixColor(color, 8)}` : 'none'
          }}
        >
          <svg width={meterW} height={meterH} style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Dải LED Segments vòng cung rộng */}
            {Array.from({ length: numSegments }).map((_, i) => {
              const angleDeg = -136 + (i / (numSegments - 1)) * 92;
              const angleRad = angleDeg * (Math.PI / 180);
              
              const isRed = i >= numSegments - 4;
              const isYellow = i >= numSegments - 8 && !isRed;
              const segColor = isRed ? '#FF2A85' : isYellow ? '#BEFF01' : (secondaryColor || color || '#00D4FF');
              const isActive = i < activeSegments;

              const r1 = radius - 1;
              const r2 = radius + 5;
              const x1 = centerX + Math.cos(angleRad) * r1;
              const y1 = centerY + Math.sin(angleRad) * r1;
              const x2 = centerX + Math.cos(angleRad) * r2;
              const y2 = centerY + Math.sin(angleRad) * r2;

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={segColor}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  strokeLinecap="round"
                  opacity={isActive ? 1 : 0.12}
                />
              );
            })}

            {/* Vạch viền Neon mờ */}
            <path 
              d={`M ${centerX + Math.cos(-136 * Math.PI / 180) * (radius - 4)} ${centerY + Math.sin(-136 * Math.PI / 180) * (radius - 4)} A ${radius - 4} ${radius - 4} 0 0 1 ${centerX + Math.cos(-44 * Math.PI / 180) * (radius - 4)} ${centerY + Math.sin(-44 * Math.PI / 180) * (radius - 4)}`} 
              fill="none" 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth="0.8" 
              strokeDasharray="2 2"
            />

            {/* Digital Readout HUD (Hiển thị số dB điện tử) */}
            <text x="12" y="14" fill={color} fontSize="7" fontFamily="monospace" fontWeight="700" letterSpacing="0.5">
              {dbDisplay}
            </text>

            {/* Status LED Dots (Cụm đèn tín hiệu bên phải) */}
            <circle cx={meterW - 28} cy={11} r={2} fill={color} opacity={0.8} />
            <circle cx={meterW - 19} cy={11} r={2} fill={secondaryColor || '#BEFF01'} opacity={amp > 0.5 ? 1 : 0.25} />
            <circle cx={meterW - 10} cy={11} r={2} fill="#FF2A85" opacity={amp > 0.85 ? 1 : 0.2} />

            {/* Tech HUD Center Tag */}
            <text x={centerX} y={centerY - radius * 0.4} fill="rgba(255,255,255,0.35)" fontSize="6" fontFamily="monospace" fontWeight="700" textAnchor="middle" letterSpacing="1.5">
              AUDIO HUD
            </text>

            {/* Kim Laser Neon siêu mảnh */}
            <g transform={`translate(${centerX}, ${centerY}) rotate(${rot})`}>
              <line x1="0" y1="0" x2="0" y2={-radius - 5} stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="0" cy={-radius - 4} r="1.5" fill="#FFFFFF" />
              {/* Trục phát quang Cyber */}
              <circle cx="0" cy="0" r="3.5" fill="#0A0F1A" stroke={color} strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
            </g>
          </svg>

          {/* Viền góc công nghệ sắc nét (Cyber Grid Corner Accents) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 6, height: 6, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
        </div>
      </div>
    );
  }

  // ── STYLE 10: DNA HELIX (Chuỗi Xoắn Kép 3D) ──
  if (style === 'dna-helix') {
    const pairsCount = 14;
    const stepX = w / (pairsCount - 1);
    const midY = h / 2;

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          {Array.from({ length: pairsCount }).map((_, i) => {
            const x = i * stepX;
            const phase = frame * 0.1 + (i / pairsCount) * Math.PI * 2;
            const sinVal = Math.sin(phase);
            const amp = getAmp(i, pairsCount, 0.08);
            const offset = sinVal * (h * 0.4 * (0.6 + amp * 0.4));
            const y1 = midY + offset;
            const y2 = midY - offset;
            const depth = (Math.cos(phase) + 1) / 2; // 0 to 1

            return (
              <g key={i}>
                {/* Connector rung */}
                <line
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke={secondaryColor}
                  strokeWidth={1.2}
                  opacity={0.25 + depth * 0.5}
                />
                {/* Strand Top Node */}
                <circle
                  cx={x}
                  cy={y1}
                  r={2 + depth * 1.5}
                  fill={color}
                  filter={glow ? 'drop-shadow(0 0 4px #BEFF01)' : undefined}
                />
                {/* Strand Bottom Node */}
                <circle
                  cx={x}
                  cy={y2}
                  r={2 + (1 - depth) * 1.5}
                  fill={secondaryColor}
                  filter={glow ? 'drop-shadow(0 0 4px #00D4FF)' : undefined}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // ── STYLE 11: ARCADE BLOCKS (Gạch LED Sân Khấu Peak Fall-off) ──
  if (style === 'arcade-blocks') {
    const cols = Math.min(18, numBars);
    const rows = 5;
    const blockW = (w - (cols - 1) * 3) / cols;
    const blockH = Math.max(3, (h - (rows - 1) * 2) / rows);

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
        {Array.from({ length: cols }).map((_, c) => {
          const amp = getAmp(c, cols, 0.12);
          const activeBlocks = Math.max(1, Math.round(amp * rows));

          return (
            <div key={c} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2, width: blockW }}>
              {Array.from({ length: rows }).map((_, r) => {
                const isActive = r < activeBlocks;
                const isPeak = r === activeBlocks - 1;
                const bColor = isPeak ? coreColor : r >= rows - 2 ? '#FF3B30' : color;

                return (
                  <div
                    key={r}
                    style={{
                      width: '100%',
                      height: blockH,
                      backgroundColor: isActive ? bColor : 'var(--border, rgba(255,255,255,0.06))',
                      borderRadius: 1,
                      boxShadow: isActive && glow ? `0 0 6px ${mixColor(bColor, 53)}` : 'none',
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ── STYLE 12: NEURAL CONSTELLATION (Mạng Tinh Vân AI) ──
  if (style === 'neural-constellation') {
    const baseNodes = [
      { x: 0.1, y: 0.5, isCore: false },
      { x: 0.22, y: 0.22, isCore: false },
      { x: 0.24, y: 0.78, isCore: false },
      { x: 0.38, y: 0.42, isCore: false },
      { x: 0.42, y: 0.72, isCore: false },
      { x: 0.50, y: 0.20, isCore: true },
      { x: 0.52, y: 0.82, isCore: false },
      { x: 0.58, y: 0.46, isCore: true },
      { x: 0.68, y: 0.24, isCore: false },
      { x: 0.74, y: 0.74, isCore: false },
      { x: 0.82, y: 0.36, isCore: false },
      { x: 0.92, y: 0.50, isCore: false }
    ];

    const nodes = baseNodes.map((n, i) => {
      const amp = getAmp(i, baseNodes.length, 0.12, 0.26);
      const jx = noise2D('nc-x', i * 2, frame * 0.04) * (14 * amp);
      const jy = noise2D('nc-y', i * 2 + 1, frame * 0.04) * (10 * amp);
      return {
        x: n.x * w + jx,
        y: n.y * h + jy,
        amp,
        isCore: n.isCore
      };
    });

    const maxDist = w * 0.28;
    const lines: { x1: number; y1: number; x2: number; y2: number; op: number }[] = [];
    const dataPackets: { x: number; y: number; op: number }[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const avgAmp = (nodes[i].amp + nodes[j].amp) / 2;
          const op = (1 - dist / maxDist) * (0.15 + avgAmp * 0.45);
          lines.push({
            x1: nodes[i].x,
            y1: nodes[i].y,
            x2: nodes[j].x,
            y2: nodes[j].y,
            op: Math.min(1, op)
          });
          
          // Data Packets (Bắn tín hiệu khi có xung âm thanh)
          if (avgAmp > 0.25) {
            const speed = 0.02 + (j % 3) * 0.015;
            const progress = (frame * speed + j * 0.3) % 1; // 0 to 1
            dataPackets.push({
              x: nodes[i].x - dx * progress,
              y: nodes[i].y - dy * progress,
              op: avgAmp
            });
          }
        }
      }
    }

    // Vi hạt bụi (Audio Dust)
    const globalAmp = getAmp(1, 5, 0.15);
    const dusts = Array.from({ length: 12 }).map((_, i) => {
      const bx = (w * ((i * 137) % 100)) / 100;
      const by = (h * ((i * 251) % 100)) / 100;
      const dx = noise2D('dust-x', i, frame * 0.01) * 10 + noise2D('dust-fast-x', i, frame * 0.1) * 15 * globalAmp;
      const dy = noise2D('dust-y', i, frame * 0.01) * 10 + noise2D('dust-fast-y', i, frame * 0.1) * 15 * globalAmp;
      return { x: bx + dx, y: by + dy };
    });

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          {/* Audio Dust */}
          {dusts.map((d, i) => (
            <circle key={`d-${i}`} cx={d.x} cy={d.y} r={0.8} fill={coreColor} opacity={0.4 + globalAmp * 0.6} />
          ))}

          {/* Synapse Lines */}
          {lines.map((l, idx) => (
            <line
              key={`l-${idx}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={secondaryColor}
              strokeWidth={1.1}
              opacity={l.op}
            />
          ))}

          {/* Data Packets */}
          {dataPackets.map((dp, idx) => (
            <circle key={`dp-${idx}`} cx={dp.x} cy={dp.y} r={1.5} fill={coreColor} opacity={dp.op} filter={glow ? `drop-shadow(0 0 4px #FFF)` : undefined} />
          ))}

          {/* Neural Nodes */}
          {nodes.map((n, idx) => {
            const r = 2 + n.amp * 2.8 + (n.isCore ? 1.5 : 0);
            const nColor = n.isCore ? coreColor : idx % 2 === 0 ? color : secondaryColor;

            // Core Pulse (Nhịp đập sinh học)
            const pulseR = (frame * 1.2 + idx * 15) % 45;
            const pulseOp = Math.max(0, 1 - pulseR / 45) * n.amp;

            return (
              <g key={`n-${idx}`}>
                {n.isCore && (
                  <circle cx={n.x} cy={n.y} r={r + pulseR} fill="none" stroke={color} strokeWidth={1} opacity={pulseOp} />
                )}
                {glow && (
                  <circle cx={n.x} cy={n.y} r={r + 3} fill="none" stroke={nColor} strokeWidth={1} opacity={n.amp * 0.6} />
                )}
                <circle cx={n.x} cy={n.y} r={r} fill={nColor} />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // ── STYLE 13: RETRO SUNBURST (Mặt Trời Synthwave 80s) ──
  if (style === 'retro-sunburst') {
    const numRays = 19;
    const cx = w / 2;
    const cy = h * 0.65; // Đẩy lên chút để có chỗ vẽ Lưới Grid
    const sunR = Math.min(w * 0.16, h * 0.35);
    const rIn = sunR + 4;
    const maxRayLen = h * 0.45;

    const startAngle = -Math.PI * 0.95;
    const endAngle = -Math.PI * 0.05;
    const angleStep = (endAngle - startAngle) / (numRays - 1);

    const sunAmp = getAmp(1, 4, 0.15, 0.3);
    const gradId = `sun-grad-${frame % 50}`;
    
    // Audio-Reactive Gradient Stop
    const middleStop = Math.max(30, Math.min(90, 40 + sunAmp * 50));

    // Perspective Grid (Lưới không gian 3 chiều)
    const numHz = 4;
    const hzLines = Array.from({ length: numHz }).map((_, i) => {
      const t = ((frame * 0.3 + i * (100 / numHz)) % 100) / 100;
      const gridY = cy + (h - cy) * (t * t); // Perspective quadratic curve
      return { y: gridY, op: t * 0.7 };
    });
    
    const numDiag = 9;
    const diagLines = Array.from({ length: numDiag }).map((_, i) => {
      const pct = i / (numDiag - 1);
      const xAtBottom = cx + (pct - 0.5) * w * 4; // Wide spread
      return { x2: xAtBottom };
    });

    return (
      <div style={{ ...computedStyle, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={secondaryColor || '#FF2A85'} />
              <stop offset={`${middleStop}%`} stopColor={color} />
              <stop offset="100%" stopColor={coreColor} />
            </linearGradient>
          </defs>

          {/* Perspective 3D Grid Floor */}
          {diagLines.map((l, i) => (
            <line key={`diag-${i}`} x1={cx} y1={cy} x2={l.x2} y2={h} stroke={secondaryColor} strokeWidth={1} opacity={0.3} />
          ))}
          {hzLines.map((l, i) => (
            <line key={`hz-${i}`} x1={0} y1={l.y} x2={w} y2={l.y} stroke={secondaryColor} strokeWidth={1} opacity={l.op} />
          ))}

          {/* Suncore Half Circle */}
          <path
            d={`M ${cx - sunR} ${cy} A ${sunR} ${sunR} 0 0 1 ${cx + sunR} ${cy} Z`}
            fill={`url(#${gradId})`}
            opacity={0.9}
          />

          {/* 80s Synthwave Horizontal Slice Cuts */}
          {[0.25, 0.5, 0.72].map((pct, idx) => {
            const cutY = cy - sunR * pct;
            const cutHalfW = Math.sqrt(Math.max(0, sunR * sunR - (cy - cutY) * (cy - cutY)));
            return (
              <line
                key={idx}
                x1={cx - cutHalfW}
                y1={cutY}
                x2={cx + cutHalfW}
                y2={cutY}
                stroke="#06090F"
                strokeWidth={1.2 + idx * 0.6}
              />
            );
          })}

          {/* Radiating Equalizer Rays */}
          {Array.from({ length: numRays }).map((_, i) => {
            const angle = startAngle + i * angleStep;
            const amp = getAmp(i, numRays, 0.12, 0.3);
            const rOut = rIn + Math.max(3, amp * maxRayLen);

            const x1 = cx + Math.cos(angle) * rIn;
            const y1 = cy + Math.sin(angle) * rIn;
            const x2 = cx + Math.cos(angle) * rOut;
            const y2 = cy + Math.sin(angle) * rOut;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={0.35 + amp * 0.65}
                filter={glow && amp > 0.5 ? `drop-shadow(0 0 6px ${mixColor(color, 53)})` : undefined}
              />
            );
          })}

          {/* Horizon Line */}
          <line x1={w * 0.02} y1={cy} x2={w * 0.98} y2={cy} stroke={secondaryColor} strokeWidth={1.5} opacity={0.8} />
          {/* Ambient Glow */}
          {glow && <line x1={w * 0.2} y1={cy} x2={w * 0.8} y2={cy} stroke={color} strokeWidth={4} opacity={sunAmp * 0.5} filter="blur(4px)" />}
        </svg>
      </div>
    );
  }

  return null;
};



