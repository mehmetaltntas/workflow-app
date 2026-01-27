import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Check,
  Save,
  Settings,
  ChevronRight,
  Globe,
} from "lucide-react";
import { userService, authService } from "../services/api";
import toast from "react-hot-toast";
import { getUsernameError } from "../utils/validation";
import { typography, spacing, radius, colors, cssVars, shadows, animation } from '../styles/tokens';
import { useAuthStore } from '../stores/authStore';

type SettingsSection = 'profile' | 'security' | 'privacy';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Profile states
  const [username, setUsername] = useState("");
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

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Privacy states
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const updateAuthUsername = useAuthStore((state) => state.updateUsername);
  const login = useAuthStore((state) => state.login);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const user = await userService.getUser(userId);
        setUsername(user.username);
        setOriginalUsername(user.username);
        setEmail(user.email);
        setProfilePicture((user as { profilePicture?: string }).profilePicture || null);

        // Gizlilik ayarini profil endpointinden al
        try {
          const profile = await userService.getUserProfile(user.username);
          setIsProfilePublic(profile.isProfilePublic);
        } catch {
          // Profil gizlilik bilgisi alinamazsa varsayilan deger kullanilir
        }
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
    setHasProfileChanges(username !== originalUsername);
  }, [username, originalUsername]);

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

    // Mevcut kullanıcı adıyla aynıysa kontrol etmeye gerek yok
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

  // Password validation
  const passwordsMatch = newPassword === confirmPassword;
  const isNewPasswordValid = newPassword.length >= 4;
  const canSubmitPassword = currentPassword && newPassword && confirmPassword && passwordsMatch && isNewPasswordValid;

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

  const handleSaveProfile = async () => {
    if (!userId) return;

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
      const data: { username?: string; profilePicture?: string } = {};

      if (username !== originalUsername) {
        data.username = username;
      }

      if (profilePicture) {
        data.profilePicture = profilePicture;
      }

      const updatedUser = await userService.updateProfile(userId, data);

      if (updatedUser.token && updatedUser.refreshToken) {
        // Kullanıcı adı değiştiyse yeni token'larla oturumu güncelle
        login({
          token: updatedUser.token,
          refreshToken: updatedUser.refreshToken,
          id: userId,
          username: updatedUser.username,
        });
      } else if (updatedUser.username) {
        updateAuthUsername(updatedUser.username);
      }

      if (updatedUser.username) {
        setOriginalUsername(updatedUser.username);
      }

      setHasProfileChanges(false);
      toast.success("Profil başarıyla güncellendi!", { id: loadingToast });
    } catch (error: unknown) {
      console.error("Profil güncellenemedi:", error);
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || "Profil güncellenemedi", { id: loadingToast });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPassword || !userId) return;

    setIsSubmittingPassword(true);
    const loadingToast = toast.loading("Şifre değiştiriliyor...");

    try {
      await userService.updatePassword(userId!, {
        currentPassword,
        newPassword,
      });

      toast.success("Şifre başarıyla değiştirildi!", { id: loadingToast });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Şifre değiştirilemedi:", error);
      const err = error as { response?: { data?: string } };
      toast.error(err.response?.data || "Şifre değiştirilemedi", { id: loadingToast });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const initials = username.substring(0, 2).toUpperCase();

  const handleTogglePrivacy = async () => {
    if (!userId) return;
    setIsSavingPrivacy(true);
    try {
      const newValue = !isProfilePublic;
      await userService.updatePrivacy(userId, { isProfilePublic: newValue });
      setIsProfilePublic(newValue);
      toast.success(newValue ? "Profil herkese acik yapildi" : "Profil gizli yapildi");
    } catch {
      toast.error("Gizlilik ayari guncellenemedi");
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const menuItems = [
    { id: 'profile' as const, label: 'Profil', icon: User, description: 'Profil bilgilerinizi düzenleyin' },
    { id: 'privacy' as const, label: 'Gizlilik', icon: Globe, description: 'Profil gizlilik ayarlari' },
    { id: 'security' as const, label: 'Güvenlik', icon: Shield, description: 'Şifre ve güvenlik ayarları' },
  ];

  if (isLoadingProfile) {
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

  return (
    <div style={{
      maxWidth: "1000px",
      margin: "0 auto",
      padding: `${spacing[8]} ${spacing[6]}`,
    }}>
      {/* Page Header */}
      <div style={{
        marginBottom: spacing[8],
        paddingBottom: spacing[6],
        borderBottom: `1px solid ${cssVars.border}`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[3],
          marginBottom: spacing[2],
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: radius.lg,
            background: colors.brand.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Settings size={24} color={colors.brand.primary} />
          </div>
          <div>
            <h1 style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              margin: 0,
            }}>
              Ayarlar
            </h1>
            <p style={{
              fontSize: typography.fontSize.lg,
              color: cssVars.textMuted,
              margin: 0,
            }}>
              Hesap ve uygulama ayarlarınızı yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: spacing[6],
      }}>
        {/* Sidebar Navigation */}
        <nav style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing[1],
        }}>
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[3],
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: isActive ? colors.brand.primaryLight : "transparent",
                  border: "none",
                  borderRadius: radius.lg,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = cssVars.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: radius.md,
                  background: isActive ? colors.brand.primary : cssVars.bgHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                }}>
                  <Icon
                    size={20}
                    color={isActive ? cssVars.textInverse : cssVars.textMuted}
                    style={{ transition: `color ${animation.duration.normal}` }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                    color: isActive ? colors.brand.primary : cssVars.textMain,
                    marginBottom: spacing[0.5],
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: cssVars.textMuted,
                  }}>
                    {item.description}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  color={isActive ? colors.brand.primary : cssVars.textMuted}
                  style={{
                    opacity: isActive ? 1 : 0.5,
                    transition: `opacity ${animation.duration.normal}`,
                  }}
                />
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div style={{
          background: cssVars.bgCard,
          borderRadius: radius.xl,
          border: `1px solid ${cssVars.border}`,
          overflow: "hidden",
        }}>
          {/* Profile Section */}
          {activeSection === 'profile' && (
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
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
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
                  Gizlilik Ayarlari
                </h2>
                <p style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  margin: 0,
                }}>
                  Profilinizin gorunurlugunu yonetin
                </p>
              </div>

              {/* Privacy Toggle */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing[5],
                background: cssVars.bgHover,
                borderRadius: radius.lg,
              }}>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: cssVars.textMain,
                    marginBottom: spacing[1],
                  }}>
                    Profil herkese acik
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.base,
                    color: cssVars.textMuted,
                  }}>
                    {isProfilePublic
                      ? "Profiliniz tum kullanicilar tarafindan gorulebilir."
                      : "Profiliniz gizli. Sadece baglantilariniz gorebilir."}
                  </div>
                </div>
                <button
                  onClick={handleTogglePrivacy}
                  disabled={isSavingPrivacy}
                  style={{
                    width: "52px",
                    height: "28px",
                    borderRadius: "14px",
                    border: "none",
                    background: isProfilePublic ? colors.brand.primary : cssVars.bgHover,
                    cursor: isSavingPrivacy ? "not-allowed" : "pointer",
                    position: "relative",
                    transition: `background ${animation.duration.normal} ${animation.easing.smooth}`,
                    boxShadow: isProfilePublic ? "none" : `inset 0 0 0 1px ${cssVars.border}`,
                    flexShrink: 0,
                    opacity: isSavingPrivacy ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      top: "3px",
                      left: isProfilePublic ? "27px" : "3px",
                      transition: `left ${animation.duration.normal} ${animation.easing.smooth}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
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
                  Şifre Değiştir
                </h2>
                <p style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  margin: 0,
                }}>
                  Hesabınız için yeni bir şifre belirleyin
                </p>
              </div>

              {/* Password Form */}
              <form onSubmit={handleChangePassword} style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[6],
              }}>
                {/* Current Password */}
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
                    <Lock size={14} />
                    Mevcut Şifre
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mevcut şifrenizi girin"
                      style={{
                        width: "100%",
                        padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[4]}`,
                        fontSize: typography.fontSize.lg,
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: "absolute",
                        right: spacing[3],
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: cssVars.textMuted,
                        padding: spacing[1],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
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
                    <Lock size={14} />
                    Yeni Şifre
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yeni şifrenizi girin"
                      style={{
                        width: "100%",
                        padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[4]}`,
                        fontSize: typography.fontSize.lg,
                        boxSizing: "border-box",
                        borderColor: newPassword && !isNewPasswordValid ? colors.semantic.danger : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: spacing[3],
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: cssVars.textMuted,
                        padding: spacing[1],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword && !isNewPasswordValid && (
                    <p style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[1.5],
                      marginTop: spacing[2],
                      fontSize: typography.fontSize.md,
                      color: colors.semantic.danger,
                    }}>
                      <AlertCircle size={14} />
                      Şifre en az 4 karakter olmalıdır
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
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
                    <Lock size={14} />
                    Yeni Şifre (Tekrar)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yeni şifrenizi tekrar girin"
                      style={{
                        width: "100%",
                        padding: `${spacing[3]} ${spacing[12]} ${spacing[3]} ${spacing[4]}`,
                        fontSize: typography.fontSize.lg,
                        boxSizing: "border-box",
                        borderColor: confirmPassword && !passwordsMatch ? colors.semantic.danger :
                                    confirmPassword && passwordsMatch ? colors.semantic.success : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: spacing[3],
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: cssVars.textMuted,
                        padding: spacing[1],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[1.5],
                      marginTop: spacing[2],
                      fontSize: typography.fontSize.md,
                      color: colors.semantic.danger,
                    }}>
                      <AlertCircle size={14} />
                      Şifreler eşleşmiyor
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && isNewPasswordValid && (
                    <p style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[1.5],
                      marginTop: spacing[2],
                      fontSize: typography.fontSize.md,
                      color: colors.semantic.success,
                    }}>
                      <Check size={14} />
                      Şifreler eşleşiyor
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div style={{
                  marginTop: spacing[2],
                  paddingTop: spacing[6],
                  borderTop: `1px solid ${cssVars.border}`,
                  display: "flex",
                  justifyContent: "flex-end",
                }}>
                  <button
                    type="submit"
                    disabled={!canSubmitPassword || isSubmittingPassword}
                    className="btn btn-primary"
                    style={{
                      padding: `${spacing[3]} ${spacing[6]}`,
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      opacity: !canSubmitPassword ? 0.5 : 1,
                      cursor: !canSubmitPassword ? "not-allowed" : "pointer",
                      minWidth: "180px",
                    }}
                  >
                    {isSubmittingPassword ? (
                      <>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: `2px solid ${cssVars.borderSubtle}`,
                          borderTopColor: cssVars.textInverse,
                          borderRadius: radius.full,
                          animation: "spin 1s linear infinite",
                        }} />
                        Değiştiriliyor...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Şifreyi Değiştir
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Info Note */}
              <div style={{
                marginTop: spacing[6],
                padding: spacing[4],
                background: colors.brand.primaryLight,
                borderRadius: radius.md,
                border: `1px solid ${cssVars.borderFocus}`,
              }}>
                <p style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: spacing[3],
                  margin: 0,
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  lineHeight: typography.lineHeight.normal,
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: colors.brand.primary }} />
                  Şifrenizi değiştirdikten sonra mevcut oturumunuz devam edecektir. Güvenlik için tarayıcınızı kapatıp yeniden giriş yapmanızı öneririz.
                </p>
              </div>
            </div>
          )}
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

export default SettingsPage;
