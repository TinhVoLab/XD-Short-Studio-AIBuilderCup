import React from 'react';
import styles from './Tabs.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui';

export default function AudioTab() {
  const { selectedAudioClipId, audioClips, updateAudioClip, removeAudioClip, setSelectedAudioClip, showToast } = useEditorStore(
    useShallow(s => ({
      selectedAudioClipId: s.selectedAudioClipId,
      audioClips: s.audioClips,
      updateAudioClip: s.updateAudioClip,
      removeAudioClip: s.removeAudioClip,
      setSelectedAudioClip: s.setSelectedAudioClip,
      showToast: s.showToast
    }))
  );

  const clip = audioClips.find(c => c.id === selectedAudioClipId);
  if (!clip) return null;

  const isVoice = clip.trackId === 'A1' || clip.trackId?.toLowerCase().includes('voice');
  const isSfx = clip.trackId === 'A2' || clip.trackId?.toLowerCase().includes('sfx');
  const isBgm = clip.trackId === 'A3' || clip.trackId?.toLowerCase().includes('bgm') || clip.trackId?.toLowerCase().includes('music');

  const accentColor = isVoice ? '#BEFF01' : isSfx ? '#FFB800' : '#C084FC';
  const trackLabel = isVoice ? 'A1 • Giọng đọc AI' : isSfx ? 'A2 • Hiệu ứng SFX' : isBgm ? 'A3 • Nhạc nền BGM' : `${clip.trackId || 'Audio'}`;
  const trackIcon = isVoice ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
    </svg>
  ) : isSfx ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
    </svg>
  );

  // Format số gọn gàng, loại bỏ lỗi 11.600000000000001
  const cleanStartSec = Math.round((clip.startSec ?? 0) * 100) / 100;
  const cleanTrimStart = Math.round((clip.trimStartSec ?? 0) * 100) / 100;
  const cleanDuration = Math.round((clip.playDurationSec ?? clip.duration ?? 0) * 100) / 100;
  const cleanOriginalDuration = Math.round((clip.duration ?? 0) * 100) / 100;
  const volumePercent = Math.round((clip.volume ?? 1) * 100);

  // Loại bỏ icon trùng lặp ở đầu tên clip nếu có
  const cleanClipName = clip.name.replace(/^(🎙️|🔊|🎵)\s*/, '');

  return (
    <div className={styles.tab}>
      {/* Dynamic Themed Header */}
      <div style={{
        padding: '10px 12px',
        background: `rgba(${isVoice ? '190,255,1' : isSfx ? '255,184,0' : '192,132,252'}, 0.08)`,
        border: `1px solid rgba(${isVoice ? '190,255,1' : isSfx ? '255,184,0' : '192,132,252'}, 0.25)`,
        borderRadius: 'var(--radius-sm, 8px)',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: `rgba(${isVoice ? '190,255,1' : isSfx ? '255,184,0' : '192,132,252'}, 0.15)`,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {trackIcon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: accentColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {cleanClipName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted, rgba(255,255,255,0.5))', marginTop: 2 }}>
            {trackLabel}
          </div>
        </div>
      </div>

      {/* 2-Column Compact Timing Controls */}
      <div className={styles.row2}>
        <div className={styles.group} style={{ marginBottom: 10 }}>
          <div className={styles.groupTitle}>BẮT ĐẦU (S)</div>
          <input
            type="number"
            step="0.1"
            min="0"
            className={styles.input}
            value={cleanStartSec}
            onChange={e => {
              const val = Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 100) / 100);
              updateAudioClip(clip.id, { startSec: val });
            }}
            placeholder="0.0"
          />
        </div>

        <div className={styles.group} style={{ marginBottom: 10 }}>
          <div className={styles.groupTitle}>THỜI LƯỢNG (S)</div>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max={cleanOriginalDuration}
            className={styles.input}
            value={cleanDuration}
            onChange={e => {
              const val = Math.max(0.1, Math.min(clip.duration, Math.round((parseFloat(e.target.value) || 0) * 100) / 100));
              updateAudioClip(clip.id, { playDurationSec: val });
            }}
          />
        </div>
      </div>

      {/* Cắt bỏ phần đầu (Trim Left) */}
      <div className={styles.group} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className={styles.groupTitle} style={{ margin: 0 }}>CẮT ĐẦU (S)</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted, rgba(255,255,255,0.45))' }}>
            Gốc: {cleanOriginalDuration}s
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="number"
            step="0.1"
            min="0"
            max={Math.max(0, clip.duration - 0.5)}
            className={styles.input}
            style={{ marginBottom: 0, flex: 1 }}
            value={cleanTrimStart}
            onChange={e => {
              const val = Math.max(0, Math.min(clip.duration - 0.5, Math.round((parseFloat(e.target.value) || 0) * 100) / 100));
              updateAudioClip(clip.id, { trimStartSec: val });
            }}
            placeholder="0.0"
          />
          {Math.abs(cleanDuration - cleanOriginalDuration) > 0.1 && (
            <Button
              variant="secondary"
              size="xs"
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              }
              onClick={() => {
                updateAudioClip(clip.id, { playDurationSec: clip.duration, trimStartSec: 0 });
                showToast(`Đã đặt lại độ dài gốc ${cleanOriginalDuration}s`);
              }}
              title="Khôi phục độ dài gốc ban đầu"
            >
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Âm lượng Clip (Chuẩn 0% → 100%) */}
      <div className={styles.group} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className={styles.groupTitle} style={{ margin: 0 }}>ÂM LƯỢNG</span>
          <span style={{ fontSize: 11, color: accentColor, fontWeight: 800, fontFamily: 'monospace' }}>
            {volumePercent}%
          </span>
        </div>
        <div className={styles.sliderRow} style={{ marginBottom: 0 }}>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={() => updateAudioClip(clip.id, { volume: (clip.volume ?? 1) === 0 ? 1 : 0 })}
            title={volumePercent === 0 ? 'Bật lại âm thanh' : 'Tắt tiếng (Mute)'}
          >
            {volumePercent === 0 ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            className={styles.slider}
            value={clip.volume ?? 1}
            onChange={e => updateAudioClip(clip.id, { volume: parseFloat(e.target.value) })}
            style={{ accentColor }}
          />
        </div>
      </div>

      <div className={styles.divider} />

      {/* Delete Button */}
      <Button
        variant="danger"
        size="sm"
        fullWidth
        leftIcon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        }
        onClick={() => {
          removeAudioClip(clip.id);
          setSelectedAudioClip(null);
          showToast(`Đã xoá clip "${cleanClipName}"`);
        }}
      >
        Xoá Audio
      </Button>
    </div>
  );
}

