import React, { useState } from "react";
import { X, Save, Link as LinkIcon, Type, Calendar } from "lucide-react";
import type { Task } from "../types";

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: number, updates: Partial<Task>) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [link, setLink] = useState(task.link || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(task.id, { title, link, dueDate: dueDate || null });
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
