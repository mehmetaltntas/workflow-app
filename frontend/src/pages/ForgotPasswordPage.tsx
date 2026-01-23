import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import { isValidEmail, getPasswordStrength } from "../utils/validation";
import toast from "react-hot-toast";

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
      toast.error("Gecerli bir email adresi giriniz");
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success("Dogrulama kodu email adresinize gonderildi");
      setStep("code");
    } catch {
      toast.error("Bir hata olustu. Lutfen tekrar deneyin.");
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
        toast.success("Kod dogrulandi");
        setStep("password");
      } else {
        toast.error("Gecersiz veya suresi dolmus kod");
      }
    } catch {
      toast.error("Gecersiz veya suresi dolmus kod");
    } finally {
      setIsLoading(false);
    }
  };

  // Sifreyi sifirla
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Sifreler eslesmiyor");
      return;
    }

    const strength = getPasswordStrength(newPassword);
    if (strength.score < 3) {
      toast.error("Daha guclu bir sifre secin");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, code.join(""), newPassword);
      toast.success("Sifreniz basariyla guncellendi!");
      navigate("/login");
    } catch {
      toast.error("Sifre guncellenirken bir hata olustu");
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
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
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
          padding: "40px",
          background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "800",
            color: "#fff",
            marginBottom: "16px",
          }}
        >
          WorkFlow
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          Sifrenizi sifirlayin ve hesabiniza erismeye devam edin.
        </p>
      </div>

      {/* Sag Panel - Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "40px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Adim Gostergesi */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "32px",
            }}
          >
            {["email", "code", "password"].map((s) => (
              <div
                key={s}
                style={{
                  width: "40px",
                  height: "4px",
                  borderRadius: "2px",
                  background:
                    (s === "email" && step !== "email") ||
                    (s === "code" && step === "password") ||
                    s === step
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(255,255,255,0.2)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#fff",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            {step === "email" && "Sifremi Unuttum"}
            {step === "code" && "Kodu Dogrulayin"}
            {step === "password" && "Yeni Sifre"}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            {step === "email" && "Email adresinizi girin, size dogrulama kodu gonderelim."}
            {step === "code" && `${email} adresine gonderilen 6 haneli kodu girin.`}
            {step === "password" && "Hesabiniz icin yeni bir sifre belirleyin."}
          </p>

          {/* Email Adimi */}
          {step === "email" && (
            <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "8px",
                  }}
                >
                  Email Adresi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "15px",
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
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                {isLoading ? "Gonderiliyor..." : "Kod Gonder"}
              </button>
            </form>
          )}

          {/* Kod Dogrulama Adimi */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    style={{
                      width: "48px",
                      height: "56px",
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: "600",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
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
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                {isLoading ? "Dogrulaniyor..." : "Dogrula"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Farkli email adresi kullan
              </button>
            </form>
          )}

          {/* Yeni Sifre Adimi */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "8px",
                  }}
                >
                  Yeni Sifre
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 8 karakter"
                    style={{
                      width: "100%",
                      padding: "14px 48px 14px 16px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      padding: "4px",
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
                {newPassword && (
                  <div style={{ marginTop: "8px" }}>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.1)",
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
                    <span style={{ fontSize: "12px", color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "8px",
                  }}
                >
                  Sifre Tekrar
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Sifrenizi tekrar girin"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "15px",
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                {isLoading ? "Kaydediliyor..." : "Sifreyi Guncelle"}
              </button>
            </form>
          )}

          {/* Giris Yap Linki */}
          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Sifrenizi hatirladin mi?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{
                color: "#667eea",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Giris Yap
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
