import React, { useState } from 'react';
import styles from './AdminLoginGate.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from '@/components/ui';

interface AdminLoginGateProps {
  onBackToStudio: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onBackToStudio }) => {
  const { firebaseUser, currentUser, signInWithGoogle, signOutUser, isAuthLoading } = useEditorStore();
  const [error, setError] = useState<string | null>(null);

  const isDenied = Boolean(firebaseUser && currentUser.role !== 'admin');

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Đăng nhập Google không thành công.');
      }
    }
  };

  const handleSwitchAccount = async () => {
    await signOutUser();
    handleGoogleSignIn();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Shield Icon */}
        <div className={`${styles.shieldIconWrap} ${isDenied ? styles.shieldIconDenied : ''}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {isDenied ? (
              <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            ) : (
              <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </>
            )}
          </svg>
        </div>

        {/* Badge */}
        <div className={`${styles.badge} ${isDenied ? styles.badgeDenied : ''}`}>
          {isDenied ? '403 Forbidden • Từ Chối Truy Cập' : 'XD-Short Enterprise Security Gate'}
        </div>

        {/* Title & Subtitle */}
        {isDenied ? (
          <>
            <h1 className={styles.title}>Không Có Quyền Quản Trị</h1>
            <p className={styles.subtitle}>
              Tài khoản <strong>{firebaseUser?.email}</strong> không thuộc danh sách Super Admin được ủy quyền. Vui lòng đăng xuất hoặc đăng nhập bằng tài khoản Quản trị tối cao.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Khu Vực Quản Trị Hệ Thống</h1>
            <p className={styles.subtitle}>
              Cổng điều hành nội bộ dành riêng cho Super Admin. Xác thực 1-chạm bảo mật bằng tài khoản Google được ủy quyền.
            </p>
          </>
        )}

        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'var(--danger-dim)',
            border: '1px solid var(--danger-border)',
            borderRadius: 8,
            color: 'var(--danger)',
            fontSize: 'var(--font-sm)',
            width: '100%',
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionRow}>
          {isDenied ? (
            <>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSwitchAccount}
              >
                Đổi Sang Tài Khoản Admin Khác
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onBackToStudio}
              >
                Quay Lại Studio Thường
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                title="Đăng nhập bảo mật với Google 1-chạm"
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{isAuthLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google Super Admin'}</span>
              </button>

              <button
                type="button"
                className={styles.backLink}
                onClick={onBackToStudio}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Quay lại Motion Studio
              </button>
            </>
          )}
        </div>

        {/* Footer Security Note */}
        <div className={styles.footerNote}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Bảo mật 2 lớp bởi Firebase Enterprise Security</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginGate;
