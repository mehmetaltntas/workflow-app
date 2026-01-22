import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, Square, Link as LinkIcon, MessageSquare, GripVertical, Calendar, Flag, ListChecks } from "lucide-react";
import type { Task, TaskList, Priority } from "../types";
import { ActionMenu } from "./ActionMenu";

interface SortableTaskProps {
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
      return { label: 'Yüksek', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
    case 'MEDIUM':
      return { label: 'Orta', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' };
    case 'LOW':
      return { label: 'Düşük', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' };
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
    return { status: 'overdue', label: `${Math.abs(diffDays)} gün gecikti`, color: 'var(--danger)' };
  } else if (diffDays === 0) {
    return { status: 'today', label: 'Bugün', color: '#f59e0b' }; // Turuncu
  } else if (diffDays === 1) {
    return { status: 'tomorrow', label: 'Yarın', color: '#f59e0b' }; // Turuncu
  } else if (diffDays <= 7) {
    return { status: 'upcoming', label: `${diffDays} gün`, color: 'var(--primary)' };
  } else {
    // Format date as "15 Oca" style
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return { status: 'upcoming', label: due.toLocaleDateString('tr-TR', options), color: 'rgba(255,255,255,0.4)' };
  }
};

export const SortableTask = memo(({ task, list, index, onEdit, onDelete, onToggleComplete }: SortableTaskProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

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
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging
          ? "rgba(77, 171, 247, 0.15)"
          : task.isCompleted
            ? "rgba(81, 207, 102, 0.03)"
            : "rgba(255, 255, 255, 0.04)",
        padding: "12px 14px",
        borderRadius: "14px",
        border: isDragging
          ? "1px solid rgba(77, 171, 247, 0.3)"
          : task.isCompleted
            ? "1px solid rgba(81, 207, 102, 0.08)"
            : "1px solid rgba(255, 255, 255, 0.06)",
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      className="group/task"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          padding: '4px',
          borderRadius: '6px',
          color: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s, background 0.2s',
          touchAction: 'none',
        }}
        className="drag-handle opacity-0 group-hover/task:opacity-60 hover:!opacity-100 hover:!text-[var(--primary)] hover:!bg-[rgba(77,171,247,0.1)]"
      >
        <GripVertical size={14} />
      </div>

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
            {task.labels.map(label => (
              <span
                key={label.id}
                style={{
                  fontSize: '9px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '4px',
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
          fontSize: "13px",
          fontWeight: "500",
          lineHeight: "1.5",
          color: task.isCompleted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)"
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: task.description || dueDateInfo.status !== 'none' || priorityInfo.color || subtaskProgress ? '4px' : '0', flexWrap: 'wrap' }}>
          {task.description && (
            <div style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MessageSquare size={10} />
              <span>Not var</span>
            </div>
          )}
          {/* Subtasks Progress Badge */}
          {subtaskProgress && !task.isCompleted && (
            <div style={{
              fontSize: "10px",
              fontWeight: "600",
              color: subtaskProgress.completed === subtaskProgress.total
                ? 'var(--success)'
                : 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '6px',
              background: subtaskProgress.completed === subtaskProgress.total
                ? 'rgba(81, 207, 102, 0.15)'
                : 'rgba(255,255,255,0.05)',
            }}>
              <ListChecks size={10} />
              <span>{subtaskProgress.completed}/{subtaskProgress.total}</span>
            </div>
          )}
          {/* Priority Badge */}
          {priorityInfo.color && !task.isCompleted && (
            <div style={{
              fontSize: "10px",
              fontWeight: "600",
              color: priorityInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              borderRadius: '6px',
              background: priorityInfo.bgColor,
            }}>
              <Flag size={9} />
              <span>{priorityInfo.label}</span>
            </div>
          )}
          {/* Due Date Badge */}
          {dueDateInfo.status !== 'none' && !task.isCompleted && (
            <div style={{
              fontSize: "10px",
              fontWeight: "600",
              color: dueDateInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              borderRadius: '6px',
              background: dueDateInfo.status === 'overdue'
                ? 'rgba(239, 68, 68, 0.15)'
                : dueDateInfo.status === 'today' || dueDateInfo.status === 'tomorrow'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(255,255,255,0.05)',
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
            color: "var(--primary)",
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
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
          padding: '4px',
          borderRadius: '6px',
          transition: 'all 0.2s',
          color: task.isCompleted ? 'var(--success)' : 'rgba(255,255,255,0.5)',
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
    JSON.stringify(prevProps.task.labels?.map(l => l.id).sort()) ===
    JSON.stringify(nextProps.task.labels?.map(l => l.id).sort()) &&
    // Subtasks comparison - compare by stringifying
    JSON.stringify(prevProps.task.subtasks?.map(s => ({ id: s.id, isCompleted: s.isCompleted }))) ===
    JSON.stringify(nextProps.task.subtasks?.map(s => ({ id: s.id, isCompleted: s.isCompleted })))
  );
});
