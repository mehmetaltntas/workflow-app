import { useState } from "react";
import { authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import GoogleSignInButton from "../components/GoogleSignInButton";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Kullanici adi ve sifre gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });

      // Token ve bilgileri kaydet
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", response.data.id);
      localStorage.setItem("username", response.data.username);

      toast.success("Giris Basarili!");
      navigate("/home");
    } catch {
      toast.error("Kullanici adi veya sifre hatali!");
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

      toast.success("Google ile giris basarili!");
      navigate("/home");
    } catch {
      toast.error("Google ile giris basarisiz oldu");
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
          Gorevlerinizi kolayca yonetin, ekibinizle isbirligi yapin ve
          projelerinizi zamaninda tamamlayin.
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

      {/* Sag Panel - Login Form */}
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
            Hos Geldiniz
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            Hesabiniza giris yapin
          </p>

          {/* Google Sign-In */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
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
            onSubmit={handleLogin}
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
                Sifre
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
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
            </div>

            {/* Sifremi Unuttum Link */}
            <div style={{ textAlign: "right" }}>
              <span
                onClick={() => navigate("/forgot-password")}
                style={{
                  fontSize: "13px",
                  color: "#667eea",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Sifremi Unuttum
              </span>
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
                  Giris Yapiliyor...
                </>
              ) : (
                "Giris Yap"
              )}
            </button>
          </form>

          {/* Kayit Ol Link */}
          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Hesabiniz yok mu?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{
                color: "#667eea",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Kayit Ol
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

export default LoginPage;
