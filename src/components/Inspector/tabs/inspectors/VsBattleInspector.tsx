import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton, ToggleRow, Toggle } from './common'
import { Button, SectionHeader, SegmentedControl } from '@/components/ui'
import { VsBattleRound } from '@/types/scene'

export function VsBattleInspector({ element, updateElement }: InspectorProps) {
  const vsData = element.vsBattle || {
    leftSubject: { name: 'Phe A', color: '#BEFF01' },
    rightSubject: { name: 'Phe B', color: '#00D4FF' },
    rounds: [
      { criterion: 'Tốc độ phản hồi', winner: 'left' as const, leftValue: '0.8s', rightValue: '1.2s' },
      { criterion: 'Chi phí / tháng', winner: 'right' as const, leftValue: '$20', rightValue: 'Free' },
      { criterion: 'Khả năng xử lý', winner: 'left' as const, leftValue: '95/100', rightValue: '88/100' },
    ],
    showWinner: true,
  }

  const leftSub = vsData.leftSubject || { name: 'Phe A', color: '#BEFF01' }
  const rightSub = vsData.rightSubject || { name: 'Phe B', color: '#00D4FF' }
  const rounds = vsData.rounds || []

  const updateVsData = (patch: Partial<typeof vsData>) => {
    updateElement(element.id, {
      vsBattle: {
        ...vsData,
        ...patch,
      },
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Đọ sức đối đầu (VS battle)" />

        {/* Cấu hình 2 Phe Đối Đầu */}
        <div style={{ marginBottom: 10, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>
            2 phe đối đầu
          </span>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {/* Phe Trái */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ColorDot
                value={leftSub.color || '#BEFF01'}
                sm
                onChange={c => {
                  updateVsData({ leftSubject: { ...leftSub, color: c } })
                }}
              />
              <input
                className={styles.input}
                style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                value={leftSub.name}
                placeholder="Phe Trái"
                onChange={e => {
                  updateVsData({ leftSubject: { ...leftSub, name: e.target.value } })
                }}
              />
            </div>
            {/* Phe Phải */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ColorDot
                value={rightSub.color || '#00D4FF'}
                sm
                onChange={c => {
                  updateVsData({ rightSubject: { ...rightSub, color: c } })
                }}
              />
              <input
                className={styles.input}
                style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                value={rightSub.name}
                placeholder="Phe Phải"
                onChange={e => {
                  updateVsData({ rightSubject: { ...rightSub, name: e.target.value } })
                }}
              />
            </div>
          </div>
        </div>

        {/* Danh Sách Vòng Đấu (Rounds) */}
        <div style={{ marginBottom: 10, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>
              Các hiệp so sánh ({rounds.length})
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newRounds: VsBattleRound[] = [
                  ...rounds,
                  {
                    criterion: `Tiêu chí ${rounds.length + 1}`,
                    winner: 'left',
                    leftValue: 'Tốt',
                    rightValue: 'Khá',
                  },
                ]
                updateVsData({ rounds: newRounds })
              }}
            >
              + Thêm hiệp
            </Button>
          </div>

          {rounds.map((r, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                marginBottom: 8,
                padding: '6px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Tiêu chí & Nút Xóa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--text-muted)', width: 22 }}>
                  R{idx + 1}
                </span>
                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                  value={r.criterion}
                  placeholder="Tiêu chí so sánh"
                  onChange={e => {
                    const newRounds = [...rounds]
                    newRounds[idx] = { ...newRounds[idx], criterion: e.target.value }
                    updateVsData({ rounds: newRounds })
                  }}
                />
                {rounds.length > 1 && (
                  <DeleteIconButton
                    onClick={() => {
                      const newRounds = rounds.filter((_, i) => i !== idx)
                      updateVsData({ rounds: newRounds })
                    }}
                  />
                )}
              </div>

              {/* 2 Giá trị so sánh */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '3px 6px', fontSize: 10 }}
                  value={r.leftValue || ''}
                  placeholder="Điểm/Giá trị Trái"
                  onChange={e => {
                    const newRounds = [...rounds]
                    newRounds[idx] = { ...newRounds[idx], leftValue: e.target.value }
                    updateVsData({ rounds: newRounds })
                  }}
                />
                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'var(--text-sub)' }}
                  value={r.rightValue || ''}
                  placeholder="Điểm/Giá trị Phải"
                  onChange={e => {
                    const newRounds = [...rounds]
                    newRounds[idx] = { ...newRounds[idx], rightValue: e.target.value }
                    updateVsData({ rounds: newRounds })
                  }}
                />
              </div>

              {/* Lựa chọn Người Thắng */}
              <div style={{ marginTop: 2 }}>
                <SegmentedControl
                  size="xs"
                  value={r.winner}
                  onChange={(val: string) => {
                    const newRounds = [...rounds]
                    newRounds[idx] = { ...newRounds[idx], winner: val as 'left' | 'right' | 'tie' }
                    updateVsData({ rounds: newRounds })
                  }}
                  options={[
                    { value: 'left', label: `${leftSub.name || 'Trái'} Thắng` },
                    { value: 'tie', label: 'Hòa' },
                    { value: 'right', label: `${rightSub.name || 'Phải'} Thắng` },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Cấu hình Winner Banner */}
        <ToggleRow label="Banner vinh danh người thắng">
          <Toggle
            checked={vsData.showWinner !== false}
            onChange={checked => updateVsData({ showWinner: checked })}
          />
        </ToggleRow>
      </div>
      <div className={styles.divider} />
    </>
  )
}
