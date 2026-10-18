import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button, SectionHeader } from '@/components/ui';
import { useEditorStore } from '@/store/useEditorStore';

export type AdminTab = 'analytics' | 'users' | 'orders' | 'queue' | 'keys' | 'settings' | 'plans' | 'ai-logs';

interface AnalyticsTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
  onNavigateTab: (tab: AdminTab) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  adminFetch,
  showToast,
  onNavigateTab,
}) => {
  const currentUser = useEditorStore((s) => s.currentUser);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    freeUsers: 0,
    creatorUsers: 0,
    businessUsers: 0,
    adminUsers: 0,
    proUsersCount: 0,
    totalTransactions: 0,
    activeRendersCount: 0,
    serverUptimeSec: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [accountNumber, setAccountNumber] = useState('271090168');
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // 1. Metrics
      const mRes = await adminFetch('/metrics');
      if (mRes && mRes.ok) {
        setMetrics(await mRes.json());
      }

      // 2. Recent Transactions (top 4)
      const oRes = await adminFetch('/transactions');
      if (oRes && oRes.ok) {
        const oData = await oRes.json();
        if (Array.isArray(oData)) {
          setRecentOrders(oData);
        }
      }

      // 3. Settings for Bank Account display
      const sRes = await adminFetch('/settings');
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        if (sData?.accountNumber) {
          setAccountNumber(sData.accountNumber);
        }
      }
    } catch (err) {
      console.warn('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const handleManualApprove = async (email: string, uid: string, planTier: string = 'creator') => {
    const res = await adminFetch('/transactions/manual-approve', {
      method: 'POST',
      body: JSON.stringify({ email, uid, planTier }),
    });
    if (res && res.ok) {
      showToast(`Đã duyệt đơn và nâng cấp cho ${email || uid}`);
      loadAnalyticsData();
    }
  };

  return (
    <>
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardHighlight}`}>
          <span className={styles.metricLabel}>Tổng Doanh Thu VietQR</span>
          <div className={styles.metricValue} style={{ color: 'var(--accent)' }}>
            {metrics.totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <span className={styles.metricSubtext}>Từ {metrics.totalTransactions} giao dịch thành công</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Tổng Người Dùng</span>
          <div className={styles.metricValue}>{metrics.totalUsers}</div>
          <span className={styles.metricSubtext}>{metrics.freeUsers} tài khoản Free</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Khách Hàng Trả Phí</span>
          <div className={styles.metricValue} style={{ color: '#58a6ff' }}>
            {metrics.proUsersCount}
          </div>
          <span className={styles.metricSubtext}>
            {metrics.creatorUsers} Creator • {metrics.businessUsers} Business
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Render Đang Chạy</span>
          <div className={styles.metricValue} style={{ color: metrics.activeRendersCount > 0 ? 'var(--accent)' : 'inherit' }}>
            {metrics.activeRendersCount}
          </div>
          <span className={styles.metricSubtext}>Tiến trình Cloud Run máy chủ</span>
        </div>
      </div>

      {/* Two-Column Overview Hub */}
      <div className={styles.twoColGrid}>
        {/* Left Column: Recent Orders & System Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recent Transactions Widget */}
          <div className={styles.panel}>
            <SectionHeader
              title="Giao Dịch VietQR ACB Gần Nhất"
              subtitle="Theo dõi các giao dịch chuyển khoản mới phát sinh"
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigateTab('orders')}
                >
                  Xem Tất Cả ({recentOrders.length})
                </Button>
              }
            />

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Khách Hàng</th>
                    <th>Số Tiền</th>
                    <th>Gói</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 4).map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{tx.transactionId || tx.id}</td>
                      <td>{tx.userEmail || tx.userId || 'Khách vãng lai'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td>
                        <span className={`${styles.tag} ${styles.tagCreator}`}>
                          {tx.planTier?.toUpperCase() || 'PRO'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          color: tx.status === 'success' ? 'var(--success)' : 'var(--warning)',
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          {tx.status === 'success' ? 'Thành công' : 'Đang chờ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                        {isLoading ? 'Đang tải dữ liệu...' : 'Chưa có giao dịch nào được ghi nhận.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Health Specs */}
          <div className={styles.panel}>
            <SectionHeader
              title="Chỉ Số Vận Hành Hệ Thống"
              subtitle="Thông số kỹ thuật máy chủ và định danh tài khoản"
              badge={
                <span style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                  Cloud Run Active
                </span>
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Tỷ lệ nâng cấp (Conversion)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {metrics.totalUsers > 0 ? ((metrics.proUsersCount / metrics.totalUsers) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Tài khoản Super Admin</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{currentUser?.email || 'Super Admin'}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Ngân hàng tiếp nhận</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>ACB — {accountNumber}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User Distribution & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* User Tier Breakdown */}
          <div className={styles.panel}>
            <SectionHeader
              title="Phân Bổ Người Dùng"
              subtitle="Tỷ lệ cơ cấu người dùng trên hệ thống"
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigateTab('users')}
                >
                  CRM ({metrics.totalUsers})
                </Button>
              }
            />

            <div className={styles.planProgressRow}>
              <div className={styles.planProgressBar}>
                <div
                  className={styles.planProgressFill}
                  style={{
                    width: `${metrics.totalUsers > 0 ? (metrics.freeUsers / metrics.totalUsers) * 100 : 100}%`,
                    background: 'var(--surface-3)',
                  }}
                  title={`Free: ${metrics.freeUsers}`}
                />
                <div
                  className={styles.planProgressFill}
                  style={{
                    width: `${metrics.totalUsers > 0 ? (metrics.creatorUsers / metrics.totalUsers) * 100 : 0}%`,
                    background: 'var(--accent)',
                  }}
                  title={`Creator: ${metrics.creatorUsers}`}
                />
                <div
                  className={styles.planProgressFill}
                  style={{
                    width: `${metrics.totalUsers > 0 ? (metrics.businessUsers / metrics.totalUsers) * 100 : 0}%`,
                    background: '#58a6ff',
                  }}
                  title={`Business: ${metrics.businessUsers}`}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-sub)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--surface-3)' }} />
                    Gói Miễn Phí (Free)
                  </span>
                  <strong>{metrics.freeUsers} user</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-sub)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} />
                    Gói Creator Pro
                  </span>
                  <strong style={{ color: 'var(--accent)' }}>{metrics.creatorUsers} user</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-sub)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: '#58a6ff' }} />
                    Gói Business Pro
                  </span>
                  <strong style={{ color: '#58a6ff' }}>{metrics.businessUsers} user</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className={styles.panel}>
            <SectionHeader
              title="Thao Tác Quản Trị Nhanh"
              subtitle="Các lối tắt nghiệp vụ thường dùng"
            />

            <div className={styles.quickActionGrid}>
              <button
                type="button"
                className={styles.quickActionCard}
                onClick={() => {
                  const email = prompt('Nhập Email hoặc UID khách hàng cần duyệt gói Pro:');
                  if (email) handleManualApprove(email, '');
                }}
              >
                <span className={styles.quickActionTitle}>Duyệt Đơn Tay</span>
                <span className={styles.quickActionDesc}>Kích hoạt Pro trực tiếp cho user</span>
              </button>

              <button
                type="button"
                className={styles.quickActionCard}
                onClick={() => onNavigateTab('keys')}
              >
                <span className={styles.quickActionTitle}>Tạo License Key</span>
                <span className={styles.quickActionDesc}>Sinh mã kích hoạt cho CTV</span>
              </button>

              <button
                type="button"
                className={styles.quickActionCard}
                onClick={() => onNavigateTab('queue')}
              >
                <span className={styles.quickActionTitle}>Remotion Queue</span>
                <span className={styles.quickActionDesc}>Giám sát các luồng render video</span>
              </button>

              <button
                type="button"
                className={styles.quickActionCard}
                onClick={() => onNavigateTab('settings')}
              >
                <span className={styles.quickActionTitle}>Cài Đặt Ngân Hàng</span>
                <span className={styles.quickActionDesc}>Sửa STK ACB & giá cước</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
