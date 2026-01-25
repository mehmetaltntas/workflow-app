import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { Info, Pin, PinOff } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import type { ActionMenuItem } from "./ActionMenu";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, cssVars } from "../utils/themeColors";
import { typography, spacing, radius, shadows, animation, colors as tokenColors } from "../styles/tokens";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onStatusChange: (board: Board, newStatus: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowInfo?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  canPin?: boolean;
  viewMode?: 'grid' | 'list';
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onStatusChange,
  onEdit,
  onDelete,
  onShowInfo,
  onTogglePin,
  isPinned = false,
  canPin = true,
  viewMode = 'grid'
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isLight = theme === 'light';
  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"] || "var(--border)";

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(board, e.target.value);
  };

  // Action menu items oluştur
  const menuItems: ActionMenuItem[] = [];

  // Sabitle/Sabitlemeyi Kaldır seçeneği
  if (onTogglePin) {
    if (isPinned) {
      menuItems.push({
        label: "Sabitlemeyi Kaldır",
        onClick: onTogglePin,
        variant: "default",
        icon: PinOff,
      });
    } else if (canPin) {
      menuItems.push({
        label: "Sabitle",
        onClick: onTogglePin,
        variant: "default",
        icon: Pin,
      });
    }
  }

  // Düzenle seçeneği
  menuItems.push({
    label: "Düzenle",
    onClick: onEdit,
    variant: "default",
  });

  // Sil seçeneği
  menuItems.push({
    label: "Sil",
    onClick: onDelete,
    variant: "danger",
  });

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
          {/* Status Select */}
          <select
            value={board.status || "PLANLANDI"}
            onChange={handleStatusChange}
            style={{
              fontSize: typography.fontSize.xs,
              padding: `${spacing[1]} ${spacing[2]}`,
              borderRadius: radius.md,
              border: `1px solid ${statusColor}44`,
              background: `${statusColor}15`,
              color: statusColor,
              fontWeight: typography.fontWeight.bold,
              cursor: "pointer",
              outline: "none",
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            {Object.keys(STATUS_LABELS).map((key) => (
              <option key={key} value={key} style={{ background: isLight ? tokenColors.light.bg.elevated : tokenColors.dark.bg.secondary }}>
                {STATUS_LABELS[key]}
              </option>
            ))}
          </select>

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

          {/* Action Menu */}
          <ActionMenu
            items={menuItems}
            triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
          />
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

          {/* Action Menu */}
          <ActionMenu
            items={menuItems}
            triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
          />
        </div>
      </div>

      {/* Description (if exists) */}
      {board.description && (
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

      {/* Bottom Row: Status */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: "auto",
      }}>
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={board.status || "PLANLANDI"}
            onChange={handleStatusChange}
            style={{
              fontSize: typography.fontSize.xs,
              padding: `${spacing[1.5]} ${spacing[2.5]}`,
              borderRadius: radius.md,
              border: `1px solid ${statusColor}44`,
              background: `${statusColor}15`,
              color: statusColor,
              fontWeight: typography.fontWeight.bold,
              cursor: "pointer",
              outline: "none",
              transition: `all ${animation.duration.normal}`,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${statusColor}25`;
              e.currentTarget.style.borderColor = statusColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${statusColor}15`;
              e.currentTarget.style.borderColor = `${statusColor}44`;
            }}
          >
            {Object.keys(STATUS_LABELS).map((key) => (
              <option key={key} value={key} style={{ background: isLight ? tokenColors.light.bg.elevated : tokenColors.dark.bg.secondary, color: isLight ? tokenColors.light.text.primary : tokenColors.dark.text.primary }}>
                {STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;
