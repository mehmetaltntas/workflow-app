import React, { useState } from "react";
import { X, Save, Link as LinkIcon, Trash2, CheckSquare, Square, Settings } from "lucide-react";
import type { Task, TaskList } from "../types";

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
          width: "650px",
          maxHeight: "80vh",
          borderRadius: "20px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: '1px solid var(--border)',
          animation: 'modalFadeIn 0.3s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(77, 171, 247, 0.1)', borderRadius: '12px' }}>
              <Settings size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "700", letterSpacing: '-0.02em' }}>Listeyi Düzenle</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* List Name and Link */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Liste Adı</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Liste adı..."
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

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <LinkIcon size={14} /> Link
            </label>
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

        {/* Tasks Section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: "12px", fontWeight: '700', color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Görevler ({visibleTasks.length})
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {selectedTasks.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(255, 107, 107, 0.15)',
                    color: 'var(--danger)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.15)'}
                >
                  <Trash2 size={14} /> {selectedTasks.length} Sil
                </button>
              )}
              <button
                onClick={toggleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
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
            gap: '8px',
            paddingRight: '4px',
          }}>
            {visibleTasks.length === 0 ? (
              <div style={{ 
                padding: '24px', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '14px',
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
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: selectedTasks.includes(task.id) 
                      ? 'rgba(77, 171, 247, 0.1)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: selectedTasks.includes(task.id)
                      ? '1px solid rgba(77, 171, 247, 0.3)'
                      : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    color: selectedTasks.includes(task.id) ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'color 0.15s',
                  }}>
                    {selectedTasks.includes(task.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span style={{ 
                    flex: 1, 
                    fontSize: '14px', 
                    color: task.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                    fontWeight: 500,
                  }}>
                    {task.title}
                  </span>
                  {task.isCompleted && (
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(81, 207, 102, 0.1)',
                      color: 'var(--success)',
                      fontWeight: 600,
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
            disabled={isSaving || !name.trim()}
            style={{ 
              padding: '12px 28px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px 0 rgba(77, 171, 247, 0.39)'
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
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 20px',
            borderRadius: '14px',
            background: 'rgba(20, 21, 24, 0.98)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.3s ease-out',
          }}>
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
              {deletedTaskIds.length} görev siliniyor...
            </span>
            <button
              onClick={handleUndo}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary)',
                color: '#000',
                fontSize: '13px',
                fontWeight: '700',
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
