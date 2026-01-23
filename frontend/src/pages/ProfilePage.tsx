import { useState, useEffect, useRef } from "react";
import { User, Camera, Mail, Save, Check } from "lucide-react";
import { userService } from "../services/api";
import toast from "react-hot-toast";
import { typography, spacing, radius, shadows, colors, cssVars } from '../styles/tokens';

const ProfilePage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const user = await userService.getUser(Number(userId));
        setUsername(user.username);
        setOriginalUsername(user.username);
        setEmail(user.email);
        setProfilePicture((user as { profilePicture?: string }).profilePicture || null);
      } catch (error) {
        console.error("Kullanıcı bilgileri alınamadı:", error);
        toast.error("Kullanıcı bilgileri alınamadı");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Track changes
  useEffect(() => {
    setHasChanges(username !== originalUsername);
  }, [username, originalUsername]);

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
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    const loadingToast = toast.loading("Profil güncelleniyor...");

    try {
      const data: { username?: string; profilePicture?: string } = {};
      
      if (username !== originalUsername) {
        data.username = username;
      }
      
      if (profilePicture) {
        data.profilePicture = profilePicture;
      }

      const updatedUser = await userService.updateProfile(Number(userId), data);

      // LocalStorage'ı güncelle
      if (updatedUser.username) {
        localStorage.setItem("username", updatedUser.username);
        setOriginalUsername(updatedUser.username);
      }
      
      setHasChanges(false);
      toast.success("Profil başarıyla güncellendi!", { id: loadingToast });
    } catch (error: unknown) {
      console.error("Profil güncellenemedi:", error);
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || "Profil güncellenemedi", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
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

  const initials = username.substring(0, 2).toUpperCase();

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: `${spacing[10]} ${spacing[6]}`,
    }}>
      {/* Header */}
      <div style={{ marginBottom: spacing[10] }}>
        <h1 style={{
          fontSize: typography.fontSize["4xl"],
          fontWeight: typography.fontWeight.bold,
          color: cssVars.textMain,
          marginBottom: spacing[2],
        }}>
          Profil Ayarları
        </h1>
        <p style={{
          fontSize: typography.fontSize.lg,
          color: cssVars.textMuted,
        }}>
          Profil bilgilerinizi görüntüleyin ve düzenleyin
        </p>
      </div>

      {/* Profile Card */}
      <div style={{
        background: cssVars.bgCard,
        borderRadius: radius.lg,
        border: `1px solid ${cssVars.border}`,
        padding: spacing[8],
      }}>
        {/* Profile Picture Section */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: spacing[8],
          paddingBottom: spacing[8],
          borderBottom: `1px solid ${cssVars.border}`,
        }}>
          <div style={{
            position: "relative",
            marginBottom: spacing[4],
          }}>
            {/* Avatar */}
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: radius.full,
              background: profilePicture
                ? `url(${profilePicture}) center/cover no-repeat`
                : `linear-gradient(135deg, ${colors.brand.primary}, #7950f2)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: typography.fontSize["5xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textInverse,
              border: `4px solid ${cssVars.bgBody}`,
              boxShadow: shadows.lg,
            }}>
              {!profilePicture && initials}
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                width: spacing[10],
                height: spacing[10],
                borderRadius: radius.full,
                background: colors.brand.primary,
                border: `3px solid ${cssVars.bgCard}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
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
              <Camera size={18} color={cssVars.textInverse} strokeWidth={2.5} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>

          <p style={{
            fontSize: typography.fontSize.base,
            color: cssVars.textMuted,
          }}>
            Profil resminizi değiştirmek için tıklayın (max 2MB)
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[6] }}>
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
              textTransform: "uppercase",
              letterSpacing: typography.letterSpacing.wide,
            }}>
              <User size={14} />
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: `${spacing[3.5]} ${spacing[4]}`,
                fontSize: typography.fontSize.xl,
                boxSizing: "border-box",
              }}
            />
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
              textTransform: "uppercase",
              letterSpacing: typography.letterSpacing.wide,
            }}>
              <Mail size={14} />
              E-posta Adresi
            </label>
            <div style={{
              position: "relative",
            }}>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: "100%",
                  padding: `${spacing[3.5]} ${spacing[4]}`,
                  fontSize: typography.fontSize.xl,
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
                fontSize: typography.fontSize.sm,
                color: cssVars.textMuted,
                background: colors.dark.bg.hover,
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
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: spacing[3.5],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              opacity: !hasChanges ? 0.5 : 1,
              cursor: !hasChanges ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? (
              <>
                <div style={{
                  width: "18px",
                  height: "18px",
                  border: `2px solid ${colors.dark.border.subtle}`,
                  borderTopColor: cssVars.textInverse,
                  borderRadius: radius.full,
                  animation: "spin 1s linear infinite",
                }} />
                Kaydediliyor...
              </>
            ) : hasChanges ? (
              <>
                <Save size={18} />
                Değişiklikleri Kaydet
              </>
            ) : (
              <>
                <Check size={18} />
                Kaydedildi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spin Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
