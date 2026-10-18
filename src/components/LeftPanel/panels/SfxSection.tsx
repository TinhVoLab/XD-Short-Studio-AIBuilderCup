import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { CustomSfxTrack, SfxCategory } from "@/types/scene";
import { SFX_CATEGORIES } from "@/config/sfxPresetCatalog";
import { SfxImportModal } from "@/components/SfxImportModal/SfxImportModal";
import { Button } from "@/components/ui";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  impact: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  motion: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  ui: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  reaction: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </svg>
  ),
  custom: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export default function SfxSection() {
  const {
    sfxCatalog,
    removeSfxTrack,
    applySfxToTimeline,
    showToast
  } = useEditorStore(
    useShallow((s) => ({
      sfxCatalog: s.sfxCatalog,
      removeSfxTrack: s.removeSfxTrack,
      applySfxToTimeline: s.applySfxToTimeline,
      showToast: s.showToast
    }))
  );

  const [activeCategory, setActiveCategory] = useState<SfxCategory>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Audio Preview State
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.src = "";
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const handleTogglePreview = (track: CustomSfxTrack) => {
    if (previewingTrackId === track.id) {
      audioPreviewRef.current?.pause();
      setPreviewingTrackId(null);
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const audio = new Audio(track.audioUrl);
    audioPreviewRef.current = audio;
    audio.volume = 0.85;
    audio.play().catch(err => {
      console.warn("Could not play audio preview:", err);
      showToast("Khong the phat am thanh nay.");
    });

    setPreviewingTrackId(track.id);
    audio.onended = () => {
      setPreviewingTrackId(null);
    };
  };

  const filteredTracks = activeCategory === "all"
    ? sfxCatalog
    : sfxCatalog.filter(t => t.category === activeCategory);

  return (
    <div style={{
      backgroundColor: 'var(--surface-1, #0d1117)',
      border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
      borderRadius: 8,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: "var(--text, #f0f6fc)", whiteSpace: "nowrap" }}>
          <span>Kho SFX</span>
          <span style={{ fontSize: "9.5px", color: "var(--accent, #BEFF01)", background: "var(--accent-dim, rgba(190, 255, 1, 0.1))", border: "1px solid var(--accent-border, rgba(190, 255, 1, 0.3))", padding: "0 5px", borderRadius: "10px", fontWeight: 700 }}>
            {sfxCatalog.length}
          </span>
        </div>
        <Button
          variant="secondary"
          size="xs"
          leftIcon={
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          onClick={() => setIsImportModalOpen(true)}
          style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
        >
          Thêm link
        </Button>
      </div>

      <SfxImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Category Filter Tabs */}
      <div style={{
        display: "flex",
        gap: "3px",
        overflowX: "auto",
        paddingBottom: "2px",
        scrollbarWidth: "none"
      }}>
        {SFX_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === "all"
            ? sfxCatalog.length
            : sfxCatalog.filter(t => t.category === cat.id).length;

          return (
            <Button
              key={cat.id}
              variant="pill"
              size="xs"
              selected={isActive}
              onClick={() => setActiveCategory(cat.id)}
              leftIcon={CATEGORY_ICONS[cat.id]}
              style={{ flexShrink: 0, height: '22px', fontSize: '10px', padding: '0 6px' }}
            >
              <span>{cat.label}</span>
              <span style={{ fontSize: "8.5px", opacity: 0.7, marginLeft: "2px" }}>({count})</span>
            </Button>
          );
        })}
      </div>

      {/* SFX List: Single-Line Ultra-Compact Layout (~32px height) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxHeight: "400px", overflowY: "auto", paddingRight: "2px" }}>
        {filteredTracks.map(track => {
          const isPlaying = previewingTrackId === track.id;

          return (
            <div
              key={track.id}
              style={{
                background: isPlaying ? "rgba(190, 255, 1, 0.08)" : "var(--surface-2, #161b22)",
                border: `1px solid ${isPlaying ? "var(--accent-border, rgba(190, 255, 1, 0.4))" : "var(--border, rgba(255, 255, 255, 0.06))"}`,
                borderRadius: "5px",
                padding: "3px 6px",
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                transition: "all 0.15s ease"
              }}
            >
              {/* Left: Mini Play/Pause Button */}
              <button
                type="button"
                onClick={() => handleTogglePreview(track)}
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "4px",
                  background: isPlaying ? "var(--accent, #BEFF01)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${isPlaying ? "var(--accent, #BEFF01)" : "rgba(255, 255, 255, 0.08)"}`,
                  color: isPlaying ? "#080a0f" : "var(--text-sub, #8b949e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                  boxShadow: isPlaying ? "0 0 8px rgba(190, 255, 1, 0.5)" : "none"
                }}
                title={isPlaying ? "Dừng nghe thử" : "Nghe thử"}
              >
                {isPlaying ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="3" width="5" height="18" rx="1" /><rect x="14" y="3" width="5" height="18" rx="1" />
                  </svg>
                ) : (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                )}
              </button>

              {/* Center: Name & Duration on 1 single row */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                <span
                  title={track.name}
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: isPlaying ? "var(--accent, #BEFF01)" : "var(--text, #f0f6fc)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {track.name}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontFamily: "monospace",
                    color: "var(--text-muted, #6e7681)",
                    flexShrink: 0,
                    opacity: 0.8
                  }}
                >
                  {track.duration > 0 ? `${track.duration.toFixed(1)}s` : "0.5s"}
                </span>
              </div>

              {/* Right: Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    const currentSec = useEditorStore.getState().currentTimeSec;
                    applySfxToTimeline(track, currentSec);
                    showToast(`Đã thêm SFX "${track.name}" vào Layer A2 tại ${currentSec.toFixed(1)}s!`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    height: "22px",
                    padding: "0 6px",
                    fontSize: "10px",
                    fontWeight: 600,
                    borderRadius: "4px",
                    background: "rgba(190, 255, 1, 0.08)",
                    border: "1px solid var(--accent-border, rgba(190, 255, 1, 0.25))",
                    color: "var(--accent, #BEFF01)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent, #BEFF01)";
                    e.currentTarget.style.color = "#080a0f";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(190, 255, 1, 0.08)";
                    e.currentTarget.style.color = "var(--accent, #BEFF01)";
                  }}
                  title="Chèn vào Track A2 tại vị trí Playhead"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Chèn</span>
                </button>

                {!track.isPreset && (
                  <button
                    type="button"
                    onClick={() => {
                      removeSfxTrack(track.id);
                      showToast("Đã xóa hiệu ứng khỏi thư viện");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted, #6e7681)",
                      fontSize: "11px",
                      cursor: "pointer",
                      width: "20px",
                      height: "22px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "3px",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4455")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted, #6e7681)")}
                    title="Xóa khỏi thư viện"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredTracks.length === 0 && (
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: "11px", color: "var(--text-muted, #6e7681)" }}>
            Chưa có hiệu ứng nào trong danh mục này.
          </div>
        )}
      </div>
    </div>
  );
}
