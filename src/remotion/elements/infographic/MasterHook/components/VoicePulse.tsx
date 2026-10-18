import React, { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';
import { normalizeTimelineWord } from '@/utils/wordTimeline';

/**
 * Nhịp giọng đọc cho master-hook: tiêu đề vẫn xuất hiện nhanh như thường (3 giây đầu không được trống),
 * riêng từ được nhấn "nảy" nhẹ đúng lúc giọng đọc nói tới. Dữ liệu: el.hookWordRevealSec (SceneRenderer).
 */
const PULSE_FRAMES = 12;
const PULSE_SCALE = 0.14;

/** Từ chuẩn hoá → frame (theo cảnh) giọng đọc nói tới */
const VoicePulseContext = createContext<Record<string, number> | null>(null);

export const VoicePulseProvider: React.FC<{ revealSec?: Record<string, number>; fps: number; children: React.ReactNode }> = ({ revealSec, fps, children }) => {
  const frames = React.useMemo(() => {
    if (!revealSec) return null;
    return Object.fromEntries(Object.entries(revealSec).map(([w, sec]) => [w, Math.round(sec * fps)]));
  }, [revealSec, fps]);
  return <VoicePulseContext.Provider value={frames}>{children}</VoicePulseContext.Provider>;
};

/** Hệ số phóng của một từ (1 = đứng yên); cụm nhiều từ lấy từ được nói sớm nhất */
export function useVoicePulse(text: string): number {
  const frames = useContext(VoicePulseContext);
  const frame = useCurrentFrame();
  if (!frames) return 1;
  const hits = text.split(/\s+/).map(w => frames[normalizeTimelineWord(w)]).filter((f): f is number => f !== undefined);
  if (hits.length === 0) return 1;
  const t = (frame - Math.min(...hits)) / PULSE_FRAMES;
  return t >= 0 && t <= 1 ? 1 + PULSE_SCALE * Math.sin(Math.PI * t) : 1;
}

/** Bọc một từ nhấn: phóng nhẹ theo giọng đọc, không đổi layout (inline-block + transform) */
export const VoicePulse: React.FC<{ word: string; children: React.ReactNode }> = ({ word, children }) => {
  const scale = useVoicePulse(word);
  // Luôn cùng một cấu trúc DOM ở mọi frame để không xê dịch bố cục
  return <span style={{ display: 'inline-block', transform: scale === 1 ? undefined : `scale(${scale.toFixed(4)})` }}>{children}</span>;
};
