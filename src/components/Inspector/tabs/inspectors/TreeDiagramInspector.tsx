import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function TreeDiagramInspector({ element, updateElement, showToast, setInspector }: InspectorProps) {
  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Sơ đồ cây phân cấp (Tree diagram)" />

            <div style={{ marginBottom: 6 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề biểu đồ</span>
              <input
                className={styles.input}
                value={element.treeData?.title || element.content || ''}
                onChange={e => {
                  const currentData = element.treeData || { rootNode: { label: 'AI SYSTEM', icon: '🤖' }, branches: [] };
                  updateElement(element.id, {
                    content: e.target.value,
                    treeData: { ...currentData, title: e.target.value }
                  });
                }}
                placeholder="VD: LỘ TRÌNH TECH STACK..."
              />
            </div>

            {/* Root Node Editor */}
            <div className={styles.row2} style={{ marginBottom: 6 }}>
              <div style={{ width: 56, minWidth: 56 }}>
                <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>Icon gốc</span>
                <input
                  className={styles.input}
                  style={{ textAlign: 'center' }}
                  value={element.treeData?.rootNode?.icon || '🤖'}
                  onChange={e => {
                    const currentData = element.treeData || { title: 'LỘ TRÌNH', branches: [], rootNode: { label: 'AI SYSTEM', icon: '🤖' } };
                    updateElement(element.id, {
                      treeData: {
                        ...currentData,
                        rootNode: { ...currentData.rootNode, icon: e.target.value }
                      }
                    });
                  }}
                  placeholder="Icon"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>Tên nút gốc (Root)</span>
                <input
                  className={styles.input}
                  value={element.treeData?.rootNode?.label || 'AI SYSTEM'}
                  onChange={e => {
                    const currentData = element.treeData || { title: 'LỘ TRÌNH', branches: [], rootNode: { label: 'AI SYSTEM', icon: '🤖' } };
                    updateElement(element.id, {
                      treeData: {
                        ...currentData,
                        rootNode: { ...currentData.rootNode, label: e.target.value }
                      }
                    });
                  }}
                  placeholder="VD: AI SYSTEM"
                />
              </div>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 8 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Mẫu có sẵn</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Button
                  variant="pill"
                  size="xs"
                  onClick={() => {
                    updateElement(element.id, {
                      content: 'AI TECH STACK',
                      treeData: {
                        title: 'AI TECH STACK',
                        rootNode: { label: 'AI AGENT', icon: '🤖' },
                        branches: [
                          { group: 'Frontend', items: ['React', 'Remotion'], color: '#00D4FF' },
                          { group: 'Backend', items: ['Node.js', 'Express'], color: '#00FF88' },
                          { group: 'AI Core', items: ['Gemini', 'LLM Agents'], color: '#FFB800' }
                        ]
                      }
                    });
                  }}
                >
                  Tech Stack
                </Button>

                <Button
                  variant="pill"
                  size="xs"
                  onClick={() => {
                    updateElement(element.id, {
                      content: 'PHỄU MARKETING',
                      treeData: {
                        title: 'PHỄU MARKETING',
                        rootNode: { label: 'GROWTH ENGINE', icon: '🚀' },
                        branches: [
                          { group: 'Thu hút', items: ['SEO', 'TikTok Ads'], color: '#00D4FF' },
                          { group: 'Chuyển đổi', items: ['Landing Page', 'Offer'], color: '#BEFF01' },
                          { group: 'Giữ chân', items: ['Email Automation', 'VIP'], color: '#FFB800' }
                        ]
                      }
                    });
                  }}
                >
                  Marketing
                </Button>
              </div>
            </div>

            {/* Branches List Editor */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Danh sách nhánh ({element.treeData?.branches?.length || 3})</span>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    const currentData = element.treeData || { title: 'LỘ TRÌNH', rootNode: { label: 'AI SYSTEM', icon: '🤖' }, branches: [] };
                    const branches = [...(currentData.branches || [])];
                    branches.push({ group: `Nhánh ${branches.length + 1}`, items: ['Mục 1', 'Mục 2'], color: '#00D4FF' });
                    updateElement(element.id, { treeData: { ...currentData, branches } });
                  }}
                >
                  + Thêm nhánh
                </Button>
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
                {(element.treeData?.branches || [
                  { group: 'Frontend', items: ['React', 'Remotion'], color: '#00D4FF' },
                  { group: 'Backend', items: ['Node.js', 'Express'], color: '#00FF88' },
                  { group: 'AI Core', items: ['Gemini', 'LLM Agents'], color: '#FFB800' }
                ]).map((b, bIdx) => (
                  <div key={bIdx} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <ColorDot
                        value={b.color || '#00D4FF'}
                        sm
                        onChange={c => {
                          const currentData = element.treeData || { title: 'LỘ TRÌNH', rootNode: { label: 'AI SYSTEM', icon: '🤖' }, branches: [] };
                          const branches = [...(currentData.branches || [])];
                          branches[bIdx] = { ...branches[bIdx], color: c };
                          updateElement(element.id, { treeData: { ...currentData, branches } });
                        }}
                      />
                      <input
                        style={{ flex: 1, fontSize: 11, padding: '3px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 4 }}
                        value={b.group}
                        onChange={e => {
                          const currentData = element.treeData || { title: 'LỘ TRÌNH', rootNode: { label: 'AI SYSTEM', icon: '🤖' }, branches: [] };
                          const branches = [...(currentData.branches || [])];
                          branches[bIdx] = { ...branches[bIdx], group: e.target.value };
                          updateElement(element.id, { treeData: { ...currentData, branches } });
                        }}
                        placeholder="Tên nhóm / nhánh"
                      />
                      <DeleteIconButton
                        onClick={() => {
                          const currentData = element.treeData || { title: 'LỘ TRÌNH', rootNode: { label: 'AI SYSTEM', icon: '🤖' }, branches: [] };
                          const branches = (currentData.branches || []).filter((_, i) => i !== bIdx);
                          updateElement(element.id, { treeData: { ...currentData, branches } });
                        }}
                        title="Xóa nhánh này"
                      />
                    </div>
                    <div>
                      <input
                        style={{ width: '100%', fontSize: 10, padding: '3px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 4, boxSizing: 'border-box' }}
                        value={(b.items || []).join(', ')}
                        onChange={e => {
                          const currentData = element.treeData || { title: 'LỘ TRÌNH', rootNode: { label: 'AI SYSTEM', icon: '🤖' }, branches: [] };
                          const branches = [...(currentData.branches || [])];
                          const newItems = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          branches[bIdx] = { ...branches[bIdx], items: newItems };
                          updateElement(element.id, { treeData: { ...currentData, branches } });
                        }}
                        placeholder="Các thẻ con, phân cách bằng dấu phẩy (,)"
                        title="Nhập các thẻ con cách nhau bằng dấu phẩy"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ColorControlRow
              label="Màu chủ đạo"
              value={element.accentColor || '#00D4FF'}
              onChange={c => updateElement(element.id, { accentColor: c, color: c })}
            />

            {/* Khung nền sơ đồ */}
            <CardBackgroundControl
              element={element}
              updateElement={updateElement}
              label="Khung nền sơ đồ"
              showWidth={true}
              showBgColor={true}
              showRadius={true}
              defaultRadius={16}
              defaultBgColor="rgba(10, 16, 28, 0.95)"
            />
          </div>
          <div className={styles.divider} />
        </>
  )
}
