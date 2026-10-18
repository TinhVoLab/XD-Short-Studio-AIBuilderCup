import React, { useState, useRef, useMemo } from 'react'
import { API_BASE } from '@/config/api'
import styles from './Panels.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button, SegmentedControl } from '@/components/ui'

type MediaFilterType = 'all' | 'image' | 'video'

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      window.URL.revokeObjectURL(v.src)
      resolve(v.duration || 0)
    }
    v.onerror = () => {
      window.URL.revokeObjectURL(v.src)
      resolve(0)
    }
    v.src = URL.createObjectURL(file)
  })
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function MediaPanel() {
  const {
    uploadedMedia,
    addUploadedMedia,
    removeUploadedMedia,
    addElement,
    showToast,
    currentUser,
    scenes,
    currentSceneIdx,
    updateScene,
  } = useEditorStore(
    useShallow((s) => ({
      uploadedMedia: s.uploadedMedia,
      addUploadedMedia: s.addUploadedMedia,
      removeUploadedMedia: s.removeUploadedMedia,
      addElement: s.addElement,
      showToast: s.showToast,
      currentUser: s.currentUser,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      updateScene: s.updateScene,
    }))
  )

  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [viewCols, setViewCols] = useState<2 | 3>(2)
  const [mediaFilter, setMediaFilter] = useState<MediaFilterType>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFree = currentUser.planTier === 'free'
  const maxVideoSizeBytes = isFree ? 10 * 1024 * 1024 : 25 * 1024 * 1024
  const maxImageSizeBytes = 5 * 1024 * 1024
  const maxStorageBytes = isFree ? 20 * 1024 * 1024 : 100 * 1024 * 1024

  const totalUsedBytes = useMemo(() => {
    return uploadedMedia.reduce((acc, m) => acc + (m.size || 0), 0)
  }, [uploadedMedia])

  const totalUsedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1)
  const maxStorageMB = Math.round(maxStorageBytes / (1024 * 1024))
  const storagePct = Math.min(100, Math.round((totalUsedBytes / maxStorageBytes) * 100))

  const filteredMedia = useMemo(() => {
    if (mediaFilter === 'image') {
      return uploadedMedia.filter(
        (m) => m.type === 'image' || (!m.type && !m.url.match(/\.(mp4|webm|mov)$/i))
      )
    }
    if (mediaFilter === 'video') {
      return uploadedMedia.filter(
        (m) => m.type === 'video' || (m.url && m.url.match(/\.(mp4|webm|mov)$/i))
      )
    }
    return uploadedMedia
  }, [uploadedMedia, mediaFilter])

  const handleFileUploads = async (files: FileList | File[]) => {
    const fileList = Array.from(files)
    const validFiles = fileList.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    )

    if (validFiles.length === 0) {
      showToast('Chỉ hỗ trợ tệp ảnh (.png, .jpg, .svg, .webp) và video (.mp4, .webm)', 3500)
      return
    }

    // Storage capacity check
    const incomingSize = validFiles.reduce((acc, f) => acc + f.size, 0)
    if (totalUsedBytes + incomingSize > maxStorageBytes) {
      showToast(
        `Bộ nhớ tài nguyên (${totalUsedMB}MB / ${maxStorageMB}MB) đã đầy. Hãy xóa bớt clip/ảnh cũ trong thư viện!`,
        4000
      )
      return
    }

    setIsUploading(true)
    let successCount = 0

    for (const file of validFiles) {
      const isVideo = file.type.startsWith('video/')

      // 1. Size constraint check
      const limit = isVideo ? maxVideoSizeBytes : maxImageSizeBytes
      const limitLabel = isVideo ? (isFree ? '10MB' : '25MB') : '5MB'
      if (file.size > limit) {
        showToast(
          `Tệp "${file.name}" vượt quá mức cho phép ${limitLabel}. Vui lòng nén hoặc chọn tệp nhỏ hơn!`,
          4000
        )
        continue
      }

      // 2. Video duration pre-check (client-side)
      let videoDuration = 0
      if (isVideo) {
        try {
          videoDuration = await getVideoDuration(file)
          if (videoDuration > 30) {
            showToast(
              `Clip "${file.name}" dài ${Math.round(videoDuration)}s (vượt mức 30s). Hãy cắt ngắn trước khi tải lên!`,
              4500
            )
            continue
          }
        } catch {
          videoDuration = 0
        }
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Upload failed')

        const data = await res.json()
        addUploadedMedia({
          id: data.id,
          url: data.url,
          name: data.name,
          type: data.type || (isVideo ? 'video' : 'image'),
          size: data.size || file.size,
          duration: videoDuration || undefined,
          filename: data.filename,
        })
        successCount++
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    setIsUploading(false)
    if (successCount > 0) {
      showToast(`Đã tải lên ${successCount} tài nguyên thành công!`, 2500)
    } else {
      showToast('Không thể tải tệp lên máy chủ', 3000)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUploads(e.target.files)
    }
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUploads(e.dataTransfer.files)
    }
  }

  const handleAddImageToCanvas = (url: string) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width
      let h = img.height
      let scale = 1

      if (w > 240) {
        scale = 240 / w
      }

      addElement({
        type: 'image',
        src: url,
        left: 180,
        top: 320,
        width: w,
        height: h,
        scaleX: scale,
        scaleY: scale,
        angle: 0,
        opacity: 1,
        animPreset: 'fade-in',
        animDelay: 0.1,
        animDuration: 0.5,
      })
      showToast('Đã chèn ảnh vào Canvas!', 1500)
    }
    img.src = url
  }

  const handleAddVideoToCanvas = (url: string) => {
    addElement({
      type: 'video',
      src: url,
      left: 180,
      top: 300,
      width: 240,
      height: 135,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      objectFit: 'cover',
      videoLoop: true,
      videoVolume: 0,
      animPreset: 'fade-in',
      animDelay: 0.1,
      animDuration: 0.5,
    })
    showToast('Đã chèn phần tử Video vào Canvas!', 1500)
  }

  const handleSetAsSceneBackground = (url: string) => {
    const activeScene = scenes[currentSceneIdx]
    if (!activeScene) return
    updateScene(activeScene.id, {
      bgVideoUrl: url,
      bgVideoLoop: true,
      bgVideoVolume: 0,
    })
    showToast('Đã đặt làm Video Nền cho Cảnh!', 2000)
  }

  const handleDeleteMedia = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    removeUploadedMedia(id, true)
    showToast(`Đã xóa tài nguyên "${name}" khỏi ổ đĩa`, 2000)
  }

  return (
    <div
      className={styles.svgPanelContainer}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false)
        }
      }}
      onDrop={onDrop}
      style={{ position: 'relative', minHeight: '100%' }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onInputChange}
        accept="image/*,video/mp4,video/webm"
        multiple
        style={{ display: 'none' }}
      />

      {/* Drag & Drop Full-Panel Overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(10, 10, 12, 0.94)',
            backdropFilter: 'blur(6px)',
            border: '2px dashed var(--accent)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'var(--accent)',
            pointerEvents: 'none',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4V16M12 4L8 8M12 4L16 8M4 20H20" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            Thả tệp ảnh hoặc video vào đây
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
            Hỗ trợ PNG, JPG, WEBP, SVG và MP4, WebM (≤ 30s)
          </div>
        </div>
      )}

      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={isUploading}
          leftIcon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? 'Đang tải...' : 'Tải Ảnh / Video'}
        </Button>

        {/* View Switcher Toggle (2 cols vs 3 cols) */}
        <SegmentedControl
          options={[
            {
              value: '2',
              label: '',
              title: 'Lưới 2 Cột',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="8" height="8" rx="1" />
                  <rect x="13" y="3" width="8" height="8" rx="1" />
                  <rect x="3" y="13" width="8" height="8" rx="1" />
                  <rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
              ),
            },
            {
              value: '3',
              label: '',
              title: 'Lưới 3 Cột',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="3" width="5" height="8" rx="1" />
                  <rect x="9.5" y="3" width="5" height="8" rx="1" />
                  <rect x="17" y="3" width="5" height="8" rx="1" />
                  <rect x="2" y="13" width="5" height="8" rx="1" />
                  <rect x="9.5" y="13" width="5" height="8" rx="1" />
                  <rect x="17" y="13" width="5" height="8" rx="1" />
                </svg>
              ),
            },
          ]}
          value={String(viewCols)}
          onChange={(val) => setViewCols(Number(val) as 2 | 3)}
          size="xs"
        />
      </div>

      {/* Filter Segmented Control: Tất cả | Hình ảnh | Video */}
      <div style={{ marginBottom: '12px' }}>
        <SegmentedControl
          options={[
            { value: 'all', label: `Tất cả (${uploadedMedia.length})` },
            {
              value: 'image',
              label: `Ảnh (${
                uploadedMedia.filter(
                  (m) => m.type === 'image' || (!m.type && !m.url.match(/\.(mp4|webm|mov)$/i))
                ).length
              })`,
            },
            {
              value: 'video',
              label: `Video (${
                uploadedMedia.filter(
                  (m) => m.type === 'video' || (m.url && m.url.match(/\.(mp4|webm|mov)$/i))
                ).length
              })`,
            },
          ]}
          value={mediaFilter}
          onChange={(val) => setMediaFilter(val as MediaFilterType)}
          size="xs"
          fullWidth
        />
      </div>

      {/* Storage Capacity Gauge (Anti-Bloat Protection) */}
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-sub)' }}>
            Dung lượng lưu trữ ({isFree ? 'Gói Free' : 'Gói Pro'})
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: storagePct > 85 ? '#FF4D4F' : 'var(--text)',
            }}
          >
            {totalUsedMB} / {maxStorageMB} MB
          </span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${storagePct}%`,
              background: storagePct > 85 ? '#FF4D4F' : 'var(--accent)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Asset Grid */}
      {filteredMedia.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '1.5px dashed var(--border)',
            borderRadius: '12px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--surface-2)',
            transition: 'all 0.2s',
            marginTop: '6px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
            Chưa có {mediaFilter === 'video' ? 'video' : mediaFilter === 'image' ? 'ảnh' : 'tài nguyên'} nào
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Bấm vào đây hoặc Kéo thả tệp từ máy tính vào để sử dụng
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${viewCols}, 1fr)`,
            gap: viewCols === 3 ? '8px' : '12px',
          }}
        >
          {filteredMedia.map((item) => {
            const isHovered = hoveredId === item.id
            const isVideo = item.type === 'video' || (item.url && item.url.match(/\.(mp4|webm|mov)$/i))

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: 'relative',
                  aspectRatio: isVideo ? '16/9' : '1',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: isHovered ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  backgroundColor: '#0a0a0c',
                  boxShadow: isHovered ? '0 4px 14px rgba(0,0,0,0.5)' : 'none',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Media Preview (Video vs Image) */}
                {isVideo ? (
                  <video
                    src={item.url}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}

                {/* Video Badge & Duration */}
                {isVideo && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent)">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)' }}>
                      {item.duration ? formatDuration(item.duration) : 'VIDEO'}
                    </span>
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '6px',
                    pointerEvents: isHovered ? 'auto' : 'none',
                  }}
                >
                  {/* Top Bar: Delete Button */}
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => handleDeleteMedia(e, item.id, item.name)}
                      title="Xóa tệp khỏi máy chủ"
                      style={{
                        background: 'rgba(255, 60, 60, 0.85)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Center Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                    {isVideo ? (
                      <>
                        <button
                          onClick={() => handleAddVideoToCanvas(item.url)}
                          style={{
                            background: 'var(--accent)',
                            color: '#000',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: '100%',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M12 8v8M8 12h8" />
                          </svg>
                          Chèn Canvas
                        </button>

                        <button
                          onClick={() => handleSetAsSceneBackground(item.url)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: '100%',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                          </svg>
                          Làm Nền Cảnh
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAddImageToCanvas(item.url)}
                        style={{
                          background: 'var(--accent)',
                          color: '#000',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Chèn
                      </button>
                    )}
                  </div>

                  {/* Bottom Text Name */}
                  <div
                    style={{
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.85)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      paddingTop: '2px',
                    }}
                  >
                    {item.name}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

