import React, { useState } from 'react'
import styles from '../Tabs.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { AlignmentType, DistributionAxis } from '@/utils/alignment'
import { Button, SectionHeader } from '@/components/ui'
import { ScrubNumberInput } from '../../components/ScrubNumberInput'

const DistributeHIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="4" x2="4" y2="20" />
    <line x1="20" y1="4" x2="20" y2="20" />
    <rect x="9" y="7" width="6" height="10" rx="1" fill="currentColor" opacity="0.6" />
  </svg>
)

const DistributeVIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="4" x2="20" y2="4" />
    <line x1="4" y1="20" x2="20" y2="20" />
    <rect x="7" y="9" width="10" height="6" rx="1" fill="currentColor" opacity="0.6" />
  </svg>
)

export function ElementAlignmentToolbar() {
  const {
    selectedElementId,
    selectedElementIds,
    alignElements,
    distributeElements,
    updateElement,
    showToast,
    scenes,
    currentSceneIdx
  } = useEditorStore(
    useShallow(s => ({
      selectedElementId: s.selectedElementId,
      selectedElementIds: s.selectedElementIds,
      alignElements: s.alignElements,
      distributeElements: s.distributeElements,
      updateElement: s.updateElement,
      showToast: s.showToast,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx
    }))
  )

  const [isRatioLocked, setIsRatioLocked] = useState(false)

  const curScene = scenes[currentSceneIdx]
  const targetIds = selectedElementIds.length > 0 ? selectedElementIds : (selectedElementId ? [selectedElementId] : [])
  const primaryEl = curScene?.elements.find(e => e.id === (targetIds[0] || ''))

  if (targetIds.length === 0 || !primaryEl) {
    return null
  }

  const isMulti = targetIds.length > 1

  const handleAlign = (type: AlignmentType) => {
    alignElements(targetIds, type, isMulti ? 'selection' : 'canvas')
    const labels: Record<AlignmentType, string> = {
      'left': 'trái',
      'center-h': 'giữa ngang',
      'right': 'phải',
      'top': 'trên',
      'center-v': 'giữa dọc',
      'bottom': 'dưới'
    }
    showToast(`Đã căn ${labels[type]} ${isMulti ? `(${targetIds.length} phần tử)` : ''}`)
  }

  const handleDistribute = (axis: DistributionAxis) => {
    distributeElements(targetIds, axis)
    showToast(`Đã phân bổ đều khoảng cách ${axis === 'horizontal' ? 'ngang' : 'dọc'}`)
  }

  const calcW = Math.round((primaryEl.width || 200) * (primaryEl.scaleX || 1))
  const calcH = Math.round((primaryEl.height || 60) * (primaryEl.scaleY || 1))
  const currentAngle = Math.round(primaryEl.angle || 0)
  const currentOpacity = Math.round(((primaryEl.opacity ?? 1) * 100))

  const handleWidthChange = (newW: number) => {
    const currentW = calcW || 1
    const currentH = calcH || 1
    const ratio = currentW / currentH
    const newH = isRatioLocked ? Math.max(1, Math.round(newW / ratio)) : currentH
    updateElement(primaryEl.id, {
      width: newW,
      scaleX: 1,
      ...(isRatioLocked ? { height: newH, scaleY: 1 } : {}),
    })
  }

  const handleHeightChange = (newH: number) => {
    const currentW = calcW || 1
    const currentH = calcH || 1
    const ratio = currentW / currentH
    const newW = isRatioLocked ? Math.max(1, Math.round(newH * ratio)) : currentW
    updateElement(primaryEl.id, {
      height: newH,
      scaleY: 1,
      ...(isRatioLocked ? { width: newW, scaleX: 1 } : {}),
    })
  }

  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <SectionHeader
        title={`Vị trí & Biến đổi ${isMulti ? `(${targetIds.length})` : ''}`}
        action={
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.3px' }}>
            {isMulti ? 'Nhóm chọn' : 'Toàn khung'}
          </span>
        }
        first
      />

      {/* 6 Quick Alignment Buttons with subtle Horizontal / Vertical Split */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '3px',
        gap: '3px',
        marginBottom: '8px'
      }}>
        {/* Horizontal Group */}
        <div style={{ display: 'flex', flex: 1, gap: '2px', justifyContent: 'space-around' }}>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAlign('left')}
            title="Căn lề trái"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="5" y="4" width="8" height="3" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="5" y="9" width="5" height="3" rx="1" fill="currentColor" opacity="0.8" />
            </svg>
          </Button>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAlign('center-h')}
            title="Căn giữa ngang (Alt + H)"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <rect x="3" y="4" width="10" height="3" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="5" y="9" width="6" height="3" rx="1" fill="currentColor" opacity="0.8" />
            </svg>
          </Button>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAlign('right')}
            title="Căn lề phải"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="14" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="3" y="4" width="8" height="3" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="6" y="9" width="5" height="3" rx="1" fill="currentColor" opacity="0.8" />
            </svg>
          </Button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

        {/* Vertical Group */}
        <div style={{ display: 'flex', flex: 1, gap: '2px', justifyContent: 'space-around' }}>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAlign('top')}
            title="Căn lề trên"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="4" y="5" width="3" height="8" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="9" y="5" width="3" height="5" rx="1" fill="currentColor" opacity="0.8" />
            </svg>
          </Button>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAlign('center-v')}
            title="Căn giữa dọc (Alt + V)"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="9" y="5" width="3" height="6" rx="1" fill="currentColor" opacity="0.8" />
            </svg>
          </Button>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAlign('bottom')}
            title="Căn lề dưới"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="4" y="3" width="3" height="8" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="9" y="6" width="3" height="5" rx="1" fill="currentColor" opacity="0.8" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Multi-element Distribute Buttons if 3+ items selected */}
      {targetIds.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<DistributeHIcon />}
            onClick={() => handleDistribute('horizontal')}
          >
            Chia đều ngang
          </Button>
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<DistributeVIcon />}
            onClick={() => handleDistribute('vertical')}
          >
            Chia đều dọc
          </Button>
        </div>
      )}

      {/* Compact 2-Column Transform Grid: X & Y, W & H (with ratio lock), Rot & Opa */}
      {!isMulti && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Row 1: X & Y */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <ScrubNumberInput
              label="X"
              value={Math.round(primaryEl.left || 0)}
              onChange={val => updateElement(primaryEl.id, { left: val })}
              unit="px"
              title="Tọa độ ngang X (Kéo chuột để đổi)"
            />
            <ScrubNumberInput
              label="Y"
              value={Math.round(primaryEl.top || 0)}
              onChange={val => updateElement(primaryEl.id, { top: val })}
              unit="px"
              title="Tọa độ dọc Y (Kéo chuột để đổi)"
            />
          </div>

          {/* Row 2: W & H + Aspect Ratio Lock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px', alignItems: 'center' }}>
            <ScrubNumberInput
              label="W"
              value={calcW}
              min={10}
              onChange={handleWidthChange}
              unit="px"
              title="Chiều rộng W (Kéo chuột để đổi)"
            />
            <ScrubNumberInput
              label="H"
              value={calcH}
              min={10}
              onChange={handleHeightChange}
              unit="px"
              title="Chiều cao H (Kéo chuột để đổi)"
            />
            <button
              type="button"
              className={`${styles.lockRatioBtn} ${isRatioLocked ? styles.lockRatioActive : ''}`}
              onClick={() => setIsRatioLocked(!isRatioLocked)}
              title={isRatioLocked ? 'Đang khóa tỉ lệ W/H (Click để mở)' : 'Khóa tỉ lệ W/H khi co giãn'}
            >
              {isRatioLocked ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0" />
                </svg>
              )}
            </button>
          </div>

          {/* Row 3: Rotation (Angle) & Opacity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <ScrubNumberInput
              label="Rot"
              value={currentAngle}
              min={-360}
              max={360}
              step={1}
              unit="°"
              onChange={val => updateElement(primaryEl.id, { angle: val })}
              title="Góc xoay (Kéo chuột để xoay)"
            />
            <ScrubNumberInput
              label="Opa"
              value={currentOpacity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={val => updateElement(primaryEl.id, { opacity: val / 100 })}
              title="Độ rõ nét / Mờ đục (0 - 100%)"
            />
          </div>
        </div>
      )}
    </div>
  )
}
