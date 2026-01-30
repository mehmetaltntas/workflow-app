import React, { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Calendar } from "lucide-react";
import type { Board, TaskList, Task, Subtask } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { colors as tokenColors } from "../styles/tokens";
import { calculateBoardProgress, calculateLeafNodeCounts } from "../utils/progressCalculation";

interface StatsBarProps {
  board: Board;
  selectedList?: TaskList | null;
  selectedTask?: Task | null;
  subtasks?: Subtask[];
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  progressPercent: number;
  label: string; // "Liste", "Görev", "Alt Görev"
}

const calculateStats = (
  board: Board,
  selectedList?: TaskList | null,
  selectedTask?: Task | null,
  subtasks?: Subtask[]
): Stats => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Level 3: Task selected - show subtask stats
  if (selectedTask) {
    const taskSubtasks = subtasks || [];
    const total = taskSubtasks.length;
    const completed = taskSubtasks.filter(s => s.isCompleted).length;
    const pending = total - completed;

    let overdue = 0;
    let todayCount = 0;
    taskSubtasks.forEach(subtask => {
      if (!subtask.isCompleted && subtask.dueDate) {
        const dueDate = new Date(subtask.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) overdue++;
        else if (diffDays === 0) todayCount++;
      }
    });

    return {
      total,
      completed,
      pending,
      overdue,
      today: todayCount,
      progressPercent: calculateBoardProgress(board),
      label: "Alt Görev",
    };
  }

  // Level 2: List selected - show task stats for that list
  if (selectedList) {
    const tasks = selectedList.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pending = total - completed;

    let overdue = 0;
    let todayCount = 0;
    tasks.forEach(task => {
      if (!task.isCompleted && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) overdue++;
        else if (diffDays === 0) todayCount++;
      }
    });

    return {
      total,
      completed,
      pending,
      overdue,
      today: todayCount,
      progressPercent: calculateBoardProgress(board),
      label: "Görev",
    };
  }

  // Level 1: Board level - show list stats
  const lists = board.taskLists || [];
  const total = lists.length;
  const completed = lists.filter(l => l.isCompleted).length;
  const pending = total - completed;

  let overdue = 0;
  let todayCount = 0;
  lists.forEach(list => {
    if (!list.isCompleted && list.dueDate) {
      const dueDate = new Date(list.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) overdue++;
      else if (diffDays === 0) todayCount++;
    }
  });

  return {
    total,
    completed,
    pending,
    overdue,
    today: todayCount,
    progressPercent: calculateBoardProgress(board),
    label: "Liste",
  };
};

export const StatsBar: React.FC<StatsBarProps> = React.memo(function StatsBar({ board, selectedList, selectedTask, subtasks }) {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const stats = useMemo(
    () => calculateStats(board, selectedList, selectedTask, subtasks),
    [board, selectedList, selectedTask, subtasks]
  );

  if (stats.total === 0) {
    return null; // Don't show stats if there are no items
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
        {/* Total */}
        <StatItem
          icon={<ListTodo size={15} />}
          label={`Toplam ${stats.label}`}
          value={stats.total}
          color={colors.textSecondary}
          labelColor={colors.textMuted}
        />

        {/* Completed */}
        <StatItem
          icon={<CheckCircle2 size={15} />}
          label="Tamamlanan"
          value={stats.completed}
          color="var(--success)"
          labelColor={colors.textMuted}
        />

        {/* Pending */}
        <StatItem
          icon={<Clock size={15} />}
          label="Devam Eden"
          value={stats.pending}
          color="var(--primary)"
          labelColor={colors.textMuted}
        />

        {/* Overdue */}
        {stats.overdue > 0 && (
          <StatItem
            icon={<AlertTriangle size={15} />}
            label="Gecikmiş"
            value={stats.overdue}
            color="var(--danger)"
            labelColor={colors.textMuted}
            highlight
          />
        )}

        {/* Today */}
        {stats.today > 0 && (
          <StatItem
            icon={<Calendar size={15} />}
            label="Bugün"
            value={stats.today}
            color={tokenColors.priority.medium}
            labelColor={colors.textMuted}
          />
        )}
      </div>
    </div>
  );
});

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

// Separate stats calculation for MiniStats (board cards - uses leaf-node progress)
const calculateBoardTaskStats = (board: Board) => {
  const leafCounts = calculateLeafNodeCounts(board);
  let overdueTasks = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  board.taskLists?.forEach(list => {
    list.tasks?.forEach(task => {
      if (!task.isCompleted && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() < today.getTime()) {
          overdueTasks++;
        }
      }
    });
  });

  return {
    totalTasks: leafCounts.total,
    completedTasks: leafCounts.completed,
    overdueTasks,
    progressPercent: leafCounts.total > 0 ? Math.round((leafCounts.completed / leafCounts.total) * 100) : 0,
  };
};

// Mini stats for board cards (BoardsPage)
export const MiniStats: React.FC<{ board: Board }> = ({ board }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const stats = useMemo(() => calculateBoardTaskStats(board), [board]);

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
