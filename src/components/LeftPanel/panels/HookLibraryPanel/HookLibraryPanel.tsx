import React, { useMemo, useState } from 'react';
import { useHookLibraryStore } from '@/store/useHookLibraryStore';
import { useEditorStore } from '@/store/useEditorStore';
import { HookTemplateCard } from './HookTemplateCard';
import { HookAIGenerateModal } from './HookAIGenerateModal';
import { Button } from '@/components/ui';
import styles from './HookLibraryPanel.module.css';

export default function HookLibraryPanel() {
  const {
    getAllTemplates,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    insertIntoProject,
    removeTemplate,
    isClientMode,
    toggleClientMode,
  } = useHookLibraryStore();

  const { showToast } = useEditorStore();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const allTemplates = getAllTemplates();

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      // Unified Filter: Visual Style or Psych Archetype
      if (selectedCategory.startsWith('arch:')) {
        const targetArch = selectedCategory.replace('arch:', '');
        if (t.psychArchetype !== targetArch) return false;
      } else if (selectedCategory !== 'all') {
        const itemVisual = t.visualStyle || t.category;
        if (itemVisual !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchTitle = (t.hookData?.heroTitle || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchName && !matchTitle && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [allTemplates, selectedCategory, searchQuery]);

  const handleInsert = (id: string) => {
    try {
      insertIntoProject(id);
      showToast('Đã chèn cảnh Hook vào timeline');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chèn template');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xoá mẫu Hook tuỳ chỉnh này?')) {
      const ok = await removeTemplate(id);
      if (ok) {
        showToast('Đã xoá mẫu khỏi thư viện');
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* ── 1. HEADER & MODE SWITCHER ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerTitle}>
            Thư viện Cảnh Hook
          </div>
          <div className={styles.headerSubtitle}>
            Mẫu nguyên cảnh 3s (Nền, SFX, Chữ, Đếm ngược)
          </div>
        </div>

        {/* Client Mode Switch */}
        <button
          onClick={toggleClientMode}
          title={isClientMode ? 'Mở khoá quyền Quản trị / Creator' : 'Khoá sang Chế độ Khách hàng'}
          className={`${styles.clientModeBtn} ${isClientMode ? styles.clientModeActive : styles.clientModeInactive}`}
        >
          {isClientMode ? 'Khách hàng' : 'Chuyên gia'}
        </button>
      </div>

      {/* ── 2. AI GENERATE BUTTON ── */}
      {!isClientMode && (
        <div className={styles.actionStack}>
          <Button
            variant="primary"
            size="xs"
            onClick={() => setIsAIModalOpen(true)}
            fullWidth
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
          >
            Tạo Hook bằng AI
          </Button>
        </div>
      )}

      {/* ── 3. SEARCH BAR ── */}
      <div className={styles.searchWrapper}>
        <input
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm mẫu hook..."
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className={styles.searchClear}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── 4. CONSOLIDATED SINGLE SELECT DROPDOWN (Zero Duplication) ── */}
      <select
        className={styles.categorySelect}
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        title="Lọc theo phong cách hoặc tâm lý học"
      >
        <option value="all">Tất cả mẫu Hook ({allTemplates.length})</option>
        <optgroup label="── Phong Cách Thị Giác ──">
          <option value="kinetic">Kinetic Motion</option>
          <option value="hazard">Cảnh báo Hazard</option>
          <option value="cyber">Công nghệ Cyber</option>
          <option value="zen">Tối giản Zen</option>
          <option value="versus">Đối đầu phân đôi</option>
          <option value="cta">Kêu gọi hành động</option>
        </optgroup>
        <optgroup label="── Tâm Lý Học Viral ──">
          <option value="arch:fomo_warning">Cảnh báo mất mát (FOMO)</option>
          <option value="arch:curiosity_gap">Khoảng trống tò mò</option>
          <option value="arch:giant_stat">Số liệu thực chứng</option>
          <option value="arch:speed_hack">Mẹo nhanh (Speed Hack)</option>
          <option value="arch:versus">Đối đầu so sánh</option>
          <option value="arch:tips">Bí quyết & Lời khuyên</option>
        </optgroup>
      </select>

      {/* ── 5. TEMPLATES GRID ── */}
      <div className={styles.templatesGrid}>
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((t) => (
            <HookTemplateCard
              key={t.id}
              template={t}
              isClientMode={isClientMode}
              onInsert={handleInsert}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateText}>Không tìm thấy mẫu phù hợp</div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className={styles.resetBtn}
            >
              Xem tất cả mẫu ({allTemplates.length})
            </button>
          </div>
        )}
      </div>

      {/* ── 6. MODALS ── */}
      <HookAIGenerateModal 
        open={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />
    </div>
  );
}
