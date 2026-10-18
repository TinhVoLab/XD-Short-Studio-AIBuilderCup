import { Easing, interpolate, random, spring } from 'remotion';
import { AnimPresetType } from '../../types/scene';

/**
 * Bảng preset animation dùng chung cho enter (t: 0 → 1) và exit (chạy ngược t: 1 → 0).
 * Mọi giá trị là hàm thuần của frame để preview và render khớp nhau tuyệt đối.
 */

export interface AnimPose {
  opacity: number;   // hệ số nhân với el.opacity
  dx: number;        // px
  dy: number;        // px
  scale: number;     // hệ số nhân với scaleX/scaleY
  rotate: number;    // deg, cộng vào el.angle
  rotateX: number;   // deg
}

export const IDENTITY_POSE: AnimPose = { opacity: 1, dx: 0, dy: 0, scale: 1, rotate: 0, rotateX: 0 };

const PRESET_ALIASES: Record<string, AnimPresetType> = {
  fade: 'fade-in',
  'bounce-in': 'bounce',
  'zoom': 'zoom-in',
  'flip': 'flip-x',
  'shake': 'kinetic-shake',
};

export function normalizeAnimPreset(preset?: string | null): AnimPresetType {
  if (!preset) return 'slide-up';
  return PRESET_ALIASES[preset] || preset;
}

const SLIDE_DISTANCE = 32;
const POWER4_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Tính tư thế của element tại localFrame (tính từ lúc animation bắt đầu).
 * Trả về IDENTITY_POSE khi animation đã kết thúc.
 */
export function getPresetPose(
  rawPreset: string | undefined,
  localFrame: number,
  durFrames: number,
  fps: number,
  seedKey: string
): AnimPose {
  const preset = normalizeAnimPreset(rawPreset);
  if (preset === 'none' || preset === 'typewriter' || localFrame >= durFrames) return IDENTITY_POSE;
  if (localFrame < 0) return { ...IDENTITY_POSE, opacity: 0 };

  const progress = interpolate(localFrame, [0, Math.max(1, durFrames)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ease = POWER4_OUT(progress);
  const springOf = (damping: number, mass: number, stiffness: number) =>
    spring({ fps, frame: localFrame, durationInFrames: durFrames, config: { damping, mass, stiffness } });
  const pose: AnimPose = { ...IDENTITY_POSE, opacity: ease };

  switch (preset) {
    case 'slide-up':
      pose.dy = SLIDE_DISTANCE * (1 - ease);
      break;
    case 'slide-down':
      pose.dy = -SLIDE_DISTANCE * (1 - ease);
      break;
    case 'slide-left':
      pose.dx = SLIDE_DISTANCE * (1 - ease);
      break;
    case 'slide-right':
      pose.dx = -SLIDE_DISTANCE * (1 - ease);
      break;
    case 'fade-in':
      break;
    case 'zoom-in':
      pose.scale = 0.88 + 0.12 * springOf(18, 0.7, 140);
      break;
    case 'zoom-out':
      pose.scale = 1.12 - 0.12 * ease;
      break;
    case 'bounce': {
      const spr = springOf(14, 0.7, 160);
      pose.scale = 0.85 + 0.15 * spr;
      pose.dy = -14 * (1 - spr);
      break;
    }
    case 'pop-in':
      pose.scale = 0.82 + 0.18 * springOf(12, 0.6, 200);
      break;
    case 'elastic':
      pose.scale = 0.92 + 0.08 * springOf(14, 0.8, 180);
      break;
    case 'rotate':
      pose.rotate = -15 * (1 - ease);
      break;
    case 'flip-x':
      pose.rotateX = 90 * (1 - ease);
      break;
    case 'kinetic-shake':
      pose.dx = Math.sin(localFrame * 1.9) * 8 * (1 - ease);
      break;
    case 'glitch':
      pose.opacity = random(`glitch-o-${seedKey}-${localFrame}`) > 0.15 ? 1 : 0.4;
      pose.dy = (random(`glitch-y-${seedKey}-${localFrame}`) - 0.5) * 6;
      break;
    default:
      break;
  }

  return pose;
}
