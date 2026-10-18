import { DocumentEvidencePresetItem } from './types'

export const STICKY_NOTE_PRESETS: DocumentEvidencePresetItem[] = [
  {
    id: 'note-yellow-tape',
    variant: 'note',
    category: 'note',
    label: 'Note Băng Keo',
    previewBadge: 'BĂNG KEO',
    data: {
      variant: 'note',
      subVariant: 'tape-note',
      title: 'LƯU Ý CỰC KỲ QUAN TRỌNG!',
      subtitle: 'Ghi chú số 1',
      content: 'Phải ghi nhớ nguyên tắc này trước khi bắt đầu bất kỳ kế hoạch nào!',
      highlight: 'QUAN TRỌNG',
      accentColor: '#FFE600',
      badge: 'REMINDER',
    },
    animPreset: 'slide-up',
  },
  {
    id: 'note-paper-clip',
    variant: 'note',
    category: 'note',
    label: 'Note Kẹp Ghim',
    previewBadge: 'KẸP GHIM',
    data: {
      variant: 'note',
      subVariant: 'torn-paper',
      title: 'BÍ KÍP TOP 1%',
      subtitle: 'Trích từ sổ tay',
      content: 'Chỉ cần làm tốt 1 kỹ năng cốt lõi duy nhất: TẬP TRUNG CAO ĐỘ.',
      highlight: 'TẬP TRUNG CAO ĐỘ',
      accentColor: '#BEFF01',
      badge: 'KEY TAKEAWAY',
    },
    animPreset: 'zoom-in',
  },
]
