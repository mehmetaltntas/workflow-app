import React from "react";
import { LayoutGrid, List, Columns } from "lucide-react";
import { cssVars, spacing, radius, animation, colors } from "../../styles/tokens";

export type ViewMode = 'grid' | 'list' | 'compact';

interface NavbarViewSwitcherProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const viewOptions: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: 'grid', icon: <LayoutGrid size={16} />, label: 'Izgara' },
  { value: 'list', icon: <List size={16} />, label: 'Liste' },
  { value: 'compact', icon: <Columns size={16} />, label: 'Kompakt' },
];

export const NavbarViewSwitcher: React.FC<NavbarViewSwitcherProps> = ({ value, onChange }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: spacing[0.5],
        padding: spacing[0.5],
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
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isActive
                ? `linear-gradient(135deg, ${colors.brand.primary}20, ${colors.brand.primary}10)`
                : "transparent",
              border: isActive ? `1px solid ${colors.brand.primary}40` : "1px solid transparent",
              borderRadius: radius.md,
              color: isActive ? colors.brand.primary : cssVars.textMuted,
              cursor: "pointer",
              transition: `all ${animation.duration.fast}`,
              padding: 0,
            }}
            title={option.label}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
};
