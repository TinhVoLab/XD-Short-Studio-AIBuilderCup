import { useState } from 'react'
import styles from './AiCard.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '@/store/useSettingsStore'
import { aiAssistantService } from '@/services/aiAssistantService'
import { Button } from '@/components/ui'

const AI_ACTIONS = [
  { id: 'hook', icon:<svg width="11" height="11" viewBox="0 0 11 11"><path d="M5.5 1L6.8 4L10 5L7.5 7.2L8.2 10.5L5.5 9L2.8 10.5L3.5 7.2L1 5L4.2 4Z" stroke="currentColor" fill="none" strokeWidth="1"/></svg>, label:'Tạo Hook 3s đầu' },
  { id: 'caption', icon:<svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 2.5H9M2 5.5H7M2 8.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, label:'Tự động tạo caption' },
  { id: 'zoom', icon:<svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 8L5.5 2.5L9 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label:'Auto Zoom & Pan' },
  { id: 'emoji', icon:<svg width="11" height="11" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>, label:'Thêm emoji & sticker' },
  { id: 'viral', icon:<svg width="11" height="11" viewBox="0 0 11 11"><path d="M5.5 1L6.8 4L10 5L7.5 7.2L8.2 10.5L5.5 9L2.8 10.5L3.5 7.2L1 5L4.2 4Z" fill="#BEFF01"/></svg>, label:'Hiệu ứng viral', accent:true },
]

export default function AiCard() {
  const {  aiCardVisible, setAiCardVisible, showToast  } = useEditorStore(
    useShallow(s => ({
      aiCardVisible: s.aiCardVisible,
      setAiCardVisible: s.setAiCardVisible,
      showToast: s.showToast
    }))
  )
  const { geminiApiKey } = useSettingsStore()
  const [isProcessing, setIsProcessing] = useState(false)

  if (!aiCardVisible) return null

  const handleAction = async (actionId: string, label: string) => {
    if (isProcessing) return;
    
    // Check API Key for AI features
    if (['hook', 'emoji'].includes(actionId) && !geminiApiKey) {
      showToast('Vui lòng cấu hình Gemini API Key trong phần Cài đặt trước!');
      return;
    }

    setIsProcessing(true);
    showToast(`Đang xử lý: ${label}...`);

    try {
      switch (actionId) {
        case 'hook':
          await aiAssistantService.generateHookScene(geminiApiKey);
          break;
        case 'caption':
          aiAssistantService.autoCaption();
          break;
        case 'zoom':
          aiAssistantService.applyAutoZoomPan();
          break;
        case 'emoji':
          await aiAssistantService.autoAddEmojis(geminiApiKey);
          break;
        case 'viral':
          aiAssistantService.applyViralEffects();
          break;
      }
    } catch (err: any) {
      console.error(err);
      showToast('Có lỗi xảy ra: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.hdr}>
        <div className={styles.title}>
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M6.5 1L8 4.5L12 5.5L9 8L10 12L6.5 10.2L3 12L4 8L1 5.5L5 4.5Z" fill="#BEFF01"/></svg>
          AI Assistant
        </div>
        <Button
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={() => setAiCardVisible(false)}
          disabled={isProcessing}
          title="Đóng"
        >
          ✕
        </Button>
      </div>
      <p className={styles.sub}>
        {isProcessing ? 'AI đang phân tích và xử lý...' : 'Tôi có thể giúp bạn tạo video thú vị hơn!'}
      </p>
      <div className={styles.actions} style={{ opacity: isProcessing ? 0.6 : 1, pointerEvents: isProcessing ? 'none' : 'auto' }}>
        {AI_ACTIONS.map((a) => (
          <button
            key={a.id}
            className={`${styles.action} ${a.accent ? styles.accent : ''}`}
            onClick={() => handleAction(a.id, a.label)}
            disabled={isProcessing}
          >
            {a.icon}{a.label}
          </button>
        ))}
      </div>
      <Button
        variant="secondary"
        size="xs"
        fullWidth
        onClick={() => showToast('Đang tải thêm gợi ý AI...')}
        disabled={isProcessing}
        style={{ marginTop: 8 }}
      >
        Gợi ý khác
      </Button>
    </div>
  )
}
