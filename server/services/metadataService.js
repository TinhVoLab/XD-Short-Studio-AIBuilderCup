import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Injects rich SEO & Copyright metadata into an MP4 video container without re-encoding.
 * Uses FFmpeg Stream Copy (-c copy) for sub-100ms instant tagging.
 * 
 * @param {string} filePath - Absolute path to the rendered MP4 file
 * @param {Object} metadata - Metadata fields to inject
 * @param {string} metadata.title - Title of the video
 * @param {string} metadata.artist - Author / Creator name
 * @param {string} metadata.comment - Video description or voiceover summary
 * @param {string} metadata.copyright - Copyright notice
 * @param {string} metadata.genre - Video category/genre
 * @param {string} metadata.encoder - Software / Platform name
 * @returns {Promise<boolean>} - True if metadata was successfully injected
 */
export async function injectMp4Metadata(filePath, metadata = {}) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`[Metadata Service] Target file does not exist: ${filePath}`);
      return resolve(false);
    }

    const {
      title = 'Viral Short Video',
      artist = 'Tech Director',
      comment = 'AI Generated Motion Video',
      copyright = `© ${new Date().getFullYear()} ${artist}. All rights reserved.`,
      genre = 'Shorts / Educational / Technology',
      encoder = 'XD-Short AI Motion Studio',
      creation_time = new Date().toISOString()
    } = metadata;

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const tempOutput = path.join(dir, `${base}_tagged_${Date.now()}${ext}`);

    const args = [
      '-y',
      '-i', filePath,
      '-c', 'copy',
      '-metadata', `title=${title}`,
      '-metadata', `artist=${artist}`,
      '-metadata', `author=${artist}`,
      '-metadata', `composer=${artist}`,
      '-metadata', `comment=${comment.slice(0, 300)}`,
      '-metadata', `description=${comment.slice(0, 300)}`,
      '-metadata', `synopsis=${comment.slice(0, 300)}`,
      '-metadata', `copyright=${copyright}`,
      '-metadata', `genre=${genre}`,
      '-metadata', `encoder=${encoder}`,
      '-metadata', `encoded_by=${encoder}`,
      '-metadata', `creation_time=${creation_time}`,
      '-movflags', '+faststart', // Moves moov atom to beginning of file for instant web streaming
      tempOutput
    ];

    execFile('ffmpeg', args, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        console.warn(`[Metadata Service] FFmpeg tagging skipped (${error.message || error}). File preserved.`);
        if (fs.existsSync(tempOutput)) {
          try { fs.unlinkSync(tempOutput); } catch (e) {}
        }
        return resolve(false);
      }

      // Replace original file with tagged file atomically
      try {
        if (fs.existsSync(tempOutput) && fs.statSync(tempOutput).size > 1000) {
          fs.renameSync(tempOutput, filePath);
          console.log(`[Metadata Service] ✅ Injected SEO Metadata into ${path.basename(filePath)} (Title: "${title}", Author: "${artist}")`);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (swapErr) {
        console.warn(`[Metadata Service] Swap error: ${swapErr.message}`);
        resolve(false);
      }
    });
  });
}
