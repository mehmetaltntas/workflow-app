import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS } from "../constants";
import { Info, ExternalLink } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import type { ActionMenuItem } from "./ActionMenu";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, cssVars } from "../utils/themeColors";
import { typography, spacing, radius, shadows, animation, colors as tokenColors } from "../styles/tokens";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onEdit: () => void;
  onShowInfo?: () => void;
  viewMode?: 'grid' | 'list';
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onEdit,
  onShowInfo,
  viewMode = 'grid'
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isLight = theme === 'light';
  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"] || "var(--border)";

  // Action menu items oluştur - sadece düzenleme seçeneği
  const menuItems: ActionMenuItem[] = [
    {
      label: "Düzenle",
      onClick: onEdit,
      variant: "default",
    },
  ];

  // Liste görünümü için kompakt kart
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="group relative board-card"
        style={{
          background: isLight ? tokenColors.light.bg.card : tokenColors.dark.glass.bg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: radius.lg,
          padding: `${spacing[3]} ${spacing[4]}`,
          display: "flex",
          alignItems: "center",
          gap: spacing[4],
          border: `1px solid ${colors.borderDefault}`,
          cursor: "pointer",
          transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
          boxShadow: isLight ? shadows.sm : shadows.md,
        }}
      >
        {/* Status Indicator */}
        <div style={{
          width: spacing[1],
          height: spacing[8],
          borderRadius: radius.full,
          background: statusColor,
          flexShrink: 0,
        }} />

        {/* Board Name */}
        <h3
          style={{
            flex: 1,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMain,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {board.name}
        </h3>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }} onClick={(e) => e.stopPropagation()}>
          {/* Action Menu */}
          <ActionMenu
            items={menuItems}
            triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
          />

          {/* Info Button */}
          {onShowInfo && (
            <button
              onClick={onShowInfo}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: spacing[7],
                height: spacing[7],
                borderRadius: radius.md,
                border: `1px solid ${statusColor}30`,
                background: `${statusColor}15`,
                color: statusColor,
                cursor: "pointer",
              }}
              title="Pano Bilgileri"
            >
              <Info size={14} />
            </button>
          )}

          {/* External Link Button */}
          {board.link && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(board.link, '_blank', 'noopener,noreferrer');
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: spacing[7],
                height: spacing[7],
                borderRadius: radius.md,
                border: `1px solid ${statusColor}30`,
                background: `${statusColor}15`,
                color: statusColor,
                cursor: "pointer",
              }}
              title="Bağlantıya Git"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid görünümü - kompakt kart
  return (
    <div
      onClick={onClick}
      className="group relative board-card"
      style={{
        background: isLight ? tokenColors.light.bg.card : tokenColors.dark.glass.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        height: "140px",
        borderRadius: radius.xl,
        padding: spacing[4],
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${colors.borderDefault}`,
        cursor: "pointer",
        transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
        boxShadow: isLight ? shadows.card : shadows.md,
      }}
    >
      {/* Visual Accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: spacing[1],
        bottom: 0,
        background: `linear-gradient(to bottom, ${statusColor}, transparent)`,
        opacity: 0.7,
        borderRadius: `${radius.xl} 0 0 ${radius.xl}`,
      }} />

      {/* Top Row: Title + Actions */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: spacing[2],
        marginBottom: spacing[2],
      }}>
        {/* Board Name */}
        <h3
          style={{
            flex: 1,
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textMain,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: typography.letterSpacing.tight,
          }}
        >
          {board.name}
        </h3>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[1.5] }} onClick={(e) => e.stopPropagation()}>
          {/* Action Menu */}
          <ActionMenu
            items={menuItems}
            triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
          />
        </div>
      </div>

      {/* Description (if exists and not DEVAM_EDIYOR) */}
      {board.description && board.status !== "DEVAM_EDIYOR" && (
        <p style={{
          color: colors.textTertiary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.normal,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: typography.lineHeight.normal,
          margin: 0,
          marginBottom: spacing[2],
          flex: 1,
        }}>
          {board.description}
        </p>
      )}

      {/* Spacer for bottom icons */}
      <div style={{ flex: 1 }} />

      {/* Bottom Right Icons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: spacing[1.5],
          marginTop: spacing[2],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Info Button */}
        {onShowInfo && (
          <button
            onClick={onShowInfo}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: spacing[7],
              height: spacing[7],
              borderRadius: radius.md,
              border: `1px solid ${statusColor}30`,
              background: `${statusColor}15`,
              color: statusColor,
              cursor: "pointer",
              transition: `all ${animation.duration.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${statusColor}25`;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${statusColor}15`;
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Pano Bilgileri"
          >
            <Info size={14} strokeWidth={2.5} />
          </button>
        )}

        {/* External Link Button */}
        {board.link && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(board.link, '_blank', 'noopener,noreferrer');
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: spacing[7],
              height: spacing[7],
              borderRadius: radius.md,
              border: `1px solid ${statusColor}30`,
              background: `${statusColor}15`,
              color: statusColor,
              cursor: "pointer",
              transition: `all ${animation.duration.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${statusColor}25`;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${statusColor}15`;
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Bağlantıya Git"
          >
            <ExternalLink size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

    </div>
  );
};

export default BoardCard;
