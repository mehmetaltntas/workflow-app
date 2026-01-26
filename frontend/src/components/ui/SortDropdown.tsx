import React, { useState, useRef, useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpAZ, Calendar, CalendarClock, ChevronDown } from "lucide-react";
import { cssVars, typography, spacing, radius, animation, colors, zIndex } from "../../styles/tokens";
import { useClickOutside } from "../../hooks/useClickOutside";

export type SortField = 'alphabetic' | 'date' | 'deadline';
export type SortDirection = 'asc' | 'desc';

interface SortDropdownProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}

const sortOptions: { value: SortField; icon: React.ReactNode; label: string }[] = [
  { value: 'alphabetic', icon: <ArrowUpAZ size={14} />, label: 'Alfabetik' },
  { value: 'date', icon: <Calendar size={14} />, label: 'Tarih' },
  { value: 'deadline', icon: <CalendarClock size={14} />, label: 'Son Tarih' },
];

export const SortDropdown: React.FC<SortDropdownProps> = ({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null!);

  useClickOutside(ref, useCallback(() => setIsOpen(false), []));

  const activeLabel = sortOptions.find(o => o.value === sortField)?.label || 'Sıralama';
  const DirectionIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[1.5],
          padding: `${spacing[1.5]} ${spacing[3]}`,
          height: "32px",
          background: cssVars.bgCard,
          border: `1px solid ${cssVars.border}`,
          borderRadius: radius.lg,
          color: cssVars.textMain,
          cursor: "pointer",
          transition: `all ${animation.duration.fast}`,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          whiteSpace: "nowrap",
        }}
      >
        <DirectionIcon size={14} color={colors.brand.primary} />
        <span>{activeLabel}</span>
        <ChevronDown
          size={12}
          color={cssVars.textMuted}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: `transform ${animation.duration.fast}`,
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="menu-dropdown"
          style={{
            right: 0,
            top: "calc(100% + 6px)",
            minWidth: "180px",
            zIndex: zIndex.popover,
          }}
        >
          {/* Direction Toggle */}
          <button
            className="menu-item"
            onClick={() => {
              onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
            }}
          >
            <span className="menu-item-icon">
              <DirectionIcon size={14} />
            </span>
            <span>{sortDirection === 'asc' ? 'Artan Sıra' : 'Azalan Sıra'}</span>
          </button>

          <div className="menu-divider" />

          {/* Sort Options */}
          {sortOptions.map((option) => {
            const isActive = sortField === option.value;
            return (
              <button
                key={option.value}
                className="menu-item"
                onClick={() => {
                  onSortFieldChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  color: isActive ? colors.brand.primary : undefined,
                  fontWeight: isActive ? typography.fontWeight.semibold : undefined,
                }}
              >
                <span className="menu-item-icon">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
