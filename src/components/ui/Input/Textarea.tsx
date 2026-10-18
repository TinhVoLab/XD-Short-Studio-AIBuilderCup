import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
  error?: boolean;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  fullWidth = true,
  error = false,
  showCount = false,
  className = '',
  disabled = false,
  maxLength,
  value,
  ...props
}, ref) => {
  const currentLength = typeof value === 'string' ? value.length : 0;

  const wrapperClasses = [
    styles.inputWrapper,
    fullWidth ? styles.fullWidth : '',
    error ? styles.error : '',
    disabled ? styles.disabled : '',
    styles.textareaWrapper,
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    styles.textareaBase,
    error ? styles.hasError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <textarea
        ref={ref}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        className={textareaClasses}
        {...props}
      />
      {showCount && maxLength && (
        <div className={styles.charCount}>
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
