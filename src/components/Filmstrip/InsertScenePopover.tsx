import React, { useState, useEffect, useRef } from 'react'
import styles from './InsertScenePopover.module.css'
import { Button } from '@/components/ui'
import { useEditorStore } from '@/store/useEditorStore'
import { aiAssistantService } from '@/services/aiAssistantService'
import { Scene } from '@/types/scene'
import { hydrateSceneFromSlots } from '@/services/ai/sceneSlotHydrator'
import { WIDGET_SLOT_REGISTRY } from '@/services/ai/widgetSlotRegistry'

export type VisualArchetype = 'general' | 'diagram' | 'chart' | 'bullets' | 'comparison' | 'stem'

interface SuggestionChip {
  id: string
  label: string
  prompt: string
  preferredElement?: string
  archetype: VisualArchetype
}

interface ArchetypeTabItem {
  id: VisualArchetype
  label: string
  icon: React.ReactNode
}

const ARCHETYPE_TABS: ArchetypeTabItem[] = [
  {
    id: 'general',
    label: 'Phổ Biến',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'diagram',
    label: 'Sơ Đồ',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    id: 'chart',
    label: 'Biểu Đồ',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: 'bullets',
    label: 'Danh Sách',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <polyline points="3 6 4 7 6 5" />
        <polyline points="3 12 4 13 6 11" />
        <polyline points="3 18 4 19 6 17" />
      </svg>
    ),
  },
  {
    id: 'comparison',
    label: 'So Sánh',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'stem',
    label: 'Khoa Học',
    icon: (
      <svg width="13" height="13" viewBox="0 0 17 17">
        <ellipse cx="8.5" cy="8.5" rx="7" ry="2.8" transform="rotate(-30 8.5 8.5)" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <ellipse cx="8.5" cy="8.5" rx="7" ry="2.8" transform="rotate(30 8.5 8.5)" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="8.5" cy="8.5" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
]

const ARCHETYPE_CHIPS: Record<VisualArchetype, SuggestionChip[]> = {
  general: [
    { id: 'hook', archetype: 'general', label: 'Hook Giật Gân', prompt: 'Tạo cảnh mở đầu giật gân, kinetic typography cuốn hút người xem trong 3s đầu', preferredElement: 'master-hook' },
    { id: 'secret', archetype: 'general', label: 'Tiết Lộ Sốc', prompt: 'Tạo cảnh tiết lộ bí mật hoặc sự thật bất ngờ ít ai biết' },
    { id: 'insight', archetype: 'general', label: 'Bài Học Đúc Kết', prompt: 'Tạo cảnh đúc kết bài học đắt giá hoặc nguyên lý vàng', preferredElement: 'quote-box' },
    { id: 'cta', archetype: 'general', label: 'CTA Kêu Gọi', prompt: 'Tạo cảnh kêu gọi hành động follow kênh và lưu video' },
  ],
  diagram: [
    { id: 'branching', archetype: 'diagram', label: 'Phân Nhánh 3 Hướng', prompt: 'Tạo sơ đồ phân nhánh 3 hướng phân tích kiến trúc hoặc quy trình', preferredElement: 'branching-flow' },
    { id: 'funnel', archetype: 'diagram', label: 'Phễu Lọc Chuyển Đổi', prompt: 'Tạo phễu lọc 3-4 giai đoạn chuyển đổi khách hàng hoặc phân tầng', preferredElement: 'funnel-flow' },
    { id: 'roadmap', archetype: 'diagram', label: 'Lộ Trình Từng Bước', prompt: 'Tạo lộ trình các chặng thực hiện từ mốc khởi đầu đến kết quả', preferredElement: 'roadmap-flow' },
    { id: 'dataflow', archetype: 'diagram', label: 'Luồng Dữ Liệu Cyber', prompt: 'Tạo sơ đồ luồng dữ liệu truyền giữa các trạm hệ thống công nghệ', preferredElement: 'data-flow' },
    { id: 'flowchart', archetype: 'diagram', label: 'Quy Trình Chuẩn 3 Bước', prompt: 'Tạo sơ đồ khối quy trình 3 bước hành động rõ ràng', preferredElement: 'flowchart' },
  ],
  chart: [
    { id: 'racing', archetype: 'chart', label: 'Đua Cột Tăng Trưởng', prompt: 'Tạo biểu đồ đua cột động thể hiện sự bứt phá và xếp hạng thị phần', preferredElement: 'racing-bar-chart' },
    { id: 'waterfall', archetype: 'chart', label: 'Bóc Tách Dòng Tiền', prompt: 'Tạo biểu đồ thác nước bóc tách doanh thu, chi phí và lợi nhuận ròng', preferredElement: 'waterfall-chart' },
    { id: 'radar', archetype: 'chart', label: 'Đánh Giá Kỹ Năng 5 Trục', prompt: 'Tạo biểu đồ mạng nhện đánh giá 5 khía cạnh năng lực toàn diện', preferredElement: 'radar-chart' },
    { id: 'barchart', archetype: 'chart', label: 'So Sánh Cột Số Liệu', prompt: 'Tạo biểu đồ cột so sánh hiệu suất số liệu các nhóm thực tế', preferredElement: 'chart-bar' },
    { id: 'circle', archetype: 'chart', label: 'Vòng Tròn Tỉ Lệ %', prompt: 'Tạo biểu đồ vòng tròn phần trăm phân bổ ngân sách hoặc nguồn lực', preferredElement: 'circle-chart' },
  ],
  bullets: [
    { id: 'bulletlist', archetype: 'bullets', label: 'Danh Sách 01-02-03', prompt: 'Tạo danh sách 3 điểm cốt lõi có đánh số thứ tự nổi bật', preferredElement: 'highlight-box' },
    { id: 'calloutcard', archetype: 'bullets', label: 'Hộp Kính Đúc Kết', prompt: 'Tạo thẻ kính callout làm nổi bật lời khuyên quan trọng nhất', preferredElement: 'highlight-box' },
    { id: 'checklist', archetype: 'bullets', label: 'Checklist 4 Điều Cần Làm', prompt: 'Tạo danh sách kiểm tra các việc cần làm kèm trạng thái tích chọn', preferredElement: 'checklist' },
    { id: 'numbered', archetype: 'bullets', label: 'Quy Tắc Vàng 1-2-3', prompt: 'Tạo các quy tắc bất di bất dịch cần tuân thủ', preferredElement: 'numbered-list' },
  ],
  comparison: [
    { id: 'vsbattle', archetype: 'comparison', label: 'So Sánh Đối Lập (VS)', prompt: 'Tạo màn hình so sánh đối đầu trực diện giữa Cách cũ và Cách mới', preferredElement: 'vs-battle' },
    { id: 'bankalert', archetype: 'comparison', label: 'Nổ Biến Động Số Dư', prompt: 'Tạo thông báo tài khoản ngân hàng nổ số dư tiền về uy tín', preferredElement: 'social-callout' },
    { id: 'koltweet', archetype: 'comparison', label: 'Trích Dẫn Tweet KOLs', prompt: 'Tạo trích dẫn nhận định từ chuyên gia hoặc người nổi tiếng uy tín', preferredElement: 'social-callout' },
    { id: 'classifieddoc', archetype: 'comparison', label: 'Hồ Sơ Đóng Dấu Tuyệt Mật', prompt: 'Tạo tài liệu mật có đóng dấu phê duyệt và tô chữ dạ quang bằng chứng', preferredElement: 'document-evidence' },
  ],
  stem: [
    { id: 'mathplot', archetype: 'stem', label: 'Đồ Thị Giải Tích (Mafs)', prompt: 'Tạo đồ thị hàm số động trực quan minh họa hiện tượng', preferredElement: 'math-plot' },
    { id: 'chemistry', archetype: 'stem', label: 'Cấu Trúc Phân Tử 2D', prompt: 'Tạo mô hình cấu trúc phân tử hóa học 2D sắc nét', preferredElement: 'chemical-molecule' },
    { id: 'question', archetype: 'stem', label: 'Câu Hỏi Tương Tác', prompt: 'Tạo cảnh đặt câu hỏi kích thích trí tò mò tương tác (Trắc nghiệm)', preferredElement: 'quiz-card' },
    { id: 'math', archetype: 'stem', label: 'Công Thức Toán Học', prompt: 'Tạo một biểu diễn đồ thị toán học hoặc công thức phức tạp', preferredElement: 'latex-formula' },
    { id: 'code', archetype: 'stem', label: 'Mô Phỏng Lập Trình', prompt: 'Tạo giao diện terminal viết code lập trình', preferredElement: 'code-terminal' },
    { id: 'orbit', archetype: 'stem', label: 'Hệ Quỹ Đạo Vũ Trụ', prompt: 'Tạo sơ đồ hệ mặt trời hoặc các hành tinh quay quanh quỹ đạo', preferredElement: 'orbit-system' },
    { id: 'physics', archetype: 'stem', label: 'Mô Phỏng Vật Lý', prompt: 'Tạo mô phỏng hiện tượng vật lý trực quan', preferredElement: 'physics-sim' },
  ],
}

interface InsertScenePopoverProps {
  insertIndex: number
  anchorRect: DOMRect
  prevScene?: Scene
  nextScene?: Scene
  onClose: () => void
}

function detectLiveIntent(text: string): { label: string; archetype: VisualArchetype } | null {
  const p = (text || '').toLowerCase().trim();
  if (!p) return null;
  const isExplicitChart = /bi[ểe]u [đd][ồo]/i.test(p);

  if (/(c[âa]u h[ỏo]i|[đd][ốo] vui|tr[ắa]c nghi[ệe]m|t[ươo]ng t[áa]c|[đd][áa]p [áa]n|quiz|h[ỏo]i [đd][áa]p|to[áa]n h[ọo]c|c[ôo]ng th[ứu]c|[đd][ồo] th[ịi]|h[àa]m s[ốo]|v[ậa]t l[ýy]|m[ôo] ph[ỏo]ng|h[ệe] m[ặa]t tr[ờo]i|qu[ỹy] [đd][ạa]o|v[ũu] tr[ụu]|thu[ậa]t to[áa]n|l[ậa]p tr[ìi]nh|code|terminal|h[óo]a h[ọo]c|ph[âa]n t[ửu])/i.test(p)) {
    return { label: 'Tự động: Khoa Học & Giáo Dục', archetype: 'stem' };
  }
  if (/(so s[áa]nh|[đd][ốo]i l[ậa]p|c[áa]ch c[ũu]|c[áa]ch m[ớo]i|\bvs\b|h[ơo]n l[àa]|kh[áa]c bi[ệe]t|b[ằa]ng ch[ứu]ng|ch[ứu]ng c[ứu]|tuy[ệe]t m[ậa]t|[đd][óo]ng d[ấa]u|tr[íi]ch d[ẫa]n|tweet|tin nh[ắa]n|s[ốo] d[ư]|bi[ếe]n [đd][ộo]ng|t[àa]i kho[ảa]n|chuy[ểe]n kho[ảa]n)/i.test(p) && !isExplicitChart) {
    return { label: 'Tự động: So Sánh & Bằng Chứng', archetype: 'comparison' };
  }
  if (/(s[ơo] [đd][ồo]|quy tr[ìi]nh|lu[ồo]ng|ph[âa]n nh[áa]nh|ph[ễe]u|l[ộo] tr[ìi]nh|c[áa]c b[ướu][ớo]c|ki[ếe]n tr[úu]c|h[ệe] th[ốo]ng|pipeline|chuy[ểe]n [đd][ổo]i|roadmap|timeline|b[ướu][ớo]c \d)/i.test(p) && !isExplicitChart) {
    return { label: 'Tự động: Sơ Đồ & Luồng', archetype: 'diagram' };
  }
  if (/(doanh thu|chi ph[ií]|l[ợo]i nhu[ậa]n|t[ỷy]|tri[ệe]u|\d+%|\d+k|\d+m|\d+x|t[ăa]ng tr[ưởu][ởo]ng|th[ịi] ph[ầa]n|kpi|b[óo]c t[áa]ch|d[òo]ng ti[ềe]n|n[ếe]n|ch[ứu]ng kho[áa]n|th[ốo]ng k[êe]|s[ốo] li[ệe]u|quy m[ôo]|ebitda)/i.test(p)) {
    return { label: 'Tự động: Biểu Đồ & Số Liệu', archetype: 'chart' };
  }
  if (/(danh s[áa]ch|l[ưo]u [ýy]|l[ờo]i khuy[êe]n|m[ẹe]o|tips|nguy[êe]n t[ắa]c|quy t[ắa]c|checklist|[đd]i[ềe]u c[ầa]n|b[àa]i h[ọo]c|[đd][úu]c k[ếe]t)/i.test(p)) {
    return { label: 'Tự động: Danh Sách & Lời Khuyên', archetype: 'bullets' };
  }
  return null;
}

/**
 * ============================================================
 * ⚡ TypeSafe Template Builder — NO HARDCODED COORDINATES
 * ============================================================
 * Thay thế hoàn toàn buildArchetypeFallbackScene() cũ.
 * Chọn widget phù hợp từ WIDGET_SLOT_REGISTRY và hydrate thông qua
 * sceneSlotHydrator (Safe-Zone Anchor Engine + H=f(X) Dynamic Box-Model).
 */
function buildTemplateScene(
  archetype: VisualArchetype,
  preferredElement?: string,
  userPrompt?: string
): Scene {
  // Xác định widgetType từ preferredElement hoặc ánh xạ mặc định theo archetype
  const ARCHETYPE_DEFAULT_WIDGET: Record<VisualArchetype, string> = {
    stem: 'math-plot',
    diagram: 'flowchart',
    chart: 'chart-bar',
    bullets: 'highlight-box',
    comparison: 'vs-battle',
    general: 'quote-box',
  };

  const widgetType = (preferredElement && WIDGET_SLOT_REGISTRY[preferredElement])
    ? preferredElement
    : ARCHETYPE_DEFAULT_WIDGET[archetype] || 'quote-box';

  const widgetDef = WIDGET_SLOT_REGISTRY[widgetType];

  // Trích xuất slots từ prompt (heuristics) nếu có, fallback về defaultSlots
  const slots = (userPrompt && widgetDef.extractHeuristics)
    ? widgetDef.extractHeuristics(userPrompt)
    : widgetDef.defaultSlots;

  return hydrateSceneFromSlots({
    envelope: {
      archetype: archetype as any,
      widgetType,
      title: widgetDef.description.slice(0, 24),
      slots,
      voiceoverText: (userPrompt || '').trim(),
    },
    duration: 3.5,
    canvasWidth: 360,
    canvasHeight: 640,
    accentColor: '#BEFF01',
    theme: 'dark',
  });
}




export default function InsertScenePopover({
  insertIndex,
  anchorRect,
  prevScene,
  nextScene,
  onClose,
}: InsertScenePopoverProps) {
  const { insertSceneAt, showToast } = useEditorStore()

  const [viewMode, setViewMode] = useState<'options' | 'ai-prompt'>('options')
  const [activeArchetype, setActiveArchetype] = useState<VisualArchetype>('general')
  const [prompt, setPrompt] = useState('')
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [preferredElement, setPreferredElement] = useState<string | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [errorDetails, setErrorDetails] = useState<{ message: string; actionHint?: string } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSec(0)
      return
    }
    const timer = setInterval(() => {
      setElapsedSec(prev => +(prev + 0.1).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [isGenerating])

  const liveIntent = activeArchetype === 'general' ? detectLiveIntent(prompt) : null;

  // Calculate Popover Position above or below anchor
  const popoverWidth = viewMode === 'options' ? 280 : 400
  const popoverHeight = viewMode === 'options' ? 84 : 420
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  // Horizontal center relative to anchor, clamped to screen margins
  let left = anchorRect.left + anchorRect.width / 2
  left = Math.max(popoverWidth / 2 + 16, Math.min(screenWidth - popoverWidth / 2 - 16, left))

  // Place above anchor if space allows, otherwise below
  let top = anchorRect.top - popoverHeight - 10
  if (top < 60) {
    top = anchorRect.bottom + 10
  }

  // Handle ESC key and Outside Click to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Handle Insert Blank Scene (Instant 1-Click)
  const handleInsertBlankScene = () => {
    insertSceneAt(insertIndex, {
      name: `Cảnh ${insertIndex + 1}`,
      description: 'Cảnh trống mới',
      duration: 2.5,
      bgColor: '#080808',
      elements: [],
    }, { rippleAudio: true })
    showToast(`Đã chèn cảnh trống tại vị trí ${insertIndex + 1}`)
    onClose()
  }

  // Handle Archetype Tab Switch
  const handleSelectArchetype = (archId: VisualArchetype) => {
    setActiveArchetype(archId)
    setSelectedChipId(null)
    setPreferredElement(undefined)
    setErrorDetails(null)
  }

  // Handle Chip Click
  const handleSelectChip = (chip: SuggestionChip) => {
    setSelectedChipId(chip.id)
    setPrompt(chip.prompt)
    setPreferredElement(chip.preferredElement)
  }

  // Handle Fallback Instant Template Insert (Zero-AI — TypeSafe Engine)
  const handleInsertTemplateFallback = () => {
    const templateScene = buildTemplateScene(activeArchetype, preferredElement, prompt)
    insertSceneAt(insertIndex, templateScene, { rippleAudio: true })
    showToast(`Đã chèn mẫu "${ARCHETYPE_TABS.find(t => t.id === activeArchetype)?.label}" tại vị trí ${insertIndex + 1}!`, 3500)
    onClose()
  }


  // Handle AI Generate & Insert (Unified via aiAssistantService)
  const handleGenerateAiScene = async () => {
    const effectivePrompt = prompt.trim() || 'Tạo 1 cảnh sinh động, trực quan phù hợp mạch video'
    setErrorDetails(null)
    setIsGenerating(true)

    try {
      showToast('AI đang phân tích ngữ cảnh & thiết kế cảnh mới...', 2500)

      const generatedScene = await aiAssistantService.generateTimelineScene({
        prompt: effectivePrompt,
        prevScene,
        nextScene,
        targetDuration: 3.5,
        targetArchetype: activeArchetype,
        preferredElement,
      })

      // Insert into store with Smart Ripple Shift
      insertSceneAt(insertIndex, generatedScene, { rippleAudio: true })
      showToast(`Đã tạo & chèn Cảnh AI thành công tại vị trí ${insertIndex + 1}!`, 3500)
      onClose()
    } catch (err: any) {
      console.error('[InsertScenePopover] AI generation failed:', err)
      const actionHint = err.actionHint ? ` (${err.actionHint})` : ''
      setErrorDetails({
        message: err.message || 'Lỗi khi gọi máy chủ AI',
        actionHint: err.actionHint || '',
      })
      showToast(`Lỗi tạo cảnh AI: ${err.message}${actionHint}`, 6000)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={popoverRef}
        className={`${styles.popover} ${viewMode === 'ai-prompt' ? styles.popoverExpanded : ''}`}
        style={{
          left: `${left}px`,
          top: `${top}px`,
        }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <span className={styles.titleIcon}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className={styles.title}>
              {viewMode === 'options' ? 'Chèn Cảnh' : 'Tạo Cảnh AI'}
            </span>
            <span className={styles.positionBadge}>#{insertIndex + 1}</span>
          </div>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            shape="circle"
            onClick={onClose}
            title="Đóng (ESC)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {viewMode === 'options' ? (
            /* Mode 1: Quick Choice (Ultra-compact button bar) */
            <div className={styles.quickChoices}>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={handleInsertBlankScene}
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="8" y1="10" x2="16" y2="10" />
                  </svg>
                }
              >
                Cảnh Trống
              </Button>

              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setViewMode('ai-prompt')}
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                }
              >
                Tạo Bằng AI
              </Button>
            </div>
          ) : (
            /* Mode 2: AI Prompt & Visual Archetype Tabs */
            <div className={styles.aiForm}>
              {/* Context preview if available */}
              {(prevScene || nextScene) && (
                <div className={styles.contextPreview}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prevScene ? `Sau: "${prevScene.voiceoverText || prevScene.name}"` : 'Đầu video'}
                    {nextScene ? ` ➔ Trước: "${nextScene.voiceoverText || nextScene.name}"` : ''}
                  </span>
                </div>
              )}

              {/* Visual Archetype Selector Tabs */}
              <div className={styles.archetypeTabs} role="tablist">
                {ARCHETYPE_TABS.map((tab) => {
                  const isActive = activeArchetype === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`${styles.archetypeTab} ${isActive ? styles.archetypeTabActive : ''}`}
                      onClick={() => handleSelectArchetype(tab.id)}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Textarea */}
              <div className={styles.inputGroup}>
                <div className={styles.inputLabel}>
                  <span>Ý tưởng cảnh mong muốn:</span>
                  {liveIntent ? (
                    <span className={styles.liveIntentBadge}>
                      <span className={styles.liveIntentDot} />
                      {liveIntent.label}
                    </span>
                  ) : (
                    <span className={styles.inputSub}>Chọn gợi ý dưới hoặc tự gõ</span>
                  )}
                </div>
                <textarea
                  className={styles.customTextarea}
                  placeholder="VD: Dẫn chứng số liệu tăng trưởng 200%, So sánh cách cũ và cách mới..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value)
                    setSelectedChipId(null)
                    setErrorDetails(null)
                  }}
                  autoFocus
                />
              </div>

              {/* Archetype Chips */}
              <div className={styles.chipSection}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className={styles.groupLabel}>
                    Gợi ý: {ARCHETYPE_TABS.find(t => t.id === activeArchetype)?.label}
                  </div>
                  <div className={styles.chipGrid}>
                    {ARCHETYPE_CHIPS[activeArchetype].map((chip) => {
                      const isSelected = selectedChipId === chip.id
                      return (
                        <Button
                          key={chip.id}
                          variant="pill"
                          size="xs"
                          selected={isSelected}
                          onClick={() => handleSelectChip(chip)}
                        >
                          {chip.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Error Banner with Direct Fallback Action */}
              {errorDetails && (
                <div className={styles.errorBanner}>
                  <div className={styles.errorText}>
                    <span>{errorDetails.message}</span>
                    {errorDetails.actionHint && (
                      <span className={styles.actionHint}>{errorDetails.actionHint}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={handleInsertTemplateFallback}
                      leftIcon={
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M9 3v18" />
                        </svg>
                      }
                    >
                      Dùng mẫu chuẩn ngay
                    </Button>
                  </div>
                </div>
              )}

              {/* Template Indicator Pill — mẫu mặc định của tab hiện tại */}
              {(() => {
                const ARCHETYPE_DEFAULT_WIDGET: Record<VisualArchetype, string> = {
                  stem: 'math-plot', diagram: 'flowchart', chart: 'chart-bar',
                  bullets: 'highlight-box', comparison: 'vs-battle', general: 'quote-box',
                }
                const widgetType = (preferredElement && WIDGET_SLOT_REGISTRY[preferredElement])
                  ? preferredElement
                  : ARCHETYPE_DEFAULT_WIDGET[activeArchetype]
                const widgetDef = WIDGET_SLOT_REGISTRY[widgetType]
                return widgetDef ? (
                  <div className={styles.templateIndicator}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
                    </svg>
                    <span>Mẫu chuẩn:</span>
                    <span className={styles.templateIndicatorName}>{widgetDef.description.slice(0, 28)}</span>
                  </div>
                ) : null
              })()}

              {/* Footer Actions — grid 1:1:2 để cân bằng trọng lượng thị giác */}
              <div className={styles.footerActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewMode('options')}
                  disabled={isGenerating}
                >
                  Quay lại
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInsertTemplateFallback}
                  title="Chèn ngay cảnh mẫu tức thì, không gọi AI"
                >
                  Dùng mẫu
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isGenerating}
                  onClick={handleGenerateAiScene}
                  leftIcon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  }
                >
                  {isGenerating ? `Đang tạo (${elapsedSec}s)` : 'Tạo bằng AI'}
                </Button>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  )
}
