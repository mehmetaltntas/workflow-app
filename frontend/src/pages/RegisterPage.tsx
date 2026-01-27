import { useState, useEffect, useRef, useCallback } from "react";
import { authService } from "../services/api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";

import { isValidEmail, getPasswordStrength, getUsernameError } from "../utils/validation";
import { useAuthStore } from "../stores/authStore";
import "./LoginPage.css";
import "./RegisterPage.css";

type Step = "form" | "code";

const RegisterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
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

  const [step, setStep] = useState<Step>("form");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (step === "code" && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [step]);

  const nameRegex = /^[a-zA-ZçÇğĞıİöÖşŞüÜâÂêÊîÎôÔûÛ\s]+$/;

  const getNameError = (value: string, label: string): string => {
    if (!value.trim()) return `${label} boş olamaz`;
    if (value.length > 50) return `${label} en fazla 50 karakter olabilir`;
    if (!nameRegex.test(value)) return `${label} sadece harf içerebilir`;
    return "";
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (value) {
      setFirstNameError(getNameError(value, "Ad"));
    } else {
      setFirstNameError("");
    }
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    if (value) {
      setLastNameError(getNameError(value, "Soyad"));
    } else {
      setLastNameError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !isValidEmail(value)) {
      setEmailError("Geçerli bir e-posta adresi giriniz");
    } else {
      setEmailError("");
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      toast.error("Tüm alanlar gereklidir");
      return;
    }

    const fnError = getNameError(firstName, "Ad");
    if (fnError) {
      toast.error(fnError);
      return;
    }

    const lnError = getNameError(lastName, "Soyad");
    if (lnError) {
      toast.error(lnError);
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
      await authService.sendRegistrationCode({ username, email });
      toast.success("Doğrulama kodu e-posta adresinize gönderildi");
      setStep("code");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("6 haneli kodu eksiksiz giriniz");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({
        username,
        email,
        password,
        code: fullCode,
        firstName,
        lastName,
      });

      login({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        id: response.data.id,
        username: response.data.username,
      });

      toast.success("Kayıt başarılı!");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Kayıt başarısız! Kod geçersiz veya süresi dolmuş olabilir.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await authService.sendRegistrationCode({ username, email });
      setCode(["", "", "", "", "", ""]);
      toast.success("Yeni doğrulama kodu gönderildi");
    } catch {
      toast.error("Kod gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Gradient Effects */}
      <div className="login-page__bg-gradient--left" />
      <div className="login-page__bg-gradient--right" />

      {/* Sol Panel - Branding */}
      <div className="login-page__branding">
        <Link to="/" aria-label="WorkFlow ana sayfaya git" className="login-page__brand-link">
          <div className="login-page__logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#1a1b1e" aria-hidden="true">
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <h1 className="login-page__title">WorkFlow</h1>
        </Link>
        <p className="login-page__subtitle">
          {step === "form"
            ? "Ücretsiz hesap oluşturun ve projelerinizi yönetmeye hemen başlayın."
            : `${email} adresine gönderilen doğrulama kodunu girin.`}
        </p>

        {/* Dekoratif Elementler */}
        <div className="login-page__decorative">
          {[1, 2, 3].map((i) => (
            <div key={i} className="login-page__decorative-box" />
          ))}
        </div>
      </div>

      {/* Sag Panel - Register Form */}
      <div className="login-page__form-panel">
        <div className="login-page__form-card">
          {/* Card Top Glow */}
          <div className="login-page__card-glow" />

          {/* Step Indicator */}
          <div className="register-page__step-indicator">
            {["form", "code"].map((s) => (
              <div
                key={s}
                className={`register-page__step-bar ${
                  s === step || (s === "form" && step === "code")
                    ? "register-page__step-bar--active"
                    : ""
                }`}
              />
            ))}
          </div>

          <h2 className="login-page__form-title">
            {step === "form" ? "Hesap Oluştur" : "Kodu Doğrulayın"}
          </h2>
          <p className="login-page__form-subtitle">
            {step === "form"
              ? "Ücretsiz kayıt olun"
              : `${email} adresine gönderilen 6 haneli kodu girin.`}
          </p>

          {/* Step: Form */}
          {step === "form" && (
            <form onSubmit={handleSendCode} aria-label="Kayıt formu" className="login-page__form">
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="register-firstname" className="login-page__label">
                    Ad
                  </label>
                  <input
                    id="register-firstname"
                    type="text"
                    placeholder="Ad"
                    autoComplete="given-name"
                    aria-required="true"
                    aria-describedby={firstNameError ? "register-firstname-error" : undefined}
                    aria-invalid={!!firstNameError}
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    maxLength={50}
                    className={`login-page__input ${firstNameError ? "register-page__input--error" : ""}`}
                  />
                  {firstNameError && (
                    <p id="register-firstname-error" role="alert" className="register-page__email-error">
                      {firstNameError}
                    </p>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="register-lastname" className="login-page__label">
                    Soyad
                  </label>
                  <input
                    id="register-lastname"
                    type="text"
                    placeholder="Soyad"
                    autoComplete="family-name"
                    aria-required="true"
                    aria-describedby={lastNameError ? "register-lastname-error" : undefined}
                    aria-invalid={!!lastNameError}
                    value={lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    maxLength={50}
                    className={`login-page__input ${lastNameError ? "register-page__input--error" : ""}`}
                  />
                  {lastNameError && (
                    <p id="register-lastname-error" role="alert" className="register-page__email-error">
                      {lastNameError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="register-username" className="login-page__label">
                  Kullanıcı Adı
                </label>
                <input
                  id="register-username"
                  type="text"
                  placeholder="Kullanıcı Adı"
                  autoComplete="username"
                  aria-required="true"
                  aria-describedby={usernameError ? "register-username-error" : username ? undefined : "register-username-hint"}
                  aria-invalid={!!usernameError}
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  maxLength={30}
                  className={`login-page__input ${
                    usernameError ? "register-page__input--error" : ""
                  } ${
                    usernameAvailable === true ? "register-page__input--success" : ""
                  }`}
                />
                {username && (
                  <div className="register-page__field-feedback">
                    {checkingUsername && (
                      <span className="register-page__field-feedback--checking" aria-live="polite">Kontrol ediliyor...</span>
                    )}
                    {usernameError && (
                      <span id="register-username-error" role="alert" className="register-page__field-feedback--error">{usernameError}</span>
                    )}
                    {!usernameError && !checkingUsername && usernameAvailable === true && (
                      <span className="register-page__field-feedback--success" aria-live="polite">Kullanıcı adı müsait</span>
                    )}
                  </div>
                )}
                {!username && (
                  <p id="register-username-hint" className="register-page__field-hint">
                    3-30 karakter. Harf, rakam, nokta (.) ve alt tire (_) kullanılabilir.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="register-email" className="login-page__label">
                  E-posta
                </label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="ornek@eposta.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-describedby={emailError ? "register-email-error" : undefined}
                  aria-invalid={!!emailError}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`login-page__input ${emailError ? "register-page__input--error" : ""}`}
                />
                {emailError && (
                  <p id="register-email-error" role="alert" className="register-page__email-error">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="register-password" className="login-page__label">
                  Şifre
                </label>
                <div className="login-page__password-wrapper">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="En az 8 karakter"
                    autoComplete="new-password"
                    aria-required="true"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-page__input login-page__input--password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="login-page__password-toggle"
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

                {/* Password Strength Meter */}
                {password && (
                  <div className="register-page__strength-meter">
                    <div className="register-page__strength-bar-bg">
                      <div
                        className="register-page__strength-bar-fill"
                        style={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          background: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span className="register-page__strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="login-page__submit-btn"
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
                      className="login-page__spinner"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Gönderiliyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </button>
            </form>
          )}

          {/* Step: Code Verification */}
          {step === "code" && (
            <form onSubmit={handleVerifyAndRegister} aria-label="Doğrulama kodu formu" className="login-page__form">
              <div role="group" aria-label="6 haneli doğrulama kodu" className="register-page__code-container">
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
                    className="register-page__code-input"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="login-page__submit-btn"
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
                      className="login-page__spinner"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Doğrulanıyor...
                  </>
                ) : (
                  "Doğrula ve Kayıt Ol"
                )}
              </button>

              <div className="register-page__code-actions">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="register-page__resend-btn"
                >
                  Tekrar Gönder
                </button>
                <span className="register-page__code-separator">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setCode(["", "", "", "", "", ""]);
                  }}
                  className="register-page__back-btn"
                >
                  Geri Dön
                </button>
              </div>
            </form>
          )}

          {/* Giris Yap Link */}
          <p className="register-page__login-text">
            Zaten hesabınız var mı?{" "}
            <Link to="/login" className="register-page__login-link">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
