import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui';
import styles from './SceneLayerTimingModal.module.css';

export default function SceneLayerTimingModal() {
  const {
    layerTimingModalSceneIdx,
    setLayerTimingModalSceneIdx,
    scenes,
    selectedElementId,
    setSelectedElement,
    updateElement,
    removeElement,
    reorderSceneElements,
    autoStaggerSceneElements,
    showToast
  } = useEditorStore();

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const isDraggingHUD = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, hudX: 0, hudY: 0 });

  // Compute default position closer to the Canvas (left flank of central canvas)
  const getDefaultPosition = () => {
    const canvasLeftEdge = typeof window !== 'undefined' ? window.innerWidth / 2 - 180 : 300;
    const defaultX = Math.max(76, Math.floor(canvasLeftEdge - 395));
    const defaultY = typeof window !== 'undefined' ? Math.max(60, Math.floor(window.innerHeight - 300 - 450)) : 100;
    return { x: defaultX, y: defaultY };
  };

  // Close on Escape key
  useEffect(() => {
    if (layerTimingModalSceneIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLayerTimingModalSceneIdx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layerTimingModalSceneIdx, setLayerTimingModalSceneIdx]);

  // Window drag move handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingHUD.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.min(Math.max(10, dragStartRef.current.hudX + dx), window.innerWidth - 395);
      const newY = Math.min(Math.max(10, dragStartRef.current.hudY + dy), window.innerHeight - 100);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingHUD.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleHUDMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingHUD.current = true;
    const currentPos = position || getDefaultPosition();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      hudX: currentPos.x,
      hudY: currentPos.y,
    };
  };

  if (layerTimingModalSceneIdx === null) return null;

  const currentScene = scenes[layerTimingModalSceneIdx];
  if (!currentScene) return null;

  const allElements = currentScene.elements || [];
  const elements = allElements.filter(el => el.type !== 'caption');
  const sceneDuration = currentScene.duration || 3.0;

  // Helper to extract a friendly label for an element
  const getElementName = (el: any) => {
    let name = el.type || 'Phần tử';

    if (el.type === 'text') {
      name = el.content ? `"${el.content.slice(0, 26)}${el.content.length > 26 ? '...' : ''}"` : 'Văn bản';
    } else if (el.type === 'master-hook') {
      name = el.hookData?.heroTitle ? `Hook: "${el.hookData.heroTitle.slice(0, 22)}"` : 'Master Hook';
    } else if (el.type.includes('chart') || el.type === 'stat-big' || el.type.includes('flow') || el.type.includes('matrix')) {
      name = el.type.replace(/-/g, ' ').toUpperCase();
    } else if (el.type === 'image' || el.type === 'frame-mockup') {
      name = 'Hình ảnh / Mockup';
    } else if (el.type === 'character-mascot') {
      name = `Mascot (${el.mascotPose || 'Pose'})`;
    } else if (el.type === 'badge') {
      name = el.content ? `Badge: ${el.content}` : 'Huy hiệu';
    } else if (el.type === 'progress') {
      name = 'Thanh tiến trình';
    }

    return name;
  };

  const handleAutoStagger = () => {
    autoStaggerSceneElements(layerTimingModalSceneIdx);
    showToast('Đã tự động căn nhịp so le các layer đồ họa');
  };

  const handleReorder = (fromElId: string, toElId: string) => {
    const fromIdx = allElements.findIndex(e => e.id === fromElId);
    const toIdx = allElements.findIndex(e => e.id === toElId);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      reorderSceneElements(layerTimingModalSceneIdx, fromIdx, toIdx);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest(`.${styles.timingRow}`)) {
      e.preventDefault();
      return;
    }
    setDraggingIdx(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = draggingIdx;
    setDraggingIdx(null);
    if (fromIndex !== null && fromIndex !== targetIndex && elements[fromIndex] && elements[targetIndex]) {
      handleReorder(elements[fromIndex].id, elements[targetIndex].id);
    }
  };

  const currentPos = position || getDefaultPosition();

  return (
    <div
      className={styles.floatingHUD}
      style={{ left: `${currentPos.x}px`, top: `${currentPos.y}px` }}
    >
      {/* Header */}
      <div
        className={styles.header}
        onMouseDown={handleHUDMouseDown}
        title="Kéo thanh tiêu đề này để di chuyển vị trí bảng"
      >
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className={styles.headerTitle}>
              Cảnh #{layerTimingModalSceneIdx + 1}: {currentScene.name || 'Cảnh quay'}
            </div>
            <div className={styles.headerSubtitle}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Thời lượng: <strong className={styles.headerSubtitleHighlight}>{sceneDuration}s</strong> • <strong className={styles.headerSubtitleHighlight}>{elements.length}</strong> đồ họa layer</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => setLayerTimingModalSceneIdx(null)}
            title="Đóng (Esc)"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarHint}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Nhấp để chọn layer • Kéo trượt để chỉnh Delay
        </span>
        <Button
          size="xs"
          variant="secondary"
          leftIcon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
          }
          onClick={handleAutoStagger}
          title="Tự động giãn cách thời gian xuất hiện so le đều nhau"
        >
          Tự động
        </Button>
      </div>

      {/* Layer List */}
      <div className={styles.layerList}>
        {elements.length === 0 ? (
          <div className={styles.emptyState}>
            Cảnh này chưa có layer đồ họa nào. Hãy thêm chữ hoặc biểu đồ vào cảnh!
          </div>
        ) : (
          elements.map((el, i) => {
            const isSelected = el.id === selectedElementId;
            const name = getElementName(el);
            const animDelay = typeof el.animDelay === 'number' ? el.animDelay : 0.0;
            const animDuration = typeof el.animDuration === 'number' ? el.animDuration : 0.6;

            // Calculate Gantt bar positions as % of sceneDuration
            const delayPct = Math.min(100, Math.max(0, (animDelay / sceneDuration) * 100));
            const durationPct = Math.min(100 - delayPct, Math.max(4, (animDuration / sceneDuration) * 100));

            return (
              <div
                key={el.id || i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                onClick={() => setSelectedElement(el.id)}
                className={`${styles.layerCard} ${isSelected ? styles.layerCardActive : ''} ${draggingIdx === i ? styles.layerCardDragging : ''}`}
              >
                <div className={styles.layerCardTop}>
                  <div className={styles.layerIdentity}>
                    <span className={styles.layerDragHandle} title="Kéo thả để đổi thứ tự layer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="6" r="1.5" />
                        <circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" />
                        <circle cx="15" cy="18" r="1.5" />
                      </svg>
                    </span>
                    <span className={styles.layerName} title={name}>{name}</span>
                    <span className={styles.layerTypeBadge}>{el.type}</span>
                  </div>

                  <div className={styles.layerQuickControls} onClick={(e) => e.stopPropagation()}>
                    {/* Move Up */}
                    <button
                      type="button"
                      className={`${styles.controlBtn} ${i === 0 ? styles.controlBtnDisabled : ''}`}
                      disabled={i === 0}
                      onClick={() => handleReorder(el.id, elements[i - 1].id)}
                      title="Đưa layer lên trước (Z-Index +1)"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      className={`${styles.controlBtn} ${i === elements.length - 1 ? styles.controlBtnDisabled : ''}`}
                      disabled={i === elements.length - 1}
                      onClick={() => handleReorder(el.id, elements[i + 1].id)}
                      title="Đưa layer xuống sau (Z-Index -1)"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    
                    {/* Safety Divider */}
                    <div className={styles.controlDivider} />

                    {/* Delete */}
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => {
                        removeElement(el.id);
                        showToast('Đã xóa layer');
                      }}
                      title="Xóa layer này"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Timing Gantt Track & Slider */}
                <div
                  className={styles.timingRow}
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.ganttTrack} title={`Chờ: ${animDelay.toFixed(2)}s | Chạy: ${animDuration.toFixed(2)}s`}>
                    {/* Delay Fill */}
                    <div
                      className={styles.ganttDelayFill}
                      style={{ width: `${delayPct}%` }}
                    />
                    {/* Animation Active Fill */}
                    <div
                      className={styles.ganttAnimFill}
                      style={{ left: `${delayPct}%`, width: `${durationPct}%` }}
                    />
                  </div>

                  <div className={styles.delaySliderContainer}>
                    <input
                      type="range"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      min="0"
                      max={Math.max(0.5, sceneDuration - 0.2)}
                      step="0.05"
                      value={animDelay}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateElement(el.id, { animDelay: val });
                      }}
                      className={styles.delaySlider}
                      title="Kéo để chỉnh độ trễ xuất hiện (Delay)"
                    />
                    <span className={styles.delayValueText}>
                      {animDelay.toFixed(2)}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          Thứ tự từ trên xuống dưới = Thứ tự đè lớp (Z-Index)
        </span>
        <Button
          size="xs"
          variant="secondary"
          onClick={() => setLayerTimingModalSceneIdx(null)}
        >
          Xong
        </Button>
      </div>
    </div>
  );
}
