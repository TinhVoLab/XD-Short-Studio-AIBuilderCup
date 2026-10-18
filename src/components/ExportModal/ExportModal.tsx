import { useState, useRef, useEffect, useCallback } from 'react'
import { API_BASE, apiFetch } from '@/config/api'
import styles from './ExportModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Player } from '@remotion/player'
import { MainComposition } from '@/remotion/MainComposition'
import { downloadFileDirectly } from '@/utils/downloadHelper'
import { generateSeoVideoFilename, slugifyVietnamese } from '@/utils/seoFilename'
import { getTotalRemotionDurationFrames } from '@/utils/sceneTiming'
import { SingleExportView } from './components/SingleExportView'
import { BatchExportView } from './components/BatchExportView'
import { Button, SegmentedControl } from '@/components/ui'
import { useAuthAction } from '@/hooks/useAuthAction'
import { decideRenderCharge, resolutionScale, maxAllowedVideoSec } from '@/config/planCatalog'
import { lintScenesText, describeLintIssues } from '@/utils/sceneLint'

interface RenderHistoryItem {
  id: string
  filename: string
  url: string
  downloadUrl: string
  fileSize: number
  createdAt: number
}

export default function ExportModal() {
  const {  
    scenes, bgMusicUrl, bgMusicVolume, audioClips, voiceoverReverb,
    exportModalOpen, setExportModalOpen, 
    exportModalMode,
    activeRenderJob, setActiveRenderJob, updateActiveRenderJob,
    showToast,
    brandingSettings,
    setSettingsModalOpen,
    currentUser,
    firebaseUser,
    canRenderVideo,
    fetchRemoteQuota,
    setPricingModalOpen,
    isFeatureEnabled,
    getPlanByTier,
    masterVolume,
    voiceoverVolume,
    sfxVolume,
    bgmVolume,
    isVoiceMuted,
    isSfxMuted,
    isBgmMuted,
    isMasterMuted,
    soloTrackId,
    soloTrackIds,
    mutedTrackIds
   } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      bgMusicUrl: s.bgMusicUrl,
      bgMusicVolume: s.bgMusicVolume,
      audioClips: s.audioClips,
      voiceoverReverb: s.voiceoverReverb,
      exportModalOpen: s.exportModalOpen,
      setExportModalOpen: s.setExportModalOpen,
      exportModalMode: s.exportModalMode,
      activeRenderJob: s.activeRenderJob,
      setActiveRenderJob: s.setActiveRenderJob,
      updateActiveRenderJob: s.updateActiveRenderJob,
      showToast: s.showToast,
      brandingSettings: s.brandingSettings,
      setSettingsModalOpen: s.setSettingsModalOpen,
      currentUser: s.currentUser,
      firebaseUser: s.firebaseUser,
      canRenderVideo: s.canRenderVideo,
      fetchRemoteQuota: s.fetchRemoteQuota,
      setPricingModalOpen: s.setPricingModalOpen,
      isFeatureEnabled: s.isFeatureEnabled,
      getPlanByTier: s.getPlanByTier,
      masterVolume: s.masterVolume ?? 1.0,
      voiceoverVolume: s.voiceoverVolume ?? 1.0,
      sfxVolume: s.sfxVolume ?? 0.8,
      bgmVolume: s.bgmVolume ?? 0.8,
      isVoiceMuted: s.isVoiceMuted || false,
      isSfxMuted: s.isSfxMuted || false,
      isBgmMuted: s.isBgmMuted || false,
      isMasterMuted: s.isMasterMuted || false,
      soloTrackId: s.soloTrackId,
      soloTrackIds: s.soloTrackIds || [],
      mutedTrackIds: s.mutedTrackIds || [],
    }))
  )

  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export')
  const [exportMode, setExportMode] = useState<'current' | 'batch'>(exportModalMode || 'current')

  useEffect(() => {
    if (exportModalMode) {
      setExportMode(exportModalMode)
    }
  }, [exportModalMode])

  const [videoTitle, setVideoTitle] = useState<string>('')
  const [quality, setQuality] = useState<'1080p' | '720p' | '360p'>('720p')
  const userPlan = getPlanByTier(currentUser.planTier)
  const maxScale = resolutionScale(userPlan)

  useEffect(() => {
    if (exportModalOpen) {
      setQuality(maxScale >= 3 ? '1080p' : '720p');
    }
  }, [exportModalOpen, maxScale])
  // Composition Remotion cố định 30 fps (src/remotion/Root.tsx) — không có tuỳ chọn 60 fps
  const fps = 30
  const [historyList, setHistoryList] = useState<RenderHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null)
  const [previewingVideoUrl, setPreviewingVideoUrl] = useState<string | null>(null)
  const [isStartingExport, setIsStartingExport] = useState<boolean>(false)

  // Auto-generate SEO title on open using BrandingSettings
  useEffect(() => {
    if (exportModalOpen) {
      setVideoTitle(generateSeoVideoFilename(
        scenes,
        brandingSettings.authorName,
        brandingSettings.seoNamingPattern
      ))
    }
  }, [exportModalOpen, scenes, brandingSettings.authorName, brandingSettings.seoNamingPattern])

  // Calculate dynamic duration
  const audiosDur = audioClips.reduce((max, a) => {
    const end = a.startSec + (a.playDurationSec || 0)
    return Math.max(max, end)
  }, 0)
  const durationInFrames = getTotalRemotionDurationFrames(scenes, audiosDur, fps)
  const totalDur = durationInFrames / fps

  // Xem trước cách server sẽ tính lượt cho video này (độ dài theo gói, lượt tháng / video mua thêm)
  const chargePreview = currentUser.planTier === 'admin' ? null : decideRenderCharge({
    plan: userPlan,
    videoSec: totalDur,
    monthlyUsed: currentUser.quota?.videosRenderedThisMonth ?? 0,
    bonusBalance: currentUser.quota?.bonusVideos ?? 0,
  })

  const isRendering = isStartingExport || activeRenderJob?.status === 'bundling' || activeRenderJob?.status === 'rendering' || activeRenderJob?.status === 'queued' || activeRenderJob?.status === 'waiting'
  const isCompleted = activeRenderJob?.status === 'completed'
  const progressPct = Math.round((activeRenderJob?.progress || 0) * 100)

  // Fetch render history from server (Secured with apiFetch)
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const res = await apiFetch(`${API_BASE}/api/render/history`)
      if (res.ok) {
        const data = await res.json()
        setHistoryList(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Fetch history error:', e)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (exportModalOpen) {
      fetchHistory()
    }
  }, [exportModalOpen, fetchHistory])

  const deleteHistoryItem = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Bạn có chắc muốn xóa video "${filename}" khỏi lịch sử?`)) return
    try {
      setDeletingFilename(filename)
      const res = await apiFetch(`${API_BASE}/api/render/history/${encodeURIComponent(filename)}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Đã xóa video thành công', 2500)
        setHistoryList(prev => prev.filter(item => item.filename !== filename))
        if (previewingVideoUrl?.includes(filename)) {
          setPreviewingVideoUrl(null)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Không thể xóa video này', 3000)
      }
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Có lỗi xảy ra khi xóa video', 3000)
    } finally {
      setDeletingFilename(null)
    }
  }

  const startExport = useAuthAction(async () => {
    if (isRendering || isStartingExport) return

    if (chargePreview && !chargePreview.ok && chargePreview.code === 'too_long') {
      showToast(`Video dài ${chargePreview.videoSec} giây, vượt giới hạn ${maxAllowedVideoSec(userPlan)} giây mỗi video của gói ${userPlan.name}. Hãy rút gọn bớt cảnh hoặc nâng cấp gói.`, 5000)
      return
    }

    // Chữ giữ chỗ còn sót: báo ngay và mở cảnh đầu tiên bị lỗi (server cũng chặn lại lần nữa)
    const lintIssues = lintScenesText(scenes)
    if (lintIssues.length) {
      showToast(describeLintIssues(lintIssues), 6000)
      useEditorStore.getState().setCurrentScene(lintIssues[0].sceneIdx)
      return
    }

    const check = canRenderVideo()
    if (!check.allowed) {
      showToast(check.reason || 'Bạn đã đạt giới hạn xuất video tháng này.', 4000)
      setPricingModalOpen(true)
      return
    }

    setIsStartingExport(true)
    try {
      // Auto-save & sync project to cloud once right before render (1-2 writes total per project)
      try {
        useEditorStore.getState().saveCurrentProjectToCloud().catch(e => console.warn('Pre-render cloud save note:', e))
      } catch (e) {}

      const scale = quality === '1080p' ? 3 : quality === '720p' ? 2 : 1
      const finalCleanFilename = slugifyVietnamese(videoTitle) || generateSeoVideoFilename(scenes, brandingSettings.authorName, brandingSettings.seoNamingPattern)
      
      const currentYear = new Date().getFullYear()
      const author = brandingSettings.authorName || 'TinhVo Digital'
      const copyright = (brandingSettings.copyrightTemplate || '© {YEAR} {AUTHOR}. All rights reserved.')
        .replace('{YEAR}', String(currentYear))
        .replace('{AUTHOR}', author)

      const metadata = brandingSettings.autoEmbedSuperMetadata ? {
        title: scenes[0]?.name || videoTitle,
        artist: author,
        copyright,
        comment: `${brandingSettings.authorHandle || ''} | ${brandingSettings.websiteUrl || ''}`.trim(),
        genre: brandingSettings.defaultGenre || 'Công nghệ & AI / Short-form Video',
        encoder: brandingSettings.encoderTag || 'XD-Short Studio Pro v2.0',
        year: currentYear
      } : undefined

      const scenesToRender = scenes.map(scene => ({
        ...scene,
        authorAvatarUrl: scene.authorAvatarUrl || brandingSettings.authorAvatarUrl,
        authorName: scene.authorName || brandingSettings.authorName,
        authorAvatarSize: scene.authorAvatarSize || brandingSettings.authorAvatarSize || 44,
        authorAvatarPosition: scene.authorAvatarPosition || 'top-left',
        authorAvatarEffect: scene.authorAvatarEffect || 'none',
      }))

      const res = await apiFetch(`${API_BASE}/api/render/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: firebaseUser?.uid,
          scenes: scenesToRender,
          bgMusicUrl,
          bgMusicVolume,
          audioClips,
          voiceoverReverb,
          durationInFrames,
          scale,
          targetFps: fps,
          filename: finalCleanFilename,
          metadata,
          showWatermark: !isFeatureEnabled(currentUser.planTier, 'removeWatermark'),
          masterVolume,
          voiceoverVolume,
          sfxVolume,
          bgmVolume,
          isVoiceMuted,
          isSfxMuted,
          isBgmMuted,
          isMasterMuted,
          soloTrackId,
          soloTrackIds,
          mutedTrackIds
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        // 401 is automatically intercepted and handled by apiFetch!
        if (res.status === 401) {
          return
        }
        if (res.status === 429 || errorData.code === 'render/too_long' || errorData.code === 'render/placeholder_text') {
          showToast(errorData.error || 'Đã hết lượt xuất video tháng này.', 5000)
          if (errorData.code === 'quota/monthly_limit_exceeded') setPricingModalOpen(true)
          fetchRemoteQuota().catch(() => {})
          return
        }
        throw new Error(errorData.error || 'Không thể khởi tạo tiến trình render')
      }

      const data = await res.json()
      const jobId = data.jobId
      fetchRemoteQuota().catch(() => {})

      setActiveRenderJob({
        jobId,
        progress: 0.05,
        status: 'queued'
      })

      showToast('Đang khởi động render...', 2500)
    } catch (err: any) {
      console.error('Render start error:', err)
      showToast('Lỗi: ' + (err.message || 'Không thể xuất video'), 3500)
    } finally {
      setIsStartingExport(false)
    }
  }, { message: 'Vui lòng đăng nhập tài khoản để xuất video.' })

  // Auto-refresh history whenever render job completes
  useEffect(() => {
    if (activeRenderJob?.status === 'completed' && exportModalOpen) {
      fetchHistory()
    }
  }, [activeRenderJob?.status, exportModalOpen, fetchHistory])

  const cancelExport = async () => {
    if (!activeRenderJob?.jobId) return
    try {
      await fetch(`${API_BASE}/api/render/cancel/${activeRenderJob.jobId}`, { method: 'POST' })
      setActiveRenderJob(null)
      showToast('Đã hủy tiến trình render', 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownload = async (url: string, filename?: string) => {
    showToast('Đang bắt đầu tải xuống...', 2000)
    await downloadFileDirectly(url, filename)
  }

  const close = () => {
    setExportModalOpen(false)
    setPreviewingVideoUrl(null)
  }

  const formatTimeAgo = (ts: any) => {
    if (!ts) return 'Không rõ'
    const num = typeof ts === 'number'
      ? ts
      : (ts._seconds != null ? ts._seconds * 1000 : (ts.seconds != null ? ts.seconds * 1000 : new Date(ts).getTime()))
    if (isNaN(num)) return 'Không rõ'
    const diff = Math.floor((Date.now() - num) / 1000)
    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    const d = new Date(num)
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`
  }

  if (!exportModalOpen) return null

  return (
    <div className={styles.bg} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className={styles.modal}>
        {/* Header with Studio Tabs */}
        <div className={styles.hdr}>
          <div style={{ width: 280 }}>
            <SegmentedControl
              options={[
                {
                  value: 'export',
                  label: 'Xuất Video Mới',
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 15V3m0 0l-4 4m4-4l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )
                },
                {
                  value: 'history',
                  label: `Lịch Sử ${historyList.length > 0 ? `(${historyList.length})` : ''}`,
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )
                }
              ]}
              value={activeTab}
              onChange={(val) => {
                const tab = val as 'export' | 'history'
                setActiveTab(tab)
                if (tab === 'history') fetchHistory()
                else setPreviewingVideoUrl(null)
              }}
              size="sm"
              fullWidth
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab === 'history' && (
              <Button
                variant="secondary"
                size="xs"
                leftIcon={
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ animation: loadingHistory ? 'spin 1s linear infinite' : 'none' }}
                  >
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                }
                onClick={fetchHistory}
                disabled={loadingHistory}
                title="Làm mới danh sách video lịch sử"
              >
                Làm mới
              </Button>
            )}
            <Button
              variant="secondary"
              size="xs"
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              }
              onClick={() => setSettingsModalOpen(true)}
              title="Cài Đặt Thương Hiệu & Siêu Metadata Toàn Cục"
            >
              Cài đặt
            </Button>
            <Button 
              asIcon
              variant="ghost"
              size="icon-sm"
              onClick={close} 
              title="Đóng popup (Render vẫn tiếp tục ngầm)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>

        {/* TAB 1: EXPORT TAB (WITH TOGGLE) */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', background: '#121212', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <SegmentedControl
                options={[
                  { value: 'current', label: 'Dự án hiện tại' },
                  { value: 'batch', label: 'Xuất hàng loạt' }
                ]}
                value={exportMode}
                onChange={(val) => setExportMode(val as any)}
                size="sm"
                fullWidth
              />
            </div>

            {exportMode === 'current' ? (
              <SingleExportView
                brandingSettings={brandingSettings}
                durationInFrames={durationInFrames}
                scenes={scenes}
                bgMusicUrl={bgMusicUrl}
                bgMusicVolume={bgMusicVolume}
                audioClips={audioClips}
                videoTitle={videoTitle}
                setVideoTitle={setVideoTitle}
                isRendering={isRendering}
                isCompleted={isCompleted}
                progressPct={progressPct}
                quality={quality}
                setQuality={setQuality}
                chargePreview={chargePreview}
                videoSec={totalDur}
                activeRenderJob={activeRenderJob}
                startExport={startExport}
                cancelExport={cancelExport}
                close={close}
                setActiveRenderJob={setActiveRenderJob}
              />
            ) : (
              <BatchExportView close={close} />
            )}
          </div>
        )}

        {/* TAB 2: RENDER HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            {/* Inline Video Preview when clicking Play on a history item */}
            {previewingVideoUrl && (
              <div className={styles.videoPreviewOverlay}>
                <div className={styles.videoPreviewBar}>
                  <span style={{ fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Đang xem trước video
                  </span>
                  <Button 
                    variant="ghost"
                    size="xs"
                    leftIcon={
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    }
                    onClick={() => setPreviewingVideoUrl(null)}
                  >
                    Đóng xem trước
                  </Button>
                </div>
                <video 
                  src={previewingVideoUrl} 
                  controls 
                  autoPlay 
                  className={styles.videoPreviewPlayer} 
                />
              </div>
            )}

            <div className={styles.historyContainer}>
              {loadingHistory ? (
                <div className={styles.historyEmpty}>
                  <span>Đang tải danh sách video...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className={styles.historyEmpty}>
                  <div className={styles.historyEmptyIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <line x1="2" y1="7" x2="7" y2="7" />
                      <line x1="2" y1="17" x2="7" y2="17" />
                      <line x1="17" y1="17" x2="22" y2="17" />
                      <line x1="17" y1="7" x2="22" y2="7" />
                    </svg>
                  </div>
                  <strong style={{ color: 'var(--text)' }}>Chưa có video nào trong lịch sử</strong>
                  <span>Khi bạn render video, các bản xuất sẽ được tự động lưu lại ở đây để tải lại bất cứ lúc nào.</span>
                </div>
              ) : (
                historyList.map((item) => (
                  <div key={item.id} className={styles.historyItem}>
                    <div className={styles.historyItemLeft}>
                      <div className={styles.historyItemIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div className={styles.historyItemDetails}>
                        <span className={styles.historyItemTitle} title={item.filename}>
                          {item.filename}
                        </span>
                        <div className={styles.historyItemMeta}>
                          <span>{formatTimeAgo(item.createdAt)}</span>
                          <span>•</span>
                          <span>{(item.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.historyItemActions}>
                      <button
                        className={styles.btnPlayIcon}
                        onClick={() => setPreviewingVideoUrl(item.url)}
                        title="Xem trước video"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </button>

                      <button
                        className={styles.btnDownloadIcon}
                        onClick={() => handleDownload(item.downloadUrl, item.filename)}
                        title="Tải video trực tiếp vào máy"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Tải về
                      </button>

                      <button
                        className={styles.btnDeleteIcon}
                        onClick={(e) => deleteHistoryItem(item.filename, e)}
                        disabled={deletingFilename === item.filename}
                        title="Xóa video này"
                      >
                        {deletingFilename === item.filename ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
