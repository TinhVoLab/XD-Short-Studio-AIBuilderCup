import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { cacheDir } from '../config/paths.js';
import { generateSilenceAudio, concatAudioFiles } from './audioMixService.js';
import { projectStorage } from './projectStorageService.js';
import { uploadAudioToCloudStorage } from './cloudStorageService.js';
import { adminStorage } from '../middlewares/auth.js';
import { isPeakScene } from '../../src/config/sceneRoles.js';

const execAsync = promisify(exec);

/**
 * Text Normalizer & Sanitizer for Natural Vietnamese Speech & SSML Stability
 */
export function sanitizeTtsText(rawText) {
  if (!rawText || typeof rawText !== 'string') return 'Cảnh này chưa có lời thoại.';

  let text = rawText
    // 1. Remove emojis and non-standard symbols that crash Edge-TTS websocket/tokenizer
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // 2. Remove markdown artifacts (*, _, #, `, ~, >)
    .replace(/[\*\_#\`\~\>\[\]]/g, '')
    // 3. Percent & Currency symbols
    .replace(/(\d+)\s*%/g, '$1 phần trăm')
    .replace(/%/g, ' phần trăm ')
    .replace(/(\d+)\s*\$/g, '$1 đô la')
    .replace(/\$/g, ' đô la ')
    .replace(/(\d+)\s*k\b/gi, '$1 nghìn')
    .replace(/(\d+)\s*tr\b/gi, '$1 triệu')
    .replace(/(\d+)\s*đ\b/gi, '$1 đồng')
    .replace(/(\d+)\s*vnd\b/gi, '$1 Việt Nam đồng')
    .replace(/(\d+)\s*usd\b/gi, '$1 đô la Mỹ')
    // 4. Common Acronyms expanded with phonetic spacing for smooth Vietnamese pronunciation
    .replace(/\bAI\b/g, 'A I')
    .replace(/\bPDF\b/g, 'P D F')
    .replace(/\bRAG\b/g, 'R A G')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bSEO\b/g, 'S E O')
    .replace(/\bURL\b/g, 'U R L')
    .replace(/\bLLM\b/g, 'L L M')
    .replace(/\bUI\/UX\b/gi, 'U I U X')
    .replace(/\bUI\b/g, 'U I')
    .replace(/\bUX\b/g, 'U X')
    .replace(/\bHTML\b/g, 'H T M L')
    .replace(/\bCSS\b/g, 'C S S')
    .replace(/\bGPT\b/g, 'G P T')
    .replace(/\bTTS\b/g, 'T T S')
    .replace(/\bCEO\b/g, 'C E O')
    .replace(/\bCTO\b/g, 'C T O')
    .replace(/\bCMO\b/g, 'C M O')
    .replace(/\bSaaS\b/gi, 'SaaS')
    .replace(/\bB2B\b/gi, 'B 2 B')
    .replace(/\bB2C\b/gi, 'B 2 C')
    .replace(/\bKOL\b/gi, 'K O L')
    .replace(/\bKOC\b/gi, 'K O C')
    // 5. Clean whitespace & punctuation pauses (preserve ..., !, ?, , for acoustic expression)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s*([,;:!?])\s*/g, '$1 ')
    .replace(/\s*(\.{3})\s*/g, '... ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return text || 'Cảnh này chưa có lời thoại.';
}

/**
 * Async Non-blocking Audio Duration Measurement using ffprobe
 */
async function getAudioDurationServer(filePath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 8000 }
    );
    let dur = parseFloat(stdout.trim());

    if (isNaN(dur) || dur <= 0) {
      const { stdout: fmtOut } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
        { timeout: 8000 }
      );
      dur = parseFloat(fmtOut.trim());
    }

    return isNaN(dur) || dur <= 0 ? 3.5 : Math.round(dur * 100) / 100;
  } catch (err) {
    console.warn('ffprobe async duration check fallback:', err.message);
    return 3.5;
  }
}

/**
 * High-Performance Asynchronous Semaphore for Controlled Concurrency (Limit: 3)
 */
class AsyncSemaphore {
  constructor(maxConcurrency = 3) {
    this.max = maxConcurrency;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise((resolve) => this.queue.push(resolve));
    this.current++;
  }

  release() {
    this.current--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }

  async use(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const ttsSemaphore = new AsyncSemaphore(3);

/**
 * Edge-TTS Generator with High-Speed Parallel Semaphore, Cache Hit & Text Sanitization
 */
async function generateEdgeTtsAudio(text, voiceName = 'vi-VN-NamMinhNeural', options = {}) {
  const silenceGapSec = parseFloat(options.silenceGapSec) || 0;
  const silencePosition = options.silencePosition || 'before-key';
  
  // Calculate prosody rate based on temporalRole or explicit option
  let rate = options.rate;
  if (!rate && options.temporalRole) {
    if (options.temporalRole === 'hook') rate = '+8%';
    else if (isPeakScene(options.temporalRole)) rate = '-4%';
    else if (options.temporalRole === 'cta') rate = '+5%';
    else rate = '+0%';
  }
  const pitch = options.pitch || '+0Hz';

  const cleanText = sanitizeTtsText(text);

  // Hash key uses sanitized text + prosody to maximize cache hits
  const hash = crypto
    .createHash('md5')
    .update(`${cleanText}_${voiceName}_${rate || '0'}_${pitch}_silence_${silenceGapSec}_${silencePosition}`)
    .digest('hex');

  const cachedFilename = `edge-tts-${hash}.mp3`;
  const cachedFilePath = path.join(cacheDir, cachedFilename);
  const cachedMetaFilePath = path.join(cacheDir, `edge-tts-${hash}.json`);
  const projectId = options.projectId;
  const sceneId = options.sceneId;

  // Helper to ensure persistent copy in project folder if requested
  const finalizeResult = async (sourceAudioPath, wordTimings = []) => {
    const duration = await getAudioDurationServer(sourceAudioPath);
    let finalTimings = wordTimings;
    if (!finalTimings || finalTimings.length === 0) {
      if (fs.existsSync(cachedMetaFilePath)) {
        try {
          finalTimings = JSON.parse(fs.readFileSync(cachedMetaFilePath, 'utf-8'));
        } catch (e) {}
      }
    }
    if (projectId && sceneId) {
      const filename = projectStorage.getSceneVoiceFilename(sceneId);
      const projectFilePath = projectStorage.getProjectAudioPath(projectId, filename);
      try {
        fs.copyFileSync(sourceAudioPath, projectFilePath);
        const persistentUrl = projectStorage.getProjectAudioUrl(projectId, filename);
        return { url: persistentUrl, duration, wordTimings: finalTimings || [] };
      } catch (copyErr) {
        console.warn('[TTS] Failed to copy to project folder, using cache URL:', copyErr.message);
      }
    }
    const filename = path.basename(sourceAudioPath);
    // 1. Deliver via Firebase Storage Cloud CDN if configured
    if (adminStorage) {
      try {
        const cdnUrl = await uploadAudioToCloudStorage(sourceAudioPath, filename, 'edge-tts');
        if (cdnUrl) {
          return { url: cdnUrl, duration, wordTimings: finalTimings || [] };
        }
      } catch (cloudErr) {
        console.warn('[TTS] Cloud storage upload fallback:', cloudErr.message);
      }
    }
    // 2. Local fallback: use clean relative URL
    const fileUrl = `/uploads/cache/${filename}?t=${Date.now()}`;
    return { url: fileUrl, duration, wordTimings: finalTimings || [] };
  };

  // 1. Instant Cache Hit Check (< 5ms response time)
  if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 1000) {
    console.log(`⚡ [Edge-TTS Cache Hit] ${voiceName} (rate: ${rate || 'normal'}): "${cleanText.slice(0, 35)}..."`);
    return await finalizeResult(cachedFilePath);
  }

  // 2. Cache Miss: Execute under Semaphore concurrency pool (up to 3 parallel requests)
  return ttsSemaphore.use(async () => {
    // Re-check cache in case previous worker in pool just completed this exact request
    if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 1000) {
      return await finalizeResult(cachedFilePath);
    }

    console.log(`🎙️ [Edge-TTS Generating] ${voiceName} (rate: ${rate || 'default'}): "${cleanText.slice(0, 35)}..."`);
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const tempFilePath = path.join(cacheDir, `temp-${hash}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.mp3`);
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });

        const prosodyOptions = rate || pitch !== '+0Hz' ? { rate, pitch } : undefined;
        const { audioStream, metadataStream } = tts.toStream(cleanText, prosodyOptions);
        const writeStream = fs.createWriteStream(tempFilePath);

        const capturedTimings = [];
        if (metadataStream) {
          metadataStream.on('data', (chunk) => {
            try {
              const parsed = JSON.parse(chunk.toString());
              if (parsed.Metadata && Array.isArray(parsed.Metadata)) {
                for (const meta of parsed.Metadata) {
                  if (meta.Type === 'WordBoundary' && meta.Data) {
                    const offsetTicks = meta.Data.Offset || 0;
                    const durationTicks = meta.Data.Duration || 0;
                    const wordText = meta.Data.text?.Text || '';
                    capturedTimings.push({
                      word: wordText,
                      startSec: Math.round((offsetTicks / 10000000) * 1000) / 1000,
                      endSec: Math.round(((offsetTicks + durationTicks) / 10000000) * 1000) / 1000,
                    });
                  }
                }
              }
            } catch (e) {}
          });
        }

        await new Promise((resolve, reject) => {
          audioStream.pipe(writeStream);
          audioStream.on('error', (err) => {
            writeStream.destroy();
            reject(err);
          });
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size > 600) {
          const shiftSec = (silenceGapSec > 0 && silencePosition !== 'end') ? silenceGapSec : 0;
          const adjustedTimings = shiftSec > 0
            ? capturedTimings.map(t => ({
                ...t,
                startSec: Math.round((t.startSec + shiftSec) * 1000) / 1000,
                endSec: Math.round((t.endSec + shiftSec) * 1000) / 1000
              }))
            : capturedTimings;

          try {
            fs.writeFileSync(cachedMetaFilePath, JSON.stringify(adjustedTimings, null, 2));
          } catch (metaErr) {
            console.warn('[TTS] Failed to cache wordTimings JSON:', metaErr.message);
          }

          if (silenceGapSec > 0) {
            const silencePath = generateSilenceAudio(silenceGapSec);
            const audioList =
              silencePosition === 'end' ? [tempFilePath, silencePath] : [silencePath, tempFilePath];

            const mergedTemp = path.join(cacheDir, `merged-${hash}-${Date.now()}.mp3`);
            const success = concatAudioFiles(audioList, mergedTemp);
            if (success && fs.existsSync(mergedTemp) && fs.statSync(mergedTemp).size > 600) {
              fs.renameSync(mergedTemp, cachedFilePath);
              try { fs.unlinkSync(tempFilePath); } catch (e) {}
            } else {
              fs.renameSync(tempFilePath, cachedFilePath);
            }
          } else {
            fs.renameSync(tempFilePath, cachedFilePath);
          }

          console.log(`✅ [Edge-TTS Success] ${voiceName} (${adjustedTimings.length} words timed)`);
          return await finalizeResult(cachedFilePath, adjustedTimings);
        } else {
          throw new Error('Dữ liệu âm thanh nhận được bị rỗng hoặc chưa hoàn tất');
        }
      } catch (err) {
        lastError = err;
        if (fs.existsSync(tempFilePath)) {
          try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
        console.warn(`⚠️ [Edge-TTS Attempt ${attempt}/${maxRetries}]: ${err.message || err}`);
        if (attempt < maxRetries) {
          // Exponential backoff with random jitter
          await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt) + Math.random() * 200));
        }
      }
    }

    throw new Error('Lỗi kết nối máy chủ giọng đọc Edge-TTS: ' + (lastError?.message || 'Unknown error'));
  });
}

export { getAudioDurationServer, generateEdgeTtsAudio };
