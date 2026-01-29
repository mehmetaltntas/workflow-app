import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  CheckSquare,
  ListTodo,
  AlertCircle,
  TrendingUp,
  Tag,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUserProfileStats } from "../hooks/queries/useUserProfileStats";
import { useUserProfile } from "../hooks/queries/useUserProfile";
import { StatCard } from "../components/StatCard";
import { typography, spacing, radius, colors, cssVars, shadows, animation } from "../styles/tokens";
import { useAuthStore } from "../stores/authStore";
import { connectionService } from "../services/api";
import { queryKeys } from "../lib/queryClient";
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS } from "../constants";

const ProfilePage = () => {
  const username = useAuthStore((state) => state.username) || "Kullanıcı";
  const { data: stats, isLoading, error } = useUserProfileStats(username, "SELF", "PUBLIC");
  const { data: profile } = useUserProfile(username);
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || null;
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : username.substring(0, 2).toUpperCase();

  const { data: connectionCount = 0 } = useQuery({
    queryKey: queryKeys.connections.count,
    queryFn: () => connectionService.getCount(),
  });

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
          Bir Hata Oluştu
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: cssVars.textMuted,
          }}
        >
          İstatistikler yüklenemedi
        </p>
      </div>
    );
  }

  if (!stats) {
    return null;
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
            {fullName && (
              <h1
                style={{
                  fontSize: typography.fontSize["4xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: cssVars.textMain,
                  margin: 0,
                }}
              >
                {fullName}
              </h1>
            )}
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: cssVars.textMuted,
                margin: 0,
                marginTop: fullName ? spacing[1] : 0,
              }}
            >
              @{username}
            </p>
            <Link
              to="/connections"
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                marginTop: spacing[2],
                textDecoration: "none",
              }}
            >
              <Users size={16} color={cssVars.textMuted} />
              <span style={{ fontSize: typography.fontSize.base, color: cssVars.textMuted }}>
                <strong style={{ color: cssVars.textMain }}>{connectionCount}</strong> bağlantı
              </span>
            </Link>
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
                Genel İlerleme
              </h2>
              <p
                style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  margin: 0,
                }}
              >
                Tüm görevler ve alt görevler
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
            background: cssVars.bgHover,
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
          <span>{stats.completedTasks + stats.completedSubtasks} tamamlandı</span>
          <span>{stats.totalTasks + stats.totalSubtasks} toplam</span>
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
          value={stats.totalBoards}
          subtitle={`${stats.boardsByStatus.DEVAM_EDIYOR} devam ediyor`}
          color={colors.brand.primary}
          bgColor={colors.brand.primaryLight}
        />
        <StatCard
          icon={List}
          title="Listeler"
          value={stats.totalLists}
          subtitle={`${stats.completedLists} tamamlandı`}
          color={colors.semantic.info}
          bgColor={colors.semantic.infoLight}
        />
        <StatCard
          icon={CheckSquare}
          title="Görevler"
          value={stats.totalTasks}
          subtitle={`${stats.completedTasks} tamamlandı`}
          color={colors.semantic.success}
          bgColor={colors.semantic.successLight}
        />
        <StatCard
          icon={ListTodo}
          title="Alt Görevler"
          value={stats.totalSubtasks}
          subtitle={`${stats.completedSubtasks} tamamlandı`}
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
            Pano Durumları
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
            {Object.entries(stats.boardsByStatus).map(([status, count]) => (
              <div
                key={status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: cssVars.bgHover,
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

        {/* Team Board Stats */}
        {stats.teamBoardCount > 0 && (
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
              <Users size={20} />
              Ekip Panosu
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: cssVars.bgHover,
                  borderRadius: radius.lg,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: radius.full, background: colors.brand.primary }} />
                  <span style={{ fontSize: typography.fontSize.lg, color: cssVars.textMain }}>
                    Ekip Panoları
                  </span>
                </div>
                <span style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: cssVars.textMain }}>
                  {stats.teamBoardCount}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: cssVars.bgHover,
                  borderRadius: radius.lg,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: radius.full, background: colors.semantic.info }} />
                  <span style={{ fontSize: typography.fontSize.lg, color: cssVars.textMain }}>
                    Bireysel Panolar
                  </span>
                </div>
                <span style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: cssVars.textMain }}>
                  {stats.totalBoards - stats.teamBoardCount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Categories */}
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
            <Tag size={20} />
            Popüler Kategoriler
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
            {stats.topCategories.length === 0 ? (
              <p
                style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  textAlign: "center",
                  padding: spacing[4],
                  margin: 0,
                }}
              >
                Henüz kategorili pano bulunmuyor
              </p>
            ) : (
              stats.topCategories.map((item, index) => {
                const maxCount = stats.topCategories[0].count;
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={item.category}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[3],
                      padding: `${spacing[3]} ${spacing[4]}`,
                      background: cssVars.bgHover,
                      borderRadius: radius.lg,
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.brand.primary,
                        minWidth: "24px",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: spacing[1],
                        }}
                      >
                        <span
                          style={{
                            fontSize: typography.fontSize.lg,
                            color: cssVars.textMain,
                            fontWeight: typography.fontWeight.medium,
                          }}
                        >
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        <span
                          style={{
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            color: cssVars.textMuted,
                          }}
                        >
                          {item.count} pano
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          background: colors.brand.primaryLight,
                          borderRadius: radius.full,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background: colors.brand.primary,
                            borderRadius: radius.full,
                            transition: `width ${animation.duration.slow} ${animation.easing.smooth}`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
