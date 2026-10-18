import styles from './Inspector.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { SegmentedControl, Button, PanelErrorBoundary } from '@/components/ui'
import DesignTab from './tabs/DesignTab'
import EffectsTab from './tabs/EffectsTab'
import AdvancedTab from './tabs/AdvancedTab'
import AudioTab from './tabs/AudioTab'
import CaptionInspector from './tabs/CaptionInspector'

const TABS = [
  { value: 'design', label: 'Thiết kế' },
  { value: 'effects', label: 'Chuyển động' },
  { value: 'advanced', label: 'Nâng cao' },
]

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default function Inspector() {
  const {
    inspectorOpen,
    setInspectorOpen,
    inspectorTab,
    setInspectorTab,
    selectedAudioClipId,
    selectedElementId,
    audioClips,
    scenes,
    currentSceneIdx
  } = useEditorStore()

  if (!inspectorOpen) return null

  const currentScene = scenes[currentSceneIdx]
  const selectedEl = currentScene?.elements.find(e => e.id === selectedElementId)
  const isCaptionSelected = selectedEl?.type === 'caption'
  const selectedClip = audioClips.find(c => c.id === selectedAudioClipId)

  if (selectedAudioClipId && selectedClip) {
    const isVoice = selectedClip.trackId === 'A1'
    const isSfx = selectedClip.trackId === 'A2'

    return (
      <aside className={styles.inspector} data-area="inspector">
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isVoice ? (
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              ) : isSfx ? (
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              ) : (
                <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z" />
              )}
            </svg>
            <span>Cài đặt Âm thanh</span>
          </div>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => setInspectorOpen(false)}
            title="Đóng bảng thuộc tính"
          >
            <CloseIcon />
          </Button>
        </div>
        <div className={styles.body}>
          <PanelErrorBoundary panelName="Cài đặt Âm thanh" resetKey={selectedAudioClipId}>
            <AudioTab />
          </PanelErrorBoundary>
        </div>
      </aside>
    )
  }

  // Caption element gets its own dedicated inspector
  if (isCaptionSelected) {
    return (
      <aside className={styles.inspector} data-area="inspector">
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 15h3M14 15h3M7 11h10" />
            </svg>
            <span>Cài đặt Phụ đề</span>
          </div>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => setInspectorOpen(false)}
            title="Đóng bảng thuộc tính"
          >
            <CloseIcon />
          </Button>
        </div>
        <div className={styles.body}>
          <PanelErrorBoundary panelName="Cài đặt Phụ đề" resetKey={selectedElementId}>
            <CaptionInspector />
          </PanelErrorBoundary>
        </div>
      </aside>
    )
  }

  return (
    <aside className={styles.inspector} data-area="inspector">
      <div className={styles.tabHeader}>
        <div className={styles.tabSegmentWrap}>
          <SegmentedControl
            options={TABS}
            value={inspectorTab}
            onChange={(val) => setInspectorTab(val as any)}
            size="sm"
            fullWidth
          />
        </div>
        <Button
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={() => setInspectorOpen(false)}
          title="Thu gọn Inspector"
        >
          <CloseIcon />
        </Button>
      </div>
      <div className={styles.body}>
        <PanelErrorBoundary panelName={`Tab ${inspectorTab}`} resetKey={`${selectedElementId}_${inspectorTab}`}>
          {inspectorTab === 'design'   && <DesignTab />}
          {inspectorTab === 'effects'  && <EffectsTab />}
          {inspectorTab === 'advanced' && <AdvancedTab />}
        </PanelErrorBoundary>
      </div>
    </aside>
  )
}
