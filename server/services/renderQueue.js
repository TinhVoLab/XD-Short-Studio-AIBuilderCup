/**
 * Hàng đợi render trên Google Cloud: API tạo job → lưu payload lên Cloud Storage → đẩy Cloud Task
 * gọi Render Worker (Cloud Run riêng, render ngay trong request nên CPU luôn được cấp, tính tiền theo request).
 *
 * Bật khi có RENDER_WORKER_URL; không có (dev local) → render nền trong tiến trình như trước.
 * Biến môi trường:
 *   RENDER_WORKER_URL       https://render-worker-xxxx.a.run.app (gốc service worker)
 *   RENDER_QUEUE            tên queue Cloud Tasks (mặc định "render")
 *   RENDER_QUEUE_LOCATION   region của queue (mặc định asia-southeast1)
 *   RENDER_TASKS_SA         service account Cloud Tasks dùng để ký OIDC gọi worker (có quyền run.invoker)
 *   GOOGLE_CLOUD_PROJECT    project (tuỳ chọn — mặc định lấy từ ADC)
 */
import { GoogleAuth } from 'google-auth-library';
import { adminStorage } from '../middlewares/auth.js';

export const WORKER_PATH = '/api/render/internal/run';
const INPUT_PREFIX = 'render-inputs/';

export const isQueueMode = () => Boolean(process.env.RENDER_WORKER_URL);

const googleAuth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

/** Payload project (scenes, audio…) có thể vượt 1 MB — giới hạn của Cloud Task — nên để trên Storage (tự xoá sau 1 ngày) */
export async function saveRenderInput(jobId, payload, user) {
  const file = adminStorage.bucket().file(`${INPUT_PREFIX}${jobId}.json`);
  await file.save(JSON.stringify({ payload, user }), { contentType: 'application/json', resumable: false });
}

export async function loadRenderInput(jobId) {
  const [buf] = await adminStorage.bucket().file(`${INPUT_PREFIX}${jobId}.json`).download();
  return JSON.parse(buf.toString('utf8'));
}

export async function deleteRenderInput(jobId) {
  await adminStorage.bucket().file(`${INPUT_PREFIX}${jobId}.json`).delete({ ignoreNotFound: true }).catch(() => {});
}

/**
 * Đẩy task gọi worker. dispatchDeadline đủ cho ngân sách render + tải lên;
 * thử lại do queue cấu hình (maxAttempts) — worker tự bỏ qua task trùng (claim job trong transaction).
 */
export async function enqueueRenderTask(jobId) {
  // Functions đặt GCLOUD_PROJECT; Cloud Run không đặt sẵn → lấy từ thông tin xác thực mặc định (ADC)
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || await googleAuth.getProjectId();
  const location = process.env.RENDER_QUEUE_LOCATION || 'asia-southeast1';
  const queue = process.env.RENDER_QUEUE || 'render';
  const base = process.env.RENDER_WORKER_URL.replace(/\/+$/, '');
  const client = await googleAuth.getClient();
  await client.request({
    url: `https://cloudtasks.googleapis.com/v2/projects/${project}/locations/${location}/queues/${queue}/tasks`,
    method: 'POST',
    data: {
      task: {
        // Hạn chờ worker trả lời = ngân sách render + thời gian tải lên / khởi động
        dispatchDeadline: `${(Number(process.env.RENDER_BUDGET_SEC) || 300) + 120}s`,
        httpRequest: {
          httpMethod: 'POST',
          url: `${base}${WORKER_PATH}`,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify({ jobId })).toString('base64'),
          oidcToken: { serviceAccountEmail: process.env.RENDER_TASKS_SA, audience: base },
        },
      },
    },
  });
}
