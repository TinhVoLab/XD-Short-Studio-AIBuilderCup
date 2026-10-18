import fs from 'fs';
import path from 'path';
import { uploadsDir } from '../config/paths.js';
import { getAudioDurationServer } from './ttsService.js';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Resolve any Suno share link or song URL to its actual Song UUID and metadata
 */
export async function resolveSunoUrl(inputUrl) {
  const cleanUrl = inputUrl.trim();
  
  // 1. If URL is a short share link (https://suno.com/s/xxxx)
  if (cleanUrl.includes('/s/')) {
    try {
      const response = await fetch(cleanUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const finalUrl = response.url;
      const htmlText = await response.text();

      // Check UUID from redirected URL
      const uuidMatch = finalUrl.match(UUID_REGEX) || htmlText.match(UUID_REGEX);
      const songId = uuidMatch ? uuidMatch[0] : null;

      if (songId) {
        // Parse metadata directly from the fetched HTML
        const meta = parseMetadataFromHtml(htmlText, songId);
        return { songId, meta };
      }
    } catch (err) {
      console.warn('[Suno Shortlink Resolve Error]:', err.message);
    }
  }

  // 2. If URL contains standard UUID
  const uuidMatch = cleanUrl.match(UUID_REGEX);
  if (uuidMatch) {
    return { songId: uuidMatch[0], meta: null };
  }

  return { songId: null, meta: null };
}

/**
 * Parse Next.js SSR JSON clip or OpenGraph meta tags from Suno web page
 */
function parseMetadataFromHtml(html, songId) {
  let title = '';
  let coverArtUrl = '';
  let duration = 0;
  let tags = [];
  let prompt = '';

  try {
    // Attempt 1: Extract from Next.js payload '{"clip":{...}}'
    const clipMatch = html.match(/"clip"\s*:\s*(\{[^}]*"id"\s*:\s*"[^"]+"[^}]*\})/);
    if (clipMatch) {
      // Find wider JSON object boundaries
      const startIdx = html.indexOf(clipMatch[0]);
      if (startIdx !== -1) {
        const slice = html.substring(startIdx + 7, startIdx + 4000);
        // Find closing matching bracket
        let depth = 0;
        let endIdx = -1;
        for (let i = 0; i < slice.length; i++) {
          if (slice[i] === '{') depth++;
          else if (slice[i] === '}') {
            depth--;
            if (depth === 0) { endIdx = i + 1; break; }
          }
        }
        if (endIdx > 0) {
          const clipJson = JSON.parse(slice.substring(0, endIdx));
          if (clipJson.title) title = clipJson.title;
          if (clipJson.image_large_url || clipJson.image_url) coverArtUrl = clipJson.image_large_url || clipJson.image_url;
          if (clipJson.metadata?.duration) duration = parseFloat(clipJson.metadata.duration);
          if (clipJson.metadata?.tags) tags = clipJson.metadata.tags.split(',').map(t => t.trim()).filter(Boolean);
          if (clipJson.metadata?.prompt) prompt = clipJson.metadata.prompt;
        }
      }
    }
  } catch (e) {
    // Fallback to meta tags
  }

  // Attempt 2: OpenGraph tags
  if (!title) {
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitle) title = ogTitle[1];
  }

  if (!coverArtUrl) {
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (ogImage) coverArtUrl = ogImage[1];
  }

  return {
    id: songId,
    title: title || `Suno Track #${songId.slice(0, 6)}`,
    audioUrl: `https://cdn1.suno.ai/${songId}.mp3`,
    coverArtUrl: coverArtUrl || `https://cdn2.suno.ai/image_large_${songId}.jpeg`,
    duration,
    tags: tags.length > 0 ? tags : ['suno', 'ai-music', 'instrumental'],
    prompt
  };
}

/**
 * Fetch metadata for a Suno song clip
 */
export async function fetchSunoClipMetadata(clipId) {
  // Try fetching the song webpage first (most reliable for public & unlisted share links)
  try {
    const pageUrl = `https://suno.com/song/${clipId}`;
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (res.ok) {
      const html = await res.text();
      const meta = parseMetadataFromHtml(html, clipId);
      if (meta && meta.title) return meta;
    }
  } catch (err) {
    console.warn(`[Suno Page Fetch Warning for ${clipId}]:`, err.message);
  }

  // Fallback defaults
  return {
    id: clipId,
    title: `Suno Track #${clipId.slice(0, 6)}`,
    audioUrl: `https://cdn1.suno.ai/${clipId}.mp3`,
    coverArtUrl: `https://cdn2.suno.ai/image_large_${clipId}.jpeg`,
    duration: 0,
    tags: ['suno', 'ai-music', 'instrumental'],
    prompt: '',
  };
}

/**
 * Download Suno MP3 audio file to local uploads directory
 */
export async function downloadSunoAudio(clipId, cdnAudioUrl) {
  const fileName = `suno_${clipId}.mp3`;
  const filePath = path.join(uploadsDir, fileName);
  const relativeUrl = `/uploads/${fileName}`;

  // If already downloaded and valid, reuse cached file
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1024) {
    let duration = 30;
    try {
      const d = await getAudioDurationServer(filePath);
      if (d && isFinite(d) && d > 0) duration = d;
    } catch (e) {}
    return { localPath: filePath, relativeUrl, duration };
  }

  const downloadUrls = [
    cdnAudioUrl,
    `https://cdn1.suno.ai/${clipId}.mp3`,
    `https://audiopipe.suno.ai/?item_id=${clipId}`
  ].filter(Boolean);

  let buffer = null;

  for (const url of downloadUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength > 1024) {
          buffer = Buffer.from(arrayBuf);
          break;
        }
      }
    } catch (e) {
      // Continue next download candidate
    }
  }

  if (buffer) {
    fs.writeFileSync(filePath, buffer);
    let duration = 30;
    try {
      const d = await getAudioDurationServer(filePath);
      if (d && isFinite(d) && d > 0) duration = d;
    } catch (e) {}
    return { localPath: filePath, relativeUrl, duration };
  }

  // If download failed, fallback to remote CDN URL directly
  return { localPath: null, relativeUrl: cdnAudioUrl || `https://cdn1.suno.ai/${clipId}.mp3`, duration: 30 };
}
