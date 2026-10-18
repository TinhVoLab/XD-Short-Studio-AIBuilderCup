import { useState, useCallback, useRef } from 'react';
import { API_BASE, apiFetch } from '@/config/api';
import { loadProjectFromDb } from '@/utils/projectStorage';
import { ProjectMetadata } from '@/types/project';
import { useEditorStore } from '@/store/useEditorStore';
import { playNotificationSound, downloadFileDirectly } from '@/utils/downloadHelper';
import { generateSeoVideoFilename, slugifyVietnamese } from '@/utils/seoFilename';
import { watchRenderJob, TERMINAL_RENDER_STATUSES } from '@/services/renderJobWatcher'

export interface BatchRenderJob {
  projectId: string;
  title: string;
  status: 'pending' | 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  serverJobId?: string;
  outputFilename?: string;
}

export function useBatchRenderQueue() {
  const activeWatchersRef = useRef<Map<number, () => void>>(new Map());
  const activeServerJobIdsRef = useRef<Set<string>>(new Set());
  const isCancelledRef = useRef<boolean>(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [etaText, setEtaText] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const { 
    showToast, 
    setActiveRenderJob, 
    updateActiveRenderJob,
    batchRenderJobs: jobs,
    isBatchProcessing: isProcessing,
    setBatchRenderJobs,
    updateBatchRenderJob,
    setIsBatchProcessing,
    brandingSettings
  } = useEditorStore();

  const startBatchRender = useCallback(async (
    projectsToRender: ProjectMetadata[],
    options?: { quality?: '1080p' | '720p' | '360p'; fps?: number }
  ) => {
    if (projectsToRender.length === 0) return;

    const user = useEditorStore.getState().firebaseUser;
    if (!user) {
      showToast('Vui lòng đăng nhập tài khoản để xuất video hàng loạt.', 3500);
      useEditorStore.getState().setAuthModalOpen(true);
      return;
    }

    const initialJobs: BatchRenderJob[] = projectsToRender.map(p => ({
      projectId: p.id,
      title: p.title,
      status: 'pending' as const,
      progress: 0
    }));

    setBatchRenderJobs(initialJobs);
    setIsBatchProcessing(true);
    setOverallProgress(0);
    setEtaText('Đang ước tính...');
    isCancelledRef.current = false;
    activeWatchersRef.current.clear();
    activeServerJobIdsRef.current.clear();

    const targetFps = options?.fps || 30;
    const scale = options?.quality === '1080p' ? 3 : options?.quality === '720p' ? 2 : 1;
    const totalJobs = initialJobs.length;
    const batchStartTime = Date.now();

    // Map to track live 0..100 progress for each job
    const jobProgressMap = new Map<number, number>();
    for (let i = 0; i < totalJobs; i++) {
      jobProgressMap.set(i, 0);
    }

    showToast(`Bắt đầu xuất song song (${totalJobs} video)...`, 3000);

    const updateGlobalEta = () => {
      let sumPct = 0;
      jobProgressMap.forEach(val => { sumPct += val; });
      const currentGlobalProgress = Math.min(99, Math.round(sumPct / totalJobs));
      setOverallProgress(currentGlobalProgress);

      if (currentGlobalProgress >= 5) {
        const elapsedSec = (Date.now() - batchStartTime) / 1000;
        const totalEstimateSec = elapsedSec / (currentGlobalProgress / 100);
        const remainingSec = Math.max(0, Math.round(totalEstimateSec - elapsedSec));

        if (remainingSec < 60) {
          setEtaText(`~${remainingSec}s`);
        } else {
          const m = Math.floor(remainingSec / 60);
          const s = remainingSec % 60;
          setEtaText(`~${m}m ${s < 10 ? '0' : ''}${s}s`);
        }
      }
    };

    // Process a single job in the queue
    const processSingleJob = async (jobIdx: number) => {
      if (isCancelledRef.current) return;
      const job = initialJobs[jobIdx];
      updateBatchRenderJob(jobIdx, { status: 'queued', progress: 0 });

      let attempts = 0;
      const maxAttempts = 2; // Auto-retry once on transient failure
      let jobSuccess = false;

      while (attempts < maxAttempts && !jobSuccess && !isCancelledRef.current) {
        attempts++;

        try {
          const projectData = await loadProjectFromDb(job.projectId);
          if (!projectData) {
            throw new Error('Không thể tải dữ liệu dự án');
          }

          const projectBranding = projectData.brandingSettings || brandingSettings;
          const currentYear = new Date().getFullYear();
          const author = projectBranding.authorName || 'TinhVo Digital';
          const copyright = (projectBranding.copyrightTemplate || '© {YEAR} {AUTHOR}. All rights reserved.')
            .replace('{YEAR}', String(currentYear))
            .replace('{AUTHOR}', author);

          // 1. Generate clean SEO Filename
          const seoFilename = slugifyVietnamese(projectData.title) || generateSeoVideoFilename(
            projectData.scenes || [],
            projectBranding.authorName,
            projectBranding.seoNamingPattern
          );

          // 2. Embed MP4 Super Metadata
          const metadata = projectBranding.autoEmbedSuperMetadata ? {
            title: projectData.scenes?.[0]?.name || projectData.title || seoFilename,
            artist: author,
            copyright,
            comment: `${projectBranding.authorHandle || ''} | ${projectBranding.websiteUrl || ''}`.trim(),
            genre: projectBranding.defaultGenre || 'Công nghệ & AI / Short-form Video',
            encoder: projectBranding.encoderTag || 'XD-Short Studio Pro v2.0',
            year: currentYear
          } : undefined;

          const durationInFrames = Math.ceil((projectData.scenes || []).reduce((acc: number, s: any) => acc + (s.duration || 3), 0) * targetFps);
          
          const payload = {
            scenes: projectData.scenes,
            bgMusicUrl: projectData.bgMusicUrl,
            bgMusicVolume: projectData.bgMusicVolume,
            audioClips: projectData.audioClips,
            voiceoverReverb: projectData.voiceoverReverb,
            filename: seoFilename,
            durationInFrames,
            scale,
            targetFps,
            metadata
          };

          const res = await apiFetch(`${API_BASE}/api/render/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Lỗi từ máy chủ khi bắt đầu render');
          }

          const data = await res.json();
          const serverJobId = data.jobId;

          activeServerJobIdsRef.current.add(serverJobId);
          updateBatchRenderJob(jobIdx, { serverJobId, outputFilename: `${seoFilename}.mp4` });

          // Sync with global activeRenderJob so FloatingRenderWidget reflects activity
          setActiveRenderJob({
            jobId: serverJobId,
            progress: 0.05,
            status: 'queued',
            outputFilename: `${seoFilename}.mp4`
          });

          // Chờ job xong — theo dõi qua Firestore (job có thể chạy trên Render Worker khác instance)
          await new Promise<void>((resolve, reject) => {
            const stop = watchRenderJob(serverJobId, (statusData) => {
              if (isCancelledRef.current) {
                stop();
                activeWatchersRef.current.delete(jobIdx);
                resolve();
                return;
              }
              const pct = Math.round((statusData.progress || 0) * 100);
              jobProgressMap.set(jobIdx, pct);

              updateBatchRenderJob(jobIdx, {
                status: statusData.status === 'bundling' || statusData.status === 'rendering' ? 'rendering' : statusData.status,
                progress: pct,
                downloadUrl: statusData.downloadUrl,
                outputFilename: statusData.outputFilename
              });

              updateGlobalEta();

              // Update global floating widget progress
              updateActiveRenderJob({
                progress: statusData.progress || 0,
                status: statusData.status,
                downloadUrl: statusData.downloadUrl,
                outputFilename: statusData.outputFilename,
                error: statusData.error,
                renderTimeSec: statusData.renderTimeSec,
                fileSize: statusData.fileSize
              });

              if (!TERMINAL_RENDER_STATUSES.has(statusData.status)) return;
              activeWatchersRef.current.delete(jobIdx);
              activeServerJobIdsRef.current.delete(serverJobId);
              if (statusData.status === 'completed') {
                jobProgressMap.set(jobIdx, 100);
                resolve();
              } else if (statusData.status === 'failed') {
                reject(new Error(statusData.error || 'Render failed on server'));
              } else {
                reject(new Error('Job cancelled'));
              }
            });
            activeWatchersRef.current.set(jobIdx, stop);
          });

          jobSuccess = true;

        } catch (err: any) {
          console.error(`Batch render attempt ${attempts} failed for project ${job.projectId}:`, err);
          if (attempts < maxAttempts && !isCancelledRef.current) {
            showToast(`Đang thử lại lần 2 cho "${job.title}"...`, 2500);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            jobProgressMap.set(jobIdx, 100);
            updateBatchRenderJob(jobIdx, { status: 'failed', error: err.message });
            showToast(`Bỏ qua lỗi: ${job.title} - Tiếp tục hàng đợi`, 3000);
          }
        } finally {
          activeWatchersRef.current.get(jobIdx)?.();
          activeWatchersRef.current.delete(jobIdx);
        }
      }
    };

    // ── Multi-job Concurrent Pipeline (Concurrency = 2) ──
    const BATCH_CONCURRENCY = 2;
    let nextJobQueueIndex = 0;

    const worker = async () => {
      while (nextJobQueueIndex < totalJobs && !isCancelledRef.current) {
        const jobIndex = nextJobQueueIndex++;
        await processSingleJob(jobIndex);
      }
    };

    const workerSlots = Math.min(BATCH_CONCURRENCY, totalJobs);
    await Promise.all(Array.from({ length: workerSlots }, () => worker()));

    if (!isCancelledRef.current) {
      setOverallProgress(100);
      setEtaText('Đã xong');
      setIsBatchProcessing(false);
      playNotificationSound();
      showToast('Hoàn tất xuất toàn bộ danh sách video!', 4000);
    }
  }, [showToast, setActiveRenderJob, updateActiveRenderJob, setBatchRenderJobs, updateBatchRenderJob, setIsBatchProcessing, brandingSettings]);

  const cancelBatch = useCallback(() => {
    isCancelledRef.current = true;
    
    // Ngừng theo dõi mọi job đang chạy
    activeWatchersRef.current.forEach(stop => stop());
    activeWatchersRef.current.clear();

    // Cancel all running jobs on server
    activeServerJobIdsRef.current.forEach(serverJobId => {
      apiFetch(`${API_BASE}/api/render/cancel/${serverJobId}`, { method: 'POST' }).catch(() => {});
    });
    activeServerJobIdsRef.current.clear();

    // Update remaining pending/queued jobs to failed/cancelled
    setBatchRenderJobs(jobs.map(j => (j.status === 'pending' || j.status === 'queued' || j.status === 'rendering') ? { ...j, status: 'failed', error: 'Đã hủy' } : j));
    setIsBatchProcessing(false);
    setEtaText('Đã hủy');
  }, [jobs, setBatchRenderJobs, setIsBatchProcessing]);

  const resetBatch = useCallback(() => {
    setBatchRenderJobs([]);
    setIsBatchProcessing(false);
    setOverallProgress(0);
    setEtaText('');
  }, [setBatchRenderJobs, setIsBatchProcessing]);

  // 1-Click ZIP Packaging & Download
  const downloadBatchZip = useCallback(async (customZipTitle?: string) => {
    const completedJobs = jobs.filter(j => j.status === 'completed' && (j.outputFilename || j.downloadUrl));
    if (completedJobs.length === 0) {
      showToast('Chưa có video nào hoàn thành để tải', 3000);
      return;
    }

    setIsZipping(true);
    showToast('Đang đóng gói file ZIP...', 2000);

    try {
      const filenames = completedJobs.map(j => {
        if (j.outputFilename) return j.outputFilename;
        const parts = (j.downloadUrl || '').split('/');
        return parts[parts.length - 1] || `${j.title}.mp4`;
      });

      const res = await fetch(`${API_BASE}/api/render/batch/zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filenames,
          zipTitle: customZipTitle || 'xd-short-batch-export'
        })
      });

      if (!res.ok) {
        throw new Error('Máy chủ không thể tạo file ZIP');
      }

      const data = await res.json();
      downloadFileDirectly(data.downloadUrl, data.filename);
      showToast(`Đã tải file ZIP (${data.fileCount} video)!`, 3500);
    } catch (err: any) {
      console.error('ZIP download error:', err);
      showToast('Lỗi đóng gói ZIP: ' + (err.message || 'Không thể tải'), 3500);
    } finally {
      setIsZipping(false);
    }
  }, [jobs, showToast]);

  return {
    jobs,
    isProcessing,
    overallProgress,
    etaText,
    isZipping,
    startBatchRender,
    cancelBatch,
    resetBatch,
    downloadBatchZip
  };
}
