/**
 * Project mẫu giống video AI Wizard (hook master-hook, widget, phụ đề, chuyển cảnh, nền họa tiết) — dùng chung cho
 * renderBenchmark.mjs (đo local) và workerSmoke.mjs (đo trên Render Worker Cloud Run).
 */
const SCENE_SEC = 4;

/** Cảnh mẫu luân phiên các widget AI hay dùng; cảnh đầu là hook */
const VOICE = 'Lãi kép giúp tài sản tăng trưởng theo cấp số nhân nếu bạn bắt đầu đủ sớm và kiên nhẫn đủ lâu';
const WIDGETS = [
  { type: 'highlight-box', content: 'Ba nguyên tắc vàng\nBắt đầu sớm\nĐều đặn mỗi tháng\nKhông rút giữa chừng', width: 312 },
  { type: 'chart-bar', width: 312, chartData: { title: 'Tăng trưởng 10 năm', bars: [{ label: 'Năm 1', value: 12 }, { label: 'Năm 5', value: 48 }, { label: 'Năm 10', value: 100, highlight: true }] } },
  { type: 'checklist', width: 312 },
  { type: 'flowchart', width: 312 },
  { type: 'stat-big', width: 312, statValue: '[ 89% ]', statLabel: 'Nhà đầu tư thua lỗ năm đầu' },
  { type: 'quote-box', width: 312, content: 'Lãi kép là kỳ quan thứ tám của thế giới', authorName: 'Albert Einstein' },
];
const TRANSITIONS = ['fade', 'slide', 'zoom-blur', 'whip-pan'];

export function buildBenchmarkScenes(totalSec) {
  const count = Math.max(1, Math.round(totalSec / SCENE_SEC));
  return Array.from({ length: count }, (_, i) => {
    const base = { left: 180, top: 140, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, animPreset: 'zoom-in', id: `el-${i}` };
    const element = i === 0
      ? { ...base, type: 'master-hook', width: 320, content: 'Lãi kép giúp bạn giàu', hookData: { hookIntent: 'secret', heroTitle: 'Bí mật của lãi kép', layoutStyle: 'stacked', badgeText: 'Ít ai nói', highlightWords: ['lãi kép'], subText: 'Xem hết để không bỏ lỡ' } }
      : { ...base, ...WIDGETS[(i - 1) % WIDGETS.length] };
    return {
      id: `s${i}`, name: `Cảnh ${i + 1}`, description: '', duration: SCENE_SEC, bgColor: '',
      paletteId: i % 2 ? 'peach-cream' : 'neon-night', bgPattern: 'grid',
      voiceoverText: VOICE,
      transition: { type: TRANSITIONS[i % TRANSITIONS.length], duration: 0.4 },
      elements: [element, { id: `cap-${i}`, type: 'caption', left: 180, top: 520, width: 320, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, content: VOICE }],
    };
  });
}

