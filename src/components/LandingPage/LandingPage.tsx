import React, { useEffect, useState } from 'react'
import styles from './LandingPage.module.css'
import shared from './shared.module.css'
import { LandingNav } from './components/LandingNav'
import { HeroSection } from './components/HeroSection'
import { BuiltOnStrip } from './components/BuiltOnStrip'
import { StudioShowcase } from './components/StudioShowcase'
import { HowItWorks } from './components/HowItWorks'
import { WhyDifferent } from './components/WhyDifferent'
import { ComparisonTension } from './components/ComparisonTension'
import { PricingSection } from './components/PricingSection'
import { FeatureMatrix } from './components/FeatureMatrix'
import { StatementBand } from './components/StatementBand'
import { FaqSection } from './components/FaqSection'
import { FinalCta } from './components/FinalCta'
import { FloatingSupportWidget } from '@/components/Support/FloatingSupportWidget'
import { LegalModal, LegalTab } from '@/components/Legal/LegalModal'
import { useEditorStore } from '@/store/useEditorStore'
import { DEFAULT_WIZARD_PRESET_ID } from '@/components/AiWizardModal/config/wizardCatalog'

interface LandingPageProps {
  onOpenStudio: () => void
  onActivateLicense?: (key: string) => void
}

// Font riêng của landing — chỉ nạp khi mở landing, Studio không tải thêm
const LANDING_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Playfair+Display:ital,wght@1,500;1,600&family=Be+Vietnam+Pro:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap'

const useLandingFonts = () => {
  useEffect(() => {
    if (document.getElementById('landing-fonts')) return
    const link = document.createElement('link')
    link.id = 'landing-fonts'
    link.rel = 'stylesheet'
    link.href = LANDING_FONTS_HREF
    document.head.appendChild(link)
  }, [])
}

const scrollToSection = (id: string) => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [showMatrix, setShowMatrix] = useState(false)
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms')
  const [heroOutOfView, setHeroOutOfView] = useState(false)
  const { setPricingModalOpen, openAiWizardWithTemplate } = useEditorStore()
  useLandingFonts()

  // Thanh CTA dính đáy (mobile) chỉ hiện khi hero đã cuộn khỏi màn hình
  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setHeroOutOfView(!entry.isIntersecting), { threshold: 0 })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  // Ý tưởng gõ ở hero: mở trình tạo video AI với ý tưởng đó ngay khi vào Studio
  const handleCreate = (idea: string) => {
    if (idea) openAiWizardWithTemplate(DEFAULT_WIZARD_PRESET_ID, idea)
    onOpenStudio()
  }

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalModalTab(tab)
    setLegalModalOpen(true)
  }

  return (
    <div className={styles.landingContainer}>
      <LandingNav onOpenStudio={onOpenStudio} onScrollTo={scrollToSection} hideCtaOnMobile={heroOutOfView} />

      <main>
        <HeroSection onCreate={handleCreate} />
        <BuiltOnStrip />
        <StudioShowcase />
        <HowItWorks />
        <WhyDifferent />
        <ComparisonTension />
        <PricingSection
          onOpenStudio={onOpenStudio}
          onSelectPlan={() => setPricingModalOpen(true)}
          onToggleMatrix={() => setShowMatrix((prev) => !prev)}
          showMatrix={showMatrix}
        />
        {showMatrix && <FeatureMatrix />}
        <StatementBand />
        <FaqSection />
      </main>

      <FinalCta onOpenStudio={onOpenStudio} onScrollTo={scrollToSection} onOpenLegal={handleOpenLegal} />

      <div className={`${styles.mobileCtaBar} ${heroOutOfView ? styles.mobileCtaBarVisible : ''}`} aria-hidden={!heroOutOfView}>
        <button
          type="button"
          className={`${shared.btnAccent} ${shared.btnLg} ${shared.btnBlock}`}
          onClick={onOpenStudio}
          tabIndex={heroOutOfView ? 0 : -1}
        >
          Tạo video miễn phí
        </button>
      </div>

      <LegalModal isOpen={legalModalOpen} initialTab={legalModalTab} onClose={() => setLegalModalOpen(false)} />

      {/* Nâng nút hỗ trợ lên trên thanh CTA dính đáy trên mobile */}
      <div className={heroOutOfView ? styles.supportLifted : undefined}>
        <FloatingSupportWidget />
      </div>
    </div>
  )
}

export default LandingPage
