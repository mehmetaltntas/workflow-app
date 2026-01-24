import { useState } from "react";
import { authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { isValidEmail, getPasswordStrength } from "../utils/validation";
import { typography, spacing, radius, shadows, colors, cssVars } from '../styles/tokens';

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(password);

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

      // Token ve bilgileri kaydet
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", response.data.id);
      localStorage.setItem("username", response.data.username);

      toast.success("Kayıt başarılı!");
      navigate("/home");
    } catch {
      toast.error("Kayıt başarısız! Kullanıcı adı veya e-posta alınmış olabilir.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await authService.googleAuth(idToken);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", response.data.id);
      localStorage.setItem("username", response.data.username);

      toast.success("Google ile kayıt başarılı!");
      navigate("/home");
    } catch {
      toast.error("Google ile kayıt başarısız oldu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    toast.error(error);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: `linear-gradient(135deg, ${cssVars.bgBody} 0%, #16213e 50%, #0f3460 100%)`,
      }}
    >
      {/* Sol Panel - Branding */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: spacing[10],
          background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
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
              background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`,
              borderRadius: radius["2xl"],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing[6],
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill={cssVars.textInverse}>
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: typography.fontSize["5xl"],
              fontWeight: typography.fontWeight.extrabold,
              color: cssVars.textMain,
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
                background: `rgba(102, 126, 234, ${0.1 + i * 0.1})`,
                border: `1px solid ${cssVars.border}`,
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
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: colors.dark.glass.bg,
            backdropFilter: "blur(20px)",
            borderRadius: radius["2xl"],
            padding: spacing[10],
            border: `1px solid ${cssVars.border}`,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
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

          {/* Google Sign-In */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
          />

          {/* Ayirici */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[4],
              margin: `${spacing[6]} 0`,
            }}
          >
            <div style={{ flex: 1, height: "1px", background: cssVars.border }} />
            <span style={{ fontSize: typography.fontSize.base, color: colors.dark.text.subtle }}>veya</span>
            <div style={{ flex: 1, height: "1px", background: cssVars.border }} />
          </div>

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
                placeholder="örn: ali_yilmaz"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: `${spacing[3.5]} ${spacing[4]}`,
                  borderRadius: radius.md,
                  border: `1px solid ${cssVars.border}`,
                  background: colors.dark.bg.hover,
                  color: cssVars.textMain,
                  fontSize: typography.fontSize.xl,
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                  e.currentTarget.style.boxShadow = shadows.focusPrimary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cssVars.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
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
                  width: "100%",
                  boxSizing: "border-box",
                  padding: `${spacing[3.5]} ${spacing[4]}`,
                  borderRadius: radius.md,
                  border: `1px solid ${emailError ? colors.semantic.danger : cssVars.border}`,
                  background: colors.dark.bg.hover,
                  color: cssVars.textMain,
                  fontSize: typography.fontSize.xl,
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }
                }}
                onBlur={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = cssVars.border;
                  }
                  e.currentTarget.style.boxShadow = "none";
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
                    width: "100%",
                    boxSizing: "border-box",
                    padding: `${spacing[3.5]} ${spacing[12]} ${spacing[3.5]} ${spacing[4]}`,
                    borderRadius: radius.md,
                    border: `1px solid ${cssVars.border}`,
                    background: colors.dark.bg.hover,
                    color: cssVars.textMain,
                    fontSize: typography.fontSize.xl,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.boxShadow = shadows.focusPrimary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = cssVars.border;
                    e.currentTarget.style.boxShadow = "none";
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
                      background: cssVars.border,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        height: "100%",
                        background: passwordStrength.color,
                        transition: "all 0.3s",
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
                background: `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`,
                color: cssVars.textMain,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[2],
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
