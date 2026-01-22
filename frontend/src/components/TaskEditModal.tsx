import React, { useState } from "react";
import { X, Save, Link as LinkIcon, Type, Calendar, Tag, Check, Flag, ListChecks, Plus, Trash2, Square, CheckSquare } from "lucide-react";
import type { Task, Label, Priority, Subtask } from "../types";
import { subtaskService } from "../services/api";

interface TaskEditModalProps {
  task: Task;
  boardLabels?: Label[];
  onClose: () => void;
  onSave: (taskId: number, updates: Partial<Task> & { labelIds?: number[]; priority?: Priority }) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'NONE', label: 'Yok', color: 'rgba(255,255,255,0.4)' },
  { value: 'LOW', label: 'Düşük', color: '#22c55e' },
  { value: 'MEDIUM', label: 'Orta', color: '#f59e0b' },
  { value: 'HIGH', label: 'Yüksek', color: '#ef4444' },
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
      const response = await subtaskService.createSubtask({
        title: newSubtaskTitle.trim(),
        taskId: task.id,
      });
      setSubtasks([...subtasks, response.data]);
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
    } catch (error) {
      console.error("Alt görev eklenemedi:", error);
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      const response = await subtaskService.toggleSubtask(subtaskId);
      setSubtasks(subtasks.map(s => s.id === subtaskId ? response.data : s));
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
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div 
        className="modal-content glass"
        style={{
          width: "550px",
          borderRadius: "20px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: '1px solid var(--border)',
          animation: 'modalFadeIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '12px' }}>
              <Type size={20} className="text-primary" />
            </div>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "700", letterSpacing: '-0.02em' }}>Görevi Düzenle</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Başlık</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Görev başlığı..."
              autoFocus
              style={{ 
                width: "100%",
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Description field removed - only title and link editable */}

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--primary)',
                  fontSize: '14px',
                  outline: 'none',
                  fontWeight: '500'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Calendar size={14} /> Son Tarih
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  fontWeight: '500',
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
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
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
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Flag size={14} /> Öncelik
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                    gap: '6px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: priority === option.value
                      ? `1px solid ${option.color}`
                      : '1px solid rgba(255,255,255,0.1)',
                    background: priority === option.value
                      ? `${option.color}20`
                      : 'rgba(255,255,255,0.03)',
                    color: priority === option.value
                      ? option.color
                      : 'rgba(255,255,255,0.6)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (priority !== option.value) {
                      e.currentTarget.style.borderColor = `${option.color}60`;
                      e.currentTarget.style.background = `${option.color}10`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (priority !== option.value) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
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
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Tag size={14} /> Etiketler
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${isSelected ? label.color : 'rgba(255,255,255,0.1)'}`,
                        background: isSelected ? `${label.color}25` : 'rgba(255,255,255,0.03)',
                        color: isSelected ? label.color : 'rgba(255,255,255,0.6)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = `${label.color}60`;
                          e.currentTarget.style.background = `${label.color}15`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
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
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <ListChecks size={14} /> Alt Görevler
              {subtasks.length > 0 && (
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>
                  {subtasks.filter(s => s.isCompleted).length}/{subtasks.length}
                </span>
              )}
            </label>

            {/* Subtask List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: subtasks.length > 0 ? '10px' : '0' }}>
              {subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: subtask.isCompleted ? 'rgba(81, 207, 102, 0.08)' : 'rgba(255,255,255,0.03)',
                    border: subtask.isCompleted ? '1px solid rgba(81, 207, 102, 0.15)' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
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
                      padding: '2px',
                      display: 'flex',
                      color: subtask.isCompleted ? 'var(--success)' : 'rgba(255,255,255,0.4)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {subtask.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    color: subtask.isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                    textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                  }}>
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 0,
                      transition: 'all 0.2s',
                      borderRadius: '4px',
                    }}
                    className="group-hover/subtask:!opacity-100"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--danger)';
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  autoFocus
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Alt görev başlığı..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    fontSize: '13px',
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
                  style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '600' }}
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
                  style={{ padding: '10px' }}
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
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(77, 171, 247, 0.4)';
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.background = 'rgba(77, 171, 247, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Plus size={14} /> Alt Görev Ekle
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "12px" }}>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '12px 24px', fontWeight: '600' }}
          >
            İptal
          </button>
          <button
            onClick={handleSave} 
            className="btn btn-primary"
            disabled={isSaving || !title.trim()}
            style={{ 
              padding: '12px 28px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
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
  );
};
