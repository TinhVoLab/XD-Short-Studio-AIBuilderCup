import assert from 'node:assert/strict';
import { formatTypographicText } from '@/remotion/elements/infographic/MasterHook/config/typographicVoice';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Typographic Voice & Tiếng Việt Casing Formatter...');

// Test 1: Editorial case handles ALL CAPS with Vietnamese diacritics
console.log('  ▶ Test 1: Kiểm tra formatTypographicText với ALL CAPS tiếng Việt...');
const inputAllCaps = 'BÌNH AN NỘI TẠI VÀ THẤU HIỂU CHÍNH MÌNH';
const editorialResult = formatTypographicText(inputAllCaps, 'editorial');
assert.equal(
  editorialResult,
  'Bình an nội tại và thấu hiểu chính mình',
  'Editorial case phải biến đổi chữ đầu viết hoa và các chữ sau viết thường trọn vẹn'
);
console.log(`     • Input: "${inputAllCaps}" -> Output: "${editorialResult}"`);
console.log('  ✅ Test 1 PASSED: Casing Editorial hoạt động chính xác với dấu tiếng Việt');

// Test 2: Title case handles words properly
console.log('  ▶ Test 2: Kiểm tra Title Case tiếng Việt...');
const titleResult = formatTypographicText('dừng làm điều này ngay', 'title');
assert.equal(
  titleResult,
  'Dừng Làm Điều Này Ngay',
  'Title case phải viết hoa chữ cái đầu của từng từ'
);
console.log(`     • Output: "${titleResult}"`);
console.log('  ✅ Test 2 PASSED: Title case chuẩn xác');

// Test 3: Uppercase preserves diacritics
console.log('  ▶ Test 3: Kiểm tra Uppercase tiếng Việt...');
const upperResult = formatTypographicText('Đột phá doanh thu x5', 'uppercase');
assert.equal(
  upperResult,
  'ĐỘT PHÁ DOANH THU X5',
  'Uppercase phải bảo tồn đúng dấu Đ, Ộ, Á'
);
console.log(`     • Output: "${upperResult}"`);
console.log('  ✅ Test 3 PASSED: Uppercase giữ trọn vẹn ký tự tiếng Việt');

console.log('\n🎉 TẤT CẢ TEST TYPOGRAPHIC VOICE ĐÃ VƯỢT QUA!\n');
