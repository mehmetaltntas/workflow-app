import React, { useState } from "react";
import { X, Save, Link as LinkIcon, Type, Calendar, Tag, Check, Flag, ListChecks, Plus, Trash2, Square, CheckSquare, Edit3 } from "lucide-react";
import type { Task, Label, Priority, Subtask } from "../types";
import { subtaskService } from "../services/api";
import { colors, cssVars, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";
import { SubtaskEditModal } from "./SubtaskEditModal";

interface TaskEditModalProps {
  task: Task;
  boardLabels?: Label[];
  onClose: () => void;
  onSave: (taskId: number, updates: Partial<Task> & { labelIds?: number[]; priority?: Priority }) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'NONE', label: 'Yok', color: colors.dark.text.tertiary },
  { value: 'LOW', label: 'Düşük', color: colors.priority.low },
  { value: 'MEDIUM', label: 'Orta', color: colors.priority.medium },
  { value: 'HIGH', label: 'Yüksek', color: colors.priority.high },
];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, boardLabels = [], onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [link, setLink] = useState(task.link || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [priority, setPriority] = useState<Priority>(task.priority || 'NONE');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    task.labels?.map(l => l.id) || []
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  // Subtask handlers
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      const newSubtask = await subtaskService.createSubtask({
        title: newSubtaskTitle.trim(),
        taskId: task.id,
      });
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
    } catch (error) {
      console.error("Alt görev eklenemedi:", error);
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      const updatedSubtask = await subtaskService.toggleSubtask(subtaskId);
      setSubtasks(subtasks.map(s => s.id === subtaskId ? updatedSubtask : s));
    } catch (error) {
      console.error("Alt görev güncellenemedi:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtaskService.deleteSubtask(subtaskId);
      setSubtasks(subtasks.filter(s => s.id !== subtaskId));
    } catch (error) {
      console.error("Alt görev silinemedi:", error);
    }
  };

  const handleUpdateSubtask = async (subtaskId: number, updates: {
    title?: string;
    description?: string;
    link?: string;
    dueDate?: string | null;
    priority?: string;
    labelIds?: number[];
  }) => {
    try {
      const updatedSubtask = await subtaskService.updateSubtask(subtaskId, updates);
      setSubtasks(subtasks.map(s => s.id === subtaskId ? updatedSubtask : s));
    } catch (error) {
      console.error("Alt görev güncellenemedi:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(task.id, {
        title,
        link,
        dueDate: dueDate || null,
        priority,
        labelIds: selectedLabelIds
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    {editingSubtask && (
      <SubtaskEditModal
        subtask={editingSubtask}
        boardLabels={boardLabels}
        onClose={() => setEditingSubtask(null)}
        onSave={handleUpdateSubtask}
      />
    )}
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
          width: "550px",
          borderRadius: radius['2xl'],
          padding: spacing[8],
          display: "flex",
          flexDirection: "column",
          gap: spacing[6],
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: shadows.modal,
          border: '1px solid var(--border)',
          animation: `modalFadeIn ${animation.duration.slow} ${animation.easing.smooth}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], color: "var(--text-main)" }}>
            <div style={{ padding: spacing[2.5], backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: radius.lg }}>
              <Type size={20} className="text-primary" />
            </div>
            <h3 style={{ margin: 0, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, letterSpacing: typography.letterSpacing.tighter }}>Görevi Düzenle</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>Başlık</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Görev başlığı..."
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

          {/* Description field removed - only title and link editable */}

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
              <LinkIcon size={14} /> Link
            </label>
            <div style={{ position: 'relative' }}>
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

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
              <Calendar size={14} /> Son Tarih
            </label>
            <div style={{ display: 'flex', gap: spacing[2] }}>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: radius.lg,
                  border: '1px solid var(--border)',
                  background: colors.dark.glass.bg,
                  color: cssVars.textMain,
                  fontSize: typography.fontSize.lg,
                  outline: 'none',
                  fontWeight: typography.fontWeight.medium,
                  colorScheme: 'dark'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  style={{
                    padding: `${spacing[3]} ${spacing[4]}`,
                    borderRadius: radius.lg,
                    border: '1px solid var(--border)',
                    background: colors.dark.glass.bg,
                    color: 'var(--text-muted)',
                    fontSize: typography.fontSize.md,
                    cursor: 'pointer',
                    transition: `all ${animation.duration.normal}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--danger)';
                    e.currentTarget.style.color = 'var(--danger)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  Kaldır
                </button>
              )}
            </div>
          </div>

          {/* Priority Section */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
              <Flag size={14} /> Öncelik
            </label>
            <div style={{ display: 'flex', gap: spacing[2] }}>
              {PRIORITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[1.5],
                    padding: `${spacing[2.5]} ${spacing[3]}`,
                    borderRadius: radius.md,
                    border: priority === option.value
                      ? `1px solid ${option.color}`
                      : `1px solid ${cssVars.borderStrong}`,
                    background: priority === option.value
                      ? `${option.color}20`
                      : colors.dark.glass.bg,
                    color: priority === option.value
                      ? option.color
                      : colors.dark.text.secondary,
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    transition: `all ${animation.duration.normal}`,
                  }}
                  onMouseEnter={(e) => {
                    if (priority !== option.value) {
                      e.currentTarget.style.borderColor = `${option.color}60`;
                      e.currentTarget.style.background = `${option.color}10`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (priority !== option.value) {
                      e.currentTarget.style.borderColor = cssVars.borderStrong;
                      e.currentTarget.style.background = colors.dark.glass.bg;
                    }
                  }}
                >
                  {option.value !== 'NONE' && <Flag size={12} />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Labels Section */}
          {boardLabels.length > 0 && (
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
                <Tag size={14} /> Etiketler
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                {boardLabels.map(label => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[1.5],
                        padding: `${spacing[2]} ${spacing[3]}`,
                        borderRadius: radius.md,
                        border: `1px solid ${isSelected ? label.color : cssVars.borderStrong}`,
                        background: isSelected ? `${label.color}25` : colors.dark.glass.bg,
                        color: isSelected ? label.color : colors.dark.text.secondary,
                        fontSize: typography.fontSize.md,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                        transition: `all ${animation.duration.normal}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = `${label.color}60`;
                          e.currentTarget.style.background = `${label.color}15`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = cssVars.borderStrong;
                          e.currentTarget.style.background = colors.dark.glass.bg;
                        }
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtasks Section */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>
              <ListChecks size={14} /> Alt Görevler
              {subtasks.length > 0 && (
                <span style={{
                  fontSize: typography.fontSize.xs,
                  background: cssVars.borderStrong,
                  padding: `${spacing[0.5]} ${spacing[1.5]}`,
                  borderRadius: radius.sm,
                  fontWeight: typography.fontWeight.semibold
                }}>
                  {subtasks.filter(s => s.isCompleted).length}/{subtasks.length}
                </span>
              )}
            </label>

            {/* Subtask List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1.5], marginBottom: subtasks.length > 0 ? spacing[2.5] : '0' }}>
              {subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2.5],
                    padding: `${spacing[2.5]} ${spacing[3]}`,
                    borderRadius: radius.md,
                    background: subtask.isCompleted ? colors.semantic.successLight : colors.dark.glass.bg,
                    border: subtask.isCompleted ? `1px solid ${colors.semantic.success}26` : `1px solid ${colors.dark.border.subtle}`,
                    transition: `all ${animation.duration.normal}`,
                  }}
                  className="group/subtask"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: spacing[0.5],
                      display: 'flex',
                      color: subtask.isCompleted ? 'var(--success)' : colors.dark.text.tertiary,
                      transition: `color ${animation.duration.normal}`,
                    }}
                  >
                    {subtask.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                  <span style={{
                    flex: 1,
                    fontSize: typography.fontSize.base,
                    color: subtask.isCompleted ? colors.dark.text.tertiary : colors.dark.text.secondary,
                    textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                  }}>
                    {subtask.title}
                  </span>
                  {/* Subtask info indicators */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1.5] }}>
                    {subtask.dueDate && (
                      <span style={{ fontSize: typography.fontSize.xs, color: colors.dark.text.tertiary, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Calendar size={10} />
                      </span>
                    )}
                    {subtask.priority && subtask.priority !== 'NONE' && (
                      <span style={{ fontSize: typography.fontSize.xs, color: colors.priority[subtask.priority.toLowerCase() as 'high' | 'medium' | 'low'], display: 'flex', alignItems: 'center' }}>
                        <Flag size={10} />
                      </span>
                    )}
                    {subtask.link && (
                      <span style={{ fontSize: typography.fontSize.xs, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                        <LinkIcon size={10} />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSubtask(subtask);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: spacing[1],
                      display: 'flex',
                      color: colors.dark.text.subtle,
                      opacity: 0,
                      transition: `all ${animation.duration.normal}`,
                      borderRadius: radius.sm,
                    }}
                    className="group-hover/subtask:!opacity-100"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.background = colors.brand.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.dark.text.subtle;
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubtask(subtask.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: spacing[1],
                      display: 'flex',
                      color: colors.dark.text.subtle,
                      opacity: 0,
                      transition: `all ${animation.duration.normal}`,
                      borderRadius: radius.sm,
                    }}
                    className="group-hover/subtask:!opacity-100"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--danger)';
                      e.currentTarget.style.background = colors.semantic.dangerLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.dark.text.subtle;
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask */}
            {isAddingSubtask ? (
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <input
                  autoFocus
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Alt görev başlığı..."
                  style={{
                    flex: 1,
                    padding: `${spacing[2.5]} ${spacing[3]}`,
                    borderRadius: radius.md,
                    border: '1px solid var(--border)',
                    background: colors.dark.glass.bg,
                    color: cssVars.textMain,
                    fontSize: typography.fontSize.base,
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubtask();
                    if (e.key === 'Escape') {
                      setIsAddingSubtask(false);
                      setNewSubtaskTitle("");
                    }
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="btn btn-primary"
                  style={{ padding: `${spacing[2.5]} ${spacing[4]}`, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold }}
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubtask(false);
                    setNewSubtaskTitle("");
                  }}
                  className="btn btn-ghost"
                  style={{ padding: spacing[2.5] }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingSubtask(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1.5],
                  padding: `${spacing[2.5]} ${spacing[3.5]}`,
                  borderRadius: radius.md,
                  border: `1px dashed ${cssVars.borderStrong}`,
                  background: 'transparent',
                  color: colors.dark.text.tertiary,
                  fontSize: typography.fontSize.md,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.normal}`,
                  width: '100%',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary + '66';
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.background = colors.brand.primaryLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = cssVars.borderStrong;
                  e.currentTarget.style.color = colors.dark.text.tertiary;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Plus size={14} /> Alt Görev Ekle
              </button>
            )}
          </div>
        </div>

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
            disabled={isSaving || !title.trim()}
            style={{
              padding: `${spacing[3]} ${spacing[7]}`,
              fontWeight: typography.fontWeight.bold,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2.5],
              boxShadow: '0 4px 14px 0 rgba(var(--primary-rgb), 0.39)'
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
      </div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
    </>
  );
};
