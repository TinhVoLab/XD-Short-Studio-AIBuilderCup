import React from 'react';

/**
 * XD-Short Studio — Universal Icon System
 * Tuân thủ triết lý tối giản, stroke 1.8px-2.0px, thừa hưởng màu hoặc semantic color.
 * Hỗ trợ mapping từ tên icon, emoji phổ biến sang SVG vector sắc nét,
 * và fallback sang Unicode Emoji với font stack chuẩn Docker / Linux / Mac / Windows.
 */

export const EMOJI_FONT_STACK = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif";

/**
 * Danh mục Icon SVG chuẩn Studio
 */
export const getVectorIconSvg = (nameOrEmoji: string, color: string, size = 18): React.ReactElement | null => {
  const norm = (nameOrEmoji || '').toLowerCase().trim();

  switch (norm) {
    // 1. Tip / Bulb / Ý tưởng
    case 'tip':
    case 'bulb':
    case 'lightbulb':
    case 'idea':
    case '💡':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
        </svg>
      );

    // 2. Alert / Warning / Cảnh báo
    case 'alert':
    case 'warning':
    case 'caution':
    case 'danger':
    case '!':
    case '⚠️':
    case '🚨':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    // 3. Target / Mục tiêu
    case 'target':
    case 'goal':
    case '🎯':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
      );

    // 4. Pin / Location / Ghim vị trí
    case 'pin':
    case 'location':
    case 'map-pin':
    case 'marker':
    case '📌':
    case '📍':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );

    // 4b. Plant / Tree / Sinh học
    case 'plant':
    case 'tree':
    case 'leaf':
    case '🌱':
    case '🌿':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5" /><path d="M5 12a7 7 0 0 0 7-7" /><path d="M19 12a7 7 0 0 1-7-7" />
        </svg>
      );

    // 4c. DNA / Gene / Di truyền
    case 'dna':
    case 'gene':
    case 'genetics':
    case '🧬':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 15c6.667-6 13.333 0 20-6" /><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" /><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" /><path d="M17 6l-2.5-2.5" /><path d="M14 8l-1-1" /><path d="M7 18l2.5 2.5" /><path d="M3.5 14.5l.5.5" /><path d="M20 9.5l.5.5" />
        </svg>
      );

    // 4d. Scale / Balance / Cân bằng
    case 'scale':
    case 'balance':
    case '⚖️':
    case '⚖':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      );

    // 4e. Handshake / Tie / Bằng nhau
    case 'handshake':
    case 'tie':
    case 'equal':
    case '🤝':
    case '=':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="9" x2="19" y2="9" /><line x1="5" y1="15" x2="19" y2="15" />
        </svg>
      );

    // 5. Rocket / Khởi động / Bứt phá
    case 'rocket':
    case 'launch':
    case 'boost':
    case '🚀':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );

    // 6. Bell / CTA / Thông báo
    case 'cta':
    case 'bell':
    case 'notification':
    case 'alert-bell':
    case '🔔':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );

    // 7. Quote / Chat / Trích dẫn
    case 'quote':
    case 'chat':
    case 'message':
    case 'comment':
    case '💬':
    case '💭':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );

    // 8. Check / Thành công
    case 'check':
    case 'correct':
    case 'success':
    case 'done':
    case 'pass':
    case '✓':
    case '✔':
    case '✅':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );

    // 9. Cross / Sai / Lỗi / Hủy
    case 'cross':
    case 'cancel':
    case 'error':
    case 'fail':
    case 'close':
    case 'x':
    case '✕':
    case '✖':
    case '❌':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );

    // 10. Fire / Flame / Xu hướng nóng
    case 'fire':
    case 'flame':
    case 'hot':
    case 'trending-hot':
    case '🔥':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );

    // 11. Zap / Flash / Năng lượng / Tốc độ
    case 'zap':
    case 'flash':
    case 'lightning':
    case 'power':
    case 'speed':
    case '⚡':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    // 12. Star / Đánh giá
    case 'star':
    case 'fav':
    case 'favorite':
    case '★':
    case '⭐':
    case '🌟':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );

    // 13. Trophy / Thưởng / Huy chương
    case 'trophy':
    case 'medal':
    case 'winner':
    case 'cup':
    case 'top':
    case '🏆':
    case '🥇':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
        </svg>
      );

    // 14. Shield / Bảo mật / An toàn
    case 'shield':
    case 'security':
    case 'protect':
    case 'safe':
    case '🛡️':
    case '🛡':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );

    // 15. Chart / Biểu đồ / Xu hướng
    case 'chart':
    case 'trending':
    case 'analytics':
    case 'graph':
    case 'growth':
    case '📈':
    case '📊':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      );

    // 16. Globe / Toàn cầu / Web
    case 'globe':
    case 'world':
    case 'earth':
    case 'internet':
    case '🌐':
    case '🌍':
    case '🌎':
    case '🌏':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    // 17. Cart / Giỏ hàng / Mua sắm
    case 'cart':
    case 'shopping':
    case 'store':
    case 'ecommerce':
    case '🛒':
    case '🛍️':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );

    // 18. Eye / Lượt xem / Quan sát
    case 'eye':
    case 'view':
    case 'watch':
    case 'look':
    case '👁️':
    case '👁':
    case '👀':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
      );

    // 19. Heart / Thích / Yêu thích
    case 'heart':
    case 'love':
    case 'like':
    case '❤️':
    case '💖':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );

    // 20. Bot / Robot / AI
    case 'bot':
    case 'robot':
    case 'ai-bot':
    case 'assistant':
    case '🤖':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16.01" /><line x1="16" y1="16" x2="16.01" y2="16" />
        </svg>
      );

    // 21. Brain / Trí tuệ / Thinking
    case 'brain':
    case 'mind':
    case 'thinking':
    case 'intelligence':
    case '🧠':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z" />
        </svg>
      );

    // 22. User / Cá nhân
    case 'user':
    case 'profile':
    case 'person':
    case 'avatar':
    case '👤':
    case '👥':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      );

    // 23. Search / Tìm kiếm
    case 'search':
    case 'find':
    case 'explore':
    case '🔍':
    case '🔎':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );

    // 24. Lock / Khóa bảo mật
    case 'lock':
    case 'secure':
    case 'private':
    case 'key':
    case '🔒':
    case '🔐':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );

    // 25. Clock / Thời gian
    case 'clock':
    case 'time':
    case 'timer':
    case 'schedule':
    case 'duration':
    case '⏰':
    case '⏱️':
    case '⏱':
    case '🕒':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      );

    // 26. Code / Tech
    case 'code':
    case 'dev':
    case 'terminal':
    case 'developer':
    case '💻':
    case '🖥️':
    case '🖥':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      );

    // 27. File / Tài liệu
    case 'file':
    case 'doc':
    case 'document':
    case 'report':
    case 'paper':
    case '📄':
    case '📋':
    case '📁':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );

    // 29. Compass / Định hướng / Khởi đầu lộ trình
    case 'compass':
    case 'direction':
    case 'navigate':
    case 'navigation':
    case '🧭':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );

    // 30. Cloud / Đám mây / Hạ tầng
    case 'cloud':
    case 'server':
    case 'hosting':
    case 'infra':
    case '☁️':
    case '☁':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      );

    // 31. Award / Crown / Đỉnh cao / Chứng nhận
    case 'award':
    case 'badge':
    case 'certificate':
    case 'crown':
    case 'king':
    case 'premium':
    case '👑':
    case '🎖️':
    case '🏅':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      );

    // 28. Sparkle / Điểm sáng / Mặc định
    case 'sparkle':
    case 'sparkles':
    case 'magic':
    case 'glitter':
    case '✨':
    case '🪄':
    case '✦':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.912 5.885L20 10.8l-4.8 4.676L16.36 21 12 17.7 7.64 21l1.16-5.524L4 10.8l6.088-1.915L12 3z" />
        </svg>
      );

    default:
      return null;
  }
};

/**
 * Universal Icon Renderer:
 * Đảm bảo 100% không bị lỗi chữ tofu, không bị ô vuông rác, không bị mất icon khi render trên Docker / Cloud.
 */
export const renderUniversalIcon = (
  icon: React.ReactNode | string | undefined,
  color = '#BEFF01',
  size = 18,
  fallback?: React.ReactNode
): React.ReactNode => {
  if (!icon) {
    return fallback ?? null;
  }

  // Nếu đã là JSX Element (ví dụ <svg... />)
  if (React.isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === 'string') {
    const trimmed = icon.trim();
    if (!trimmed) return fallback ?? null;

    // 1. Thử match qua bảng Vector SVG tối giản chuẩn Studio
    const svgIcon = getVectorIconSvg(trimmed, color, size);
    if (svgIcon) {
      return svgIcon;
    }

    // 2. Nếu là raw SVG markup string (ví dụ "<svg...")
    if (trimmed.startsWith('<svg') && trimmed.endsWith('</svg>')) {
      return (
        <span 
          style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: trimmed }}
        />
      );
    }

    // 3. Tên icon chưa có trong bảng (vd. "rocket-launch"): không in chữ thô — dùng icon mặc định
    if (/^[a-z][a-z0-9_-]{2,}$/i.test(trimmed)) {
      return fallback ?? getVectorIconSvg('sparkle', color, size);
    }

    // 4. Fallback cho Unicode Emoji: bọc trong span với font stack Noto Color Emoji & Apple Color Emoji
    return (
      <span
        style={{
          fontSize: size,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: EMOJI_FONT_STACK,
          verticalAlign: 'middle',
        }}
      >
        {trimmed}
      </span>
    );
  }

  return <>{icon}</>;
};

/**
 * Re-export tương thích ngược cho HighlightBoxElement và các module cũ
 */
export const renderBoxIcon = (iconType: string | undefined, color: string, size = 18): React.ReactNode => {
  if (!iconType) {
    return getVectorIconSvg('sparkle', color, size);
  }
  return renderUniversalIcon(iconType, color, size);
};
