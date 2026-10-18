/**
 * XD-Short Studio — Template Schema & Layout Integrity Validator
 * Kiểm tra tính hợp lệ của toàn bộ template trước khi build
 */

import { TECH_DOODLE_STORY_TEMPLATE } from '../src/config/templates/techDoodleStoryTemplate';
import { EDU_TEMPLATES } from '../src/config/templates/eduTemplates';
import { PERSONAL_BRAND_TEMPLATES } from '../src/config/templates/personalBrandTemplates';
import { TEMPLATES_CATALOG } from '../src/config/templatesCatalog';
import { HAND_DRAWN_CATALOG } from '../src/config/handDrawnCatalog';
import { VideoTemplateItem } from '../src/config/templates/types';

const allTemplates: VideoTemplateItem[] = [
  TECH_DOODLE_STORY_TEMPLATE,
  ...EDU_TEMPLATES,
  ...PERSONAL_BRAND_TEMPLATES,
  ...TEMPLATES_CATALOG,
];

console.log(`\n🔍 [Template Validator] Bắt đầu quét kiểm tra ${allTemplates.length} templates...\n`);

let totalErrors = 0;
let totalWarnings = 0;
const validCatalogIds = new Set(HAND_DRAWN_CATALOG.map((i) => i.id));

allTemplates.forEach((tpl, index) => {
  const tplLabel = `[#${index + 1}] ${tpl.id} ("${tpl.name}")`;
  
  // 1. Kiểm tra Scene count
  let scenes: any[] = [];
  try {
    scenes = tpl.getScenes({ brandColor: '#BEFF01' });
  } catch (err: any) {
    console.error(`❌ ${tplLabel}: getScenes() ném ra ngoại lệ: ${err.message}`);
    totalErrors++;
    return;
  }

  if (scenes.length !== tpl.sceneCount) {
    console.warn(`⚠️  ${tplLabel}: sceneCount khai báo (${tpl.sceneCount}) khác số cảnh thực tế (${scenes.length})`);
    totalWarnings++;
  }

  // 2. Kiểm tra tổng thời lượng
  const totalDuration = scenes.reduce((acc, sc) => acc + (sc.duration || 0), 0);
  if (totalDuration <= 0) {
    console.error(`❌ ${tplLabel}: Tổng thời lượng = 0s!`);
    totalErrors++;
  }

  // 3. Quét từng cảnh & từng element
  scenes.forEach((sc, scIdx) => {
    if (!sc.id) {
      console.error(`❌ ${tplLabel} - Cảnh ${scIdx + 1}: Thiếu ID cảnh!`);
      totalErrors++;
    }

    (sc.elements || []).forEach((el: any) => {
      // Kiểm tra Hand-Drawn Elements
      if (el.type === 'hand-drawn') {
        if (!el.svgContent && !el.pathD) {
          console.error(`❌ ${tplLabel} - Cảnh ${scIdx + 1} (${sc.id}) - Element ${el.id}: Thiếu svgContent/pathD!`);
          totalErrors++;
        }
      }

      // Safe Zone check (360x640)
      if (el.left !== undefined && (el.left < -50 || el.left > 400)) {
        console.warn(`⚠️  ${tplLabel} - Cảnh ${scIdx + 1} (${sc.id}) - Element ${el.id}: left (${el.left}) có thể nằm ngoài Safe Zone [0..360]`);
        totalWarnings++;
      }
    });
  });
});

console.log(`\n────────────────────────────────────────`);
console.log(`📊 Kết quả: ${allTemplates.length} templates đã kiểm tra.`);
console.log(`   Lỗi (Errors):    ${totalErrors}`);
console.log(`   Cảnh báo (Warn): ${totalWarnings}`);

if (totalErrors > 0) {
  console.error(`\n❌ Validation THẤT BẠI với ${totalErrors} lỗi! Vui lòng sửa trước khi build.\n`);
  process.exit(1);
} else {
  console.log(`\n✅ Toàn bộ templates đều HỢP LỆ và an toàn!\n`);
  process.exit(0);
}
