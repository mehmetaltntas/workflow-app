import React from "react";
import type { LucideIcon } from "lucide-react";
import { typography, spacing, radius, cssVars, colors, animation, shadows } from "../styles/tokens";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  subtitle?: React.ReactNode;
  color?: string;
  bgColor?: string;
}

export const StatCard = React.memo(function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = colors.brand.primary,
  bgColor = colors.brand.primaryLight,
}: StatCardProps) {
  return (
    <div
      style={{
        background: cssVars.bgCard,
        borderRadius: radius.xl,
        border: `1px solid ${cssVars.border}`,
        padding: spacing[6],
        display: "flex",
        flexDirection: "column",
        gap: spacing[4],
        transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = shadows.cardHover;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = cssVars.border;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon and Title */}
      <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: radius.lg,
            background: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color={color} strokeWidth={2} />
        </div>
        <span
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.medium,
            color: cssVars.textMuted,
          }}
        >
          {title}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: typography.fontSize["5xl"],
          fontWeight: typography.fontWeight.bold,
          color: cssVars.textMain,
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: typography.fontSize.base,
            color: cssVars.textMuted,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
});

export default StatCard;
