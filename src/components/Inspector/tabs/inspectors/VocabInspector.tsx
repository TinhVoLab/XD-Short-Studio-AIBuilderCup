import React, { useState } from 'react'
import styles from './VocabInspector.module.css'
import { InspectorProps, Slider, Toggle, ToggleRow, ColorControlRow } from './common'
import { SectionHeader, FormGroup, Select, SegmentedControl } from '@/components/ui'
import { VocabCardData } from '@/types/scene'

export function VocabInspector({ element, updateElement }: InspectorProps) {
  const data: VocabCardData = element.vocabData || {
    word: 'CRUCIAL',
    partOfSpeech: 'adj',
    ipa: '/ˈkruː.ʃəl/',
    audioAccent: 'UK',
    cefrLevel: 'IELTS 7.0+',
    meaningVi: 'Cực kỳ quan trọng, có tính quyết định',
    meaningEn: 'Extremely important or necessary',
    exampleEn: 'Regular exercise plays a crucial role in maintaining good health.',
    exampleVi: 'Tập thể dục đều đặn đóng vai trò cực kỳ quan trọng đối với sức khỏe.',
    highlightWord: 'crucial role',
    synonyms: ['Essential', 'Vital', 'Pivotal'],
    timingMode: 'auto',
    sfxEnabled: true,
    introSec: 2.5,
    meaningSec: 2.5,
    exampleSec: 3.0,
  }

  const [newSynonym, setNewSynonym] = useState('')

  const updateData = (patch: Partial<VocabCardData>) => {
    updateElement(element.id, {
      vocabData: { ...data, ...patch },
    })
  }

  const handleAddSynonym = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSynonym.trim()) {
      e.preventDefault()
      const current = data.synonyms || []
      if (!current.includes(newSynonym.trim())) {
        updateData({ synonyms: [...current, newSynonym.trim()] })
      }
      setNewSynonym('')
    }
  }

  const handleRemoveSynonym = (idx: number) => {
    const next = [...(data.synonyms || [])]
    next.splice(idx, 1)
    updateData({ synonyms: next })
  }

  return (
    <div className={styles.container}>
      <SectionHeader
        title="Thẻ từ vựng (Vocab card)"
        badge={<span className={`${styles.badge} ${styles.badgeVocab}`}>VOCAB</span>}
      />

      {/* Từ vựng & Loại từ */}
      <div className={styles.rowInputs}>
        <FormGroup label="Từ vựng chính">
          <input
            type="text"
            className={styles.input}
            value={data.word || ''}
            placeholder="VD: CRUCIAL"
            onChange={e => updateData({ word: e.target.value })}
          />
        </FormGroup>

        <FormGroup label="Loại từ">
          <Select
            value={data.partOfSpeech || 'adj'}
            onChange={val => updateData({ partOfSpeech: val })}
            options={[
              { value: 'adj', label: 'Tính từ (adj)' },
              { value: 'noun', label: 'Danh từ (noun)' },
              { value: 'verb', label: 'Động từ (verb)' },
              { value: 'adv', label: 'Trạng từ (adv)' },
              { value: 'phrasal verb', label: 'Cụm động từ' },
              { value: 'idiom', label: 'Thành ngữ (idiom)' },
            ]}
          />
        </FormGroup>
      </div>

      {/* Phiên âm IPA & Giọng đọc */}
      <div className={styles.rowInputs}>
        <FormGroup label="Phiên âm IPA">
          <input
            type="text"
            className={styles.input}
            value={data.ipa || ''}
            placeholder="VD: /ˈkruː.ʃəl/"
            onChange={e => updateData({ ipa: e.target.value })}
          />
        </FormGroup>

        <FormGroup label="Giọng đọc">
          <Select
            value={data.audioAccent || 'UK'}
            onChange={val => updateData({ audioAccent: val as any })}
            options={[
              { value: 'UK', label: 'Anh - Anh (UK)' },
              { value: 'US', label: 'Anh - Mỹ (US)' },
              { value: 'CN', label: 'Trung Quốc (CN)' },
              { value: 'JP', label: 'Nhật Bản (JP)' },
              { value: 'VN', label: 'Việt Nam (VN)' },
            ]}
          />
        </FormGroup>
      </div>

      {/* Trình độ CEFR / Chứng chỉ */}
      <FormGroup label="Trình độ / Thẻ Level">
        <input
          type="text"
          className={styles.input}
          value={data.cefrLevel || ''}
          placeholder="VD: IELTS 7.0+, C1, B2, HSK 4, TOEIC 800+"
          onChange={e => updateData({ cefrLevel: e.target.value })}
        />
      </FormGroup>

      {/* Nghĩa tiếng Việt */}
      <FormGroup label="Nghĩa tiếng Việt">
        <textarea
          className={styles.textarea}
          rows={2}
          value={data.meaningVi || ''}
          placeholder="Nghĩa tiếng Việt súc tích..."
          onChange={e => updateData({ meaningVi: e.target.value })}
        />
      </FormGroup>

      {/* Định nghĩa tiếng Anh (tùy chọn) */}
      <FormGroup label="Định nghĩa tiếng Anh (tùy chọn)">
        <input
          type="text"
          className={styles.input}
          value={data.meaningEn || ''}
          placeholder="Extremely important or necessary..."
          onChange={e => updateData({ meaningEn: e.target.value })}
        />
      </FormGroup>

      {/* Câu ví dụ tiếng Anh */}
      <FormGroup label="Câu ví dụ thực tế">
        <textarea
          className={styles.textarea}
          rows={2}
          value={data.exampleEn || ''}
          placeholder="VD: Regular exercise plays a crucial role in maintaining good health."
          onChange={e => updateData({ exampleEn: e.target.value })}
        />
      </FormGroup>

      {/* Cụm từ cần highlight trong câu */}
      <FormGroup label="Cụm từ tô sáng (Highlight)">
        <input
          type="text"
          className={styles.input}
          value={data.highlightWord || ''}
          placeholder="VD: crucial role"
          onChange={e => updateData({ highlightWord: e.target.value })}
        />
      </FormGroup>

      {/* Dịch nghĩa câu ví dụ */}
      <FormGroup label="Dịch nghĩa câu ví dụ">
        <input
          type="text"
          className={styles.input}
          value={data.exampleVi || ''}
          placeholder="Tập thể dục đóng vai trò quyết định..."
          onChange={e => updateData({ exampleVi: e.target.value })}
        />
      </FormGroup>

      {/* Từ đồng nghĩa (Synonyms) */}
      <FormGroup label="Từ đồng nghĩa (Nhấn Enter để thêm)">
        <input
          type="text"
          className={styles.input}
          value={newSynonym}
          placeholder="Nhập từ và bấm Enter (VD: Essential)"
          onChange={e => setNewSynonym(e.target.value)}
          onKeyDown={handleAddSynonym}
        />
        {data.synonyms && data.synonyms.length > 0 && (
          <div className={styles.chipsContainer}>
            {data.synonyms.map((syn, idx) => (
              <span key={idx} className={styles.chip}>
                {syn}
                <span
                  className={styles.chipRemove}
                  onClick={() => handleRemoveSynonym(idx)}
                  title="Xóa từ"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              </span>
            ))}
          </div>
        )}
      </FormGroup>

      {/* Thời lượng 3 pha */}
      <SectionHeader title="Thời lượng 3 giai đoạn" />

      <FormGroup label="Chế độ phân bổ thời gian">
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

      {(!data.timingMode || data.timingMode === 'auto') ? (
        <div style={{
          padding: '10px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: 11,
          color: 'var(--text-sub)',
          lineHeight: 1.5,
        }}>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
            Tự động co giãn theo Timeline
          </div>
          Các giai đoạn sẽ tự co giãn linh hoạt: 30% Phát âm • 30% Giải nghĩa • 40% Ví dụ & Từ đồng nghĩa. Rút ngắn cảnh trên timeline sẽ tự động tua nhanh nội dung mà không bị mất pha cuối.
        </div>
      ) : (
        <>
          <Slider
            label="1. Phát âm & Hook (s)"
            value={data.introSec ?? 2.5}
            min={0.8}
            max={5}
            step={0.2}
            display={v => `${v}s`}
            onChange={v => updateData({ introSec: v })}
          />

          <Slider
            label="2. Giải nghĩa (s)"
            value={data.meaningSec ?? 2.5}
            min={0.8}
            max={5}
            step={0.2}
            display={v => `${v}s`}
            onChange={v => updateData({ meaningSec: v })}
          />

          <Slider
            label="3. Ví dụ & Đồng nghĩa (s)"
            value={data.exampleSec ?? 3.0}
            min={1}
            max={8}
            step={0.5}
            display={v => `${v}s`}
            onChange={v => updateData({ exampleSec: v })}
          />
        </>
      )}

      {/* Màu sắc chủ đạo */}
      <SectionHeader title="Giao diện & màu sắc" />
      <ColorControlRow
        label="Màu chủ đạo"
        value={element.accentColor || '#FFB800'}
        onChange={c => updateElement(element.id, { accentColor: c })}
      />

      {/* Hiệu ứng âm thanh tự động */}
      <SectionHeader title="Hiệu ứng âm thanh (SFX)" />
      <ToggleRow label="Tự động phát SFX theo từng pha">
        <Toggle
          checked={data.sfxEnabled !== false}
          onChange={v => updateData({ sfxEnabled: v })}
        />
      </ToggleRow>
    </div>
  )
}
