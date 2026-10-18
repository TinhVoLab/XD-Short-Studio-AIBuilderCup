import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorControlRow } from './common'
import { Button, SectionHeader } from '@/components/ui'

const QUICK_APPS = [
  { name: 'VIETCOMBANK', icon: '🏦', col: '#00D46A', title: '+50,000,000 đ' },
  { name: 'TIN NHẮN', icon: '💬', col: '#007AFF', title: 'Khách VIP chốt cọc 🔥' },
  { name: 'TIKTOK', icon: '🎵', col: '#FE2C55', title: 'Video đạt 1,000,000 views!' },
  { name: 'INSTAGRAM', icon: '📸', col: '#E1306C', title: '99+ người đã thích bài viết' },
]

export function PushNotificationInspector({ element, updateElement, showToast }: InspectorProps) {
  const notif = element.notificationData || {
    appName: element.subtitle || 'THÔNG BÁO',
    appIcon: '🔔',
    title: element.content || 'Tin nhắn quan trọng',
    message: 'Nội dung cập nhật mới nhất từ hệ thống...',
    timeText: 'bây giờ',
    badge: 'MỚI',
    accentColor: '#007AFF',
  }

  const updateNotif = (patch: Partial<typeof notif>) => {
    const updated = { ...notif, ...patch }
    updateElement(element.id, {
      notificationData: updated,
      content: updated.title,
    })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader 
          title="Thông báo iOS (Push notification)"
          action={
            <span style={{ fontSize: 9.5, opacity: 0.85, textTransform: 'uppercase', padding: '2px 5px', background: 'var(--surface-3)', borderRadius: 4, color: 'var(--text-muted)' }}>
              iOS 17
            </span>
          }
        />

        {/* Quick App Presets */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ marginBottom: 5, display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
            Mẫu thông báo nhanh
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {QUICK_APPS.map((app) => (
              <Button
                key={app.name}
                variant="secondary"
                size="xs"
                onClick={() => {
                  updateNotif({
                    appName: app.name,
                    appIcon: app.icon,
                    title: app.title,
                    accentColor: app.col,
                  })
                  updateElement(element.id, { accentColor: app.col })
                  showToast(`Đã chọn mẫu ${app.name}`)
                }}
              >
                <span>{app.icon}</span>
                <span>{app.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* App Name & Icon */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4 }}>
              Icon app
            </label>
            <input
              type="text"
              className={styles.input}
              value={notif.appIcon || '🔔'}
              onChange={(e) => updateNotif({ appIcon: e.target.value })}
              style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4 }}>
              Tên ứng dụng
            </label>
            <input
              type="text"
              className={styles.input}
              value={notif.appName || ''}
              onChange={(e) => updateNotif({ appName: e.target.value })}
              placeholder="VD: VIETCOMBANK..."
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4 }}>
            Tiêu đề nổi bật
          </label>
          <input
            type="text"
            className={styles.input}
            value={notif.title || ''}
            onChange={(e) => updateNotif({ title: e.target.value })}
            placeholder="VD: +50,000,000 đ hoặc Sếp gọi..."
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Message Content */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4 }}>
            Nội dung chi tiết
          </label>
          <textarea
            className={styles.input}
            rows={2}
            value={notif.message || ''}
            onChange={(e) => updateNotif({ message: e.target.value })}
            placeholder="Nội dung thông báo..."
            style={{ width: '100%', resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Time Text & Badge */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4 }}>
              Thời gian
            </label>
            <input
              type="text"
              className={styles.input}
              value={notif.timeText || 'bây giờ'}
              onChange={(e) => updateNotif({ timeText: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 4 }}>
              Huy hiệu
            </label>
            <input
              type="text"
              className={styles.input}
              value={notif.badge || ''}
              onChange={(e) => updateNotif({ badge: e.target.value })}
              placeholder="VD: ƯU TIÊN"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Accent Color Palette & ColorControlRow */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            {['#00D46A', '#007AFF', '#FE2C55', '#FFD700', '#A855F7', '#FF3B30'].map((col) => {
              const isActive = (element.accentColor || notif.accentColor) === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    updateElement(element.id, {
                      accentColor: col,
                      notificationData: { ...notif, accentColor: col },
                    })
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: col,
                    border: isActive ? '2px solid #FFFFFF' : '1px solid rgba(0,0,0,0.5)',
                    boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              )
            })}
          </div>

          <ColorControlRow
            label="Màu điểm nhấn"
            value={element.accentColor || notif.accentColor || '#00D46A'}
            onChange={(c) => {
              updateElement(element.id, {
                accentColor: c,
                notificationData: { ...notif, accentColor: c },
              })
            }}
          />
        </div>
      </div>
    </>
  )
}
