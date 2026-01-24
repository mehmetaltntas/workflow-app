import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight, Folder, FileText, CheckSquare, Loader2, Plus, MoreHorizontal, Edit2, Trash2, Check, ListTodo } from 'lucide-react';
import { colors, typography, spacing, radius, shadows, animation } from '../styles/tokens';

// Miller Column item tipi
export interface MillerColumnItem {
  id: number;
  title: string;
  subtitle?: string;
  icon?: 'folder' | 'file' | 'task';
  isCompleted?: boolean;
  hasChildren?: boolean;
  metadata?: {
    count?: number;
    labels?: Array<{ id: number; color: string }>;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    dueDate?: string;
  };
}

interface MillerColumnProps {
  title: string;
  items: MillerColumnItem[];
  selectedId: number | null;
  hoveredId: number | null;
  onSelect: (item: MillerColumnItem) => void;
  onHover: (item: MillerColumnItem | null) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  columnIndex: number;
  onAddItem?: () => void;
  onItemEdit?: (item: MillerColumnItem) => void;
  onItemDelete?: (item: MillerColumnItem) => void;
  onItemToggle?: (item: MillerColumnItem) => void;
}

const getIconComponent = (icon?: string, isCompleted?: boolean, hasChildren?: boolean) => {
  if (isCompleted) {
    return <CheckSquare size={16} style={{ color: colors.semantic.success }} />;
  }
  switch (icon) {
    case 'folder':
      return <Folder size={16} style={{ color: colors.brand.primary }} />;
    case 'task':
      // Task with subtasks gets a different icon than task without
      return hasChildren
        ? <ListTodo size={16} style={{ color: colors.brand.primary }} />
        : <FileText size={16} style={{ color: colors.dark.text.muted }} />;
    case 'subtask':
      return <FileText size={16} style={{ color: colors.dark.text.tertiary }} />;
    default:
      return <FileText size={16} style={{ color: colors.dark.text.muted }} />;
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'HIGH': return colors.priority.high;
    case 'MEDIUM': return colors.priority.medium;
    case 'LOW': return colors.priority.low;
    default: return 'transparent';
  }
};

export const MillerColumn: React.FC<MillerColumnProps> = ({
  title,
  items,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  isLoading = false,
  emptyMessage = 'Bu sütunda öğe yok',
  columnIndex,
  onAddItem,
  onItemEdit,
  onItemDelete,
  onItemToggle,
}) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  // Seçili öğeyi görünür yap
  useEffect(() => {
    if (selectedRef.current && columnRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedId]);

  // Column background colors based on depth - improved for better visual hierarchy
  const getColumnBackground = (index: number) => {
    switch (index) {
      case 0: // Lists column - darkest for visual anchor
        return `linear-gradient(180deg, ${colors.dark.bg.secondary} 0%, rgba(13, 14, 16, 0.95) 100%)`;
      case 1: // Tasks column - slightly lighter
        return `linear-gradient(180deg, rgba(26, 27, 30, 0.98) 0%, rgba(20, 21, 24, 0.95) 100%)`;
      case 2: // Subtasks column - lightest for depth perception
        return `linear-gradient(180deg, rgba(30, 32, 36, 0.95) 0%, rgba(25, 27, 31, 0.92) 100%)`;
      default:
        return colors.dark.bg.body;
    }
  };

  // Card background colors based on column depth
  const getCardBackground = (index: number, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return colors.brand.primary;
    if (isHovered) return 'rgba(255, 255, 255, 0.08)';

    switch (index) {
      case 0: // Lists - solid background
        return 'rgba(35, 38, 45, 0.9)';
      case 1: // Tasks - slightly transparent
        return 'rgba(40, 43, 50, 0.85)';
      case 2: // Subtasks - more transparent
        return 'rgba(45, 48, 55, 0.8)';
      default:
        return colors.dark.glass.bg;
    }
  };

  return (
    <div
      ref={columnRef}
      style={{
        width: '320px',
        minWidth: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${colors.dark.border.default}`,
        background: getColumnBackground(columnIndex),
        animation: `millerSlideIn ${animation.duration.normal} ${animation.easing.spring}`,
      }}
    >
      {/* Sütun Başlığı */}
      <div
        style={{
          padding: `${spacing[3]} ${spacing[4]}`,
          borderBottom: `1px solid ${colors.dark.border.subtle}`,
          background: colors.dark.glass.bg,
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: colors.dark.text.muted,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wider,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          {title}
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.brand.primary,
              background: colors.brand.primaryLight,
              padding: `${spacing[0.5]} ${spacing[2]}`,
              borderRadius: radius.full,
            }}
          >
            {items.length}
          </span>
        </h3>
        {onAddItem && (
          <button
            onClick={onAddItem}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: radius.md,
              border: `1px solid ${colors.brand.primary}30`,
              background: colors.brand.primaryLight,
              color: colors.brand.primary,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
              boxShadow: shadows.sm,
            }}
            title="Ekle"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Sütun İçeriği */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: spacing[2],
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${spacing[10]} ${spacing[5]}`,
              color: colors.dark.text.muted,
              gap: spacing[3],
            }}
          >
            <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite', color: colors.brand.primary }} />
            <span style={{ fontSize: typography.fontSize.base }}>Yükleniyor...</span>
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${spacing[10]} ${spacing[5]}`,
              color: colors.dark.text.muted,
              fontSize: typography.fontSize.base,
              textAlign: 'center',
              gap: spacing[3],
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radius.lg,
                background: colors.dark.bg.hover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {columnIndex === 2 ? <ListTodo size={24} style={{ opacity: 0.4 }} /> : <FileText size={24} style={{ opacity: 0.4 }} />}
            </div>
            <span>{emptyMessage}</span>
            {onAddItem && (
              <button
                onClick={onAddItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1.5],
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: radius.md,
                  border: `1px dashed ${colors.brand.primary}50`,
                  background: 'transparent',
                  color: colors.brand.primary,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
                }}
              >
                <Plus size={14} />
                {columnIndex === 2 ? 'Alt Görev Ekle' : 'Ekle'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
            {items.map((item) => {
              const isSelected = selectedId === item.id;
              const isHovered = hoveredId === item.id;

              return (
                <button
                  key={item.id}
                  ref={isSelected ? selectedRef : null}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => onHover(item)}
                  onMouseLeave={() => onHover(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[3.5]}`,
                    border: isSelected
                      ? `1px solid ${colors.brand.primary}`
                      : `1px solid ${isHovered ? colors.dark.border.strong : colors.dark.border.default}`,
                    borderRadius: radius.lg,
                    background: getCardBackground(columnIndex, isSelected, isHovered),
                    cursor: 'pointer',
                    transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
                    textAlign: 'left',
                    position: 'relative',
                    boxShadow: isSelected
                      ? `${shadows.md}, 0 0 0 1px rgba(77, 171, 247, 0.3)`
                      : isHovered
                        ? '0 4px 16px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {/* Priority Indicator */}
                  {item.metadata?.priority && item.metadata.priority !== 'NONE' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: spacing[1],
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '50%',
                        borderRadius: radius.full,
                        background: getPriorityColor(item.metadata.priority),
                        boxShadow: `0 0 8px ${getPriorityColor(item.metadata.priority)}60`,
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: radius.md,
                      background: isSelected
                        ? 'rgba(255, 255, 255, 0.2)'
                        : item.isCompleted
                          ? colors.semantic.successLight
                          : colors.dark.bg.active,
                      border: item.isCompleted && !isSelected
                        ? `1px solid ${colors.semantic.success}30`
                        : 'none',
                      flexShrink: 0,
                      transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
                    }}
                  >
                    {getIconComponent(item.icon, item.isCompleted, item.hasChildren)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.medium,
                        color: isSelected ? colors.dark.text.inverse : colors.dark.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: typography.lineHeight.tight,
                      }}
                    >
                      {item.title}
                    </div>

                    {/* Subtitle / Metadata Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        marginTop: spacing[1],
                      }}
                    >
                      {item.subtitle && (
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            color: isSelected
                              ? 'rgba(0, 0, 0, 0.7)'
                              : colors.dark.text.muted,
                          }}
                        >
                          {item.subtitle}
                        </span>
                      )}

                      {/* Labels Preview */}
                      {item.metadata?.labels && item.metadata.labels.length > 0 && (
                        <div style={{ display: 'flex', gap: spacing[1], alignItems: 'center' }}>
                          {item.metadata.labels.slice(0, 3).map((label) => (
                            <div
                              key={label.id}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: radius.full,
                                background: label.color,
                                boxShadow: `0 0 4px ${label.color}60`,
                              }}
                            />
                          ))}
                          {item.metadata.labels.length > 3 && (
                            <span
                              style={{
                                fontSize: typography.fontSize.xs,
                                color: isSelected
                                  ? 'rgba(0, 0, 0, 0.5)'
                                  : colors.dark.text.muted,
                                fontWeight: typography.fontWeight.medium,
                              }}
                            >
                              +{item.metadata.labels.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Task Count Badge */}
                      {item.metadata?.count !== undefined && (
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.semibold,
                            color: isSelected
                              ? 'rgba(0, 0, 0, 0.7)'
                              : colors.dark.text.muted,
                            background: isSelected
                              ? 'rgba(255, 255, 255, 0.15)'
                              : colors.dark.bg.active,
                            padding: `${spacing[0.5]} ${spacing[1.5]}`,
                            borderRadius: radius.sm,
                          }}
                        >
                          {item.metadata.count} görev
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Menu Button */}
                  {(onItemEdit || onItemDelete || onItemToggle) && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuId(actionMenuId === item.id ? null : item.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: radius.md,
                          border: 'none',
                          background: actionMenuId === item.id
                            ? (isSelected ? 'rgba(0, 0, 0, 0.15)' : colors.dark.bg.active)
                            : 'transparent',
                          color: isSelected ? 'rgba(0, 0, 0, 0.6)' : colors.dark.text.muted,
                          cursor: 'pointer',
                          opacity: isHovered || isSelected || actionMenuId === item.id ? 1 : 0,
                          transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Action Menu Dropdown */}
                      {actionMenuId === item.id && (
                        <>
                          <div
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 99,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(null);
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: spacing[1],
                              background: colors.dark.bg.card,
                              border: `1px solid ${colors.dark.border.default}`,
                              borderRadius: radius.lg,
                              padding: spacing[1.5],
                              minWidth: '150px',
                              zIndex: 100,
                              boxShadow: shadows.dropdown,
                              backdropFilter: 'blur(12px)',
                            }}
                          >
                            {onItemToggle && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onItemToggle(item);
                                  setActionMenuId(null);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: spacing[2],
                                  width: '100%',
                                  padding: `${spacing[2]} ${spacing[2.5]}`,
                                  borderRadius: radius.md,
                                  border: 'none',
                                  background: 'transparent',
                                  color: item.isCompleted ? colors.semantic.warning : colors.semantic.success,
                                  fontSize: typography.fontSize.base,
                                  fontWeight: typography.fontWeight.medium,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: `background ${animation.duration.fast}`,
                                }}
                              >
                                <Check size={14} />
                                {item.isCompleted ? 'Geri Al' : 'Tamamla'}
                              </button>
                            )}
                            {onItemEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onItemEdit(item);
                                  setActionMenuId(null);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: spacing[2],
                                  width: '100%',
                                  padding: `${spacing[2]} ${spacing[2.5]}`,
                                  borderRadius: radius.md,
                                  border: 'none',
                                  background: 'transparent',
                                  color: colors.dark.text.primary,
                                  fontSize: typography.fontSize.base,
                                  fontWeight: typography.fontWeight.medium,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: `background ${animation.duration.fast}`,
                                }}
                              >
                                <Edit2 size={14} />
                                Düzenle
                              </button>
                            )}
                            {onItemDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onItemDelete(item);
                                  setActionMenuId(null);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: spacing[2],
                                  width: '100%',
                                  padding: `${spacing[2]} ${spacing[2.5]}`,
                                  borderRadius: radius.md,
                                  border: 'none',
                                  background: 'transparent',
                                  color: colors.semantic.danger,
                                  fontSize: typography.fontSize.base,
                                  fontWeight: typography.fontWeight.medium,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: `background ${animation.duration.fast}`,
                                }}
                              >
                                <Trash2 size={14} />
                                Sil
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Chevron Arrow */}
                  {item.hasChildren !== false && (
                    <ChevronRight
                      size={18}
                      style={{
                        color: isSelected
                          ? 'rgba(0, 0, 0, 0.6)'
                          : colors.dark.text.muted,
                        flexShrink: 0,
                        opacity: isHovered || isSelected ? 1 : 0.4,
                        transition: `all ${animation.duration.fast} ${animation.easing.smooth}`,
                        transform: isSelected ? 'translateX(2px)' : 'none',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MillerColumn;
