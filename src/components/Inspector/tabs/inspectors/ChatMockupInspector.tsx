import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function ChatMockupInspector({ element, updateElement, showToast }: InspectorProps) {
  const currentAccent = element.accentColor || element.color || 'var(--accent)'
  const messages = element.chatMessages || [
    { sender: 'left', name: 'Alex', text: 'Này, có tool AI nào làm video tự động nhanh không?' },
    { sender: 'right', name: 'Bạn', text: 'Có chứ! Dùng thử Motion Studio đi, tạo video chỉ mất 10s.' },
  ]

  const updateMessages = (newMessages: any[]) => {
    updateElement(element.id, { chatMessages: newMessages })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Tin Nhắn Chat (Chat Mockup)" />

        {/* Tiêu đề đoạn hội thoại */}
        <div style={{ marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 10.5 }}>
            Tiêu đề hội thoại
          </span>
          <input
            className={styles.input}
            value={element.content || ''}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="VD: Đoạn Hội Thoại..."
          />
        </div>

        {/* Mẫu hội thoại nhanh */}
        <div style={{ marginBottom: 10 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 10.5 }}>
            Mẫu nhanh
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'TƯ VẤN KHÁCH HÀNG',
                  chatMessages: [
                    { sender: 'left', name: 'Khách', text: 'Bên mình có giải pháp nào tăng doanh số không?' },
                    { sender: 'right', name: 'Chuyên gia', text: 'Có chứ! Áp dụng phễu chuyển đổi tự động ngay.' },
                    { sender: 'left', name: 'Khách', text: 'Triển khai mất bao lâu vậy ạ?' },
                    { sender: 'right', name: 'Chuyên gia', text: 'Chỉ mất 24h là vận hành trơn tru! 🚀' },
                  ],
                })
                showToast('Đã áp dụng mẫu: Tư vấn khách hàng')
              }}
            >
              Tư vấn
            </Button>

            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'BÍ QUYẾT BẤT NGỜ',
                  chatMessages: [
                    { sender: 'left', name: 'Bạn', text: 'Thật sự làm video ngắn kiếm được tiền à?' },
                    { sender: 'right', name: 'Pro', text: 'Bí mật nằm ở 3 giây hook đầu tiên đấy!' },
                    { sender: 'left', name: 'Bạn', text: 'Chỉ mình công thức với!' },
                    { sender: 'right', name: 'Pro', text: 'Dùng ngay XD-Short Studio nhé 🔥' },
                  ],
                })
                showToast('Đã áp dụng mẫu: Bí quyết')
              }}
            >
              Bí quyết
            </Button>

            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'CHỐT ĐƠN SIÊU TỐC',
                  chatMessages: [
                    { sender: 'left', name: 'Khách', text: 'Gói Pro giá bao nhiêu vậy shop?' },
                    { sender: 'right', name: 'Shop', text: 'Hôm nay giảm 50% chỉ còn 199k!' },
                    { sender: 'left', name: 'Khách', text: 'Tuyệt quá, gửi link đăng ký mình nhé!' },
                  ],
                })
                showToast('Đã áp dụng mẫu: Chốt đơn')
              }}
            >
              Chốt đơn
            </Button>
          </div>
        </div>

        {/* Quản lý danh sách tin nhắn */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 10.5, fontWeight: 700 }}>
              Danh sách tin nhắn ({messages.length})
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const nextSender = messages.length % 2 === 0 ? 'left' : 'right'
                const nextName = nextSender === 'left' ? 'Khách' : 'Bạn'
                updateMessages([...messages, { sender: nextSender, name: nextName, text: 'Tin nhắn mới...' }])
              }}
            >
              + Thêm tin nhắn
            </Button>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.map((msg: any, idx: number) => {
              const isRight = msg.sender === 'right' || msg.sender === 'me'
              return (
                <div
                  key={idx}
                  style={{
                    background: isRight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isRight ? `${currentAccent}33` : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8,
                    padding: '6px 8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <select
                      className={styles.select}
                      style={{ width: 72, marginBottom: 0, padding: '2px 4px', fontSize: 10 }}
                      value={isRight ? 'right' : 'left'}
                      onChange={e => {
                        const updated = [...messages]
                        updated[idx] = { ...updated[idx], sender: e.target.value as any }
                        updateMessages(updated)
                      }}
                    >
                      <option value="left">Trái</option>
                      <option value="right">Phải</option>
                    </select>

                    <input
                      style={{
                        width: 70,
                        fontSize: 10,
                        padding: '2px 5px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFF',
                        borderRadius: 4,
                      }}
                      value={msg.name || ''}
                      onChange={e => {
                        const updated = [...messages]
                        updated[idx] = { ...updated[idx], name: e.target.value }
                        updateMessages(updated)
                      }}
                      placeholder="Tên"
                    />

                    <span style={{ flex: 1 }} />

                    <DeleteIconButton
                      onClick={() => {
                        const updated = messages.filter((_: any, i: number) => i !== idx)
                        updateMessages(updated)
                      }}
                      title="Xóa tin nhắn này"
                     />
                  </div>

                  <textarea
                    rows={2}
                    style={{
                      width: '100%',
                      fontSize: 10.5,
                      padding: '4px 6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFF',
                      borderRadius: 4,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      lineHeight: 1.3,
                    }}
                    value={msg.text || ''}
                    onChange={e => {
                      const updated = [...messages]
                      updated[idx] = { ...updated[idx], text: e.target.value }
                      updateMessages(updated)
                    }}
                    placeholder="Nội dung tin nhắn..."
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Màu điểm nhấn Accent */}
        <ColorControlRow
          label="Màu điểm nhấn"
          value={element.accentColor || element.color || '#BEFF01'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        {/* Khung nền thẻ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền chat"
          showWidth={true}
          showBgColor={true}
          showRadius={true}
          defaultRadius={20}
          defaultBgColor="rgba(12, 18, 30, 0.95)"
        />
      </div>
      <div className={styles.divider} />
    </>
  )
}
