import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Target,
  ListChecks,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { Board, BoardMember, BoardMemberAssignment } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";

interface AssignMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: BoardMember | null;
  board: Board;
  onCreateAssignment: (memberId: number, targetType: string, targetId: number) => void;
  onRemoveAssignment: (memberId: number, assignmentId: number) => void;
  onCreateBulkAssignment?: (memberId: number, assignments: { targetType: string; targetId: number }[]) => void;
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  LIST: "Liste",
};

const TARGET_TYPE_ICONS: Record<string, React.ReactNode> = {
  LIST: <ListChecks size={14} />,
};

const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  board,
  onCreateAssignment,
  onRemoveAssignment,
  onCreateBulkAssignment,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === "light";
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedTargets, setSelectedTargets] = useState<{ targetType: string; targetId: number }[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  const handleClose = useCallback(() => {
    setSelectedTargets([]);
    setBulkMode(false);
    onClose();
  }, [onClose]);

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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  if (!isOpen || !member) return null;

  const assignments = (member.assignments || []).filter((a) => a.targetType === "LIST");
  const assignedSet = new Set(
    assignments.map((a) => `${a.targetType}:${a.targetId}`)
  );

  const isAssigned = (targetType: string, targetId: number) =>
    assignedSet.has(`${targetType}:${targetId}`);

  const getAssignment = (targetType: string, targetId: number): BoardMemberAssignment | undefined =>
    assignments.find((a) => a.targetType === targetType && a.targetId === targetId);

  const isSelected = (targetType: string, targetId: number) =>
    selectedTargets.some((t) => t.targetType === targetType && t.targetId === targetId);

  const toggleSelection = (targetType: string, targetId: number) => {
    if (isAssigned(targetType, targetId)) return;
    setSelectedTargets((prev) => {
      const exists = prev.some((t) => t.targetType === targetType && t.targetId === targetId);
      if (exists) {
        return prev.filter((t) => !(t.targetType === targetType && t.targetId === targetId));
      }
      return [...prev, { targetType, targetId }];
    });
  };

  const handleToggleBulkMode = () => {
    setSelectedTargets([]);
    setBulkMode((prev) => !prev);
  };

  const handleBulkAssign = () => {
    if (selectedTargets.length === 0 || !onCreateBulkAssignment) return;
    onCreateBulkAssignment(member.id, selectedTargets);
    setSelectedTargets([]);
    setBulkMode(false);
  };

  const itemStyle = (isActive: boolean, isChecked?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing[2.5]} ${spacing[3]}`,
    borderRadius: radius.lg,
    background: isActive
      ? isLight
        ? colors.brand.primaryLight
        : `${colors.brand.primary}15`
      : isChecked
        ? isLight
          ? `${colors.brand.primary}08`
          : `${colors.brand.primary}10`
        : "transparent",
    border: `1px solid ${isActive ? `${colors.brand.primary}40` : isChecked ? `${colors.brand.primary}25` : "transparent"}`,
    transition: `all ${animation.duration.fast}`,
  });

  const assignBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2.5]}`,
    borderRadius: radius.md,
    border: "none",
    background: colors.brand.primary,
    color: "#fff",
    cursor: "pointer",
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  };

  const removeBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2.5]}`,
    borderRadius: radius.md,
    border: "none",
    background: colors.semantic.dangerLight,
    color: colors.semantic.danger,
    cursor: "pointer",
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  };

  const checkboxStyle = (checked: boolean, disabled: boolean): React.CSSProperties => ({
    width: "18px",
    height: "18px",
    borderRadius: radius.sm,
    border: `2px solid ${disabled ? themeColors.borderDefault : checked ? colors.brand.primary : cssVars.textMuted}`,
    background: disabled
      ? isLight ? "#f0f0f0" : "#333"
      : checked
        ? colors.brand.primary
        : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: `all ${animation.duration.fast}`,
    flexShrink: 0,
  });

  const renderCheckbox = (targetType: string, targetId: number) => {
    const assigned = isAssigned(targetType, targetId);
    const checked = assigned || isSelected(targetType, targetId);
    return (
      <div
        style={checkboxStyle(checked, assigned)}
        onClick={(e) => {
          e.stopPropagation();
          if (!assigned) toggleSelection(targetType, targetId);
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke={assigned ? (isLight ? "#999" : "#666") : "#fff"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    );
  };

  const renderActionButton = (targetType: string, targetId: number) => {
    const assigned = isAssigned(targetType, targetId);
    const assignment = getAssignment(targetType, targetId);

    if (assigned && assignment) {
      return (
        <button
          onClick={() => onRemoveAssignment(member.id, assignment.id)}
          style={removeBtnStyle}
        >
          <Trash2 size={12} />
          Kaldir
        </button>
      );
    }
    return (
      <button
        onClick={() => onCreateAssignment(member.id, targetType, targetId)}
        style={assignBtnStyle}
      >
        <Target size={12} />
        Ata
      </button>
    );
  };

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
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-assign-member"
        style={{
          width: "100%",
          maxWidth: "560px",
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
            <Target size={20} color={colors.brand.primary} />
            <div>
              <h2
                id="modal-assign-member"
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMain,
                  margin: 0,
                }}
              >
                Atama Yap
              </h2>
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: cssVars.textMuted,
                  margin: 0,
                }}
              >
                {member.username}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
            {onCreateBulkAssignment && (
              <button
                onClick={handleToggleBulkMode}
                title={bulkMode ? "Tekli moda gec" : "Toplu moda gec"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[1.5],
                  padding: `${spacing[1.5]} ${spacing[3]}`,
                  borderRadius: radius.lg,
                  border: `1px solid ${bulkMode ? colors.brand.primary : themeColors.borderDefault}`,
                  background: bulkMode
                    ? isLight ? colors.brand.primaryLight : `${colors.brand.primary}15`
                    : "transparent",
                  color: bulkMode ? colors.brand.primary : cssVars.textMuted,
                  cursor: "pointer",
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  transition: `all ${animation.duration.fast}`,
                }}
              >
                {bulkMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                Toplu
              </button>
            )}
            <button
              onClick={handleClose}
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
        </div>

        {/* Current Assignments */}
        {assignments.length > 0 && (
          <div
            style={{
              padding: `${spacing[4]} ${spacing[6]}`,
              borderBottom: `1px solid ${themeColors.borderDefault}`,
              background: isLight ? `${colors.brand.primary}05` : `${colors.brand.primary}08`,
            }}
          >
            <p
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMuted,
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wide,
                margin: 0,
                marginBottom: spacing[3],
              }}
            >
              Mevcut Atamalar ({assignments.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[2] }}>
              {assignments.map((a) => (
                <span
                  key={a.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: spacing[1.5],
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.brand.primary,
                    background: colors.brand.primaryLight,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: radius.full,
                  }}
                >
                  {TARGET_TYPE_ICONS[a.targetType]}
                  {a.targetName || `${TARGET_TYPE_LABELS[a.targetType]} #${a.targetId}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hierarchy Tree */}
        <div style={{ flex: 1, overflow: "auto", padding: spacing[4] }}>
          {(!board.taskLists || board.taskLists.length === 0) ? (
            <p style={{ color: cssVars.textMuted, textAlign: "center", padding: spacing[8] }}>
              Bu panoda henuz liste bulunmamaktadir
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
              {board.taskLists.map((list) => {
                const listAssigned = isAssigned("LIST", list.id);
                const listSelected = isSelected("LIST", list.id);

                return (
                  <div key={list.id}>
                    <div style={itemStyle(listAssigned, listSelected)}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2],
                          cursor: bulkMode && !listAssigned ? "pointer" : "default",
                          flex: 1,
                        }}
                        onClick={() => {
                          if (bulkMode) toggleSelection("LIST", list.id);
                        }}
                      >
                        {bulkMode && renderCheckbox("LIST", list.id)}
                        <ListChecks size={16} color={listAssigned ? colors.brand.primary : cssVars.textMuted} />
                        <span
                          style={{
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            color: listAssigned ? colors.brand.primary : cssVars.textMain,
                          }}
                        >
                          {list.name}
                        </span>
                      </div>
                      {!bulkMode && renderActionButton("LIST", list.id)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulk Mode Footer */}
        {bulkMode && selectedTargets.length > 0 && (
          <div
            style={{
              padding: `${spacing[4]} ${spacing[6]}`,
              borderTop: `1px solid ${themeColors.borderDefault}`,
              background: isLight ? colors.light.bg.card : colors.dark.bg.card,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: cssVars.textMuted,
              }}
            >
              {selectedTargets.length} hedef secildi
            </span>
            <button
              onClick={handleBulkAssign}
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                padding: `${spacing[2.5]} ${spacing[5]}`,
                borderRadius: radius.lg,
                border: "none",
                background: colors.brand.primary,
                color: "#fff",
                cursor: "pointer",
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                transition: `all ${animation.duration.fast}`,
              }}
            >
              <Target size={16} />
              Secilenleri Ata ({selectedTargets.length})
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AssignMemberModal;
