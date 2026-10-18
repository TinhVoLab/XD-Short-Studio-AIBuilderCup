import type { NarrativeBeat } from '@/types/scene'
import { measureTextWidth } from '@/config/textMetrics'
import { formatTypographicText } from '@/config/hookTypography'
import { resolveWordRevealMap, splitWords, type WordTime } from './wordTimeline'

/**
 * Lịch hiện chữ nhịp giữ chân (BeatInterrupt) của một cảnh — hàm thuần để test được.
 * Chữ phủ màn hình lúc mở cảnh, từng từ nảy khi giọng đọc nói tới, rồi rút đi để nhường widget.
 */

/** Giữ chữ ít nhất ngần này giây dù giọng đọc nói xong sớm */
export const BEAT_MIN_HOLD_SEC = 1.3
/** Không bao giờ che quá tỉ lệ này của cảnh */
export const BEAT_MAX_SHARE = 0.45
export const BEAT_EXIT_SEC = 0.25
/** Sau từ cuối được nói, giữ thêm ngần này giây rồi mới rút */
const AFTER_LAST_WORD_SEC = 0.5
/** Bề rộng một dòng chữ (safe zone 340 trừ lề) và dải cỡ chữ */
export const BEAT_LINE_WIDTH = 300
export const BEAT_FONT = { min: 30, max: 60 }
const BEAT_FONT_WEIGHT = 900

export interface BeatSchedule {
  /** Dòng chữ đã định dạng (1–2 dòng) */
  lines: string[]
  fontSize: number
  /** Từ chuẩn hoá → giây giọng đọc nói tới (chỉ các từ tìm thấy trong lời thoại) */
  wordRevealSec: Record<string, number>
  /** Giây bắt đầu rút chữ */
  holdUntilSec: number
  /** Giây chữ biến mất hẳn */
  endSec: number
}

/** rehook gào lên (in hoa), payoff điềm tĩnh (editorial) */
export function formatBeatTitle(beat: NarrativeBeat): string {
  return formatTypographicText(beat.title, beat.kind === 'rehook' ? 'uppercase' : 'editorial')
}

/** Tối đa 2 dòng, chia cân theo số từ; 1–2 từ thì một dòng */
export function splitBeatLines(words: string[]): string[] {
  if (words.length <= 2) return [words.join(' ')]
  const cut = Math.ceil(words.length / 2)
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
}

/** Cỡ chữ lớn nhất trong [min, max] mà mọi dòng vừa BEAT_LINE_WIDTH */
export function fitBeatFontSize(lines: string[]): number {
  for (let fs = BEAT_FONT.max; fs > BEAT_FONT.min; fs--) {
    if (lines.every(l => measureTextWidth(l, fs, { weight: BEAT_FONT_WEIGHT }) <= BEAT_LINE_WIDTH)) return fs
  }
  return BEAT_FONT.min
}

export function scheduleBeat(
  beat: NarrativeBeat,
  voiceoverText: string | undefined | null,
  timeline: WordTime[],
  sceneDurationSec: number
): BeatSchedule {
  const words = splitWords(formatBeatTitle(beat))
  const lines = splitBeatLines(words)
  const fontSize = fitBeatFontSize(lines)
  const wordRevealSec = resolveWordRevealMap(beat.title, voiceoverText, timeline)
  const spoken = Object.values(wordRevealSec)
  const lastSpokenSec = spoken.length > 0 ? Math.max(...spoken) : 0
  const cap = Math.max(0.8, sceneDurationSec * BEAT_MAX_SHARE)
  const holdUntilSec = Math.min(cap, Math.max(BEAT_MIN_HOLD_SEC, lastSpokenSec + AFTER_LAST_WORD_SEC))
  return {
    lines,
    fontSize,
    wordRevealSec,
    holdUntilSec: Math.round(holdUntilSec * 100) / 100,
    endSec: Math.round((holdUntilSec + BEAT_EXIT_SEC) * 100) / 100,
  }
}
