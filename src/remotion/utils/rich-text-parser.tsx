import React, { useMemo } from 'react';
import { getContrastTextColor } from '@/config/themePalettes';

/** Pha màu với độ trong suốt — hoạt động với hex, rgba và var(--x) (nối hậu tố hex thì không) */
export const mixColor = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** Màu series/semantic dùng làm CHỮ nhỏ: pha 60% với --text → ≥ 4.5:1 trên nền & thẻ ở mọi theme */
export const readableTint = (color: string) => `color-mix(in srgb, ${color} 60%, var(--text))`;

/** Chữ đặt trên nền accent: hex đã biết → tính đen/trắng; token theme → var(--on-accent) */
export const onAccentColor = (accent: string) =>
  accent.trim().startsWith('#') ? getContrastTextColor(accent) : 'var(--on-accent)';

/** Số liệu tự nhấn: 90%, 10x, 1.500, +50.000.000đ, 3 triệu... */
// Kết thúc bằng chữ số để không nuốt dấu chấm cuối câu ("năm 2024."). Đơn vị dính liền số
// (%, x, k, đ) hoặc cách 1 khoảng (triệu, tỷ...) và không được có chữ cái phía sau ("3 điều" ≠ "3 đ")
const NUMBER_TOKEN = /((?<![\p{L}\p{N}\-])[+\-]?\d(?:[\d.,]*\d)?(?:(?:%|[xXkK]|tr|đ)(?![\p{L}\p{N}])|\s(?:triệu|tỷ|nghìn|ngàn)(?![\p{L}]))?)/u;

export interface RichTextOptions {
  accentColor: string;
  fontSize: number;
  /** Tự in đậm + tô accent các cụm số (mặc định bật) */
  emphasizeNumbers?: boolean;
}

/**
 * Render một dòng: `[tag]` thành micro-badge, cụm số thành điểm nhấn màu accent.
 */
export function renderRichLine(line: string, { accentColor, fontSize, emphasizeNumbers = true }: RichTextOptions): React.ReactNode[] {
  const parts = line.split(/(\[[^\]]+\])/g);
  return parts.flatMap((part, pIdx) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return [
        <span
          key={`t${pIdx}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            margin: '0 4px',
            background: mixColor(accentColor, 12),
            border: `1px solid ${mixColor(accentColor, 35)}`,
            borderRadius: 6,
            color: accentColor,
            fontWeight: 800,
            fontSize: Math.max(10, fontSize * 0.82),
            letterSpacing: 0.5,
            verticalAlign: 'baseline',
            whiteSpace: 'nowrap',
          }}
        >
          {part.slice(1, -1).trim()}
        </span>,
      ];
    }
    if (!emphasizeNumbers) return [<span key={`p${pIdx}`}>{part}</span>];
    return part.split(NUMBER_TOKEN).map((seg, sIdx) =>
      sIdx % 2 === 1
        ? <span key={`n${pIdx}-${sIdx}`} style={{ color: accentColor, fontWeight: 800 }}>{seg}</span>
        : <span key={`p${pIdx}-${sIdx}`}>{seg}</span>
    );
  });
}

export const useRichLineRenderer = (options: RichTextOptions) =>
  useMemo(
    () => (line: string) => renderRichLine(line, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.accentColor, options.fontSize, options.emphasizeNumbers]
  );
