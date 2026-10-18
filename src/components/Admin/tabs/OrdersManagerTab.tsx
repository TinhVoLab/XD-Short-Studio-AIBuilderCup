import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button, SectionHeader } from '@/components/ui';

interface OrdersManagerTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const OrdersManagerTab: React.FC<OrdersManagerTabProps> = ({ adminFetch, showToast }) => {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/transactions');
      if (res && res.ok) {
        setOrdersList(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleManualApprove = async (email: string, uid: string, planTier: string = 'creator') => {
    const res = await adminFetch('/transactions/manual-approve', {
      method: 'POST',
      body: JSON.stringify({ email, uid, planTier }),
    });
    if (res && res.ok) {
      showToast(`Đã duyệt đơn và nâng cấp cho ${email || uid}`);
      loadOrders();
    }
  };

  return (
    <div className={styles.panel}>
      <SectionHeader
        title={`Lịch Sử Chuyển Khoản VietQR ACB (${ordersList.length})`}
        subtitle="Hệ thống tự động khớp mã thanh toán ACB VietQR hoặc duyệt kích hoạt thủ công"
        action={
          <Button
            variant="primary"
            size="xs"
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={() => {
              const email = prompt('Nhập Email hoặc UID khách hàng cần duyệt gói Pro:');
              if (email) handleManualApprove(email, '');
            }}
          >
            Duyệt Đơn Thủ Công
          </Button>
        }
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã Giao Dịch</th>
              <th>Email Khách</th>
              <th>Số Tiền</th>
              <th>Cú Pháp Ngân Hàng</th>
              <th>Gói Kích Hoạt</th>
              <th>Thời Gian</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {ordersList.map((tx) => (
              <tr key={tx.id || tx.transactionId}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{tx.transactionId || tx.id}</td>
                <td>{tx.targetEmail || tx.targetUid || '—'}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  {Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{tx.description}</td>
                <td>
                  <span className={`${styles.tag} ${styles.tagCreator}`}>
                    {tx.targetTier || 'Creator'}
                  </span>
                </td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {tx.processedAt ? new Date(tx.processedAt).toLocaleString('vi-VN') : '—'}
                </td>
                <td>
                  <span style={{ color: '#3fb950', fontSize: 11, fontWeight: 600 }}>● Thành công</span>
                </td>
              </tr>
            ))}
            {ordersList.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  {isLoading ? 'Đang tải danh sách đơn hàng...' : 'Chưa có đơn hàng nào được ghi nhận qua Webhook hoặc duyệt thủ công.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
