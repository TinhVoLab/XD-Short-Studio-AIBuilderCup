import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { MasterHookData, HookArchetype, HookLayoutStyle } from '@/types/scene';
import { resolveMasterHook, fitHeroFontSize } from '@/config/hookLayout';
import { HookLayoutSharedProps } from './MasterHook/types';
import { VoicePulseProvider } from './MasterHook/components/VoicePulse';
import { HighlightWordRenderer } from './MasterHook/components/HighlightWordRenderer';
import { getTypographicVoice, formatTypographicText } from './MasterHook/config/typographicVoice';

// Import các layout modules độc lập
import { HazardAlertLayout } from './MasterHook/layouts/HazardAlertLayout';
import { StickerWordsLayout } from './MasterHook/layouts/StickerWordsLayout';
import { CyberHudLayout } from './MasterHook/layouts/CyberHudLayout';
import { SplitVersusLayout } from './MasterHook/layouts/SplitVersusLayout';
import { LuxuryZenLayout } from './MasterHook/layouts/LuxuryZenLayout';
import { CtaSocialLayout } from './MasterHook/layouts/CtaSocialLayout';
import { CtaPillLayout } from './MasterHook/layouts/CtaPillLayout';
import { CtaCommentLayout } from './MasterHook/layouts/CtaCommentLayout';
import { CtaBookmarkLayout } from './MasterHook/layouts/CtaBookmarkLayout';
import { StackedLayout } from './MasterHook/layouts/StackedLayout';

// Kinetic Layouts
import { KineticContrastLayout } from './MasterHook/layouts/KineticContrastLayout';
import { KineticBoldScriptLayout } from './MasterHook/layouts/KineticBoldScriptLayout';
import { KineticSolidBoxLayout } from './MasterHook/layouts/KineticSolidBoxLayout';
import { KineticGiantStatLayout } from './MasterHook/layouts/KineticGiantStatLayout';
import { KineticStripHighlightLayout } from './MasterHook/layouts/KineticStripHighlightLayout';

// Procedural Generative Layouts
import { CinematicLowerThirdLayout } from './MasterHook/layouts/CinematicLowerThirdLayout';
import { KineticWordWeightLayout } from './MasterHook/layouts/KineticWordWeightLayout';

// Factory Map (O(1) Direct Lookup Renderer)
const LAYOUT_REGISTRY: Record<HookLayoutStyle, React.FC<HookLayoutSharedProps>> = {
  'hazard-alert': HazardAlertLayout,
  'sticker-words': StickerWordsLayout,
  'cyber-hud': CyberHudLayout,
  'split-versus': SplitVersusLayout,
  'luxury-zen': LuxuryZenLayout,
  'cta-social': CtaSocialLayout,
  'cta-pill': CtaPillLayout,
  'cta-comment': CtaCommentLayout,
  'cta-bookmark': CtaBookmarkLayout,
  'stacked': StackedLayout,
  'kinetic-contrast': KineticContrastLayout,
  'kinetic-bold-script': KineticBoldScriptLayout,
  'kinetic-solid-box': KineticSolidBoxLayout,
  'kinetic-giant-stat': KineticGiantStatLayout,
  'kinetic-strip-highlight': KineticStripHighlightLayout,
  'gravity-pull': KineticWordWeightLayout, // đã gộp vào word-weight — giữ tên cho project cũ
  'cinematic-lower-third': CinematicLowerThirdLayout,
  'kinetic-word-weight': KineticWordWeightLayout,
};

export const MasterHookElement: React.FC<AdvElementProps> = React.memo((props) => {
  const { el, computedStyle, frame, fps, delayFrames = 0 } = props;

  // Đọc dữ liệu hook dùng chung với công thức chiều cao (src/config/hookLayout.js)
  const resolved = useMemo(() => resolveMasterHook(el), [el]);
  const hookData: MasterHookData = resolved.hook;
  const archetype: HookArchetype = resolved.archetype;
  const defaults = resolved.defaults;

  const layoutStyle = resolved.layout as HookLayoutStyle;
  const accent = hookData.accentColor || el.accentColor || defaults.accent;
  const badgeText = resolved.badge;
  const heroTitle = resolved.text;
  const subText = resolved.sub;
  const highlightList: string[] = resolved.highlights;
  const boxVariant = hookData.boxVariant || 'glass';

  // 1. Phân tầng chuyển động Spring Physics có Micro-Variation Seed (Anti-Duplicate & Organic Feel)
  const seedNum = useMemo(() => {
    const raw = `${el.id || ''}-${heroTitle || ''}`;
    let h = 0;
    for (let i = 0; i < raw.length; i++) {
      h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
    }
    return Math.abs(h % 100) / 100; // 0.00 to 0.99
  }, [el.id, heroTitle]);

  const badgeSpring = spring({
    fps,
    frame: frame - delayFrames,
    config: {
      damping: 11.5 + seedNum * 1.2,
      mass: 0.48 + seedNum * 0.04,
      stiffness: 118 + seedNum * 6,
    },
  });

  const heroSpring = spring({
    fps,
    frame: frame - (delayFrames + 3),
    config: {
      damping: 10.8 + seedNum * 0.8,
      mass: 0.58 + seedNum * 0.04,
      stiffness: 108 + seedNum * 6,
    },
  });

  const boxSpring = spring({
    fps,
    frame: frame - (delayFrames + 8),
    config: {
      damping: 13.5 + seedNum * 1.0,
      mass: 0.68 + seedNum * 0.04,
      stiffness: 98 + seedNum * 6,
    },
  });

  // 2. Cỡ chữ hero lớn nhất mà chữ vẫn xếp vừa layout (đo glyph thật; hookData.fontSize = đặt tay)
  const computedFontSize = useMemo(() => fitHeroFontSize(resolved), [resolved]);

  // Interpolation for smooth motion
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.85, 1], { extrapolateRight: 'clamp' });

  const heroOpacity = interpolate(heroSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const heroScale = interpolate(heroSpring, [0, 1], [0.88, 1], { extrapolateRight: 'clamp' });
  const heroTranslateY = interpolate(heroSpring, [0, 1], [15, 0], { extrapolateRight: 'clamp' });

  const boxOpacity = interpolate(boxSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const boxTranslateY = interpolate(boxSpring, [0, 1], [20, 0], { extrapolateRight: 'clamp' });

  // Typographic Voice Resolution
  const typographicVoice = useMemo(() => getTypographicVoice(archetype), [archetype]);
  const formattedHeroTitle = useMemo(() => {
    return formatTypographicText(heroTitle, typographicVoice.transformMode);
  }, [heroTitle, typographicVoice.transformMode]);

  // 3. Highlight Words Parser for standard text
  const renderedHero = useMemo(() => {
    const titleToRender = formattedHeroTitle || heroTitle;
    if (!highlightList || highlightList.length === 0) {
      return titleToRender;
    }
    const lowerHighlights = highlightList.map((h) => h.toLowerCase().trim());
    const words = titleToRender.split(/(\s+)/);

    return words.map((w, idx) => {
      const cleanW = w.toLowerCase().replace(/[^\w\p{L}]/gu, '');
      const isHighlighted = lowerHighlights.some(
        (hl) => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW)
      );

      if (isHighlighted && cleanW.length > 0) {
        return (
          <HighlightWordRenderer
            key={idx}
            word={w}
            style={hookData.highlightStyle}
            accentColor={accent}
            textColor={el.color || 'var(--text)'}
            delayFrames={delayFrames + 6}
          />
        );
      }
      return <span key={idx}>{w}</span>;
    });
  }, [formattedHeroTitle, heroTitle, highlightList, accent, hookData.highlightStyle, el.color, delayFrames]);

  // Factory Resolver
  const ActiveLayout = LAYOUT_REGISTRY[layoutStyle] || StackedLayout;

  const patchedComputedStyle = useMemo(() => ({
    ...computedStyle,
    fontFamily: el.fontFamily || hookData.fontFamily || typographicVoice?.fontFamily || 'Be Vietnam Pro',
  }), [computedStyle, el.fontFamily, hookData.fontFamily, typographicVoice?.fontFamily]);

  return (
    <VoicePulseProvider revealSec={el.hookWordRevealSec} fps={fps}>
    <ActiveLayout
      {...props}
      computedStyle={patchedComputedStyle}
      hookData={hookData}
      archetype={archetype}
      typographicVoice={typographicVoice}
      defaults={defaults}
      accent={accent}
      badgeText={badgeText}
      heroTitle={heroTitle}
      formattedHeroTitle={formattedHeroTitle}
      subText={subText}
      highlightList={highlightList}
      boxVariant={boxVariant}
      computedFontSize={computedFontSize}
      badgeOpacity={badgeOpacity}
      badgeScale={badgeScale}
      heroOpacity={heroOpacity}
      heroScale={heroScale}
      heroTranslateY={heroTranslateY}
      boxOpacity={boxOpacity}
      boxTranslateY={boxTranslateY}
      renderedHero={renderedHero}
    />
    </VoicePulseProvider>
  );
});
