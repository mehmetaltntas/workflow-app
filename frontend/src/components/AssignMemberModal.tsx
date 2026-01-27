import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Target,
  ListChecks,
  CheckSquare,
  Layers,
  ChevronDown,
  ChevronRight,
  Trash2,
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
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  LIST: "Liste",
  TASK: "Görev",
  SUBTASK: "Alt Görev",
};

const TARGET_TYPE_ICONS: Record<string, React.ReactNode> = {
  LIST: <ListChecks size={14} />,
  TASK: <CheckSquare size={14} />,
  SUBTASK: <Layers size={14} />,
};

const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  board,
  onCreateAssignment,
  onRemoveAssignment,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === "light";
  const modalRef = useRef<HTMLDivElement>(null);
  const [expandedLists, setExpandedLists] = useState<Set<number>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

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
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const assignments = member.assignments || [];
  const assignedSet = new Set(
    assignments.map((a) => `${a.targetType}:${a.targetId}`)
  );

  const isAssigned = (targetType: string, targetId: number) =>
    assignedSet.has(`${targetType}:${targetId}`);

  const getAssignment = (targetType: string, targetId: number): BoardMemberAssignment | undefined =>
    assignments.find((a) => a.targetType === targetType && a.targetId === targetId);

  const toggleList = (listId: number) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  };

  const toggleTask = (taskId: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const itemStyle = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing[2.5]} ${spacing[3]}`,
    borderRadius: radius.lg,
    background: isActive
      ? isLight
        ? colors.brand.primaryLight
        : `${colors.brand.primary}15`
      : "transparent",
    border: `1px solid ${isActive ? `${colors.brand.primary}40` : "transparent"}`,
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
              Bu panoda henüz liste bulunmamaktadir
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
              {board.taskLists.map((list) => {
                const listAssigned = isAssigned("LIST", list.id);
                const listExpanded = expandedLists.has(list.id);
                const listAssignment = getAssignment("LIST", list.id);

                return (
                  <div key={list.id}>
                    {/* List item */}
                    <div style={itemStyle(listAssigned)}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2],
                          cursor: "pointer",
                          flex: 1,
                        }}
                        onClick={() => toggleList(list.id)}
                      >
                        {list.tasks && list.tasks.length > 0 ? (
                          listExpanded ? (
                            <ChevronDown size={16} color={cssVars.textMuted} />
                          ) : (
                            <ChevronRight size={16} color={cssVars.textMuted} />
                          )
                        ) : (
                          <span style={{ width: 16 }} />
                        )}
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
                      {listAssigned && listAssignment ? (
                        <button
                          onClick={() => onRemoveAssignment(member.id, listAssignment.id)}
                          style={removeBtnStyle}
                        >
                          <Trash2 size={12} />
                          Kaldir
                        </button>
                      ) : (
                        <button
                          onClick={() => onCreateAssignment(member.id, "LIST", list.id)}
                          style={assignBtnStyle}
                        >
                          <Target size={12} />
                          Ata
                        </button>
                      )}
                    </div>

                    {/* Tasks */}
                    {listExpanded &&
                      list.tasks &&
                      list.tasks.map((task) => {
                        const taskAssigned = isAssigned("TASK", task.id);
                        const taskExpanded = expandedTasks.has(task.id);
                        const taskAssignment = getAssignment("TASK", task.id);

                        return (
                          <div key={task.id} style={{ paddingLeft: spacing[6] }}>
                            <div style={itemStyle(taskAssigned)}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: spacing[2],
                                  cursor: "pointer",
                                  flex: 1,
                                }}
                                onClick={() => toggleTask(task.id)}
                              >
                                {task.subtasks && task.subtasks.length > 0 ? (
                                  taskExpanded ? (
                                    <ChevronDown size={14} color={cssVars.textMuted} />
                                  ) : (
                                    <ChevronRight size={14} color={cssVars.textMuted} />
                                  )
                                ) : (
                                  <span style={{ width: 14 }} />
                                )}
                                <CheckSquare
                                  size={14}
                                  color={taskAssigned ? colors.brand.primary : cssVars.textMuted}
                                />
                                <span
                                  style={{
                                    fontSize: typography.fontSize.sm,
                                    fontWeight: typography.fontWeight.medium,
                                    color: taskAssigned ? colors.brand.primary : cssVars.textMain,
                                  }}
                                >
                                  {task.title}
                                </span>
                              </div>
                              {taskAssigned && taskAssignment ? (
                                <button
                                  onClick={() =>
                                    onRemoveAssignment(member.id, taskAssignment.id)
                                  }
                                  style={removeBtnStyle}
                                >
                                  <Trash2 size={12} />
                                  Kaldir
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    onCreateAssignment(member.id, "TASK", task.id)
                                  }
                                  style={assignBtnStyle}
                                >
                                  <Target size={12} />
                                  Ata
                                </button>
                              )}
                            </div>

                            {/* Subtasks */}
                            {taskExpanded &&
                              task.subtasks &&
                              task.subtasks.map((subtask) => {
                                const subtaskAssigned = isAssigned("SUBTASK", subtask.id);
                                const subtaskAssignment = getAssignment("SUBTASK", subtask.id);

                                return (
                                  <div
                                    key={subtask.id}
                                    style={{ paddingLeft: spacing[6] }}
                                  >
                                    <div style={itemStyle(subtaskAssigned)}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: spacing[2],
                                          flex: 1,
                                        }}
                                      >
                                        <span style={{ width: 14 }} />
                                        <Layers
                                          size={14}
                                          color={
                                            subtaskAssigned
                                              ? colors.brand.primary
                                              : cssVars.textMuted
                                          }
                                        />
                                        <span
                                          style={{
                                            fontSize: typography.fontSize.sm,
                                            color: subtaskAssigned
                                              ? colors.brand.primary
                                              : cssVars.textMain,
                                          }}
                                        >
                                          {subtask.title}
                                        </span>
                                      </div>
                                      {subtaskAssigned && subtaskAssignment ? (
                                        <button
                                          onClick={() =>
                                            onRemoveAssignment(
                                              member.id,
                                              subtaskAssignment.id
                                            )
                                          }
                                          style={removeBtnStyle}
                                        >
                                          <Trash2 size={12} />
                                          Kaldir
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            onCreateAssignment(
                                              member.id,
                                              "SUBTASK",
                                              subtask.id
                                            )
                                          }
                                          style={assignBtnStyle}
                                        >
                                          <Target size={12} />
                                          Ata
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
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

export default AssignMemberModal;
