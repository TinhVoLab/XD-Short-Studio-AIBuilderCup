import React, { useState, useRef, useEffect } from 'react'
import styles from './MascotStudioModal.module.css'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useEditorStore } from '@/store/useEditorStore'
import { STANDARD_POSE_SLOTS, MascotProfile, MASCOT_CATEGORIES, DEFAULT_DOODLE_PROFILE } from '@/types/character'
import { API_BASE } from '@/config/api'
import { Button, SegmentedControl } from '@/components/ui'

export const MascotStudioModal: React.FC = () => {
  const {
    mascotStudioOpen,
    setMascotStudioOpen,
    showToast,
  } = useEditorStore()

  const {
    mascotProfiles,
    activeMascotProfileId,
    setMascotProfile,
    updateMascotSlot,
    deleteMascotSlot,
    deleteMascotProfile,
    setActiveMascotProfileId,
    autoPoseRules,
    updateAutoPoseRule,
  } = useSettingsStore()

  const [activeTab, setActiveTab] = useState<'poses' | 'ai-rules'>('poses')
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [showNewProfileInput, setShowNewProfileInput] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [showPromptModal, setShowPromptModal] = useState(false)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mascotStudioOpen) {
        setMascotStudioOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mascotStudioOpen, setMascotStudioOpen])

  if (!mascotStudioOpen) return null

  const activeProfile: MascotProfile =
    mascotProfiles[activeMascotProfileId] || {
      id: 'doodle-boy',
      name: 'Doodle Nét Trắng',
      accentColor: '#BEFF01',
      slots: {},
      isDefault: true,
    }

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      showToast('Vui lòng nhập tên bộ nhân vật!')
      return
    }
    const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newProfile: MascotProfile = {
      id,
      name: newProfileName.trim(),
      accentColor: '#BEFF01',
      slots: {},
    }
    setMascotProfile(newProfile)
    setActiveMascotProfileId(id)
    setNewProfileName('')
    setShowNewProfileInput(false)
    showToast(`Đã tạo bộ nhân vật: "${newProfile.name}"`)
  }

  const uploadSingleSlot = async (poseId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Chỉ hỗ trợ file ảnh (.png, .jpg, .svg, .webp)')
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl)
      if (img.width > 0 && img.height / img.width < 1.35) {
        showToast('Ảnh có tỉ lệ gần vuông (khuyên dùng tỉ lệ dọc 9:16 để hiển thị đẹp nhất)', 3500)
      }

      setIsUploading(poseId)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        updateMascotSlot(activeMascotProfileId, poseId, data.url)
        showToast(`Đã nạp ảnh cho biểu cảm [${poseId}]!`, 2000)
      } catch (err: any) {
        showToast('Lỗi upload: ' + (err.message || 'Không thể tải ảnh'))
      } finally {
        setIsUploading(null)
      }
    }
    img.src = objectUrl
  }

  const handleBatchUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (fileList.length === 0) {
      showToast('Không tìm thấy file ảnh hợp lệ!')
      return
    }

    showToast(`Đang đối soát và tải ${fileList.length} ảnh lên...`, 2000)
    let matchedCount = 0

    for (const file of fileList) {
      const fileNameLower = file.name.toLowerCase().replace(/\.[^/.]+$/, '')
      const matchedSlot = STANDARD_POSE_SLOTS.find(
        s => fileNameLower.includes(s.id) || fileNameLower.includes(s.name.toLowerCase())
      )

      if (matchedSlot) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData })
          if (res.ok) {
            const data = await res.json()
            updateMascotSlot(activeMascotProfileId, matchedSlot.id, data.url)
            matchedCount++
          }
        } catch (e) {
          console.warn('Batch upload error:', e)
        }
      }
    }

    if (matchedCount > 0) {
      showToast(`Đã tự động gán thành công ${matchedCount} biểu cảm!`, 3000)
    } else {
      showToast('Không tìm thấy tên file khớp với danh sách biểu cảm (vd: happy.png, idea.png)', 4000)
    }
  }

  return (
    <div className={styles.backdrop} onClick={() => setMascotStudioOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Mascot Studio — Quản Lý Bộ Nhân Vật & Biểu Cảm AI</h2>
              <div className={styles.subtitle}>
                Tài sản toàn cục: Upload 1 lần — Dùng cho mọi dự án, Canvas và AI Video Generator
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <input
              type="file"
              ref={batchFileInputRef}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) handleBatchUpload(e.target.files)
                e.target.value = ''
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
              }
              onClick={() => setShowPromptModal(true)}
              title="Xem & Sao chép Prompt mẫu để tạo bộ nhân vật bằng Midjourney / Flux / Recraft"
            >
              Prompt Sheet AI
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              onClick={() => batchFileInputRef.current?.click()}
              title="Tải lên nhiều ảnh cùng lúc, hệ thống tự khớp theo tên file (vd: happy.png, idea.png)"
              style={{ color: '#BEFF01', borderColor: 'rgba(190,255,1,0.35)' }}
            >
              Upload Hàng Loạt
            </Button>
            <Button
              asIcon
              variant="ghost"
              size="icon-sm"
              onClick={() => setMascotStudioOpen(false)}
              title="Đóng (ESC)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
        </div>

        {/* ── 2-COLUMN STUDIO WORKSPACE ── */}
        <div className={styles.layout}>
          {/* LEFT SIDEBAR: PROFILES */}
          <div className={styles.sidebar}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                BỘ NHÂN VẬT ({Object.keys(mascotProfiles).length})
              </span>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowNewProfileInput(!showNewProfileInput)}
              >
                + Thêm Mới
              </Button>
            </div>

            {showNewProfileInput && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 8 }}>
                <input
                  className={styles.input}
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Tên bộ (vd: 3D Boy, Chibi...)"
                  style={{ fontSize: 11, padding: '6px 8px' }}
                />
                <Button
                  variant="primary"
                  size="xs"
                  fullWidth
                  onClick={handleCreateProfile}
                >
                  Tạo Bộ Nhân Vật
                </Button>
              </div>
            )}

            {/* List of profiles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
              {Object.values(mascotProfiles).map((p) => {
                const isActive = p.id === activeMascotProfileId
                const slotCount = Object.keys(p.slots || {}).length

                return (
                  <div
                    key={p.id}
                    className={`${styles.profileCard} ${isActive ? styles.profileCardActive : ''}`}
                    onClick={() => setActiveMascotProfileId(p.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? '#BEFF01' : '#FFFFFF' }}>
                        {p.name}
                      </span>
                      {p.isDefault && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9.5, background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: 4, color: 'rgba(255,255,255,0.6)' }}>
                            Mặc định
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm('Khôi phục lại toàn bộ ảnh Starter Pack cho bộ nhân vật này?')) {
                                setMascotProfile({
                                  ...DEFAULT_DOODLE_PROFILE,
                                  id: p.id,
                                  name: 'Tech Doodle (Mặc định)',
                                })
                                showToast('Đã khôi phục Starter Pack mặc định!')
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#BEFF01',
                              cursor: 'pointer',
                              fontSize: 10,
                              padding: '2px 4px',
                            }}
                            title="Khôi phục lại ảnh Starter Pack gốc"
                          >
                            ↺ Khôi phục
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      <span>{slotCount} / {STANDARD_POSE_SLOTS.length} slot</span>
                      {!p.isDefault && (
                        <Button
                          asIcon
                          variant="danger"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Xác nhận xóa bộ nhân vật "${p.name}"?`)) {
                              deleteMascotProfile(p.id)
                              showToast(`Đã xóa bộ "${p.name}"`)
                            }
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* MAIN CONTENT WORKSPACE */}
          <div className={styles.mainContent}>
            {/* TABS BAR */}
            <div style={{ marginBottom: 12 }}>
              <SegmentedControl
                options={[
                  { value: 'poses', label: '12 Slot Dáng & Biểu Cảm (9:16)' },
                  { value: 'ai-rules', label: 'Huấn Luyện AI (Auto-Pose Rules)' }
                ]}
                value={activeTab}
                onChange={(val) => setActiveTab(val as any)}
                size="sm"
                fullWidth
              />
            </div>

            {/* TAB 1: CATEGORIZED POSE SLOTS (3 SECTIONS) */}
            {activeTab === 'poses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
                {/* Stats Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    gap: 12,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
                      Bộ nhân vật: <strong style={{ color: '#BEFF01' }}>{activeProfile.name.replace(' (Mặc định)', '')}</strong>
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'rgba(190, 255, 1, 0.12)',
                        color: '#BEFF01',
                        padding: '2px 8px',
                        borderRadius: 12,
                        border: '1px solid rgba(190, 255, 1, 0.25)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Tổng: {Object.keys(activeProfile.slots || {}).length} / {STANDARD_POSE_SLOTS.length} slot
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    3 nhóm chuẩn Character Sheet (Tự động lọc nền đen 9:16)
                  </div>
                </div>

                {/* 3 CATEGORIZED SECTIONS */}
                {MASCOT_CATEGORIES.map((cat) => {
                  const catSlots = STANDARD_POSE_SLOTS.filter(s => s.category === cat.id)
                  const filledCount = catSlots.filter(s => !!activeProfile.slots?.[s.id]).length

                  return (
                    <div key={cat.id} className={styles.categorySection}>
                      <div className={styles.categoryHeader}>
                        <div>
                          <div className={styles.categoryTitle}>
                            <span>{cat.title}</span>
                          </div>
                          <div className={styles.categorySubtitle}>{cat.subtitle}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: filledCount === catSlots.length ? 'rgba(190, 255, 1, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                            color: filledCount === catSlots.length ? '#BEFF01' : 'rgba(255, 255, 255, 0.65)',
                            padding: '3px 10px',
                            borderRadius: 12,
                            border: `1px solid ${filledCount === catSlots.length ? 'rgba(190, 255, 1, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          }}
                        >
                          Đã nạp {filledCount} / {catSlots.length} slot
                        </span>
                      </div>

                      <div className={styles.slotsGrid}>
                        {catSlots.map((slot) => {
                          const slotUrl = activeProfile.slots?.[slot.id]
                          const isSlotUploading = isUploading === slot.id

                          return (
                            <div
                              key={slot.id}
                              className={`${styles.slotCard} ${slotUrl ? styles.slotCardFilled : ''}`}
                            >
                              {/* Top Tag */}
                              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: slotUrl ? '#BEFF01' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                  {slot.id}
                                </span>
                              </div>

                              {/* Image / Upload Trigger */}
                              <label
                                style={{
                                  flex: 1,
                                  width: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  margin: '4px 0',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  minHeight: 0,
                                }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      uploadSingleSlot(slot.id, e.target.files[0])
                                    }
                                    e.target.value = ''
                                  }}
                                />

                                {isSlotUploading ? (
                                  <div style={{ fontSize: 10.5, color: '#BEFF01', fontWeight: 600 }}>Đang tải...</div>
                                ) : slotUrl ? (
                                  <img
                                    src={slotUrl}
                                    alt={slot.name}
                                    style={{
                                      maxHeight: '100%',
                                      maxWidth: '100%',
                                      objectFit: 'contain',
                                      borderRadius: 6,
                                      filter: 'drop-shadow(0 0 5px rgba(190, 255, 1, 0.35))',
                                    }}
                                  />
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                                      <path d="M12 8V16M8 12H16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                      Nạp ảnh
                                    </span>
                                  </div>
                                )}
                              </label>

                              {/* Footer Info */}
                              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    color: slotUrl ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: slotUrl ? '75%' : '100%',
                                    fontWeight: slotUrl ? 600 : 400,
                                  }}
                                  title={slot.description}
                                >
                                  {slot.name}
                                </span>
                                {slotUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteMascotSlot(activeMascotProfileId, slot.id)
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'rgba(255,68,68,0.75)',
                                      cursor: 'pointer',
                                      fontSize: 11,
                                      padding: '1px 3px',
                                    }}
                                    title="Xóa ảnh slot này"
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* TAB 2: AUTO-POSE AI RULES */}
            {activeTab === 'ai-rules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(190, 255, 1, 0.05)', border: '1px solid rgba(190, 255, 1, 0.15)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#BEFF01', marginBottom: 3 }}>
                    Cơ Chế Dạy AI Chọn Biểu Cảm Tự Động
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    Khi tạo kịch bản AI, hệ thống sẽ phân tích ngữ cảnh từng cảnh (lời thoại, ý chính) và đối chiếu với mẫu từ khóa dưới đây để gán biểu cảm phù hợp nhất.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                  {autoPoseRules.map((rule) => (
                    <div
                      key={rule.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '150px 1fr 160px',
                        gap: 12,
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '10px 14px',
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{rule.description}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{rule.id}</div>
                      </div>
                      <input
                        className={styles.input}
                        value={rule.keywordPattern}
                        onChange={(e) => updateAutoPoseRule(rule.id, { keywordPattern: e.target.value })}
                        style={{ fontSize: 11.5, fontFamily: 'monospace', padding: '6px 10px' }}
                        title="Các từ khóa ngăn cách bằng dấu gạch đứng |"
                      />
                      <select
                        className={styles.select}
                        value={rule.targetPose}
                        onChange={(e) => updateAutoPoseRule(rule.id, { targetPose: e.target.value })}
                        style={{ fontSize: 12, padding: '6px 10px' }}
                      >
                        {STANDARD_POSE_SLOTS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id} ({s.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PROMPT SHEET AI GUIDE MODAL ── */}
      {showPromptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowPromptModal(false)}
        >
          <div
            style={{
              background: '#0e1526',
              border: '1px solid rgba(190, 255, 1, 0.3)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 680,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 22,
              boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 30px rgba(190,255,1,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                  Prompt Sheet AI — Tạo Bộ Dáng Đồng Nhất
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>
                  Dùng cho Midjourney v6, Flux, hoặc Recraft. Nền đen tuyền sẽ tự động hòa trộn 100% trong suốt khi vào studio.
                </p>
              </div>
              <Button asIcon variant="ghost" size="icon-xs" onClick={() => setShowPromptModal(false)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
              {/* Master Prompt Box */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#BEFF01' }}>
                    1. Prompt Mẫu Gốc (Master Prompt)
                  </span>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => {
                      const text = `A minimalist modern tech doodle character mascot, young tech creator with glasses, headphones around neck, hoodie, sneakers, clean bold white vector line art style, sleek flat 2D cartoon doodle, solid pitch-black background, high contrast, expressing [EXPRESSION], character sheet asset, full body --ar 9:16 --v 6.0`
                      navigator.clipboard.writeText(text)
                      showToast('Đã sao chép Master Prompt!')
                    }}
                  >
                    Sao chép Prompt
                  </Button>
                </div>
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.85)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontFamily: 'monospace',
                  }}
                >
{`A minimalist modern tech doodle character mascot, young tech creator with glasses, headphones around neck, hoodie, sneakers, clean bold white vector line art style, sleek flat 2D cartoon doodle, solid pitch-black background, high contrast, expressing [EXPRESSION], character sheet asset, full body --ar 9:16 --v 6.0`}
                </pre>
              </div>

              {/* 6 Core Expressions Table */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#BEFF01', display: 'block', marginBottom: 10 }}>
                  2. Thay thế [EXPRESSION] cho 6 tư thế cốt lõi:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { slot: 'idea', name: 'Nảy ý tưởng (Hook)', expr: "joyful 'aha! idea' expression, one finger pointing up with a glowing neon lightbulb floating above head" },
                    { slot: 'thinking', name: 'Suy nghĩ (Mở đầu)', expr: "deep thoughtful pose, one hand touching chin in curiosity, thinking expression looking upwards" },
                    { slot: 'pointing-up', name: 'Chỉ tay (Con số/Tiêu đề)', expr: "one hand pointing straight up with index finger directing audience attention, friendly engaging smile" },
                    { slot: 'laptop', name: 'Làm việc / Thực hành', expr: "holding an open modern slim laptop, typing and working productively, focused happy expression" },
                    { slot: 'confused', name: 'Bối rối / Sai lầm', expr: "confused and puzzled expression, shrugging with both hands slightly up, question marks floating around head" },
                    { slot: 'victory', name: 'Chiến thắng (CTA)', expr: "celebrating victory pose, raising two hands with V peace signs, big energetic happy smile" },
                  ].map(item => (
                    <div
                      key={item.slot}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#FFFFFF' }}>
                          <span style={{ color: '#BEFF01', fontFamily: 'monospace' }}>[{item.slot}]</span> — {item.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.expr}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          navigator.clipboard.writeText(item.expr)
                          showToast(`Đã chép cụm từ [${item.slot}]!`)
                        }}
                      >
                        Chép cụm từ
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div style={{ background: 'rgba(190,255,1,0.04)', border: '1px solid rgba(190,255,1,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#BEFF01', marginBottom: 4 }}>
                  Mẹo giữ nhân vật nhất quán 100%:
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  • Trên Midjourney: Thêm tham số <code>--seed 12345</code> hoặc dùng ảnh đầu tiên làm Character Reference (<code>--cref [url]</code>).<br />
                  • Đặt tên file theo đúng mã slot (vd: <code>idea.jpg</code>, <code>thinking.jpg</code>) rồi dùng nút <strong>[Upload Hàng Loạt]</strong> để hệ thống tự động gán vào các ô trong 1 giây!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
