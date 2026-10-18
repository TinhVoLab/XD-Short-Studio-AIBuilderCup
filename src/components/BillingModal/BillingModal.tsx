import React, { useState, useEffect } from 'react';
import styles from './BillingModal.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui';
import { billingService, TransactionReceipt } from '@/services/billingService';
import { TIER_BADGE_STYLES } from '@/types/auth';
import { findPlan } from '@/config/planCatalog';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    firebaseUser,
    setPricingModalOpen,
    setAuthModalOpen,
    showToast,
    fetchRemoteQuota,
    getPlanByTier,
    plans,
  } = useEditorStore();

  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  // Load transactions and refresh remote profile when modal opens
  const loadData = async (forceRefresh = false) => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      if (forceRefresh) {
        await fetchRemoteQuota();
      }
      const data = await billingService.getUserTransactions(firebaseUser.uid, forceRefresh);
      setTransactions(data);
    } catch (err) {
      console.warn('Failed to load user billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(false);
    }
  }, [isOpen, firebaseUser?.uid]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const plan = getPlanByTier(currentUser.planTier);
  const badge = TIER_BADGE_STYLES[currentUser.planTier] || TIER_BADGE_STYLES.free;
  const countdown = billingService.getSubscriptionCountdown(
    currentUser.subscriptionExpiresAt,
    currentUser.planTier
  );

  const usedVideos = currentUser.quota?.videosRenderedThisMonth ?? 0;
  const limitVideos = plan.quotas.monthlyVideoLimit;
  const bonusVideos = currentUser.quota?.bonusVideos ?? 0;
  const isInfinite = currentUser.planTier === 'admin';
  const percentUsed = isInfinite || limitVideos <= 0 ? 100 : Math.min(100, Math.round((usedVideos / limitVideos) * 100));

  // Nhãn "Gói dịch vụ" của một biên lai: gói + chu kỳ, hoặc số video mua thêm
  const txPlanLabel = (tx: TransactionReceipt) => {
    if (tx.targetTier === 'topup') return tx.bonusVideos ? `Thêm ${tx.bonusVideos} video` : 'Mua thêm video';
    const name = findPlan(plans, tx.targetTier)?.name || tx.targetTier;
    return tx.cycle ? `${name} — ${tx.cycle === 'year' ? '1 năm' : '1 tháng'}` : name;
  };

  const copyTxId = (id: string) => {
    navigator.clipboard.writeText(id);
    showToast(`Đã sao chép mã đơn: ${id}`);
  };

  const handleOpenPricing = () => {
    onClose();
    setPricingModalOpen(true);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <div className={styles.titleText}>Gói Cước & Lịch Sử Hóa Đơn</div>
              <div className={styles.subtitle}>Quản lý trạng thái bản quyền và các hóa đơn thanh toán</div>
            </div>
          </div>
          <Button asIcon variant="ghost" size="icon-sm" onClick={onClose} title="Đóng (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          {/* Guest Reminder Banner */}
          {!firebaseUser && (
            <div className={styles.guestBanner}>
              <div className={styles.guestText}>
                Bạn đang dùng tài khoản khách. Đăng nhập để mua gói và xem lịch sử thanh toán.
              </div>
              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  onClose();
                  setAuthModalOpen(true);
                }}
              >
                Đăng Nhập
              </Button>
            </div>
          )}

          {/* 1. Subscription Card */}
          <div className={styles.subCard}>
            <div className={styles.subCardTop}>
              <div className={styles.planTierBlock}>
                <span className={styles.planName}>{plan.name}</span>
                <span
                  className={styles.planBadge}
                  style={{
                    color: badge.color,
                    background: badge.bg,
                    borderColor: badge.color,
                  }}
                >
                  {currentUser.planTier.toUpperCase()}
                </span>
              </div>
              <span className={`${styles.statusPill} ${countdown.isExpired ? styles.statusPillExpired : ''}`}>
                {countdown.isExpired ? 'Hết hạn' : 'Đang hoạt động'}
              </span>
            </div>

            <div className={styles.subMetaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Thời hạn bản quyền</span>
                <span className={styles.metaValue}>{countdown.label}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Chu kỳ xuất video</span>
                <span className={styles.metaValue}>Làm mới vào ngày 01 hàng tháng</span>
              </div>
            </div>

            {/* Quota Progress */}
            <div className={styles.quotaBarWrapper}>
              <div className={styles.quotaBarHeader}>
                <span>Hạn ngạch xuất video trong tháng</span>
                <span>
                  {isInfinite ? 'Admin' : `${usedVideos} / ${limitVideos} video`}
                </span>
              </div>
              <div className={styles.quotaProgressBar}>
                <div
                  className={styles.quotaProgressFill}
                  style={{
                    width: isInfinite ? '100%' : `${percentUsed}%`,
                    background: percentUsed >= 100 && !isInfinite
                      ? 'var(--danger, #ff4d4f)'
                      : 'linear-gradient(90deg, #9ACD00 0%, #BEFF01 100%)',
                  }}
                />
              </div>
              {!isInfinite && (
                <div className={styles.quotaBarHeader}>
                  <span>Video mua thêm còn lại (dùng khi hết lượt tháng)</span>
                  <span>{bonusVideos} video</span>
                </div>
              )}
            </div>

            <div className={styles.subCardActions}>
              {currentUser.planTier !== 'admin' && (
                <Button variant={currentUser.planTier === 'free' ? 'primary' : 'secondary'} size="sm" onClick={handleOpenPricing}>
                  {currentUser.planTier === 'free' ? 'Nâng cấp hoặc mua thêm video' : 'Gia hạn, nâng cấp hoặc mua thêm video'}
                </Button>
              )}
            </div>
          </div>

          {/* 2. Receipts Ledger Section */}
          <div className={styles.historySection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                Lịch Sử Hóa Đơn Thanh Toán ({transactions.length})
              </div>
              {firebaseUser && (
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={loading}
                  onClick={() => loadData(true)}
                  leftIcon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6" />
                      <path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  }
                >
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </Button>
              )}
            </div>

            <div className={styles.tableContainer}>
              {transactions.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Thời gian</th>
                      <th>Gói dịch vụ</th>
                      <th>Số tiền</th>
                      <th>Phương thức</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.transactionId}>
                        <td>
                          <span
                            className={styles.txIdCode}
                            onClick={() => copyTxId(tx.transactionId)}
                            title="Bấm để sao chép mã giao dịch"
                          >
                            {tx.transactionId.length > 14
                              ? `${tx.transactionId.slice(0, 12)}...`
                              : tx.transactionId}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </span>
                        </td>
                        <td>{billingService.formatDateTime(tx.processedAt)}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{txPlanLabel(tx)}</span>
                        </td>
                        <td>
                          <span className={styles.amountText}>
                            {billingService.formatVnd(tx.amount)}
                          </span>
                        </td>
                        <td>{tx.gateway || 'VietQR'}</td>
                        <td>
                          {tx.status === 'underpaid' || tx.status === 'invalid_plan' ? (
                            <span
                              className={styles.statusBadgePending}
                              title={tx.expectedAmount ? `Cần tối thiểu ${billingService.formatVnd(tx.expectedAmount)} — liên hệ Zalo hỗ trợ để xử lý` : 'Liên hệ Zalo hỗ trợ để xử lý'}
                            >
                              Thiếu tiền, chưa kích hoạt
                            </span>
                          ) : (
                            <span className={styles.statusBadgeSuccess}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Hoàn tất
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>Chưa có lịch sử giao dịch nào được ghi nhận.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
