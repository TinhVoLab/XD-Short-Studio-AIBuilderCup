import React from 'react';
import { SceneElement } from '@/types/scene';

interface RemotionElementWrapperProps {
  el: SceneElement;
  positionStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export const RemotionElementWrapper: React.FC<RemotionElementWrapperProps> = ({
  el,
  positionStyle,
  children
}) => {
  return (
    <div
      className={`remotion-element-wrapper type-${el.type}`}
      style={positionStyle}
    >
      {children}
    </div>
  );
};
