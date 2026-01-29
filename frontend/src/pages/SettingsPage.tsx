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
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";
import { userService, authService } from "../services/api";
import toast from "react-hot-toast";
import { getUsernameError } from "../utils/validation";
import { typography, spacing, radius, colors, cssVars, shadows, animation } from '../styles/tokens';
import { useAuthStore } from '../stores/authStore';
import type { PrivacyMode, GranularPrivacySettings } from '../types';

type SettingsSection = 'profile' | 'security' | 'privacy' | 'account';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Profile states
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

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Privacy states
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('HIDDEN');
  const [originalPrivacyMode, setOriginalPrivacyMode] = useState<PrivacyMode>('HIDDEN');
  const [granularSettings, setGranularSettings] = useState<GranularPrivacySettings>({
    showProfilePicture: true,
    showOverallProgress: true,
    showBoardStats: true,
    showListStats: true,
    showTaskStats: true,
    showSubtaskStats: true,
    showTeamBoardStats: true,
    showTopCategories: true,
    showConnectionCount: true,
  });
  const [originalGranularSettings, setOriginalGranularSettings] = useState<GranularPrivacySettings>({
    showProfilePicture: true,
    showOverallProgress: true,
    showBoardStats: true,
    showListStats: true,
    showTaskStats: true,
    showSubtaskStats: true,
    showTeamBoardStats: true,
    showTopCategories: true,
    showConnectionCount: true,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Account deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletionLoading, setIsDeletionLoading] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const updateAuthUsername = useAuthStore((state) => state.updateUsername);
  const login = useAuthStore((state) => state.login);
  const deletionScheduledAt = useAuthStore((state) => state.deletionScheduledAt);
  const setDeletionScheduledAt = useAuthStore((state) => state.setDeletionScheduledAt);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const user = await userService.getUser(userId);
        setUsername(user.username);
        setOriginalUsername(user.username);
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setOriginalFirstName(user.firstName || "");
        setOriginalLastName(user.lastName || "");
        setEmail(user.email);
        setProfilePicture((user as { profilePicture?: string }).profilePicture || null);

        // Gizlilik ayarlarini al
        try {
          const privacyData = await userService.getPrivacySettings(userId);
          setPrivacyMode(privacyData.privacyMode);
          setOriginalPrivacyMode(privacyData.privacyMode);
          if (privacyData.privacyMode === 'PRIVATE') {
            const gs: GranularPrivacySettings = {
              showProfilePicture: privacyData.showProfilePicture ?? true,
              showOverallProgress: privacyData.showOverallProgress ?? true,
              showBoardStats: privacyData.showBoardStats ?? true,
              showListStats: privacyData.showListStats ?? true,
              showTaskStats: privacyData.showTaskStats ?? true,
              showSubtaskStats: privacyData.showSubtaskStats ?? true,
              showTeamBoardStats: privacyData.showTeamBoardStats ?? true,
              showTopCategories: privacyData.showTopCategories ?? true,
              showConnectionCount: privacyData.showConnectionCount ?? true,
            };
            setGranularSettings(gs);
            setOriginalGranularSettings({ ...gs });
          }
        } catch {
          // Gizlilik bilgisi alinamazsa varsayilan deger kullanilir
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
    setHasProfileChanges(
      username !== originalUsername ||
      firstName !== originalFirstName ||
      lastName !== originalLastName
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

  const handleSaveProfile = useCallback(async () => {
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
      const data: { username?: string; firstName?: string; lastName?: string; profilePicture?: string } = {};

      if (username !== originalUsername) {
        data.username = username;
      }

      if (firstName !== originalFirstName) {
        data.firstName = firstName;
      }

      if (lastName !== originalLastName) {
        data.lastName = lastName;
      }

      if (profilePicture) {
        data.profilePicture = profilePicture;
      }

      const updatedUser = await userService.updateProfile(userId, data);

      if (updatedUser.username) {
        // Kullanıcı adı değiştiyse oturumu güncelle (token'lar cookie'de, backend tarafında yenilenir)
        login({
          id: userId,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          deletionScheduledAt: updatedUser.deletionScheduledAt,
        });
      }

      if (updatedUser.username) {
        setOriginalUsername(updatedUser.username);
      }
      if (updatedUser.firstName !== undefined) {
        setOriginalFirstName(updatedUser.firstName || "");
      }
      if (updatedUser.lastName !== undefined) {
        setOriginalLastName(updatedUser.lastName || "");
      }

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
  }, [userId, username, originalUsername, usernameAvailable, firstName, originalFirstName, lastName, originalLastName, profilePicture, login]);

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
      if (error instanceof AxiosError) {
        toast.error(error.response?.data || "Şifre değiştirilemedi", { id: loadingToast });
      } else {
        toast.error("Şifre değiştirilemedi", { id: loadingToast });
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const initials = username.substring(0, 2).toUpperCase();

  const hasPrivacyChanges = privacyMode !== originalPrivacyMode ||
    (privacyMode === 'PRIVATE' && JSON.stringify(granularSettings) !== JSON.stringify(originalGranularSettings));

  const handleSavePrivacy = async () => {
    if (!userId) return;
    setIsSavingPrivacy(true);
    try {
      const data: { privacyMode: PrivacyMode; granularSettings?: Partial<GranularPrivacySettings> } = {
        privacyMode,
      };
      if (privacyMode === 'PRIVATE') {
        data.granularSettings = granularSettings;
      }
      await userService.updatePrivacy(userId, data);
      setOriginalPrivacyMode(privacyMode);
      setOriginalGranularSettings({ ...granularSettings });

      const labels: Record<PrivacyMode, string> = {
        HIDDEN: 'Profil gizli yapildi',
        PUBLIC: 'Profil herkese acik yapildi',
        PRIVATE: 'Ozel gizlilik ayarlari kaydedildi',
      };
      toast.success(labels[privacyMode]);
    } catch {
      toast.error('Gizlilik ayari guncellenemedi');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const updateGranularSetting = (key: keyof GranularPrivacySettings) => {
    setGranularSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleScheduleDeletion = useCallback(async () => {
    if (!userId) return;
    setIsDeletionLoading(true);
    try {
      const result = await userService.scheduleDeletion(userId);
      const scheduledAt = result.deletionScheduledAt;
      setDeletionScheduledAt(scheduledAt || null);
      setShowDeleteConfirm(false);
      if (scheduledAt) {
        const deleteDate = new Date(scheduledAt);
        deleteDate.setDate(deleteDate.getDate() + 30);
        toast.success(`Hesabınız ${deleteDate.toLocaleDateString('tr-TR')} tarihinde silinecek`);
      }
    } catch {
      toast.error("Hesap silme zamanlanamadı");
    } finally {
      setIsDeletionLoading(false);
    }
  }, [userId, setDeletionScheduledAt]);

  const handleCancelDeletion = useCallback(async () => {
    if (!userId) return;
    setIsDeletionLoading(true);
    try {
      await userService.cancelDeletion(userId);
      setDeletionScheduledAt(null);
      toast.success("Hesap silme işlemi iptal edildi");
    } catch {
      toast.error("Hesap silme iptali başarısız");
    } finally {
      setIsDeletionLoading(false);
    }
  }, [userId, setDeletionScheduledAt]);

  const menuItems = [
    { id: 'profile' as const, label: 'Profil', icon: User, description: 'Profil bilgilerinizi düzenleyin' },
    { id: 'privacy' as const, label: 'Gizlilik', icon: Globe, description: 'Profil gizlilik ayarlari' },
    { id: 'security' as const, label: 'Güvenlik', icon: Shield, description: 'Şifre ve güvenlik ayarları' },
    { id: 'account' as const, label: 'Hesap', icon: Trash2, description: 'Hesap silme işlemleri' },
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
                      placeholder="İsminizi girin"
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
                      placeholder="Soyisminizi girin"
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

              {/* Privacy Mode Selector - 3 cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[3], marginBottom: spacing[6] }}>
                {/* HIDDEN card */}
                {([
                  { mode: 'HIDDEN' as PrivacyMode, icon: EyeOff, label: 'Gizli', description: 'Profiliniz tamamen gizli. Sadece baglantilariniz gorebilir.' },
                  { mode: 'PUBLIC' as PrivacyMode, icon: Globe, label: 'Herkese Acik', description: 'Profiliniz tum kullanicilar tarafindan gorulebilir.' },
                  { mode: 'PRIVATE' as PrivacyMode, icon: Shield, label: 'Ozel', description: 'Hangi bilgilerin gorunur olacagini secin.' },
                ]).map(({ mode, icon: Icon, label, description }) => {
                  const isSelected = privacyMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setPrivacyMode(mode)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[4],
                        padding: spacing[5],
                        background: isSelected ? colors.brand.primaryLight : cssVars.bgHover,
                        border: `2px solid ${isSelected ? colors.brand.primary : "transparent"}`,
                        borderRadius: radius.lg,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = cssVars.border;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <div style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: radius.lg,
                        background: isSelected ? colors.brand.primary : cssVars.bgBody,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                      }}>
                        <Icon size={20} color={isSelected ? cssVars.textInverse : cssVars.textMuted} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: typography.fontSize.lg,
                          fontWeight: typography.fontWeight.semibold,
                          color: isSelected ? colors.brand.primary : cssVars.textMain,
                          marginBottom: spacing[0.5],
                        }}>
                          {label}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.base,
                          color: cssVars.textMuted,
                        }}>
                          {description}
                        </div>
                      </div>
                      {/* Radio indicator */}
                      <div style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: radius.full,
                        border: `2px solid ${isSelected ? colors.brand.primary : cssVars.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                      }}>
                        {isSelected && (
                          <div style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: radius.full,
                            background: colors.brand.primary,
                          }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Granular Settings (shown only when PRIVATE) */}
              {privacyMode === 'PRIVATE' && (
                <div style={{
                  background: cssVars.bgHover,
                  borderRadius: radius.lg,
                  padding: spacing[5],
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing[3],
                  marginBottom: spacing[6],
                }}>
                  <h3 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: cssVars.textMain,
                    margin: 0,
                    marginBottom: spacing[2],
                  }}>
                    Detayli Ayarlar
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.base,
                    color: cssVars.textMuted,
                    margin: 0,
                    marginBottom: spacing[2],
                  }}>
                    Profilinizde hangi bilgilerin gorunecegini secin
                  </p>

                  {([
                    { key: 'showProfilePicture' as keyof GranularPrivacySettings, label: 'Profil Resmi', description: 'Profil resminiz diger kullanicilara gosterilsin' },
                    { key: 'showConnectionCount' as keyof GranularPrivacySettings, label: 'Baglanti Sayisi', description: 'Baglanti sayiniz profilde gorunsun' },
                    { key: 'showOverallProgress' as keyof GranularPrivacySettings, label: 'Genel Ilerleme', description: 'Genel ilerleme yuzdesi ve cubugu gosterilsin' },
                    { key: 'showBoardStats' as keyof GranularPrivacySettings, label: 'Pano Istatistikleri', description: 'Toplam pano sayisi ve durum dagilimi gosterilsin' },
                    { key: 'showListStats' as keyof GranularPrivacySettings, label: 'Liste Istatistikleri', description: 'Toplam ve tamamlanan liste sayisi gosterilsin' },
                    { key: 'showTaskStats' as keyof GranularPrivacySettings, label: 'Gorev Istatistikleri', description: 'Toplam ve tamamlanan gorev sayisi gosterilsin' },
                    { key: 'showSubtaskStats' as keyof GranularPrivacySettings, label: 'Alt Gorev Istatistikleri', description: 'Toplam ve tamamlanan alt gorev sayisi gosterilsin' },
                    { key: 'showTeamBoardStats' as keyof GranularPrivacySettings, label: 'Ekip Panosu Istatistikleri', description: 'Ekip ve bireysel pano sayilari gosterilsin' },
                    { key: 'showTopCategories' as keyof GranularPrivacySettings, label: 'Populer Kategoriler', description: 'En cok kullanilan pano kategorileri gosterilsin' },
                  ]).map(({ key, label, description }) => {
                    const isOn = granularSettings[key];
                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: `${spacing[3]} ${spacing[4]}`,
                          background: cssVars.bgCard,
                          borderRadius: radius.md,
                          border: `1px solid ${cssVars.border}`,
                        }}
                      >
                        <div style={{ flex: 1, marginRight: spacing[4] }}>
                          <div style={{
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            color: cssVars.textMain,
                            marginBottom: spacing[0.5],
                          }}>
                            {label}
                          </div>
                          <div style={{
                            fontSize: typography.fontSize.sm,
                            color: cssVars.textMuted,
                          }}>
                            {description}
                          </div>
                        </div>
                        <button
                          onClick={() => updateGranularSetting(key)}
                          style={{
                            width: "44px",
                            height: "24px",
                            borderRadius: "12px",
                            border: "none",
                            background: isOn ? colors.brand.primary : cssVars.bgBody,
                            cursor: "pointer",
                            position: "relative",
                            transition: `background ${animation.duration.normal} ${animation.easing.smooth}`,
                            boxShadow: isOn ? "none" : `inset 0 0 0 1px ${cssVars.border}`,
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "white",
                              position: "absolute",
                              top: "3px",
                              left: isOn ? "23px" : "3px",
                              transition: `left ${animation.duration.normal} ${animation.easing.smooth}`,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Save Button */}
              <div style={{
                paddingTop: spacing[6],
                borderTop: `1px solid ${cssVars.border}`,
                display: "flex",
                justifyContent: "flex-end",
              }}>
                <button
                  onClick={handleSavePrivacy}
                  disabled={isSavingPrivacy || !hasPrivacyChanges}
                  className="btn btn-primary"
                  style={{
                    padding: `${spacing[3]} ${spacing[6]}`,
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    opacity: !hasPrivacyChanges ? 0.5 : 1,
                    cursor: !hasPrivacyChanges ? "not-allowed" : "pointer",
                    minWidth: "180px",
                  }}
                >
                  {isSavingPrivacy ? (
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
                  ) : hasPrivacyChanges ? (
                    <>
                      <Save size={16} />
                      Kaydet
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

          {/* Account Section */}
          {activeSection === 'account' && (
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
                  Hesap
                </h2>
                <p style={{
                  fontSize: typography.fontSize.base,
                  color: cssVars.textMuted,
                  margin: 0,
                }}>
                  Hesabınızı kalıcı olarak silebilirsiniz
                </p>
              </div>

              {deletionScheduledAt ? (
                // Silme zamanlanmis durumu
                <div>
                  <div style={{
                    padding: spacing[5],
                    background: `${colors.semantic.danger}10`,
                    borderRadius: radius.lg,
                    border: `1px solid ${colors.semantic.danger}30`,
                    marginBottom: spacing[6],
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[3],
                      marginBottom: spacing[3],
                    }}>
                      <AlertCircle size={20} color={colors.semantic.danger} />
                      <span style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.semantic.danger,
                      }}>
                        Hesabınız silinmek üzere zamanlandı
                      </span>
                    </div>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: cssVars.textMuted,
                      margin: 0,
                      marginBottom: spacing[4],
                      lineHeight: typography.lineHeight.normal,
                    }}>
                      {(() => {
                        const scheduledDate = new Date(deletionScheduledAt);
                        const deleteDate = new Date(scheduledDate);
                        deleteDate.setDate(deleteDate.getDate() + 30);
                        const now = new Date();
                        const diffTime = deleteDate.getTime() - now.getTime();
                        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        return `Hesabınız ${diffDays} gün içinde (${deleteDate.toLocaleDateString('tr-TR')}) kalıcı olarak silinecektir. Bu süre içinde iptal edebilirsiniz.`;
                      })()}
                    </p>
                    <button
                      onClick={handleCancelDeletion}
                      disabled={isDeletionLoading}
                      style={{
                        padding: `${spacing[2.5]} ${spacing[5]}`,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: cssVars.textInverse,
                        background: colors.semantic.danger,
                        border: "none",
                        borderRadius: radius.md,
                        cursor: isDeletionLoading ? "not-allowed" : "pointer",
                        opacity: isDeletionLoading ? 0.6 : 1,
                        transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeletionLoading) e.currentTarget.style.opacity = "0.9";
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeletionLoading) e.currentTarget.style.opacity = "1";
                      }}
                    >
                      {isDeletionLoading ? "İptal ediliyor..." : "Silme İşlemini İptal Et"}
                    </button>
                  </div>
                </div>
              ) : (
                // Silme zamanlanmamis durumu
                <div>
                  <div style={{
                    padding: spacing[5],
                    background: cssVars.bgHover,
                    borderRadius: radius.lg,
                    marginBottom: spacing[6],
                  }}>
                    <div style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: cssVars.textMain,
                      marginBottom: spacing[2],
                    }}>
                      Hesabı Sil
                    </div>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: cssVars.textMuted,
                      margin: 0,
                      marginBottom: spacing[4],
                      lineHeight: typography.lineHeight.normal,
                    }}>
                      Hesabınızı sildiğinizde 30 gün içinde geri alabilirsiniz. Bu süre sonunda tüm verileriniz kalıcı olarak silinecektir.
                    </p>

                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          padding: `${spacing[2.5]} ${spacing[5]}`,
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.semantic.danger,
                          background: `${colors.semantic.danger}10`,
                          border: `1px solid ${colors.semantic.danger}30`,
                          borderRadius: radius.md,
                          cursor: "pointer",
                          transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${colors.semantic.danger}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${colors.semantic.danger}10`;
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                          <Trash2 size={16} />
                          Hesabı Sil
                        </span>
                      </button>
                    ) : (
                      <div style={{
                        padding: spacing[4],
                        background: `${colors.semantic.danger}08`,
                        borderRadius: radius.md,
                        border: `1px solid ${colors.semantic.danger}20`,
                      }}>
                        <p style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.semantic.danger,
                          margin: 0,
                          marginBottom: spacing[3],
                        }}>
                          Emin misiniz? Hesabınız 30 gün sonra kalıcı olarak silinecektir.
                        </p>
                        <div style={{ display: "flex", gap: spacing[3] }}>
                          <button
                            onClick={handleScheduleDeletion}
                            disabled={isDeletionLoading}
                            style={{
                              padding: `${spacing[2]} ${spacing[4]}`,
                              fontSize: typography.fontSize.base,
                              fontWeight: typography.fontWeight.semibold,
                              color: cssVars.textInverse,
                              background: colors.semantic.danger,
                              border: "none",
                              borderRadius: radius.md,
                              cursor: isDeletionLoading ? "not-allowed" : "pointer",
                              opacity: isDeletionLoading ? 0.6 : 1,
                            }}
                          >
                            {isDeletionLoading ? "İşleniyor..." : "Evet, Hesabımı Sil"}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeletionLoading}
                            style={{
                              padding: `${spacing[2]} ${spacing[4]}`,
                              fontSize: typography.fontSize.base,
                              fontWeight: typography.fontWeight.medium,
                              color: cssVars.textMuted,
                              background: "transparent",
                              border: `1px solid ${cssVars.border}`,
                              borderRadius: radius.md,
                              cursor: "pointer",
                            }}
                          >
                            Vazgeç
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
