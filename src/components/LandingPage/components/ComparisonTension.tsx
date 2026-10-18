import React from 'react'
import styles from './ComparisonTension.module.css'
import shared from '../shared.module.css'
import { CheckIcon } from './primitives'

const MANUAL = [
  'Tự viết kịch bản, tự nghĩ câu mở đầu',
  'Thu âm hoặc ghép giọng đọc ở app khác',
  'Gắn phụ đề, hiệu ứng chữ bằng tay từng đoạn',
  'Dựng đồ hoạ số liệu bằng keyframe',
]

const WITH_XD = [
  'Kịch bản và hook viết sẵn từ ý tưởng',
  'Giọng đọc tiếng Việt lồng tự động',
  'Phụ đề khớp từng từ, từ khoá tự nổi bật',
  'Biểu đồ, danh sách, quiz có sẵn và chỉnh được',
]

export const ComparisonTension: React.FC = () => (
  <section className={shared.section}>
    <div className={shared.eyebrow}>So sánh</div>
    <h2 className={shared.h2}>Bớt việc lặp lại, giữ phần sáng tạo cho bạn.</h2>

    <div className={styles.grid}>
      <div className={styles.col}>
        <div className={styles.head}>
          <h3 className={`${styles.title} ${styles.titleOld}`}>Làm thủ công</h3>
          <span className={styles.meta}>vài giờ / video</span>
        </div>
        <div className={styles.bar} />
        <ul className={`${styles.list} ${styles.listOld}`}>
          {MANUAL.map((t) => (
            <li key={t}>
              <span className={styles.dash} aria-hidden="true">
                —
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.col} ${styles.colNew}`}>
        <div className={styles.head}>
          <h3 className={styles.title}>Với XD-Short</h3>
          <span className={`${styles.meta} ${shared.accent}`}>~2 phút render / 30s</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.barFill} />
        </div>
        <ul className={styles.list}>
          {WITH_XD.map((t) => (
            <li key={t}>
              <CheckIcon className={styles.check} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
)
