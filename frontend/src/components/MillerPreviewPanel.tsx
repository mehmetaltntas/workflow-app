import React from 'react';
import {
  FileText,
  Calendar,
  Flag,
  Tag,
  CheckSquare,
  ExternalLink,
  Clock,
  ListTodo,
  Folder,
  Edit2,
  Check,
  Square,
  AlertCircle,
  CheckCircle2,
  Circle,
  Trash2
} from 'lucide-react';
import type { Task, TaskList, Subtask, Priority } from '../types';
import { colors, typography, spacing, radius, shadows, animation } from '../styles/tokens';

type PreviewType = 'list' | 'task' | 'subtask' | null;

interface MillerPreviewPanelProps {
  type: PreviewType;
  data: TaskList | Task | Subtask | null;
  tasks?: Task[];
  subtasks?: Subtask[];
  isLoading?: boolean;
  onEditTask?: (task: Task) => void;
  onEditList?: (list: TaskList) => void;
  onEditSubtask?: (subtask: Subtask) => void;
  onToggleTask?: (task: Task) => void;
  onToggleList?: (list: TaskList) => void;
  onToggleSubtask?: (subtask: Subtask) => void;
  onDeleteSubtask?: (subtaskId: number) => void;
}

// Priority bilgisi
const getPriorityConfig = (priority?: Priority) => {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'Yüksek',
        color: colors.priority.high,
        bgColor: colors.priority.highBg,
        icon: AlertCircle
      };
    case 'MEDIUM':
      return {
        label: 'Orta',
        color: colors.priority.medium,
        bgColor: colors.priority.mediumBg,
        icon: Circle
      };
    case 'LOW':
      return {
        label: 'Düşük',
        color: colors.priority.low,
        bgColor: colors.priority.lowBg,
        icon: Circle
      };
    default:
      return null;
  }
};

// Tarih formatlama
const formatDueDate = (dateString?: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDate = new Date(dateString);
  taskDate.setHours(0, 0, 0, 0);

  const diff = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (taskDate.getTime() === today.getTime()) {
    return { label: 'Bugün', color: colors.semantic.warning, isUrgent: true };
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return { label: 'Yarın', color: colors.priority.medium, isUrgent: false };
  } else if (taskDate < today) {
    return { label: `${Math.abs(diff)} gün gecikti`, color: colors.priority.high, isUrgent: true };
  } else if (diff <= 7) {
    return {
      label: date.toLocaleDateString('tr-TR', { weekday: 'long' }),
      color: colors.brand.primary,
      isUrgent: false
    };
  } else {
    return {
      label: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      color: colors.dark.text.secondary,
      isUrgent: false
    };
  }
};

// Ortak stiller
const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: colors.dark.bg.elevated,
    overflow: 'hidden',
    animation: `fadeIn ${animation.duration.normal} ${animation.easing.smooth}`,
  },
  header: {
    padding: spacing[6],
    background: `linear-gradient(180deg, ${colors.dark.bg.card} 0%, ${colors.dark.bg.elevated} 100%)`,
    borderBottom: `1px solid ${colors.dark.border.subtle}`,
  },
  sectionTitle: {
    margin: 0,
    marginBottom: spacing[3],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.dark.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.wider,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  },
  infoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: radius.lg,
    background: colors.dark.glass.bg,
    border: `1px solid ${colors.dark.border.subtle}`,
    transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1.5],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    padding: `${spacing[1]} ${spacing[2.5]}`,
    borderRadius: radius.md,
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: radius.lg,
    border: 'none',
    cursor: 'pointer',
    transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2.5]} ${spacing[4]}`,
    borderRadius: radius.lg,
    background: colors.brand.primaryLight,
    color: colors.brand.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textDecoration: 'none',
    border: `1px solid ${colors.brand.primary}30`,
    transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
    cursor: 'pointer',
  },
  progressBar: {
    height: '8px',
    borderRadius: radius.full,
    background: colors.dark.border.strong,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    transition: `width ${animation.duration.slow} ${animation.easing.spring}`,
  },
};

// Info Row Bileşeni
const InfoRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  color?: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div style={styles.infoCard}>
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: radius.md,
        background: color ? `${color}20` : colors.dark.bg.active,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={16} style={{ color: color || colors.dark.text.muted }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: colors.dark.text.muted,
          marginBottom: spacing[0.5],
          textTransform: 'uppercase',
          letterSpacing: typography.letterSpacing.wide,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.medium,
          color: color || colors.dark.text.primary,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

// Progress Bileşeni
const ProgressSection: React.FC<{
  completed: number;
  total: number;
  label?: string;
}> = ({ completed, total, label = 'İlerleme' }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ marginBottom: spacing[5] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
        <span style={{ fontSize: typography.fontSize.sm, color: colors.dark.text.muted, fontWeight: typography.fontWeight.medium }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.dark.text.primary }}>
            {completed}/{total}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: percentage === 100 ? colors.semantic.success : colors.brand.primary,
              background: percentage === 100 ? colors.semantic.successLight : colors.brand.primaryLight,
              padding: `${spacing[0.5]} ${spacing[2]}`,
              borderRadius: radius.full,
            }}
          >
            %{percentage}
          </span>
        </div>
      </div>
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            background: percentage === 100
              ? `linear-gradient(90deg, ${colors.semantic.success}, ${colors.semantic.successDark})`
              : `linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
          }}
        />
      </div>
    </div>
  );
};

// Labels Bileşeni
const LabelsSection: React.FC<{
  labels: Array<{ id: number; name: string; color: string }>;
}> = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  return (
    <div style={{ marginBottom: spacing[5] }}>
      <h4 style={styles.sectionTitle}>
        <Tag size={12} />
        Etiketler
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
        {labels.map((label) => (
          <span
            key={label.id}
            style={{
              ...styles.badge,
              color: label.color,
              background: `${label.color}20`,
              border: `1px solid ${label.color}40`,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: radius.full,
                background: label.color,
              }}
            />
            {label.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export const MillerPreviewPanel: React.FC<MillerPreviewPanelProps> = ({
  type,
  data,
  tasks,
  subtasks,
  isLoading = false,
  onEditTask,
  onEditList,
  onEditSubtask,
  onToggleTask,
  onToggleList,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  // Boş durum
  if (!type || !data) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[10],
          color: colors.dark.text.muted,
          textAlign: 'center',
          background: colors.dark.bg.elevated,
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: radius.xl,
            background: colors.dark.bg.active,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[5],
          }}
        >
          <Folder size={36} style={{ opacity: 0.4 }} />
        </div>
        <p style={{ fontSize: typography.fontSize.lg, margin: 0, fontWeight: typography.fontWeight.medium }}>
          Detayları görmek için bir öğe seçin
        </p>
        <p style={{ fontSize: typography.fontSize.base, margin: `${spacing[2]} 0 0`, opacity: 0.6 }}>
          veya üzerine gelin
        </p>
      </div>
    );
  }

  // Yükleniyor durumu
  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[10],
          color: colors.dark.text.muted,
          background: colors.dark.bg.elevated,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${colors.dark.border.default}`,
              borderTopColor: colors.brand.primary,
              borderRadius: radius.full,
              margin: '0 auto',
              marginBottom: spacing[4],
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: typography.fontSize.base }}>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Liste Önizlemesi
  if (type === 'list') {
    const list = data as TaskList;
    const completedTasks = tasks?.filter(t => t.isCompleted).length || 0;
    const totalTasks = tasks?.length || 0;
    const priority = getPriorityConfig(list.priority);
    const dueDate = formatDueDate(list.dueDate);

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[4] }}>
            {/* Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: radius.xl,
                background: list.isCompleted
                  ? `linear-gradient(135deg, ${colors.semantic.success}, ${colors.semantic.successDark})`
                  : `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.md,
                flexShrink: 0,
              }}
            >
              {list.isCompleted ? (
                <CheckCircle2 size={26} color={colors.dark.text.primary} />
              ) : (
                <Folder size={26} color={colors.dark.text.primary} />
              )}
            </div>

            {/* Title & Status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.dark.text.primary,
                  lineHeight: typography.lineHeight.tight,
                  textDecoration: list.isCompleted ? 'line-through' : 'none',
                  opacity: list.isCompleted ? 0.7 : 1,
                }}
              >
                {list.name}
              </h2>

              {/* Status Badge */}
              {list.isCompleted && (
                <span
                  style={{
                    ...styles.badge,
                    marginTop: spacing[2],
                    color: colors.semantic.success,
                    background: colors.semantic.successLight,
                  }}
                >
                  <CheckSquare size={12} />
                  Tamamlandı
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
              {onToggleList && (
                <button
                  onClick={() => onToggleList(list)}
                  style={{
                    ...styles.iconButton,
                    background: list.isCompleted ? colors.semantic.warningLight : colors.semantic.successLight,
                    color: list.isCompleted ? colors.semantic.warning : colors.semantic.success,
                  }}
                  title={list.isCompleted ? 'Geri Al' : 'Tamamla'}
                >
                  {list.isCompleted ? <Square size={18} /> : <CheckSquare size={18} />}
                </button>
              )}
              {onEditList && (
                <button
                  onClick={() => onEditList(list)}
                  style={{
                    ...styles.iconButton,
                    background: colors.brand.primaryLight,
                    color: colors.brand.primary,
                  }}
                  title="Düzenle"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {totalTasks > 0 && (
            <div style={{ marginTop: spacing[5] }}>
              <ProgressSection completed={completedTasks} total={totalTasks} label="Görev İlerlemesi" />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: spacing[5], overflowY: 'auto' }}>
          {/* Info Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[5] }}>
            {/* Açıklama */}
            {list.description && (
              <InfoRow
                icon={FileText}
                label="Açıklama"
                value={list.description}
                color={colors.brand.primary}
              />
            )}

            {/* Son Tarih */}
            {dueDate && (
              <InfoRow
                icon={Calendar}
                label="Son Tarih"
                value={dueDate.label}
                color={dueDate.color}
              />
            )}

            {/* Öncelik */}
            {priority && (
              <InfoRow
                icon={Flag}
                label="Öncelik"
                value={priority.label}
                color={priority.color}
              />
            )}
          </div>

          {/* Etiketler */}
          <LabelsSection labels={list.labels || []} />

          {/* Bağlantı */}
          {list.link && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={styles.sectionTitle}>
                <ExternalLink size={12} />
                Bağlantı
              </h4>
              <a
                href={list.link}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.linkButton}
              >
                <ExternalLink size={16} />
                Bağlantıyı Aç
              </a>
            </div>
          )}

          {/* Oluşturulma Tarihi */}
          {list.createdAt && (
            <div
              style={{
                marginTop: spacing[6],
                paddingTop: spacing[4],
                borderTop: `1px solid ${colors.dark.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.dark.text.muted,
              }}
            >
              <Clock size={14} />
              {new Date(list.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} tarihinde oluşturuldu
            </div>
          )}
        </div>
      </div>
    );
  }

  // Görev Önizlemesi
  if (type === 'task') {
    const task = data as Task;
    const priority = getPriorityConfig(task.priority);
    const dueDate = formatDueDate(task.dueDate);
    const completedSubtasks = subtasks?.filter(s => s.isCompleted).length ||
                              task.subtasks?.filter(s => s.isCompleted).length || 0;
    const totalSubtasks = subtasks?.length || task.subtasks?.length || 0;

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[4] }}>
            {/* Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: radius.xl,
                background: task.isCompleted
                  ? `linear-gradient(135deg, ${colors.semantic.success}, ${colors.semantic.successDark})`
                  : colors.dark.bg.active,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: task.isCompleted ? shadows.md : 'none',
                border: task.isCompleted ? 'none' : `2px solid ${colors.dark.border.strong}`,
                flexShrink: 0,
              }}
            >
              {task.isCompleted ? (
                <CheckCircle2 size={26} color={colors.dark.text.primary} />
              ) : (
                <FileText size={26} style={{ color: colors.dark.text.muted }} />
              )}
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.dark.text.primary,
                  lineHeight: typography.lineHeight.tight,
                  textDecoration: task.isCompleted ? 'line-through' : 'none',
                  opacity: task.isCompleted ? 0.7 : 1,
                }}
              >
                {task.title}
              </h2>

              {/* Quick Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] }}>
                {task.isCompleted && (
                  <span
                    style={{
                      ...styles.badge,
                      color: colors.semantic.success,
                      background: colors.semantic.successLight,
                    }}
                  >
                    <CheckSquare size={12} />
                    Tamamlandı
                  </span>
                )}
                {priority && (
                  <span
                    style={{
                      ...styles.badge,
                      color: priority.color,
                      background: priority.bgColor,
                    }}
                  >
                    <Flag size={12} />
                    {priority.label}
                  </span>
                )}
                {dueDate && (
                  <span
                    style={{
                      ...styles.badge,
                      color: dueDate.color,
                      background: `${dueDate.color}20`,
                    }}
                  >
                    <Calendar size={12} />
                    {dueDate.label}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
              {onToggleTask && (
                <button
                  onClick={() => onToggleTask(task)}
                  style={{
                    ...styles.iconButton,
                    background: task.isCompleted ? colors.semantic.warningLight : colors.semantic.successLight,
                    color: task.isCompleted ? colors.semantic.warning : colors.semantic.success,
                  }}
                  title={task.isCompleted ? 'Geri Al' : 'Tamamla'}
                >
                  {task.isCompleted ? <Square size={18} /> : <Check size={18} />}
                </button>
              )}
              {onEditTask && (
                <button
                  onClick={() => onEditTask(task)}
                  style={{
                    ...styles.iconButton,
                    background: colors.brand.primaryLight,
                    color: colors.brand.primary,
                  }}
                  title="Düzenle"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Alt Görev Progress */}
          {totalSubtasks > 0 && (
            <div style={{ marginTop: spacing[5] }}>
              <ProgressSection completed={completedSubtasks} total={totalSubtasks} label="Alt Görev İlerlemesi" />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: spacing[5], overflowY: 'auto' }}>
          {/* Açıklama */}
          {task.description && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={styles.sectionTitle}>
                <FileText size={12} />
                Açıklama
              </h4>
              <div
                style={{
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  background: colors.dark.glass.bg,
                  border: `1px solid ${colors.dark.border.subtle}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: typography.fontSize.lg,
                    color: colors.dark.text.primary,
                    lineHeight: typography.lineHeight.relaxed,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* Detay Bilgileri Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[5] }}>
            {/* Son Tarih (eğer header'da yoksa burada göster) */}
            {dueDate && (
              <InfoRow
                icon={Calendar}
                label="Son Tarih"
                value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    {dueDate.label}
                    {dueDate.isUrgent && (
                      <AlertCircle size={14} style={{ color: dueDate.color }} />
                    )}
                  </span>
                }
                color={dueDate.color}
              />
            )}

            {/* Öncelik */}
            {priority && (
              <InfoRow
                icon={Flag}
                label="Öncelik"
                value={priority.label}
                color={priority.color}
              />
            )}
          </div>

          {/* Etiketler */}
          <LabelsSection labels={task.labels || []} />

          {/* Bağlantı */}
          {task.link && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={styles.sectionTitle}>
                <ExternalLink size={12} />
                Bağlantı
              </h4>
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.linkButton}
              >
                <ExternalLink size={16} />
                Bağlantıyı Aç
              </a>
            </div>
          )}

          {/* Alt Görevler */}
          {totalSubtasks > 0 && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={styles.sectionTitle}>
                <ListTodo size={12} />
                Alt Görevler ({completedSubtasks}/{totalSubtasks})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {(subtasks || task.subtasks || []).map((subtask) => (
                  <div
                    key={subtask.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
                      borderRadius: radius.lg,
                      background: subtask.isCompleted
                        ? colors.semantic.successLight
                        : colors.dark.glass.bg,
                      border: `1px solid ${subtask.isCompleted ? `${colors.semantic.success}30` : colors.dark.border.subtle}`,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: radius.sm,
                        border: subtask.isCompleted
                          ? `2px solid ${colors.semantic.success}`
                          : `2px solid ${colors.dark.border.strong}`,
                        background: subtask.isCompleted ? colors.semantic.success : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {subtask.isCompleted && <Check size={12} color={colors.dark.text.primary} />}
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.medium,
                        color: subtask.isCompleted ? colors.dark.text.muted : colors.dark.text.primary,
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

          {/* Oluşturulma Tarihi */}
          {task.createdAt && (
            <div
              style={{
                marginTop: spacing[6],
                paddingTop: spacing[4],
                borderTop: `1px solid ${colors.dark.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.dark.text.muted,
              }}
            >
              <Clock size={14} />
              {new Date(task.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} tarihinde oluşturuldu
            </div>
          )}
        </div>
      </div>
    );
  }

  // Alt Görev (Subtask) Önizlemesi
  if (type === 'subtask') {
    const subtask = data as Subtask;
    const priority = getPriorityConfig(subtask.priority);
    const dueDate = formatDueDate(subtask.dueDate);

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[4] }}>
            {/* Icon */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radius.lg,
                background: subtask.isCompleted
                  ? `linear-gradient(135deg, ${colors.semantic.success}, ${colors.semantic.successDark})`
                  : colors.dark.bg.active,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: subtask.isCompleted ? shadows.md : 'none',
                border: subtask.isCompleted ? 'none' : `2px solid ${colors.dark.border.strong}`,
                flexShrink: 0,
              }}
            >
              {subtask.isCompleted ? (
                <CheckCircle2 size={24} color={colors.dark.text.primary} />
              ) : (
                <ListTodo size={24} style={{ color: colors.dark.text.muted }} />
              )}
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.dark.text.primary,
                  lineHeight: typography.lineHeight.tight,
                  textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                  opacity: subtask.isCompleted ? 0.7 : 1,
                }}
              >
                {subtask.title}
              </h2>

              {/* Quick Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] }}>
                {subtask.isCompleted && (
                  <span
                    style={{
                      ...styles.badge,
                      color: colors.semantic.success,
                      background: colors.semantic.successLight,
                    }}
                  >
                    <CheckSquare size={12} />
                    Tamamlandı
                  </span>
                )}
                {priority && (
                  <span
                    style={{
                      ...styles.badge,
                      color: priority.color,
                      background: priority.bgColor,
                    }}
                  >
                    <Flag size={12} />
                    {priority.label}
                  </span>
                )}
                {dueDate && (
                  <span
                    style={{
                      ...styles.badge,
                      color: dueDate.color,
                      background: `${dueDate.color}20`,
                    }}
                  >
                    <Calendar size={12} />
                    {dueDate.label}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
              {onToggleSubtask && (
                <button
                  onClick={() => onToggleSubtask(subtask)}
                  style={{
                    ...styles.iconButton,
                    background: subtask.isCompleted ? colors.semantic.warningLight : colors.semantic.successLight,
                    color: subtask.isCompleted ? colors.semantic.warning : colors.semantic.success,
                  }}
                  title={subtask.isCompleted ? 'Geri Al' : 'Tamamla'}
                >
                  {subtask.isCompleted ? <Square size={18} /> : <Check size={18} />}
                </button>
              )}
              {subtask.link && (
                <a
                  href={subtask.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...styles.iconButton,
                    background: colors.brand.primaryLight,
                    color: colors.brand.primary,
                    textDecoration: 'none',
                  }}
                  title="Bağlantıyı Aç"
                >
                  <ExternalLink size={18} />
                </a>
              )}
              {onEditSubtask && (
                <button
                  onClick={() => onEditSubtask(subtask)}
                  style={{
                    ...styles.iconButton,
                    background: colors.brand.primaryLight,
                    color: colors.brand.primary,
                  }}
                  title="Düzenle"
                >
                  <Edit2 size={18} />
                </button>
              )}
              {onDeleteSubtask && (
                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  style={{
                    ...styles.iconButton,
                    background: colors.semantic.dangerLight,
                    color: colors.semantic.danger,
                  }}
                  title="Sil"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: spacing[5], overflowY: 'auto' }}>
          {/* Açıklama */}
          {subtask.description && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={styles.sectionTitle}>
                <FileText size={12} />
                Açıklama
              </h4>
              <div
                style={{
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  background: colors.dark.glass.bg,
                  border: `1px solid ${colors.dark.border.subtle}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: typography.fontSize.lg,
                    color: colors.dark.text.primary,
                    lineHeight: typography.lineHeight.relaxed,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {subtask.description}
                </p>
              </div>
            </div>
          )}

          {/* Bağlantı */}
          {subtask.link && (
            <div style={{ marginBottom: spacing[5] }}>
              <h4 style={styles.sectionTitle}>
                <ExternalLink size={12} />
                Bağlantı
              </h4>
              <a
                href={subtask.link}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.linkButton}
              >
                <ExternalLink size={16} />
                Bağlantıyı Aç
              </a>
            </div>
          )}

          {/* Detay Bilgileri Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[5] }}>
            {/* Son Tarih */}
            {dueDate && (
              <InfoRow
                icon={Calendar}
                label="Son Tarih"
                value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    {dueDate.label}
                    {dueDate.isUrgent && (
                      <AlertCircle size={14} style={{ color: dueDate.color }} />
                    )}
                  </span>
                }
                color={dueDate.color}
              />
            )}

            {/* Öncelik */}
            {priority && (
              <InfoRow
                icon={Flag}
                label="Öncelik"
                value={priority.label}
                color={priority.color}
              />
            )}
          </div>

          {/* Etiketler */}
          <LabelsSection labels={subtask.labels || []} />

          {/* Oluşturulma Tarihi */}
          {subtask.createdAt && (
            <div
              style={{
                marginTop: spacing[6],
                paddingTop: spacing[4],
                borderTop: `1px solid ${colors.dark.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.dark.text.muted,
              }}
            >
              <Clock size={14} />
              {new Date(subtask.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} tarihinde oluşturuldu
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MillerPreviewPanel;
