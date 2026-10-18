import React, { forwardRef } from 'react';
import { Input, InputProps } from './Input';
import styles from './Input.module.css';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightElement'> {
  onClear?: () => void;
}

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="4.5" />
    <path d="M9.5 9.5L12.5 12.5" />
  </svg>
);

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  onClear,
  onKeyDown,
  placeholder = 'Tìm kiếm...',
  fullWidth = true,
  size,
  inputSize = 'sm',
  ...props
}, ref) => {
  const hasValue = typeof value === 'string' && value.length > 0;

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      // Synthesize change event if no direct onClear is provided
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && hasValue) {
      e.preventDefault();
      if (onClear) {
        onClear();
      } else if (onChange) {
        const event = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const clearButton = hasValue ? (
    <button
      type="button"
      className={styles.clearButton}
      onClick={handleClear}
      title="Xóa tìm kiếm (Esc)"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  ) : null;

  return (
    <Input
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      fullWidth={fullWidth}
      size={size}
      inputSize={inputSize}
      leftIcon={<SearchIcon />}
      rightElement={clearButton}
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';
