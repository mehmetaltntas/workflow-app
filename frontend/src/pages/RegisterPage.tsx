import { useState } from "react";
import { authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { isValidEmail, getPasswordStrength } from "../utils/validation";

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
      setEmailError("Gecerli bir email adresi giriniz");
    } else {
      setEmailError("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Tum alanlar gereklidir");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Gecerli bir email adresi giriniz");
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error("Daha guclu bir sifre secin");
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

      toast.success("Kayit Basarili!");
      navigate("/home");
    } catch {
      toast.error("Kayit basarisiz! Kullanici adi veya email alinmis olabilir.");
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

      toast.success("Google ile kayit basarili!");
      navigate("/home");
    } catch {
      toast.error("Google ile kayit basarisiz oldu");
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
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
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
        </div>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: "300px",
            lineHeight: "1.6",
          }}
        >
          Ucretsiz hesap olusturun ve projelerinizi yonetmeye hemen baslayin.
        </p>

        {/* Dekoratif Elementler */}
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            gap: "20px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                background: `rgba(102, 126, 234, ${0.1 + i * 0.1})`,
                border: "1px solid rgba(255,255,255,0.1)",
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
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#fff",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Hesap Olustur
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            Ucretsiz kayit olun
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
              gap: "16px",
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>veya</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleRegister}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
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
                Kullanici Adi
              </label>
              <input
                type="text"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
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
                Email
              </label>
              <input
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: `1px solid ${emailError ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }
                }}
                onBlur={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {emailError && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                  {emailError}
                </p>
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
                Sifre
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
                    padding: "14px 48px 14px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "15px",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
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

              {/* Sifre Guc Gostergesi */}
              {password && (
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
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
                "Kayit Ol"
              )}
            </button>
          </form>

          {/* Giris Yap Link */}
          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Zaten hesabiniz var mi?{" "}
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
