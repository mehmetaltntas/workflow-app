import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { colors, cssVars, typography, spacing, radius, shadows, zIndex, animation } from "../styles/tokens";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmationModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Evet, Sil",
  cancelText = "İptal",
  variant = "danger"
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="text-red-400" size={24} />,
          buttonClass: "bg-red-500 hover:bg-red-600 text-white",
          iconBg: colors.semantic.dangerLight
        };
      case "warning":
        return {
          icon: <AlertTriangle className="text-amber-400" size={24} />,
          buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
          iconBg: colors.semantic.warningLight
        };
      default:
        return {
          icon: <AlertTriangle className="text-blue-400" size={24} />,
          buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
          iconBg: colors.semantic.infoLight
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ animation: `fadeIn ${animation.duration.normal} ${animation.easing.smooth}`, zIndex: zIndex.modal }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-[8px]"
        onClick={onCancel}
      />

      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title-confirmation"
        className="relative w-full max-w-[400px] border border-white/10 overflow-hidden"
        style={{
          background: cssVars.bgSecondary,
          animation: `modalEntrance ${animation.duration.slow} ${animation.easing.spring}`,
          borderRadius: radius['2xl'],
          boxShadow: shadows.modal
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Kapat"
          className="absolute text-gray-500 hover:bg-white/5 hover:text-white transition-all"
          style={{ top: spacing[5], right: spacing[5], padding: spacing[2], borderRadius: radius.lg }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: spacing[10] }}>
          <div className="flex flex-col items-center text-center">
            <div
              style={{ backgroundColor: styles.iconBg, padding: spacing[5], borderRadius: radius.xl, marginBottom: spacing[6] }}
            >
              {styles.icon}
            </div>

            <h3 id="modal-title-confirmation" style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: cssVars.textMain, marginBottom: spacing[3], letterSpacing: typography.letterSpacing.tight }}>
              {title}
            </h3>

            <p style={{ color: cssVars.textMuted, fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.relaxed, marginBottom: spacing[8], paddingLeft: spacing[2], paddingRight: spacing[2] }}>
              {message}
            </p>

            <div style={{ display: 'flex', gap: spacing[3], width: '100%' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: `${spacing[3.5]} ${spacing[4]}`,
                  borderRadius: radius.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMuted,
                  background: colors.dark.bg.hover,
                  border: `1px solid ${colors.dark.border.subtle}`,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.normal}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.dark.bg.active;
                  e.currentTarget.style.color = cssVars.textMain;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.dark.bg.hover;
                  e.currentTarget.style.color = cssVars.textMuted;
                }}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={styles.buttonClass}
                style={{
                  flex: 1,
                  padding: `${spacing[3.5]} ${spacing[4]}`,
                  borderRadius: radius.xl,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.normal}`,
                  boxShadow: shadows.md
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalEntrance {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};


