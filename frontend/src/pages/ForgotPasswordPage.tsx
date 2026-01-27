import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { isValidEmail, getPasswordStrength } from "../utils/validation";
import toast from "react-hot-toast";
import { typography, spacing, radius, colors, cssVars } from '../styles/tokens';

type Step = "email" | "code" | "password";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Kod inputlarina focus
  useEffect(() => {
    if (step === "code" && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [step]);

  // Email gonder
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error("Geçerli bir e-posta adresi giriniz");
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success("Doğrulama kodu e-posta adresinize gönderildi");
      setStep("code");
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Kod inputu degisimi
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Sadece rakam

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Sadece son karakter
    setCode(newCode);

    // Sonraki inputa gec
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace ile onceki inputa don
  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Kodu dogrula
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("6 haneli kodu eksiksiz giriniz");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyCode(email, fullCode);
      if (response.data.valid) {
        toast.success("Kod doğrulandı");
        setStep("password");
      } else {
        toast.error("Geçersiz veya süresi dolmuş kod");
      }
    } catch {
      toast.error("Geçersiz veya süresi dolmuş kod");
    } finally {
      setIsLoading(false);
    }
  };

  // Sifreyi sifirla
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    const strength = getPasswordStrength(newPassword);
    if (strength.score < 3) {
      toast.error("Daha güçlü bir şifre seçin");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, code.join(""), newPassword);
      toast.success("Şifreniz başarıyla güncellendi!");
      navigate("/login");
    } catch {
      toast.error("Şifre güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

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
          background: `linear-gradient(135deg, ${colors.brand.primaryLight} 0%, rgba(118, 75, 162, 0.1) 100%)`,
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
        <p
          style={{
            fontSize: typography.fontSize.xl,
            color: colors.dark.text.secondary,
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          Şifrenizi sıfırlayın ve hesabınıza erişmeye devam edin.
        </p>
      </div>

      {/* Sag Panel - Form */}
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
          {/* Adim Gostergesi */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: spacing[3],
              marginBottom: spacing[8],
            }}
          >
            {["email", "code", "password"].map((s) => (
              <div
                key={s}
                style={{
                  width: spacing[10],
                  height: spacing[1],
                  borderRadius: radius.sm,
                  background:
                    (s === "email" && step !== "email") ||
                    (s === "code" && step === "password") ||
                    s === step
                      ? `linear-gradient(135deg, ${colors.brand.primary} 0%, #764ba2 100%)`
                      : cssVars.borderStrong,
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>

          <h2
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: cssVars.textMain,
              marginBottom: spacing[2],
              textAlign: "center",
            }}
          >
            {step === "email" && "Şifremi Unuttum"}
            {step === "code" && "Kodu Doğrulayın"}
            {step === "password" && "Yeni Şifre"}
          </h2>

          <p
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.dark.text.tertiary,
              marginBottom: spacing[8],
              textAlign: "center",
            }}
          >
            {step === "email" && "E-posta adresinizi girin, size doğrulama kodu gönderelim."}
            {step === "code" && `${email} adresine gönderilen 6 haneli kodu girin.`}
            {step === "password" && "Hesabınız için yeni bir şifre belirleyin."}
          </p>

          {/* Email Adimi */}
          {step === "email" && (
            <form onSubmit={handleSendCode} aria-label="E-posta doğrulama formu" style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
              <div>
                <label
                  htmlFor="forgot-email"
                  style={{
                    display: "block",
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.dark.text.secondary,
                    marginBottom: spacing[2],
                  }}
                >
                  E-posta Adresi
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  aria-required="true"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
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
                />
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
                }}
              >
                {isLoading ? "Gönderiliyor..." : "Kod Gönder"}
              </button>
            </form>
          )}

          {/* Kod Dogrulama Adimi */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} aria-label="Kod doğrulama formu" style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
              <div role="group" aria-label="6 haneli doğrulama kodu" style={{ display: "flex", gap: spacing[2], justifyContent: "center" }}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Doğrulama kodu ${index + 1}. hane`}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    style={{
                      width: spacing[12],
                      height: spacing[14],
                      textAlign: "center",
                      fontSize: typography.fontSize["4xl"],
                      fontWeight: typography.fontWeight.semibold,
                      borderRadius: radius.md,
                      border: `1px solid ${cssVars.border}`,
                      background: colors.dark.bg.hover,
                      color: cssVars.textMain,
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
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
                }}
              >
                {isLoading ? "Doğrulanıyor..." : "Doğrula"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.dark.text.tertiary,
                  fontSize: typography.fontSize.lg,
                  cursor: "pointer",
                }}
              >
                Farklı e-posta adresi kullan
              </button>
            </form>
          )}

          {/* Yeni Sifre Adimi */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} aria-label="Yeni şifre belirleme formu" style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
              <div>
                <label
                  htmlFor="forgot-new-password"
                  style={{
                    display: "block",
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.dark.text.secondary,
                    marginBottom: spacing[2],
                  }}
                >
                  Yeni Şifre
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="forgot-new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-required="true"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 8 karakter"
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
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {newPassword && (
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

              <div>
                <label
                  htmlFor="forgot-confirm-password"
                  style={{
                    display: "block",
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.dark.text.secondary,
                    marginBottom: spacing[2],
                  }}
                >
                  Şifre Tekrar
                </label>
                <input
                  id="forgot-confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-required="true"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
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
                  }}
                />
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
                }}
              >
                {isLoading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
              </button>
            </form>
          )}

          {/* Giris Yap Linki */}
          <p
            style={{
              marginTop: spacing[6],
              textAlign: "center",
              fontSize: typography.fontSize.lg,
              color: colors.dark.text.tertiary,
            }}
          >
            Şifrenizi hatırladınız mı?{" "}
            <Link
              to="/login"
              style={{
                color: colors.brand.primary,
                cursor: "pointer",
                fontWeight: typography.fontWeight.semibold,
                textDecoration: "none",
              }}
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
