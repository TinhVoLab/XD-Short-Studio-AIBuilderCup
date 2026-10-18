import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton } from './common'
import { DataFlowNode, DataFlowData } from '@/types/scene'
import { Button, SegmentedControl, SectionHeader } from '@/components/ui'

export function DataFlowInspector({ element, updateElement }: InspectorProps) {
  const dataFlowData: DataFlowData = element.dataFlowData || {
    nodes: [
      { id: '1', label: 'Client', icon: '📱' },
      { id: '2', label: 'Server', icon: '☁️', subLabel: 'Process' },
      { id: '3', label: 'Database', icon: '🗄️' },
    ],
  }

  const nodes: DataFlowNode[] = dataFlowData.nodes || []
  const currentAccent = element.accentColor || '#00D4FF'
  const packetColor = dataFlowData.packetColor || currentAccent
  const wireColor = dataFlowData.wireColor || 'rgba(255, 255, 255, 0.2)'

  const updateNodes = (newNodes: DataFlowNode[]) => {
    updateElement(element.id, {
      dataFlowData: {
        ...dataFlowData,
        nodes: newNodes,
      },
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Luồng dữ liệu (Data flow)" />

        {/* Chuyển đổi Chiều Ngang / Chiều Dọc */}
        <div style={{ marginBottom: 10 }}>
          <SegmentedControl
            options={[
              { value: 'horizontal', label: 'Chiều ngang' },
              { value: 'vertical', label: 'Chiều dọc' }
            ]}
            value={dataFlowData.layout || 'horizontal'}
            onChange={(val) => {
              if (val === 'vertical') {
                updateElement(element.id, {
                  width: 240,
                  height: 320,
                  dataFlowData: { ...dataFlowData, layout: 'vertical' },
                })
              } else {
                updateElement(element.id, {
                  width: 360,
                  height: 120,
                  dataFlowData: { ...dataFlowData, layout: 'horizontal' },
                })
              }
            }}
            size="xs"
            fullWidth
          />
        </div>

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
                  dataFlowData: { ...dataFlowData, packetColor: c },
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
                  dataFlowData: { ...dataFlowData, wireColor: c },
                })
              }}
            />
          </div>
        </div>

        {/* Danh sách các Trạm (Nodes) */}
        <div
          style={{
            marginTop: 6,
            marginBottom: 8,
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
              Các trạm / node ({nodes.length})
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newNodes = [...nodes]
                const id = Date.now().toString()
                const icons = ['⚡', '🔒', '📦', '🤖', '📊', '🌐']
                const nextIcon = icons[newNodes.length % icons.length]
                newNodes.push({
                  id,
                  label: `Trạm ${newNodes.length + 1}`,
                  subLabel: 'Mô tả',
                  icon: nextIcon,
                })
                updateNodes(newNodes)
              }}
            >
              + Thêm Node
            </Button>
          </div>

          {nodes.map((node, idx) => (
            <div
              key={node.id || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginBottom: 8,
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Icon input */}
                <input
                  className={styles.input}
                  style={{
                    width: 32,
                    textAlign: 'center',
                    marginBottom: 0,
                    padding: '4px 2px',
                    fontSize: 13,
                  }}
                  value={node.icon || ''}
                  placeholder="Icon"
                  onChange={e => {
                    const newNodes = [...nodes]
                    newNodes[idx] = { ...newNodes[idx], icon: e.target.value }
                    updateNodes(newNodes)
                  }}
                />

                {/* Label input */}
                <input
                  className={styles.input}
                  style={{
                    flex: 1,
                    marginBottom: 0,
                    padding: '4px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  value={node.label || ''}
                  placeholder="Tên node (VD: Server)"
                  onChange={e => {
                    const newNodes = [...nodes]
                    newNodes[idx] = { ...newNodes[idx], label: e.target.value }
                    updateNodes(newNodes)
                  }}
                />

                {/* Delete button */}
                {nodes.length > 2 && (
                  <DeleteIconButton
                    title="Xóa node"
                    onClick={() => {
                      const newNodes = nodes.filter((_, i) => i !== idx)
                      updateNodes(newNodes)
                    }}
                   />
                )}
              </div>

              {/* Sublabel input */}
              <input
                className={styles.input}
                style={{
                  marginBottom: 0,
                  padding: '3px 6px',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.7)',
                }}
                value={node.subLabel || ''}
                placeholder="Mô tả phụ (VD: Xử lý AI, Lưu trữ...)"
                onChange={e => {
                  const newNodes = [...nodes]
                  newNodes[idx] = { ...newNodes[idx], subLabel: e.target.value }
                  updateNodes(newNodes)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
