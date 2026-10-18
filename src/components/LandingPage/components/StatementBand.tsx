import React from 'react'
import styles from './StatementBand.module.css'
import shared from '../shared.module.css'
import { TESTIMONIALS } from '../landingContent'

/** Khoảnh khắc đảo màu duy nhất của trang: câu tuyên ngôn + nhận xét người dùng (khi có) */
export const StatementBand: React.FC = () => (
  <section className={styles.band}>
    <div className={`${styles.inner} ${TESTIMONIALS.length ? '' : styles.innerSolo}`}>
      {TESTIMONIALS.length > 0 && <div className={styles.kicker}>Người sáng tạo nói gì</div>}
      <h2 className={styles.title}>
        <span className={styles.line}>Mỗi người sáng tạo Việt xứng đáng có</span>{' '}
        <span className={styles.line}>
          <span className={shared.serif}>một phòng dựng phim</span> của riêng mình.
        </span>
      </h2>

      {TESTIMONIALS.length > 0 && (
        <div className={styles.quotes}>
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className={styles.quote}>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <span className={styles.avatar} aria-hidden="true" />
                <span>
                  <span className={styles.name}>{t.name}</span>
                  <span className={styles.role}>{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  </section>
)
