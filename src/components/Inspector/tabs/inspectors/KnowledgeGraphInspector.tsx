import React, { useState } from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorDot } from './common';
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphLayout } from '@/types/scene';
import { Button, SegmentedControl, SectionHeader, FormGroup, Select, SelectOption } from '@/components/ui';
import { KNOWLEDGE_GRAPH_PRESETS } from '@/data/knowledgeGraphPresets';
import { MindmapStudioModal } from '@/components/MindmapStudioModal/MindmapStudioModal';

export function KnowledgeGraphInspector({ element, updateElement }: InspectorProps) {
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);

  const data: KnowledgeGraphData = element.knowledgeGraphData || {
    title: 'Cây tri thức di truyền học',
    layout: 'cascade',
    theme: 'obsidian-dark',
    nodes: [
      { id: 'root', label: 'Di truyền học', subLabel: 'Gregor Mendel', icon: '🌱', tier: 0, color: '#BEFF01' },
      { id: 'n1', label: '1. Đồng tính', subLabel: 'F1 100% trội', icon: '🧬', tier: 1, color: '#00D4FF', parentId: 'root' },
      { id: 'n2', label: '2. Phân li', subLabel: 'Tỉ lệ 3 trội : 1 lặn', icon: '⚖️', tier: 1, color: '#FFB800', parentId: 'root' },
      { id: 'n3', label: '3. Phân li độc lập', subLabel: 'Tỉ lệ 9:3:3:1', icon: '⚡', tier: 1, color: '#BEFF01', parentId: 'root' },
    ],
    activeNodeId: 'n3',
    showParticles: true,
  };

  const currentAccent = element.accentColor || '#BEFF01';
  const nodes = data.nodes || [];
  const rootNode = nodes.find(n => n.tier === 0) || nodes[0];
  const childBranches = nodes.filter(n => n.id !== rootNode?.id);

  const updateData = (patch: Partial<KnowledgeGraphData>) => {
    updateElement(element.id, {
      knowledgeGraphData: {
        ...data,
        ...patch,
      },
    });
  };

  const handleUpdateNode = (nodeId: string, patch: Partial<KnowledgeGraphNode>) => {
    const nextNodes = nodes.map(n => (n.id === nodeId ? { ...n, ...patch } : n));
    updateData({ nodes: nextNodes });
  };

  const handleAddNode = () => {
    const newId = `n${Date.now().toString().slice(-4)}`;
    const newNode: KnowledgeGraphNode = {
      id: newId,
      label: `Nhánh mới ${nodes.length}`,
      subLabel: 'Mô tả ngắn',
      tier: 1,
      parentId: rootNode?.id || 'root',
      color: '#00D4FF',
      insight: 'Nội dung phân tích của nhánh mới.',
    };
    updateData({ nodes: [...nodes, newNode] });
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodes.length <= 2) return;
    const nextNodes = nodes.filter(n => n.id !== nodeId);
    updateData({
      nodes: nextNodes,
      activeNodeId: data.activeNodeId === nodeId ? undefined : data.activeNodeId,
    });
  };

  const safeZoneOptions: SelectOption[] = [
    { value: 'tiktok', label: 'TikTok (Né sidebar & caption)' },
    { value: 'reels', label: 'Instagram Reels (Né nút tương tác)' },
    { value: 'shorts', label: 'YouTube Shorts (Né thanh công cụ)' },
    { value: 'none', label: 'Toàn màn hình (Không né UI)' },
  ];

  return (
    <>
      {/* ── 0. MINDMAP STUDIO MODAL LAUNCHER ── */}
      <div
        style={{
          margin: '0 0 var(--space-3) 0',
          padding: '10px 12px',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>
            Sơ đồ tư duy
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-sub)' }}>
            {nodes.length} nút phân cấp
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsStudioModalOpen(true)}
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
              <circle cx="12" cy="3" r="1.5" />
              <circle cx="12" cy="21" r="1.5" />
              <circle cx="3" cy="12" r="1.5" />
              <circle cx="21" cy="12" r="1.5" />
            </svg>
          }
        >
          Mở Studio
        </Button>
      </div>

      {/* ── BỐ CỤC ĐỒ THỊ & HIỂN THỊ ── */}
      <div className={styles.group}>
        <SectionHeader title="Bố cục đồ thị" />

        <FormGroup label="Bố cục">
          <SegmentedControl
            options={[
              { value: 'cascade', label: 'Thác đổ' },
              { value: 'spine', label: 'Cột sống' },
              { value: 'orbit', label: 'Elip đứng' },
            ]}
            value={data.layout || 'cascade'}
            onChange={val => updateData({ layout: val as KnowledgeGraphLayout })}
            size="xs"
            fullWidth
          />
        </FormGroup>

        <FormGroup label="Tiêu điểm">
          <select
            className={styles.select}
            value={data.activeNodeId || ''}
            onChange={e => updateData({ activeNodeId: e.target.value || undefined })}
            style={{ width: '100%' }}
          >
            <option value="">Không tiêu điểm (Toàn cảnh)</option>
            {rootNode && <option value={rootNode.id}>Gốc: {rootNode.label}</option>}
            {childBranches.map(n => (
              <option key={n.id} value={n.id}>Nhánh: {n.label}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Hạt năng lượng">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={data.showParticles !== false}
              onChange={e => updateData({ showParticles: e.target.checked })}
            />
            Dòng chảy photon dọc dây dẫn
          </label>
        </FormGroup>
      </div>

      {/* ── 2b. HIỆU ỨNG & CAMERA 9:16 (RETENTION ENGINE) ── */}
      <div className={styles.group}>
        <SectionHeader title="Hiệu ứng & Camera 9:16" />

        <FormGroup label="Camera điện ảnh" tooltip="Tự động lướt và phóng to vào nhánh tiêu điểm">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={data.cameraZoom !== false}
              onChange={e => updateData({ cameraZoom: e.target.checked })}
            />
            Bật zoom camera theo nhánh đang nói
          </label>
        </FormGroup>

        {data.cameraZoom !== false && (
          <>
            <FormGroup label="Mức độ phóng đại">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min={1.1}
                  max={1.7}
                  step={0.05}
                  value={data.cameraZoomLevel || 1.45}
                  onChange={e => updateData({ cameraZoomLevel: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', minWidth: 36 }}>
                  {(data.cameraZoomLevel || 1.45).toFixed(2)}x
                </span>
              </div>
            </FormGroup>

            <FormGroup label="Căn lề an toàn" tooltip="Tự động dịch tâm ngắm để né thanh nút bấm và caption của TikTok/Reels">
              <Select
                size="sm"
                options={safeZoneOptions}
                value={data.safeZonePlatform || 'tiktok'}
                onChange={val => updateData({ safeZonePlatform: val as any })}
              />
            </FormGroup>
          </>
        )}

        <FormGroup label="Thẻ tiêu điểm" tooltip="Bung thẻ to chứa trọn vẹn tiêu đề và lời giải thích ngay tại node">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={data.heroMorph !== false}
              onChange={e => updateData({ heroMorph: e.target.checked })}
            />
            Bung thẻ chi tiết tại chỗ (Hero Morphing)
          </label>
        </FormGroup>

        <FormGroup label="Bản đồ radar" tooltip="Mini-map thu nhỏ góc màn hình với chấm neon định vị vị trí">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={data.showMiniMap !== false}
              onChange={e => updateData({ showMiniMap: e.target.checked })}
            />
            Bật HUD mini-map radar định vị
          </label>
        </FormGroup>

        <FormGroup label="Vòng lặp vô tận" tooltip="Tự động zoom-out về toàn cảnh ở cuối video để lặp lại mượt mà">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={data.loopableEnding !== false}
              onChange={e => updateData({ loopableEnding: e.target.checked })}
            />
            Zoom-out về toàn cảnh ở cuối (Loopable ending)
          </label>
        </FormGroup>

        <FormGroup label="Nền công nghệ" tooltip="Lưới chấm bi ma trận di chuyển theo thị sai khi lia camera">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={data.showGridBackground !== false}
              onChange={e => updateData({ showGridBackground: e.target.checked })}
            />
            Lưới tọa độ Parallax Dot-Grid
          </label>
        </FormGroup>

        <FormGroup label="Nhãn tiến trình / Góc">
          <input
            type="text"
            className={styles.input}
            value={data.badgeText || ''}
            onChange={e => updateData({ badgeText: e.target.value })}
            placeholder="Tự động theo nhánh (ví dụ: Nhánh 1/3)"
          />
        </FormGroup>
      </div>

      {/* ── 3. NÚT GỐC (ROOT NODE) ── */}
      {rootNode && (
        <div className={styles.group}>
          <SectionHeader title="Nút gốc cội nguồn" />
          <FormGroup label="Tiêu đề gốc">
            <input
              type="text"
              className={styles.input}
              value={rootNode.label}
              onChange={e => handleUpdateNode(rootNode.id, { label: e.target.value })}
              placeholder="Khái niệm cội nguồn"
            />
          </FormGroup>
          <FormGroup label="Nhãn phụ">
            <input
              type="text"
              className={styles.input}
              value={rootNode.subLabel || ''}
              onChange={e => handleUpdateNode(rootNode.id, { subLabel: e.target.value })}
              placeholder="Tác giả hoặc danh mục"
            />
          </FormGroup>
          <FormGroup label="Màu nút">
            <ColorDot
              value={rootNode.color || currentAccent}
              onChange={c => handleUpdateNode(rootNode.id, { color: c })}
              sm
            />
          </FormGroup>
        </div>
      )}

      {/* ── 4. DANH SÁCH CÁC NHÁNH TRI THỨC (TINH GỌN) ── */}
      <div className={styles.group}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionHeader title={`Các nhánh tri thức (${childBranches.length})`} />
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsStudioModalOpen(true)}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          >
            Sửa trong Studio
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {childBranches.map((b, idx) => {
            const isSpotlight = data.activeNodeId === b.id;

            return (
              <div
                key={b.id}
                onClick={() => updateData({ activeNodeId: isSpotlight ? undefined : b.id })}
                style={{
                  backgroundColor: isSpotlight ? 'rgba(190, 255, 1, 0.08)' : 'var(--surface-2)',
                  border: `1px solid ${isSpotlight ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 6,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 13 }}>{b.icon || '📌'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: b.color || currentAccent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {idx + 1}. {b.label}
                    </span>
                    {b.subLabel && (
                      <span style={{ fontSize: 9.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.subLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: isSpotlight ? 'var(--accent)' : 'transparent',
                      color: isSpotlight ? '#000' : 'var(--text-sub)',
                      fontWeight: 700,
                      border: isSpotlight ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {isSpotlight ? 'Tiêu điểm' : 'Bật'}
                  </span>
                  {childBranches.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteNode(b.id);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. THƯ VIỆN MẪU CÓ SẴN (PRESETS) ── */}
      <div className={styles.group}>
        <SectionHeader title="Mẫu cây tri thức có sẵn" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {KNOWLEDGE_GRAPH_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                updateElement(element.id, {
                  accentColor: p.accentColor,
                  knowledgeGraphData: p.data,
                });
              }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 6,
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-sub)' }}>
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 6. MINDMAP STUDIO MODAL ── */}
      <MindmapStudioModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        element={element}
        updateElement={updateElement}
      />
    </>
  );
}
