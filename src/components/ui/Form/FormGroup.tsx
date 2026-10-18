import React from 'react';
import styles from './FormGroup.module.css';
import { InfoTooltip } from '../Tooltip';

export interface FormGroupProps {
  label?: React.ReactNode;
  badge?: React.ReactNode;
  tooltip?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  action?: React.ReactNode;
  inline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  badge,
  tooltip,
  description,
  error,
  required = false,
  action,
  inline = false,
  className = '',
  style,
  children,
}) => {
  return (
    <div
      className={`${styles.formGroup} ${inline ? styles.inline : ''} ${className}`}
      style={style}
    >
      {(label || action) && (
        <div className={styles.headerRow}>
          {label && (
            <div className={styles.labelWrapper}>
              <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
              </label>
              {badge && <span className={styles.badge}>{badge}</span>}
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
          )}
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}

      {description && !inline && (
        <div className={styles.description}>{description}</div>
      )}

      <div className={styles.controlWrapper}>{children}</div>

      {error && !inline && <div className={styles.error}>{error}</div>}
    </div>
  );
};
