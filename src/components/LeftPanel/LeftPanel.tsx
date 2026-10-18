import { useState } from 'react'
import styles from './LeftPanel.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { Button } from '@/components/ui'
import AiStoryPanel from './panels/AiStoryPanel'
import MediaPanel from './panels/MediaPanel'
import AudioPanel from './panels/AudioPanel'
import TextPanel from './panels/TextPanel'
import ElementsPanel from './panels/ElementsPanel'
import SvgPanel from './panels/SvgPanel'
import MotionPanel from './panels/MotionPanel'
import TransitionsPanel from './panels/TransitionsPanel'
import TemplatesPanel from './panels/TemplatesPanel'
import SettingsPanel from './panels/SettingsPanel'
import CaptionsPanel from './panels/CaptionsPanel'
import MascotPanel from './panels/MascotPanel'
import FiltersPanel from './panels/FiltersPanel'
import StemPanel from './panels/StemPanel'
import EduPanel from './panels/EduPanel'

const PLACEHOLDER_PANELS: Record<string, string> = {
  templates:   'Chọn template để bắt đầu nhanh',
  elements:    'Click vào các element để thêm vào cảnh',
  filters:     'Áp dụng bộ lọc màu sắc chuyên nghiệp',
  captions:    'Tự động tạo phụ đề từ audio',
}

const PANEL_LABELS: Record<string, string> = {
  'ai-story': 'Kịch bản AI',
  templates: 'Mẫu video',
  education: 'Thư viện Giáo dục',
  assets: 'Media',
  mascot: 'Nhân vật',
  elements: 'Điện ảnh',
  stem: 'Khoa học (STEM)',
  text: 'Văn bản',
  svg: 'Đồ họa',
  motion: 'Chuyển động',
  audio: 'Âm thanh',
  filters: 'Bộ lọc màu',
  transitions: 'Chuyển cảnh',
  captions: 'Phụ đề',
  settings: 'Cài đặt hệ thống'
}

export default function LeftPanel() {
  const { activePanel, setActivePanel } = useEditorStore()
  if (!activePanel) return null

  const renderContent = () => {
    switch (activePanel) {
      case 'ai-story':   return <AiStoryPanel />
      case 'templates':  return <TemplatesPanel />
      case 'education':  return <EduPanel />
      case 'assets':     return <MediaPanel />
      case 'mascot':     return <MascotPanel />
      case 'audio':      return <AudioPanel />
      case 'elements':   return <ElementsPanel />
      case 'stem':       return <StemPanel />
      case 'text':       return <TextPanel />
      case 'svg':        return <SvgPanel />
      case 'motion':     return <MotionPanel />
      case 'filters':    return <FiltersPanel />
      case 'transitions':return <TransitionsPanel />
      case 'captions':   return <CaptionsPanel />
      case 'settings':   return <SettingsPanel />
      default:
        return (
          <div className={styles.placeholder}>
            <p>{PLACEHOLDER_PANELS[activePanel] ?? 'Panel đang phát triển'}</p>
          </div>
        )
    }
  }

  return (
    <aside className={styles.panel} data-area="left">
      <div className={styles.hdr}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {PANEL_LABELS[activePanel] ?? activePanel}
        </span>
        {activePanel === 'ai-story' && (
          <Button
            variant="primary"
            size="xs"
            title="Kịch bản • Bố cục 9:16 • Lồng tiếng tự động"
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
                <circle cx="19" cy="5" r="2" fill="currentColor" opacity="0.7"/>
              </svg>
            }
            onClick={() => useEditorStore.getState().setAiWizardOpen(true)}
          >
            Tạo video
          </Button>
        )}
        <Button
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={() => setActivePanel(null as any)}
          title="Đóng bảng chức năng"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </Button>
      </div>
      <div className={styles.body} style={activePanel === 'ai-story' ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}>
        {renderContent()}
      </div>
    </aside>
  )
}
