import React from 'react';
import { InspectorProps, Slider } from './common';
import { ColorControlRow } from './shared/ColorControlRow';
import { FormGroup, SectionHeader, Button, ButtonGroup } from '@/components/ui';
import { HAND_DRAWN_SPECS } from '@/config/handDrawnCatalog';

export function HandDrawnInspector({ element, updateElement }: InspectorProps) {
  const strokeColor = element.stroke || element.accentColor || element.color || HAND_DRAWN_SPECS.defaultAccent;
  const secondaryColor = element.secondaryColor || HAND_DRAWN_SPECS.defaultSecondaryColor;
  const strokeWidth = element.strokeWidth ?? HAND_DRAWN_SPECS.defaultStrokeWidth;
  const animDuration = element.animDuration ?? HAND_DRAWN_SPECS.defaultAnimDuration;
  const flipX = Boolean(element.flipX);
  const flipY = Boolean(element.flipY);
  const hasSecondary = Boolean(element.secondarySvgContent);

  const handleUpdate = (patch: Partial<typeof element>) => {
    updateElement(element.id, patch);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── 1. MÀU SẮC NÉT VẼ ── */}
      <FormGroup>
        <SectionHeader title="Màu sắc nét vẽ" />
        <ColorControlRow
          label="Màu nét chính"
          value={strokeColor}
          onChange={(col) => handleUpdate({ stroke: col, accentColor: col, color: col })}
        />

        {hasSecondary && (
          <ColorControlRow
            label="Màu nét bóng phụ"
            value={secondaryColor}
            onChange={(col) => handleUpdate({ secondaryColor: col })}
          />
        )}
      </FormGroup>

      {/* ── 2. ĐỘ DÀY & THỜI GIAN VẼ ── */}
      <FormGroup>
        <SectionHeader title="Thông số nét bút" />
        <Slider
          label="Độ đậm nét"
          min={HAND_DRAWN_SPECS.minStrokeWidth}
          max={HAND_DRAWN_SPECS.maxStrokeWidth}
          step={HAND_DRAWN_SPECS.strokeStep}
          value={strokeWidth}
          display={(v) => `${v}px`}
          onChange={(val) => handleUpdate({ strokeWidth: val })}
        />

        <Slider
          label="Thời gian vẽ nét"
          min={HAND_DRAWN_SPECS.minAnimDuration}
          max={HAND_DRAWN_SPECS.maxAnimDuration}
          step={HAND_DRAWN_SPECS.animStep}
          value={animDuration}
          display={(v) => `${v.toFixed(1)}s`}
          onChange={(val) => handleUpdate({ animDuration: val })}
        />
      </FormGroup>

      {/* ── 3. ĐẢO CHIỀU & HƯỚNG MŨI TÊN ── */}
      <FormGroup>
        <SectionHeader title="Hướng & Lật nét vẽ" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-sub)', fontWeight: 500 }}>Lật trục đối xứng</span>
          <ButtonGroup>
            <Button
              size="xs"
              variant={flipX ? 'primary' : 'secondary'}
              onClick={() => handleUpdate({ flipX: !flipX })}
              title="Lật ngang nét vẽ"
            >
              Lật ngang
            </Button>
            <Button
              size="xs"
              variant={flipY ? 'primary' : 'secondary'}
              onClick={() => handleUpdate({ flipY: !flipY })}
              title="Lật dọc nét vẽ"
            >
              Lật dọc
            </Button>
          </ButtonGroup>
        </div>
      </FormGroup>
    </div>
  );
}
