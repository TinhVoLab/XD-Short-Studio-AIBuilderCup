import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { SectionHeader } from '@/components/ui';

interface RenderQueueTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const RenderQueueTab: React.FC<RenderQueueTabProps> = ({ adminFetch, showToast }) => {
  const [queueList, setQueueList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/render-queue');
      if (res && res.ok) {
        setQueueList(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleKillJob = async (jobId: string) => {
    const res = await adminFetch(`/render-queue/${jobId}/kill`, { method: 'POST' });
    if (res && res.ok) {
      showToast(`Đã hủy tiến trình render ${jobId}`);
      loadQueue();
    }
  };

  return (
    <div className={styles.panel}>
      <SectionHeader
        title={`Hàng Đợi Render Remotion (${queueList.length})`}
        subtitle="Danh sách các tác vụ render video đang chạy song song trên Express backend"
        action={
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Tự động làm mới khi bấm Làm Mới
          </span>
        }
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã Job</th>
              <th>Email User</th>
              <th>Trạng Thái</th>
              <th>Tiến Độ</th>
              <th>Thời Gian Tạo</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {queueList.map((j) => (
              <tr key={j.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{j.id}</td>
                <td>{j.userEmail || j.userId || '—'}</td>
                <td>
                  <span
                    style={{
                      color: j.status === 'completed' ? '#3fb950' : j.status === 'failed' ? '#ff5555' : 'var(--accent)',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}
                  >
                    ● {j.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((j.progress || 0) * 100)}%`, height: '100%', background: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: 10 }}>{Math.round((j.progress || 0) * 100)}%</span>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {j.createdAt ? new Date(j.createdAt).toLocaleTimeString('vi-VN') : '—'}
                </td>
                <td>
                  {(j.status === 'rendering' || j.status === 'queued') && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleKillJob(j.id)}
                    >
                      Hủy Job
                    </button>
                  )}
                  {j.status === 'completed' && j.downloadUrl && (
                    <a href={j.downloadUrl} target="_blank" rel="noreferrer" className={styles.actionBtn}>
                      Tải video
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {queueList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  {isLoading ? 'Đang tải hàng đợi render...' : 'Không có video nào đang trong hàng đợi render.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
