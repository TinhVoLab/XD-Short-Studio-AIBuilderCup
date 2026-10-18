import React, { useState, useEffect } from 'react';
import styles from './AuthModal.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';

export const AuthModal: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const {
    authModalOpen,
    setAuthModalOpen,
    isAuthLoading,
    signInWithGoogle,
  } = useEditorStore(
    useShallow(s => ({
      authModalOpen: s.authModalOpen,
      setAuthModalOpen: s.setAuthModalOpen,
      isAuthLoading: s.isAuthLoading,
      signInWithGoogle: s.signInWithGoogle,
    }))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen) {
        setAuthModalOpen(false);
      }
    };
    if (authModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, setAuthModalOpen]);

  if (!authModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return; // User intentionally closed popup
      }
      setError(err.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.');
    }
  };

  return (
    <div className={styles.backdrop} onClick={() => setAuthModalOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.brandBadge}>
              <span className={styles.brandDot} />
              <span>XD-Short Studio</span>
            </div>
            <div className={styles.title}>Đăng Nhập Tài Khoản</div>
            <div className={styles.subtitle}>
              Trải nghiệm công cụ AI Motion Studio chuyên nghiệp và bảo mật.
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setAuthModalOpen(false)}
            aria-label="Đóng"
            title="Đóng (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {error && (
            <div className={styles.errorMsg}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Hero Google 1-Tap Button */}
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
            disabled={isAuthLoading}
            title="Đăng nhập 1-chạm bảo mật bằng Google"
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isAuthLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
          </button>

          {/* Value Propositions */}
          <div className={styles.valueList}>
            <div className={styles.valueItem}>
              <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Tự động đồng bộ và lưu dự án trên đám mây</span>
            </div>
            <div className={styles.valueItem}>
              <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>5 video xuất Full HD miễn phí mỗi ngày</span>
            </div>
            <div className={styles.valueItem}>
              <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Xác thực 1-chạm, 100% chống bot & mã độc</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.securityBadge}>
            <svg className={styles.shieldIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Bảo vệ bởi Google Firebase Auth & Cloud Security</span>
          </div>
          <div className={styles.termsText}>
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của XD-Short Studio.
          </div>
        </div>
      </div>
    </div>
  );
};
