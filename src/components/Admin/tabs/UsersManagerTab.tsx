import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { SectionHeader } from '@/components/ui';
import { UserPlanTier } from '@/types/auth';

interface UsersManagerTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const UsersManagerTab: React.FC<UsersManagerTabProps> = ({ adminFetch, showToast }) => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/users?search=${encodeURIComponent(userSearch)}`);
      if (res && res.ok) {
        setUsersList(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [userSearch]);

  const handleUpdateUserPlan = async (uid: string, planTier: UserPlanTier) => {
    const res = await adminFetch(`/users/${uid}/plan`, {
      method: 'POST',
      body: JSON.stringify({ planTier }),
    });
    if (res && res.ok) {
      showToast(`Đã đổi gói UID ${uid.slice(-6)} sang ${planTier.toUpperCase()}`);
      loadUsers();
    }
  };

  const handleToggleRole = async (uid: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const res = await adminFetch(`/users/${uid}/role`, {
      method: 'POST',
      body: JSON.stringify({ role: nextRole }),
    });
    if (res && res.ok) {
      showToast(`Đã đổi quyền UID ${uid.slice(-6)} sang ${nextRole.toUpperCase()}`);
      loadUsers();
    }
  };

  return (
    <div className={styles.panel}>
      <SectionHeader
        title={`Danh Sách Người Dùng (${usersList.length})`}
        subtitle="Xem thông tin tài khoản, điều chỉnh gói cước và quản lý quyền hạn trực tiếp"
        action={
          <input
            type="text"
            placeholder="Tìm theo email hoặc UID..."
            className={styles.searchBar}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        }
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email / Tên</th>
              <th>UID Rút Gọn</th>
              <th>Gói Hiện Tại</th>
              <th>Quyền Hạn</th>
              <th>Mã Key Đã Nhập</th>
              <th>Hành Động Đổi Gói</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => (
              <tr key={u.uid}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.displayName || 'Nhà Sáng Tạo'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {u.uid.slice(-6).toUpperCase()}
                </td>
                <td>
                  <span
                    className={`
                    ${styles.tag} 
                    ${u.planTier === 'creator' ? styles.tagCreator : u.planTier === 'business' ? styles.tagBusiness : u.planTier === 'admin' ? styles.tagAdmin : styles.tagFree}
                  `}
                  >
                    {u.planTier}
                  </span>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleRole(u.uid, u.role)}
                    className={styles.actionBtn}
                    style={{
                      color: u.role === 'admin' ? '#FF4560' : 'var(--text-sub)',
                      fontWeight: u.role === 'admin' ? 600 : 400,
                      cursor: 'pointer'
                    }}
                    title={u.role === 'admin' ? 'Hạ quyền về User' : 'Thăng quyền Admin'}
                  >
                    {u.role === 'admin' ? 'Admin' : 'User'}
                  </button>
                </td>
                  {u.licenseKeyUsed || '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleUpdateUserPlan(u.uid, 'free')}
                      title="Chuyển về Free"
                    >
                      Free
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      style={{ color: 'var(--accent)' }}
                      onClick={() => handleUpdateUserPlan(u.uid, 'creator')}
                      title="Nâng lên Creator"
                    >
                      Creator
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      style={{ color: '#58a6ff' }}
                      onClick={() => handleUpdateUserPlan(u.uid, 'business')}
                      title="Nâng lên Business"
                    >
                      Biz
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usersList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  {isLoading ? 'Đang tải danh sách người dùng...' : 'Chưa có tài khoản nào được lưu trên Firestore hoặc không khớp tìm kiếm.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
