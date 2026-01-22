import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, Square, Link as LinkIcon, MessageSquare, GripVertical } from "lucide-react";
import type { Task, TaskList } from "../types";
import { ActionMenu } from "./ActionMenu";

interface SortableTaskProps {
  task: Task;
  list: TaskList;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleComplete: (task: Task, list: TaskList) => void;
}

export const SortableTask = ({ task, list, index, onEdit, onDelete, onToggleComplete }: SortableTaskProps) => {
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
          transition: 'all 0.2s',
        }}
        className="drag-handle opacity-0 group-hover/task:opacity-60 hover:!opacity-100"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--primary)';
          e.currentTarget.style.background = 'rgba(77, 171, 247, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.background = 'transparent';
        }}
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
        <div className="task-title" style={{
          fontSize: "13px",
          fontWeight: "500",
          lineHeight: "1.5",
          color: task.isCompleted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)"
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{
            marginTop: "4px",
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(77, 171, 247, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
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
        onMouseEnter={(e) => {
          if (!task.isCompleted) e.currentTarget.style.color = 'var(--success)';
        }}
        onMouseLeave={(e) => {
          if (!task.isCompleted) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        }}
      >
        {task.isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>
    </div>
  );
};
