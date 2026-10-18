import styles from './TopBar.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { VIDEO_FORMATS, VideoFormat } from '@/types/editor'
import { projectStorageService } from '@/services/projectStorageService'
import SaveTemplateModal from './SaveTemplateModal'
import { SocialCaptionModal } from '@/components/ExportModal/components/SocialCaptionModal'
import { UserProfileMenu } from './UserProfileMenu'
import { useState, useRef, useEffect } from 'react'
import { Button, ButtonGroup } from '@/components/ui'
import { useAuthAction } from '@/hooks/useAuthAction'
import { CanvasZoomControl } from '@/components/Canvas/CanvasZoomControl'
import { openCreateVideo } from '@/components/AiWizardModal/openCreateVideo'

const FORMATS = Object.entries(VIDEO_FORMATS) as [VideoFormat, typeof VIDEO_FORMATS[VideoFormat]][]

export default function TopBar() {
  const {
    projectTitle, setProjectTitle,
    isSaved, isSavingProject,
    cloudSaveStatus, saveCurrentProjectToCloud,
    videoFormat, setVideoFormat,
    scenes, currentSceneIdx,
    setExportModalOpen,
    showToast,
    canUndo, canRedo,
    lastUndoDescription, lastRedoDescription,
    undo, redo,
    brandingSettings,
    setSettingsModalOpen,
    projectsList,
    setProjectsModalOpen,
    exportCurrentProject,
    showRulers,
    toggleShowRulers,
    setAppViewMode,
    currentUser,
    getPlanByTier,
    pricingModalOpen,
    setPricingModalOpen,
    workspaceLayout,
    setWorkspaceLayout,
    isPipActive,
  } = useEditorStore()

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [captionModalOpen, setCaptionModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleCloudSave = useAuthAction(
    () => saveCurrentProjectToCloud(),
    { message: 'Vui lòng đăng nhập để lưu và đồng bộ dự án lên đám mây.' }
  )

  const handleFormatCycle = () => {
    const idx = FORMATS.findIndex(([k]) => k === videoFormat)
    const next = FORMATS[(idx + 1) % FORMATS.length][0]
    setVideoFormat(next)
    showToast(`Format: ${VIDEO_FORMATS[next].label}`)
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className={styles.topbar}>
      {/* LEFT */}
      <div className={styles.left}>
        <div 
          className={styles.logo} 
          onClick={() => setAppViewMode('landing')}
          title="Bấm để xem Trang Chủ & Bảng Giá"
          style={{ cursor: 'pointer' }}
        >
          <svg className={styles.logoIcon} viewBox="0 0 28 28" fill="none">
            <path d="M4 4L14 2L24 4V14C24 20.627 19.627 26 14 27C8.373 26 4 20.627 4 14V4Z" fill="var(--accent)"/>
            <path d="M10 10L14 8L18 10V14C18 17.3 16.3 19.8 14 20.5C11.7 19.8 10 17.3 10 14V10Z" fill="#0D0D0D"/>
          </svg>
          <span className={styles.logoName}>XD<span className={styles.accent}>Short</span></span>
        </div>

        <Button
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={() => setAppViewMode('landing')}
          title="Xem Trang Chủ & Bảng Giá"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Button>

        <div className={styles.sep} />

        {/* Nút Mở Dashboard Dự Án & Tạo Mới */}
        <div className={styles.projectMenuWrapper} ref={menuRef}>
          <ButtonGroup>
            <Button 
              variant="secondary"
              size="xs"
              onClick={() => setProjectsModalOpen(true)}
              title="Mở Thư Viện Quản Lý Dự Án"
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4C2 3.4 2.4 3 3 3H6.5L8.5 5H13C13.6 5 14 5.4 14 6V12C14 12.6 13.6 13 13 13H3C2.4 13 2 12.6 2 12V4Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              }
            >
              <span>Dự Án</span>
              {projectsList.length > 0 && (
                <span style={{
                  background: 'rgba(190, 255, 1, 0.15)',
                  color: '#BEFF01',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  marginLeft: '4px'
                }}>
                  {projectsList.length}
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={openCreateVideo}
              title="Tạo video mới (⌘N)"
              leftIcon={
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              }
            >
              <span>Mới</span>
            </Button>
          </ButtonGroup>
        </div>

        <div className={styles.sep} />

        <input
          type="text"
          className={styles.projectName}
          value={projectTitle || ''}
          onChange={e => setProjectTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
              showToast('Đã lưu tên dự án')
            }
          }}
          placeholder="Tên dự án..."
          title="Bấm để đổi tên dự án (Enter để lưu)"
        />

        <Button
          variant={cloudSaveStatus === 'saved' && isSaved ? "ghost" : "secondary"}
          size="xs"
          disabled={isSavingProject || cloudSaveStatus === 'saving'}
          onClick={() => handleCloudSave()}
          title={
            isSavingProject || cloudSaveStatus === 'saving'
              ? 'Đang đồng bộ dự án lên Cloud...'
              : cloudSaveStatus === 'saved' && isSaved
              ? 'Dự án đã được lưu an toàn trên Cloud (⌘S)'
              : 'Có thay đổi chưa lưu lên Cloud (Bấm hoặc ⌘S để lưu)'
          }
          leftIcon={
            isSavingProject || cloudSaveStatus === 'saving' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinIcon}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : cloudSaveStatus === 'saved' && isSaved ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                <polyline points="9 13 11.5 15.5 15.5 11" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                <path d="M12 13v6" />
                <path d="m9 16 3-3 3 3" />
              </svg>
            )
          }
          style={
            cloudSaveStatus === 'saved' && isSaved
              ? { color: 'var(--text-sub)', borderColor: 'transparent' }
              : { color: 'var(--accent)', borderColor: 'rgba(190, 255, 1, 0.35)', background: 'rgba(190, 255, 1, 0.08)' }
          }
        >
          {isSavingProject || cloudSaveStatus === 'saving' ? 'Đang lưu...' : cloudSaveStatus === 'saved' && isSaved ? 'Đã lưu' : 'Lưu Cloud'}
        </Button>

        <Button
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={() => exportCurrentProject()}
          title="Tải file dự án JSON về máy tính (.xdshort.json)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </Button>
      </div>

      {/* CENTER */}
      <div className={styles.center}>
        <Button
          variant="secondary"
          size="xs"
          onClick={handleFormatCycle}
          title="Bấm để đổi nền tảng đăng video ngắn (TikTok, Reels, YouTube Shorts, Stories)"
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="3.5" y="1" width="6" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          }
        >
          {VIDEO_FORMATS[videoFormat].label.replace('Video ', '')}
        </Button>

        <ButtonGroup>
          <Button 
            asIcon
            variant="ghost"
            size="icon-xs"
            title={canUndo ? `Hoàn tác: ${lastUndoDescription || 'thao tác'} (⌘Z)` : 'Không có thao tác nào để hoàn tác (⌘Z)'} 
            onClick={() => canUndo && undo()}
            disabled={!canUndo}
          >
            <svg width="15" height="15" viewBox="0 0 15 15"><path d="M3 5.5H9C11 5.5 12.5 7 12.5 9S11 12.5 9 12.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/><path d="M5 3.5L3 5.5L5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </Button>
          <Button 
            asIcon
            variant="ghost"
            size="icon-xs"
            title={canRedo ? `Làm lại: ${lastRedoDescription || 'thao tác'} (⌘⇧Z / ⌘Y)` : 'Không có thao tác nào để làm lại (⌘⇧Z)'} 
            onClick={() => canRedo && redo()}
            disabled={!canRedo}
          >
            <svg width="15" height="15" viewBox="0 0 15 15"><path d="M12 5.5H6C4 5.5 2.5 7 2.5 9S4 12.5 6 12.5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/><path d="M10 3.5L12 5.5L10 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button
            asIcon
            variant={showRulers ? "secondary" : "ghost"}
            size="icon-xs"
            style={
              showRulers
                ? {
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent-border)',
                  }
                : undefined
            }
            onClick={() => {
              toggleShowRulers()
              showToast(!showRulers ? 'Đã bật Thước Pixel (Shift+R)' : 'Đã tắt Thước Pixel (Shift+R)')
            }}
            title={showRulers ? 'Tắt Thước Pixel (Shift + R)' : 'Bật Thước Pixel (Shift + R)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M7 3V7M12 3V9M17 3V7M3 7H7M3 12H9M3 17H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </Button>

          <Button
            asIcon
            variant={isPipActive ? "secondary" : "ghost"}
            size="icon-xs"
            style={
              isPipActive
                ? {
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent-border)',
                  }
                : undefined
            }
            onClick={() => window.dispatchEvent(new CustomEvent('xd-toggle-pip'))}
            title={isPipActive ? "Đóng Màn hình rời (PiP)" : "Bật Màn hình rời (Picture-in-Picture)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <rect x="12" y="11" width="8" height="7" rx="1" fill="currentColor" fillOpacity="0.25" />
            </svg>
          </Button>
        </ButtonGroup>

        <CanvasZoomControl />

        <ButtonGroup>
          <Button
            asIcon
            variant={useEditorStore.getState().activePanel ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => {
              const cur = useEditorStore.getState().activePanel
              useEditorStore.getState().setActivePanel(cur ? null as any : 'templates')
            }}
            title="Bật/Tắt Bảng Trái"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </Button>
          <Button
            asIcon
            variant={useEditorStore.getState().inspectorOpen ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => useEditorStore.getState().toggleInspector()}
            title="Bật/Tắt Inspector Phải"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </Button>

          <Button
            asIcon
            variant={workspaceLayout === 'right-standalone' ? "secondary" : "ghost"}
            size="icon-xs"
            style={
              workspaceLayout === 'right-standalone'
                ? {
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent-border)',
                  }
                : undefined
            }
            onClick={() => {
              const next = workspaceLayout === 'classic' ? 'right-standalone' : 'classic'
              setWorkspaceLayout(next)
              showToast(next === 'classic' ? 'Bố cục: Mặc định (Timeline ở đáy)' : 'Bố cục: Cột Canvas độc lập')
            }}
            title={workspaceLayout === 'classic' ? 'Chuyển sang Cột Canvas độc lập' : 'Chuyển về Bố cục Mặc định'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {workspaceLayout === 'classic' ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </>
              ) : (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="14" y1="3" x2="14" y2="21" />
                </>
              )}
            </svg>
          </Button>
        </ButtonGroup>
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        <Button
          variant="secondary"
          size="xs"
          leftIcon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          }
          onClick={() => setCaptionModalOpen(true)}
          title="Xem & Sao chép Kịch bản đăng bài (YouTube Shorts, TikTok, Reels, Pinned Comment)"
          style={{ color: '#BEFF01', borderColor: 'rgba(190, 255, 1, 0.25)', background: 'rgba(190, 255, 1, 0.08)' }}
        >
          Kịch bản
        </Button>

        {/* Quota Pill & Upgrade CTA Widget (For non-admin users) */}
        {currentUser.planTier !== 'admin' && (() => {
          const plan = getPlanByTier(currentUser.planTier)
          const used = currentUser.quota?.videosRenderedThisMonth ?? 0
          const limit = plan.quotas.monthlyVideoLimit
          const remaining = Math.max(0, limit - used)
          const bonus = currentUser.quota?.bonusVideos ?? 0
          const isWarning = remaining === 0 && bonus === 0

          return (
            <div className={styles.quotaWidget}>
              <button
                type="button"
                className={`${styles.quotaPill} ${isWarning ? styles.quotaPillWarning : ''}`}
                onClick={() => setPricingModalOpen(true)}
                title={`Còn ${remaining}/${limit} video tháng này${bonus > 0 ? `, ${bonus} video mua thêm` : ''}. Bấm để xem bảng giá.`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>
                  {`Còn ${remaining}/${limit}`}{bonus > 0 ? ` · +${bonus}` : ''}
                </span>
              </button>

              {currentUser.planTier === 'free' && (
                <button
                  type="button"
                  className={styles.upgradeTopBtn}
                  onClick={() => setPricingModalOpen(true)}
                  title="Nâng cấp gói hoặc mua thêm video"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Nâng cấp</span>
                </button>
              )}
            </div>
          )
        })()}

        <Button
          variant="primary"
          size="sm"
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 13 13"><path d="M1 9V11H12V9M6.5 1V8M6.5 8L4 5.5M6.5 8L9 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          }
          onClick={() => setExportModalOpen(true)}
        >
          Xuất video
        </Button>

        <UserProfileMenu />
      </div>

      <SocialCaptionModal
        isOpen={captionModalOpen}
        onClose={() => setCaptionModalOpen(false)}
        scenes={scenes}
        brandingSettings={brandingSettings}
        initialCaptions={useEditorStore.getState().socialCaptions}
        onSaveCaptions={(captions) => {
          useEditorStore.getState().setSocialCaptions(captions);
          projectStorageService.autoSaveToLocalStorage();
        }}
      />

      <SaveTemplateModal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} />
    </header>
  )
}

