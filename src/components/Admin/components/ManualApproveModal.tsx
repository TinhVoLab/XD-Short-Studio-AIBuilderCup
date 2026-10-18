import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button } from '@/components/ui';
import { useEditorStore } from '@/store/useEditorStore';
import { payableAmount } from '@/config/planCatalog';

interface ManualApproveModalProps {
  open: boolean;
  onClose: () => void;
  onApproved: (data: any) => void;
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  initialEmail?: string;
  initialUid?: string;
}

const DURATION_PRESETS = [
  { label: '30 Ngày (1 Tháng)', days: 30 },
  { label: '90 Ngày (3 Tháng)', days: 90 },
  { label: '365 Ngày (1 Năm)', days: 365 },
  { label: 'Vô Thời Hạn', days: 0 },
];

export const ManualApproveModal: React.FC<ManualApproveModalProps> = ({
  open,
  onClose,
  onApproved,
  adminFetch,
  initialEmail = '',
  initialUid = '',
}) => {
  const [emailOrUid, setEmailOrUid] = useState(initialEmail || initialUid);
  const [planTier, setPlanTier] = useState<'creator' | 'business'>('creator');
  const [durationDays, setDurationDays] = useState<number>(30);
  const getPlanByTier = useEditorStore((st) => st.getPlanByTier);
  // Số tiền gợi ý theo giá gói hiện hành (planCatalog / Admin); "vô thời hạn" không có giá niêm yết → nhập tay
  const suggestedAmount = (tier: 'creator' | 'business', days: number) => {
    const plan = getPlanByTier(tier);
    if (days === 365) return payableAmount(plan, 'year');
    if (days > 0) return payableAmount(plan, 'month') * Math.round(days / 30);
    return 0;
  };
  const [amount, setAmount] = useState<number>(() => suggestedAmount('creator', 30));
  const [note, setNote] = useState('Chuyển khoản ACB - Duyệt thủ công');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset or initialize when modal opens
  useEffect(() => {
    if (open) {
      setEmailOrUid(initialEmail || initialUid);
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [open, initialEmail, initialUid]);

  const handleSelectTier = (tier: 'creator' | 'business') => {
    setPlanTier(tier);
    setAmount(suggestedAmount(tier, durationDays));
  };

  const handleSelectDuration = (days: number) => {
    setDurationDays(days);
    setAmount(suggestedAmount(planTier, days));
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = emailOrUid.trim();
    if (!cleanTarget) {
      setErrorMessage('Vui lòng nhập Email hoặc UID người dùng.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const isEmail = cleanTarget.includes('@');
      const payload = {
        email: isEmail ? cleanTarget : undefined,
        uid: isEmail ? undefined : cleanTarget,
        planTier,
        durationDays,
        amount,
        note: note.trim() || 'Duyệt thủ công Super Admin',
      };

      const res = await adminFetch('/transactions/manual-approve', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res) {
        throw new Error('Không thể kết nối đến máy chủ.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Duyệt đơn thất bại.');
      }

      onApproved(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi xử lý duyệt đơn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(190, 255, 1, 0.1)',
              border: '1px solid rgba(190, 255, 1, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Duyệt Đơn Thủ Công &amp; Nâng Cấp Gói</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                Kích hoạt tức thì với cơ chế ACID Transaction &amp; bảo lưu cộng dồn hạn sử dụng
              </p>
            </div>
          </div>

          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMessage && (
            <div className={styles.modalAlertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Email/UID */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Email Hoặc UID Khách Hàng *</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="ví dụ: khachhang@gmail.com hoặc UID tài khoản"
              value={emailOrUid}
              onChange={(e) => setEmailOrUid(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Plan Tier Selection */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Gói Cước Kích Hoạt</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className={`${styles.planSelectBtn} ${planTier === 'creator' ? styles.planSelectBtnActiveCreator : ''}`}
                onClick={() => handleSelectTier('creator')}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>CREATOR PRO</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Xuất 4K, 50 AI / ngày</span>
              </button>
              <button
                type="button"
                className={`${styles.planSelectBtn} ${planTier === 'business' ? styles.planSelectBtnActiveBusiness : ''}`}
                onClick={() => handleSelectTier('business')}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>BUSINESS PRO</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Không giới hạn AI &amp; Queue VIP</span>
              </button>
            </div>
          </div>

          {/* Duration Presets */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Thời Hạn Kích Hoạt (Cộng Dồn Nếu Còn Hạn)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  className={`${styles.durationBtn} ${durationDays === p.days ? styles.durationBtnActive : ''}`}
                  onClick={() => handleSelectDuration(p.days)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Note Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Số Tiền Thực Thu (VNĐ)</label>
              <input
                type="number"
                step="1000"
                min="0"
                className={styles.formInput}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Ghi Chú Nghiệp Vụ</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Lý do duyệt tay / Mã tham chiếu"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
            >
              {isSubmitting ? 'Đang duyệt...' : 'Xác Nhận Kích Hoạt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
