import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  ListChecks,
  CheckSquare,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  BarChart3,
  AlertCircle,
  Check,
  UserCircle,
  X,
} from "lucide-react";
import type { Board, BoardMember, BoardMemberAssignment } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { typography, spacing, radius, colors, cssVars, animation, zIndex, shadows } from "../styles/tokens";
import {
  useCreateAssignment,
  useRemoveAssignment,
} from "../hooks/queries/useBoardMembers";

// ─── Types ───────────────────────────────────────────────

interface TaskAssignmentSectionProps {
  board: Board;
}

interface AssigneeInfo {
  member: BoardMember;
  assignment: BoardMemberAssignment;
}

interface PopoverState {
  targetType: string;
  targetId: number;
  targetName: string;
  anchorRect: DOMRect;
}

type AssignmentFilter = "all" | "assigned" | "unassigned";

// ─── Constants ───────────────────────────────────────────

const TARGET_TYPE_ICONS: Record<string, React.ReactNode> = {
  LIST: <ListChecks size={15} />,
  TASK: <CheckSquare size={14} />,
  SUBTASK: <Layers size={13} />,
};

// ─── Component ───────────────────────────────────────────

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({ board }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === "light";
  const currentUsername = useAuthStore((s) => s.username);
  const isOwner = board.ownerName === currentUsername;

  // State
  const [searchText, setSearchText] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const [memberFilter, setMemberFilter] = useState<number | null>(null);
  const [expandedLists, setExpandedLists] = useState<Set<number>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [activePopover, setActivePopover] = useState<PopoverState | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Mutations
  const createAssignmentMutation = useCreateAssignment(board.id, board.slug);
  const removeAssignmentMutation = useRemoveAssignment(board.id, board.slug);

  const members = board.members || [];

  // ─── Computed Data ───────────────────────────────────────

  const { assignmentMap, stats } = useMemo(() => {
    const map = new Map<string, AssigneeInfo[]>();
    let totalAssignments = 0;

    for (const member of members) {
      for (const assignment of member.assignments || []) {
        const key = `${assignment.targetType}:${assignment.targetId}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ member, assignment });
        totalAssignments++;
      }
    }

    // Count total items
    let totalItems = 0;
    for (const list of board.taskLists || []) {
      totalItems++;
      for (const task of list.tasks || []) {
        totalItems++;
        totalItems += (task.subtasks || []).length;
      }
    }

    const assignedItemCount = map.size;
    const unassignedItems = totalItems - assignedItemCount;
    const coverage = totalItems > 0 ? Math.round((assignedItemCount / totalItems) * 100) : 0;

    const memberWorkloads = members
      .map((m) => ({
        member: m,
        count: (m.assignments || []).length,
      }))
      .sort((a, b) => b.count - a.count);

    const maxWorkload = memberWorkloads.length > 0 ? memberWorkloads[0].count : 0;

    return {
      assignmentMap: map,
      stats: {
        totalAssignments,
        totalItems,
        unassignedItems,
        assignedItemCount,
        coverage,
        memberWorkloads,
        maxWorkload,
      },
    };
  }, [board.taskLists, members]);

  // ─── Filtered Task Lists ────────────────────────────────

  const filteredTaskLists = useMemo(() => {
    const lists = board.taskLists || [];
    const search = searchText.toLowerCase().trim();

    return lists
      .map((list) => {
        const filteredTasks = (list.tasks || [])
          .map((task) => {
            const filteredSubtasks = (task.subtasks || []).filter((subtask) => {
              if (search && !subtask.title.toLowerCase().includes(search)) return false;
              const key = `SUBTASK:${subtask.id}`;
              const hasAssignee = assignmentMap.has(key);
              if (assignmentFilter === "assigned" && !hasAssignee) return false;
              if (assignmentFilter === "unassigned" && hasAssignee) return false;
              if (memberFilter !== null) {
                const assignees = assignmentMap.get(key) || [];
                if (!assignees.some((a) => a.member.id === memberFilter)) return false;
              }
              return true;
            });

            return { ...task, subtasks: filteredSubtasks };
          })
          .filter((task) => {
            const taskKey = `TASK:${task.id}`;
            const taskHasAssignee = assignmentMap.has(taskKey);
            const taskMatchesSearch = !search || task.title.toLowerCase().includes(search);
            const taskMatchesFilter =
              assignmentFilter === "all" ||
              (assignmentFilter === "assigned" && taskHasAssignee) ||
              (assignmentFilter === "unassigned" && !taskHasAssignee);
            const taskMatchesMember =
              memberFilter === null ||
              (assignmentMap.get(taskKey) || []).some((a) => a.member.id === memberFilter);

            // Keep task if it matches OR has matching subtasks
            const hasMatchingSubtasks = task.subtasks && task.subtasks.length > 0;
            return (taskMatchesSearch && taskMatchesFilter && taskMatchesMember) || hasMatchingSubtasks;
          });

        return { ...list, tasks: filteredTasks };
      })
      .filter((list) => {
        const listKey = `LIST:${list.id}`;
        const listHasAssignee = assignmentMap.has(listKey);
        const listMatchesSearch = !search || list.name.toLowerCase().includes(search);
        const listMatchesFilter =
          assignmentFilter === "all" ||
          (assignmentFilter === "assigned" && listHasAssignee) ||
          (assignmentFilter === "unassigned" && !listHasAssignee);
        const listMatchesMember =
          memberFilter === null ||
          (assignmentMap.get(listKey) || []).some((a) => a.member.id === memberFilter);

        const hasMatchingTasks = list.tasks && list.tasks.length > 0;
        return (listMatchesSearch && listMatchesFilter && listMatchesMember) || hasMatchingTasks;
      });
  }, [board.taskLists, searchText, assignmentFilter, memberFilter, assignmentMap]);

  // ─── Handlers ───────────────────────────────────────────

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

  const handleOpenPopover = (
    e: React.MouseEvent,
    targetType: string,
    targetId: number,
    targetName: string
  ) => {
    if (!isOwner) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActivePopover({ targetType, targetId, targetName, anchorRect: rect });
  };

  const handleToggleAssignment = (memberId: number, targetType: string, targetId: number) => {
    const key = `${targetType}:${targetId}`;
    const existingAssignees = assignmentMap.get(key) || [];
    const existing = existingAssignees.find((a) => a.member.id === memberId);

    if (existing) {
      removeAssignmentMutation.mutate({ memberId, assignmentId: existing.assignment.id });
    } else {
      createAssignmentMutation.mutate({ memberId, targetType, targetId });
    }
  };

  // Close member dropdown on outside click
  useEffect(() => {
    if (!showMemberDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMemberDropdown]);

  // ─── Styles ─────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    padding: spacing[4],
    borderRadius: radius.lg,
    background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
    border: `1px solid ${themeColors.borderDefault}`,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: cssVars.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
  };

  // ─── Render Helpers ─────────────────────────────────────

  const renderAvatar = (member: BoardMember, size: number = 22) => {
    const fontSize = size <= 22 ? "8px" : typography.fontSize.xs;
    if (member.profilePicture) {
      return (
        <img
          src={member.profilePicture}
          alt={member.username}
          style={{
            width: size,
            height: size,
            borderRadius: radius.full,
            objectFit: "cover",
            border: `2px solid ${isLight ? "#fff" : colors.dark.bg.card}`,
            flexShrink: 0,
          }}
        />
      );
    }
    const initials =
      member.firstName && member.lastName
        ? `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()
        : member.username.substring(0, 2).toUpperCase();
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius.full,
          background: colors.brand.primaryLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.brand.primary,
          fontWeight: typography.fontWeight.bold,
          fontSize,
          flexShrink: 0,
          border: `2px solid ${isLight ? "#fff" : colors.dark.bg.card}`,
        }}
      >
        {initials}
      </div>
    );
  };

  const renderAssignees = (targetType: string, targetId: number, targetName: string) => {
    const key = `${targetType}:${targetId}`;
    const assignees = assignmentMap.get(key) || [];

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[0.5],
          cursor: isOwner ? "pointer" : "default",
          padding: `${spacing[0.5]} ${spacing[1.5]}`,
          borderRadius: radius.full,
          background: assignees.length > 0 ? colors.brand.primaryLight : "transparent",
          border: `1px solid ${assignees.length > 0 ? `${colors.brand.primary}20` : isOwner ? themeColors.borderDefault : "transparent"}`,
          transition: `all ${animation.duration.fast}`,
          minHeight: "28px",
        }}
        onClick={(e) => handleOpenPopover(e, targetType, targetId, targetName)}
        title={isOwner ? "Atama yap" : undefined}
      >
        {assignees.length > 0 ? (
          <>
            <div style={{ display: "flex", marginRight: spacing[0.5] }}>
              {assignees.slice(0, 3).map((a, i) => (
                <div
                  key={a.member.id}
                  style={{ marginLeft: i > 0 ? "-6px" : 0, position: "relative", zIndex: 3 - i }}
                >
                  {renderAvatar(a.member, 22)}
                </div>
              ))}
              {assignees.length > 3 && (
                <div
                  style={{
                    marginLeft: "-6px",
                    width: 22,
                    height: 22,
                    borderRadius: radius.full,
                    background: colors.brand.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "8px",
                    fontWeight: typography.fontWeight.bold,
                    border: `2px solid ${isLight ? "#fff" : colors.dark.bg.card}`,
                  }}
                >
                  +{assignees.length - 3}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: cssVars.textMuted,
              }}
            >
              {assignees.length}
            </span>
          </>
        ) : isOwner ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1],
              color: cssVars.textMuted,
              fontSize: typography.fontSize.xs,
            }}
          >
            <UserCircle size={14} />
            <span>Ata</span>
          </div>
        ) : (
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: cssVars.textMuted,
              fontStyle: "italic",
            }}
          >
            Atanmamış
          </span>
        )}
      </div>
    );
  };

  const renderItemRow = (
    targetType: string,
    targetId: number,
    name: string,
    icon: React.ReactNode,
    depth: number,
    hasChildren: boolean,
    isExpanded: boolean,
    onToggle: () => void
  ) => {
    const key = `${targetType}:${targetId}`;
    const hasAssignee = assignmentMap.has(key);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${spacing[2]} ${spacing[3]}`,
          paddingLeft: `calc(${spacing[3]} + ${depth * 24}px)`,
          borderRadius: radius.md,
          background: hasAssignee
            ? isLight
              ? `${colors.brand.primary}06`
              : `${colors.brand.primary}06`
            : "transparent",
          borderLeft: hasAssignee ? `3px solid ${colors.brand.primary}40` : `3px solid transparent`,
          transition: `all ${animation.duration.fast}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            flex: 1,
            minWidth: 0,
            cursor: hasChildren ? "pointer" : "default",
          }}
          onClick={hasChildren ? onToggle : undefined}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} color={cssVars.textMuted} style={{ flexShrink: 0 }} />
            ) : (
              <ChevronRight size={14} color={cssVars.textMuted} style={{ flexShrink: 0 }} />
            )
          ) : (
            <span style={{ width: 14, flexShrink: 0 }} />
          )}
          <span
            style={{
              color: hasAssignee ? colors.brand.primary : cssVars.textMuted,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
          <span
            style={{
              fontSize: depth === 0 ? typography.fontSize.base : typography.fontSize.sm,
              fontWeight: depth === 0 ? typography.fontWeight.semibold : typography.fontWeight.medium,
              color: hasAssignee ? colors.brand.primary : cssVars.textMain,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </div>

        {renderAssignees(targetType, targetId, name)}
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────

  if (!board.taskLists || board.taskLists.length === 0) {
    return null;
  }

  const selectedMemberName =
    memberFilter !== null
      ? (() => {
          const m = members.find((m) => m.id === memberFilter);
          if (!m) return "";
          return m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.username;
        })()
      : "";

  const filterTabs: { key: AssignmentFilter; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "assigned", label: "Atanmış" },
    { key: "unassigned", label: "Atanmamış" },
  ];

  return (
    <>
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: spacing[4] }}>
        {/* ─── Section A: Header & Stats ─── */}
        <div>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing[3],
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
              <Target size={16} color={cssVars.textMuted} />
              <span style={sectionLabelStyle}>Görev Atamaları</span>
            </div>
          </div>

          {/* Stat Badges */}
          <div
            style={{
              display: "flex",
              gap: spacing[2],
              flexWrap: "wrap",
            }}
          >
            {/* Total Assignments */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[1.5],
                padding: `${spacing[1.5]} ${spacing[3]}`,
                borderRadius: radius.full,
                background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${themeColors.borderDefault}`,
              }}
            >
              <BarChart3 size={13} color={cssVars.textMuted} />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMuted,
                }}
              >
                {stats.totalAssignments} Atama
              </span>
            </div>

            {/* Unassigned Count */}
            {stats.unassignedItems > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[1.5],
                  padding: `${spacing[1.5]} ${spacing[3]}`,
                  borderRadius: radius.full,
                  background: colors.semantic.dangerLight,
                  border: `1px solid ${colors.semantic.danger}25`,
                }}
              >
                <AlertCircle size={13} color={colors.semantic.danger} />
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.semantic.danger,
                  }}
                >
                  {stats.unassignedItems} Atanmamış
                </span>
              </div>
            )}

            {/* Coverage */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[1.5],
                padding: `${spacing[1.5]} ${spacing[3]}`,
                borderRadius: radius.full,
                background:
                  stats.coverage === 100
                    ? colors.semantic.successLight
                    : isLight
                      ? "rgba(0,0,0,0.04)"
                      : "rgba(255,255,255,0.04)",
                border: `1px solid ${stats.coverage === 100 ? `${colors.semantic.success}25` : themeColors.borderDefault}`,
              }}
            >
              <Target
                size={13}
                color={stats.coverage === 100 ? colors.semantic.success : cssVars.textMuted}
              />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: stats.coverage === 100 ? colors.semantic.success : cssVars.textMuted,
                }}
              >
                %{stats.coverage} Kapsam
              </span>
            </div>
          </div>
        </div>

        {/* ─── Section B: Member Workload ─── */}
        {stats.memberWorkloads.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[1.5],
                marginBottom: spacing[2.5],
              }}
            >
              <Users size={13} color={cssVars.textMuted} />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wide,
                }}
              >
                İş Yükü Dağılımı
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
              {stats.memberWorkloads.map(({ member, count }) => {
                const barWidth =
                  stats.maxWorkload > 0
                    ? Math.round((count / stats.maxWorkload) * 100)
                    : 0;
                const memberName =
                  member.firstName && member.lastName
                    ? `${member.firstName} ${member.lastName}`
                    : member.username;

                return (
                  <div
                    key={member.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[2.5],
                    }}
                  >
                    {renderAvatar(member, 24)}
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: cssVars.textMain,
                        minWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {memberName}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: spacing[1.5],
                        background: themeColors.bgActive,
                        borderRadius: radius.full,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${barWidth}%`,
                          background:
                            count > 0
                              ? `linear-gradient(90deg, ${colors.brand.primary}80, ${colors.brand.primaryHover}80)`
                              : "transparent",
                          borderRadius: radius.full,
                          transition: `width ${animation.duration.slow}`,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.bold,
                        color: cssVars.textMuted,
                        minWidth: spacing[6],
                        textAlign: "right",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Section C: Filter & Search ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing[2.5],
            paddingTop: spacing[1],
            borderTop: `1px solid ${themeColors.borderDefault}`,
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: radius.lg,
              border: `1px solid ${themeColors.borderDefault}`,
              background: isLight ? colors.light.bg.input : colors.dark.bg.input,
              transition: `border-color ${animation.duration.fast}`,
            }}
          >
            <Search size={14} color={cssVars.textMuted} />
            <input
              type="text"
              placeholder="Görev ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                color: cssVars.textMain,
                fontSize: typography.fontSize.sm,
                outline: "none",
                fontFamily: typography.fontFamily.base,
              }}
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: radius.full,
                  border: "none",
                  background: themeColors.bgActive,
                  color: cssVars.textMuted,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Filter Tabs + Member Filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing[2],
              flexWrap: "wrap",
            }}
          >
            {/* Assignment Filter Tabs */}
            <div
              style={{
                display: "flex",
                gap: spacing[1],
                padding: spacing[0.5],
                borderRadius: radius.lg,
                background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
              }}
            >
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAssignmentFilter(tab.key)}
                  style={{
                    padding: `${spacing[1]} ${spacing[2.5]}`,
                    borderRadius: radius.md,
                    border: "none",
                    background:
                      assignmentFilter === tab.key
                        ? isLight
                          ? "#fff"
                          : "rgba(255,255,255,0.1)"
                        : "transparent",
                    color:
                      assignmentFilter === tab.key
                        ? cssVars.textMain
                        : cssVars.textMuted,
                    fontWeight:
                      assignmentFilter === tab.key
                        ? typography.fontWeight.semibold
                        : typography.fontWeight.medium,
                    fontSize: typography.fontSize.xs,
                    cursor: "pointer",
                    transition: `all ${animation.duration.fast}`,
                    boxShadow:
                      assignmentFilter === tab.key ? shadows.sm : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Member Filter */}
            {members.length > 0 && (
              <div ref={memberDropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowMemberDropdown((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[1.5],
                    padding: `${spacing[1]} ${spacing[2.5]}`,
                    borderRadius: radius.lg,
                    border: `1px solid ${memberFilter !== null ? `${colors.brand.primary}20` : themeColors.borderDefault}`,
                    background:
                      memberFilter !== null
                        ? colors.brand.primaryLight
                        : "transparent",
                    color:
                      memberFilter !== null
                        ? colors.brand.primary
                        : cssVars.textMuted,
                    cursor: "pointer",
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    transition: `all ${animation.duration.fast}`,
                  }}
                >
                  <Users size={12} />
                  {memberFilter !== null ? selectedMemberName : "Üye"}
                  <ChevronDown size={11} />
                </button>

                {showMemberDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      width: "200px",
                      background: isLight ? colors.light.bg.elevated : colors.dark.bg.card,
                      border: `1px solid ${themeColors.borderDefault}`,
                      borderRadius: radius.lg,
                      boxShadow: shadows.dropdown,
                      zIndex: zIndex.dropdown,
                      overflow: "hidden",
                    }}
                  >
                    {/* All option */}
                    <button
                      onClick={() => {
                        setMemberFilter(null);
                        setShowMemberDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                        padding: `${spacing[2]} ${spacing[3]}`,
                        border: "none",
                        background:
                          memberFilter === null
                            ? isLight
                              ? "rgba(0,0,0,0.04)"
                              : "rgba(255,255,255,0.06)"
                            : "transparent",
                        color: cssVars.textMain,
                        fontSize: typography.fontSize.sm,
                        fontWeight:
                          memberFilter === null
                            ? typography.fontWeight.semibold
                            : typography.fontWeight.normal,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <Users size={14} color={cssVars.textMuted} />
                      Tümü
                      {memberFilter === null && (
                        <Check
                          size={13}
                          color={colors.brand.primary}
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </button>

                    <div
                      style={{
                        height: 1,
                        background: themeColors.borderDefault,
                      }}
                    />

                    {members.map((member) => {
                      const mName =
                        member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.username;
                      return (
                        <button
                          key={member.id}
                          onClick={() => {
                            setMemberFilter(member.id);
                            setShowMemberDropdown(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: spacing[2],
                            padding: `${spacing[2]} ${spacing[3]}`,
                            border: "none",
                            background:
                              memberFilter === member.id
                                ? isLight
                                  ? "rgba(0,0,0,0.04)"
                                  : "rgba(255,255,255,0.06)"
                                : "transparent",
                            color: cssVars.textMain,
                            fontSize: typography.fontSize.sm,
                            fontWeight:
                              memberFilter === member.id
                                ? typography.fontWeight.semibold
                                : typography.fontWeight.normal,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {renderAvatar(member, 20)}
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {mName}
                          </span>
                          {memberFilter === member.id && (
                            <Check
                              size={13}
                              color={colors.brand.primary}
                              style={{ marginLeft: "auto", flexShrink: 0 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Section D: Hierarchical Task List ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing[0.5],
            borderTop: `1px solid ${themeColors.borderDefault}`,
            paddingTop: spacing[3],
          }}
        >
          {filteredTaskLists.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: `${spacing[6]} ${spacing[4]}`,
                color: cssVars.textMuted,
              }}
            >
              <Target
                size={28}
                strokeWidth={1.5}
                style={{ opacity: 0.3, marginBottom: spacing[2] }}
              />
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  margin: 0,
                }}
              >
                {searchText || assignmentFilter !== "all" || memberFilter !== null
                  ? "Filtrelere uygun öğe bulunamadı"
                  : "Henüz atama yapılmamış"}
              </p>
            </div>
          ) : (
            filteredTaskLists.map((list) => {
              const listExpanded = expandedLists.has(list.id);
              const hasTasks = list.tasks && list.tasks.length > 0;

              return (
                <div key={list.id}>
                  {renderItemRow(
                    "LIST",
                    list.id,
                    list.name,
                    TARGET_TYPE_ICONS.LIST,
                    0,
                    !!hasTasks,
                    listExpanded,
                    () => toggleList(list.id)
                  )}

                  {listExpanded &&
                    list.tasks &&
                    list.tasks.map((task) => {
                      const taskExpanded = expandedTasks.has(task.id);
                      const hasSubtasks = task.subtasks && task.subtasks.length > 0;

                      return (
                        <div key={task.id}>
                          {renderItemRow(
                            "TASK",
                            task.id,
                            task.title,
                            TARGET_TYPE_ICONS.TASK,
                            1,
                            !!hasSubtasks,
                            taskExpanded,
                            () => toggleTask(task.id)
                          )}

                          {taskExpanded &&
                            task.subtasks &&
                            task.subtasks.map((subtask) => (
                              <div key={subtask.id}>
                                {renderItemRow(
                                  "SUBTASK",
                                  subtask.id,
                                  subtask.title,
                                  TARGET_TYPE_ICONS.SUBTASK,
                                  2,
                                  false,
                                  false,
                                  () => {}
                                )}
                              </div>
                            ))}
                        </div>
                      );
                    })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Section E: Quick-Assign Popover ─── */}
      {activePopover && (
        <QuickAssignPopover
          popover={activePopover}
          members={members}
          assignmentMap={assignmentMap}
          isLight={isLight}
          themeColors={themeColors}
          onToggleAssignment={handleToggleAssignment}
          onClose={() => setActivePopover(null)}
          renderAvatar={renderAvatar}
        />
      )}
    </>
  );
};

// ─── Quick-Assign Popover Sub-Component ───────────────────

interface QuickAssignPopoverProps {
  popover: PopoverState;
  members: BoardMember[];
  assignmentMap: Map<string, AssigneeInfo[]>;
  isLight: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
  onToggleAssignment: (memberId: number, targetType: string, targetId: number) => void;
  onClose: () => void;
  renderAvatar: (member: BoardMember, size?: number) => React.ReactNode;
}

const QuickAssignPopover: React.FC<QuickAssignPopoverProps> = ({
  popover,
  members,
  assignmentMap,
  isLight,
  themeColors,
  onToggleAssignment,
  onClose,
  renderAvatar,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const key = `${popover.targetType}:${popover.targetId}`;
  const assignedMembers = assignmentMap.get(key) || [];
  const assignedMemberIds = new Set(assignedMembers.map((a) => a.member.id));

  // Calculate position
  useEffect(() => {
    const { anchorRect } = popover;
    const popoverWidth = 260;
    const popoverHeight = Math.min(members.length * 42 + 56, 320);

    let top = anchorRect.bottom + 6;
    let left = anchorRect.right - popoverWidth;

    // Viewport boundary checks
    if (left < 8) left = 8;
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8;
    }
    if (top + popoverHeight > window.innerHeight - 8) {
      top = anchorRect.top - popoverHeight - 6;
    }

    setPos({ top, left });
  }, [popover, members.length]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Use setTimeout to avoid the immediate click that opened the popover
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 260,
        maxHeight: 320,
        background: isLight ? colors.light.bg.elevated : colors.dark.bg.card,
        border: `1px solid ${themeColors.borderDefault}`,
        borderRadius: radius.xl,
        boxShadow: shadows.dropdown,
        zIndex: zIndex.popover,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        animation: `popoverIn ${animation.duration.normal} ${animation.easing.spring}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing[2.5]} ${spacing[3]}`,
          borderBottom: `1px solid ${themeColors.borderDefault}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMuted,
              textTransform: "uppercase",
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            Üye Ata
          </span>
          <p
            style={{
              fontSize: typography.fontSize.xs,
              color: cssVars.textMuted,
              margin: 0,
              marginTop: spacing[0.5],
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {popover.targetName}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: radius.md,
            border: "none",
            background: "transparent",
            color: cssVars.textMuted,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Member List */}
      <div
        style={{
          overflow: "auto",
          flex: 1,
          padding: `${spacing[1]} 0`,
        }}
      >
        {members.map((member) => {
          const isAssigned = assignedMemberIds.has(member.id);
          const memberName =
            member.firstName && member.lastName
              ? `${member.firstName} ${member.lastName}`
              : member.username;

          return (
            <button
              key={member.id}
              onClick={() => onToggleAssignment(member.id, popover.targetType, popover.targetId)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                padding: `${spacing[2]} ${spacing[3]}`,
                border: "none",
                background: isAssigned
                  ? isLight
                    ? colors.brand.primaryLight
                    : `${colors.brand.primary}10`
                  : "transparent",
                color: cssVars.textMain,
                cursor: "pointer",
                fontSize: typography.fontSize.sm,
                textAlign: "left",
                transition: `background ${animation.duration.fast}`,
              }}
            >
              {renderAvatar(member, 24)}
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: isAssigned
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.normal,
                  color: isAssigned ? colors.brand.primary : cssVars.textMain,
                }}
              >
                {memberName}
              </span>
              {isAssigned && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: radius.full,
                    background: colors.brand.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check size={12} color="#fff" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes popoverIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default TaskAssignmentSection;
