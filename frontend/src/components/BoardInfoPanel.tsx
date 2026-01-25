import React, { useMemo } from "react";
import type { Board } from "../types";
import {
  ListChecks,
  CheckSquare,
  Layers,
  Calendar,
  ExternalLink,
  FileText,
  BarChart3,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  Pin,
  PinOff
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";

interface BoardInfoPanelProps {
  board: Board | null;
  onClose: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  canPin?: boolean;
}

// Pano istatistiklerini hesapla
const calculateBoardStats = (board: Board) => {
  const lists = board.taskLists || [];
  const totalLists = lists.length;
  const completedLists = lists.filter(l => l.isCompleted).length;

  let totalTasks = 0;
  let completedTasks = 0;
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  let overdueTasks = 0;
  let overdueSubtasks = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  lists.forEach(list => {
    const tasks = list.tasks || [];
    totalTasks += tasks.length;
    completedTasks += tasks.filter(t => t.isCompleted).length;

    tasks.forEach(task => {
      // Gecikmiş görevleri kontrol et
      if (!task.isCompleted && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() < today.getTime()) {
          overdueTasks++;
        }
      }

      const subtasks = task.subtasks || [];
      totalSubtasks += subtasks.length;
      completedSubtasks += subtasks.filter(s => s.isCompleted).length;

      // Gecikmiş alt görevleri kontrol et
      subtasks.forEach(subtask => {
        if (!subtask.isCompleted && subtask.dueDate) {
          const dueDate = new Date(subtask.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate.getTime() < today.getTime()) {
            overdueSubtasks++;
          }
        }
      });
    });
  });

  return {
    lists: { total: totalLists, completed: completedLists },
    tasks: { total: totalTasks, completed: completedTasks, overdue: overdueTasks },
    subtasks: { total: totalSubtasks, completed: completedSubtasks, overdue: overdueSubtasks },
    overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
};

// Son tarihe göre renk ve durum hesapla
const getDeadlineInfo = (deadline: string | undefined) => {
  if (!deadline) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { color: colors.semantic.danger, bg: colors.semantic.dangerLight, label: 'Gecikmiş', days: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { color: colors.priority.medium, bg: colors.priority.mediumBg, label: 'Bugün', days: 0 };
  } else if (diffDays <= 3) {
    return { color: colors.status.paused, bg: `${colors.status.paused}20`, label: 'Acil', days: diffDays };
  } else if (diffDays <= 7) {
    return { color: colors.priority.medium, bg: colors.priority.mediumBg, label: 'Yaklaşıyor', days: diffDays };
  } else {
    return { color: colors.semantic.success, bg: colors.semantic.successLight, label: 'Normal', days: diffDays };
  }
};

export const BoardInfoPanel: React.FC<BoardInfoPanelProps> = ({
  board,
  onClose,
  onTogglePin,
  isPinned = false,
  canPin = true
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const stats = useMemo(() => board ? calculateBoardStats(board) : null, [board]);
  const deadlineInfo = useMemo(() => board ? getDeadlineInfo(board.deadline) : null, [board]);

  if (!board || !stats) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: spacing[6],
          color: cssVars.textMuted,
          textAlign: "center",
        }}
      >
        <BarChart3 size={48} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: spacing[4] }} />
        <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium }}>
          Pano Seçin
        </p>
        <p style={{ fontSize: typography.fontSize.md, marginTop: spacing[1] }}>
          Detayları görmek için bir panonun bilgi simgesine tıklayın
        </p>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: `slideIn ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${spacing[4]} ${spacing[5]}`,
          borderBottom: `1px solid ${themeColors.borderDefault}`,
          background: `linear-gradient(135deg, ${statusColor}10, transparent)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: spacing[2],
              height: spacing[8],
              borderRadius: radius.full,
              background: statusColor,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {board.name}
            </h3>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: statusColor,
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              {STATUS_LABELS[board.status || "PLANLANDI"]}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: spacing[2], flexShrink: 0, marginLeft: spacing[2] }}>
          {/* Pin Button */}
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              disabled={!isPinned && !canPin}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: spacing[8],
                height: spacing[8],
                borderRadius: radius.lg,
                border: `1px solid ${isPinned
                  ? (isLight ? colors.brand.primary : colors.semantic.warning)
                  : themeColors.borderDefault}`,
                background: isPinned
                  ? (isLight ? `${colors.brand.primary}20` : `${colors.semantic.warning}20`)
                  : themeColors.bgHover,
                color: isPinned
                  ? (isLight ? colors.brand.primary : colors.semantic.warning)
                  : cssVars.textMuted,
                cursor: !isPinned && !canPin ? "not-allowed" : "pointer",
                opacity: !isPinned && !canPin ? 0.5 : 1,
                transition: `all ${animation.duration.fast}`,
              }}
              title={isPinned ? "Sabitlemeyi Kaldır" : canPin ? "Sabitle" : "Maksimum sabitleme sayısına ulaşıldı"}
            >
              {isPinned ? <PinOff size={16} strokeWidth={2.5} /> : <Pin size={16} strokeWidth={2.5} />}
            </button>
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: spacing[8],
              height: spacing[8],
              borderRadius: radius.lg,
              border: `1px solid ${themeColors.borderDefault}`,
              background: themeColors.bgHover,
              color: cssVars.textMuted,
              cursor: "pointer",
              transition: `all ${animation.duration.fast}`,
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: spacing[5],
          display: "flex",
          flexDirection: "column",
          gap: spacing[5],
        }}
      >
        {/* Overall Progress */}
        <div
          style={{
            padding: spacing[4],
            borderRadius: radius.xl,
            background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
            border: `1px solid ${themeColors.borderDefault}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[3] }}>
            <TrendingUp size={16} color={colors.brand.primary} />
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: cssVars.textMuted,
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wide,
              }}
            >
              Genel İlerleme
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
            <div
              style={{
                flex: 1,
                height: spacing[2],
                background: themeColors.bgActive,
                borderRadius: radius.full,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${stats.overallProgress}%`,
                  background: stats.overallProgress === 100
                    ? colors.semantic.success
                    : `linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.primaryHover})`,
                  borderRadius: radius.full,
                  transition: `width ${animation.duration.slow}`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.bold,
                color: stats.overallProgress === 100 ? colors.semantic.success : colors.brand.primary,
                minWidth: spacing[12],
                textAlign: "right",
              }}
            >
              %{stats.overallProgress}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
          {/* Liste İstatistikleri */}
          <StatCard
            icon={<ListChecks size={18} />}
            label="Liste"
            completed={stats.lists.completed}
            total={stats.lists.total}
            color={colors.status.completed}
            isLight={isLight}
            themeColors={themeColors}
          />

          {/* Görev İstatistikleri */}
          <StatCard
            icon={<CheckSquare size={18} />}
            label="Görev"
            completed={stats.tasks.completed}
            total={stats.tasks.total}
            overdue={stats.tasks.overdue}
            color={colors.status.inProgress}
            isLight={isLight}
            themeColors={themeColors}
          />

          {/* Alt Görev İstatistikleri */}
          <StatCard
            icon={<Layers size={18} />}
            label="Alt Görev"
            completed={stats.subtasks.completed}
            total={stats.subtasks.total}
            overdue={stats.subtasks.overdue}
            color={colors.brand.primary}
            isLight={isLight}
            themeColors={themeColors}
          />
        </div>

        {/* Açıklama */}
        {board.description && (
          <div
            style={{
              padding: spacing[4],
              borderRadius: radius.xl,
              background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
              border: `1px solid ${themeColors.borderDefault}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
              <FileText size={16} color={cssVars.textMuted} />
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wide,
                }}
              >
                Açıklama
              </span>
            </div>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: cssVars.textMain,
                lineHeight: typography.lineHeight.relaxed,
                margin: 0,
              }}
            >
              {board.description}
            </p>
          </div>
        )}

        {/* Son Tarih */}
        {board.deadline && deadlineInfo && (
          <div
            style={{
              padding: spacing[4],
              borderRadius: radius.xl,
              background: deadlineInfo.bg,
              border: `1px solid ${deadlineInfo.color}30`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: spacing[10],
                    height: spacing[10],
                    borderRadius: radius.lg,
                    background: `${deadlineInfo.color}20`,
                  }}
                >
                  {deadlineInfo.label === 'Gecikmiş' ? (
                    <AlertTriangle size={20} color={deadlineInfo.color} />
                  ) : (
                    <Calendar size={20} color={deadlineInfo.color} />
                  )}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: deadlineInfo.color,
                      textTransform: "uppercase",
                      letterSpacing: typography.letterSpacing.wider,
                    }}
                  >
                    {deadlineInfo.label}
                  </span>
                  <p
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: deadlineInfo.color,
                      margin: 0,
                    }}
                  >
                    {new Date(board.deadline).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {deadlineInfo.days !== undefined && deadlineInfo.days > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[1],
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: radius.md,
                    background: `${deadlineInfo.color}15`,
                  }}
                >
                  <Clock size={12} color={deadlineInfo.color} />
                  <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: deadlineInfo.color }}>
                    {deadlineInfo.days} gün
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bağlantı */}
        {board.link && (
          <a
            href={board.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              padding: spacing[4],
              borderRadius: radius.xl,
              background: `linear-gradient(135deg, ${colors.brand.primaryLight}, ${colors.brand.primary}10)`,
              border: `1px solid ${colors.brand.primary}30`,
              color: colors.brand.primary,
              textDecoration: "none",
              transition: `all ${animation.duration.normal}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: spacing[10],
                height: spacing[10],
                borderRadius: radius.lg,
                background: `${colors.brand.primary}20`,
              }}
            >
              <ExternalLink size={20} />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wider,
                  opacity: 0.8,
                }}
              >
                Harici Bağlantı
              </span>
              <p
                style={{
                  fontSize: typography.fontSize.md,
                  fontWeight: typography.fontWeight.medium,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {board.link}
              </p>
            </div>
          </a>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  completed: number;
  total: number;
  overdue?: number;
  color: string;
  isLight: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, completed, total, overdue, color, isLight, themeColors }) => {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[3],
        padding: spacing[3],
        borderRadius: radius.lg,
        background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
        border: `1px solid ${themeColors.borderDefault}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: spacing[10],
          height: spacing[10],
          borderRadius: radius.md,
          background: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[1] }}>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: cssVars.textMuted,
            }}
          >
            {label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
            {overdue !== undefined && overdue > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[1],
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.semantic.danger,
                  padding: `${spacing[0.5]} ${spacing[1.5]}`,
                  background: colors.semantic.dangerLight,
                  borderRadius: radius.sm,
                }}
              >
                <AlertTriangle size={10} />
                {overdue}
              </span>
            )}
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
              }}
            >
              {completed}/{total}
            </span>
          </div>
        </div>
        <div
          style={{
            height: spacing[1],
            background: themeColors.bgActive,
            borderRadius: radius.full,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: progress === 100 ? colors.semantic.success : color,
              borderRadius: radius.full,
              transition: `width ${animation.duration.slow}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BoardInfoPanel;
