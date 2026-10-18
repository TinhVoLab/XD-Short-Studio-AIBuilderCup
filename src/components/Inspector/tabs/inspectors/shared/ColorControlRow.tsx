import React from 'react';
import styles from '../../Tabs.module.css';
import { ColorDot } from '../common';

export interface ColorControlRowProps {
  label: string;
  value?: string;
  onChange: (color: string) => void;
  style?: React.CSSProperties;
  sm?: boolean;
}

export const ColorControlRow: React.FC<ColorControlRowProps> = ({
  label,
  value = '#BEFF01',
  onChange,
  style,
  sm,
}) => {
  return (
    <div className={styles.toggleRow} style={{ marginBottom: 6, ...style }}>
      <span className={styles.sliderLabel}>{label}</span>
      <div className={styles.trRight}>
        <ColorDot value={value} onChange={onChange} sm={sm} />
      </div>
    </div>
  );
};
