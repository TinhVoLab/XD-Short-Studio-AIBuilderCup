import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { telemetry } from '../../services/telemetryService.js';
import { uploadsDir } from '../../config/paths.js';
import { resolveSunoUrl, fetchSunoClipMetadata, downloadSunoAudio } from '../../services/sunoService.js';
import { getAudioDurationServer } from '../../services/ttsService.js';

const router = Router();

// 1. Import and Cache Suno AI Music Tracks
router.post('/suno-import', async (req, res) => {
  telemetry.recordRequest('/api/ai/suno-import');
  const { urls, vibe } = req.body;
  if (!urls || (!Array.isArray(urls) && typeof urls !== 'string')) {
    return res.status(400).json({ error: 'Missing Suno URL or URL list' });
  }
  
  // Split multiple URLs by whitespace, comma or newlines
  const rawList = Array.isArray(urls) ? urls : urls.split(/[\n,\s]+/);
  const candidates = rawList.map(u => u.trim()).filter(u => u.length > 0 && u.includes('suno.com'));

  if (candidates.length === 0) {
    return res.status(400).json({ error: 'Không tìm thấy link bài hát Suno hợp lệ (ví dụ: https://suno.com/s/... hoặc https://suno.com/song/...)' });
  }

  try {
    const results = [];
    const processedIds = new Set();

    for (const url of candidates) {
      const { songId, meta: resolvedMeta } = await resolveSunoUrl(url);
      if (!songId || processedIds.has(songId)) continue;
      processedIds.add(songId);

      const meta = resolvedMeta || await fetchSunoClipMetadata(songId);
      const downloadResult = await downloadSunoAudio(songId, meta.audioUrl);
      
      results.push({
        id: meta.id,
        title: meta.title || `Suno Track #${songId.slice(0, 6)}`,
        vibe: vibe || 'other',
        audioUrl: downloadResult.relativeUrl,
        originalSunoUrl: url,
        duration: meta.duration > 0 ? meta.duration : (downloadResult.duration || 30),
        coverArtUrl: meta.coverArtUrl,
        tags: meta.tags,
        prompt: meta.prompt,
        createdAt: Date.now()
      });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Không thể trích xuất ID bài hát từ các đường link bạn đã cung cấp' });
    }

    res.json({
      success: true,
      importedCount: results.length,
      tracks: results
    });
  } catch (err) {
    console.error('Error importing Suno music:', err);
    res.status(500).json({ error: 'Lỗi khi nhập nhạc Suno: ' + err.message });
  }
});

// 2. Import and Cache Custom Sound FX & Audio Links (Suno, CDN, Direct Audio)
router.post('/sfx-import', async (req, res) => {
  telemetry.recordRequest('/api/ai/sfx-import');
  const { urls, category } = req.body;
  if (!urls || (!Array.isArray(urls) && typeof urls !== 'string')) {
    return res.status(400).json({ error: 'Missing audio URL or URL list' });
  }

  const rawList = Array.isArray(urls) ? urls : urls.split(/[\n,\s]+/);
  const candidates = rawList.map(u => u.trim()).filter(u => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/')));

  if (candidates.length === 0) {
    return res.status(400).json({ error: 'Không tìm thấy link âm thanh hợp lệ (bắt đầu bằng http:// hoặc https://)' });
  }

  const getCategoryEmoji = (cat) => {
    switch (cat) {
      case 'motion': return '💨';
      case 'ui': return '🔔';
      case 'reaction': return '🎭';
      case 'custom': return '⭐';
      default: return '🔊';
    }
  };

  try {
    const results = [];
    const processedUrls = new Set();

    for (let i = 0; i < candidates.length; i++) {
      const url = candidates[i];
      if (processedUrls.has(url)) continue;
      processedUrls.add(url);

      const targetCategory = category || 'custom';
      const sfxEmoji = getCategoryEmoji(targetCategory);

      // Case A: Suno link (Short link or Song link)
      if (url.includes('suno.com')) {
        const { songId, meta: resolvedMeta } = await resolveSunoUrl(url);
        if (songId) {
          const meta = resolvedMeta || await fetchSunoClipMetadata(songId);
          const downloadResult = await downloadSunoAudio(songId, meta.audioUrl);
          
          results.push({
            id: `sfx_${meta.id}`,
            name: meta.title || `Suno Sound #${songId.slice(0, 6)}`,
            emoji: sfxEmoji,
            category: targetCategory,
            audioUrl: downloadResult.relativeUrl,
            duration: meta.duration > 0 ? meta.duration : (downloadResult.duration || 1.5),
            createdAt: Date.now() + i,
            isPreset: false
          });
          continue;
        }
      }

      // Case B: General Web/CDN Audio link (MP3, WAV, Myinstants, Freesound, etc.)
      try {
        const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
        let ext = '.mp3';
        if (url.includes('.wav')) ext = '.wav';
        else if (url.includes('.ogg')) ext = '.ogg';
        else if (url.includes('.m4a')) ext = '.m4a';

        const filename = `sfx_${hash}${ext}`;
        const localPath = path.join(uploadsDir, filename);
        const relativeUrl = `/uploads/${filename}`;

        let duration = 1.5;

        if (fs.existsSync(localPath) && fs.statSync(localPath).size > 512) {
          try {
            const d = await getAudioDurationServer(localPath);
            if (d && isFinite(d) && d > 0) duration = Math.round(d * 10) / 10;
          } catch (e) {}
        } else {
          // Download audio buffer
          const audioRes = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });

          if (audioRes.ok) {
            const arrayBuf = await audioRes.arrayBuffer();
            if (arrayBuf.byteLength > 512) {
              fs.writeFileSync(localPath, Buffer.from(arrayBuf));
              try {
                const d = await getAudioDurationServer(localPath);
                if (d && isFinite(d) && d > 0) duration = Math.round(d * 10) / 10;
              } catch (e) {}
            }
          }
        }

        // Clean name from URL
        let sfxName = `Sound FX #${i + 1}`;
        try {
          const pathname = new URL(url).pathname;
          const rawFileName = pathname.split('/').pop() || '';
          const clean = decodeURIComponent(rawFileName).replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
          if (clean && clean.length > 1) {
            sfxName = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
        } catch (e) {}

        results.push({
          id: `sfx_${hash}`,
          name: sfxName,
          emoji: sfxEmoji,
          category: targetCategory,
          audioUrl: fs.existsSync(localPath) ? relativeUrl : url,
          duration,
          createdAt: Date.now() + i,
          isPreset: false
        });
      } catch (err) {
        console.warn('Error downloading SFX URL:', url, err.message);
      }
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Không thể phân tích hoặc tải các đường link âm thanh đã cung cấp' });
    }

    res.json({
      success: true,
      importedCount: results.length,
      tracks: results
    });
  } catch (err) {
    console.error('Error importing SFX:', err);
    res.status(500).json({ error: 'Lỗi khi nhập Sound FX: ' + err.message });
  }
});

export default router;
