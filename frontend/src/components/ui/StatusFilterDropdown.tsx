import React, { useState, useRef, useCallback } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { cssVars, typography, spacing, radius, animation, colors, zIndex } from "../../styles/tokens";
import { useClickOutside } from "../../hooks/useClickOutside";
import { STATUS_COLORS, STATUS_LABELS } from "../../constants";

interface StatusFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
}

export const StatusFilterDropdown: React.FC<StatusFilterDropdownProps> = ({
  value,
  onChange,
  counts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null!);

  useClickOutside(ref, useCallback(() => setIsOpen(false), []));

  const allStatuses = ["ALL", ...Object.keys(STATUS_LABELS)];
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeLabel = value === "ALL" ? "Tümü" : STATUS_LABELS[value];
  const activeColor = value === "ALL" ? colors.brand.primary : STATUS_COLORS[value];
  const hasFilter = value !== "ALL";

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
          background: hasFilter ? `${activeColor}15` : cssVars.bgCard,
          border: `1px solid ${hasFilter ? `${activeColor}40` : cssVars.border}`,
          borderRadius: radius.lg,
          color: hasFilter ? activeColor : cssVars.textMain,
          cursor: "pointer",
          transition: `all ${animation.duration.fast}`,
          fontSize: typography.fontSize.sm,
          fontWeight: hasFilter ? typography.fontWeight.semibold : typography.fontWeight.medium,
          whiteSpace: "nowrap",
        }}
      >
        <Filter size={14} />
        <span>{activeLabel}</span>
        {hasFilter && (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: radius.full,
              background: activeColor,
              boxShadow: `0 0 6px ${activeColor}60`,
            }}
          />
        )}
        <ChevronDown
          size={12}
          style={{
            color: hasFilter ? activeColor : cssVars.textMuted,
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
            minWidth: "200px",
            zIndex: zIndex.popover,
          }}
        >
          {allStatuses.map((status) => {
            const isActive = value === status;
            const statusColor = status === "ALL" ? colors.brand.primary : STATUS_COLORS[status];
            const count = status === "ALL" ? totalCount : (counts[status] || 0);
            const label = status === "ALL" ? "Tümü" : STATUS_LABELS[status];

            return (
              <button
                key={status}
                className="menu-item"
                onClick={() => {
                  onChange(status);
                  setIsOpen(false);
                }}
                style={{
                  color: isActive ? statusColor : undefined,
                  fontWeight: isActive ? typography.fontWeight.semibold : undefined,
                }}
              >
                <span className="menu-item-icon">
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: radius.full,
                      background: statusColor,
                      opacity: isActive ? 1 : 0.5,
                      boxShadow: isActive ? `0 0 8px ${statusColor}50` : "none",
                    }}
                  />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    padding: `${spacing[0.5]} ${spacing[2]}`,
                    background: isActive ? `${statusColor}30` : cssVars.bgSecondary,
                    borderRadius: radius.full,
                    minWidth: "24px",
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
