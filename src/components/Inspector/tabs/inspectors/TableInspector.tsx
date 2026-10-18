import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function TableInspector({ element, updateElement }: InspectorProps) {
  const tableData: any = element.tableData || {}
  const headers = Array.isArray(tableData.headers) && tableData.headers.length > 0
    ? tableData.headers
    : ['Phương án A', 'Phương án B']

  const rawRows: any[] = Array.isArray(tableData.rows) && tableData.rows.length > 0
    ? tableData.rows
    : (Array.isArray(element.rows) && element.rows.length > 0
      ? element.rows
      : [
          ['$25K-60K', '$400-1.2K'],
          ['$4K-9K /th', '--'],
          ['Tự động', '$500-5K /lần'],
        ])

  const rawLabels: string[] = Array.isArray(tableData.labels) && tableData.labels.length > 0
    ? tableData.labels
    : (Array.isArray(tableData.rowLabels)
      ? tableData.rowLabels
      : ['Chi Phí Xây Dựng', 'Vận Hành', 'Bảo Trì'])

  const accentA = element.accentColor || element.color || '#BEFF01'
  const accentB = (element as any).secondAccent || (tableData as any).secondColor || (accentA === '#00D4FF' ? '#BEFF01' : '#00D4FF')

  const handleUpdateTable = (newHeaders: string[], newRows: any[], newLabels: string[], patchExtra?: any) => {
    updateElement(element.id, {
      tableData: {
        ...tableData,
        headers: newHeaders,
        rows: newRows,
        labels: newLabels,
        secondColor: patchExtra?.secondAccent || accentB,
      },
      ...patchExtra,
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Bảng so sánh (Comparison table)" />

        {/* Cấu hình 2 Cột So Sánh */}
        <div style={{ marginBottom: 10, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', display: 'block', marginBottom: 6 }}>
            Tiêu đề 2 cột
          </span>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ColorDot
                value={accentA}
                sm
                onChange={c => updateElement(element.id, { accentColor: c })}
              />
              <input
                className={styles.input}
                style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                value={headers[0] || ''}
                placeholder="Cột A"
                onChange={e => {
                  const newHeaders = [e.target.value, headers[1] || 'Phương án B']
                  handleUpdateTable(newHeaders, rawRows, rawLabels)
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ColorDot
                value={accentB}
                sm
                onChange={c => {
                  handleUpdateTable(headers, rawRows, rawLabels, { secondAccent: c })
                }}
              />
              <input
                className={styles.input}
                style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                value={headers[1] || ''}
                placeholder="Cột B"
                onChange={e => {
                  const newHeaders = [headers[0] || 'Phương án A', e.target.value]
                  handleUpdateTable(newHeaders, rawRows, rawLabels)
                }}
              />
            </div>
          </div>
        </div>

        {/* Danh Sách Các Hàng Tiêu Chí */}
        <div style={{ marginBottom: 10, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>
              Tiêu chí so sánh ({rawRows.length})
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newRows = [...rawRows, ['--', '--']]
                const newLabels = [...rawLabels, `Tiêu chí ${newRows.length + 1}`]
                handleUpdateTable(headers, newRows, newLabels)
              }}
            >
              + Thêm hàng
            </Button>
          </div>

          {rawRows.map((r: any, idx: number) => {
            const cells = Array.isArray(r) ? r : [String(r), '']
            const label = rawLabels[idx] || `Tiêu chí ${idx + 1}`

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 8,
                  padding: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Tên tiêu chí & Nút Xóa */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                    value={label}
                    placeholder="Tên tiêu chí"
                    onChange={e => {
                      const newLabels = [...rawLabels]
                      newLabels[idx] = e.target.value
                      handleUpdateTable(headers, rawRows, newLabels)
                    }}
                  />
                  {rawRows.length > 1 && (
                    <DeleteIconButton
                      onClick={() => {
                        const newRows = rawRows.filter((_, i) => i !== idx)
                        const newLabels = rawLabels.filter((_, i) => i !== idx)
                        handleUpdateTable(headers, newRows, newLabels)
                      }}
                    />
                  )}
                </div>

                {/* 2 Cột Giá trị */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0, padding: '3px 6px', fontSize: 10 }}
                    value={cells[0] ?? ''}
                    placeholder="Giá trị A"
                    onChange={e => {
                      const newRows = rawRows.map((row, i) => {
                        if (i !== idx) return row
                        const c = Array.isArray(row) ? [...row] : [String(row), '']
                        c[0] = e.target.value
                        return c
                      })
                      handleUpdateTable(headers, newRows, rawLabels)
                    }}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'var(--text-sub)' }}
                    value={cells[1] ?? ''}
                    placeholder="Giá trị B"
                    onChange={e => {
                      const newRows = rawRows.map((row, i) => {
                        if (i !== idx) return row
                        const c = Array.isArray(row) ? [...row] : [String(row), '']
                        c[1] = e.target.value
                        return c
                      })
                      handleUpdateTable(headers, newRows, rawLabels)
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Khung nền bảng */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền bảng"
          showBgColor={true}
          showRadius={true}
          defaultRadius={16}
          defaultBgColor="rgba(13, 20, 28, 0.95)"
        />
      </div>
      <div className={styles.divider} />
    </>
  )
}
