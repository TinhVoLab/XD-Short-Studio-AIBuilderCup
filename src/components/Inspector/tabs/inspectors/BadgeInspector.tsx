import React from 'react';
import tabStyles from '../Tabs.module.css';
import { InspectorProps, TypographyControl, CardBackgroundControl } from './common';
import { SectionHeader } from '@/components/ui';

export interface BadgeInspectorProps extends InspectorProps {
  applyFontToAllScenes?: (font: string) => void;
}

export function BadgeInspector({
  element,
  updateElement,
  applyFontToAllScenes,
  showToast,
}: BadgeInspectorProps) {
  return (
    <>
      <div className={tabStyles.group}>
        <SectionHeader title="Huy hiệu Badge" />

        {/* 1. Nội dung Badge */}
        <div style={{ marginBottom: 8 }}>
          <span className={tabStyles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>
            Nội dung huy hiệu
          </span>
          <input
            className={tabStyles.input}
            value={element.content || ''}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="VD: #1 HOOK, HOT, PRO..."
          />
        </div>

        {/* 2. Nhóm Kiểu chữ dùng chung (Shared TypographyControl) */}
        <TypographyControl
          element={element}
          updateElement={updateElement}
          applyFontToAllScenes={applyFontToAllScenes}
          showToast={showToast}
          defaultFontSize={12}
        />

        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0 8px' }} />

        {/* 3. Nhóm Nền & Viền dùng chung (Shared CardBackgroundControl) */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Nền huy hiệu"
          showBgColor={true}
          showStrokeColor={true}
          defaultBgColor="rgba(190, 255, 1, 0.15)"
          defaultRadius={element.radius !== undefined ? element.radius : Math.round((element.height || 22) / 2)}
        />
      </div>
      <div className={tabStyles.divider} />
    </>
  );
}
