import React from 'react'
import styles from '../Tabs.module.css'
import { SceneElement } from '@/types/scene'
import { SegmentedControl, Select, SelectOption, Button } from '@/components/ui'

export interface InspectorProps {
  element: SceneElement;
  updateElement: (id: string, patch: Partial<SceneElement>) => void;
  showToast: (msg: string) => void;
  setInspector: (patch: any) => void;
  inspector: any;
}

export function DeleteIconButton({ onClick, title = 'Xóa mục này', disabled }: { onClick: () => void; title?: string; disabled?: boolean }) {
  return (
    <Button
      asIcon
      variant="danger"
      size="icon-xs"
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </Button>
  );
}

export function toHexColor(colorStr?: string, fallback = '#00D4FF'): string {
  if (!colorStr || typeof colorStr !== 'string') return fallback;
  const str = colorStr.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(str)) return str;
  if (/^#[0-9A-Fa-f]{3}$/.test(str)) {
    return `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`;
  }
  if (/^#[0-9A-Fa-f]{8}$/.test(str)) {
    return str.slice(0, 7);
  }
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = Math.min(255, parseInt(match[1], 10)).toString(16).padStart(2, '0');
    const g = Math.min(255, parseInt(match[2], 10)).toString(16).padStart(2, '0');
    const b = Math.min(255, parseInt(match[3], 10)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return fallback;
}

export function ColorDot({ value, onChange, sm }: { value: string; onChange: (c: string) => void; sm?: boolean }) {
  const hexVal = toHexColor(value);
  const size = sm ? 20 : 24;
  return (
    <label className={styles.colorDot}>
      <input
        type="color"
        value={hexVal}
        onChange={e => onChange(e.target.value)}
        className={styles.colorDotInput}
      />
      <span
        className={styles.colorDotSwatch}
        style={{
          width: size,
          height: size,
          background: value || '#fff',
        }}
      />
    </label>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const safeVal = isNaN(value) ? min : value;
  const roundedVal = step >= 1 ? Math.round(safeVal) : Math.round(safeVal * 10) / 10;
  return (
    <div className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={roundedVal}
        onChange={e => onChange(step >= 1 ? Math.round(+e.target.value) : +e.target.value)}
      />
      <span className={styles.sliderVal}>{display(roundedVal)}</span>
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={styles.tgl} />
    </label>
  )
}

export function ToggleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <div className={styles.trRight}>{children}</div>
    </div>
  )
}

export function AlignRow({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  const opts = [
    { value: 'left', label: '', icon: <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 3.5H11M2 6.5H8M2 9.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>, title: 'Căn trái' },
    { value: 'center', label: '', icon: <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 3.5H11M3.5 6.5H9.5M1.5 9.5H11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>, title: 'Căn giữa' },
    { value: 'right', label: '', icon: <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 3.5H11M5 6.5H11M3 9.5H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>, title: 'Căn phải' },
    { value: 'justify', label: '', icon: <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 3.5H11M2 6.5H11M2 9.5H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>, title: 'Căn đều' },
  ];
  return (
    <SegmentedControl
      options={opts}
      value={value || 'center'}
      onChange={onChange}
      size="xs"
      fullWidth
    />
  );
}

export type StudioSelectOption = SelectOption;

export function StudioSelect({
  value,
  options,
  onChange,
  placeholder = 'Chọn...',
}: {
  value: string;
  options: StudioSelectOption[];
  onChange: (val: string, label?: string) => void;
  placeholder?: string;
}) {
  return (
    <Select
      size="sm"
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      style={{ marginBottom: 10 }}
    />
  );
}

export * from './shared';


