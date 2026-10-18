import React, { useState, useRef } from 'react';
import apStyles from '../AudioPanel.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { getAudioDuration } from '@/utils/audio';
import { API_BASE } from '@/config/api';
import { useAudioPreview } from '@/hooks/useAudioPreview';

export function AudioUploadZone() {
  const {
    uploadedAudio, addUploadedAudio,
    addAudioClip, showToast
  } = useEditorStore(
    useShallow(s => ({
      uploadedAudio: s.uploadedAudio,
      addUploadedAudio: s.addUploadedAudio,
      addAudioClip: s.addAudioClip,
      showToast: s.showToast,
    }))
  );

  const { playingId, togglePreview } = useAudioPreview();

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      showToast('Chỉ hỗ trợ file âm thanh (.mp3, .wav, .m4a, .aac)', 3000);
      return;
    }

    setIsUploading(true);
    showToast('Đang tải file nhạc lên...', 2000);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      addUploadedAudio({ id: data.id, url: data.url, name: data.name });
      showToast('Tải file âm thanh thành công!', 2500);
    } catch (err) {
      console.error(err);
      showToast('Tải âm thanh thất bại (Server lỗi hoặc file quá lớn)', 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetBGM = async (url: string, name: string) => {
    const { audioTrackIds, audioClips } = useEditorStore.getState();
    const trackIds = [...audioTrackIds];
    if (!trackIds.includes('A3')) {
      if (!trackIds.includes('A2')) trackIds.push('A2');
      trackIds.push('A3');
    }

    const measuredDur = await getAudioDuration(url);
    const realDuration = measuredDur > 0 ? Math.round(measuredDur * 10) / 10 : 30;

    const otherClips = audioClips.filter(c => c.trackId !== 'A3' && c.trackId !== 'bgm');
    const newBgmClip = {
      id: `clip-bgm-${Date.now()}`,
      name: name,
      url: url,
      startSec: 0,
      duration: realDuration,
      playDurationSec: realDuration,
      trimStartSec: 0,
      volume: 0.35,
      trackId: 'A3' as const
    };

    useEditorStore.setState({
      audioTrackIds: trackIds,
      audioClips: [...otherClips, newBgmClip],
      bgMusicUrl: url,
      bgMusicVolume: 0.35,
      isSaved: false
    });

    showToast(`Đã đặt "${name}" (${realDuration}s) vào Track A3 BGM!`, 2500);
  };

  return (
    <div className={apStyles.uploadCard}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          e.target.value = '';
        }}
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className={apStyles.uploadHeader}>
        <div className={apStyles.uploadTitleRow}>
          <span>Tệp đã tải lên</span>
          <span className={apStyles.uploadCount}>{uploadedAudio.length}</span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={apStyles.uploadBtn}
        >
          + Tải file
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={apStyles.dropZoneCustom}
        data-dragging={isDragging ? 'true' : 'false'}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" className={apStyles.dropZoneIcon}>
          <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <div className={apStyles.dropZoneLabel}>
          {isUploading ? 'Đang tải lên...' : 'Kéo thả file âm thanh từ máy'}
        </div>
        <div className={apStyles.dropZoneHint}>MP3, WAV, M4A, AAC</div>
      </div>

      {/* Uploaded Audio List */}
      {uploadedAudio.length > 0 && (
        <div className={apStyles.audioList}>
          {uploadedAudio.map((item) => {
            const isPreviewing = playingId === item.id;
            return (
              <div key={item.id} className={apStyles.audioItem}>
                <div className={apStyles.audioItemHeader}>
                  <span className={apStyles.audioItemName}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 6, verticalAlign: '-2px', opacity: 0.7 }}>
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePreview(item.id, item.url)}
                    className={`${apStyles.previewPlayBtn} ${isPreviewing ? apStyles.previewPlayBtnActive : apStyles.previewPlayBtnDefault}`}
                  >
                    {isPreviewing ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        Dừng
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Nghe
                      </>
                    )}
                  </button>
                </div>

                <div className={apStyles.audioItemActions}>
                  <button
                    type="button"
                    onClick={() => handleSetBGM(item.url, item.name)}
                    className={apStyles.btnBgm}
                  >
                    + Nhạc nền (BGM)
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const realDur = await getAudioDuration(item.url);
                      const currentSec = useEditorStore.getState().currentTimeSec;
                      addAudioClip({
                        name: item.name,
                        url: item.url,
                        startSec: currentSec,
                        duration: realDur,
                        playDurationSec: realDur,
                        volume: 1,
                        trackId: 'A2'
                      });
                      showToast(`Đã thêm "${item.name}" vào Layer A2!`);
                    }}
                    className={apStyles.btnTimeline}
                  >
                    + Clip Timeline (A2)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
