import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { colors } from "../styles/tokens";
import "./ConfirmationModal.css";

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
      className="confirmation-modal__overlay"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div
        className="confirmation-modal__backdrop"
        onClick={onCancel}
      />

      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title-confirmation"
        className="confirmation-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Kapat"
          className="confirmation-modal__close-btn"
        >
          <X size={18} />
        </button>

        <div className="confirmation-modal__content">
          <div
            className="confirmation-modal__icon"
            style={{ backgroundColor: styles.iconBg }}
          >
            {styles.icon}
          </div>

          <h3 id="modal-title-confirmation" className="confirmation-modal__title">
            {title}
          </h3>

          <p className="confirmation-modal__message">
            {message}
          </p>

          <div className="confirmation-modal__actions">
            <button
              onClick={onCancel}
              className="confirmation-modal__cancel-btn"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`confirmation-modal__confirm-btn ${styles.buttonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
