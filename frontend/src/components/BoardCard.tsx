import React from "react";
import type { Board } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { ExternalLink, Calendar } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import { MiniStats } from "./StatsBar";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, cssVars } from "../utils/themeColors";
import { typography, spacing, radius, shadows, animation, colors as tokenColors } from "../styles/tokens";

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onStatusChange: (board: Board, newStatus: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Son tarihe göre renk hesapla
const getDeadlineColor = (deadline: string | undefined) => {
  if (!deadline) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Geçmiş tarih - koyu kırmızı
    return { bg: '#dc262620', border: '#dc2626', text: '#dc2626', label: 'Gecikmiş' };
  } else if (diffDays <= 3) {
    // 3 gün veya daha az - kırmızı/turuncu
    return { bg: '#f9731620', border: '#f97316', text: '#f97316', label: 'Acil' };
  } else if (diffDays <= 7) {
    // 7 gün veya daha az - sarı
    return { bg: '#eab30820', border: '#eab308', text: '#eab308', label: 'Yaklaşıyor' };
  } else {
    // Daha uzun - yeşil
    return { bg: '#22c55e20', border: '#22c55e', text: '#22c55e', label: 'Normal' };
  }
};

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick, onStatusChange, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isLight = theme === 'light';
  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"] || "var(--border)";
  const deadlineColor = getDeadlineColor(board.deadline);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(board, e.target.value);
  };


  return (
    <div
      onClick={onClick}
      className="group relative board-card"
      style={{
        background: isLight ? tokenColors.light.bg.card : tokenColors.dark.glass.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        height: "190px",
        borderRadius: radius['2xl'],
        padding: spacing[6],
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: `1px solid ${colors.borderDefault}`,
        cursor: "pointer",
        transition: `all ${animation.duration.slow} ${animation.easing.spring}`,
        overflow: "hidden",
        boxShadow: isLight ? shadows.card : shadows.lg,
      }}
    >
      {/* Visual Accent */}
      <div style={{
        position: 'absolute',
        top: spacing[0],
        left: spacing[0],
        width: spacing[1],
        bottom: spacing[0],
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
      <div style={{ marginTop: spacing[3] }}>
        <h3
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textMain,
            margin: `${spacing[0]} ${spacing[0]} ${spacing[1.5]} ${spacing[0]}`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: typography.letterSpacing.tighter,
            textShadow: isLight ? 'none' : '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          {board.name}
        </h3>

        {board.description && (
          <div style={{
            color: colors.textTertiary,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.normal,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: typography.lineHeight.normal,
            fontStyle: 'italic',
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}>
            {board.description}
          </div>
        )}

        {/* Mini Stats */}
        <div style={{ marginTop: spacing[2.5] }}>
          <MiniStats board={board} />
        </div>
      </div>

      {/* Bottom Section: Deadline, Link & Status */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "auto",
        gap: spacing[3]
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing[2.5] }}>
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
                width: spacing[8],
                height: spacing[8],
                borderRadius: spacing[2.5],
                background: colors.bgHover,
                color: cssVars.primary,
                border: `1px solid ${colors.borderDefault}`,
                transition: `all ${animation.duration.slow} ${animation.easing.ease}`,
              }}
              title="Bağlantıya Git"
            >
              <ExternalLink size={16} strokeWidth={2.5} />
            </a>
          )}

          {board.deadline && deadlineColor && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1.5],
              fontSize: typography.fontSize.md,
              color: deadlineColor.text,
              background: deadlineColor.bg,
              border: `1px solid ${deadlineColor.border}40`,
              padding: `${spacing[1.5]} ${spacing[2.5]}`,
              borderRadius: radius.md,
              fontWeight: typography.fontWeight.semibold
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
              fontSize: typography.fontSize.sm,
              padding: `${spacing[2]} ${spacing[3.5]}`,
              borderRadius: radius.lg,
              border: `1px solid ${statusColor}44`,
              background: `${statusColor}15`,
              color: statusColor,
              fontWeight: typography.fontWeight.bold,
              cursor: "pointer",
              outline: "none",
              transition: `all ${animation.duration.normal}`,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
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


