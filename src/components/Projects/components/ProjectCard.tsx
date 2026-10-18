import React from 'react';
import { ProjectMetadata } from '@/types/project';
import { downloadFileDirectly } from '@/utils/downloadHelper';
import { Button, ButtonGroup } from '@/components/ui';

/** Trạng thái render hàng loạt của một project (hiển thị trên thẻ) */
export interface BatchRenderItemStatus {
  projectId: string;
  projectTitle: string;
  status: 'idle' | 'queued' | 'bundling' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  downloadUrl?: string;
  outputFilename?: string;
  error?: string;
}

interface ProjectCardProps {
  project: ProjectMetadata;
  isActive: boolean;
  isSelected: boolean;
  isEditingThis: boolean;
  editingTitle: string;
  renderStatus?: BatchRenderItemStatus;
  confirmDeleteId: string | null;
  onSelectToggle: (id: string, e: React.MouseEvent) => void;
  onLoad: (id: string) => void;
  onStartRename: (project: ProjectMetadata, e?: React.MouseEvent) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onEditTitleChange: (val: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onSingleRender: (id: string) => void;
  formatDuration: (sec: number) => string;
  formatTimeAgo: (timestamp: number) => string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  isSelected,
  isEditingThis,
  editingTitle,
  renderStatus,
  confirmDeleteId,
  onSelectToggle,
  onLoad,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onEditTitleChange,
  onDuplicate,
  onExport,
  onDeletePrompt,
  onDeleteConfirm,
  onDeleteCancel,
  onSingleRender,
  formatDuration,
  formatTimeAgo,
}) => {
  const isRendering = renderStatus?.status === 'rendering' || renderStatus?.status === 'bundling' || renderStatus?.status === 'queued';
  const isCompleted = renderStatus?.status === 'completed';
  const isFailed = renderStatus?.status === 'failed';
  const progressPct = Math.round((renderStatus?.progress || 0) * 100);

  return (
    <div
      style={{
        background: isActive ? "linear-gradient(180deg, #161A22 0%, #0F1218 100%)" : "#0E1116",
        border: `1px solid ${isSelected ? "#A855F7" : isActive ? "#BEFF01" : "rgba(255, 255, 255, 0.08)"}`,
        borderRadius: "12px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "all 0.15s ease",
        position: "relative",
        boxShadow: isSelected ? "0 0 16px rgba(168, 85, 247, 0.25)" : isActive ? "0 0 16px rgba(190, 255, 1, 0.12)" : "none"
      }}
    >
      {/* Selection Checkbox (Top-Left) */}
      <button
        type="button"
        onClick={(e) => onSelectToggle(project.id, e)}
        title={isSelected ? "Bỏ chọn" : "Tích chọn để render hàng loạt"}
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 12,
          width: "22px",
          height: "22px",
          borderRadius: "6px",
          border: isSelected ? "2px solid #A855F7" : "1px solid rgba(255, 255, 255, 0.3)",
          background: isSelected ? "#A855F7" : "rgba(0, 0, 0, 0.6)",
          color: "#FFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 900,
          backdropFilter: "blur(4px)"
        }}
      >
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Thumbnail / Header Preview */}
      <div
        onClick={() => onLoad(project.id)}
        style={{
          height: "88px",
          borderRadius: "8px",
          background: project.firstSceneBg || "#14171E",
          border: `1px solid ${isActive ? "rgba(190, 255, 1, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Active Indicator Badge inside Thumbnail */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              background: "#BEFF01",
              color: "#000",
              fontSize: "9px",
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: "4px",
              letterSpacing: "0.4px",
              zIndex: 10,
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "3px"
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>ĐANG MỞ</span>
          </div>
        )}

        <span
          style={{
            fontSize: "12.5px",
            fontWeight: 800,
            color: "#FFF",
            textAlign: "center",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "0 4px"
          }}
        >
          {project.firstSceneText || project.title}
        </span>
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            fontSize: "9.5px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600
          }}
        >
          {project.sceneCount} cảnh • {formatDuration(project.durationSec)}
        </div>
      </div>

      {/* Render Status Badge Bar (If active or completed) */}
      {renderStatus && renderStatus.status !== 'idle' && (
        <div style={{
          padding: '6px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isCompleted ? 'rgba(0, 230, 118, 0.12)' : isFailed ? 'rgba(255, 68, 68, 0.12)' : 'rgba(168, 85, 247, 0.15)',
          border: `1px solid ${isCompleted ? '#00E676' : isFailed ? '#FF4444' : '#A855F7'}`,
          color: isCompleted ? '#00E676' : isFailed ? '#FF4444' : '#C084FC'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {isRendering && (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span>Đang xuất: {progressPct}%</span>
              </>
            )}
            {isCompleted && (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <span>Đã xuất MP4</span>
              </>
            )}
            {isFailed && (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                <span>Lỗi xuất video</span>
              </>
            )}
            {renderStatus.status === 'queued' && <span>Chờ đến lượt...</span>}
          </span>

          {isCompleted && renderStatus.downloadUrl && (
            <Button
              variant="primary"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                downloadFileDirectly(renderStatus.downloadUrl!, renderStatus.outputFilename);
              }}
              leftIcon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
              style={{ background: '#00E676', color: '#000', borderColor: '#00E676' }}
            >
              Tải
            </Button>
          )}
        </div>
      )}

      {/* Title & Rename */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        {isEditingThis ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename(project.id);
                if (e.key === "Escape") onCancelRename();
              }}
              style={{
                flex: 1,
                background: "#08090C",
                border: "1px solid #BEFF01",
                color: "#FFF",
                padding: "3px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                outline: "none"
              }}
            />
            <Button
              asIcon
              variant="primary"
              size="icon-xs"
              onClick={() => onSaveRename(project.id)}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Button>
          </div>
        ) : (
          <div
            onClick={(e) => onStartRename(project, e)}
            title="Bấm đúp để đổi tên"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#FFF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "text",
              flex: 1
            }}
          >
            {project.title}
          </div>
        )}

        <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>
          {formatTimeAgo(project.updatedAt)}
        </span>
      </div>

      {/* Bottom Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {confirmDeleteId === project.id ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10.5px", color: "#FF4D4D", fontWeight: 700 }}>Xác nhận xóa?</span>
            <div style={{ display: "flex", gap: "4px" }}>
              <Button
                variant="danger"
                size="xs"
                onClick={() => onDeleteConfirm(project.id)}
              >
                Xóa
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={onDeleteCancel}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ButtonGroup>
              <Button
                asIcon
                variant="primary"
                size="icon-xs"
                onClick={() => onSingleRender(project.id)}
                title="Render ngay dự án này"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </Button>
              <Button
                asIcon
                variant="ghost"
                size="icon-xs"
                onClick={() => onDuplicate(project.id)}
                title="Nhân bản dự án"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </Button>
              <Button
                asIcon
                variant="ghost"
                size="icon-xs"
                onClick={() => onExport(project.id)}
                title="Xuất file .xdshort"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </Button>
            </ButtonGroup>

            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={() => onDeletePrompt(project.id)}
              title="Xóa dự án"
              style={{ color: '#888' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
