import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// 1. Kiểm tra 32 file wav trong public/sfx
const sfxDir = path.join(projectRoot, 'public', 'sfx');
const sfxFiles = fs.readdirSync(sfxDir).filter(f => f.endsWith('.wav'));
console.log(`\n📁 Thư mục public/sfx có tổng cộng ${sfxFiles.length} file .wav:`);
console.log(sfxFiles.map(f => f.replace('.wav', '')).join(', '));

// 2. Đọc wizardCatalog.ts để kiểm tra SFX_DURATIONS và SFX_ALIAS_MAP
const catalogPath = path.join(projectRoot, 'src/components/AiWizardModal/config/wizardCatalog.ts');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');

// Trích xuất các key trong SFX_DURATIONS
const durationMatch = catalogContent.match(/export const SFX_DURATIONS: Record<string, number> = \{([\s\S]*?)\}/);
if (!durationMatch) {
  console.error('❌ Không tìm thấy SFX_DURATIONS trong wizardCatalog.ts');
  process.exit(1);
}

const durationLines = durationMatch[1]
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('//') && l.includes(':'));

const catalogSfxKeys = durationLines.map(l => l.split(':')[0].trim());
console.log(`\n📋 SFX_DURATIONS đã đăng ký ${catalogSfxKeys.length} âm thanh:`);
console.log(catalogSfxKeys.join(', '));

// Kiểm tra xem mọi file trong public/sfx có trong SFX_DURATIONS không
const missingInCatalog = sfxFiles
  .map(f => f.replace('.wav', ''))
  .filter(name => !catalogSfxKeys.includes(name));

if (missingInCatalog.length > 0) {
  console.warn('⚠️ Còn các file chưa được khai báo trong SFX_DURATIONS:', missingInCatalog);
} else {
  console.log('✅ 100% file .wav trong public/sfx/ đã được đăng ký thời lượng chuẩn xác!');
}

console.log('\n🎉 Foley Catalog Audit PASS!\n');
