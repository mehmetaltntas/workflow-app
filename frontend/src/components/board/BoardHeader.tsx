import { ArrowLeft, ArrowUp, ArrowDown, Tag, Home, ChevronRight, Info } from "lucide-react";
import { colors as tokenColors } from "../../styles/tokens";
import type { Task, TaskList, Subtask, Label } from "../../types";

export interface BoardHeaderProps {
  boardName: string;
  boardLabels: Label[];
  slug: string | undefined;
  backPath: string;
  isOwner: boolean;
  selectedList: TaskList | null;
  selectedTask: Task | null;
  selectedTaskId: number | null;
  selectedListId: number | null;
  selectedSubtask: Subtask | null;
  sortBy: "name" | "date";
  sortOrder: "asc" | "desc";
  colors: {
    bgHeader: string;
    borderDefault: string;
    bgElevated: string;
    textSecondary: string;
    textMuted: string;
    divider: string;
    bgHover: string;
  };
  onNavigateBack: () => void;
  onNavigateInfo: () => void;
  onBreadcrumbClick: (level: 'board' | 'list' | 'task') => void;
  onClearSubtaskSelection: () => void;
  onShowLabelManager: () => void;
  onSortByChange: (value: "name" | "date") => void;
  onSortOrderToggle: () => void;
}

export const BoardHeader = ({
  boardName,
  boardLabels,
  isOwner,
  selectedList,
  selectedTask,
  selectedTaskId,
  selectedListId,
  selectedSubtask,
  sortBy,
  sortOrder,
  colors,
  onNavigateBack,
  onNavigateInfo,
  onBreadcrumbClick,
  onClearSubtaskSelection,
  onShowLabelManager,
  onSortByChange,
  onSortOrderToggle,
}: BoardHeaderProps) => {
  return (
    <div style={{ padding: "16px 24px", background: colors.bgHeader, borderBottom: `1px solid ${colors.borderDefault}`, display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(20px)", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={onNavigateBack} className="btn btn-ghost" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", borderRadius: '12px', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onBreadcrumbClick('board')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: !selectedListId ? 'var(--primary)' : 'transparent',
              color: !selectedListId ? tokenColors.dark.text.primary : 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <Home size={14} />
            {boardName}
          </button>

          {selectedList && (
            <>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              <button
                onClick={() => onBreadcrumbClick('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedList && !selectedTaskId ? 'var(--primary)' : 'transparent',
                  color: selectedList && !selectedTaskId ? tokenColors.dark.text.primary : 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {selectedList.name}
              </button>
            </>
          )}

          {selectedTask && (
            <>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              <button
                onClick={() => onClearSubtaskSelection()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedTask && !selectedSubtask ? 'var(--primary)' : 'transparent',
                  color: selectedTask && !selectedSubtask ? tokenColors.dark.text.primary : 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {selectedTask.title}
              </button>
            </>
          )}

          {selectedSubtask && (
            <>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: tokenColors.dark.text.primary,
                  fontSize: '14px',
                  fontWeight: 500,
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedSubtask.title}
              </span>
            </>
          )}
        </nav>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {/* Bilgi Button */}
        <button
          onClick={onNavigateInfo}
          className="header-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '12px',
            border: `1px solid ${colors.borderDefault}`,
            background: colors.bgElevated,
            color: colors.textSecondary,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Info size={14} />
          Bilgi
        </button>

        {/* Labels Button - only visible to owner */}
        {isOwner && (
          <button
            onClick={onShowLabelManager}
            className="header-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              border: `1px solid ${colors.borderDefault}`,
              background: colors.bgElevated,
              color: colors.textSecondary,
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Tag size={14} />
            Etiketler
            {boardLabels && boardLabels.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: tokenColors.dark.text.primary,
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {boardLabels.length}
              </span>
            )}
          </button>
        )}

        {/* Sort Controls - only visible to owner */}
        {isOwner && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: colors.bgElevated,
            padding: '4px',
            borderRadius: '14px',
            border: `1px solid ${colors.borderDefault}`,
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--shadow-md)',
          }}>
            {/* Sort Type Buttons */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => onSortByChange("name")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: sortBy === "name" ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                  color: sortBy === "name" ? 'var(--primary)' : colors.textMuted,
                  boxShadow: sortBy === "name" ? '0 2px 8px rgba(var(--primary-rgb), 0.2)' : 'none',
                }}
              >
                Alfabetik
              </button>
              <button
                onClick={() => onSortByChange("date")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: sortBy === "date" ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
                  color: sortBy === "date" ? 'var(--primary)' : colors.textMuted,
                  boxShadow: sortBy === "date" ? '0 2px 8px rgba(var(--primary-rgb), 0.2)' : 'none',
                }}
              >
                Tarih
              </button>
            </div>

            {/* Divider */}
            <div style={{
              width: '1px',
              height: '20px',
              background: colors.divider,
              margin: '0 6px'
            }} />

            {/* Direction Toggle Arrow */}
            <button
              onClick={onSortOrderToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: colors.bgHover,
                color: 'var(--primary)',
                transition: 'all 0.2s ease',
              }}
              title={
                sortBy === "name"
                  ? (sortOrder === "asc" ? "A'dan Z'ye" : "Z'den A'ya")
                  : (sortOrder === "asc" ? "Eskiden Yeniye" : "Yeniden Eskiye")
              }
            >
              {sortOrder === "asc" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
