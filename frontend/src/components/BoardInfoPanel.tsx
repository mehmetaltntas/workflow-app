import React, { useMemo } from "react";
import type { Board } from "../types";
import {
  ListChecks,
  CheckSquare,
  Layers,
  Calendar,
  ExternalLink,
  FileText,
  BarChart3,
  Clock,
  AlertTriangle,
  FolderOpen,
  User,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";
import { calculateBoardProgress } from "../utils/progressCalculation";
import BoardMembersSection from "./BoardMembersSection";
import TaskAssignmentSection from "./TaskAssignmentSection";

interface BoardInfoPanelProps {
  board: Board | null;
  onClose: () => void;
}

const CATEGORY_MAP: Record<string, string> = {
  YAZILIM_GELISTIRME: "Yazılım Geliştirme",
  PAZARLAMA: "Pazarlama",
  TASARIM_KREATIF: "Tasarım / Kreatif",
  URUN_YONETIMI: "Ürün Yönetimi",
  SATIS_CRM: "Satış / CRM",
  INSAN_KAYNAKLARI: "İnsan Kaynakları",
  EGITIM_AKADEMIK: "Eğitim / Akademik",
  OPERASYON: "Operasyon",
  FINANS_MUHASEBE: "Finans / Muhasebe",
  MUSTERI_DESTEK: "Müşteri Destek",
  ICERIK_URETIMI: "İçerik Üretimi",
  UI_UX_TASARIMI: "UI/UX Tasarımı",
  ARGE_ARASTIRMA: "Ar-Ge / Araştırma",
  ETKINLIK_YONETIMI: "Etkinlik Yönetimi",
  HUKUK_YASAL: "Hukuk / Yasal",
  INSAAT_MIMARI: "İnşaat / Mimari",
  E_TICARET: "E-Ticaret",
  SAGLIK_YASAM: "Sağlık / Yaşam",
  KISISEL: "Kişisel",
  DIGER: "Diğer",
};

// Pano istatistiklerini hesapla
const calculateBoardStats = (board: Board) => {
  const lists = board.taskLists || [];
  const totalLists = lists.length;
  const completedLists = lists.filter(l => l.isCompleted).length;

  let totalTasks = 0;
  let completedTasks = 0;
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  let overdueTasks = 0;
  let overdueSubtasks = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  lists.forEach(list => {
    const tasks = list.tasks || [];
    totalTasks += tasks.length;
    completedTasks += tasks.filter(t => t.isCompleted).length;

    tasks.forEach(task => {
      if (!task.isCompleted && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() < today.getTime()) {
          overdueTasks++;
        }
      }

      const subtasks = task.subtasks || [];
      totalSubtasks += subtasks.length;
      completedSubtasks += subtasks.filter(s => s.isCompleted).length;

      subtasks.forEach(subtask => {
        if (!subtask.isCompleted && subtask.dueDate) {
          const dueDate = new Date(subtask.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate.getTime() < today.getTime()) {
            overdueSubtasks++;
          }
        }
      });
    });
  });

  return {
    lists: { total: totalLists, completed: completedLists },
    tasks: { total: totalTasks, completed: completedTasks, overdue: overdueTasks },
    subtasks: { total: totalSubtasks, completed: completedSubtasks, overdue: overdueSubtasks },
    overallProgress: calculateBoardProgress(board),
  };
};

// Son tarihe göre renk ve durum hesapla
const getDeadlineInfo = (deadline: string | undefined) => {
  if (!deadline) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { color: colors.semantic.danger, bg: colors.semantic.dangerLight, label: 'Gecikmiş', days: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { color: colors.priority.medium, bg: colors.priority.mediumBg, label: 'Bugün', days: 0 };
  } else if (diffDays <= 3) {
    return { color: colors.status.paused, bg: `${colors.status.paused}20`, label: 'Acil', days: diffDays };
  } else if (diffDays <= 7) {
    return { color: colors.priority.medium, bg: colors.priority.mediumBg, label: 'Yaklaşıyor', days: diffDays };
  } else {
    return { color: colors.semantic.success, bg: colors.semantic.successLight, label: 'Normal', days: diffDays };
  }
};

export const BoardInfoPanel: React.FC<BoardInfoPanelProps> = ({
  board,
  onClose: _onClose,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const stats = useMemo(() => board ? calculateBoardStats(board) : null, [board]);
  const deadlineInfo = useMemo(() => board ? getDeadlineInfo(board.deadline) : null, [board]);

  if (!board || !stats) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: spacing[6],
          color: cssVars.textMuted,
          textAlign: "center",
        }}
      >
        <BarChart3 size={48} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: spacing[4] }} />
        <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium }}>
          Pano Seçin
        </p>
        <p style={{ fontSize: typography.fontSize.md, marginTop: spacing[1] }}>
          Detayları görmek için bir panonun bilgi simgesine tıklayın
        </p>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[board.status || "PLANLANDI"];
  const hasDeadline = !!(board.deadline && deadlineInfo);
  const hasLink = !!board.link;
  const hasDescription = !!board.description;
  const hasCategory = !!board.category;

  const cardStyle: React.CSSProperties = {
    padding: spacing[4],
    borderRadius: radius.lg,
    background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
    border: `1px solid ${themeColors.borderDefault}`,
  };

  const metaLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: cssVars.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: spacing[1.5],
    minHeight: spacing[5],
  };

  const metaValueStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: cssVars.textMain,
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
    minHeight: spacing[5],
  };

  const ownerDisplay = board.ownerFirstName && board.ownerLastName
    ? `${board.ownerFirstName} ${board.ownerLastName}`
    : board.ownerName;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[4],
        animation: `fadeIn ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Hero Section — Compact */}
      <div
        style={{
          ...cardStyle,
          padding: spacing[5],
          display: "flex",
          flexDirection: "column",
          gap: spacing[3],
          background: `linear-gradient(135deg, ${statusColor}08, ${isLight ? colors.light.bg.card : colors.dark.glass.bg})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
          <div
            style={{
              width: spacing[1.5],
              height: spacing[10],
              borderRadius: radius.full,
              background: `linear-gradient(180deg, ${statusColor}, ${statusColor}60)`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0,
                marginBottom: spacing[1.5],
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {board.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2], flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: statusColor,
                  background: `${statusColor}15`,
                  padding: `${spacing[0.5]} ${spacing[2.5]}`,
                  borderRadius: radius.full,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wider,
                }}
              >
                {STATUS_LABELS[board.status || "PLANLANDI"]}
              </span>
              {hasCategory && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: spacing[1],
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.brand.primary,
                    background: colors.brand.primaryLight,
                    padding: `${spacing[0.5]} ${spacing[2.5]}`,
                    borderRadius: radius.full,
                  }}
                >
                  <FolderOpen size={11} />
                  {CATEGORY_MAP[board.category!] || board.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inline Progress Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3], paddingLeft: spacing[3] }}>
          <div
            style={{
              flex: 1,
              height: spacing[1.5],
              background: themeColors.bgActive,
              borderRadius: radius.full,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${stats.overallProgress}%`,
                background: stats.overallProgress === 100
                  ? colors.semantic.success
                  : `linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.primaryHover})`,
                borderRadius: radius.full,
                transition: `width ${animation.duration.slow}`,
              }}
            />
          </div>
          <span
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: stats.overallProgress === 100 ? colors.semantic.success : colors.brand.primary,
              minWidth: spacing[10],
              textAlign: "right",
            }}
          >
            %{stats.overallProgress}
          </span>
        </div>
      </div>

      {/* Metadata Grid — Consolidated */}
      {(hasDeadline || hasLink || true) && (
        <div style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: `${spacing[2]} ${spacing[4]}`,
              alignItems: "center",
            }}
          >
            {/* Oluşturan */}
            <span style={metaLabelStyle}>
              <User size={12} />
              Oluşturan
            </span>
            <span style={metaValueStyle}>
              <span style={{ fontWeight: typography.fontWeight.semibold }}>{ownerDisplay}</span>
              <span style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted }}>@{board.ownerName}</span>
            </span>

            {/* Oluşturulma Tarihi */}
            {board.createdAt && (
              <>
                <span style={metaLabelStyle}>
                  <Calendar size={12} />
                  Oluşturulma
                </span>
                <span style={metaValueStyle}>
                  <span style={{ fontWeight: typography.fontWeight.semibold }}>
                    {new Date(board.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </>
            )}

            {/* Son Tarih */}
            {hasDeadline && deadlineInfo && (
              <>
                <span style={metaLabelStyle}>
                  {deadlineInfo.label === 'Gecikmiş' ? (
                    <AlertTriangle size={12} color={deadlineInfo.color} />
                  ) : (
                    <Calendar size={12} color={deadlineInfo.color} />
                  )}
                  <span style={{ color: deadlineInfo.color }}>Son Tarih</span>
                </span>
                <span style={metaValueStyle}>
                  <span style={{ fontWeight: typography.fontWeight.semibold, color: deadlineInfo.color }}>
                    {new Date(board.deadline!).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: spacing[1],
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold,
                      color: deadlineInfo.color,
                      background: `${deadlineInfo.color}12`,
                      padding: `${spacing[0.5]} ${spacing[2]}`,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Clock size={10} />
                    {deadlineInfo.label === 'Gecikmiş'
                      ? `${deadlineInfo.days} gün gecikmiş`
                      : deadlineInfo.label === 'Bugün'
                        ? 'Bugün son gün'
                        : `${deadlineInfo.days} gün kaldı`
                    }
                  </span>
                </span>
              </>
            )}

            {/* Bağlantı */}
            {hasLink && (
              <>
                <span style={metaLabelStyle}>
                  <ExternalLink size={12} />
                  Bağlantı
                </span>
                <a
                  href={board.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...metaValueStyle,
                    color: colors.brand.primary,
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  {board.link}
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats Row — Horizontal Compact */}
      <div
        style={{
          ...cardStyle,
          display: "flex",
          alignItems: "stretch",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <CompactStatCell
          icon={<ListChecks size={16} />}
          label="Liste"
          completed={stats.lists.completed}
          total={stats.lists.total}
          color={colors.status.completed}
          themeColors={themeColors}
          isLight={isLight}
        />
        <div style={{ width: 1, background: themeColors.borderDefault, flexShrink: 0 }} />
        <CompactStatCell
          icon={<CheckSquare size={16} />}
          label="Görev"
          completed={stats.tasks.completed}
          total={stats.tasks.total}
          overdue={stats.tasks.overdue}
          color={colors.status.inProgress}
          themeColors={themeColors}
          isLight={isLight}
        />
        <div style={{ width: 1, background: themeColors.borderDefault, flexShrink: 0 }} />
        <CompactStatCell
          icon={<Layers size={16} />}
          label="Alt Görev"
          completed={stats.subtasks.completed}
          total={stats.subtasks.total}
          overdue={stats.subtasks.overdue}
          color={colors.brand.primary}
          themeColors={themeColors}
          isLight={isLight}
        />
      </div>

      {/* Description — Compact */}
      {hasDescription && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
            <FileText size={14} color={cssVars.textMuted} />
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: cssVars.textMuted,
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wide,
              }}
            >
              Açıklama
            </span>
          </div>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: cssVars.textMain,
              lineHeight: typography.lineHeight.relaxed,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {board.description}
          </p>
        </div>
      )}

      {/* Board Members Section — only for TEAM boards */}
      {board.boardType === 'TEAM' && <BoardMembersSection board={board} />}

      {/* Task Assignment Section — only for TEAM boards */}
      {board.boardType === 'TEAM' && <TaskAssignmentSection board={board} />}

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
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

// Compact Stat Cell — Horizontal layout for the stats row
interface CompactStatCellProps {
  icon: React.ReactNode;
  label: string;
  completed: number;
  total: number;
  overdue?: number;
  color: string;
  isLight: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
}

const CompactStatCell: React.FC<CompactStatCellProps> = ({ icon, label, completed, total, overdue, color, isLight, themeColors }) => {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      style={{
        flex: 1,
        padding: `${spacing[3]} ${spacing[4]}`,
        display: "flex",
        flexDirection: "column",
        gap: spacing[2],
      }}
    >
      {/* Top row: icon + label + overdue */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: spacing[7],
              height: spacing[7],
              borderRadius: radius.md,
              background: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: cssVars.textMuted,
              textTransform: "uppercase",
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            {label}
          </span>
        </div>
        {overdue !== undefined && overdue > 0 && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[0.5],
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              color: colors.semantic.danger,
              padding: `0 ${spacing[1.5]}`,
              background: colors.semantic.dangerLight,
              borderRadius: radius.sm,
              lineHeight: "18px",
            }}
          >
            <AlertTriangle size={9} />
            {overdue}
          </span>
        )}
      </div>

      {/* Count */}
      <div style={{ display: "flex", alignItems: "baseline", gap: spacing[1] }}>
        <span
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textMain,
          }}
        >
          {completed}
        </span>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.normal,
            color: cssVars.textMuted,
          }}
        >
          / {total}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div
        style={{
          height: spacing[1],
          background: themeColors.bgActive,
          borderRadius: radius.full,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: progress === 100 ? colors.semantic.success : color,
            borderRadius: radius.full,
            transition: `width ${animation.duration.slow}`,
          }}
        />
      </div>
    </div>
  );
};

export default BoardInfoPanel;
