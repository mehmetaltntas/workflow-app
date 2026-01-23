import React, { useEffect, useState, useCallback, useRef } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { colors, cssVars, shadows } from "../styles/tokens";

interface DeleteConfirmationProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  variant?: "danger" | "warning";
  autoCloseDelay?: number;
}

// Inner component that mounts/unmounts based on isOpen
const DeleteConfirmationContent: React.FC<
  Omit<DeleteConfirmationProps, "isOpen"> & { onAnimationEnd: () => void }
> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Sil",
  variant = "danger",
  autoCloseDelay = 5000,
  onAnimationEnd,
}) => {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClose = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
      onAnimationEnd();
    }, 200);
  }, [onCancel, onAnimationEnd]);

  const handleConfirm = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsClosing(true);
    setTimeout(() => {
      onConfirm();
      onAnimationEnd();
    }, 150);
  }, [onConfirm, onAnimationEnd]);

  // Auto-close countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (autoCloseDelay / 50));
        if (newProgress <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          handleClose();
          return 0;
        }
        return newProgress;
      });
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoCloseDelay, handleClose]);

  const isDanger = variant === "danger";

  return (
    <div
      className={`delete-confirmation ${isClosing ? "closing" : ""}`}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        maxWidth: "380px",
        width: "100%",
        animation: isClosing 
          ? "deleteConfirmSlideOut 0.2s ease-in forwards" 
          : "deleteConfirmSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main Card */}
      <div
        style={{
          background: cssVars.bgCard,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "20px",
          border: `1px solid ${cssVars.border}`,
          boxShadow: `
            ${shadows.xl},
            0 0 0 1px ${colors.dark.border.subtle},
            ${isDanger ? `0 0 80px -20px ${colors.semantic.dangerLight}` : `0 0 80px -20px ${colors.semantic.warningLight}`}
          `,
          overflow: "hidden",
        }}
      >
        {/* Progress Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: colors.dark.border.subtle,
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: isDanger
                ? `linear-gradient(90deg, ${colors.semantic.danger}, ${colors.semantic.dangerDark})`
                : `linear-gradient(90deg, ${colors.semantic.warning}, ${colors.semantic.warningDark})`,
              transition: "width 0.05s linear",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            {/* Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: isDanger
                  ? colors.semantic.dangerLight
                  : colors.semantic.warningLight,
                flexShrink: 0,
              }}
            >
              {isDanger ? (
                <Trash2 size={20} color={colors.semantic.danger} strokeWidth={2} />
              ) : (
                <AlertTriangle size={20} color={colors.semantic.warning} strokeWidth={2} />
              )}
            </div>

            {/* Text Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: cssVars.textMain,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h4>
              {message && (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "13px",
                    color: colors.dark.text.tertiary,
                    lineHeight: 1.5,
                  }}
                >
                  {message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                border: "none",
                background: colors.dark.bg.hover,
                color: colors.dark.text.subtle,
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.dark.bg.active;
                e.currentTarget.style.color = cssVars.textMain;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.dark.bg.hover;
                e.currentTarget.style.color = colors.dark.text.subtle;
              }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "0 20px 20px",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "12px",
              border: `1px solid ${cssVars.border}`,
              background: colors.dark.glass.bg,
              color: colors.dark.text.secondary,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.dark.bg.active;
              e.currentTarget.style.borderColor = cssVars.borderStrong;
              e.currentTarget.style.color = cssVars.textMain;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.dark.glass.bg;
              e.currentTarget.style.borderColor = cssVars.border;
              e.currentTarget.style.color = colors.dark.text.secondary;
            }}
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              background: isDanger
                ? `linear-gradient(135deg, ${colors.semantic.danger} 0%, ${colors.semantic.dangerDark} 100%)`
                : `linear-gradient(135deg, ${colors.semantic.warning} 0%, ${colors.semantic.warningDark} 100%)`,
              color: cssVars.textMain,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isDanger
                ? `0 4px 12px ${colors.semantic.dangerLight}`
                : `0 4px 12px ${colors.semantic.warningLight}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = isDanger
                ? `0 6px 16px ${colors.semantic.danger}66`
                : `0 6px 16px ${colors.semantic.warning}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isDanger
                ? `0 4px 12px ${colors.semantic.dangerLight}`
                : `0 4px 12px ${colors.semantic.warningLight}`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes deleteConfirmSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes deleteConfirmSlideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
        }
      `}</style>
    </div>
  );
};

// Simple wrapper component
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  ...props
}) => {
  const noop = useCallback(() => {}, []);

  if (!isOpen) return null;

  return (
    <DeleteConfirmationContent
      {...props}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onAnimationEnd={noop}
    />
  );
};
