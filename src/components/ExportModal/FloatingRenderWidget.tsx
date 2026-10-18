import React from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import styles from './ExportModal.module.css'
import { API_BASE } from '@/config/api'
import { Button } from '@/components/ui'
import { downloadFileDirectly, downloadMultipleFilesDirectly } from '@/utils/downloadHelper'

export default function FloatingRenderWidget() {
  const {  
    activeRenderJob, setActiveRenderJob, 
    exportModalOpen, setExportModalOpen, 
    batchRenderJobs, isBatchProcessing,
    showToast 
   } = useEditorStore(
    useShallow(s => ({
      activeRenderJob: s.activeRenderJob,
      setActiveRenderJob: s.setActiveRenderJob,
      exportModalOpen: s.exportModalOpen,
      setExportModalOpen: s.setExportModalOpen,
      batchRenderJobs: s.batchRenderJobs,
      isBatchProcessing: s.isBatchProcessing,
      showToast: s.showToast
    }))
  )

  // Only show when there is an active job and modal is currently closed
  if ((!activeRenderJob && !isBatchProcessing && batchRenderJobs.length === 0) || exportModalOpen) return null

  const isBatch = batchRenderJobs.length > 1
  const completedBatchCount = batchRenderJobs.filter(j => j.status === 'completed').length
  const totalBatchCount = batchRenderJobs.length

  const isRendering = activeRenderJob?.status === 'bundling' || activeRenderJob?.status === 'rendering' || activeRenderJob?.status === 'queued' || activeRenderJob?.status === 'waiting' || isBatchProcessing
  const isCompleted = isBatch ? (completedBatchCount === totalBatchCount && totalBatchCount > 0) : (activeRenderJob?.status === 'completed')
  const isFailed = activeRenderJob?.status === 'failed' && !isBatch
  const progressPct = Math.round((activeRenderJob?.progress || 0) * 100)

  const cancelJob = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (activeRenderJob?.jobId) {
        await fetch(`${API_BASE}/api/render/cancel/${activeRenderJob.jobId}`, { method: 'POST' })
      }
      setActiveRenderJob(null)
      showToast('Đã hủy tiến trình render', 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const downloadVideo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isBatch) {
      const completedItems = batchRenderJobs
        .filter(j => j.status === 'completed' && j.downloadUrl)
        .map(j => ({ url: j.downloadUrl!, filename: `${j.title}.mp4` }))
      downloadMultipleFilesDirectly(completedItems)
    } else if (activeRenderJob?.downloadUrl) {
      downloadFileDirectly(activeRenderJob.downloadUrl!, activeRenderJob.outputFilename)
    }
  }

  const openModal = () => {
    setExportModalOpen(true, isBatch ? 'batch' : 'current')
  }

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveRenderJob(null)
  }

  return (
    <div className={styles.floatingWidget} onClick={openModal} title="Bấm để mở chi tiết Export Modal">
      <div className={styles.widgetInfo}>
        <div className={styles.widgetTitle}>
          <span>
            {isRendering && (
              <>
                <span style={{ color: 'var(--accent)', marginRight: 6 }}>●</span>
                {isBatch ? (
                  `Hàng đợi [${completedBatchCount + 1}/${totalBatchCount}]...`
                ) : (
                  activeRenderJob?.status === 'bundling' ? 'Đóng gói dự án...' : 'Đang xuất video ngầm...'
                )}
              </>
            )}
            {isCompleted && (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {isBatch ? `Đã xong ${totalBatchCount} video` : 'Video đã sẵn sàng tải về'}
              </span>
            )}
            {isFailed && <span style={{ color: '#ff5544', fontWeight: 600 }}>Render thất bại</span>}
          </span>
          {isRendering && (
            <span style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'monospace' }}>
              {progressPct}%
              {activeRenderJob?.etaSec ? ` • ~${activeRenderJob.etaSec}s` : ''}
            </span>
          )}
        </div>

        {isRendering && (
          <div className={styles.widgetProgress}>
            <div className={styles.widgetBar} style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>

      <div className={styles.widgetActions} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isCompleted && (
          <Button 
            variant="primary"
            size="xs"
            onClick={downloadVideo} 
            title="Tải file MP4"
            leftIcon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          >
            {isBatch ? 'Tải tất cả' : 'Tải MP4'}
          </Button>
        )}

        {isRendering && (
          <Button 
            variant="danger"
            size="xs"
            onClick={cancelJob} 
            title="Hủy tác vụ"
          >
            Hủy
          </Button>
        )}

        <Button 
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={dismiss} 
          title="Đóng thanh thông báo"
        >
          ✕
        </Button>
      </div>
    </div>
  )
}
