import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button, SectionHeader } from '@/components/ui';
import { GEMINI_SCRIPT_MODELS } from '@/config/aiModels'
import { WIZARD_TEMPLATE_PRESETS } from '@/components/AiWizardModal/config/wizardCatalog'

interface AiLogRecord {
  sessionId: string;
  dateKey: string;
  createdAt: string;
  userId: string | null;
  userEmail: string;
  userTier: string;
  model: string;
  sceneCount: number;
  targetDurationSec: number;
  promptSnippet: string;
  voiceoversSummary: string[];
  tokens: {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens: number;
    totalTokens: number;
    promptCacheHitTokens: number;
  };
  costUsd: number;
  costVnd: number;
  savedCostUsd: number;
  keySource: 'system_pool' | 'user_byok';
  status: 'success' | 'failed';
  error: string | null;
  cacheHit: boolean;
  latencyMs: {
    stage1Ms: number;
    stage2Ms: number;
    totalMs: number;
  };
  ttsCharacters?: number;
  /** Khung kịch bản của wizard ('master-chain', 'edu-concept'…); log cũ không có */
  framework?: string | null;
}

interface AiDailySummary {
  dateKey: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  cacheHits: number;
  byokRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  totalCostVnd: number;
  totalSavedCostUsd: number;
  avgLatencyMs: number;
  totalTtsCharacters: number;
}

interface AiGenerationLogsTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const AiGenerationLogsTab: React.FC<AiGenerationLogsTabProps> = ({ adminFetch, showToast }) => {
  const [summary, setSummary] = useState<AiDailySummary>({
    dateKey: '',
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 100,
    cacheHits: 0,
    byokRequests: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    totalCostVnd: 0,
    totalSavedCostUsd: 0,
    avgLatencyMs: 0,
    totalTtsCharacters: 0,
  });

  const [logs, setLogs] = useState<AiLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AiLogRecord | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch KPI daily summary
      const sumRes = await adminFetch('/ai-logs/summary');
      if (sumRes && sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.summary) {
          setSummary(sumData.summary);
        }
      }

      // 2. Fetch log records with filters
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (tierFilter) params.set('tier', tierFilter);
      if (modelFilter) params.set('model', modelFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');

      const logsRes = await adminFetch(`/ai-logs?${params.toString()}`);
      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        if (Array.isArray(logsData.logs)) {
          setLogs(logsData.logs);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load AI logs:', err);
      showToast('Không thể tải nhật ký AI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tierFilter, modelFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '--:--';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' +
             d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* ── 4 KPI Summary Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardHighlight}`}>
          <span className={styles.metricLabel}>Tổng Token &amp; Chi phí hôm nay</span>
          <span className={styles.metricValue}>
            {summary.totalTokens.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-sub)' }}>Tokens</span>
          </span>
          <span className={styles.metricSubtext}>
            ${summary.totalCostUsd.toFixed(4)} USD (~{summary.totalCostVnd.toLocaleString()} đ)
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Tỷ lệ thành công &amp; Lượt tạo</span>
          <span className={styles.metricValue}>
            {summary.successRate}%
          </span>
          <span className={styles.metricSubtext}>
            {summary.successfulRequests} thành công / {summary.totalRequests} yêu cầu
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Độ trễ trung bình (SLA)</span>
          <span className={styles.metricValue}>
            {(summary.avgLatencyMs / 1000).toFixed(1)}s
          </span>
          <span className={styles.metricSubtext}>
            Thời gian phản hồi trung bình 2 giai đoạn
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Tiết kiệm từ Cache &amp; BYOK</span>
          <span className={styles.metricValue} style={{ color: 'var(--accent)' }}>
            +${summary.totalSavedCostUsd.toFixed(3)}
          </span>
          <span className={styles.metricSubtext}>
            {summary.cacheHits} Cache hits &bull; {summary.byokRequests} User Key
          </span>
        </div>
      </div>

      {/* ── Main Data Panel ── */}
      <div className={styles.panel}>
        <SectionHeader
          title={`Nhật Ký Tạo Kịch Bản Wizard (${logs.length})`}
          subtitle="Giám sát chi tiết token, mô hình, chi phí và thời gian xử lý của từng phiên AI"
          action={
            <Button
              variant="secondary"
              size="xs"
              onClick={loadData}
              disabled={isLoading}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              }
            >
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          }
        />

        {/* ── Filter Bar ── */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="Tìm theo email, ý tưởng prompt, session..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '7px 12px',
                color: 'var(--text)',
                fontSize: '11.5px',
                outline: 'none',
              }}
            />
            <Button variant="secondary" size="xs" type="submit">Tìm</Button>
          </form>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: '11.5px',
              outline: 'none',
            }}
          >
            <option value="">Tất cả gói</option>
            <option value="free">Gói Free</option>
            <option value="creator">Gói Creator</option>
            <option value="business">Gói Business</option>
            <option value="admin">Gói Admin</option>
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: '11.5px',
              outline: 'none',
            }}
          >
            <option value="">Tất cả mô hình</option>
            {GEMINI_SCRIPT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
            <option value="deepseek-chat">DeepSeek V3 (chat)</option>
            <option value="deepseek-reasoner">DeepSeek R1 (reasoner)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: '11.5px',
              outline: 'none',
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-sub)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Thời gian</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Người dùng</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Mô hình</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Quy mô</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Tokens</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Chi phí</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Khóa API</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Thời gian</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isLoading ? 'Đang tải dữ liệu...' : 'Chưa có nhật ký AI nào phù hợp bộ lọc.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  return (
                    <tr
                      key={log.sessionId}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{log.userEmail}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.userTier.toUpperCase()}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          background: log.model.includes('deepseek') ? 'rgba(0, 212, 255, 0.1)' : 'rgba(190, 255, 1, 0.1)',
                          color: log.model.includes('deepseek') ? '#00d4ff' : 'var(--accent)',
                          border: log.model.includes('deepseek') ? '1px solid rgba(0, 212, 255, 0.25)' : '1px solid rgba(190, 255, 1, 0.25)',
                        }}>
                          {log.model}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {log.sceneCount} cảnh ({log.targetDurationSec}s)
                        {log.framework && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {WIZARD_TEMPLATE_PRESETS.find((p) => p.frameworkId === log.framework)?.name || log.framework}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{log.tokens.totalTokens.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {log.tokens.promptTokens} in / {log.tokens.completionTokens} out
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {log.keySource === 'user_byok' ? (
                          <span style={{ color: 'var(--text-muted)' }}>$0 (BYOK)</span>
                        ) : log.cacheHit ? (
                          <span style={{ color: 'var(--accent)' }}>$0 (Cache)</span>
                        ) : (
                          <div style={{ fontWeight: 600 }}>
                            ${log.costUsd.toFixed(4)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                              ~{log.costVnd.toLocaleString()} đ
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {log.keySource === 'user_byok' ? (
                          <span style={{ color: 'var(--text-sub)', fontSize: '10px' }}>Khóa User</span>
                        ) : (
                          <span style={{ color: 'var(--accent)', fontSize: '10px' }}>Hệ Thống</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {(log.latencyMs.totalMs / 1000).toFixed(1)}s
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: isSuccess ? 'rgba(46, 160, 67, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                          color: isSuccess ? '#3fb950' : '#f85149',
                        }}>
                          {isSuccess ? 'Thành công' : 'Thất bại'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedLog(log)}
                        >
                          Xem
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-over Detail Drawer / Modal ── */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 9999,
        }}>
          <div style={{
            width: '540px',
            maxWidth: '100%',
            height: '100%',
            background: 'var(--surface-1)',
            borderLeft: '1px solid var(--border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>Chi Tiết Phiên Sinh AI</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mã phiên: {selectedLog.sessionId}</span>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>

            {/* Thông tin cốt lõi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Người dùng</span>
                <strong>{selectedLog.userEmail}</strong> ({selectedLog.userTier.toUpperCase()})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mô hình AI</span>
                <strong>{selectedLog.model}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Số cảnh / Thời lượng</span>
                <strong>{selectedLog.sceneCount} cảnh</strong> &bull; {selectedLog.targetDurationSec} giây
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Nguồn Khóa</span>
                <strong>{selectedLog.keySource === 'user_byok' ? 'User BYOK (Miễn phí server)' : 'Hệ thống (Tính tiền)'}</strong>
              </div>
            </div>

            {/* Phân rã độ trễ */}
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Phân Rã Thời Gian Xử Lý (Latency)</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)' }}>
                <span>Stage 1 (Biên kịch kịch bản):</span>
                <strong>{(selectedLog.latencyMs.stage1Ms / 1000).toFixed(2)}s</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)' }}>
                <span>Stage 2 (Bố cục Motion Graphics):</span>
                <strong>{(selectedLog.latencyMs.stage2Ms / 1000).toFixed(2)}s</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                <span>Tổng thời gian phản hồi:</span>
                <strong>{(selectedLog.latencyMs.totalMs / 1000).toFixed(2)}s</strong>
              </div>
            </div>

            {/* Phân bổ Token & Tiền */}
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Phân Bổ Token &amp; Chi Phí</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)' }}>
                <span>Prompt Tokens (Đầu vào):</span>
                <strong>{selectedLog.tokens.promptTokens.toLocaleString()}</strong>
              </div>
              {selectedLog.tokens.promptCacheHitTokens > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                  <span>Cache Hit Read (Chiết khấu rẻ 90%):</span>
                  <strong>{selectedLog.tokens.promptCacheHitTokens.toLocaleString()}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)' }}>
                <span>Completion Tokens (Đầu ra):</span>
                <strong>{selectedLog.tokens.completionTokens.toLocaleString()}</strong>
              </div>
              {selectedLog.tokens.reasoningTokens > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)' }}>
                  <span>Reasoning Tokens (Suy luận R1):</span>
                  <strong>{selectedLog.tokens.reasoningTokens.toLocaleString()}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                <span>Tổng Token tiêu hao:</span>
                <strong>{selectedLog.tokens.totalTokens.toLocaleString()} Tokens</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                <span>Chi phí ước tính:</span>
                <strong>${selectedLog.costUsd.toFixed(4)} (~{selectedLog.costVnd.toLocaleString()} đ)</strong>
              </div>
            </div>

            {/* Ý tưởng ban đầu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text)' }}>Ý Tưởng Ban Đầu (User Prompt):</span>
              <div style={{ background: 'var(--surface-2)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-sub)', lineHeight: '1.5' }}>
                {selectedLog.promptSnippet || '(Không có thông tin)'}
              </div>
            </div>

            {/* Tóm tắt lời thoại các cảnh */}
            {selectedLog.voiceoversSummary && selectedLog.voiceoversSummary.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text)' }}>Lời Thoại Kịch Bản Đã Sinh:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedLog.voiceoversSummary.map((vo, i) => (
                    <div key={i} style={{ background: 'var(--surface-2)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-sub)' }}>
                      {vo}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thông báo lỗi nếu thất bại */}
            {selectedLog.error && (
              <div style={{ background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)', padding: '10px 12px', borderRadius: '6px', color: '#f85149', fontSize: '11.5px' }}>
                <strong>Thông báo lỗi:</strong> {selectedLog.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
