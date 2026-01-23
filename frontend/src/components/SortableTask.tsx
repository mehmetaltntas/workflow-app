import { memo, useMemo } from "react";
import { CheckSquare, Square, Link as LinkIcon, MessageSquare, Calendar, Flag, ListChecks } from "lucide-react";
import type { Task, TaskList, Priority } from "../types";
import { ActionMenu } from "./ActionMenu";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, cssVars, colors } from "../utils/themeColors";
import { typography, spacing, radius } from "../styles/tokens";

interface TaskCardProps {
  task: Task;
  list: TaskList;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleComplete: (task: Task, list: TaskList) => void;
}

// Priority renk ve etiket bilgisi
const getPriorityInfo = (priority: Priority | undefined): { label: string; color: string; bgColor: string } => {
  switch (priority) {
    case 'HIGH':
      return { label: 'Yüksek', color: colors.priority.high, bgColor: colors.priority.highBg };
    case 'MEDIUM':
      return { label: 'Orta', color: colors.priority.medium, bgColor: colors.priority.mediumBg };
    case 'LOW':
      return { label: 'Düşük', color: colors.priority.low, bgColor: colors.priority.lowBg };
    default:
      return { label: '', color: '', bgColor: '' };
  }
};

// Due date durumunu hesapla
const getDueDateStatus = (dueDate: string | null | undefined): { status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none'; label: string; color: string } => {
  if (!dueDate) return { status: 'none', label: '', color: '' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', label: `${Math.abs(diffDays)} gün gecikti`, color: cssVars.danger };
  } else if (diffDays === 0) {
    return { status: 'today', label: 'Bugün', color: colors.priority.medium }; // Turuncu
  } else if (diffDays === 1) {
    return { status: 'tomorrow', label: 'Yarın', color: colors.priority.medium }; // Turuncu
  } else if (diffDays <= 7) {
    return { status: 'upcoming', label: `${diffDays} gün`, color: cssVars.primary };
  } else {
    // Format date as "15 Oca" style
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return { status: 'upcoming', label: due.toLocaleDateString('tr-TR', options), color: colors.dark.text.subtle };
  }
};

export const SortableTask = memo(({ task, list, index, onEdit, onDelete, onToggleComplete }: TaskCardProps) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  // Due date status hesapla (memoized)
  const dueDateInfo = useMemo(() => getDueDateStatus(task.dueDate), [task.dueDate]);

  // Priority info hesapla (memoized)
  const priorityInfo = useMemo(() => getPriorityInfo(task.priority), [task.priority]);

  // Subtask progress hesapla (memoized)
  const subtaskProgress = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(s => s.isCompleted).length;
    const total = task.subtasks.length;
    return { completed, total, percent: Math.round((completed / total) * 100) };
  }, [task.subtasks]);

  return (
    <div
      style={{
        background: task.isCompleted ? themeColors.taskCompletedBg : themeColors.taskBg,
        padding: `${spacing[3]} ${spacing[3.5]}`,
        borderRadius: radius.lg,
        border: `1px solid ${task.isCompleted ? themeColors.taskCompletedBorder : themeColors.taskBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2.5],
      }}
      className="group/task"
    >
      {/* Action Menu */}
      <ActionMenu
        triggerClassName="opacity-0 group-hover/task:opacity-60 hover:!opacity-100"
        dropdownPosition="left"
        dropdownDirection={index < 2 ? "down" : "up"}
        iconSize={14}
        onEdit={() => onEdit(task)}
        onDelete={() => onDelete(task.id)}
      />

      {/* Task Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[1], marginBottom: spacing[1.5] }}>
            {task.labels.map(label => (
              <span
                key={label.id}
                style={{
                  fontSize: '9px',
                  fontWeight: typography.fontWeight.semibold,
                  padding: `${spacing[0.5]} ${spacing[1.5]}`,
                  borderRadius: radius.sm,
                  background: label.color + '25', // 25 = 15% opacity in hex
                  color: label.color,
                  border: `1px solid ${label.color}40`, // 40 = 25% opacity
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
        <div className="task-title" style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.medium,
          lineHeight: typography.lineHeight.normal,
          color: task.isCompleted ? themeColors.textMuted : themeColors.textPrimary
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: task.description || dueDateInfo.status !== 'none' || priorityInfo.color || subtaskProgress ? spacing[1] : '0', flexWrap: 'wrap' }}>
          {task.description && (
            <div style={{
              fontSize: typography.fontSize.sm,
              color: themeColors.textSubtle,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1]
            }}>
              <MessageSquare size={10} />
              <span>Not var</span>
            </div>
          )}
          {/* Subtasks Progress Badge */}
          {subtaskProgress && !task.isCompleted && (
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: subtaskProgress.completed === subtaskProgress.total
                ? cssVars.success
                : themeColors.textTertiary,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              padding: `${spacing[0.5]} ${spacing[1.5]}`,
              borderRadius: spacing[1.5],
              background: subtaskProgress.completed === subtaskProgress.total
                ? colors.semantic.successLight
                : themeColors.bgHover,
            }}>
              <ListChecks size={10} />
              <span>{subtaskProgress.completed}/{subtaskProgress.total}</span>
            </div>
          )}
          {/* Priority Badge */}
          {priorityInfo.color && !task.isCompleted && (
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: priorityInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: `${spacing[0.5]} ${spacing[1.5]}`,
              borderRadius: spacing[1.5],
              background: priorityInfo.bgColor,
            }}>
              <Flag size={9} />
              <span>{priorityInfo.label}</span>
            </div>
          )}
          {/* Due Date Badge */}
          {dueDateInfo.status !== 'none' && !task.isCompleted && (
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: dueDateInfo.status === 'upcoming' && !dueDateInfo.color.startsWith('var') ? themeColors.textMuted : dueDateInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: `${spacing[0.5]} ${spacing[1.5]}`,
              borderRadius: spacing[1.5],
              background: dueDateInfo.status === 'overdue'
                ? colors.priority.highBg
                : dueDateInfo.status === 'today' || dueDateInfo.status === 'tomorrow'
                  ? colors.priority.mediumBg
                  : themeColors.bgHover,
            }}>
              <Calendar size={9} />
              <span>{dueDateInfo.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Link Icon */}
      {task.link && (
        <a
          href={task.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="task-hover-element"
          style={{
            color: cssVars.primary,
            display: 'flex',
            alignItems: 'center',
            padding: spacing[1],
            borderRadius: spacing[1.5],
            transition: 'all 0.2s',
          }}
        >
          <LinkIcon size={14} />
        </a>
      )}

      {/* Task Completion Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task, list); }}
        className={task.isCompleted ? '' : 'task-hover-element'}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: 'flex',
          padding: spacing[1],
          borderRadius: spacing[1.5],
          transition: 'all 0.2s',
          color: task.isCompleted ? cssVars.success : themeColors.textTertiary,
        }}
      >
        {task.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - sadece önemli prop'lar değiştiğinde re-render
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.isCompleted === nextProps.task.isCompleted &&
    prevProps.task.link === nextProps.task.link &&
    prevProps.task.position === nextProps.task.position &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.index === nextProps.index &&
    prevProps.list.id === nextProps.list.id &&
    // Labels comparison - compare by stringifying IDs
    JSON.stringify(prevProps.task.labels?.map(l => l.id)?.sort()) ===
    JSON.stringify(nextProps.task.labels?.map(l => l.id)?.sort()) &&
    // Subtasks comparison - compare by stringifying
    JSON.stringify(prevProps.task.subtasks?.map(s => ({ id: s.id, isCompleted: s.isCompleted }))) ===
    JSON.stringify(nextProps.task.subtasks?.map(s => ({ id: s.id, isCompleted: s.isCompleted })))
  );
});
