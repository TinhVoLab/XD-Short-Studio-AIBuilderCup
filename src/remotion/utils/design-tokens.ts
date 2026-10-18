import React from 'react';
import { mixColor } from './rich-text-parser';

export interface GlassmorphicParams {
  accentColor: string;
  radius: number;
  customBg?: string;
  padding?: string | number;
}

/**
 * 1. Khung Glassmorphism Đa Tầng (Master Card Style)
 */
export const getGlassmorphicStyle = ({
  accentColor,
  radius,
  customBg,
  padding = '14px 16px',
}: GlassmorphicParams): React.CSSProperties => {
  return {
    background: customBg || 'var(--card-bg, linear-gradient(135deg, rgba(20,24,34,0.82) 0%, rgba(10,12,18,0.92) 100%))',
    borderRadius: radius,
    padding,
    // Viền phát sáng đồng đều 4 cạnh theo màu accent
    border: `1px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
    borderTop: `1px solid color-mix(in srgb, ${accentColor} 70%, transparent)`,
    // Elevation theo theme (--shadow-md) + highlight mép trên; glow accent dành cho trạng thái active
    boxShadow: 'var(--shadow-md, 0 6px 16px rgba(0, 0, 0, 0.32)), inset 0 1px 1px color-mix(in srgb, var(--text, #fff) 12%, transparent)',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  };
};

/**
 * 2. Bộ Màu Ngữ Nghĩa (Semantic Status Colors)
 * Dùng chuẩn cho Checklist, Bảng biểu, So sánh, Biểu đồ...
 */
export interface StatusColorToken {
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: string;
}

export const getStatusColor = (status: 'checked' | 'done' | 'success' | 'cross' | 'error' | 'fail' | 'warning' | 'pending' | 'info' | string): StatusColorToken => {
  switch (status) {
    case 'checked':
    case 'done':
    case 'success':
      return {
        color: 'var(--chart-positive, #00FF88)',
        bg: 'color-mix(in srgb, var(--chart-positive, #00FF88) 12%, transparent)',
        border: 'color-mix(in srgb, var(--chart-positive, #00FF88) 40%, transparent)',
        glow: 'color-mix(in srgb, var(--chart-positive, #00FF88) 25%, transparent)',
        icon: '✓',
      };
    case 'cross':
    case 'error':
    case 'fail':
      return {
        color: 'var(--chart-negative, #FF3366)',
        bg: 'color-mix(in srgb, var(--chart-negative, #FF3366) 12%, transparent)',
        border: 'color-mix(in srgb, var(--chart-negative, #FF3366) 40%, transparent)',
        glow: 'color-mix(in srgb, var(--chart-negative, #FF3366) 25%, transparent)',
        icon: '✕',
      };
    case 'warning':
    case 'pending':
      return {
        color: 'var(--chart-warning, #FFB800)',
        bg: 'color-mix(in srgb, var(--chart-warning, #FFB800) 12%, transparent)',
        border: 'color-mix(in srgb, var(--chart-warning, #FFB800) 40%, transparent)',
        glow: 'color-mix(in srgb, var(--chart-warning, #FFB800) 25%, transparent)',
        icon: '!',
      };
    case 'info':
    default:
      return {
        color: 'var(--chart-highlight, #00D4FF)',
        bg: 'color-mix(in srgb, var(--chart-highlight, #00D4FF) 12%, transparent)',
        border: 'color-mix(in srgb, var(--chart-highlight, #00D4FF) 40%, transparent)',
        glow: 'color-mix(in srgb, var(--chart-highlight, #00D4FF) 25%, transparent)',
        icon: 'ℹ',
      };
  }
};

/**
 * 3. Typography Token Helper
 * Đảm bảo đồng bộ font chữ, line-height, text shadow giữa các component
 */
export interface TypographyParams {
  fontSize?: number;
  fontWeight?: React.CSSProperties['fontWeight'];
  color?: string;
  fontFamily?: string;
  lineHeight?: number | string;
  textAlign?: React.CSSProperties['textAlign'];
  withShadow?: boolean;
}

export const getTypographyStyle = ({
  fontSize = 14,
  fontWeight = 600,
  color = 'var(--text, #FFFFFF)',
  fontFamily = 'Be Vietnam Pro, sans-serif',
  lineHeight = 1.45,
  textAlign = 'left',
  withShadow = false,
}: TypographyParams = {}): React.CSSProperties => {
  return {
    fontSize,
    fontWeight,
    color,
    fontFamily,
    lineHeight,
    textAlign,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    ...(withShadow ? { textShadow: '0 2px 8px rgba(0,0,0,0.6)' } : {}),
  };
};

/**
 * 4. Micro-Badge Token Helper
 * Dùng cho Header Badge, Tag, Pill của mọi component
 */
export const getBadgeStyle = (accentColor: string, size: 'sm' | 'md' = 'sm'): React.CSSProperties => {
  const isSm = size === 'sm';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: isSm ? 4 : 6,
    padding: isSm ? '2px 8px' : '4px 10px',
    borderRadius: isSm ? 10 : 14,
    backgroundColor: `${mixColor(accentColor, 10)}`,
    border: `1px solid ${mixColor(accentColor, 27)}`,
    color: accentColor,
    fontSize: isSm ? 9.5 : 11,
    fontWeight: 800,
    letterSpacing: isSm ? 0.5 : 0.8,
    fontFamily: 'Inter, sans-serif',
    textTransform: 'uppercase',
    boxShadow: `0 2px 8px rgba(0,0,0,0.2), 0 0 10px ${mixColor(accentColor, 15)}`,
    whiteSpace: 'nowrap',
  };
};
