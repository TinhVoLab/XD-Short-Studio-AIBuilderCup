import React from 'react'
import styles from './WhyDifferent.module.css'
import shared from '../shared.module.css'
import { STUDIO_THEME_SWATCHES } from '../landingContent'

// Sóng giọng đọc minh hoạ: 6 đã đọc, 2 đang đọc, còn lại chưa tới
const VOICE_WAVE = [30, 55, 80, 45, 90, 60, 100, 70, 40, 65, 85, 35, 50, 75, 30, 60, 45, 20]
const HOOKS = ['“90% người trẻ mắc lỗi này…”', '“Bạn mất 3 giờ mỗi sáng.”', '“Đừng tiết kiệm nữa.”']

export const WhyDifferent: React.FC = () => (
  <section className={shared.section}>
    <div className={shared.eyebrow}>Vì sao khác</div>
    <h2 className={shared.h2}>Không chỉ ghép chữ lên video mẫu.</h2>

    <div className={styles.bento}>
      <article className={`${styles.cell} ${styles.span4} ${styles.tall}`}>
        <div>
          <h3 className={styles.cellTitle}>Giọng đọc và phụ đề khớp từng từ</h3>
          <p className={`${styles.cellText} ${styles.narrow}`}>
            Phụ đề chạy đúng nhịp giọng đọc tiếng Việt, từ khoá được làm nổi bật đúng lúc được đọc.
          </p>
        </div>
        <div className={styles.well} aria-hidden="true">
          <div className={styles.karaoke}>
            Tiết kiệm <span className={styles.spoken}>không phải</span> là <mark>cắt giảm</mark> mọi thứ
          </div>
          <div className={styles.wave}>
            {VOICE_WAVE.map((h, i) => (
              <span key={i} className={i < 6 ? styles.waveDone : i < 8 ? styles.waveNow : ''} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </article>

      <article className={`${styles.cell} ${styles.span2}`}>
        <div>
          <h3 className={styles.cellTitle}>Hook 3 giây theo nội dung</h3>
          <p className={styles.cellText}>Cảnh mở đầu dựng từ chính chủ đề của bạn.</p>
        </div>
        <div className={styles.hooks} aria-hidden="true">
          {HOOKS.map((h, i) => (
            <div key={h} className={i === 1 ? styles.hookActive : styles.hook}>
              {h}
            </div>
          ))}
        </div>
      </article>

      <article className={`${styles.cell} ${styles.span3}`}>
        <div>
          <h3 className={styles.cellTitle}>Chỉnh sửa như phần mềm dựng</h3>
          <p className={styles.cellText}>Canvas kéo thả, theme màu đồng bộ cho cả video.</p>
        </div>
        <div className={styles.wellTight} aria-hidden="true">
          <div className={styles.ruler}>
            <span>00:00</span>
            <span>00:10</span>
            <span>00:20</span>
            <span>00:30</span>
          </div>
          <div className={styles.clips}>
            <span className={styles.clipActive} />
            <span />
            <span />
            <span />
          </div>
          <div className={styles.audioLane} />
          <div className={styles.swatches}>
            {STUDIO_THEME_SWATCHES.map((c, i) => (
              <span key={c} className={i === 0 ? styles.swatchActive : undefined} style={{ background: c }} />
            ))}
          </div>
        </div>
      </article>

      <article className={`${styles.cell} ${styles.span3}`}>
        <div>
          <h3 className={styles.cellTitle}>Biểu đồ, danh sách, quiz có sẵn</h3>
          <p className={styles.cellText}>Không cần keyframe. Đổi số liệu, cảnh tự cập nhật.</p>
        </div>
        <div className={styles.widgets} aria-hidden="true">
          <div className={styles.widgetBars}>
            <span style={{ height: '30%' }} />
            <span style={{ height: '55%' }} />
            <span className={styles.accentFill} style={{ height: '90%' }} />
          </div>
          <div className={styles.widgetList}>
            <span style={{ width: '80%' }} />
            <span style={{ width: '60%' }} />
            <span className={styles.accentFill} style={{ width: '70%' }} />
            <span style={{ width: '50%' }} />
          </div>
          <div className={styles.widgetQuiz}>?</div>
        </div>
      </article>
    </div>
  </section>
)
