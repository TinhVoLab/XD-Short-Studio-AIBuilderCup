import React, { useState, useEffect } from 'react'
import styles from './LegalModal.module.css'
import { COMPANY_PAYMENT_INFO } from '@/config/payment'

export type LegalTab = 'terms' | 'privacy' | 'license' | 'refund'

interface LegalModalProps {
  isOpen: boolean
  initialTab?: LegalTab
  onClose: () => void
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.title}>Chính Sách & Điều Khoản Sử Dụng</span>
            <span className={styles.subtitle}>
              {COMPANY_PAYMENT_INFO.companyName} — Cập nhật lần cuối: Năm 2026
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selector */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'terms' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            Điều Khoản Dịch Vụ
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'privacy' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Chính Sách Bảo Mật
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'license' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('license')}
          >
            Bản Quyền & Giấy Phép
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'refund' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('refund')}
          >
            Kích Hoạt & Hoàn Tiền
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.body}>
          {activeTab === 'terms' && (
            <>
              <div className={styles.highlightBox}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent)" strokeWidth="1.6" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="9" cy="9" r="8" />
                  <path d="M9 5v4M9 13h.01" />
                </svg>
                <span>
                  <strong>Cam kết thương mại 100%:</strong> Mọi video được kết xuất (export) qua XD-Short Studio hoàn toàn thuộc quyền sở hữu trí tuệ của người dùng, không bị ràng buộc bản quyền với nhà cung cấp phần mềm.
                </span>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>1. Chấp Thuận Điều Khoản</h4>
                <p className={styles.paragraph}>
                  Khi truy cập, đăng ký tài khoản hoặc sử dụng dịch vụ tại XD-Short Studio, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định tại đây cùng các quy định pháp luật hiện hành của Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                </p>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>2. Quyền Sở Hữu Nội Dung & Bản Quyền Đầu Ra</h4>
                <ul className={styles.bulletList}>
                  <li>Người dùng sở hữu toàn quyền thương mại đối với tất cả video, âm thanh và đồ họa do chính mình cấu hình và kết xuất.</li>
                  <li>Bạn được tự do đăng tải video lên các nền tảng mạng xã hội (TikTok, Facebook Reels, YouTube Shorts), kiếm tiền hoặc bàn giao sản phẩm cho khách hàng đối tác.</li>
                  <li>Hệ thống cam kết không tự ý sử dụng hoặc đăng tải các video dự án riêng tư của người dùng vì bất kỳ mục đích thương mại nào.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>3. Trách Nhiệm Của Người Dùng</h4>
                <p className={styles.paragraph}>
                  Người dùng chịu trách nhiệm pháp lý hoàn toàn đối với nội dung văn bản (prompts), hình ảnh hoặc tài liệu được đưa vào studio để tạo video. Nghiêm cấm sử dụng nền tảng để tạo các nội dung vi phạm pháp luật, kích động bạo lực, lừa đảo, hoặc xúc phạm danh dự của cá nhân/tổ chức theo Luật An ninh mạng.
                </p>
              </div>
            </>
          )}

          {activeTab === 'privacy' && (
            <>
              <div className={styles.highlightBox}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent)" strokeWidth="1.6" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M9 1.5L2.5 4.5v5c0 4 3 7.5 6.5 8.5 3.5-1 6.5-4.5 6.5-8.5v-5L9 1.5z" />
                </svg>
                <span>
                  <strong>Tuân Thủ Nghị Định 13/2023/NĐ-CP:</strong> Chính sách này quy định rõ cách thức XD-Short Studio thu thập, xử lý và bảo vệ dữ liệu cá nhân của người dùng theo đúng quy định pháp luật Việt Nam và chuẩn bảo mật quốc tế.
                </span>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>1. Danh Mục Dữ Liệu Cá Nhân Thu Thập</h4>
                <p className={styles.paragraph}>
                  Chúng tôi chỉ thu thập các dữ liệu cần thiết phục vụ việc cung cấp dịch vụ studio:
                </p>
                <ul className={styles.bulletList}>
                  <li><strong>Thông tin tài khoản:</strong> Địa chỉ Email, Họ và tên hiển thị, Ảnh đại diện (khi bạn đăng nhập an toàn thông qua Google Firebase Authentication).</li>
                  <li><strong>Thông tin thanh toán:</strong> Mã giao dịch VietQR, số tiền thanh toán, gói bản quyền đăng ký. Chúng tôi <em>tuyệt đối không thu thập hoặc lưu trữ mật khẩu ngân hàng, mã OTP hoặc số thẻ tín dụng</em> của người dùng.</li>
                  <li><strong>Thông tin kỹ thuật an ninh:</strong> Địa chỉ IP, loại trình duyệt nhằm phục vụ mục đích bảo mật tài khoản và phòng chống gian lận truy cập.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>2. Mục Đích Xử Lý & Sử Dụng Dữ Liệu</h4>
                <ul className={styles.bulletList}>
                  <li>Xác thực danh tính và kích hoạt phân quyền gói cước (Miễn phí, Creator, Business).</li>
                  <li>Cung cấp dịch vụ hỗ trợ kỹ thuật, chăm sóc khách hàng và giải quyết khiếu nại qua Hotline/Zalo.</li>
                  <li>Bảo trì, nâng cấp hiệu năng và bảo vệ tính toàn vẹn của nền tảng dịch vụ.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>3. Kiến Trúc Local-First & Bảo Mật Khóa API (BYOK)</h4>
                <ul className={styles.bulletList}>
                  <li><strong>Kịch bản & Video dự án:</strong> Được lưu trữ cục bộ trong cơ sở dữ liệu nội bộ trình duyệt máy tính của bạn (IndexedDB). Máy chủ của chúng tôi không tự ý sao chép hay đọc trộm các video riêng tư của bạn.</li>
                  <li><strong>Gemini API Key cá nhân:</strong> Được lưu mã hóa ở LocalStorage của máy người dùng, truyền trực tiếp tới máy chủ Google AI qua kết nối HTTPS, không bao giờ lưu trữ trên máy chủ trung gian.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>4. Quyền Của Chủ Thể Dữ Liệu & Yêu Cầu Xóa Dữ Liệu (Data Deletion)</h4>
                <p className={styles.paragraph}>
                  Theo Điều 9 Nghị định 13/2023/NĐ-CP, bạn có đầy đủ các quyền: Quyền được biết, Quyền đồng ý, Quyền truy cập, Quyền rút lại sự đồng ý và <strong>Quyền yêu cầu xóa vĩnh viễn dữ liệu (Right to Erasure)</strong>:
                </p>
                <ul className={styles.bulletList}>
                  <li>Bạn có quyền yêu cầu xóa toàn bộ thông tin tài khoản và lịch sử dự án trên Cloud bất kỳ lúc nào.</li>
                  <li><strong>Quy trình yêu cầu xóa dữ liệu:</strong> Gửi yêu cầu qua Zalo Hotline <strong>{COMPANY_PAYMENT_INFO.supportHotline}</strong> kèm email tài khoản. Đội ngũ kỹ thuật cam kết xử lý và phản hồi bằng văn bản trong vòng tối đa 72 giờ làm việc.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>5. Cam Kết Không Chia Sẻ Bên Thứ Ba</h4>
                <p className={styles.paragraph}>
                  Chúng tôi cam kết tuyệt đối không trao đổi, mua bán hoặc chuyển giao dữ liệu cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích tiếp thị hoặc thương mại khi chưa có sự đồng ý rõ ràng của bạn.
                </p>
              </div>
            </>
          )}

          {activeTab === 'license' && (
            <>
              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>1. Phân Hạng Gói Bản Quyền</h4>
                <ul className={styles.bulletList}>
                  <li><strong>Miễn phí:</strong> 5 video mỗi tháng, mỗi video tới 30 giây, xuất 720p có logo XD-Short.</li>
                  <li><strong>Creator:</strong> 30 video mỗi tháng, mỗi video tới 60 giây, xuất 1080p không logo, nhạc nền Suno và kho hiệu ứng âm thanh, xuất nhiều video cùng lúc.</li>
                  <li><strong>Business:</strong> Mọi tính năng của Creator, 100 video mỗi tháng (video 61–90 giây tính 2 lượt), lưu video 30 ngày để tải lại, hỗ trợ ưu tiên 1:1 qua Zalo và xuất hoá đơn VAT.</li>
                  <li><strong>Thêm 10 video:</strong> mua lẻ, không hết hạn, mỗi video tới 60 giây, chỉ dùng khi đã hết lượt của tháng.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>2. Giấy Phép Trọn Đời (Perpetual License)</h4>
                <p className={styles.paragraph}>
                  Đối với các khách hàng sở hữu gói Trọn Đời (Lifetime License), bạn được quyền sử dụng phiên bản phần mềm vĩnh viễn mà không phải trả thêm bất kỳ khoản phí duy trì định kỳ nào, đồng thời nhận được các bản vá lỗi và tối ưu hiệu năng định kỳ.
                </p>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>3. Giới Hạn Sử Dụng Hợp Lý</h4>
                <p className={styles.paragraph}>
                  Mỗi tài khoản bản quyền được cấp quyền sử dụng cho cá nhân hoặc doanh nghiệp sở hữu. Không được phép chia sẻ công khai tài khoản cho nhiều người ngoài tổ chức hoặc cố tình khai thác quá tải hạ tầng hệ thống.
                </p>
              </div>
            </>
          )}

          {activeTab === 'refund' && (
            <>
              <div className={styles.highlightBox}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent)" strokeWidth="1.6" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M16 9A7 7 0 1 1 9 2" />
                  <path d="M9 2v4H5" />
                </svg>
                <span>
                  <strong>Chính Sách Hoàn Tiền Minh Bạch Trong 7 Ngày:</strong> Cam kết hoàn tiền 100% nếu phần mềm gặp sự cố kỹ thuật không thể xuất được video và đội ngũ kỹ thuật không thể khắc phục.
                </span>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>1. Quy Trình Kích Hoạt Tự Động</h4>
                <p className={styles.paragraph}>
                  Sau khi quét mã VietQR chuyển khoản với nội dung thanh toán chuẩn, tài khoản của bạn sẽ được hệ thống nâng cấp tự động chỉ sau 3 - 10 giây. Nếu sau 5 phút tài khoản chưa được kích hoạt, bạn chỉ cần liên hệ Zalo Hotline <strong>{COMPANY_PAYMENT_INFO.supportHotline}</strong> để được hỗ trợ kích hoạt tức thì.
                </p>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>2. Điều Kiện Hoàn Tiền</h4>
                <ul className={styles.bulletList}>
                  <li>Yêu cầu hoàn tiền được gửi trong vòng 07 ngày kể từ ngày thanh toán thành công.</li>
                  <li>Phần mềm gặp lỗi hệ thống (lỗi engine render canvas hoặc không thể xuất video) trên thiết bị đáp ứng đúng yêu cầu cấu hình tối thiểu (Chrome/Edge trên máy tính) mà đội ngũ hỗ trợ kỹ thuật không xử lý được.</li>
                  <li>Khoản hoàn trả sẽ được chuyển khoản trực tiếp về số tài khoản ngân hàng chính chủ của người dùng trong vòng 24 - 48 giờ làm việc.</li>
                </ul>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>3. Kênh Tiếp Nhận Khiếu Nại & Hỗ Trợ</h4>
                <p className={styles.paragraph}>
                  Mọi thắc mắc hoặc yêu cầu hoàn tiền xin vui lòng gửi về Zalo Hotline: <strong>{COMPANY_PAYMENT_INFO.supportHotline}</strong> hoặc liên hệ trực tiếp đại diện pháp lý: {COMPANY_PAYMENT_INFO.companyName}.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <span className={styles.footerLegalText}>
            Được bảo hộ bởi pháp luật Việt Nam & Luật Sở hữu trí tuệ
          </span>
          <button className={styles.acceptBtn} onClick={onClose}>
            Đã Hiểu & Đồng Ý
          </button>
        </div>
      </div>
    </div>
  )
}
