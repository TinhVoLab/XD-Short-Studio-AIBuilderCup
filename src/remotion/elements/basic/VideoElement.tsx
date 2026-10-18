import React from 'react';
import { OffthreadVideo } from 'remotion';
import { MissingMediaFallback } from '../core/MissingMediaFallback';
import { SceneElement } from '../../../types/scene';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

interface VideoElementProps {
  el: SceneElement;
  computedStyle?: React.CSSProperties;
  positionStyle?: React.CSSProperties;
  frame: number;
  fps: number;
  delayFrames?: number;
  durFrames?: number;
  sceneDuration?: number;
}

export const VideoElement: React.FC<VideoElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  fps,
}) => {
  if (!el.src || (el as any).assetMissing) {
    return (
      <MissingMediaFallback
        kind="video"
        style={positionStyle}
        width={el.width || 240}
        height={el.height || 135}
        radius={el.borderRadius ?? 10}
      />
    );
  }

  const w = el.width || 240;
  const h = el.height || 135;
  const radius = el.borderRadius ?? 12;
  const hasBorder = (el.borderWidth ?? 0) > 0;
  const borderColor = el.borderColor || 'rgba(255, 255, 255, 0.2)';
  const borderWidth = el.borderWidth || 1;
  const objectFit = el.objectFit || 'cover';
  const startFrom = Math.max(0, Math.round((el.videoStartFromSec ?? 0) * fps));
  const volume = el.videoVolume ?? 0; // Default mute to preserve voiceover/bgm clarity

  const content = (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: radius,
        overflow: 'hidden',
        border: hasBorder ? `${borderWidth}px solid ${borderColor}` : undefined,
        boxShadow: el.imageShadowBlur
          ? `0 0 ${el.imageShadowBlur}px ${el.imageShadowColor || 'rgba(0,0,0,0.5)'}`
          : 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.4))',
        boxSizing: 'border-box',
        backgroundColor: '#000',
      }}
    >
      <OffthreadVideo
        src={el.src}
        startFrom={startFrom}
        playbackRate={el.videoPlaybackRate || 1}
        volume={volume}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
        }}
      />
    </div>
  );

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle}>
      {content}
    </RemotionElementWrapper>
  );
};
