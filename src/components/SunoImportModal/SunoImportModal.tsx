import React, { useState, useEffect, useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { SunoBgmTrack, SunoVibe } from '@/types/scene';
import { SUNO_VIBE_CATEGORIES } from '@/config/sunoPresetCatalog';
import { API_BASE } from '@/config/api';
import { Button, Textarea } from '@/components/ui';

interface SunoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SunoImportModal: React.FC<SunoImportModalProps> = ({ isOpen, onClose }) => {
  const { addBatchSunoTracks, showToast, currentUser, isFeatureEnabled, setPricingModalOpen } = useEditorStore();

  const [inputUrls, setInputUrls] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<SunoVibe>('healing');
  const [isImporting, setIsImporting] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time URL & UUID parser
  const detectedIds = useMemo(() => {
    if (!inputUrls.trim()) return [];
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const matches = inputUrls.match(uuidRegex) || [];
    return Array.from(new Set(matches));
  }, [inputUrls]);

  // If modal is closed, do not render
  if (!isOpen) return null;

  const handleImport = async () => {
    const canUseSuno = currentUser.planTier === 'admin' || isFeatureEnabled(currentUser.planTier, 'sunoAiMusic');
    if (!canUseSuno) {
      showToast('Nhạc nền Suno có ở gói Creator và Business');
      onClose();
      setPricingModalOpen(true);
      return;
    }

    if (!inputUrls.trim()) {
      showToast('Vui lòng dán ít nhất 1 link hoặc mã bài hát từ Suno');
      return;
    }

    setIsImporting(true);
    showToast('Đang phân tích và tải nhạc từ Suno về kho lưu trữ...');

    try {
      // 1. Try Backend Server Import
      const res = await fetch(`${API_BASE}/api/ai/suno-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: inputUrls,
          vibe: selectedVibe
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          addBatchSunoTracks(data.tracks);
          showToast(`Đã thêm thành công ${data.tracks.length} bài nhạc Suno vào Thư viện!`);
          setInputUrls('');
          setIsImporting(false);
          onClose();
          return;
        }
      }

      // 2. Client-Side Fallback: Extract UUIDs directly
      if (detectedIds.length > 0) {
        const fallbackTracks: SunoBgmTrack[] = detectedIds.map((id, idx) => ({
          id: `suno_custom_${id.slice(0, 8)}_${Date.now()}_${idx}`,
          title: `Suno Track #${id.slice(0, 6)}`,
          vibe: selectedVibe,
          audioUrl: `https://cdn1.suno.ai/${id}.mp3`,
          duration: 30,
          originalSunoUrl: `https://suno.com/song/${id}`,
          tags: ['suno', selectedVibe],
          createdAt: Date.now() + idx
        }));

        addBatchSunoTracks(fallbackTracks);
        showToast(`Đã thêm ${fallbackTracks.length} bài hát Suno vào Thư viện!`);
        setInputUrls('');
        setIsImporting(false);
        onClose();
        return;
      }

      showToast('Không tìm thấy link hoặc mã bài hát hợp lệ');
    } catch (err: any) {
      // Fallback in case of server failure
      if (detectedIds.length > 0) {
        const fallbackTracks: SunoBgmTrack[] = detectedIds.map((id, idx) => ({
          id: `suno_custom_${id.slice(0, 8)}_${Date.now()}_${idx}`,
          title: `Suno Track #${id.slice(0, 6)}`,
          vibe: selectedVibe,
          audioUrl: `https://cdn1.suno.ai/${id}.mp3`,
          duration: 30,
          originalSunoUrl: `https://suno.com/song/${id}`,
          tags: ['suno', selectedVibe],
          createdAt: Date.now() + idx
        }));

        addBatchSunoTracks(fallbackTracks);
        showToast(`Đã thêm ${fallbackTracks.length} bài hát Suno vào Thư viện!`);
        setInputUrls('');
        setIsImporting(false);
        onClose();
        return;
      }
      showToast(`Lỗi nhập nhạc: ${err.message || 'Không thể kết nối máy chủ'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const activeCat = SUNO_VIBE_CATEGORIES.find(c => c.id === selectedVibe);

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
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(190, 255, 1, 0.1)',
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
            background: 'linear-gradient(90deg, rgba(190, 255, 1, 0.06) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(190, 255, 1, 0.12)',
                border: '1px solid rgba(190, 255, 1, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#BEFF01'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px' }}>
                Thêm Nhạc Suno AI Vào Thư Viện
              </h2>
              <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#8E95A5' }}>
                Dán link bài hát Suno để nhập nhạc nền chất lượng cao vào dự án
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
          
          {/* Vibe Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#D0D5E0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Gán Thể Loại (Vibe):
              </label>
              <span style={{ fontSize: '11px', color: activeCat?.color || '#BEFF01', fontWeight: 700 }}>
                {activeCat?.emoji} {activeCat?.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {SUNO_VIBE_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                const isSelected = selectedVibe === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedVibe(cat.id as SunoVibe)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      background: isSelected ? `${cat.color}22` : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isSelected ? cat.color : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? cat.color : '#8E95A5',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 12px ${cat.color}33` : 'none',
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
                2. Dán Link Suno (Hỗ trợ nhiều link):
              </label>
              {detectedIds.length > 0 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#BEFF01',
                  background: 'rgba(190, 255, 1, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(190, 255, 1, 0.3)'
                }}>
                  Tìm thấy {detectedIds.length} bài hát
                </span>
              )}
            </div>

            <Textarea
              value={inputUrls}
              onChange={(e) => setInputUrls(e.target.value)}
              placeholder="Dán link Suno tại đây (mỗi link 1 dòng)...&#10;Ví dụ: https://suno.com/song/094404fe-f3e2-43d0-924b-0bfe4fceb5f8"
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
              Hệ thống tự động lọc UUID và tải audio từ Suno CDN. Bạn có thể dán link trực tiếp từ trang web Suno hoặc dán chuỗi ID 36 ký tự.
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
            {isImporting ? 'Đang nhập nhạc...' : (detectedIds.length > 0 ? `Nạp ${detectedIds.length} Bài Hát` : 'Nạp Vào Thư Viện')}
          </Button>
        </div>

      </div>
    </div>
  );
};
