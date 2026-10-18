import { useEditorStore } from '@/store/useEditorStore'
import { useAiWizardStore } from '@/store/useAiWizardStore'

/**
 * Lối vào duy nhất để tạo video / dự án mới (TopBar, cửa sổ Dự án, ⌘N): mở modal Tạo video ở bước Ý tưởng.
 * Bản nháp đang dở vẫn giữ, bước 1 hiện nút "Tiếp tục biên tập".
 */
export function openCreateVideo() {
  if (!useAiWizardStore.getState().isGenerating) useAiWizardStore.getState().setStep(0)
  useEditorStore.getState().setAiWizardOpen(true)
}
