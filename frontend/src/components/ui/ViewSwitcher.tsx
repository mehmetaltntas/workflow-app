import React, { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import { cssVars, typography, spacing, radius, animation, colors } from "../../styles/tokens";

export type ViewMode = 'grid' | 'list';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const viewOptions: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: 'grid', icon: <LayoutGrid size={16} />, label: 'Izgara' },
  { value: 'list', icon: <List size={16} />, label: 'Liste' },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ value, onChange }) => {
  const [isWide, setIsWide] = useState(() => window.matchMedia("(min-width: 400px)").matches);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 400px)");
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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
          gap: spacing[2],
          marginBottom: spacing[2],
        }}
      >
        <LayoutGrid size={14} color={cssVars.textMuted} />
        <span
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            textTransform: "uppercase",
            letterSpacing: typography.letterSpacing.wider,
          }}
        >
          Görünüm
        </span>
      </div>

      {/* View Options */}
      <div
        style={{
          display: "flex",
          gap: spacing[1],
          padding: spacing[1],
          background: cssVars.bgSecondary,
          borderRadius: radius.lg,
        }}
      >
        {viewOptions.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[1.5],
                padding: `${spacing[2]} ${spacing[2.5]}`,
                background: isActive
                  ? `linear-gradient(135deg, ${colors.brand.primary}20, ${colors.brand.primary}10)`
                  : "transparent",
                border: isActive ? `1px solid ${colors.brand.primary}40` : "1px solid transparent",
                borderRadius: radius.md,
                color: isActive ? colors.brand.primary : cssVars.textMuted,
                fontSize: typography.fontSize.sm,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                cursor: "pointer",
                transition: `all ${animation.duration.fast}`,
              }}
              title={option.label}
            >
              {option.icon}
              {isWide && <span>{option.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ViewSwitcher;
