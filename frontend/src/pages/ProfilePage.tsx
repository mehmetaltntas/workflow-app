import {
  LayoutDashboard,
  List,
  CheckSquare,
  ListTodo,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader,
  TrendingUp,
} from "lucide-react";
import { useProfileStats } from "../hooks/useProfileStats";
import { StatCard } from "../components/StatCard";
import { typography, spacing, radius, colors, cssVars, shadows, animation } from "../styles/tokens";
import { useAuthStore } from "../stores/authStore";
import { STATUS_LABELS, STATUS_COLORS } from "../constants";

const ProfilePage = () => {
  const { stats, isLoading, error } = useProfileStats();
  const username = useAuthStore((state) => state.username) || "Kullanici";
  const initials = username.substring(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            width: spacing[10],
            height: spacing[10],
            border: `3px solid ${colors.brand.primaryLight}`,
            borderTopColor: colors.brand.primary,
            borderRadius: radius.full,
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: `${spacing[8]} ${spacing[6]}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: radius.full,
            background: colors.semantic.dangerLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            marginBottom: spacing[4],
          }}
        >
          <AlertCircle size={32} color={colors.semantic.danger} />
        </div>
        <h2
          style={{
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMain,
            marginBottom: spacing[2],
          }}
        >
          Bir Hata Olustu
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: cssVars.textMuted,
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: `${spacing[8]} ${spacing[6]}`,
      }}
    >
      {/* Page Header */}
      <div
        style={{
          marginBottom: spacing[8],
          paddingBottom: spacing[6],
          borderBottom: `1px solid ${cssVars.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[4],
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: radius.full,
              background: `linear-gradient(135deg, ${colors.brand.primary}, #7950f2)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textInverse,
              boxShadow: shadows.lg,
            }}
          >
            {initials}
          </div>
          <div>
            <h1
              style={{
                fontSize: typography.fontSize["4xl"],
                fontWeight: typography.fontWeight.bold,
                color: cssVars.textMain,
                margin: 0,
              }}
            >
              {username}
            </h1>
            <p
              style={{
                fontSize: typography.fontSize.lg,
                color: cssVars.textMuted,
                margin: 0,
                marginTop: spacing[1],
              }}
            >
              Calisma alani istatistikleriniz
            </p>
          </div>
        </div>
      </div>

      {/* Overall Progress Section */}
      <div
        style={{
          background: cssVars.bgCard,
          borderRadius: radius.xl,
          border: `1px solid ${cssVars.border}`,
          padding: spacing[6],
          marginBottom: spacing[6],
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing[4],
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: radius.lg,
                background: colors.brand.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={22} color={colors.brand.primary} strokeWidth={2} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.semibold,
                  color: cssVars.textMain,
                  margin: 0,
                }}
              >
                Genel Ilerleme
              </h2>
              <p
                style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  margin: 0,
                }}
              >
                Tum gorevler ve alt gorevler
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.brand.primary,
            }}
          >
            %{stats.overallProgress}
          </div>
        </div>
        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "12px",
            background: colors.dark.bg.hover,
            borderRadius: radius.full,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${stats.overallProgress}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.primaryHover})`,
              borderRadius: radius.full,
              transition: `width ${animation.duration.slow} ${animation.easing.smooth}`,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: spacing[2],
            fontSize: typography.fontSize.base,
            color: cssVars.textMuted,
          }}
        >
          <span>{stats.tasks.completed + stats.subtasks.completed} tamamlandi</span>
          <span>{stats.tasks.total + stats.subtasks.total} toplam</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: spacing[4],
          marginBottom: spacing[8],
        }}
      >
        <StatCard
          icon={LayoutDashboard}
          title="Panolar"
          value={stats.boards.total}
          subtitle={`${stats.boards.byStatus.DEVAM_EDIYOR} devam ediyor`}
          color={colors.brand.primary}
          bgColor={colors.brand.primaryLight}
        />
        <StatCard
          icon={List}
          title="Listeler"
          value={stats.lists.total}
          subtitle={`${stats.lists.completed} tamamlandi`}
          color={colors.semantic.info}
          bgColor={colors.semantic.infoLight}
        />
        <StatCard
          icon={CheckSquare}
          title="Gorevler"
          value={stats.tasks.total}
          subtitle={`${stats.tasks.completed} tamamlandi`}
          color={colors.semantic.success}
          bgColor={colors.semantic.successLight}
        />
        <StatCard
          icon={ListTodo}
          title="Alt Gorevler"
          value={stats.subtasks.total}
          subtitle={`${stats.subtasks.completed} tamamlandi`}
          color={colors.semantic.warning}
          bgColor={colors.semantic.warningLight}
        />
      </div>

      {/* Detailed Sections */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: spacing[6],
        }}
      >
        {/* Board Status Distribution */}
        <div
          style={{
            background: cssVars.bgCard,
            borderRadius: radius.xl,
            border: `1px solid ${cssVars.border}`,
            padding: spacing[6],
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMain,
              margin: 0,
              marginBottom: spacing[5],
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
            }}
          >
            <LayoutDashboard size={20} />
            Pano Durumlari
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
            {Object.entries(stats.boards.byStatus).map(([status, count]) => (
              <div
                key={status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: colors.dark.bg.hover,
                  borderRadius: radius.lg,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: radius.full,
                      background: STATUS_COLORS[status],
                    }}
                  />
                  <span
                    style={{
                      fontSize: typography.fontSize.lg,
                      color: cssVars.textMain,
                    }}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.semibold,
                    color: cssVars.textMain,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Details */}
        <div
          style={{
            background: cssVars.bgCard,
            borderRadius: radius.xl,
            border: `1px solid ${cssVars.border}`,
            padding: spacing[6],
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMain,
              margin: 0,
              marginBottom: spacing[5],
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
            }}
          >
            <CheckSquare size={20} />
            Gorev Detaylari
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
            {/* Completed */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${spacing[3]} ${spacing[4]}`,
                background: colors.semantic.successLight,
                borderRadius: radius.lg,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                <CheckCircle2 size={18} color={colors.semantic.success} />
                <span
                  style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.semantic.success,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Tamamlanan
                </span>
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.semantic.success,
                }}
              >
                {stats.tasks.completed}
              </span>
            </div>

            {/* Pending */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${spacing[3]} ${spacing[4]}`,
                background: colors.brand.primaryLight,
                borderRadius: radius.lg,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                <Loader size={18} color={colors.brand.primary} />
                <span
                  style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.brand.primary,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Bekleyen
                </span>
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.brand.primary,
                }}
              >
                {stats.tasks.pending}
              </span>
            </div>

            {/* Overdue */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${spacing[3]} ${spacing[4]}`,
                background: colors.semantic.dangerLight,
                borderRadius: radius.lg,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                <AlertCircle size={18} color={colors.semantic.danger} />
                <span
                  style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.semantic.danger,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Gecikmis
                </span>
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.semantic.danger,
                }}
              >
                {stats.tasks.overdue}
              </span>
            </div>

            {/* Due Today */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${spacing[3]} ${spacing[4]}`,
                background: colors.semantic.warningLight,
                borderRadius: radius.lg,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                <Clock size={18} color={colors.semantic.warningDark} />
                <span
                  style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.semantic.warningDark,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Bugun Bitmeli
                </span>
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.semantic.warningDark,
                }}
              >
                {stats.tasks.dueToday}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
