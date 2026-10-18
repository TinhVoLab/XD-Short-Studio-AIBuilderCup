import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton } from './common'
import { ParallelFlowData, ParallelFlowNode } from '@/types/scene'
import { Button, SegmentedControl, SectionHeader } from '@/components/ui'

export function ParallelFlowInspector({ element, updateElement }: InspectorProps) {
  const data: ParallelFlowData = element.parallelFlowData || {
    inputNode: { id: 'in', label: 'User Request', subLabel: 'Input Payload', icon: '📥' },
    parallelNodes: [
      { id: 'p1', label: 'Verify Auth', subLabel: 'JWT Token', icon: '🔒' },
      { id: 'p2', label: 'AI Inference', subLabel: 'Gemini 2.5', icon: '🧠' },
      { id: 'p3', label: 'Log Audit', subLabel: 'Kafka Stream', icon: '📝' },
    ],
    outputNode: { id: 'out', label: 'Response', subLabel: 'Status 200 OK', icon: '🚀' },
  }

  const inputNode: ParallelFlowNode = data.inputNode || {
    id: 'in',
    label: 'User Request',
    subLabel: 'Input Payload',
    icon: '📥',
  }

  const parallelNodes: ParallelFlowNode[] = data.parallelNodes || []
  const outputNode: ParallelFlowNode = data.outputNode || {
    id: 'out',
    label: 'Response',
    subLabel: 'Status 200 OK',
    icon: '🚀',
  }

  const currentAccent = element.accentColor || '#00D4FF'
  const packetColor = data.packetColor || currentAccent
  const wireColor = data.wireColor || 'rgba(255, 255, 255, 0.2)'

  const updateInput = (partial: Partial<ParallelFlowNode>) => {
    updateElement(element.id, {
      parallelFlowData: {
        ...data,
        inputNode: { ...inputNode, ...partial },
      },
    })
  }

  const updateOutput = (partial: Partial<ParallelFlowNode>) => {
    updateElement(element.id, {
      parallelFlowData: {
        ...data,
        outputNode: { ...outputNode, ...partial },
      },
    })
  }

  const updateParallel = (newParallel: ParallelFlowNode[]) => {
    updateElement(element.id, {
      parallelFlowData: {
        ...data,
        parallelNodes: newParallel,
      },
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Xử lý song song (Parallel flow)" />

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
                  parallelFlowData: { ...data, packetColor: c },
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
                  parallelFlowData: { ...data, wireColor: c },
                })
              }}
            />
          </div>
        </div>

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
                parallelFlowData: { ...data, layout: val as any },
              })
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* ── 1. CẤU HÌNH TRẠM ĐẦU VÀO (INPUT) ── */}
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
            Trạm đầu vào (Input)
          </span>

          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              className={styles.input}
              style={{ width: 32, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 13 }}
              value={inputNode.icon || ''}
              placeholder="Icon"
              onChange={e => updateInput({ icon: e.target.value })}
            />
            <input
              className={styles.input}
              style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
              value={inputNode.label}
              placeholder="Tên Input"
              onChange={e => updateInput({ label: e.target.value })}
            />
          </div>

          <input
            className={styles.input}
            style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
            value={inputNode.subLabel || ''}
            placeholder="Mô tả phụ"
            onChange={e => updateInput({ subLabel: e.target.value })}
          />
        </div>

        {/* ── 2. CẤU HÌNH CÁC TASK SONG SONG Ở GIỮA ── */}
        <div
          style={{
            marginBottom: 10,
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
              Luồng Xử Lý Song Song ({parallelNodes.length})
            </span>
            {parallelNodes.length < 4 && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  const newParallel = [...parallelNodes]
                  const id = Date.now().toString()
                  const icons = ['🔒', '🧠', '📝', '⚡', '📊', '🤖']
                  const nextIcon = icons[newParallel.length % icons.length]
                  newParallel.push({
                    id,
                    label: `Task ${newParallel.length + 1}`,
                    subLabel: 'Running Task',
                    icon: nextIcon,
                  })
                  updateParallel(newParallel)
                }}
              >
                + Thêm Task
              </Button>
            )}
          </div>

          {parallelNodes.map((pNode, idx) => (
            <div
              key={pNode.id || idx}
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
                  value={pNode.icon || ''}
                  placeholder="Icon"
                  onChange={e => {
                    const newParallel = [...parallelNodes]
                    newParallel[idx] = { ...newParallel[idx], icon: e.target.value }
                    updateParallel(newParallel)
                  }}
                />

                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                  value={pNode.label}
                  placeholder="Tên task"
                  onChange={e => {
                    const newParallel = [...parallelNodes]
                    newParallel[idx] = { ...newParallel[idx], label: e.target.value }
                    updateParallel(newParallel)
                  }}
                />

                {parallelNodes.length > 2 && (
                  <DeleteIconButton
                    title="Xóa luồng"
                    onClick={() => {
                      const newParallel = parallelNodes.filter((_, i) => i !== idx)
                      updateParallel(newParallel)
                    }}
                  />
                )}
              </div>

              <input
                className={styles.input}
                style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
                value={pNode.subLabel || ''}
                placeholder="Mô tả task"
                onChange={e => {
                  const newParallel = [...parallelNodes]
                  newParallel[idx] = { ...newParallel[idx], subLabel: e.target.value }
                  updateParallel(newParallel)
                }}
              />
            </div>
          ))}
        </div>

        {/* ── 3. CẤU HÌNH TRẠM ĐẦU RA (OUTPUT) ── */}
        <div
          style={{
            padding: '8px 6px',
            background: 'rgba(0, 255, 136, 0.05)',
            borderRadius: 8,
            border: '1px solid rgba(0, 255, 136, 0.3)',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF88', display: 'block', marginBottom: 6 }}>
            Trạm đầu ra (Output)
          </span>

          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              className={styles.input}
              style={{ width: 32, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 13 }}
              value={outputNode.icon || ''}
              placeholder="Icon"
              onChange={e => updateOutput({ icon: e.target.value })}
            />
            <input
              className={styles.input}
              style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
              value={outputNode.label}
              placeholder="Tên Output"
              onChange={e => updateOutput({ label: e.target.value })}
            />
          </div>

          <input
            className={styles.input}
            style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
            value={outputNode.subLabel || ''}
            placeholder="Mô tả kết quả"
            onChange={e => updateOutput({ subLabel: e.target.value })}
          />
        </div>
      </div>
    </>
  )
}
