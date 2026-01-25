import React from "react";
import { ArrowUpAZ, Calendar, CalendarClock, ArrowUp, ArrowDown } from "lucide-react";
import { cssVars, typography, spacing, radius, animation, colors } from "../../styles/tokens";

export type SortField = 'alphabetic' | 'date' | 'deadline';
export type SortDirection = 'asc' | 'desc';

interface SortingOptionsProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}

const sortOptions: { value: SortField; icon: React.ReactNode; label: string }[] = [
  { value: 'alphabetic', icon: <ArrowUpAZ size={16} />, label: 'Alfabetik' },
  { value: 'date', icon: <Calendar size={16} />, label: 'Tarih' },
  { value: 'deadline', icon: <CalendarClock size={16} />, label: 'Son Tarih' },
];

export const SortingOptions: React.FC<SortingOptionsProps> = ({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[1],
        padding: `${spacing[3]} ${spacing[4]}`,
        borderBottom: `1px solid ${cssVars.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing[2],
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
          <ArrowUpAZ size={14} color={cssVars.textMuted} />
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMuted,
              textTransform: "uppercase",
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            Sıralama
          </span>
        </div>

        {/* Direction Toggle */}
        <button
          onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[1],
            padding: `${spacing[1]} ${spacing[2]}`,
            background: `${colors.brand.primary}15`,
            border: `1px solid ${colors.brand.primary}30`,
            borderRadius: radius.md,
            color: colors.brand.primary,
            cursor: "pointer",
            transition: `all ${animation.duration.fast}`,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
          }}
          title={sortDirection === 'asc' ? 'Artan Sıra' : 'Azalan Sıra'}
        >
          {sortDirection === 'asc' ? (
            <>
              <ArrowUp size={14} />
              <span>Artan</span>
            </>
          ) : (
            <>
              <ArrowDown size={14} />
              <span>Azalan</span>
            </>
          )}
        </button>
      </div>

      {/* Sort Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: spacing[2],
        }}
      >
        {sortOptions.map((option) => {
          const isActive = sortField === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSortFieldChange(option.value)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[1.5],
                padding: `${spacing[1.5]} ${spacing[2.5]}`,
                background: isActive
                  ? `linear-gradient(135deg, ${colors.brand.primary}20, ${colors.brand.primary}10)`
                  : "transparent",
                border: isActive ? `1px solid ${colors.brand.primary}40` : "1px solid transparent",
                borderRadius: radius.md,
                color: isActive ? colors.brand.primary : cssVars.textMuted,
                fontSize: typography.fontSize.xs,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                cursor: "pointer",
                transition: `all ${animation.duration.fast}`,
                flex: 1,
              }}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SortingOptions;
