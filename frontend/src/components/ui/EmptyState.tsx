import React from "react";
import { cssVars, typography, spacing, radius, colors, animation } from "../../styles/tokens";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "filtered";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = "default",
}) => {
  const isFiltered = variant === "filtered";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing[16],
        textAlign: "center",
        animation: `fadeInUp ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Icon container with gradient background */}
      <div
        style={{
          width: isFiltered ? "80px" : "120px",
          height: isFiltered ? "80px" : "120px",
          borderRadius: radius.full,
          background: isFiltered
            ? `linear-gradient(135deg, ${colors.semantic.warning}15, ${colors.semantic.warning}05)`
            : `linear-gradient(135deg, ${colors.brand.primaryLight}, ${colors.brand.primary}10)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing[6],
          border: `1px solid ${isFiltered ? colors.semantic.warning + "20" : colors.brand.primary + "20"}`,
          boxShadow: `0 20px 40px ${isFiltered ? colors.semantic.warning + "10" : colors.brand.primary + "15"}`,
        }}
      >
        <div
          style={{
            color: isFiltered ? colors.semantic.warning : colors.brand.primary,
            opacity: 0.8,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: isFiltered ? typography.fontSize["2xl"] : typography.fontSize["3xl"],
          fontWeight: typography.fontWeight.semibold,
          color: cssVars.textMain,
          marginBottom: spacing[2],
          letterSpacing: typography.letterSpacing.tight,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: typography.fontSize.lg,
          color: cssVars.textMuted,
          maxWidth: "400px",
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: action ? spacing[6] : 0,
        }}
      >
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: spacing[2],
            padding: `${spacing[3]} ${spacing[6]}`,
            background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
            color: "#fff",
            border: "none",
            borderRadius: radius.lg,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            transition: `all ${animation.duration.normal} ${animation.easing.spring}`,
            boxShadow: `0 4px 20px ${colors.brand.primary}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 8px 30px ${colors.brand.primary}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 4px 20px ${colors.brand.primary}40`;
          }}
        >
          {action.label}
        </button>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
