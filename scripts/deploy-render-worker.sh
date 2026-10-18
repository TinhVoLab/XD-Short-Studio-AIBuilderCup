#!/usr/bin/env bash
# Deploy Render Worker (Cloud Run) + hàng đợi Cloud Tasks — chạy lại an toàn (idempotent).
#
#   npm run deploy:render-worker            # dựng image + deploy + cấu hình
#   SKIP_BUILD=1 npm run deploy:render-worker   # chỉ cập nhật cấu hình (dùng image mới nhất)
#
# Kiến trúc: API (Firebase Functions "api") tạo job → Cloud Tasks queue "render" → worker render NGAY TRONG request
# (CPU được cấp suốt request, tính tiền theo request, 0 instance khi rảnh). Worker không public: chỉ service
# account của Cloud Tasks (OIDC) gọi được.
set -euo pipefail

PROJECT="${PROJECT:-xd-short}"
REGION="${REGION:-asia-southeast1}"
SERVICE="${SERVICE:-render-worker}"
QUEUE="${QUEUE:-render}"
REPO="${REPO:-xd-short}"
CPU="${CPU:-8}"
MEMORY="${MEMORY:-16Gi}"
MAX_INSTANCES="${MAX_INSTANCES:-3}"      # trần chi phí = số render chạy song song tối đa
BUDGET_SEC="${BUDGET_SEC:-300}"          # ngân sách render mỗi video (video short, ≤ 5 phút)
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

WORKER_SA="render-worker@${PROJECT}.iam.gserviceaccount.com"   # danh tính của worker (Firestore, Storage)
TASKS_SA="render-tasks@${PROJECT}.iam.gserviceaccount.com"     # Cloud Tasks ký OIDC bằng SA này để gọi worker
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
API_SA="${API_SA:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"  # SA chạy function "api" (mặc định gen2)

say() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
gcloud config set project "$PROJECT" >/dev/null

say "Bật API cần thiết"
gcloud services enable run.googleapis.com cloudtasks.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com --quiet

say "Service account"
for sa in render-worker render-tasks; do
  gcloud iam service-accounts describe "${sa}@${PROJECT}.iam.gserviceaccount.com" >/dev/null 2>&1 \
    || gcloud iam service-accounts create "$sa" --display-name "XD-Short ${sa}"
done
for role in roles/datastore.user roles/storage.objectAdmin roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:${WORKER_SA}" --role "$role" --condition=None --quiet >/dev/null
done
# API được đẩy task và được "đóng vai" render-tasks khi gắn OIDC token
gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:${API_SA}" --role roles/cloudtasks.enqueuer --condition=None --quiet >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$TASKS_SA" --member "serviceAccount:${API_SA}" --role roles/iam.serviceAccountUser --quiet >/dev/null

if [[ -z "${SKIP_BUILD:-}" ]]; then
  say "Artifact Registry + dựng image (Cloud Build)"
  gcloud artifacts repositories describe "$REPO" --location "$REGION" >/dev/null 2>&1 \
    || gcloud artifacts repositories create "$REPO" --repository-format docker --location "$REGION"
  gcloud builds submit --config cloudbuild.render.yaml --substitutions "_IMAGE=${IMAGE}" .
else
  IMAGE="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(spec.template.spec.containers[0].image)')"
fi

say "Deploy ${SERVICE}"
gcloud run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" \
  --service-account "$WORKER_SA" \
  --no-allow-unauthenticated \
  --execution-environment gen2 --cpu "$CPU" --memory "$MEMORY" --cpu-boost \
  --concurrency 1 --timeout "$((BUDGET_SEC + 120))" \
  --min-instances 0 --max-instances "$MAX_INSTANCES" \
  --set-env-vars "RENDER_WORKER=1,RENDER_BUDGET_SEC=${BUDGET_SEC},RENDER_CONCURRENCY=${CPU},RENDER_GL=angle,RENDER_CHROME_GPU_OFF=0,GCLOUD_PROJECT=${PROJECT}" \
  --quiet
WORKER_URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
gcloud run services add-iam-policy-binding "$SERVICE" --region "$REGION" \
  --member "serviceAccount:${TASKS_SA}" --role roles/run.invoker --quiet >/dev/null

say "Hàng đợi Cloud Tasks '${QUEUE}' (tối đa ${MAX_INSTANCES} render song song, thử lại 1 lần)"
QUEUE_FLAGS=(--location "$REGION" --max-concurrent-dispatches "$MAX_INSTANCES" --max-dispatches-per-second 1 \
  --max-attempts 2 --min-backoff 15s --max-backoff 60s)
gcloud tasks queues describe "$QUEUE" --location "$REGION" >/dev/null 2>&1 \
  && gcloud tasks queues update "$QUEUE" "${QUEUE_FLAGS[@]}" --quiet >/dev/null \
  || gcloud tasks queues create "$QUEUE" "${QUEUE_FLAGS[@]}"

say "Ghi cấu hình cho function 'api' (.env.${PROJECT} — Firebase tự nạp khi deploy functions)"
cat > ".env.${PROJECT}" <<EOF
RENDER_WORKER_URL=${WORKER_URL}
RENDER_TASKS_SA=${TASKS_SA}
RENDER_QUEUE=${QUEUE}
RENDER_QUEUE_LOCATION=${REGION}
RENDER_BUDGET_SEC=${BUDGET_SEC}
EOF

say "Xong. Worker: ${WORKER_URL}"
echo "Bước tiếp: npm run deploy:functions  (để API chuyển sang đẩy job vào hàng đợi)"
