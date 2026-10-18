import styles from './Rail.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { ActivePanel } from '@/types/editor'

interface RailItem { id: ActivePanel; label: string; icon: React.ReactNode }

const RAIL_ITEMS: RailItem[] = [
  { id: 'ai-story', label: 'Kịch bản', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M8.5 1.5L10.3 6H15L11.2 8.8L12.6 13.5L8.5 10.8L4.4 13.5L5.8 8.8L2 6H6.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/></svg> },
  { id: 'templates', label: 'Mẫu', icon: <svg width="17" height="17" viewBox="0 0 17 17"><rect x="2" y="2" width="5.5" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="9.5" y="2" width="5.5" height="3.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="9.5" y="7.5" width="5.5" height="7.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="2" y="11" width="5.5" height="4" rx="1.3" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg> },
  { id: 'assets', label: 'Media', icon: <svg width="17" height="17" viewBox="0 0 17 17"><rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="9" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="2" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg> },
  { id: 'mascot', label: 'Nhân vật', icon: <svg width="17" height="17" viewBox="0 0 17 17"><circle cx="8.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M3.5 15C3.5 11.5 5.5 10 8.5 10C11.5 10 13.5 11.5 13.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
  { id: 'elements', label: 'Điện ảnh', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M2.5 3.5H14.5V13.5H2.5V3.5Z" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M2.5 6.5H14.5M6.5 3.5L5 6.5M10.5 3.5L9 6.5M14.5 3.5L13 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id: 'education', label: 'Giáo dục', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M8.5 2.5L1.5 6L8.5 9.5L15.5 6L8.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/><path d="M4.5 7.5V12C4.5 13.5 6.5 14.5 8.5 14.5C10.5 14.5 12.5 13.5 12.5 12V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M15.5 6V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { id: 'stem', label: 'Khoa học', icon: <svg width="17" height="17" viewBox="0 0 17 17"><ellipse cx="8.5" cy="8.5" rx="7" ry="2.8" transform="rotate(-30 8.5 8.5)" stroke="currentColor" strokeWidth="1.3" fill="none"/><ellipse cx="8.5" cy="8.5" rx="7" ry="2.8" transform="rotate(30 8.5 8.5)" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/></svg> },
  { id: 'text', label: 'Văn bản', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M3 4H14M8.5 4V14M6 14H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
  { id: 'svg', label: 'Đồ họa', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M8.5 2L15 5.75V13.25L8.5 17L2 13.25V5.75L8.5 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/></svg> },
  { id: 'motion', label: 'Chuyển động', icon: <svg width="17" height="17" viewBox="0 0 17 17"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M8.5 5V8.5L11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
  { id: 'audio', label: 'Âm thanh', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M6.5 4L2.5 6.5H1V10.5H2.5L6.5 13V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/><path d="M10 6.5C11 7.1 11.7 7.7 11.7 8.5C11.7 9.3 11 9.9 10 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
  { id: 'filters', label: 'Bộ lọc', icon: <svg width="17" height="17" viewBox="0 0 17 17"><path d="M2 4.5H15M5 8.5H12M7 12.5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
  { id: 'transitions', label: 'Chuyển cảnh', icon: <svg width="17" height="17" viewBox="0 0 17 17"><rect x="1" y="4" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><rect x="9" y="4" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><circle cx="8.5" cy="8.5" r="1.2" fill="var(--accent)"/></svg> },
  { id: 'captions', label: 'Phụ đề', icon: <svg width="17" height="17" viewBox="0 0 17 17"><rect x="2" y="5" width="13" height="7" rx="1.8" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M5 8.5H8.5M5 10.5H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg> },
]

export default function Rail() {
  const { activePanel, setActivePanel, addScene, setSettingsModalOpen } = useEditorStore()

  return (
    <nav className={styles.rail} data-area="rail">
      <button className={styles.newBtn} onClick={addScene} title="Thêm cảnh mới vào video (+)">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        <span>Thêm cảnh</span>
      </button>
      <div className={styles.divider} />
      {RAIL_ITEMS.map(item => (
        <button
          key={item.id}
          className={`${styles.railBtn} ${activePanel === item.id ? styles.active : ''}`}
          onClick={() => setActivePanel(item.id)}
          title={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      {/* Unified Settings at the bottom */}
      <button
        className={styles.railBtn}
        style={{ marginTop: 'auto', marginBottom: 16 }}
        onClick={() => setSettingsModalOpen(true)}
        title="Trung Tâm Cài Đặt Hệ Thống & Thương Hiệu"
      >
        <svg width="17" height="17" viewBox="0 0 17 17"><path d="M8.5 11.5C10.1569 11.5 11.5 10.1569 11.5 8.5C11.5 6.84315 10.1569 5.5 8.5 5.5C6.84315 5.5 5.5 6.84315 5.5 8.5C5.5 10.1569 6.84315 11.5 8.5 11.5Z" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M14.5 9.5V7.5L12.7 7.2C12.5 6.7 12.2 6.2 11.9 5.8L12.8 4.3L11.4 2.9L9.9 3.8C9.5 3.5 9.0 3.2 8.5 3.0L8.2 1.2H6.2L5.9 3.0C5.4 3.2 4.9 3.5 4.5 3.8L3.0 2.9L1.6 4.3L2.5 5.8C2.2 6.2 1.9 6.7 1.7 7.2L0 7.5V9.5L1.7 9.8C1.9 10.3 2.2 10.8 2.5 11.2L1.6 12.7L3.0 14.1L4.5 13.2C4.9 13.5 5.4 13.8 5.9 14.0L6.2 15.8H8.2L8.5 14.0C9.0 13.8 9.5 13.5 9.9 13.2L11.4 14.1L12.8 12.7L11.9 11.2C12.2 10.8 12.5 10.3 12.7 9.8L14.5 9.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/></svg>
        <span>Cài đặt</span>
      </button>
    </nav>
  )
}
