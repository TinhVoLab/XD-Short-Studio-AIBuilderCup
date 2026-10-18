import React, { useState, useRef } from 'react'
import styles from './AvatarUploader.module.css'
import { Button } from '@/components/ui'
import { API_BASE, apiFetch } from '@/config/api'
import { useEditorStore } from '@/store/useEditorStore'

interface AvatarUploaderProps {
  avatarUrl: string
  brandColor?: string
  authorName?: string
  compact?: boolean
  onChange: (newUrl: string) => void
}

/**
 * Tự động cắt vuông tâm (Center-Crop 1:1) và nén ảnh về 512x512 WebP/PNG
 * Đảm bảo file gửi lên server siêu nhẹ (<150KB) và sắc nét trên video Full HD
 */
async function cropAndCompressToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('File ảnh bị lỗi hoặc không hỗ trợ'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const TARGET_SIZE = 512
        canvas.width = TARGET_SIZE
        canvas.height = TARGET_SIZE

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Không thể khởi tạo Canvas 2D'))
        }

        // Cắt vuông từ tâm ảnh gốc
        const minDim = Math.min(img.width, img.height)
        const sx = Math.max(0, (img.width - minDim) / 2)
        const sy = Math.max(0, (img.height - minDim) / 2)

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE)

        // Xuất ra định dạng WebP hoặc fallback PNG
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Nén ảnh thất bại'))
          },
          'image/webp',
          0.92
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  avatarUrl,
  brandColor = '#BEFF01',
  authorName = '',
  compact = false,
  onChange,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const showToast = useEditorStore((s) => s.showToast)
  const currentUser = useEditorStore((s) => s.currentUser)

  // Khởi tạo chữ cái đại diện khi chưa có ảnh
  const getInitials = (name: string) => {
    if (!name.trim()) return 'XD'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Kiểm tra dung lượng thô (tối đa 5MB trước khi nén)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh gốc quá lớn. Vui lòng chọn ảnh dưới 5MB!', 3500)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    try {
      // 1. Tự động crop vuông và nén về 512x512 WebP (<150KB)
      const compressedBlob = await cropAndCompressToSquare(file)
      
      // Giới hạn an toàn <= 1MB
      if (compressedBlob.size > 1024 * 1024) {
        throw new Error('Dung lượng ảnh sau khi nén vẫn vượt quá 1MB.')
      }

      // 2. Chuẩn bị FormData gửi lên endpoint theo thư mục user
      const formData = new FormData()
      formData.append('avatar', compressedBlob, 'avatar.webp')
      if (currentUser?.id) {
        formData.append('userId', currentUser.id)
      }

      // 3. Gửi API Upload
      const res = await apiFetch(`${API_BASE}/api/upload/avatar`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || 'Lỗi khi tải ảnh lên server')
      }

      const data = await res.json()
      if (data.url) {
        onChange(data.url)
        showToast('Đã cập nhật avatar thương hiệu thành công!', 2500)
      }
    } catch (err: any) {
      console.error('[AvatarUpload] Error:', err)
      showToast(err.message || 'Tải ảnh lên thất bại. Vui lòng thử lại!', 4000)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return
    setIsUploading(true)
    try {
      await apiFetch(`${API_BASE}/api/upload/avatar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || 'guest' }),
      })
      onChange('')
      setManualUrl('')
      showToast('Đã gỡ avatar thương hiệu.', 2000)
    } catch (err: any) {
      console.error('[AvatarDelete] Error:', err)
      onChange('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleApplyManualUrl = () => {
    if (!manualUrl.trim()) return
    onChange(manualUrl.trim())
    showToast('Đã liên kết avatar từ URL!', 2000)
  }

  if (compact) {
    return (
      <div className={styles.containerCompact}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
        />

        <div className={styles.compactRow}>
          <div
            className={`${styles.previewWrapperCompact} ${isUploading ? styles.previewWrapperLoading : ''}`}
            style={{
              borderColor: avatarUrl ? brandColor : 'var(--border)',
              boxShadow: avatarUrl ? `0 0 8px ${brandColor}33` : 'none',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className={styles.previewImg}
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <span className={styles.placeholderInitialsCompact} style={{ color: brandColor }}>
                {getInitials(authorName)}
              </span>
            )}
          </div>

          <div className={styles.compactMeta}>
            <span className={styles.compactTitle}>Ảnh đại diện</span>
            <div className={styles.compactActions}>
              <Button
                variant="secondary"
                size="xs"
                loading={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? 'Đổi ảnh' : 'Tải ảnh'}
              </Button>

              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={isUploading}
                  onClick={handleDeleteAvatar}
                >
                  Gỡ
                </Button>
              )}

              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowUrlInput(!showUrlInput)}
                title="Dán đường dẫn URL"
              >
                {showUrlInput ? 'Ẩn' : 'URL'}
              </Button>
            </div>
          </div>
        </div>

        {showUrlInput && (
          <div className={styles.urlInputRow}>
            <input
              className={styles.urlInput}
              value={manualUrl || (avatarUrl.startsWith('http') ? avatarUrl : '')}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://.../avatar.png"
            />
            <Button
              variant="secondary"
              size="xs"
              onClick={handleApplyManualUrl}
              disabled={!manualUrl.trim()}
            >
              Lưu
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Input File Ẩn */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
      />

      <div className={styles.mainRow}>
        {/* Vòng tròn Preview bo viền theo Brand Color */}
        <div
          className={`${styles.previewWrapper} ${isUploading ? styles.previewWrapperLoading : ''}`}
          style={{
            borderColor: avatarUrl ? brandColor : 'var(--border)',
            boxShadow: avatarUrl ? `0 0 12px ${brandColor}33` : 'none',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar thương hiệu"
              className={styles.previewImg}
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <span className={styles.placeholderInitials} style={{ color: brandColor }}>
              {getInitials(authorName)}
            </span>
          )}
        </div>

        {/* Cột thông tin & Các nút thao tác */}
        <div className={styles.infoCol}>
          <div className={styles.titleText}>Ảnh đại diện thương hiệu</div>
          <div className={styles.hintText}>
            Định dạng PNG, JPG, WebP tối đa 1MB. Tự động crop vuông 512×512 chuẩn HD.
          </div>

          <div className={styles.actionsRow} style={{ marginTop: 4 }}>
            <Button
              variant="primary"
              size="xs"
              loading={isUploading}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              }
            >
              {avatarUrl ? 'Đổi ảnh khác' : 'Tải ảnh lên'}
            </Button>

            {avatarUrl && (
              <Button
                variant="ghost"
                size="xs"
                disabled={isUploading}
                onClick={handleDeleteAvatar}
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                }
              >
                Gỡ ảnh
              </Button>
            )}

            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowUrlInput(!showUrlInput)}
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              }
            >
              {showUrlInput ? 'Ẩn URL' : 'Dán link URL'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tùy chọn mở rộng: Dán URL ngoài */}
      {showUrlInput && (
        <div className={styles.urlInputRow}>
          <input
            className={styles.urlInput}
            value={manualUrl || (avatarUrl.startsWith('http') ? avatarUrl : '')}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
          />
          <Button
            variant="secondary"
            size="xs"
            onClick={handleApplyManualUrl}
            disabled={!manualUrl.trim()}
          >
            Áp dụng link
          </Button>
        </div>
      )}
    </div>
  )
}
