import React, { forwardRef } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'purple' | 'pill';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-xs' | 'icon-sm' | 'icon-md';
export type ButtonShape = 'rounded' | 'pill' | 'circle';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  solid?: boolean; // For danger variant
  selected?: boolean; // For pill variant
  asIcon?: boolean; // Shorthand to imply this is an icon button (adjusts size/shape mapping implicitly if needed, but explicit size is preferred)
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'sm',
  shape = 'rounded',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  solid = false,
  selected = false,
  asIcon = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  
  // Resolve base classes
  const classes = [styles.btnBase];
  
  // Resolve Variant
  switch (variant) {
    case 'primary': classes.push(styles.variantPrimary); break;
    case 'secondary': classes.push(styles.variantSecondary); break;
    case 'ghost': classes.push(styles.variantGhost); break;
    case 'outline': classes.push(styles.variantOutline); break;
    case 'danger': 
      classes.push(styles.variantDanger); 
      if (solid) classes.push(styles.solid);
      break;
    case 'purple': classes.push(styles.variantPurple); break;
    case 'pill': 
      classes.push(styles.variantPill); 
      if (selected) classes.push(styles.selected);
      break;
  }

  // Resolve Size
  const actualSize = asIcon && !size.startsWith('icon-') ? `icon-${size}` : size;
  switch (actualSize) {
    case 'xs': classes.push(styles.sizeXs); break;
    case 'sm': classes.push(styles.sizeSm); break;
    case 'md': classes.push(styles.sizeMd); break;
    case 'lg': classes.push(styles.sizeLg); break;
    case 'icon-xs': classes.push(styles.sizeIconXs); break;
    case 'icon-sm': classes.push(styles.sizeIconSm); break;
    case 'icon-md': classes.push(styles.sizeIconMd); break;
  }

  // Resolve Shape
  const actualShape = asIcon && shape === 'rounded' ? 'circle' : shape;
  switch (actualShape) {
    case 'rounded': classes.push(styles.shapeRounded); break;
    case 'pill': classes.push(styles.shapePill); break;
    case 'circle': classes.push(styles.shapeCircle); break;
  }

  // Modifiers
  if (fullWidth) classes.push(styles.fullWidth);
  if (loading || disabled) classes.push(styles.disabled);
  if (className) classes.push(className);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={classes.join(' ')}
      {...props}
    >
      <span className={`${styles.contentWrapper} ${loading ? styles.loadingTextHide : ''}`}>
        {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
        {children}
        {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
      </span>
      
      {loading && (
        <span className={styles.spinnerContainer}>
          <span className={styles.spinner} />
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
