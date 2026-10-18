import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React from 'react';
import { Easing } from 'remotion';
import { ElementProps } from '../types';
import { OrbitSystemData } from '@/types/scene';
import { getContrastTextColor } from '@/config/themePalettes';


const PLANET_COLORS = [
  'var(--chart-series-1, #00D4FF)',
  'var(--chart-series-2, #BEFF01)',
  'var(--chart-series-3, #FF2D78)',
  'var(--chart-series-4, #FFB800)',
  'var(--chart-series-5, #A855F7)',
];

/** Viền chữ màu nền scene: quỹ đạo trong luôn đi sát đĩa mặt trời, nhãn hành tinh có lúc đè lên đĩa/glow */
const LABEL_HALO = { stroke: 'var(--bg, #0B0F1A)', strokeWidth: 3, strokeLinejoin: 'round' as const, paintOrder: 'stroke' };

interface MappedPlanet {
  label: string;
  value: string;
  px: number;
  py: number;
  orbitR: number;
  angle: number;
  color: string;
  planetR: number;
}

export const OrbitSystemElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 45,
}) => {
  const data: OrbitSystemData = el.orbitData || {
    centerLabel: 'TỔNG DOANH THU',
    centerValue: '₫2.8B',
    planets: [
      { label: 'Q1', value: '₫680M', color: 'var(--chart-series-1, #00D4FF)', speed: 0.8 },
      { label: 'Q2', value: '₫850M', color: 'var(--chart-series-2, #BEFF01)', speed: 0.55 },
      { label: 'Q3', value: '₫720M', color: 'var(--chart-series-3, #FF2D78)', speed: 0.35 },
    ],
  };

  const size = Math.min(el.width || 280, el.height || 280);
  const cx = size / 2;
  const cy = size / 2;
  const sunR = size * 0.13;

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / durFrames));
  const easedProgress = Easing.out(Easing.cubic)(progress);

  const sunGlow = Math.sin(frame * 0.05) * 0.15 + 0.85;

  const planets: MappedPlanet[] = (data.planets || []).map((p, i) => {
    const totalOrbits = data.planets.length;
    const minOrbit = size * 0.22;
    const maxOrbit = size * 0.44;
    const orbitR = p.orbitRadius ?? (minOrbit + (maxOrbit - minOrbit) * (i / Math.max(totalOrbits - 1, 1)));
    const speed = p.speed ?? 1;
    const offset = (i * Math.PI * 2) / totalOrbits;
    const angle = frame * speed * 0.018 + offset;
    const px = cx + Math.cos(angle) * orbitR * easedProgress;
    const py = cy + Math.sin(angle) * orbitR * easedProgress;
    const color = p.color || PLANET_COLORS[i % PLANET_COLORS.length];
    const planetR = size * 0.055;
    return { label: p.label, value: p.value, px, py, orbitR, angle, color, planetR };
  });

  const accentColor = data.accentColor || 'var(--accent, #00D4FF)';
  // Chữ trên lõi mặt trời: --on-accent cho màu theme; màu tuỳ chỉnh (hex) tự chọn đen/trắng
  const sunTextColor = data.accentColor?.startsWith('#') ? getContrastTextColor(data.accentColor) : 'var(--on-accent, #0B0F1A)';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: size, height: size, display: 'block', boxSizing: 'border-box', position: 'relative' }}>
      <svg width={size} height={size} style={{ overflow: 'visible', position: 'absolute', inset: 0 }}>

        {/* Orbit Rings */}
        {planets.map((p, i) => (
          <circle
            key={`orbit-${i}`}
            cx={cx} cy={cy} r={p.orbitR * easedProgress}
            fill="none"
            stroke="var(--chart-grid, rgba(255,255,255,0.08))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Orbit trails (ghost planets) */}
        {planets.map((p, i) =>
          [1, 2, 3].map(ghost => {
            const gAngle = p.angle - ghost * 0.15;
            const gx = cx + Math.cos(gAngle) * p.orbitR * easedProgress;
            const gy = cy + Math.sin(gAngle) * p.orbitR * easedProgress;
            return (
               <circle
                key={`trail-${i}-${ghost}`}
                cx={gx} cy={gy}
                r={p.planetR * (1 - ghost * 0.25)}
                fill={p.color}
                opacity={0.15 / ghost}
              />
            );
          })
        )}

        {/* Sun Glow */}
        <circle cx={cx} cy={cy} r={sunR * 1.6} fill={accentColor} opacity={0.08 * sunGlow} />
        <circle cx={cx} cy={cy} r={sunR * 1.2} fill={accentColor} opacity={0.12 * sunGlow} />

        {/* Sun Core */}
        {/* Lõi đặc (phẳng) để chữ --on-accent luôn đủ tương phản */}
        <circle cx={cx} cy={cy} r={sunR} fill={accentColor} />
        <circle cx={cx} cy={cy} r={sunR} stroke={accentColor} strokeWidth={1.5} fill="none" opacity={0.6} />

        {/* Sun text */}
        <text x={cx} y={cy - 5} textAnchor="middle" fill={sunTextColor} fontSize={size * 0.042} fontWeight="800" fontFamily="sans-serif">
          {data.centerValue}
        </text>
        {/* Viền chữ cùng màu lõi: nhãn dài tràn ra mép đĩa vẫn nằm trên nền accent */}
        <text x={cx} y={cy + size * 0.055} textAnchor="middle" fill={sunTextColor} stroke={accentColor} strokeWidth={2.5} strokeLinejoin="round" paintOrder="stroke" fontSize={size * 0.03} fontFamily="sans-serif">
          {data.centerLabel}
        </text>

        {/* Planets */}
        {planets.map((p, i) => (
          <g key={`planet-${i}`}>
            {/* Planet Glow */}
            <circle cx={p.px} cy={p.py} r={p.planetR * 1.8} fill={p.color} opacity={0.15} />
            {/* Planet Body */}
            <circle cx={p.px} cy={p.py} r={p.planetR} fill={p.color} opacity={0.9} />
            <circle cx={p.px} cy={p.py} r={p.planetR} stroke="var(--text, #FFFFFF)" strokeWidth={0.8} fill="none" opacity={0.3} />
            {/* Planet label */}
            <text x={p.px} y={p.py - p.planetR - 5} textAnchor="middle" fill="var(--text, #FFFFFF)" {...LABEL_HALO} fontSize={size * 0.036} fontWeight="700" fontFamily="sans-serif">
              {p.value}
            </text>
            {/* Giá trị + nhãn dùng --text + viền nền: glow mặt trời/hành tinh chồng nhau làm --text-sub/màu series tụt dưới 4.5:1.
                Nhãn đặt dưới hành tinh (trước đây đè lên thân màu series → không đọc được) */}
            <text x={p.px} y={p.py + p.planetR + size * 0.036} textAnchor="middle" fill="var(--text, #FFFFFF)" {...LABEL_HALO} fontSize={size * 0.026} fontFamily="sans-serif">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
    </RemotionElementWrapper>
  );
};
