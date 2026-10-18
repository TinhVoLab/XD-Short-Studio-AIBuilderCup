import { SMART_REPLACEMENTS } from '../../../../src/config/aiBannedWordsConfig.js';
import { estimateSceneDurationSec } from '../../../../src/config/pacingConfig.js';

const regexCache = new Map();

function getCompiledRegex(phrase) {
  let cached = regexCache.get(phrase);
  if (!cached) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cached = new RegExp(escaped, 'gi');
    regexCache.set(phrase, cached);
  }
  cached.lastIndex = 0;
  return cached;
}

/**
 * Tự động lọc sạch và thay thế các từ cấm / sáo rỗng AI sang văn phong tự nhiên.
 * Từ điển SMART_REPLACEMENTS được import từ src/config/aiBannedWordsConfig.ts
 */
export function sanitizeBannedWords(text, userBannedWords = [], humanizerEnabled = true) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  const targets = new Map();

  // 1. If humanizer enabled, load default smart replacements
  if (humanizerEnabled) {
    for (const [phrase, repl] of Object.entries(SMART_REPLACEMENTS)) {
      targets.set(phrase.toLowerCase(), repl);
    }
  }

  // 2. User specific banned words
  if (Array.isArray(userBannedWords)) {
    userBannedWords.forEach(w => {
      if (typeof w === 'string' && w.trim()) {
        const lower = w.trim().toLowerCase();
        if (!targets.has(lower)) {
          targets.set(lower, SMART_REPLACEMENTS[lower] || '');
        }
      }
    });
  }

  if (targets.size === 0) return result;

  // Sort keys by length descending to match longer multi-word phrases first
  const sortedKeys = Array.from(targets.keys()).sort((a, b) => b.length - a.length);

  for (const phrase of sortedKeys) {
    const repl = targets.get(phrase);
    const regex = getCompiledRegex(phrase);

    if (repl) {
      result = result.replace(regex, (match) => {
        if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
          return repl.charAt(0).toUpperCase() + repl.slice(1);
        }
        return repl;
      });
    } else {
      result = result.replace(regex, '');
    }
  }

  // Clean redundant whitespace and fix space before punctuation
  result = result.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?:;])/g, '$1').trim();
  return result;
}

/**
 * Pacing Guard: Bảo toàn 100% ngữ nghĩa câu từ của AI.
 * TUYỆT ĐỐI KHÔNG dùng words.slice() cắt ngang xương câu văn (tránh hiện tượng 'Tỷ lệ lỗi từ chỉ!').
 * Remotion Studio tự động đồng bộ thời lượng cảnh theo độ dài audio (scene.duration = audioDuration + 0.4s),
 * do đó toàn bộ câu chữ và số liệu dẫn chứng phải được giữ trọn vẹn.
 */
export function applyPacingGuard(voiceover, targetWords = 20) {
  if (!voiceover || typeof voiceover !== 'string') return voiceover || '';
  const trimmed = voiceover.trim().replace(/\s{2,}/g, ' ');
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  // Ngưỡng trần an toàn cực đại chống AI lặp vô tận (runaway hallucination)
  const SAFETY_CEILING_WORDS = Math.max(45, Math.round(targetWords * 2.2));
  
  if (words.length <= SAFETY_CEILING_WORDS) {
    return trimmed;
  }

  // Chỉ khi AI viết một đoạn văn quá dài (> 45 từ trong 1 cảnh),
  // mới ngắt tại dấu chấm câu kết thúc an toàn (. ! ? không nằm trong số thập phân như 1.5% hay 4.0)
  // Tách SAU dấu câu (giữ lại dấu) — dấu chấm thập phân "1.5%" không bị tách vì không có khoảng trắng theo sau.
  // (Bản cũ tách tại chính dấu chấm nên làm mất dấu giữa các câu được giữ lại → TTS mất nhịp ngắt.)
  const sentenceEndRegex = /(?<=[.!?:…])\s+/;
  const sentences = trimmed.split(sentenceEndRegex);
  if (sentences.length > 1) {
    let accumulated = '';
    for (const sent of sentences) {
      const candidate = accumulated ? `${accumulated} ${sent}` : sent;
      const candidateWords = candidate.split(/\s+/).filter(w => w.length > 0).length;
      if (candidateWords > SAFETY_CEILING_WORDS) {
        if (accumulated.trim().length > 0) {
          const res = accumulated.trim();
          return res + (/[.!?]$/.test(res) ? '' : '.');
        }
        break;
      }
      accumulated = candidate;
    }
    if (accumulated.trim().length > 0) {
      const res = accumulated.trim();
      return res + (/[.!?]$/.test(res) ? '' : '.');
    }
  }

  return trimmed;
}

/**
 * PASS 3: Global Script Word Budget Guard
 * Đồng bộ thời lượng theo tốc độ đọc SSOT (src/config/pacingConfig.js).
 * TUYỆT ĐỐI KHÔNG dùng words.slice() để xén đuôi câu thoại.
 */
export function enforceGlobalScriptBudget(processedScenes, options = {}) {
  if (!options?.targetDuration || !Array.isArray(processedScenes) || processedScenes.length === 0) {
    return processedScenes;
  }

  // Điều chỉnh thời lượng từng cảnh khớp chuẩn với số từ thực tế của kịch bản
  processedScenes.forEach((scene) => {
    const text = (scene.voiceoverText || '').trim();
    if (!text) return;
    
    // Nếu cảnh chưa có thời lượng hợp lý, tự động gán theo tốc độ đọc SSOT + padding
    if (!scene.duration || scene.duration < 2.0) {
      scene.duration = estimateSceneDurationSec(text);
    }
  });

  return processedScenes;
}
