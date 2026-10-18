import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, DeleteIconButton, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function CandlestickInspector({ element, updateElement }: InspectorProps) {
  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Biểu đồ nến Nhật" />

            <div className={styles.row2} style={{ marginBottom: 6 }}>
              <div style={{ minWidth: 0 }}>
                <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>Cặp tiền / Mã</span>
                <input
                  className={styles.input}
                  value={element.candlestickData?.symbol || 'BTC / USDT'}
                  onChange={e => {
                    const val = e.target.value
                    const currentData = element.candlestickData || { currentPrice: '$98,450.00', changePct: '+8.45%', candles: [] }
                    updateElement(element.id, { candlestickData: { ...currentData, symbol: val } })
                  }}
                  placeholder="BTC / USDT"
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>Giá hiện tại</span>
                <input
                  className={styles.input}
                  value={element.candlestickData?.currentPrice || '$98,450.00'}
                  onChange={e => {
                    const val = e.target.value
                    const currentData = element.candlestickData || { symbol: 'BTC / USDT', changePct: '+8.45%', candles: [] }
                    updateElement(element.id, { candlestickData: { ...currentData, currentPrice: val } })
                  }}
                  placeholder="$98,450.00"
                />
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>% Tăng / Giảm (VD: +8.45% hoặc -3.2%)</span>
              <input
                className={styles.input}
                value={element.candlestickData?.changePct || '+8.45%'}
                onChange={e => {
                  const val = e.target.value
                  const currentData = element.candlestickData || { symbol: 'BTC / USDT', currentPrice: '$98,450.00', candles: [] }
                  updateElement(element.id, { candlestickData: { ...currentData, changePct: val } })
                }}
                placeholder="+8.45%"
              />
            </div>

            {/* Candles List Editor */}
            <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách nến</span>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    const currentData = element.candlestickData || { symbol: 'BTC / USDT', currentPrice: '$98,450.00', changePct: '+8.45%', candles: [] }
                    const candles = [...(currentData.candles || [])];
                    const lastC = candles[candles.length - 1] || { close: 95000 };
                    candles.push({ open: lastC.close, high: lastC.close + 2000, low: lastC.close - 1000, close: lastC.close + 1500, label: 'Live' });
                    updateElement(element.id, { candlestickData: { ...currentData, candles } });
                  }}
                >
                  + Thêm nến
                </Button>
              </div>

              {(element.candlestickData?.candles || [
                { open: 92000, high: 93500, low: 91200, close: 93200, label: '09:00' },
                { open: 93200, high: 94800, low: 92800, close: 94500, label: '12:00' },
                { open: 94500, high: 95200, low: 93600, close: 94000, label: '15:00' },
                { open: 94000, high: 96800, low: 93800, close: 96200, label: '18:00' },
                { open: 96200, high: 97500, low: 95500, close: 96800, label: '21:00' },
                { open: 96800, high: 99200, low: 96400, close: 98450, label: 'Live' },
              ]).map((c, idx) => {
                const isGreen = c.close >= c.open;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: isGreen ? '#00FF88' : '#FF3366', width: 14 }}>
                      {isGreen ? '▲' : '▼'}
                    </span>
                    <input
                      className={styles.input}
                      style={{ width: 48, marginBottom: 0, padding: '4px 4px', fontSize: 10.5 }}
                      value={c.label || ''}
                      placeholder="Giờ"
                      onChange={e => {
                        const currentData = element.candlestickData || { symbol: 'BTC / USDT', currentPrice: '$98,450.00', changePct: '+8.45%', candles: [] }
                        const candles = [...(currentData.candles || [])];
                        candles[idx] = { ...candles[idx], label: e.target.value };
                        updateElement(element.id, { candlestickData: { ...currentData, candles } });
                      }}
                    />
                    <input
                      type="number"
                      className={styles.input}
                      style={{ flex: 1, marginBottom: 0, padding: '4px 4px', fontSize: 10.5 }}
                      value={c.open}
                      placeholder="Mở cửa"
                      title="Giá Mở cửa"
                      onChange={e => {
                        const currentData = element.candlestickData || { symbol: 'BTC / USDT', currentPrice: '$98,450.00', changePct: '+8.45%', candles: [] }
                        const candles = [...(currentData.candles || [])];
                        candles[idx] = { ...candles[idx], open: +e.target.value };
                        updateElement(element.id, { candlestickData: { ...currentData, candles } });
                      }}
                    />
                    <input
                      type="number"
                      className={styles.input}
                      style={{ flex: 1, marginBottom: 0, padding: '4px 4px', fontSize: 10.5 }}
                      value={c.close}
                      placeholder="Đóng cửa"
                      title="Giá Đóng cửa"
                      onChange={e => {
                        const currentData = element.candlestickData || { symbol: 'BTC / USDT', currentPrice: '$98,450.00', changePct: '+8.45%', candles: [] }
                        const candles = [...(currentData.candles || [])];
                        candles[idx] = { ...candles[idx], close: +e.target.value };
                        updateElement(element.id, { candlestickData: { ...currentData, candles } });
                      }}
                    />
                    <DeleteIconButton
                      onClick={() => {
                        const currentData = element.candlestickData || { symbol: 'BTC / USDT', currentPrice: '$98,450.00', changePct: '+8.45%', candles: [] }
                        const candles = (currentData.candles || []).filter((_, i) => i !== idx);
                        updateElement(element.id, { candlestickData: { ...currentData, candles } });
                      }}
                      title="Xóa nến này"
                    />
                  </div>
                );
              })}
            </div>

            {/* Khung nền biểu đồ */}
            <CardBackgroundControl
              element={element}
              updateElement={updateElement}
              label="Khung nền biểu đồ"
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
