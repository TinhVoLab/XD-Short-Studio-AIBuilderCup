import React, { useMemo, useState } from 'react';
import styles from '../Tabs.module.css';
import {
  InspectorProps,
  Slider,
  Toggle,
  ToggleRow,
  ColorControlRow,
  CardBackgroundControl,
} from './common';
import { Select, SectionHeader, Button } from '@/components/ui';
import { ParadoxRegistry } from '@/remotion/elements/stem/paradox/ParadoxRegistry';
import { VisualParadoxData, ParadoxTimingMode, ParadoxCameraMode } from '@/remotion/elements/stem/paradox/types';
import { generateSceneVoiceover } from '@/services/paradoxStoryExpander';
import { useEditorStore } from '@/store/useEditorStore';
import { resolveFromLayers, CORE_ARCHETYPES_CATALOG } from '@/remotion/elements/stem/paradox/math/templateEngine';
import { MathLayer } from '@/remotion/elements/stem/paradox/math/mathAstTypes';

export function VisualParadoxInspector({ element, updateElement, showToast }: InspectorProps) {
  const paradoxData: VisualParadoxData = element.paradoxData || { paradoxId: 'aristotle-wheel' };
  const currentTitle = String(element.title ?? element.content ?? '').trim();
  const plugin = useMemo(() => ParadoxRegistry.get(paradoxData.paradoxId || 'aristotle-wheel'), [paradoxData.paradoxId]);

  const params = useMemo(() => ({ ...plugin.defaultParams, ...(paradoxData.params || {}) }), [plugin, paradoxData.params]);
  const timingMode: ParadoxTimingMode = paradoxData.timingMode || 'auto-fit';
  const cameraMode: ParadoxCameraMode = paradoxData.cameraMode || 'auto-director';
  const accent = element.accentColor || paradoxData.accentColor || '#BEFF01';
  const secondary = element.secondaryColor || paradoxData.secondaryColor || '#00D4FF';

  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const currentScene = useEditorStore(s => s.scenes[s.currentSceneIdx]);

  const updateParadox = (patch: Partial<VisualParadoxData>) => {
    updateElement(element.id, { paradoxData: { ...paradoxData, ...patch } });
  };

  // Math layers cho Dynamic Sandbox
  const activeLayers: MathLayer[] = useMemo(() => {
    if (paradoxData.mathSpec?.layers?.length) return paradoxData.mathSpec.layers;
    if (paradoxData.mathSpec?.nodes) {
      const list: MathLayer[] = [];
      for (const n of paradoxData.mathSpec.nodes) {
        if (n.type === 'plot') list.push({ type: 'function_plot', params: { expr: n.expr, color: n.color || '#00D4FF', id: n.id || 'plot_1' } });
        else if (n.type === 'label' && n.formula) list.push({ type: 'formula_morph', params: { expr: n.formula, title: n.text, id: n.id || 'label_1' } });
        else if (n.type === 'tangent') list.push({ type: 'function_plot', params: { expr: n.expr, method: 'tangent', id: n.id || 'tangent_1' } });
        else if (n.type === 'riemann') list.push({ type: 'function_plot', params: { expr: n.expr, method: 'riemann', id: n.id || 'riemann_1' } });
      }
      if (list.length) return list;
    }
    return [{ type: 'function_plot', params: { expr: 'sin(x)', color: '#00D4FF', id: 'layer_1' } }];
  }, [paradoxData.mathSpec]);

  const handleUpdateExpr = (expr: string) => {
    const next = [...activeLayers];
    next[0] = { ...next[0], params: { ...next[0].params, expr } };
    const spec = resolveFromLayers(next, paradoxData.mathSpec?.animations || []);
    updateElement(element.id, { paradoxData: { ...paradoxData, mathSpec: spec, params: { ...paradoxData.params, mathSpec: spec } } });
  };

  const handleSelectArchetype = (archId: string) => {
    const item = CORE_ARCHETYPES_CATALOG.find(a => a.id === archId);
    if (!item) return;
    const layers: MathLayer[] = [{ type: item.archetype, params: { ...item.defaultParams } }];
    if ((item as any).extraLayer) layers.push((item as any).extraLayer);
    const spec = resolveFromLayers(layers);
    updateElement(element.id, {
      title: item.title, content: item.title,
      paradoxData: {
        ...paradoxData, paradoxId: 'dynamic-sandbox', mathSpec: spec,
        params: { ...paradoxData.params, simulationType: archId, title: item.title, formula: item.formula, mathSpec: spec },
      },
    });
    showToast?.(`Đã áp dụng: ${item.name}`);
  };

  const handleGenerateVoiceover = async () => {
    setIsGeneratingVoice(true);
    try {
      const topic = paradoxData.params?.topic || paradoxData.params?.title || currentTitle || undefined;
      const duration = currentScene?.duration ?? 7;
      const voiceover = await generateSceneVoiceover(paradoxData.paradoxId || 'aristotle-wheel', topic, duration);
      useEditorStore.getState().updateScene(currentScene?.id, { voiceoverText: voiceover });
      showToast?.('Đã viết lời thoại cho cảnh này!');
    } catch {
      showToast?.('Không thể viết lời thoại. Kiểm tra API Key trong Cài đặt.');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const updateParam = (key: string, value: any) => updateParadox({ params: { ...params, [key]: value } });

  const isDynamicSandbox = paradoxData.paradoxId === 'dynamic-sandbox' || Boolean(paradoxData.mathSpec);

  return (
    <>
      {/* ── 1. CHỌN LOẠI MÔ PHỎNG ── */}
      <div className={styles.group}>
        <SectionHeader
          title="Loại mô phỏng"
          action={currentTitle ? (
            <button
              type="button"
              onClick={() => updateElement(element.id, { content: '', title: '' })}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 10, cursor: 'pointer', padding: 0 }}
            >
              Xoá tiêu đề
            </button>
          ) : undefined}
        />

        {/* Chọn plugin / nghịch lý */}
        <div style={{ marginBottom: 8, marginTop: 4 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>
            Mô phỏng khoa học
          </span>
          <Select
            size="sm" fullWidth
            value={paradoxData.paradoxId || 'aristotle-wheel'}
            options={ParadoxRegistry.getAll().map(p => ({ value: p.id, label: p.name }))}
            onChange={(val) => updateParadox({ paradoxId: val as string })}
          />
        </div>

        {/* Dynamic Sandbox: Chọn Archetype */}
        {isDynamicSandbox && (
          <>
            <div style={{ marginBottom: 8 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>
                Khuôn mẫu trực quan
              </span>
              <Select
                size="sm" fullWidth
                value={paradoxData.params?.simulationType || 'arch_function_plot'}
                options={CORE_ARCHETYPES_CATALOG.map(a => ({ value: a.id, label: a.name }))}
                onChange={(val) => handleSelectArchetype(val as string)}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>
                Biểu thức toán học
              </span>
              <input
                className={styles.input}
                style={{ fontSize: 12, padding: '4px 8px', fontFamily: 'monospace' }}
                value={activeLayers[0]?.params?.expr || activeLayers[0]?.params?.formula || ''}
                onChange={(e) => handleUpdateExpr(e.target.value)}
                placeholder="VD: sin(x), 0.4 * x^2 - 1, exp(-x)..."
              />
            </div>
          </>
        )}

        {/* Tua xem trước */}
        <Slider
          label="Tua xem trước (τ)"
          min={0} max={100} step={1}
          value={Math.round(((paradoxData as any).previewTau ?? 0.5) * 100)}
          display={(v) => `τ = ${(v / 100).toFixed(2)}`}
          onChange={(v) => updateParadox({ previewTau: v / 100 } as any)}
        />

        {/* Tiêu đề */}
        <div style={{ marginBottom: 6, marginTop: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề</span>
          <input
            className={styles.input}
            value={currentTitle}
            onChange={(e) => { updateElement(element.id, { content: e.target.value, title: e.target.value }); }}
            placeholder="Để trống để ẩn tiêu đề..."
          />
        </div>

      </div>

      {/* ── 2. LỜI THOẠI AI ── */}
      <div className={styles.group}>
        <SectionHeader title="Lời thoại" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div>
            <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>
              Nội dung lời thoại cảnh này
            </span>
            <textarea
              className={styles.input}
              rows={3}
              style={{ fontSize: 12, padding: '6px 8px', resize: 'vertical', lineHeight: 1.5 }}
              value={currentScene?.voiceoverText || ''}
              onChange={(e) => {
                if (currentScene) useEditorStore.getState().updateScene(currentScene.id, { voiceoverText: e.target.value });
              }}
              placeholder="Nhập lời thoại hoặc nhấn nút bên dưới để AI viết..."
            />
          </div>
          <Button
            variant="primary" size="sm"
            disabled={isGeneratingVoice}
            onClick={handleGenerateVoiceover}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isGeneratingVoice ? 'Đang viết lời thoại...' : 'Viết lời thoại bằng AI'}
          </Button>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
            AI sẽ viết lời thoại ngắn gọn phù hợp với mô phỏng và thời lượng cảnh hiện tại.
          </p>
        </div>
      </div>

      {/* ── 3. GIAO DIỆN & CAMERA ── */}
      <div className={styles.group}>
        <SectionHeader title="Giao diện & Camera" />

        <CardBackgroundControl
          element={element} updateElement={updateElement}
          label="Khung nền Obsidian"
          showWidth={true}
          showBgColor={true} showRadius={true}
          defaultRadius={16} defaultBgColor="rgba(14, 20, 27, 0.96)"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <ColorControlRow
            label={plugin.id === 'aristotle-wheel' ? 'Màu bánh lớn & Cycloid' : 'Màu chủ đạo'}
            value={accent}
            onChange={(c) => { updateElement(element.id, { accentColor: c }); updateParadox({ accentColor: c }); }}
          />
          <ColorControlRow
            label={plugin.id === 'aristotle-wheel' ? 'Màu bánh nhỏ & Trochoid' : 'Màu phụ trợ'}
            value={secondary}
            onChange={(c) => { updateElement(element.id, { secondaryColor: c }); updateParadox({ secondaryColor: c }); }}
          />
        </div>

        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Góc quay camera</span>
          <Select
            size="sm" fullWidth value={cameraMode}
            options={plugin.id === 'aristotle-wheel' ? [
              { value: 'auto-director', label: 'Tự động theo nhịp kịch bản' },
              { value: 'hub-tracking', label: 'Bám tâm bánh xe' },
              { value: 'slip-focus', label: 'Cận điểm trượt vi phân' },
              { value: 'overview', label: 'Toàn cảnh tĩnh' },
            ] : [
              { value: 'auto-director', label: 'Tự động theo nhịp kịch bản' },
              { value: 'overview', label: 'Toàn cảnh tĩnh' },
            ]}
            onChange={(val) => updateParadox({ cameraMode: val as any })}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Đồng bộ thời lượng</span>
          <Select
            size="sm" fullWidth value={timingMode}
            options={[
              { value: 'auto-fit', label: 'Tự động co giãn vừa khít' },
              { value: 'storyboard-warp', label: 'Nhịp 3 pha (chậm ở cao trào)' },
              { value: 'continuous', label: 'Chạy tuần hoàn liên tục' },
            ]}
            onChange={(val) => updateParadox({ timingMode: val as any })}
          />
        </div>

        <ToggleRow label="Bảng viễn thám HUD">
          <Toggle
            checked={paradoxData.showHUD !== false}
            onChange={(checked: boolean) => updateParadox({ showHUD: checked })}
          />
        </ToggleRow>
      </div>

      {/* ── 4. THAM SỐ PLUGIN ── */}
      {plugin.paramsSchema?.length > 0 && (
        <div className={styles.group}>
          <SectionHeader title={`Tham số: ${plugin.name}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {plugin.paramsSchema.map((field) => {
              if (field.key === 'galileoSides' && !params.showGalileoMode) return null;
              const currentVal = params[field.key] ?? field.default;

              if (field.type === 'number') {
                return (
                  <Slider
                    key={field.key} label={field.label}
                    min={field.min ?? 10} max={field.max ?? 200} step={field.step ?? 1}
                    value={currentVal}
                    display={(val) => `${val}${field.unit || ''}`}
                    onChange={(val) => updateParam(field.key, val)}
                  />
                );
              }
              if (field.type === 'boolean') {
                return (
                  <ToggleRow key={field.key} label={field.label}>
                    <Toggle checked={Boolean(currentVal)} onChange={(checked: boolean) => updateParam(field.key, checked)} />
                  </ToggleRow>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </>
  );
}
