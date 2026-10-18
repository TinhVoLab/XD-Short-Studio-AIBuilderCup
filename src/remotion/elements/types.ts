import React from 'react';
import { SceneElement } from '../../types/scene';

export interface ElementProps {
  el: SceneElement;
  computedStyle: React.CSSProperties; // Legacy
  positionStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  content?: string;
}

export type AdvElementProps = ElementProps & {
  frame: number;
  fps: number;
  delayFrames?: number;
  durFrames?: number;
  sceneDuration?: number;
  wordTimings?: Array<{ word: string; startSec: number; endSec: number }>;
};
