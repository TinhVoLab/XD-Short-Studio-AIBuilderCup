import React from 'react';
import { Button } from '../Button';
import { Select, SelectOption } from '../Select';
import styles from './FilterTabs.module.css';

export interface FilterTabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string | React.ReactNode;
  readonly badge?: number | string;
}

export interface FilterTabsProps<T extends string = string> {
  tabs: readonly FilterTabItem[] | FilterTabItem[];
  activeId: T;
  onChange: (id: T) => void;
  size?: 'xs' | 'sm';
  wrap?: boolean;
  asSelect?: boolean;
  selectThreshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FilterTabs<T extends string = string>({
  tabs,
  activeId,
  onChange,
  size = 'xs',
  wrap = true,
  asSelect = false,
  selectThreshold = 5,
  className = '',
  style,
}: FilterTabsProps<T>) {
  // If asSelect is enabled and tab count exceeds threshold, render as sleek native select
  const shouldRenderAsSelect = asSelect && tabs.length > selectThreshold;

  if (shouldRenderAsSelect) {
    const selectOptions: SelectOption[] = tabs.map((tab: FilterTabItem) => ({
      value: tab.id,
      label: tab.badge !== undefined ? `${tab.label} (${tab.badge})` : tab.label,
    }));

    return (
      <div style={{ width: '100%', marginBottom: 8, ...style }} className={className}>
        <Select
          size={size === 'xs' ? 'sm' : 'md'}
          native
          fullWidth
          options={selectOptions}
          value={activeId}
          onChange={(val) => onChange(val as T)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.filterContainer} ${wrap ? styles.wrap : styles.noWrap} ${className}`}
      style={style}
    >
      {tabs.map((tab: FilterTabItem) => {
        const isActive = tab.id === activeId;
        return (
          <Button
            key={tab.id}
            variant="pill"
            size={size}
            selected={isActive}
            onClick={() => onChange(tab.id as T)}
            leftIcon={tab.icon}
            style={{ flexShrink: 0 }}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`${styles.tabBadge} ${isActive ? styles.tabBadgeActive : styles.tabBadgeInactive}`}>
                {tab.badge}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
