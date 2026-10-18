import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton } from './common'
import { BranchingFlowData, BranchingFlowNode } from '@/types/scene'
import { Button, SegmentedControl, SectionHeader } from '@/components/ui'

export function BranchingFlowInspector({ element, updateElement }: InspectorProps) {
  const data: BranchingFlowData = element.branchingFlowData || {
    rootNode: { id: 'root', label: 'API Gateway', subLabel: 'Load Balancer', icon: '🌐' },
    childNodes: [
      { id: 'c1', label: 'Auth Server', subLabel: 'Port 8081', icon: '🔒' },
      { id: 'c2', label: 'AI Worker', subLabel: 'LLM Agent', icon: '🧠' },
      { id: 'c3', label: 'Database', subLabel: 'PostgreSQL', icon: '🗄️' },
    ],
  }

  const rootNode: BranchingFlowNode = data.rootNode || {
    id: 'root',
    label: 'API Gateway',
    subLabel: 'Load Balancer',
    icon: '🌐',
  }

  const childNodes: BranchingFlowNode[] = data.childNodes || []
  const currentAccent = element.accentColor || '#00D4FF'
  const packetColor = data.packetColor || currentAccent
  const wireColor = data.wireColor || 'rgba(255, 255, 255, 0.2)'

  const updateRoot = (partial: Partial<BranchingFlowNode>) => {
    updateElement(element.id, {
      branchingFlowData: {
        ...data,
        rootNode: { ...rootNode, ...partial },
      },
    })
  }

  const updateChildren = (newChildren: BranchingFlowNode[]) => {
    updateElement(element.id, {
      branchingFlowData: {
        ...data,
        childNodes: newChildren,
      },
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Sơ đồ rẽ nhánh (Branching flow)" />

        {/* Cấu hình màu sắc tia sáng & đường dây */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Hạt sáng:</span>
            <ColorDot
              value={packetColor}
              sm
              onChange={c => {
                updateElement(element.id, {
                  branchingFlowData: { ...data, packetColor: c },
                })
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Đường dây:</span>
            <ColorDot
              value={wireColor}
              sm
              onChange={c => {
                updateElement(element.id, {
                  branchingFlowData: { ...data, wireColor: c },
                })
              }}
            />
          </div>
        </div>

        {/* Layout Switcher */}
        <div style={{ marginBottom: 10 }}>
          <SegmentedControl
            options={[
              { value: 'horizontal', label: 'Chiều ngang' },
              { value: 'vertical', label: 'Chiều dọc' }
            ]}
            value={data.layout || 'horizontal'}
            onChange={(val) => {
              updateElement(element.id, {
                branchingFlowData: { ...data, layout: val as any },
              })
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* ── 1. CẤU HÌNH TRẠM GỐC (ROOT NODE) ── */}
        <div
          style={{
            marginBottom: 10,
            padding: '8px 6px',
            background: 'rgba(0, 212, 255, 0.05)',
            borderRadius: 8,
            border: `1px solid ${currentAccent}33`,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: currentAccent, display: 'block', marginBottom: 6 }}>
            Trạm gốc (Master node)
          </span>

          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              className={styles.input}
              style={{ width: 32, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 13 }}
              value={rootNode.icon || ''}
              placeholder="Icon"
              onChange={e => updateRoot({ icon: e.target.value })}
            />
            <input
              className={styles.input}
              style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
              value={rootNode.label}
              placeholder="Tên trạm gốc (VD: API Gateway)"
              onChange={e => updateRoot({ label: e.target.value })}
            />
          </div>

          <input
            className={styles.input}
            style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
            value={rootNode.subLabel || ''}
            placeholder="Mô tả phụ (VD: Load Balancer, Trụ sở chính...)"
            onChange={e => updateRoot({ subLabel: e.target.value })}
          />
        </div>

        {/* ── 2. CẤU HÌNH CÁC TRẠM CON (CHILD NODES) ── */}
        <div
          style={{
            padding: '8px 6px',
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
              Trạm con / Nhánh rẽ ({childNodes.length})
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newChildren = [...childNodes]
                const id = Date.now().toString()
                const icons = ['🔒', '🧠', '🗄️', '⚡', '📊', '🤖']
                const nextIcon = icons[newChildren.length % icons.length]
                newChildren.push({
                  id,
                  label: `Nhánh ${newChildren.length + 1}`,
                  subLabel: 'Mô tả nhánh',
                  icon: nextIcon,
                })
                updateChildren(newChildren)
              }}
            >
              + Thêm Trạm
            </Button>
          </div>

          {childNodes.map((child, idx) => (
            <div
              key={child.id || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 6,
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  className={styles.input}
                  style={{ width: 30, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 12 }}
                  value={child.icon || ''}
                  placeholder="Icon"
                  onChange={e => {
                    const newChildren = [...childNodes]
                    newChildren[idx] = { ...newChildren[idx], icon: e.target.value }
                    updateChildren(newChildren)
                  }}
                />

                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                  value={child.label}
                  placeholder="Tên nhánh"
                  onChange={e => {
                    const newChildren = [...childNodes]
                    newChildren[idx] = { ...newChildren[idx], label: e.target.value }
                    updateChildren(newChildren)
                  }}
                />

                {childNodes.length > 2 && (
                  <DeleteIconButton
                    title="Xóa nhánh"
                    onClick={() => {
                      const newChildren = childNodes.filter((_, i) => i !== idx)
                      updateChildren(newChildren)
                    }}
                  />
                )}
              </div>

              <input
                className={styles.input}
                style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
                value={child.subLabel || ''}
                placeholder="Mô tả nhánh"
                onChange={e => {
                  const newChildren = [...childNodes]
                  newChildren[idx] = { ...newChildren[idx], subLabel: e.target.value }
                  updateChildren(newChildren)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
