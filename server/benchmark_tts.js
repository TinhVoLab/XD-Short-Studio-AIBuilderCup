import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình test
const ITERATIONS = 30; // Chạy 30 lần để lấy trung bình
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const DURATION_SECONDS = 15; // Giả lập file audio 15 giây (khoảng 1 câu dài)

// Tạo Mock Data: Raw PCM 15 giây (720KB data)
const dataSize = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8) * DURATION_SECONDS;
const pcmBuffer = Buffer.alloc(dataSize);
for (let i = 0; i < dataSize; i += 2) {
  const sample = Math.floor(Math.sin(i * 0.01) * 32767);
  pcmBuffer.writeInt16LE(sample, i);
}

const outDir = path.join(__dirname, 'benchmark_out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

async function runBenchmark() {
  console.log(`🎙️ BẮT ĐẦU BENCHMARK TTS AUDIO PROCESSING`);
  console.log(`- File giả lập: ${DURATION_SECONDS} giây (PCM 16-bit 24kHz Mono, Size: ${(dataSize/1024).toFixed(2)} KB)`);
  console.log(`- Số lần lặp (Iterations): ${ITERATIONS} lần/phương pháp\n`);

  const results = [];

  // ==========================================
  // Phương pháp 1: Hiện tại (Ghi đĩa -> execSync -> Ghi đĩa)
  // ==========================================
  let totalTime1 = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    const tempPcm = path.join(outDir, `temp1_${i}.pcm`);
    const outMp3 = path.join(outDir, `out1_${i}.mp3`);
    
    fs.writeFileSync(tempPcm, pcmBuffer);
    execSync(`ffmpeg -nostdin -f s16le -ar 24000 -ac 1 -i "${tempPcm}" -y -codec:a libmp3lame -b:a 128k "${outMp3}" -loglevel quiet`);
    fs.unlinkSync(tempPcm);
    
    totalTime1 += (performance.now() - start);
    fs.unlinkSync(outMp3); // cleanup
  }
  results.push({ 
    Method: '1. Hiện tại (Disk + execSync)', 
    'Avg Time (ms)': (totalTime1 / ITERATIONS).toFixed(2) 
  });

  // ==========================================
  // Phương pháp 2: Ưu tiên 1 (In-Memory RAM Pipe -> spawn)
  // ==========================================
  let totalTime2 = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    const outMp3 = path.join(outDir, `out2_${i}.mp3`);
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 's16le', '-ar', '24000', '-ac', '1',
        '-i', 'pipe:0', // Read from stdin
        '-y', '-codec:a', 'libmp3lame', '-b:a', '128k',
        outMp3
      ], { stdio: ['pipe', 'ignore', 'ignore'] });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('FFmpeg failed'));
      });
      
      ffmpeg.stdin.write(pcmBuffer);
      ffmpeg.stdin.end();
    });
    
    totalTime2 += (performance.now() - start);
    fs.unlinkSync(outMp3);
  }
  results.push({ 
    Method: '2. Pipe RAM (In-Memory FFmpeg)', 
    'Avg Time (ms)': (totalTime2 / ITERATIONS).toFixed(2) 
  });

  // ==========================================
  // Phương pháp 3: Ưu tiên 2 (Direct WAV Header - No FFmpeg)
  // ==========================================
  let totalTime3 = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    const outWav = path.join(outDir, `out3_${i}.wav`);
    
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
    
    const finalWavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
    fs.writeFileSync(outWav, finalWavBuffer);
    
    totalTime3 += (performance.now() - start);
    fs.unlinkSync(outWav);
  }
  results.push({ 
    Method: '3. Direct WAV Header (Zero FFmpeg)', 
    'Avg Time (ms)': (totalTime3 / ITERATIONS).toFixed(2) 
  });

  console.table(results);
  console.log(`\n✅ Kết thúc Benchmark!`);
  
  // Cleanup
  fs.rmSync(outDir, { recursive: true, force: true });
}

runBenchmark().catch(console.error);
