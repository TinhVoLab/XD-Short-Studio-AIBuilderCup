import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton } from './common'
import { MindmapFlowData, MindmapBranchItem } from '@/types/scene'
import { Button, SegmentedControl, SectionHeader } from '@/components/ui'

export function MindmapFlowInspector({ element, updateElement }: InspectorProps) {
  const data: MindmapFlowData = element.mindmapFlowData || {
    centerNode: { label: 'Atomic Habits', subLabel: 'Quy tắc 4 bước', icon: '🧠' },
    branches: [
      { id: 'b1', label: '1. Rõ Ràng', subLabel: 'Tạo gợi ý (Cue)', icon: '👁️', color: '#00D4FF', side: 'left' },
      { id: 'b2', label: '2. Hấp Dẫn', subLabel: 'Tạo khao khát', icon: '🔥', color: '#FFB800', side: 'left' },
      { id: 'b3', label: '3. Dễ Dàng', subLabel: 'Hành động nhỏ', icon: '⚡', color: '#BEFF01', side: 'right' },
      { id: 'b4', label: '4. Thỏa Mãn', subLabel: 'Phần thưởng ngay', icon: '🎁', color: '#00FF88', side: 'right' },
    ],
  }

  const centerNode = data.centerNode || {
    label: 'Atomic Habits',
    subLabel: 'Quy tắc 4 bước',
    icon: '🧠',
  }

  const branches = data.branches || []
  const currentAccent = element.accentColor || '#00D4FF'

  const updateCenter = (partial: Partial<typeof centerNode>) => {
    updateElement(element.id, {
      mindmapFlowData: {
        ...data,
        centerNode: { ...centerNode, ...partial },
      },
    })
  }

  const updateBranches = (newBranches: MindmapBranchItem[]) => {
    updateElement(element.id, {
      mindmapFlowData: {
        ...data,
        branches: newBranches,
      },
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Sơ đồ tư duy (Mindmap flow)" />

        {/* Nút chuyển đổi Ngang / Dọc */}
        <div style={{ marginBottom: 10 }}>
          <SegmentedControl
            options={[
              { value: 'horizontal', label: 'Chiều ngang' },
              { value: 'vertical', label: 'Chiều dọc' }
            ]}
            value={data.layout || 'horizontal'}
            onChange={(val) => {
              updateElement(element.id, {
                mindmapFlowData: { ...data, layout: val as any },
              })
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* ── 1. CẤU HÌNH NODE TRUNG TÂM (CENTER CORE) ── */}
        <div
          style={{
            marginBottom: 12,
            padding: '8px 8px',
            background: 'rgba(0, 212, 255, 0.05)',
            borderRadius: 8,
            border: `1px solid ${currentAccent}33`,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: currentAccent, display: 'block', marginBottom: 6 }}>
            Chủ đề trung tâm
          </span>

          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              className={styles.input}
              style={{ width: 32, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 13 }}
              value={centerNode.icon || ''}
              placeholder="Icon"
              onChange={e => updateCenter({ icon: e.target.value })}
            />
            <input
              className={styles.input}
              style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
              value={centerNode.label}
              placeholder="Tiêu đề chính"
              onChange={e => updateCenter({ label: e.target.value })}
            />
          </div>

          <input
            className={styles.input}
            style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
            value={centerNode.subLabel || ''}
            placeholder="Mô tả / Tác giả"
            onChange={e => updateCenter({ subLabel: e.target.value })}
          />
        </div>

        {/* ── 2. CẤU HÌNH CÁC NHÁNH TỎA 2 BÊN ── */}
        <div
          style={{
            padding: '8px 8px',
            background: 'rgba(0,0,0,0.2)',
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
              Danh sách nhánh ({branches.length})
            </span>
            {branches.length < 6 && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  const newBranches = [...branches]
                  const id = Date.now().toString()
                  const colors = ['#00D4FF', '#FFB800', '#BEFF01', '#00FF88', '#FF5544', '#C084FC']
                  const nextColor = colors[newBranches.length % colors.length]
                  const nextSide = newBranches.length % 2 === 0 ? 'left' : 'right'
                  newBranches.push({
                    id,
                    label: `Ý chính ${newBranches.length + 1}`,
                    subLabel: 'Mô tả chi tiết',
                    icon: '💡',
                    color: nextColor,
                    side: nextSide,
                  })
                  updateBranches(newBranches)
                }}
              >
                + Thêm Nhánh
              </Button>
            )}
          </div>

          {branches.map((branch, idx) => (
            <div
              key={branch.id || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 8,
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                border: `1px solid ${branch.color || currentAccent}44`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ColorDot
                  value={branch.color || currentAccent}
                  sm
                  onChange={c => {
                    const newBranches = [...branches]
                    newBranches[idx] = { ...newBranches[idx], color: c }
                    updateBranches(newBranches)
                  }}
                />

                <input
                  className={styles.input}
                  style={{ width: 28, textAlign: 'center', marginBottom: 0, padding: '3px 2px', fontSize: 12 }}
                  value={branch.icon || ''}
                  placeholder="Icon"
                  onChange={e => {
                    const newBranches = [...branches]
                    newBranches[idx] = { ...newBranches[idx], icon: e.target.value }
                    updateBranches(newBranches)
                  }}
                />

                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '3px 6px', fontSize: 11, fontWeight: 700 }}
                  value={branch.label}
                  placeholder="Tên nhánh"
                  onChange={e => {
                    const newBranches = [...branches]
                    newBranches[idx] = { ...newBranches[idx], label: e.target.value }
                    updateBranches(newBranches)
                  }}
                />

                {/* Nút chọn cánh Trái / Phải hoặc Trên / Dưới */}
                <button
                  style={{
                    background: branch.side === 'left' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    borderRadius: 4,
                    fontSize: 10,
                    padding: '2px 5px',
                    cursor: 'pointer',
                  }}
                  title={data.layout === 'vertical' ? 'Đổi vị trí Trên / Dưới' : 'Đổi vị trí Trái / Phải'}
                  onClick={() => {
                    const newBranches = [...branches]
                    newBranches[idx] = { ...newBranches[idx], side: branch.side === 'left' ? 'right' : 'left' }
                    updateBranches(newBranches)
                  }}
                >
                  {data.layout === 'vertical'
                    ? (branch.side === 'left' ? 'Trên' : 'Dưới')
                    : (branch.side === 'left' ? 'Trái' : 'Phải')}
                </button>

                {branches.length > 2 && (
                  <DeleteIconButton
                    title="Xóa nhánh"
                    onClick={() => {
                      const newBranches = branches.filter((_, i) => i !== idx)
                      updateBranches(newBranches)
                    }}
                   />
                )}
              </div>

              <input
                className={styles.input}
                style={{ marginBottom: 0, padding: '2px 6px', fontSize: 9.5, color: 'rgba(255,255,255,0.7)' }}
                value={branch.subLabel || ''}
                placeholder="Mô tả phụ"
                onChange={e => {
                  const newBranches = [...branches]
                  newBranches[idx] = { ...newBranches[idx], subLabel: e.target.value }
                  updateBranches(newBranches)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
