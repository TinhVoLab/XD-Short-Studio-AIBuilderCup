import React, { useState, useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface LiveMarkerHighlightProps {
  children: React.ReactNode;
  color: string;
  delayFrames?: number;
  type?: 'circle' | 'underline';
  strokeWidth?: number;
}

export const LiveMarkerHighlight: React.FC<LiveMarkerHighlightProps> = ({
  children,
  color,
  delayFrames = 0,
  type = 'circle',
  strokeWidth = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [pathLength, setPathLength] = useState(type === 'circle' ? 600 : 300);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const drawProgress = spring({
    fps,
    frame: frame - delayFrames,
    config: { damping: 14, mass: 0.6, stiffness: 80 },
  });

  const strokeDashoffset = interpolate(drawProgress, [0, 1], [pathLength, 0], {
    extrapolateRight: 'clamp',
  });

  const pathD = type === 'circle' 
    ? "M 10,50 C 10,20 40,10 90,10 C 160,10 190,30 190,50 C 190,80 140,90 80,90 C 30,90 10,70 15,45"
    : "M 5,85 C 50,90 150,80 195,85";

  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
      
      {/* Absolute SVG overlay stretching to fit text */}
      <svg
        style={{
          position: 'absolute',
          top: type === 'circle' ? '-15%' : '0%',
          left: type === 'circle' ? '-10%' : '-5%',
          width: type === 'circle' ? '120%' : '110%',
          height: type === 'circle' ? '130%' : '100%',
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={strokeDashoffset}
          // LÝ DO BÀI TEST THÀNH CÔNG NẰM Ở ĐÂY:
          vectorEffect="non-scaling-stroke" 
        />
      </svg>
    </span>
  );
};
