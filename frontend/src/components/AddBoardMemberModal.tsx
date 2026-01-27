import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, User as UserIcon } from "lucide-react";
import type { BoardMember } from "../types";
import { useAcceptedConnections } from "../hooks/queries/useConnectionMutations";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";

interface AddBoardMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (userId: number) => void;
  existingMembers: BoardMember[];
}

const AddBoardMemberModal: React.FC<AddBoardMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  existingMembers,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === "light";
  const modalRef = useRef<HTMLDivElement>(null);
  const currentUsername = useAuthStore((s) => s.username);

  const { data: connections = [], isLoading } = useAcceptedConnections();

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.style.overflow = "hidden";
    return () => {
      if (mainEl) mainEl.style.overflow = "";
    };
  }, [isOpen]);

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
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
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
    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter connections: exclude already-added members
  const existingUserIds = new Set(existingMembers.map((m) => m.userId));
  const availableConnections = connections.filter((conn) => {
    // Find the "other" user in the connection
    const otherUserId =
      conn.senderUsername === currentUsername ? conn.receiverId : conn.senderId;
    return !existingUserIds.has(otherUserId);
  });

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isLight ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.75)",
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-member"
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "80vh",
          background: isLight ? colors.light.bg.card : colors.dark.bg.card,
          borderRadius: radius["2xl"],
          border: `1px solid ${themeColors.borderDefault}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: `fadeIn ${animation.duration.normal} ${animation.easing.spring}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${spacing[5]} ${spacing[6]}`,
            borderBottom: `1px solid ${themeColors.borderDefault}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
            <UserPlus size={20} color={colors.brand.primary} />
            <h2
              id="modal-add-member"
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0,
              }}
            >
              Sorumlu Kisi Ekle
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: spacing[8],
              height: spacing[8],
              borderRadius: radius.lg,
              border: "none",
              background: "transparent",
              color: cssVars.textMuted,
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: spacing[6],
          }}
        >
          {isLoading ? (
            <p style={{ color: cssVars.textMuted, textAlign: "center" }}>
              Yükleniyor...
            </p>
          ) : availableConnections.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: spacing[8],
                color: cssVars.textMuted,
              }}
            >
              <UserIcon size={40} style={{ opacity: 0.3, marginBottom: spacing[3] }} />
              <p style={{ fontSize: typography.fontSize.base, margin: 0 }}>
                Eklenebilecek baglanti bulunamadi
              </p>
              <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing[2], opacity: 0.7 }}>
                Tüm baglantilariniz zaten bu panoya eklenmis
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
              {availableConnections.map((conn) => {
                const isCurrentSender = conn.senderUsername === currentUsername;
                const otherUserId = isCurrentSender ? conn.receiverId : conn.senderId;
                const otherUsername = isCurrentSender
                  ? conn.receiverUsername
                  : conn.senderUsername;
                const otherPicture = isCurrentSender
                  ? conn.receiverProfilePicture
                  : conn.senderProfilePicture;

                return (
                  <div
                    key={conn.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderRadius: radius.xl,
                      border: `1px solid ${themeColors.borderDefault}`,
                      background: isLight ? colors.light.bg.card : "transparent",
                      transition: `background ${animation.duration.fast}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[3],
                      }}
                    >
                      {otherPicture ? (
                        <img
                          src={otherPicture}
                          alt={otherUsername}
                          style={{
                            width: spacing[10],
                            height: spacing[10],
                            borderRadius: radius.full,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: spacing[10],
                            height: spacing[10],
                            borderRadius: radius.full,
                            background: colors.brand.primaryLight,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.brand.primary,
                            fontWeight: typography.fontWeight.bold,
                            fontSize: typography.fontSize.base,
                          }}
                        >
                          {otherUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.medium,
                          color: cssVars.textMain,
                        }}
                      >
                        {otherUsername}
                      </span>
                    </div>
                    <button
                      onClick={() => onAddMember(otherUserId)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[1.5],
                        padding: `${spacing[2]} ${spacing[4]}`,
                        borderRadius: radius.lg,
                        border: "none",
                        background: colors.brand.primary,
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: typography.fontWeight.semibold,
                        fontSize: typography.fontSize.sm,
                        transition: `background ${animation.duration.fast}`,
                      }}
                    >
                      <UserPlus size={14} />
                      Ekle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddBoardMemberModal;
