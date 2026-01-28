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
  TrendingUp,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { typography, spacing, radius, colors, cssVars, animation } from "../styles/tokens";
import { calculateBoardProgress } from "../utils/progressCalculation";
import BoardMembersSection from "./BoardMembersSection";

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
    padding: spacing[5],
    borderRadius: radius.xl,
    background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
    border: `1px solid ${themeColors.borderDefault}`,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: cssVars.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.wide,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[6],
        animation: `fadeIn ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          ...cardStyle,
          padding: spacing[6],
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${statusColor}08, ${isLight ? colors.light.bg.card : colors.dark.glass.bg})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing[4], flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: spacing[1.5],
              height: spacing[14],
              borderRadius: radius.full,
              background: `linear-gradient(180deg, ${statusColor}, ${statusColor}60)`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: typography.fontSize["4xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0,
                marginBottom: spacing[3],
                letterSpacing: typography.letterSpacing.tight,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {board.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: statusColor,
                  background: `${statusColor}15`,
                  padding: `${spacing[1]} ${spacing[3]}`,
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
                    gap: spacing[1.5],
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.brand.primary,
                    background: colors.brand.primaryLight,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: radius.full,
                  }}
                >
                  <FolderOpen size={12} />
                  {CATEGORY_MAP[board.category!] || board.category}
                </span>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: spacing[1.5],
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMuted,
                }}
              >
                Oluşturan:
                <span style={{ fontWeight: typography.fontWeight.bold, color: cssVars.textMain }}>
                  {board.ownerFirstName && board.ownerLastName
                    ? `${board.ownerFirstName} ${board.ownerLastName}`
                    : board.ownerName}
                </span>
                <span style={{ fontWeight: typography.fontWeight.normal, color: cssVars.textMuted }}>@{board.ownerName}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[4] }}>
          <TrendingUp size={16} color={colors.brand.primary} />
          <span style={sectionLabelStyle}>Genel İlerleme</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
          <div
            style={{
              flex: 1,
              height: spacing[2.5],
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
              fontSize: typography.fontSize["3xl"],
              fontWeight: typography.fontWeight.bold,
              color: stats.overallProgress === 100 ? colors.semantic.success : colors.brand.primary,
              minWidth: spacing[14],
              textAlign: "right",
            }}
          >
            %{stats.overallProgress}
          </span>
        </div>
      </div>

      {/* Stats Grid - 3 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: spacing[4],
        }}
      >
        <StatCard
          icon={<ListChecks size={20} />}
          label="Liste"
          completed={stats.lists.completed}
          total={stats.lists.total}
          color={colors.status.completed}
          isLight={isLight}
          themeColors={themeColors}
        />
        <StatCard
          icon={<CheckSquare size={20} />}
          label="Görev"
          completed={stats.tasks.completed}
          total={stats.tasks.total}
          overdue={stats.tasks.overdue}
          color={colors.status.inProgress}
          isLight={isLight}
          themeColors={themeColors}
        />
        <StatCard
          icon={<Layers size={20} />}
          label="Alt Görev"
          completed={stats.subtasks.completed}
          total={stats.subtasks.total}
          overdue={stats.subtasks.overdue}
          color={colors.brand.primary}
          isLight={isLight}
          themeColors={themeColors}
        />
      </div>

      {/* Details Grid - deadline and link side by side */}
      {(hasDeadline || hasLink) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: hasDeadline && hasLink ? "1fr 1fr" : "1fr",
            gap: spacing[4],
          }}
        >
          {hasDeadline && deadlineInfo && (
            <div
              style={{
                padding: spacing[5],
                borderRadius: radius.xl,
                background: deadlineInfo.bg,
                border: `1px solid ${deadlineInfo.color}30`,
                display: "flex",
                flexDirection: "column",
                gap: spacing[3],
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: spacing[8],
                      height: spacing[8],
                      borderRadius: radius.lg,
                      background: `${deadlineInfo.color}20`,
                    }}
                  >
                    {deadlineInfo.label === 'Gecikmiş' ? (
                      <AlertTriangle size={16} color={deadlineInfo.color} />
                    ) : (
                      <Calendar size={16} color={deadlineInfo.color} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold,
                      color: deadlineInfo.color,
                      textTransform: "uppercase",
                      letterSpacing: typography.letterSpacing.wider,
                    }}
                  >
                    Son Tarih
                  </span>
                </div>
                {deadlineInfo.days !== undefined && deadlineInfo.days > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[1],
                      padding: `${spacing[0.5]} ${spacing[2]}`,
                      borderRadius: radius.md,
                      background: `${deadlineInfo.color}15`,
                    }}
                  >
                    <Clock size={11} color={deadlineInfo.color} />
                    <span style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: deadlineInfo.color }}>
                      {deadlineInfo.days} gün
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p
                  style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: deadlineInfo.color,
                    margin: 0,
                    marginBottom: spacing[1],
                  }}
                >
                  {new Date(board.deadline!).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: deadlineInfo.color,
                    background: `${deadlineInfo.color}15`,
                    padding: `${spacing[0.5]} ${spacing[2]}`,
                    borderRadius: radius.sm,
                  }}
                >
                  {deadlineInfo.label}
                </span>
              </div>
            </div>
          )}

          {hasLink && (
            <a
              href={board.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[3],
                padding: spacing[5],
                borderRadius: radius.xl,
                background: `linear-gradient(135deg, ${colors.brand.primaryLight}, ${colors.brand.primary}10)`,
                border: `1px solid ${colors.brand.primary}30`,
                color: colors.brand.primary,
                textDecoration: "none",
                transition: `all ${animation.duration.normal}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: spacing[8],
                    height: spacing[8],
                    borderRadius: radius.lg,
                    background: `${colors.brand.primary}20`,
                  }}
                >
                  <ExternalLink size={16} />
                </div>
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    textTransform: "uppercase",
                    letterSpacing: typography.letterSpacing.wider,
                    opacity: 0.8,
                  }}
                >
                  Harici Bağlantı
                </span>
              </div>
              <p
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {board.link}
              </p>
            </a>
          )}
        </div>
      )}

      {/* Description - full width */}
      {hasDescription && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[3] }}>
            <FileText size={16} color={cssVars.textMuted} />
            <span style={sectionLabelStyle}>Açıklama</span>
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

      {/* Board Members Section - only for TEAM boards */}
      {board.boardType === 'TEAM' && <BoardMembersSection board={board} />}

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

// Stat Card Component - vertical layout for grid
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  completed: number;
  total: number;
  overdue?: number;
  color: string;
  isLight: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, completed, total, overdue, color, isLight, themeColors }) => {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      style={{
        padding: spacing[5],
        borderRadius: radius.xl,
        background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
        border: `1px solid ${themeColors.borderDefault}`,
        display: "flex",
        flexDirection: "column",
        gap: spacing[3],
      }}
    >
      {/* Icon & Overdue Badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: spacing[10],
            height: spacing[10],
            borderRadius: radius.lg,
            background: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
        {overdue !== undefined && overdue > 0 && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[1],
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              color: colors.semantic.danger,
              padding: `${spacing[0.5]} ${spacing[2]}`,
              background: colors.semantic.dangerLight,
              borderRadius: radius.sm,
            }}
          >
            <AlertTriangle size={10} />
            {overdue}
          </span>
        )}
      </div>

      {/* Label & Count */}
      <div>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: cssVars.textMuted,
            display: "block",
            marginBottom: spacing[1],
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textMain,
          }}
        >
          {completed}
          <span style={{ color: cssVars.textMuted, fontWeight: typography.fontWeight.normal, fontSize: typography.fontSize.lg }}>
            {" "}/ {total}
          </span>
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: spacing[1.5],
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
