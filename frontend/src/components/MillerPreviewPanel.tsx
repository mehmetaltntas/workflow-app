import React from 'react';
import {
  FileText,
  Calendar,
  Flag,
  Tag,
  CheckSquare,
  Link as LinkIcon,
  Clock,
  ListTodo,
  Folder
} from 'lucide-react';
import type { Task, TaskList, Subtask } from '../types';

type PreviewType = 'list' | 'task' | 'subtask' | null;

interface MillerPreviewPanelProps {
  type: PreviewType;
  data: TaskList | Task | Subtask | null;
  tasks?: Task[]; // Liste için görevler
  subtasks?: Subtask[]; // Task için alt görevler
  isLoading?: boolean;
}

const getPriorityLabel = (priority?: string) => {
  switch (priority) {
    case 'HIGH': return { label: 'Yüksek', color: '#ef4444' };
    case 'MEDIUM': return { label: 'Orta', color: '#f59e0b' };
    case 'LOW': return { label: 'Düşük', color: '#22c55e' };
    default: return null;
  }
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDate = new Date(dateString);
  taskDate.setHours(0, 0, 0, 0);

  if (taskDate.getTime() === today.getTime()) {
    return { label: 'Bugün', color: '#f59e0b' };
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return { label: 'Yarın', color: '#f59e0b' };
  } else if (taskDate < today) {
    const diff = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
    return { label: `${diff} gün gecikti`, color: '#ef4444' };
  } else {
    return {
      label: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      color: 'var(--primary)'
    };
  }
};

export const MillerPreviewPanel: React.FC<MillerPreviewPanelProps> = ({
  type,
  data,
  tasks,
  subtasks,
  isLoading = false,
}) => {
  if (!type || !data) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <Folder size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', margin: 0 }}>
          Detayları görmek için bir öğe seçin
        </p>
        <p style={{ fontSize: '12px', margin: '8px 0 0', opacity: 0.7 }}>
          veya üzerine gelin
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: '13px' }}>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Liste Önizlemesi
  if (type === 'list') {
    const list = data as TaskList;
    const completedTasks = tasks?.filter(t => t.isCompleted).length || 0;
    const totalTasks = tasks?.length || 0;

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Folder size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
                {list.name}
              </h2>
              {list.isCompleted && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--success)',
                    background: 'rgba(81, 207, 102, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Tamamlandı
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          {totalTasks > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>İlerleme</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(completedTasks / totalTasks) * 100}%`,
                    background: 'var(--success)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {list.link && (
            <a
              href={list.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--primary)',
                textDecoration: 'none',
              }}
            >
              <LinkIcon size={14} />
              Bağlantıyı aç
            </a>
          )}
        </div>

        {/* Tasks Preview */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Görevler ({totalTasks})
          </h4>

          {tasks && tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: task.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                      textDecoration: task.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </div>
                </div>
              ))}
              {tasks.length > 5 && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '8px',
                  }}
                >
                  +{tasks.length - 5} görev daha
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              Bu listede görev yok
            </div>
          )}
        </div>
      </div>
    );
  }

  // Task Önizlemesi
  if (type === 'task') {
    const task = data as Task;
    const priority = getPriorityLabel(task.priority);
    const dueDate = formatDate(task.dueDate);
    const completedSubtasks = subtasks?.filter(s => s.isCompleted).length ||
                              task.subtasks?.filter(s => s.isCompleted).length || 0;
    const totalSubtasks = subtasks?.length || task.subtasks?.length || 0;

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: task.isCompleted ? 'var(--success)' : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {task.isCompleted ? (
                <CheckSquare size={20} color="white" />
              ) : (
                <FileText size={20} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  textDecoration: task.isCompleted ? 'line-through' : 'none',
                  opacity: task.isCompleted ? 0.7 : 1,
                }}
              >
                {task.title}
              </h2>

              {/* Badges Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {task.isCompleted && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--success)',
                      background: 'rgba(81, 207, 102, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    <CheckSquare size={12} />
                    Tamamlandı
                  </span>
                )}

                {priority && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: priority.color,
                      background: `${priority.color}20`,
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    <Flag size={12} />
                    {priority.label}
                  </span>
                )}

                {dueDate && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: dueDate.color,
                      background: `${dueDate.color}20`,
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    <Calendar size={12} />
                    {dueDate.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
              {task.labels.map((label) => (
                <span
                  key={label.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: label.color,
                    background: `${label.color}20`,
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  <Tag size={10} />
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--primary)',
                textDecoration: 'none',
              }}
            >
              <LinkIcon size={14} />
              Bağlantıyı aç
            </a>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '24px' }}>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={12} />
                Açıklama
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {task.description}
              </p>
            </div>
          )}

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div>
              <h4
                style={{
                  margin: '0 0 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ListTodo size={12} />
                Alt Görevler ({completedSubtasks}/{totalSubtasks})
              </h4>

              {/* Progress Bar */}
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                    background: 'var(--success)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(subtasks || task.subtasks || []).map((subtask) => (
                  <div
                    key={subtask.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: subtask.isCompleted
                        ? 'rgba(81, 207, 102, 0.08)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: subtask.isCompleted
                          ? '2px solid var(--success)'
                          : '2px solid var(--border)',
                        background: subtask.isCompleted ? 'var(--success)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {subtask.isCompleted && (
                        <CheckSquare size={10} color="white" />
                      )}
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        color: subtask.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created Date */}
          {task.createdAt && (
            <div
              style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <Clock size={12} />
              Oluşturulma: {new Date(task.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MillerPreviewPanel;
