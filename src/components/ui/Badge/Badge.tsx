import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'primary' | 'cyber' | 'success' | 'warning' | 'danger' | 'neutral' | 'solid';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'xs',
  pill = false,
  glow = false,
  className = '',
  style,
  ...props
}) => {
  const classes = [styles.badgeBase];

  // Variant
  switch (variant) {
    case 'primary': classes.push(styles.variantPrimary); break;
    case 'cyber': classes.push(styles.variantCyber); break;
    case 'success': classes.push(styles.variantSuccess); break;
    case 'warning': classes.push(styles.variantWarning); break;
    case 'danger': classes.push(styles.variantDanger); break;
    case 'neutral': classes.push(styles.variantNeutral); break;
    case 'solid': classes.push(styles.variantSolid); break;
  }

  // Size
  switch (size) {
    case 'xs': classes.push(styles.sizeXs); break;
    case 'sm': classes.push(styles.sizeSm); break;
    case 'md': classes.push(styles.sizeMd); break;
  }

  if (pill) classes.push(styles.pill);
  if (glow) classes.push(styles.glow);
  if (className) classes.push(className);

  return (
    <span className={classes.join(' ')} style={style} {...props}>
      {children}
    </span>
  );
};
