import React, { useState, useMemo } from 'react'
import styles from './StemInspector.module.css'
import { InspectorProps, ColorDot, Slider, Toggle, ToggleRow, CardBackgroundControl, ColorControlRow } from './common'
import { SectionHeader, FormGroup, Select, SegmentedControl, Button } from '@/components/ui'
import { LatexAnimMode, MathPlotData } from '@/types/stem'
import { STEM_PRESETS } from '@/data/stemCatalog'
import 'katex/dist/katex.min.css'
import { MathFormulaModal } from '@/components/MathFormulaModal'
import { validatePlotData } from '@/utils/stem/mathExpr'
import { resolveChemByName } from '@/services/chemLookupService'
import { renderLatexHtml } from '@/utils/stem/latex'

export function StemInspector({ element, updateElement, showToast }: InspectorProps) {
  const { type, mathData, chemData, latexData } = element

  const [isMathModalOpen, setIsMathModalOpen] = useState(false)
  const [chemLookup, setChemLookup] = useState<{ loading: boolean; error?: string }>({ loading: false })

  // ── 1. MATH PLOT INSPECTOR (MAFS 10 MODULES) ────────────────────────
  if (type === 'math-plot') {
    const data: MathPlotData = mathData || {
      expression: 'sin(x - t * 2)',
      domainX: [-5, 5],
      domainY: [-2.5, 2.5],
      color: '#BEFF01',
      lineWidth: 3,
      showGrid: true,
      showAxes: true,
      animateSpeed: 1.0,
      title: 'Đồ thị hàm số',
      latexLabel: 'y = f(x)',
      mode: 'function',
    }

    const currentTitle = String(element.title ?? data.title ?? '').trim()
    const mathPresets = STEM_PRESETS.filter(p => p.type === 'math-plot')

    const updateData = (patch: Partial<MathPlotData>) => {
      updateElement(element.id, {
        mathData: { ...data, ...patch },
        accentColor: patch.color || data.color,
      })
    }

    const handleSelectPreset = (presetId: string) => {
      const found = mathPresets.find(p => p.id === presetId)
      if (found && found.mathData) {
        updateElement(element.id, {
          title: found.name,
          content: found.name,
          accentColor: found.accentColor || '#BEFF01',
          mathData: { ...found.mathData },
        })
        showToast?.(`Đã tải mẫu: ${found.name}`)
      }
    }

    const katexMiniHtml = useMemo(() => {
      if (!data.latexLabel || !data.latexLabel.trim()) return null
      try {
        return renderLatexHtml(data.latexLabel, { displayMode: false })
      } catch (e) { return null }
    }, [data.latexLabel])

    return (
      <div className={styles.container}>
        <SectionHeader
          first
          title="Đồ thị & Hình học động (Mafs)"
          action={currentTitle ? (
            <button
              type="button"
              onClick={() => { updateElement(element.id, { content: '', title: '' }); updateData({ title: '' }) }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 10, cursor: 'pointer', padding: 0 }}
            >
              Xoá tiêu đề
            </button>
          ) : undefined}
        />

        {/* 1. MẪU BÀI GIẢNG & ĐỒ THỊ */}
        <FormGroup label="Dạng bài giảng & Đồ thị" tooltip="Chọn nhanh mẫu bài chuẩn, tự động áp dụng dữ liệu và chế độ toán học tương ứng">
          <Select
            size="sm"
            fullWidth
            value={mathPresets.find(p => p.name === currentTitle || p.mathData?.title === data.title)?.id || 'math-trig-unit-circle'}
            options={mathPresets.map(p => ({ value: p.id, label: p.name }))}
            onChange={(val) => handleSelectPreset(val as string)}
          />
        </FormGroup>

        {/* 2. BIỂU THỨC / CÔNG THỨC */}
        {(data.mode === 'function' || data.mode === 'calculus_area' || !data.mode) && (
          <FormGroup
            label="Biểu thức f(x, t)"
            tooltip="Biến x và thời gian t. Viết như máy tính: x^2, 2x, sin(x), sqrt(x), exp(x), log(x), pi"
            error={
              data.expression
                ? validatePlotData(data).errors.find(e => e.startsWith('expression'))?.replace(/^expression: /, '')
                : undefined
            }
          >
            <input
              type="text"
              className={`${styles.input} ${styles.monoInput}`}
              value={data.expression || ''}
              placeholder="VD: 0.25x^3 - x hoặc sin(x - 2t)"
              onChange={e => updateData({ expression: e.target.value })}
            />
          </FormGroup>
        )}

        {/* Tiếp tuyến trượt cho chế độ hàm số */}
        {(data.mode === 'function' || !data.mode) && (
          <ToggleRow label="Hiện tiếp tuyến trượt (Đạo hàm)">
            <Toggle
              checked={Boolean(data.showTangent)}
              onChange={v => updateData({ showTangent: v })}
            />
          </ToggleRow>
        )}

        {/* Cận tích phân Riemann cho chế độ calculus_area */}
        {data.mode === 'calculus_area' && (
          <FormGroup
            label="Cận tích phân [a, b]"
            tooltip="Nhập cận dưới và cận trên của tích phân, cách nhau bằng dấu phẩy (VD: -2, 2)"
          >
            <input
              type="text"
              className={`${styles.input} ${styles.monoInput}`}
              value={data.integralBounds ? `${data.integralBounds[0]}, ${data.integralBounds[1]}` : '-2, 2'}
              placeholder="-2, 2"
              onChange={e => {
                const parts = e.target.value.split(',').map(s => Number(s.trim()))
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  updateData({ integralBounds: [parts[0], parts[1]] })
                }
              }}
            />
          </FormGroup>
        )}

        {/* 3. CÔNG THỨC LATEX (COMPACT BADGE) */}
        <FormGroup
          label="Công thức toán học"
          tooltip="Công thức LaTeX hiển thị nhãn trên đồ thị video"
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: 'var(--surface-1)', 
              border: '1px solid var(--border)', 
              borderRadius: '6px', 
              padding: '6px 8px', 
              cursor: 'pointer' 
            }}
            onClick={() => setIsMathModalOpen(true)}
          >
            <div style={{ flex: 1, overflow: 'hidden', color: 'var(--text)', fontSize: '13px' }}>
              {katexMiniHtml ? (
                <span dangerouslySetInnerHTML={{ __html: katexMiniHtml }} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontStyle: 'italic' }}>Nhấp để soạn thảo...</span>
              )}
            </div>
            <Button
              size="xs"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                setIsMathModalOpen(true)
              }}
              leftIcon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
            >
              Sửa
            </Button>
          </div>
        </FormGroup>

        {/* Tiêu đề */}
        <FormGroup label="Tiêu đề bài giảng" tooltip="Tiêu đề hiển thị trên thanh header của đồ thị">
          <input
            type="text"
            className={styles.input}
            value={data.title || currentTitle || ''}
            placeholder="VD: Ý nghĩa hình học của Đạo hàm"
            onChange={e => {
              updateData({ title: e.target.value })
              updateElement(element.id, { title: e.target.value, content: e.target.value })
            }}
          />
        </FormGroup>

        {/* 4. ĐỒ HỌA & NÉT VẼ */}
        <SectionHeader title="Đồ hoạ & Nét vẽ" />

        <ColorControlRow
          label="Màu chủ đạo"
          value={data.color || '#BEFF01'}
          onChange={c => updateData({ color: c })}
          style={{ marginBottom: 8 }}
        />

        <div style={{ marginBottom: 8 }}>
          <Slider
            label="Độ dày nét vẽ"
            min={1}
            max={6}
            step={0.5}
            value={data.lineWidth || 3}
            display={v => `${v}px`}
            onChange={v => updateData({ lineWidth: v })}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <Slider
            label="Tốc độ chuyển động"
            min={0}
            max={3}
            step={0.1}
            value={data.animateSpeed ?? 1.0}
            display={v => `${v}x`}
            onChange={v => updateData({ animateSpeed: v })}
          />
        </div>

        {/* 5. HỆ TOẠ ĐỘ & KHUNG NỀN */}
        <SectionHeader title="Hệ toạ độ & Khung nền" />

        <ToggleRow label="Hiện trục toạ độ Oxy">
          <Toggle
            checked={data.showAxes !== false}
            onChange={v => updateData({ showAxes: v })}
          />
        </ToggleRow>

        <ToggleRow label="Hiện lưới toạ độ (Grid)">
          <Toggle
            checked={data.showGrid !== false}
            onChange={v => updateData({ showGrid: v })}
          />
        </ToggleRow>

        {/* Khung nền thẻ (Chuẩn hoá Studio NLE) */}
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <CardBackgroundControl
            element={element}
            updateElement={updateElement}
            showWidth={true}
            showRadius={true}
            showBgColor={true}
            showStrokeColor={true}
            defaultBgColor="rgba(13, 17, 23, 0.88)"
          />
        </div>

        <MathFormulaModal
          isOpen={isMathModalOpen}
          onClose={() => setIsMathModalOpen(false)}
          initialLatex={data.latexLabel || ''}
          sourceExpression={data.expression}
          title={data.title || currentTitle}
          onApply={(newLatex) => {
            updateData({ latexLabel: newLatex })
            setIsMathModalOpen(false)
          }}
        />

      </div>
    )
  }

  // ── 2. CHEMICAL MOLECULE INSPECTOR (RDKIT) ──────────────────────────
  if (type === 'chemical-molecule') {
    const data = chemData || {
      smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      name: 'Caffeine',
      lookupName: 'Caffeine',
      pubchemCid: 2519,
      formula: 'C8H10N4O2',
      theme: 'neon',
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { chemData: { ...data, ...patch } })
    }

    // Tra PubChem: SMILES + công thức chuẩn của cùng một hợp chất (CID)
    const lookupName = data.lookupName ?? ''
    const handleLookup = async () => {
      if (!lookupName.trim()) return
      setChemLookup({ loading: true })
      try {
        const compound = await resolveChemByName(lookupName)
        if (!compound) {
          setChemLookup({ loading: false, error: `Không tìm thấy “${lookupName}” trên PubChem. Hãy nhập tên tiếng Anh.` })
          return
        }
        updateData({ smiles: compound.smiles, formula: compound.formula, pubchemCid: compound.cid })
        setChemLookup({ loading: false })
        showToast?.(`Đã lấy cấu trúc ${compound.title || lookupName} từ PubChem`)
      } catch (err: any) {
        setChemLookup({ loading: false, error: err?.message || 'Không tra được PubChem' })
      }
    }

    const themeOptions = [
      { value: 'neon', label: 'Neon Cyberpunk' },
      { value: 'dark', label: 'Tối Giản' },
      { value: 'light', label: 'Phòng Thí Nghiệm' },
      { value: 'matrix', label: 'Ma Trận' },
    ]

    const animModeOptions = [
      { value: 'all', label: 'Trôi lơ lửng & Xoay' },
      { value: 'float', label: 'Chỉ trôi lơ lửng' },
      { value: 'rotate', label: 'Chỉ xoay tròn' },
      { value: 'none', label: 'Đứng im' },
    ]

    return (
      <div className={styles.container}>
        <SectionHeader
          first
          title="Phân tử hoá học"
        />

        {/* Tra PubChem theo tên tiếng Anh */}
        <FormGroup
          label="Tra PubChem"
          tooltip="Nhập tên tiếng Anh hoặc IUPAC (VD: Caffeine, Glucose) để lấy cấu trúc và công thức chuẩn"
          error={chemLookup.error}
          description={data.pubchemCid ? `Đã xác minh · PubChem CID ${data.pubchemCid}` : undefined}
        >
          <div className={styles.lookupRow}>
            <input
              type="text"
              className={styles.input}
              value={lookupName}
              placeholder="VD: Caffeine"
              onChange={e => {
                setChemLookup({ loading: false })
                updateData({ lookupName: e.target.value })
              }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
            <Button size="sm" variant="secondary" onClick={handleLookup} disabled={chemLookup.loading || !lookupName.trim()}>
              {chemLookup.loading ? 'Đang tra…' : 'Tra cứu'}
            </Button>
          </div>
        </FormGroup>

        {/* Tên chất */}
        <FormGroup label="Tên hiển thị" tooltip="Tên hiện trên video, có thể viết tiếng Việt (VD: Caffeine, Nước)">
          <input
            type="text"
            className={styles.input}
            value={data.name || ''}
            placeholder="VD: Caffein, Paracetamol..."
            onChange={e => updateData({ name: e.target.value })}
          />
        </FormGroup>

        {/* Công thức phân tử */}
        <FormGroup
          label="Công thức"
          tooltip="Công thức hóa học rút gọn hiển thị kèm tên chất (VD: C8H10N4O2)"
        >
          <input
            type="text"
            className={styles.input}
            value={data.formula || ''}
            placeholder="VD: C8H10N4O2"
            onChange={e => updateData({ formula: e.target.value, pubchemCid: undefined })}
          />
        </FormGroup>

        {/* Chuỗi SMILES */}
        <FormGroup
          label="Chuỗi SMILES"
          tooltip="Chuẩn hoá quốc tế SMILES 2D tự động hiển thị liên kết đơn, đôi, vòng thơm"
        >
          <input
            type="text"
            className={`${styles.input} ${styles.monoInput}`}
            value={data.smiles}
            placeholder="VD: CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
            onChange={e => updateData({ smiles: e.target.value, pubchemCid: undefined })}
          />
        </FormGroup>

        {/* Chủ đề màu sắc phân tử */}
        <FormGroup label="Màu sắc phân tử">
          <Select
            options={themeOptions}
            value={data.theme || 'neon'}
            onChange={val => updateData({ theme: val as any })}
            size="sm"
          />
        </FormGroup>

        {/* Chế độ chuyển động Remotion */}
        <FormGroup label="Chuyển động phân tử">
          <Select
            options={animModeOptions}
            value={data.animMode || 'all'}
            onChange={val => updateData({ animMode: val as any })}
            size="sm"
          />
        </FormGroup>

        {/* Tốc độ chuyển động */}
        <Slider
          label="Tốc độ chuyển động"
          min={0.5}
          max={2.5}
          step={0.1}
          value={data.animSpeed ?? 1.0}
          display={v => `${v}x`}
          onChange={v => updateData({ animSpeed: v })}
        />

        {/* Độ dày liên kết */}
        <Slider
          label="Độ dày liên kết"
          min={1}
          max={5}
          step={0.2}
          value={data.bondThickness || 2.2}
          display={v => `${v}px`}
          onChange={v => updateData({ bondThickness: v })}
        />

        {/* Chú thích phụ */}
        <FormGroup
          label="Chú thích phụ"
          tooltip="Dòng mô tả ngắn gọn công dụng hoặc tính chất hóa học dưới chân thẻ"
        >
          <input
            type="text"
            className={styles.input}
            value={data.subtext || ''}
            placeholder="VD: Chất dẫn truyền thần kinh tạo động lực..."
            onChange={e => updateData({ subtext: e.target.value })}
          />
        </FormGroup>

        {/* Quét xung sáng Laser */}
        <ToggleRow label="Xung sáng laser">
          <Toggle
            checked={data.pulseGlow !== false}
            onChange={v => updateData({ pulseGlow: v })}
          />
        </ToggleRow>
      </div>
    )
  }

  // ── 3. LATEX FORMULA INSPECTOR ───────────────────────────────────────
  if (type === 'latex-formula') {
    const data = latexData || {
      latex: 'E = mc^2',
      fontSize: 26,
      color: '#ffffff',
      displayMode: true,
      showBackground: true,
      title: 'Công thức',
      glow: false,
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, {
        latexData: { ...data, ...patch },
        fill: patch.color || data.color,
      })
    }

    const katexMiniHtml = useMemo(() => {
      if (!data.latex || !data.latex.trim()) return null
      try {
        return renderLatexHtml(data.latex, { displayMode: false })
      } catch (e) { return null }
    }, [data.latex])

    return (
      <div className={styles.container}>
        <SectionHeader first title="Công thức khoa học (LaTeX)" />

        {/* Tiêu đề */}
        <FormGroup label="Tiêu đề" tooltip="Tên định luật hoặc tiêu đề công thức (VD: Phương Trình Einstein)">
          <input
            type="text"
            className={styles.input}
            value={data.title || ''}
            placeholder="VD: Phương Trình Einstein"
            onChange={e => updateData({ title: e.target.value })}
          />
        </FormGroup>

        {/* Huy hiệu tag */}
        <FormGroup
          label="Huy hiệu"
          tooltip="Gắn nhãn môn học hoặc chủ đề nhỏ trên đầu công thức (để trống để ẩn)"
        >
          <input
            type="text"
            className={styles.input}
            value={data.badge || ''}
            placeholder="VD: VẬT LÝ, TOÁN 12 (để trống để ẩn)"
            onChange={e => updateData({ badge: e.target.value })}
          />
        </FormGroup>

        {/* Mã LaTeX (Compact Badge + Modal) */}
        <FormGroup
          label="Mã LaTeX"
          tooltip="Hỗ trợ đầy đủ cú pháp KaTeX: \frac, \sqrt, \int, \sum, ma trận..."
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: 'var(--surface-1)', 
              border: '1px solid var(--border)', 
              borderRadius: '6px', 
              padding: '6px 8px', 
              cursor: 'pointer' 
            }}
            onClick={() => setIsMathModalOpen(true)}
          >
            <div style={{ flex: 1, overflow: 'hidden', color: 'var(--text)', fontSize: '13px' }}>
              {katexMiniHtml ? (
                <span dangerouslySetInnerHTML={{ __html: katexMiniHtml }} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontStyle: 'italic' }}>Nhấp để soạn thảo...</span>
              )}
            </div>
            <Button
              size="xs"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                setIsMathModalOpen(true)
              }}
              leftIcon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
            >
              Sửa
            </Button>
          </div>
        </FormGroup>

        {/* Cỡ chữ công thức */}
        <Slider
          label="Cỡ chữ"
          min={16}
          max={64}
          step={1}
          value={data.fontSize || 26}
          display={v => `${v}px`}
          onChange={v => updateData({ fontSize: v })}
        />

        {/* Màu sắc */}
        <div className={styles.colorRow}>
          <span className={styles.colorLabel}>Màu công thức</span>
          <ColorDot
            value={data.color || '#ffffff'}
            onChange={c => updateData({ color: c })}
          />
        </div>

        {/* Tùy chọn nền & hiệu ứng */}
        <ToggleRow label="Khung nền mờ">
          <Toggle
            checked={data.showBackground !== false}
            onChange={v => updateData({ showBackground: v })}
          />
        </ToggleRow>

        <ToggleRow label="Phát sáng neon">
          <Toggle
            checked={Boolean(data.glow)}
            onChange={v => updateData({ glow: v })}
          />
        </ToggleRow>

        {/* Chuyển động */}
        <SectionHeader title="Hiệu ứng chuyển động" />

        <div style={{ margin: '4px 0 10px' }}>
          <SegmentedControl
            size="xs"
            fullWidth
            value={data.animMode || 'write-on'}
            options={[
              { value: 'write-on', label: 'Viết' },
              { value: 'laser-scan', label: 'Laser' },
              { value: 'pulse-glow', label: 'Nhịp thở' },
              { value: 'none', label: 'Tắt' },
            ]}
            onChange={(val) => updateData({ animMode: val as LatexAnimMode })}
          />
        </div>

        {data.animMode !== 'none' && (
          <Slider
            label="Thời lượng"
            min={0.5}
            max={5.0}
            step={0.1}
            value={data.animDuration ?? 2.0}
            display={v => `${v.toFixed(1)}s`}
            onChange={v => updateData({ animDuration: v })}
          />
        )}

        {(!data.animMode || data.animMode === 'write-on') && (
          <ToggleRow label="Âm thanh viết">
            <Toggle
              checked={data.sfxEnabled !== false}
              onChange={v => updateData({ sfxEnabled: v })}
            />
          </ToggleRow>
        )}
        
        <MathFormulaModal
          isOpen={isMathModalOpen}
          onClose={() => setIsMathModalOpen(false)}
          initialLatex={data.latex || ''}
          title={data.title}
          onApply={(newLatex) => {
            updateData({ latex: newLatex })
            setIsMathModalOpen(false)
          }}
        />
      </div>
    )
  }

  return null
}
