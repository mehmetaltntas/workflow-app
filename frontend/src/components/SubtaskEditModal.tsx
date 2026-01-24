import React, { useState } from "react";
import { X, Save, Link as LinkIcon, ListChecks } from "lucide-react";
import type { Subtask } from "../types";
import { colors, cssVars, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";

interface SubtaskEditModalProps {
  subtask: Subtask;
  onClose: () => void;
  onSave: (subtaskId: number, updates: {
    title?: string;
    description?: string;
    link?: string;
  }) => Promise<void>;
}

export const SubtaskEditModal: React.FC<SubtaskEditModalProps> = ({ subtask, onClose, onSave }) => {
  const [title, setTitle] = useState(subtask.title);
  const [description, setDescription] = useState(subtask.description || "");
  const [link, setLink] = useState(subtask.link || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(subtask.id, {
        title,
        description,
        link,
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
      backgroundColor: colors.dark.bg.overlay,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: zIndex.modal + 10,
    }}>
      <div
        className="modal-content glass"
        style={{
          width: "500px",
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: radius['2xl'],
          padding: spacing[8],
          display: "flex",
          flexDirection: "column",
          gap: spacing[5],
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
              <ListChecks size={20} className="text-primary" />
            </div>
            <h3 style={{ margin: 0, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, letterSpacing: typography.letterSpacing.tighter }}>Alt Görevi Düzenle</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
          {/* Title */}
          <div className="form-group">
            <label style={{ display: "block", fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>Başlık</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Alt görev başlığı..."
              autoFocus
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                borderRadius: radius.lg,
                border: '1px solid var(--border)',
                background: colors.dark.glass.bg,
                color: cssVars.textMain,
                fontSize: typography.fontSize.lg,
                outline: 'none',
                transition: `border-color ${animation.duration.normal}`
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label style={{ display: "block", fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: "var(--text-muted)", marginBottom: spacing[2], textTransform: "uppercase", letterSpacing: typography.letterSpacing.wider }}>Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Alt görev açıklaması..."
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                borderRadius: radius.lg,
                border: '1px solid var(--border)',
                background: colors.dark.glass.bg,
                color: cssVars.textMain,
                fontSize: typography.fontSize.base,
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical',
                transition: `border-color ${animation.duration.normal}`
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Link */}
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
                fontSize: typography.fontSize.base,
                outline: 'none',
                fontWeight: typography.fontWeight.medium
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing[4], marginTop: spacing[2] }}>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: `${spacing[2.5]} ${spacing[5]}`, fontWeight: typography.fontWeight.semibold }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving || !title.trim()}
            style={{
              padding: `${spacing[2.5]} ${spacing[6]}`,
              fontWeight: typography.fontWeight.bold,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              boxShadow: '0 4px 14px 0 rgba(var(--primary-rgb), 0.39)'
            }}
          >
            {isSaving ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save size={16} />
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
