import React, { useEffect, useState, useCallback, useRef } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

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
          background: "rgba(22, 22, 26, 0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: `
            0 24px 48px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            ${isDanger ? "0 0 80px -20px rgba(239, 68, 68, 0.15)" : "0 0 80px -20px rgba(245, 158, 11, 0.15)"}
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
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: isDanger 
                ? "linear-gradient(90deg, #ef4444, #f87171)" 
                : "linear-gradient(90deg, #f59e0b, #fbbf24)",
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
                  ? "rgba(239, 68, 68, 0.12)" 
                  : "rgba(245, 158, 11, 0.12)",
                flexShrink: 0,
              }}
            >
              {isDanger ? (
                <Trash2 size={20} color="#ef4444" strokeWidth={2} />
              ) : (
                <AlertTriangle size={20} color="#f59e0b" strokeWidth={2} />
              )}
            </div>

            {/* Text Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#fff",
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
                    color: "rgba(255, 255, 255, 0.5)",
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
                background: "rgba(255, 255, 255, 0.05)",
                color: "rgba(255, 255, 255, 0.4)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
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
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
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
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isDanger
                ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                : "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = isDanger
                ? "0 6px 16px rgba(239, 68, 68, 0.4)"
                : "0 6px 16px rgba(245, 158, 11, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isDanger
                ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                : "0 4px 12px rgba(245, 158, 11, 0.3)";
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
