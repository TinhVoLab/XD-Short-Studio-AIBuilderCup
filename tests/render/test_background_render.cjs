/**
 * Test Asynchronous Background Render Queue
 */
const http = require('http');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('🚀 Testing Background Render Queue Endpoint (/api/render/start)...');

  const payload = JSON.stringify({
    scenes: [
      {
        id: "bg-test-1",
        name: "Cảnh 1",
        duration: 3,
        bgColor: "#060D16",
        bgPattern: "grid",
        elements: [
          {
            id: "el-1",
            type: "text",
            left: 180,
            top: 200,
            width: 300,
            height: 60,
            content: "ASYNC RENDER",
            fontSize: 28,
            fontFamily: "Be Vietnam Pro",
            fontWeight: 900,
            color: "#BEFF01",
            textAlign: "center"
          }
        ]
      }
    ],
    durationInFrames: 90,
    scale: 2, // 720p fast
    targetFps: 30
  });

  const startReq = performance.now();

  const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/render/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', async () => {
      const respTime = ((performance.now() - startReq)).toFixed(1);
      console.log(`✓ API Response Time: ${respTime}ms (Expected < 100ms)`);
      
      const json = JSON.parse(body);
      console.log('✓ Received response:', json);

      if (!json.jobId) {
        console.error('❌ Failed: No jobId returned');
        process.exit(1);
      }

      console.log(`\n⏳ Polling background job status for ${json.jobId}...`);
      
      const poll = setInterval(async () => {
        http.get(`http://localhost:4000/api/render/status/${json.jobId}`, (statusRes) => {
          let sBody = '';
          statusRes.on('data', c => sBody += c);
          statusRes.on('end', () => {
            const status = JSON.parse(sBody);
            process.stdout.write(`↳ Status: ${status.status} (${Math.round((status.progress || 0) * 100)}%)\r`);

            if (status.status === 'completed') {
              clearInterval(poll);
              console.log(`\n\n🎉 Job Completed Successfully!`);
              console.log(`✓ File: ${status.outputFilename}`);
              console.log(`✓ Download URL: ${status.downloadUrl}`);
              console.log(`✓ Render Time: ${status.renderTimeSec}s`);
              console.log(`✓ Size: ${(status.fileSize / 1024 / 1024).toFixed(2)} MB`);
              process.exit(0);
            } else if (status.status === 'failed') {
              clearInterval(poll);
              console.error(`\n❌ Job Failed:`, status.error);
              process.exit(1);
            }
          });
        });
      }, 500);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error (Make sure server.js is running):', e.message);
  });

  req.write(payload);
  req.end();
}

main();
