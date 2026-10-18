import React from 'react'
import styles from './QuizInspector.module.css'
import { InspectorProps, ColorControlRow, Slider, Toggle, ToggleRow } from './common'
import { SectionHeader, FormGroup, Select, SegmentedControl } from '@/components/ui'
import { QuizData } from '@/types/scene'

export function QuizInspector({ element, updateElement }: InspectorProps) {
  const data: QuizData = element.quizData || {
    quizType: 'single-choice',
    badge: 'THỬ THÁCH 5S',
    question: 'Kim loại nào sau đây dẫn điện tốt nhất?',
    options: [
      { id: 'A', text: 'Nhôm (Al)' },
      { id: 'B', text: 'Đồng (Cu)' },
      { id: 'C', text: 'Bạc (Ag)' },
      { id: 'D', text: 'Vàng (Au)' },
    ],
    correctAnswers: ['C'],
    timingMode: 'auto',
    sfxEnabled: true,
    introSec: 3,
    countdownSec: 5,
    revealSec: 4,
    explanation: 'Bạc (Ag) dẫn điện tốt nhất trong các kim loại, tiếp theo là Đồng, Vàng và Nhôm.',
    showExplanation: true,
    themePreset: 'studio-neon',
    layoutVariant: 'stacked',
  }

  const updateData = (patch: Partial<QuizData>) => {
    updateElement(element.id, {
      quizData: { ...data, ...patch },
      accentColor: (patch as any).accentColor || element.accentColor,
    })
  }

  const handleOptionChange = (idx: number, text: string) => {
    const nextOptions = [...(data.options || [])]
    if (nextOptions[idx]) {
      nextOptions[idx] = { ...nextOptions[idx], text }
      updateData({ options: nextOptions })
    }
  }

  const toggleCorrectAnswer = (optId: string) => {
    updateData({ correctAnswers: [optId], correctId: optId })
  }

  const currentAccent = element.accentColor || '#BEFF01'

  return (
    <div className={styles.container}>
      <SectionHeader
        first
        title="Trắc nghiệm đếm ngược (Quiz card)"
        badge={<span className={`${styles.badge} ${styles.badgeQuiz}`}>INTERACTIVE</span>}
      />

      {/* Badge nhãn tiêu đề */}
      <FormGroup
        label="Huy hiệu"
        tooltip="Nhãn ngắn phân loại hiển thị trên đầu câu hỏi (VD: THỬ THÁCH 5S, ĐỐ VUI, CÂU HỎI 9+)"
      >
        <input
          type="text"
          className={styles.input}
          value={data.badge || ''}
          placeholder="VD: THỬ THÁCH 5S, CÂU HỎI 9+, ĐỐ VUI"
          onChange={e => updateData({ badge: e.target.value })}
        />
      </FormGroup>

      {/* Câu hỏi */}
      <FormGroup label="Câu hỏi" tooltip="Nội dung câu hỏi trắc nghiệm">
        <textarea
          className={styles.textarea}
          rows={3}
          value={data.question || ''}
          placeholder="Nhập nội dung câu hỏi..."
          onChange={e => updateData({ question: e.target.value })}
        />
      </FormGroup>

      {/* Bố cục phương án */}
      <FormGroup
        label="Kiểu bố cục"
        tooltip="Lựa chọn kiểu hiển thị 4 phương án dạng danh sách dọc (Stacked) hoặc lưới 2x2 (Grid)"
      >
        <Select
          value={data.layoutVariant || 'stacked'}
          onChange={val => updateData({ layoutVariant: val as 'stacked' | 'grid-2x2' })}
          options={[
            { value: 'stacked', label: 'Dọc 4 hàng (Stacked)' },
            { value: 'grid-2x2', label: 'Lưới 2x2 (Grid)' },
          ]}
        />
      </FormGroup>

      {/* Danh sách 4 phương án & Chọn đáp án đúng */}
      <FormGroup
        label="Các phương án"
        badge="(4/4)"
        tooltip="Bấm trực tiếp vào chữ cái [A], [B], [C], [D] để chọn đáp án đúng. Chữ cái sáng xanh neon là đáp án sẽ được công bố khi hết giờ."
      >
        {(data.options || []).map((opt, idx) => {
          const isCorrect = (data.correctAnswers || [data.correctId || 'C']).includes(opt.id)
          return (
            <div key={opt.id || idx} className={styles.optionRow}>
              <button
                type="button"
                className={`${styles.optionBadge} ${isCorrect ? styles.optionBadgeActive : ''}`}
                onClick={() => toggleCorrectAnswer(opt.id)}
                title={`Bấm để chọn phương án ${opt.id} là đáp án đúng`}
              >
                {opt.id}
              </button>
              <input
                type="text"
                className={styles.optionInput}
                value={opt.text || ''}
                placeholder={`Phương án ${opt.id}...`}
                onChange={e => handleOptionChange(idx, e.target.value)}
              />
            </div>
          )
        })}
      </FormGroup>

      <SectionHeader title="Điều khiển thời gian (Phasing)" />

      <FormGroup
        label="Phân bổ thời gian"
        tooltip={
          (!data.timingMode || data.timingMode === 'auto')
            ? 'Tự động co giãn theo Timeline: 25% Đọc đề • 50% Đếm ngược • 25% Công bố đáp án'
            : 'Tùy chỉnh số giây cố định cho từng giai đoạn đọc đề và đếm ngược'
        }
      >
        <SegmentedControl
          value={data.timingMode || 'auto'}
          onChange={val => updateData({ timingMode: val as 'auto' | 'fixed' })}
          options={[
            { value: 'auto', label: 'Tự động theo cảnh' },
            { value: 'fixed', label: 'Cố định số giây' },
          ]}
          fullWidth
          size="sm"
        />
      </FormGroup>

      {data.timingMode === 'fixed' && (
        <>
          {/* Thời gian đọc đề */}
          <Slider
            label="Thời gian đọc đề"
            value={data.introSec ?? 3}
            min={1}
            max={8}
            step={0.5}
            display={v => `${v}s`}
            onChange={v => updateData({ introSec: v })}
          />

          {/* Thời gian đếm ngược */}
          <Slider
            label="Thời gian đếm ngược"
            value={data.countdownSec ?? 5}
            min={2}
            max={15}
            step={1}
            display={v => `${v}s`}
            onChange={v => updateData({ countdownSec: v })}
          />
        </>
      )}

      <SectionHeader title="Lời giải thích (Explanation)" />

      <ToggleRow label="Bảng giải thích">
        <Toggle
          checked={data.showExplanation !== false}
          onChange={v => updateData({ showExplanation: v })}
        />
      </ToggleRow>

      {data.showExplanation !== false && (
        <FormGroup
          label="Giải thích"
          tooltip="Giải thích ngắn gọn hiển thị phía dưới câu hỏi sau khi công bố đáp án đúng"
        >
          <textarea
            className={styles.textarea}
            rows={2}
            value={data.explanation || ''}
            placeholder="VD: Bạc dẫn điện tốt nhất trong các kim loại..."
            onChange={e => updateData({ explanation: e.target.value })}
          />
        </FormGroup>
      )}

      <SectionHeader title="Giao diện & màu sắc" />
      <ColorControlRow
        label="Màu hiệu ứng nổi bật"
        value={currentAccent}
        onChange={c => updateElement(element.id, { accentColor: c })}
      />

      {/* Hiệu ứng âm thanh tự động */}
      <SectionHeader title="Hiệu ứng âm thanh (SFX)" />
      <ToggleRow label="Âm thanh đếm ngược">
        <Toggle
          checked={data.sfxEnabled !== false}
          onChange={v => updateData({ sfxEnabled: v })}
        />
      </ToggleRow>
    </div>
  )
}
