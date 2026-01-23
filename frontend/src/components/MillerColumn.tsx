import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight, Folder, FileText, CheckSquare, Loader2, Plus, MoreHorizontal, Edit2, Trash2, Check } from 'lucide-react';
import { colors, cssVars } from '../styles/tokens';

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

const getIconComponent = (icon?: string, isCompleted?: boolean) => {
  if (isCompleted) {
    return <CheckSquare size={16} style={{ color: 'var(--success)' }} />;
  }
  switch (icon) {
    case 'folder':
      return <Folder size={16} style={{ color: 'var(--primary)' }} />;
    case 'task':
      return <FileText size={16} style={{ color: 'var(--text-muted)' }} />;
    default:
      return <FileText size={16} style={{ color: 'var(--text-muted)' }} />;
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

  return (
    <div
      ref={columnRef}
      style={{
        width: '320px',
        minWidth: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: columnIndex === 0
          ? colors.dark.bg.overlay
          : columnIndex === 1
            ? cssVars.borderStrong
            : colors.dark.bg.active,
        animation: 'millerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Sütun Başlığı */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: colors.dark.bg.overlay,
          backdropFilter: 'blur(8px)',
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
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {title}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--primary)',
              background: colors.brand.primaryLight,
              padding: '2px 8px',
              borderRadius: '10px',
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
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: 'none',
              background: colors.brand.primaryLight,
              color: 'var(--primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
          padding: '8px',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              gap: '12px',
            }}
          >
            <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px' }}>Yükleniyor...</span>
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                    gap: '12px',
                    width: '100%',
                    padding: '12px 14px',
                    border: 'none',
                    borderRadius: '10px',
                    background: isSelected
                      ? 'var(--primary)'
                      : isHovered
                        ? 'var(--card-hover-bg)'
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  {/* Priority Indicator */}
                  {item.metadata?.priority && item.metadata.priority !== 'NONE' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '60%',
                        borderRadius: '2px',
                        background: getPriorityColor(item.metadata.priority),
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isSelected
                        ? colors.dark.text.disabled
                        : colors.dark.bg.hover,
                      flexShrink: 0,
                    }}
                  >
                    {getIconComponent(item.icon, item.isCompleted)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isSelected ? cssVars.textInverse : 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: item.isCompleted ? 'line-through' : 'none',
                        opacity: item.isCompleted ? 0.6 : 1,
                      }}
                    >
                      {item.title}
                    </div>

                    {/* Subtitle / Metadata Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                      }}
                    >
                      {item.subtitle && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: isSelected
                              ? colors.dark.text.secondary
                              : 'var(--text-muted)',
                          }}
                        >
                          {item.subtitle}
                        </span>
                      )}

                      {/* Labels Preview */}
                      {item.metadata?.labels && item.metadata.labels.length > 0 && (
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {item.metadata.labels.slice(0, 3).map((label) => (
                            <div
                              key={label.id}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: label.color,
                              }}
                            />
                          ))}
                          {item.metadata.labels.length > 3 && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: isSelected
                                  ? colors.dark.text.tertiary
                                  : 'var(--text-muted)',
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
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isSelected
                              ? colors.dark.text.secondary
                              : 'var(--text-muted)',
                            background: isSelected
                              ? cssVars.borderStrong
                              : colors.dark.bg.hover,
                            padding: '2px 6px',
                            borderRadius: '6px',
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
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: isSelected ? colors.dark.text.secondary : 'var(--text-muted)',
                          cursor: 'pointer',
                          opacity: isHovered || isSelected || actionMenuId === item.id ? 1 : 0,
                          transition: 'all 0.15s ease',
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
                              marginTop: '4px',
                              background: colors.dark.bg.card,
                              border: `1px solid ${colors.dark.border.default}`,
                              borderRadius: '10px',
                              padding: '6px',
                              minWidth: '140px',
                              zIndex: 100,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
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
                                  gap: '8px',
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: item.isCompleted ? 'var(--warning)' : 'var(--success)',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
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
                                  gap: '8px',
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--text-main)',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
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
                                  gap: '8px',
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--danger)',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
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
                          ? colors.dark.text.secondary
                          : 'var(--text-muted)',
                        flexShrink: 0,
                        opacity: isHovered || isSelected ? 1 : 0.5,
                        transition: 'all 0.15s ease',
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
