import React from 'react'
import { Player, PlayerRef } from '@remotion/player'
import { MainComposition } from '@/remotion/MainComposition'
import styles from '../ExportModal.module.css'
import { downloadFileDirectly } from '@/utils/downloadHelper';
import { useEditorStore } from '@/store/useEditorStore';
import { SocialCaptionModal } from './SocialCaptionModal';
import { Button } from '@/components/ui';
import { RenderChargeDecision, resolutionScale, maxAllowedVideoSec, TOPUP_PACKS } from '@/config/planCatalog';

interface SingleExportViewProps {
  durationInFrames: number
  scenes: any[]
  bgMusicUrl?: string
  bgMusicVolume: number
  audioClips: any[]
  videoTitle: string
  setVideoTitle: (t: string) => void
  isRendering: boolean
  isCompleted: boolean
  progressPct: number
  quality: string
  setQuality: (q: any) => void
  /** Xem trước cách tính lượt của server (null = Admin) */
  chargePreview: RenderChargeDecision | null
  videoSec: number
  activeRenderJob: any
  startExport: () => void
  cancelExport: () => void
  close: () => void
  setActiveRenderJob: (job: any) => void
  brandingSettings: any
}

export function SingleExportView({
  durationInFrames,
  scenes,
  bgMusicUrl,
  bgMusicVolume,
  audioClips,
  videoTitle,
  setVideoTitle,
  isRendering,
  isCompleted,
  progressPct,
  quality,
  setQuality,
  chargePreview,
  videoSec,
  activeRenderJob,
  startExport,
  cancelExport,
  close,
  setActiveRenderJob,
  brandingSettings
}: SingleExportViewProps) {
  const [captionModalOpen, setCaptionModalOpen] = React.useState(false);
  const [isCapturingThumb, setIsCapturingThumb] = React.useState(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = React.useState(0);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [canShare, setCanShare] = React.useState(false);
  const [isPreparingShare, setIsPreparingShare] = React.useState(false);
  const playerRef = React.useRef<PlayerRef>(null);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
      try {
        const dummyFile = new File([''], 'test.mp4', { type: 'video/mp4' });
        setCanShare(navigator.canShare({ files: [dummyFile] }));
      } catch (e) {
        setCanShare(false);
      }
    }
  }, []);

  const {
    masterVolume, voiceoverVolume, sfxVolume, bgmVolume,
    isVoiceMuted, isSfxMuted, isBgmMuted, isMasterMuted,
    soloTrackId, soloTrackIds, mutedTrackIds
  } = useEditorStore(s => ({
    masterVolume: s.masterVolume ?? 1.0,
    voiceoverVolume: s.voiceoverVolume ?? 1.0,
    sfxVolume: s.sfxVolume ?? 0.8,
    bgmVolume: s.bgmVolume ?? 0.8,
    isVoiceMuted: s.isVoiceMuted || false,
    isSfxMuted: s.isSfxMuted || false,
    isBgmMuted: s.isBgmMuted || false,
    isMasterMuted: s.isMasterMuted || false,
    soloTrackId: s.soloTrackId,
    soloTrackIds: s.soloTrackIds || [],
    mutedTrackIds: s.mutedTrackIds || [],
  }));

  // Live Stopwatch Ticker: nhảy nhịp nhàng 1s/lần trong suốt quá trình render
  React.useEffect(() => {
    if (!isRendering) {
      if (!isCompleted) setElapsedSec(0);
      return;
    }
    const start = activeRenderJob?.startedAt || Date.now();
    setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));

    const timer = setInterval(() => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRendering, activeRenderJob?.startedAt, isCompleted]);

  const formatTimer = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}s`;
  };

  const getStageText = () => {
    const stage = activeRenderJob?.stage || activeRenderJob?.status;
    const rendered = activeRenderJob?.renderedFrames || 0;
    const total = activeRenderJob?.totalFrames || 0;
    const queuePos = activeRenderJob?.queuePosition;

    if (stage === 'waiting') {
      return queuePos ? `Đang xếp hàng chờ xuất video (vị trí #${queuePos})...` : 'Đang xếp hàng chờ xuất video...';
    }
    if (stage === 'queued') {
      return 'Đang khởi động tiến trình xuất...';
    }
    if (stage === 'bundling') {
      return 'Đóng gói engine & tài nguyên...';
    }
    if (stage === 'encoding') {
      return 'Xử lý âm thanh & đóng gói MP4...';
    }
    if (stage === 'uploading') {
      return 'Đồng bộ Google Cloud Storage CDN...';
    }
    if (stage === 'rendering' || isRendering) {
      if (total > 0) {
        return `Render khung hình (${rendered}/${total})`;
      }
      return 'Đang render video...';
    }
    return 'Sẵn sàng xuất video';
  };

  const showToast = useEditorStore(s => s.showToast);
  const activeFolderName = useEditorStore(s => s.activeProjectFolderName);
  const currentUser = useEditorStore(s => s.currentUser);
  const canRenderVideo = useEditorStore(s => s.canRenderVideo);
  const setPricingModalOpen = useEditorStore(s => s.setPricingModalOpen);
  const isFeatureEnabled = useEditorStore(s => s.isFeatureEnabled);
  const getPlanByTier = useEditorStore(s => s.getPlanByTier);
  const renderCheck = canRenderVideo();
  const canRemoveWatermark = isFeatureEnabled(currentUser.planTier, 'removeWatermark');
  const currentPlan = getPlanByTier(currentUser.planTier);
  const maxScale = resolutionScale(currentPlan);
  const isTooLong = Boolean(chargePreview && !chargePreview.ok && chargePreview.code === 'too_long');

  // Dòng nhắc độ dài theo gói + cảnh báo cách tính lượt cho video hiện tại
  const lengthNote = (() => {
    if (!chargePreview) return null;
    const q = currentPlan.quotas;
    const limitText = q.longVideoMaxSec > q.maxVideoSec
      ? `Tối đa ${q.maxVideoSec} giây mỗi video (${q.maxVideoSec + 1}–${q.longVideoMaxSec} giây tính ${q.longVideoCredits} lượt)`
      : `Tối đa ${q.maxVideoSec} giây mỗi video`;
    const sec = Math.round(videoSec);
    if (!chargePreview.ok && chargePreview.code === 'too_long') {
      return { tone: 'danger', text: `Video dài ${sec} giây, vượt giới hạn ${maxAllowedVideoSec(currentPlan)} giây của gói ${currentPlan.name}. Hãy rút gọn bớt cảnh hoặc nâng cấp gói.` };
    }
    if (chargePreview.ok && chargePreview.source === 'bonus') {
      const overPlan = sec > maxAllowedVideoSec(currentPlan) ? ` (dài hơn ${maxAllowedVideoSec(currentPlan)} giây của gói, tối đa ${TOPUP_PACKS[0].maxVideoSec} giây)` : '';
      return { tone: 'warn', text: `Video dài ${sec} giây${overPlan} — sẽ dùng 1 video mua thêm, còn ${currentUser.quota.bonusVideos ?? 0}.` };
    }
    if (chargePreview.ok && chargePreview.credits > 1) {
      return { tone: 'warn', text: `Video dài ${sec} giây — tính ${chargePreview.credits} lượt. ${limitText}.` };
    }
    return { tone: 'info', text: `Video dài ${sec} giây. ${limitText}.` };
  })();

  const handleDownload = (url: string, filename?: string) => {
    downloadFileDirectly(url, filename || 'video.mp4')
  }

  const handleCaptureThumbnail = async () => {
    if (!scenes || scenes.length === 0) return;
    setIsCapturingThumb(true);
    try {
      // Tính toán khung hình chụp của cảnh được chọn (khung hình thứ 15 trong cảnh đó)
      let startSec = 0;
      for (let i = 0; i < selectedSceneIndex && i < scenes.length; i++) {
        startSec += (scenes[i].durationSec || scenes[i].duration || 3);
      }
      const targetFrame = Math.round(startSec * 30) + 15;

      const { generateProjectThumbnail } = await import('@/utils/projectStorage');
      const res = await generateProjectThumbnail(scenes, activeFolderName, targetFrame);
      if (res && res.downloadUrl) {
        downloadFileDirectly(res.downloadUrl, `${videoTitle || 'video'}-canh${selectedSceneIndex + 1}-cover.jpg`);
        showToast(`Đã chụp ảnh bìa từ Cảnh ${selectedSceneIndex + 1} (1080×1920) thành công!`);
      } else {
        showToast('Lỗi khi tạo ảnh bìa');
      }
    } catch (err: any) {
      showToast(`Lỗi chụp ảnh bìa: ${err.message}`);
    } finally {
      setIsCapturingThumb(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsPreparingShare(true);
      const downloadUrl = activeRenderJob?.downloadUrl;
      if (!downloadUrl) throw new Error('Missing download URL');

      // A. Setup Caption
      const captions = useEditorStore.getState().socialCaptions;
      if (captions) {
        const title = captions.tiktok?.title || captions.youtube?.titleViral || '';
        const cap = captions.tiktok?.caption || captions.youtube?.description || '';
        const hashtags = (captions.curatedHashtags || []).join(' ');
        const textToShare = `${title}\n\n${cap}\n\n${hashtags}`.trim();
        
        try {
          await navigator.clipboard.writeText(textToShare);
          showToast('Đã copy kịch bản! Hãy dán vào ô mô tả của MXH nhé.');
        } catch (e) {
          console.warn('Clipboard write failed', e);
        }
      }

      // B. Fetch file
      showToast('Đang tải tệp vào bộ nhớ, vui lòng đợi...');
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const file = new File([blob], activeRenderJob?.outputFilename || `XD_Video_${Date.now()}.mp4`, { type: 'video/mp4' });
      
      // C. Trigger Share Sheet
      await navigator.share({
        title: 'XD-Short Video',
        text: 'Kịch bản đã được copy sẵn vào bộ nhớ tạm. Hãy Dán (Paste) khi đăng nhé!',
        files: [file]
      });

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed', err);
        showToast('Chia sẻ trực tiếp bị lỗi. Đang chuyển sang tải thường...');
        handleDownload(activeRenderJob?.downloadUrl || '', activeRenderJob?.outputFilename);
      }
    } finally {
      setIsPreparingShare(false);
    }
  };



  return (
    <div className={styles.body}>
      <div className={styles.preview}>
        <Player
          ref={playerRef}
          component={MainComposition}
          durationInFrames={durationInFrames}
          compositionWidth={360}
          compositionHeight={640}
          fps={30}
          style={{ width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#000' }}
          inputProps={React.useMemo(() => ({
            scenes,
            bgMusicUrl,
            bgMusicVolume,
            audioClips,
            masterVolume,
            voiceoverVolume,
            sfxVolume,
            bgmVolume,
            isVoiceMuted,
            isSfxMuted,
            isBgmMuted,
            isMuted: isMasterMuted,
            soloTrackId,
            soloTrackIds,
            mutedTrackIds,
            showWatermark: !canRemoveWatermark,
          }), [
            scenes, bgMusicUrl, bgMusicVolume, audioClips,
            masterVolume, voiceoverVolume, sfxVolume, bgmVolume,
            isVoiceMuted, isSfxMuted, isBgmMuted, isMasterMuted,
            soloTrackId, soloTrackIds, mutedTrackIds,
            canRemoveWatermark
          ])}
          controls
          loop
          acknowledgeRemotionLicense
          numberOfSharedAudioTags={20}
          renderLoading={() => (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#888' }}>
              <span>Đang tải...</span>
            </div>
          )}
          errorFallback={({ error }) => (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0b0b', color: '#FF4455', padding: 20, textAlign: 'center', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Remotion Player Error</div>
              <div style={{ fontSize: 12, wordBreak: 'break-word', maxWidth: '90%' }}>{error.message}</div>
            </div>
          )}
        />
      </div>
      <div className={styles.opts}>
        <div className={styles.row}>
          <label className={styles.rowLabel} title="Tên file chuẩn SEO hỗ trợ thuật toán TikTok & YouTube Shorts">
            Tên SEO
          </label>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 8px' }}>
            <input
              type="text"
              value={videoTitle}
              onChange={e => {
                setVideoTitle(e.target.value)
                if (isCompleted) {
                  setActiveRenderJob(null)
                }
              }}
              disabled={isRendering}
              placeholder="ten-video-chuan-seo-2026"
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '11px', fontFamily: 'monospace', padding: '6px 0', outline: 'none', minWidth: 0 }}
            />
            <span style={{ fontSize: '10.5px', color: 'var(--text-sub)', fontWeight: 600, marginLeft: 4 }}>.mp4</span>
          </div>
        </div>

        <div className={styles.row}>
          <label className={styles.rowLabel}>Định dạng</label>
          <select className={styles.select}>
            <option>MP4 (H.264 - Chuẩn Studio)</option>
          </select>
        </div>
        <div className={styles.row}>
          <label className={styles.rowLabel}>Chất lượng</label>
          <select
            className={styles.select}
            value={quality}
            onChange={e => {
              const val = e.target.value
              if (val === '1080p' && maxScale < 3) {
                showToast('Xuất 1080p không logo có ở gói Creator và Business')
                setPricingModalOpen(true)
                return
              }
              setQuality(val)
              if (isCompleted) {
                setActiveRenderJob(null)
              }
            }}
            disabled={isRendering}
          >
            <option value="1080p">
              {maxScale < 3 ? '1080p (cần nâng cấp gói)' : '1080p Full HD (1080 × 1920)'}
            </option>
            <option value="720p">
              {!canRemoveWatermark ? '720p HD (có logo XD-Short)' : '720p HD (720 × 1280)'}
            </option>
            <option value="360p">360p nháp (360 × 640)</option>
          </select>
        </div>
        <div className={styles.row}>
          <label className={styles.rowLabel}>Khung hình</label>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-sub)' }}>30 fps</span>
        </div>
        {lengthNote && (
          <div
            role={lengthNote.tone === 'danger' ? 'alert' : undefined}
            style={{
              fontSize: 'var(--font-sm)',
              lineHeight: 1.45,
              color: lengthNote.tone === 'danger' ? 'var(--danger, #ff4d4f)' : lengthNote.tone === 'warn' ? 'var(--accent)' : 'var(--text-sub)',
            }}
          >
            {lengthNote.text}
          </div>
        )}

        <div className={styles.row}>
          <label className={styles.rowLabel} title="Chọn cảnh bạn muốn dùng để làm ảnh bìa video">
            Cảnh ảnh bìa
          </label>
          <select 
            className={styles.select} 
            value={selectedSceneIndex} 
            onChange={e => {
              const idx = Number(e.target.value);
              setSelectedSceneIndex(idx);
              let startSec = 0;
              for (let i = 0; i < idx && i < scenes.length; i++) {
                startSec += (scenes[i].durationSec || scenes[i].duration || 3);
              }
              const targetFrame = Math.round(startSec * 30) + 15;
              playerRef.current?.seekTo(targetFrame);
            }} 
            disabled={isRendering || isCapturingThumb}
          >
            {scenes.map((scene, idx) => {
              const textElement = scene.elements?.find((el: any) => el.type === 'text' && el.text);
              const labelPreview = textElement?.text ? ` - "${textElement.text.slice(0, 22)}"` : '';
              return (
                <option key={scene.id || idx} value={idx}>
                  Cảnh {idx + 1} ({scene.durationSec || scene.duration || 3}s){labelPreview}
                </option>
              );
            })}
          </select>
        </div>

        {/* Progress & Status (Studio NLE Standard) */}
        {isRendering && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <div className={styles.statusText}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                {getStageText()}
              </span>
              <span style={{ fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace', fontSize: 13 }}>
                {progressPct}%
              </span>
            </div>

            <div className={styles.progWrap}>
              <div className={styles.progBar} style={{ width: `${progressPct}%` }}/>
            </div>

            {/* Live Metrics Row: Elapsed • ETA • Render FPS */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: 'var(--text-sub)',
              fontFamily: 'monospace',
              padding: '2px 0'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTimer(elapsedSec)}
              </span>

              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {activeRenderJob?.etaSec !== undefined && activeRenderJob?.etaSec !== null ? (
                  activeRenderJob.etaSec <= 0 ? 'Sắp xong...' : `Còn ~${formatTimer(activeRenderJob.etaSec)}`
                ) : elapsedSec >= 2 && progressPct > 5 ? (
                  `Còn ~${formatTimer(Math.max(1, Math.round((elapsedSec / (progressPct / 100)) - elapsedSec)))}`
                ) : (
                  'Đang tính toán...'
                )}
              </span>

              <span>
                {activeRenderJob?.renderFps ? `${activeRenderJob.renderFps} FPS` : 'Đo tốc độ...'}
              </span>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className={styles.statusText} style={{ color: 'var(--accent)', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Xuất xong: {activeRenderJob?.renderTimeSec || elapsedSec}s {activeRenderJob?.renderFps ? `(${activeRenderJob.renderFps} FPS)` : ''}
            </span>
            <span style={{ fontWeight: 700 }}>
              {((activeRenderJob?.fileSize || 0) / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        )}

        {isCompleted ? (
          <>
            <div className={styles.actionsRow} style={{ flexWrap: 'wrap', gap: 8 }}>
              {canShare ? (
                <Button 
                  variant="primary" 
                  size="md"
                  loading={isPreparingShare} 
                  leftIcon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  }
                  onClick={handleNativeShare}
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  🚀 Đăng MXH
                </Button>
              ) : null}

              <Button 
                variant={canShare ? "secondary" : "primary"} 
                size="md" 
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
                onClick={() => handleDownload(activeRenderJob?.downloadUrl || '', activeRenderJob?.outputFilename)}
              >
                Tải Video MP4
              </Button>

              <Button
                variant="secondary"
                size="md"
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                onClick={() => setActiveRenderJob(null)}
                title="Đổi độ phân giải hoặc xuất thêm phiên bản khác"
              >
                Xuất bản mới
              </Button>

              <Button
                variant="secondary"
                size="md"
                loading={isCapturingThumb}
                onClick={handleCaptureThumbnail}
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                }
                title="Tải ảnh bìa 1080x1920 siêu nét"
              >
                Tải Ảnh Bìa
              </Button>
              
              <Button 
                variant="secondary" 
                size="md" 
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                }
                onClick={() => setCaptionModalOpen(true)}
                style={{ 
                  background: 'var(--accent-dim)', 
                  borderColor: 'var(--accent-border)',
                  color: 'var(--accent)'
                }}
              >
                Kịch bản đăng
              </Button>

              <Button 
                variant="ghost" 
                size="md" 
                onClick={() => setActiveRenderJob(null)}
              >
                Đóng
              </Button>
            </div>
            
            <SocialCaptionModal 
              isOpen={captionModalOpen}
              onClose={() => setCaptionModalOpen(false)}
              scenes={scenes} 
              brandingSettings={brandingSettings} 
              initialCaptions={useEditorStore.getState().socialCaptions}
              onSaveCaptions={(captions: any) => useEditorStore.getState().setSocialCaptions(captions)} 
            />
          </>
        ) : isRendering ? (
          <div className={styles.actionsRow} style={{ gap: 8, width: '100%' }}>
            <Button
              variant="primary"
              size="md"
              loading
              disabled
              style={{ flex: 1 }}
            >
              Đang xuất ({progressPct}%)...
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={cancelExport}
            >
              Hủy
            </Button>
          </div>
        ) : !renderCheck.allowed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <div
              style={{
                background: 'rgba(255, 77, 79, 0.12)',
                border: '1px solid rgba(255, 77, 79, 0.35)',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#ff7875',
                fontSize: 11.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{renderCheck.reason || 'Bạn đã dùng hết hạn ngạch xuất video tháng này.'}</span>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
              onClick={() => setPricingModalOpen(true)}
            >
              Nâng cấp hoặc mua thêm video
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <Button 
              variant="primary" 
              size="md" 
              style={{ flex: 1 }}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 13 13"><path d="M1 9V11H12V9M6.5 1V8M6.5 8L4 5.5M6.5 8L9 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              }
              onClick={startExport} 
              disabled={scenes.length === 0 || isTooLong}
            >
              Xuất Video MP4 ({quality})
            </Button>
            <Button
              variant="secondary"
              size="md"
              loading={isCapturingThumb}
              onClick={handleCaptureThumbnail}
              disabled={scenes.length === 0}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              }
              title="Chụp ảnh bìa 1080×1920 Full HD trong ~0.4s"
            >
              Xuất Ảnh Bìa
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
