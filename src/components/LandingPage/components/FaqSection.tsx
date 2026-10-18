import React, { useState } from 'react'
import styles from './FaqSection.module.css'
import shared from '../shared.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { COMPANY_PAYMENT_INFO } from '@/config/payment'
import { TOPUP_PACKS } from '@/config/planCatalog'

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const freePlan = useEditorStore((s) => s.getPlanByTier('free'))
  const topup = TOPUP_PACKS[0]
  const vnd = (n: number) => `${n.toLocaleString('vi-VN')} đ`

  const fq = freePlan.quotas
  const freeSummary =
    fq?.monthlyVideoLimit > 0
      ? `Gói miễn phí cho bạn ${fq.monthlyVideoLimit} video mỗi tháng, mỗi video tới ${fq.maxVideoSec} giây, xuất ${fq.maxResolution}${
          freePlan.features?.removeWatermark ? '' : ' có logo XD-Short'
        }. Video xuất xong được giữ ${fq.storageRetentionDays} ngày để tải lại.`
      : 'Gói miễn phí có hạn mức video mỗi tháng, xem chi tiết trong bảng giá.'

  const faqs = [
    {
      q: 'Gói miễn phí gồm những gì?',
      a: `${freeSummary} Không cần thẻ để đăng ký. Khi cần nhiều video hơn, video dài hơn hoặc xuất 1080p không logo, bạn nâng cấp lên gói trả phí.`,
    },
    {
      q: 'Hết lượt video trong tháng thì sao?',
      a: `Lượt video làm mới vào ngày 01 hàng tháng. Nếu cần thêm ngay, bạn mua "${topup.label}" giá ${vnd(topup.price)}: mỗi video tới ${topup.maxVideoSec} giây, không hết hạn và chỉ được dùng sau khi đã hết lượt của tháng. Video mua thêm vẫn xuất theo độ phân giải và logo của gói bạn đang dùng.`,
    },
    {
      q: 'Tôi có cần máy tính cấu hình mạnh không?',
      a: 'Không. Bạn làm việc trên trình duyệt (khuyên dùng Chrome hoặc Edge trên máy tính), còn video được render trên máy chủ Google Cloud. Một video 30 giây mất khoảng 2 phút để render.',
    },
    {
      q: 'Dùng AI có tốn thêm phí không?',
      a: 'Mỗi gói có sẵn hạn mức lượt dùng AI mỗi ngày, ghi trong bảng so sánh các gói. Nếu cần dùng nhiều hơn, bạn có thể nhập Gemini API key của riêng mình trong phần Cài đặt.',
    },
    {
      q: 'Tôi có thể đổi hoặc dừng gói bất cứ lúc nào không?',
      a: 'Có. Gói được trả trước theo tháng hoặc theo năm qua VietQR và không tự động trừ tiền. Hết kỳ, bạn tự chọn gia hạn, đổi gói hoặc dừng.',
    },
    {
      q: 'Sau khi chuyển khoản VietQR, bao lâu thì tài khoản được nâng cấp?',
      a: `Hệ thống tự động kích hoạt khi nhận chuyển khoản đúng số tiền và đúng nội dung chuyển khoản hiển thị ở bước thanh toán, thường chỉ trong vài giây. Chuyển thiếu tiền sẽ chưa được kích hoạt. Gia hạn khi gói còn hạn được cộng tiếp vào ngày hết hạn hiện tại. Nếu sau 5 phút vẫn chưa thấy thay đổi, hãy nhắn Zalo ${COMPANY_PAYMENT_INFO.supportHotline} để được hỗ trợ.`,
    },
    {
      q: 'Tôi có được dùng video cho mục đích thương mại không?',
      a: 'Có. Bạn có thể đăng video lên kênh của mình, kênh bán hàng hoặc làm video cho khách hàng. Chi tiết quyền sử dụng nằm trong Điều khoản dịch vụ ở cuối trang.',
    },
    {
      q: 'Tôi có dùng được trên nhiều máy không?',
      a: 'Có. Đăng nhập cùng một tài khoản, dự án được lưu trên đám mây để bạn mở lại ở máy khác.',
    },
  ]

  return (
    <section id="faq" className={`${shared.section} ${styles.section}`}>
      <div className={styles.intro}>
        <div className={shared.eyebrow}>Hỏi đáp</div>
        <h2 className={shared.h2}>
          Câu hỏi
          <br />
          thường gặp
        </h2>
        <p className={styles.introText}>Không thấy câu trả lời? Nhắn đội ngũ XD-Short qua Zalo.</p>
        <a className={`${shared.btnGhost} ${styles.chat}`} href={COMPANY_PAYMENT_INFO.supportZalo} target="_blank" rel="noreferrer">
          Chat với chúng tôi
        </a>
      </div>

      <div className={styles.list}>
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx
          const panelId = `faq-panel-${idx}`
          return (
            <div key={faq.q} className={styles.item}>
              <button
                type="button"
                className={styles.question}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <span>{faq.q}</span>
                <span className={styles.toggle} aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {isOpen ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
                  </svg>
                </span>
              </button>
              {isOpen && (
                <p id={panelId} className={styles.answer}>
                  {faq.a}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
