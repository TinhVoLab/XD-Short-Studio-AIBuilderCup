const fs = require('fs');
const path = require('path');

// Helper to write a 16-bit PCM WAV file
function createWavBuffer(sampleRate, durationSec, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = 2; // 1 channel, 16 bits
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM audio samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = sampleGenerator(t, durationSec, i);
    // Soft limiter / saturation tanh
    sample = Math.tanh(sample);
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;
const sfxDir = path.join(__dirname, '..', 'public', 'sfx');
if (!fs.existsSync(sfxDir)) {
  fs.mkdirSync(sfxDir, { recursive: true });
}

function saveSfx(filename, dur, gen) {
  const buf = createWavBuffer(sampleRate, dur, gen);
  fs.writeFileSync(path.join(sfxDir, filename), buf);
}

// ─────────────────────────────────────────────
// 1. BOOM: Deep Cinematic Sub-Bass Impact (1.2s)
// ─────────────────────────────────────────────
saveSfx('boom.wav', 1.2, (t, dur) => {
  const env = Math.exp(-t * 3.5);
  // Pitch dive from 65Hz down to 32Hz
  const freq = 32 + 33 * Math.exp(-t * 6);
  const sub = Math.sin(2 * Math.PI * freq * t);
  // Punch transient at start
  const punch = Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 28);
  const rumble = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.2;
  return (sub * 0.8 + punch * 0.6 + rumble) * env * 1.5;
});

// ─────────────────────────────────────────────
// 2. THUD: Tight Punchy Low Hit (0.45s)
// ─────────────────────────────────────────────
saveSfx('thud.wav', 0.45, (t, dur) => {
  const env = Math.exp(-t * 12);
  const freq = 45 + 90 * Math.exp(-t * 22);
  const tone = Math.sin(2 * Math.PI * freq * t);
  const click = (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.4;
  return (tone * 0.85 + click) * env * 1.4;
});

// ─────────────────────────────────────────────
// 3. KACHING: Cash Register & Coins Jingle (0.8s)
// ─────────────────────────────────────────────
saveSfx('kaching.wav', 0.8, (t, dur) => {
  // Stage 1: Mechanical lever / drawer pull (0 - 0.15s)
  let s = 0;
  if (t < 0.18) {
    const leverEnv = Math.exp(-t * 30);
    s += (Math.random() * 2 - 1) * leverEnv * 0.5;
  }
  // Stage 2: Dual Metallic Chimes (at 0.1s)
  if (t >= 0.1) {
    const tBell = t - 0.1;
    const bellEnv = Math.exp(-tBell * 5);
    const chime1 = Math.sin(2 * Math.PI * 2637 * tBell) * 0.6; // E7
    const chime2 = Math.sin(2 * Math.PI * 3322 * tBell) * 0.4; // G#7
    const chime3 = Math.sin(2 * Math.PI * 4186 * tBell) * 0.25; // C8
    s += (chime1 + chime2 + chime3) * bellEnv;
  }
  // Stage 3: Coin rattle clinks (0.22s - 0.7s)
  if (t >= 0.22) {
    const tCoin = t - 0.22;
    const rattle1 = Math.sin(2 * Math.PI * 4800 * tCoin) * Math.exp(-((tCoin % 0.08) * 45)) * 0.25;
    const rattle2 = Math.sin(2 * Math.PI * 5600 * tCoin) * Math.exp(-((tCoin % 0.11) * 50)) * 0.2;
    s += (rattle1 + rattle2) * Math.exp(-tCoin * 4);
  }
  return s * 1.2;
});

// ─────────────────────────────────────────────
// 4. CAMERA_SHUTTER: Mechanical Dual Aperture Click (0.32s)
// ─────────────────────────────────────────────
saveSfx('camera_shutter.wav', 0.32, (t, dur) => {
  let s = 0;
  // Click 1 (Curtain open): 0.0s
  const click1 = (Math.random() * 2 - 1) * Math.exp(-t * 90) + Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 70);
  s += click1 * 0.7;
  // Click 2 (Curtain close): 0.09s
  if (t >= 0.09) {
    const t2 = t - 0.09;
    const click2 = (Math.random() * 2 - 1) * Math.exp(-t2 * 80) + Math.sin(2 * Math.PI * 2200 * t2) * Math.exp(-t2 * 60);
    s += click2 * 0.8;
  }
  // Motor wind whir: 0.16s
  if (t >= 0.16) {
    const t3 = t - 0.16;
    const wind = Math.sin(2 * Math.PI * (800 + 400 * t3) * t3) * Math.exp(-t3 * 18) * 0.3;
    s += wind;
  }
  return s * 1.3;
});

// ─────────────────────────────────────────────
// 5. GLITCH: Digital Bitcrush Frequency Hop (0.38s)
// ─────────────────────────────────────────────
saveSfx('glitch.wav', 0.38, (t, dur) => {
  const step = Math.floor(t * 30);
  const freqs = [350, 880, 220, 1400, 440, 1760, 260, 1100, 520, 960];
  const freq = freqs[step % freqs.length];
  // Square wave with bit-depth crunch
  const rawTone = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.7 : -0.7;
  const noise = (Math.random() * 2 - 1) * 0.35;
  const env = Math.sin((t / dur) * Math.PI);
  return (rawTone + noise) * env * 0.9;
});

// ─────────────────────────────────────────────
// 6. BUZZER: Wrong Answer / Error Stinger (0.45s)
// ─────────────────────────────────────────────
saveSfx('buzzer.wav', 0.45, (t, dur) => {
  const env = Math.exp(-t * 4);
  // Dissonant interval (145Hz & 153Hz producing 8Hz pulsating clash)
  const f1 = 145;
  const f2 = 153;
  const sq1 = Math.sin(2 * Math.PI * f1 * t) > 0 ? 0.5 : -0.5;
  const sq2 = Math.sin(2 * Math.PI * f2 * t) > 0 ? 0.5 : -0.5;
  const sub = Math.sin(2 * Math.PI * 72 * t) * 0.3;
  return (sq1 + sq2 + sub) * env * 1.1;
});

// ─────────────────────────────────────────────
// 7. MARKER: Felt-tip Highlighter Stroke (0.35s)
// ─────────────────────────────────────────────
saveSfx('marker.wav', 0.35, (t, dur) => {
  const env = Math.sin((t / dur) * Math.PI);
  // Modulated friction noise
  const friction = (Math.random() * 2 - 1);
  const texture = Math.sin(2 * Math.PI * (1200 + 400 * Math.sin(t * 40)) * t) * 0.25;
  return (friction * 0.6 + texture) * env * 1.2;
});

// ─────────────────────────────────────────────
// 8. RISER: Ascending Tension Build-up (1.6s)
// ─────────────────────────────────────────────
saveSfx('riser.wav', 1.6, (t, dur) => {
  const progress = t / dur;
  const env = Math.pow(progress, 2.2); // Swell towards the end
  const freq = 120 + 950 * Math.pow(progress, 3);
  const tone = Math.sin(2 * Math.PI * freq * t) * 0.6;
  const whiteNoise = (Math.random() * 2 - 1) * 0.4 * env;
  const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
  return (tone + whiteNoise + harmonic) * env * 1.4;
});

// ─────────────────────────────────────────────
// 9. RECORD_SCRATCH: Vinyl Needle Stop (0.45s)
// ─────────────────────────────────────────────
saveSfx('record_scratch.wav', 0.45, (t, dur) => {
  const env = Math.exp(-t * 6);
  // Rapid pitch decelerando
  const speed = Math.max(0.05, 1 - t / dur);
  const freq = 2200 * Math.pow(speed, 2.5);
  const tone = Math.sin(2 * Math.PI * freq * t);
  const friction = (Math.random() * 2 - 1) * 0.4;
  return (tone * 0.6 + friction) * env * 1.4;
});

// ─────────────────────────────────────────────
// 10. CLOCK_TICK: Crisp Precision Second Tick (0.15s)
// ─────────────────────────────────────────────
saveSfx('clock_tick.wav', 0.15, (t, dur) => {
  const env = Math.exp(-t * 55);
  const tone1 = Math.sin(2 * Math.PI * 2800 * t) * 0.6;
  const tone2 = Math.sin(2 * Math.PI * 4200 * t) * 0.4;
  const woodClick = (Math.random() * 2 - 1) * 0.3;
  return (tone1 + tone2 + woodClick) * env * 1.3;
});

// ─────────────────────────────────────────────
// 11. WHIP: Fast Air Whip Crack (0.28s)
// ─────────────────────────────────────────────
saveSfx('whip.wav', 0.28, (t, dur) => {
  let s = 0;
  // Swish whoosh
  const swishEnv = Math.sin((t / 0.18) * Math.PI);
  if (t < 0.18) {
    s += (Math.random() * 2 - 1) * swishEnv * 0.5;
  }
  // Supersonic crack at 0.12s
  if (t >= 0.12) {
    const tCrack = t - 0.12;
    const crackEnv = Math.exp(-tCrack * 60);
    const snap = (Math.random() * 2 - 1) * crackEnv * 1.2;
    const tone = Math.sin(2 * Math.PI * 3400 * tCrack) * crackEnv * 0.6;
    s += snap + tone;
  }
  return s;
});

// ─────────────────────────────────────────────
// 12. POP: Crisp Tactile Bubble Pop (0.16s)
// ─────────────────────────────────────────────
saveSfx('pop.wav', 0.16, (t, dur) => {
  const env = Math.exp(-t * 26);
  const freq = 750 * Math.exp(-t * 35) + 300;
  return Math.sin(2 * Math.PI * freq * t) * env * 1.3;
});

// ─────────────────────────────────────────────
// 13. SWOOSH: Smooth Aerodynamic Whoosh (0.35s)
// ─────────────────────────────────────────────
let swooshNoise = 0;
saveSfx('swoosh.wav', 0.35, (t, dur) => {
  const env = Math.sin((t / dur) * Math.PI);
  const whiteNoise = Math.random() * 2 - 1;
  swooshNoise = swooshNoise * 0.82 + whiteNoise * 0.18;
  const freq = 180 + 720 * Math.sin((t / dur) * Math.PI);
  const tone = Math.sin(2 * Math.PI * freq * t) * 0.3;
  return (swooshNoise * 0.8 + tone) * env * 1.6;
});

// ─────────────────────────────────────────────
// 14. WHOOSH: Cinematic Heavy Transition (0.65s)
// ─────────────────────────────────────────────
let whooshNoise = 0;
saveSfx('whoosh.wav', 0.65, (t, dur) => {
  const env = Math.sin((t / dur) * Math.PI);
  const whiteNoise = Math.random() * 2 - 1;
  whooshNoise = whooshNoise * 0.88 + whiteNoise * 0.12;
  const sub = Math.sin(2 * Math.PI * (70 + 80 * Math.sin((t / dur) * Math.PI)) * t) * 0.4;
  return (whooshNoise * 0.75 + sub) * env * 1.7;
});

// ─────────────────────────────────────────────
// 15. DING: Pristine Service Bell (0.75s)
// ─────────────────────────────────────────────
saveSfx('ding.wav', 0.75, (t, dur) => {
  const env = Math.exp(-t * 4.5);
  const f0 = 1318.5; // E6
  const h1 = Math.sin(2 * Math.PI * f0 * t) * 0.6;
  const h2 = Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.3;
  const h3 = Math.sin(2 * Math.PI * (f0 * 3.01) * t) * 0.15;
  const strike = Math.sin(2 * Math.PI * 4400 * t) * Math.exp(-t * 60) * 0.4;
  return (h1 + h2 + h3 + strike) * env * 1.3;
});

// ─────────────────────────────────────────────
// 16. CLICK: Modern Mouse / UI Tap (0.12s)
// ─────────────────────────────────────────────
saveSfx('click.wav', 0.12, (t, dur) => {
  const env = Math.exp(-t * 65);
  const tap = Math.sin(2 * Math.PI * 2200 * t) * 0.6;
  const noise = (Math.random() * 2 - 1) * 0.4;
  return (tap + noise) * env * 1.4;
});

// ─────────────────────────────────────────────
// 17. TYPEWRITER: Mechanical Keyboard Click (0.14s)
// ─────────────────────────────────────────────
saveSfx('typewriter.wav', 0.14, (t, dur) => {
  const click = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.6;
  const clack = Math.sin(2 * Math.PI * 1450 * t) * Math.exp(-t * 55) * 0.5;
  const body = Math.sin(2 * Math.PI * 420 * t) * Math.exp(-t * 40) * 0.3;
  return (click + clack + body) * 1.4;
});

// ─────────────────────────────────────────────
// 18. CLAP: Studio Applause Burst (0.5s)
// ─────────────────────────────────────────────
saveSfx('clap.wav', 0.5, (t, dur) => {
  let env = 0;
  [0, 0.012, 0.028, 0.045, 0.062].forEach((offset) => {
    if (t >= offset) {
      env += Math.exp(-(t - offset) * 32) * 0.5;
    }
  });
  const noise = Math.random() * 2 - 1;
  const lowBody = Math.sin(2 * Math.PI * 260 * t) * Math.exp(-t * 20) * 0.3;
  return (noise * 0.7 + lowBody) * env * 1.2;
});

// ─────────────────────────────────────────────
// 19. BELL: Rich Wind Chime / Temple Bell (1.5s)
// ─────────────────────────────────────────────
saveSfx('bell.wav', 1.5, (t, dur) => {
  const env = Math.exp(-t * 2.2);
  const f0 = 587.33; // D5
  const b1 = Math.sin(2 * Math.PI * f0 * t) * 0.5;
  const b2 = Math.sin(2 * Math.PI * (f0 * 2.76) * t) * 0.25;
  const b3 = Math.sin(2 * Math.PI * (f0 * 5.4) * t) * 0.15;
  const tremolo = 1 + 0.1 * Math.sin(2 * Math.PI * 4 * t);
  return (b1 + b2 + b3) * tremolo * env * 1.3;
});

// ─────────────────────────────────────────────
// 20. CHIME: Ethereal Fairy Dust Chimes (1.8s)
// ─────────────────────────────────────────────
saveSfx('chime.wav', 1.8, (t, dur) => {
  let s = 0;
  const chimeNotes = [1760, 2093, 2637, 3135, 3520, 4186];
  chimeNotes.forEach((freq, idx) => {
    const offset = idx * 0.08;
    if (t >= offset) {
      const tNote = t - offset;
      const noteEnv = Math.exp(-tNote * 3.5);
      s += Math.sin(2 * Math.PI * freq * tNote) * noteEnv * 0.25;
    }
  });
  return s * 1.2;
});

console.log('Successfully generated 20 Studio-Grade SFX WAV files in public/sfx/!');
