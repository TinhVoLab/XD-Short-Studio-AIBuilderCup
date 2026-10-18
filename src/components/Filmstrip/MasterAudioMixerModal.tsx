import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useEditorStore } from '@/store/useEditorStore';
import styles from './MasterAudioMixerModal.module.css';
import { Button } from '@/components/ui';

export const MasterAudioMixerModal: React.FC = () => {
  const {
    audioMixerOpen,
    setAudioMixerOpen,
    masterVolume,
    voiceoverVolume,
    voiceoverSpeedRate,
    voiceoverReverb,
    bgmVolume,
    sfxVolume,
    isMasterMuted,
    isVoiceMuted,
    isBgmMuted,
    isSfxMuted,
    soloTrackId,
    setMasterVolume,
    setVoiceoverVolume,
    setVoiceoverSpeedRate,
    setVoiceoverReverb,
    setBgmVolume,
    setSfxVolume,
    toggleTrackMute,
    toggleTrackSolo,
    resetAudioMixer,
    showToast
  } = useEditorStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAudioMixerOpen(false);
    };
    if (audioMixerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioMixerOpen, setAudioMixerOpen]);

  if (!audioMixerOpen) return null;

  // Convert volume multiplier to Decibel readout string
  const formatDb = (vol: number) => {
    if (vol <= 0.001) return '-∞ dB';
    const db = 20 * Math.log10(vol);
    return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  // Render VU meter segment lights (14 segments)
  const renderVuMeter = (vol: number, isMuted: boolean) => {
    const totalSegments = 14;
    const effectiveVol = isMuted ? 0 : Math.min(1.2, vol);
    const activeSegments = Math.round((effectiveVol / 1.2) * totalSegments);

    return (
      <div className={styles.vuMeter}>
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isLit = i < activeSegments;
          let colorClass = '';
          if (isLit) {
            if (i >= 12) colorClass = styles.red;
            else if (i >= 9) colorClass = styles.yellow;
            else colorClass = styles.green;
          }
          return (
            <div
              key={i}
              className={`${styles.vuSegment} ${colorClass}`}
            />
          );
        })}
      </div>
    );
  };

  const handleReset = () => {
    resetAudioMixer();
    showToast('Đã khôi phục Mixer về mức chuẩn 0 dB');
  };

  const modalContent = (
    <>
      {/* 1. Backdrop */}
      <div className={styles.backdrop} onClick={() => setAudioMixerOpen(false)} />

      {/* 2. Studio Master Audio Mixer Dialog */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Top Header Bar */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </div>
            <div>
              <div className={styles.headerTitle}>
                STUDIO MASTER AUDIO CONSOLE
                <span className={styles.headerBadge}>DSP PRO</span>
              </div>
              <div className={styles.headerMeta}>44.1 kHz • 24-bit Low-Latency Hardware Mixer</div>
            </div>
          </div>
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            onClick={() => setAudioMixerOpen(false)}
            title="Đóng Mixer (Esc)"
          >
            ✕
          </Button>
        </div>

        {/* ── TOP DECK: 4-Channel Strips (100% Balanced Heights) ── */}
        <div className={styles.channelsGrid}>
          
          {/* Channel 1: Voiceover (Track A1) */}
          <div className={styles.channelStrip}>
            <div className={styles.channelHeader}>
              <span className={styles.channelTag}>Track A1</span>
              <span className={styles.channelName}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Giọng Đọc
              </span>
            </div>

            <div className={styles.buttonsRow}>
              <button
                type="button"
                className={`${styles.muteBtn} ${isVoiceMuted ? styles.active : ''}`}
                onClick={() => toggleTrackMute('voice')}
                title="Tắt tiếng Giọng Đọc (Mute)"
              >
                M
              </button>
              <button
                type="button"
                className={`${styles.soloBtn} ${soloTrackId === 'voice' ? styles.active : ''}`}
                onClick={() => toggleTrackSolo('voice')}
                title="Chỉ nghe Giọng Đọc (Solo)"
              >
                S
              </button>
            </div>

            <div className={styles.faderSection}>
              <div className={styles.dbScale}>
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
                <span>-24</span>
                <span>-∞</span>
              </div>
              <div className={styles.faderContainer}>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.01"
                  value={voiceoverVolume}
                  onChange={(e) => setVoiceoverVolume(parseFloat(e.target.value))}
                  className={styles.verticalSlider}
                  title={`Giọng đọc: ${Math.round(voiceoverVolume * 100)}% (${formatDb(voiceoverVolume)})`}
                />
              </div>
              {renderVuMeter(voiceoverVolume, isVoiceMuted)}
            </div>

            <div className={styles.readoutBox}>
              <span className={`${styles.readoutPercent} ${isVoiceMuted ? styles.muted : ''}`}>
                {isVoiceMuted ? 'MUTE' : `${Math.round(voiceoverVolume * 100)}%`}
              </span>
              <span className={styles.readoutDb}>{formatDb(voiceoverVolume)}</span>
            </div>
          </div>

          {/* Channel 2: SFX (Track A2) */}
          <div className={styles.channelStrip}>
            <div className={styles.channelHeader}>
              <span className={styles.channelTag}>Track A2</span>
              <span className={styles.channelName}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
                Hiệu Ứng
              </span>
            </div>

            <div className={styles.buttonsRow}>
              <button
                type="button"
                className={`${styles.muteBtn} ${isSfxMuted ? styles.active : ''}`}
                onClick={() => toggleTrackMute('sfx')}
                title="Tắt tiếng Hiệu Ứng (Mute)"
              >
                M
              </button>
              <button
                type="button"
                className={`${styles.soloBtn} ${soloTrackId === 'sfx' ? styles.active : ''}`}
                onClick={() => toggleTrackSolo('sfx')}
                title="Chỉ nghe Hiệu Ứng (Solo)"
              >
                S
              </button>
            </div>

            <div className={styles.faderSection}>
              <div className={styles.dbScale}>
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
                <span>-24</span>
                <span>-∞</span>
              </div>
              <div className={styles.faderContainer}>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                  className={styles.verticalSlider}
                  title={`Hiệu ứng: ${Math.round(sfxVolume * 100)}% (${formatDb(sfxVolume)})`}
                />
              </div>
              {renderVuMeter(sfxVolume, isSfxMuted)}
            </div>

            <div className={styles.readoutBox}>
              <span className={`${styles.readoutPercent} ${isSfxMuted ? styles.muted : ''}`}>
                {isSfxMuted ? 'MUTE' : `${Math.round(sfxVolume * 100)}%`}
              </span>
              <span className={styles.readoutDb}>{formatDb(sfxVolume)}</span>
            </div>
          </div>

          {/* Channel 3: BGM Music (Track A3) */}
          <div className={styles.channelStrip}>
            <div className={styles.channelHeader}>
              <span className={styles.channelTag}>Track A3</span>
              <span className={styles.channelName}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}>
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                Nhạc Nền
              </span>
            </div>

            <div className={styles.buttonsRow}>
              <button
                type="button"
                className={`${styles.muteBtn} ${isBgmMuted ? styles.active : ''}`}
                onClick={() => toggleTrackMute('bgm')}
                title="Tắt tiếng Nhạc Nền (Mute)"
              >
                M
              </button>
              <button
                type="button"
                className={`${styles.soloBtn} ${soloTrackId === 'bgm' ? styles.active : ''}`}
                onClick={() => toggleTrackSolo('bgm')}
                title="Chỉ nghe Nhạc Nền (Solo)"
              >
                S
              </button>
            </div>

            <div className={styles.faderSection}>
              <div className={styles.dbScale}>
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
                <span>-24</span>
                <span>-∞</span>
              </div>
              <div className={styles.faderContainer}>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className={styles.verticalSlider}
                  title={`Nhạc nền: ${Math.round(bgmVolume * 100)}% (${formatDb(bgmVolume)})`}
                />
              </div>
              {renderVuMeter(bgmVolume, isBgmMuted)}
            </div>

            <div className={styles.readoutBox}>
              <span className={`${styles.readoutPercent} ${isBgmMuted ? styles.muted : ''}`}>
                {isBgmMuted ? 'MUTE' : `${Math.round(bgmVolume * 100)}%`}
              </span>
              <span className={styles.readoutDb}>{formatDb(bgmVolume)}</span>
            </div>
          </div>

          {/* Channel 4: Master Output */}
          <div className={`${styles.channelStrip} ${styles.master}`}>
            <div className={styles.channelHeader}>
              <span className={styles.channelTag} style={{ color: '#00E5FF', background: 'rgba(0, 229, 255, 0.12)' }}>Output</span>
              <span className={styles.channelName} style={{ color: '#00E5FF' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}>
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                </svg>
                Master
              </span>
            </div>

            <div className={styles.buttonsRow}>
              <button
                type="button"
                className={`${styles.muteBtn} ${isMasterMuted ? styles.active : ''}`}
                onClick={() => toggleTrackMute('master')}
                style={{ flex: 1 }}
                title="Tắt toàn bộ âm thanh (Mute All)"
              >
                {isMasterMuted ? 'MUTED' : 'MUTE ALL'}
              </button>
            </div>

            <div className={styles.faderSection}>
              <div className={styles.dbScale}>
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
                <span>-24</span>
                <span>-∞</span>
              </div>
              <div className={styles.faderContainer}>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className={`${styles.verticalSlider} ${styles.master}`}
                  title={`Master Volume: ${Math.round(masterVolume * 100)}% (${formatDb(masterVolume)})`}
                />
              </div>
              {renderVuMeter(masterVolume, isMasterMuted)}
            </div>

            <div className={styles.readoutBox}>
              <span className={`${styles.readoutPercent} ${styles.master} ${isMasterMuted ? styles.muted : ''}`}>
                {isMasterMuted ? 'MUTE' : `${Math.round(masterVolume * 100)}%`}
              </span>
              <span className={styles.readoutDb}>{formatDb(masterVolume)}</span>
            </div>
          </div>

        </div>

        {/* ── MIDDLE DECK: VOICE DSP & ACOUSTIC ENGINE ── */}
        <div className={styles.dspEngineCard}>
          <div className={styles.dspHeader}>
            <div className={styles.dspTitle}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 6, verticalAlign: '-2px' }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
              VOICE DSP & ACOUSTIC PROCESSOR
            </div>
            <span style={{ fontSize: 9.5, color: '#777', fontWeight: 600 }}>Tự động đồng bộ với Track A1</span>
          </div>

          <div className={styles.dspGrid}>
            
            {/* Module 1: Voice Speed */}
            <div className={styles.dspModule}>
              <div className={styles.dspModuleHeader}>
                <span className={styles.dspLabel}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Tốc Độ Đọc (Tempo)
                </span>
                <span className={styles.dspValue} style={{ color: '#BEFF01' }}>
                  {voiceoverSpeedRate || 1.0}x
                </span>
              </div>
              
              <input
                type="range"
                min="0.75"
                max="1.75"
                step="0.05"
                value={voiceoverSpeedRate || 1.0}
                onChange={(e) => setVoiceoverSpeedRate(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#BEFF01', height: 4, cursor: 'pointer' }}
                title={`Tốc độ đọc: ${voiceoverSpeedRate || 1.0}x`}
              />

              <div className={styles.dspPresetRow}>
                {[0.9, 1.0, 1.15, 1.25].map(rate => {
                  const isActive = (voiceoverSpeedRate || 1.0) === rate;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setVoiceoverSpeedRate(rate)}
                      className={`${styles.presetPill} ${isActive ? styles.activeGreen : ''}`}
                    >
                      {rate}x
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Module 2: Studio Reverb */}
            <div className={styles.dspModule}>
              <div className={styles.dspModuleHeader}>
                <span className={styles.dspLabel}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Không Gian Vang (Reverb)
                </span>
                <span className={styles.dspValue} style={{ color: '#00D4FF' }}>
                  {Math.round((voiceoverReverb || 0) * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={voiceoverReverb || 0}
                onChange={(e) => setVoiceoverReverb(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00D4FF', height: 4, cursor: 'pointer' }}
                title={`Độ vang phòng thu: ${Math.round((voiceoverReverb || 0) * 100)}%`}
              />

              <div className={styles.dspPresetRow}>
                {[
                  { label: 'Tắt', val: 0.0 },
                  { label: 'Ấm', val: 0.2 },
                  { label: 'Vang', val: 0.45 },
                  { label: 'Sâu', val: 0.75 },
                ].map(item => {
                  const isActive = Math.abs((voiceoverReverb || 0) - item.val) < 0.08;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setVoiceoverReverb(item.val)}
                      className={`${styles.presetPill} ${isActive ? styles.activeCyan : ''}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="md"
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            }
            onClick={handleReset}
            title="Khôi phục toàn bộ âm lượng về mức chuẩn ban đầu"
          >
            Đặt Lại Chuẩn (0 dB)
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setAudioMixerOpen(false)}
          >
            Xác Nhận & Đóng
          </Button>
        </div>

      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
