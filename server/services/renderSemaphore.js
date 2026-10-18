import os from 'os';

/**
 * RenderSemaphore — Server-Wide Render Concurrency Limiter & FIFO Waiting Queue.
 * Prevents Chromium process explosion, OOM crashes, and CPU starvation under heavy multi-user load.
 */
export class RenderSemaphore {
  constructor(maxConcurrency = 2) {
    this.max = maxConcurrency;
    this.active = new Set(); // Set<jobId>
    this.waiting = [];       // Array<{ jobId: string, resolve: Function, reject: Function, queuedAt: number }>
  }

  /**
   * Acquire a render slot.
   * If slot available, resolves immediately.
   * Otherwise, queues the job and resolves when a slot frees up.
   * @param {string} jobId 
   * @returns {Promise<void>}
   */
  async acquire(jobId) {
    if (this.active.size < this.max) {
      this.active.add(jobId);
      console.log(`[Render Semaphore] 🟢 Slot acquired for ${jobId} (Active: ${this.active.size}/${this.max})`);
      return;
    }

    const pos = this.waiting.length + 1;
    console.log(`[Render Semaphore] ⏳ Queuing ${jobId} at position #${pos} (Active: ${this.active.size}/${this.max}, Waiting: ${pos})`);

    return new Promise((resolve, reject) => {
      this.waiting.push({
        jobId,
        resolve,
        reject,
        queuedAt: Date.now(),
      });
    });
  }

  /**
   * Release a render slot and dispatch next waiting job if any.
   * @param {string} jobId 
   */
  release(jobId) {
    const wasActive = this.active.delete(jobId);
    if (wasActive) {
      console.log(`[Render Semaphore] ⚪ Slot released by ${jobId} (Active: ${this.active.size}/${this.max})`);
    }

    // Trigger the next job in FIFO queue if slot available
    while (this.waiting.length > 0 && this.active.size < this.max) {
      const next = this.waiting.shift();
      this.active.add(next.jobId);
      console.log(`[Render Semaphore] 🚀 Promoted queued job ${next.jobId} to active (Active: ${this.active.size}/${this.max}, Remaining Waiting: ${this.waiting.length})`);
      next.resolve();
    }
  }

  /**
   * Cancel a job that is still waiting in the queue before it starts rendering.
   * @param {string} jobId 
   * @returns {boolean} true if was waiting and cancelled
   */
  cancelWaiting(jobId) {
    const idx = this.waiting.findIndex(w => w.jobId === jobId);
    if (idx !== -1) {
      const [removed] = this.waiting.splice(idx, 1);
      console.log(`[Render Semaphore] ❌ Removed waiting job ${jobId} from queue`);
      removed.reject(new Error('CANCELLED_IN_QUEUE'));
      return true;
    }
    return false;
  }

  /**
   * Get 1-based queue position (0 if not in waiting queue).
   * @param {string} jobId 
   * @returns {number}
   */
  getQueuePosition(jobId) {
    const idx = this.waiting.findIndex(w => w.jobId === jobId);
    return idx === -1 ? 0 : idx + 1;
  }

  /**
   * Inspection metadata for admin metrics & health dashboard.
   */
  getInfo() {
    return {
      maxConcurrency: this.max,
      activeCount: this.active.size,
      queueLength: this.waiting.length,
      activeJobIds: Array.from(this.active),
      waitingJobIds: this.waiting.map(w => w.jobId),
    };
  }
}

// ── Smart Dynamic Capacity Determination based on Host Environment ──
function computeOptimalMaxRenderJobs() {
  const envOverride = Number(process.env.MAX_RENDER_JOBS);
  if (!isNaN(envOverride) && envOverride > 0) {
    return envOverride;
  }

  const cpuCount = os.cpus()?.length || 4;
  const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

  // Memory is the primary bottleneck for Chromium rendering
  if (totalMemGB <= 2) {
    return 1; // Cloud Run 2GB: strictly 1 render job at a time
  } else if (totalMemGB <= 4) {
    return 2; // Small host: max 2 concurrent jobs
  } else if (totalMemGB <= 8) {
    return 3; // Medium host: max 3 concurrent jobs
  } else {
    // Large host: max half CPU cores, capped at 5
    return Math.min(Math.max(2, Math.floor(cpuCount / 2)), 5);
  }
}

export const renderSemaphore = new RenderSemaphore(computeOptimalMaxRenderJobs());
