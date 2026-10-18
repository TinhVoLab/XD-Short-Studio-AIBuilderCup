import type { Scene } from '@/types/scene'
import { speechSpanForScene } from '@/config/pacingConfig'
import { getTransitionSec } from './sceneTiming'

/**
 * Word timeline SSOT: mốc thời gian từng từ của lời thoại trong một cảnh.
 * - Có timestamps thật (Edge-TTS) → dùng trực tiếp.
 * - Không có (Gemini TTS, chưa tạo giọng) → ước lượng theo trọng số ký tự + dấu câu.
 * Dùng chung cho phụ đề, animation neo theo từ và SFX.
 */

export interface WordTime {
  word: string
  startSec: number
  endSec: number
}

const PUNCTUATION_PAUSE_WEIGHT = 4

export function splitWords(text: string | undefined | null): string[] {
  return (text || '').split(/\s+/).filter(w => w.trim().length > 0)
}

/** Ước lượng mốc từng từ trải đều trên durationSec, từ có dấu câu được thêm khoảng nghỉ */
export function estimateWordTimeline(text: string | undefined | null, durationSec: number): WordTime[] {
  const words = splitWords(text)
  if (words.length === 0 || durationSec <= 0) return []

  const weights = words.map(w => Math.max(1, w.length) + (/[.,?!;:…]$/.test(w) ? PUNCTUATION_PAUSE_WEIGHT : 0))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  let cursor = 0
  return words.map((word, i) => {
    const startSec = cursor
    cursor = i === words.length - 1 ? durationSec : cursor + (weights[i] / totalWeight) * durationSec
    return { word, startSec, endSec: cursor }
  })
}

export function resolveWordTimeline(
  text: string | undefined | null,
  wordTimings: WordTime[] | undefined | null,
  durationSec: number
): WordTime[] {
  if (Array.isArray(wordTimings) && wordTimings.length > 0) return wordTimings
  return estimateWordTimeline(text, durationSec)
}

const normalizeWord = (w: string) =>
  w.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, '')

/**
 * Tìm chỉ số từ đầu tiên khớp anchor (một từ hoặc cụm từ) trong lời thoại.
 * Trả về undefined nếu không tìm thấy để caller giữ animDelay mặc định.
 */
export function findAnchorWordIndex(text: string | undefined | null, anchor: string | undefined | null): number | undefined {
  const anchorTokens = splitWords(anchor).map(normalizeWord).filter(Boolean)
  if (anchorTokens.length === 0) return undefined
  const words = splitWords(text).map(normalizeWord)

  for (let i = 0; i <= words.length - anchorTokens.length; i++) {
    if (anchorTokens.every((tok, k) => words[i + k] === tok)) return i
  }
  return undefined
}

/** Giây bắt đầu của từ thứ index (kẹp vào biên), undefined nếu timeline rỗng */
export function wordStartSec(timeline: WordTime[], index: number | undefined): number | undefined {
  if (index === undefined || index === null || timeline.length === 0) return undefined
  const i = Math.max(0, Math.min(timeline.length - 1, Math.floor(index)))
  return timeline[i].startSec
}

/** Element bắt đầu vào sớm hơn từ khoá một chút để chuyển động "chạm" đúng lúc từ được đọc */
const ENTER_LEAD_SEC = 0.08

export interface WordAnchorFields {
  animDelay?: number
  enterOnWord?: number
  exitOnWord?: number
  emphasisOnWords?: number[]
}

/**
 * Quy đổi các neo theo từ của element sang giây (tính từ đầu cảnh).
 * Chỉ trả về field có neo hợp lệ để caller merge đè lên element.
 */
export function resolveElementWordAnchors(
  el: WordAnchorFields,
  timeline: WordTime[]
): { animDelay?: number; exitAtSec?: number; emphasisAtSec?: number[] } {
  const out: { animDelay?: number; exitAtSec?: number; emphasisAtSec?: number[] } = {}
  const enterSec = wordStartSec(timeline, el.enterOnWord)
  if (enterSec !== undefined) out.animDelay = Math.max(0, enterSec - ENTER_LEAD_SEC)

  const exitSec = wordStartSec(timeline, el.exitOnWord)
  if (exitSec !== undefined) out.exitAtSec = exitSec

  if (Array.isArray(el.emphasisOnWords) && el.emphasisOnWords.length > 0) {
    out.emphasisAtSec = el.emphasisOnWords
      .map(i => wordStartSec(timeline, i))
      .filter((t): t is number => t !== undefined)
  }
  return out
}

/**
 * Quy đổi gợi ý từ khoá của AI (anchorWord / emphasisWord) sang chỉ số từ trong lời thoại.
 * Dùng chung cho TypeSafe hydrator và wizard normalizer; xoá field gợi ý sau khi quy đổi.
 */
export function applyAiWordAnchors<T extends WordAnchorFields & { anchorWord?: string; emphasisWord?: string }>(
  el: T,
  voiceoverText: string | undefined | null
): T {
  if (!el.anchorWord && !el.emphasisWord) return el
  const { anchorWord, emphasisWord, ...rest } = el
  const next = { ...rest } as T
  if (next.enterOnWord === undefined) {
    const idx = findAnchorWordIndex(voiceoverText, anchorWord)
    if (idx !== undefined) next.enterOnWord = idx
  }
  if (!next.emphasisOnWords?.length) {
    const idx = findAnchorWordIndex(voiceoverText, emphasisWord)
    if (idx !== undefined) next.emphasisOnWords = [idx]
  }
  return next
}

/** Word timeline của một cảnh: timestamps TTS nếu có, không thì ước lượng trên khoảng giọng đọc */
export function getSceneWordTimeline(scene: Scene): WordTime[] {
  return resolveWordTimeline(
    scene.voiceoverText,
    scene.voiceoverWordTimings,
    speechSpanForScene(scene.duration || 3, getTransitionSec(scene))
  )
}

/** Hư từ tiếng Việt dài ≥ 4 ký tự — khớp ở khắp nơi nên không dùng làm mốc */
const VI_STOPWORDS = new Set([
  'những', 'trong', 'người', 'được', 'nhưng', 'cũng', 'chúng', 'mình', 'không', 'theo', 'hoặc',
  'nhiều', 'nhất', 'thêm', 'đang', 'phải', 'luôn', 'khiến', 'vào', 'nếu', 'thật', 'điều', 'việc', 'chính',
])

/** Từ mang nghĩa để dò trong lời thoại: ≥ 4 ký tự hoặc chứa chữ số, bỏ hư từ */
const isSignificantWord = (w: string) => (w.length >= 4 || /\d/.test(w)) && !VI_STOPWORDS.has(w)

/**
 * Giây xuất hiện của từng dòng (bullet) theo lời thoại: mỗi dòng xuất hiện khi giọng đọc tới
 * từ mang nghĩa đầu tiên của dòng đó. Dò tuần tự (dòng sau không thể xuất hiện trước dòng trước);
 * dòng không khớp → undefined để caller dùng nhịp stagger mặc định.
 */
export function resolveRowRevealTimes(
  rows: string[],
  voiceoverText: string | undefined | null,
  timeline: WordTime[]
): Array<number | undefined> {
  const voiceWords = splitWords(voiceoverText).map(normalizeWord)
  if (voiceWords.length === 0 || timeline.length === 0) return rows.map(() => undefined)

  let cursor = 0
  let lastSec = 0
  return rows.map(row => {
    const keys = new Set(splitWords(row).map(normalizeWord).filter(w => w && isSignificantWord(w)))
    if (keys.size === 0) return undefined
    for (let i = cursor; i < voiceWords.length; i++) {
      if (keys.has(voiceWords[i])) {
        cursor = i + 1
        const sec = wordStartSec(timeline, i)
        if (sec === undefined) return undefined
        lastSec = Math.max(lastSec, sec - ENTER_LEAD_SEC)
        return lastSec
      }
    }
    return undefined
  })
}

/**
 * Mốc giọng đọc nói tới từng từ của một cụm chữ (vd tiêu đề master-hook) → { từ chuẩn hoá: giây }.
 * Layout tra theo từ nên không phụ thuộc cách tách dòng; từ không khớp (hư từ, AI viết khác lời thoại)
 * vắng mặt trong map → layout giữ nhịp xuất hiện mặc định.
 */
export function resolveWordRevealMap(
  text: string | undefined | null,
  voiceoverText: string | undefined | null,
  timeline: WordTime[]
): Record<string, number> {
  const words = splitWords(text)
  const times = resolveRowRevealTimes(words, voiceoverText, timeline)
  const map: Record<string, number> = {}
  words.forEach((w, i) => {
    const key = normalizeWord(w)
    if (key && times[i] !== undefined && map[key] === undefined) map[key] = times[i] as number
  })
  return map
}

export { normalizeWord as normalizeTimelineWord }
