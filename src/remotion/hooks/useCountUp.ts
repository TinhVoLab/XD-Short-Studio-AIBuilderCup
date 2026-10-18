import React, { useMemo } from 'react';
import { spring, SpringConfig, measureSpring, Easing } from 'remotion';
import { getLandingEnvelope, getLandingTransformStyle, LandingFxType } from '../utils/landingFx';

export interface ParsedCountValue {
  prefix: string;
  suffix: string;
  targetNumber: number;
  isDecimal: boolean;
  decimalPlaces: number;
  rawValue: string;
}

export interface UseCountUpOptions {
  frame: number;
  fps: number;
  delayFrames?: number;
  durFrames?: number;
  mode?: 'spring' | 'timed';
  easing?: (t: number) => number;
  config?: Partial<SpringConfig>;
  allowOvershoot?: boolean;
  landingFx?: LandingFxType;
  accentColor?: string;
}

export interface UseCountUpResult {
  displayValue: string;
  currentNumber: number;
  targetNumber: number;
  progress: number;
  rawProgress: number;
  isComplete: boolean;
  landing: number;
  landingStyle: React.CSSProperties;
  prefix: string;
  suffix: string;
}

/**
 * Pure parsing function: extracts numeric values and prefix/suffix from strings
 * Handles: "88%", "$1,500", "+35.5M", "10X", "4.8/5", etc.
 */
export function parseCountValue(rawValue: string | number): ParsedCountValue {
  const strVal = String(rawValue ?? '0').replace(/[\[\]]/g, '').trim();

  const numMatch = strVal.match(/([\+\-]?[0-9,.]+)/);
  if (!numMatch) {
    return {
      prefix: '',
      suffix: '',
      targetNumber: 0,
      isDecimal: false,
      decimalPlaces: 0,
      rawValue: strVal,
    };
  }

  const numIndex = numMatch.index || 0;
  const numText = numMatch[1];
  let prefix = strVal.slice(0, numIndex).trim();
  let suffix = strVal.slice(numIndex + numText.length).trim();

  // If number had a leading + that was captured in numText, preserve it in prefix
  if (numText.startsWith('+') && !prefix.includes('+')) {
    prefix = '+' + prefix;
  }

  if (!suffix) {
    if (strVal.includes('%')) suffix = '%';
    else if (strVal.toLowerCase().endsWith('x')) suffix = 'X';
  }

  const cleanNumStr = numText.replace(/[,\+]/g, '');
  const targetNumber = parseFloat(cleanNumStr) || 0;
  const isDecimal = cleanNumStr.includes('.');
  const decimalPlaces = isDecimal ? (cleanNumStr.split('.')[1]?.length || 1) : 0;

  return {
    prefix,
    suffix,
    targetNumber,
    isDecimal,
    decimalPlaces,
    rawValue: strVal,
  };
}

/**
 * Pure formatting function: formats animated current number according to parsed metadata
 */
export function formatCountValue(parsed: ParsedCountValue, currentNumber: number): string {
  if (!parsed) return '';
  if (!/[0-9]/.test(parsed.rawValue)) {
    return parsed.rawValue;
  }
  const num = typeof currentNumber === 'number' && !isNaN(currentNumber) ? currentNumber : 0;
  let formattedNum = '';
  if (parsed.isDecimal) {
    formattedNum = num.toFixed(parsed.decimalPlaces || 0);
  } else if (Math.abs(parsed.targetNumber) >= 1000) {
    formattedNum = Math.round(num).toLocaleString('en-US');
  } else {
    formattedNum = String(Math.round(num));
  }
  return `${parsed.prefix || ''}${formattedNum}${parsed.suffix || ''}`;
}

/**
 * useCountUp — Remotion Live Number Counter & Landing Animation Engine
 *
 * Automatically parses raw strings and animates smoothly with optional landing punch / glow.
 */
export function useCountUp(
  rawValue: string | number,
  options: UseCountUpOptions
): UseCountUpResult {
  const {
    frame,
    fps,
    delayFrames = 0,
    durFrames = 45,
    mode = 'spring',
    easing,
    config,
    allowOvershoot = false,
    landingFx = 'none',
    accentColor = '#BEFF01',
  } = options;

  const parsed = useMemo(() => parseCountValue(rawValue), [rawValue]);

  const springConfig = useMemo(() => ({
    damping: 14,
    mass: 0.6,
    stiffness: 100,
    ...config,
  }), [config]);

  // Determine completion frame & progress based on mode
  const { rawProgress, progress, completionFrame } = useMemo(() => {
    if (mode === 'timed') {
      const duration = durFrames || 45;
      const linear = Math.min(1, Math.max(0, (frame - delayFrames) / duration));
      const eased = easing ? easing(linear) : Easing.out(Easing.cubic)(linear);
      const safeEased = allowOvershoot ? eased : Math.min(1, Math.max(0, eased));
      return {
        rawProgress: eased,
        progress: safeEased,
        completionFrame: delayFrames + duration,
      };
    }

    // Spring mode
    const spr = spring({
      fps: fps || 30,
      frame: frame - delayFrames,
      config: springConfig,
    });
    const safeSpr = allowOvershoot ? spr : Math.min(1, Math.max(0, spr));
    const sprDuration = measureSpring({ fps: fps || 30, config: springConfig });

    return {
      rawProgress: spr,
      progress: safeSpr,
      completionFrame: delayFrames + sprDuration,
    };
  }, [mode, durFrames, frame, delayFrames, easing, allowOvershoot, fps, springConfig]);

  const currentNumber = parsed.targetNumber * progress;
  const displayValue = useMemo(() => formatCountValue(parsed, currentNumber), [parsed, currentNumber]);

  // Landing punch / glow envelope
  const landing = useMemo(() => {
    return getLandingEnvelope(frame, completionFrame, 12);
  }, [frame, completionFrame]);

  const landingStyle = useMemo(() => {
    return getLandingTransformStyle(landing, landingFx, accentColor);
  }, [landing, landingFx, accentColor]);

  return {
    displayValue,
    currentNumber,
    targetNumber: parsed.targetNumber,
    progress,
    rawProgress,
    isComplete: progress >= 0.99,
    landing,
    landingStyle,
    prefix: parsed.prefix,
    suffix: parsed.suffix,
  };
}
