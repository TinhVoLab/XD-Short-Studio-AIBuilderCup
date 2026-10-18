import React from 'react'
import styles from './HowItWorks.module.css'
import shared from '../shared.module.css'
import { CheckIcon } from './primitives'

export const HowItWorks: React.FC = () => (
  <section id="how" className={`${shared.container} ${styles.section}`}>
    <div className={shared.eyebrow}>Cách hoạt động</div>
    <h2 className={shared.h2}>Ba bước, một nơi.</h2>

    <ol className={styles.steps}>
      <li className={styles.step}>
        <div className={styles.num}>01</div>
        <h3 className={styles.stepTitle}>Nhập ý tưởng</h3>
        <p className={styles.stepText}>Một câu chủ đề hoặc một đoạn nội dung bạn muốn kể. Chọn giọng đọc và phong cách.</p>
        <div className={styles.inputMock} aria-hidden="true">
          Lãi kép là gì?
          <span className={styles.caret} />
        </div>
      </li>

      <li className={styles.step}>
        <div className={styles.num}>02</div>
        <h3 className={styles.stepTitle}>AI dựng cảnh</h3>
        <p className={styles.stepText}>AI viết kịch bản và hook mở đầu, chọn đồ hoạ cho từng cảnh, lồng giọng đọc và phụ đề.</p>
        <div className={styles.frames} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={i === 0 ? styles.frameActive : styles.frame} />
          ))}
        </div>
      </li>

      <li className={styles.step}>
        <div className={styles.num}>03</div>
        <h3 className={styles.stepTitle}>Chỉnh sửa và xuất</h3>
        <p className={styles.stepText}>Sửa chữ, đổi màu, thay cảnh ngay trên canvas. Xuất MP4 dọc 9:16 sẵn sàng đăng.</p>
        <div className={styles.chips}>
          <span>MP4</span>
          <span>9:16</span>
          <span>1080p</span>
          <span className={styles.chipReady}>
            <CheckIcon size={12} />
            sẵn sàng
          </span>
        </div>
      </li>
    </ol>
  </section>
)
