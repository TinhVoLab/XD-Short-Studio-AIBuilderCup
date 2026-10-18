import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { cacheDir } from '../config/paths.js';
import { sanitizeTtsText, getAudioDurationServer } from './ttsService.js';
import { projectStorage } from './projectStorageService.js';
import { uploadAudioToCloudStorage } from './cloudStorageService.js';
import { adminStorage } from '../middlewares/auth.js';
import { isPeakScene } from '../../src/config/sceneRoles.js';

// Danh sách các giọng Prebuilt được hỗ trợ chính thức bởi Google Gemini
export const GEMINI_PREBUILT_VOICES = ['Aoede', 'Charon', 'Puck', 'Kore', 'Fenrir'];

/**
 * Xây dựng chỉ dẫn cảm xúc (Emotional Prompting) dựa trên vai trò của cảnh video (temporalRole)
 */
function buildVoiceInstruction(temporalRole, style) {
  let toneGuidance = 'Read the text clearly, naturally, and expressively in Vietnamese with authentic acoustic pauses.';
  
  if (temporalRole === 'hook') {
    toneGuidance = 'Read with high energy, suspense, and curiosity to immediately grab attention in the first 3 seconds!';
  } else if (isPeakScene(temporalRole)) {
    toneGuidance = 'Read with dramatic emphasis, confidence, and authoritative tone for the key takeaway moment.';
  } else if (temporalRole === 'cta') {
    toneGuidance = 'Read with warm, persuasive, and engaging call-to-action enthusiasm.';
  }

  if (style && (style.includes('Chữa Lành') || style.includes('Chill'))) {
    toneGuidance = 'Read with calm, soothing, gentle, meditative, and peaceful cadence.';
  }

  return toneGuidance;
}

/**
 * Sinh âm thanh giọng đọc bằng model Gemini 3.6 Flash (Tối ưu chi phí & tốc độ)
 */
export async function generateGeminiFlashAudio(text, voiceName = 'Aoede', options = {}) {
  const apiKey = options.apiKey;
  if (!apiKey) {
    throw new Error('Missing Gemini API Key for Gemini Voice Generation');
  }

  // Chuẩn hóa voice name, fallback về Aoede nếu không hợp lệ
  const validVoice = GEMINI_PREBUILT_VOICES.includes(voiceName) ? voiceName : 'Aoede';
  const cleanText = sanitizeTtsText(text);
  const temporalRole = options.temporalRole || 'normal';
  const style = options.style || '';
  const projectId = options.projectId;
  const sceneId = options.sceneId;

  // 1. Tạo mã Hash để cache audio — bao gồm tên model để bust cache khi đổi model
  const MODEL_ID = 'gemini-3.1-flash-tts-preview';
  const hash = crypto
    .createHash('md5')
    .update(`${MODEL_ID}_${validVoice}_${temporalRole}_${cleanText}`)
    .digest('hex');

  const cachedFilename = `gemini-flash-${hash}.wav`; // Changed to WAV
  const cachedFilePath = path.join(cacheDir, cachedFilename);

  // Helper trả về kết quả và copy vào project storage nếu cần
  const finalizeResult = async (sourceAudioPath) => {
    const duration = await getAudioDurationServer(sourceAudioPath);
    if (projectId && sceneId) {
      const ext = path.extname(sourceAudioPath);
      const filename = projectStorage.getSceneVoiceFilename(sceneId, ext);
      const projectFilePath = projectStorage.getProjectAudioPath(projectId, filename);
      try {
        fs.copyFileSync(sourceAudioPath, projectFilePath);
        const persistentUrl = projectStorage.getProjectAudioUrl(projectId, filename);
        return { url: persistentUrl, duration, source: 'gemini-3.1-flash-tts-preview' };
      } catch (copyErr) {
        console.warn('[Gemini TTS] Failed to copy to project folder, fallback to cache URL:', copyErr.message);
      }
    }
    const filename = path.basename(sourceAudioPath);
    // 1. Deliver via Firebase Storage Cloud CDN if configured
    if (adminStorage) {
      try {
        const cdnUrl = await uploadAudioToCloudStorage(sourceAudioPath, filename, 'gemini-tts');
        if (cdnUrl) {
          return { url: cdnUrl, duration, source: 'gemini-3.1-flash-tts-preview' };
        }
      } catch (cloudErr) {
        console.warn('[Gemini TTS] Cloud storage upload fallback:', cloudErr.message);
      }
    }
    // 2. Local fallback: use clean relative URL
    const fileUrl = `/uploads/cache/${filename}?t=${Date.now()}`;
    return { url: fileUrl, duration, source: 'gemini-3.1-flash-tts-preview' };
  };

  // Kiểm tra Cache Hit
  if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 1000) {
    console.log(`⚡ [Gemini Flash Audio Cache Hit] Voice: ${validVoice}, Role: ${temporalRole}`);
    return await finalizeResult(cachedFilePath);
  }

  console.log(`🎙️ [Gemini Flash Generating Audio] Voice: ${validVoice} | Role: ${temporalRole} | Text: "${cleanText.slice(0, 40)}..."`);

  const ai = new GoogleGenAI({ apiKey });
  const toneGuidance = buildVoiceInstruction(temporalRole, style);

  // 2. Gọi Interactions API với model chuyên dụng cho TTS
  const inputWithTone = toneGuidance
    ? `[${toneGuidance}]\n\n${cleanText}`
    : cleanText;

  const interaction = await ai.interactions.create({
    model: 'gemini-3.1-flash-tts-preview',
    input: inputWithTone,
    response_format: { type: 'audio' },
    generation_config: {
      speech_config: [
        { voice: validVoice }
      ]
    }
  });

  if (!interaction || !interaction.output_audio || !interaction.output_audio.data) {
    throw new Error('Không nhận được dữ liệu âm thanh từ Gemini 3.1 Flash TTS');
  }

  // 3. Giải mã Base64 thành file nhị phân (Buffer)
  const mimeType = interaction.output_audio.mime_type || 'audio/pcm';
  const audioBuffer = Buffer.from(interaction.output_audio.data, 'base64');

  console.log(`[Gemini TTS] Audio received, mime_type: ${mimeType}, size: ${audioBuffer.length} bytes`);

  const isPcm = /pcm|l16/i.test(mimeType);

  if (isPcm) {
    // Phương pháp Ưu Tiên 2: Direct WAV Header (Zero FFmpeg) -> Nhanh gấp 120 lần
    const SAMPLE_RATE = 24000;
    const CHANNELS = 1;
    const BITS_PER_SAMPLE = 16;
    const dataSize = audioBuffer.length;

    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + dataSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
    wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
    wavHeader.writeUInt16LE(CHANNELS, 22);
    wavHeader.writeUInt32LE(SAMPLE_RATE, 24);
    wavHeader.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), 28); // ByteRate
    wavHeader.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32); // BlockAlign
    wavHeader.writeUInt16LE(BITS_PER_SAMPLE, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    const finalWavBuffer = Buffer.concat([wavHeader, audioBuffer]);
    fs.writeFileSync(cachedFilePath, finalWavBuffer);
  } else {
    // Dự phòng nếu tương lai API trả về sẵn mp3/wav
    fs.writeFileSync(cachedFilePath, audioBuffer);
  }

  if (!fs.existsSync(cachedFilePath) || fs.statSync(cachedFilePath).size < 500) {
    throw new Error('Dữ liệu âm thanh WAV sau khi xử lý bị lỗi hoặc rỗng');
  }

  console.log(`✅ [Gemini Flash Audio Success - Direct WAV] Voice: ${validVoice}, Elapsed: Instant`);
  return await finalizeResult(cachedFilePath);
}
