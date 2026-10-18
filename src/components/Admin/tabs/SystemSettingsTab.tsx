import React, { useState, useEffect } from 'react';
import styles from '../SuperAdminPortal.module.css';
import { Button, FormGroup, SectionHeader } from '@/components/ui';

interface SystemSettingsTabProps {
  adminFetch: (endpoint: string, options?: RequestInit) => Promise<Response | null>;
  showToast: (msg: string, duration?: number) => void;
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({ adminFetch, showToast }) => {
  const [settings, setSettings] = useState({
    bankName: 'ACB',
    accountNumber: '271090168',
    companyName: 'CÔNG TY TNHH THẾ GIỚI SỐ X-DMAIC',
    supportHotline: '0967896567',
    supportZalo: 'https://zalo.me/0967896567',
    dailyFreeLimit: 5,
    telegramBotToken: '',
    telegramChatId: '',
    webhookSecret: '',
    aiLimitFree: 5,
    aiLimitCreator: 50,
    aiLimitBusiness: -1,
    aiCacheEnabled: true,
    usdVndRate: 25400,
    heroTemplates: [
      { id: 'mindset', label: 'Tư duy & năng suất', videoSrc: '', poster: '' },
      { id: 'finance', label: 'Tài chính & kinh doanh', videoSrc: '', poster: '' },
      { id: 'quiz', label: 'Quiz hỏi đáp', videoSrc: '', poster: '' },
      { id: 'edu', label: 'Học từ vựng', videoSrc: '', poster: '' },
    ],
  });
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const loadSettings = async () => {
    const sRes = await adminFetch('/settings');
    if (sRes && sRes.ok) {
      const sData = await sRes.json();
      setSettings((prev) => ({
        ...prev,
        ...sData,
        heroTemplates:
          Array.isArray(sData.heroTemplates) && sData.heroTemplates.length > 0
            ? sData.heroTemplates
            : prev.heroTemplates,
      }));
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminFetch('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    if (res && res.ok) {
      showToast('Đã lưu cấu hình ngân hàng & hệ thống thành công');
    }
  };

  const handleTestTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      showToast('Vui lòng nhập Telegram Bot Token và Chat ID trước khi gửi thử nghiệm', 3500);
      return;
    }
    setIsTestingTelegram(true);
    try {
      const res = await adminFetch('/telegram-test', {
        method: 'POST',
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
        }),
      });
      if (res && res.ok) {
        showToast('Đã gửi tin nhắn thử nghiệm thành công! Vui lòng kiểm tra Telegram của bạn.', 4000);
      } else {
        const errData = await res?.json().catch(() => ({}));
        showToast(`Thất bại: ${errData?.error || 'Không thể kết nối tới Telegram'}`, 4500);
      }
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`, 3500);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  return (
    <div className={styles.settingsFormWrap}>
      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Panel 1: Bank & Company */}
        <div className={styles.panel}>
          <SectionHeader
            title="Cài Đặt Tài Khoản ACB & Thông Tin Doanh Nghiệp"
            subtitle="Thay đổi tại đây sẽ cập nhật tức thì trên Bảng Giá và VietQR mà không cần sửa code"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className={styles.settingsFormRow}>
              <FormGroup label="Tên Ngân Hàng Thụ Hưởng">
                <input
                  type="text"
                  className={styles.formInput}
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Số Tài Khoản Nhận Tiền (STK)">
                <input
                  type="text"
                  className={styles.formInput}
                  value={settings.accountNumber}
                  onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                />
              </FormGroup>
            </div>

            <FormGroup label="Tên Doanh Nghiệp / Chủ Tài Khoản Thụ Hưởng">
              <input
                type="text"
                className={styles.formInput}
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </FormGroup>

            <div className={styles.settingsFormRow}>
              <FormGroup label="Hotline Hỗ Trợ Kỹ Thuật (SĐT)">
                <input
                  type="text"
                  className={styles.formInput}
                  value={settings.supportHotline}
                  onChange={(e) => setSettings({ ...settings, supportHotline: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Link Zalo Hỗ Trợ Khách Hàng">
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="https://zalo.me/..."
                  value={settings.supportZalo || ''}
                  onChange={(e) => setSettings({ ...settings, supportZalo: e.target.value })}
                />
              </FormGroup>
            </div>
          </div>
        </div>

        {/* Panel 2: Bank Webhook Integration (SePay / Casso) */}
        <div className={styles.panel}>
          <SectionHeader
            title="Tích Hợp Webhook Biến Động Số Dư (SePay / Casso)"
            subtitle="Hệ thống tự động kích hoạt gói Pro cho khách hàng trong 3 giây khi tiền vào tài khoản ACB"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <FormGroup
              label="Đường Dẫn Webhook URL (Copy dán vào SePay hoặc Casso)"
              description="Cổng tiếp nhận thông báo biến động số dư tự động từ ngân hàng"
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  className={styles.formInput}
                  style={{ flex: 1, fontFamily: 'monospace', color: 'var(--accent)' }}
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/payment/webhook` : '/api/payment/webhook'}
                />
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => {
                    const url =
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/api/payment/webhook`
                        : '/api/payment/webhook';
                    navigator.clipboard.writeText(url);
                    showToast('Đã sao chép Webhook URL vào bộ nhớ tạm');
                  }}
                  leftIcon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  }
                >
                  Sao Chép
                </Button>
              </div>
            </FormGroup>

            <FormGroup
              label="Khóa Bí Mật Webhook (Webhook Secret / API Key)"
              description="Chuỗi ký tự bảo mật xác thực (SePay gửi header Authorization: Apikey <token>). Để trống nếu không dùng."
            >
              <input
                type="text"
                className={styles.formInput}
                placeholder="VD: sec_9f83a8b27c6d1..."
                value={settings.webhookSecret || ''}
                onChange={(e) => setSettings({ ...settings, webhookSecret: e.target.value })}
              />
            </FormGroup>
          </div>
        </div>

        {/* Panel 3: Hero Showcase Video Templates (CDN / Cloud Storage) */}
        <div className={styles.panel}>
          <SectionHeader
            title="Cấu Hình 4 Video Mẫu Hero Showcase (CDN / Storage URLs)"
            subtitle="Gắn link trực tiếp từ CDN hoặc Cloud Storage (BunnyCDN, Cloudinary, Firebase Storage, S3...) để website tải siêu tốc, giảm tải dung lượng hosting và dễ dàng đổi demo"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
            {settings.heroTemplates.map((tmpl, idx) => (
              <div
                key={tmpl.id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        background: 'var(--accent-dim)',
                        color: 'var(--accent)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid var(--accent-border)',
                      }}
                    >
                      CHỦ ĐỀ #{idx + 1} ({tmpl.id.toUpperCase()})
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {tmpl.label}
                    </span>
                  </div>

                  {tmpl.videoSrc && (
                    <a
                      href={tmpl.videoSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 11,
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Xem Thử Video
                    </a>
                  )}
                </div>

                <div className={styles.settingsFormRow}>
                  <FormGroup label="Tên Tiêu Đề Chủ Đề (Tab Label)">
                    <input
                      type="text"
                      className={styles.formInput}
                      value={tmpl.label}
                      onChange={(e) => {
                        const updated = [...settings.heroTemplates];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setSettings({ ...settings, heroTemplates: updated });
                      }}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Đường Dẫn Video (CDN URL hoặc File MP4)"
                    description="VD: https://storage.googleapis.com/... hoặc /hook-danh-thuc-by-xd-short-2026.mp4"
                  >
                    <input
                      type="text"
                      className={styles.formInput}
                      style={{ fontFamily: 'monospace' }}
                      value={tmpl.videoSrc}
                      onChange={(e) => {
                        const updated = [...settings.heroTemplates];
                        updated[idx] = { ...updated[idx], videoSrc: e.target.value };
                        setSettings({ ...settings, heroTemplates: updated });
                      }}
                    />
                  </FormGroup>
                </div>

                <FormGroup
                  label="Ảnh Đại Diện Thumbnail (Poster URL - Tải Tức Thì < 0.05s)"
                  description="Tùy chọn: Link ảnh WebP/JPEG hiển thị ngay trước khi video kịp phát (Khuyên dùng để tối ưu hiệu suất)"
                >
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="https://... (Để trống nếu dùng poster mặc định)"
                    style={{ fontFamily: 'monospace' }}
                    value={tmpl.poster || ''}
                    onChange={(e) => {
                      const updated = [...settings.heroTemplates];
                      updated[idx] = { ...updated[idx], poster: e.target.value };
                      setSettings({ ...settings, heroTemplates: updated });
                    }}
                  />
                </FormGroup>
              </div>
            ))}

            {/* Performance Tip Box */}
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-sub)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--accent)', fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Mẹo Tăng Hiệu Suất Tải Trang & Tối Ưu Băng Thông:</span>
              </div>
              <span>
                1. Thay vì lưu trữ video trực tiếp trên server Firebase Hosting, bạn có thể upload video lên BunnyCDN, Cloudinary, hoặc Firebase Storage rồi dán link URL vào đây.<br />
                2. Landing Page đã tích hợp sẵn <strong>IntersectionObserver</strong> tự động ngắt phát video khi người dùng cuộn khỏi màn hình đầu (giảm tải 100% CPU/GPU của trình duyệt) và <strong>preload=&quot;metadata&quot;</strong> để chỉ tải video khi cần thiết.
              </span>
            </div>
          </div>
        </div>

        {/* Panel 4: Quotas & Dynamic Cost Engine */}
        <div className={styles.panel}>
          <SectionHeader
            title="Cấu Hình Hạn Ngạch Xuất Video & Gemini AI Theo Gói"
            subtitle="Tùy chỉnh động số lượt render video và lượt gọi AI mỗi ngày theo từng gói cước. Thay đổi có hiệu lực tức thì mà không cần build lại server"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className={styles.settingsFormRow}>
              <FormGroup
                label="Hạn Ngạch Render Video Gói Free / Ngày"
                description="Số lượt kết xuất (render) video MP4 tối đa mỗi ngày cho tài khoản Free"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  value={settings.dailyFreeLimit}
                  onChange={(e) => setSettings({ ...settings, dailyFreeLimit: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup
                label="Hạn Mức Gemini AI Gói Free / Ngày"
                description="Số lượt gọi AI tạo kịch bản/hook/thiết kế mỗi ngày cho thành viên gói Free"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  value={settings.aiLimitFree}
                  onChange={(e) => setSettings({ ...settings, aiLimitFree: Number(e.target.value) })}
                />
              </FormGroup>
            </div>

            <div className={styles.settingsFormRow}>
              <FormGroup
                label="Hạn Mức Gemini AI Gói Creator Pro"
                description="Số lượt gọi AI tối đa mỗi ngày cho người dùng gói Creator Pro"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  min="0"
                  value={settings.aiLimitCreator}
                  onChange={(e) => setSettings({ ...settings, aiLimitCreator: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup
                label="Hạn Mức Gemini AI Gói Business Pro"
                description="Nhập -1 để không giới hạn lượt tạo AI (Unlimited)"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  value={settings.aiLimitBusiness}
                  onChange={(e) => setSettings({ ...settings, aiLimitBusiness: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup
                label="Bộ Nhớ Đệm AI & Chống Trùng Lặp (Prompt Cache)"
                description="Tái sử dụng câu trả lời tương tự và gộp các yêu cầu trùng lặp đồng thời (Single-Flight)"
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 38,
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(settings.aiCacheEnabled)}
                    onChange={(e) => setSettings({ ...settings, aiCacheEnabled: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <span>{settings.aiCacheEnabled ? 'Đang kích hoạt (Khuyên dùng - Tiết kiệm chi phí)' : 'Đang tắt'}</span>
                </label>
              </FormGroup>

              <FormGroup
                label="Tỷ Giá Quy Đổi (USD / VND)"
                description="Tỷ giá quy đổi chi phí API AI sang tiền Việt để hiển thị trong Nhật ký Admin"
              >
                <input
                  type="number"
                  className={styles.formInput}
                  min="1000"
                  step="100"
                  value={settings.usdVndRate || 25400}
                  onChange={(e) => setSettings({ ...settings, usdVndRate: Number(e.target.value) })}
                />
              </FormGroup>
            </div>

            {/* Zero-Cost Architecture Notice */}
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-sub)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--accent)', fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Cơ Chế Tự Động Reset Hàng Ngày 0đ (Zero-Cost Daily Reset):</span>
              </div>
              <span>
                Hạn mức AI được định danh tự động theo ngày lịch Việt Nam (<code>YYYY-MM-DD</code> theo múi giờ <code>Asia/Ho_Chi_Minh</code> GMT+7).
                Khi bước sang 00:00 mỗi ngày, chu kỳ mới tự động bắt đầu mà không cần tác vụ ngầm (Cron Job / Cloud Functions) tốn phí.
                Node.js bộ nhớ đệm 60 giây giúp hạn chế tối đa số lượt đọc cấu hình trên Firestore.
              </span>
            </div>
          </div>
        </div>

        {/* Panel 5: Realtime Telegram Alerts */}
        <div className={styles.panel}>
          <SectionHeader
            title="Tích Hợp Báo Doanh Thu Tức Thì Qua Telegram Bot"
            subtitle="Bắn thông báo đơn hàng kèm đầy đủ thông tin khách và số tiền trực tiếp về ứng dụng Telegram của bạn"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className={styles.settingsFormRow}>
              <FormGroup
                label="Telegram Bot Token"
                description="Token do @BotFather cấp (VD: 712345678:AAH...)"
              >
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="712345678:AAH..."
                  value={settings.telegramBotToken || ''}
                  onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                />
              </FormGroup>

              <FormGroup
                label="Telegram Chat ID"
                description="ID tài khoản cá nhân của bạn (Lấy từ @userinfobot)"
              >
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="VD: 123456789"
                  value={settings.telegramChatId || ''}
                  onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                />
              </FormGroup>
            </div>

            {/* Guide tip box */}
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-sub)',
              }}
            >
              <strong style={{ color: 'var(--text)' }}>Hướng dẫn cài đặt Telegram Bot trong 1 phút:</strong>
              <ol style={{ paddingLeft: 18, marginTop: 4 }}>
                <li>Mở Telegram, tìm kiếm <code>@BotFather</code>, gửi lệnh <code>/newbot</code> và làm theo hướng dẫn để nhận <strong>HTTP API Token</strong>.</li>
                <li>Tìm kiếm <code>@userinfobot</code> trên Telegram, nhấn <strong>Start</strong> để xem <strong>Id</strong> của bạn (Chat ID).</li>
                <li>Dán Token và Chat ID vào 2 ô trên, sau đó bấm nút <strong>Gửi Thử Nghiệm Tới Telegram</strong> bên dưới để kiểm tra.</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <Button variant="primary" size="md" type="submit">
                Lưu Toàn Bộ Cấu Hình Hệ Thống
              </Button>

              <Button
                variant="secondary"
                size="md"
                type="button"
                disabled={isTestingTelegram}
                onClick={handleTestTelegram}
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                }
              >
                {isTestingTelegram ? 'Đang gửi test...' : 'Gửi Thử Nghiệm Tới Telegram'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
