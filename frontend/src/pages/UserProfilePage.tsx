import { useParams } from "react-router-dom";
import { Users, Lock, AlertCircle } from "lucide-react";
import { useUserProfile } from "../hooks/queries/useUserProfile";
import ConnectionButton from "../components/ConnectionButton";
import { typography, spacing, radius, colors, cssVars, shadows } from "../styles/tokens";

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, error } = useUserProfile(username);

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
          Kullanici Bulunamadi
        </h2>
        <p style={{ fontSize: typography.fontSize.lg, color: cssVars.textMuted }}>
          Bu kullanici adi ile kayitli bir hesap bulunamadi.
        </p>
      </div>
    );
  }

  const initials = profile.username.substring(0, 2).toUpperCase();
  const isPrivate = !profile.isProfilePublic && profile.connectionStatus !== "SELF" && profile.connectionStatus !== "ACCEPTED";

  return (
    <div
      style={{
        maxWidth: "700px",
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
            marginBottom: spacing[2],
          }}
        >
          {profile.username}
        </h1>

        {/* Connection Count */}
        {!isPrivate && profile.connectionCount !== null && (
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
              <strong style={{ color: cssVars.textMain }}>{profile.connectionCount}</strong> baglanti
            </span>
          </div>
        )}

        {/* Private Profile Notice */}
        {isPrivate && (
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default UserProfilePage;
