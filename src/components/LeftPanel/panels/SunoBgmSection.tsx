import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { SunoBgmTrack, SunoVibe } from '@/types/scene';
import { SUNO_VIBE_CATEGORIES } from '@/config/sunoPresetCatalog';
import { API_BASE } from '@/config/api';
import { SunoImportModal } from '@/components/SunoImportModal/SunoImportModal';
import { Button } from '@/components/ui';

export const SunoBgmSection: React.FC = () => {
  const {
    sunoBgmCatalog,
    removeSunoTrack,
    applySunoBgmToTimeline,
    audioClips,
    showToast
  } = useEditorStore();

  const [activeVibe, setActiveVibe] = useState<'all' | SunoVibe>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Audio Preview Player state
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePreview = (track: SunoBgmTrack) => {
    if (previewingTrackId === track.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setPreviewingTrackId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(track.audioUrl.startsWith('/') ? `${API_BASE}${track.audioUrl}` : track.audioUrl);
      audio.crossOrigin = 'anonymous';
      audio.onended = () => setPreviewingTrackId(null);
      audio.onerror = () => {
        // Fallback to direct Suno CDN if local URL failed
        const songIdMatch = track.id.match(/[0-9a-fA-F-]{36}/);
        if (songIdMatch) {
          const cdnFallback = `https://cdn1.suno.ai/${songIdMatch[0]}.mp3`;
          if (audio.src !== cdnFallback) {
            audio.src = cdnFallback;
            audio.play().catch(() => {});
            return;
          }
        }
        showToast('Không thể phát bản xem thử của bài hát này');
        setPreviewingTrackId(null);
      };
      audio.play().catch(() => {});
      audioPreviewRef.current = audio;
      setPreviewingTrackId(track.id);
    }
  };

  const filteredTracks = activeVibe === 'all'
    ? sunoBgmCatalog
    : sunoBgmCatalog.filter(t => t.vibe === activeVibe);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getVibeBadge = (vibe: SunoVibe) => {
    const cat = SUNO_VIBE_CATEGORIES.find(c => c.id === vibe);
    return cat ? cat.label : 'Khác';
  };

  return (
    <div style={{
      backgroundColor: 'rgba(18, 24, 38, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 9,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      {/* ── Modal Thêm Nhạc Suno ── */}
      <SunoImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#E2E8F0', whiteSpace: 'nowrap' }}>
          <span>Kho nhạc nền</span>
          <span style={{ fontSize: '10px', color: '#BEFF01', background: 'rgba(190,255,1,0.12)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
            {sunoBgmCatalog.length}
          </span>
        </div>
        <Button
          variant="secondary"
          size="xs"
          leftIcon="+"
          onClick={() => setIsImportModalOpen(true)}
          style={{ color: '#BEFF01', borderColor: 'rgba(190, 255, 1, 0.35)', background: 'rgba(190, 255, 1, 0.12)' }}
        >
          Thêm link
        </Button>
      </div>

      {/* Vibe Category Pills Filter */}
      <div style={{
        display: 'flex',
        gap: '5px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {SUNO_VIBE_CATEGORIES.map(cat => {
          const isActive = activeVibe === cat.id;
          const count = cat.id === 'all'
            ? sunoBgmCatalog.length
            : sunoBgmCatalog.filter(t => t.vibe === cat.id).length;

          return (
            <Button
              key={cat.id}
              variant="pill"
              size="xs"
              selected={isActive}
              onClick={() => setActiveVibe(cat.id)}
              leftIcon={cat.emoji}
              style={{ flexShrink: 0 }}
            >
              <span>{cat.label}</span>
              <span style={{ fontSize: '9px', opacity: 0.7, marginLeft: '3px' }}>({count})</span>
            </Button>
          );
        })}
      </div>

      {/* Track List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
        {filteredTracks.map(track => {
          const isCurrentBgm = audioClips.some(c => (c.trackId === 'A3' || c.trackId === 'bgm') && c.url === track.audioUrl);
          const isPlayingPreview = previewingTrackId === track.id;

          return (
            <div
              key={track.id}
              style={{
                background: isCurrentBgm ? 'rgba(190,255,1,0.08)' : '#0C0E12',
                border: `1px solid ${isCurrentBgm ? 'rgba(190,255,1,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Left: Interactive Cover Art Thumbnail (Click to Play/Pause Preview) */}
              <div
                onClick={() => handleTogglePreview(track)}
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: '#1A1D24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isPlayingPreview ? '0 0 8px rgba(255,184,0,0.5)' : 'none'
                }}
                title={isPlayingPreview ? 'Bấm để dừng nghe thử' : 'Bấm để nghe thử bài hát'}
              >
                {track.coverArtUrl ? (
                  <img
                    src={track.coverArtUrl}
                    alt={track.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#BEFF01' }}>
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                )}
                
                {/* Play/Pause Overlay Icon */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isPlayingPreview ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: isPlayingPreview ? '#FFB800' : '#FFF',
                  transition: 'all 0.15s'
                }}>
                  {isPlayingPreview ? '⏸' : '▶'}
                </div>
              </div>

              {/* Middle: Title & Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, flex: 1 }}>
                <span
                  title={track.title}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: isCurrentBgm ? '#BEFF01' : '#EEE',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2
                  }}
                >
                  {track.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <span style={{ color: isCurrentBgm ? '#BEFF01' : '#AAA', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getVibeBadge(track.vibe)}</span>
                  <span>•</span>
                  <span>{formatDuration(track.duration)}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                {/* Compact Apply as BGM Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    applySunoBgmToTimeline(track);
                    showToast(`Đã gán bài nhạc "${track.title}" vào Track A3 BGM!`);
                  }}
                  style={{
                    background: isCurrentBgm ? '#BEFF01' : 'rgba(190,255,1,0.12)',
                    border: `1px solid ${isCurrentBgm ? '#BEFF01' : 'rgba(190,255,1,0.35)'}`,
                    color: isCurrentBgm ? '#000' : '#BEFF01',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isCurrentBgm ? '0 0 8px rgba(190,255,1,0.5)' : 'none'
                  }}
                  title={isCurrentBgm ? "Đang sử dụng làm BGM (Track A3)" : "Bấm để gán làm BGM (Track A3)"}
                >
                  {isCurrentBgm ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    removeSunoTrack(track.id);
                    showToast('Đã xóa bài nhạc khỏi thư viện');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#555',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF5555')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                  title="Xóa khỏi thư viện"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {filteredTracks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '11px', color: '#666' }}>
            Chưa có bài nhạc nào. Hãy dán link Suno ở trên để thêm!
          </div>
        )}
      </div>
    </div>
  );
};
