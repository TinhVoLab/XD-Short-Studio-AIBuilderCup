import React from 'react';
import styles from './FormRow.module.css';

export interface FormRowProps {
  columns?: 2 | 3 | 4 | 'auto';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const FormRow: React.FC<FormRowProps> = ({
  columns = 2,
  className = '',
  style,
  children,
}) => {
  let colClass = '';
  if (columns === 3) colClass = styles.cols3;
  else if (columns === 4) colClass = styles.cols4;
  else if (columns === 'auto') colClass = styles.colsAuto;

  return (
    <div className={`${styles.formRow} ${colClass} ${className}`} style={style}>
      {children}
    </div>
  );
};
