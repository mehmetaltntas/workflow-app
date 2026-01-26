import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, Tag, List } from "lucide-react";
import type { Label } from "../types";
import { colors, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";

interface TaskListUsage {
  id: number;
  name: string;
}

interface LabelDeleteConfirmModalProps {
  label: Label;
  affectedLists: TaskListUsage[];
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LabelDeleteConfirmModal: React.FC<LabelDeleteConfirmModalProps> = ({
  label,
  affectedLists,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.dark.bg.overlay,
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndex.modal + 10,
      }}
    >
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title-label-delete"
        className="modal-content glass"
        style={{
          width: "420px",
          maxHeight: "70vh",
          borderRadius: radius['2xl'],
          padding: spacing[6],
          display: "flex",
          flexDirection: "column",
          gap: spacing[5],
          position: "relative",
          background: "var(--bg-card)",
          boxShadow: shadows.modal,
          border: "1px solid var(--border)",
          animation: `modalFadeIn ${animation.duration.slow} ${animation.easing.smooth}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], color: "var(--danger)" }}>
            <div style={{ padding: spacing[2.5], backgroundColor: colors.semantic.dangerLight, borderRadius: radius.lg }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 id="modal-title-label-delete" style={{ margin: 0, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: "var(--text-main)" }}>
                Etiketi Sil
              </h3>
            </div>
          </div>
          <button onClick={onCancel} aria-label="Kapat" className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Label Preview */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            padding: spacing[3],
            borderRadius: radius.lg,
            background: colors.dark.glass.bg,
            border: `1px solid ${colors.dark.border.subtle}`,
          }}
        >
          <div
            style={{
              width: spacing[8],
              height: spacing[8],
              borderRadius: radius.md,
              background: `${label.color}30`,
              border: `2px solid ${label.color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Tag size={14} style={{ color: label.color }} />
          </div>
          <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: "var(--text-main)" }}>
            {label.name}
          </span>
        </div>

        {/* Warning Message */}
        <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Bu etiketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>

        {/* Affected Lists */}
        {affectedLists.length > 0 && (
          <div
            style={{
              padding: spacing[3],
              borderRadius: radius.lg,
              background: colors.semantic.warningLight,
              border: `1px solid ${colors.semantic.warning}40`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
              <List size={14} style={{ color: colors.semantic.warning }} />
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.semantic.warning }}>
                Bu etiket {affectedLists.length} listede kullanılıyor:
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[1], maxHeight: "120px", overflowY: "auto" }}>
              {affectedLists.map((list) => (
                <div
                  key={list.id}
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: "var(--text-muted)",
                    paddingLeft: spacing[4],
                  }}
                >
                  • {list.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: spacing[3], marginTop: spacing[1] }}>
          <button
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ flex: 1, height: spacing[10], fontSize: typography.fontSize.base }}
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn"
            style={{
              flex: 1,
              height: spacing[10],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              background: "var(--danger)",
              color: "white",
              border: "none",
              cursor: isLoading ? "wait" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Siliniyor..." : "Sil"}
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
