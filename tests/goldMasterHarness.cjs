const fs = require('fs');
const path = require('path');

// 1. Mock Date.now and Math.random for 100% deterministic snapshot comparison
const FIXED_TIMESTAMP = 1727076000000;
let randCounter = 0;
const pseudoRandom = () => {
  randCounter = (randCounter + 1) % 100;
  return (randCounter * 0.01);
};

Date.now = () => FIXED_TIMESTAMP;
Math.random = pseudoRandom;

// Load post-processor
const { postProcessGeneratedScenes, sanitizeBannedWords, applyPacingGuard, resolveSceneLayoutAndCollisions } = require('../server/services/scenePostProcessor.js');
const { inferHookIntent } = require('../src/config/hookDesigner.js');

// 2. Define 10 diverse, comprehensive test scenes
const testScenes = [
  {
    name: 'Cảnh 1: Hook Nguy Hiểm',
    description: 'Cảnh mở đầu giật gân',
    temporalRole: 'hook',
    voiceoverText: 'Dừng lại ngay nếu bạn đang dùng AI sai cách này!',
    elements: [
      {
        type: 'master-hook',
        hookData: {
          heroTitle: 'DỪNG LÀM AI SAI CÁCH',
          badgeText: 'CẢNH BÁO',
          highlightWords: ['DỪNG LÀM', 'SAI CÁCH'],
          layoutStyle: 'hazard-alert',
          accentColor: '#FF3366'
        }
      }
    ]
  },
  {
    name: 'Cảnh 2: Hộp Điểm Nhấn',
    description: 'Phân tích nguyên nhân cốt lõi',
    temporalRole: 'normal',
    voiceoverText: 'Hầu hết mọi người viết prompt quá dài khiến mô hình bị ảo giác và trả về câu trả lời lan man.',
    elements: [
      {
        type: 'badge',
        content: 'NGUYÊN NHÂN #01',
        color: '#BEFF01'
      },
      {
        type: 'highlight-box',
        content: 'Prompt quá dài gây tràn ngữ cảnh và ảo giác',
        fontSize: 20
      }
    ]
  },
  {
    name: 'Cảnh 3: Thống Kê Con Số Khủng',
    description: 'Bằng chứng số liệu',
    temporalRole: 'highlight',
    voiceoverText: 'Có tới 85% kết quả sai lệch bắt nguồn từ việc thiếu cấu trúc dữ liệu đầu vào.',
    elements: [
      {
        type: 'stat-big',
        statValue: '85%',
        statLabel: 'TỶ LỆ LỖI PROMPT',
        accentColor: '#FFB800'
      }
    ]
  },
  {
    name: 'Cảnh 4: Hội Thoại Chat Tin Nhắn',
    description: 'Tình huống thực tế',
    temporalRole: 'normal',
    voiceoverText: 'Đây là sự khác biệt khi khách hàng hỏi và cách trả lời tối ưu.',
    elements: [
      {
        type: 'chat-mockup',
        chatMessages: [
          { sender: 'left', name: 'Khách', text: 'Giá gói AI Pro bao nhiêu?' },
          { sender: 'right', name: 'Bot', text: 'Chỉ 199k trọn đời bạn nhé!' }
        ]
      }
    ]
  },
  {
    name: 'Cảnh 5: So Sánh Đối Đầu',
    description: 'So sánh cách làm cũ và mới',
    temporalRole: 'normal',
    voiceoverText: 'Cách làm truyền thống tốn nhiều giờ, trong khi dùng mẫu chuẩn chỉ mất 10 giây.',
    elements: [
      {
        type: 'vs-card',
        leftCard: { title: 'CÁCH CŨ', points: ['Tốn 3 giờ', 'Dễ nhầm'], color: '#FF3366' },
        rightCard: { title: 'CÁCH MỚI', points: ['10 Giây', 'Chuẩn 100%'], color: '#BEFF01' }
      }
    ]
  },
  {
    name: 'Cảnh 6: Danh Sách Kiểm Tra Checklist',
    description: 'Các bước chuẩn bị',
    temporalRole: 'normal',
    voiceoverText: 'Hãy chắc chắn bạn đã tích đủ 3 tiêu chí này trước khi bấm gửi lệnh.',
    elements: [
      {
        type: 'checklist',
        checklistItems: [
          { text: 'Rõ ràng mục tiêu', status: 'checked' },
          { text: 'Giới hạn định dạng JSON', status: 'checked' },
          { text: 'Cung cấp ví dụ mẫu', status: 'checked' }
        ]
      }
    ]
  },
  {
    name: 'Cảnh 7: Quy Trình 3 Bước Flowchart',
    description: 'Quy trình hành động',
    temporalRole: 'normal',
    voiceoverText: 'Quy trình ba bước chuẩn tự động hoá bất kỳ công việc nào.',
    elements: [
      {
        type: 'flowchart',
        flowSteps: [
          { title: 'BƯỚC 1', subtitle: 'Bóc tách dữ liệu', color: '#BEFF01' },
          { title: 'BƯỚC 2', subtitle: 'Chuẩn hoá cấu trúc', color: '#00D4FF' },
          { title: 'BƯỚC 3', subtitle: 'Xuất bản video', color: '#FF3366' }
        ]
      }
    ]
  },
  {
    name: 'Cảnh 8: Tràn Bố Cục Thác Nước (Elastic Compression Test)',
    description: 'Test nén an toàn Safe Zone',
    temporalRole: 'normal',
    voiceoverText: 'Nhiều thành phần cùng xuất hiện trên một khung hình sẽ kích hoạt thuật toán nén.',
    elements: [
      { type: 'badge', content: 'TỔNG HỢP' },
      { type: 'text', content: 'Tiêu Đề Lớn', fontSize: 28 },
      { type: 'highlight-box', content: 'Nội dung phân tích chi tiết dòng 1\ndòng 2\ndòng 3' },
      { type: 'quote-box', content: 'Chiêm nghiệm sâu sắc', authorName: 'Chuyên Gia' },
      { type: 'divider' }
    ]
  },
  {
    name: 'Cảnh 9: Morphing Test (Trùng lặp widget liên tiếp)',
    description: 'Test biến hình chống lặp',
    temporalRole: 'normal',
    voiceoverText: 'Khi widget lặp lại liên tiếp thì hệ thống sẽ tự động đổi sang dạng khác.',
    elements: [
      {
        type: 'quote-box',
        content: 'Trích dẫn liên tiếp cần biến hình',
        authorName: 'Tác Giả'
      }
    ]
  },
  {
    name: 'Cảnh 10: Kêu Gọi Hành Động (CTA)',
    description: 'Cảnh kết thúc',
    temporalRole: 'cta',
    voiceoverText: 'Lưu ngay video này lại và bấm follow kênh nhé!',
    elements: [
      {
        type: 'badge',
        content: 'FOLLOW KÊNH',
        color: '#BEFF01'
      },
      {
        type: 'text',
        content: 'Bấm Lưu & Theo Dõi',
        fontSize: 26,
        textAlign: 'center'
      }
    ]
  }
];

const options = {
  prompt: '3 Sai lầm chí mạng khi dùng AI',
  style: 'hiện đại',
  ACCENT: '#BEFF01',
  BG_DARK: '#060D16',
  targetDuration: 30,
  sceneCount: 10,
  wordsPerScene: 14,
  aiBannedWords: ['dường như', 'có lẽ', 'trong kỷ nguyên số'],
  aiHumanizerEnabled: true
};

function runHarness(mode) {
  randCounter = 0;
  const processed = postProcessGeneratedScenes(JSON.parse(JSON.stringify(testScenes)), options);

  // Thử nghiệm các hàm standalone API
  const testSanitize = sanitizeBannedWords('Trong kỷ nguyên số, chúng ta dường như đã lãng quên điều cốt lõi.', ['kỷ nguyên số']);
  const testPacing = applyPacingGuard('Đây là câu thoại dài ngoằng nhằm kiểm tra tính năng cắt tỉa câu tự động của pacing guard.', 7);
  const testHookInfer = inferHookIntent('Cảnh báo nguy hiểm mất trắng tiền bạc!');
  const testCollision = resolveSceneLayoutAndCollisions([
    { type: 'text', top: 50, height: 40, content: 'A' },
    { type: 'highlight-box', top: 120, height: 100, content: 'B' }
  ], 'normal');

  const snapshot = {
    processedScenes: processed,
    standalone: {
      testSanitize,
      testPacing,
      testHookInfer,
      testCollision
    }
  };

  const snapshotJson = JSON.stringify(snapshot, null, 2);

  if (mode === 'record') {
    const outPath = path.join(__dirname, 'gold-master-snapshot.json');
    fs.writeFileSync(outPath, snapshotJson, 'utf-8');
    console.log(`✅ [Gold Master] Đã ghi nhận snapshot mẫu thành công vào: ${outPath}`);
    console.log(`   Kích thước snapshot: ${(snapshotJson.length / 1024).toFixed(2)} KB`);
  } else if (mode === 'verify') {
    const expectedPath = path.join(__dirname, 'gold-master-snapshot.json');
    if (!fs.existsSync(expectedPath)) {
      console.error(`❌ Chưa có file snapshot mẫu! Chạy 'node tests/goldMasterHarness.cjs record' trước.`);
      process.exit(1);
    }
    const expectedJson = fs.readFileSync(expectedPath, 'utf-8');
    if (snapshotJson === expectedJson) {
      console.log(`🎉 [VERIFY SUCCESS] TUYỆT ĐỐI CHÍNH XÁC: Output khớp 100.000% không lệch 1 ký tự!`);
      return true;
    } else {
      console.error(`❌ [VERIFY FAILED] Phát hiện sai lệch giữa code mới và Gold Master Snapshot!`);
      // Ghi ra file diff để kiểm tra
      fs.writeFileSync(path.join(__dirname, 'failed-refactor-output.json'), snapshotJson, 'utf-8');
      console.error(`   Đã lưu kết quả mới vào: tests/failed-refactor-output.json để so sánh.`);
      process.exit(1);
    }
  }
}

const arg = process.argv[2] || 'record';
runHarness(arg);
