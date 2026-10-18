import React, { useState, useEffect, useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { CustomSfxTrack, SfxCategory } from '@/types/scene';
import { SFX_CATEGORIES } from '@/config/sfxPresetCatalog';
import { getAudioDuration } from '@/utils/audio';
import { API_BASE } from '@/config/api';
import { Button, Textarea } from '@/components/ui';

interface SfxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SfxImportModal: React.FC<SfxImportModalProps> = ({ isOpen, onClose }) => {
  const { addBatchSfxTracks, showToast } = useEditorStore();

  const [inputUrls, setInputUrls] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SfxCategory>('motion');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const candidates = useMemo(() => {
    const rawList = inputUrls.split(/[\n,\s]+/);
    return rawList.map(u => u.trim()).filter(u => u.length > 5 && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/")));
  }, [inputUrls]);

  if (!isOpen) return null;

  const extractNameFromUrl = (url: string, index: number): string => {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split("/").pop() || "";
      const clean = decodeURIComponent(filename).replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      if (clean && clean.length > 1) {
        return clean.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
    } catch (e) {}
    return `Sound FX #${index + 1}`;
  };

  const getCategoryEmoji = (category: SfxCategory): string => {
    const cat = SFX_CATEGORIES.find(c => c.id === category);
    return cat ? cat.emoji : "🔊";
  };

  const handleImport = async () => {
    if (!inputUrls.trim()) {
      showToast("Vui lòng dán ít nhất 1 link âm thanh");
      return;
    }

    setIsImporting(true);
    showToast("Đang phân tích, tải và lưu Sound FX về máy...");

    try {
      // 1. Try Server-Side Import
      const res = await fetch(`${API_BASE}/api/ai/sfx-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: inputUrls,
          category: selectedCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          addBatchSfxTracks(data.tracks);
          showToast(`Đã nhập thành công ${data.tracks.length} hiệu ứng Sound FX!`);
          setInputUrls('');
          setIsImporting(false);
          onClose();
          return;
        }
      }

      // If server returned a detailed error message
      let errorText = '';
      try {
        const errJson = await res.json();
        errorText = errJson.error || '';
      } catch (e) {
        errorText = res.statusText || '';
      }

      // 2. Client-Side Fallback: if server is temporarily offline
      if (candidates.length > 0) {
        const fallbackTracks: CustomSfxTrack[] = [];
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

        for (let i = 0; i < candidates.length; i++) {
          const url = candidates[i];
          let audioUrl = url;
          let sfxName = extractNameFromUrl(url, i);

          const uuidMatch = url.match(uuidRegex);
          if (url.includes('suno.com') && uuidMatch) {
            audioUrl = `https://cdn1.suno.ai/${uuidMatch[0]}.mp3`;
            sfxName = `Suno Sound #${uuidMatch[0].slice(0, 6)}`;
          }

          let duration = 1.5;
          try {
            const d = await getAudioDuration(audioUrl);
            if (d && isFinite(d) && d > 0) duration = Math.round(d * 10) / 10;
          } catch (e) {}

          fallbackTracks.push({
            id: `custom_sfx_${Date.now()}_${i}`,
            name: sfxName,
            emoji: getCategoryEmoji(selectedCategory),
            category: selectedCategory,
            audioUrl,
            duration,
            createdAt: Date.now() + i,
            isPreset: false
          });
        }

        if (fallbackTracks.length > 0) {
          addBatchSfxTracks(fallbackTracks);
          showToast(`Đã kết nối ${fallbackTracks.length} hiệu ứng Sound FX!`);
          setInputUrls('');
          setIsImporting(false);
          onClose();
          return;
        }
      }

      throw new Error(errorText || 'Không thể tải âm thanh từ các link đã nhập');
    } catch (err: any) {
      console.error("Import SFX error:", err);
      showToast(`Lỗi nhập Sound FX: ${err.message || "Lỗi xử lý"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const activeCat = SFX_CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#0F1218',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 212, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── 1. Modal Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.06) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0, 212, 255, 0.12)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D4FF'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px' }}>
                Thêm Sound FX Vào Thư Viện
              </h2>
              <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#8E95A5' }}>
                Dán link audio (MP3, WAV) hoặc link Suno để nhập hiệu ứng
              </p>
            </div>
          </div>

          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title="Đóng (ESC)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        {/* ── 2. Modal Body ── */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Category Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#D0D5E0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Chọn Phân Loại (Category):
              </label>
              <span style={{ fontSize: '11px', color: '#00D4FF', fontWeight: 700 }}>
                {activeCat?.emoji} {activeCat?.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {SFX_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as SfxCategory)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isSelected ? '#00D4FF' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#00D4FF' : '#8E95A5',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(0, 212, 255, 0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL Textarea Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#D0D5E0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Dán Link Audio:
              </label>
              {candidates.length > 0 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#00D4FF',
                  background: 'rgba(0, 212, 255, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 212, 255, 0.3)'
                }}>
                  Hợp lệ: {candidates.length} link
                </span>
              )}
            </div>

            <Textarea
              value={inputUrls}
              onChange={(e) => setInputUrls(e.target.value)}
              placeholder="Dán link âm thanh tại đây (mỗi link 1 dòng)...&#10;Ví dụ: https://example.com/swoosh.mp3"
              rows={4}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {/* Quick Helper Tips */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '11px',
            color: '#71788A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>
              Hỗ trợ link trực tiếp (.mp3, .wav), link CDN, hoặc dán link bài hát Suno để chuyển thành Sound FX.
            </span>
          </div>

        </div>

        {/* ── 3. Modal Footer ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isImporting}
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            size="md"
            loading={isImporting}
            onClick={handleImport}
            disabled={isImporting || !inputUrls.trim()}
            leftIcon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
          >
            {isImporting ? 'Đang nhập...' : (candidates.length > 0 ? `Nạp ${candidates.length} Sound FX` : 'Nạp Vào Thư Viện')}
          </Button>
        </div>

      </div>
    </div>
  );
};
