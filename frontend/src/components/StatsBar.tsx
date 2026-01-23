import React, { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Calendar } from "lucide-react";
import type { Board } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { colors as tokenColors } from "../styles/tokens";

interface StatsBarProps {
  board: Board;
}

interface BoardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  todayTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  progressPercent: number;
}

const calculateStats = (board: Board): BoardStats => {
  let totalTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;
  let todayTasks = 0;
  let totalSubtasks = 0;
  let completedSubtasks = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  board.taskLists?.forEach(list => {
    list.tasks?.forEach(task => {
      totalTasks++;

      if (task.isCompleted) {
        completedTasks++;
      } else {
        // Check due date only for non-completed tasks
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            overdueTasks++;
          } else if (diffDays === 0) {
            todayTasks++;
          }
        }
      }

      // Count subtasks
      task.subtasks?.forEach(subtask => {
        totalSubtasks++;
        if (subtask.isCompleted) {
          completedSubtasks++;
        }
      });
    });
  });

  const pendingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    todayTasks,
    totalSubtasks,
    completedSubtasks,
    progressPercent,
  };
};

export const StatsBar: React.FC<StatsBarProps> = ({ board }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const stats = useMemo(() => calculateStats(board), [board]);

  if (stats.totalTasks === 0) {
    return null; // Don't show stats if there are no tasks
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "14px 24px",
        background: colors.bgListHeader,
        borderBottom: `1px solid ${colors.borderDefault}`,
      }}
    >
      {/* Progress Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <TrendingUp size={16} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            İlerleme
          </span>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <div
            style={{
              height: "8px",
              background: colors.bgActive,
              borderRadius: "4px",
              overflow: "hidden",
              minWidth: "100px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${stats.progressPercent}%`,
                background: stats.progressPercent === 100
                  ? "var(--success)"
                  : `linear-gradient(90deg, ${tokenColors.brand.primary}, ${tokenColors.semantic.info})`,
                borderRadius: "4px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: stats.progressPercent === 100 ? "var(--success)" : "var(--primary)",
            minWidth: "40px",
            textAlign: "right",
          }}
        >
          %{stats.progressPercent}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", height: "24px", background: colors.divider }} />

      {/* Stats Cards */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
        {/* Total Tasks */}
        <StatItem
          icon={<ListTodo size={15} />}
          label="Toplam"
          value={stats.totalTasks}
          color={colors.textSecondary}
          labelColor={colors.textMuted}
        />

        {/* Completed Tasks */}
        <StatItem
          icon={<CheckCircle2 size={15} />}
          label="Tamamlanan"
          value={stats.completedTasks}
          color="var(--success)"
          labelColor={colors.textMuted}
        />

        {/* Pending Tasks */}
        <StatItem
          icon={<Clock size={15} />}
          label="Devam Eden"
          value={stats.pendingTasks}
          color="var(--primary)"
          labelColor={colors.textMuted}
        />

        {/* Overdue Tasks */}
        {stats.overdueTasks > 0 && (
          <StatItem
            icon={<AlertTriangle size={15} />}
            label="Gecikmiş"
            value={stats.overdueTasks}
            color="var(--danger)"
            labelColor={colors.textMuted}
            highlight
          />
        )}

        {/* Today's Tasks */}
        {stats.todayTasks > 0 && (
          <StatItem
            icon={<Calendar size={15} />}
            label="Bugün"
            value={stats.todayTasks}
            color={tokenColors.priority.medium}
            labelColor={colors.textMuted}
          />
        )}

        {/* Subtasks Progress */}
        {stats.totalSubtasks > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>Alt Görevler:</span>
            <span style={{
              fontSize: "12px",
              fontWeight: "600",
              color: stats.completedSubtasks === stats.totalSubtasks ? "var(--success)" : colors.textSecondary,
            }}>
              {stats.completedSubtasks}/{stats.totalSubtasks}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  labelColor?: string;
  highlight?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color, labelColor, highlight }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: highlight ? "6px 12px" : "0",
      borderRadius: highlight ? "8px" : "0",
      background: highlight ? tokenColors.semantic.dangerLight : "transparent",
      border: highlight ? `1px solid ${tokenColors.semantic.danger}33` : "none",
    }}
  >
    <div style={{ color, display: "flex", alignItems: "center" }}>{icon}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <span style={{ fontSize: "10px", color: labelColor || "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </span>
      <span style={{ fontSize: "15px", fontWeight: "700", color }}>{value}</span>
    </div>
  </div>
);

// Mini stats for board cards (BoardsPage)
export const MiniStats: React.FC<{ board: Board }> = ({ board }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const stats = useMemo(() => calculateStats(board), [board]);

  if (stats.totalTasks === 0) {
    return (
      <span style={{ fontSize: "11px", color: colors.textFaint }}>
        Henüz görev yok
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {/* Mini Progress Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
        <div
          style={{
            flex: 1,
            height: "4px",
            background: colors.bgActive,
            borderRadius: "2px",
            overflow: "hidden",
            maxWidth: "60px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${stats.progressPercent}%`,
              background: stats.progressPercent === 100 ? "var(--success)" : "var(--primary)",
              borderRadius: "2px",
            }}
          />
        </div>
        <span style={{ fontSize: "11px", fontWeight: "600", color: colors.textTertiary }}>
          %{stats.progressPercent}
        </span>
      </div>

      {/* Task Count */}
      <span style={{ fontSize: "11px", color: colors.textMuted }}>
        {stats.completedTasks}/{stats.totalTasks} görev
      </span>

      {/* Overdue Warning */}
      {stats.overdueTasks > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "var(--danger)" }}>
          <AlertTriangle size={12} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>{stats.overdueTasks}</span>
        </div>
      )}
    </div>
  );
};
