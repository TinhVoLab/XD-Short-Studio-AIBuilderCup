const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../');

async function run() {
  console.log("Bundling Remotion project...");
  const bundled = await bundle(path.resolve(ROOT, 'src/remotion/index.ts'), () => undefined, {
    webpackOverride: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = { ...config.resolve.alias, '@': path.resolve(ROOT, 'src') };
      return config;
    },
  });

  const scenes = [{
    id: "scene-test",
    name: "Test Scene",
    description: "",
    duration: 10,
    bgColor: "#000",
    elements: []
  }];

  const audioClips = [{
    id: "audio-test",
    name: "Test Audio",
    url: "http://localhost:5173/test_10s.mp3",
    startSec: 0,
    duration: 10,
    playDurationSec: 10,
    volume: 1,
    playbackRate: 1
  }];

  const inputProps = { scenes, audioClips, durationInFrames: 300, bgMusicUrl: null, bgMusicVolume: 0 };

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'MotionStudio',
    inputProps,
  });

  const outputLocation = path.join(ROOT, 'public/export-test.mp4');
  console.log(`Rendering media to ${outputLocation}...`);
  
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation,
    scale: 1,
    inputProps,
  });

  console.log('Render complete! Probing audio stream duration...');
  
  // Use ffprobe to get exact audio stream duration in the resulting MP4
  const probeAudioCmd = `ffprobe -v error -select_streams a:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${outputLocation}`;
  const probeVideoCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${outputLocation}`;
  
  const audioDur = execSync(probeAudioCmd).toString().trim();
  const videoDur = execSync(probeVideoCmd).toString().trim();
  
  console.log(`[RESULT] Exported Video Track Duration: ${videoDur} seconds`);
  console.log(`[RESULT] Exported Audio Track Duration: ${audioDur} seconds`);
}

run().catch(console.error);
