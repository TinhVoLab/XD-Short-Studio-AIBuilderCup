import React from 'react';
import { MasterHookTemplateV2_1 } from '@/types/hookLibraryV2';
import { HookSceneTemplate } from '@/types/hookLibrary';
import { Button } from '@/components/ui';
import styles from './HookTemplateCard.module.css';

interface HookTemplateCardProps {
  template: MasterHookTemplateV2_1 | HookSceneTemplate;
  isClientMode: boolean;
  onInsert: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  kinetic: 'Kinetic',
  hazard: 'Cảnh báo',
  cyber: 'Cyber',
  zen: 'Zen',
  versus: 'Đối đầu',
  cta: 'Kêu gọi',
};

export const HookTemplateCard: React.FC<HookTemplateCardProps> = ({
  template,
  isClientMode,
  onInsert,
  onDelete,
}) => {
  const { hookData, sceneConfig } = template;
  const accent = hookData.accentColor || 'var(--accent)';
  const isCustom = template.createdBy === 'user';
  const vTemplate = template as MasterHookTemplateV2_1;
  const viralScore = vTemplate.metrics?.viralScore;

  return (
    <div className={styles.card}>
      {/* ── Mini Preview Viewport ── */}
      <div
        className={styles.previewViewport}
        style={{
          background: sceneConfig.bgColor || '#09090b',
          backgroundImage: sceneConfig.bgPattern === 'grid' 
            ? 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)'
            : 'none',
        }}
      >
        {/* Render Thumbnail Image if Available */}
        {template.thumbnailUrl && (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className={styles.thumbnailImg}
            loading="lazy"
          />
        )}

        {/* Category Pill */}
        <div className={styles.categoryPill}>
          {CATEGORY_LABEL[template.category || (template as any).visualStyle] || template.category}
        </div>

        {/* Custom User Tag */}
        {isCustom && (
          <div className={styles.customTag}>
            CUSTOM
          </div>
        )}

        {/* Viral Score Badge */}
        {viralScore && (
          <div className={styles.viralBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            {viralScore}%
          </div>
        )}

        {/* Badge */}
        {!template.thumbnailUrl && hookData.badgeText && (
          <div
            className={styles.badge}
            style={{
              color: hookData.layoutStyle === 'hazard-alert' ? '#000' : accent,
              background: hookData.layoutStyle === 'hazard-alert' ? accent : 'rgba(0,0,0,0.5)',
            }}
          >
            {hookData.badgeText}
          </div>
        )}

        {/* Hero Title */}
        <div
          className={styles.heroTitle}
          style={{
            transform: hookData.tiltDeg ? `rotate(${hookData.tiltDeg}deg)` : 'none',
          }}
        >
          {hookData.heroTitle}
        </div>

        {/* Stat Value if Giant Stat */}
        {hookData.statValue && (
          <div className={styles.statValue} style={{ color: accent }}>
            {hookData.statValue}
          </div>
        )}

        {/* Script line 2 preview */}
        {hookData.heroLine2 && (
          <div
            className={styles.scriptLine2}
            style={{
              fontFamily: `"${hookData.scriptFontFamily || 'Dancing Script'}", cursive`,
              color: accent,
            }}
          >
            {hookData.heroLine2}
          </div>
        )}

        {/* Mini Duration */}
        <div className={styles.duration}>
          {sceneConfig.duration}s
        </div>
      </div>

      {/* ── Metadata & Actions ── */}
      <div className={styles.metaSection}>
        <div className={styles.titleRow}>
          <div className={styles.title} title={template.name}>
            {template.name}
          </div>

          <div className={styles.btnGroup}>
            {!isClientMode && isCustom && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onDelete(template.id)}
                title="Xoá mẫu tuỳ chỉnh"
                style={{ color: 'var(--danger)', padding: '2px 6px' }}
              >
                Xoá
              </Button>
            )}
            <Button
              variant="primary"
              size="xs"
              onClick={() => onInsert(template.id)}
              className={styles.insertBtn}
            >
              Chèn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

