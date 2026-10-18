import React from 'react'

interface ChartMiniPreviewProps {
  type: string;
  color: string;
}

export const ChartMiniPreview: React.FC<ChartMiniPreviewProps> = ({ type, color }) => {
  const accent = color || '#BEFF01'
  const gradId = `miniGrad-${type}-${accent.replace(/[^a-zA-Z0-9]/g, '')}`

  switch (type) {
    // ── 1. CIRCLE CHART (Vòng tròn tiến độ) ──
    case 'circle-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="15" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
          <circle
            cx="40"
            cy="22"
            r="15"
            stroke={accent}
            strokeWidth="3.5"
            strokeDasharray="94.2"
            strokeDashoffset="22"
            strokeLinecap="round"
            transform="rotate(-90 40 22)"
          />
          <text x="40" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif">
            85%
          </text>
        </svg>
      )

    // ── 2. GAUGE CHART (Kim đo tốc độ) ──
    case 'gauge-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <path d="M 22 35 A 20 20 0 0 1 58 35" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 22 35 A 20 20 0 0 1 52 19" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="40" cy="33" r="3" fill="#FFF" />
          <line x1="40" y1="33" x2="50" y2="21" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <text x="40" y="41" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6" fontWeight="700">MAX</text>
        </svg>
      )

    // ── 3. CHART BAR (Cột doanh số) ──
    case 'chart-bar':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect x="16" y="22" width="9" height="18" rx="2" fill="rgba(255,255,255,0.2)" />
          <rect x="29" y="8" width="9" height="32" rx="2" fill={`url(#${gradId})`} />
          <rect x="42" y="16" width="9" height="24" rx="2" fill="rgba(255,255,255,0.3)" />
          <rect x="55" y="12" width="9" height="28" rx="2" fill="#00D4FF" fillOpacity="0.8" />
        </svg>
      )

    // ── 4. LINE CHART (Đường tăng trưởng) ──
    case 'line-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 10 34 L 28 26 L 46 29 L 70 12 L 70 38 L 10 38 Z" fill={`url(#${gradId})`} />
          <path d="M 10 34 L 28 26 L 46 29 L 70 12" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="70" cy="12" r="2.5" fill="#FFF" stroke={accent} strokeWidth="1.5" />
        </svg>
      )

    // ── 5. PIE CHART (Tròn phân bổ) ──
    case 'pie-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="15" fill="#FF3366" />
          <path d="M 40 22 L 40 7 A 15 15 0 1 1 26 28 Z" fill={accent} />
          <circle cx="40" cy="22" r="6" fill="#121826" />
        </svg>
      )

    // ── 6. CANDLESTICK CHART (Nến Nhật Crypto) ──
    case 'candlestick-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Candle 1 (Green) */}
          <line x1="22" y1="10" x2="22" y2="34" stroke="#00FF88" strokeWidth="1.2" />
          <rect x="18" y="15" width="8" height="15" rx="1.5" fill="#00FF88" />

          {/* Candle 2 (Red) */}
          <line x1="40" y1="14" x2="40" y2="36" stroke="#FF3366" strokeWidth="1.2" />
          <rect x="36" y="18" width="8" height="12" rx="1.5" fill="#FF3366" />

          {/* Candle 3 (Green Master) */}
          <line x1="58" y1="8" x2="58" y2="36" stroke="#00FF88" strokeWidth="1.2" />
          <rect x="54" y="12" width="8" height="20" rx="1.5" fill="#00FF88" />
        </svg>
      )

    // ── 7. WATERFALL CHART (Thác dòng tiền) ──
    case 'waterfall-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <rect x="14" y="11" width="10" height="24" rx="1.5" fill="#00FF88" />
          <line x1="24" y1="11" x2="34" y2="11" stroke="rgba(255,255,255,0.3)" strokeDasharray="1.5 1.5" />
          <rect x="34" y="11" width="10" height="12" rx="1.5" fill="#FF3366" />
          <line x1="44" y1="23" x2="54" y2="23" stroke="rgba(255,255,255,0.3)" strokeDasharray="1.5 1.5" />
          <rect x="54" y="23" width="10" height="12" rx="1.5" fill={accent} />
        </svg>
      )

    // ── 8. SANKEY CHART (Sankey phân rã) ──
    case 'sankey-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <rect x="12" y="13" width="6" height="20" rx="1.5" fill="#00D4FF" />
          <path d="M 18 15 C 38 15, 42 11, 62 11 L 62 19 C 42 19, 38 23, 18 23 Z" fill="#FF3366" fillOpacity="0.5" />
          <rect x="62" y="9" width="6" height="10" rx="1.5" fill="#FF3366" />
          <path d="M 18 25 C 38 25, 42 29, 62 29 L 62 35 C 42 35, 38 33, 18 33 Z" fill={accent} fillOpacity="0.6" />
          <rect x="62" y="27" width="6" height="8" rx="1.5" fill={accent} />
        </svg>
      )

    // ── 9. HEATMAP MATRIX (Bản đồ nhiệt - Cân đối SVG) ──
    case 'heatmap-matrix':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Row 1 */}
          <rect x="11" y="9" width="12" height="10.5" rx="2" fill="#00FF88" fillOpacity="0.9" />
          <rect x="26" y="9" width="12" height="10.5" rx="2" fill="#00FF88" fillOpacity="0.5" />
          <rect x="41" y="9" width="12" height="10.5" rx="2" fill="#FF3366" fillOpacity="0.85" />
          <rect x="56" y="9" width="12" height="10.5" rx="2" fill="#00FF88" fillOpacity="0.95" />

          {/* Row 2 */}
          <rect x="11" y="23.5" width="12" height="10.5" rx="2" fill="#FFB800" fillOpacity="0.8" />
          <rect x="26" y="23.5" width="12" height="10.5" rx="2" fill="#00FF88" fillOpacity="0.35" />
          <rect x="41" y="23.5" width="12" height="10.5" rx="2" fill="#FF3366" fillOpacity="0.55" />
          <rect x="56" y="23.5" width="12" height="10.5" rx="2" fill="#00FF88" fillOpacity="0.85" />
        </svg>
      )

    // ── 10. RADAR CHART (Mạng nhện đa chiều) ──
    case 'radar-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <polygon points="40,9 55,17 55,31 40,37 25,31 25,17" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
          <polygon points="40,15 49,20 49,28 40,32 31,28 31,20" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
          <polygon points="40,11 53,18 48,30 40,34 27,25 28,19" stroke={accent} strokeWidth="1.8" fill={accent} fillOpacity="0.35" />
          <circle cx="40" cy="11" r="1.5" fill="#FFF" />
          <circle cx="53" cy="18" r="1.5" fill="#FFF" />
        </svg>
      )

    // ── 11. RACING BAR CHART (Đua cột thứ hạng - Cân đối SVG) ──
    case 'racing-bar-chart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
            </linearGradient>
          </defs>
          {/* Bar 1 */}
          <text x="12" y="15" fill="#FFD700" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">#1</text>
          <rect x="22" y="8.5" width="45" height="7" rx="3.5" fill={`url(#${gradId})`} />
          <circle cx="67" cy="12" r="1.8" fill="#FFF" />

          {/* Bar 2 */}
          <text x="12" y="26" fill="rgba(255,255,255,0.6)" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">#2</text>
          <rect x="22" y="19.5" width="34" height="6.5" rx="3.2" fill="#00D4FF" fillOpacity="0.75" />

          {/* Bar 3 */}
          <text x="12" y="37" fill="rgba(255,255,255,0.4)" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">#3</text>
          <rect x="22" y="30.5" width="22" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
        </svg>
      )

    // ── 12. TABLE (Bảng so sánh - Cân đối SVG) ──
    case 'table':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Outer Table Box */}
          <rect x="11" y="7" width="58" height="30" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          
          {/* Header */}
          <rect x="11" y="7" width="58" height="9" rx="3" fill={accent} fillOpacity="0.25" />
          <line x1="11" y1="16" x2="69" y2="16" stroke={accent} strokeOpacity="0.5" strokeWidth="0.8" />
          <line x1="40" y1="7" x2="40" y2="37" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          <rect x="15" y="10" width="14" height="3" rx="1.5" fill={accent} />
          <rect x="44" y="10" width="14" height="3" rx="1.5" fill={accent} />

          {/* Row 1 */}
          <line x1="11" y1="26.5" x2="69" y2="26.5" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
          <rect x="15" y="19.5" width="18" height="2.5" rx="1" fill="rgba(255,255,255,0.6)" />
          <rect x="44" y="19.5" width="18" height="2.5" rx="1" fill="rgba(255,255,255,0.6)" />

          {/* Row 2 */}
          <rect x="15" y="30.5" width="12" height="2.5" rx="1" fill="rgba(255,255,255,0.35)" />
          <rect x="44" y="30.5" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.35)" />
        </svg>
      )

    // ── 13. VS BATTLE (Hiệp đấu đối đầu - Đẹp mắt & Cân đối) ──
    case 'vs-battle':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Left Fighter (Red Card) */}
          <rect x="7" y="8" width="28" height="28" rx="4" fill="rgba(255, 51, 102, 0.15)" stroke="#FF3366" strokeWidth="1" />
          <circle cx="21" cy="17" r="4.5" fill="#FF3366" fillOpacity="0.25" stroke="#FF3366" strokeWidth="0.8" />
          <text x="21" y="20" textAnchor="middle" fill="#FF3366" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">✕</text>
          <rect x="12" y="27" width="18" height="3" rx="1.5" fill="#FF3366" fillOpacity="0.8" />

          {/* Right Fighter (Neon Accent Card) */}
          <rect x="45" y="8" width="28" height="28" rx="4" fill={`${accent}18`} stroke={accent} strokeWidth="1" />
          <circle cx="59" cy="17" r="4.5" fill={`${accent}33`} stroke={accent} strokeWidth="0.8" />
          <text x="59" y="20" textAnchor="middle" fill={accent} fontSize="6.5" fontWeight="900" fontFamily="sans-serif">⚡</text>
          <rect x="50" y="27" width="18" height="3" rx="1.5" fill={accent} />

          {/* Center Circular VS Emblem */}
          <circle cx="40" cy="22" r="7" fill="#121826" stroke="#FFD700" strokeWidth="1.2" />
          <text x="40" y="25" textAnchor="middle" fill="#FFD700" fontSize="7.5" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">VS</text>
        </svg>
      )

    // ── 14. CHECKLIST (Checklist tiêu chí - Cân đối SVG) ──
    case 'checklist':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Item 1 (Checked) */}
          <rect x="12" y="7.5" width="8" height="8" rx="2" fill="#00FF88" />
          <path d="M 14 11.5 L 16 13.5 L 18 9.5" stroke="#000" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="24" y="9.5" width="44" height="4" rx="2" fill="rgba(255,255,255,0.85)" />

          {/* Item 2 (Checked) */}
          <rect x="12" y="18.5" width="8" height="8" rx="2" fill="#00FF88" />
          <path d="M 14 22.5 L 16 24.5 L 18 20.5" stroke="#000" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="24" y="20.5" width="34" height="4" rx="2" fill="rgba(255,255,255,0.85)" />

          {/* Item 3 (Cross) */}
          <rect x="12" y="29.5" width="8" height="8" rx="2" fill="#FF3366" />
          <path d="M 14.5 32 L 17.5 35 M 17.5 32 L 14.5 35" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="24" y="31.5" width="24" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
        </svg>
      )

    // ── 15. FLOWCHART (Sơ đồ quy trình dọc - Cân đối SVG 3 bước) ──
    case 'flowchart':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Step 1 */}
          <rect x="12" y="4" width="56" height="8.5" rx="2.5" fill={accent} fillOpacity="0.22" stroke={accent} strokeWidth="0.9" />
          <circle cx="17" cy="8.2" r="2.2" fill={accent} />
          <rect x="23" y="6.7" width="28" height="3" rx="1.5" fill="#FFF" />
          
          {/* Arrow 1 */}
          <path d="M 40 13.5 L 40 16.5 M 38.5 15.5 L 40 16.8 L 41.5 15.5" stroke={accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

          {/* Step 2 */}
          <rect x="12" y="17.5" width="56" height="8.5" rx="2.5" fill="#00D4FF" fillOpacity="0.22" stroke="#00D4FF" strokeWidth="0.9" />
          <circle cx="17" cy="21.7" r="2.2" fill="#00D4FF" />
          <rect x="23" y="20.2" width="24" height="3" rx="1.5" fill="#FFF" />

          {/* Arrow 2 */}
          <path d="M 40 27 L 40 30 M 38.5 29 L 40 30.3 L 41.5 29" stroke="#00D4FF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

          {/* Step 3 */}
          <rect x="12" y="31" width="56" height="8.5" rx="2.5" fill="#00FF88" fillOpacity="0.22" stroke="#00FF88" strokeWidth="0.9" />
          <circle cx="17" cy="35.2" r="2.2" fill="#00FF88" />
          <rect x="23" y="33.7" width="20" height="3" rx="1.5" fill="#FFF" />
        </svg>
      )

    // ── 16. TREE DIAGRAM (Sơ đồ cây / Lộ trình) ──
    case 'tree-diagram':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Root node */}
          <rect x="8" y="16" width="22" height="12" rx="3" fill="#BEFF01" fillOpacity="0.25" stroke="#BEFF01" strokeWidth="1" />
          <text x="19" y="24" textAnchor="middle" fill="#BEFF01" fontSize="6" fontWeight="800">ROOT</text>
          {/* Branch Lines */}
          <path d="M 30 22 L 44 13 L 52 13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
          <path d="M 30 22 L 44 31 L 52 31" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
          {/* Leaf 1 */}
          <rect x="52" y="8" width="20" height="10" rx="2" fill="#00D4FF" fillOpacity="0.3" stroke="#00D4FF" strokeWidth="1" />
          {/* Leaf 2 */}
          <rect x="52" y="26" width="20" height="10" rx="2" fill="#FFB800" fillOpacity="0.3" stroke="#FFB800" strokeWidth="1" />
        </svg>
      )

    // ── 17. NETWORK GRAPH (Mạng lưới Node) ──
    case 'network-graph':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <line x1="22" y1="22" x2="40" y2="13" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <line x1="22" y1="22" x2="40" y2="31" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <line x1="40" y1="13" x2="58" y2="22" stroke={accent} strokeWidth="1.2" />
          <line x1="40" y1="31" x2="58" y2="22" stroke={accent} strokeWidth="1.2" />
          <circle cx="22" cy="22" r="4" fill="#00D4FF" />
          <circle cx="40" cy="13" r="4.5" fill={accent} />
          <circle cx="40" cy="31" r="4" fill="#FF3366" />
          <circle cx="58" cy="22" r="5" fill="#00FF88" stroke="#FFF" strokeWidth="1" />
        </svg>
      )

    // ── 18. PYRAMID FUNNEL (Phễu Kim tự tháp) ──
    case 'pyramid-funnel':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Layer 1 (Top) */}
          <polygon points="40,8 48,15 32,15" fill={accent} />
          {/* Layer 2 (Middle) */}
          <polygon points="31,17 49,17 56,26 24,26" fill="#00D4FF" fillOpacity="0.85" />
          {/* Layer 3 (Bottom) */}
          <polygon points="23,28 57,28 65,37 15,37" fill="#FFB800" fillOpacity="0.75" />
        </svg>
      )

    // ── 19. BREATHING CIRCLE (Vòng thở chánh niệm 4-7-8) ──
    case 'breathing-circle':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="18" fill="#86EFAC" fillOpacity="0.1" />
          <circle cx="40" cy="22" r="14" stroke="#86EFAC" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="40" cy="22" r="9" fill="#86EFAC" fillOpacity="0.3" stroke="#86EFAC" strokeWidth="1.5" />
          <text x="40" y="24" textAnchor="middle" fill="#FFF" fontSize="6.5" fontWeight="800">4-7-8</text>
        </svg>
      )

    case 'zen-ripple':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="18" stroke="#48CAE4" strokeOpacity="0.1" strokeWidth="1" />
          <circle cx="40" cy="22" r="13" stroke="#48CAE4" strokeOpacity="0.3" strokeWidth="1" />
          <circle cx="40" cy="22" r="7" stroke="#48CAE4" strokeOpacity="0.7" strokeWidth="1" />
          <circle cx="40" cy="22" r="2" fill="#48CAE4" />
        </svg>
      )

    case 'zen-singing-bowl':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <path d="M28,26 Q40,34 52,26 L50,18 Q40,24 30,18 Z" fill="#D4A373" fillOpacity="0.4" stroke="#D4A373" strokeWidth="1" />
          <circle cx="40" cy="18" r="14" stroke="#D4A373" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="40" cy="18" r="18" stroke="#D4A373" strokeOpacity="0.1" strokeWidth="2" />
        </svg>
      )

    case 'zen-pebble-balance':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <ellipse cx="40" cy="30" rx="14" ry="5" fill="#A89F91" fillOpacity="0.3" stroke="#A89F91" strokeWidth="1" />
          <ellipse cx="40" cy="23" rx="10" ry="4" fill="#A89F91" fillOpacity="0.5" stroke="#A89F91" strokeWidth="1" />
          <ellipse cx="40" cy="17" rx="6" ry="3" fill="#A89F91" fillOpacity="0.8" />
          <circle cx="40" cy="9" r="2" fill="#FFF" fillOpacity="0.5" />
        </svg>
      )

    // ── 20. VINYL PULSE (Đĩa than & Sóng lofi) ──
    case 'vinyl-pulse':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Mini Vinyl Record */}
          <circle cx="22" cy="22" r="14" fill="#181424" stroke="#4C3A6E" strokeWidth="1" />
          <circle cx="22" cy="22" r="9" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <circle cx="22" cy="22" r="4" fill="#C4B5FD" />
          <circle cx="22" cy="22" r="1.2" fill="#FFF" />
          
          {/* Fluid Sine Bars */}
          <rect x="42" y="16" width="3" height="12" rx="1.5" fill="#93C5FD" />
          <rect x="48" y="11" width="3" height="22" rx="1.5" fill="#C4B5FD" />
          <rect x="54" y="14" width="3" height="16" rx="1.5" fill="#93C5FD" />
          <rect x="60" y="18" width="3" height="8" rx="1.5" fill="#C4B5FD" />
          <rect x="66" y="13" width="3" height="18" rx="1.5" fill="#93C5FD" />
        </svg>
      )

    // ── 21. DATA FLOW (Luồng Dữ Liệu Chuyển Động) ──
    case 'data-flow':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Connecting dashed line */}
          <line x1="16" y1="22" x2="64" y2="22" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 2" />
          
          {/* Animated Glow Pulse along the wire */}
          <circle cx="34" cy="22" r="2.5" fill={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
          <circle cx="50" cy="22" r="2" fill="#FFF" style={{ filter: `drop-shadow(0 0 3px ${accent})` }} />

          {/* Node 1 */}
          <rect x="8" y="13" width="16" height="18" rx="4" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="1.2" />
          <circle cx="16" cy="22" r="3" fill="#00D4FF" />

          {/* Node 2 (Center) */}
          <rect x="32" y="13" width="16" height="18" rx="4" fill="rgba(10, 16, 28, 0.9)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <circle cx="40" cy="22" r="3" fill={accent} />

          {/* Node 3 */}
          <rect x="56" y="13" width="16" height="18" rx="4" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="1.2" />
          <circle cx="64" cy="22" r="3" fill="#00FF88" />
        </svg>
      )

    // ── 22. BRANCHING FLOW (Sơ Đồ Rẽ Nhánh Phân Tải) ──
    case 'branching-flow':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Orthogonal branches */}
          <path d="M 26 22 L 40 22 L 40 12 L 56 12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="2 2" />
          <path d="M 40 22 L 56 22" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="2 2" />
          <path d="M 40 22 L 40 32 L 56 32" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="2 2" />

          {/* Splitting Pulses */}
          <circle cx="48" cy="12" r="2" fill={accent} />
          <circle cx="48" cy="22" r="2" fill="#FFF" />
          <circle cx="48" cy="32" r="2" fill="#00FF88" />

          {/* Root Node (Left) */}
          <rect x="8" y="14" width="18" height="16" rx="3" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="1.2" />
          <circle cx="17" cy="22" r="3" fill="#00D4FF" />

          {/* Child Nodes (Right) */}
          <rect x="56" y="6" width="16" height="11" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
          <rect x="56" y="17" width="16" height="11" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="0.8" />
          <rect x="56" y="28" width="16" height="11" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        </svg>
      )

    // ── 23. PARALLEL FLOW (Sơ Đồ Xử Lý Song Song Rẽ-Gom) ──
    case 'parallel-flow':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Fork wires */}
          <path d="M 18 22 L 28 22 L 28 12 L 35 12" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 28 22 L 35 22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 28 22 L 28 32 L 35 32" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Join wires */}
          <path d="M 47 12 L 54 12 L 54 22 L 62 22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 47 22 L 62 22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 47 32 L 54 32 L 54 22 L 62 22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Input Node (Left) */}
          <rect x="6" y="15" width="12" height="14" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="1" />
          <circle cx="12" cy="22" r="2" fill={accent} />

          {/* Middle Parallel Tasks */}
          <rect x="35" y="7" width="12" height="10" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
          <rect x="35" y="17" width="12" height="10" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="0.8" />
          <rect x="35" y="27" width="12" height="10" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

          {/* Output Node (Right) */}
          <rect x="62" y="15" width="12" height="14" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke="#00FF88" strokeWidth="1" />
          <circle cx="68" cy="22" r="2" fill="#00FF88" />
        </svg>
      )

    // ── 24. MINDMAP FLOW (Sơ Đồ Tư Duy Tỏa 2 Nhánh) ──
    case 'mindmap-flow':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Left S-curves */}
          <path d="M 33 22 C 24 22, 24 13, 16 13" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 33 22 C 24 22, 24 31, 16 31" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Right S-curves */}
          <path d="M 47 22 C 56 22, 56 13, 64 13" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 47 22 C 56 22, 56 31, 64 31" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Moving Photons */}
          <circle cx="23" cy="16" r="1.5" fill={accent} />
          <circle cx="57" cy="28" r="1.5" fill="#00FF88" />

          {/* Left Leaf Nodes */}
          <rect x="5" y="8" width="12" height="9" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="#00D4FF" strokeWidth="0.8" />
          <rect x="5" y="27" width="12" height="9" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="#FFB800" strokeWidth="0.8" />

          {/* Center Brain Core */}
          <rect x="33" y="14" width="14" height="16" rx="3" fill="rgba(10, 16, 28, 0.95)" stroke={accent} strokeWidth="1.2" />
          <circle cx="40" cy="22" r="2.5" fill={accent} />

          {/* Right Leaf Nodes */}
          <rect x="63" y="8" width="12" height="9" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="#BEFF01" strokeWidth="0.8" />
          <rect x="63" y="27" width="12" height="9" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="#00FF88" strokeWidth="0.8" />
        </svg>
      )

    // ── KNOWLEDGE GRAPH (Cây Tri Thức Đa Tầng) ──
    case 'knowledge-graph':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Top Root Node */}
          <circle cx="40" cy="8" r="5" fill="rgba(10, 16, 28, 0.95)" stroke={accent} strokeWidth="1.2" />
          <circle cx="40" cy="8" r="2" fill={accent} />

          {/* Curves from Top to Tier 1 */}
          <path d="M 40 13 C 40 18, 20 18, 20 23" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          <path d="M 40 13 C 40 18, 40 18, 40 23" stroke={accent} strokeWidth="1" />
          <path d="M 40 13 C 40 18, 60 18, 60 23" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

          {/* Tier 1 Nodes */}
          <rect x="13" y="23" width="14" height="8" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="#00D4FF" strokeWidth="0.8" />
          <rect x="33" y="23" width="14" height="8" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke={accent} strokeWidth="1.1" />
          <rect x="53" y="23" width="14" height="8" rx="2" fill="rgba(10, 16, 28, 0.9)" stroke="#FFB800" strokeWidth="0.8" />

          {/* Curve to Tier 2 Leaf */}
          <path d="M 40 31 L 40 36" stroke={accent} strokeWidth="0.8" />
          <circle cx="40" cy="38" r="3" fill="rgba(10, 16, 28, 0.9)" stroke="#00FF88" strokeWidth="0.8" />
        </svg>
      )

    // ── 25. FUNNEL FLOW (Phễu Chuyển Đổi Cyber) ──
    case 'funnel-flow':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Tier 1 (Wide Top) */}
          <polygon points="12,8 68,8 63,16 17,16" fill="rgba(0, 212, 255, 0.2)" stroke="#00D4FF" strokeWidth="0.9" />
          {/* Tier 2 (Mid) */}
          <polygon points="19,18 61,18 56,26 24,26" fill="rgba(190, 255, 1, 0.2)" stroke="#BEFF01" strokeWidth="0.9" />
          {/* Tier 3 (Narrow Bottom) */}
          <polygon points="26,28 54,28 49,36 31,36" fill="rgba(255, 184, 0, 0.2)" stroke="#FFB800" strokeWidth="0.9" />
          {/* Cascading Photon Particles */}
          <circle cx="40" cy="12" r="1.8" fill="#FFF" />
          <circle cx="40" cy="22" r="1.5" fill="#00D4FF" />
          <circle cx="40" cy="32" r="1.2" fill="#FFB800" />
        </svg>
      )

    // ── 26. ROADMAP FLOW (Lộ Trình Zigzag & Milestone) ──
    case 'roadmap-flow':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Zigzag S-curves */}
          <path d="M 22 12 C 22 20, 58 14, 58 22 C 58 30, 22 26, 22 34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="2 2" />
          {/* Traveling Laser Light */}
          <circle cx="40" cy="18" r="2.2" fill={accent} />
          <circle cx="40" cy="18" r="4" fill={accent} fillOpacity="0.3" />
          {/* Milestone 1 (Top Left) */}
          <rect x="10" y="7" width="24" height="10" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke="#00D4FF" strokeWidth="0.9" />
          <circle cx="16" cy="12" r="2" fill="#00D4FF" />
          {/* Milestone 2 (Mid Right) */}
          <rect x="46" y="17" width="24" height="10" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke="#BEFF01" strokeWidth="0.9" />
          <circle cx="52" cy="22" r="2" fill="#BEFF01" />
          {/* Milestone 3 (Bottom Left) */}
          <rect x="10" y="29" width="24" height="10" rx="2.5" fill="rgba(10, 16, 28, 0.9)" stroke="#FFB800" strokeWidth="0.9" />
          <circle cx="16" cy="34" r="2" fill="#FFB800" />
        </svg>
      )

    // ── ORBIT SYSTEM ──
    case 'orbit-system':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="40" cy="22" r="13" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="40" cy="22" r="7" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="40" cy="22" r="4" fill={accent} opacity="0.9" />
          <circle cx="40" cy="22" r="4" fill={accent} opacity="0.2" />
          <circle cx="60" cy="22" r="3" fill="#BEFF01" />
          <circle cx="40" cy="9" r="2.5" fill="#FF2D78" />
          <circle cx="27" cy="30" r="2" fill={accent} />
        </svg>
      )

    // ── SIGNAL WAVE ──
    case 'signal-wave':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <rect x="0" y="0" width="80" height="44" rx="4" fill="#06090F" />
          <path d="M 8 30 C 16 30 16 14 24 14 C 32 14 32 24 40 24 C 48 24 48 10 56 10 C 64 10 64 20 72 20"
            stroke={accent} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 8 30 C 16 30 16 14 24 14 C 32 14 32 24 40 24 C 48 24 48 10 56 10 C 64 10 64 20 72 20 L 72 38 L 8 38 Z"
            fill={accent} opacity="0.08" />
          <circle cx="56" cy="10" r="2.5" fill="#FFFFFF" />
          <circle cx="24" cy="14" r="2" fill={accent} opacity="0.7" />
          <line x1="44" y1="6" x2="44" y2="38" stroke={accent} strokeWidth="0.8" opacity="0.2" />
          <text x="8" y="10" fill={accent} fontSize="5" fontWeight="800" fontFamily="monospace" opacity="0.8">LIVE</text>
        </svg>
      )

    // ── CYBER MATRIX ──
    case 'cyber-matrix':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <rect x="0" y="0" width="80" height="44" rx="4" fill="#06090F" />
          {Array.from({ length: 40 }, (_, i) => {
            const col = i % 8; const row = Math.floor(i / 8);
            const v = [0.9,0.4,0.7,0.2,0.8,0.5,0.95,0.3,0.6,0.85,0.3,0.7,0.5,0.9,0.4,0.65,0.8,0.25,0.7,0.9,0.45,0.6,0.85,0.3,0.7,0.5,0.9,0.4,0.65,0.8,0.25,0.7,0.9,0.45,0.6,0.85,0.3,0.7,0.5,0.9][i] || 0.5;
            return <rect key={i} x={6 + col * 8.5} y={8 + row * 7.5} width={7} height={6} rx={1} fill={accent} fillOpacity={v * 0.85} />;
          })}
          <line x1="35" y1="8" x2="35" y2="44" stroke={accent} strokeWidth="0.8" opacity="0.3" />
        </svg>
      )

    // ── SPEED METER ──
    case 'speed-meter':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <path d="M 16 36 A 24 24 0 0 1 64 36" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 16 36 A 24 24 0 0 1 40 12" stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          <path d="M 40 12 A 24 24 0 0 1 60 29" stroke="#BEFF01" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          <path d="M 60 29 A 24 24 0 0 1 64 36" stroke="#FF2D78" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          <line x1="40" y1="36" x2="54" y2="17" stroke="#FF2D78" strokeWidth="2" strokeLinecap="round" />
          <circle cx="40" cy="36" r="4" fill="#1A1A2E" stroke="#FF2D78" strokeWidth="1.5" />
          <circle cx="40" cy="36" r="1.5" fill="#FF2D78" />
          <text x="40" y="42" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="5.5" fontWeight="700">78%</text>
        </svg>
      )

    // ── LIQUID FILL ──
    case 'liquid-fill':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="17" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="#06090F" />
          <path d="M 23 22 Q 31 17 40 22 T 57 22 L 57 39 A 17 17 0 0 1 23 39 Z" fill={accent} opacity="0.4" />
          <path d="M 23 24 Q 31 29 40 24 T 57 24 L 57 39 A 17 17 0 0 1 23 39 Z" fill={accent} opacity="0.7" />
          <circle cx="34" cy="28" r="1.2" fill="#FFFFFF" opacity="0.7" />
          <circle cx="46" cy="32" r="1" fill="#FFFFFF" opacity="0.6" />
          <text x="40" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="900" fontFamily="Inter">68%</text>
        </svg>
      )

    // ── NEURON NETWORK ──
    case 'neuron-network':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <line x1="40" y1="22" x2="22" y2="12" stroke={accent} strokeWidth="1" opacity="0.5" />
          <line x1="40" y1="22" x2="58" y2="12" stroke={accent} strokeWidth="1" opacity="0.5" />
          <line x1="40" y1="22" x2="18" y2="32" stroke="#BEFF01" strokeWidth="1" opacity="0.5" />
          <line x1="40" y1="22" x2="62" y2="32" stroke="#FF2D78" strokeWidth="1" opacity="0.5" />
          <line x1="22" y1="12" x2="58" y2="12" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <circle cx="40" cy="22" r="6" fill="#00FF88" opacity="0.2" />
          <circle cx="40" cy="22" r="3.5" fill="#00FF88" />
          <circle cx="22" cy="12" r="2.5" fill={accent} />
          <circle cx="58" cy="12" r="2.5" fill={accent} />
          <circle cx="18" cy="32" r="2" fill="#BEFF01" />
          <circle cx="62" cy="32" r="2" fill="#FF2D78" />
        </svg>
      )

    // ── HOLOGRAM BAR ──
    case 'hologram-bar':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Bar 1 */}
          <rect x="18" y="16" width="10" height="22" rx="2" fill="#00D4FF" opacity="0.75" />
          <ellipse cx="23" cy="16" rx="5" ry="2" fill="#00D4FF" />
          <line x1="18" y1="22" x2="28" y2="22" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
          {/* Bar 2 */}
          <rect x="35" y="8" width="10" height="30" rx="2" fill="#BEFF01" opacity="0.85" />
          <ellipse cx="40" cy="8" rx="5" ry="2" fill="#BEFF01" />
          <line x1="35" y1="18" x2="45" y2="18" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
          {/* Bar 3 */}
          <rect x="52" y="22" width="10" height="16" rx="2" fill="#FF2D78" opacity="0.75" />
          <ellipse cx="57" cy="22" rx="5" ry="2" fill="#FF2D78" />
          <line x1="52" y1="28" x2="62" y2="28" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
        </svg>
      )

    // ── TIMELINE PULSE ──
    case 'timeline-pulse':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <line x1="6" y1="22" x2="74" y2="22" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
          <path d="M 6 22 L 20 22 L 24 12 L 28 32 L 32 18 L 36 22 L 74 22" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="22" r="3.5" fill="#00FF88" stroke="#06090F" strokeWidth="1.5" />
          <circle cx="36" cy="22" r="3.5" fill={accent} stroke="#06090F" strokeWidth="1.5" />
          <circle cx="54" cy="22" r="3" fill="#BEFF01" stroke="#06090F" strokeWidth="1.5" />
          <circle cx="68" cy="22" r="3" fill="#FF2D78" stroke="#06090F" strokeWidth="1.5" />
        </svg>
      )

    // ── LIFECYCLE MATRIX ──
    case 'lifecycle-matrix':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          {/* Top Dotted Stepper Bar */}
          <line x1="12" y1="6" x2="68" y2="6" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="20" cy="6" r="2" fill="#00D4FF" />
          <circle cx="40" cy="6" r="2.5" fill="#FF6B00" stroke="#FFF" strokeWidth="0.8" />
          <circle cx="60" cy="6" r="2" fill="#00FF88" />

          {/* Col 1 (Blue) */}
          <rect x="6" y="11" width="20" height="30" rx="3" fill="rgba(0, 212, 255, 0.08)" stroke="rgba(0, 212, 255, 0.25)" strokeWidth="0.8" />
          <rect x="10" y="14" width="12" height="4" rx="1" fill="#00D4FF" opacity="0.8" />
          <line x1="9" y1="22" x2="23" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
          <line x1="9" y1="26" x2="20" y2="26" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          <rect x="9" y="32" width="14" height="5" rx="1.5" fill="none" stroke="#00D4FF" strokeWidth="0.6" strokeDasharray="1.5 1.5" />

          {/* Col 2 (Orange - Active Glow) */}
          <rect x="30" y="10" width="20" height="32" rx="3" fill="rgba(255, 107, 0, 0.16)" stroke="#FF6B00" strokeWidth="1.2" />
          <rect x="34" y="13" width="12" height="4" rx="1" fill="#FF6B00" />
          <line x1="33" y1="21" x2="47" y2="21" stroke="#FFF" strokeWidth="0.9" />
          <line x1="33" y1="25" x2="44" y2="25" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
          <rect x="33" y="32" width="14" height="6" rx="1.5" fill="rgba(255, 107, 0, 0.25)" stroke="#FF6B00" strokeWidth="0.8" />

          {/* Col 3 (Green) */}
          <rect x="54" y="11" width="20" height="30" rx="3" fill="rgba(0, 255, 136, 0.08)" stroke="rgba(0, 255, 136, 0.25)" strokeWidth="0.8" />
          <rect x="58" y="14" width="12" height="4" rx="1" fill="#00FF88" opacity="0.8" />
          <line x1="57" y1="22" x2="71" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
          <line x1="57" y1="26" x2="68" y2="26" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          <rect x="57" y="32" width="14" height="5" rx="1.5" fill="none" stroke="#00FF88" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
        </svg>
      )

    // ── GENERATIVE SVG (Y=f(X) Vector Toán Học) ──
    case 'generative-svg':
      return (
        <svg width="100%" height="44" viewBox="0 0 80 44" fill="none">
          <circle cx="40" cy="22" r="16" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M 40 22 Q 46 14 52 22 T 40 32 T 28 22 T 40 12" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="40" cy="12" r="2.5" fill="#00F2FE" />
          <circle cx="40" cy="22" r="2" fill="#FFF" />
          <text x="40" y="40" textAnchor="middle" fill={accent} fontSize="5" fontWeight="900" letterSpacing="0.5">Y=f(X)</text>
        </svg>
      )

    default:
      return null
  }
}
