import React, { useState, useRef, useEffect, forwardRef } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string, label?: string) => void;
  placeholder?: string;
  size?: SelectSize;
  fullWidth?: boolean;
  disabled?: boolean;
  native?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ChevronDownIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 4.5L6 8L9.5 4.5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent, #BEFF01)' }}>
    <path d="M2.5 6.2L4.8 8.5L9.5 3.5" />
  </svg>
);

export const Select = forwardRef<HTMLDivElement, SelectProps>(({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  size = 'sm',
  fullWidth = true,
  disabled = false,
  native = false,
  className = '',
  style,
}, ref) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sizeClass = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;
  const selectedOpt = options.find(o => o.value === value);

  // Handle outside click for custom popover
  useEffect(() => {
    if (native) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, native]);

  const containerClasses = [
    styles.selectContainer,
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  // ── Mode 1: Native HTML <select> (Fast, lightweight for compact toolbars/panels) ──
  if (native) {
    // Group options if applicable
    const groups: { [key: string]: SelectOption[] } = {};
    const ungrouped: SelectOption[] = [];

    options.forEach(opt => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return (
      <div ref={ref} className={containerClasses} style={style}>
        <div className={styles.nativeSelectWrapper}>
          <select
            disabled={disabled}
            value={value}
            onChange={(e) => {
              const selected = options.find(o => o.value === e.target.value);
              onChange(e.target.value, selected?.label);
            }}
            className={`${styles.nativeSelect} ${sizeClass}`}
          >
            {ungrouped.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {Object.entries(groups).map(([groupName, groupOpts]) => (
              <optgroup key={groupName} label={groupName}>
                {groupOpts.map(opt => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className={styles.nativeChevron}>
            <ChevronDownIcon />
          </div>
        </div>
      </div>
    );
  }

  // ── Mode 2: Custom Popover Dropdown (Rich icons, custom styled list) ──
  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={containerClasses}
      style={style}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`${styles.triggerButton} ${sizeClass} ${open ? styles.open : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {selectedOpt?.icon && (
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent, #BEFF01)', flexShrink: 0 }}>
              {selectedOpt.icon}
            </span>
          )}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
        </div>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          color: 'var(--text-muted, #888)',
          marginLeft: 6,
          flexShrink: 0,
        }}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className={styles.popoverDropdown}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value, opt.label);
                  setOpen(false);
                }}
                className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                style={{ opacity: opt.disabled ? 0.45 : 1, pointerEvents: opt.disabled ? 'none' : 'auto' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {opt.icon && (
                    <span style={{ display: 'flex', alignItems: 'center', color: isSelected ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opt.label}
                  </span>
                </div>
                {isSelected && <CheckIcon />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';
