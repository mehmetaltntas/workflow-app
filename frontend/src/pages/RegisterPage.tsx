import { useState, useEffect, useRef, useCallback } from "react";
import { authService } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import { isValidEmail, getPasswordStrength, getUsernameError } from "../utils/validation";
import { typography, spacing, radius, shadows, colors, animation } from '../styles/tokens';
import { useAuthStore } from "../stores/authStore";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = (location.state as { from?: string })?.from || "/home";

  const passwordStrength = getPasswordStrength(password);

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

    if (!value) return;

    const error = getUsernameError(value);
    if (error) {
      setUsernameError(error);
      return;
    }

    // Debounce: kullanıcı yazmayı bıraktıktan sonra kontrol et
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !isValidEmail(value)) {
      setEmailError("Geçerli bir e-posta adresi giriniz");
    } else {
      setEmailError("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Tüm alanlar gereklidir");
      return;
    }

    const uError = getUsernameError(username);
    if (uError) {
      toast.error(uError);
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Bu kullanıcı adı zaten alınmış");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Geçerli bir e-posta adresi giriniz");
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error("Daha güçlü bir şifre seçin");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({
        username,
        email,
        password,
      });

      login({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        id: response.data.id,
        username: response.data.username,
      });

      toast.success("Kayıt başarılı!");
      navigate(from, { replace: true });
    } catch {
      toast.error("Kayıt başarısız! Kullanıcı adı veya e-posta alınmış olabilir.");
    } finally {
      setIsLoading(false);
    }
  };


  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: `${spacing[3.5]} ${spacing[4]}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.dark.border.default}`,
    background: colors.dark.bg.secondary,
    color: colors.dark.text.primary,
    fontSize: typography.fontSize.xl,
    outline: "none",
    transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: colors.dark.bg.body,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Gradient Effects */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "-20%",
          width: "60%",
          height: "80%",
          background: `radial-gradient(ellipse, ${colors.brand.primary}12 0%, transparent 60%)`,
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "70%",
          background: `radial-gradient(ellipse, rgba(139, 92, 246, 0.1) 0%, transparent 60%)`,
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* Sol Panel - Branding */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: spacing[10],
          position: "relative",
        }}
      >
        <div
          onClick={() => navigate("/")}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: spacing[20],
              height: spacing[20],
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #8b5cf6 100%)`,
              borderRadius: radius["2xl"],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing[6],
              transition: `all ${animation.duration.slow} ${animation.easing.smooth}`,
              boxShadow: `0 8px 32px ${colors.brand.primary}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = `0 12px 40px ${colors.brand.primary}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 8px 32px ${colors.brand.primary}40`;
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill={colors.dark.text.inverse}>
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: typography.fontSize["5xl"],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.dark.text.primary,
              marginBottom: spacing[4],
            }}
          >
            WorkFlow
          </h1>
        </div>
        <p
          style={{
            fontSize: typography.fontSize.xl,
            color: colors.dark.text.secondary,
            textAlign: "center",
            maxWidth: "300px",
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          Ücretsiz hesap oluşturun ve projelerinizi yönetmeye hemen başlayın.
        </p>

        {/* Dekoratif Elementler */}
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            gap: spacing[5],
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: radius.lg,
                background: `linear-gradient(135deg, ${colors.brand.primary}${10 + i * 8} 0%, rgba(139, 92, 246, ${0.08 + i * 0.06}) 100%)`,
                border: `1px solid ${colors.dark.border.default}`,
                transition: `all ${animation.duration.slow} ${animation.easing.smooth}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Sag Panel - Register Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing[10],
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: colors.dark.bg.elevated,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: radius["2xl"],
            padding: spacing[10],
            border: `1px solid ${colors.dark.border.default}`,
            boxShadow: shadows.modal,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Card Top Glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${colors.brand.primary}50, transparent)`,
            }}
          />

          <h2
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.dark.text.primary,
              marginBottom: spacing[2],
              textAlign: "center",
            }}
          >
            Hesap Oluştur
          </h2>
          <p
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.dark.text.tertiary,
              marginBottom: spacing[8],
              textAlign: "center",
            }}
          >
            Ücretsiz kayıt olun
          </p>

          {/* Form */}
          <form
            onSubmit={handleRegister}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[5],
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.dark.text.secondary,
                  marginBottom: spacing[2],
                }}
              >
                Kullanıcı Adı
              </label>
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={30}
                style={{
                  ...inputStyle,
                  borderColor: usernameError
                    ? colors.semantic.danger
                    : usernameAvailable === true
                    ? colors.semantic.success
                    : colors.dark.border.default,
                }}
                onFocus={(e) => {
                  if (!usernameError) {
                    e.currentTarget.style.borderColor = usernameAvailable === true ? colors.semantic.success : colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }
                  e.currentTarget.style.background = colors.dark.bg.input;
                }}
                onBlur={(e) => {
                  if (!usernameError && usernameAvailable !== true) {
                    e.currentTarget.style.borderColor = colors.dark.border.default;
                  }
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = colors.dark.bg.secondary;
                }}
              />
              {username && (
                <div style={{ marginTop: spacing[1], fontSize: typography.fontSize.md }}>
                  {checkingUsername && (
                    <span style={{ color: colors.dark.text.tertiary }}>Kontrol ediliyor...</span>
                  )}
                  {usernameError && (
                    <span style={{ color: colors.semantic.danger }}>{usernameError}</span>
                  )}
                  {!usernameError && !checkingUsername && usernameAvailable === true && (
                    <span style={{ color: colors.semantic.success }}>Kullanıcı adı müsait</span>
                  )}
                </div>
              )}
              {!username && (
                <p style={{ fontSize: typography.fontSize.sm, color: colors.dark.text.tertiary, marginTop: spacing[1] }}>
                  3-30 karakter. Harf, rakam, nokta (.) ve alt tire (_) kullanılabilir.
                </p>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.dark.text.secondary,
                  marginBottom: spacing[2],
                }}
              >
                E-posta
              </label>
              <input
                type="email"
                placeholder="ornek@eposta.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: emailError ? colors.semantic.danger : colors.dark.border.default,
                }}
                onFocus={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }
                  e.currentTarget.style.background = colors.dark.bg.input;
                }}
                onBlur={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = colors.dark.border.default;
                  }
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = colors.dark.bg.secondary;
                }}
              />
              {emailError && (
                <p style={{ fontSize: typography.fontSize.md, color: colors.semantic.danger, marginTop: spacing[1] }}>
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.dark.text.secondary,
                  marginBottom: spacing[2],
                }}
              >
                Şifre
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingRight: spacing[12],
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                    e.currentTarget.style.background = colors.dark.bg.input;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.dark.border.default;
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = colors.dark.bg.secondary;
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: spacing[3],
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: colors.dark.text.tertiary,
                    cursor: "pointer",
                    padding: spacing[1],
                    transition: `color ${animation.duration.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.dark.text.secondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.dark.text.tertiary;
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Sifre Guc Gostergesi */}
              {password && (
                <div style={{ marginTop: spacing[2] }}>
                  <div
                    style={{
                      height: spacing[1],
                      borderRadius: radius.sm,
                      background: colors.dark.border.default,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        height: "100%",
                        background: passwordStrength.color,
                        transition: `all ${animation.duration.slow} ${animation.easing.smooth}`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: typography.fontSize.md, color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: spacing[3.5],
                borderRadius: radius.md,
                border: "none",
                background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #8b5cf6 100%)`,
                color: colors.dark.text.primary,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[2],
                boxShadow: `0 4px 16px ${colors.brand.primary}30`,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${colors.brand.primary}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.brand.primary}30`;
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                "Kayıt Ol"
              )}
            </button>
          </form>

          {/* Giris Yap Link */}
          <p
            style={{
              marginTop: spacing[6],
              textAlign: "center",
              fontSize: typography.fontSize.lg,
              color: colors.dark.text.tertiary,
            }}
          >
            Zaten hesabınız var mı?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{
                color: colors.brand.primary,
                cursor: "pointer",
                fontWeight: typography.fontWeight.semibold,
                transition: `opacity ${animation.duration.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Giriş Yap
            </span>
          </p>
        </div>
      </div>

      {/* Spinner Animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default RegisterPage;
