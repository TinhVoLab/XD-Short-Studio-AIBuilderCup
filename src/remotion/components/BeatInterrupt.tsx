import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { NarrativeBeat } from '../../types/scene';
import type { BeatSchedule } from '../../utils/beatTimeline';
import { normalizeTimelineWord } from '../../utils/wordTimeline';

/**
 * Chữ nhịp giữ chân phủ màn hình lúc mở cảnh (rehook đập vào, payoff dâng lên),
 * từng từ nảy đúng lúc giọng đọc nói tới, rồi rút đi theo lịch scheduleBeat().
 * Không dùng filter/backdrop-filter (renderPerformance): nền lót là màu đặc có alpha.
 */
const PULSE_FRAMES = 10;
const PULSE_SCALE = 0.12;

interface Props {
  beat: NarrativeBeat;
  schedule: BeatSchedule;
  accentColor: string;
  textColor: string;
  /** Nền lót phủ cảnh, đã có alpha */
  backdrop: string;
}

export const BeatInterrupt: React.FC<Props> = ({ beat, schedule, accentColor, textColor, backdrop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const holdFrame = Math.round(schedule.holdUntilSec * fps);
  const endFrame = Math.max(holdFrame + 1, Math.round(schedule.endSec * fps));
  if (frame >= endFrame) return null;

  const isRehook = beat.kind === 'rehook';
  const enter = spring({ fps, frame, config: isRehook ? { damping: 11, stiffness: 260, mass: 0.5 } : { damping: 16, stiffness: 140, mass: 0.6 } });
  const exit = interpolate(frame, [holdFrame, endFrame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // rehook: đập từ to về đúng cỡ, nghiêng nhẹ rồi thẳng lại; payoff: dâng lên từ dưới
  const enterScale = isRehook ? interpolate(enter, [0, 1], [1.45, 1]) : 1;
  const enterY = isRehook ? 0 : interpolate(enter, [0, 1], [22, 0]);
  const enterRotate = isRehook ? interpolate(enter, [0, 1], [-4, 0]) : 0;
  const exitScale = isRehook ? 1 + exit * 0.08 : 1;
  const exitY = isRehook ? 0 : -exit * 14;
  const opacity = Math.min(enter * 1.6, 1) * (1 - exit);
  const barWidth = interpolate(enter, [0, 1], [0, 72], { extrapolateRight: 'clamp' });

  const wordStyle = (word: string): React.CSSProperties => {
    const at = schedule.wordRevealSec[normalizeTimelineWord(word)];
    if (at === undefined) return { display: 'inline-block' };
    const t = (frame - Math.round(at * fps)) / PULSE_FRAMES;
    const pulse = t >= 0 && t <= 1 ? 1 + PULSE_SCALE * Math.sin(Math.PI * t) : 1;
    return {
      display: 'inline-block',
      color: t >= 0 ? accentColor : undefined,
      transform: pulse === 1 ? undefined : `scale(${pulse.toFixed(4)})`,
    };
  };

  return (
    <AbsoluteFill style={{ zIndex: 150, pointerEvents: 'none', background: backdrop, opacity }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transform: `translateY(-50%) translateY(${(enterY + exitY).toFixed(2)}px) scale(${(enterScale * exitScale).toFixed(4)}) rotate(${enterRotate.toFixed(2)}deg)`,
        willChange: 'transform, opacity',
      }}>
        {schedule.lines.map((line, i) => (
          <div key={i} style={{
            fontFamily: 'Be Vietnam Pro', fontWeight: 900, fontSize: schedule.fontSize, lineHeight: 1.08,
            color: !isRehook && i === schedule.lines.length - 1 ? accentColor : textColor,
            textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: isRehook ? '-0.01em' : '0',
            textShadow: '0 2px 10px rgba(0,0,0,0.35)',
          }}>
            {line.split(' ').map((word, k) => (
              <React.Fragment key={k}>
                {k > 0 ? ' ' : null}
                <span style={wordStyle(word)}>{word}</span>
              </React.Fragment>
            ))}
          </div>
        ))}
        {isRehook && <div style={{ width: barWidth, height: 4, borderRadius: 2, background: accentColor, marginTop: 6 }} />}
      </div>
    </AbsoluteFill>
  );
};
