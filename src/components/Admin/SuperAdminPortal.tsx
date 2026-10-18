import React, { useState, useEffect, useCallback } from 'react';
import styles from './SuperAdminPortal.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui';
import { API_BASE } from '@/config/api';
import {
  AnalyticsTab,
  AdminTab,
} from './tabs/AnalyticsTab';
import { UsersManagerTab } from './tabs/UsersManagerTab';
import { OrdersManagerTab } from './tabs/OrdersManagerTab';
import { RenderQueueTab } from './tabs/RenderQueueTab';
import { LicenseKeysTab } from './tabs/LicenseKeysTab';
import { SystemSettingsTab } from './tabs/SystemSettingsTab';
import { PlanManagerTab } from './tabs/PlanManagerTab';
import { AiGenerationLogsTab } from './tabs/AiGenerationLogsTab';

interface SuperAdminPortalProps {
  onBackToStudio: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ onBackToStudio }) => {
  const { firebaseUser, signOutUser, showToast } = useEditorStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [refreshKey, setRefreshKey] = useState(0);
  const [uptimeSec, setUptimeSec] = useState(0);

  // Helper for authenticated admin fetch
  const adminFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      if (!firebaseUser) return null;
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/admin${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
          },
        });
        if (res.status === 403) {
          showToast('403: Không có quyền truy cập Super Admin', 3000);
          return null;
        }
        return res;
      } catch (err) {
        console.warn(`Admin fetch error (${endpoint}):`, err);
        return null;
      }
    },
    [firebaseUser, showToast]
  );

  // Load server uptime
  useEffect(() => {
    adminFetch('/metrics').then(async (res) => {
      if (res && res.ok) {
        const data = await res.json();
        if (typeof data.serverUptimeSec === 'number') {
          setUptimeSec(data.serverUptimeSec);
        }
      }
    });
  }, [adminFetch, refreshKey]);

  return (
    <div className={styles.container}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoRow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>XD-SHORT ADMIN</span>
          </div>
          <div className={styles.adminBadge}>Super Admin Portal</div>
        </div>

        <nav className={styles.navMenu}>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Tổng Quan &amp; Doanh Thu</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Khách Hàng &amp; Bản Quyền</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span>Đơn Hàng &amp; VietQR ACB</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'queue' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Giám Sát Render Live</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'keys' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('keys')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2l-2 2m-1.5 6.1L12 17.5V22h4.5l1.6-1.6 2-2 1.5-1.5" />
              <circle cx="7.5" cy="7.5" r="4.5" />
            </svg>
            <span>Mã Bản Quyền &amp; CTV</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>Cài Đặt ACB &amp; Hệ Thống</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'plans' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Gói Cước &amp; Bảng Giá</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'ai-logs' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('ai-logs')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>Nhật Ký AI &amp; Token</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <Button
            variant="ghost"
            size="xs"
            fullWidth
            leftIcon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            }
            onClick={onBackToStudio}
          >
            Quay Về Studio
          </Button>

          <Button
            variant="danger"
            size="xs"
            fullWidth
            leftIcon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            }
            onClick={async () => {
              await signOutUser();
              onBackToStudio();
            }}
          >
            Đăng Xuất Admin
          </Button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <h2 className={styles.topBarTitle}>
            {activeTab === 'analytics' && 'Bảng Thống Kê & Doanh Thu'}
            {activeTab === 'users' && 'Quản Lý Khách Hàng (User CRM)'}
            {activeTab === 'orders' && 'Lịch Sử Giao Dịch & Đơn Hàng ACB'}
            {activeTab === 'queue' && 'Giám Sát Render Remotion Live'}
            {activeTab === 'keys' && 'Quản Lý Mã Bản Quyền & Đối Tác CTV'}
            {activeTab === 'settings' && 'Cấu Hình Tài Khoản ACB & Hệ Thống'}
            {activeTab === 'plans' && 'Quản Lý Gói Cước & Ma Trận Tính Năng'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {uptimeSec > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Uptime: {Math.round(uptimeSec / 60)} phút
              </span>
            )}
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Làm mới dữ liệu
            </Button>
          </div>
        </header>

        {/* Content body */}
        <div className={styles.content}>
          {activeTab === 'analytics' && (
            <AnalyticsTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'users' && (
            <UsersManagerTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersManagerTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}

          {activeTab === 'queue' && (
            <RenderQueueTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}

          {activeTab === 'keys' && (
            <LicenseKeysTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SystemSettingsTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}

          {activeTab === 'plans' && (
            <PlanManagerTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}

          {activeTab === 'ai-logs' && (
            <AiGenerationLogsTab
              key={refreshKey}
              adminFetch={adminFetch}
              showToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminPortal;
