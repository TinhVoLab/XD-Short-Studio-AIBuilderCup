import React from 'react';
import apStyles from '../AudioPanel.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { SunoBgmSection } from '../SunoBgmSection';

export function BgmSection() {
  const {
    bgMusicUrl, setBgMusic,
    audioClips, removeAudioClip,
    showToast
  } = useEditorStore(
    useShallow(s => ({
      bgMusicUrl: s.bgMusicUrl,
      setBgMusic: s.setBgMusic,
      audioClips: s.audioClips,
      removeAudioClip: s.removeAudioClip,
      showToast: s.showToast,
    }))
  );

  const activeBgmClip = audioClips.find(
    c => (c.trackId === 'A3' || c.trackId === 'bgm') && c.url && !c.isExpired
  );
  const effectiveBgmUrl = activeBgmClip?.url || bgMusicUrl;
  const effectiveBgmName = activeBgmClip?.name?.replace(/^(🎵|🎶)\s*/, '') || (effectiveBgmUrl ? effectiveBgmUrl.split('/').pop() : '');

  const handleRemoveBgm = () => {
    if (activeBgmClip) {
      removeAudioClip(activeBgmClip.id);
    }
    setBgMusic(undefined);
    showToast('Đã xóa nhạc nền khỏi Timeline');
  };

  return (
    <div className={apStyles.bgmCol}>
      {/* Active BGM Settings */}
      <div className={apStyles.bgmActiveCard}>
        <div className={apStyles.bgmActiveTitle}>
          <span>Nhạc nền đang chọn (Track A3)</span>
          {effectiveBgmUrl && (
            <button
              type="button"
              onClick={handleRemoveBgm}
              className={apStyles.bgmRemoveBtn}
            >
              Gỡ bỏ
            </button>
          )}
        </div>

        {effectiveBgmUrl ? (
          <div className={apStyles.bgmFilename}>
            {effectiveBgmName} {activeBgmClip ? `(${Math.round(activeBgmClip.duration)}s)` : ''}
          </div>
        ) : (
          <div className={apStyles.bgmEmpty}>
            Chưa chọn nhạc nền. Hãy chọn 1 bài từ danh sách Suno AI hoặc Tệp tải lên bên dưới.
          </div>
        )}
      </div>

      {/* Suno AI Music Library */}
      <SunoBgmSection />
    </div>
  );
}
