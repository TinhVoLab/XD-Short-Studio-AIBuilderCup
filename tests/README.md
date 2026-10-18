# XD-Short Studio — Test Suite & Benchmark Guide

Thư mục này chứa toàn bộ các công cụ kiểm thử (tests) và đo lường hiệu năng (benchmarks) của XD-Short Studio.

---

## 1. Cấu trúc thư mục

```text
tests/
├── README.md               # Tài liệu hướng dẫn sử dụng test suite
├── api/                    # Kiểm thử kết nối API & AI Services
│   ├── test_api.cjs        # Test endpoint /api/ai/scene-design
│   ├── test_genai.cjs      # Test kết nối trực tiếp Google Gemini SDK
│   └── test_probe.cjs      # Kiểm tra thời lượng file âm thanh cache bằng ffprobe
├── render/                 # Kiểm thử Remotion Video Render Engine
│   ├── test_render.cjs     # Render thử video 10s và đo đạc sync âm thanh
│   ├── test_background_render.cjs # Test hàng đợi xuất video nền (/api/render/start)
│   └── test_cloud_render_10s.cjs  # Benchmark xuất video 10s đa độ phân giải (360p, 720p, 1080p)
├── benchmark/              # Đánh giá hiệu năng tổng thể
│   ├── benchmark.cjs       # Benchmark toàn diện (Edge-TTS + Remotion Bundle + Render)
│   ├── benchmark_layout.cjs # Đo lường độ trễ bố cục layout
│   ├── benchmark_deepseek.js # Kiểm tra tốc độ & độ tin cậy DeepSeek AI
│   └── benchmark_full_comparison.js # So sánh tốc độ giữa các mô hình AI
└── output/                 # Thư mục lưu video xuất ra từ các bài test (được gitignore tự động)
```

---

## 2. Các lệnh chạy nhanh (NPM Scripts)

Bạn có thể chạy trực tiếp từ Terminal tại thư mục gốc:

```bash
# Kiểm thử kết nối AI Scene Design API
npm run test:api

# Kiểm thử Render Video Remotion 10s
npm run test:render

# Kiểm thử Hàng đợi Render chạy ngầm
npm run test:render:bg

# Chạy Benchmark toàn diện hệ thống
npm run test:benchmark
```

---

## 3. Chạy từng script đơn lẻ

Nếu muốn chạy một script bất kỳ:

```bash
node tests/api/test_api.cjs
node tests/render/test_background_render.cjs
node tests/benchmark/benchmark.cjs
```
