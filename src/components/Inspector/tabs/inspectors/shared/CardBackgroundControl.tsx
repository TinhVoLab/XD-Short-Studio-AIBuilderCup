import React from 'react';
import { SceneElement } from '@/types/scene';
import styles from '../../Tabs.module.css';
import { Toggle, ToggleRow, Slider, ColorDot } from '../common';
import { ColorControlRow } from './ColorControlRow';
import { getElementWidthSpecs } from '@/config/layoutRegistry';

export interface CardBackgroundControlProps {
  element: SceneElement;
  updateElement: (id: string, patch: Partial<SceneElement>) => void;
  label?: string;
  showWidth?: boolean;
  widthLabel?: string;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  showRadius?: boolean;
  showBgColor?: boolean;
  showStrokeColor?: boolean;
  defaultBgColor?: string;
  defaultRadius?: number;
  showGlow?: boolean;
  children?: React.ReactNode;
}

export const CardBackgroundControl: React.FC<CardBackgroundControlProps> = ({
  element,
  updateElement,
  label = 'Khung nền thẻ',
  showWidth = false,
  widthLabel = 'Chiều rộng thẻ',
  minWidth,
  maxWidth,
  defaultWidth,
  showRadius = true,
  showBgColor = false,
  showStrokeColor = false,
  defaultBgColor = 'rgba(190, 255, 1, 0.15)',
  defaultRadius = 16,
  showGlow = false,
  children,
}) => {
  const isCardBgOn = element.showCardBg !== false && element.bgColor !== 'transparent';
  
  // Tự động nhận diện cận hình học SSOT từ layoutRegistry theo element.type
  const autoSpecs = getElementWidthSpecs(element.type);
  const resolvedMinWidth = minWidth ?? autoSpecs.min;
  const resolvedMaxWidth = maxWidth ?? autoSpecs.max;
  const resolvedDefaultWidth = defaultWidth ?? autoSpecs.default;
  const resolvedStep = autoSpecs.step;

  return (
    <>
      {showWidth && (
        <div style={{ marginBottom: 6 }}>
          <Slider
            label={widthLabel}
            value={element.width || resolvedDefaultWidth}
            min={resolvedMinWidth}
            max={resolvedMaxWidth}
            step={resolvedStep}
            display={v => `${v}px`}
            onChange={v => updateElement(element.id, { width: v })}
          />
        </div>
      )}

      <div style={{ marginBottom: 4 }}>
        <ToggleRow label={label}>
          <Toggle
            checked={isCardBgOn}
            onChange={(checked: boolean) => updateElement(element.id, {
              showCardBg: checked,
              bgColor: checked
                ? (element.bgColor && element.bgColor !== 'transparent' ? element.bgColor : (showBgColor ? defaultBgColor : undefined))
                : 'transparent'
            })}
          />
        </ToggleRow>
      </div>

      {isCardBgOn && (
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginTop: 4,
            marginBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {showBgColor && showStrokeColor ? (
            <div className={styles.toggleRow} style={{ marginBottom: 0 }}>
              <span className={styles.sliderLabel}>Màu sắc</span>
              <div className={styles.trRight} style={{ gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-sub)' }}>Nền</span>
                  <ColorDot
                    value={element.bgColor || defaultBgColor}
                    onChange={c => updateElement(element.id, { bgColor: c })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-sub)' }}>Viền</span>
                  <ColorDot
                    value={element.stroke || element.accentColor || '#BEFF01'}
                    onChange={c => updateElement(element.id, { stroke: c, accentColor: c })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {showBgColor && (
                <ColorControlRow
                  label="Màu nền"
                  value={element.bgColor || defaultBgColor}
                  onChange={c => updateElement(element.id, { bgColor: c })}
                  style={{ marginBottom: 0 }}
                />
              )}
              {showStrokeColor && (
                <ColorControlRow
                  label="Màu viền"
                  value={element.stroke || element.accentColor || '#BEFF01'}
                  onChange={c => updateElement(element.id, { stroke: c, accentColor: c })}
                  style={{ marginBottom: 0 }}
                />
              )}
            </>
          )}

          {showRadius && (
            <div>
              <Slider
                label="Bo góc viền"
                value={element.radius !== undefined ? element.radius : defaultRadius}
                min={0}
                max={32}
                step={2}
                display={v => `${v}px`}
                onChange={v => updateElement(element.id, { radius: v })}
              />
            </div>
          )}

          {showGlow && (
            <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <ToggleRow label="Hào quang phát sáng">
                <Toggle
                  checked={element.glowEffect !== false}
                  onChange={(checked: boolean) => updateElement(element.id, { glowEffect: checked })}
                />
              </ToggleRow>
            </div>
          )}

          {children}
        </div>
      )}
    </>
  );
};
