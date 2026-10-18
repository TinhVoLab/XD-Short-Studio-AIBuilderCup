import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styles from './VolumeKnobModal.module.css';
import { Button } from '@/components/ui';

interface VolumeKnobModalProps {
  initialVolume: number;
  onVolumeChange: (vol: number) => void;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export const VolumeKnobModal: React.FC<VolumeKnobModalProps> = ({
  initialVolume,
  onVolumeChange,
  onClose,
  anchorRect
}) => {
  const [volume, setVolume] = useState(Math.max(0, Math.min(1, initialVolume)));
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startVolRef = useRef<number>(0);

  const updateVol = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, Math.round(newVol * 100) / 100));
    setVolume(clamped);
    onVolumeChange(clamped);
  }, [onVolumeChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startVolRef.current = volume;

    const handleMouseMove = (me: MouseEvent) => {
      const deltaY = startYRef.current - me.clientY; // drag up = increase, drag down = decrease
      const deltaVol = deltaY * 0.005; // smooth sensitivity
      updateVol(startVolRef.current + deltaVol);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Mouse wheel scroll to adjust volume quickly
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.02 : -0.02;
    updateVol(volume + delta);
  };

  // Double click knob to reset to 100%
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateVol(1.0);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Calculate Fixed Position on Screen using anchorRect
  const modalWidth = 250;
  const modalHeight = 310;
  let top = window.innerHeight / 2 - modalHeight / 2;
  let left = window.innerWidth / 2;

  if (anchorRect) {
    left = Math.max(modalWidth / 2 + 12, Math.min(window.innerWidth - modalWidth / 2 - 12, anchorRect.left + anchorRect.width / 2));
    top = anchorRect.top - modalHeight - 14;
    // Flip below clip if close to top of window
    if (top < 12) {
      top = anchorRect.bottom + 14;
    }
  }

  // Angle from -135deg (0%) to +135deg (100%)
  const angle = -135 + volume * 270;
  const totalTicks = 18;
  const activeTicks = Math.round(volume * totalTicks);
  const isOverdrive = volume > 0.85;

  const presets = [
    { label: '0%', vol: 0 },
    { label: '30%', vol: 0.3 },
    { label: '60%', vol: 0.6 },
    { label: '100%', vol: 1.0 },
  ];

  const modalContent = (
    <>
      {/* 1. Backdrop Overlay: Click outside to dismiss */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* 2. Pro Matte Black + Neon Volume Knob Dialog */}
      <div
        className={styles.modal}
        style={{ top: `${top}px`, left: `${left}px` }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        {/* Studio Header */}
        <div className={styles.header}>
          <span>🎛️</span> STUDIO AUDIO GAIN
        </div>

        {/* 3D Rotary Knob Container */}
        <div
          className={styles.knobContainer}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="Kéo chuột hoặc cuộn lăn để chỉnh (Nhấp đúp về 100%)"
        >
          {/* Circular Neon Ticks Meter (SVG) */}
          <svg width="140" height="140" style={{ position: 'absolute', top: -10, left: -10, pointerEvents: 'none' }}>
            {Array.from({ length: totalTicks + 1 }).map((_, i) => {
              const tickAngle = -135 + (i / totalTicks) * 270;
              const rad = (tickAngle - 90) * (Math.PI / 180);
              const r1 = 56;
              const r2 = 64;
              const x1 = 70 + r1 * Math.cos(rad);
              const y1 = 70 + r1 * Math.sin(rad);
              const x2 = 70 + r2 * Math.cos(rad);
              const y2 = 70 + r2 * Math.sin(rad);
              const isActive = i <= activeTicks;
              const isWarning = i > 15;
              const tickColor = isWarning ? '#FF5555' : '#BEFF01';

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? tickColor : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isActive ? 2.5 : 1.2}
                  strokeLinecap="round"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 3px ${tickColor})` : 'none',
                    transition: 'stroke 0.1s, stroke-width 0.1s'
                  }}
                />
              );
            })}
          </svg>

          {/* Outer Obsidian Bezel */}
          <div className={`${styles.outerBezel} ${isDragging ? styles.dragging : ''}`}>
            {/* Inner Matte Rotary Cap */}
            <div
              className={styles.innerCap}
              style={{
                transform: `rotate(${angle}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              {/* Knurled Grip Texture */}
              <div className={styles.knurledRing} />

              {/* Glowing Neon Needle */}
              <div className={`${styles.indicatorNeedle} ${isOverdrive ? styles.overdrive : ''}`} />
            </div>
          </div>
        </div>

        {/* Readout Display */}
        <div className={styles.displayArea}>
          <span className={`${styles.percentText} ${isOverdrive ? styles.overdrive : ''}`}>
            {Math.round(volume * 100)}%
          </span>
          <span className={styles.hintText}>
            {volume === 0 ? '🔇 ĐÃ TẮT TIẾNG' : volume === 1 ? '🔊 CHUẨN GỐC (0 dB)' : 'KÉO HOẶC LĂN CHUỘT'}
          </span>
        </div>

        {/* Quick Presets */}
        <div className={styles.presetGroup}>
          {presets.map(p => (
            <button
              key={p.label}
              className={`${styles.presetBtn} ${Math.abs(volume - p.vol) < 0.03 ? styles.active : ''}`}
              onClick={() => updateVol(p.vol)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <Button variant="primary" size="md" fullWidth onClick={onClose}>
          XÁC NHẬN
        </Button>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
