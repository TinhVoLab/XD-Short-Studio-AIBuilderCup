import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  size,
  inputSize = 'sm',
  leftIcon,
  rightElement,
  fullWidth = false,
  error = false,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const actualSize = size || inputSize;
  const sizeClass = actualSize === 'sm' ? styles.sizeSm : actualSize === 'lg' ? styles.sizeLg : styles.sizeMd;

  const wrapperClasses = [
    styles.inputWrapper,
    fullWidth ? styles.fullWidth : '',
    error ? styles.error : '',
    disabled ? styles.disabled : '',
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.inputBase,
    sizeClass,
    leftIcon ? styles.hasLeftIcon : '',
    rightElement ? styles.hasRightElement : '',
    error ? styles.hasError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {leftIcon && <div className={styles.leftIconSlot}>{leftIcon}</div>}
      <input
        ref={ref}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />
      {rightElement && <div className={styles.rightElementSlot}>{rightElement}</div>}
    </div>
  );
});

Input.displayName = 'Input';
