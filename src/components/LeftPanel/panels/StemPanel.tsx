import React, { useState, useMemo } from 'react'
import styles from './StemPanel.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { STEM_PRESETS } from '@/data/stemCatalog'
import { StemPresetItem } from '@/types/stem'
import { SegmentedControl } from '@/components/ui'

type CategoryFilter = 'all' | 'physics' | 'cs' | 'math' | 'chemistry' | 'latex' | 'quiz' | 'paradox'

export default function StemPanel() {
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { addElement, showToast } = useEditorStore(
    useShallow(s => ({
      addElement: s.addElement,
      showToast: s.showToast,
    }))
  )

  const filteredPresets = useMemo(() => {
    return STEM_PRESETS.filter(item => {
      const matchCategory =
        activeTab === 'all' ||
        item.category === activeTab ||
        (activeTab === 'chemistry' && (item.category as string) === 'chem')
      if (!matchCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q))
      )
    })
  }, [activeTab, searchQuery])

  const handleAddPreset = (item: StemPresetItem) => {
    if (item.type === 'physics-sim') {
      addElement({
        type: 'physics-sim',
        left: 180,
        top: 280,
        width: 360,
        height: 380,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || '#BEFF01',
        animPreset: 'fade',
        animDuration: 0.8,
        content: item.name,
        physicsData: item.physicsData,
      })
      showToast(`Đã thêm mô phỏng vật lý: ${item.name}`)
      return
    }

    if (item.type === 'algorithm-sim') {
      addElement({
        type: 'algorithm-sim',
        left: 180,
        top: 280,
        width: 360,
        height: 480,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || '#00D4FF',
        animPreset: 'fade',
        animDuration: 0.8,
        content: item.name,
        algorithmData: item.algorithmData,
      })
      showToast(`Đã thêm mô phỏng thuật toán: ${item.name}`)
      return
    }

    if (item.type === 'math-plot') {
      addElement({
        type: 'math-plot',
        left: 180,
        top: 280,
        width: 360,
        height: 260,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || item.mathData?.color || '#BEFF01',
        animPreset: 'fade',
        animDuration: 1.0,
        content: item.name,
        mathData: item.mathData,
      })
      showToast(`Đã thêm đồ thị: ${item.name}`)
      return
    }

    if (item.type === 'chemical-molecule') {
      addElement({
        type: 'chemical-molecule',
        left: 180,
        top: 280,
        width: 340,
        height: 260,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || '#00d2ff',
        animPreset: 'scale-up',
        animDuration: 1.0,
        content: item.name,
        chemData: item.chemData,
      })
      showToast(`Đã thêm cấu trúc hoá học: ${item.name}`)
      return
    }

    if (item.type === 'latex-formula') {
      addElement({
        type: 'latex-formula',
        left: 180,
        top: 340,
        width: 360,
        height: 140,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || item.latexData?.color || '#FFFFFF',
        animPreset: 'fade',
        animDuration: 1.0,
        content: item.name,
        latexData: item.latexData,
      })
      showToast(`Đã thêm công thức: ${item.name}`)
      return
    }

    if (item.type === 'interactive-quiz') {
      addElement({
        type: 'interactive-quiz',
        left: 180,
        top: 240,
        width: 340,
        height: 330,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || '#BEFF01',
        animPreset: 'fade',
        animDuration: 0.8,
        content: item.name,
        quizData: item.quizData,
      })
      showToast(`Đã thêm câu hỏi trắc nghiệm: ${item.name}`)
      return
    }

    if (item.type === 'visual-paradox') {
      addElement({
        type: 'visual-paradox',
        left: 180,
        top: 260,
        width: 336,
        height: 400,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || '#BEFF01',
        animPreset: 'fade',
        animDuration: 0.8,
        content: item.name,
        paradoxData: item.paradoxData,
      })
      showToast(`Đã thêm mô phỏng nghịch lý: ${item.name}`)
      return
    }

    if (item.type === 'code-terminal') {
      addElement({
        type: 'code-terminal',
        left: 180,
        top: 260,
        width: 320,
        height: 180,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: item.accentColor || '#00D4FF',
        animPreset: 'slide-up',
        animDuration: 0.8,
        content: item.name,
        codeData: item.codeData,
      })
      showToast(`Đã thêm cửa sổ terminal: ${item.name}`)
      return
    }
  }

  const tabOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'paradox', label: 'Nghịch lý' },
    { value: 'cs', label: 'Thuật toán' },
    { value: 'physics', label: 'Vật lý 2D' },
    { value: 'math', label: 'Toán học' },
    { value: 'chemistry', label: 'Hoá học' },
    { value: 'latex', label: 'Công thức' },
    { value: 'quiz', label: 'Trắc nghiệm' },
  ]

  const getBadgeClass = (category: string) => {
    switch (category) {
      case 'paradox':
        return `${styles.badge} ${styles.badgeLatex}`
      case 'cs':
        return `${styles.badge} ${styles.badgeMath}`
      case 'physics':
        return `${styles.badge} ${styles.badgePhysics}`
      case 'math':
        return `${styles.badge} ${styles.badgeMath}`
      case 'chemistry':
      case 'chem':
        return `${styles.badge} ${styles.badgeChem}`
      case 'latex':
        return `${styles.badge} ${styles.badgeLatex}`
      case 'quiz':
        return `${styles.badge} ${styles.badgeMath}`
      default:
        return styles.badge
    }
  }

  const getBadgeLabel = (item: StemPresetItem) => {
    if (item.category === 'paradox') return 'Paradox Sim'
    if (item.category === 'cs') return 'CS Trace'
    if (item.category === 'physics') return 'Matter.js'
    if (item.category === 'math') return 'Mafs Plot'
    if (item.category === 'chemistry' || item.category === 'chem') return 'SMILES 2D'
    if (item.category === 'latex') return 'KaTeX'
    if (item.category === 'quiz') return 'Quiz 5s'
    return 'STEM'
  }

  const getSnippet = (item: StemPresetItem) => {
    if (item.paradoxData?.paradoxId) return `Nghịch lý: ${item.paradoxData.paradoxId}`
    if (item.physicsData?.presetId) return `Mô phỏng 2D: ${item.physicsData.presetId}`
    if (item.quizData?.question) return item.quizData.question
    if (item.mathData?.latexLabel) return item.mathData.latexLabel
    if (item.mathData?.expression) return `f(x) = ${item.mathData.expression}`
    if (item.chemData?.formula) return `Công thức: ${item.chemData.formula}`
    if (item.latexData?.latex) return item.latexData.latex
    return ''
  }

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchWrap}>
        <svg
          className={styles.searchIcon}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tìm công thức, đồ thị, phân tử..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <SegmentedControl
        value={activeTab}
        onChange={val => setActiveTab(val as CategoryFilter)}
        options={tabOptions}
      />

      {/* Preset Cards List */}
      <div className={styles.cardList}>
        {filteredPresets.map(item => (
          <div
            key={item.id}
            className={styles.card}
            onClick={() => handleAddPreset(item)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAddPreset(item)
              }
            }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{item.name}</span>
              <span className={getBadgeClass(item.category)}>{getBadgeLabel(item)}</span>
            </div>

            <p className={styles.cardDesc}>{item.description}</p>

            {getSnippet(item) && (
              <div className={styles.previewSnippet}>
                {getSnippet(item)}
              </div>
            )}
          </div>
        ))}

        {filteredPresets.length === 0 && (
          <div className={styles.emptyState}>
            Không tìm thấy mẫu STEM phù hợp với từ khóa
          </div>
        )}
      </div>
    </div>
  )
}
