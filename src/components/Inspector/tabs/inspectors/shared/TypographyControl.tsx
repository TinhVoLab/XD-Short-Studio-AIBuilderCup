import React from 'react';
import tabStyles from '../../Tabs.module.css';
import { SceneElement } from '@/types/scene';
import { AlignRow } from '../common';
import { Button } from '@/components/ui';
import { ScrubNumberInput } from '../../../components/ScrubNumberInput';
import { ColorControlRow } from './ColorControlRow';
import { PRIMARY_STUDIO_FONTS } from '@/config/fontRegistry';

export interface TypographyControlProps {
  element: SceneElement;
  updateElement: (id: string, patch: Partial<SceneElement>) => void;
  applyFontToAllScenes?: (font: string) => void;
  showToast?: (msg: string) => void;
  showColor?: boolean;
  showAlign?: boolean;
  showSpacing?: boolean;
  showLineHeight?: boolean;
  defaultFontSize?: number;
}

const SyncIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const TypographyControl: React.FC<TypographyControlProps> = ({
  element,
  updateElement,
  applyFontToAllScenes,
  showToast,
  showColor = true,
  showAlign = true,
  showSpacing = true,
  showLineHeight = false,
  defaultFontSize = 14,
}) => {
  const fontFamily = element.fontFamily || 'Be Vietnam Pro';
  const fontWeight = String(element.fontWeight || '700');
  const fontSize = element.fontSize || defaultFontSize;
  const textColor = element.color || '#FFFFFF';
  const textAlign = element.textAlign || 'center';
  const letterSpacing = element.letterSpacing ?? 0;
  const lineHeight = element.lineHeight ?? 1.15;
  const textTransform = element.textTransform || 'none';

  return (
    <>
      {/* 1. Font Family & Sync */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 4, flex: 1.3, minWidth: 0 }}>
          <select
            className={tabStyles.select}
            value={fontFamily}
            onChange={e => {
              const font = e.target.value;
              updateElement(element.id, {
                fontFamily: font,
                fontWeight: font === 'Poppins' ? '800' : fontWeight,
              });
            }}
            style={{ flex: 1, minWidth: 0, height: 28, fontSize: 11 }}
          >
            {PRIMARY_STUDIO_FONTS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {applyFontToAllScenes && (
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              title="Đồng bộ Font cho toàn bộ video"
              onClick={() => {
                applyFontToAllScenes(fontFamily);
                if (showToast) showToast(`Đã áp dụng font "${fontFamily}"!`);
              }}
            >
              <SyncIcon />
            </Button>
          )}
        </div>

        {/* 2. Font Weight & Transform */}
        <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
          <select
            className={tabStyles.select}
            value={fontWeight}
            onChange={e => updateElement(element.id, { fontWeight: e.target.value })}
            style={{ flex: 1, minWidth: 0, height: 28, fontSize: 11 }}
          >
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">SemiBold</option>
            <option value="700">Bold</option>
            <option value="800">ExtraBold</option>
            <option value="900">Black</option>
          </select>
          <Button
            asIcon
            variant={textTransform === 'uppercase' ? 'primary' : 'ghost'}
            size="icon-xs"
            title="Chuyển IN HOA / thường"
            onClick={() => updateElement(element.id, { textTransform: textTransform === 'uppercase' ? 'none' : 'uppercase' })}
          >
            <span style={{ fontSize: 10, fontWeight: 700 }}>AA</span>
          </Button>
        </div>
      </div>

      {/* 3. Text Align */}
      {showAlign && (
        <div style={{ marginBottom: 6 }}>
          <AlignRow
            value={textAlign}
            onChange={a => updateElement(element.id, { textAlign: a })}
          />
        </div>
      )}

      {/* 4. Font Size, Spacing & Line Height */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <ScrubNumberInput
          label="Size"
          value={fontSize}
          min={8}
          max={200}
          step={1}
          unit="px"
          title="Cỡ chữ — Kéo để thay đổi"
          onChange={v => updateElement(element.id, { fontSize: v })}
          className={tabStyles.numBox}
        />
        {showSpacing && (
          <ScrubNumberInput
            label="Space"
            value={letterSpacing}
            min={-2}
            max={20}
            step={0.5}
            precision={1}
            unit="px"
            title="Khoảng cách ký tự — Kéo để thay đổi"
            onChange={v => updateElement(element.id, { letterSpacing: v })}
            className={tabStyles.numBox}
          />
        )}
        {showLineHeight && (
          <ScrubNumberInput
            label="Line"
            value={lineHeight}
            min={0.8}
            max={2.5}
            step={0.05}
            precision={2}
            title="Giãn dòng — Kéo để thay đổi"
            onChange={v => updateElement(element.id, { lineHeight: v })}
            className={tabStyles.numBox}
          />
        )}
      </div>

      {/* 5. Text Color */}
      {showColor && (
        <ColorControlRow
          label="Màu chữ"
          value={textColor}
          onChange={c => updateElement(element.id, { color: c })}
        />
      )}
    </>
  );
};
