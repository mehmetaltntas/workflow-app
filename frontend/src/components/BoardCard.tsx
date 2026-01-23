import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { ExternalLink, Calendar } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import { MiniStats } from "./StatsBar";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onStatusChange: (board: Board, newStatus: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick, onStatusChange, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isLight = theme === 'light';
  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"] || "var(--border)";

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(board, e.target.value);
  };


  return (
    <div
      onClick={onClick}
      className="group relative board-card"
      style={{
        background: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        height: "190px",
        borderRadius: "28px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: `1px solid ${colors.borderDefault}`,
        cursor: "pointer",
        transition: "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
        overflow: "hidden",
        boxShadow: isLight ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Visual Accent */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '4px',
        bottom: 0,
        background: `linear-gradient(to bottom, ${statusColor}, transparent)`,
        opacity: 0.6
      }} />

      {/* Top Section: Action Menu */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", zIndex: 2 }}>
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <ActionMenu 
            onEdit={onEdit}
            onDelete={onDelete}
            triggerClassName="bg-white/5 hover:bg-white/10 border border-white/5"
          />
        </div>
      </div>

      {/* Middle Section: Title & Content */}
      <div style={{ marginTop: "12px" }}>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "var(--text-main)",
            margin: "0 0 6px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: '-0.02em',
            textShadow: isLight ? 'none' : '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          {board.name}
        </h3>

        {board.description && (
          <div style={{
            color: colors.textTertiary,
            fontSize: '12px',
            fontWeight: '400',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.5',
            fontStyle: 'italic',
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}>
            {board.description}
          </div>
        )}

        {/* Mini Stats */}
        <div style={{ marginTop: '10px' }}>
          <MiniStats board={board} />
        </div>
      </div>

      {/* Bottom Section: Deadline, Link & Status */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginTop: "auto",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {board.link && (
            <a
              href={board.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: colors.bgHover,
                color: "var(--primary)",
                border: `1px solid ${colors.borderDefault}`,
                transition: "all 0.3s ease",
              }}
              title="Bağlantıya Git"
            >
              <ExternalLink size={16} strokeWidth={2.5} />
            </a>
          )}

          {board.deadline && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: colors.textMuted,
              background: colors.bgTertiary,
              padding: "6px 10px",
              borderRadius: "8px",
              fontWeight: "600"
            }}>
              <Calendar size={13} />
              {new Date(board.deadline).toLocaleDateString()}
            </div>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={board.status || "PLANLANDI"}
            onChange={handleStatusChange}
            style={{
              fontSize: "11px",
              padding: "8px 14px",
              borderRadius: "14px",
              border: `1px solid ${statusColor}44`,
              background: `${statusColor}15`,
              color: statusColor,
              fontWeight: "700",
              cursor: "pointer",
              outline: "none",
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backdropFilter: 'blur(10px)',
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
              <option key={key} value={key} style={{ background: isLight ? '#ffffff' : '#1a1b1e', color: isLight ? '#1a1b1e' : 'white' }}>
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


