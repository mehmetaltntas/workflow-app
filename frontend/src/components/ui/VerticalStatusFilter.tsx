import React, { useState } from "react";
import { cssVars, typography, spacing, radius, animation, colors } from "../../styles/tokens";
import { STATUS_COLORS, STATUS_LABELS } from "../../constants";
import { Filter, ChevronDown } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeColors } from "../../utils/themeColors";

interface VerticalStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
  defaultExpanded?: boolean;
}

export const VerticalStatusFilter: React.FC<VerticalStatusFilterProps> = ({
  value,
  onChange,
  counts,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const allStatuses = ["ALL", ...Object.keys(STATUS_LABELS)];
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  // Aktif filtre etiketi
  const activeLabel = value === "ALL" ? "Tümü" : STATUS_LABELS[value];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[1.5],
      }}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[2],
          padding: `${spacing[2.5]} ${spacing[3]}`,
          marginBottom: isExpanded ? spacing[1] : 0,
          background: "transparent",
          border: "none",
          borderRadius: radius.lg,
          cursor: "pointer",
          transition: `all ${animation.duration.normal}`,
          width: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = themeColors.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Filter size={14} color={cssVars.textMuted} />
        <span
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            textTransform: "uppercase",
            letterSpacing: typography.letterSpacing.wider,
            flex: 1,
            textAlign: "left",
          }}
        >
          Filtreler
        </span>
        {/* Aktif filtre göstergesi (kapalıyken) */}
        {!isExpanded && (
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: value === "ALL" ? colors.brand.primary : STATUS_COLORS[value],
              padding: `${spacing[0.5]} ${spacing[2]}`,
              background: value === "ALL" ? `${colors.brand.primary}15` : `${STATUS_COLORS[value]}15`,
              borderRadius: radius.full,
            }}
          >
            {activeLabel}
          </span>
        )}
        <ChevronDown
          size={16}
          color={cssVars.textMuted}
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: `transform ${animation.duration.normal} ${animation.easing.spring}`,
          }}
        />
      </button>

      {/* Collapsible Content */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
          transition: `grid-template-rows ${animation.duration.normal} ${animation.easing.spring}`,
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[1.5] }}>
            {allStatuses.map((status) => {
              const isActive = value === status;
              const statusColor = status === "ALL" ? colors.brand.primary : STATUS_COLORS[status];
              const count = status === "ALL" ? totalCount : (counts[status] || 0);
              const label = status === "ALL" ? "Tümü" : STATUS_LABELS[status];

              return (
                <button
                  key={status}
                  onClick={() => onChange(status)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[2.5],
                    padding: `${spacing[2.5]} ${spacing[3]}`,
                    background: isActive
                      ? `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`
                      : "transparent",
                    border: isActive ? `1px solid ${statusColor}40` : "1px solid transparent",
                    borderRadius: radius.lg,
                    color: isActive ? statusColor : cssVars.textMuted,
                    fontSize: typography.fontSize.md,
                    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                    cursor: "pointer",
                    transition: `all ${animation.duration.normal} ${animation.easing.spring}`,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = `${statusColor}10`;
                      e.currentTarget.style.color = statusColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = cssVars.textMuted;
                    }
                  }}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: radius.full,
                      background: statusColor,
                      opacity: isActive ? 1 : 0.5,
                      boxShadow: isActive ? `0 0 8px ${statusColor}50` : "none",
                      transition: `all ${animation.duration.fast}`,
                    }}
                  />

                  {/* Label */}
                  <span style={{ flex: 1 }}>{label}</span>

                  {/* Count badge */}
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold,
                      padding: `${spacing[0.5]} ${spacing[2]}`,
                      background: isActive ? `${statusColor}30` : cssVars.bgCard,
                      borderRadius: radius.full,
                      minWidth: "24px",
                      textAlign: "center",
                      transition: `all ${animation.duration.fast}`,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalStatusFilter;
