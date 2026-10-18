/**
 * 10-Second Video Render Benchmark across 3 Resolutions (360p, 720p, 1080p)
 * XD-Short Studio Remotion Cloud Engine
 */

const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../');

async function runBenchmark() {
  console.log('================================================================================');
  console.log('   🎬 XD-SHORT STUDIO — 10S VIDEO CLOUD RENDER BENCHMARK (3 RESOLUTIONS)');
  console.log('================================================================================');
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`CPU: ${os.cpus()[0]?.model} (${os.cpus().length} Cores)`);
  console.log(`Node: ${process.version}`);
  console.log('--------------------------------------------------------------------------------\n');

  // Step 1: Bundling (Measure Webpack Bundle time)
  console.log('📦 Step 1: Bundling Remotion Studio Composition...');
  const bundleStart = performance.now();
  const bundled = await bundle(path.resolve(ROOT, 'src/remotion/index.ts'), () => undefined, {
    webpackOverride: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = { ...config.resolve.alias, '@': path.resolve(ROOT, 'src') };
      return config;
    },
  });
  const bundleElapsed = ((performance.now() - bundleStart) / 1000).toFixed(2);
  console.log(`✓ Remotion Bundle ready in ${bundleElapsed}s\n`);

  // Mock a realistic 10s Video: 3 Scenes (3.5s + 3.5s + 3.0s = 10.0s)
  const scenes = [
    {
      id: "scene-1-hook",
      name: "Scene 1: Hook & Headline",
      description: "Intro hook with badge and stat",
      duration: 3.5,
      bgColor: "#060D16",
      bgPattern: "grid",
      transition: { type: "slide", duration: 0.5 },
      elements: [
        {
          id: "s1-badge",
          type: "badge",
          left: 180,
          top: 80,
          width: 130,
          height: 28,
          bgColor: "#BEFF01",
          content: "TỐC ĐỘ RENDER",
          color: "#000",
          radius: 14,
          fontSize: 11,
          fontWeight: 900,
          animPreset: "zoom-in"
        },
        {
          id: "s1-title",
          type: "text",
          left: 180,
          top: 160,
          width: 310,
          height: 90,
          content: "CLOUD ENGINE\nSIÊU TỐC",
          fontSize: 34,
          fontFamily: "Be Vietnam Pro",
          fontWeight: 900,
          color: "#FFFFFF",
          textAlign: "center",
          shadow: true,
          animPreset: "slide-up"
        },
        {
          id: "s1-stat",
          type: "stat-big",
          left: 180,
          top: 320,
          width: 290,
          height: 120,
          statValue: "10x",
          statLabel: "Hiệu năng bứt phá",
          color: "#BEFF01",
          animPreset: "zoom-in"
        }
      ]
    },
    {
      id: "scene-2-chart",
      name: "Scene 2: Data & Chart",
      description: "Comparison chart",
      duration: 3.5,
      bgColor: "#0A101D",
      bgPattern: "dots",
      transition: { type: "crossfade", duration: 0.5 },
      elements: [
        {
          id: "s2-title",
          type: "text",
          left: 180,
          top: 90,
          width: 310,
          height: 45,
          content: "SO SÁNH ĐỘ PHÂN GIẢI",
          fontSize: 18,
          fontFamily: "Be Vietnam Pro",
          fontWeight: 800,
          color: "#00D4FF",
          textAlign: "center",
          animPreset: "fade-in"
        },
        {
          id: "s2-chart",
          type: "chart-bar",
          left: 180,
          top: 250,
          width: 300,
          height: 180,
          chartData: [
            { label: "360p", value: 35, unit: "MB", color: "#3B82F6" },
            { label: "720p", value: 70, unit: "MB", color: "#06B6D4" },
            { label: "1080p", value: 100, unit: "MB", color: "#BEFF01" }
          ],
          animPreset: "zoom-in"
        }
      ]
    },
    {
      id: "scene-3-cta",
      name: "Scene 3: CTA & Outro",
      description: "Call to action with audio waveform",
      duration: 3.0,
      bgColor: "#060D16",
      bgPattern: "grid",
      transition: { type: "none", duration: 0 },
      elements: [
        {
          id: "s3-text",
          type: "text",
          left: 180,
          top: 150,
          width: 310,
          height: 70,
          content: "XD-SHORT STUDIO\nPRO 2026",
          fontSize: 28,
          fontFamily: "Be Vietnam Pro",
          fontWeight: 900,
          color: "#BEFF01",
          textAlign: "center",
          animPreset: "slide-down"
        },
        {
          id: "s3-wave",
          type: "audio-waveform",
          left: 180,
          top: 270,
          width: 280,
          height: 44,
          waveformColor: "#BEFF01",
          numberOfBars: 26,
          animPreset: "fade-in"
        }
      ]
    }
  ];

  const totalDurationSec = 10.0;
  const fps = 30;
  const totalFrames = Math.round(totalDurationSec * fps); // 300 frames

  const inputProps = {
    scenes,
    durationInFrames: totalFrames,
    bgMusicVolume: 0,
    showWatermark: false
  };

  // Test matrix
  const testConfigs = [
    { label: '360p (SD Fast)', scale: 1, width: 360, height: 640 },
    { label: '720p (HD Balanced)', scale: 2, width: 720, height: 1280 },
    { label: '1080p (Full HD Studio)', scale: 3, width: 1080, height: 1920 }
  ];

  const results = [];
  const concurrency = Math.max(1, Math.min(os.cpus().length - 1, 8));
  console.log(`⚙️ Render Configuration: concurrency = ${concurrency}, target frames = ${totalFrames} (10.0s @ 30fps)\n`);

  for (const cfg of testConfigs) {
    console.log(`────────────────────────────────────────────────────────────────────────────────`);
    console.log(`🚀 RUNNING TEST: ${cfg.label} [Scale: ${cfg.scale}x -> ${cfg.width}x${cfg.height}]`);
    console.log(`────────────────────────────────────────────────────────────────────────────────`);

    const selectStart = performance.now();
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'MotionStudio',
      inputProps,
    });
    const selectTime = ((performance.now() - selectStart)).toFixed(0);

    const outPath = path.resolve(ROOT, `public/test-10s-${cfg.scale}x.mp4`);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    const renderStart = performance.now();
    let lastReportedPct = 0;

    const dynamicCrf = cfg.scale >= 3 ? 20 : 21;

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      audioCodec: 'aac',
      imageFormat: 'jpeg',
      jpegQuality: 80,
      pixelFormat: 'yuv420p',
      crf: dynamicCrf,
      outputLocation: outPath,
      scale: cfg.scale,
      inputProps,
      concurrency,
      chromiumOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--mute-audio',
          '--disk-cache-size=1',
          '--disable-component-update',
          '--disable-background-networking',
          '--disable-features=Translate,BackForwardCache,AcceptCHFrame'
        ]
      },
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct >= lastReportedPct + 20 || pct === 100) {
          process.stdout.write(`  ↳ Rendering progress: ${pct}%\n`);
          lastReportedPct = pct;
        }
      }
    });

    const renderElapsedSec = ((performance.now() - renderStart) / 1000);
    const renderFps = (totalFrames / renderElapsedSec).toFixed(1);
    const realTimeFactor = (totalDurationSec / renderElapsedSec).toFixed(2);
    const stat = fs.statSync(outPath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

    // Verify video stream duration with ffprobe
    let videoTrackDur = 'N/A';
    try {
      const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 "${outPath}"`;
      videoTrackDur = parseFloat(execSync(probeCmd).toString().trim()).toFixed(2);
    } catch (e) {
      videoTrackDur = 'err';
    }

    console.log(`\n  ✅ Done in: ${renderElapsedSec.toFixed(2)}s`);
    console.log(`  📊 Render Speed: ${renderFps} FPS (${realTimeFactor}x Real-time)`);
    console.log(`  💾 Output Size: ${sizeMb} MB (Track Duration: ${videoTrackDur}s)\n`);

    results.push({
      label: cfg.label,
      resolution: `${cfg.width}x${cfg.height}`,
      scale: cfg.scale,
      selectTimeMs: selectTime,
      renderElapsedSec: renderElapsedSec.toFixed(2),
      renderFps,
      realTimeFactor,
      sizeMb,
      videoTrackDur
    });
  }

  console.log('================================================================================');
  console.log('   📊 BENCHMARK COMPARISON TABLE — 10-SECOND VIDEO (300 FRAMES)');
  console.log('================================================================================');
  console.table(results.map(r => ({
    'Độ phân giải': r.label,
    'Resolution': r.resolution,
    'Thời gian (s)': `${r.renderElapsedSec}s`,
    'Tốc độ (FPS)': `${r.renderFps} fps`,
    'Tỉ lệ Realtime': `${r.realTimeFactor}x`,
    'Dung lượng (MB)': `${r.sizeMb} MB`,
    'Khớp thời lượng': `${r.videoTrackDur}s`
  })));

  // Write JSON report for analysis
  const reportPath = path.resolve(__dirname, '../benchmark/benchmark_10s_results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    system: {
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      cpu: os.cpus()[0]?.model,
      cores: os.cpus().length,
      concurrency
    },
    bundleElapsedSec: bundleElapsed,
    results
  }, null, 2));

  console.log(`📁 Detailed report saved to: ${reportPath}\n`);
}

runBenchmark().catch(err => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
