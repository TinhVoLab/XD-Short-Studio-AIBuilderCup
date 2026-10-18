import React, { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 100,
  className = '',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (!content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content) {
    return <>{children}</>;
  }

  const posClass = styles[position] || styles.top;

  return (
    <div
      className={`${styles.tooltipContainer} ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <div
        role="tooltip"
        className={`${styles.tooltipBubble} ${posClass} ${isVisible ? styles.visible : ''}`}
      >
        {content}
      </div>
    </div>
  );
};

export interface InfoTooltipProps {
  content?: React.ReactNode;
  text?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: number;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  text,
  position = 'top',
  size = 12,
  className = '',
}) => {
  const actualContent = content || text;
  if (!actualContent) return null;

  return (
    <Tooltip content={actualContent} position={position} className={className}>
      <span className={styles.infoTrigger} tabIndex={0} aria-label="Thông tin chi tiết">
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
    </Tooltip>
  );
};
