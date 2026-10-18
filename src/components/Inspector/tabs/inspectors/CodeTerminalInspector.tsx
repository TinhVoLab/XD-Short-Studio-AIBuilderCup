import React from 'react';
import tabStyles from '../Tabs.module.css';
import { InspectorProps, Slider, ColorControlRow, CardBackgroundControl } from './common';
import { FormGroup, SectionHeader, Select, Button } from '@/components/ui';

const LANGUAGE_OPTIONS = [
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Go', label: 'Go (Golang)' },
  { value: 'SQL', label: 'SQL Query' },
  { value: 'HTML/CSS', label: 'HTML / CSS' },
  { value: 'Bash', label: 'Bash / Shell' },
  { value: 'JSON', label: 'JSON Data' },
];

const CODE_PRESETS = [
  {
    name: 'TypeScript AI',
    filename: 'aiWorkflow.ts',
    language: 'TypeScript',
    code: `async function generateVideo() {\n  const script = await ai.writeScript();\n  const video = await renderComposition(script);\n  return { success: true, url: video.url };\n}`,
    accent: '#00D4FF',
  },
  {
    name: 'Python ML',
    filename: 'model.py',
    language: 'Python',
    code: `import torch\nimport neural_net\n\nmodel = neural_net.Transformer(layers=12)\npredictions = model.predict(input_data)\nprint(f"Accuracy: {predictions.score:.2%}")`,
    accent: '#FFD700',
  },
  {
    name: 'Rust Engine',
    filename: 'engine.rs',
    language: 'Rust',
    code: `pub fn optimize_pipeline(data: &mut [u8]) -> Result<(), Error> {\n    let stream = rayon::par_iter(data);\n    stream.process_simd();\n    Ok(())\n}`,
    accent: '#BEFF01',
  },
  {
    name: 'SQL Analytics',
    filename: 'metrics.sql',
    language: 'SQL',
    code: `SELECT user_id, COUNT(*) AS total_videos,\n       AVG(watch_time) AS retention_rate\nFROM analytics_events\nWHERE event_date >= CURRENT_DATE - 7\nGROUP BY user_id ORDER BY retention_rate DESC;`,
    accent: '#FF2E93',
  },
];

export function CodeTerminalInspector({ element, updateElement, showToast }: InspectorProps) {
  const codeData = element.codeData || {
    filename: 'main.ts',
    language: 'TypeScript',
    code: element.content || `function executeWorkflow() {\n  const status = 'OPTIMIZED';\n  return { success: true, status };\n}\n\nconsole.log(executeWorkflow());`,
  };

  const currentCode = codeData.code || '';
  const currentFilename = codeData.filename || 'script.ts';
  const currentLanguage = codeData.language || 'TypeScript';
  const currentAccent = element.accentColor || element.color || '#00D4FF';

  const handleCodeChange = (newCode: string) => {
    updateElement(element.id, {
      content: newCode,
      codeData: {
        ...codeData,
        code: newCode,
      },
    });
  };

  const handleFilenameChange = (newFilename: string) => {
    updateElement(element.id, {
      codeData: {
        ...codeData,
        filename: newFilename,
      },
    });
  };

  const handleLanguageChange = (newLang: string) => {
    updateElement(element.id, {
      codeData: {
        ...codeData,
        language: newLang,
      },
    });
  };

  const applyPreset = (preset: typeof CODE_PRESETS[0]) => {
    updateElement(element.id, {
      accentColor: preset.accent,
      content: preset.code,
      codeData: {
        filename: preset.filename,
        language: preset.language,
        code: preset.code,
      },
    });
    if (showToast) showToast(`Đã áp dụng mẫu: ${preset.name}`);
  };

  return (
    <div className={tabStyles.container}>
      {/* ── 1. MẪU CODE NHANH (1-CLICK TEMPLATES) ── */}
      <SectionHeader title="Mẫu code lập trình" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        {CODE_PRESETS.map((p) => (
          <Button
            key={p.name}
            variant="secondary"
            size="xs"
            onClick={() => applyPreset(p)}
            style={{ justifyContent: 'flex-start', fontSize: '11px' }}
          >
            {p.name}
          </Button>
        ))}
      </div>

      {/* ── 2. NỘI DUNG MÃ NGUỒN ── */}
      <SectionHeader title="Nội dung mã nguồn" />
      <FormGroup label="Đoạn mã code" tooltip="Nhập đoạn code lập trình. Khung cửa sổ sẽ tự động co giãn giải tích theo số dòng.">
        <textarea
          value={currentCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          rows={7}
          placeholder="function main() { ... }"
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '11.5px',
            fontFamily: 'Fira Code, SF Mono, Menlo, monospace',
            lineHeight: 1.5,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </FormGroup>

      {/* ── 3. THIẾT LẬP CỬA SỔ & TỆP TIN ── */}
      <SectionHeader title="Thiết lập tệp tin" />
      <FormGroup label="Tên tệp tin" tooltip="Hiển thị trên thanh tiêu đề của cửa sổ macOS Terminal">
        <input
          type="text"
          value={currentFilename}
          onChange={(e) => handleFilenameChange(e.target.value)}
          placeholder="main.ts"
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />
      </FormGroup>

      <FormGroup label="Ngôn ngữ" tooltip="Badge hiển thị định dạng ngôn ngữ góc phải titlebar">
        <Select
          size="sm"
          value={currentLanguage}
          options={LANGUAGE_OPTIONS}
          onChange={(val) => handleLanguageChange(val)}
        />
      </FormGroup>

      {/* ── 4. MÀU SẮC & GIAO DIỆN ── */}
      <SectionHeader title="Màu sắc & giao diện" />
      <FormGroup>
        <ColorControlRow
          label="Màu điểm nhấn (Accent)"
          value={currentAccent}
          onChange={(col) => updateElement(element.id, { accentColor: col })}
        />

        <ColorControlRow
          label="Màu chữ code"
          value={element.color || '#E6EDF3'}
          onChange={(col) => updateElement(element.id, { color: col })}
        />

        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Nền cửa sổ macOS"
        />
      </FormGroup>

      {/* ── 5. KÍCH THƯỚC BỐ CỤC ── */}
      <SectionHeader title="Kích thước & căn chỉnh" />
      <FormGroup>
        <Slider
          label="Chiều rộng"
          value={element.width || 320}
          min={240}
          max={360}
          step={5}
          display={(v) => `${v}px`}
          onChange={(val) => updateElement(element.id, { width: val })}
        />
      </FormGroup>
    </div>
  );
}
