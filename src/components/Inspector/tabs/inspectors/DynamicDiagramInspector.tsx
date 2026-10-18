import React from 'react';
import styles from '../Tabs.module.css';
import {
  InspectorProps,
  ColorDot,
  Toggle,
  ToggleRow,
  ColorControlRow,
  CardBackgroundControl,
} from './common';
import { SectionHeader, Button, SegmentedControl } from '@/components/ui';
import { DynamicDiagramData } from '@/types/scene';

export function DynamicDiagramInspector({ element, updateElement, showToast }: InspectorProps) {
  const diagramData: DynamicDiagramData = element.diagramData || {
    title: 'QUY TRÌNH HỆ THỐNG',
    nodes: [],
    edges: [],
  };

  const isTitleOn = element.showTitle !== false && Boolean(diagramData.title?.trim());
  const currentAccent = element.accentColor || '#BEFF01';
  const nodes = diagramData.nodes || [];

  const handleTitleChange = (newTitle: string) => {
    updateElement(element.id, {
      diagramData: {
        ...diagramData,
        title: newTitle,
      },
    });
  };

  const handleToggleTitle = (checked: boolean) => {
    updateElement(element.id, {
      showTitle: checked,
      ...(checked && !diagramData.title?.trim() ? {
        diagramData: {
          ...diagramData,
          title: 'SƠ ĐỒ HỆ THỐNG',
        },
      } : {}),
    });
  };

  const handleThemeChange = (newTheme: 'cyber' | 'minimalist' | 'pastel') => {
    updateElement(element.id, {
      diagramData: {
        ...diagramData,
        theme: newTheme,
      },
    });
  };

  const handleTimingModeChange = (newMode: 'auto' | 'fast') => {
    updateElement(element.id, {
      diagramData: {
        ...diagramData,
        timingMode: newMode,
      },
    });
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Đồ thị vector động (Dynamic Diagram)" />

        {/* 1. Tiêu đề sơ đồ */}
        <div style={{ marginBottom: 10 }}>
          <ToggleRow label="Hiện tiêu đề sơ đồ">
            <Toggle checked={isTitleOn} onChange={handleToggleTitle} />
          </ToggleRow>

          {isTitleOn && (
            <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>
                Nội dung tiêu đề
              </span>
              <input
                className={styles.input}
                value={diagramData.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="VD: SƠ ĐỒ QUY TRÌNH HỆ THỐNG..."
              />
            </div>
          )}
        </div>

        {/* 2. Phong cách thị giác (Visual Theme) */}
        <div style={{ marginBottom: 10 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>
            Phong cách đồ thị
          </span>
          <SegmentedControl<'cyber' | 'minimalist' | 'pastel'>
            value={(diagramData.theme || 'cyber') as 'cyber' | 'minimalist' | 'pastel'}
            onChange={handleThemeChange}
            size="xs"
            fullWidth
            options={[
              { value: 'cyber', label: 'Cyber Glow' },
              { value: 'minimalist', label: 'Tối giản' },
              { value: 'pastel', label: 'Pastel' },
            ]}
          />
        </div>

        {/* 3. Nhịp điệu hiển thị (Reveal Timing) */}
        <div style={{ marginBottom: 10 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>
            Nhịp điệu hiển thị
          </span>
          <SegmentedControl<'auto' | 'fast'>
            value={(diagramData.timingMode || 'auto') as 'auto' | 'fast'}
            onChange={handleTimingModeChange}
            size="xs"
            fullWidth
            options={[
              { value: 'auto', label: 'Theo cảnh (Chuẩn)' },
              { value: 'fast', label: 'Nhanh (1s)' },
            ]}
          />
        </div>

        {/* 4. Màu sắc chủ đạo */}
        <div style={{ marginBottom: 10 }}>
          <ColorControlRow
            label="Màu chủ đạo"
            value={currentAccent}
            onChange={(c) => updateElement(element.id, { accentColor: c })}
          />
        </div>

        {/* 5. Khung nền thẻ (Card vs Floating Transparent) */}
        <div style={{ marginBottom: 12 }}>
          <CardBackgroundControl
            element={element}
            updateElement={updateElement}
            label="Khung nền thẻ hộp"
            showWidth={true}
            showRadius={true}
            showBgColor={true}
            defaultBgColor="rgba(13, 17, 23, 0.88)"
            defaultRadius={12}
          />
        </div>

        {/* 4. Danh sách các nút liên kết (Nodes) */}
        {nodes.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>
                Các nút liên kết ({nodes.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {nodes.map((node, idx) => (
                <div
                  key={node.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <ColorDot
                    value={node.color || currentAccent}
                    sm
                    onChange={(c) => {
                      const newNodes = [...nodes];
                      newNodes[idx] = { ...newNodes[idx], color: c };
                      updateElement(element.id, {
                        diagramData: {
                          ...diagramData,
                          nodes: newNodes,
                        },
                      });
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      className={styles.input}
                      style={{ height: 24, fontSize: 11, padding: '2px 6px' }}
                      value={node.label || ''}
                      onChange={(e) => {
                        const newNodes = [...nodes];
                        newNodes[idx] = { ...newNodes[idx], label: e.target.value };
                        updateElement(element.id, {
                          diagramData: {
                            ...diagramData,
                            nodes: newNodes,
                          },
                        });
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      padding: '2px 4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 3,
                    }}
                  >
                    {node.shape || 'rect'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
