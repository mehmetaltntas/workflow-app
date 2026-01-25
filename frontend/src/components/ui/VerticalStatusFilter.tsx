import React from "react";
import { cssVars, typography, spacing, radius, animation, colors } from "../../styles/tokens";
import { STATUS_COLORS, STATUS_LABELS } from "../../constants";
import { Filter } from "lucide-react";

interface VerticalStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
}

export const VerticalStatusFilter: React.FC<VerticalStatusFilterProps> = ({
  value,
  onChange,
  counts,
}) => {
  const allStatuses = ["ALL", ...Object.keys(STATUS_LABELS)];
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[1.5],
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[2],
          padding: `${spacing[2]} ${spacing[3]}`,
          marginBottom: spacing[1],
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
          }}
        >
          Filtreler
        </span>
      </div>

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
  );
};

export default VerticalStatusFilter;
