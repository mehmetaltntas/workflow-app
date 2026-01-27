import { useState } from "react";
import { authService } from "../services/api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuthStore } from "../stores/authStore";
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = (location.state as { from?: string })?.from || "/home";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Kullanıcı adı ve şifre gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });

      login({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        id: response.data.id,
        username: response.data.username,
      });

      toast.success("Giriş başarılı!");
      navigate(from, { replace: true });
    } catch {
      toast.error("Kullanıcı adı veya şifre hatalı!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await authService.googleAuth(idToken);

      login({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        id: response.data.id,
        username: response.data.username,
      });

      toast.success("Google ile giriş başarılı!");
      navigate(from, { replace: true });
    } catch {
      toast.error("Google ile giriş başarısız oldu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    toast.error(error);
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
          Görevlerinizi kolayca yönetin, ekibinizle iş birliği yapın ve
          projelerinizi zamanında tamamlayın.
        </p>

        {/* Dekoratif Elementler */}
        <div className="login-page__decorative">
          {[1, 2, 3].map((i) => (
            <div key={i} className="login-page__decorative-box" />
          ))}
        </div>
      </div>

      {/* Sag Panel - Login Form */}
      <div className="login-page__form-panel">
        <div className="login-page__form-card">
          {/* Card Top Glow */}
          <div className="login-page__card-glow" />

          <h2 className="login-page__form-title">Hoş Geldiniz</h2>
          <p className="login-page__form-subtitle">Hesabınıza giriş yapın</p>

          {/* Google Sign-In */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
          />

          {/* Ayirici */}
          <div className="login-page__divider">
            <div className="login-page__divider-line" />
            <span className="login-page__divider-text">veya</span>
            <div className="login-page__divider-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} aria-label="Giriş formu" className="login-page__form">
            <div>
              <label htmlFor="login-username" className="login-page__label">
                Kullanıcı Adı
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="Kullanıcı Adı"
                autoComplete="username"
                aria-required="true"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-page__input"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="login-page__label">
                Şifre
              </label>
              <div className="login-page__password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="current-password"
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
            </div>

            {/* Sifremi Unuttum Link */}
            <div className="login-page__forgot-password-wrapper">
              <Link to="/forgot-password" className="login-page__forgot-password">
                Şifremi Unuttum
              </Link>
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
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          {/* Kayit Ol Link */}
          <p className="login-page__register-text">
            Hesabınız yok mu?{" "}
            <Link to="/register" className="login-page__register-link">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
