import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button, FormGroup, SectionHeader } from '@/components/ui';
import { UserPlanTier } from '@/types/auth';

interface LicenseKeysTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const LicenseKeysTab: React.FC<LicenseKeysTabProps> = ({ adminFetch, showToast }) => {
  const [keysList, setKeysList] = useState<any[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyTier, setNewKeyTier] = useState<UserPlanTier>('creator');
  const [isLoading, setIsLoading] = useState(false);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/license-keys');
      if (res && res.ok) {
        setKeysList(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;
    const res = await adminFetch('/license-keys', {
      method: 'POST',
      body: JSON.stringify({ key: newKeyInput, tier: newKeyTier }),
    });
    if (res && res.ok) {
      showToast(`Tạo mã ${newKeyInput.toUpperCase()} thành công`);
      setNewKeyInput('');
      loadKeys();
    }
  };

  return (
    <>
      <div className={styles.panel}>
        <SectionHeader
          title="Tạo Mã Kích Hoạt / Voucher Đối Tác Mới"
          subtitle="Tạo mã key gắn với gói thời hạn để cấp cho CTV hoặc khách hàng nạp tiền trực tiếp"
        />
        <form
          onSubmit={handleCreateKey}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px 140px',
            gap: 12,
            alignItems: 'flex-end',
            marginTop: 12,
          }}
        >
          <FormGroup label="Mã License Key (Viết hoa)">
            <input
              type="text"
              className={styles.formInput}
              placeholder="VD: KOL-TIKTOK-2026 hoặc XDS-VIP-2026"
              value={newKeyInput}
              onChange={(e) => setNewKeyInput(e.target.value.toUpperCase())}
            />
          </FormGroup>

          <FormGroup label="Gói Gán Vào">
            <select
              className={styles.formInput}
              value={newKeyTier}
              onChange={(e) => setNewKeyTier(e.target.value as UserPlanTier)}
            >
              <option value="creator">Creator</option>
              <option value="business">Business</option>
            </select>
          </FormGroup>

          <div style={{ paddingBottom: 8 }}>
            <Button variant="primary" size="md" type="submit" fullWidth>
              Tạo Mã Key
            </Button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <SectionHeader
          title={`Danh Sách Mã Bản Quyền (${keysList.length})`}
          subtitle="Theo dõi trạng thái mã đã kích hoạt, số lượt dùng và người tạo"
        />
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Key</th>
                <th>Gói Gán Vào</th>
                <th>Số Lượt Dùng</th>
                <th>Người Tạo</th>
                <th>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {keysList.map((k) => (
                <tr key={k.id || k.key}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                    {k.key || k.id}
                  </td>
                  <td>
                    <span className={`${styles.tag} ${styles.tagCreator}`}>{k.tier}</span>
                  </td>
                  <td>{k.usedCount || 0} / {k.maxUses || 1}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.createdBy || 'Super Admin'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
              {keysList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    {isLoading ? 'Đang tải danh sách mã key...' : 'Chưa có mã tùy biến nào trên database (Các mã mặc định: XDS-CREATOR-2026, XDS-BIZ-2026).'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
