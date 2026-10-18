import React from 'react'
import styles from './BuiltOnStrip.module.css'

const STACK = [
  { name: 'Gemini', role: 'dựng nội dung' },
  { name: 'Google Cloud Run', role: 'render video' },
  { name: 'Firebase', role: 'tài khoản và dự án' },
]

export const BuiltOnStrip: React.FC = () => (
  <section className={styles.strip} aria-label="Nền tảng công nghệ">
    <div className={styles.inner}>
      <span className={styles.label}>Xây dựng trên</span>
      <ul className={styles.list}>
        {STACK.map((s) => (
          <li key={s.name}>
            {s.name} <span className={styles.role}>· {s.role}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
)
