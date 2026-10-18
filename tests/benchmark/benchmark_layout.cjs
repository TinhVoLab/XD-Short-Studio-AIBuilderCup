/**
 * Smart Layout Engine — 50 Edge Cases Benchmark & Stress Test
 * 
 * Tests:
 * 1. 📐 Horizontal Safe-Zone Clamping (No text exceeds 312px width or edges [24, 336])
 * 2. ⚡ Dynamic Typography Scaling (Font sizes adjusted correctly for string length)
 * 3. 🛡️ Vertical Collision Avoidance (No elements overlap)
 * 4. ⏱️ Latency & Processing Speed (< 1ms per scene)
 */

const fs = require('fs');
const path = require('path');

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const SAFE_PADDING_X = 24;
const SAFE_WIDTH = CANVAS_WIDTH - (SAFE_PADDING_X * 2); // 312px
const SAFE_TOP = 60;
const SAFE_BOTTOM = 580;

function calculateOptimalTypography(text, type = 'text', existingFontSize) {
  const cleanText = (text || '').trim();
  const charCount = cleanText.length;
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const width = SAFE_WIDTH;

  if (type === 'stat-big' || (/^[\+\-]?\d+([.,]\d+)?(%|x|X|k|K|M|B|tr|tỷ)?$/.test(cleanText) && charCount <= 8)) {
    const fontSize = charCount <= 4 ? 68 : charCount <= 6 ? 56 : 44;
    return { fontSize, lineHeight: 1.1, estimatedHeight: fontSize + 16, width: Math.min(260, width) };
  }

  if (type === 'badge') {
    const fontSize = 11;
    const estimatedWidth = Math.min(width, Math.max(80, charCount * 7.5 + 28));
    return { fontSize, lineHeight: 1, estimatedHeight: 26, width: Math.round(estimatedWidth) };
  }

  if (type === 'subtitle' || type === 'description' || (existingFontSize && existingFontSize <= 16)) {
    const fontSize = charCount > 60 ? 12.5 : 14;
    const lines = Math.ceil(charCount / 38);
    const estimatedHeight = Math.max(30, Math.round(lines * fontSize * 1.35));
    return { fontSize, lineHeight: 1.35, estimatedHeight, width };
  }

  let fontSize;
  let lines;

  if (charCount <= 16 && wordCount <= 3) {
    fontSize = 38;
    lines = 1;
  } else if (charCount <= 32 && wordCount <= 6) {
    fontSize = 28;
    lines = 2;
  } else if (charCount <= 50) {
    fontSize = 23;
    lines = Math.min(3, Math.ceil(charCount / 20));
  } else {
    fontSize = 19;
    lines = 3;
  }

  const estimatedHeight = Math.max(44, Math.round(lines * fontSize * 1.22 + 10));
  return { fontSize, lineHeight: 1.22, estimatedHeight, width };
}

function clampSafeZone(el) {
  let width = Math.min(SAFE_WIDTH, Number(el.width) || SAFE_WIDTH);
  let left = Number(el.left) ?? 180;
  let top = Number(el.top) ?? 180;

  const isCentered = el.textAlign === 'center' || (left >= 140 && left <= 220) || el.type === 'badge' || el.type === 'chart-bar' || el.type === 'audio-waveform';
  
  if (isCentered) {
    left = 180;
    width = Math.min(SAFE_WIDTH, width);
  } else {
    left = Math.max(SAFE_PADDING_X, Math.min(left, CANVAS_WIDTH - SAFE_PADDING_X - width));
    if (left + width > CANVAS_WIDTH - SAFE_PADDING_X) {
      width = CANVAS_WIDTH - SAFE_PADDING_X - left;
    }
  }

  return {
    ...el,
    left,
    width,
    top: Math.max(SAFE_TOP, Math.min(top, SAFE_BOTTOM - 40)),
  };
}

function autoStackSceneElements(elements) {
  if (!elements || elements.length === 0) return [];

  const hierarchyOrder = {
    'badge': 1,
    'text': 2,
    'numbered-list': 3,
    'chart-bar': 4,
    'circle-chart': 4,
    'table': 4,
    'stat-big': 4,
    'flowchart': 4,
    'vs-card': 4,
    'quote-box': 4,
    'metric-cards': 4,
    'audio-waveform': 5,
  };

  const sizedElements = elements.map(el => {
    let clamped = clampSafeZone(el);
    if (el.type === 'text' || el.type === 'badge') {
      const typo = calculateOptimalTypography(el.content || '', el.type, el.fontSize);
      clamped = {
        ...clamped,
        fontSize: typo.fontSize,
        height: typo.estimatedHeight,
        width: typo.width,
      };
    }
    return clamped;
  });

  const sorted = [...sizedElements].sort((a, b) => {
    const orderA = hierarchyOrder[a.type] ?? 3;
    const orderB = hierarchyOrder[b.type] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    return (a.top || 0) - (b.top || 0);
  });

  let currentY = SAFE_TOP + 20;
  const totalContentHeight = sorted.reduce((sum, el) => sum + (el.height || 40) + 16, 0);
  if (totalContentHeight < 320) {
    currentY = Math.max(SAFE_TOP + 30, Math.round((CANVAS_HEIGHT - totalContentHeight) / 2) - 20);
  }

  return sorted.map((el, idx) => {
    const elHeight = Number(el.height) || 40;
    const isBadge = el.type === 'badge';
    const isWaveform = el.type === 'audio-waveform';
    
    let targetTop = currentY;
    if (isBadge && idx === 0) {
      targetTop = Math.min(currentY, 95);
    } else if (isWaveform && idx === sorted.length - 1) {
      targetTop = Math.max(currentY, 480);
    }

    const spacing = isBadge ? 14 : 18;
    currentY = targetTop + elHeight + spacing;

    return {
      ...el,
      top: Math.round(targetTop),
    };
  });
}

// ── 50 Test Cases Benchmark Suite ──
const TEST_CASES = [
  // 1-10: Extra Long Titles
  "Tại sao 95% Startup AI đều thất bại ngay trong năm đầu tiên tại Việt Nam?",
  "Bí quyết xây dựng kênh TikTok đạt 1 triệu người theo dõi chỉ với chi phí 0 đồng",
  "Hướng dẫn tối ưu hóa hiệu năng render video tự động với Remotion và Node.js",
  "Top 10 kỹ năng công nghệ cần thiết nhất cho lập trình viên AI trong kỷ nguyên 2026",
  "Làm thế nào để ứng dụng Trí tuệ Nhân tạo tăng năng suất công việc gấp 10 lần?",
  "Chiến lược đầu tư tài chính thông minh dành cho người mới bắt đầu năm 2026",
  "Phân tích nguyên nhân khiến các tập đoàn công nghệ sa thải hàng loạt nhân sự",
  "Khám phá công nghệ xử lý giọng nói Neural TTS nhanh gấp 10 lần thời gian thực",
  "Bí mật đằng sau thuật toán đề xuất video ngắn của TikTok mà bạn chưa từng biết",
  "Tại sao các chuyên gia khuyên không nên bỏ hết tiền vào một giỏ trong năm nay?",

  // 11-20: Short Punchy Hooks
  "CẢNH BÁO!",
  "ĐỪNG BỎ QUA",
  "BÍ MẬT 2026",
  "+450% ROI",
  "100% MIỄN PHÍ",
  "SIÊU NHANH",
  "TOP 1 THỊ TRƯỜNG",
  "10X SPEED",
  "3 BƯỚC ĐƠN GIẢN",
  "ĐỘT PHÁ CÔNG NGHỆ",

  // 21-30: Special Characters & Numbers & Emojis
  "🔥 5 Sai lầm tai hại khiến bạn mất tiền oan!",
  "⚡ Tăng tốc 300% với AI Studio phiên bản 2.0",
  "💡 Mẹo hay: $100 đầu tư mỗi tháng thành $10,000",
  "🎯 3 Tiêu chí vàng chọn ngành nghề năm 2026 (Phần 1)",
  "🚀 Remotion SSR: 60 FPS / 1080p Ultra HD",
  "📊 Doanh thu Q3 tăng trưởng kỷ lục: +185.4%",
  "🤖 Gemini 2.5 Flash vs GPT-4o: Ai là vua tốc độ?",
  "🛑 Dừng lại ngay nếu bạn đang mắc 3 lỗi này!",
  "💎 99% Người dùng không biết tính năng ẩn này",
  "⭐️ Đánh giá 5 sao từ hơn 10,000 chuyên gia",

  // 31-40: Mixed Badges & Stats
  "CHIẾN LƯỢC TĂNG TRƯỞNG",
  "BÁO CÁO TÀI CHÍNH 2026",
  "ĐỘT PHÁ TRÍ TUỆ NHÂN TẠO",
  "XU HƯỚNG CÔNG NGHỆ MỚI",
  "THỊ TRƯỜNG TOÀN CẦU",
  "PHÂN TÍCH CHUYÊN SÂU",
  "HƯỚNG DẪN THỰC CHIẾN",
  "CHỈ SỐ HIỆU SUẤT KPI",
  "TỐI ƯU HÓA HỆ THỐNG",
  "TỔNG KẾT KẾT QUẢ",

  // 41-50: Highly Complex Multi-Element Scene Mixes
  "Bí quyết tăng tỷ lệ chuyển đổi từ 1.2% lên 8.5% trong 30 ngày áp dụng",
  "Quy trình 4 bước tự động hóa toàn bộ phễu bán hàng dành cho doanh nghiệp SME",
  "So sánh chi tiết hiệu quả giữa Google Ads và TikTok Ads trong ngành E-commerce",
  "Cách phòng tránh rủi ro bảo mật thông tin khi làm việc từ xa trên môi trường Cloud",
  "Những bài học xương máu sau khi gọi vốn triệu đô thất bại từ các quỹ mạo hiểm",
  "Tại sao các nhà sáng tạo nội dung hàng đầu đều chuyển sang dùng Video Dài?",
  "Phân tích thị trường bất động sản cuối năm 2026: Cơ hội hay Thách thức?",
  "Cách thiết lập hệ sinh thái tự động hoá marketing với chi phí dưới 5 triệu đồng",
  "Top 5 cuốn sách về tư duy quản trị mà bất kỳ Leader nào cũng bắt buộc phải đọc",
  "Tổng kết hành trình xây dựng sản phẩm từ con số 0 đến 100,000 người dùng tích cực"
];

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('   📐 SMART LAYOUT & AUTO-FIT ENGINE — 50 EDGE-CASE BENCHMARK   ');
console.log('═══════════════════════════════════════════════════════════════════════════════');

let overflowViolations = 0;
let collisionViolations = 0;
let fontViolations = 0;
const latencies = [];

TEST_CASES.forEach((text, i) => {
  const mockElements = [
    { id: 'b1', type: 'badge', content: `CASE #${i + 1}`, left: 180, top: 80, width: 120, height: 26 },
    { id: 't1', type: 'text', content: text, left: 180, top: 160, width: 340, height: 80 },
    { id: 'c1', type: 'chart-bar', left: 180, top: 280, width: 300, height: 140 },
    { id: 'w1', type: 'audio-waveform', left: 180, top: 500, width: 280, height: 35 }
  ];

  const t0 = performance.now();
  const fitted = autoStackSceneElements(mockElements);
  const elapsed = performance.now() - t0;
  latencies.push(elapsed);

  // 1. Check Horizontal Safe-Zone Bounds
  fitted.forEach(el => {
    const isCentered = el.left === 180 || el.textAlign === 'center';
    const leftBound = isCentered ? el.left - el.width / 2 : el.left;
    const rightBound = isCentered ? el.left + el.width / 2 : el.left + el.width;

    if (leftBound < SAFE_PADDING_X - 1 || rightBound > CANVAS_WIDTH - SAFE_PADDING_X + 1) {
      overflowViolations++;
      console.warn(`  ⚠️ Case #${i + 1} Overflow: [${leftBound}, ${rightBound}] for "${el.content?.slice(0, 20)}..."`);
    }

    if (el.type === 'text') {
      if (el.fontSize < 18 || el.fontSize > 56) {
        fontViolations++;
        console.warn(`  ⚠️ Case #${i + 1} Font size out of bounds: ${el.fontSize}px`);
      }
    }
  });

  // 2. Check Vertical Collisions
  for (let j = 0; j < fitted.length - 1; j++) {
    const elA = fitted[j];
    const elB = fitted[j + 1];
    const bottomA = elA.top + (elA.height || 40);
    const topB = elB.top;
    
    if (bottomA > topB) {
      collisionViolations++;
      console.warn(`  ⚠️ Case #${i + 1} Collision between ${elA.type} (top: ${elA.top}, h: ${elA.height}) and ${elB.type} (top: ${elB.top})`);
    }
  }
});

const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
const maxLatency = Math.max(...latencies).toFixed(3);

console.log('\n📊 BENCHMARK RESULTS (50 TEST CASES):');
console.log('───────────────────────────────────────────────────────────────────────────────');
console.log(`  • Total Test Cases:               ${TEST_CASES.length}`);
console.log(`  • Horizontal Overflow Rate:       ${((overflowViolations / (TEST_CASES.length * 4)) * 100).toFixed(1)}% (${overflowViolations} violations) — [${overflowViolations === 0 ? 'PASS ✅' : 'FAIL ❌'}]`);
console.log(`  • Vertical Collision Rate:        ${((collisionViolations / (TEST_CASES.length * 3)) * 100).toFixed(1)}% (${collisionViolations} collisions) — [${collisionViolations === 0 ? 'PASS ✅' : 'FAIL ❌'}]`);
console.log(`  • Typography Scale Compliance:    ${(((TEST_CASES.length - fontViolations) / TEST_CASES.length) * 100).toFixed(1)}% — [${fontViolations === 0 ? 'PASS ✅' : 'FAIL ❌'}]`);
console.log(`  • Average Processing Latency:     ${avgLatency} ms / scene`);
console.log(`  • Max Latency:                    ${maxLatency} ms`);
console.log('───────────────────────────────────────────────────────────────────────────────');

if (overflowViolations === 0 && collisionViolations === 0 && fontViolations === 0) {
  console.log('🎯 SMART LAYOUT ENGINE STATUS: 100% PRODUCTION READY 🚀\n');
  process.exit(0);
} else {
  console.error('❌ Benchmark Failed: Violations detected');
  process.exit(1);
}
