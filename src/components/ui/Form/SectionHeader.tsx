import React from 'react';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  /** Set true for the very first section in the panel — removes border-top and padding-top */
  first?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  first = false,
  className = '',
  style,
}) => {
  return (
    <div
      className={[
        styles.sectionHeader,
        first ? styles.sectionHeaderFirst : '',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      <div className={styles.titleArea}>
        <div>
          <span className={styles.title}>{title}</span>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {badge}
      </div>
      {action && <div className={styles.actionArea}>{action}</div>}
    </div>
  );
};
