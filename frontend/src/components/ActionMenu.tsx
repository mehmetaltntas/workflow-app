import React, { useState, useRef } from "react";
import { MoreVertical, MoreHorizontal, Edit2, Trash2, CheckCircle } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  icon?: React.ElementType;
}

interface ActionMenuProps {
  items?: ActionMenuItem[];
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  triggerClassName?: string;
  className?: string;
  iconSize?: number;
  horizontal?: boolean;
  dropdownPosition?: "left" | "right";
  dropdownDirection?: "up" | "down";
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  onEdit,
  onDelete,
  onComplete,
  triggerClassName = "",
  className = "",
  iconSize = 16,
  horizontal = false,
  dropdownPosition = "right",
  dropdownDirection = "down",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef as React.RefObject<HTMLElement>, () => setIsOpen(false));

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const Icon = horizontal ? MoreHorizontal : MoreVertical;

  // Construct items if onEdit/onDelete are provided
  const menuItems = items || [
    ...(onComplete ? [{ label: "Tamamla", onClick: onComplete, variant: "success" } as ActionMenuItem] : []),
    ...(onEdit ? [{ label: "Düzenle", onClick: onEdit, variant: "default" } as ActionMenuItem] : []),
    ...(onDelete ? [{ label: "Sil", onClick: onDelete, variant: "danger" } as ActionMenuItem] : []),
  ];

  const getItemIcon = (item: ActionMenuItem) => {
    if (item.icon) return item.icon;
    if (item.variant === 'danger' || item.label === 'Sil') return Trash2;
    if (item.variant === 'success' || item.label === 'Tamamla') return CheckCircle;
    return Edit2;
  };

  const getVariantStyles = (item: ActionMenuItem) => {
    const isDanger = item.variant === "danger" || item.label === "Sil";
    const isSuccess = item.variant === "success" || item.label === "Tamamla";
    
    if (isDanger) {
      return {
        color: "var(--danger)",
        iconBg: "rgba(255, 107, 107, 0.15)",
        hoverBg: "rgba(255, 107, 107, 0.1)",
      };
    }
    if (isSuccess) {
      return {
        color: "var(--success)",
        iconBg: "rgba(81, 207, 102, 0.15)",
        hoverBg: "rgba(81, 207, 102, 0.1)",
      };
    }
    return {
      color: "var(--text-main)",
      iconBg: "rgba(77, 171, 247, 0.15)",
      hoverBg: "rgba(255, 255, 255, 0.06)",
    };
  };

  return (
    <div 
      ref={menuRef}
      style={{ position: 'relative', zIndex: isOpen ? 9999 : 'auto' }}
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modern Trigger Button */}
      <button
        onClick={toggleMenu}
        className={`menu-trigger ${isOpen ? "active" : ""} ${
          !isOpen ? "opacity-0 group-hover:opacity-100 focus:opacity-100" : ""
        } ${triggerClassName}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Icon size={iconSize} strokeWidth={2} />
      </button>

      {/* Modern Dropdown */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            ...(dropdownPosition === 'left' ? { left: 0 } : { right: 0 }),
            ...(dropdownDirection === 'up' 
              ? { bottom: '100%', marginBottom: '8px' } 
              : { top: '100%', marginTop: '8px' }),
            zIndex: 9999,
            minWidth: '180px',
            padding: '6px',
            background: 'rgba(20, 21, 24, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            animation: dropdownDirection === 'up' ? 'menuSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'menuSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            isolation: 'isolate',
          }}
        >
          {menuItems.map((item, index) => {
            const ItemIcon = getItemIcon(item);
            const styles = getVariantStyles(item);
            
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: styles.color,
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = styles.hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: styles.iconBg,
                  flexShrink: 0,
                  color: styles.color,
                }}>
                  <ItemIcon size={14} strokeWidth={2} />
                </span>
                <span style={{ 
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
