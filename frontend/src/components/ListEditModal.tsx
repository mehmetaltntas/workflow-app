import React, { useState } from "react";
import { X, Save, Link as LinkIcon, Trash2, CheckSquare, Square, Settings } from "lucide-react";
import type { Task, TaskList } from "../types";
import { colors, cssVars, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";

interface ListEditModalProps {
  list: TaskList;
  onClose: () => void;
  onSave: (listId: number, updates: { name?: string; link?: string }) => Promise<void>;
  onDeleteTasks: (taskIds: number[]) => Promise<void>;
}

export const ListEditModal: React.FC<ListEditModalProps> = ({ list, onClose, onSave, onDeleteTasks }) => {
  const [name, setName] = useState(list.name);
  const [link, setLink] = useState(list.link || "");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const [deletedTaskIds, setDeletedTaskIds] = useState<number[]>([]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(list.id, { name, link: link || undefined });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === list.tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(list.tasks.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    // Store deleted task IDs for undo
    setDeletedTaskIds(selectedTasks);
    setShowUndoBar(true);
    
    // Set a timeout to actually delete if not undone
    const timeoutId = setTimeout(async () => {
      try {
        await onDeleteTasks(selectedTasks);
        setSelectedTasks([]);
        setShowUndoBar(false);
        setDeletedTaskIds([]);
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    // Store timeout ID for potential cancellation
    (window as unknown as { undoTimeout?: ReturnType<typeof setTimeout> }).undoTimeout = timeoutId;
  };

  const handleUndo = () => {
    const timeout = (window as unknown as { undoTimeout?: ReturnType<typeof setTimeout> }).undoTimeout;
    if (timeout) {
      clearTimeout(timeout);
    }
    setShowUndoBar(false);
    setDeletedTaskIds([]);
    // No actual deletion happened yet, so tasks remain
  };

  const visibleTasks = list.tasks.filter(t => !deletedTaskIds.includes(t.id));

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.dark.bg.overlay,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: zIndex.modal,
    }}>
      <div
        className="modal-content glass"
        style={{
          width: "650px",
          maxHeight: "80vh",
          borderRadius: radius['2xl'],
          padding: spacing[8],
          display: "flex",
          flexDirection: "column",
          gap: spacing[6],
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: shadows.modal,
          border: '1px solid var(--border)',
          animation: `modalFadeIn ${animation.duration.slow} ${animation.easing.smooth}`,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], color: "var(--text-main)" }}>
            <div style={{ padding: spacing[2.5], backgroundColor: colors.brand.primaryLight, borderRadius: radius.lg }}>
              <Settings size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, letterSpacing: typography.letterSpacing.tighter }}>Listeyi Düzenle</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* List Name and Link */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>Liste Adı</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Liste adı..."
              autoFocus
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                borderRadius: radius.lg,
                border: '1px solid var(--border)',
                background: colors.dark.glass.bg,
                color: cssVars.textMain,
                fontSize: typography.fontSize.xl,
                outline: 'none',
                transition: `border-color ${animation.duration.normal}`
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
              <LinkIcon size={14} /> Link
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                borderRadius: radius.lg,
                border: '1px solid var(--border)',
                background: colors.dark.glass.bg,
                color: 'var(--primary)',
                fontSize: typography.fontSize.lg,
                outline: 'none',
                fontWeight: typography.fontWeight.medium
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Tasks Section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: spacing[5] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
            <span style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
              Görevler ({visibleTasks.length})
            </span>
            <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
              {selectedTasks.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1.5],
                    padding: `${spacing[2]} ${spacing[3.5]}`,
                    borderRadius: radius.md,
                    border: 'none',
                    background: colors.semantic.dangerLight,
                    color: 'var(--danger)',
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    transition: `all ${animation.duration.normal}`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.semantic.dangerLight}
                  onMouseLeave={(e) => e.currentTarget.style.background = colors.semantic.dangerLight}
                >
                  <Trash2 size={14} /> {selectedTasks.length} Sil
                </button>
              )}
              <button
                onClick={toggleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1.5],
                  padding: `${spacing[2]} ${spacing[3.5]}`,
                  borderRadius: radius.md,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: typography.fontSize.md,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.normal}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.dark.bg.hover}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {selectedTasks.length === list.tasks.length ? <CheckSquare size={14} /> : <Square size={14} />}
                Tümünü Seç
              </button>
            </div>
          </div>

          {/* Task List */}
          <div style={{
            maxHeight: '250px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[2],
            paddingRight: spacing[1],
          }}>
            {visibleTasks.length === 0 ? (
              <div style={{
                padding: spacing[6],
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: typography.fontSize.lg,
              }}>
                Bu listede görev yok
              </div>
            ) : (
              visibleTasks.map((task: Task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskSelection(task.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    padding: `${spacing[3]} ${spacing[3.5]}`,
                    borderRadius: radius.lg,
                    background: selectedTasks.includes(task.id)
                      ? colors.brand.primaryLight
                      : colors.dark.glass.bg,
                    border: selectedTasks.includes(task.id)
                      ? `1px solid ${colors.brand.primary}50`
                      : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: `all ${animation.duration.fast} ease`,
                  }}
                >
                  <div style={{
                    color: selectedTasks.includes(task.id) ? 'var(--primary)' : 'var(--text-muted)',
                    transition: `color ${animation.duration.fast}`,
                  }}>
                    {selectedTasks.includes(task.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span style={{
                    flex: 1,
                    fontSize: typography.fontSize.lg,
                    color: task.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    {task.title}
                  </span>
                  {task.isCompleted && (
                    <span style={{
                      fontSize: typography.fontSize.xs,
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: radius.sm,
                      background: colors.semantic.successLight,
                      color: 'var(--success)',
                      fontWeight: typography.fontWeight.semibold,
                    }}>
                      Tamamlandı
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing[4], marginTop: spacing[3] }}>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: `${spacing[3]} ${spacing[6]}`, fontWeight: typography.fontWeight.semibold }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving || !name.trim()}
            style={{
              padding: `${spacing[3]} ${spacing[7]}`,
              fontWeight: typography.fontWeight.bold,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2.5],
              boxShadow: shadows.focusPrimary
            }}
          >
            {isSaving ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        {/* Undo Bar */}
        {showUndoBar && (
          <div style={{
            position: 'absolute',
            bottom: spacing[6],
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: spacing[4],
            padding: `${spacing[3]} ${spacing[5]}`,
            borderRadius: radius.lg,
            background: colors.dark.bg.elevated,
            border: '1px solid var(--border)',
            boxShadow: shadows.dropdown,
            animation: `slideUp ${animation.duration.slow} ${animation.easing.smooth}`,
          }}>
            <span style={{ fontSize: typography.fontSize.lg, color: 'var(--text-main)' }}>
              {deletedTaskIds.length} görev siliniyor...
            </span>
            <button
              onClick={handleUndo}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: radius.md,
                border: 'none',
                background: 'var(--primary)',
                color: cssVars.textInverse,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                cursor: 'pointer',
              }}
            >
              Geri Al
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
