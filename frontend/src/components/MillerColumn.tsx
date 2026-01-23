import React, { useRef, useEffect } from 'react';
import { ChevronRight, Folder, FileText, CheckSquare, Loader2 } from 'lucide-react';

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
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#f59e0b';
    case 'LOW': return '#22c55e';
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
}) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

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
          ? 'rgba(0, 0, 0, 0.2)'
          : columnIndex === 1
            ? 'rgba(0, 0, 0, 0.15)'
            : 'rgba(0, 0, 0, 0.1)',
        animation: 'millerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Sütun Başlığı */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
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
              background: 'rgba(77, 171, 247, 0.15)',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {items.length}
          </span>
        </h3>
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
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
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
                        color: isSelected ? 'white' : 'var(--text-main)',
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
                              ? 'rgba(255, 255, 255, 0.7)'
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
                                  ? 'rgba(255, 255, 255, 0.6)'
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
                              ? 'rgba(255, 255, 255, 0.8)'
                              : 'var(--text-muted)',
                            background: isSelected
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                          }}
                        >
                          {item.metadata.count} görev
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron Arrow */}
                  {item.hasChildren !== false && (
                    <ChevronRight
                      size={18}
                      style={{
                        color: isSelected
                          ? 'rgba(255, 255, 255, 0.8)'
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
