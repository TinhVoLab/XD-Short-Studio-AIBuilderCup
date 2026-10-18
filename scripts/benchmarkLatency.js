/**
 * Benchmark Script cho AI Engine V11
 * Đo lường p50 / p95 Latency của quá trình tạo Video.
 */
const fetch = require('node-fetch'); // Đảm bảo node-fetch đã cài đặt, hoặc dùng fetch build-in của Node 18+

const ENDPOINT = 'http://localhost:3000/api/ai/scene-design';
const SAMPLES = [
  { prompt: "Nghệ thuật buông bỏ muộn phiền", style: "Thiền & Chữa Lành", n: 5 },
  { prompt: "AI tăng năng suất 10x cho coder", style: "Công Nghệ AI", n: 5 },
  { prompt: "Chiến lược cắt giảm chi phí doanh nghiệp", style: "Tài Chính & Business", n: 5 }
];

async function runBenchmark(iterations = 10) {
  console.log(`Starting benchmark with ${iterations} iterations per sample...`);
  const latencies = [];

  for (let i = 0; i < iterations; i++) {
    for (const sample of SAMPLES) {
      const startTime = Date.now();
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sample, targetDuration: 30 })
        });
        
        if (res.ok) {
          const latency = Date.now() - startTime;
          latencies.push(latency);
          console.log(`[Iter ${i+1}] ${sample.style} -> ${latency}ms`);
        } else {
          console.error(`[Iter ${i+1}] Error: ${res.statusText}`);
        }
      } catch (err) {
        console.error(`[Iter ${i+1}] Failed: ${err.message}`);
      }
    }
  }

  if (latencies.length === 0) {
    console.log("No successful requests. Is the server running?");
    return;
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log('\\n=== BENCHMARK RESULTS ===');
  console.log(`Total successful runs: ${latencies.length}`);
  console.log(`Average Latency: ${Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms`);
  console.log(`p50 Latency: ${p50}ms`);
  console.log(`p95 Latency: ${p95}ms`);
}

runBenchmark();
