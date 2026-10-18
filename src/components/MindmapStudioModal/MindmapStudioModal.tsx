import React, { useState, useEffect, useMemo, useRef } from 'react';
import styles from './MindmapStudioModal.module.css';
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphLayout } from '@/types/scene';
import { Button, SegmentedControl } from '@/components/ui';
import { renderUniversalIcon } from '@/remotion/utils/icons';
import { useEditorStore } from '@/store/useEditorStore';
import { knowledgeGraphBranchExpander } from '@/services/knowledgeGraphBranchExpander';
import { aiAssistantService } from '@/services/aiAssistantService';
import { KNOWLEDGE_GRAPH_PRESETS } from '@/data/knowledgeGraphPresets';

interface MindmapStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: any;
  updateElement: (id: string, patch: any) => void;
  defaultVoice?: string;
  defaultDuration?: number;
}

interface AiErrorState {
  type: 'auth' | 'quota' | 'network' | 'validation' | 'unknown';
  title: string;
  message: string;
  suggestedPresetId?: string;
}

const QUICK_TOPIC_CHIPS = [
  { label: 'Men-đen di truyền', topic: '3 Quy luật di truyền của Gregor Mendel', icon: '🧬', presetId: 'menden-genetics' },
  { label: 'Điện Biên Phủ', topic: 'Chiến dịch Điện Biên Phủ 1954', icon: '🏛️', presetId: 'dien-bien-phu' },
  { label: 'Thì tiếng Anh', topic: '4 Nhóm thì cốt lõi trong tiếng Anh', icon: '🇬🇧', presetId: 'ielts-tenses' },
  { label: 'Atomic Habits', topic: '4 Quy luật xây dựng thói quen Atomic Habits', icon: '📖', presetId: 'atomic-habits' },
];

const EDU_ICONS = [
  '🌱', '🧬', '⚛️', '🧪', '⚡', '📐', '🔬', '💡',
  '🏛️', '⚔️', '📜', '🎖️', '🌍', '📖', '🎯', '⏰',
  '⚖️', '📌', '🔭', '🧭', '🔥', '💧', '🌿', '🍎',
];

export const MindmapStudioModal: React.FC<MindmapStudioModalProps> = ({
  isOpen,
  onClose,
  element,
  updateElement,
  defaultVoice,
  defaultDuration,
}) => {
  const currentScene = useEditorStore(s => s.scenes[s.currentSceneIdx]);
  const showToast = useEditorStore(s => s.showToast);
  const setSettingsModalOpen = useEditorStore(s => s.setSettingsModalOpen);

  // Dynamic Theme-Aware Palette (starts with user's accent color)
  const dynamicPalette = useMemo(() => {
    const baseColor = element?.accentColor || '#BEFF01';
    const presetHues = ['#00D4FF', '#FFB800', '#00FF88', '#FF4D88', '#B388FF', '#FF7043', '#26C6DA'];
    const filtered = presetHues.filter(c => c.toLowerCase() !== baseColor.toLowerCase());
    return [baseColor, ...filtered];
  }, [element?.accentColor]);

  const initialData: KnowledgeGraphData = useMemo(() => {
    return (
      element?.knowledgeGraphData || {
        title: 'Cây tri thức di truyền học',
        layout: 'cascade',
        theme: 'obsidian-dark',
        nodes: [
          { id: 'root', label: 'Di truyền học', subLabel: 'Gregor Mendel', icon: '🌱', tier: 0, color: element?.accentColor || '#BEFF01' },
          { id: 'n1', label: '1. Đồng tính', subLabel: 'F1 100% trội', icon: '🧬', tier: 1, color: '#00D4FF', parentId: 'root', insight: 'F1 đồng hình tính trạng trội khi bố mẹ thuần chủng tương phản.' },
          { id: 'n2', label: '2. Phân li', subLabel: 'Tỉ lệ 3 trội : 1 lặn', icon: '⚖️', tier: 1, color: '#FFB800', parentId: 'root', insight: 'Đời F2 phân li theo tỉ lệ trung bình 3 trội : 1 lặn.' },
          { id: 'n3', label: '3. Phân li độc lập', subLabel: 'Tỉ lệ 9:3:3:1', icon: '⚡', tier: 1, color: element?.accentColor || '#BEFF01', parentId: 'root', insight: 'Các cặp alen phân li độc lập tạo ra 4 loại giao tử cân bằng.' },
        ],
        activeNodeId: 'n3',
        showParticles: true,
      }
    );
  }, [element?.knowledgeGraphData, element?.accentColor]);

  // ── Draft State (Isolated from Canvas until Save) ──
  const [draftData, setDraftData] = useState<KnowledgeGraphData>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [activeTab, setActiveTab] = useState<'tree' | 'import' | 'ai'>('tree');
  const [importText, setImportText] = useState<string>('');
  const [aiTopic, setAiTopic] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [aiError, setAiError] = useState<AiErrorState | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState<boolean>(false);
  const iconPopoverRef = useRef<HTMLDivElement>(null);

  // ── Drag to Reorder State (Siblings only) ──
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // Close icon popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (iconPopoverRef.current && !iconPopoverRef.current.contains(e.target as Node)) {
        setIsIconPickerOpen(false);
      }
    };
    if (isIconPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isIconPickerOpen]);

  // Sync draft state on open
  useEffect(() => {
    if (isOpen) {
      setDraftData(JSON.parse(JSON.stringify(initialData)));
      const root = (initialData.nodes || []).find(n => n.tier === 0) || initialData.nodes?.[0];
      setSelectedNodeId(initialData.activeNodeId || root?.id || 'root');
    }
  }, [isOpen, initialData]);

  // ESC to close safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAiLoading && !isExpanding) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAiLoading, isExpanding, onClose]);

  const nodes = draftData.nodes || [];
  const rootNode = nodes.find(n => n.tier === 0) || nodes[0];
  const childBranches = nodes.filter(n => n.id !== rootNode?.id);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || rootNode;

  // ── Mathematical SVG Node Coordinates Calculator ──
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number }>();
    if (!rootNode) return map;

    const layout = draftData.layout || 'cascade';
    const W = 480;
    const H = 260;

    if (layout === 'spine') {
      map.set(rootNode.id, { x: W / 2, y: 26, width: 130, height: 26 });
      const t1 = nodes.filter(n => n.tier === 1);
      const t2 = nodes.filter(n => n.tier === 2);

      // Separate Tier 1 branches alternately to Left and Right wings
      const leftT1: typeof t1 = [];
      const rightT1: typeof t1 = [];
      t1.forEach((n, idx) => {
        if (idx % 2 === 0) leftT1.push(n);
        else rightT1.push(n);
      });

      interface SpineSideItem {
        node: KnowledgeGraphNode;
        isParent: boolean;
        parentId?: string;
      }

      // Build family clusters: each parent is followed directly by its children on the same wing
      const leftItems: SpineSideItem[] = [];
      leftT1.forEach(p => {
        leftItems.push({ node: p, isParent: true });
        const children = t2.filter(c => c.parentId === p.id);
        children.forEach(c => {
          leftItems.push({ node: c, isParent: false, parentId: p.id });
        });
      });

      const rightItems: SpineSideItem[] = [];
      rightT1.forEach(p => {
        rightItems.push({ node: p, isParent: true });
        const children = t2.filter(c => c.parentId === p.id);
        children.forEach(c => {
          rightItems.push({ node: c, isParent: false, parentId: p.id });
        });
      });

      // Defensive catch-all for any unassigned Tier 2 nodes
      const assignedIds = new Set([
        ...leftItems.map(it => it.node.id),
        ...rightItems.map(it => it.node.id),
      ]);
      t2.filter(c => !assignedIds.has(c.id)).forEach(c => {
        if (leftItems.length <= rightItems.length) {
          leftItems.push({ node: c, isParent: false, parentId: leftT1[0]?.id });
        } else {
          rightItems.push({ node: c, isParent: false, parentId: rightT1[0]?.id });
        }
      });

      const startY = 65;
      const availableH = H - 85; // 175px of usable vertical space

      // Layout Left wing
      const nLeft = leftItems.length;
      if (nLeft > 0) {
        const gapY = nLeft > 1 ? Math.min(36, availableH / Math.max(1, nLeft - 1)) : 0;
        const totalSpan = (nLeft - 1) * gapY;
        const sideStartY = startY + Math.max(0, (availableH - totalSpan) / 2);
        leftItems.forEach((it, idx) => {
          const curY = nLeft === 1 ? 120 : (sideStartY + idx * gapY);
          const curX = it.isParent ? 115 : 95;
          const w = it.isParent ? 105 : 88;
          const h = it.isParent ? 24 : 22;
          map.set(it.node.id, { x: curX, y: curY, width: w, height: h });
        });
      }

      // Layout Right wing
      const nRight = rightItems.length;
      if (nRight > 0) {
        const gapY = nRight > 1 ? Math.min(36, availableH / Math.max(1, nRight - 1)) : 0;
        const totalSpan = (nRight - 1) * gapY;
        const sideStartY = startY + Math.max(0, (availableH - totalSpan) / 2);
        rightItems.forEach((it, idx) => {
          const curY = nRight === 1 ? 120 : (sideStartY + idx * gapY);
          const curX = it.isParent ? 365 : 385;
          const w = it.isParent ? 105 : 88;
          const h = it.isParent ? 24 : 22;
          map.set(it.node.id, { x: curX, y: curY, width: w, height: h });
        });
      }
    } else if (layout === 'orbit') {
      const cx = W / 2;
      const cy = H / 2;
      map.set(rootNode.id, { x: cx, y: cy, width: 108, height: 26 });
      const t1 = nodes.filter(n => n.tier === 1);
      const t2 = nodes.filter(n => n.tier === 2);
      const N1 = Math.max(1, t1.length);
      
      const Rx1 = 118;
      const Ry1 = 58;
      const t1Angles = new Map<string, number>();

      t1.forEach((n, idx) => {
        const angle = (2 * Math.PI * idx) / N1 - Math.PI / 2;
        t1Angles.set(n.id, angle);
        const curX = cx + Rx1 * Math.cos(angle);
        const curY = cy + Ry1 * Math.sin(angle);
        map.set(n.id, { x: Math.max(48, Math.min(W - 48, curX)), y: Math.max(16, Math.min(H - 16, curY)), width: 88, height: 24 });
      });

      // Group T2 by parent
      const t2ByParent = new Map<string, typeof t2>();
      t2.forEach(n => {
        const pId = n.parentId || (t1[0]?.id) || rootNode.id;
        const list = t2ByParent.get(pId) || [];
        list.push(n);
        t2ByParent.set(pId, list);
      });

      const Rx2 = 190;
      const Ry2 = 100;

      t2ByParent.forEach((children, pId) => {
        const parentAngle = t1Angles.get(pId) ?? 0;
        const count = children.length;
        children.forEach((c, cIdx) => {
          let childAngle = parentAngle;
          if (count === 1) {
            // Intelligent angular separation: if parent is on the sides, tilt along orbit ring to eliminate collision
            const isNearSide = Math.abs(Math.cos(parentAngle)) > 0.45;
            const tilt = isNearSide ? 0.46 : 0.38;
            childAngle = parentAngle + (parentAngle >= 0 ? tilt : -tilt);
          } else {
            const spread = Math.min(Math.PI * 0.55, 0.42 * count);
            const offset = (cIdx - (count - 1) / 2) * (spread / (count - 1));
            childAngle = parentAngle + offset;
          }
          const curX = cx + Rx2 * Math.cos(childAngle);
          const curY = cy + Ry2 * Math.sin(childAngle);
          map.set(c.id, { x: Math.max(45, Math.min(W - 45, curX)), y: Math.max(14, Math.min(H - 14, curY)), width: 84, height: 22 });
        });
      });
    } else {
      // Default: cascade
      map.set(rootNode.id, { x: W / 2, y: 28, width: 140, height: 28 });
      const t1 = nodes.filter(n => n.tier === 1);
      const t2 = nodes.filter(n => n.tier === 2);
      const N1 = t1.length;
      const hasT2 = t2.length > 0;
      const t1Y = hasT2 ? 115 : 140;

      t1.forEach((n, idx) => {
        const curX = N1 === 1 ? W / 2 : 65 + idx * ((W - 130) / Math.max(1, N1 - 1));
        map.set(n.id, { x: curX, y: t1Y, width: 98, height: 24 });
      });

      // Group T2 by parent
      const t2ByParent = new Map<string, typeof t2>();
      t2.forEach(n => {
        const pId = n.parentId || (t1[0]?.id) || rootNode.id;
        const list = t2ByParent.get(pId) || [];
        list.push(n);
        t2ByParent.set(pId, list);
      });

      t2ByParent.forEach((children, pId) => {
        const parentPos = map.get(pId) || { x: W / 2, y: t1Y };
        const count = children.length;
        children.forEach((c, cIdx) => {
          const offset = count === 1 ? 0 : (cIdx - (count - 1) / 2) * 54;
          const curX = Math.max(50, Math.min(W - 50, parentPos.x + offset));
          map.set(c.id, { x: curX, y: 215, width: 92, height: 22 });
        });
      });
    }

    return map;
  }, [rootNode, nodes, draftData.layout]);

  const updateDraft = (patch: Partial<KnowledgeGraphData>) => {
    setDraftData(prev => ({ ...prev, ...patch }));
  };

  const handleUpdateNode = (nodeId: string, patch: Partial<KnowledgeGraphNode>) => {
    const nextNodes = nodes.map(n => (n.id === nodeId ? { ...n, ...patch } : n));
    updateDraft({ nodes: nextNodes });
  };

  // ── Add Sibling Node ──
  const handleAddSibling = (baseNodeId: string) => {
    const baseNode = nodes.find(n => n.id === baseNodeId);
    const newId = `n${Date.now().toString().slice(-4)}`;
    const nextColor = dynamicPalette[nodes.length % dynamicPalette.length];

    const newNode: KnowledgeGraphNode = {
      id: newId,
      label: `Nhánh mới ${childBranches.length + 1}`,
      subLabel: 'Mô tả ngắn',
      tier: baseNode?.tier === 0 ? 1 : (baseNode?.tier || 1),
      parentId: baseNode?.tier === 0 ? baseNode.id : (baseNode?.parentId || rootNode?.id || 'root'),
      color: nextColor,
      icon: EDU_ICONS[nodes.length % EDU_ICONS.length],
      insight: 'Lời giảng tóm tắt bài học...',
    };

    updateDraft({ nodes: [...nodes, newNode] });
    setSelectedNodeId(newId);
  };

  // ── Add Child Node ──
  const handleAddChild = (parentNodeId: string) => {
    const parentNode = nodes.find(n => n.id === parentNodeId) || rootNode;
    const newId = `n${Date.now().toString().slice(-4)}`;
    const nextTier: 1 | 2 = parentNode.tier === 0 ? 1 : 2;
    const nextColor = parentNode.color || dynamicPalette[nodes.length % dynamicPalette.length];

    const newNode: KnowledgeGraphNode = {
      id: newId,
      label: `Chi tiết ${nodes.length + 1}`,
      subLabel: 'Ý bổ trợ',
      tier: nextTier,
      parentId: parentNode.id,
      color: nextColor,
      icon: '📌',
      insight: 'Chi tiết bài học...',
    };

    updateDraft({ nodes: [...nodes, newNode] });
    setSelectedNodeId(newId);
  };

  // ── Delete Node with Orphan Protection ──
  const handleDeleteNode = (nodeId: string) => {
    if (nodes.length <= 2) {
      showToast('Cây sơ đồ cần tối thiểu 1 nút gốc và 1 nhánh con.');
      return;
    }
    if (nodeId === rootNode?.id) {
      showToast('Không thể xóa nút gốc của sơ đồ.');
      return;
    }

    // Adopt orphaned children to root
    const updatedNodes = nodes
      .filter(n => n.id !== nodeId)
      .map(n => {
        if (n.parentId === nodeId) {
          return { ...n, parentId: rootNode?.id || 'root', tier: 1 as const };
        }
        return n;
      });

    updateDraft({
      nodes: updatedNodes,
      activeNodeId: draftData.activeNodeId === nodeId ? undefined : draftData.activeNodeId,
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(rootNode?.id || 'root');
    }
  };

  // ── Reorder Nodes (Siblings Only: Tier 1 with Tier 1, or Tier 2 under same parent) ──
  const handleReorderNodes = (sourceId: string, targetId: string, position: 'before' | 'after') => {
    if (sourceId === targetId) return;
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode || sourceNode.tier === 0 || targetNode.tier === 0) return;
    if (sourceNode.tier !== targetNode.tier) return;
    if (sourceNode.tier === 2 && sourceNode.parentId !== targetNode.parentId) return;

    if (sourceNode.tier === 1) {
      // Tier 1 reorder: move sourceNode and its Tier 2 children as a contiguous block
      const sourceBlock = [sourceNode, ...nodes.filter(n => n.parentId === sourceId)];
      const remainingNodes = nodes.filter(n => n.id !== sourceId && n.parentId !== sourceId);
      const targetIndex = remainingNodes.findIndex(n => n.id === targetId);
      if (targetIndex === -1) return;

      let insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      if (position === 'after') {
        while (insertIndex < remainingNodes.length && remainingNodes[insertIndex].parentId === targetId) {
          insertIndex++;
        }
      }

      const newNodes = [
        ...remainingNodes.slice(0, insertIndex),
        ...sourceBlock,
        ...remainingNodes.slice(insertIndex),
      ];
      updateDraft({ nodes: newNodes });
    } else {
      // Tier 2 reorder: reorder within same parent
      const remainingNodes = nodes.filter(n => n.id !== sourceId);
      const targetIndex = remainingNodes.findIndex(n => n.id === targetId);
      if (targetIndex === -1) return;
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      const newNodes = [
        ...remainingNodes.slice(0, insertIndex),
        sourceNode,
        ...remainingNodes.slice(insertIndex),
      ];
      updateDraft({ nodes: newNodes });
    }
  };

  // ── Smart Text / Markdown Parser Engine ──
  const handleParseTextImport = () => {
    const text = importText.trim();
    if (!text) {
      showToast('Vui lòng nhập hoặc dán nội dung giáo án.');
      return;
    }

    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    const parsedNodes: KnowledgeGraphNode[] = [];

    // Line 0: Root Node
    const rootLine = lines[0].replace(/^#+\s*/, '').replace(/^[-*+]\s*/, '').trim();
    const rootId = 'root';
    let rootLabel = rootLine;
    let rootSubLabel = '';
    if (rootLine.includes('|')) {
      const parts = rootLine.split('|');
      rootLabel = parts[0].trim();
      rootSubLabel = parts[1].trim();
    }

    parsedNodes.push({
      id: rootId,
      label: rootLabel,
      subLabel: rootSubLabel,
      tier: 0,
      icon: '🌱',
      color: '#BEFF01',
    });

    let lastTier1Id = rootId;

    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // Detect indentation (Tier 2 if indented with 2+ spaces or Tab, or prefixed with sub-bullet)
      const isIndented = rawLine.startsWith('  ') || rawLine.startsWith('\t');
      const tier: 1 | 2 = isIndented ? 2 : 1;
      const cleanContent = trimmed.replace(/^[-*+]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();

      // Syntax: [Label] (SubLabel) | [Insight]
      let label = cleanContent;
      let subLabel = '';
      let insight = '';

      if (cleanContent.includes('|')) {
        const parts = cleanContent.split('|');
        label = parts[0].trim();
        insight = parts.slice(1).join('|').trim();
      }

      // Extract (subLabel) if present
      const parenMatch = label.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        label = parenMatch[1].trim();
        subLabel = parenMatch[2].trim();
      }

      const newId = `n${i}_${Date.now().toString().slice(-4)}`;
      const color = dynamicPalette[(i - 1) % dynamicPalette.length];
      const icon = EDU_ICONS[(i - 1) % EDU_ICONS.length];

      if (tier === 1) {
        lastTier1Id = newId;
        parsedNodes.push({
          id: newId,
          label,
          subLabel,
          tier: 1,
          parentId: rootId,
          color,
          icon,
          insight,
        });
      } else {
        parsedNodes.push({
          id: newId,
          label,
          subLabel,
          tier: 2,
          parentId: lastTier1Id,
          color,
          icon: '📌',
          insight,
        });
      }
    }

    updateDraft({
      title: rootLabel,
      nodes: parsedNodes,
      activeNodeId: parsedNodes[1]?.id || parsedNodes[0]?.id,
    });

    setActiveTab('tree');
    showToast(`Đã phân tích thành công ${parsedNodes.length} nhánh tri thức!`);
  };

  // ── Semantic AI Error Translator ──
  const translateAiError = (err: any, currentTopic: string): AiErrorState => {
    const msg = String(err?.message || err || '').toLowerCase();

    // Contextual suggested preset based on user input
    let suggestedPresetId = 'menden-genetics';
    const t = currentTopic.toLowerCase();
    if (t.includes('men') || t.includes('di truyền') || t.includes('sinh')) {
      suggestedPresetId = 'menden-genetics';
    } else if (t.includes('điện biên') || t.includes('lịch sử') || t.includes('chiến dịch') || t.includes('sử')) {
      suggestedPresetId = 'dien-bien-phu';
    } else if (t.includes('tiếng anh') || t.includes('thì') || t.includes('tense') || t.includes('ngữ pháp')) {
      suggestedPresetId = 'ielts-tenses';
    } else if (t.includes('thói quen') || t.includes('habit') || t.includes('sách')) {
      suggestedPresetId = 'atomic-habits';
    }

    if (msg.includes('api key') || msg.includes('401') || msg.includes('unauthenticated') || msg.includes('api_key_invalid')) {
      return {
        type: 'auth',
        title: 'Thiếu hoặc sai API Key',
        message: 'Chưa tìm thấy API Key (Gemini hoặc DeepSeek) hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt.',
        suggestedPresetId,
      };
    }

    if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('429') || msg.includes('resource_exhausted')) {
      return {
        type: 'quota',
        title: 'Hạn mức AI tạm thời bận',
        message: 'Tài khoản AI đang bị giới hạn tần suất yêu cầu (Rate limit). Bạn có thể thử lại sau 30 giây hoặc chuyển sang model khác.',
        suggestedPresetId,
      };
    }

    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connect') || msg.includes('offline')) {
      return {
        type: 'network',
        title: 'Không thể kết nối máy chủ AI',
        message: 'Kết nối mạng hoặc máy chủ AI đang gặp gián đoạn. Vui lòng kiểm tra kết nối mạng và thử lại.',
        suggestedPresetId,
      };
    }

    return {
      type: 'unknown',
      title: 'Không thể tạo sơ đồ tự động',
      message: err?.message || 'Không nhận được cấu trúc sơ đồ từ AI, vui lòng thử lại hoặc nạp sơ đồ mẫu.',
      suggestedPresetId,
    };
  };

  const handleLoadPresetFallback = (presetId?: string) => {
    const preset = KNOWLEDGE_GRAPH_PRESETS.find(p => p.id === presetId) || KNOWLEDGE_GRAPH_PRESETS[0];
    if (preset && preset.data) {
      updateDraft(preset.data);
      setActiveTab('tree');
      setAiError(null);
      showToast(`Đã nạp sơ đồ mẫu: ${preset.name}!`);
    }
  };

  // ── AI Lesson Copilot ──
  const handleGenerateWithAi = async () => {
    const topic = aiTopic.trim();
    if (!topic) {
      setAiError({
        type: 'validation',
        title: 'Chưa nhập chủ đề bài học',
        message: 'Vui lòng nhập chủ đề bài học hoặc chọn một trong các gợi ý bài mẫu phía trên.',
      });
      return;
    }

    setAiError(null);
    setIsAiLoading(true);
    try {
      const result = await aiAssistantService.generateChartDataWithAi({
        elementType: 'knowledge-graph',
        elementId: element.id,
        customPrompt: `Thiết kế sơ đồ tư duy cây tri thức giảng dạy chuẩn sư phạm cho học sinh về chủ đề: "${topic}". Tạo từ 4 đến 5 nhánh trọng tâm với lời giải thích ngắn gọn, dễ nhớ.`,
      });

      if (result && result.patch && result.patch.knowledgeGraphData) {
        updateDraft(result.patch.knowledgeGraphData);
        setActiveTab('tree');
        showToast('AI đã hoàn tất sơ đồ bài học!');
      } else {
        const errState = translateAiError(new Error('Không nhận được cấu trúc sơ đồ từ AI, vui lòng thử lại.'), topic);
        setAiError(errState);
      }
    } catch (err: any) {
      const errState = translateAiError(err, topic);
      setAiError(errState);
      showToast(errState.title);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── 1-Click Multi-Scene Lesson Generator ──
  const handleExpandToScenes = async () => {
    if (!currentScene) return;
    setIsExpanding(true);

    try {
      // First save draft
      updateElement(element.id, { knowledgeGraphData: draftData });

      await knowledgeGraphBranchExpander.expandToScenes(currentScene, { ...element, knowledgeGraphData: draftData }, {
        voiceName: defaultVoice || 'vi-VN-NamMinhNeural',
        durationPerScene: defaultDuration || 8,
        addOutro: true,
      });
      showToast('Đã tách sơ đồ thành chuỗi video bài giảng trên Timeline!');
      onClose();
    } catch (err: any) {
      showToast('Có lỗi xảy ra khi tạo chuỗi phân cảnh.');
    } finally {
      setIsExpanding(false);
    }
  };

  // ── Save & Apply to Canvas ──
  const handleSaveAndApply = () => {
    updateElement(element.id, { knowledgeGraphData: draftData });
    showToast('Đã áp dụng sơ đồ tư duy vào Video!');
    onClose();
  };

  // ── Micro-learning Guardrail Indicator ──
  const branchCount = childBranches.length;
  let guardrailClass = styles.guardrailGreen;
  let guardrailText = `${branchCount} nhánh — Độ dài vàng cho video ngắn`;
  if (branchCount >= 6 && branchCount <= 7) {
    guardrailClass = styles.guardrailYellow;
    guardrailText = `${branchCount} nhánh — Độ dài vừa phải (Nên dùng layout cột sống)`;
  } else if (branchCount >= 8) {
    guardrailClass = styles.guardrailOrange;
    guardrailText = `${branchCount} nhánh — Sơ đồ dày đặc (Nên bấm 'Tách thành chuỗi video')`;
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
                <circle cx="12" cy="3" r="1.5" />
                <circle cx="12" cy="21" r="1.5" />
                <circle cx="3" cy="12" r="1.5" />
                <circle cx="21" cy="12" r="1.5" />
              </svg>
            </div>
            <span className={styles.headerText}>Mindmap Studio — Không gian sơ đồ tri thức sư phạm</span>
            <span className={styles.headerBadge}>{nodes.length} nút</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`${styles.guardrailBadge} ${guardrailClass}`}>
              <span className={styles.guardrailDot} />
              {guardrailText}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className={styles.body}>
          {/* Left Panel: Smart Outliner */}
          <div className={styles.leftPanel}>
            <div className={styles.tabBar}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'tree' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('tree')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                Dàn ý phân cấp
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'import' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('import')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                Dán giáo án
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('ai')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Trợ lý AI
              </button>
            </div>

            {/* TAB 1: Visual Tree */}
            {activeTab === 'tree' && (
              <div className={styles.panelScroll}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Cấu trúc cây bài giảng</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleAddSibling(selectedNodeId)}
                    leftIcon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
                  >
                    Thêm nhánh
                  </Button>
                </div>

                {nodes.map(n => {
                  const isSelected = n.id === selectedNodeId;
                  const isSpotlight = n.id === draftData.activeNodeId;
                  const isDragging = n.id === draggedNodeId;
                  const isDropBefore = dropTarget?.id === n.id && dropTarget.position === 'before';
                  const isDropAfter = dropTarget?.id === n.id && dropTarget.position === 'after';

                  let tierClass = styles.treeItemTier0;
                  if (n.tier === 1) tierClass = styles.treeItemTier1;
                  if (n.tier === 2) tierClass = styles.treeItemTier2;

                  return (
                    <div
                      key={n.id}
                      draggable={n.tier !== 0}
                      onDragStart={e => {
                        if (n.tier === 0) return;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', n.id);
                        setDraggedNodeId(n.id);
                      }}
                      onDragOver={e => {
                        if (!draggedNodeId || draggedNodeId === n.id || n.tier === 0) return;
                        const src = nodes.find(x => x.id === draggedNodeId);
                        if (!src || src.tier !== n.tier) return;
                        if (src.tier === 2 && src.parentId !== n.parentId) return;

                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        const rect = e.currentTarget.getBoundingClientRect();
                        const isBefore = e.clientY - rect.top < rect.height / 2;
                        setDropTarget({ id: n.id, position: isBefore ? 'before' : 'after' });
                      }}
                      onDragLeave={() => {
                        setDropTarget(prev => (prev?.id === n.id ? null : prev));
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        if (draggedNodeId && dropTarget && dropTarget.id === n.id) {
                          handleReorderNodes(draggedNodeId, dropTarget.id, dropTarget.position);
                        }
                        setDraggedNodeId(null);
                        setDropTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNodeId(null);
                        setDropTarget(null);
                      }}
                      className={`${styles.treeItem} ${tierClass} ${isSelected ? styles.treeItemSelected : ''} ${isDragging ? styles.treeItemDragging : ''} ${isDropBefore ? styles.treeItemDropBefore : ''} ${isDropAfter ? styles.treeItemDropAfter : ''}`}
                      onClick={() => setSelectedNodeId(n.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {/* Drag Handle (Siblings only, hidden for Root) */}
                        {n.tier !== 0 && (
                          <div
                            className={styles.dragHandle}
                            title="Kéo thả để đổi thứ tự nhánh"
                            onClick={e => e.stopPropagation()}
                          >
                            <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                              <circle cx="2.5" cy="2.5" r="1.2" />
                              <circle cx="5.5" cy="2.5" r="1.2" />
                              <circle cx="2.5" cy="6" r="1.2" />
                              <circle cx="5.5" cy="6" r="1.2" />
                              <circle cx="2.5" cy="9.5" r="1.2" />
                              <circle cx="5.5" cy="9.5" r="1.2" />
                            </svg>
                          </div>
                        )}
                        <span style={{ fontSize: 14 }}>{n.icon || '📌'}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: n.color || 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.label}
                            </span>
                            <span className={styles.tierBadge}>
                              {n.tier === 0 ? 'Gốc' : n.tier === 1 ? 'Nhánh' : 'Ý con'}
                            </span>
                          </div>
                          {n.subLabel && (
                            <span style={{ fontSize: 9.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.subLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isSpotlight && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#000', backgroundColor: 'var(--accent)', padding: '1px 6px', borderRadius: 4 }}>
                            Tiêu điểm
                          </span>
                        )}
                        {n.tier === 1 && (
                          <button
                            title="Thêm ý con"
                            onClick={e => {
                              e.stopPropagation();
                              handleAddChild(n.id);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: 3 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          </button>
                        )}
                        {n.tier !== 0 && (
                          <button
                            title="Xóa nhánh"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteNode(n.id);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 3 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: Smart Text Importer */}
            {activeTab === 'import' && (
              <div className={styles.panelScroll}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>
                  Dán dàn ý mục lục giáo án (Word / PowerPoint)
                </span>
                <p style={{ margin: '0 0 8px 0', fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Hỗ trợ định dạng: <code>Tên nhánh (Mốc thời gian) | Lời giải thích chi tiết</code>. Dòng đầu tiên là Nút gốc, các dòng gạch đầu dòng là các nhánh.
                </p>

                <textarea
                  className={styles.textImporterArea}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder={`Chiến dịch Điện Biên Phủ 1954 | 56 ngày đêm khoét núi ngủ hầm\n- Đợt 1: Him Lam (13/3 - 17/3) | Tiêu diệt cứ điểm Him Lam và Độc Lập\n- Đợt 2: Đồi A1 (30/3 - 30/4) | Trận đánh giằng co ác liệt nhất\n- Đợt 3: Toàn Thắng (1/5 - 7/5) | Bắt sống tướng De Castries`}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <Button variant="primary" size="sm" onClick={handleParseTextImport}>
                    Phân tích & Dựng Cây Sơ đồ
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: AI Lesson Copilot */}
            {activeTab === 'ai' && (
              <div className={styles.panelScroll}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>
                  Trợ lý giáo án sư phạm AI
                </span>
                <p style={{ margin: '0 0 8px 0', fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Nhập chủ đề bài giảng hoặc chọn bài mẫu gợi ý, AI sẽ tự động phân loại các nhánh tri thức cốt lõi cùng lời giảng dễ nhớ.
                </p>

                {/* Quick Topic Chips */}
                <div className={styles.promptChipGroup}>
                  {QUICK_TOPIC_CHIPS.map(chip => (
                    <button
                      key={chip.presetId}
                      type="button"
                      className={`${styles.promptChip} ${aiTopic === chip.topic ? styles.promptChipActive : ''}`}
                      onClick={() => {
                        setAiTopic(chip.topic);
                        setAiError(null);
                      }}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => {
                    setAiTopic(e.target.value);
                    if (aiError) setAiError(null);
                  }}
                  placeholder="Ví dụ: Ba định luật Newton trong Vật lý"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1px solid ${aiError?.type === 'validation' ? 'rgba(255, 77, 77, 0.6)' : 'var(--border)'}`,
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text)',
                    fontSize: 12,
                    marginBottom: aiError ? 8 : 12,
                  }}
                />

                {/* 3-Tier Inline Error Banner */}
                {aiError && (
                  <div className={styles.errorBanner}>
                    <div className={styles.errorBannerHeader}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{aiError.title}</span>
                    </div>
                    <span className={styles.errorBannerText}>{aiError.message}</span>
                    <div className={styles.errorBannerActions}>
                      {aiError.type === 'auth' && (
                        <button
                          type="button"
                          className={styles.errorActionBtn}
                          onClick={() => {
                            setSettingsModalOpen(true);
                            onClose();
                          }}
                        >
                          Mở cài đặt
                        </button>
                      )}
                      {aiError.type !== 'validation' && (
                        <button
                          type="button"
                          className={styles.errorActionBtn}
                          onClick={handleGenerateWithAi}
                        >
                          Thử lại
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.errorActionBtn}
                        style={{ color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                        onClick={() => handleLoadPresetFallback(aiError.suggestedPresetId)}
                      >
                        Nạp sơ đồ mẫu tương đương
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isAiLoading}
                    onClick={handleGenerateWithAi}
                  >
                    {isAiLoading ? 'AI đang soạn giáo án...' : 'Tạo sơ đồ tự động'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Interactive Visual Board & Node Detail */}
          <div className={styles.rightPanel}>
            {/* Miniature Interactive SVG Preview Board */}
            <div>
              <div className={styles.boardContainer}>
                <div className={styles.boardHeader}>
                  <span className={styles.boardTitle}>Sơ đồ tri thức tương tác trực quan</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {(['cascade', 'spine', 'orbit'] as const).map(lay => {
                      const isAct = (draftData.layout || 'cascade') === lay;
                      const label = lay === 'cascade' ? 'Thác đổ' : lay === 'spine' ? 'Cột sống' : 'Quỹ đạo';
                      return (
                        <button
                          key={lay}
                          type="button"
                          onClick={() => updateDraft({ layout: lay })}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: isAct ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: isAct ? 'var(--accent-dim)' : 'var(--surface-2)',
                            color: isAct ? 'var(--accent)' : 'var(--text-sub)',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <svg className={styles.svgBoard} viewBox="0 0 480 260">
                  <defs>
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Orbit Track Rings (Celestial Trajectories) */}
                  {draftData.layout === 'orbit' && (
                    <g>
                      {/* Sun Ambient Center Glow */}
                      <circle
                        cx={240}
                        cy={130}
                        r={36}
                        fill={rootNode?.color || 'var(--accent)'}
                        className={styles.orbitCenterGlow}
                      />
                      {/* Inner Orbit Track */}
                      <ellipse
                        cx={240}
                        cy={130}
                        rx={118}
                        ry={58}
                        className={styles.orbitTrack}
                      />
                      {/* Outer Orbit Track */}
                      <ellipse
                        cx={240}
                        cy={130}
                        rx={190}
                        ry={100}
                        className={styles.orbitTrack}
                        style={{ opacity: 0.08 }}
                      />
                    </g>
                  )}

                  {/* Spine trunk line */}
                  {(draftData.layout === 'spine') && (
                    <line
                      x1={240}
                      y1={26}
                      x2={240}
                      y2={235}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Connecting Lines */}
                  {nodes.map(n => {
                    if (n.tier === 0) return null;
                    const pos = nodePositions.get(n.id);
                    const pPos = (n.parentId ? nodePositions.get(n.parentId) : null) || nodePositions.get(rootNode?.id || '');
                    if (!pos || !pPos) return null;

                    const isSelectedPath = selectedNodeId === n.id || selectedNodeId === n.parentId;
                    const strokeColor = isSelectedPath ? (n.color || 'var(--accent)') : 'rgba(255, 255, 255, 0.22)';
                    const strokeWidth = isSelectedPath ? 2.5 : 1.2;

                    let pathD = '';
                    if (draftData.layout === 'spine') {
                      if (n.tier === 2 && pPos) {
                        const midY = (pPos.y + pos.y) / 2;
                        pathD = `M ${pPos.x} ${pPos.y} C ${pPos.x} ${midY}, ${pos.x} ${midY}, ${pos.x} ${pos.y}`;
                      } else {
                        const spineStartY = 39;
                        const isLeft = pos.x < 240;
                        const cornerR = 6;
                        if (pos.y > spineStartY + cornerR * 2) {
                          pathD = `M 240 ${spineStartY} L 240 ${pos.y - cornerR} Q 240 ${pos.y} ${240 + (isLeft ? -cornerR : cornerR)} ${pos.y} L ${pos.x} ${pos.y}`;
                        } else {
                          pathD = `M 240 ${pos.y} L ${pos.x} ${pos.y}`;
                        }
                      }
                    } else if (draftData.layout === 'orbit') {
                      pathD = `M ${pPos.x} ${pPos.y} L ${pos.x} ${pos.y}`;
                    } else {
                      // Cascade: smooth cubic bezier
                      const startY = pPos.y + pPos.height / 2;
                      const endY = pos.y - pos.height / 2;
                      const midY = (startY + endY) / 2;
                      pathD = `M ${pPos.x} ${startY} C ${pPos.x} ${midY} ${pos.x} ${midY} ${pos.x} ${endY}`;
                    }

                    return (
                      <path
                        key={`edge-${n.id}`}
                        d={pathD}
                        className={styles.svgConnection}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        filter={isSelectedPath ? 'url(#neonGlow)' : undefined}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map(n => {
                    const pos = nodePositions.get(n.id);
                    if (!pos) return null;
                    const isSel = n.id === selectedNodeId;
                    const isSpotlight = n.id === draftData.activeNodeId;
                    const isRoot = n.tier === 0;
                    const maxChars = isRoot ? 14 : 11;

                    return (
                      <g
                        key={n.id}
                        className={styles.svgNodeG}
                        onClick={() => setSelectedNodeId(n.id)}
                        transform={`translate(${pos.x}, ${pos.y})`}
                      >
                        <rect
                          x={-pos.width / 2}
                          y={-pos.height / 2}
                          width={pos.width}
                          height={pos.height}
                          rx={isRoot ? 13 : 6}
                          fill={isSel ? 'rgba(190, 255, 1, 0.18)' : 'rgba(22, 27, 34, 0.95)'}
                          stroke={isSel ? 'var(--accent)' : (n.color || 'var(--border)')}
                          strokeWidth={isSel ? 2 : 1}
                          filter={isSel ? 'url(#neonGlow)' : undefined}
                        />
                        {/* Icon */}
                        <text
                          x={-pos.width / 2 + 7}
                          y={4}
                          fontSize={isRoot ? 13 : 11}
                        >
                          {n.icon || '📌'}
                        </text>
                        {/* Label */}
                        <text
                          x={-pos.width / 2 + 23}
                          y={3.5}
                          fill={isSel ? '#fff' : (n.color || 'var(--text)')}
                          fontSize={isRoot ? 10.5 : 9.5}
                          fontWeight={isRoot ? 800 : 600}
                        >
                          {n.label.length > maxChars ? n.label.slice(0, maxChars - 1) + '…' : n.label}
                        </text>
                        {/* Spotlight Dot */}
                        {isSpotlight && (
                          <circle
                            cx={pos.width / 2 - 5}
                            cy={-pos.height / 2 + 5}
                            r={3}
                            fill="var(--accent)"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Selected Node Editor Form */}
            {selectedNode && (
              <div className={styles.nodeEditorForm}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{selectedNode.icon || '📌'}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: selectedNode.color || 'var(--accent)' }}>
                      {selectedNode.tier === 0 ? 'Nút gốc bài học' : `Nhánh: ${selectedNode.label}`}
                    </span>
                    <span className={styles.tierBadge}>
                      {selectedNode.tier === 0 ? 'Gốc' : selectedNode.tier === 1 ? 'Nhánh' : 'Ý con'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateDraft({ activeNodeId: draftData.activeNodeId === selectedNode.id ? undefined : selectedNode.id })}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      backgroundColor: draftData.activeNodeId === selectedNode.id ? 'var(--accent)' : 'var(--surface-2)',
                      color: draftData.activeNodeId === selectedNode.id ? '#000' : 'var(--text-sub)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={draftData.activeNodeId === selectedNode.id ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{draftData.activeNodeId === selectedNode.id ? 'Đang là tiêu điểm video' : 'Đặt làm tiêu điểm'}</span>
                  </button>
                </div>

                {/* Compact Row: Icon Trigger + Label + SubLabel */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  {/* Icon Popover Trigger */}
                  <div className={styles.iconPickerWrapper} ref={iconPopoverRef}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>Icon</span>
                    <button
                      type="button"
                      className={styles.iconPickerTrigger}
                      onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                      title="Chọn biểu tượng sư phạm"
                    >
                      <span>{selectedNode.icon || '📌'}</span>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>

                    {isIconPickerOpen && (
                      <div className={styles.iconPopover}>
                        <span className={styles.iconPopoverHeader}>Biểu tượng sư phạm</span>
                        <div className={styles.iconPopoverGrid}>
                          {EDU_ICONS.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              className={`${styles.iconPopoverBtn} ${selectedNode.icon === icon ? styles.iconPopoverBtnSelected : ''}`}
                              onClick={() => {
                                handleUpdateNode(selectedNode.id, { icon });
                                setIsIconPickerOpen(false);
                              }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tên nhánh */}
                  <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)' }}>Tên nhánh (Ngắn gọn)</span>
                    <input
                      type="text"
                      value={selectedNode.label}
                      onChange={e => handleUpdateNode(selectedNode.id, { label: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--text)',
                        fontSize: 11.5,
                        height: 34,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Huy hiệu / Mốc thời gian */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)' }}>Huy hiệu / Mốc thời gian</span>
                    <input
                      type="text"
                      value={selectedNode.subLabel || ''}
                      onChange={e => handleUpdateNode(selectedNode.id, { subLabel: e.target.value })}
                      placeholder="Ví dụ: 13/3 - 17/3"
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--text)',
                        fontSize: 11.5,
                        height: 34,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Insight (Pedagogical Explanation) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)' }}>
                    Lời giảng bài học (Hiển thị khi camera zoom vào)
                  </span>
                  <textarea
                    rows={2}
                    value={selectedNode.insight || ''}
                    onChange={e => handleUpdateNode(selectedNode.id, { insight: e.target.value })}
                    placeholder="Giải thích bản chất khái niệm ngắn gọn, súc tích cho học sinh..."
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface-2)',
                      color: 'var(--text)',
                      fontSize: 11.5,
                      resize: 'none',
                    }}
                  />
                </div>

                {/* Color Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)' }}>Màu chủ đề:</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {dynamicPalette.map(c => (
                      <div
                        key={c}
                        onClick={() => handleUpdateNode(selectedNode.id, { color: c })}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: c,
                          cursor: 'pointer',
                          border: selectedNode.color === c ? '2px solid #fff' : '1px solid rgba(0,0,0,0.5)',
                          transform: selectedNode.color === c ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.12s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={isExpanding || childBranches.length === 0}
              onClick={handleExpandToScenes}
              leftIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
            >
              {isExpanding ? 'Đang tạo chuỗi video...' : `Tách thành ${childBranches.length} phân cảnh video`}
            </Button>
          </div>

          <div className={styles.footerActions}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAndApply}>
              Áp dụng vào video
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
