import React from 'react'
import shared from '../shared.module.css'

/** Logo XD-short Studio — menu và footer */
export const LandingLogo: React.FC<{ href?: string }> = ({ href }) => {
  const content = (
    <>
      <span className={shared.logoMark}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      </span>
      <span>
        XD-short <span className={shared.logoSub}>Studio</span>
      </span>
    </>
  )
  return href ? (
    <a href={href} className={shared.logo}>
      {content}
    </a>
  ) : (
    <span className={shared.logo}>{content}</span>
  )
}

export const ArrowRightIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const CheckIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
