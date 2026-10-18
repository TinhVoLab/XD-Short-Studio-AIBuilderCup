/**
 * Hiệu chỉnh hợp đồng chiều cao H = f(X) (AGENTS.md mục 5): render từng element bằng bundle Remotion
 * thật, đo chiều cao DOM qua LAYOUT_PROBE và so với calculateElementDynamicHeight().
 *
 * Chạy: npm run build && npm run test:layout
 * Thoát mã 1 nếu có ca lệch quá TOLERANCE_PX.
 */
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { renderStill, selectComposition, openBrowser } = require(path.join(ROOT, 'node_modules/@remotion/renderer'));
const { calculateElementDynamicHeight } = await import(path.join(ROOT, 'src/config/layoutRegistry.js'));

const TOLERANCE_PX = 6;
const serveUrl = path.join(ROOT, 'server/build/remotion-bundle');
const base = { type: 'highlight-box', left: 180, top: 40, width: 312, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, animPreset: 'none' };

const LONG = 'Người bình thường giải quyết hậu quả, còn chuyên gia giải quyết nguyên nhân gốc rễ của vấn đề.';
const CASES = [
  { id: 'callout-short', content: 'Kỷ luật thắng động lực.' },
  { id: 'callout-long', content: LONG },
  { id: 'callout-icon', content: LONG, boxIcon: 'tip' },
  { id: 'callout-icon-center', content: LONG, boxIcon: 'tip', textAlign: 'center' },
  { id: 'callout-20px', content: LONG, fontSize: 20 },
  { id: 'callout-tag-number', content: 'Lãi kép [BÍ MẬT] giúp tài sản tăng 300% sau 10 năm.' },
  { id: 'strip', variant: 'accent-strip', content: LONG, boxIcon: 'pin' },
  { id: 'strip-narrow', variant: 'accent-strip', content: LONG, width: 240 },
  { id: 'pill-cta', content: 'Follow ngay để nhận bí kíp' },
  { id: 'pill-long', variant: 'glow-pill', content: 'Lưu video lại và chia sẻ cho người bạn đang cần động lực nhất', boxIcon: 'cta' },
  { id: 'sticker-4', variant: 'multi-pill', content: 'Kỷ luật, Kiên nhẫn, Lãi kép, Đa dạng hoá danh mục' },
  { id: 'sticker-lines', variant: 'multi-pill', content: 'Tư duy dài hạn\nQuản trị rủi ro\nĐầu tư định kỳ hằng tháng' },
  { id: 'bullet-short', content: 'Ý một\nÝ hai\nÝ ba' },
  { id: 'bullet-long', content: 'Lãi kép giúp tài sản tăng trưởng theo cấp số nhân qua thời gian dài\nĐầu tư đều đặn mỗi tháng quan trọng hơn chọn đúng thời điểm\nBắt đầu sớm mười năm có thể nhân đôi kết quả cuối cùng' },
  { id: 'bullet-6', content: 'Một\nHai\nBa\nBốn\nNăm\nSáu' },
  { id: 'bullet-plain', content: 'Ý một khá dài để xuống dòng trong thẻ hẹp\nÝ hai', badgeMode: 'none' },
  { id: 'bullet-icon', content: 'Ghi chép mỗi ngày\nĐọc 20 trang sách', badgeMode: 'icon', boxIcon: 'target' },
  { id: 'bullet-numbers', content: '90% nhà đầu tư thua lỗ năm đầu\n3 bước để tránh sai lầm', fontSize: 16 },
  { id: 'bullet-center', content: 'Insight cốt lõi khá dài để xuống dòng trong thẻ\nBài học đắt giá', textAlign: 'center' },
  { id: 'bullet-markers', content: '✦ Luận điểm 1: Bóc tách giá trị\n✦ Luận điểm 2: Ứng dụng thực tế' },
  { id: 'callout-multiline', variant: 'callout-card', boxIcon: 'tip', content: 'Dòng một ngắn\nDòng hai dài hơn một chút để xuống dòng trong hộp' },
];

// Skin chỉ là lớp sơn: mọi ca phải cho cùng chiều cao ở cả 4 skin (LAYOUT_SKINS=glass để chạy nhanh)
const SKINS = (process.env.LAYOUT_SKINS || 'glass,editorial,paper,marker').split(',');

const browser = await openBrowser('chrome');
const results = [];
for (const skin of SKINS) for (const c of CASES) {
  const el = { ...base, ...c, id: `${c.id}@${skin}`, highlightSkin: skin };
  const inputProps = { __measureLayout: true, scenes: [{ id: 's', name: 's', description: '', duration: 2, bgColor: '', elements: [el] }], audioClips: [] };
  const composition = await selectComposition({ serveUrl, id: 'MotionStudio', inputProps, puppeteerInstance: browser });
  let dom;
  await renderStill({
    composition, serveUrl, frame: 45, inputProps, puppeteerInstance: browser,
    output: path.join(process.env.TMPDIR || '/tmp', 'layout-calibration.png'),
    onBrowserLog: (log) => {
      if (!log.text.startsWith('LAYOUT_PROBE ')) return;
      const m = JSON.parse(log.text.slice('LAYOUT_PROBE '.length));
      if (m.id === el.id) dom = m.height;
    },
  });
  const formula = calculateElementDynamicHeight(el);
  results.push({ id: el.id, dom, formula, diff: dom === undefined ? NaN : formula - dom });
}
await browser.close({ silent: true });

let failed = 0;
for (const r of results) {
  const ok = Number.isFinite(r.diff) && Math.abs(r.diff) <= TOLERANCE_PX;
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.id.padEnd(32)} dom=${String(r.dom).padStart(4)} formula=${String(r.formula).padStart(4)} diff=${r.diff > 0 ? '+' : ''}${r.diff}`);
}
console.log(failed ? `\n${failed}/${results.length} ca lệch quá ±${TOLERANCE_PX}px` : `\nTất cả ${results.length} ca trong ±${TOLERANCE_PX}px`);
process.exit(failed ? 1 : 0);
