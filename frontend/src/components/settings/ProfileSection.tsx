import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Camera,
  Mail,
  AlertCircle,
  Check,
  Save,
} from "lucide-react";
import { AxiosError } from "axios";
import { userService, authService } from "../../services/api";
import toast from "react-hot-toast";
import { getUsernameError } from "../../utils/validation";
import { typography, spacing, radius, colors, cssVars, shadows, animation } from '../../styles/tokens';

interface ProfileSectionProps {
  userId: number;
  onProfileUpdated: (data: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    deletionScheduledAt?: string | null;
  }) => void;
}

const ProfileSection = ({ userId, onProfileUpdated }: ProfileSectionProps) => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await userService.getUser(userId);
        setUsername(user.username);
        setOriginalUsername(user.username);
        setFirstName("");
        setLastName("");
        setOriginalFirstName(user.firstName || "");
        setOriginalLastName(user.lastName || "");
        setEmail(user.email);
        setProfilePicture((user as { profilePicture?: string }).profilePicture || null);
      } catch (error) {
        console.error("Kullanıcı bilgileri alınamadı:", error);
        toast.error("Kullanıcı bilgileri alınamadı");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Track profile changes
  useEffect(() => {
    setHasProfileChanges(
      username !== originalUsername ||
      (firstName !== "" && firstName !== originalFirstName) ||
      (lastName !== "" && lastName !== originalLastName)
    );
  }, [username, originalUsername, firstName, originalFirstName, lastName, originalLastName]);

  const checkUsernameAvailability = useCallback(async (value: string) => {
    try {
      setCheckingUsername(true);
      const response = await authService.checkUsername(value);
      setUsernameAvailable(response.data.available);
      if (!response.data.available) {
        setUsernameError("Bu kullanıcı adı zaten alınmış");
      }
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);
    setUsernameError("");

    if (usernameCheckTimer.current) {
      clearTimeout(usernameCheckTimer.current);
    }

    if (value === originalUsername) return;
    if (!value) return;

    const error = getUsernameError(value);
    if (error) {
      setUsernameError(error);
      return;
    }

    usernameCheckTimer.current = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (usernameCheckTimer.current) {
        clearTimeout(usernameCheckTimer.current);
      }
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dosya boyutu 2MB'dan küçük olmalıdır");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        setHasProfileChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = useCallback(async () => {
    if (username !== originalUsername) {
      const uError = getUsernameError(username);
      if (uError) {
        toast.error(uError);
        return;
      }
      if (usernameAvailable === false) {
        toast.error("Bu kullanıcı adı zaten alınmış");
        return;
      }
    }

    setIsSavingProfile(true);
    const loadingToast = toast.loading("Profil güncelleniyor...");

    try {
      const data: { username?: string; firstName?: string; lastName?: string; profilePicture?: string } = {};

      if (username !== originalUsername) {
        data.username = username;
      }

      if (firstName && firstName !== originalFirstName) {
        data.firstName = firstName;
      }

      if (lastName && lastName !== originalLastName) {
        data.lastName = lastName;
      }

      if (profilePicture) {
        data.profilePicture = profilePicture;
      }

      const updatedUser = await userService.updateProfile(userId, data);

      onProfileUpdated({
        id: userId,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        deletionScheduledAt: updatedUser.deletionScheduledAt,
      });

      if (updatedUser.username) {
        setOriginalUsername(updatedUser.username);
      }
      if (updatedUser.firstName !== undefined) {
        setOriginalFirstName(updatedUser.firstName || "");
      }
      if (updatedUser.lastName !== undefined) {
        setOriginalLastName(updatedUser.lastName || "");
      }
      setFirstName("");
      setLastName("");

      setHasProfileChanges(false);
      toast.success("Profil başarıyla güncellendi!", { id: loadingToast });
    } catch (error: unknown) {
      console.error("Profil güncellenemedi:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data || "Profil güncellenemedi", { id: loadingToast });
      } else {
        toast.error("Profil güncellenemedi", { id: loadingToast });
      }
    } finally {
      setIsSavingProfile(false);
    }
  }, [userId, username, originalUsername, usernameAvailable, firstName, originalFirstName, lastName, originalLastName, profilePicture, onProfileUpdated]);

  const initials = originalFirstName && originalLastName
    ? (originalFirstName.charAt(0) + originalLastName.charAt(0)).toUpperCase()
    : username.substring(0, 2).toUpperCase();

  if (isLoadingProfile) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
      }}>
        <div style={{
          width: spacing[10],
          height: spacing[10],
          border: `3px solid ${colors.brand.primaryLight}`,
          borderTopColor: colors.brand.primary,
          borderRadius: radius.full,
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing[8] }}>
      {/* Section Header */}
      <div style={{
        marginBottom: spacing[8],
        paddingBottom: spacing[6],
        borderBottom: `1px solid ${cssVars.border}`,
      }}>
        <h2 style={{
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.semibold,
          color: cssVars.textMain,
          margin: 0,
          marginBottom: spacing[1],
        }}>
          Profil Bilgileri
        </h2>
        <p style={{
          fontSize: typography.fontSize.base,
          color: cssVars.textMuted,
          margin: 0,
        }}>
          Profil resminizi ve kullanıcı bilgilerinizi güncelleyin
        </p>
      </div>

      {/* Avatar Section */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[6],
        marginBottom: spacing[8],
        paddingBottom: spacing[8],
        borderBottom: `1px solid ${cssVars.border}`,
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: radius.full,
            background: profilePicture
              ? `url(${profilePicture}) center/cover no-repeat`
              : `linear-gradient(135deg, ${colors.brand.primary}, #7950f2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.fontSize["4xl"],
            fontWeight: typography.fontWeight.bold,
            color: cssVars.textInverse,
            border: `3px solid ${cssVars.bgBody}`,
            boxShadow: shadows.lg,
          }}>
            {!profilePicture && initials}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "absolute",
              bottom: "-4px",
              right: "-4px",
              width: spacing[9],
              height: spacing[9],
              borderRadius: radius.full,
              background: colors.brand.primary,
              border: `3px solid ${cssVars.bgCard}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = shadows.focusPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Camera size={16} color={cssVars.textInverse} strokeWidth={2.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>
        <div>
          <h3 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMain,
            margin: 0,
            marginBottom: spacing[1],
          }}>
            Profil Resmi
          </h3>
          <p style={{
            fontSize: typography.fontSize.base,
            color: cssVars.textMuted,
            margin: 0,
            marginBottom: spacing[2],
          }}>
            JPG, PNG veya GIF. Maksimum 2MB.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.brand.primary,
              background: colors.brand.primaryLight,
              border: "none",
              borderRadius: radius.md,
              cursor: "pointer",
              transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.brand.primary;
              e.currentTarget.style.color = cssVars.textInverse;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.brand.primaryLight;
              e.currentTarget.style.color = colors.brand.primary;
            }}
          >
            Resim Yükle
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[6] }}>
        {/* First Name & Last Name Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[4] }}>
          <div>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMuted,
              marginBottom: spacing[2],
            }}>
              <User size={14} />
              İsim
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={originalFirstName || "İsminizi girin"}
              maxLength={50}
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.lg,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: cssVars.textMuted,
              marginBottom: spacing[2],
            }}>
              <User size={14} />
              Soyisim
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={originalLastName || "Soyisminizi girin"}
              maxLength={50}
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.lg,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Username Field */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            marginBottom: spacing[2],
          }}>
            <User size={14} />
            Kullanıcı Adı
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="Kullanıcı adınızı girin"
            maxLength={30}
            style={{
              width: "100%",
              padding: `${spacing[3]} ${spacing[4]}`,
              fontSize: typography.fontSize.lg,
              boxSizing: "border-box",
              borderColor: usernameError
                ? colors.semantic.danger
                : (username !== originalUsername && usernameAvailable === true)
                ? colors.semantic.success
                : undefined,
            }}
          />
          {username !== originalUsername && username && (
            <div style={{ marginTop: spacing[1], fontSize: typography.fontSize.sm }}>
              {checkingUsername && (
                <span style={{ color: cssVars.textMuted }}>Kontrol ediliyor...</span>
              )}
              {usernameError && (
                <span style={{ display: "flex", alignItems: "center", gap: spacing[1], color: colors.semantic.danger }}>
                  <AlertCircle size={13} />
                  {usernameError}
                </span>
              )}
              {!usernameError && !checkingUsername && usernameAvailable === true && (
                <span style={{ display: "flex", alignItems: "center", gap: spacing[1], color: colors.semantic.success }}>
                  <Check size={13} />
                  Kullanıcı adı müsait
                </span>
              )}
            </div>
          )}
          <p style={{ fontSize: typography.fontSize.xs, color: cssVars.textMuted, marginTop: spacing[1] }}>
            3-30 karakter. Harf, rakam, nokta (.) ve alt tire (_) kullanılabilir.
          </p>
        </div>

        {/* Email Field (Read-only) */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: cssVars.textMuted,
            marginBottom: spacing[2],
          }}>
            <Mail size={14} />
            E-posta Adresi
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: "100%",
                padding: `${spacing[3]} ${spacing[4]}`,
                fontSize: typography.fontSize.lg,
                boxSizing: "border-box",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
            />
            <span style={{
              position: "absolute",
              right: spacing[3],
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: typography.fontSize.xs,
              color: cssVars.textMuted,
              background: cssVars.bgHover,
              padding: `${spacing[1]} ${spacing[2]}`,
              borderRadius: radius.sm,
            }}>
              Değiştirilemez
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{
        marginTop: spacing[8],
        paddingTop: spacing[6],
        borderTop: `1px solid ${cssVars.border}`,
        display: "flex",
        justifyContent: "flex-end",
      }}>
        <button
          onClick={handleSaveProfile}
          disabled={isSavingProfile || !hasProfileChanges || !!usernameError || checkingUsername}
          className="btn btn-primary"
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            opacity: (!hasProfileChanges || !!usernameError || checkingUsername) ? 0.5 : 1,
            cursor: (!hasProfileChanges || !!usernameError || checkingUsername) ? "not-allowed" : "pointer",
            minWidth: "180px",
          }}
        >
          {isSavingProfile ? (
            <>
              <div style={{
                width: "16px",
                height: "16px",
                border: `2px solid ${cssVars.borderSubtle}`,
                borderTopColor: cssVars.textInverse,
                borderRadius: radius.full,
                animation: "spin 1s linear infinite",
              }} />
              Kaydediliyor...
            </>
          ) : hasProfileChanges ? (
            <>
              <Save size={16} />
              Değişiklikleri Kaydet
            </>
          ) : (
            <>
              <Check size={16} />
              Kaydedildi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSection;
