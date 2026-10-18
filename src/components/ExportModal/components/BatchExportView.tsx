import React, { useState, useEffect } from 'react'
import { ProjectMetadata } from '@/types/project'
import { listAllProjectsFromDb } from '@/utils/projectStorage'
import { useBatchRenderQueue } from '@/hooks/useBatchRenderQueue'
import styles from '../ExportModal.module.css'
import { downloadFileDirectly } from '@/utils/downloadHelper'
import { Button } from '@/components/ui'
import { useEditorStore } from '@/store/useEditorStore'
import { useAuthAction } from '@/hooks/useAuthAction'

interface BatchExportViewProps {
  close?: () => void
}

export function BatchExportView({ close }: BatchExportViewProps) {
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quality, setQuality] = useState<'1080p' | '720p' | '360p'>('1080p')
  // Composition Remotion cố định 30 fps — không có tuỳ chọn 60 fps
  const fps = 30
  
  const { 
    jobs, 
    isProcessing, 
    overallProgress, 
    etaText, 
    isZipping, 
    startBatchRender, 
    cancelBatch, 
    resetBatch, 
    downloadBatchZip 
  } = useBatchRenderQueue()

  useEffect(() => {
    async function load() {
      const data = await listAllProjectsFromDb()
      // Sort newest first
      setProjects(data.sort((a, b) => b.updatedAt - a.updatedAt))
    }
    load()
  }, [])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => {
    setSelectedIds(new Set(projects.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleStartBatch = useAuthAction(() => {
    const selectedProjects = projects.filter(p => selectedIds.has(p.id))
    startBatchRender(selectedProjects, { quality, fps })
  }, { message: 'Vui lòng đăng nhập tài khoản để xuất video hàng loạt.' })

  const currentUser = useEditorStore(s => s.currentUser)
  const setPricingModalOpen = useEditorStore(s => s.setPricingModalOpen)
  const isFeatureEnabled = useEditorStore(s => s.isFeatureEnabled)
  const canBatchExport = currentUser.planTier === 'admin' || isFeatureEnabled(currentUser.planTier, 'batchExport')

  const completedJobs = jobs.filter((j: any) => j.status === 'completed')

  if (!canBatchExport) {
    return (
      <div className={styles.body} style={{ flexDirection: 'column', padding: '30px 20px', alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          Xuất nhiều video cùng lúc
        </h4>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-sub)', maxWidth: 400, lineHeight: 1.6 }}>
          Chọn nhiều dự án và xuất một lần. Có ở gói <strong>Creator</strong> và <strong>Business</strong>.
        </p>
        <Button
          variant="primary"
          size="md"
          leftIcon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          onClick={() => setPricingModalOpen(true)}
          style={{ marginTop: 6 }}
        >
          Xem các gói
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.body} style={{ flexDirection: 'column', gap: 12 }}>
      
      {!isProcessing && jobs.length === 0 ? (
        <>
          {/* Cấu hình thông số render hàng loạt */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: 'var(--surface-2)',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase' }}>
                Độ phân giải
              </label>
              <select
                className={styles.select}
                value={quality}
                onChange={e => setQuality(e.target.value as any)}
                style={{ width: '100%', padding: '6px 8px', fontSize: 11.5 }}
              >
                <option value="1080p">1080p Full HD (1080 × 1920)</option>
                <option value="720p">720p HD (720 × 1280)</option>
                <option value="360p">360p Nháp (360 × 640)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)' }}>
                Tốc độ khung hình
              </label>
              <span style={{ padding: '6px 0', fontSize: 11.5, color: 'var(--text-sub)' }}>30 fps</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
              Đã chọn: <strong style={{ color: 'var(--accent)' }}>{selectedIds.size}</strong> / {projects.length} dự án
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button 
                variant="ghost"
                size="xs"
                onClick={selectAll}
                style={{ color: 'var(--accent)', fontWeight: 600 }}
              >
                Chọn tất cả
              </Button>
              <Button 
                variant="ghost"
                size="xs"
                onClick={deselectAll}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '380px', paddingRight: 4 }}>
            {projects.map(p => {
              const isSelected = selectedIds.has(p.id);
              return (
                <div 
                  key={p.folderName ? `${p.id}_${p.folderName}` : p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`${styles.batchItem} ${isSelected ? styles.batchItemSelected : ''}`}
                >
                  <div className={`${styles.batchCheckbox} ${isSelected ? styles.batchCheckboxChecked : ''}`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title || 'Dự án chưa đặt tên'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                      {p.sceneCount} cảnh • {p.videoFormat}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {projects.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-sub)', fontSize: 13 }}>
                Bạn chưa có dự án nào được lưu.
              </div>
            )}
          </div>

          <Button 
            variant="primary" 
            size="md"
            fullWidth
            onClick={handleStartBatch}
            disabled={selectedIds.size === 0}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            }
          >
            Bắt đầu xuất hàng loạt ({selectedIds.size})
          </Button>
        </>
      ) : (
        /* Hàng đợi (Queue UI) */
        <>
          {/* Top Progress & ETA Card */}
          <div style={{ 
            padding: '10px 14px', 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)', 
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isProcessing && <span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} />}
                <span style={{ fontSize: 12.5, fontWeight: 700, color: isProcessing ? 'var(--text)' : 'var(--accent)' }}>
                  {isProcessing ? 'Đang xuất hàng loạt' : 'Hoàn tất xuất hàng loạt'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                  ({completedJobs.length}/{jobs.length} video)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {etaText && (
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {isProcessing ? `Còn ${etaText}` : etaText}
                  </span>
                )}
                {!isProcessing && (
                  <Button variant="secondary" size="xs" onClick={resetBatch}>
                    Quay lại
                  </Button>
                )}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div style={{ width: '100%', height: 5, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ 
                width: `${overallProgress}%`, 
                height: '100%', 
                background: 'var(--accent)', 
                transition: 'width 0.3s ease' 
              }} />
            </div>
          </div>
          
          {/* Job Item List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '360px', paddingRight: 2 }}>
            {jobs.map((job: any, idx: number) => {
              const isDone = job.status === 'completed';
              const isRendering = job.status === 'rendering';
              const isQueued = job.status === 'queued';
              const isFailed = job.status === 'failed';

              return (
                <div 
                  key={job.projectId}
                  style={{ 
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    border: `1px solid ${isRendering ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    {/* Left: Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {idx + 1}. {job.title}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-sub)' }}>
                        {quality} • {fps} FPS
                      </span>
                    </div>

                    {/* Right: Status & Download */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {job.status === 'pending' && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chờ...</span>}
                      {isQueued && <span style={{ fontSize: 11, color: '#FCD34D', fontWeight: 600 }}>Đang chuẩn bị</span>}
                      {isRendering && <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700 }}>{job.progress}%</span>}
                      {isDone && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>Đã xong</span>}
                      {isFailed && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }} title={job.error}>Lỗi</span>}

                      {isDone && job.downloadUrl && (
                        <Button 
                          variant="ghost"
                          size="xs"
                          onClick={() => downloadFileDirectly(job.downloadUrl!, `${job.title}.mp4`)}
                          title="Tải video MP4"
                          leftIcon={
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          }
                          style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
                        >
                          MP4
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar only during active rendering */}
                  {isRendering && (
                    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${job.progress}%`, 
                        height: '100%', 
                        background: 'var(--accent)',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {isProcessing ? (
            <div className={styles.actionsRow}>
              {close && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={close}
                  title="Đóng popup, hệ thống tiếp tục render hàng loạt dưới nền"
                >
                  Thu nhỏ & Chạy ngầm
                </Button>
              )}
              <Button 
                variant="danger" 
                size="md" 
                onClick={cancelBatch}
              >
                Dừng xuất hàng loạt
              </Button>
            </div>
          ) : (
            <div className={styles.actionsRow}>
              {completedJobs.length > 0 && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={isZipping}
                  onClick={() => downloadBatchZip()}
                  leftIcon={
                    isZipping ? (
                      <span className={styles.spinner} style={{ width: 12, height: 12, borderWidth: 2 }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )
                  }
                >
                  {isZipping ? 'Đang nén ZIP...' : `Tải trọn bộ ZIP (${completedJobs.length} video)`}
                </Button>
              )}
              {close && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={close}
                >
                  Đóng
                </Button>
              )}
            </div>
          )}
        </>
      )}

    </div>
  )
}
