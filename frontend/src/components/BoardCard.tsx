import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS } from "../constants";
import { Pin, PinOff } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import type { ActionMenuItem } from "./ActionMenu";
import "./BoardCard.css";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onEdit?: () => void;
  onShowInfo?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  canPin?: boolean;
  viewMode?: 'grid' | 'list';
  accentColor?: string;
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onEdit,
  onShowInfo,
  onTogglePin,
  isPinned = false,
  canPin = true,
  viewMode = 'grid',
  accentColor,
}) => {
  const statusColor = accentColor || STATUS_COLORS[board.status || "PLANLANDI"] || "var(--border)";

  // CSS custom property for dynamic status color
  const statusStyle = { '--board-status-color': statusColor } as React.CSSProperties;

  // Action menu items olustur
  const menuItems: ActionMenuItem[] = [
    ...(onTogglePin && (isPinned || canPin) ? [{
      label: isPinned ? "Sabitlemeyi Kaldır" : "Sabitle",
      onClick: onTogglePin,
      variant: "default" as const,
      icon: isPinned ? PinOff : Pin,
    }] : []),
    ...(onEdit ? [{
      label: "Düzenle",
      onClick: onEdit,
      variant: "default" as const,
    }] : []),
  ];

  // Liste gorunumu icin kompakt kart
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="board-card board-card--list"
        style={statusStyle}
      >
        {/* Status Indicator */}
        <div className="board-card__status-bar" />

        {/* Board Name */}
        <h3
          className="board-card__name--list board-card__name--clickable"
          onClick={(e) => {
            if (onShowInfo) {
              e.stopPropagation();
              onShowInfo();
            }
          }}
        >
          {board.name}
        </h3>

        {/* Actions */}
        {menuItems.length > 0 && (
          <div className="board-card__actions" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              items={menuItems}
              triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
            />
          </div>
        )}
      </div>
    );
  }

  // Grid gorunumu - kompakt kart
  return (
    <div
      onClick={onClick}
      className="board-card board-card--grid"
      style={statusStyle}
    >
      {/* Visual Accent - removed for clean card design */}

      {/* Top Row: Title + Actions */}
      <div className="board-card__top-row">
        <h3
          className="board-card__name--grid board-card__name--clickable"
          onClick={(e) => {
            if (onShowInfo) {
              e.stopPropagation();
              onShowInfo();
            }
          }}
        >
          {board.name}
        </h3>

        {menuItems.length > 0 && (
          <div className="board-card__top-actions" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              items={menuItems}
              triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
            />
          </div>
        )}
      </div>


      {/* Spacer */}
      <div className="board-card__spacer" />
    </div>
  );
};

export default BoardCard;
