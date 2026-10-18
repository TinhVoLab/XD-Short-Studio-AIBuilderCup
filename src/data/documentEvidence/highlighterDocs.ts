import { DocumentEvidencePresetItem } from './types'

export const HIGHLIGHTER_DOC_PRESETS: DocumentEvidencePresetItem[] = [
  {
    id: 'doc-yellow-highlighter',
    variant: 'highlighter',
    category: 'highlighter',
    label: 'Dạ Quang Vàng',
    previewBadge: 'VÀNG',
    data: {
      variant: 'highlighter',
      title: 'BÁO CÁO MẬT QUÝ 3',
      subtitle: 'Hồ sơ kiểm toán độc lập • Trang 04',
      content: 'Dòng tiền thuần từ hoạt động kinh doanh đã tăng trưởng đột biến 300% chỉ trong vòng 90 ngày vừa qua.',
      highlight: 'tăng trưởng đột biến 300%',
      accentColor: '#FFE600',
      badge: 'TRÍCH XUẤT HỒ SƠ',
    },
    animPreset: 'zoom-in',
  },
  {
    id: 'doc-green-highlighter',
    variant: 'highlighter',
    category: 'highlighter',
    label: 'Dạ Quang Xanh',
    previewBadge: 'XANH',
    data: {
      variant: 'highlighter',
      title: 'BẰNG CHỨNG HỢP ĐỒNG',
      subtitle: 'Điều khoản bảo mật số #12',
      content: 'Bên A cam kết hoàn trả 100% chi phí nếu không đạt kết quả như cam kết trong 30 ngày.',
      highlight: 'hoàn trả 100% chi phí',
      accentColor: '#00FFA3',
      badge: 'ĐIỀU KHOẢN VÀNG',
    },
    animPreset: 'slide-up',
  },
]
