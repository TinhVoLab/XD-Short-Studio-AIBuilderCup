import React from 'react';
import tabStyles from '../Tabs.module.css';
import { InspectorProps, ColorDot, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common';
import { FormGroup, SectionHeader, Button } from '@/components/ui';

const ICON_OPTIONS = [
  { value: 'brain', label: 'Brain (AI)' },
  { value: 'chat', label: 'Chat (NLP)' },
  { value: 'eye', label: 'Vision AI' },
  { value: 'database', label: 'Database' },
  { value: 'lock', label: 'Security' },
  { value: 'code', label: 'Code Logic' },
  { value: 'zap', label: 'Pulse / API' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'shield', label: 'Shield' },
  { value: 'star', label: 'Star / Hub' },
  { value: 'target', label: 'Target' },
  { value: 'file', label: 'Data File' },
];

const PRESETS = [
  {
    name: 'AI Ecosystem',
    title: 'Hệ thống AI Ecosystem',
    accent: '#BEFF01',
    nodes: [
      { label: 'AI Core', icon: 'brain', color: '#BEFF01' },
      { label: 'NLP Engine', icon: 'chat', color: '#00D4FF' },
      { label: 'Vision AI', icon: 'eye', color: '#00FF88' },
      { label: 'Vector DB', icon: 'database', color: '#FFB800' },
      { label: 'Security', icon: 'lock', color: '#FF3366' },
      { label: 'Logic Flow', icon: 'code', color: '#BD00FF' },
    ],
  },
  {
    name: 'Cloud Services',
    title: 'Kiến trúc Cloud Microservices',
    accent: '#00D4FF',
    nodes: [
      { label: 'API Gateway', icon: 'cloud', color: '#00D4FF' },
      { label: 'Auth Service', icon: 'shield', color: '#FF3366' },
      { label: 'Worker Queue', icon: 'zap', color: '#00FF88' },
      { label: 'Redis Cache', icon: 'zap', color: '#FFB800' },
      { label: 'Cloud Storage', icon: 'database', color: '#BD00FF' },
    ],
  },
  {
    name: 'Tech Team',
    title: 'Cơ cấu tổ chức công nghệ',
    accent: '#FFD700',
    nodes: [
      { label: 'HQ Hub', icon: 'star', color: '#FFD700' },
      { label: 'Engineering', icon: 'code', color: '#00D4FF' },
      { label: 'AI Research', icon: 'brain', color: '#BEFF01' },
      { label: 'Product Dept', icon: 'target', color: '#00FF88' },
      { label: 'Cyber Sec', icon: 'lock', color: '#FF3366' },
    ],
  },
];

export function NetworkGraphInspector({ element, updateElement, showToast }: InspectorProps) {
  const currentAccent = element.accentColor || element.color || '#00FF88';

  const defaultNodes = [
    { label: 'AI Core', icon: 'brain', color: currentAccent },
    { label: 'NLP Engine', icon: 'chat', color: '#00D4FF' },
    { label: 'Vision AI', icon: 'eye', color: '#00FF88' },
    { label: 'Database', icon: 'database', color: '#FFB800' },
    { label: 'Security', icon: 'lock', color: '#FF3366' },
    { label: 'Logic Flow', icon: 'code', color: '#BD00FF' },
  ];

  const nodes = element.networkNodes && element.networkNodes.length >= 2
    ? element.networkNodes
    : defaultNodes;

  const handleAddNode = () => {
    const currentNodes = [...nodes];
    const newIdx = currentNodes.length;
    currentNodes.push({
      label: `Nút ${newIdx}`,
      icon: 'zap',
      color: '#00D4FF',
    });
    updateElement(element.id, { networkNodes: currentNodes });
    showToast?.('Đã thêm 1 nút vệ tinh vào mạng lưới');
  };

  return (
    <div className={tabStyles.tab}>
      <SectionHeader title="Mạng lưới kết nối" />

      {/* 1. Tiêu đề mạng lưới */}
      <FormGroup
        label="Tiêu đề"
        tooltip="Hiển thị trên thanh header của sơ đồ mạng lưới. Để trống để ẩn header tối ưu diện tích."
        action={
          element.content ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => updateElement(element.id, { content: '' })}
            >
              Xóa cho gọn
            </Button>
          ) : undefined
        }
      >
        <input
          type="text"
          value={element.content || ''}
          placeholder="Ví dụ: HỆ THỐNG AI ECOSYSTEM"
          onChange={e => updateElement(element.id, { content: e.target.value })}
          className={tabStyles.input}
        />
      </FormGroup>

      {/* 2. Mẫu có sẵn (Presets) */}
      <FormGroup label="Mẫu có sẵn" tooltip="Áp dụng cấu trúc hệ sinh thái và mạng lưới mẫu 1-click chuyên nghiệp">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 4 }}>
          {PRESETS.map((p, idx) => (
            <Button
              key={idx}
              variant="secondary"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: p.title,
                  accentColor: p.accent,
                  networkNodes: p.nodes,
                });
                showToast?.(`Đã áp dụng mẫu ${p.name}`);
              }}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </FormGroup>

      {/* 3. Danh sách nút */}
      <FormGroup
        label={`Danh sách nút (${nodes.length})`}
        tooltip="Nút đầu tiên luôn là Hub trung tâm, các nút tiếp theo sẽ tự động phân bố đều trên quỹ đạo xung quanh"
        action={
          <Button
            variant="secondary"
            size="xs"
            onClick={handleAddNode}
          >
            + Thêm nút
          </Button>
        }
      >
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
          {nodes.map((node, nIdx) => (
            <div
              key={nIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: nIdx === 0 ? 'rgba(190, 255, 1, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: nIdx === 0 ? '1px solid rgba(190, 255, 1, 0.25)' : '1px solid var(--border)',
              }}
            >
              <ColorDot
                value={node.color || (nIdx === 0 ? currentAccent : '#00D4FF')}
                sm
                onChange={c => {
                  const currentNodes = [...nodes];
                  currentNodes[nIdx] = { ...currentNodes[nIdx], color: c };
                  updateElement(element.id, { networkNodes: currentNodes });
                }}
              />
              <select
                value={node.icon || (nIdx === 0 ? 'brain' : 'zap')}
                onChange={e => {
                  const currentNodes = [...nodes];
                  currentNodes[nIdx] = { ...currentNodes[nIdx], icon: e.target.value };
                  updateElement(element.id, { networkNodes: currentNodes });
                }}
                style={{
                  width: 82,
                  fontSize: 11,
                  padding: '4px 2px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  outline: 'none',
                }}
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                style={{
                  flex: 1,
                  fontSize: 11.5,
                  padding: '4px 6px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  outline: 'none',
                  minWidth: 0,
                }}
                value={node.label}
                onChange={e => {
                  const currentNodes = [...nodes];
                  currentNodes[nIdx] = { ...currentNodes[nIdx], label: e.target.value };
                  updateElement(element.id, { networkNodes: currentNodes });
                }}
                placeholder={nIdx === 0 ? 'Nút trung tâm (Hub)' : 'Tên nút vệ tinh'}
              />
              {nIdx === 0 ? (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'var(--accent)',
                    padding: '2px 4px',
                    borderRadius: 4,
                    background: 'rgba(190, 255, 1, 0.12)',
                    flexShrink: 0,
                  }}
                >
                  HUB
                </span>
              ) : (
                <DeleteIconButton
                  onClick={() => {
                    const currentNodes = nodes.filter((_, i) => i !== nIdx);
                    updateElement(element.id, { networkNodes: currentNodes });
                  }}
                  title="Xóa nút này"
                />
              )}
            </div>
          ))}
        </div>
      </FormGroup>

      {/* 4. Màu chủ đạo */}
      <ColorControlRow
        label="Màu chủ đạo"
        value={currentAccent}
        onChange={c => updateElement(element.id, { accentColor: c, color: c })}
      />

      {/* 5. Khung nền thẻ & Kích thước */}
      <CardBackgroundControl
        element={element}
        updateElement={updateElement}
        label="Nền Obsidian Glass"
        showWidth={true}
        widthLabel="Kích thước mạng lưới"
        minWidth={200}
        maxWidth={440}
        defaultWidth={280}
      />
    </div>
  );
}
