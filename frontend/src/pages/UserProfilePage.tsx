import { useParams } from "react-router-dom";
import {
  Users,
  User,
  Lock,
  AlertCircle,
  LayoutDashboard,
  List,
  CheckSquare,
  ListTodo,
  TrendingUp,
  Tag,
} from "lucide-react";
import { useUserProfile } from "../hooks/queries/useUserProfile";
import { useUserProfileStats } from "../hooks/queries/useUserProfileStats";
import ConnectionButton from "../components/ConnectionButton";
import { StatCard } from "../components/StatCard";
import { typography, spacing, radius, colors, cssVars, shadows, animation } from "../styles/tokens";
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS } from "../constants";

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, error } = useUserProfile(username);

  // HIDDEN modda profil tamamen gizli (SELF ve ACCEPTED haric)
  const isHidden = profile
    ? profile.privacyMode === 'HIDDEN' && profile.connectionStatus !== "SELF" && profile.connectionStatus !== "ACCEPTED"
    : true;

  // PRIVATE modda granular kontrol (SELF ve ACCEPTED her seyi gorur)
  const isPrivateMode = profile
    ? profile.privacyMode === 'PRIVATE' && profile.connectionStatus !== "SELF" && profile.connectionStatus !== "ACCEPTED"
    : false;

  const ps = profile?.privacySettings;

  const { data: stats, isLoading: statsLoading } = useUserProfileStats(
    username,
    profile?.connectionStatus,
    profile?.privacyMode
  );

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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !profile) {
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
          Kullanıcı Bulunamadı
        </h2>
        <p style={{ fontSize: typography.fontSize.lg, color: cssVars.textMuted }}>
          Bu kullanıcı adı ile kayıtlı bir hesap bulunamadı.
        </p>
      </div>
    );
  }

  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : profile.username.substring(0, 2).toUpperCase();

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: `${spacing[8]} ${spacing[6]}`,
      }}
    >
      {/* Profile Card */}
      <div
        style={{
          background: cssVars.bgCard,
          borderRadius: radius.xl,
          border: `1px solid ${cssVars.border}`,
          padding: spacing[8],
          textAlign: "center",
          marginBottom: spacing[6],
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: radius.full,
            background: profile.profilePicture
              ? `url(${profile.profilePicture}) center/cover no-repeat`
              : `linear-gradient(135deg, ${colors.brand.primary}, #7950f2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.fontSize["4xl"],
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textInverse,
            margin: "0 auto",
            marginBottom: spacing[4],
            boxShadow: shadows.lg,
          }}
        >
          {!profile.profilePicture && initials}
        </div>

        {/* Username */}
        <h1
          style={{
            fontSize: typography.fontSize["3xl"],
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textMain,
            margin: 0,
            marginBottom: spacing[1],
          }}
        >
          {profile.username}
        </h1>

        {/* Full Name */}
        {profile.firstName && profile.lastName && (
          <p
            style={{
              fontSize: typography.fontSize.lg,
              color: cssVars.textMuted,
              margin: 0,
              marginBottom: spacing[2],
            }}
          >
            {profile.firstName} {profile.lastName}
          </p>
        )}

        {/* Connection Count */}
        {!isHidden && profile.connectionCount !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing[2],
              marginBottom: spacing[6],
            }}
          >
            <Users size={18} color={cssVars.textMuted} />
            <span
              style={{
                fontSize: typography.fontSize.lg,
                color: cssVars.textMuted,
              }}
            >
              <strong style={{ color: cssVars.textMain }}>{profile.connectionCount}</strong> bağlantı
            </span>
          </div>
        )}

        {/* Private Profile Notice */}
        {isHidden && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing[2],
              marginBottom: spacing[6],
              padding: `${spacing[3]} ${spacing[4]}`,
              background: colors.semantic.warningLight,
              borderRadius: radius.lg,
            }}
          >
            <Lock size={16} color={colors.semantic.warning} />
            <span style={{ fontSize: typography.fontSize.base, color: cssVars.textMuted }}>
              Bu profil gizli
            </span>
          </div>
        )}

        {/* Connection Button */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ConnectionButton
            userId={profile.id}
            connectionStatus={profile.connectionStatus}
            referenceId={profile.connectionId}
          />
        </div>
      </div>

      {/* Stats Sections - only shown when profile is not hidden */}
      {!isHidden && stats && (
        <>
          {/* Section Title */}
          <h2
            style={{
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0,
              marginBottom: spacing[6],
            }}
          >
            {profile.username} kullanıcısının istatistikleri
          </h2>

          {/* Overall Progress Section */}
          {(!isPrivateMode || ps?.showOverallProgress) && (
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
                  <h3
                    style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.semibold,
                      color: cssVars.textMain,
                      margin: 0,
                    }}
                  >
                    Genel İlerleme
                  </h3>
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
          )}

          {/* Summary Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: spacing[4],
              marginBottom: spacing[8],
            }}
          >
            {(!isPrivateMode || ps?.showBoardStats) && (
            <StatCard
              icon={LayoutDashboard}
              title="Panolar"
              value={stats.totalBoards}
              subtitle={`${stats.boardsByStatus?.DEVAM_EDIYOR ?? 0} devam ediyor`}
              color={colors.brand.primary}
              bgColor={colors.brand.primaryLight}
            />
            )}
            {(!isPrivateMode || ps?.showListStats) && (
            <StatCard
              icon={List}
              title="Listeler"
              value={stats.totalLists}
              subtitle={
                <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{stats.individualTotalLists} Bireysel</span>
                    <span>{stats.individualCompletedLists} Tamamlandı</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{stats.teamTotalLists} Ekip</span>
                    <span>{stats.teamCompletedLists} Tamamlandı</span>
                  </div>
                </div>
              }
              color={colors.semantic.info}
              bgColor={colors.semantic.infoLight}
            />
            )}
            {(!isPrivateMode || ps?.showTaskStats) && (
            <StatCard
              icon={CheckSquare}
              title="Görevler"
              value={stats.totalTasks}
              subtitle={
                <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{stats.individualTotalTasks} Bireysel</span>
                    <span>{stats.individualCompletedTasks} Tamamlandı</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{stats.teamTotalTasks} Ekip</span>
                    <span>{stats.teamCompletedTasks} Tamamlandı</span>
                  </div>
                </div>
              }
              color={colors.semantic.success}
              bgColor={colors.semantic.successLight}
            />
            )}
            {(!isPrivateMode || ps?.showSubtaskStats) && (
            <StatCard
              icon={ListTodo}
              title="Alt Görevler"
              value={stats.totalSubtasks}
              subtitle={
                <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{stats.individualTotalSubtasks} Bireysel</span>
                    <span>{stats.individualCompletedSubtasks} Tamamlandı</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{stats.teamTotalSubtasks} Ekip</span>
                    <span>{stats.teamCompletedSubtasks} Tamamlandı</span>
                  </div>
                </div>
              }
              color={colors.semantic.warning}
              bgColor={colors.semantic.warningLight}
            />
            )}
          </div>

          {/* Detailed Sections */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: spacing[6],
            }}
          >
            {/* Bireysel Panolar */}
            {(!isPrivateMode || ps?.showBoardStats) && stats.individualBoardsByStatus && (
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
                <User size={20} />
                Bireysel Panolar
                <span
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: cssVars.textMuted,
                  }}
                >
                  ({stats.totalBoards - stats.teamBoardCount})
                </span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {Object.entries(stats.individualBoardsByStatus).map(([status, count]) => (
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
            )}

            {/* Ekip Panoları */}
            {(!isPrivateMode || ps?.showTeamBoardStats) && stats.teamBoardsByStatus && stats.teamBoardCount > 0 && (
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
                  Ekip Panoları
                  <span
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.medium,
                      color: cssVars.textMuted,
                    }}
                  >
                    ({stats.teamBoardCount})
                  </span>
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                  {Object.entries(stats.teamBoardsByStatus).map(([status, count]) => (
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
            )}

            {/* Top Categories */}
            {(!isPrivateMode || ps?.showTopCategories) && (
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
            )}
          </div>
        </>
      )}

      {/* Stats Loading Indicator */}
      {!isHidden && statsLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: spacing[8],
          }}
        >
          <div
            style={{
              width: spacing[8],
              height: spacing[8],
              border: `3px solid ${colors.brand.primaryLight}`,
              borderTopColor: colors.brand.primary,
              borderRadius: radius.full,
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default UserProfilePage;
