import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS } from "../constants";
import { Info, ExternalLink, Pin, PinOff, User, Users } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import type { ActionMenuItem } from "./ActionMenu";
import "./BoardCard.css";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onEdit: () => void;
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

  const isTeam = board.boardType === 'TEAM';
  const boardTypeBadge = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '9999px',
        lineHeight: 1,
        whiteSpace: 'nowrap' as const,
        color: isTeam ? '#3b82f6' : '#8b5cf6',
        background: isTeam ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
        border: `1px solid ${isTeam ? 'rgba(59,130,246,0.25)' : 'rgba(139,92,246,0.25)'}`,
      }}
    >
      {isTeam ? <Users size={12} strokeWidth={2.5} /> : <User size={12} strokeWidth={2.5} />}
      {isTeam ? 'Takim' : 'Bireysel'}
    </span>
  );

  // Action menu items olustur
  const menuItems: ActionMenuItem[] = [
    ...(onTogglePin && (isPinned || canPin) ? [{
      label: isPinned ? "Sabitlemeyi Kaldır" : "Sabitle",
      onClick: onTogglePin,
      variant: "default" as const,
      icon: isPinned ? PinOff : Pin,
    }] : []),
    {
      label: "Düzenle",
      onClick: onEdit,
      variant: "default" as const,
    },
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
        <h3 className="board-card__name--list">
          {board.name}
        </h3>

        {/* Board Type Badge */}
        {boardTypeBadge}

        {/* Actions */}
        <div className="board-card__actions" onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            items={menuItems}
            triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
          />

          {onShowInfo && (
            <button
              onClick={onShowInfo}
              className="board-card__icon-btn"
              title="Pano Bilgileri"
            >
              <Info size={18} />
            </button>
          )}

          {board.link && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(board.link, '_blank', 'noopener,noreferrer');
              }}
              className="board-card__icon-btn"
              title="Bağlantıya Git"
            >
              <ExternalLink size={18} />
            </button>
          )}
        </div>
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
      {/* Visual Accent */}
      <div className="board-card__accent" />

      {/* Top Row: Title + Actions */}
      <div className="board-card__top-row">
        <h3 className="board-card__name--grid">
          {board.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {/* Board Type Badge */}
          {boardTypeBadge}

          <div className="board-card__top-actions" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              items={menuItems}
              triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {board.description && board.status !== "DEVAM_EDIYOR" && (
        <p className="board-card__description">
          {board.description}
        </p>
      )}

      {/* Spacer */}
      <div className="board-card__spacer" />

      {/* Bottom Icons */}
      <div className="board-card__bottom-actions" onClick={(e) => e.stopPropagation()}>
        {onShowInfo && (
          <button
            onClick={onShowInfo}
            className="board-card__icon-btn"
            title="Pano Bilgileri"
          >
            <Info size={18} strokeWidth={2.5} />
          </button>
        )}

        {board.link && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(board.link, '_blank', 'noopener,noreferrer');
            }}
            className="board-card__icon-btn"
            title="Bağlantıya Git"
          >
            <ExternalLink size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default BoardCard;
