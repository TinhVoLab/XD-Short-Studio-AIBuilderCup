import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { publicDir, cacheDir } from '../config/paths.js';

/**
 * Applies studio acoustic room reverb to an audio file using FFmpeg aecho filter.
 */
export function applyReverbToAudio(inputUrlOrPath, reverbRatio = 0) {
  const r = Math.max(0, Math.min(1.0, parseFloat(reverbRatio) || 0));
  if (r <= 0.02 || !inputUrlOrPath) return inputUrlOrPath;

  // Resolve input to a local filesystem path
  let localInputPath = inputUrlOrPath;
  if (inputUrlOrPath.startsWith('http://localhost:4000') || inputUrlOrPath.startsWith('http://localhost:3000') || inputUrlOrPath.startsWith('http://localhost:5173')) {
    try {
      const parsed = new URL(inputUrlOrPath);
      localInputPath = path.join(publicDir, parsed.pathname);
    } catch (e) {
      localInputPath = inputUrlOrPath;
    }
  } else if (inputUrlOrPath.startsWith('/')) {
    localInputPath = path.join(publicDir, inputUrlOrPath);
  }

  if (!fs.existsSync(localInputPath)) {
    return inputUrlOrPath;
  }

  const fileStat = fs.statSync(localInputPath);
  const hash = crypto.createHash('md5').update(`${localInputPath}_${fileStat.mtimeMs}_${r.toFixed(2)}`).digest('hex').slice(0, 12);
  const outputFilename = `reverb-${hash}.mp3`;
  const outputFilePath = path.join(cacheDir, outputFilename);

  if (fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 100) {
    return `/uploads/cache/${outputFilename}`;
  }

  try {
    const d1 = (0.45 * r).toFixed(2);
    const d2 = (0.32 * r).toFixed(2);
    const d3 = (0.20 * r).toFixed(2);
    const d4 = (0.12 * r).toFixed(2);
    const aechoFilter = `aecho=0.88:0.88:28|56|84|112:${d1}|${d2}|${d3}|${d4}`;

    execSync(`ffmpeg -i "${localInputPath}" -af "${aechoFilter}" -acodec libmp3lame -b:a 192k "${outputFilePath}" -y`, { stdio: 'ignore' });
    return `/uploads/cache/${outputFilename}`;
  } catch (err) {
    console.warn('Failed to apply reverb with ffmpeg, fallback to original:', err);
    return inputUrlOrPath;
  }
}

/**
 * Generates a silent MP3 file of exact duration in seconds using ffmpeg.
 */
export function generateSilenceAudio(durationSec = 0.3) {
  const dur = Math.max(0.1, Math.min(2.0, parseFloat(durationSec) || 0.3));
  const filename = `silence-${dur.toFixed(2)}s.mp3`;
  const filePath = path.join(cacheDir, filename);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
    try {
      execSync(`ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t ${dur.toFixed(2)} -acodec libmp3lame -b:a 128k "${filePath}" -y`, { stdio: 'ignore' });
    } catch (err) {
      console.warn('Failed to generate silence audio with ffmpeg:', err);
    }
  }
  return filePath;
}

/**
 * Concat multiple audio files into a single output audio file using ffmpeg.
 */
export function concatAudioFiles(filePaths, outputFilePath) {
  if (!filePaths || filePaths.length === 0) return false;
  if (filePaths.length === 1) {
    fs.copyFileSync(filePaths[0], outputFilePath);
    return true;
  }

  const listFile = path.join(cacheDir, `concat-list-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.txt`);
  try {
    const listContent = filePaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(listFile, listContent);
    execSync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFilePath}" -y`, { stdio: 'ignore' });
    return true;
  } catch (err) {
    console.warn('ffmpeg concat copy failed, attempting filter concat:', err);
    try {
      const inputs = filePaths.map(p => `-i "${p}"`).join(' ');
      const filter = filePaths.map((_, idx) => `[${idx}:0]`).join('') + `concat=n=${filePaths.length}:v=0:a=1[out]`;
      execSync(`ffmpeg ${inputs} -filter_complex "${filter}" -map "[out]" -acodec libmp3lame -b:a 128k "${outputFilePath}" -y`, { stdio: 'ignore' });
      return true;
    } catch (e2) {
      console.error('All concat attempts failed:', e2);
      return false;
    }
  } finally {
    if (fs.existsSync(listFile)) {
      try { fs.unlinkSync(listFile); } catch (e) {}
    }
  }
}
