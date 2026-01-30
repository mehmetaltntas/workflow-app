import React, { useMemo, useState } from "react";
import type { Board, BoardMember, BoardMemberAssignment } from "../types";
import {
  ListChecks,
  CheckSquare,
  Layers,
  Calendar,
  ExternalLink,
  FileText,
  BarChart3,
  AlertTriangle,
  FolderOpen,
  User,
  Info,
  Target,
  Clock,
  UserPlus,
  Pencil,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { typography, spacing, radius, colors, cssVars, animation, shadows } from "../styles/tokens";
import { calculateBoardProgress } from "../utils/progressCalculation";
import BoardMembersSection from "./BoardMembersSection";
import TaskAssignmentSection from "./TaskAssignmentSection";
import AddBoardMemberModal from "./AddBoardMemberModal";
import { useAddBoardMember } from "../hooks/queries/useBoardMembers";

interface BoardInfoPanelProps {
  board: Board | null;
  onClose: () => void;
  onEdit?: () => void;
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
  onEdit,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isLight = theme === 'light';

  const isTeamBoard = board?.boardType === 'TEAM';
  type TabKey = 'info' | 'assignments' | 'updates';
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const addMemberMutation = useAddBoardMember(board?.id ?? 0, board?.slug ?? '');
  const handleAddMember = async (userId: number) => {
    await addMemberMutation.mutateAsync(userId);
  };

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

  // ─── Tab definitions for TEAM boards ───
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Bilgi', icon: <Info size={14} /> },
    { key: 'assignments', label: 'Görev Atamaları', icon: <Target size={14} /> },
    { key: 'updates', label: 'Güncellemeler', icon: <Clock size={14} /> },
  ];

  // ─── Compute assignment updates for "Güncellemeler" tab ───
  const assignmentUpdates = useMemo(() => {
    if (!isTeamBoard) return [];
    const members = board.members || [];
    const updates: {
      member: BoardMember;
      assignment: BoardMemberAssignment;
    }[] = [];

    for (const member of members) {
      for (const assignment of member.assignments || []) {
        updates.push({ member, assignment });
      }
    }

    // Sort by createdAt descending (most recent first)
    updates.sort((a, b) => {
      const dateA = new Date(a.assignment.createdAt).getTime();
      const dateB = new Date(b.assignment.createdAt).getTime();
      return dateB - dateA;
    });

    return updates;
  }, [isTeamBoard, board.members]);

  // ─── Shared content renderers ───

  const renderHeroSection = () => (
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
          <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[1.5] }}>
            <h2
              style={{
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                minWidth: 0,
              }}
            >
              {board.name}
            </h2>
            {board.isOwner && (
              <div style={{ display: "flex", alignItems: "center", gap: spacing[1.5], flexShrink: 0 }}>
                {isTeamBoard && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    title="Panoya Üye Ekle"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: spacing[8],
                      height: spacing[8],
                      borderRadius: radius.lg,
                      border: `1px solid ${themeColors.borderDefault}`,
                      background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
                      color: cssVars.textMuted,
                      cursor: "pointer",
                      transition: `all ${animation.duration.fast}`,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.brand.primary;
                      e.currentTarget.style.borderColor = colors.brand.primary;
                      e.currentTarget.style.background = colors.brand.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = cssVars.textMuted;
                      e.currentTarget.style.borderColor = themeColors.borderDefault;
                      e.currentTarget.style.background = isLight ? colors.light.bg.card : colors.dark.glass.bg;
                    }}
                  >
                    <UserPlus size={16} />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    title="Panoyu Düzenle"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: spacing[8],
                      height: spacing[8],
                      borderRadius: radius.lg,
                      border: `1px solid ${themeColors.borderDefault}`,
                      background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
                      color: cssVars.textMuted,
                      cursor: "pointer",
                      transition: `all ${animation.duration.fast}`,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.brand.primary;
                      e.currentTarget.style.borderColor = colors.brand.primary;
                      e.currentTarget.style.background = colors.brand.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = cssVars.textMuted;
                      e.currentTarget.style.borderColor = themeColors.borderDefault;
                      e.currentTarget.style.background = isLight ? colors.light.bg.card : colors.dark.glass.bg;
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
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
  );

  const renderInfoContent = () => (
    <>
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
                  <Calendar size={12} />
                  Son Tarih
                </span>
                <span style={metaValueStyle}>
                  <span style={{ fontWeight: typography.fontWeight.semibold }}>
                    {new Date(board.deadline!).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: cssVars.textMuted,
                    }}
                  >
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
      {isTeamBoard && <BoardMembersSection board={board} />}
    </>
  );

  const renderUpdatesContent = () => {
    const TARGET_TYPE_LABELS: Record<string, string> = {
      LIST: 'listeye',
      TASK: 'göreve',
      SUBTASK: 'alt göreve',
    };

    if (assignmentUpdates.length === 0) {
      return (
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            padding: `${spacing[8]} ${spacing[4]}`,
          }}
        >
          <Clock
            size={32}
            strokeWidth={1.5}
            style={{ opacity: 0.3, marginBottom: spacing[3], color: cssVars.textMuted }}
          />
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: cssVars.textMuted,
              margin: 0,
            }}
          >
            Henüz güncelleme bulunmuyor
          </p>
        </div>
      );
    }

    // Group updates by date
    const groupedByDate = new Map<string, typeof assignmentUpdates>();
    for (const update of assignmentUpdates) {
      const dateKey = new Date(update.assignment.createdAt).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groupedByDate.has(dateKey)) groupedByDate.set(dateKey, []);
      groupedByDate.get(dateKey)!.push(update);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
        {Array.from(groupedByDate.entries()).map(([dateLabel, updates]) => (
          <div key={dateLabel} style={cardStyle}>
            {/* Date Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                marginBottom: spacing[3],
                paddingBottom: spacing[2],
                borderBottom: `1px solid ${themeColors.borderDefault}`,
              }}
            >
              <Calendar size={13} color={cssVars.textMuted} />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wide,
                }}
              >
                {dateLabel}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.brand.primary,
                  background: colors.brand.primaryLight,
                  padding: `${spacing[0.5]} ${spacing[2]}`,
                  borderRadius: radius.full,
                }}
              >
                {updates.length}
              </span>
            </div>

            {/* Updates List */}
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
              {updates.map((update) => {
                const memberName =
                  update.member.firstName && update.member.lastName
                    ? `${update.member.firstName} ${update.member.lastName}`
                    : update.member.username;

                const time = new Date(update.assignment.createdAt).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const targetTypeLabel = TARGET_TYPE_LABELS[update.assignment.targetType] || 'öğeye';
                const targetName = update.assignment.targetName || `#${update.assignment.targetId}`;

                const initials =
                  update.member.firstName && update.member.lastName
                    ? `${update.member.firstName.charAt(0)}${update.member.lastName.charAt(0)}`.toUpperCase()
                    : update.member.username.substring(0, 2).toUpperCase();

                return (
                  <div
                    key={update.assignment.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: spacing[2.5],
                      padding: `${spacing[2]} ${spacing[2.5]}`,
                      borderRadius: radius.md,
                      background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                      transition: `background ${animation.duration.fast}`,
                    }}
                  >
                    {/* Avatar */}
                    {update.member.profilePicture ? (
                      <img
                        src={update.member.profilePicture}
                        alt={update.member.username}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: radius.full,
                          objectFit: "cover",
                          flexShrink: 0,
                          marginTop: spacing[0.5],
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: radius.full,
                          background: colors.brand.primaryLight,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: colors.brand.primary,
                          fontWeight: typography.fontWeight.bold,
                          fontSize: typography.fontSize.xs,
                          flexShrink: 0,
                          marginTop: spacing[0.5],
                        }}
                      >
                        {initials}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: spacing[1.5], flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold,
                            color: cssVars.textMain,
                          }}
                        >
                          {memberName}
                        </span>
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            color: cssVars.textMuted,
                          }}
                        >
                          {targetTypeLabel} atandı
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2],
                          marginTop: spacing[1],
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: spacing[1],
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.brand.primary,
                            background: colors.brand.primaryLight,
                            padding: `${spacing[0.5]} ${spacing[2]}`,
                            borderRadius: radius.sm,
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <UserPlus size={10} />
                          {targetName}
                        </span>
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            color: cssVars.textMuted,
                            display: "flex",
                            alignItems: "center",
                            gap: spacing[1],
                          }}
                        >
                          <Clock size={10} />
                          {time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing[4],
        animation: `fadeIn ${animation.duration.slow} ${animation.easing.spring}`,
      }}
    >
      {/* Hero Section — Always visible */}
      {renderHeroSection()}

      {/* Tab Bar — Only for TEAM boards */}
      {isTeamBoard && (
        <div
          style={{
            display: "flex",
            gap: spacing[1],
            padding: spacing[1],
            borderRadius: radius.xl,
            background: isLight ? colors.light.bg.card : colors.dark.glass.bg,
            border: `1px solid ${themeColors.borderDefault}`,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing[1.5],
                  padding: `${spacing[2]} ${spacing[2.5]}`,
                  borderRadius: radius.lg,
                  border: "none",
                  background: isActive
                    ? isLight
                      ? "#fff"
                      : "rgba(255,255,255,0.1)"
                    : "transparent",
                  color: isActive ? colors.brand.primary : cssVars.textMuted,
                  fontWeight: isActive
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.medium,
                  fontSize: typography.fontSize.xs,
                  cursor: "pointer",
                  transition: `all ${animation.duration.fast}`,
                  boxShadow: isActive ? shadows.sm : "none",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      {isTeamBoard ? (
        <>
          {activeTab === 'info' && renderInfoContent()}
          {activeTab === 'assignments' && (
            <div style={{ marginBottom: spacing[8] }}>
              <TaskAssignmentSection board={board} />
            </div>
          )}
          {activeTab === 'updates' && renderUpdatesContent()}
        </>
      ) : (
        /* Non-TEAM boards: show info content directly */
        renderInfoContent()
      )}

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

      {/* Add Member Modal */}
      {isTeamBoard && board.isOwner && (
        <AddBoardMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
          existingMembers={board.members || []}
        />
      )}
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

const CompactStatCell: React.FC<CompactStatCellProps> = ({ icon, label, completed, total, overdue, color, themeColors }) => {
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
