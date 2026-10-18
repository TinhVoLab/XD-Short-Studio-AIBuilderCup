import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { Button, SearchInput } from "@/components/ui";
import { importProjectFromFile, exportProjectToFile, loadProjectFromDb, saveProjectToDb, saveProjectToDisk, resolveFullProjectData } from "@/utils/projectStorage";
import { ProjectMetadata } from "@/types/project";
import { useBatchRenderQueue } from "@/hooks/useBatchRenderQueue";
import pmStyles from './ProjectsModal.module.css';
import { openCreateVideo } from '@/components/AiWizardModal/openCreateVideo'

export default function ProjectsModal() {
  const { startBatchRender } = useBatchRenderQueue();
  const {
    projectsModalOpen,
    setProjectsModalOpen,
    activeProjectId,
    projectsList,
    loadProjectById,
    duplicateProjectById,
    deleteProjectById,
    importProjectData,
    refreshProjectsList,
    setProjectTitle,
    showToast,
    setProjectTags,
    projectsViewMode,
    setProjectsViewMode
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTagMenu, setActiveTagMenu] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  if (!projectsModalOpen) return null;

  const allTags = Array.from(new Set(projectsList.flatMap(p => p.tags || []))).sort();

  const filteredProjects = projectsList.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.folderName && p.folderName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "Vừa xong";
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast("Đang giải mã file dự án...");
      const importedData = await importProjectFromFile(file);
      await importProjectData(importedData);
    } catch (err: any) {
      showToast(`Lỗi nhập file: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportProject = async (id: string, folderName?: string) => {
    try {
      showToast("Đang chuẩn bị dữ liệu xuất file...");
      const fullProject = await resolveFullProjectData(id, folderName);
      if (fullProject) {
        exportProjectToFile(fullProject, 'xdshort.json');
        showToast(`Đã tải file "${fullProject.title}.xdshort.json" về máy!`);
      } else {
        showToast("Không tìm thấy dữ liệu dự án để xuất file");
      }
    } catch (err: any) {
      showToast(`Lỗi xuất file: ${err.message}`);
    }
  };

  const startRename = (project: ProjectMetadata, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(project.id);
    setEditTitle(project.title);
  };

  const saveRename = async (id: string, folderName?: string) => {
    const trimmed = editTitle.trim();
    setEditingId(null);
    if (!trimmed) return;
    try {
      const project = await loadProjectFromDb(id);
      if (project) {
        project.title = trimmed;
        project.updatedAt = Date.now();
        await saveProjectToDb(project);
        await saveProjectToDisk(project, folderName);
        await refreshProjectsList();
        if (id === activeProjectId) setProjectTitle(trimmed);
        showToast(`Đã đổi tên dự án thành "${trimmed}"`);
      }
    } catch (err: any) {
      showToast(`Lỗi đổi tên: ${err.message}`);
    }
  };

  const handleTagToggle = async (projectId: string, tag: string, currentTags: string[]) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    await setProjectTags(projectId, newTags);
  };

  const handleAddNewTag = async (projectId: string, currentTags: string[]) => {
    const trimmed = newTagInput.trim();
    if (trimmed && !currentTags.includes(trimmed)) {
      await setProjectTags(projectId, [...currentTags, trimmed]);
    }
    setNewTagInput("");
    setActiveTagMenu(null);
  };

  const handleSyncFromCloud = async () => {
    const { cloudProjectService } = await import('@/services/cloudProjectService');
    showToast('Đang kiểm tra dự án trên Cloud...');
    const cloudList = await cloudProjectService.listCloudProjects();
    if (cloudList.length === 0) {
      showToast('Chưa có dự án nào được lưu trên Cloud tài khoản này.');
      return;
    }
    showToast(`Đang đồng bộ ${cloudList.length} dự án từ Cloud...`);
    for (const meta of cloudList) {
      const cloudProj = await cloudProjectService.loadProjectFromCloud(meta.id);
      if (cloudProj) {
        await saveProjectToDb(cloudProj);
        await saveProjectToDisk(cloudProj, cloudProj.folderName);
      }
    }
    await refreshProjectsList();
    showToast(`Đã đồng bộ ${cloudList.length} dự án từ Cloud về máy!`);
  };

  const isList = projectsViewMode === 'list';
  const isGrid = projectsViewMode === 'grid';

  return (
    <div className={pmStyles.backdrop} onClick={() => setProjectsModalOpen(false)}>
      <div className={pmStyles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Top Header Bar */}
        <div className={pmStyles.header}>
          <div className={pmStyles.headerLeft}>
            <div className={pmStyles.headerTitleRow}>
              <h2 className={pmStyles.title}>Thư Viện Dự Án</h2>
              <span className={pmStyles.badge}>{projectsList.length} dự án</span>
            </div>
            <p className={pmStyles.subtitle}>
              Quản lý, tìm kiếm và tạo mới các dự án video ngắn
            </p>
          </div>

          <div className={pmStyles.headerRight}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xdshort,.json" 
              style={{ display: "none" }} 
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              }
            >
              Nhập File
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setProjectsModalOpen(false); openCreateVideo() }}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              }
            >
              Dự Án Mới
            </Button>
            <div className={pmStyles.headerSep} />
            <Button
              asIcon
              variant="ghost"
              size="icon-sm"
              onClick={() => setProjectsModalOpen(false)}
              title="Đóng cửa sổ (Esc)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </Button>
          </div>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className={pmStyles.searchBar}>
          <div className={pmStyles.searchBarFlex}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc thư mục..."
            />
          </div>

          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            onClick={handleSyncFromCloud}
            title="Đồng bộ lại dự án từ Cloud về máy tính"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              <path d="M12 13v6" />
              <path d="m9 16 3-3 3 3" />
            </svg>
          </Button>

          <div className={pmStyles.viewToggle}>
            <button
              type="button"
              className={`${pmStyles.viewToggleBtn} ${isList ? pmStyles.viewToggleBtnActive : ''}`}
              onClick={() => setProjectsViewMode('list')}
              title="Dạng danh sách chi tiết"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button
              type="button"
              className={`${pmStyles.viewToggleBtn} ${isGrid ? pmStyles.viewToggleBtnActive : ''}`}
              onClick={() => setProjectsViewMode('grid')}
              title="Dạng lưới thẻ card"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>

        {/* Tags filter list */}
        {allTags.length > 0 && (
          <div className={pmStyles.tagsBar}>
            <button 
              className={`${pmStyles.tagFilterBtn} ${selectedTag === null ? pmStyles.tagFilterBtnActive : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              Tất cả ({projectsList.length})
            </button>
            {allTags.map(tag => (
              <button 
                key={tag} 
                className={`${pmStyles.tagFilterBtn} ${selectedTag === tag ? pmStyles.tagFilterBtnActive : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Projects List Container */}
        <div 
          className={pmStyles.projectsContainer}
          style={{
            display: isGrid ? 'grid' : 'flex',
            flexDirection: isList ? 'column' : undefined,
            gridTemplateColumns: isGrid ? 'repeat(auto-fill, minmax(280px, 1fr))' : undefined,
            gap: isGrid ? '14px' : '8px'
          }}
        >
          {filteredProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isEditingThis = editingId === project.id;
            const folderDisplayName = project.folderName || project.id;

            return (
              <div
                key={project.folderName ? `${project.id}_${project.folderName}` : project.id}
                className={`${pmStyles.projectCard} ${isList ? pmStyles.projectCardList : pmStyles.projectCardGrid} ${isActive ? pmStyles.projectCardActive : pmStyles.projectCardDefault}`}
              >
                {/* Project Info */}
                <div className={`${pmStyles.projectInfo} ${isList ? pmStyles.projectInfoList : ''}`}>
                  {isEditingThis ? (
                    <div className={pmStyles.renameRow}>
                      <input 
                        ref={editInputRef} 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') saveRename(project.id, project.folderName); 
                          if (e.key === 'Escape') setEditingId(null); 
                        }} 
                        onBlur={() => saveRename(project.id, project.folderName)} 
                        className={pmStyles.renameInput} 
                      />
                      <Button asIcon variant="primary" size="icon-xs" onClick={() => saveRename(project.id, project.folderName)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </Button>
                    </div>
                  ) : (
                    <div className={pmStyles.titleRow}>
                      <span 
                        title="Bấm vào để mở dự án" 
                        onClick={() => loadProjectById(project.id, project.folderName)} 
                        className={`${pmStyles.projectTitle} ${isActive ? pmStyles.projectTitleActive : pmStyles.projectTitleDefault}`}
                      >
                        {project.title}
                      </span>
                      {isActive && <span className={pmStyles.activeBadgeInline}>ĐANG MỞ</span>}
                      <Button 
                        asIcon 
                        variant="ghost" 
                        size="icon-xs" 
                        onClick={(e) => startRename(project, e)} 
                        title="Đổi tên dự án"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </Button>
                    </div>
                  )}

                  {/* Folder path badge (Click to Reveal in Finder) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 4px' }}>
                    <span 
                      onClick={async (e) => {
                        e.stopPropagation();
                        const { revealProjectInFinder } = await import('@/utils/projectStorage');
                        await revealProjectInFinder(folderDisplayName);
                        showToast(`Đã mở thư mục "${folderDisplayName}" trong Finder`);
                      }}
                      title={`Bấm để mở thư mục trên máy tính: public/storage/projects/${folderDisplayName}/`}
                      style={{ 
                        fontSize: '10.5px', 
                        fontFamily: 'monospace', 
                        color: 'var(--text-sub)', 
                        background: 'var(--surface-3)', 
                        padding: '1px 6px', 
                        borderRadius: 4, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4,
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      {folderDisplayName}
                    </span>
                  </div>

                  <div className={pmStyles.projectMeta}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{project.videoFormat?.toUpperCase() || '9:16'}</span>
                    <span>•</span>
                    <span>{project.sceneCount} cảnh</span>
                    <span>•</span>
                    <span>{formatDuration(project.durationSec)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(project.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions Wrapper */}
                <div className={`${pmStyles.actionsWrapper} ${isList ? pmStyles.actionsWrapperList : pmStyles.actionsWrapperGrid}`}>
                  {/* Tag Badge */}
                  <div className={`${pmStyles.tagRelative}`} style={{ alignSelf: isList ? 'center' : 'flex-start', marginTop: isGrid ? 2 : 0 }}>
                    <Button 
                      variant="secondary" 
                      size="xs" 
                      leftIcon={
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      } 
                      onClick={(e) => { e.stopPropagation(); setActiveTagMenu(activeTagMenu === project.id ? null : project.id); }} 
                      title="Quản lý nhãn phân loại" 
                      style={{ fontSize: '9.5px', padding: '2px 6px' }}
                    >
                      {project.tags && project.tags.length > 0 ? project.tags.join(', ') : 'Thêm nhãn'}
                    </Button>
                    {activeTagMenu === project.id && (
                      <div className={pmStyles.tagPopover}>
                        <div className={pmStyles.tagPopoverTitle}>Gắn nhãn dự án</div>
                        <div className={pmStyles.tagList}>
                          {allTags.map(tag => {
                            const isChecked = project.tags?.includes(tag);
                            return (
                              <label key={tag} className={pmStyles.tagItem}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => handleTagToggle(project.id, tag, project.tags || [])} 
                                  className={pmStyles.tagCheckbox} 
                                />
                                {tag}
                              </label>
                            );
                          })}
                        </div>
                        <div className={pmStyles.tagAddRow}>
                          <input 
                            type="text" 
                            placeholder="Nhập nhãn mới..." 
                            value={newTagInput} 
                            onChange={e => setNewTagInput(e.target.value)} 
                            onKeyDown={e => { if (e.key === 'Enter') handleAddNewTag(project.id, project.tags || []); }} 
                            className={pmStyles.tagAddInput} 
                          />
                          <Button asIcon variant="primary" size="icon-xs" onClick={() => handleAddNewTag(project.id, project.tags || [])}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className={`${pmStyles.bottomBar} ${isList ? pmStyles.bottomBarList : pmStyles.bottomBarGrid}`}>
                    {confirmDeleteId === project.id ? (
                      <div className={pmStyles.deleteBanner}>
                        <span className={pmStyles.deleteBannerText}>Xóa dự án khỏi ổ cứng?</span>
                        <div className={pmStyles.deleteBannerActions}>
                          <Button variant="ghost" size="xs" onClick={() => setConfirmDeleteId(null)}>Hủy</Button>
                          <Button variant="danger" solid size="xs" onClick={() => { setConfirmDeleteId(null); deleteProjectById(project.id, project.folderName); }}>Xóa</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button 
                          variant={isActive ? 'primary' : 'secondary'} 
                          size="xs" 
                          onClick={() => loadProjectById(project.id, project.folderName)} 
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {isActive ? 'Đang mở' : 'Mở'}
                        </Button>
                        <div className={pmStyles.quickActions}>
                          <Button 
                            asIcon 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={async () => {
                              const targetFolder = project.folderName || project.id;
                              const { revealProjectInFinder } = await import('@/utils/projectStorage');
                              await revealProjectInFinder(targetFolder);
                              showToast(`Đã mở thư mục "${targetFolder}" trong Finder`);
                            }} 
                            title="Mở thư mục dự án trên máy tính (Finder / Explorer)"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11l3 3m0 0l-3 3m3-3H8"/></svg>
                          </Button>
                          <Button 
                            asIcon 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => duplicateProjectById(project.id)} 
                            title="Nhân bản dự án (Duplicate)"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          </Button>
                          <Button 
                            asIcon 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => handleExportProject(project.id, project.folderName)} 
                            title="Tải file dự án JSON (.xdshort.json)"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </Button>
                          <Button 
                            asIcon 
                            variant="danger" 
                            size="icon-sm" 
                            onClick={() => setConfirmDeleteId(project.id)} 
                            title="Xóa vĩnh viễn dự án trên ổ cứng"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className={pmStyles.emptyState}>
              Không tìm thấy dự án nào khớp với từ khóa "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
