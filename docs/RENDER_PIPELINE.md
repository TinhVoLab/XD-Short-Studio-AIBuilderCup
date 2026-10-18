# Render pipeline trên Google Cloud

Video short (≤ 90 giây, 1080×1920) render xong trong **≤ 5 phút** (ngân sách `RENDER_BUDGET_SEC`), chỉ trả tiền khi đang render.

```
Client ──POST /api/render/start──▶ API (Firebase Functions gen2 "api")
                                     │ quota + trần độ dài/ngân sách
                                     │ job → Firestore render_jobs · payload → Storage render-inputs/
                                     ▼
                              Cloud Tasks queue "render"  (≤ MAX_INSTANCES song song, thử lại 1 lần)
                                     │ HTTPS + OIDC (SA render-tasks)
                                     ▼
                       Render Worker (Cloud Run "render-worker", Dockerfile.cloudrun, RENDER_WORKER=1)
                       claim job (transaction) → render TRONG request → MP4 → Storage renders/
                                     │ tiến độ ~2s/lần → Firestore
                                     ▼
Client ◀── Firestore onSnapshot render_jobs/{jobId} (dự phòng: GET /api/render/status)
```

## Vì sao thiết kế như vậy

| Quyết định | Lý do |
|---|---|
| Render **trong** request của worker | Cloud Run chỉ cấp CPU khi có request đang mở; render nền sau khi trả lời (cách cũ) bị bóp CPU. Cách này giữ mô hình tính tiền theo request (gói miễn phí, 0 đồng khi rảnh) |
| Cloud Tasks thay vì gọi thẳng | Hàng đợi + giới hạn song song (= trần chi phí) + tự thử lại khi instance chết |
| Worker `concurrency=1` | Mỗi render dùng trọn CPU; không chen API vào máy đang render |
| Trạng thái job ở Firestore | Không phụ thuộc instance (SSE / bộ nhớ chỉ đúng khi trúng đúng máy) |
| Payload ở Storage | Cloud Task giới hạn 1 MB; file tự xoá sau 1 ngày (`storage-lifecycle.json`) |
| Claim job trong transaction | Task gửi trùng không render hai lần; job "mồ côi" (instance chết) được nhận lại sau ngân sách + 60s |
| Chrome headless-shell tải sẵn trong image | Instance mới render ngay, không tải Chrome lúc khởi động lạnh |
| Quota ghi nguyên tử (`increment`, xoá đúng `activeJobs.<jobId>`) | API và worker là các instance khác nhau; job lỗi phía server được hoàn lượt |

## Deploy

```bash
gcloud auth login && gcloud config set project xd-short
npm run deploy:render-worker        # image + worker + queue + IAM, ghi .env.xd-short (URL worker cho API)
npm run deploy:functions            # API chuyển sang đẩy job vào hàng đợi
```

Chỉ cập nhật cấu hình worker (không dựng lại image): `SKIP_BUILD=1 npm run deploy:render-worker`.
Thông số: `CPU`, `MEMORY`, `MAX_INSTANCES`, `BUDGET_SEC` (biến môi trường của script).

### Bí mật (Secret Manager)

```bash
npx firebase-tools functions:secrets:set GEMINI_API_KEY
npx firebase-tools functions:secrets:set TELEGRAM_BOT_TOKEN
npx firebase-tools functions:secrets:set PAYMENT_WEBHOOK_SECRET
echo "FUNCTION_SECRETS=GEMINI_API_KEY,TELEGRAM_BOT_TOKEN,PAYMENT_WEBHOOK_SECRET" >> .env.xd-short
npm run deploy:functions
```

### Cảnh báo chi phí & lỗi

```bash
# Ngân sách tháng (đổi BILLING_ACCOUNT, số tiền)
gcloud billing budgets create --billing-account=BILLING_ACCOUNT --display-name="xd-short" \
  --budget-amount=10USD --threshold-rule=percent=0.5 --threshold-rule=percent=0.9
```
Cloud Monitoring → Alerting: `run.googleapis.com/request_latencies` (service `render-worker`, p95 > 170 000 ms)
và tỉ lệ `render_jobs.status = failed` qua log-based metric `jsonPayload.message:"Job * Failed"`.

## Cấu hình

| Biến | Nơi | Ý nghĩa |
|---|---|---|
| `RENDER_WORKER_URL` | API | Bật chế độ hàng đợi (không có → render trong tiến trình, dùng cho dev) |
| `RENDER_TASKS_SA`, `RENDER_QUEUE`, `RENDER_QUEUE_LOCATION` | API | Queue & SA ký OIDC |
| `MAX_RENDER_VIDEO_SEC` (90) | API | Trần độ dài video |
| `RENDER_EST_FPS` | API | Tốc độ render đo trên worker → từ chối sớm job vượt ngân sách |
| `RENDER_WORKER=1` | Worker | Đăng ký `/api/render/internal/run` |
| `RENDER_BUDGET_SEC` (300) | API + Worker | Ngân sách render mỗi video; timeout worker & hạn Cloud Task = ngân sách + 120s |
| `RENDER_CONCURRENCY` | Worker | Số tab Chrome render song song (= vCPU) |
| `RENDER_X264_PRESET` (veryfast) | Worker | Tốc độ mã hoá |

## Đo hiệu năng

`npm run bench:render` (DURATIONS / CONCURRENCY / PRESETS) — render project mẫu giống video AI Wizard.
Trên worker: chạy cùng script trong container, đặt `RENDER_EST_FPS` bằng fps đo được × 0.9.

Baseline local (MacBook 10 CPU, 1080×1920, project mẫu — 2026-10-09):

| Video | 2 tab · medium | 2 tab · veryfast | 4 tab · veryfast | Dung lượng |
|---|---|---|---|---|
| 15s | 25.1s | 22.8s | 20.7s | 8 MB |
| 30s | 57.1s | 52.8s | 48.4s | 16 MB |
| 60s | 112.7s | 105.2s | 102.6s | 30 MB |

`veryfast` nhanh hơn ~7–10% với dung lượng gần như bằng; tăng 2 → 4 tab chỉ thêm ~3–9% → nút cổ chai không nằm ở
số tab.

Trên Render Worker (Cloud Run, asia-southeast1, gen2 — `node tests/render/workerSmoke.mjs`):

| Video | 4 vCPU / 8 GiB | 8 vCPU / 16 GiB |
|---|---|---|
| 15s | 60s (8 fps) | 43s (12.5 fps) |
| 30s | 126s (7.3 fps) | — |
| 60s | > 180s (6.4 fps) | ~230s (7.8 fps) |

Backend Chrome (video 15s, 8 vCPU): mặc định tắt GPU 52s · **`angle` 46s (chọn)** · `swangle` 208s (chậm 4×) ·
concurrency > số nhân CPU bị Remotion từ chối. Tăng 4 → 8 vCPU không rút ngắn video 30s → nút thắt không nằm ở số CPU;
phần còn lại do nội dung (camera động trên cả khung ~25%, hiệu ứng widget) — xem phân tích chi phí theo frame.

Cloud chậm hơn MacBook ~2.5–3× → chọn 8 vCPU + ngân sách 300s. Chi phí ước tính (giá Tier 1, đối chiếu bảng giá):
60s video ≈ 1 900 vCPU-s + 3 800 GiB-s ≈ $0.05; gói miễn phí tháng (180 000 vCPU-s) ≈ 90 video 60s hoặc ~500 video 15s.

## Sự cố thường gặp

- **Job đứng ở `queued`**: kiểm tra queue (`gcloud tasks queues describe render --location asia-southeast1`),
  quyền `roles/run.invoker` của `render-tasks` trên worker, log worker.
- **Job `failed` "quá thời gian"**: video vượt ngân sách — tăng `CPU` worker hoặc giảm độ dài; không tính vào quota.
- **Huỷ**: API đặt `cancelRequested` trên Firestore; worker đọc mỗi 3s và huỷ `renderMedia` (cancelSignal).
