import React from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: (SegmentOption<T> | T)[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const sizeClass = size === 'xs' ? styles.sizeXs : size === 'md' ? styles.sizeMd : styles.sizeSm;

  return (
    <div className={containerClasses} role="tablist">
      {options.map((opt) => {
        const item: SegmentOption<T> = typeof opt === 'string' ? { value: opt as T, label: opt } : opt;
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            title={item.title}
            className={`${styles.segment} ${sizeClass} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(item.value)}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
