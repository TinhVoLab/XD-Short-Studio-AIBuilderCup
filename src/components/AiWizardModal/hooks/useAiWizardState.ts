import { useEffect, useRef } from 'react'
import { API_BASE, apiFetch } from '@/config/api'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { useTemplateStore } from '@/store/useTemplateStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAiWizardStore } from '@/store/useAiWizardStore'
import { generateBatchVoiceovers, requestTts } from '@/utils/batchAudioGenerator'
import { COLOR_THEMES, VIDEO_STYLES, SFX_DURATIONS, SFX_ALIAS_MAP, DURATION_PRESETS, MASTER_FRAMEWORK_ID, resolveWizardPreset } from '../config/wizardCatalog'
import { smartSfxService } from '@/services/smartSfxService'
import { normalizeWizardScenes } from '@/services/wizardSceneNormalizer'
import { SPEECH_RATE_WPS } from '@/config/pacingConfig'
import { hydrateVideoFromSlots } from '@/services/ai/sceneSlotHydrator'
import { hydrateMasterPlan } from '@/services/ai/masterPlanHydrator'
import { MASTER_MIN_TARGET_SEC } from '@/config/videoPlan'
import { getRecentHookLayouts, recordHookLayouts } from '@/services/hookHistory'
import { maxRenderableVideoSec } from '@/config/planCatalog'
import { clientTimeoutMs, isReasonerModel } from '@/config/aiTimeouts'
import { normalizeScriptModel, isGeminiModel, geminiModelLabel } from '@/config/aiModels'
import { hasProjectContent, projectTitleFromIdea } from '@/utils/projectContent'

/**
 * Engine chạy trước; engine còn lại là dự phòng khi engine chính lỗi hoặc trả rỗng.
 * Giữ 'legacy' cho tới khi TypeSafe có thư viện layout + catalog mở rộng (plan Phase 3–5).
 */
const WIZARD_PRIMARY_ENGINE: 'legacy' | 'typesafe' = 'legacy'

let globalGenerationController: AbortController | null = null
let globalFakeProgressInterval: any = null

/** Chỉ thử lại khi request chưa chạm tới AI (mất mạng, gateway lỗi). Không thử lại 4xx/429 (hết lượt) hay 504 (AI quá giờ) */
const RETRYABLE_STATUS = new Set([502, 503])

async function fetchWithRetry(url: string, options: any, retries = 2, timeoutMs = 60000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController()
    globalGenerationController = controller
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    try {
      const res = await apiFetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeout)

      const rawText = await res.text()
      let parsedData: any = null
      try {
        parsedData = JSON.parse(rawText)
      } catch (e) {
        parsedData = null
      }

      if (!res.ok) {
        const errorMsg =
          (parsedData && (parsedData.error || parsedData.message)) ||
          `Máy chủ phản hồi lỗi (${res.status} ${res.statusText})`
        const err: any = new Error(errorMsg)
        err.status = res.status
        throw err
      }

      if (parsedData === null) {
        throw new Error('Máy chủ trả về dữ liệu rỗng hoặc không đúng định dạng JSON')
      }

      return parsedData
    } catch (err: any) {
      clearTimeout(timeout)
      console.error(`[API Error] Attempt ${i + 1}/${retries} failed:`, err)

      // Hết giờ: server vẫn có thể đang chạy — không gửi lại để tránh tạo trùng và trừ lượt hai lần
      if (timedOut) {
        const timeoutErr: any = new Error('AI phản hồi quá lâu. Bấm "Tạo kịch bản" để thử lại, hoặc chọn mô hình Flash để nhanh hơn.')
        timeoutErr.isTimeout = true
        throw timeoutErr
      }
      // Người dùng bấm dừng
      if (err.name === 'AbortError' || controller.signal.aborted) {
        err.isAborted = true
        throw err
      }

      const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError'
      if (isNetworkError) {
        err.message = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
      }
      const retryable = isNetworkError || RETRYABLE_STATUS.has(err.status)
      if (!retryable || i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    } finally {
      if (globalGenerationController === controller) {
        globalGenerationController = null
      }
    }
  }
}

export function useAiWizardState(open: boolean, onClose: () => void) {
  const {
    setScenes,
    showToast,
    addAudioClip,
    wizardInitialTemplateId,
    wizardInitialIdea,
    setAiWizardOpen,
  } = useEditorStore(
    useShallow(s => ({
      setScenes: s.setScenes,
      showToast: s.showToast,
      addAudioClip: s.addAudioClip,
      wizardInitialTemplateId: s.wizardInitialTemplateId,
      wizardInitialIdea: s.wizardInitialIdea,
      setAiWizardOpen: s.setAiWizardOpen,
    }))
  )

  // Độ dài video dài nhất người dùng xuất được (gói + gói mua thêm) — cùng luật với server
  const maxVideoSec = useEditorStore(s =>
    maxRenderableVideoSec(s.getPlanByTier(s.currentUser.planTier), s.currentUser.quota?.bonusVideos || 0)
  )

  const { templates } = useTemplateStore()
  const { geminiApiKey, deepseekApiKey, aiEngineMode, preferredScriptModel } = useSettingsStore()

  // ── Global AI Wizard Store ──
  const {
    step,
    setStep,
    idea,
    setIdea,
    sourceMaterial,
    setSourceMaterial,
    showSourceInput,
    setShowSourceInput,
    viralFramework,
    setViralFramework,
    targetDuration,
    setTargetDuration,
    style,
    setStyle,
    isSuggestingStyle,
    setIsSuggestingStyle,
    color,
    setColor,
    selectedTemplateId,
    setSelectedTemplateId,
    voice,
    setVoice,
    speechRate,
    setSpeechRate,
    captionsOn,
    setCaptionsOn,
    scriptModel,
    setScriptModel,
    deepseekReasoning,
    setDeepseekReasoning,
    generatedScenes,
    setGeneratedScenes,
    isGenerating: generating,
    setGenerating,
    genProgress,
    setGenProgress,
    genStatus,
    setGenStatus,
    isAudioGenerating: audioGenerating,
    setAudioGenerating,
    audioProgress,
    setAudioProgress,
    previewingVoice,
    setPreviewingVoice,
    resetDraft,
  } = useAiWizardStore()

  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const accentColor = COLOR_THEMES.find(c => c.id === color)?.accent || '#BEFF01'

  const totalWordsCount = generatedScenes.reduce((sum, s) => {
    const w = (s.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length
    return sum + w
  }, 0)

  const totalEstDurationSec = Math.round((totalWordsCount / SPEECH_RATE_WPS.vi) * 10) / 10
  const ideaWordsCount = idea.trim() ? idea.trim().split(/\s+/).filter(Boolean).length : 0
  const sourceWordsCount = sourceMaterial.trim() ? sourceMaterial.trim().split(/\s+/).filter(Boolean).length : 0

  useEffect(() => {
    if (open) {
      // Mở kèm khung (landing, mẫu dự án) → áp khung đó; bản nháp có khung đã xoá → khung mặc định.
      // Mẫu dự án không có khung riêng (id lạ) cũng rơi về khung mặc định.
      const requested = wizardInitialTemplateId || selectedTemplateId
      const preset = resolveWizardPreset(requested)
      if (wizardInitialTemplateId || preset.id !== selectedTemplateId) {
        setSelectedTemplateId(preset.id)
        setViralFramework(preset.frameworkId)
        setColor(preset.colorId)
        if (preset.frameworkId === MASTER_FRAMEWORK_ID && targetDuration < MASTER_MIN_TARGET_SEC) setTargetDuration(MASTER_MIN_TARGET_SEC)
      }
      if (wizardInitialIdea) {
        setIdea(wizardInitialIdea)
      }
      if (!scriptModel && preferredScriptModel) {
        setScriptModel(normalizeScriptModel(preferredScriptModel))
      }
      // Bản nháp cũ hoặc gói vừa đổi: đưa độ dài về mức dài nhất gói cho phép
      if (targetDuration > maxVideoSec) {
        const allowed = DURATION_PRESETS.filter(d => d.id <= maxVideoSec)
        if (allowed.length) setTargetDuration(allowed[allowed.length - 1].id)
      }
    } else {
      // Khi đóng modal: KHÔNG reset draft, chỉ tạm dừng audio thử nếu đang phát
      if (previewAudioRef.current) previewAudioRef.current.pause()
      setPreviewingVoice(null)
    }
  }, [open, wizardInitialTemplateId, wizardInitialIdea, preferredScriptModel, maxVideoSec])

  const handlePreviewVoice = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (previewingVoice === voiceId) {
      previewAudioRef.current?.pause()
      setPreviewingVoice(null)
      return
    }

    setPreviewingVoice(voiceId)
    showToast(`Đang tạo giọng đọc thử: ${voiceId}...`, 2000)

    try {
      const sampleText = voiceId.startsWith('en-')
        ? 'Hello! This is a sample viral voiceover generated with Edge TTS Neural.'
        : 'Sự thật là... 90% các bạn đã làm sai mẹo này! Hãy xem ngay để tối ưu video nhé!'

      const data = await requestTts(API_BASE, voiceId, {
        text: sampleText,
        apiKey: geminiApiKey.trim(),
        temporalRole: 'hook',
      }, { retries: 1, timeoutMs: 20000 })

      if (previewAudioRef.current) previewAudioRef.current.pause()
      const aud = new Audio(data.url)
      previewAudioRef.current = aud
      aud.play()
      aud.onended = () => setPreviewingVoice(null)
    } catch (err: any) {
      showToast('Lỗi nghe thử giọng: ' + (err.message || 'Lỗi kết nối'), 3500)
      setPreviewingVoice(null)
    }
  }

  const handleSuggestStyle = async () => {
    if (!idea.trim()) return
    setIsSuggestingStyle(true)
    try {
      let apiKey = geminiApiKey.trim()
      let dsKey = deepseekApiKey?.trim() || ''
      if (apiKey.startsWith('sk-') && !dsKey) {
        dsKey = apiKey
        apiKey = ''
      }
      const res = await fetch(`${API_BASE}/api/ai/suggest-style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: idea, apiKey, deepseekApiKey: dsKey }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.style) setStyle(data.style)
      }
    } catch (error) {
      console.error('Lỗi khi gợi ý style:', error)
    } finally {
      setIsSuggestingStyle(false)
    }
  }

  const handleCancelGeneration = () => {
    if (globalGenerationController) {
      globalGenerationController.abort()
      globalGenerationController = null
    }
    if (globalFakeProgressInterval) {
      clearInterval(globalFakeProgressInterval)
      globalFakeProgressInterval = null
    }
    setGenerating(false)
    setGenProgress(0)
    setGenStatus('')
    showToast('Đã dừng tiến trình AI', 2500)
  }

  const handleGenerate = async (opts?: { variation?: boolean }) => {
    // Phương án khác: seed mới để server bỏ qua cache và AI sinh biến thể khác
    const variationSeed = opts?.variation === true ? Math.random().toString(36).slice(2, 10) : undefined
    let key = (geminiApiKey || '').replace(/[\s\uFEFF\xA0]/g, '').trim()
    let dsKey = (deepseekApiKey || '').replace(/[\s\uFEFF\xA0]/g, '').trim()

    if (key.startsWith('sk-') && !dsKey) {
      dsKey = key
      key = ''
    }

    if (!key && !dsKey) {
      return showToast('Vui lòng cấu hình API Key (Gemini hoặc DeepSeek) tại mục Settings trước khi dùng AI!', 4000)
    }

    // Bản nháp cũ có thể còn model Gemini đã ngừng → quy về model hiện hành
    const effectiveModel = normalizeScriptModel(scriptModel || preferredScriptModel || 'deepseek-flash')
    const isGeminiChosen = isGeminiModel(effectiveModel)
    const isDeepSeekChosen = effectiveModel.startsWith('deepseek')

    if (isGeminiChosen && !key) {
      return showToast(`Vui lòng nhập Gemini API Key trong Cài đặt để sử dụng mô hình ${geminiModelLabel(effectiveModel)}!`, 4000)
    }
    if (isDeepSeekChosen && !dsKey) {
      return showToast('Vui lòng nhập DeepSeek API Key trong Cài đặt để sử dụng mô hình DeepSeek!', 4000)
    }

    if (!idea.trim()) return showToast('Vui lòng nhập ý tưởng video!', 2500)
    // Khung luôn lấy từ khung mẫu đang chọn: bản nháp cũ không chạy khung đã xoá
    const activePreset = resolveWizardPreset(selectedTemplateId)
    if (activePreset.frameworkId === MASTER_FRAMEWORK_ID && targetDuration < MASTER_MIN_TARGET_SEC) {
      return showToast(`Thư viện cảnh Master cần video từ ${MASTER_MIN_TARGET_SEC} giây. Hãy chọn độ dài 30 hoặc 60 giây.`, 4000)
    }
    if (targetDuration > maxVideoSec) {
      return showToast(`Gói hiện tại xuất video tối đa ${maxVideoSec} giây. Hãy chọn độ dài ngắn hơn hoặc nâng cấp gói.`, 4000)
    }

    setGenerating(true)
    setGenProgress(0)

    const isReasoner = isReasonerModel(effectiveModel)

    if (globalFakeProgressInterval) clearInterval(globalFakeProgressInterval)
    if (isReasoner) {
      setGenStatus('[R1 REASONING] Đang kích hoạt chuỗi suy luận logic & tâm lý học...')
      globalFakeProgressInterval = setInterval(() => {
        setGenProgress(p => {
          if (p < 20) { setGenStatus('[R1 REASONING] Đang phân tích phản biện các góc nhìn thông thường...'); return p + 1.2 }
          if (p < 50) { setGenStatus('[R1 REASONING] Đang tổng hợp luận điểm phản trực giác...'); return p + 0.8 }
          if (p < 75) { setGenStatus('[R1 REASONING] Đang xây dựng cấu trúc kịch bản nhiều tầng bậc...'); return p + 0.5 }
          if (p < 88) { setGenStatus('Đang thiết kế bố cục Motion Graphics 9:16...'); return p + 0.2 }
          return 88
        })
      }, 350)
    } else {
      setGenStatus('Đang phân tích ý tưởng theo công thức Viral...')
      globalFakeProgressInterval = setInterval(() => {
        setGenProgress(p => {
          if (p < 25) { setGenStatus('Đang tính toán ngân sách từ (Word-Budgeting)...'); return p + 3 }
          if (p < 55) { setGenStatus('Đang thiết kế kịch bản & phân vai Hook / Highlight / CTA...'); return p + 2 }
          if (p < 80) { setGenStatus('Đang sinh bố cục Motion Graphics & Safe-Zone 9:16...'); return p + 1 }
          if (p < 88) { setGenStatus('Đang gắn nhịp ngắt nghỉ âm học & SFX...'); return p + 0.3 }
          return 88
        })
      }, 200)
    }

    try {
      const selectedPkg = templates.find(t => t.id === selectedTemplateId)
      const selectedStyleConfig = VIDEO_STYLES.find(s => s.id === style)
      const { autoPoseRules, aiBannedWords, aiHumanizerEnabled } = useSettingsStore.getState()
      const currentDurationConfig = DURATION_PRESETS.find(d => d.id === targetDuration)
      const targetSceneCount = currentDurationConfig?.sceneEstimate || Math.max(3, Math.round(targetDuration / 3.4))
      const effectiveFramework = activePreset.frameworkId
      const payload = {
        prompt: idea,
        sourceMaterial: sourceMaterial.trim(),
        viralFramework: effectiveFramework,
        targetDurationSec: targetDuration,
        sceneCount: targetSceneCount,
        style,
        colorTheme: color,
        suggestedFont: selectedStyleConfig?.suggestedFont || 'Be Vietnam Pro',
        suggestedHookLayout: selectedStyleConfig?.suggestedHookLayout || 'auto',
        apiKey: key,
        deepseekApiKey: dsKey,
        aiEngineMode: aiEngineMode || 'hybrid',
        scriptModel: effectiveModel,
        customTemplates: selectedPkg,
        autoPoseRules,
        aiBannedWords,
        aiHumanizerEnabled,
        wizardSessionId: 'wiz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        variationSeed,
        recentHookLayouts: getRecentHookLayouts(useEditorStore.getState().activeProjectId),
      }

      // ── DUAL-ENGINE: TypeSafe slot engine (nhanh, 3 lớp/cảnh) & Legacy scene-design (catalog đầy đủ) ──
      const authorName = useEditorStore.getState().brandingSettings?.authorName || 'TinhVo Digital'

      const runTypeSafe = async (): Promise<any[] | null> => {
        setGenStatus('Đang tối ưu cấu trúc cảnh TypeSafe...')
        const typeSafeData = await fetchWithRetry(`${API_BASE}/api/ai/video-slot-decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: idea,
            sceneCount: targetSceneCount,
            targetDuration,
            style,
            viralFramework: effectiveFramework,
            sourceMaterial: payload.sourceMaterial,
            aiBannedWords,
            aiHumanizerEnabled,
            variationSeed,
            authorName,
            apiKey: key,
            deepseekApiKey: dsKey,
            aiEngineMode: aiEngineMode || 'hybrid',
            scriptModel: effectiveModel,
          }),
        }, 1, 20000)
        if (!typeSafeData?.success || !typeSafeData?.videoEnvelope) return null

        const selectedTheme = COLOR_THEMES.find(ct => ct.id === color)
        const hydratedScenes = hydrateVideoFromSlots(typeSafeData.videoEnvelope, {
          canvasWidth: 360,
          canvasHeight: 640,
          paletteId: color,
          theme: selectedTheme?.spaceMode === 'daylight-warm' ? 'light' : 'dark',
          accentColor: selectedTheme?.accent || accentColor,
          authorName,
        })
        return Array.isArray(hydratedScenes) && hydratedScenes.length > 0 ? hydratedScenes : null
      }

      const runLegacy = async (): Promise<any[] | null> => {
        setGenStatus('Đang tổng hợp các phân đoạn thị giác...')
        const data = await fetchWithRetry(`${API_BASE}/api/ai/scene-design`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, 2, clientTimeoutMs({ isReasoner }))
        if (!Array.isArray(data) || data.length === 0) return null
        if (data[0]?._deepseekReasoning) {
          setDeepseekReasoning(data[0]._deepseekReasoning)
        }
        return normalizeWizardScenes(data, { lang: 'vi' })
      }

      // Thư viện cảnh Master: bộ xếp cảnh theo vai (config/videoPlan) — AI chỉ điền slot & lời thoại
      const runMaster = async (): Promise<any[] | null> => {
        setGenStatus('Đang xếp cảnh theo thư viện Master...')
        const data = await fetchWithRetry(`${API_BASE}/api/ai/master-video-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: idea,
            targetDuration,
            style,
            aiBannedWords,
            aiHumanizerEnabled,
            variationSeed,
            apiKey: key,
            deepseekApiKey: dsKey,
            aiEngineMode: aiEngineMode || 'hybrid',
            scriptModel: effectiveModel,
          }),
        }, 1, clientTimeoutMs({ isReasoner }))
        if (!data?.success || !data?.plan) return null
        const scenes = hydrateMasterPlan(data.plan, { paletteId: color })
        return scenes.length > 0 ? scenes : null
      }

      const isMaster = effectiveFramework === MASTER_FRAMEWORK_ID
      const engines = isMaster
        ? [runMaster]
        : WIZARD_PRIMARY_ENGINE === 'typesafe' ? [runTypeSafe, runLegacy] : [runLegacy, runTypeSafe]
      let scenes: any[] | null = null
      let firstError: any = null
      for (const runEngine of engines) {
        try {
          scenes = await runEngine()
          if (scenes) break
        } catch (engineErr: any) {
          // Dừng tay, hết giờ, hoặc server từ chối yêu cầu (4xx: vượt gói, hết lượt, thiếu key) →
          // engine dự phòng cũng sẽ bị từ chối y hệt, không gọi thêm
          const isRejected = engineErr?.status >= 400 && engineErr?.status < 500
          if (engineErr?.isAborted || engineErr?.isTimeout || isRejected) throw engineErr
          firstError = firstError || engineErr
          console.warn('[AI Wizard] Engine lỗi, chuyển sang engine dự phòng:', engineErr?.message || engineErr)
        }
      }

      if (globalFakeProgressInterval) {
        clearInterval(globalFakeProgressInterval)
        globalFakeProgressInterval = null
      }

      if (!scenes) {
        throw firstError || new Error('Dữ liệu trả về không hợp lệ hoặc trống')
      }

      setGeneratedScenes(scenes)
      setGenProgress(100)
      setGenStatus('Đã tạo kịch bản & chuyển cảnh thành công!')
      setStep(1)
      setGenerating(false)

      // Nếu người dùng đang thu nhỏ modal ở ngoài Timeline, gửi thông báo
      if (!useEditorStore.getState().aiWizardOpen) {
        showToast('Kịch bản AI đã tạo xong! Bấm thanh tác vụ để mở lại.', 4500)
      }
    } catch (err: any) {
      if (globalFakeProgressInterval) {
        clearInterval(globalFakeProgressInterval)
        globalFakeProgressInterval = null
      }
      setGenerating(false)
      if (err.isAborted) {
        console.log('[AI Generation Cancelled/Aborted]')
        return
      }
      showToast('Lỗi tạo kịch bản: ' + (err.message || 'Không thể kết nối AI'), 6000)
    }
  }

  /** Dự án đang mở đã có nội dung → video này vào một dự án mới (tên theo ý tưởng), không ghi đè */
  const ensureTargetProject = async () => {
    const { scenes, createNewProject } = useEditorStore.getState()
    if (hasProjectContent(scenes)) await createNewProject(projectTitleFromIdea(idea))
  }

  /** "Canvas trống": dự án mới 1 cảnh trắng, tự thiết kế từ đầu */
  const handleCreateBlankProject = async () => {
    await useEditorStore.getState().createNewProject('Dự án mới')
    onClose()
  }

  const handleGenerateAudioAndApply = async () => {
    const scenesWithText = generatedScenes.filter(s => s.voiceoverText?.trim())
    if (!scenesWithText.length) return showToast('Chưa có lời đọc nào trong các cảnh!', 2000)

    const key = geminiApiKey.trim()
    setAudioGenerating(true)
    setAudioProgress(0)

    try {
      showToast('Đang tạo giọng đọc AI song song & khớp nhịp từng cảnh...', 3000)

      const result = await generateBatchVoiceovers(
        generatedScenes,
        voice,
        key,
        API_BASE,
        {
          concurrency: 5,
          // Tốc độ đọc chỉ áp cho giọng Edge (server bỏ qua với giọng Gemini)
          rate: speechRate,
          onProgress: (prog) => {
            const pct = Math.round((prog.completed / prog.total) * 100)
            setAudioProgress(pct)
          },
        }
      )

      const updatedScenes = generatedScenes.map(sc => {
        const update = result.sceneUpdates.find(u => u.id === sc.id)
        if (update) {
          return { ...sc, ...update.patch }
        }
        return sc
      })

      const finalScenes = normalizeWizardScenes(updatedScenes, { lang: 'vi', captions: captionsOn })
      await ensureTargetProject()

      const currentClips = useEditorStore.getState().audioClips
      currentClips.filter(c => c.trackId === 'A1' || c.trackId === 'A2').forEach(c => {
        useEditorStore.getState().removeAudioClip(c.id)
      })

      // Đồng bộ mốc startSec của Voiceover Track A1 chính xác 100% theo từng cảnh sau khi chuẩn hóa
      let cumulativeVoiceStartSec = 0
      finalScenes.forEach((scene: any) => {
        const clip = result.audioClips.find(c => c.sceneId === scene.id)
        if (clip) {
          const { id, ...clipData } = clip
          addAudioClip({
            ...clipData,
            startSec: cumulativeVoiceStartSec,
          })
        }
        cumulativeVoiceStartSec += (scene.duration || 3)
      })

      // Fallback: Thêm các clip audio không gắn sceneId nếu có
      result.audioClips.filter(c => !c.sceneId || !finalScenes.some(s => s.id === c.sceneId)).forEach(clip => {
        const { id, ...clipData } = clip
        addAudioClip(clipData)
      })

      // ── Layer 1: SFX từ AI kịch bản ──
      const aiSfxTimestamps: number[] = []
      let currentStartSec = 0
      finalScenes.forEach((scene: any) => {
        if (scene.soundEffects && Array.isArray(scene.soundEffects)) {
          scene.soundEffects.forEach((sfx: any) => {
            const rawType = (sfx.type || 'pop').toLowerCase()
            const sfxType = SFX_DURATIONS[rawType] ? rawType : (SFX_ALIAS_MAP[rawType] || 'pop')
            const duration = SFX_DURATIONS[sfxType] || 0.5
            const placeSec = Math.max(0, currentStartSec + (sfx.delaySec ?? (sfx as any).startTime ?? 0.05))
            addAudioClip({
              name: `SFX: ${sfxType} (${scene.name})`,
              url: `/sfx/${sfxType}.wav`,
              startSec: placeSec,
              duration,
              playDurationSec: duration,
              volume: sfx.volume || 0.75,
              trackId: 'A2',
            })
            aiSfxTimestamps.push(placeSec)
          })
        }
        currentStartSec += (scene.duration || 3)
      })

      // ── Layer 2: Smart SFX bổ sung ──
      const smartSfxClips = smartSfxService.generateClipsForScenes(finalScenes, {
        volume: 0.65,
        minDistanceSec: 0.4,
        includeSceneSfx: false,
      })
      smartSfxClips.forEach(clip => {
        const isTooClose = aiSfxTimestamps.some(t => Math.abs(t - clip.startSec) < 0.4)
        if (!isTooClose) {
          const { id, ...clipData } = clip
          addAudioClip(clipData)
        }
      })

      setScenes(finalScenes)
      recordHookLayouts(useEditorStore.getState().activeProjectId, finalScenes)
      setAudioProgress(100)

      // Đồng bộ màu Theme từ Wizard vào BrandKit Studio để toàn bộ layer sau này khớp màu
      const selectedTheme = COLOR_THEMES.find(ct => ct.id === color)
      if (selectedTheme?.accent) {
        useEditorStore.getState().updateBrandingSettings({ brandColor: selectedTheme.accent })
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--accent', selectedTheme.accent)
          document.documentElement.style.setProperty('--accent-dim', `${selectedTheme.accent}18`)
          document.documentElement.style.setProperty('--accent-glow', `${selectedTheme.accent}44`)
        }
      }

      showToast(
        result.failCount > 0
          ? `Đã đưa ${updatedScenes.length} cảnh vào Studio, ${result.failCount} cảnh chưa có giọng đọc (${result.firstError}). Tạo lại tại tab Âm thanh.`
          : `Video hoàn tất! ${updatedScenes.length} cảnh & giọng đọc đã khớp 100%.`,
        result.failCount > 0 ? 7000 : 4000
      )
      // Dọn dẹp nháp sau khi đã hoàn thành và áp dụng vào timeline
      resetDraft()
      onClose()
    } catch (err: any) {
      console.error('Audio Generation Error:', err)
      showToast('Lỗi tạo audio: ' + (err.message || 'Lỗi kết nối'), 5000)
    } finally {
      setAudioGenerating(false)
    }
  }

  const handleApplyOnlyScript = async () => {
    if (!generatedScenes.length) return
    await ensureTargetProject()

    // 1. Chuẩn hoá toàn diện kịch bản qua 5-pass deterministic normalizer
    const finalScenes = normalizeWizardScenes(generatedScenes, { lang: 'vi', captions: captionsOn })

    // 2. Dọn dẹp track audio cũ
    const currentClips = useEditorStore.getState().audioClips
    currentClips.filter(c => c.trackId === 'A1' || c.trackId === 'A2').forEach(c => {
      useEditorStore.getState().removeAudioClip(c.id)
    })

    // 3. Gắn SFX vào Track A2
    const aiSfxTimestamps: number[] = []
    let currentStartSec = 0
    finalScenes.forEach((scene: any) => {
      if (scene.soundEffects && Array.isArray(scene.soundEffects)) {
        scene.soundEffects.forEach((sfx: any) => {
          const rawType = (sfx.type || 'pop').toLowerCase()
          const sfxType = SFX_DURATIONS[rawType] ? rawType : (SFX_ALIAS_MAP[rawType] || 'pop')
          const duration = SFX_DURATIONS[sfxType] || 0.5
          const placeSec = Math.max(0, currentStartSec + (sfx.delaySec ?? (sfx as any).startTime ?? 0.05))
          addAudioClip({
            name: `SFX: ${sfxType} (${scene.name})`,
            url: `/sfx/${sfxType}.wav`,
            startSec: placeSec,
            duration,
            playDurationSec: duration,
            volume: sfx.volume || 0.75,
            trackId: 'A2',
          })
          aiSfxTimestamps.push(placeSec)
        })
      }
      currentStartSec += (scene.duration || 3)
    })

    const smartSfxClips = smartSfxService.generateClipsForScenes(finalScenes, {
      volume: 0.65,
      minDistanceSec: 0.4,
      includeSceneSfx: false,
    })
    smartSfxClips.forEach(clip => {
      const isTooClose = aiSfxTimestamps.some(t => Math.abs(t - clip.startSec) < 0.4)
      if (!isTooClose) {
        const { id, ...clipData } = clip
        addAudioClip(clipData)
      }
    })

    // 4. Áp dụng vào store & dọn nháp
    setScenes(finalScenes)
    recordHookLayouts(useEditorStore.getState().activeProjectId, finalScenes)

    // Đồng bộ màu Theme từ Wizard vào BrandKit Studio để toàn bộ layer sau này khớp màu
    const selectedTheme = COLOR_THEMES.find(ct => ct.id === color)
    if (selectedTheme?.accent) {
      useEditorStore.getState().updateBrandingSettings({ brandColor: selectedTheme.accent })
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--accent', selectedTheme.accent)
        document.documentElement.style.setProperty('--accent-dim', `${selectedTheme.accent}18`)
        document.documentElement.style.setProperty('--accent-glow', `${selectedTheme.accent}44`)
      }
    }

    showToast(`Đã đưa ${finalScenes.length} cảnh vào Studio. Bạn có thể tạo lồng tiếng tại tab Âm thanh.`, 4000)
    resetDraft()
    onClose()
  }

  return {
    geminiApiKey,
    step,
    setStep,
    idea,
    setIdea,
    sourceMaterial,
    setSourceMaterial,
    showSourceInput,
    setShowSourceInput,
    viralFramework,
    setViralFramework,
    targetDuration,
    setTargetDuration,
    maxVideoSec,
    style,
    setStyle,
    isSuggestingStyle,
    color,
    setColor,
    selectedTemplateId,
    setSelectedTemplateId,
    voice,
    setVoice,
    speechRate,
    setSpeechRate,
    captionsOn,
    setCaptionsOn,
    generating,
    genProgress,
    genStatus,
    generatedScenes,
    setGeneratedScenes,
    audioGenerating,
    audioProgress,
    previewingVoice,
    accentColor,
    totalWordsCount,
    totalEstDurationSec,
    ideaWordsCount,
    sourceWordsCount,
    deepseekApiKey,
    aiEngineMode,
    scriptModel,
    setScriptModel,
    deepseekReasoning,
    handlePreviewVoice,
    handleSuggestStyle,
    handleGenerate,
    handleRegenerateVariation: () => {
      setStep(0)
      handleGenerate({ variation: true })
    },
    handleCancelGeneration,
    handleGenerateAudioAndApply,
    handleApplyOnlyScript,
    handleCreateBlankProject,
    resetDraft,
  }
}
