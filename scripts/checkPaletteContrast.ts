import { THEME_PALETTES } from '../src/utils/themeResolver';
import { getContrastRatio } from '../src/utils/colorContrast';

console.log('─── WCAG 2.1 CONTRAST AUDIT FOR 9 THEME PALETTES ───\n');

let failedCount = 0;

for (const pal of Object.values(THEME_PALETTES)) {
  const { tokens, label, spaceMode } = pal;
  const textOnBg = getContrastRatio(tokens.text, tokens.bg);
  const textOnSurface = getContrastRatio(tokens.text, tokens.surface);
  const accentOnBg = getContrastRatio(tokens.accent, tokens.bg);
  const subTextOnBg = getContrastRatio(tokens.subtitleText, tokens.subtitleBg);

  const textPassed = textOnBg >= 4.5;
  const surfacePassed = textOnSurface >= 4.0;
  const subPassed = subTextOnBg >= 4.5;

  if (!textPassed || !surfacePassed || !subPassed) {
    failedCount++;
  }

  console.log(`[${pal.id.padEnd(16)}] (${spaceMode.padEnd(14)}) - ${label}`);
  console.log(`  • Text on Bg (${tokens.text} vs ${tokens.bg}): ${textOnBg}:1 ${textPassed ? '✅' : '⚠️ LOW'}`);
  console.log(`  • Text on Surface (${tokens.text} vs ${tokens.surface}): ${textOnSurface}:1 ${surfacePassed ? '✅' : '⚠️ LOW'}`);
  console.log(`  • Subtitle (${tokens.subtitleText} vs ${tokens.subtitleBg}): ${subTextOnBg}:1 ${subPassed ? '✅' : '⚠️ LOW'}`);
  console.log(`  • Accent on Bg (${tokens.accent} vs ${tokens.bg}): ${accentOnBg}:1`);
  console.log('');
}

if (failedCount === 0) {
  console.log('🎉 ALL PALETTES MEET WCAG CONTRAST REQUIREMENTS!');
} else {
  console.log(`⚠️ ${failedCount} palettes have contrast edge cases to review.`);
}
