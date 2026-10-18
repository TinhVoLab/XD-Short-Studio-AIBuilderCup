export const HOOK_CONTENT_POOL = {
  'warning': [
    { badgeText: '🚨 CẢNH BÁO', heroTitle: 'ĐỪNG LÀM ĐIỀU NÀY', heroLine2: 'NẾU BẠN KHÔNG MUỐN MẤT TIỀN', subText: 'Sai lầm 99% người mới mắc phải' },
    { badgeText: '⚠️ NGUY HIỂM', heroTitle: 'DỪNG LẠI NGAY', heroLine2: 'BẠN ĐANG ĐỐT TIỀN VÔ ÍCH', subText: 'Sự thật đằng sau những lời quảng cáo' },
    { badgeText: '🛑 SAI LẦM', heroTitle: 'TẠI SAO BẠN THẤT BẠI', heroLine2: 'TRONG KHI NGƯỜI KHÁC THÀNH CÔNG?', subText: 'Bí mật mà họ không muốn bạn biết' },
  ],
  'tips': [
    { badgeText: '💡 BÍ QUYẾT', heroTitle: 'CÁCH LÀM VIDEO', heroLine2: 'TRIỆU VIEW TRONG 3 NGÀY', subText: 'Áp dụng ngay công thức này' },
    { badgeText: '🔥 MẸO HAY', heroTitle: 'THẾ NÀO LÀ', heroLine2: 'TỈNH THỨC SỰ?', subText: 'Vượt qua giới hạn bản thân' },
    { badgeText: '✨ HACK NÃO', heroTitle: 'TĂNG NĂNG SUẤT', heroLine2: 'GẤP 10 LẦN MỖI NGÀY', subText: 'Phương pháp Pomodoro kết hợp AI' },
  ],
  'secret': [
    { badgeText: '🤫 BÍ MẬT', heroTitle: 'SỰ THẬT ĐẰNG SAU', heroLine2: 'NHỮNG KÊNH TRIỆU SUB', subText: 'Chưa từng được tiết lộ' },
    { badgeText: '🕵️ THÂM CUNG', heroTitle: 'KHÔNG AI NÓI CHO BẠN', heroLine2: 'ĐIỀU NÀY KHI KHỞI NGHIỆP', subText: 'Bài học xương máu' },
  ],
  'default': [
    { badgeText: '🔥 HOT', heroTitle: 'BẠN CÓ BIẾT', heroLine2: 'SỰ THẬT NÀY CHƯA?', subText: 'Xem đến cuối để nhận quà' },
    { badgeText: '✨ XU HƯỚNG', heroTitle: 'ĐÂY LÀ LÝ DO', heroLine2: 'BẠN NÊN BẮT ĐẦU NGAY', subText: 'Cơ hội không đến lần 2' },
  ]
};

export function getRandomHookContent(archetype: string) {
  const pool = HOOK_CONTENT_POOL[archetype as keyof typeof HOOK_CONTENT_POOL] || HOOK_CONTENT_POOL['default'];
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
