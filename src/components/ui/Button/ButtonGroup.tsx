import React from 'react';
import styles from './ButtonGroup.module.css';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  attached?: boolean;
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(({
  attached = true,
  orientation = 'horizontal',
  fullWidth = false,
  className = '',
  children,
  ...props
}, ref) => {
  const classes = [
    styles.group,
    orientation === 'vertical' ? styles.vertical : styles.horizontal,
    attached ? styles.attached : '',
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes} role="group" {...props}>
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';

export default ButtonGroup;
