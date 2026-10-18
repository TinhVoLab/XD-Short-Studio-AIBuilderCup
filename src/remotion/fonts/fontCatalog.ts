import { loadFont as loadBeVietnamPro } from '@remotion/google-fonts/BeVietnamPro';
import { loadFont as loadDancingScript } from '@remotion/google-fonts/DancingScript';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { loadFont as loadSpaceGrotesk } from '@remotion/google-fonts/SpaceGrotesk';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadPatrickHand } from '@remotion/google-fonts/PatrickHand';
import { loadFont as loadSriracha } from '@remotion/google-fonts/Sriracha';
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadBricolageGrotesque } from '@remotion/google-fonts/BricolageGrotesque';
import { loadFont as loadJetBrainsMono } from '@remotion/google-fonts/JetBrainsMono';

export interface LoadedFontInfo {
  id: string;
  name: string;
  fontFamily: string;
  category: 'sans' | 'script' | 'display' | 'tech' | 'serif';
  weights: string[];
}

// ── LOAD CORE GOOGLE FONTS ONCE FOR THE ENTIRE STUDIO ──
export const beVietnamProFont = loadBeVietnamPro('normal', {
  weights: ['400', '600', '700', '800', '900'],
  ignoreTooManyRequestsWarning: true,
});

export const dancingScriptFont = loadDancingScript('normal', {
  weights: ['400', '700'],
  ignoreTooManyRequestsWarning: true,
});

export const montserratFont = loadMontserrat('normal', {
  weights: ['700', '900'],
  ignoreTooManyRequestsWarning: true,
});

export const caveatFont = loadCaveat('normal', {
  weights: ['400', '700'],
  ignoreTooManyRequestsWarning: true,
});

export const spaceGroteskFont = loadSpaceGrotesk('normal', {
  weights: ['500', '700'],
  ignoreTooManyRequestsWarning: true,
});

export const antonFont = loadAnton('normal', {
  weights: ['400'],
  ignoreTooManyRequestsWarning: true,
});

export const interFont = loadInter('normal', {
  weights: ['400', '600', '700'],
  ignoreTooManyRequestsWarning: true,
});

export const patrickHandFont = loadPatrickHand('normal', {
  weights: ['400'],
  ignoreTooManyRequestsWarning: true,
});

export const srirachaFont = loadSriracha('normal', {
  weights: ['400'],
  ignoreTooManyRequestsWarning: true,
});

export const playfairDisplayFont = loadPlayfairDisplay('normal', {
  weights: ['400', '700'],
  ignoreTooManyRequestsWarning: true,
});

export const oswaldFont = loadOswald('normal', {
  weights: ['600', '700'],
  ignoreTooManyRequestsWarning: true,
});

// Thư viện cảnh Master: Bricolage cho tiêu đề, Playfair nghiêng cho trích dẫn, JetBrains Mono cho nhãn chỉ số
export const bricolageGrotesqueFont = loadBricolageGrotesque('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  ignoreTooManyRequestsWarning: true,
});

export const playfairDisplayItalicFont = loadPlayfairDisplay('italic', {
  weights: ['600'],
  ignoreTooManyRequestsWarning: true,
});

export const jetBrainsMonoFont = loadJetBrainsMono('normal', {
  weights: ['500'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  ignoreTooManyRequestsWarning: true,
});

/**
 * Font KaTeX (công thức, nhãn đồ thị): @font-face nằm trong katex.min.css nên trình duyệt chỉ tải khi gặp
 * ký tự cần dùng — chủ động tải trước để frame đầu của cảnh công thức không vẽ bằng font dự phòng.
 * Đợi một nhịp để CSS của KaTeX (import ở các element STEM) đã được chèn vào trang.
 */
const KATEX_FONT_FACES = [
  '20px KaTeX_Main', 'bold 20px KaTeX_Main', 'italic 20px KaTeX_Main', 'italic 20px KaTeX_Math',
  '20px KaTeX_AMS', '20px KaTeX_Size1', '20px KaTeX_Size2', '20px KaTeX_Size3', '20px KaTeX_Size4',
];
const katexFontsReady = (): Promise<unknown> =>
  typeof document === 'undefined' || !document.fonts
    ? Promise.resolve()
    : new Promise((r) => setTimeout(r, 0)).then(() =>
        Promise.all(KATEX_FONT_FACES.map((face) => document.fonts.load(face, 'x=1+2').catch(() => undefined)))
      );

/**
 * Resolve khi toàn bộ font lõi đã tải xong; MainComposition chờ promise này trong delayRender
 * để frame đầu tiên không bao giờ render bằng font fallback.
 */
export const fontsReady: Promise<void> = Promise.all([
  ...[
    beVietnamProFont, dancingScriptFont, montserratFont, caveatFont, spaceGroteskFont, antonFont,
    interFont, patrickHandFont, srirachaFont, playfairDisplayFont, oswaldFont,
    bricolageGrotesqueFont, playfairDisplayItalicFont, jetBrainsMonoFont,
  ].map((font) => font.waitUntilDone().catch(() => undefined)),
  katexFontsReady(),
]).then(() => undefined);

export const VIRAL_FONT_CATALOG: Record<string, LoadedFontInfo> = {
  beVietnamPro: {
    id: 'beVietnamPro',
    name: 'Be Vietnam Pro',
    fontFamily: beVietnamProFont.fontFamily,
    category: 'sans',
    weights: ['400', '600', '700', '800', '900'],
  },
  playfairDisplay: {
    id: 'playfairDisplay',
    name: 'Playfair Display',
    fontFamily: playfairDisplayFont.fontFamily,
    category: 'serif',
    weights: ['400', '700'],
  },
  oswald: {
    id: 'oswald',
    name: 'Oswald',
    fontFamily: oswaldFont.fontFamily,
    category: 'display',
    weights: ['600', '700'],
  },
  bricolageGrotesque: {
    id: 'bricolageGrotesque',
    name: 'Bricolage Grotesque',
    fontFamily: bricolageGrotesqueFont.fontFamily,
    category: 'display',
    weights: ['600', '700', '800'],
  },
  jetBrainsMono: {
    id: 'jetBrainsMono',
    name: 'JetBrains Mono',
    fontFamily: jetBrainsMonoFont.fontFamily,
    category: 'tech',
    weights: ['500'],
  },
  dancingScript: {
    id: 'dancingScript',
    name: 'Dancing Script',
    fontFamily: dancingScriptFont.fontFamily,
    category: 'script',
    weights: ['400', '700'],
  },
  montserrat: {
    id: 'montserrat',
    name: 'Montserrat',
    fontFamily: montserratFont.fontFamily,
    category: 'sans',
    weights: ['700', '900'],
  },
  caveat: {
    id: 'caveat',
    name: 'Caveat',
    fontFamily: caveatFont.fontFamily,
    category: 'script',
    weights: ['400', '700'],
  },
  spaceGrotesk: {
    id: 'spaceGrotesk',
    name: 'Space Grotesk',
    fontFamily: spaceGroteskFont.fontFamily,
    category: 'tech',
    weights: ['500', '700'],
  },
  anton: {
    id: 'anton',
    name: 'Anton',
    fontFamily: antonFont.fontFamily,
    category: 'display',
    weights: ['400'],
  },
  inter: {
    id: 'inter',
    name: 'Inter',
    fontFamily: interFont.fontFamily,
    category: 'sans',
    weights: ['400', '600', '700'],
  },
  patrickHand: {
    id: 'patrickHand',
    name: 'Patrick Hand',
    fontFamily: patrickHandFont.fontFamily,
    category: 'script',
    weights: ['400'],
  },
  sriracha: {
    id: 'sriracha',
    name: 'Sriracha',
    fontFamily: srirachaFont.fontFamily,
    category: 'script',
    weights: ['400'],
  },
};

/**
 * Helper to resolve font family with robust fallback
 */
export function getViralFontFamily(nameOrId?: string, fallback: string = beVietnamProFont.fontFamily): string {
  if (!nameOrId) return fallback;
  const lower = nameOrId.toLowerCase().replace(/[\s-_]/g, '');

  for (const key of Object.keys(VIRAL_FONT_CATALOG)) {
    const item = VIRAL_FONT_CATALOG[key];
    const itemKeyClean = key.toLowerCase();
    const itemNameClean = item.name.toLowerCase().replace(/[\s-_]/g, '');
    if (lower === itemKeyClean || lower === itemNameClean || itemNameClean.includes(lower) || lower.includes(itemNameClean)) {
      return item.fontFamily;
    }
  }

  return nameOrId;
}
